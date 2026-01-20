from pathlib import Path

from docling.document_converter import DocumentConverter
from presidio_analyzer import AnalyzerEngine
from presidio_analyzer.nlp_engine import TransformersNlpEngine
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig

from app.core import logger

from .constants import PII_ALLOW_LIST


class DocumentProcessor:
    def __init__(self):
        try:
            self.converter = DocumentConverter()
            self.is_available = True
        except ImportError:
            logger.warning("Docling not installed")
            self.is_available = False

        try:
            model_config = [
                {
                    "lang_code": "en",
                    "model_name": {
                        "spacy": "en_core_web_sm",
                        "transformers": "dslim/bert-base-NER",
                    },
                }
            ]
            nlp_engine = TransformersNlpEngine(models=model_config)
            self.analyzer = AnalyzerEngine(nlp_engine=nlp_engine)
            self.anonymizer = AnonymizerEngine()
            self.pii_redaction_available = True

            self.target_entities = [
                "PERSON",
                "PHONE_NUMBER",
                "EMAIL_ADDRESS",
                "LOCATION",
            ]
            self.allow_list = PII_ALLOW_LIST
        except Exception as e:
            logger.warning(f"Presidio PII redaction not available: {e}")
            self.pii_redaction_available = False

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

        try:
            return file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            raise ValueError(
                f"Unable to read file {file_path}. Format may not be supported."
            )

    def _redact_pii(self, text: str) -> str:
        if not self.pii_redaction_available:
            return text

        try:
            logger.info("Redacting PII from extracted text")
            results = self.analyzer.analyze(
                text=text,
                language="en",
                entities=self.target_entities,
                score_threshold=0.4,
                allow_list=self.allow_list,
            )

            operators = {
                "PERSON": OperatorConfig("replace", {"new_value": "[NAME]"}),
                "PHONE_NUMBER": OperatorConfig("replace", {"new_value": "[PHONE]"}),
                "EMAIL_ADDRESS": OperatorConfig("replace", {"new_value": "[EMAIL]"}),
                "LOCATION": OperatorConfig("replace", {"new_value": "[LOCATION]"}),
            }

            anonymized = self.anonymizer.anonymize(
                text=text, analyzer_results=results, operators=operators
            )
            logger.success("PII redaction complete")
            return anonymized.text
        except Exception as e:
            logger.warning(f"PII redaction failed, using original text: {e}")
            return text

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
        text = self._redact_pii(text)
        return file_path.name, text
