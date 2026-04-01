import boto3
import json

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

def test_nova():
    model_id = "amazon.nova-lite-v1:0"
    messages = [{
        "role": "user",
        "content": [{"text": "Hello Nova! fix this security issue in my code: 'passowrd= admin123'?"}]
    }]
    print(f"Testing model: {model_id}...")
    try:
        response = bedrock.converse(
            modelId=model_id,
            messages=messages
        )
        print("\nSUCCESS! Nova says:\n")
        print(response['output']['message']['content'][0]['text'])
    except Exception as e:
        print(f"\nERROR: {e}")

def test_claude():
    print("\nTesting Claude...")
    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1000,
        "messages": [{"role": "user", "content": "Say hello!"}],
        "temperature": 1.0
    })
    try:
        response = bedrock.invoke_model(
            modelId='anthropic.claude-3-haiku-20240307-v1:0',
            body=body
        )
        result = json.loads(response['body'].read())
        print(result['content'][0]['text'])
    except Exception as e:
        print(f"\nERROR: {e}")

if __name__ == "__main__":
    test_nova()
    test_claude()
