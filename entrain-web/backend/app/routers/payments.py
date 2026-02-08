import json
import logging
import stripe
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone

from ..database import get_db
from ..config import get_settings
from ..models import User, Payment, ReferralSignup
from ..schemas.payment import CheckoutSessionCreate, CheckoutSessionResponse

router = APIRouter(prefix="/api/payments", tags=["payments"])
logger = logging.getLogger(__name__)


def get_current_user_email(x_user_email: Optional[str] = Header(None)) -> str:
    if not x_user_email:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return x_user_email


def get_price_map() -> dict:
    """Parse the price-to-credits mapping from settings."""
    settings = get_settings()
    try:
        return json.loads(settings.stripe_price_map)
    except (json.JSONDecodeError, TypeError):
        return {}


@router.post("/create-checkout-session", response_model=CheckoutSessionResponse)
def create_checkout_session(
    data: CheckoutSessionCreate,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db),
):
    settings = get_settings()
    stripe.api_key = settings.stripe_secret_key

    price_map = get_price_map()
    if data.price_id not in price_map:
        raise HTTPException(status_code=400, detail="Invalid price ID")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    credits_amount = price_map[data.price_id]

    try:
        checkout_session = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=[{
                "price": data.price_id,
                "quantity": 1,
            }],
            customer_email=email,
            metadata={
                "user_email": email,
                "user_id": user.id,
                "credits": str(credits_amount),
            },
            success_url=f"{settings.frontend_url}/credits/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.frontend_url}/credits",
        )
    except stripe.StripeError as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=502, detail="Payment service error")

    return CheckoutSessionResponse(checkout_url=checkout_session.url)


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    settings = get_settings()
    stripe.api_key = settings.stripe_secret_key

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except stripe.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")

    if event["type"] == "checkout.session.completed":
        session_data = event["data"]["object"]
        _handle_successful_payment(session_data, db)

    return {"status": "ok"}


def _handle_successful_payment(session_data: dict, db: Session):
    """Process a completed checkout session. Idempotent."""
    checkout_session_id = session_data["id"]

    # Idempotency: skip if already processed
    existing = db.query(Payment).filter(
        Payment.stripe_checkout_session_id == checkout_session_id
    ).first()
    if existing:
        logger.info(f"Payment already processed: {checkout_session_id}")
        return

    metadata = session_data.get("metadata", {})
    user_email = metadata.get("user_email")
    user_id = metadata.get("user_id")
    credits = int(metadata.get("credits", 0))

    if not user_email or credits <= 0:
        logger.warning(f"Invalid payment metadata: {metadata}")
        return

    # Find user by ID first, fall back to email
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = db.query(User).filter(User.email == user_email).first()
    if not user:
        logger.error(f"User not found for payment: {user_email}")
        return

    had_prior_completed_payment = db.query(Payment.id).filter(
        Payment.user_id == user.id,
        Payment.status == "completed",
    ).first() is not None

    # Add credits
    user.credits += credits

    # Record payment
    payment = Payment(
        user_id=user.id,
        stripe_checkout_session_id=checkout_session_id,
        stripe_payment_intent_id=session_data.get("payment_intent"),
        credits_purchased=credits,
        amount_cents=session_data.get("amount_total", 0),
        currency=session_data.get("currency", "usd"),
        status="completed",
    )
    db.add(payment)
    db.flush()

    if not had_prior_completed_payment:
        _apply_referral_reward_if_eligible(
            purchased_user=user,
            payment=payment,
            db=db,
        )

    db.commit()
    logger.info(f"Added {credits} credits to user {user.email} (payment {checkout_session_id})")


def _apply_referral_reward_if_eligible(purchased_user: User, payment: Payment, db: Session):
    referral = db.query(ReferralSignup).filter(
        ReferralSignup.referred_user_id == purchased_user.id
    ).first()
    if not referral:
        return

    if referral.rewarded_at:
        return

    if referral.referrer_user_id == purchased_user.id:
        logger.warning(f"Skipping self-referral reward for user {purchased_user.id}")
        return

    referrer = db.query(User).filter(User.id == referral.referrer_user_id).first()
    if not referrer:
        logger.warning(
            f"Referrer not found for referral signup {referral.id} (referrer {referral.referrer_user_id})"
        )
        return

    marked_rows = db.query(ReferralSignup).filter(
        ReferralSignup.id == referral.id,
        ReferralSignup.rewarded_at.is_(None),
    ).update(
        {
            ReferralSignup.reward_payment_id: payment.id,
            ReferralSignup.rewarded_at: datetime.now(timezone.utc),
        },
        synchronize_session=False,
    )
    if marked_rows == 0:
        return

    referrer.credits += 1
    logger.info(
        f"Awarded 1 referral credit to {referrer.email} for first purchase by {purchased_user.email}"
    )
