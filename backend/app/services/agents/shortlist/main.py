from pathlib import Path

from app.core import configure_file_logging, logger, settings

from .graph import create_workflow

configure_file_logging(settings.OUTPUT_DIR, "ats_screening.log")


def run_shortlist_workflow(resume_file_path: str) -> dict | None:
    try:
        logger.info(f"Processing resume: {Path(resume_file_path).name}")

        logger.info("Initializing workflow")
        app = create_workflow()
        inputs = {"resume_file_path": resume_file_path}

        config = {
            "run_name": "shortlist_workflow",
            "tags": ["shortlist", "langgraph", "resume_screening"],
            "metadata": {
                "workflow": "shortlist",
                "resume_file": Path(resume_file_path).name,
            },
        }

        logger.info("Starting evaluation workflow")
        result = app.invoke(inputs, config=config)

        final_report = result.get("final_report")
        if final_report:
            summary = final_report["evaluation_summary"]
            logger.success(
                f"Workflow completed: {summary['total_candidates']} candidates, {summary['shortlisted_count']} shortlisted, {summary['rejected_count']} rejected"
            )

        logger.info(f"Output files generated in: {settings.OUTPUT_DIR}")
        return final_report

    except FileNotFoundError as e:
        logger.error(f"File not found: {e}")
        logger.error("Please ensure the resume file path is correct.")
        return None

    except Exception as e:
        logger.error(f"An error occurred: {e}")
        return None


if __name__ == "__main__":
    resume_file_path = ""
    result = run_shortlist_workflow(resume_file_path)
    return 0 if result else 1
