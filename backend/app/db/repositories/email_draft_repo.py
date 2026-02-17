import uuid
from collections.abc import Sequence

from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.email_draft import EmailDraft
from app.db.repositories.base import BaseRepository


class EmailDraftRepository(BaseRepository[EmailDraft]):
    def __init__(self, db: AsyncSession):
        super().__init__(EmailDraft, db)

    async def get_by_application(self, application_id: uuid.UUID) -> EmailDraft | None:
        """Get email draft by application ID"""
        query = select(EmailDraft).where(EmailDraft.application_id == application_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_job(self, job_id: uuid.UUID) -> Sequence[EmailDraft]:
        """Get all email drafts for a specific job"""
        from app.db.models.application import JobApplication

        query = (
            select(EmailDraft)
            .join(
                JobApplication,
                EmailDraft.application_id == JobApplication.application_id,
            )
            .where(JobApplication.job_id == job_id)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def upsert_draft(
        self, application_id: uuid.UUID, subject: str, body: str
    ) -> EmailDraft:
        """Create or update an email draft for an application"""
        stmt = (
            insert(EmailDraft)
            .values(application_id=application_id, subject=subject, body=body)
            .on_conflict_do_update(
                index_elements=["application_id"],
                set_={
                    "subject": subject,
                    "body": body,
                    "is_sent": False,  # Reset sent status on update
                },
            )
            .returning(EmailDraft)
        )

        result = await self.db.execute(stmt)
        await self.db.flush()
        return result.scalar_one()

    async def mark_as_sent(self, draft_ids: list[uuid.UUID]):
        """Mark a list of drafts as sent"""
        query = (
            update(EmailDraft)
            .where(EmailDraft.draft_id.in_(draft_ids))
            .values(is_sent=True)
        )
        await self.db.execute(query)
        await self.db.flush()
