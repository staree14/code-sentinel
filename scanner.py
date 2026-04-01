# scanner.py
import os
from dotenv import load_dotenv
from google import genai  # your Gemini client
from backend.analyzer import analyze  # local analyzer

# Load environment variables from .env
load_dotenv()
client = genai.Client()

# Toggle between local analyzer or Gemini LLM
USE_LLM = False  # set True to use Gemini
GEMINI_MODEL = 'gemini-1.5-flash'  # Use a valid model name

# Path to test samples folder
SAMPLES_FOLDER = "backend/test_samples"

def run_analysis(file_path, use_llm=False):
    if not os.path.exists(file_path):
        print(f"{file_path} not found. Skipping.")
        return

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    if use_llm:
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
        result = analyze(content, file_path)
        print(f"\n--- Local Analysis for {file_path} ---")
        print(f"Total Issues: {result['total']}")
        print(f"Risk Score: {result['risk_score']}")
        if result['total'] == 0:
            print("No vulnerabilities found!")
        for issue in result['issues']:
            print(f"- {issue['issue']} [{issue['severity']}]: {issue['fix']}")

# Scan all files in the test_samples folder
for file_name in os.listdir(SAMPLES_FOLDER):
    file_path = os.path.join(SAMPLES_FOLDER, file_name)
    run_analysis(file_path, use_llm=USE_LLM)