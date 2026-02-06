from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func
from typing import List, Optional
from datetime import datetime, timezone

from ..database import get_db
from ..config import get_settings
from ..models import User, Job
from ..schemas import JobCreate, JobResponse, JobStatusResponse
from ..services import get_queue_service, get_storage_service, cleanup_expired_jobs

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


def get_user_storage_bytes(user_id: str, db: Session) -> int:
    """Get total storage used by a user's files."""
    result = db.query(sa_func.coalesce(sa_func.sum(Job.file_size_bytes), 0)).filter(
        Job.user_id == user_id, Job.file_path.isnot(None)
    ).scalar()
    return int(result)


@router.post("", response_model=JobResponse)
def create_job(
    job_data: JobCreate,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db),
):
    """Create a new generation job."""
    user = get_user_by_email(email, db)

    # Check and deduct credits (skip in dev mode or for admin users)
    settings = get_settings()
    credits_needed = job_data.config.credits_required()
    is_admin = user.email == "jlschumann@gmail.com"

    if not settings.dev_unlimited_credits and not is_admin:
        if user.credits < credits_needed:
            raise HTTPException(
                status_code=402,
                detail=f"Insufficient credits. This job requires {credits_needed} credit{'s' if credits_needed != 1 else ''} but you have {user.credits}.",
            )
        user.credits -= credits_needed

    # Check storage limit (skip for admin)
    if not is_admin:
        used_bytes = get_user_storage_bytes(user.id, db)
        if used_bytes >= settings.user_storage_limit_bytes:
            raise HTTPException(
                status_code=409,
                detail="Storage full. Archive or delete old tracks to free up space.",
            )

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
    cleanup_expired_jobs(db)

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


@router.get("/storage")
def get_storage(
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db),
):
    """Get user's storage usage."""
    user = get_user_by_email(email, db)
    settings = get_settings()
    used_bytes = get_user_storage_bytes(user.id, db)
    limit_bytes = settings.user_storage_limit_bytes

    return {
        "used_bytes": used_bytes,
        "limit_bytes": limit_bytes,
        "used_percentage": round((used_bytes / limit_bytes) * 100, 1) if limit_bytes > 0 else 0,
    }


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


@router.post("/{job_id}/archive", response_model=JobResponse)
def archive_job(
    job_id: str,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db),
):
    """Archive a job: delete its file but keep config for regeneration."""
    user = get_user_by_email(email, db)

    job = db.query(Job).filter(Job.id == job_id, Job.user_id == user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status == "processing":
        raise HTTPException(status_code=400, detail="Cannot archive a processing job")

    if job.status == "archived":
        return job

    # Delete the file from storage
    if job.file_path:
        storage_service = get_storage_service()
        storage_service.delete_file(job.file_path)

    job.status = "archived"
    job.file_path = None
    job.file_size_bytes = None
    job.archived_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(job)

    return job


@router.post("/{job_id}/regenerate", response_model=JobResponse)
def regenerate_job(
    job_id: str,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db),
):
    """Regenerate a job from its archived config."""
    user = get_user_by_email(email, db)

    old_job = db.query(Job).filter(Job.id == job_id, Job.user_id == user.id).first()
    if not old_job:
        raise HTTPException(status_code=404, detail="Job not found")

    if old_job.status != "archived":
        raise HTTPException(status_code=400, detail="Only archived jobs can be regenerated")

    # Check credits
    from ..schemas import JobConfig
    config = JobConfig(**old_job.config)
    settings = get_settings()
    credits_needed = config.credits_required()
    is_admin = user.email == "jlschumann@gmail.com"

    if not settings.dev_unlimited_credits and not is_admin:
        if user.credits < credits_needed:
            raise HTTPException(
                status_code=402,
                detail=f"Insufficient credits. Regeneration requires {credits_needed} credit{'s' if credits_needed != 1 else ''}.",
            )
        user.credits -= credits_needed

    # Check storage limit
    if not is_admin:
        used_bytes = get_user_storage_bytes(user.id, db)
        if used_bytes >= settings.user_storage_limit_bytes:
            raise HTTPException(
                status_code=409,
                detail="Storage full. Archive or delete old tracks to free up space.",
            )

    # Create new job with same config
    new_job = Job(
        user_id=user.id,
        status="pending",
        config=old_job.config,
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    # Enqueue the job
    queue_service = get_queue_service()
    from worker.tasks import generate_meditation_task

    rq_job = queue_service.enqueue(
        generate_meditation_task,
        new_job.id,
        job_timeout="30m",
    )

    new_job.rq_job_id = rq_job.id
    db.commit()
    db.refresh(new_job)

    return new_job
