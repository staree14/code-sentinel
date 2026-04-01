import os
import json
import boto3
from botocore.exceptions import ClientError
from datetime import datetime

# Bucket configuration from .env is handled via boto3 default session
BUCKET_NAME = "sam-first-s3-bucket1012"
REGION = "us-east-1"

s3_client = boto3.client(
    "s3",
    region_name=REGION,
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

def upload_to_s3(key, data):
    """Uploads a dictionary as JSON to S3."""
    try:
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=key,
            Body=json.dumps(data, indent=2),
            ContentType="application/json"
        )
        return True
    except ClientError as e:
        print(f"Error uploading to S3: {e}")
        return False

def get_from_s3(key):
    """Fetches a JSON object from S3 and returns a dictionary."""
    try:
        response = s3_client.get_object(Bucket=BUCKET_NAME, Key=key)
        content = response["Body"].read().decode("utf-8")
        return json.loads(content)
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            return None
        print(f"Error getting from S3: {e}")
        return None

def list_s3_objects(prefix):
    """Lists keys in S3 with a given prefix."""
    try:
        response = s3_client.list_objects_v2(Bucket=BUCKET_NAME, Prefix=prefix)
        if "Contents" not in response:
            return []
        return [obj["Key"] for obj in response["Contents"]]
    except ClientError as e:
        print(f"Error listing from S3: {e}")
        return []

def log_analysis(analysis_data):
    """Logs an analysis result with the required path: logs/YYYY-MM-DD/<timestamp>.json"""
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    timestamp = now.strftime("%H-%M-%S-%f")
    key = f"logs/{date_str}/{timestamp}.json"
    
    log_entry = {
        "timestamp": now.isoformat(),
        **analysis_data
    }
    return upload_to_s3(key, log_entry)
