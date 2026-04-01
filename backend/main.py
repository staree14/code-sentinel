"""
main.py
Combined backend for CodeSentinel.
Flows: 
1. POST /process   - Intelligent Nova Middleware (Classifier + Router)
2. POST /api/scan  - CodeSentinel Security Agent (Direct Bedrock Scan)
3. GET /api/samples - Fetch available code samples
"""

import os
import time
import logging
from contextlib import asynccontextmanager
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Load .env before anything that reads env-vars (boto3 client, etc.)
load_dotenv()

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

logger = get_logger(__name__)
# The samples folder is inside the backend/ directory in the GitHub repo
SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "samples")

# ── App lifecycle ──────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 CodeSentinel Security API starting up")
    yield
    logger.info("🛑 Shutting down")

# ── App factory ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Intelligent LLM Middleware & Security API",
    description=(
        "Combined backend supporting both middleware routing Analytics and "
        "direct Security Agent code scanning for CodeSentinel."
    ),
    version="2.0.0",
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

# ── Schemas for Security Agent Endpoint ────────────────────────────────────────

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

# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health_check():
    """Simple liveness probe."""
    return {"status": "ok", "version": "2.0.0", "service": "CodeSentinel API"}

@app.post("/process", response_model=ProcessResponse, tags=["Inference"])
async def process_prompt(request: PromptRequest):
    """
    Main pipeline endpoint.
    Body → { "prompt": "<your text>" }
    """
    prompt = request.prompt
    logger.info("Received prompt (%d chars)", len(prompt))

    # 1. Classify
    try:
        clf = analyze_prompt(prompt)
    except Exception as exc:
        logger.exception("Classifier error")
        raise HTTPException(status_code=500, detail=f"Classifier error: {exc}")

    token_count: int   = clf["token_count"]
    intent: str        = clf["intent"]
    complexity: int    = clf["complexity_score"]
    sec_scan: dict     = clf["security_scan"]

    # 2. Route
    try:
        route = get_route(complexity, intent, token_count)
    except Exception as exc:
        logger.exception("Router error")
        raise HTTPException(status_code=500, detail=f"Router error: {exc}")

    # 3. Invoke Bedrock
    t0 = time.perf_counter()
    try:
        answer = invoke_nova(prompt, route["model_id"])
    except RuntimeError as exc:
        logger.exception("Bedrock invocation failed")
        raise HTTPException(status_code=502, detail=str(exc))
    latency = round(time.perf_counter() - t0, 3)

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
async def analyze_code(request: ScanRequest):
    """
    Direct Security Agent endpoint.
    Takes source code or IaC and runs it through the Security Agent 
    (Bedrock LLM) to find vulnerabilities directly, bypassing the router.
    """
    try:
        logger.info("Received code scan request.")
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
        
        return ScanResponse(
            status="success",
            vulnerabilities=results
        )
    except Exception as e:
        logger.error(f"Error during scan: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/samples", tags=["Utilities"])
async def list_samples():
    """Returns a list of filenames in the samples directory."""
    if not os.path.exists(SAMPLES_DIR):
        return {"samples": []}
    files = [f for f in os.listdir(SAMPLES_DIR) if os.path.isfile(os.path.join(SAMPLES_DIR, f))]
    return {"samples": files}

@app.get("/api/sample/{name}", tags=["Utilities"])
async def get_sample(name: str):
    """Returns the content of a specific sample file."""
    path = os.path.join(SAMPLES_DIR, name)
    # Basic security check to prevent path traversal
    if not os.path.abspath(path).startswith(os.path.abspath(SAMPLES_DIR)):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Sample not found")
    
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    return {"content": content}
