from abc import ABC, abstractmethod

from app.modules.resume_gap.schemas import AutoPatchResult, GapAnalysisResult


class GapAnalysisProvider(ABC):
    """Stable contract for resume-gap LLM providers."""

    @abstractmethod
    async def analyze_gaps(
        self,
        resume_data: dict,
        job_data: dict,
    ) -> GapAnalysisResult:
        """Compare a resume against a job and return structured gaps."""

    @abstractmethod
    async def build_patch(
        self,
        resume_data: dict,
        gap_result: GapAnalysisResult,
    ) -> AutoPatchResult:
        """Return safe resume field updates based on an existing gap analysis."""
