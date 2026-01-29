from redis import Redis
from rq import Queue
from functools import lru_cache
from ..config import get_settings


class QueueService:
    """Service for managing the RQ job queue."""

    def __init__(self, settings=None):
        self.settings = settings or get_settings()
        self.redis = Redis.from_url(self.settings.redis_url)
        self.queue = Queue("entrain", connection=self.redis)

    def enqueue(self, func, *args, **kwargs):
        """Enqueue a job for processing."""
        job = self.queue.enqueue(func, *args, **kwargs)
        return job

    def get_job(self, job_id: str):
        """Get a job by ID."""
        from rq.job import Job

        try:
            return Job.fetch(job_id, connection=self.redis)
        except Exception:
            return None

    def get_job_status(self, job_id: str) -> dict:
        """Get job status and progress."""
        job = self.get_job(job_id)
        if not job:
            return None

        return {
            "status": job.get_status(),
            "progress": job.meta.get("progress", 0),
            "progress_message": job.meta.get("progress_message", ""),
            "result": job.result if job.is_finished else None,
            "error": str(job.exc_info) if job.is_failed else None,
        }


@lru_cache()
def get_queue_service() -> QueueService:
    return QueueService()
