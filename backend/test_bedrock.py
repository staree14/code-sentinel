import boto3
import json

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

body = json.dumps({
    "anthropic_version": "bedrock-2023-05-31",
    "max_tokens": 1000,
    "messages": [{"role": "user", "content": "Say hello!"}],
    "temperature": 1.0
})

response = bedrock.invoke_model(
    modelId='anthropic.claude-3-haiku-20240307-v1:0',
    body=body
)

result = json.loads(response['body'].read())
print(result['content'][0]['text'])