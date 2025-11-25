import json
from typing import Dict, Any
from pathlib import Path
from loguru import logger

from schemas import (
    WorkflowState,
    JobRequirements,
    ResumeStructured,
    EvaluationScore,
    CandidateScore,
)
from templates import (
    JOB_DESCRIPTION_PARSER_PROMPT,
    RESUME_PARSER_PROMPT,
    WORK_ALIGNMENT_PROMPT,
    PROJECT_EVALUATION_PROMPT,
    DEGREE_MAPPER_PROMPT,
)
from llm_service import get_llm
from document_processor import DocumentProcessor
from settings import DEGREE_WEIGHTS, SCORE_WEIGHTS, SHORTLIST_THRESHOLD
from file_handler import read_job_description, save_json_report, save_text_report


def parse_job_description(state: WorkflowState) -> Dict[str, Any]:
    logger.info("Parsing job description")
    jd_text = read_job_description()

    llm = get_llm()
    chain = JOB_DESCRIPTION_PARSER_PROMPT | llm.with_structured_output(JobRequirements)
    job_requirements = chain.invoke({"jd_text": jd_text})

    logger.success(f"Parsed job requirements: {len(job_requirements.required_skills)} skills")
    return {"job_requirements": job_requirements, "job_description_text": jd_text}


def extract_resume_structure(state: WorkflowState) -> Dict[str, Any]:
    logger.info("Extracting resume structures")
    structured_resumes = []
    llm = get_llm()
    chain = RESUME_PARSER_PROMPT | llm.with_structured_output(ResumeStructured)
    document_processor = DocumentProcessor()

    for file_path_str in state["resume_file_paths"]:
        file_path = Path(file_path_str)
        try:
            filename, resume_text = document_processor.process_resume(file_path)
            structured = chain.invoke({"resume_text": resume_text})
            structured_resumes.append({"source_file": filename, "data": structured})
            logger.success(f"Extracted structure from {filename}")
        except Exception as e:
            logger.error(f"Failed to process {file_path.name}: {e}")
            continue

    return {"structured_resumes": structured_resumes}


def evaluate_skills(state: WorkflowState) -> Dict[str, Any]:
    logger.info("Evaluating skills")
    job_req = state["job_requirements"]
    skills_evaluations = []

    required_skills_set = {s.lower().strip() for s in job_req.required_skills}

    for item in state["structured_resumes"]:
        resume = item["data"]
        candidate_skills_set = {s.lower().strip() for s in resume.skills}
        matched_skills = required_skills_set.intersection(candidate_skills_set)
        skills_score = (
            (len(matched_skills) / len(required_skills_set)) * 10
            if required_skills_set
            else 0
        )

        skills_evaluations.append({
            "source_file": item["source_file"],
            "score": round(skills_score, 2),
            "matched": sorted(list(matched_skills)),
        })
        logger.success(f"Skills evaluated for {item['source_file']}: {skills_score:.2f}/10")

    return {"skills_evaluations": skills_evaluations}


def evaluate_experience_years(state: WorkflowState) -> Dict[str, Any]:
    logger.info("Evaluating experience years")
    job_req = state["job_requirements"]
    experience_evaluations = []

    for item in state["structured_resumes"]:
        resume = item["data"]
        exp_score = (
            min((resume.years_experience / job_req.years_required) * 10, 10)
            if job_req.years_required > 0
            else 10
        )

        experience_evaluations.append({
            "source_file": item["source_file"],
            "score": round(exp_score, 2),
            "years": resume.years_experience,
        })
        logger.success(f"Experience evaluated for {item['source_file']}: {resume.years_experience} years ({exp_score:.2f}/10)")

    return {"experience_evaluations": experience_evaluations}


def evaluate_work_alignment(state: WorkflowState) -> Dict[str, Any]:
    logger.info("Evaluating work experience alignment")
    job_desc_text = state["job_description_text"]
    work_alignment_evaluations = []

    llm = get_llm()
    chain = WORK_ALIGNMENT_PROMPT | llm.with_structured_output(EvaluationScore)

    for item in state["structured_resumes"]:
        resume = item["data"]
        eval_result = chain.invoke({
            "job_desc": job_desc_text,
            "work_exp": json.dumps(resume.work_experience, indent=2),
        })

        work_alignment_evaluations.append({
            "source_file": item["source_file"],
            "score": eval_result.score,
            "justification": eval_result.justification,
        })
        logger.success(f"Work alignment evaluated for {item['source_file']}: {eval_result.score}/10")

    return {"work_alignment_evaluations": work_alignment_evaluations}


def evaluate_projects(state: WorkflowState) -> Dict[str, Any]:
    logger.info("Evaluating projects")
    job_desc_text = state["job_description_text"]
    project_evaluations = []

    llm = get_llm()
    chain = PROJECT_EVALUATION_PROMPT | llm.with_structured_output(EvaluationScore)

    for item in state["structured_resumes"]:
        resume = item["data"]

        if not resume.projects:
            project_evaluations.append({
                "source_file": item["source_file"],
                "score": 0,
                "justification": "No projects listed",
            })
            logger.success(f"Projects evaluated for {item['source_file']}: 0/10 (no projects)")
        else:
            eval_result = chain.invoke({
                "job_desc": job_desc_text,
                "projects": json.dumps(resume.projects, indent=2),
            })

            project_evaluations.append({
                "source_file": item["source_file"],
                "score": eval_result.score,
                "justification": eval_result.justification,
            })
            logger.success(f"Projects evaluated for {item['source_file']}: {eval_result.score}/10")

    return {"project_evaluations": project_evaluations}


def evaluate_degree(state: WorkflowState) -> Dict[str, Any]:
    logger.info("Evaluating degrees")
    degree_evaluations = []

    llm = get_llm()
    chain = DEGREE_MAPPER_PROMPT | llm

    for item in state["structured_resumes"]:
        resume = item["data"]
        degree_text = resume.education[0]["degree"] if resume.education else "Unknown"

        mapped_result = chain.invoke({"degree": degree_text})
        qualification = (
            mapped_result.content.strip()
            if hasattr(mapped_result, "content")
            else str(mapped_result)
        )
        qual_score = DEGREE_WEIGHTS.get(qualification, 5)

        degree_evaluations.append({
            "source_file": item["source_file"],
            "score": qual_score,
            "degree": qualification,
        })
        logger.success(f"Degree evaluated for {item['source_file']}: {qualification} ({qual_score}/10)")

    return {"degree_evaluations": degree_evaluations}


def aggregate_scores(state: WorkflowState) -> Dict[str, Any]:
    logger.info("Aggregating scores")
    scored_candidates = []

    for item in state["structured_resumes"]:
        source_file = item["source_file"]

        skills_eval = next(e for e in state["skills_evaluations"] if e["source_file"] == source_file)
        exp_eval = next(e for e in state["experience_evaluations"] if e["source_file"] == source_file)
        work_eval = next(e for e in state["work_alignment_evaluations"] if e["source_file"] == source_file)
        proj_eval = next(e for e in state["project_evaluations"] if e["source_file"] == source_file)
        deg_eval = next(e for e in state["degree_evaluations"] if e["source_file"] == source_file)

        final_score = (
            (skills_eval["score"] * SCORE_WEIGHTS["skills"])
            + (exp_eval["score"] * SCORE_WEIGHTS["experience_years"])
            + (work_eval["score"] * SCORE_WEIGHTS["work_alignment"])
            + (proj_eval["score"] * SCORE_WEIGHTS["projects"])
            + (deg_eval["score"] * SCORE_WEIGHTS["qualification"])
        ) * 10

        scored = CandidateScore(
            source_file=source_file,
            final_score=round(final_score, 2),
            breakdown={
                "skills": {
                    "score": skills_eval["score"],
                    "matched": skills_eval["matched"],
                },
                "experience_years": {
                    "score": exp_eval["score"],
                    "years": exp_eval["years"],
                },
                "work_experience_alignment": {
                    "score": work_eval["score"],
                    "justification": work_eval["justification"],
                },
                "project_alignment": {
                    "score": proj_eval["score"],
                    "justification": proj_eval["justification"],
                },
                "qualification": {
                    "score": deg_eval["score"],
                    "degree": deg_eval["degree"],
                },
            },
        )
        scored_candidates.append(scored)
        logger.success(f"Aggregated score for {source_file}: {scored.final_score}/100")

    return {"scored_candidates": scored_candidates}


def generate_report(state: WorkflowState) -> Dict[str, Any]:
    logger.info("Generating final report")
    scored = sorted(state["scored_candidates"], key=lambda x: x.final_score, reverse=True)

    shortlisted = [c for c in scored if c.final_score >= SHORTLIST_THRESHOLD]
    rejected = [c for c in scored if c.final_score < SHORTLIST_THRESHOLD]

    report = {
        "evaluation_summary": {
            "total_candidates": len(scored),
            "shortlisted_count": len(shortlisted),
            "rejected_count": len(rejected),
            "threshold_score": SHORTLIST_THRESHOLD,
        },
        "shortlisted_candidates": [c.model_dump() for c in shortlisted],
        "rejected_candidates": [c.model_dump() for c in rejected],
        "scoring_methodology": {
            "weights": {
                "skills_match": f"{SCORE_WEIGHTS['skills']*100:.0f}%",
                "experience_years": f"{SCORE_WEIGHTS['experience_years']*100:.0f}%",
                "work_experience_alignment": f"{SCORE_WEIGHTS['work_alignment']*100:.0f}%",
                "project_relevance": f"{SCORE_WEIGHTS['projects']*100:.0f}%",
                "educational_qualification": f"{SCORE_WEIGHTS['qualification']*100:.0f}%",
            },
            "total_score": "Out of 100",
        },
    }

    summary_lines = [
        "\nCANDIDATE EVALUATION REPORT\n",
        f"Total Candidates Evaluated: {len(scored)}",
        f"Shortlisted (Score >= {SHORTLIST_THRESHOLD}): {len(shortlisted)}",
        f"Rejected (Score < {SHORTLIST_THRESHOLD}): {len(rejected)}\n",
        "SHORTLISTED CANDIDATES:\n",
    ]

    for i, candidate in enumerate(shortlisted, 1):
        summary_lines.extend([
            f"{i}. {candidate.source_file}",
            f"   Final Score: {candidate.final_score}/100",
            f"   Skills Match: {candidate.breakdown['skills']['score']}/10 ({len(candidate.breakdown['skills']['matched'])} matched)",
            f"   Experience: {candidate.breakdown['experience_years']['score']}/10 ({candidate.breakdown['experience_years']['years']} years)",
            f"   Work Alignment: {candidate.breakdown['work_experience_alignment']['score']}/10",
            f"   Projects: {candidate.breakdown['project_alignment']['score']}/10",
            f"   Qualification: {candidate.breakdown['qualification']['score']}/10 ({candidate.breakdown['qualification']['degree']})\n",
        ])

    if rejected:
        summary_lines.append("REJECTED CANDIDATES:\n")
        for i, candidate in enumerate(rejected, 1):
            summary_lines.extend([
                f"{i}. {candidate.source_file}",
                f"   Final Score: {candidate.final_score}/100",
                f"   Skills Match: {candidate.breakdown['skills']['score']}/10",
                f"   Experience: {candidate.breakdown['experience_years']['score']}/10",
                f"   Work Alignment: {candidate.breakdown['work_experience_alignment']['score']}/10",
                f"   Projects: {candidate.breakdown['project_alignment']['score']}/10",
                f"   Qualification: {candidate.breakdown['qualification']['score']}/10\n",
            ])

    summary_text = "\n".join(summary_lines)

    save_json_report(report, "shortlist_report.json")
    save_text_report(summary_text, "shortlist_summary.txt")

    print(summary_text)
    logger.success("Report generation complete")

    return {"final_report": report}