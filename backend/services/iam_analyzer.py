"""
services/iam_analyzer.py
Thin wrapper around the AWS IAM Access Analyzer API.

Validates IAM Policy JSON documents and converts the structured
API findings into the same vulnerability dict schema used by the
rest of the CodeSentinel pipeline.

AWS Docs:
  https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/accessanalyzer.html
"""

import json
import os
import boto3
from botocore.exceptions import BotoCoreError, ClientError

# Severity mapping from IAM Access Analyzer finding types
_FINDING_TYPE_TO_SEVERITY: dict[str, str] = {
    "ERROR": "CRITICAL",
    "SECURITY_WARNING": "HIGH",
    "WARNING": "MEDIUM",
    "SUGGESTION": "LOW",
}

# CWE for over-permissive access patterns
_CWE_MAP: dict[str, str] = {
    "SECURITY_WARNING": "CWE-269",   # Improper Privilege Management
    "ERROR": "CWE-285",             # Improper Authorization
    "WARNING": "CWE-732",           # Incorrect Permission Assignment
    "SUGGESTION": "CWE-272",        # Least Privilege Violation
}


def _get_client():
    return boto3.client(
        "accessanalyzer",
        region_name=os.getenv("AWS_REGION", "us-east-1"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )


def validate_iam_policy(policy: dict, policy_type: str = "IDENTITY_POLICY") -> list[dict]:
    """
    Call AWS IAM Access Analyzer to validate a single IAM policy JSON.

    Parameters
    ----------
    policy      : The parsed IAM policy dict (must have 'Statement' key).
    policy_type : 'IDENTITY_POLICY', 'RESOURCE_POLICY', or 'SERVICE_CONTROL_POLICY'.

    Returns
    -------
    A list of vulnerability dicts in CodeSentinel schema, or [] on clean result.
    """
    try:
        client = _get_client()
        response = client.validate_policy(
            policyDocument=json.dumps(policy),
            policyType=policy_type,
        )
    except (BotoCoreError, ClientError) as exc:
        # If we can't reach the analyzer, silently skip (don't block the scan)
        return [{
            "id": "IAM-ERR",
            "title": "IAM Access Analyzer Unavailable",
            "severity": "LOW",
            "category": "Tooling",
            "cwe": None,
            "description": f"Could not reach AWS IAM Access Analyzer: {exc}. Proceeding with LLM-only analysis.",
            "fix": "Ensure your AWS credentials have 'access-analyzer:ValidatePolicy' permission.",
        }]

    findings = response.get("findings", [])
    if not findings:
        return []

    vulnerabilities: list[dict] = []
    for i, finding in enumerate(findings, start=1):
        finding_type: str = finding.get("findingType", "WARNING")
        issue_code: str = finding.get("issueCode", "UNKNOWN")
        details: str = finding.get("findingDetails", "No details provided.")
        learn_more: str = finding.get("learnMoreLink", "")
        locations: list = finding.get("locations", [])
        
        # Try to extract a line number from location info
        line_num = None
        if locations:
            span = locations[0].get("span", {})
            line_num = span.get("start", {}).get("line")

        severity = _FINDING_TYPE_TO_SEVERITY.get(finding_type, "MEDIUM")
        cwe = _CWE_MAP.get(finding_type)

        fix_text = (
            f"Remediate this IAM policy finding: {details}\n"
            f"Issue code: {issue_code}\n"
        )
        if learn_more:
            fix_text += f"Learn more: {learn_more}"

        vulnerabilities.append({
            "id": f"IAM-{i:03d}",
            "title": f"IAM Policy Issue: {issue_code.replace('_', ' ').title()}",
            "severity": severity,
            "line": line_num,
            "category": "IAM Policy",
            "cwe": cwe,
            "description": details,
            "fix": fix_text,
        })

    return vulnerabilities


def validate_policies_from_list(policies: list[dict]) -> list[dict]:
    """
    Validate multiple extracted IAM policies and merge all findings.
    """
    all_findings: list[dict] = []
    for policy in policies:
        findings = validate_iam_policy(policy)
        all_findings.extend(findings)
    return all_findings
