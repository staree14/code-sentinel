"""
models/schemas.py
Pydantic request / response models for the /process endpoint.
Mirrors the four-section AI Management dashboard structure.
"""

from pydantic import BaseModel, Field


# ── Request ────────────────────────────────────────────────────────────────────

class PromptRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="The user prompt to process.")


# ── Four dashboard sections ────────────────────────────────────────────────────

class RoutingDecision(BaseModel):
    model_used: str           = Field(..., example="Nova Micro")
    complexity_rank: str      = Field(..., example="Low (2/10)")
    intent_detected: str      = Field(..., example="General Knowledge")
    reason: str               = Field(..., example="Input length < 20 tokens and no logic-heavy keywords detected.")


class PerformanceMetrics(BaseModel):
    tokens_processed: int           = Field(..., example=18)
    latency_sec: float              = Field(..., example=0.843)
    speed_improvement_vs_pro: str   = Field(..., example="65% faster than Pro")


class BusinessImpact(BaseModel):
    dollars_saved: float                = Field(..., example=0.00095706)
    cost_reduction_percentage: str      = Field(..., example="95.6%")
    projected_monthly_savings: float    = Field(..., example=957.06)


class SecurityScan(BaseModel):
    risk_level: str     = Field(..., example="Safe")
    pii_detected: bool  = Field(..., example=False)


# ── Top-level response ─────────────────────────────────────────────────────────

class ProcessResponse(BaseModel):
    answer: str

    routing_decision: RoutingDecision
    performance_metrics: PerformanceMetrics
    business_impact: BusinessImpact
    security_scan: SecurityScan
