from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import get_settings
from .database import engine, Base
from .routers import users_router, jobs_router, files_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create database tables
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: cleanup if needed


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
