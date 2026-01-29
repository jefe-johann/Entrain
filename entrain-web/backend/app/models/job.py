from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
import uuid


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    rq_job_id = Column(String, nullable=True, index=True)

    # Status: pending, processing, completed, failed
    status = Column(String, default="pending", nullable=False)
    progress = Column(Integer, default=0)  # 0-100
    progress_message = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)

    # Configuration used for generation
    config = Column(JSON, nullable=False)

    # Result
    file_path = Column(String, nullable=True)
    file_size_bytes = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="jobs")
