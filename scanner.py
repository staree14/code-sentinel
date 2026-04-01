# scanner.py
import os
from dotenv import load_dotenv
from google import genai  # your Gemini client
from backend.analyzer import analyze, parse_file  # local analyzer

# Load environment variables from .env
load_dotenv()
client = genai.Client()

# Toggle between local analyzer or Gemini LLM
USE_LLM = False  # set True to use Gemini
GEMINI_MODEL = 'gemini-2.0-flash'  # Use a valid model name (Updated to 2.0)

# Path to test samples folder
SAMPLES_FOLDER = "backend/test_samples"

def run_analysis(file_path, use_llm=False):
    file_data = parse_file(file_path)
    if not file_data:
        print(f"{file_path} not found or unreadable. Skipping.")
        return

    path, content, file_type = file_data

    if use_llm:
        print(f"\n--- [LLM] Analyzing {path} ({file_type}) ---")
        security_prompt = f"""
        You are a security expert. Analyze this code for vulnerabilities.

        For each issue, provide:
        1. Vulnerability type
        2. Why it's vulnerable (1 sentence)
        3. Impact (1 sentence)
        4. Secure code fix

        Be concise.

        Code:
        {content}
        """
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=security_prompt
            )
            print(f"\n--- LLM Analysis for {file_path} ---")
            print(response.text)
        except Exception as e:
            print(f"Error calling Gemini: {str(e)}")

    else:
        result = analyze(content, path)
        print(f"\n--- [LOCAL] Analyzing {path} ({file_type}) ---")
        print(f"Total Issues: {result['total']}")
        print(f"Risk Score: {result['risk_score']}")
        if result['total'] == 0:
            print("No vulnerabilities found!")
        for issue in result['issues']:
            print(f"- {issue['issue']} [{issue['severity']}]: {issue['fix']}")

# Scan all files in the test_samples folder
if os.path.exists(SAMPLES_FOLDER):
    for file_name in os.listdir(SAMPLES_FOLDER):
        file_path = os.path.join(SAMPLES_FOLDER, file_name)
        if os.path.isfile(file_path):
            run_analysis(file_path, use_llm=USE_LLM)
else:
    print(f"Samples folder not found: {SAMPLES_FOLDER}")