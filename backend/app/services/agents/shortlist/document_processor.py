from pathlib import Path

from app.core import logger
from app.core.config import settings
from .constants import PII_ENTITIES
from llm_guard.input_scanners import Anonymize
from llm_guard.vault import Vault
import nest_asyncio
from llama_parse import LlamaParse

nest_asyncio.apply()

class DocumentProcessor:
    def __init__(self):
        self.parser = LlamaParse(
            api_key=settings.LLAMA_CLOUD_API_KEY,
            result_type="markdown",
            language="en"
        )
        self.vault = Vault()
        self.scanner = Anonymize(self.vault, entity_types=PII_ENTITIES, preamble="Redacted: ")

    def extract_text(self, file_path: Path) -> str:
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        return self._extract_with_llamaparse(file_path)

    def _redact_pii(self, text: str) -> str:
        try:
            sanitized_text, is_valid, risk_score = self.scanner.scan(text)
            return sanitized_text
        except Exception as e:
            logger.warning(f"PII redaction failed, using original text: {e}")
            return text

    def _extract_with_llamaparse(self, file_path: Path) -> str:
        try:
            logger.info(f"Processing {file_path.name} with llama-parse")

            documents = self.parser.load_data(str(file_path))

            markdown_text = "\n".join(doc.text for doc in documents)
            return markdown_text
        except Exception as e:
            logger.error(f"LlamaParse extraction failed for {file_path}: {e}")
            raise ValueError(f"Failed to extract text from {file_path}: {e}")

    def process_resume(self, file_path: Path) -> tuple[str, str]:
        text = self.extract_text(file_path)
        text = self._redact_pii(text)
        return file_path.name, text
