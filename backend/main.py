"""
main.py
FastAPI entry-point for the Intelligent LLM Middleware.

Combines the /process route (Classifier + RAG + Router) 
and the /api/scan route (Direct Bedrock Security Agent).
"""

import time
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
    logger.info("🚀 Intelligent LLM Middleware starting up")
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

class ScanResponse(BaseModel):
    status: str
    vulnerabilities: List[Vulnerability]


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health_check():
    """Simple liveness probe."""
    return {"status": "ok", "version": "2.0.0"}


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
            
        # Send raw code directly to the security agent
        results = scan_code(request.code)
        
        return ScanResponse(
            status="success",
            vulnerabilities=results
        )
    except Exception as e:
        logger.error(f"Error during scan: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "CodeSentinel API"}
