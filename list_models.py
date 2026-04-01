from google import genai
import os
from dotenv import load_dotenv

load_dotenv()
client = genai.Client()

try:
    for model in client.models.list():
        print(model.name)
except Exception as e:
    print(f"Error: {e}")
