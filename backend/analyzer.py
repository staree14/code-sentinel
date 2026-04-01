import re
import json

# -------- CODE ANALYZER -------- #
def analyze_code(content):
    issues = []

    if re.search(r'password\s*=\s*["\'].*["\']', content, re.IGNORECASE):
        issues.append({
            "issue": "Hardcoded password",
            "severity": "HIGH",
            "fix": "Use environment variables"
        })

    if re.search(r'api[_-]?key\s*=\s*["\'].*["\']', content.lower()):
        issues.append({
            "issue": "Hardcoded API key",
            "severity": "HIGH",
            "fix": "Store secrets securely"
        })

    if re.search(r"(SELECT|INSERT|UPDATE|DELETE).*[\+].*", content, re.IGNORECASE):
        issues.append({
            "issue": "Possible SQL Injection",
            "severity": "HIGH",
            "fix": "Use parameterized queries instead of string concatenation"
        })

    if "jwt" in content.lower() and ("secret" in content.lower() or "key" in content.lower()):
        issues.append({
            "issue": "Hardcoded JWT secret",
            "severity": "HIGH",
            "fix": "Store JWT secrets securely"
        })

    if "eval(" in content:
        issues.append({
            "issue": "Use of eval()",
            "severity": "CRITICAL",
            "fix": "Avoid eval()"
        })

    return issues

# -------- IAM ANALYZER -------- #
def analyze_iam(content):
    issues = []

    try:
        policy = json.loads(content)
        actions = policy.get("Action", "")
        resources = policy.get("Resource", "")

        if "*" in str(actions):
            issues.append({
                "issue": "Overly permissive IAM action",
                "severity": "CRITICAL",
                "fix": "Restrict IAM actions to least privilege"
            })

        if "*" in str(resources):
            issues.append({
                "issue": "Wildcard resource access",
                "severity": "HIGH",
                "fix": "Limit resource scope"
            })

    except:
        issues.append({
            "issue": "Invalid IAM JSON",
            "severity": "HIGH",
            "fix": "Check IAM policy syntax"
        })

    return issues

# -------- TERRAFORM ANALYZER -------- #
def analyze_terraform(content):
    issues = []

    if "0.0.0.0/0" in content:
        issues.append({
            "issue": "Open security group",
            "severity": "CRITICAL",
            "fix": "Restrict IP ranges"
        })

    if "aws_s3_bucket" in content and ("acl" in content.lower() or "public" in content.lower()):
        issues.append({
            "issue": "Potential public S3 bucket",
            "severity": "CRITICAL",
            "fix": "Enable block public access and restrict ACL"
        })

    return issues

# -------- ROUTER -------- #
def analyze(content, file_path):
    if file_path.endswith((".py", ".js")):
        issues = analyze_code(content)
    elif file_path.endswith(".json"):
        issues = analyze_iam(content)
    elif file_path.endswith(".tf"):
        issues = analyze_terraform(content)
    else:
        issues = []

    return {
        "issues": issues,
        "total": len(issues),
        "risk_score": min(len(issues) * 2, 10)
    }