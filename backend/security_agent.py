"""
security_agent.py
CodeSentinel Security Scanning Agent — v2 (Three-Layer Pipeline)

Pipeline
--------
1. PARSE   — Detect input type (IAM JSON, Terraform, Python, etc.)
             and extract any embedded IAM policy objects.
2. RAG     — Build focused context from security_rules.json + CIS benchmarks
             matching keywords found in the submitted code.
3. ANALYZE — Run two sources in parallel:
             a) AWS IAM Access Analyzer API (deterministic, rule-based)
             b) Amazon Bedrock LLM (contextual, creative, deeper)
4. MERGE   — Deduplicate and combine both result sets into one list.
"""

import json
import os
import re

import boto3

from services.iam_analyzer import validate_policies_from_list
from services.parser import detect_input_type, extract_iam_policies, format_for_prompt
from services.rag import build_rag_context

# ── Bedrock client ─────────────────────────────────────────────────────────────
bedrock = boto3.client(
    "bedrock-runtime",
    region_name=os.getenv("AWS_REGION", "us-east-1"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

_MODEL_ID = "amazon.nova-lite-v1:0"

# ── Vulnerability schema ───────────────────────────────────────────────────────
_SCHEMA_EXAMPLE = """[
  {
    "id": "V-001",
    "title": "Descriptive title of the issue",
    "severity": "CRITICAL, HIGH, MEDIUM, or LOW",
    "line": 10,
    "category": "e.g. IAM Policy, Secrets Management, Injection",
    "cwe": "CWE-XXX",
    "description": "Short explanation of the risk",
    "fix": "Full explanation and remediation advice",
    "original_snippet": "The exact vulnerable lines from the input (copy them verbatim, or null if not applicable)",
    "fixed_snippet": "The corrected version of those exact lines (or null if not applicable)"
  }
]"""


# ── Layer 1: LLM-based scan ────────────────────────────────────────────────────

def _llm_scan(code: str, rag_context: str, input_type: str) -> list[dict]:
    """
    Call Amazon Bedrock with RAG context injected into the system prompt.
    Returns a list of vulnerability dicts, or a single error entry on failure.
    """
    system_prompt = f"""You are an expert AI Security Agent embedded in the CodeSentinel platform.
Your task is to analyze the provided code or configuration for security vulnerabilities.

The input has been classified as: {input_type.upper()}

--- SECURITY CONTEXT (RAG) ---
{rag_context}
--- END SECURITY CONTEXT ---

CRITICAL INSTRUCTIONS:
- YOU MUST ONLY RETURN A RAW JSON ARRAY. NO MARKDOWN, NO EXPLANATION, NO BACKTICKS.
- If no vulnerabilities are found, return an empty array: []
- Use the RAG security context above to guide your analysis, but also apply general security expertise.

Each vulnerability MUST follow this exact schema:
{_SCHEMA_EXAMPLE}
"""

    formatted_code = format_for_prompt(code, input_type)  # type: ignore[arg-type]

    try:
        response = bedrock.converse(
            modelId=_MODEL_ID,
            messages=[{"role": "user", "content": [{"text": formatted_code}]}],
            system=[{"text": system_prompt}],
        )
        output_text = response["output"]["message"]["content"][0]["text"]

        # Strip markdown code fences if the model added them anyway
        clean = re.sub(r"^```[a-z]*\s*", "", output_text.strip(), flags=re.IGNORECASE)
        clean = re.sub(r"\s*```$", "", clean)

        parsed = json.loads(clean)
        if not isinstance(parsed, list):
            return [parsed]
        return parsed

    except json.JSONDecodeError:
        return [{
            "id": "LLM-ERR",
            "title": "LLM Response Parse Error",
            "severity": "LOW",
            "category": "Tooling",
            "cwe": None,
            "description": "The AI model returned a response that could not be parsed as structured JSON.",
            "fix": f"Raw output: {output_text if 'output_text' in dir() else 'unavailable'}",
        }]
    except Exception as exc:
        raise RuntimeError(f"Bedrock LLM scan failed: {exc}") from exc


# ── Layer 2: Result merger + deduplication ─────────────────────────────────────

def _merge_results(iam_findings: list[dict], llm_findings: list[dict]) -> list[dict]:
    """
    Combine IAM Analyzer + LLM findings.
    - IAM Analyzer findings come first (they are deterministic).
    - Re-index all IDs so the final list has sequential V-001, V-002, etc.
    - Basic deduplication: skip LLM entries whose title closely matches an IAM entry.
    """
    iam_titles = {f["title"].lower() for f in iam_findings}

    deduped_llm: list[dict] = []
    for finding in llm_findings:
        title_lower = finding.get("title", "").lower()
        # Skip if IAM Analyzer already caught the same issue
        if any(title_lower in iam_t or iam_t in title_lower for iam_t in iam_titles):
            continue
        deduped_llm.append(finding)

    combined = iam_findings + deduped_llm

    # Re-index IDs
    for i, vuln in enumerate(combined, start=1):
        vuln["id"] = f"V-{i:03d}"

    return combined


# ── Public API ─────────────────────────────────────────────────────────────────

def scan_code(code_text: str) -> list[dict]:
    """
    Full three-layer security scan.

    1. PARSE  — detect input type and extract IAM policies
    2. RAG    — build focused context from rules + CIS benchmarks
    3. IAM    — call AWS Access Analyzer for rule-based policy checks
    4. LLM    — call Bedrock with RAG context for deeper LLM analysis
    5. MERGE  — combine and deduplicate both result sets

    Parameters
    ----------
    code_text : The raw source code, IaC, or policy text to scan.

    Returns
    -------
    A list of vulnerability dicts in CodeSentinel schema.
    """
    # ── LAYER 1: Parse ─────────────────────────────────────────────────────────
    input_type = detect_input_type(code_text)
    iam_policies = extract_iam_policies(code_text)

    # ── LAYER 2: RAG context ───────────────────────────────────────────────────
    rag_context = build_rag_context(code_text, top_k_rules=5)

    # ── LAYER 3a: AWS IAM Access Analyzer (if IAM policies found) ─────────────
    iam_findings: list[dict] = []
    if iam_policies:
        iam_findings = validate_policies_from_list(iam_policies)

    # ── LAYER 3b: Bedrock LLM scan ─────────────────────────────────────────────
    llm_findings = _llm_scan(code_text, rag_context, input_type)

    # ── LAYER 4: Merge ─────────────────────────────────────────────────────────
    return _merge_results(iam_findings, llm_findings)
