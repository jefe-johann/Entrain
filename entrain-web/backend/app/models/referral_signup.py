from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
import uuid


class ReferralSignup(Base):
    __tablename__ = "referral_signups"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    referrer_user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    referred_user_id = Column(
        String,
        ForeignKey("users.id"),
        nullable=False,
        unique=True,
        index=True,
    )
    reward_payment_id = Column(
        String,
        ForeignKey("payments.id", ondelete="SET NULL"),
        nullable=True,
    )
    rewarded_at = Column(DateTime(timezone=True), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    referrer = relationship(
        "User",
        foreign_keys=[referrer_user_id],
        back_populates="referrals_sent",
    )
    referred = relationship(
        "User",
        foreign_keys=[referred_user_id],
        back_populates="referral_received",
    )
    reward_payment = relationship("Payment", back_populates="referral_rewards")
