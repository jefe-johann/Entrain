from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..config import get_settings
from ..models import User, Job
from ..schemas import JobCreate, JobResponse, JobStatusResponse
from ..services import get_queue_service, get_storage_service

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def get_current_user_email(x_user_email: Optional[str] = Header(None)) -> str:
    """Extract user email from header."""
    if not x_user_email:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return x_user_email


def get_user_by_email(email: str, db: Session) -> User:
    """Get user by email or raise 404."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("", response_model=JobResponse)
def create_job(
    job_data: JobCreate,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db),
):
    """Create a new generation job."""
    user = get_user_by_email(email, db)

    # Check and deduct credits (skip in dev mode)
    settings = get_settings()
    if not settings.dev_unlimited_credits:
        if user.credits < 1:
            raise HTTPException(
                status_code=402,
                detail="Insufficient credits. Please purchase more credits to continue.",
            )
        user.credits -= 1

    # Create job record
    job = Job(
        user_id=user.id,
        status="pending",
        config=job_data.config.model_dump(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Enqueue the job
    queue_service = get_queue_service()
    from worker.tasks import generate_meditation_task

    rq_job = queue_service.enqueue(
        generate_meditation_task,
        job.id,
        job_timeout="30m",  # 30 minute timeout for long generations
    )

    # Update job with RQ job ID
    job.rq_job_id = rq_job.id
    db.commit()
    db.refresh(job)

    return job


@router.get("", response_model=List[JobResponse])
def list_jobs(
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db),
    limit: int = 20,
    offset: int = 0,
):
    """List user's jobs, newest first."""
    user = get_user_by_email(email, db)

    jobs = (
        db.query(Job)
        .filter(Job.user_id == user.id)
        .order_by(Job.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return jobs


@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: str,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db),
):
    """Get a specific job."""
    user = get_user_by_email(email, db)

    job = db.query(Job).filter(Job.id == job_id, Job.user_id == user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return job


@router.get("/{job_id}/status", response_model=JobStatusResponse)
def get_job_status(
    job_id: str,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db),
):
    """
    Lightweight status endpoint for polling.
    Returns minimal data to reduce bandwidth.
    """
    user = get_user_by_email(email, db)

    job = db.query(Job).filter(Job.id == job_id, Job.user_id == user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Also check RQ for real-time progress if job is processing
    if job.status == "processing" and job.rq_job_id:
        queue_service = get_queue_service()
        rq_status = queue_service.get_job_status(job.rq_job_id)
        if rq_status:
            job.progress = rq_status.get("progress", job.progress)
            job.progress_message = rq_status.get("progress_message", job.progress_message)

    return JobStatusResponse(
        id=job.id,
        status=job.status,
        progress=job.progress,
        progress_message=job.progress_message,
        error_message=job.error_message,
    )


@router.delete("/{job_id}")
def delete_job(
    job_id: str,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db),
):
    """Delete a job and its associated file."""
    user = get_user_by_email(email, db)

    job = db.query(Job).filter(Job.id == job_id, Job.user_id == user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Delete associated file if exists
    if job.file_path:
        storage_service = get_storage_service()
        storage_service.delete_file(job.file_path)

    db.delete(job)
    db.commit()

    return {"message": "Job deleted"}
