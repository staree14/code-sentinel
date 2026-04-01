"""
main.py
Combined backend for CodeSentinel. (v3.0.0 - Product Edition)
Flows: 
1. POST /api/signup - User registration (S3-based)
2. POST /api/login  - User authentication
3. POST /process    - Intelligent Nova Middleware + Logging
4. POST /api/scan   - Security Agent + Logging
5. GET /api/analytics - Aggregate daily stats
"""

import os
import time
import logging
from datetime import datetime
from contextlib import asynccontextmanager
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

# Load .env from project root (parent of backend/)
_env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(_env_path)

from models.schemas import (
    BusinessImpact,
    PerformanceMetrics,
    ProcessResponse,
    PromptRequest,
    RoutingDecision,
    SecurityScan,
)
from services.bedrock import invoke_nova
from services.classifier import analyze_prompt
from services.router import get_route
from utils.loggers import get_logger
from security_agent import scan_code

# New Product Services
from services.s3_service import upload_to_s3, get_from_s3, list_s3_objects, log_analysis
from utils.auth import get_password_hash, verify_password

logger = get_logger(__name__)
SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "test_samples")

# ── App lifecycle ──────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 CodeSentinel Product API starting up")
    yield
    logger.info("🛑 Shutting down")

# ── App factory ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="CodeSentinel Intelligent API",
    description="Full-stack AI Security & Analytics Platform",
    version="3.0.0",
    lifespan=lifespan,
)

# CORS — allow all origins for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Schemas ────────────────────────────────────────────────────────────────────

class UserSignup(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ScanRequest(BaseModel):
    code: str
    
class Vulnerability(BaseModel):
    id: str
    title: str
    severity: str
    line: Optional[int] = None
    category: Optional[str] = None
    cwe: Optional[str] = None
    description: str
    fix: str
    original_snippet: Optional[str] = None
    fixed_snippet: Optional[str] = None
    raw_debug: Optional[str] = None

class ScanResponse(BaseModel):
    status: str
    vulnerabilities: List[Vulnerability]

class AnalyticsResponse(BaseModel):
    totalRequests: int
    totalTokens: int
    totalCost: float
    modelUsage: dict
    costSavedEstimate: float

# ── Authentication Endpoints ──────────────────────────────────────────────────

@app.post("/api/signup", tags=["Auth"])
async def signup(user: UserSignup):
    email = user.email.lower()
    s3_key = f"users/{email}.json"
    
    # Check if user exists
    existing = get_from_s3(s3_key)
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    user_data = {
        "email": email,
        "password": get_password_hash(user.password),
        "createdAt": datetime.now().isoformat()
    }
    
    success = upload_to_s3(s3_key, user_data)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to store user")
    
    return {"message": "User created successfully"}

@app.post("/api/login", tags=["Auth"])
async def login(user: UserLogin):
    email = user.email.lower()
    s3_key = f"users/{email}.json"
    
    user_data = get_from_s3(s3_key)
    if not user_data or not verify_password(user.password, user_data["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {"message": "Login successful", "email": email}

# ── Analytics Endpoint ────────────────────────────────────────────────────────

@app.get("/api/analytics", response_model=AnalyticsResponse, tags=["Analytics"])
async def get_analytics(date: str = None):
    """Aggregates logs for a specific YYYY-MM-DD date."""
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
        
    prefix = f"logs/{date}/"
    log_keys = list_s3_objects(prefix)
    
    stats = {
        "totalRequests": 0,
        "totalTokens": 0,
        "totalCost": 0.0,
        "modelUsage": {"nova-lite": 0, "nova-pro": 0, "nova-micro": 0},
        "costSavedEstimate": 0.0
    }
    
    for key in log_keys:
        log = get_from_s3(key)
        if not log:
            continue
            
        stats["totalRequests"] += 1
        stats["totalTokens"] += log.get("tokens", 0)
        stats["totalCost"] += log.get("cost", 0.0)
        stats["costSavedEstimate"] += log.get("cost_saved", 0.0)
        
        model = log.get("modelUsed", "unknown").lower()
        if "lite" in model:
            stats["modelUsage"]["nova-lite"] += 1
        elif "pro" in model:
            stats["modelUsage"]["nova-pro"] += 1
        elif "micro" in model:
            stats["modelUsage"]["nova-micro"] += 1
            
    return stats

# ── Core Analysis Endpoints ────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "version": "3.0.0", "service": "CodeSentinel Product API"}

@app.post("/process", response_model=ProcessResponse, tags=["Inference"])
async def process_prompt(request: PromptRequest, background_tasks: BackgroundTasks):
    prompt = request.prompt
    try:
        clf = analyze_prompt(prompt)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    token_count = clf["token_count"]
    intent = clf["intent"]
    complexity = clf["complexity_score"]
    sec_scan = clf["security_scan"]

    try:
        route = get_route(complexity, intent, token_count)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    t0 = time.perf_counter()
    try:
        answer = invoke_nova(prompt, route["model_id"])
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    latency = round(time.perf_counter() - t0, 3)

    # Prepare log data
    log_data = {
        "type": "middleware",
        "modelUsed": route["model_name"],
        "risk": sec_scan["risk_level"],
        "complexity": route["complexity_rank"],
        "inputLength": len(prompt),
        "tokens": token_count,
        "cost": route.get("dollars_saved", 0) * 0, # Hackathon placeholder
        "cost_saved": route.get("dollars_saved", 0)
    }
    background_tasks.add_task(log_analysis, log_data)

    return ProcessResponse(
        answer=answer,
        routing_decision=RoutingDecision(
            model_used=route["model_name"],
            complexity_rank=route["complexity_rank"],
            intent_detected=route["intent_detected"],
            reason=route["reason"],
        ),
        performance_metrics=PerformanceMetrics(
            tokens_processed=token_count,
            latency_sec=latency,
            speed_improvement_vs_pro=route["speed_improvement_vs_pro"],
        ),
        business_impact=BusinessImpact(
            dollars_saved=route["dollars_saved"],
            cost_reduction_percentage=route["cost_reduction_percentage"],
            projected_monthly_savings=route["projected_monthly_savings"],
        ),
        security_scan=SecurityScan(
            risk_level=sec_scan["risk_level"],
            pii_detected=sec_scan["pii_detected"],
        ),
    )

@app.post("/api/scan", response_model=ScanResponse, tags=["Security"])
async def analyze_code(request: ScanRequest, background_tasks: BackgroundTasks):
    try:
        if not request.code or request.code.strip() == "":
            raise HTTPException(status_code=400, detail="Code cannot be empty")
            
        # Try scanning with Bedrock (LLM)
        try:
            results = scan_code(request.code)
        except Exception as e:
            logger.warning(f"Bedrock scan failed: {str(e)}. Falling back to local engine.")
            from analyzer import analyze
            # Use 'internal' as a generic extension for local routing
            local_res = analyze(request.code, "scanner_input.py") 
            results = [
                {
                    "id": item.get("id", "L-000"),
                    "title": item.get("title", "Local Detection"),
                    "severity": item.get("severity", "MEDIUM"),
                    "description": item.get("description", "Vulnerability detected by local pattern matching."),
                    "fix": item.get("fix", "No fix recommended by local engine."),
                    "category": item.get("category"),
                    "cwe": item.get("cwe"),
                    "original_snippet": None,
                    "fixed_snippet": None
                }
                for item in local_res["issues"]
            ]
        
        # Log this scan
        log_data = {
            "type": "direct_scan",
            "modelUsed": "Amazon Nova Lite", # Fixed for now/demo
            "risk": "Analyzed",
            "complexity": "Code Scan",
            "inputLength": len(request.code),
            "tokens": len(request.code) // 4, # Rough estimate
            "cost": 0.0001, # Mock for demo
            "cost_saved": 0.005 # Mock for demo comparison to Pro
        }
        background_tasks.add_task(log_analysis, log_data)
        
        return ScanResponse(status="success", vulnerabilities=results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/samples", tags=["Utilities"])
async def list_samples():
    if not os.path.exists(SAMPLES_DIR):
        return {"samples": []}
    files = [f for f in os.listdir(SAMPLES_DIR) if os.path.isfile(os.path.join(SAMPLES_DIR, f))]
    return {"samples": files}

@app.get("/api/sample/{name}", tags=["Utilities"])
async def get_sample(name: str):
    path = os.path.join(SAMPLES_DIR, name)
    if not os.path.abspath(path).startswith(os.path.abspath(SAMPLES_DIR)):
        raise HTTPException(status_code=403, detail="Forbidden")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Sample not found")
    with open(path, "r", encoding="utf-8") as f:
        return {"content": f.read()}
