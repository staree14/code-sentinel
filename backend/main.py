from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import logging
from security_agent import scan_code

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CodeSentinel Security API")

# Setup CORS to allow your Next.js frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class ScanRequest(BaseModel):
    code: str
    
class Vulnerability(BaseModel):
    vulnerability: str
    severity: str
    fix: str

class ScanResponse(BaseModel):
    status: str
    vulnerabilities: List[Vulnerability]

@app.post("/api/scan", response_model=ScanResponse)
async def analyze_code(request: ScanRequest):
    """
    Endpoint that takes source code or IaC and runs it through the Security Agent 
    (Bedrock LLM) to find vulnerabilities.
    """
    try:
        logger.info("Received code scan request.")
        if not request.code or request.code.strip() == "":
            raise HTTPException(status_code=400, detail="Code cannot be empty")
            
        # Send raw code directly to the security agent (no router/classifier)
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
