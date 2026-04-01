from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

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
    id: str
    title: str
    severity: str
    line: int
    category: str
    cwe: str
    description: str
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

@app.get("/api/samples")
async def get_samples():
    """Returns a list of available test sample filenames."""
    samples_dir = os.path.join(os.path.dirname(__file__), "test_samples")
    if not os.path.exists(samples_dir):
        return {"samples": []}
    return {"samples": [f for f in os.listdir(samples_dir) if os.path.isfile(os.path.join(samples_dir, f))]}

@app.get("/api/sample/{filename}")
async def get_sample_content(filename: str):
    """Returns the content of a specific test sample."""
    samples_dir = os.path.join(os.path.dirname(__file__), "test_samples")
    file_path = os.path.join(samples_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Sample not found")
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    return {"content": content}

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "CodeSentinel API"}
