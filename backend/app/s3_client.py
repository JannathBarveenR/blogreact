import os
import boto3
import uuid
import mimetypes
from botocore.config import Config
from botocore.exceptions import NoCredentialsError, ClientError

# Load and sanitize env vars
AWS_ACCESS_KEY_ID = (os.getenv("AWS_ACCESS_KEY_ID") or "").strip()
AWS_SECRET_ACCESS_KEY = (os.getenv("AWS_SECRET_ACCESS_KEY") or "").strip()
AWS_REGION = (os.getenv("AWS_REGION") or "ap-south-1").strip()

AWS_AVATARS_BUCKET = (os.getenv("AWS_AVATARS_BUCKET") or "petolife-avatars-141927126120-ap-south-1-an").strip()
AWS_PET_PHOTOS_BUCKET = (os.getenv("AWS_PET_PHOTOS_BUCKET") or "petolife-pet-photos-141927126120-ap-south-1-an").strip()
AWS_MEDICAL_DOCS_BUCKET = (os.getenv("AWS_MEDICAL_DOCS_BUCKET") or "petolife-medical-docs-141927126120-ap-south-1-an").strip()
def get_feedback_bucket() -> str:
    """Returns the validated S3 bucket name for feedback screenshots."""
    env_val = (os.getenv("AWS_FEEDBACKS_BUCKET") or "").strip()
    if env_val and env_val != "feedbacks" and "petolife-feedbacks" not in env_val:
        return env_val
    return "feed-back-petolife"

AWS_FEEDBACKS_BUCKET = get_feedback_bucket()


def get_s3_client():
    """
    Initializes and returns a boto3 S3 client configured for ap-south-1.
    Configured with strict timeouts so EC2 metadata / network issues fail quickly
    instead of hanging, and dynamically refreshes IAM role credentials.
    """
    region = AWS_REGION or "ap-south-1"
    config = Config(
        region_name=region,
        signature_version="s3v4",
        s3={"addressing_style": "virtual"},
        connect_timeout=5,
        read_timeout=15,
        retries={"max_attempts": 2, "mode": "standard"}
    )
    kwargs = {
        "region_name": region,
        "config": config
    }
    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        kwargs["aws_access_key_id"] = AWS_ACCESS_KEY_ID
        kwargs["aws_secret_access_key"] = AWS_SECRET_ACCESS_KEY

    return boto3.client("s3", **kwargs)


def upload_public_file(file_bytes: bytes, bucket: str, filename: str, content_type: str) -> str:
    """Uploads a file to a public S3 bucket and returns the public URL."""
    try:
        client = get_s3_client()
        client.put_object(
            Bucket=bucket,
            Key=filename,
            Body=file_bytes,
            ContentType=content_type
        )
        url = f"https://{bucket}.s3.{AWS_REGION}.amazonaws.com/{filename}"
        return url
    except Exception as e:
        print(f"[S3 Error] Public upload failed for {filename} in bucket {bucket}: {e}")
        raise Exception(f"S3 Upload failed: {str(e)}")


def upload_private_file(file_bytes: bytes, bucket: str, filename: str, content_type: str) -> str:
    """Uploads a file to a private S3 bucket and returns the storage path/key."""
    try:
        client = get_s3_client()
        client.put_object(
            Bucket=bucket,
            Key=filename,
            Body=file_bytes,
            ContentType=content_type
        )
        return filename  # Return the object key (path) instead of a public URL
    except Exception as e:
        print(f"[S3 Error] Private upload failed for {filename} in bucket {bucket}: {e}")
        raise Exception(f"S3 Upload failed: {str(e)}")


def delete_file(bucket: str, filename: str):
    """Deletes a file from an S3 bucket."""
    try:
        client = get_s3_client()
        client.delete_object(Bucket=bucket, Key=filename)
    except Exception as e:
        print(f"[S3 Error] Error deleting {filename} from {bucket}: {e}")


def get_presigned_url(bucket: str, filename: str, expiration: int = 3600) -> str:
    """Generates a secure, temporary presigned URL for viewing a private file."""
    try:
        client = get_s3_client()
        url = client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': filename},
            ExpiresIn=expiration
        )
        return url
    except ClientError as e:
        print(f"[S3 Error] Presigned URL generation failed for {filename}: {e}")
        return ""
    except Exception as e:
        print(f"[S3 Error] Presigned URL generation unexpected error for {filename}: {e}")
        return ""


def process_upload_image_bytes(file_bytes: bytes, filename: str, content_type: str = "") -> tuple[bytes, str, str]:
    """
    Processes uploaded image bytes. Automatically converts HEIC/HEIF images (from iOS/Mac)
    into standard web-compatible JPEGs using pillow-heif and Pillow.
    Returns (processed_bytes, formatted_filename, content_type).
    """
    ext = (filename.split(".")[-1] if "." in filename else "").lower()
    ct = (content_type or "").lower()

    is_heic = ext in ["heic", "heif"] or "heic" in ct or "heif" in ct

    if is_heic:
        try:
            import pillow_heif
            from PIL import Image
            import io

            pillow_heif.register_heif_opener()
            image = Image.open(io.BytesIO(file_bytes))

            if image.mode != "RGB":
                image = image.convert("RGB")

            output_io = io.BytesIO()
            image.save(output_io, format="JPEG", quality=88)

            base_name = filename.rsplit(".", 1)[0] if "." in filename else filename
            new_filename = f"{base_name}.jpg"
            print(f"[Image Processor] Converted HEIC image '{filename}' to JPEG '{new_filename}'")
            return output_io.getvalue(), new_filename, "image/jpeg"
        except Exception as e:
            print(f"[Image Processor] HEIC conversion warning for '{filename}': {e}")

    return file_bytes, filename, content_type or "image/jpeg"


def resolve_feedback_image_urls(image_urls) -> dict:
    """
    Resolves image URLs or object keys stored in database into valid presigned S3 URLs
    so browsers can display them without HTTP 403 Forbidden errors.
    """
    if not image_urls:
        return {}

    import json
    parsed_dict = {}
    if isinstance(image_urls, str):
        try:
            parsed_dict = json.loads(image_urls)
        except Exception:
            return {}
    elif isinstance(image_urls, dict):
        parsed_dict = image_urls

    resolved = {}
    bucket = get_feedback_bucket()

    for key, val in parsed_dict.items():
        if not val or not isinstance(val, str):
            continue
        
        # Extract filename / key if full URL was stored
        if "amazonaws.com/" in val:
            file_key = val.split("amazonaws.com/")[-1].split("?")[0]
        else:
            file_key = val

        # Generate 7-day presigned URL
        presigned = get_presigned_url(bucket, file_key, expiration=604800)
        resolved[key] = presigned if presigned else val

    return resolved

