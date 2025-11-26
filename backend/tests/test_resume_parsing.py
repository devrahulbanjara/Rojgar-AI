import json
from pathlib import Path
from loguru import logger
import pytest
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from app.services.agents.shortlist.nodes.resume_parsing import extract_resume_structure
from app.services.agents.shortlist.schemas import WorkflowState
from app.core.config import settings

TEST_RESUMES_DIR = Path(__file__).parent / "test_resumes"
PASS_THRESHOLD = 75
MODEL_JUDGE = "llama-3.3-70b-versatile"


class EvaluationScore(BaseModel):
    skills_match_score: int = Field(description="0-100 score.")
    experience_accuracy: int = Field(description="0-100 score.")
    overall_quality: int = Field(description="0-100 score.")
    reasoning: str = Field(description="Detailed explanation of errors.")


def load_ground_truth(json_path: Path) -> dict:
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)


def evaluate_extraction(ground_truth: dict, prediction: dict) -> EvaluationScore:
    judge_llm = ChatGroq(temperature=0, model_name=MODEL_JUDGE, api_key=settings.GROQ_API_KEY)

    eval_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a QA Auditor. Compare Ground Truth vs AI Prediction.
        Scoring Rules:
        - **Skills**: OK if order differs. Match concepts (e.g. 'JS' == 'JavaScript').
        - **Experience**: Dates/Companies must match. Omissions are critical errors.
        - **Formatting**: Ignore whitespace differences.
        
        Provide a strict score (0-100) and detailed reasoning."""),
        ("human", "GROUND TRUTH:\n{ground_truth}\n\nAI PREDICTION:\n{prediction}")
    ])
    
    grader = eval_prompt | judge_llm.with_structured_output(EvaluationScore)
    return grader.invoke({"ground_truth": str(ground_truth), "prediction": str(prediction)})


@pytest.fixture
def test_resumes():
    return [
        TEST_RESUMES_DIR / "1_sita_sharma.md",
        TEST_RESUMES_DIR / "2_ram_bahadur.md",
    ]


@pytest.fixture
def ground_truths():
    return [
        load_ground_truth(TEST_RESUMES_DIR / "1_sita_sharma.json"),
        load_ground_truth(TEST_RESUMES_DIR / "2_ram_bahadur.json"),
    ]


def test_extract_resume_structure(test_resumes, ground_truths):
    logger.info("Starting resume parsing test")
    
    resume_paths = [str(resume) for resume in test_resumes]
    
    state: WorkflowState = {
        "job_description_text": "",
        "resume_file_paths": resume_paths,
        "job_requirements": None,
        "structured_resumes": [],
        "skills_evaluations": [],
        "experience_evaluations": [],
        "work_alignment_evaluations": [],
        "project_evaluations": [],
        "degree_evaluations": [],
        "scored_candidates": [],
        "final_report": None,
    }
    
    result = extract_resume_structure(state)
    structured_resumes = result["structured_resumes"]
    
    logger.info(f"Processed {len(structured_resumes)} resumes")
    
    assert len(structured_resumes) == len(ground_truths)
    
    total_scores = []
    
    for idx, (structured, gt) in enumerate(zip(structured_resumes, ground_truths)):
        resume_data = structured["data"]
        filename = structured["source_file"]
        
        logger.info(f"Evaluating {filename}")
        
        prediction = resume_data.model_dump()
        score = evaluate_extraction(gt, prediction)
        
        total_scores.append(score.overall_quality)
        
        logger.info(f"{filename} - Skills: {score.skills_match_score}, Exp: {score.experience_accuracy}, Overall: {score.overall_quality}")
        logger.info(f"Reasoning: {score.reasoning}")
        
        assert score.overall_quality >= PASS_THRESHOLD, f"{filename} failed with score {score.overall_quality} (threshold: {PASS_THRESHOLD})"
    
    avg_score = sum(total_scores) / len(total_scores)
    logger.info(f"Average score: {avg_score:.1f}/100")
    
    assert avg_score >= PASS_THRESHOLD, f"Average score {avg_score:.1f} below threshold {PASS_THRESHOLD}"

