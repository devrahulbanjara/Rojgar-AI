import os
from typing import List
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from dotenv import load_dotenv
from config_logging import logger
import json


# ---------------------- LLM Setup ----------------------
load_dotenv()
llm = ChatGroq(temperature=0, model_name="llama-3.1-8b-instant")


# ---------------------- Pydantic Models ----------------------
class JDCriteria(BaseModel):
    required_skills: List[str] = Field(
        ..., description="Absolute must-have skills mentioned in the JD."
    )
    years_of_experience: int = Field(
        ..., description="Minimum years of required experience."
    )


class CandidateEvaluation(BaseModel):
    overall_score: int = Field(
        ..., description="A final score from 1-100 based on the evaluation."
    )
    summary: str = Field(
        ...,
        description="A concise summary of how well the candidate meets the job criteria.",
    )
    skill_justifications: dict = Field(
        ...,
        description="A dictionary where keys are skills from the JD and values are the justification.",
    )


# ---------------------- Chains ----------------------
jd_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an expert HR analyst. Extract key criteria from the job description into the specified JSON format.",
        ),
        ("human", "Please analyze this JD:\n\n{jd}"),
    ]
)
structured_llm_jd = llm.with_structured_output(JDCriteria)
jd_deconstructor_chain = jd_prompt | structured_llm_jd

eval_prompt = ChatPromptTemplate.from_template(
    """
    System: You are an unbiased AI hiring assistant. Evaluate the candidate's resume against the job criteria.
    Base your evaluation ONLY on the text provided in the resume.

    Job Criteria:
    - Required Skills: {required_skills}
    - Years of Experience: {experience}

    Candidate's Resume:
    {resume_text}

    Human: Please evaluate the resume and provide your output in the requested JSON format.
    """
)
structured_llm_eval = llm.with_structured_output(CandidateEvaluation)
candidate_evaluator_chain = eval_prompt | structured_llm_eval

# ---------------------- Main Execution ----------------------
if __name__ == "__main__":
    job_description = """
    Job Title: Senior Python Developer
    We are looking for a Python Developer with at least 5 years of experience.
    Must have skills:
    - Python
    - Django
    - RESTful APIs
    """

    resume_text = """
    Maria Rodriguez
    A Senior Software Engineer with 8 years of experience in Python development.
    I have built multiple applications using Django and created RESTful APIs.
    """

    logger.info("=== Milestone 1: Core Engine Test ===")

    logger.info("Step 1: Deconstructing Job Description...")
    parsed_jd = jd_deconstructor_chain.invoke({"jd": job_description})
    logger.info("JD Parsed Successfully:")
    print(json.dumps(parsed_jd.model_dump(), indent=2))

    print("\n")
    logger.info("Step 2: Evaluating Candidate Resume...")
    evaluation_result = candidate_evaluator_chain.invoke(
        {
            "required_skills": parsed_jd.required_skills,
            "experience": parsed_jd.years_of_experience,
            "resume_text": resume_text,
        }
    )
    logger.info("Evaluation Complete:")
    print(json.dumps(evaluation_result.model_dump(), indent=2))

    logger.info("=== Milestone 1 Complete ===")
