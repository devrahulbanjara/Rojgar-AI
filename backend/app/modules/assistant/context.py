"""Everything "Ask about this candidate" is allowed to know, loaded in one place.

This is the only file that reads the hiring data model. When B1's model lands
(Application.stage + Review + Event), only `load_candidate_context` changes.

What it reads today (all scoped by Job.company_id == the caller's company):
- applications: id, job_id, status, score, strengths, weaknesses,
  screening_answers, ai_flag_reason, share_headline_summary
- jobs: company_id (tenant check), title, requirements[:6] (must-haves),
  preferred_qualifications[:6] (nice-to-haves)
- resumes (+ experiences, educations, skills): headline, summary (raw CV text for
  guest applicants), years_of_experience, experience title/company/dates/bullets,
  education institution/degree/field, skill names.
  Contact details (email, phone, links, name) are NOT read; emails/phones that
  appear inside CV text are redacted before the text leaves this module.
- candidate_evaluation_scores (scorecards): evaluator_type, evaluator_label,
  criteria_snapshot labels, scores, notes
- interviews: start_time, title
- activity_events (audience="recruiter"): created_at, title, description

B1 mapping: status -> Application.stage; score/strengths/weaknesses ->
Review.fit/summary/checks (criterion, result, evidence); activity_events ->
Event (type, payload); scorecards -> Scorecard (ratings per must-have,
recommendation, notes).
"""

import uuid
from dataclasses import dataclass, field

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.activity.models import ActivityEvent
from app.modules.applications.models import Application
from app.modules.interviews.models import Interview, Scorecard
from app.modules.jobs.models import Job
from app.modules.resumes.models import Resume
from app.shared.text_safety import redact_pii

_MAX_CV_CHARS = 9000
_MAX_SECTION_CHARS = 3000

# Plain words for the current statuses (RECRUITER_FLOW.md section 5).
_STAGE_WORDS = {
    "applied": "New",
    "shortlisted": "Shortlisted",
    "interview_booked": "Interview (booked)",
    "interview_completed": "Interview (done)",
    "offer": "Offer",
    "offer_accepted": "Hired",
    "offer_declined": "Withdrawn (declined offer)",
    "rejected": "Rejected",
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


def _fit_words(score: int | None) -> str | None:
    """Score bands from RECRUITER_FLOW.md: >=75 strong, 50-74 possible, <50 weak."""
    if score is None:
        return None
    if score >= 75:
        return "Strong fit"
    return "Possible fit" if score >= 50 else "Weak fit"


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

    review_lines: list[str] = []
    fit = _fit_words(application.score)
    if fit:
        review_lines.append(fit)
    review_lines += [f"Strength: {s}" for s in application.strengths or []]
    review_lines += [f"Gap: {w}" for w in application.weaknesses or []]

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

    return CandidateContext(
        application_id=application.id,
        job_title=job.title,
        stage=_STAGE_WORDS.get(str(application.status.value), "New"),
        must_haves=list(job.requirements or [])[:6],
        nice_to_haves=list(job.preferred_qualifications or [])[:6],
        flag_reason=application.ai_flag_reason,
        sections={
            "cv": _cv_text(resume, application.share_headline_summary),
            "answers": _answers_text(application.screening_answers),
            "review": "\n".join(review_lines)[:_MAX_SECTION_CHARS],
            "scorecards": "\n".join(scorecard_lines)[:_MAX_SECTION_CHARS],
            "activity": "\n".join(activity_lines)[:_MAX_SECTION_CHARS],
        },
    )
