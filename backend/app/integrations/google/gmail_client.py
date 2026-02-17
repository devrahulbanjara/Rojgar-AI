import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def send_interview_email(
    to_email: str, candidate_name: str, html_content: str, subject: str = None
) -> dict:
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = settings.GMAIL_USER
        msg["To"] = to_email
        msg["Subject"] = subject or (f"Update on your application - {candidate_name}")
        plain_text = f"Hello {candidate_name}! You have an update on your application. Please check the portal for details."
        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_content, "html"))
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(settings.GMAIL_USER, settings.GMAIL_APP_PASSWORD)
            server.send_message(msg)
        return {"send_status": "success"}
    except Exception as e:
        return {"send_status": f"failed: {str(e)}"}
