import re
import json
import os

# -------- FILE PARSER -------- #
def parse_file(file_path):
    """
    Reads a file and detects its security analysis type.
    Returns: tuple (file_path, content, type)
    """
    if not os.path.exists(file_path):
        return None

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    ext = os.path.splitext(file_path)[1].lower()
    
    if ext in [".py", ".js"]:
        file_type = "application code"
    elif ext == ".json":
        file_type = "IAM policies"
    elif ext == ".tf":
        file_type = "Terraform/IaC"
    else:
        file_type = "unknown"

    return (file_path, content, file_type)

# -------- CODE ANALYZER -------- #
def analyze_code(content):
    issues = []

    if re.search(r'password\s*=\s*["\'].*["\']', content, re.IGNORECASE):
        issues.append({
            "id": "L-001",
            "title": "Hardcoded password",
            "severity": "HIGH",
            "category": "Secrets Management",
            "cwe": "CWE-798",
            "description": "Hardcoded credentials can easily be leaked through source code version control.",
            "fix": "Use environment variables or AWS Secrets Manager."
        })

    if re.search(r'api[_-]?key\s*=\s*["\'].*["\']', content.lower()):
        issues.append({
            "id": "L-002",
            "title": "Hardcoded API key",
            "severity": "HIGH",
            "category": "Secrets Management",
            "cwe": "CWE-798",
            "description": "Exposing API keys in source code allows unauthorized access to services.",
            "fix": "Store secrets securely in an encrypted vault."
        })

    if re.search(r"(SELECT|INSERT|UPDATE|DELETE).*[\+].*", content, re.IGNORECASE):
        issues.append({
            "id": "L-003",
            "title": "Possible SQL Injection",
            "severity": "HIGH",
            "category": "Injection",
            "cwe": "CWE-89",
            "description": "User input is directly concatenated into a query, allowing attackers to modify the SQL command.",
            "fix": "Use parameterized queries or ORM models instead of string concatenation."
        })

    if "jwt" in content.lower() and ("secret" in content.lower() or "key" in content.lower()):
        issues.append({
            "id": "L-004",
            "title": "Hardcoded JWT secret",
            "severity": "HIGH",
            "category": "Cryptography",
            "cwe": "CWE-321",
            "description": "A hardcoded JWT secret allows anyone with access to the code to forge authentication tokens.",
            "fix": "Store JWT signing keys in a secure environment variable."
        })

    if "eval(" in content:
        issues.append({
            "id": "L-005",
            "title": "Use of eval()",
            "severity": "CRITICAL",
            "category": "Injection",
            "cwe": "CWE-95",
            "description": "eval() executes raw strings as code, presenting a massive security risk if the input is untrusted.",
            "fix": "Avoid eval() entirely; use safer alternatives like JSON parsing."
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
                "id": "L-101",
                "title": "Overly permissive IAM action",
                "severity": "CRITICAL",
                "category": "Access Control",
                "cwe": "CWE-200",
                "description": "Wildcard actions allow broad permissions that violate the principle of least privilege.",
                "fix": "Restrict IAM actions to specific API calls."
            })

        if "*" in str(resources):
            issues.append({
                "id": "L-102",
                "title": "Wildcard resource access",
                "severity": "HIGH",
                "category": "Access Control",
                "cwe": "CWE-200",
                "description": "Providing access to all resources (*) can lead to unauthorized data exposure.",
                "fix": "Limit resource scope to specific ARNs."
            })

    except:
        issues.append({
            "id": "L-103",
            "title": "Invalid IAM JSON",
            "severity": "HIGH",
            "category": "Syntax",
            "fix": "Check IAM policy JSON syntax."
        })

    return issues

# -------- TERRAFORM ANALYZER -------- #
def analyze_terraform(content):
    issues = []

    if "0.0.0.0/0" in content:
        issues.append({
            "id": "L-201",
            "title": "Open security group",
            "severity": "CRITICAL",
            "category": "Infrastructure",
            "cwe": "CWE-200",
            "description": "Security groups open to 0.0.0.0/0 allow traffic from the entire internet.",
            "fix": "Restrict IP ranges to specific CIDR blocks or internal networks."
        })

    if "aws_s3_bucket" in content and ("acl" in content.lower() or "public" in content.lower()):
        issues.append({
            "id": "L-202",
            "title": "Potential public S3 bucket",
            "severity": "CRITICAL",
            "category": "Storage",
            "cwe": "CWE-200",
            "description": "S3 buckets with public ACLs can lead to data leaks and mass exfiltration.",
            "fix": "Enable block public access settings and use private ACLs."
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