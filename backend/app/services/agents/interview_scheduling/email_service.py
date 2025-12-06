"""
Email service for interview scheduling agent.
"""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def send_interview_email(
    to_email: str,
    candidate_name: str,
    html_content: str,
) -> dict:
    """
    Send interview scheduling email to a candidate.

    Args:
        to_email: Recipient email address.
        candidate_name: Name of the candidate.
        html_content: HTML email body content.

    Returns:
        Dictionary with send_status: 'success' or 'failed: <reason>'.
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = settings.GMAIL_USER
        msg["To"] = to_email
        msg["Subject"] = (
            f"Congratulations {candidate_name}! "
            "You've Been Shortlisted - Schedule Your Interview"
        )

        # Plain text fallback
        plain_text = (
            f"Congratulations {candidate_name}! "
            f"You have been shortlisted. "
            f"Please schedule your interview here: {settings.BOOKING_LINK}"
        )
        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(settings.GMAIL_USER, settings.GMAIL_APP_PASSWORD)
            server.send_message(msg)

        return {"send_status": "success"}

    except Exception as e:
        return {"send_status": f"failed: {str(e)}"}
