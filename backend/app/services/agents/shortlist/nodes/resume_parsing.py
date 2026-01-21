from pathlib import Path
from typing import Any

from langsmith import traceable

from app.core import logger
from app.models.agents.shortlist import ResumeStructured, WorkflowState

from ..document_processor import DocumentProcessor
from ..llm_service import get_llm
from ..templates import RESUME_PARSER_PROMPT


@traceable(
    name="shortlist_extract_resumes_node",
    tags=["node:extract_resumes", "shortlist"],
    metadata={"node_type": "extract_resumes", "purpose": "extract_resume_structure"},
)
def extract_resume_structure(state: WorkflowState) -> dict[str, Any]:
    logger.info("Extracting resume structures")

    structured_resumes = []

    llm = get_llm()
    chain = RESUME_PARSER_PROMPT | llm.with_structured_output(
        ResumeStructured, method="json_mode"
    )
    document_processor = DocumentProcessor()

    file_path = Path(state["resume_file_path"])
    try:
        filename, resume_text = document_processor.process_resume(file_path)
        structured = chain.invoke({"resume_text": resume_text})
        structured_resumes.append({"source_file": filename, "data": structured})
        logger.success(f"Extracted structure from {filename}")
    except Exception as e:
        logger.error(f"Failed to process {file_path.name}: {e}")
    return {"structured_resumes": structured_resumes}
