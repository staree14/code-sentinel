"""
services/rag.py
RAG-lite (Retrieval-Augmented Generation) context injector.

Loads security rules from security_rules.json and CIS benchmark summaries,
then selects the most relevant chunks based on keyword matching before
injecting them into the LLM system prompt. No vector DB required.
"""

import json
import os
import re

_RULES_PATH = os.path.join(os.path.dirname(__file__), "..", "security_rules.json")

# CIS AWS Benchmark v1.4 — short summaries of the most common controls.
# Each entry: (keywords_to_match, benchmark_text)
_CIS_BENCHMARKS: list[tuple[list[str], str]] = [
    (
        ["s3", "bucket", "public", "acl"],
        "CIS 2.1.1 — Ensure all S3 buckets employ encryption-at-rest. "
        "CIS 2.1.2 — Ensure S3 Bucket Policy is set to deny HTTP requests. "
        "CIS 2.1.5 — Ensure that S3 Buckets are configured with 'Block public access'.",
    ),
    (
        ["iam", "policy", "wildcard", "*", "action", "resource"],
        "CIS 1.16 — Ensure IAM policies are attached only to groups or roles, not users directly. "
        "CIS 1.22 — Ensure IAM policies that allow full '*:*' administrative privileges are not attached. "
        "Principle of Least Privilege: Grant only the minimum permissions needed.",
    ),
    (
        ["password", "root", "mfa", "access key"],
        "CIS 1.1 — Avoid the use of the root account. "
        "CIS 1.5 — Ensure MFA is enabled for the root account. "
        "CIS 1.13 — Ensure MFA is enabled for all IAM users that have console access. "
        "CIS 1.4 — Ensure no root account access key exists.",
    ),
    (
        ["cloudtrail", "logging", "log", "audit"],
        "CIS 3.1 — Ensure CloudTrail is enabled in all regions. "
        "CIS 3.2 — Ensure CloudTrail log file validation is enabled. "
        "CIS 3.6 — Ensure CloudWatch Logs integration with CloudTrail is enabled.",
    ),
    (
        ["security group", "0.0.0.0", "port 22", "port 3389", "ssh", "rdp", "ingress"],
        "CIS 5.2 — Ensure no security groups allow ingress from 0.0.0.0/0 to port 22. "
        "CIS 5.3 — Ensure no security groups allow ingress from 0.0.0.0/0 to port 3389. "
        "Overly permissive security groups expose resources to internet-wide attacks.",
    ),
    (
        ["kms", "encrypt", "key", "rotation"],
        "CIS 2.8 — Ensure rotation for customer created CMKs is enabled. "
        "All sensitive data at rest should use AWS KMS with key rotation enabled.",
    ),
    (
        ["hardcoded", "api_key", "secret", "credential", "password", "token"],
        "CWE-798: Use of Hard-coded Credentials. "
        "Never store secrets in source code. Use AWS Secrets Manager or Parameter Store. "
        "Rotate any exposed credentials immediately.",
    ),
    (
        ["vpc", "subnet", "nacl", "network acl"],
        "CIS 5.1 — Ensure no Network ACLs allow ingress from 0.0.0.0/0 to any port. "
        "Use private subnets for backend resources and NAT Gateways for outbound traffic.",
    ),
]


def _load_security_rules() -> list[dict]:
    """Load rules from the JSON rules file, return empty list on failure."""
    try:
        with open(_RULES_PATH, "r") as f:
            data = json.load(f)
            # Support both a flat list and a {"rules": [...]} wrapper
            if isinstance(data, list):
                return data
            if isinstance(data, dict) and "rules" in data:
                return data["rules"]
    except (FileNotFoundError, json.JSONDecodeError):
        pass
    return []


def _score_rule(rule: dict, code_lower: str) -> int:
    """Count how many of the rule's keywords appear in the code."""
    keywords: list[str] = rule.get("keywords", [])
    if not keywords:
        # If no keywords, check against rule id/title words
        title_words = re.findall(r'\w+', rule.get("title", "").lower())
        keywords = title_words
    return sum(1 for kw in keywords if kw.lower() in code_lower)


def build_rag_context(code: str, top_k_rules: int = 5) -> str:
    """
    Given the user's submitted code, return a focused context string
    containing the most relevant security rules + CIS benchmarks.

    Parameters
    ----------
    code        : The raw code / policy text.
    top_k_rules : Maximum number of JSON rules to inject.

    Returns
    -------
    A formatted string ready to be embedded in the LLM system prompt.
    """
    code_lower = code.lower()
    sections: list[str] = []

    # ── 1. Scored JSON rules ───────────────────────────────────────────────────
    rules = _load_security_rules()
    if rules:
        scored = sorted(rules, key=lambda r: _score_rule(r, code_lower), reverse=True)
        top_rules = scored[:top_k_rules]
        rules_text = json.dumps(top_rules, indent=2)
        sections.append(f"## Relevant Security Rules (from internal ruleset)\n{rules_text}")

    # ── 2. CIS benchmark snippets ──────────────────────────────────────────────
    matching_cis: list[str] = []
    for keywords, benchmark_text in _CIS_BENCHMARKS:
        if any(kw in code_lower for kw in keywords):
            matching_cis.append(benchmark_text)

    if matching_cis:
        cis_block = "\n".join(f"- {b}" for b in matching_cis)
        sections.append(f"## CIS AWS Benchmark Controls (relevant to this input)\n{cis_block}")

    if not sections:
        return "No specific rule context loaded — apply general AWS security best practices."

    return "\n\n".join(sections)
