from typing import Dict, Any

from app.core import logger
from ..schemas import WorkflowState


def evaluate_skills(state: WorkflowState) -> Dict[str, Any]:
    logger.info("Evaluating skills")
    job_req = state["job_requirements"]
    skills_evaluations = []

    required_skills_set = {s.lower().strip() for s in job_req.required_skills}

    for item in state["structured_resumes"]:
        resume = item["data"]
        candidate_skills_set = {s.lower().strip() for s in resume.skills}

        matched = required_skills_set.intersection(candidate_skills_set)
        score = (
            (len(matched) / len(required_skills_set) * 10) if required_skills_set else 0
        )

        if matched:
            justification = f"Matched {len(matched)} out of {len(required_skills_set)} required skills: {', '.join(sorted(matched))}"
        else:
            justification = f"No matching skills found. Required: {', '.join(sorted(required_skills_set))}"

        skills_evaluations.append(
            {
                "source_file": item["source_file"],
                "score": round(score, 2),
                "matched": sorted(matched),
                "justification": justification,
            }
        )

        logger.success(f"Skills evaluated for {item['source_file']}: {score:.2f}/10")

    return {"skills_evaluations": skills_evaluations}
