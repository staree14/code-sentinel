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

class Vulnerability(BaseModel):
    id: str
    title: str
    severity: str
    line: Optional[int] = None
    category: Optional[str] = None
    cwe: Optional[str] = None
    description: str
    fix: str

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
    
class ScanResponse(BaseModel):
    status: str
    vulnerabilities: List[Vulnerability]


# ── Endpoints ──────────────────────────────────────────────────────────────────



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
                    "cwe": item.get("cwe")
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

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "CodeSentinel API"}
