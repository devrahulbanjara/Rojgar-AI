import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def send_interview_email(to_email: str, candidate_name: str, html_content: str) -> dict:
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = settings.GMAIL_USER
        msg["To"] = to_email
        msg["Subject"] = (
            f"Congratulations {candidate_name}! You've Been Shortlisted - Schedule Your Interview"
        )
        plain_text = f"Congratulations {candidate_name}! You have been shortlisted. Please schedule your interview here: {settings.BOOKING_LINK}"
        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_content, "html"))
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(settings.GMAIL_USER, settings.GMAIL_APP_PASSWORD)
            server.send_message(msg)
        return {"send_status": "success"}
    except Exception as e:
        return {"send_status": f"failed: {str(e)}"}
