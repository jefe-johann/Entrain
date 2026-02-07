from pydantic import BaseModel
from datetime import datetime


class CheckoutSessionCreate(BaseModel):
    price_id: str


class CheckoutSessionResponse(BaseModel):
    checkout_url: str


class PaymentResponse(BaseModel):
    id: str
    credits_purchased: int
    amount_cents: int
    currency: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
