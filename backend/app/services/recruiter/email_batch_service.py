import asyncio
import logging
import uuid
from typing import Any

from fastapi import BackgroundTasks

from app.core.config import settings
from app.db.models.application import ApplicationStatus
from app.db.repositories.application_repo import JobApplicationRepository
from app.db.repositories.email_draft_repo import EmailDraftRepository
from app.integrations.llm.provider import get_llm

logger = logging.getLogger(__name__)


class EmailBatchService:
    def __init__(
        self,
        application_repo: JobApplicationRepository,
        draft_repo: EmailDraftRepository,
    ):
        self.app_repo = application_repo
        self.draft_repo = draft_repo
        self.llm = get_llm(settings.FAST_LLM)

    async def prepare_drafts(
        self,
        job_id: uuid.UUID,
        background_tasks: BackgroundTasks = None,
        direct_send: bool = False,
    ) -> dict[str, Any]:
        """Generate AI-powered polite email drafts for shortlisted and rejected candidates"""
        try:
            # 1. Get all applications for the job with user details
            apps = await self.app_repo.get_by_job(job_id)

            target_apps = [
                app
                for app in apps
                if app.current_status
                in [ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED]
            ]

            if not target_apps:
                return {
                    "success": True,
                    "drafts_count": 0,
                    "message": "No candidates to notify",
                }

            logger.info(
                f"Preparing drafts for {len(target_apps)} applications for job {job_id}"
            )

            # Process in small batches to avoid hitting LLM limits too hard
            batch_size = 5
            for i in range(0, len(target_apps), batch_size):
                batch = target_apps[i : i + batch_size]
                tasks = [self._generate_single_draft(app) for app in batch]
                await asyncio.gather(*tasks)

            if direct_send and background_tasks:
                background_tasks.add_task(self.send_all_drafts_task, job_id)
                return {
                    "success": True,
                    "drafts_count": len(target_apps),
                    "message": f"Drafts prepared and background sending started for {len(target_apps)} candidates.",
                }

            return {
                "success": True,
                "drafts_count": len(target_apps),
                "job_id": str(job_id),
            }
        except Exception as e:
            logger.error(f"Failed to prepare email drafts for job {job_id}: {e}")
            return {"success": False, "error": str(e)}

    async def _generate_single_draft(self, app):
        """Generate a single polite email draft using LLM"""
        try:
            candidate_name = app.candidate_profile.user.name
            job_title = app.job.title if app.job else "the position"
            status = app.current_status
            feedback = app.feedback or "No specific feedback provided."

            prompt = f"""
            Write a highly professional and polite email to {candidate_name} regarding their application for {job_title}.
            Status: {status}
            AI Feedback/Assessment: {feedback}
            Guidelines:
            - If status is 'shortlisted': Be warm, congratulatory, and mention that our team will reach out soon for next steps.
            - If status is 'rejected': Be empathetic, professional, and use the assessment summary to provide a constructive reason. Always thank them for their time.
            - Keep the tone sophisticated but human.
            - Length: Under 150 words.
            - Format: Start with 'Subject:' on the first line, then 'Body:' followed by the email content.
            """

            response = await self.llm.ainvoke(prompt)
            content = response.content

            # Simple parsing
            lines = content.split("\n")
            subject = f"Update on your application for {job_title}"
            body = content

            for line in lines:
                if line.lower().startswith("subject:"):
                    subject = line[8:].strip()
                if line.lower().startswith("body:"):
                    body = content.split(line)[1].strip()
                    break

            await self.draft_repo.upsert_draft(
                application_id=app.application_id, subject=subject, body=body
            )
        except Exception as e:
            logger.error(
                f"Error generating draft for application {app.application_id}: {e}"
            )

    async def get_drafts_for_job(self, job_id: uuid.UUID) -> list[dict[str, Any]]:
        """Fetch all drafts for a job with candidate info"""
        drafts = await self.draft_repo.get_by_job(job_id)

        # We need to backtrack to application info
        result = []
        for d in drafts:
            # Assuming joined loading happened in repo or we fetch app details
            # For now, let's assume get_by_job returns what we need or we fetch it
            app = await self.app_repo.get_with_details(d.application_id)
            if not app:
                continue

            result.append(
                {
                    "draft_id": str(d.draft_id),
                    "application_id": str(d.application_id),
                    "candidate_name": app.candidate_profile.user.name,
                    "candidate_email": app.candidate_profile.user.email,
                    "status": app.current_status,
                    "subject": d.subject,
                    "body": d.body,
                    "is_approved": d.is_approved,
                    "is_sent": d.is_sent,
                }
            )
        return result

    async def send_all_drafts_task(self, job_id: uuid.UUID):
        """
        The actual background task function.
        It fetches drafts and sends them via a single SMTP connection.
        """
        drafts = await self.draft_repo.get_by_job(job_id)
        unsent_drafts = [d for d in drafts if not d.is_sent]

        if not unsent_drafts:
            return

        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        try:
            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(settings.GMAIL_USER, settings.GMAIL_APP_PASSWORD)

                for draft in unsent_drafts:
                    try:
                        app = await self.app_repo.get_with_details(draft.application_id)
                        if not app or not app.candidate_profile.user.email:
                            continue

                        candidate_email = app.candidate_profile.user.email
                        candidate_name = app.candidate_profile.user.name

                        msg = MIMEMultipart("alternative")
                        msg["From"] = settings.GMAIL_USER
                        msg["To"] = candidate_email
                        msg["Subject"] = (
                            draft.subject
                            or f"Update on your application - {candidate_name}"
                        )

                        plain_text = f"Hello {candidate_name}! You have an update on your application. Please check the portal."
                        msg.attach(MIMEText(plain_text, "plain"))
                        msg.attach(MIMEText(draft.body, "html"))

                        server.send_message(msg)

                        await self.draft_repo.mark_as_sent([draft.draft_id])
                        logger.info(
                            f"Successfully sent background email to {candidate_email}"
                        )

                        await asyncio.sleep(0.5)  # Slight pause between sends

                    except Exception as e:
                        logger.error(f"Failed to send draft {draft.draft_id}: {e}")
        except Exception as e:
            logger.error(f"SMTP connection failed: {e}")

    async def send_all_drafts(
        self, job_id: uuid.UUID, background_tasks: BackgroundTasks
    ) -> dict[str, Any]:
        """Trigger the background task and return immediately"""
        drafts = await self.draft_repo.get_by_job(job_id)
        unsent_count = len([d for d in drafts if not d.is_sent])

        if unsent_count == 0:
            return {"success": True, "message": "No unsent drafts found."}

        # Add the slow SMTP loop to FastAPI's background tasks
        background_tasks.add_task(self.send_all_drafts_task, job_id)

        return {
            "success": True,
            "message": f"Started sending {unsent_count} emails in the background.",
        }
