import os
from pathlib import Path
from functools import lru_cache
import boto3
from botocore.exceptions import ClientError
from botocore.client import Config
from ..config import get_settings


class StorageService:
    """Service for file storage (local or R2)."""

    def __init__(self, settings=None):
        self.settings = settings or get_settings()
        self.storage_type = self.settings.storage_type

        if self.storage_type == "local":
            self.base_path = Path(self.settings.storage_path)
            self.base_path.mkdir(parents=True, exist_ok=True)
        elif self.storage_type == "r2":
            # Initialize R2 client (S3-compatible)
            self.r2_client = boto3.client(
                's3',
                endpoint_url=f'https://{self.settings.r2_account_id}.r2.cloudflarestorage.com',
                aws_access_key_id=self.settings.r2_access_key_id,
                aws_secret_access_key=self.settings.r2_secret_access_key,
                config=Config(signature_version='s3v4'),
            )
            self.bucket_name = self.settings.r2_bucket_name

    def get_file_path(self, job_id: str, filename: str) -> str:
        """Get the full path for storing a file."""
        if self.storage_type == "local":
            job_dir = self.base_path / job_id
            job_dir.mkdir(parents=True, exist_ok=True)
            return str(job_dir / filename)
        else:
            # R2 path
            return f"{job_id}/{filename}"

    def upload_file(self, local_path: str, remote_path: str) -> bool:
        """Upload a file to R2. Only used for r2 storage type."""
        if self.storage_type != "r2":
            return False

        try:
            with open(local_path, 'rb') as f:
                self.r2_client.upload_fileobj(
                    f,
                    self.bucket_name,
                    remote_path,
                    ExtraArgs={'ContentType': self._get_content_type(local_path)}
                )
            return True
        except (ClientError, FileNotFoundError) as e:
            print(f"Error uploading to R2: {e}")
            return False

    def file_exists(self, path: str) -> bool:
        """Check if a file exists."""
        if self.storage_type == "local":
            return os.path.exists(path)
        else:
            # R2 check
            try:
                self.r2_client.head_object(Bucket=self.bucket_name, Key=path)
                return True
            except ClientError:
                return False

    def get_file_size(self, path: str) -> int:
        """Get file size in bytes."""
        if self.storage_type == "local":
            return os.path.getsize(path)
        else:
            # R2 file size
            try:
                response = self.r2_client.head_object(Bucket=self.bucket_name, Key=path)
                return response['ContentLength']
            except ClientError:
                return 0

    def get_download_path(self, path: str) -> str:
        """Get path/URL for downloading a file."""
        if self.storage_type == "local":
            return path
        else:
            # Generate presigned R2 URL (valid for 1 hour)
            try:
                url = self.r2_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': self.bucket_name, 'Key': path},
                    ExpiresIn=3600  # 1 hour
                )
                return url
            except ClientError as e:
                print(f"Error generating presigned URL: {e}")
                return ""

    def delete_file(self, path: str) -> bool:
        """Delete a file."""
        if self.storage_type == "local":
            try:
                os.remove(path)
                return True
            except OSError:
                return False
        else:
            # R2 delete
            try:
                self.r2_client.delete_object(Bucket=self.bucket_name, Key=path)
                return True
            except ClientError:
                return False

    def _get_content_type(self, filename: str) -> str:
        """Get content type based on file extension."""
        ext = os.path.splitext(filename)[1].lower()
        content_types = {
            '.flac': 'audio/flac',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.json': 'application/json',
        }
        return content_types.get(ext, 'application/octet-stream')


@lru_cache()
def get_storage_service() -> StorageService:
    return StorageService()
