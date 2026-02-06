from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
from typing import Optional
import os

from ..database import get_db
from ..models import User, Job
from ..services import get_storage_service

router = APIRouter(prefix="/api/files", tags=["files"])


def get_current_user_email(x_user_email: Optional[str] = Header(None)) -> str:
    """Extract user email from header."""
    if not x_user_email:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return x_user_email


@router.get("/{job_id}")
def download_file(
    job_id: str,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db),
):
    """Download the generated file for a completed job."""
    # Get user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get job
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check job is completed
    if job.status != "completed":
        raise HTTPException(status_code=400, detail="Job not completed yet")

    # Check file exists
    if not job.file_path:
        raise HTTPException(status_code=404, detail="File not found")

    storage_service = get_storage_service()
    if not storage_service.file_exists(job.file_path):
        raise HTTPException(status_code=404, detail="File not found on storage")

    # Generate filename for download
    config = job.config
    voice = config.get("voice_id", "unknown")
    duration = config.get("duration_minutes", 40)
    filename = f"meditation-{voice}-{duration}min.flac"

    # For R2 storage, redirect to presigned URL
    if storage_service.storage_type == "r2":
        download_url = storage_service.get_download_path(job.file_path)
        if not download_url:
            raise HTTPException(status_code=500, detail="Failed to generate download URL")
        return RedirectResponse(url=download_url)

    # For local storage, serve file directly
    return FileResponse(
        path=job.file_path,
        media_type="audio/flac",
        filename=filename,
    )
