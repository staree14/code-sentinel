"""
services/router.py
Routes a prompt to the best-fit Amazon Nova model and returns
enriched analytics for the four dashboard sections.
"""

from __future__ import annotations

# ── Model catalogue ────────────────────────────────────────────────────────────

_MODELS: dict[str, dict] = {
    "Nova Micro": {
        "model_id": "amazon.nova-micro-v1:0",
        "cost_per_1k": 0.000035,
        # Estimated speed gain vs Nova Pro (empirical / Amazon docs)
        "speed_vs_pro_pct": 65,
    },
    "Nova Lite": {
        "model_id": "amazon.nova-lite-v1:0",
        "cost_per_1k": 0.00006,
        "speed_vs_pro_pct": 35,
    },
    "Claude Haiku": {
        "model_id": "anthropic.claude-3-haiku-20240307-v1:0",
        "cost_per_1k": 0.00025,
        "speed_vs_pro_pct": 80,
    },
    "Nova Pro": {
        "model_id": "amazon.nova-pro-v1:0",
        "cost_per_1k": 0.0008,
        "speed_vs_pro_pct": 0,
    },
}

_PRO_COST = _MODELS["Nova Pro"]["cost_per_1k"]

# Intents that always escalate to Nova Pro
_PRO_INTENTS = {"Code", "Security"}
# Intents that land on Nova Lite in the mid-range
_LITE_INTENTS = {"Creative", "Summarization"}

# Human-friendly intent labels
_INTENT_LABELS: dict[str, str] = {
    "Code":     "Code Analysis",
    "Security": "Security Risk",
    "Creative": "Creative Writing",
    "General":  "General Knowledge",
}

# Complexity rank labels
_RANK_LABELS: dict[tuple[int, int], str] = {
    (1,  3):  "Low",
    (4,  6):  "Moderate",
    (7,  8):  "High",
    (9, 10):  "Very High",
}

# Monthly request volume assumption for projected savings
_MONTHLY_REQUESTS = 1_000_000


# ── Public API ─────────────────────────────────────────────────────────────────

def get_route(complexity_score: int, intent: str, token_count: int = 50) -> dict:
    """
    Choose the most cost-effective Amazon Nova model and return
    full analytics for the AI Management dashboard.

    Parameters
    ----------
    complexity_score : 1-10 score from the classifier.
    intent           : "Code" | "Security" | "Creative" | "General"
    token_count      : actual token count for cost calculations.

    Returns
    -------
    {
        "model_name": str,
        "model_id":   str,

        # routing_decision section
        "complexity_rank":   str,  e.g. "Low (2/10)"
        "intent_detected":   str,  e.g. "General Knowledge"
        "reason":            str,  human-readable explanation

        # performance_metrics section
        "speed_improvement_vs_pro": str,  e.g. "65% faster than Pro"

        # business_impact section
        "dollars_saved":               float,
        "cost_reduction_percentage":   str,   e.g. "95.6%"
        "projected_monthly_savings":   float,
    }
    """
    model_name = _pick_model(complexity_score, intent)
    model_info = _MODELS[model_name]

    # ── routing_decision analytics ─────────────────────────────────────────
    complexity_rank = _format_complexity_rank(complexity_score)
    intent_detected = _INTENT_LABELS.get(intent, intent)
    reason = _build_reason(complexity_score, intent, model_name, token_count)

    # ── performance_metrics analytics ─────────────────────────────────────
    speed_pct = model_info["speed_vs_pro_pct"]
    speed_str = (
        f"{speed_pct}% faster than Pro" if speed_pct > 0 else "Baseline (Pro)"
    )

    # ── business_impact analytics ──────────────────────────────────────────
    rate = model_info["cost_per_1k"]
    # dollars saved on THIS request vs always using Nova Pro
    dollars_saved = round((token_count * 1.3 / 1000) * (_PRO_COST - rate), 8)

    cost_reduction_pct = (
        round(((_PRO_COST - rate) / _PRO_COST) * 100, 1) if rate < _PRO_COST else 0.0
    )
    cost_reduction_str = f"{cost_reduction_pct}%"

    # Scale to monthly volume (same token_count per request assumed)
    projected_monthly_savings = round(dollars_saved * _MONTHLY_REQUESTS, 2)

    return {
        "model_name": model_name,
        "model_id": model_info["model_id"],
        # routing_decision
        "complexity_rank": complexity_rank,
        "intent_detected": intent_detected,
        "reason": reason,
        # performance_metrics
        "speed_improvement_vs_pro": speed_str,
        # business_impact
        "dollars_saved": dollars_saved,
        "cost_reduction_percentage": cost_reduction_str,
        "projected_monthly_savings": projected_monthly_savings,
    }


# ── Internal helpers ───────────────────────────────────────────────────────────

def _pick_model(score: int, intent: str) -> str:
    if score > 6 or intent in _PRO_INTENTS:
        return "Nova Pro"
    if score < 3 and intent not in _LITE_INTENTS:
        return "Nova Micro"
    return "Nova Lite"


def _format_complexity_rank(score: int) -> str:
    for (lo, hi), label in _RANK_LABELS.items():
        if lo <= score <= hi:
            return f"{label} ({score}/10)"
    return f"Very High ({score}/10)"


def _build_reason(score: int, intent: str, model_name: str, tokens: int) -> str:
    """Generate a concise, human-readable routing explanation."""
    if model_name == "Nova Micro":
        return (
            f"Input length is {tokens} tokens with no logic-heavy or "
            "domain-specific keywords detected — routed to Nova Micro for "
            "maximum speed and minimum cost."
        )
    if model_name == "Nova Lite":
        if intent in _LITE_INTENTS:
            return (
                f"{_INTENT_LABELS.get(intent, intent)} intent detected. "
                "Nova Lite handles creative and summarization tasks with a "
                "strong quality-to-cost ratio."
            )
        return (
            f"Moderate complexity score ({score}/10) with {tokens} input tokens. "
            "Nova Lite provides a balanced trade-off between capability and cost."
        )
    # Nova Pro
    if intent == "Security":
        return (
            "Security-sensitive input detected (credentials, policies, or "
            "vulnerability keywords). Nova Pro is required for thorough "
            "risk analysis."
        )
    if intent == "Code":
        return (
            f"Code-heavy input with complexity score {score}/10. "
            "Nova Pro is selected to ensure accurate logic, debugging, "
            "and multi-step reasoning."
        )
    return (
        f"High complexity score ({score}/10) with {tokens} tokens. "
        "Nova Pro is required for deep, multi-step reasoning."
    )