import io
import json
import uuid
from typing import Any

import pdfplumber
from langchain_core.messages import HumanMessage, SystemMessage

from app.core.config import settings
from app.core.logging_config import logger
from app.db.models.resume import (
    Resume,
    ResumeCertification,
    ResumeEducation,
    ResumeSkills,
    ResumeSocialLink,
    ResumeWorkExperience,
)
from app.db.models.user import User
from app.db.repositories.candidate_repo import CandidateProfileRepository
from app.db.repositories.resume_repo import (
    ResumeCertificationRepository,
    ResumeEducationRepository,
    ResumeRepository,
    ResumeSkillRepository,
    ResumeSocialLinkRepository,
    ResumeWorkExperienceRepository,
)
from app.integrations.groq.provider import get_llm
from app.schemas.resume import ResumeCreate, ResumeUpdate


class ResumeService:
    def __init__(
        self,
        resume_repo: ResumeRepository,
        candidate_profile_repo: CandidateProfileRepository,
        resume_work_experience_repo: ResumeWorkExperienceRepository,
        resume_education_repo: ResumeEducationRepository,
        resume_skill_repo: ResumeSkillRepository,
        resume_certification_repo: ResumeCertificationRepository,
        resume_social_link_repo: ResumeSocialLinkRepository,
    ):
        self.resume_repo = resume_repo
        self.candidate_profile_repo = candidate_profile_repo
        self.resume_work_experience_repo = resume_work_experience_repo
        self.resume_education_repo = resume_education_repo
        self.resume_skill_repo = resume_skill_repo
        self.resume_certification_repo = resume_certification_repo
        self.resume_social_link_repo = resume_social_link_repo

    # ---- Core CRUD ----

    async def create_resume_fork(self, user: User, data: ResumeCreate) -> Resume | None:
        """Create a new resume by forking from profile data."""
        profile = await self.candidate_profile_repo.get_full_profile(user.user_id)
        if not profile:
            return None

        new_resume_id = uuid.uuid4()
        new_resume = Resume(
            resume_id=new_resume_id,
            profile_id=profile.profile_id,
            target_job_title=data.target_job_title,
            custom_summary=data.custom_summary or profile.professional_summary,
        )
        await self.resume_repo.create(new_resume)

        # Copy work experiences
        source_experiences = (
            data.work_experiences
            if data.work_experiences is not None
            else (profile.work_experiences or [])
        )
        for exp in source_experiences:
            experience = ResumeWorkExperience(
                resume_work_experience_id=uuid.uuid4(),
                resume_id=new_resume_id,
                job_title=exp.job_title,
                company=exp.company,
                location=exp.location,
                start_date=exp.start_date,
                end_date=exp.end_date,
                is_current=exp.is_current,
                description=getattr(exp, "description", None),
            )
            await self.resume_work_experience_repo.create(experience)

        # Copy educations
        source_educations = (
            data.educations
            if data.educations is not None
            else (profile.educations or [])
        )
        for edu in source_educations:
            education = ResumeEducation(
                resume_education_id=uuid.uuid4(),
                resume_id=new_resume_id,
                college_name=edu.college_name,
                degree=edu.degree,
                location=edu.location,
                start_date=edu.start_date,
                end_date=edu.end_date,
                is_current=edu.is_current,
            )
            await self.resume_education_repo.create(education)

        # Copy skills
        source_skills = (
            data.skills if data.skills is not None else (profile.skills or [])
        )
        for skill in source_skills:
            resume_skill = ResumeSkills(
                resume_skill_id=uuid.uuid4(),
                resume_id=new_resume_id,
                skill_name=skill.skill_name,
            )
            await self.resume_skill_repo.create(resume_skill)

        # Copy certifications
        source_certifications = (
            data.certifications
            if data.certifications is not None
            else (profile.certifications or [])
        )
        for cert in source_certifications:
            certification = ResumeCertification(
                resume_certification_id=uuid.uuid4(),
                resume_id=new_resume_id,
                certification_name=cert.certification_name,
                issuing_body=cert.issuing_body,
                credential_url=cert.credential_url,
                issue_date=cert.issue_date,
                expiration_date=cert.expiration_date,
                does_not_expire=cert.does_not_expire,
            )
            await self.resume_certification_repo.create(certification)

        # Copy social links
        source_links = (
            data.social_links
            if data.social_links is not None
            else (profile.social_links or [])
        )
        for link in source_links:
            social_link = ResumeSocialLink(
                resume_social_link_id=uuid.uuid4(),
                resume_id=new_resume_id,
                type=link.type,
                url=link.url,
            )
            await self.resume_social_link_repo.create(social_link)

        return await self.get_resume(user, new_resume_id)

    async def get_resume(self, user: User, resume_id: uuid.UUID) -> Resume | None:
        """Get resume by ID for a user."""
        resume = await self.resume_repo.get_with_details(resume_id)
        if not resume:
            return None
        profile = await self.candidate_profile_repo.get_by_user_id(user.user_id)
        if profile and resume.profile_id == profile.profile_id:
            return resume
        return None

    async def list_resumes(self, user: User) -> list[Resume]:
        """List all resumes for a user."""
        resumes = await self.resume_repo.get_by_user_id(user.user_id)
        return list(resumes)

    async def delete_resume(self, user: User, resume_id: uuid.UUID) -> Resume | None:
        """Delete a resume."""
        resume = await self.get_resume(user, resume_id)
        if resume:
            await self.resume_repo.delete(resume_id)
        return resume

    # ---- State Sync ----

    async def sync_resume(
        self, user: User, resume_id: uuid.UUID, data: ResumeUpdate
    ) -> Resume | None:
        """Sync resume using full-state replacement for nested collections."""
        resume = await self.get_resume(user, resume_id)
        if not resume:
            return None

        # Update scalar fields
        scalar_fields = {}
        if data.target_job_title is not None:
            scalar_fields["target_job_title"] = data.target_job_title
        if data.custom_summary is not None:
            scalar_fields["custom_summary"] = data.custom_summary
        if data.is_default is not None:
            scalar_fields["is_default"] = data.is_default
            # If setting as default, unset all other defaults for this profile
            if data.is_default:
                all_resumes = await self.resume_repo.get_by_user_id(user.user_id)
                for r in all_resumes:
                    if r.resume_id != resume_id and r.is_default:
                        await self.resume_repo.update(r.resume_id, is_default=False)

        if scalar_fields:
            await self.resume_repo.update(resume_id, **scalar_fields)

        # Sync nested collections
        if data.work_experiences is not None:
            await self._sync_collection(
                resume_id=resume_id,
                existing=resume.work_experiences,
                incoming=data.work_experiences,
                id_field="resume_work_experience_id",
                model_class=ResumeWorkExperience,
                repo=self.resume_work_experience_repo,
                field_names=[
                    "job_title",
                    "company",
                    "location",
                    "start_date",
                    "end_date",
                    "is_current",
                    "description",
                ],
            )

        if data.educations is not None:
            await self._sync_collection(
                resume_id=resume_id,
                existing=resume.educations,
                incoming=data.educations,
                id_field="resume_education_id",
                model_class=ResumeEducation,
                repo=self.resume_education_repo,
                field_names=[
                    "college_name",
                    "degree",
                    "location",
                    "start_date",
                    "end_date",
                    "is_current",
                ],
            )

        if data.skills is not None:
            await self._sync_collection(
                resume_id=resume_id,
                existing=resume.skills,
                incoming=data.skills,
                id_field="resume_skill_id",
                model_class=ResumeSkills,
                repo=self.resume_skill_repo,
                field_names=["skill_name"],
            )

        if data.certifications is not None:
            await self._sync_collection(
                resume_id=resume_id,
                existing=resume.certifications,
                incoming=data.certifications,
                id_field="resume_certification_id",
                model_class=ResumeCertification,
                repo=self.resume_certification_repo,
                field_names=[
                    "certification_name",
                    "issuing_body",
                    "credential_url",
                    "issue_date",
                    "expiration_date",
                    "does_not_expire",
                ],
            )

        if data.social_links is not None:
            await self._sync_collection(
                resume_id=resume_id,
                existing=resume.social_links,
                incoming=data.social_links,
                id_field="resume_social_link_id",
                model_class=ResumeSocialLink,
                repo=self.resume_social_link_repo,
                field_names=["type", "url"],
            )

        return await self.get_resume(user, resume_id)

    async def _sync_collection(
        self,
        resume_id: uuid.UUID,
        existing: list[Any],
        incoming: list[Any],
        id_field: str,
        model_class: type,
        repo: Any,
        field_names: list[str],
    ) -> None:
        """Generic state-sync: create/update/delete nested items."""
        existing_map = {getattr(item, id_field): item for item in existing}
        incoming_ids = set()

        for item in incoming:
            item_id = getattr(item, id_field, None)

            if item_id and item_id in existing_map:
                # Update existing
                incoming_ids.add(item_id)
                update_data = {
                    f: getattr(item, f)
                    for f in field_names
                    if getattr(item, f, None) is not None
                }
                if update_data:
                    await repo.update(item_id, **update_data)
            else:
                # Create new
                new_id = uuid.uuid4()
                create_kwargs = {id_field: new_id, "resume_id": resume_id}
                for f in field_names:
                    val = getattr(item, f, None)
                    if val is not None:
                        create_kwargs[f] = val
                new_item = model_class(**create_kwargs)
                await repo.create(new_item)

        # Delete items not in incoming
        for old_id in existing_map:
            if old_id not in incoming_ids:
                await repo.delete(old_id)

    # ---- PDF Parsing ----

    async def parse_pdf_resume(self, file_bytes: bytes) -> dict:
        """Parse a PDF resume using pdfplumber + LLM structured output."""
        text = ""
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

        if not text.strip():
            return {"error": "Could not extract text from PDF"}

        try:
            llm = get_llm(settings.THINK_LLM)
            system_prompt = """You are a resume parsing assistant. Extract structured data from the resume text.
Return a JSON object with these exact fields:
{
  "target_job_title": "string or null",
  "custom_summary": "string or null",
  "work_experiences": [{"job_title": "str", "company": "str", "location": "str or null", "start_date": "YYYY-MM-DD or null", "end_date": "YYYY-MM-DD or null", "is_current": false, "description": "str or null"}],
  "educations": [{"college_name": "str", "degree": "str", "location": "str or null", "start_date": "YYYY-MM-DD or null", "end_date": "YYYY-MM-DD or null", "is_current": false}],
  "skills": [{"skill_name": "str"}],
  "certifications": [{"certification_name": "str", "issuing_body": "str or null", "credential_url": "str or null", "issue_date": "YYYY-MM-DD or null", "expiration_date": "YYYY-MM-DD or null", "does_not_expire": true}],
  "social_links": [{"type": "str", "url": "str"}]
}
Return ONLY the JSON, no other text."""

            response = await llm.ainvoke(
                [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=f"Parse this resume:\n\n{text[:8000]}"),
                ]
            )

            content = response.content.strip()
            # Extract JSON from potential markdown code blocks
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            return json.loads(content)
        except Exception as e:
            logger.error(f"Error parsing PDF resume with LLM: {e}")
            return {
                "error": f"Failed to parse resume: {e!s}",
                "raw_text": text[:2000],
            }
