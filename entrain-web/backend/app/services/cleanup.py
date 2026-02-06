import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import Job
from .storage import get_storage_service

logger = logging.getLogger(__name__)


def recover_stuck_jobs(db: Session) -> int:
    """Mark orphaned processing/pending jobs as failed.

    After an OOM kill or crash, jobs can be left stuck as 'processing' or
    'pending' with no worker to pick them up. Mark any that are older than
    30 minutes as failed so users aren't left waiting.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=30)
    stuck = (
        db.query(Job)
        .filter(
            Job.status.in_(["processing", "pending"]),
            Job.created_at < cutoff,
        )
        .all()
    )

    for job in stuck:
        job.status = "failed"
        job.error_message = "Generation interrupted by server restart. Please try again."

    if stuck:
        db.commit()
        logger.info(f"Recovered {len(stuck)} stuck jobs")

    return len(stuck)


def cleanup_expired_jobs(db: Session) -> int:
    """Auto-cleanup expired jobs.

    - Completed jobs with files older than retention period -> archived (config preserved)
    - Failed jobs older than retention period -> hard-deleted
    """
    settings = get_settings()
    cutoff = datetime.now(timezone.utc) - timedelta(days=settings.file_retention_days)
    total = 0

    # Archive completed jobs with expired files
    expired_completed = (
        db.query(Job)
        .filter(
            Job.status == "completed",
            Job.file_path.isnot(None),
            Job.completed_at < cutoff,
        )
        .all()
    )

    if expired_completed:
        storage_service = get_storage_service()
        for job in expired_completed:
            if job.file_path:
                storage_service.delete_file(job.file_path)
            job.status = "archived"
            job.file_path = None
            job.file_size_bytes = None
            job.archived_at = datetime.now(timezone.utc)
            total += 1

    # Hard-delete failed jobs past retention
    expired_failed = (
        db.query(Job)
        .filter(
            Job.status == "failed",
            Job.created_at < cutoff,
        )
        .all()
    )

    for job in expired_failed:
        db.delete(job)
        total += 1

    if total > 0:
        db.commit()
        logger.info(f"Cleanup: archived {len(expired_completed)} completed, deleted {len(expired_failed)} failed jobs")

    return total
