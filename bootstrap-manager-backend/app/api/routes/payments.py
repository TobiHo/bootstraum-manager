"""Stripe payment endpoints (checkout creation + webhook)."""

import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.database import get_db
from app.models.db import Booking, Payment
from app.services.stripe_service import StripeService
from app.domain.booking import BookingStatus

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/payments/stripe", tags=["payments"])


class CheckoutRequest(BaseModel):
    booking_id: int


class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str


@router.post("/checkout", response_model=CheckoutResponse)
def create_checkout(payload: CheckoutRequest, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking.payment_status == "paid":
        raise HTTPException(400, "Booking is already paid")
    if booking.total_price <= 0:
        raise HTTPException(400, "Booking has no payable amount")

    svc = StripeService()
    if not svc.is_configured():
        raise HTTPException(503, "Online payment is not configured yet")

    description = f"{booking.tour_type or 'Bootstour'} – Buchung #{booking.id}"
    try:
        session = svc.create_checkout_session(
            booking_id=booking.id,
            amount_eur=booking.total_price,
            description=description,
            customer_email=booking.customer_email,
        )
    except Exception as e:  # noqa: BLE001
        logger.exception("Stripe checkout failed")
        raise HTTPException(502, f"Could not create checkout: {e}")

    checkout_url = session.url
    session_id = session.id
    if not checkout_url:
        raise HTTPException(502, "Stripe did not return a checkout URL")

    payment = Payment(
        booking_id=booking.id,
        provider="stripe",
        provider_transaction_id=session_id,
        amount=booking.total_price,
        currency="EUR",
        status="pending",
    )
    db.add(payment)
    db.commit()
    return CheckoutResponse(checkout_url=checkout_url, session_id=session_id)


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    raw = await request.body()
    sig = request.headers.get("stripe-signature", "")
    svc = StripeService()
    try:
        event = svc.construct_event(raw, sig)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(401, f"Invalid signature: {e}")

    event_type = event["type"]
    data = event["data"]["object"]
    session_id = data.get("id") if event_type.startswith("checkout.session") else None
    metadata = data.get("metadata") or {}
    booking_id = metadata.get("booking_id")

    payment = None
    if session_id:
        payment = db.query(Payment).filter(Payment.provider_transaction_id == session_id).first()
    booking = None
    if booking_id:
        try:
            booking = db.query(Booking).filter(Booking.id == int(booking_id)).first()
        except (TypeError, ValueError):
            booking = None

    if event_type in ("checkout.session.completed", "checkout.session.async_payment_succeeded"):
        if payment:
            payment.status = "paid"
        if booking:
            booking.payment_status = "paid"
            booking.status = BookingStatus.CONFIRMED
        db.commit()
    elif event_type in ("checkout.session.expired", "checkout.session.async_payment_failed"):
        if payment:
            payment.status = "failed"
        if booking:
            booking.payment_status = "unpaid"
        db.commit()
    elif event_type in ("charge.refunded", "refund.created"):
        if payment:
            payment.status = "refunded"
        if booking:
            booking.payment_status = "refunded"
        db.commit()

    return {"received": True}
