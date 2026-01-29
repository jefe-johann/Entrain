import os
from pathlib import Path
from functools import lru_cache
from ..config import get_settings


class StorageService:
    """Service for file storage (local or R2)."""

    def __init__(self, settings=None):
        self.settings = settings or get_settings()
        self.storage_type = self.settings.storage_type

        if self.storage_type == "local":
            self.base_path = Path(self.settings.storage_path)
            self.base_path.mkdir(parents=True, exist_ok=True)

    def get_file_path(self, job_id: str, filename: str) -> str:
        """Get the full path for storing a file."""
        if self.storage_type == "local":
            job_dir = self.base_path / job_id
            job_dir.mkdir(parents=True, exist_ok=True)
            return str(job_dir / filename)
        else:
            # R2 path
            return f"{job_id}/{filename}"

    def file_exists(self, path: str) -> bool:
        """Check if a file exists."""
        if self.storage_type == "local":
            return os.path.exists(path)
        else:
            # TODO: Implement R2 check
            return False

    def get_file_size(self, path: str) -> int:
        """Get file size in bytes."""
        if self.storage_type == "local":
            return os.path.getsize(path)
        else:
            # TODO: Implement R2
            return 0

    def get_download_path(self, path: str) -> str:
        """Get path/URL for downloading a file."""
        if self.storage_type == "local":
            return path
        else:
            # TODO: Generate presigned R2 URL
            return path

    def delete_file(self, path: str) -> bool:
        """Delete a file."""
        if self.storage_type == "local":
            try:
                os.remove(path)
                return True
            except OSError:
                return False
        else:
            # TODO: Implement R2 delete
            return False


@lru_cache()
def get_storage_service() -> StorageService:
    return StorageService()
