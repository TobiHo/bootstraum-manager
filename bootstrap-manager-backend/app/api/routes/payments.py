"""Paddle payment endpoints (checkout creation + webhook)."""

import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.database import get_db
from app.models.db import Booking, Payment
from app.services.paddle_service import PaddleService
from app.domain.booking import BookingStatus

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/payments/paddle", tags=["payments"])


class CheckoutRequest(BaseModel):
    booking_id: int


class CheckoutResponse(BaseModel):
    checkout_url: str
    transaction_id: str


@router.post("/checkout", response_model=CheckoutResponse)
def create_checkout(payload: CheckoutRequest, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking.payment_status == "paid":
        raise HTTPException(400, "Booking is already paid")
    if booking.total_price <= 0:
        raise HTTPException(400, "Booking has no payable amount")

    svc = PaddleService()
    if not svc.is_configured():
        raise HTTPException(503, "Online payment is not configured yet")

    description = f"{booking.tour_type or 'Bootstour'} – Buchung #{booking.id}"
    try:
        tx = svc.create_transaction(
            booking_id=booking.id,
            amount_eur=booking.total_price,
            description=description,
            customer_email=booking.customer_email,
        )
    except Exception as e:  # noqa: BLE001
        logger.exception("Paddle checkout failed")
        raise HTTPException(502, f"Could not create checkout: {e}")

    checkout_url = (tx.get("checkout") or {}).get("url")
    tx_id = tx.get("id", "")
    if not checkout_url:
        raise HTTPException(502, "Paddle did not return a checkout URL")

    payment = Payment(
        booking_id=booking.id,
        provider="paddle",
        provider_transaction_id=tx_id,
        amount=booking.total_price,
        currency="EUR",
        status="pending",
    )
    db.add(payment)
    db.commit()
    return CheckoutResponse(checkout_url=checkout_url, transaction_id=tx_id)


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def paddle_webhook(request: Request, db: Session = Depends(get_db)):
    raw = await request.body()
    sig = request.headers.get("paddle-signature", "")
    svc = PaddleService()
    if not svc.verify_webhook(raw, sig):
        raise HTTPException(401, "Invalid signature")

    import json
    event = json.loads(raw.decode("utf-8"))
    event_type = event.get("event_type", "")
    data = event.get("data", {}) or {}
    tx_id = data.get("id")
    custom = data.get("custom_data") or {}
    booking_id = custom.get("booking_id")

    payment = None
    if tx_id:
        payment = db.query(Payment).filter(Payment.provider_transaction_id == tx_id).first()
    booking = None
    if booking_id:
        try:
            booking = db.query(Booking).filter(Booking.id == int(booking_id)).first()
        except (TypeError, ValueError):
            booking = None

    if event_type in ("transaction.completed", "transaction.paid"):
        if payment:
            payment.status = "paid"
        if booking:
            booking.payment_status = "paid"
            booking.status = BookingStatus.CONFIRMED
        db.commit()
    elif event_type in ("transaction.payment_failed", "transaction.canceled"):
        if payment:
            payment.status = "failed"
        if booking:
            booking.payment_status = "unpaid"
        db.commit()
    elif event_type.startswith("adjustment."):
        # refund handling
        if payment:
            payment.status = "refunded"
        if booking:
            booking.payment_status = "refunded"
        db.commit()

    return {"received": True}
