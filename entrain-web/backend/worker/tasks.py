"""
RQ Tasks for Entrain generation jobs.
"""

import os
import sys
from datetime import datetime
from rq import get_current_job

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models import Job, User
from app.services.storage import StorageService
from worker.generator import generate_meditation


def get_db_session():
    """Create a database session for the worker."""
    database_url = os.getenv("DATABASE_URL", "postgresql://entrain:entrain_dev@localhost:5432/entrain")
    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine)
    return Session()


def update_job_progress(job_id: str, progress: int, message: str):
    """Update job progress in database and RQ job meta."""
    # Update RQ job meta for real-time polling
    rq_job = get_current_job()
    if rq_job:
        rq_job.meta['progress'] = progress
        rq_job.meta['progress_message'] = message
        rq_job.save_meta()

    # Also update database for persistence
    db = get_db_session()
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if job:
            job.progress = progress
            job.progress_message = message
            db.commit()
    finally:
        db.close()


def generate_meditation_task(job_id: str):
    """
    RQ task to generate a meditation track.

    Args:
        job_id: Database job ID
    """
    import tempfile

    db = get_db_session()
    storage = StorageService()

    try:
        # Get job from database
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise ValueError(f"Job {job_id} not found")

        # Update status to processing
        job.status = "processing"
        job.progress = 0
        job.progress_message = "Starting generation..."
        db.commit()

        # Get ElevenLabs API key
        if job.config.get('use_user_api_key', False):
            user = db.query(User).filter(User.id == job.user_id).first()
            if not user or not user.elevenlabs_api_key:
                raise ValueError("User ElevenLabs API key not configured")
            elevenlabs_api_key = user.elevenlabs_api_key
        else:
            elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
            if not elevenlabs_api_key:
                raise ValueError("ELEVENLABS_API_KEY not configured")

        # Determine output path
        output_filename = f"meditation-{job_id}.flac"

        # For R2 storage, generate in temp file then upload
        if storage.storage_type == "r2":
            # Create temp file for generation
            temp_dir = tempfile.gettempdir()
            local_output_path = os.path.join(temp_dir, output_filename)
        else:
            # Local storage path
            local_output_path = storage.get_file_path(job_id, output_filename)

        # Create progress callback
        def progress_callback(progress: int, message: str):
            update_job_progress(job_id, progress, message)

        # Run generation
        result = generate_meditation(
            config=job.config,
            output_path=local_output_path,
            elevenlabs_api_key=elevenlabs_api_key,
            progress_callback=progress_callback,
        )

        # If using R2, upload the file
        if storage.storage_type == "r2":
            update_job_progress(job_id, 95, "Uploading to cloud storage...")

            remote_path = storage.get_file_path(job_id, output_filename)
            upload_success = storage.upload_file(local_output_path, remote_path)

            if not upload_success:
                raise Exception("Failed to upload file to R2")

            # Clean up local temp file
            os.unlink(local_output_path)

            # Update file path to remote path
            result['file_path'] = remote_path

        # Update job as completed
        job.status = "completed"
        job.progress = 100
        job.progress_message = "Complete!"
        job.file_path = result['file_path']
        job.file_size_bytes = result['file_size_bytes']
        job.completed_at = datetime.utcnow()
        db.commit()

        return {"status": "completed", "file_path": result['file_path']}

    except Exception as e:
        # Update job as failed
        job = db.query(Job).filter(Job.id == job_id).first()
        if job:
            job.status = "failed"
            job.error_message = str(e)
            db.commit()

        raise

    finally:
        db.close()
