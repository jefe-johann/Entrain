import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import Job
from .storage import get_storage_service

logger = logging.getLogger(__name__)


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
