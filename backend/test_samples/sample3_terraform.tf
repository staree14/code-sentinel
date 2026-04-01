# sample3_terraform.tf

provider "aws" {
  region = "us-east-1"
}

# Open Security Group (0.0.0.0/0)
resource "aws_security_group" "insecure_sg" {
  name        = "insecure_sg"
  description = "Allow all inbound traffic"
  vpc_id      = "vpc-123456"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # ❌ SECURITY RISK
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # ❌ SECURITY RISK
  }
}

# Public S3 Bucket
resource "aws_s3_bucket" "public_bucket" {
  bucket = "my-public-bucket"
  acl    = "public-read" # ❌ SECURITY RISK
}

# Missing encryption (optional, additional risk)
resource "aws_s3_bucket_server_side_encryption_configuration" "sse" {
  bucket = aws_s3_bucket.public_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "" # ❌ Encryption not set
    }
  }
}