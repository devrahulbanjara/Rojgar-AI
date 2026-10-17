"""Everything "Ask about this candidate" is allowed to know, loaded in one place.

Scoped by Job.company_id == the caller's company:
- applications: id, job_id, stage, screening_answers, share_headline_summary
- jobs: company_id, title, must_haves, nice_to_haves
- resumes: headline, summary, experiences, educations, skills (PII redacted)
- reviews: fit, summary, checks (criterion, result, evidence)
- scorecards: ratings per must-have, recommendation, notes
- events/activity: timeline of application actions
"""

import uuid
from dataclasses import dataclass, field

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.activity.models import ActivityEvent
from app.modules.applications.models import Application, Review
from app.modules.interviews.models import Interview, Scorecard
from app.modules.jobs.models import Job
from app.modules.resumes.models import Resume
from app.shared.text_safety import redact_pii

_MAX_CV_CHARS = 9000
_MAX_SECTION_CHARS = 3000

_STAGE_WORDS = {
    "new": "New",
    "shortlisted": "Shortlisted",
    "interview": "Interview",
    "offer": "Offer",
    "hired": "Hired",
    "rejected": "Rejected",
    "withdrawn": "Withdrawn",
}


@dataclass
class CandidateContext:
    application_id: uuid.UUID
    job_title: str
    stage: str
    must_haves: list[str]
    nice_to_haves: list[str]
    flag_reason: str | None
    # Quotable text by source: cv, answers, review, scorecards, activity.
    sections: dict[str, str] = field(default_factory=dict)

    @property
    def cv_available(self) -> bool:
        return bool(self.sections.get("cv", "").strip())


def _cv_text(resume: Resume | None, include_summary: bool) -> str:
    if resume is None:
        return ""
    lines: list[str] = []
    if include_summary and resume.headline:
        lines.append(resume.headline)
    if include_summary and resume.summary:
        lines.append(resume.summary)
    if resume.years_of_experience is not None:
        lines.append(f"Years of experience: {resume.years_of_experience}")
    for exp in resume.experiences:
        dates = " - ".join(
            d.strftime("%b %Y") if d else "present"
            for d in (exp.start_date, exp.end_date)
        )
        lines.append(f"{exp.title} at {exp.company_name} ({dates})")
        lines.extend(f"- {b}" for b in exp.description or [] if b)
    for edu in resume.educations:
        parts = [edu.degree, edu.field_of_study, edu.institution]
        lines.append("Education: " + ", ".join(p for p in parts if p))
    if resume.skills:
        lines.append("Skills: " + ", ".join(s.skill_name for s in resume.skills))
    return redact_pii("\n".join(lines))[:_MAX_CV_CHARS]


def _answers_text(answers: list[dict] | None) -> str:
    lines = [
        f"Q: {a.get('question', '')}\nA: {a.get('answer', '')}"
        for a in answers or []
        if isinstance(a, dict) and str(a.get("answer", "")).strip()
    ]
    return redact_pii("\n".join(lines))[:_MAX_SECTION_CHARS]


async def load_candidate_context(
    db: AsyncSession, *, company_id: uuid.UUID, application_id: uuid.UUID
) -> CandidateContext | None:
    """Return the application's data, or None if it is not in this company."""
    row = (
        await db.execute(
            select(Application, Job)
            .join(Job, Job.id == Application.job_id)
            .where(Application.id == application_id, Job.company_id == company_id)
        )
    ).first()
    if row is None:
        return None
    application, job = row

    resume = await db.scalar(
        select(Resume)
        .where(Resume.id == application.resume_id)
        .options(
            selectinload(Resume.experiences),
            selectinload(Resume.educations),
            selectinload(Resume.skills),
        )
    )

    review = await db.scalar(
        select(Review).where(Review.application_id == application.id)
    )

    review_lines: list[str] = []
    if review:
        if review.fit:
            fit_val = review.fit.value if hasattr(review.fit, "value") else str(review.fit)
            review_lines.append(f"{fit_val.capitalize()} fit")
        if review.summary:
            review_lines.append(f"Summary: {review.summary}")
        for c in review.checks or []:
            crit = c.get("criterion", "")
            res = c.get("result", "")
            quote = c.get("evidence", "")
            line = f"Check: {crit} → {res}"
            if quote:
                line += f" (Quote: \"{quote}\")"
            review_lines.append(line)

    scorecards = (
        await db.scalars(
            select(Scorecard)
            .join(Interview, Interview.id == Scorecard.interview_id)
            .where(Interview.application_id == application.id)
            .order_by(Scorecard.created_at.asc())
        )
    ).all()
    scorecard_lines: list[str] = []
    for card in scorecards:
        ratings = ", ".join(
            f"{r.get('criterion')}: {r.get('rating')}/4"
            for r in card.ratings or []
            if r.get("rating") is not None
        )
        recommendation = card.recommendation.replace("_", " ")
        scorecard_lines.append(
            f"Interviewer rated {ratings or 'nothing yet'}; recommendation: {recommendation}"
        )
        if card.notes:
            scorecard_lines.append(f"Interviewer notes: {card.notes}")

    interviews = (
        await db.scalars(
            select(Interview)
            .where(Interview.application_id == application.id)
            .order_by(Interview.start_time.asc())
        )
    ).all()
    events = (
        await db.scalars(
            select(ActivityEvent)
            .where(
                ActivityEvent.application_id == application.id,
                ActivityEvent.audience == "recruiter",
            )
            .order_by(ActivityEvent.created_at.desc())
            .limit(30)
        )
    ).all()
    activity_lines = [
        f"{i.start_time:%d %b %Y %H:%M} Interview booked: {i.title or 'Interview'}"
        for i in interviews
    ] + [
        f"{e.created_at:%d %b %Y} {e.title}"
        + (f": {e.description}" if e.description else "")
        for e in reversed(events)
    ]

    stage_key = application.stage.value if hasattr(application.stage, "value") else str(application.stage)
    return CandidateContext(
        application_id=application.id,
        job_title=job.title,
        stage=_STAGE_WORDS.get(stage_key, "New"),
        must_haves=list(job.must_haves or [])[:6],
        nice_to_haves=list(job.nice_to_haves or [])[:6],
        flag_reason=review.flag_reason if review else None,
        sections={
            "cv": _cv_text(resume, application.share_headline_summary),
            "answers": _answers_text(application.screening_answers),
            "review": "\n".join(review_lines)[:_MAX_SECTION_CHARS],
            "scorecards": "\n".join(scorecard_lines)[:_MAX_SECTION_CHARS],
            "activity": "\n".join(activity_lines)[:_MAX_SECTION_CHARS],
        },
    )
