import os
from dotenv import load_dotenv
from google import genai

# Load environment variables from .env file
load_dotenv()

# The new client automatically grabs GOOGLE_API_KEY from your .env!
client = genai.Client()

# ============================================================
# YOUR CODE GOES BELOW HERE
# ============================================================

# Test code with a security vulnerability
test_code = '''
password = "admin123"
'''

# Ask Gemini to analyze it
prompt = f"Analyze this code for security issues:\n{test_code}"

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=prompt
)


print(response.text)
