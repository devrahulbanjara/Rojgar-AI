from typing import Dict, Any
from loguru import logger
from app.core.config import settings
from ..schemas import WorkflowState, CandidateScore


def aggregate_scores(state: WorkflowState) -> Dict[str, Any]:
    logger.info("Aggregating scores")
    scored_candidates = []

    for item in state["structured_resumes"]:
        src = item["source_file"]

        skills = next(x for x in state["skills_evaluations"] if x["source_file"] == src)
        exp = next(
            x for x in state["experience_evaluations"] if x["source_file"] == src
        )
        work = next(
            x for x in state["work_alignment_evaluations"] if x["source_file"] == src
        )
        proj = next(x for x in state["project_evaluations"] if x["source_file"] == src)
        deg = next(x for x in state["degree_evaluations"] if x["source_file"] == src)

        final = (
            skills["score"] * settings.SCORE_WEIGHTS["skills"]
            + exp["score"] * settings.SCORE_WEIGHTS["experience_years"]
            + work["score"] * settings.SCORE_WEIGHTS["work_alignment"]
            + proj["score"] * settings.SCORE_WEIGHTS["projects"]
            + deg["score"] * settings.SCORE_WEIGHTS["qualification"]
        ) * 10

        scored = CandidateScore(
            source_file=src,
            final_score=round(final, 2),
            breakdown={
                "skills": skills,
                "experience_years": exp,
                "work_experience_alignment": work,
                "project_alignment": proj,
                "qualification": deg,
            },
        )

        scored_candidates.append(scored)
        logger.success(f"Aggregated score for {src}: {scored.final_score}/100")

    return {"scored_candidates": scored_candidates}
