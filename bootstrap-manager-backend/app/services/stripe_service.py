"""Stripe Checkout integration."""

from typing import Optional
import stripe
from app.config import settings


class StripeService:
    def __init__(self):
        self.api_key = settings.stripe_secret_key
        self.webhook_secret = settings.stripe_webhook_secret
        if self.api_key:
            stripe.api_key = self.api_key

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def create_checkout_session(
        self,
        booking_id: int,
        amount_eur: float,
        description: str,
        customer_email: Optional[str] = None,
    ) -> stripe.checkout.Session:
        if not self.is_configured():
            raise RuntimeError("Stripe is not configured. Set STRIPE_SECRET_KEY.")

        amount_cents = int(round(amount_eur * 100))
        session = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=[
                {
                    "quantity": 1,
                    "price_data": {
                        "currency": "eur",
                        "unit_amount": amount_cents,
                        "product_data": {"name": description[:120]},
                    },
                }
            ],
            success_url=f"{settings.stripe_success_url}?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=settings.stripe_cancel_url,
            customer_email=customer_email or None,
            metadata={"booking_id": str(booking_id)},
            payment_intent_data={"metadata": {"booking_id": str(booking_id)}},
        )
        return session

    def construct_event(self, raw_body: bytes, signature: str) -> stripe.Event:
        if not self.webhook_secret:
            raise RuntimeError("STRIPE_WEBHOOK_SECRET not configured")
        return stripe.Webhook.construct_event(raw_body, signature, self.webhook_secret)