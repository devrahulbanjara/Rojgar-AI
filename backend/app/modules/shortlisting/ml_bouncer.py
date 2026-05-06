from __future__ import annotations

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
        logger.warning(
            "ML bouncer model not found at {}. All candidates will pass to LLM.",
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


def extract_features(job: Job, application: Application) -> list[float]:
    """Build the feature vector in the exact order the model expects."""
    jd_text = _build_jd_text(job)
    resume_text = _build_resume_text(application)
    resume = application.resume

    tfidf_sim = _tfidf_similarity(jd_text, resume_text)
    semantic_sim = _semantic_similarity(job.jd_embedding, application.resume_embedding)
    yoe = float(resume.years_of_experience or 0) if resume else 0.0
    num_companies = float(len(resume.experiences or [])) if resume else 0.0
    num_educations = float(len(resume.educations or [])) if resume else 0.0
    num_skills = float(len(resume.skills or [])) if resume else 0.0

    return [tfidf_sim, semantic_sim, yoe, num_companies, num_educations, num_skills]


def score_applications(job: Job, applications: list[Application]) -> list[float]:
    """Run the ML bouncer on a batch of applications. Returns probability [0-1] per application."""
    model = _load_model()
    if model is None:
        return [1.0] * len(applications)

    if not applications:
        return []

    features = [extract_features(job, app) for app in applications]
    X = pd.DataFrame(features, columns=_FEATURE_NAMES)
    probabilities = model.predict_proba(X)[:, 1]
    for app, row, prob in zip(applications, features, probabilities, strict=True):
        logger.debug(
            "ML bouncer features app={} job={} {} -> {:.3f}",
            app.id,
            job.id,
            dict(zip(_FEATURE_NAMES, row, strict=True)),
            float(prob),
        )
    return [float(p) for p in probabilities]
