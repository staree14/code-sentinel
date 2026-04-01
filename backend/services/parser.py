"""
services/parser.py
Detects the type of input (Python, IAM JSON, Terraform, generic config)
and extracts any embedded IAM policies as structured dicts for the
IAM Access Analyzer API.
"""

import json
import re
from typing import Literal

InputType = Literal["iam_policy", "terraform", "python", "javascript", "generic"]


def detect_input_type(code: str) -> InputType:
    """
    Heuristically detect what kind of input the user submitted.
    Order matters — IAM JSON must be checked before generic JSON.
    """
    stripped = code.strip()

    # AWS IAM Policy JSON — must have Version + Statement keys
    if stripped.startswith("{"):
        try:
            obj = json.loads(stripped)
            if isinstance(obj, dict) and "Statement" in obj:
                return "iam_policy"
        except json.JSONDecodeError:
            pass

    # Terraform / HCL
    if re.search(r'\bresource\s+"aws_', stripped) or re.search(r'\bprovider\s+"aws"', stripped):
        return "terraform"

    # Python
    if re.search(r'\bdef\b|\bimport\b|\bclass\b|\bfrom\b', stripped):
        return "python"

    # JavaScript / TypeScript
    if re.search(r'\bconst\b|\blet\b|\bvar\b|\bfunction\b|\bexport\b|\brequire\b', stripped):
        return "javascript"

    return "generic"


def extract_iam_policies(code: str) -> list[dict]:
    """
    Extract all IAM policy JSON objects from the input.
    Handles:
      - Bare policy JSON  (the whole input is a policy)
      - Embedded JSON strings in Python/Terraform (json.dumps({...}))
    Returns a list of parsed policy dicts (may be empty).
    """
    policies: list[dict] = []

    # Check if the whole input is a single IAM policy
    stripped = code.strip()
    if stripped.startswith("{"):
        try:
            obj = json.loads(stripped)
            if isinstance(obj, dict) and "Statement" in obj:
                policies.append(obj)
                return policies
        except json.JSONDecodeError:
            pass

    # Try to find embedded JSON blobs that look like IAM policies
    # Pattern: any {...} block with Version + Statement keys
    json_candidates = re.findall(r'\{[^{}]*"Statement"[^{}]*\}', code, re.DOTALL)
    for candidate in json_candidates:
        try:
            obj = json.loads(candidate)
            if isinstance(obj, dict) and "Statement" in obj:
                policies.append(obj)
        except json.JSONDecodeError:
            continue

    return policies


def format_for_prompt(code: str, input_type: InputType) -> str:
    """
    Wrap the raw code with structured context so the LLM knows what it's looking at.
    """
    type_labels = {
        "iam_policy": "AWS IAM Policy (JSON)",
        "terraform": "Terraform / HCL Infrastructure as Code",
        "python": "Python source code",
        "javascript": "JavaScript / TypeScript source code",
        "generic": "Configuration / source code",
    }
    label = type_labels.get(input_type, "Code")
    return (
        f"[INPUT TYPE: {label}]\n\n"
        f"{code}\n\n"
        f"[END OF INPUT]"
    )
