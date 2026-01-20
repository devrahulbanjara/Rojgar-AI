from pathlib import Path

from app.core import logger
from docling.document_converter import DocumentConverter

class DocumentProcessor:
    def __init__(self):
        try:
            self.converter = DocumentConverter()
            self.is_available = True
        except ImportError:
            logger.warning("Docling not installed")
            self.is_available = False

    def extract_text(self, file_path: Path) -> str:
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        file_extension = file_path.suffix.lower()

        if file_extension == ".txt":
            return file_path.read_text(encoding="utf-8")

        if self.is_available and file_extension in [
            ".pdf",
            ".docx",
            ".doc",
            ".png",
            ".jpg",
            ".jpeg",
        ]:
            return self._extract_with_docling(file_path)

        logger.warning(
            f"Unsupported file format: {file_extension}. Attempting to read as text."
        )
        try:
            return file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            raise ValueError(
                f"Unable to read file {file_path}. Format may not be supported."
            )

    def _extract_with_docling(self, file_path: Path) -> str:
        try:
            logger.info(f"Processing {file_path.name} with Docling")
            result = self.converter.convert(str(file_path))
            markdown_text = result.document.export_to_markdown()
            logger.success(f"Successfully extracted text from {file_path.name}")
            return markdown_text
        except Exception as e:
            logger.error(f"Docling extraction failed for {file_path}: {e}")
            if file_path.suffix.lower() == ".txt":
                return file_path.read_text(encoding="utf-8")
            raise ValueError(f"Failed to extract text from {file_path}: {e}")

    def process_resume(self, file_path: Path) -> tuple[str, str]:
        text = self.extract_text(file_path)
        return file_path.name, text
