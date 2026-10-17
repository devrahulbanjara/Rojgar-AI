"""ML ranking signal: only a tie-break inside a fit bucket, never a decision.

The model (scikit-learn RandomForest, trained on synthetic pairs in
training.py) gave cliffs in the persona audit: a step at semantic similarity
0.70, -44..-58 points for a blank "years of experience", and lower scores for
senior (older) people. So here:

* self-reported years never reach it: the experience feature is a fixed
  neutral constant for everyone;
* its text inputs are blind (no institution names, no years line);
* its output is squeezed into [0, 1) and added below the rubric's resolution
  (see rubric.rank_score), so it only orders candidates with equal evidence.
"""

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

# Fixed for every applicant so self-reported years cannot move the signal.
NEUTRAL_YEARS = 5.0
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
    return blind_resume_text(resume)


def blind_resume_text(resume) -> str:
    """Resume text for similarity features: no institutions, no years line."""
    parts = [resume.headline or "", resume.summary or ""]
    parts.extend(
        f"{e.title or ''} at {e.company_name or ''}" for e in resume.experiences or []
    )
    parts.extend(
        " ".join(p for p in [e.degree, e.field_of_study] if p)
        for e in resume.educations or []
    )
    parts.append(", ".join(s.skill_name for s in resume.skills or [] if s.skill_name))
    return " ".join(p for p in parts if p)


def _build_jd_text(job: Job) -> str:
    return " ".join(
        [
            job.title or "",
            job.description or "",
            ", ".join(job.must_haves or []),
            ", ".join(job.nice_to_haves or []),
        ]
    )


def extract_features(job: Job, application: Application) -> list[float] | None:
    """Feature vector in model order, or None when an input is missing."""
    resume = application.resume
    if resume is None:
        return None
    if not job.jd_embedding or not application.resume_embedding:
        return None
    tfidf_sim = _tfidf_similarity(_build_jd_text(job), _build_resume_text(application))
    semantic_sim = _semantic_similarity(job.jd_embedding, application.resume_embedding)
    num_companies = float(len(resume.experiences or []))
    num_educations = float(len(resume.educations or []))
    num_skills = float(len(resume.skills or []))
    return [
        tfidf_sim,
        semantic_sim,
        NEUTRAL_YEARS,
        num_companies,
        num_educations,
        num_skills,
    ]


def score_applications(job: Job, applications: list[Application]) -> list[float | None]:
    """Run the ML bouncer on a batch of applications.

    CPU-bound and synchronous (TF-IDF + scikit-learn): async callers must run
    it via `asyncio.to_thread`. Applications must be fully loaded (no lazy
    loads happen off the event loop).

    Returns a probability [0-1] per application, or None where the model cannot
    produce a trustworthy score (model file missing, or required inputs missing).
    Used only as `rubric.rank_score`'s tie-break.
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


def ml_signal(job: Job, application: Application) -> float | None:
    """Tie-break signal for one application (sync, CPU-bound: use to_thread)."""
    return score_applications(job, [application])[0]


def assert_model_available() -> None:
    """Fail fast in production if the model file is missing."""
    if _load_model() is None:
        raise RuntimeError(
            f"ML ranking model not found at {_MODEL_PATH}. Ship "
            "ml_bouncer_model.pkl with the image (see Dockerfile)."
        )


async def compute_resume_embedding(resume) -> list[float] | None:
    """Embedding of the blind resume text (no names, institutions or years)."""
    from app.infrastructures.ai.service import ai_service

    if resume is None:
        return None
    text = blind_resume_text(resume)
    return await ai_service.get_embeddings(text) if text.strip() else None
