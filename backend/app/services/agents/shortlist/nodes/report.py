from typing import Any

from langsmith import traceable

from app.core import logger, settings
from app.models.agents.shortlist import WorkflowState

from ..file_handler import save_json_report, save_text_report


@traceable(
    name="shortlist_generate_report_node",
    tags=["node:generate_report", "shortlist"],
    metadata={"node_type": "generate_report", "purpose": "generate_final_report"},
)
def generate_report(state: WorkflowState) -> dict[str, Any]:
    logger.info("Generating final report")

    scored = sorted(
        state["scored_candidates"], key=lambda x: x.final_score, reverse=True
    )

    shortlisted = [c for c in scored if c.final_score >= settings.SHORTLIST_THRESHOLD]
    rejected = [c for c in scored if c.final_score < settings.SHORTLIST_THRESHOLD]

    # Build JSON report
    report = {
        "evaluation_summary": {
            "total_candidates": len(scored),
            "shortlisted_count": len(shortlisted),
            "rejected_count": len(rejected),
            "threshold_score": settings.SHORTLIST_THRESHOLD,
        },
        "shortlisted_candidates": [c.model_dump() for c in shortlisted],
        "rejected_candidates": [c.model_dump() for c in rejected],
    }

    # Build text summary
    lines = [
        "CANDIDATE EVALUATION REPORT",
        f"Total Candidates: {len(scored)}",
        f"Shortlisted: {len(shortlisted)}",
        f"Rejected: {len(rejected)}",
        "",
    ]

    for i, cand in enumerate(shortlisted, 1):
        lines.extend(
            [
                f"{i}. {cand.source_file}",
                f"   Final Score: {cand.final_score}",
            ]
        )

    if rejected:
        lines.append("\nREJECTED CANDIDATES:\n")
        for i, cand in enumerate(rejected, 1):
            lines.extend(
                [
                    f"{i}. {cand.source_file}",
                    f"   Final Score: {cand.final_score}",
                ]
            )

    summary_text = "\n".join(lines)

    save_json_report(report, "shortlist_report.json")
    save_text_report(summary_text, "shortlist_summary.txt")

    logger.success("Report generation complete")

    return {"final_report": report}
