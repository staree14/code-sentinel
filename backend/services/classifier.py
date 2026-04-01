"""
services/classifier.py
Analyzes a prompt using regex + keyword heuristics.

Returns
-------
{
    "token_count":      int,          # whitespace-split word count
    "intent":           str,          # Code | Security | Creative | General
    "complexity_score": int,          # 1-10
    "security_scan": {
        "risk_level":   str,          # Safe | Medium | Critical
        "pii_detected": bool,         # True if email / password / AWS key found
    }
}
"""

import re

# ── Intent keyword banks ───────────────────────────────────────────────────────

_INTENT_KEYWORDS: dict[str, list[str]] = {
    "Code": [
        r"\bdef\b", r"\bclass\b", r"\bimport\b", r"\breturn\b",
        r"\bfunction\b", r"\bconst\b", r"\bvar\b", r"\blet\b",
        r"\bSQL\b", r"\bSELECT\b", r"\bINSERT\b", r"\bUPDATE\b",
        r"<\?php", r"#!/", r"\.py\b", r"\.js\b", r"\.ts\b",
        r"\bbug\b", r"\bdebug\b", r"\brefactor\b", r"\boptimize\b",
        r"\bapi\b", r"\bendpoint\b", r"\bcompile\b",
    ],
    "Security": [
        r"\bpassword\b", r"\bsecret\b", r"\bapi[_\s]?key\b", r"\btoken\b",
        r"\bprivate[_\s]?key\b", r"\bcredential\b", r"\bhardcoded\b",
        r"0\.0\.0\.0/0", r"\bpublic-read\b", r"\bexploit\b",
        r"\bvulnerability\b", r"\bsql\s+injection\b", r"\bxss\b",
        r"\bcsrf\b", r"\biam\b", r"\bpolicy\b", r"\bpermission\b",
        r"\bfirewall\b", r"\bencrypt\b", r"\bdecrypt\b",
        r"arn:aws", r"\bPassRole\b", r"\bAssumeRole\b",
    ],
    "Creative": [
        r"\bstory\b", r"\bpoem\b", r"\blyric\b", r"\bjoke\b",
        r"\bblog\b", r"\bwrite\b", r"\bcreative\b", r"\bnarrative\b",
        r"\bfiction\b", r"\bimagine\b", r"\bcharacter\b", r"\bplot\b",
        r"\bsummariz\b", r"\bsummary\b", r"\bparaphrase\b", r"\btldr\b",
    ],
    "General": [
        r"\bwhat\s+is\b", r"\bexplain\b", r"\bhow\s+does\b",
        r"\bdefine\b", r"\btell\s+me\b", r"\bwhat\s+does\b",
        r"\bcan\s+you\b", r"\bhelp\s+me\b", r"\bwhy\b", r"\bwhen\b",
    ],
}

# Complexity boosting signals
_COMPLEXITY_BOOSTERS: list[tuple[str, int]] = [
    (r"\banalyze\b|\bevaluate\b|\bcompare\b|\bstrategy\b", 2),
    (r"\barchitecture\b|\bdesign\s+pattern\b|\bscalable\b", 2),
    (r"\brefactor\b|\boptimize\b|\bperformance\b", 2),
    (r"\bsecurity\s+audit\b|\bpenetration\b|\bthreat\s+model\b", 3),
    (r"\bmulti.step\b|\bpipeline\b|\bworkflow\b", 2),
]

# ── Security / PII patterns ────────────────────────────────────────────────────

# PII: email, password=value, AWS access/secret key patterns
_PII_PATTERNS: list[str] = [
    r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b",  # email
    r"\bpassword\s*[=:]\s*\S+",                                   # password=…
    r"AKIA[0-9A-Z]{16}",                                          # AWS access key
    r"(?<![A-Z0-9])[A-Z0-9]{40}(?![A-Z0-9])",                    # AWS secret key
]

_CRITICAL_SECURITY_PATTERNS: list[str] = [
    r"\bpassword\b", r"\bsecret\b", r"\bprivate[_\s]?key\b",
    r"AKIA[0-9A-Z]{16}", r"\bcredential\b", r"\bexploit\b",
    r"\bhardcoded\b", r"\baws[_\s]?secret\b",
]

_MEDIUM_SECURITY_PATTERNS: list[str] = [
    r"\biam\b", r"\bpolicy\b", r"\bpermission\b", r"\bfirewall\b",
    r"\btoken\b", r"\bapi[_\s]?key\b", r"\bencrypt\b", r"\bdecrypt\b",
    r"\bsecurity\s+group\b", r"\bvpc\b", r"\badmin\b",
]


# ── Public API ─────────────────────────────────────────────────────────────────

def analyze_prompt(text: str) -> dict:
    """
    Analyze a prompt and return routing + security metadata.

    Returns
    -------
    {
        "token_count":      int,
        "intent":           str,   # Code | Security | Creative | General
        "complexity_score": int,   # 1-10
        "security_scan": {
            "risk_level":   str,   # Safe | Medium | Critical
            "pii_detected": bool,
        }
    }
    """
    token_count = len(text.split())
    intent = _detect_intent(text)
    complexity_score = _compute_complexity(text, token_count, intent)
    security = _scan_security(text)

    return {
        "token_count": token_count,
        "intent": intent,
        "complexity_score": complexity_score,
        "security_scan": security,
    }


# ── Internal helpers ───────────────────────────────────────────────────────────

def _detect_intent(text: str) -> str:
    """Return the dominant intent label based on keyword matching."""
    hit_counts: dict[str, int] = {}
    for label, patterns in _INTENT_KEYWORDS.items():
        hit_counts[label] = sum(
            1 for p in patterns if re.search(p, text, re.IGNORECASE)
        )

    # Security beats Code if tied (higher stakes)
    best_label = max(hit_counts, key=lambda k: (hit_counts[k], k == "Security"))
    return "General" if hit_counts[best_label] == 0 else best_label


def _compute_complexity(text: str, token_count: int, intent: str) -> int:
    """Return a complexity score in [1, 10]."""
    if token_count < 15:
        score = 1
    elif token_count < 40:
        score = 2
    elif token_count < 80:
        score = 4
    elif token_count < 150:
        score = 5
    elif token_count < 300:
        score = 7
    else:
        score = 8

    intent_bump = {"Code": 2, "Security": 3, "Creative": 0, "General": 0}
    score += intent_bump.get(intent, 0)

    for pattern, weight in _COMPLEXITY_BOOSTERS:
        if re.search(pattern, text, re.IGNORECASE):
            score += weight

    return max(1, min(10, score))


def _scan_security(text: str) -> dict:
    """
    Scan for PII and classify risk level.

    risk_level
    ----------
    Critical – any critical-security pattern matched
    Medium   – any medium-security pattern matched (but no critical hits)
    Safe     – no security signals
    """
    pii_detected = any(
        re.search(p, text, re.IGNORECASE) for p in _PII_PATTERNS
    )

    critical_hits = sum(
        1 for p in _CRITICAL_SECURITY_PATTERNS
        if re.search(p, text, re.IGNORECASE)
    )
    medium_hits = sum(
        1 for p in _MEDIUM_SECURITY_PATTERNS
        if re.search(p, text, re.IGNORECASE)
    )

    if critical_hits > 0:
        risk_level = "Critical"
    elif medium_hits > 0:
        risk_level = "Medium"
    else:
        risk_level = "Safe"

    return {
        "risk_level": risk_level,
        "pii_detected": pii_detected,
    }