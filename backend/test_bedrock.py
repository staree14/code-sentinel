import boto3

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

model_id = "amazon.nova-lite-v1:0"

messages = [{
    "role": "user",
    "content": [{"text": "Hello Nova! fix this security issue in my code: 'passowrd= admin123'?"}]
}]

print(f"Testing model: {model_id}...")

try:
    # Using the modern converse API which works seamlessly for Nova models
    response = bedrock.converse(
        modelId=model_id,
        messages=messages
    )
    print("\nSUCCESS! Nova says:\n")
    print(response['output']['message']['content'][0]['text'])
except Exception as e:
    print(f"\nERROR: {e}")