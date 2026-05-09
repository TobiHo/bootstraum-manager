"""Paddle Billing API integration."""

import hmac
import hashlib
import json
import time
from typing import Optional, Tuple
import httpx
from app.config import settings


def _api_base() -> str:
    return (
        "https://sandbox-api.paddle.com"
        if settings.paddle_environment == "sandbox"
        else "https://api.paddle.com"
    )


class PaddleService:
    def __init__(self):
        self.api_key = settings.paddle_api_key
        self.product_id = settings.paddle_product_id
        self.webhook_secret = settings.paddle_webhook_secret

    def is_configured(self) -> bool:
        return bool(self.api_key and self.product_id)

    def create_transaction(
        self,
        booking_id: int,
        amount_eur: float,
        description: str,
        customer_email: Optional[str] = None,
    ) -> dict:
        """Create a Paddle transaction with a custom unit price.

        Returns the Paddle transaction object including a `checkout.url`
        that the frontend can redirect the buyer to.
        """
        if not self.is_configured():
            raise RuntimeError(
                "Paddle is not configured. Set PADDLE_API_KEY and PADDLE_PRODUCT_ID."
            )

        # Paddle expects amounts as integer string in the smallest currency unit (cents).
        amount_cents = str(int(round(amount_eur * 100)))

        body = {
            "items": [
                {
                    "quantity": 1,
                    "price": {
                        "description": description[:200],
                        "name": description[:120],
                        "product_id": self.product_id,
                        "unit_price": {
                            "amount": amount_cents,
                            "currency_code": "EUR",
                        },
                        "tax_mode": "account_setting",
                        "billing_cycle": None,  # one-time
                        "trial_period": None,
                        "quantity": {"minimum": 1, "maximum": 1},
                    },
                }
            ],
            "collection_mode": "automatic",
            "currency_code": "EUR",
            "custom_data": {"booking_id": str(booking_id)},
            "checkout": {"url": settings.paddle_success_url},
        }
        if customer_email:
            body["customer"] = {"email": customer_email}

        with httpx.Client(timeout=30.0) as client:
            r = client.post(
                f"{_api_base()}/transactions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "Paddle-Version": "1",
                },
                json=body,
            )
            if r.status_code >= 400:
                raise RuntimeError(f"Paddle error {r.status_code}: {r.text}")
            return r.json().get("data", {})

    def verify_webhook(self, raw_body: bytes, signature_header: str) -> bool:
        """Verify Paddle webhook signature.

        Header format: ``ts=<unix>;h1=<hmac_sha256_hex>``
        Signed payload: ``<ts>:<raw_body>``
        """
        if not self.webhook_secret or not signature_header:
            return False
        parts = dict(p.split("=", 1) for p in signature_header.split(";") if "=" in p)
        ts = parts.get("ts")
        sig = parts.get("h1")
        if not ts or not sig:
            return False
        # reject signatures older than 5 minutes
        try:
            if abs(int(time.time()) - int(ts)) > 300:
                return False
        except ValueError:
            return False
        signed = f"{ts}:{raw_body.decode('utf-8')}".encode()
        expected = hmac.new(
            self.webhook_secret.encode(), signed, hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, sig)
