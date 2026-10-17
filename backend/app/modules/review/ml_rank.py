"""ML ranking signal: only a tie-break inside a fit bucket, never a decision.

The model (scikit-learn RandomForest, trained on synthetic pairs in
training.py) gave cliffs in the persona audit: a step at semantic similarity
0.70, -44..-58 points for a blank "years of experience", and lower scores for
senior (older) people. So here:

* self-reported years never reach it: the experience feature is a fixed
  neutral constant for everyone;
* its text inputs are blind (no institution names, no years line);
* its output is squeezed into [0, 1) and added below the rubric's resolution
  (see rubric.rank_score), so it only orders candidates with equal evidence;
* the semantic feature is the local multilingual-e5 cosine mapped onto the
  scale the model was trained on (see `_calibrated_similarity`). Vectors from
  another model (other size) count as missing, never as a score.
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
        logger.info("ML ranking model loaded from {}", _MODEL_PATH)
        return model
    except FileNotFoundError:
        logger.error(
            "ML ranking model not found at {}; the review tie-break is neutral "
            "(0.5) for every applicant.",
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


# multilingual-e5 job-vs-CV cosines sit in a narrow band. On the seed data:
# CV vs an unrelated job p5 0.78 / median 0.83, CV vs its own job median 0.88,
# "strong" fits median 0.90. training.py draws the feature from Beta(6, 2)
# with decision points at 0.70 and 0.85, so the raw cosine is mapped linearly
# (E5_UNRELATED -> 0.50, E5_MATCH -> 0.90, clipped to [0, 1]): most unrelated
# pairs land under 0.70 and strong fits above 0.85.
E5_UNRELATED = 0.78
E5_MATCH = 0.90


def _usable(vector: list[float] | None) -> bool:
    from app.infrastructures.ai.service import EMBEDDING_DIM

    return bool(vector) and len(vector) == EMBEDDING_DIM


def _semantic_similarity(
    jd_embedding: list[float] | None,
    resume_embedding: list[float] | None,
) -> float | None:
    """Raw cosine, or None when a vector is missing or from another model."""
    if not (_usable(jd_embedding) and _usable(resume_embedding)):
        return None
    a = np.array(jd_embedding)
    b = np.array(resume_embedding)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return None
    return float(np.dot(a, b) / (norm_a * norm_b))


def _calibrated_similarity(cosine: float) -> float:
    scaled = 0.5 + 0.4 * (cosine - E5_UNRELATED) / (E5_MATCH - E5_UNRELATED)
    return float(min(1.0, max(0.0, scaled)))


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
    cosine = _semantic_similarity(job.jd_embedding, application.resume_embedding)
    if cosine is None:
        return None
    tfidf_sim = _tfidf_similarity(_build_jd_text(job), _build_resume_text(application))
    semantic_sim = _calibrated_similarity(cosine)
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
    """Run the ML ranking model on a batch of applications.

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
            "ML tie-break features app={} job={} {} -> {:.3f}",
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


async def ensure_embeddings(db, job: Job, application: Application) -> None:
    """Fill a missing (or other-model) job/CV vector before `ml_signal`.

    Best effort: on failure the vector stays empty and the tie-break is
    neutral. Written with a direct UPDATE that keeps updated_at (it drives
    "last activity"); the caller commits. The resume lists must be loaded.
    """
    from sqlalchemy import update
    from sqlalchemy.orm.attributes import set_committed_value

    from app.infrastructures.ai.service import ai_service
    from app.infrastructures.qdrant.service import qdrant_service

    pending: list[tuple[Job | Application, str, list[float] | None]] = []
    if not _usable(job.jd_embedding):
        text = qdrant_service._build_job_document(job)
        pending.append((job, "jd_embedding", await ai_service.get_embeddings(text)))
    if not _usable(application.resume_embedding):
        vector = await compute_resume_embedding(application.resume)
        pending.append((application, "resume_embedding", vector))
    for row, column, vector in pending:
        if vector is None:
            continue
        model = type(row)
        await db.execute(
            update(model)
            .where(model.id == row.id)
            .values({column: vector, "updated_at": model.updated_at})
        )
        set_committed_value(row, column, vector)
