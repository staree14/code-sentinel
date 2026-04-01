import json
import boto3
import os
import re

# Use us-east-1 for Bedrock availability
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

def load_security_rules():
    """Load the JSON rules from the teammate's rules engine."""
    rules_path = os.path.join(os.path.dirname(__file__), "security_rules.json")
    try:
        with open(rules_path, 'r') as f:
            return f.read()
    except FileNotFoundError:
        return "{}"

def scan_code(code_text: str) -> list:
    """
    Sends the provided code directly to AWS Bedrock along with the system 
    security rules context to scan for vulnerabilities.
    """
    rules_context = load_security_rules()

    # The prompt instructs the model to return specifically formatted JSON.
    system_prompt = f"""
    You are an AI Security Agent for CodeSentinel. 
    Analyze the following code snippet, Infrastructure as Code (IaC) template, or IAM policy.
    Identify any security vulnerabilities.
    
    Here are the specific rules you should be checking against (but you may also use your own security intuition):
    {rules_context}
    
    CRITICAL: YOU MUST ONLY RETURN A RAW JSON ARRAY. DO NOT RETURN ANY MARKDOWN FORMATTING, EXPLANATION, OR BACKTICKS. JUST THE JSON TEXT.
    IF NO VULNERABILITIES ARE FOUND, RETURN AN EMPTY ARRAY: []
    
    Each vulnerability in the array MUST follow this exact schema:
    [
      {{
        "id": "V-001",
        "title": "Descriptive title of the issue",
        "severity": "CRITICAL, HIGH, MEDIUM, or LOW",
        "line": 10,
        "category": "e.g. Injection, Secrets Management, etc.",
        "cwe": "CWE-XXX",
        "description": "Short explanation of the risk",
        "original_snippet": "The EXACT piece of code that is vulnerable (needed for replacement)",
        "fixed_snippet": "The CORRECTED piece of code to replace the original_snippet with",
        "fix": "Actionable advice or a specific code snippet explanation"
      }}
    ]

    IMPORTANT: For 'original_snippet' and 'fixed_snippet', ONLY focus on the specific vulnerability mentioned in that JSON object. Do NOT fix other vulnerabilities in these fields.
    """
    
    model_id = "amazon.nova-lite-v1:0"
    
    messages = [
        {
            "role": "user",
            "content": [{"text": f"Here is the code to scan:\n\n{code_text}"}]
        }
    ]
    
    system_message = [{"text": system_prompt}]

    try:
        response = bedrock.converse(
            modelId=model_id,
            messages=messages,
            system=system_message
        )
        
        output_text = response['output']['message']['content'][0]['text']
        
        # More robust extraction: find the first '[' and last ']' to extract the JSON array
        json_match = re.search(r'\[.*\]', output_text, re.DOTALL)
        if json_match:
            clean_json = json_match.group(0)
        else:
            # Fallback to the original logic if no array found
            clean_json = re.sub(r'^```[a-z]*\s*', '', output_text.strip(), flags=re.IGNORECASE)
            clean_json = re.sub(r'\s*```$', '', clean_json)
        
        try:
            vulns = json.loads(clean_json)
            if not isinstance(vulns, list):
                # If they returned an object instead of list
                return [vulns]
            return vulns
        except json.JSONDecodeError as de:
            return [{
                "id": "SCAN_ERR",
                "title": "Error parsing JSON from Bedrock LLM",
                "severity": "CRITICAL",
                "description": "The AI provided a response that couldn't be parsed as a structured report.",
                "fix": "Please try scanning again.",
                "original_snippet": None,
                "fixed_snippet": None,
                "raw_debug": output_text[:1000] # for debugging
            }]
            
    except Exception as e:
        raise Exception(f"Failed to communicate with AWS Bedrock: {str(e)}")
