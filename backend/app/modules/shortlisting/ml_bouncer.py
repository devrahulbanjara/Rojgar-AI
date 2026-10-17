from __future__ import annotations

from datetime import date
from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd
from loguru import logger
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity as sklearn_cosine

from app.modules.applications.models import Application
from app.modules.jobs.models import Job

_MODEL_PATH = Path(__file__).resolve().parents[3] / "ml_bouncer_model.pkl"
_FEATURE_NAMES = [
    "tfidf_sim",
    "semantic_sim",
    "yoe",
    "num_companies",
    "num_educations",
    "num_skills",
]


@lru_cache(maxsize=1)
def _load_model():
    """Lazy-load the trained Random Forest model from disk."""
    import joblib

    try:
        model = joblib.load(_MODEL_PATH)
        logger.info("ML bouncer model loaded from {}", _MODEL_PATH)
        return model
    except FileNotFoundError:
        logger.error(
            "ML bouncer model not found at {}. Applications will not be ML-scored "
            "and are routed to recruiter review.",
            _MODEL_PATH,
        )
        return None


def _tfidf_similarity(text_a: str, text_b: str) -> float:
    vectorizer = TfidfVectorizer()
    try:
        tfidf_matrix = vectorizer.fit_transform([text_a, text_b])
        sim = sklearn_cosine(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return float(sim)
    except ValueError:
        return 0.0


def _semantic_similarity(
    jd_embedding: list[float] | None,
    resume_embedding: list[float] | None,
) -> float:
    if not jd_embedding or not resume_embedding:
        return 0.0
    a = np.array(jd_embedding)
    b = np.array(resume_embedding)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def _build_resume_text(application: Application) -> str:
    resume = application.resume
    if resume is None:
        return ""
    parts = [
        resume.headline or "",
        resume.summary or "",
    ]
    if resume.experiences:
        parts.extend(
            f"{e.title or ''} at {e.company_name or ''}" for e in resume.experiences
        )
    if resume.educations:
        parts.extend(
            " ".join(p for p in [e.degree, e.field_of_study, e.institution] if p)
            for e in resume.educations
        )
    if resume.skills:
        parts.append(", ".join(s.skill_name for s in resume.skills if s.skill_name))
    return " ".join(parts)


def _build_jd_text(job: Job) -> str:
    parts = [
        job.title or "",
        job.overview or "",
        ", ".join(job.responsibilities or []),
        ", ".join(job.requirements or []),
        ", ".join(job.preferred_qualifications or []),
        ", ".join(job.benefits or []),
    ]
    return " ".join(parts)


def _years_of_experience(application: Application) -> float | None:
    """Self-reported years, else derived from role dates; None when unknown.

    A missing value must not be read as "0 years": the model treats that as
    junior and scores it near zero, which silently buries the candidate.
    """
    resume = application.resume
    if resume is None:
        return None
    if resume.years_of_experience is not None:
        return float(resume.years_of_experience)
    months = 0
    for exp in resume.experiences or []:
        if exp.start_date is None:
            continue
        end = exp.end_date or date.today()
        months += max(
            0, (end.year - exp.start_date.year) * 12 + end.month - exp.start_date.month
        )
    return round(months / 12, 1) if months else None


def extract_features(job: Job, application: Application) -> list[float] | None:
    """Build the feature vector in the exact order the model expects.

    Returns None when an input the model depends on is missing (no resume, no
    embedding, unknown experience). Those applications are routed to a human
    instead of receiving a fabricated low score.
    """
    resume = application.resume
    if resume is None:
        return None
    if not job.jd_embedding or not application.resume_embedding:
        return None
    yoe = _years_of_experience(application)
    if yoe is None:
        return None

    tfidf_sim = _tfidf_similarity(_build_jd_text(job), _build_resume_text(application))
    semantic_sim = _semantic_similarity(job.jd_embedding, application.resume_embedding)
    num_companies = float(len(resume.experiences or []))
    num_educations = float(len(resume.educations or []))
    num_skills = float(len(resume.skills or []))

    return [tfidf_sim, semantic_sim, yoe, num_companies, num_educations, num_skills]


def score_applications(job: Job, applications: list[Application]) -> list[float | None]:
    """Run the ML bouncer on a batch of applications.

    Returns a probability [0-1] per application, or None where the model cannot
    produce a trustworthy score (model file missing, or required inputs missing).
    The score is used to rank applications; it never rejects anyone on its own.
    """
    if not applications:
        return []

    model = _load_model()
    if model is None:
        return [None] * len(applications)

    features = [extract_features(job, app) for app in applications]
    scorable = [i for i, row in enumerate(features) if row is not None]
    results: list[float | None] = [None] * len(applications)
    if not scorable:
        return results

    X = pd.DataFrame([features[i] for i in scorable], columns=_FEATURE_NAMES)
    probabilities = model.predict_proba(X)[:, 1]
    for i, prob in zip(scorable, probabilities, strict=True):
        results[i] = float(prob)
        logger.debug(
            "ML bouncer features app={} job={} {} -> {:.3f}",
            applications[i].id,
            job.id,
            dict(zip(_FEATURE_NAMES, features[i] or [], strict=True)),
            float(prob),
        )
    return results


def assert_model_available() -> None:
    """Fail fast if the ML pre-filter model file is missing.

    Called at startup in production: a missing file previously made every
    applicant score 100 and be shortlisted. Outside production, missing-model
    scoring returns None so applications route to human review instead.
    """
    if _load_model() is None:
        raise RuntimeError(
            f"ML pre-filter model not found at {_MODEL_PATH}. Ship "
            "ml_bouncer_model.pkl with the image (see Dockerfile)."
        )
