"""
services/bedrock.py
Thin wrapper around boto3 for invoking Amazon Nova models.
Uses the Nova native JSON body structure (messages + inferenceConfig).
"""

import json
import os

import boto3
from botocore.exceptions import BotoCoreError, ClientError


# ── Client factory (lazy singleton per process) ────────────────────────────────

_client = None  # module-level cache


def _get_client():
    global _client
    if _client is None:
        _client = boto3.client(
            service_name="bedrock-runtime",
            region_name=os.getenv("AWS_REGION", "us-east-1"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        )
    return _client


# ── Public API ─────────────────────────────────────────────────────────────────

def invoke_nova(prompt: str, model_id: str) -> str:
    """
    Send *prompt* to the specified Amazon Nova model via Bedrock.

    Parameters
    ----------
    prompt   : The user message text.
    model_id : A valid Nova model ID, e.g. "amazon.nova-pro-v1:0".

    Returns
    -------
    The generated text string from the model.

    Raises
    ------
    RuntimeError if the Bedrock call fails.
    """
    # Amazon Nova native request body
    body = json.dumps(
        {
            "messages": [
                {
                    "role": "user",
                    "content": [{"text": prompt}],
                }
            ],
            "inferenceConfig": {
                "maxTokens": 1024,
                "temperature": 0.7,
                "topP": 0.9,
            },
        }
    )

    try:
        client = _get_client()
        response = client.invoke_model(
            modelId=model_id,
            body=body,
            contentType="application/json",
            accept="application/json",
        )
        result = json.loads(response["body"].read())
        return result["output"]["message"]["content"][0]["text"]

    except (BotoCoreError, ClientError) as exc:
        raise RuntimeError(f"Bedrock invocation failed: {exc}") from exc