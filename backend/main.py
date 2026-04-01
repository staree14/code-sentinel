"""
main.py
FastAPI entry-point for the Intelligent LLM Middleware.

Flow: POST /process
  1. Classify  – analyze_prompt()  → token_count, intent, complexity_score, security_scan
  2. Route     – get_route()       → model_id + full dashboard analytics
  3. Execute   – invoke_nova()     → AI answer  (boto3 call – NOT modified)
  4. Return    – answer + four nested dashboard objects
"""

import time
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

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

logger = get_logger(__name__)


# ── App lifecycle ──────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Intelligent LLM Middleware starting up")
    yield
    logger.info("🛑 Shutting down")


# ── App factory ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Intelligent LLM Middleware",
    description=(
        "Routes prompts to the most cost-effective Amazon Nova model "
        "using classifier + router heuristics. Returns a rich, nested "
        "JSON payload for the AI Management dashboard."
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


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health_check():
    """Simple liveness probe."""
    return {"status": "ok", "version": "2.0.0"}


@app.post("/process", response_model=ProcessResponse, tags=["Inference"])
async def process_prompt(request: PromptRequest):
    """
    Main pipeline endpoint.

    Body → { "prompt": "<your text>" }

    Returns the AI answer plus four dashboard sections:
      - routing_decision
      - performance_metrics
      - business_impact
      - security_scan
    """
    prompt = request.prompt
    logger.info("Received prompt (%d chars)", len(prompt))

    # ── Step 1: Classify ──────────────────────────────────────────────────────
    try:
        clf = analyze_prompt(prompt)
    except Exception as exc:
        logger.exception("Classifier error")
        raise HTTPException(status_code=500, detail=f"Classifier error: {exc}")

    token_count: int   = clf["token_count"]
    intent: str        = clf["intent"]
    complexity: int    = clf["complexity_score"]
    sec_scan: dict     = clf["security_scan"]

    logger.info(
        "Classified — intent=%s  complexity=%d  tokens=%d  risk=%s",
        intent, complexity, token_count, sec_scan["risk_level"],
    )

    # ── Step 2: Route ─────────────────────────────────────────────────────────
    try:
        route = get_route(complexity, intent, token_count)
    except Exception as exc:
        logger.exception("Router error")
        raise HTTPException(status_code=500, detail=f"Router error: {exc}")

    logger.info("Routed to %s (%s)", route["model_name"], route["model_id"])

    # ── Step 3: Invoke Bedrock (boto3 — unchanged) ────────────────────────────
    t0 = time.perf_counter()
    try:
        answer = invoke_nova(prompt, route["model_id"])
    except RuntimeError as exc:
        logger.exception("Bedrock invocation failed")
        raise HTTPException(status_code=502, detail=str(exc))
    latency = round(time.perf_counter() - t0, 3)

    logger.info("Response received in %.3fs via %s", latency, route["model_name"])

    # ── Step 4: Build nested response ─────────────────────────────────────────
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