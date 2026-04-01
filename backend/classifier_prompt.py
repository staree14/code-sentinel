def classify_input(text: str) -> dict:
    
    text_lower = text.lower()
    tokens = text.split()
    token_count = len(tokens)
    
    # ── STEP 1: detect input TYPE ──────────────────
    
    code_signals = [
        "def ", "import ", "class ", "return ",
        "function ", "const ", "var ", "let ",
        "SELECT ", "INSERT ", "<?php",
        "#!/", ".py", ".js", ".ts"
    ]
    
    iac_signals = [
        "resource ", "aws_", "terraform",
        "cloudformation", "AWSTemplateFormatVersion",
        "Properties:", "Type: AWS::",
        "provider ", ".tf", ".yaml", ".yml"
    ]
    
    iam_signals = [
        '"Action"', '"Effect"', '"Resource"',
        '"Statement"', "iam:", "s3:", "ec2:",
        "PassRole", "AssumeRole", "arn:aws"
    ]
    
    general_signals = [
        "what is", "explain", "how does",
        "define", "tell me", "what does",
        "can you", "help me understand"
    ]
    
    # score each type
    code_score = sum(1 for s in code_signals if s in text)
    iac_score = sum(1 for s in iac_signals if s in text_lower)
    iam_score = sum(1 for s in iam_signals if s in text)
    general_score = sum(1 for s in general_signals if s in text_lower)
    
    # pick the winning type
    scores = {
        "code": code_score,
        "iac": iac_score,
        "iam": iam_score,
        "general": general_score
    }
    input_type = max(scores, key=scores.get)
    
    # if all scores are 0, default to general
    if all(v == 0 for v in scores.values()):
        input_type = "general"
    
    
    # ── STEP 2: detect SECURITY RISK ───────────────
    
    critical_patterns = [
        "password", "secret", "api_key", "token",
        "private_key", "aws_secret", "hardcoded",
        "0.0.0.0/0", "Action.*\\*", "public-read",
        "PubliclyAccessible.*true", "encrypted.*false",
        "DEBUG.*True", "passwd", "credential"
    ]
    
    high_risk_patterns = [
        "iam", "policy", "role", "permission",
        "s3", "bucket", "security group", "vpc",
        "database", "rds", "admin", "root",
        "execute", "eval(", "innerHTML",
        "dangerouslySetInnerHTML", "shell=True"
    ]
    
    import re
    critical_hits = sum(
        1 for p in critical_patterns 
        if re.search(p, text, re.IGNORECASE)
    )
    high_risk_hits = sum(
        1 for p in high_risk_patterns 
        if p.lower() in text_lower
    )
    
    # calculate risk score out of 10
    risk_score = min(10, (critical_hits * 3) + (high_risk_hits * 1))
    
    
    # ── STEP 3: detect COMPLEXITY ──────────────────
    
    if token_count < 30 and input_type == "general":
        complexity = "simple"
    elif token_count > 200 or input_type in ["code", "iac", "iam"]:
        complexity = "complex"
    else:
        complexity = "moderate"
    
    
    # ── STEP 4: routing decision ───────────────────
    
    # model costs per 1k tokens (approximate)
    MODEL_COSTS = {
        "claude-3-haiku":  0.00025,
        "claude-3-sonnet": 0.003,
        "amazon-titan":    0.0008
    }
    
    if risk_score >= 3 or input_type in ["code", "iac", "iam"]:
        model = "claude-3-sonnet"
        route = "security_agent"
        reason = f"security-sensitive ({input_type} with risk score {risk_score}/10)"
    elif complexity == "simple":
        model = "amazon-titan"
        route = "simple_model"
        reason = "simple general query"
    else:
        model = "claude-3-haiku"
        route = "general_agent"
        reason = "moderate complexity, non-security query"
    
    # calculate cost saved vs always using sonnet
    estimated_tokens = token_count * 1.3
    actual_cost = (estimated_tokens / 1000) * MODEL_COSTS[model]
    sonnet_cost = (estimated_tokens / 1000) * MODEL_COSTS["claude-3-sonnet"]
    cost_saved = round(sonnet_cost - actual_cost, 6)
    
    return {
        "input_type": input_type,
        "complexity": complexity,
        "risk_score": risk_score,          # 0-10
        "risk_level": (
            "CRITICAL" if risk_score >= 7 else
            "HIGH"     if risk_score >= 4 else
            "MEDIUM"   if risk_score >= 2 else
            "LOW"
        ),
        "route": route,
        "model": model,
        "reason": reason,
        "cost_saved_usd": cost_saved,
        "token_count": token_count
    }
