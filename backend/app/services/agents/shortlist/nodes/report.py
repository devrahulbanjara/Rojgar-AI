from typing import Any

from langsmith import traceable

from app.core import logger
from app.models.agents.shortlist import WorkflowState

from ..constants import SHORTLIST_THRESHOLD


@traceable(
    name="shortlist_generate_report_node",
    tags=["node:generate_report", "shortlist"],
    metadata={"node_type": "generate_report", "purpose": "generate_final_report"},
)
def generate_report(state: WorkflowState) -> dict[str, Any]:
    logger.info("Generating final report")

    scored = state["scored_candidates"]

    if not scored:
        logger.warning("No candidate to evaluate")
        return {"final_report": None}

    candidate = scored[0]
    is_shortlisted = candidate.final_score >= SHORTLIST_THRESHOLD

    report = {
        "source_file": candidate.source_file,
        "final_score": candidate.final_score,
        "threshold": SHORTLIST_THRESHOLD,
        "is_shortlisted": is_shortlisted,
        "breakdown": candidate.breakdown.model_dump() if candidate.breakdown else None,
    }

    status = "SHORTLISTED" if is_shortlisted else "REJECTED"

    lines = [
        "CANDIDATE EVALUATION REPORT",
        f"File: {candidate.source_file}",
        f"Final Score: {candidate.final_score:.1f} / 100",
        f"Threshold: {SHORTLIST_THRESHOLD}",
        f"Status: {status}",
    ]

    if candidate.breakdown:
        lines.extend(
            [
                "",
                "SCORE BREAKDOWN:",
                f"  Skills: {candidate.breakdown.skills.score:.1f}",
                f"  Experience Years: {candidate.breakdown.experience_years.score:.1f}",
                f"  Work Alignment: {candidate.breakdown.work_experience_alignment.score:.1f}",
                f"  Projects: {candidate.breakdown.project_alignment.score:.1f}",
                f"  Qualification: {candidate.breakdown.qualification.score:.1f}",
            ]
        )

    summary_text = "\n".join(lines)

    logger.info("\n" + "=" * 70)
    logger.info(summary_text)
    logger.info("=" * 70)

    logger.success(f"Report generation complete - {status}")

    return {"final_report": report}
