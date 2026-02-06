from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import threading
import time
import traceback
import os
import logging
from redis import Redis
from rq import Queue, SimpleWorker
from rq.timeouts import TimerDeathPenalty

from .config import get_settings
from .database import engine, Base
from .routers import users_router, jobs_router, files_router

settings = get_settings()
logger = logging.getLogger(__name__)


class ThreadSafeWorker(SimpleWorker):
    """SimpleWorker that can run in a background thread.

    Uses timer-based timeouts instead of Unix signals, and skips
    signal handler installation (only works in main thread).
    """
    death_penalty_class = TimerDeathPenalty

    def _install_signal_handlers(self):
        pass

# Global worker state
worker_thread = None
worker_status = {
    "alive": False,
    "started_at": None,
    "restarts": 0,
    "last_error": None,
    "last_error_at": None,
}


def run_rq_worker():
    """Run RQ worker in background thread with auto-restart."""
    # macOS: Disable fork safety check
    os.environ.setdefault("OBJC_DISABLE_INITIALIZE_FORK_SAFETY", "YES")

    while True:
        try:
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
            redis_conn = Redis.from_url(redis_url)

            # Verify Redis connection
            redis_conn.ping()
            logger.info("Redis connection verified")

            # Create queue and worker (use SimpleWorker for thread compatibility)
            queue = Queue("entrain", connection=redis_conn)
            worker = ThreadSafeWorker([queue], connection=redis_conn)

            worker_status["alive"] = True
            worker_status["started_at"] = time.time()
            logger.info("RQ Worker started in background thread, listening on queue 'entrain'")

            # SimpleWorker doesn't use signal handlers, safe for threads
            worker.work(logging_level='INFO')

            # If work() returns normally, the worker stopped
            worker_status["alive"] = False
            logger.warning("RQ Worker stopped unexpectedly, restarting in 5s...")

        except Exception as e:
            worker_status["alive"] = False
            worker_status["last_error"] = f"{type(e).__name__}: {e}"
            worker_status["last_error_at"] = time.time()
            worker_status["restarts"] += 1
            logger.error(f"RQ Worker crashed: {e}\n{traceback.format_exc()}")

        # Wait before restarting
        time.sleep(5)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global worker_thread

    # Startup: Create database tables
    Base.metadata.create_all(bind=engine)

    # Start RQ worker in background thread
    worker_thread = threading.Thread(target=run_rq_worker, daemon=True)
    worker_thread.start()
    logger.info("FastAPI + RQ Worker started successfully")

    yield

    # Shutdown: cleanup if needed
    logger.info("Shutting down...")


app = FastAPI(
    title="Entrain API",
    description="API for generating meditation tracks with binaural beats and affirmations",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(users_router)
app.include_router(jobs_router)
app.include_router(files_router)


@app.get("/")
def root():
    return {"message": "Entrain API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/worker-status")
def get_worker_status():
    """Diagnostic endpoint to check RQ worker health."""
    thread_alive = worker_thread.is_alive() if worker_thread else False

    # Check Redis connectivity
    redis_ok = False
    queue_size = None
    try:
        from .services import get_queue_service
        qs = get_queue_service()
        qs.redis.ping()
        redis_ok = True
        queue_size = qs.queue.count
    except Exception as e:
        redis_error = str(e)

    return {
        "worker_thread_alive": thread_alive,
        "worker_processing": worker_status["alive"],
        "worker_started_at": worker_status["started_at"],
        "worker_restarts": worker_status["restarts"],
        "last_error": worker_status["last_error"],
        "last_error_at": worker_status["last_error_at"],
        "redis_connected": redis_ok,
        "queue_size": queue_size,
    }
