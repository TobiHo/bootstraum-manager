"""Notification service for email and WhatsApp"""

from datetime import datetime
from typing import List
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
import os

from app.models.db import Booking, Captain, Boat


class NotificationService:
    """Service for sending notifications via email and WhatsApp"""

    def __init__(self):
        # Email configuration - can be set via environment variables
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.sender_email = os.getenv("SENDER_EMAIL", "info@vvv-nordhorn.de")
        self.sender_password = os.getenv("SENDER_PASSWORD", "")

        # WhatsApp configuration (Twilio)
        self.whatsapp_account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
        self.whatsapp_auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
        self.whatsapp_from_number = os.getenv("TWILIO_WHATSAPP_FROM", "")

    def send_booking_confirmation(self, booking: Booking) -> bool:
        """Send booking confirmation via email"""
        try:
            subject = f"Buchungsbestätigung - Vechteboote Tour am {booking.start_date.strftime('%d.%m.%Y')}"

            body = f"""
Lieber {booking.customer_name},

herzlichen Dank für Ihre Buchung! Hier sind die Details:

🚤 Tourtyp: {booking.tour_type or "Standard"}
📅 Datum: {booking.start_date.strftime('%d.%m.%Y, %H:%M')} - {booking.end_date.strftime('%H:%M')} Uhr
⛵ Boot: {booking.boat.name} ({booking.boat.capacity} Plätze)
👨‍✈️ Bootsführer: {booking.captain.name if booking.captain else "TBA"}
👥 Teilnehmer: {booking.participants}

Kontakt für Fragen:
VVV Nordhorn
Telefon: +49 5921 8039-0
Email: info@vvv-nordhorn.de

Wir freuen uns auf Sie!

Viele Grüße
Ihr Vechteboote Team
            """

            return self._send_email(booking.customer_email, subject, body)
        except Exception as e:
            print(f"Error sending booking confirmation: {e}")
            return False

    def send_captain_notification(self, booking: Booking) -> bool:
        """Send booking notification to captain via email and WhatsApp"""
        if not booking.captain:
            return False

        try:
            subject = f"Neue Buchung: {booking.customer_name} am {booking.start_date.strftime('%d.%m.%Y')}"

            body = f"""
Hallo {booking.captain.name},

Sie haben eine neue Buchung:

📅 Datum: {booking.start_date.strftime('%d.%m.%Y, %H:%M')} - {booking.end_date.strftime('%H:%M')} Uhr
⛵ Boot: {booking.boat.name}
👤 Kunde: {booking.customer_name}
📱 Tel.: {booking.customer_phone}
📧 Email: {booking.customer_email}
👥 Teilnehmer: {booking.participants}
🎫 Tourtyp: {booking.tour_type or "Standard"}

Notizen: {booking.notes or "Keine"}

Bitte bestätigen Sie die Verfügbarkeit!

Viele Grüße
Buchungssystem
            """

            email_sent = self._send_email(booking.captain.email, subject, body)
            whatsapp_sent = self._send_whatsapp(
                booking.captain.phone,
                f"Neue Buchung: {booking.customer_name} am {booking.start_date.strftime('%d.%m.%Y %H:%M')} - {booking.boat.name} - {booking.participants} Pers."
            )

            return email_sent or whatsapp_sent
        except Exception as e:
            print(f"Error sending captain notification: {e}")
            return False

    def send_cancellation_notification(self, booking: Booking) -> bool:
        """Send cancellation notification to captain and customer"""
        try:
            # Notify customer
            customer_subject = f"Stornierung bestätigt - Tour am {booking.start_date.strftime('%d.%m.%Y')}"
            customer_body = f"""
Lieber {booking.customer_name},

Ihre Buchung wurde storniert:

📅 Ursprüngliches Datum: {booking.start_date.strftime('%d.%m.%Y, %H:%M')} Uhr
⛵ Boot: {booking.boat.name}

Falls Sie eine Rückerstattung erhalten, werden Sie diese in Kürze auf Ihr Konto überwiesen bekommen.

Bei Fragen kontaktieren Sie uns:
VVV Nordhorn
Telefon: +49 5921 8039-0
Email: info@vvv-nordhorn.de

Viele Grüße
Ihr Vechteboote Team
            """
            customer_sent = self._send_email(booking.customer_email, customer_subject, customer_body)

            # Notify captain
            if booking.captain:
                captain_subject = f"Stornierung: {booking.customer_name} - {booking.start_date.strftime('%d.%m.%Y')}"
                captain_body = f"""
Hallo {booking.captain.name},

die folgende Buchung wurde storniert:

📅 Datum: {booking.start_date.strftime('%d.%m.%Y, %H:%M')} Uhr
⛵ Boot: {booking.boat.name}
👤 Kunde: {booking.customer_name}

Die Tour entfällt.

Buchungssystem
                """
                captain_sent = self._send_email(booking.captain.email, captain_subject, captain_body)
                self._send_whatsapp(
                    booking.captain.phone,
                    f"Stornierung: Tour am {booking.start_date.strftime('%d.%m.%Y %H:%M')} - {booking.boat.name} - {booking.customer_name}"
                )
            else:
                captain_sent = True

            return customer_sent and captain_sent
        except Exception as e:
            print(f"Error sending cancellation notification: {e}")
            return False

    def _send_email(self, to_email: str, subject: str, body: str) -> bool:
        """Send email via SMTP"""
        if not self.sender_password:
            print("Warning: SMTP password not configured, skipping email")
            return True  # Return True to not break flow

        try:
            message = MIMEMultipart()
            message["From"] = self.sender_email
            message["To"] = to_email
            message["Subject"] = subject

            message.attach(MIMEText(body, "plain"))

            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.send_message(message)

            print(f"✓ Email sent to {to_email}")
            return True
        except Exception as e:
            print(f"✗ Failed to send email: {e}")
            return False

    def _send_whatsapp(self, phone: str, message: str) -> bool:
        """Send WhatsApp message via Twilio"""
        if not self.whatsapp_account_sid or not self.whatsapp_auth_token:
            print("Warning: WhatsApp credentials not configured, skipping WhatsApp")
            return True  # Return True to not break flow

        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{self.whatsapp_account_sid}/Messages.json"

            # Normalize phone number for WhatsApp (add country code if missing)
            if not phone.startswith("+"):
                phone = "+49" + phone.lstrip("0")

            data = {
                "From": f"whatsapp:{self.whatsapp_from_number}",
                "To": f"whatsapp:{phone}",
                "Body": message,
            }

            response = requests.post(
                url,
                data=data,
                auth=(self.whatsapp_account_sid, self.whatsapp_auth_token),
                timeout=10
            )

            if response.status_code == 201:
                print(f"✓ WhatsApp sent to {phone}")
                return True
            else:
                print(f"✗ WhatsApp failed: {response.text}")
                return False
        except Exception as e:
            print(f"✗ Failed to send WhatsApp: {e}")
            return False
