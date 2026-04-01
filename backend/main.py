"""
main.py
FastAPI entry-point for CodeSentinel - AI Security Code Review.

Flows: 
1. POST /process   - Intelligent Nova Middleware (Classifier + Router)
2. POST /api/scan  - CodeSentinel Security Agent (Direct Bedrock Scan)
"""

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

# ── App lifecycle ──────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 CodeSentinel Security API starting up")
    yield
    logger.info("🛑 Shutting down")

# ── App factory ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="CodeSentinel Security API",
    description=(
        "Routes prompts to the most cost-effective Amazon Nova model "
        "and provides direct security scanning via the CodeSentinel Security Agent."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — allow all origins for frontend integration (tighten in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Schemas for direct scanning ───────────────────────────────────────────────

class ScanRequest(BaseModel):
    code: str
    
class Vulnerability(BaseModel):
    vulnerability: str
    severity: str
    fix: str

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
    Endpoint that takes source code or IaC and runs it through the Security Agent 
    (Bedrock LLM) to find vulnerabilities.
    """
    try:
        logger.info("Received code scan request.")
        if not request.code or request.code.strip() == "":
            raise HTTPException(status_code=400, detail="Code cannot be empty")
            
        results = scan_code(request.code)
        
        return ScanResponse(
            status="success",
            vulnerabilities=results
        )
    except Exception as e:
        logger.error(f"Error during scan: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
