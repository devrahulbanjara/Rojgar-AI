from typing import Any, Dict, List
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from dotenv import load_dotenv
from config_logging import logger
import json
from langgraph.graph import StateGraph, END
from typing import TypedDict

load_dotenv()
llm = ChatGroq(temperature=0, model_name="llama-3.1-8b-instant")


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


class GraphState(TypedDict):
    job_description: str
    resume_texts: List[str]
    parsed_jd: JDCriteria
    evaluated_candidates: List[CandidateEvaluation]


def jd_deconstructor_node(state: GraphState) -> Dict[str, Any]:
    print("--- NODE: Deconstructing JD ---")
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are an expert HR analyst. Extract key criteria from the job description into the specified JSON format.",
            ),
            ("human", "Please analyze this JD:\n\n{jd}"),
        ]
    )
    structured_llm_jd = llm.with_structured_output(JDCriteria)
    chain = prompt | structured_llm_jd
    parsed_jd = chain.invoke({"jd": state["job_description"]})
    print("JD Parsed.")
    return {"parsed_jd": parsed_jd}


def candidate_evaluator_node(state: GraphState) -> Dict[str, Any]:
    """
    Agent 2: Takes parsed JD and all resumes, evaluates each one, and returns a list of evaluations.
    """
    print("--- NODE: Evaluating Candidates ---")
    parsed_jd = state["parsed_jd"]
    evaluations = []

    for i, resume_text in enumerate(state["resume_texts"]):
        print(f"Evaluating resume {i+1}...")
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
        evaluator_chain = eval_prompt | structured_llm_eval

        result = evaluator_chain.invoke(
            {
                "required_skills": parsed_jd.required_skills,
                "experience": parsed_jd.years_of_experience,
                "resume_text": resume_text,
            }
        )
        evaluations.append(result)

    print("All resumes evaluated.")
    return {"evaluated_candidates": evaluations}


workflow = StateGraph(GraphState)

workflow.add_node("jd_deconstructor", jd_deconstructor_node)
workflow.add_node("candidate_evaluator", candidate_evaluator_node)

workflow.set_entry_point("jd_deconstructor")
workflow.add_edge("jd_deconstructor", "candidate_evaluator")
workflow.add_edge("candidate_evaluator", END)

app = workflow.compile()

if __name__ == "__main__":
    job_description = """
    Job Title: Senior Python Developer
    We are looking for a Python Developer with at least 5 years of experience.
    Must have skills:
    - Python
    - Django
    - RESTful APIs
    """

    resumes = [
        # Strong Candidate
        "Sampada Poudel: A Senior Software Engineer with 8 years of experience in Python development. I have built multiple applications using Django and created RESTful APIs.",
        # Weak Candidat
        "Rahul Dev Banjara: A junior developer with 1 year of experience in JavaScript. I am eager to learn Python.",
    ]

    print("\n--- Running Milestone 2: Graph Workflow Test ---\n")

    inputs = {"job_description": job_description, "resume_texts": resumes}

    result_state = app.invoke(inputs)

    print("\n--- Milestone 2 Complete ---")
    print("\nFinal State of the Graph:")

    print("\n--- PARSED JOB CRITERIA ---")
    print(result_state["parsed_jd"])

    print("\n--- EVALUATED CANDIDATES ---")
    for i, evaluation in enumerate(result_state["evaluated_candidates"]):
        print(f"\n--- Candidate {i+1} ---")
        print(f"Overall Score: {evaluation.overall_score}")
        print(f"Summary: {evaluation.summary}")
        print("Skill Justifications:")
        for skill, justification in evaluation.skill_justifications.items():
            print(f"  - {skill}: {justification}")
