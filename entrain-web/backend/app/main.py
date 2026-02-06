from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import threading
import os
from redis import Redis
from rq import Worker, Queue

from .config import get_settings
from .database import engine, Base
from .routers import users_router, jobs_router, files_router

settings = get_settings()

# Global worker thread reference
worker_thread = None


def run_rq_worker():
    """Run RQ worker in background thread"""
    # macOS: Disable fork safety check
    os.environ.setdefault("OBJC_DISABLE_INITIALIZE_FORK_SAFETY", "YES")

    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis_conn = Redis.from_url(redis_url)

    # Create queue and worker
    queue = Queue("entrain", connection=redis_conn)
    worker = Worker([queue], connection=redis_conn)

    print(f"🔧 RQ Worker started in background thread, listening on queue 'entrain'...")
    worker.work()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global worker_thread

    # Startup: Create database tables
    Base.metadata.create_all(bind=engine)

    # Start RQ worker in background thread
    worker_thread = threading.Thread(target=run_rq_worker, daemon=True)
    worker_thread.start()
    print("✅ FastAPI + RQ Worker started successfully")

    yield

    # Shutdown: cleanup if needed
    print("🛑 Shutting down...")


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
