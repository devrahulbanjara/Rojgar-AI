from email.message import EmailMessage

import aiosmtplib
from loguru import logger

from app.core.config import settings
from app.core.constants import PRODUCT_NAME


class EmailService:
    """
    Generic async email sender backed by aiosmtplib.
    """

    @staticmethod
    async def _send(subject: str, recipient: str, html_content: str) -> None:
        """Send one HTML email or log-and-skip when email sending is disabled."""
        message = EmailMessage()
        message["From"] = f"{PRODUCT_NAME} <{settings.mail_from}>"
        message["To"] = recipient
        message["Subject"] = subject
        message.add_alternative(html_content, subtype="html")

        if not settings.send_emails:
            logger.info(
                f"Email sending disabled — skipping email to {recipient} | Subject: {subject}"
            )
            return

        try:
            await aiosmtplib.send(
                message,
                hostname=settings.smtp_host,
                port=settings.smtp_port,
                username=settings.smtp_user,
                password=settings.smtp_password,
                start_tls=True,
            )
            logger.info(f"Email sent to {recipient} | Subject: {subject}")
        except Exception as e:
            logger.error(f"Failed to send email to {recipient}: {e}")

    @staticmethod
    async def send_calendar_email(
        to_email: str,
        subject: str,
        html_body: str,
        ics: str,
        method: str,
    ) -> bool:
        """Send an email carrying a calendar invite (.ics). Never raises.

        The invite is both an inline text/calendar part (Gmail/Outlook show
        Accept/Decline) and an invite.ics attachment for other clients.
        """
        message = EmailMessage()
        message["From"] = f"{PRODUCT_NAME} <{settings.mail_from}>"
        message["To"] = to_email
        message["Subject"] = subject
        message.set_content("Your calendar invite is attached.")
        message.add_alternative(html_body, subtype="html")
        message.add_alternative(ics, subtype="calendar", params={"method": method})
        message.add_attachment(
            ics.encode(),
            maintype="application",
            subtype="ics",
            filename="invite.ics",
        )
        if not settings.send_emails:
            logger.info(f"Email sending disabled — skipping invite to {to_email}")
            return True
        try:
            await aiosmtplib.send(
                message,
                hostname=settings.smtp_host,
                port=settings.smtp_port,
                username=settings.smtp_user,
                password=settings.smtp_password,
                start_tls=True,
                timeout=30,
            )
            return True
        except Exception as exc:
            logger.error(f"Failed to send calendar email to {to_email}: {exc}")
            return False

    @classmethod
    async def send_verification(cls, email: str, token: str) -> None:
        """Send the account-verification email."""
        link = f"{settings.frontend_url}/verify-email?token={token}"
        html = f"""
        <div style="font-family: sans-serif; padding: 20px;">
            <h2>Welcome to Rojgar AI!</h2>
            <p>Please click the button below to verify your email address:</p>
            <a href="{link}"
               style="display: inline-block; background: #007bff; color: white;
                      padding: 10px 20px; text-decoration: none; border-radius: 5px;">
               Verify Email
            </a>
            <p style="margin-top: 16px; font-size: 13px; color: #666;">
                Or copy this link:<br>{link}
            </p>
            <p style="font-size: 12px; color: #999;">
                If you didn't create an account, you can safely ignore this email.
            </p>
        </div>
        """
        await cls._send("Verify your Rojgar AI Account", email, html)

    @classmethod
    async def send_password_reset(cls, email: str, token: str) -> None:
        """Send the password-reset email."""
        link = f"{settings.frontend_url}/reset-password?token={token}"
        html = f"""
        <div style="font-family: sans-serif; padding: 20px;">
            <h2>Password Reset Request</h2>
            <p>Click the button below to reset your password. This link expires in 1 hour.</p>
            <a href="{link}"
               style="display: inline-block; background: #dc3545; color: white;
                      padding: 10px 20px; text-decoration: none; border-radius: 5px;">
               Reset Password
            </a>
            <p style="margin-top: 16px; font-size: 13px; color: #666;">
                Or copy this link:<br>{link}
            </p>
            <p style="font-size: 12px; color: #999;">
                If you didn't request a password reset, you can safely ignore this email.
            </p>
        </div>
        """
        await cls._send("Reset your Rojgar AI Password", email, html)

    @classmethod
    async def send_generic_email(
        cls, to_email: str, subject: str, html_body: str
    ) -> None:
        """Send a generic HTML email through the shared SMTP transport."""
        await cls._send(subject, to_email, html_body)

    @classmethod
    async def send_generic_email_or_raise(
        cls, to_email: str, subject: str, html_body: str
    ) -> None:
        """Send an HTML email and raise on delivery failure.

        Used where the caller records delivery (decision emails), so a failed
        SMTP call is never reported as a sent email.
        """
        if not settings.send_emails:
            logger.info(f"Email sending disabled — skipping email to {to_email}")
            return
        message = EmailMessage()
        message["From"] = f"{PRODUCT_NAME} <{settings.mail_from}>"
        message["To"] = to_email
        message["Subject"] = subject
        message.add_alternative(html_body, subtype="html")
        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            start_tls=True,
            timeout=30,
        )
