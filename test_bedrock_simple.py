import boto3
import os
from dotenv import load_dotenv

load_dotenv()

bedrock = boto3.client(
    'bedrock-runtime',
    region_name='us-east-1',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

def test():
    try:
        model_id = "amazon.nova-lite-v1:0"
        messages = [
            {
                "role": "user",
                "content": [{"text": "Hello, are you working?"}]
            }
        ]
        response = bedrock.converse(
            modelId=model_id,
            messages=messages
        )
        print("Success!")
        print(response['output']['message']['content'][0]['text'])
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    test()
