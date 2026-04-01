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
# Vulnerable code example 1: SQL Injection
vulnerable_code_1 = '''
def get_user(username):
    query = "SELECT * FROM users WHERE username = '" + username + "'"
    cursor.execute(query)
    return cursor.fetchone()
'''

# Vulnerable code example 2: Hardcoded credentials
vulnerable_code_2 = '''
DATABASE_PASSWORD = "supersecret123"
API_KEY = "sk-1234567890abcdef"

def connect_db():
    return psycopg2.connect(
        host="localhost",
        password=DATABASE_PASSWORD
    )
'''

# Vulnerable code example 3: Weak cryptography
vulnerable_code_3 = '''
import hashlib

def hash_password(password):
    return hashlib.md5(password.encode()).hexdigest()
'''


# Ask Gemini to analyze it
security_prompt = """
You are a security expert. Analyze this code for vulnerabilities.

For each issue, provide:
1. Vulnerability type
2. Why it's vulnerable (1 sentence)
3. Impact (1 sentence)
4. Secure code fix

Be concise.

Code:
{code}
"""

# Test with SQL injection example
print("=" * 50)
print("Analyzing SQL Injection Example...")
print("=" * 50)

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=security_prompt.format(code=vulnerable_code_1)
)
print(response.text)

# Test with hardcoded credentials
print("\n" + "=" * 50)
print("Analyzing Hardcoded Credentials Example...")
print("=" * 50)

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=security_prompt.format(code=vulnerable_code_2)
)
print(response.text)

# Test with weak cryptography
print("\n" + "=" * 50)
print("Analyzing Weak Cryptography Example...")
print("=" * 50)

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=security_prompt.format(code=vulnerable_code_3)
)
print(response.text)

