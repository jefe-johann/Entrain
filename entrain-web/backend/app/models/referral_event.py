import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class ReferralEvent(Base):
    __tablename__ = "referral_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    referrer_user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    referred_user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    payment_id = Column(String, ForeignKey("payments.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type = Column(String, nullable=False, index=True)
    event_reason = Column(String, nullable=True)
    ip_hash = Column(String, nullable=True, index=True)
    user_agent = Column(String, nullable=True)
    referer = Column(String, nullable=True)
    landing_path = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    referrer = relationship("User", foreign_keys=[referrer_user_id])
    referred = relationship("User", foreign_keys=[referred_user_id])
    payment = relationship("Payment")
