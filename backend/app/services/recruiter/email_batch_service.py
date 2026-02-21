import asyncio
import smtplib
import uuid
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

from fastapi import BackgroundTasks

from app.agents.scheduler.main import process_email_batch
from app.core.config import settings
from app.core.logging_config import logger
from app.db.models.application import ApplicationStatus
from app.db.repositories.application_repo import JobApplicationRepository
from app.db.repositories.email_draft_repo import EmailDraftRepository


class EmailBatchService:
    def __init__(
        self,
        application_repo: JobApplicationRepository,
        draft_repo: EmailDraftRepository,
    ):
        self.app_repo = application_repo
        self.draft_repo = draft_repo

    async def prepare_drafts(
        self,
        job_id: uuid.UUID,
        background_tasks: BackgroundTasks = None,
        direct_send: bool = False,
    ) -> dict[str, Any]:
        """Generate AI-powered email drafts using LangGraph agent (idempotent)"""
        try:
            # 1. Fetch applications with organization details
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

            # 2. Check which apps ALREADY have drafts to avoid double-billing LLM
            existing_drafts = await self.draft_repo.get_by_job(job_id)
            existing_app_ids = {d.application_id for d in existing_drafts}

            apps_needing_drafts = [
                app for app in target_apps if app.application_id not in existing_app_ids
            ]

            if not apps_needing_drafts:
                logger.info(f"All drafts already exist for job {job_id}")
                return {
                    "success": True,
                    "drafts_count": len(existing_drafts),
                    "message": "All drafts already prepared",
                }

            # 3. Get the Organization Name safely
            org_name = (
                target_apps[0].organization.name
                if target_apps[0].organization
                else "Our Team"
            )

            logger.info(
                f"Preparing {len(apps_needing_drafts)} new drafts for job {job_id} (Org: {org_name})"
            )

            # 4. Prepare data for the LangGraph Agent (only for new ones)
            candidate_data = [
                {
                    "application_id": str(app.application_id),
                    "name": app.candidate_profile.user.name,
                    "email": app.candidate_profile.user.email,
                    "status": app.current_status,
                    "score": app.score or 0,
                    "feedback": app.feedback or "",
                }
                for app in apps_needing_drafts
            ]

            # 5. CALL THE AGENT (This ensures your "Strict Rules" are applied)
            agent_results = await process_email_batch(
                candidate_data, org_name=org_name, auto_approve=False
            )

            # 6. Save the agent-generated drafts to the database
            for res in agent_results:
                await self.draft_repo.upsert_draft(
                    application_id=uuid.UUID(res["application_id"]),
                    subject=res["subject"],
                    body=res["draft_email_html"],
                )

            total_drafts = len(existing_drafts) + len(agent_results)

            if direct_send and background_tasks:
                background_tasks.add_task(self.send_all_drafts_task, job_id)
                return {
                    "success": True,
                    "drafts_count": total_drafts,
                    "message": f"Drafts prepared and background sending started for {total_drafts} candidates.",
                }

            return {
                "success": True,
                "drafts_count": total_drafts,
                "new_drafts": len(agent_results),
                "job_id": str(job_id),
            }
        except Exception as e:
            logger.error(f"Failed to prepare email drafts for job {job_id}: {e}")
            return {"success": False, "error": str(e)}

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
                    "is_discarded": d.is_discarded,
                }
            )
        return result

    async def send_single_draft(self, draft_id: uuid.UUID) -> dict[str, Any]:
        """Send a single email draft"""
        try:
            draft = await self.draft_repo.get(draft_id)
            if not draft:
                return {"success": False, "error": "Draft not found"}

            if draft.is_sent:
                return {"success": False, "error": "Draft already sent"}

            app = await self.app_repo.get_with_details(draft.application_id)
            if not app or not app.candidate_profile.user.email:
                return {"success": False, "error": "Application or email not found"}

            candidate_email = app.candidate_profile.user.email
            candidate_name = app.candidate_profile.user.name

            msg = MIMEMultipart("alternative")
            msg["From"] = settings.GMAIL_USER
            msg["To"] = candidate_email
            msg["Subject"] = (
                draft.subject or f"Update on your application - {candidate_name}"
            )

            plain_text = (
                f"Hello {candidate_name}! You have an update on your application."
            )
            msg.attach(MIMEText(plain_text, "plain"))
            msg.attach(MIMEText(draft.body, "html"))

            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(settings.GMAIL_USER, settings.GMAIL_APP_PASSWORD)
                server.send_message(msg)

            await self.draft_repo.mark_as_sent([draft.draft_id])
            logger.info(f"Successfully sent email to {candidate_email}")

            return {"success": True, "message": f"Email sent to {candidate_name}"}

        except Exception as e:
            logger.error(f"Failed to send draft {draft_id}: {e}")
            return {"success": False, "error": str(e)}

    async def send_all_drafts_task(self, job_id: uuid.UUID):
        """
        The actual background task function.
        It fetches drafts and sends them via a single SMTP connection.
        """
        drafts = await self.draft_repo.get_by_job(job_id)
        unsent_drafts = [d for d in drafts if not d.is_sent]

        if not unsent_drafts:
            return

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

        background_tasks.add_task(self.send_all_drafts_task, job_id)

        return {
            "success": True,
            "message": f"Started sending {unsent_count} emails in the background.",
        }

    async def prepare_and_send_agentic_emails(
        self, job_id: uuid.UUID, auto_send: bool = False
    ) -> dict[str, Any]:
        """2026 Agentic Email Pipeline with Empathetic Transparency"""
        try:
            apps = await self.app_repo.get_by_job(job_id)

            if not apps:
                return {
                    "success": True,
                    "processed": 0,
                    "message": "No candidates to notify",
                }

            # Get organization name from the first application
            org_name = apps[0].organization.name if apps[0].organization else "Our Team"

            candidate_data = [
                {
                    "application_id": str(app.application_id),
                    "name": app.candidate_profile.user.name,
                    "email": app.candidate_profile.user.email,
                    "status": app.current_status,
                    "score": app.score or 0,
                    "feedback": app.feedback or "No feedback provided.",
                }
                for app in apps
                if app.current_status in ["shortlisted", "rejected"]
            ]

            if not candidate_data:
                return {
                    "success": True,
                    "processed": 0,
                    "message": "No candidates to notify",
                }

            # Pass org_name to the agent orchestrator
            results = await process_email_batch(
                candidate_data, org_name=org_name, auto_approve=auto_send
            )

            success_count = sum(1 for r in results if r.get("send_status") == "success")

            return {
                "success": True,
                "processed": len(results),
                "sent": success_count,
                "message": f"Processed {len(results)} emails, {success_count} sent successfully.",
            }

        except Exception as e:
            logger.error(f"Failed to process agentic emails for job {job_id}: {e}")
            return {"success": False, "error": str(e)}
