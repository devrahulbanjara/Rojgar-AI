import json
from pathlib import Path
from typing import Any

from app.core import logger, settings


def get_job_description_path() -> Path:
    return settings.RESUMES_DIR / settings.JOB_DESCRIPTION_FILE


def read_job_description() -> str:
    jd_path = get_job_description_path()
    if not jd_path.exists():
        raise FileNotFoundError(
            f"Job description not found at {jd_path}. "
            f"Please create {settings.JOB_DESCRIPTION_FILE} in the {settings.RESUMES_DIR} directory."
        )
    return jd_path.read_text(encoding="utf-8")


def validate_resume_path(resume_path: str) -> Path:
    """Validate that a resume file path exists and has a supported format.

    Args:
        resume_path: Path or URL to a single resume file.

    Returns:
        Path object for the validated resume file.

    Raises:
        FileNotFoundError: If the file does not exist.
        ValueError: If the file format is not supported.
    """
    path = Path(resume_path)

    if not path.exists():
        raise FileNotFoundError(f"Resume file not found: {resume_path}")

    if path.suffix.lower() not in settings.SUPPORTED_RESUME_FORMATS:
        raise ValueError(
            f"Unsupported resume format: {path.suffix}. "
            f"Supported formats: {', '.join(settings.SUPPORTED_RESUME_FORMATS)}"
        )

    logger.info(f"Validated resume file: {path.name}")
    return path


def save_json_report(report: dict[str, Any], filename: str) -> Path:
    output_path = settings.OUTPUT_DIR / filename
    output_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    logger.info(f"Report saved to: {output_path}")
    return output_path


def save_text_report(content: str, filename: str) -> Path:
    output_path = settings.OUTPUT_DIR / filename
    output_path.write_text(content, encoding="utf-8")
    logger.info(f"Summary saved to: {output_path}")
    return output_path
