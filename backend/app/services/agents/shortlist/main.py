from pathlib import Path

from app.core import configure_file_logging, logger, settings

from .file_handler import discover_resume_files
from .graph import create_workflow

# Configure file logging for this service
configure_file_logging(settings.OUTPUT_DIR, "ats_screening.log")


def main():
    logger.info("ConvexHire Resume Shortlisting Service Started")

    try:
        resume_files = discover_resume_files()
        resume_paths = [str(f) for f in resume_files]
        logger.info(f"Processing {len(resume_paths)} resumes")
        for path in resume_paths:
            logger.info(f"  {Path(path).name}")

        logger.info("Initializing workflow")
        app = create_workflow()
        inputs = {"resume_file_paths": resume_paths}
        logger.info("Starting evaluation workflow")
        result = app.invoke(inputs)

        final_report = result.get("final_report")
        if final_report:
            summary = final_report["evaluation_summary"]
            logger.success(
                f"Workflow completed: {summary['total_candidates']} candidates, {summary['shortlisted_count']} shortlisted, {summary['rejected_count']} rejected"
            )

        logger.info(f"Output files generated in: {settings.OUTPUT_DIR}")

    except FileNotFoundError as e:
        logger.error(f"File not found: {e}")
        logger.error(
            "Please ensure you have created 'resumes' directory with job_description.txt and resume files"
        )
        return 1

    except Exception as e:
        logger.error(f"An error occurred: {e}")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
