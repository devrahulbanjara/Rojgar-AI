from pathlib import Path

from app.core import logger

from .graph import create_workflow


def run_shortlist_workflow(jd_string: str, resume_file_path: str) -> dict | None:
    try:
        app = create_workflow()
        inputs = {
            "resume_file_path": resume_file_path,
            "job_description_text": jd_string,
        }

        config = {
            "run_name": "shortlist_workflow",
            "tags": ["shortlist", "langgraph", "resume_screening"],
            "metadata": {
                "workflow": "shortlist",
                "resume_file": Path(resume_file_path).name,
            },
        }

        result = app.invoke(inputs, config=config)

        final_report = result.get("final_report")
        if final_report:
            summary = final_report["evaluation_summary"]
            logger.success(
                f"Workflow completed: {summary['total_candidates']} candidates, {summary['shortlisted_count']} shortlisted, {summary['rejected_count']} rejected"
            )

        return final_report

    except FileNotFoundError as e:
        logger.error(f"File not found: {e}")
        logger.error("Please ensure the resume file path is correct.")
        return None

    except Exception as e:
        logger.error(f"An error occurred: {e}")
        return None


if __name__ == "__main__":
    jd_string = """
    Machine Learning Engineer (Mid-Level)

    We are seeking a Machine Learning Engineer to join our AI team. The ideal candidate will have experience in developing and deploying machine learning models, with knowledge of deep learning, NLP, and ML workflows.

    Requirements:
    - 2-4 years of professional experience in machine learning and data science
    - Strong proficiency in Python and ML frameworks (TensorFlow, PyTorch, scikit-learn)
    - Experience with natural language processing (NLP) and working with pre-trained models
    - Knowledge of model training, evaluation, and basic fine-tuning techniques
    - Familiarity with ML tools and practices (MLflow, Docker, Git)
    - Basic understanding of cloud ML platforms (AWS SageMaker, GCP Vertex AI, or Azure ML)
    - Good understanding of statistics, linear algebra, and basic calculus
    - Experience with data preprocessing and feature engineering
    - Knowledge of version control (Git) and software engineering practices

    Responsibilities:
    - Develop and deploy machine learning models for production use
    - Fine-tune pre-trained models for specific use cases
    - Build and maintain ML pipelines for data processing and model training
    - Collaborate with data engineers and software engineers to integrate ML models
    - Monitor model performance and suggest improvements
    - Conduct experiments to validate model improvements
    - Document models, experiments, and deployment processes
    - Learn and stay updated with latest ML research and industry trends

    Education:
    - Bachelor's degree in Computer Science, Machine Learning, Data Science, Mathematics, or related field
    - Master's degree preferred but not required

    Preferred Qualifications:
    - Experience with LLMs (Large Language Models) and prompt engineering
    - Knowledge of computer vision basics
    - Experience with model serving and deployment
    - Personal projects or contributions to open-source ML projects
    - Experience with data visualization tools
    """

    resume_file_path = "rahuldevbanjara_resume.pdf"
    result = run_shortlist_workflow(jd_string, resume_file_path)
    print(result)
