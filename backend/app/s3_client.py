import os
import boto3
import uuid
import mimetypes
from botocore.exceptions import NoCredentialsError, ClientError

# Load from env
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")

AWS_AVATARS_BUCKET = os.getenv("AWS_AVATARS_BUCKET")
AWS_PET_PHOTOS_BUCKET = os.getenv("AWS_PET_PHOTOS_BUCKET")
AWS_MEDICAL_DOCS_BUCKET = os.getenv("AWS_MEDICAL_DOCS_BUCKET")

# Fallbacks if env vars are missing (useful during testing if not set)
if not AWS_AVATARS_BUCKET:
    AWS_AVATARS_BUCKET = "petolife-avatars-141927126120-ap-south-1-an"
if not AWS_PET_PHOTOS_BUCKET:
    AWS_PET_PHOTOS_BUCKET = "petolife-pet-photos-141927126120-ap-south-1-an"
if not AWS_MEDICAL_DOCS_BUCKET:
    AWS_MEDICAL_DOCS_BUCKET = "petolife-medical-docs-141927126120-ap-south-1-an"


def get_s3_client():
    """Initializes and returns a boto3 S3 client."""
    # If using IAM Roles in production (EC2/ECS), boto3 automatically handles credentials
    # when access keys are not provided.
    kwargs = {"region_name": AWS_REGION}
    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        kwargs["aws_access_key_id"] = AWS_ACCESS_KEY_ID
        kwargs["aws_secret_access_key"] = AWS_SECRET_ACCESS_KEY
    
    return boto3.client("s3", **kwargs)

s3_client = get_s3_client()


def upload_public_file(file_bytes: bytes, bucket: str, filename: str, content_type: str) -> str:
    """Uploads a file to a public S3 bucket and returns the public URL."""
    try:
        s3_client.put_object(
            Bucket=bucket,
            Key=filename,
            Body=file_bytes,
            ContentType=content_type
        )
        url = f"https://{bucket}.s3.{AWS_REGION}.amazonaws.com/{filename}"
        return url
    except Exception as e:
        print(f"[S3 Error] Upload failed for {filename}: {e}")
        raise Exception(f"S3 Upload failed: {str(e)}")


def upload_private_file(file_bytes: bytes, bucket: str, filename: str, content_type: str) -> str:
    """Uploads a file to a private S3 bucket and returns the storage path/key."""
    try:
        s3_client.put_object(
            Bucket=bucket,
            Key=filename,
            Body=file_bytes,
            ContentType=content_type
        )
        return filename  # Return the object key (path) instead of a public URL
    except Exception as e:
        print(f"[S3 Error] Upload failed for {filename}: {e}")
        raise Exception(f"S3 Upload failed: {str(e)}")


def delete_file(bucket: str, filename: str):
    """Deletes a file from an S3 bucket."""
    try:
         s3_client.delete_object(Bucket=bucket, Key=filename)
    except Exception as e:
         print(f"[S3 Error] Error deleting {filename} from {bucket}: {e}")


def get_presigned_url(bucket: str, filename: str, expiration: int = 3600) -> str:
    """Generates a secure, temporary presigned URL for viewing a private file."""
    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': filename},
            ExpiresIn=expiration
        )
        return url
    except ClientError as e:
        print(f"[S3 Error] Presigned URL generation failed: {e}")
        return ""
