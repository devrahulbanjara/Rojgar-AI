import spacy
from huggingface_hub import snapshot_download

from app.core.config import settings
from app.core.logging_config import logger


class SkillExtractor:
    """Singleton service for extracting skills from job descriptions using NER model"""

    _nlp = None

    @classmethod
    def get_nlp(cls):
        """Load the skill extraction model (only once)"""
        if cls._nlp is None:
            logger.info(
                f"Downloading and loading Skill Extraction model: {settings.SKILL_EXTRACTION_MODEL}"
            )
            model_path = snapshot_download(
                settings.SKILL_EXTRACTION_MODEL, repo_type="model"
            )
            cls._nlp = spacy.load(model_path)
            logger.success("Skill Extraction model loaded successfully")
        return cls._nlp

    @classmethod
    def extract_skills(
        cls,
        job_summary: str,
        responsibilities: list[str],
        qualifications: list[str],
    ) -> list[str]:
        """
        Extract skills from job description components using NER.
        """
        try:
            nlp = cls.get_nlp()

            # Combine only relevant parts (avoiding company/benefits)
            text = (
                f"{job_summary} {' '.join(responsibilities)} {' '.join(qualifications)}"
            )

            # Run NER extraction
            doc = nlp(text)

            # Filter for SKILLS label, normalize to lowercase, and remove duplicates using set
            skills = {
                ent.text.strip().lower()
                for ent in doc.ents
                if "SKILL" in ent.label_.upper() and ent.text.strip()
            }

            # Convert back to sorted list for consistent ordering
            skills_list = sorted(list(skills))

            logger.info(
                f"Extracted {len(skills_list)} unique skills from job description"
            )
            return skills_list

        except Exception as e:
            logger.error(f"NER Extraction failed: {e}")
            return []
