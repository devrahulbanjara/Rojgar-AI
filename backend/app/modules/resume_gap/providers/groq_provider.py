from app.infrastructures.ai.service import ai_service
from app.modules.resume_gap.prompts import (
    GAP_ANALYSIS_SYSTEM_PROMPT,
    PATCH_SYSTEM_PROMPT,
)
from app.modules.resume_gap.provider import GapAnalysisProvider
from app.modules.resume_gap.schemas import AutoPatchResult, GapAnalysisResult


class GroqGapAnalysisProvider(GapAnalysisProvider):
    async def analyze_gaps(
        self,
        resume_data: dict,
        job_data: dict,
    ) -> GapAnalysisResult:
        """Generate a structured gap analysis for a resume and job."""
        return await ai_service.generate_structured(
            system_prompt=GAP_ANALYSIS_SYSTEM_PROMPT,
            user_payload={"resume": resume_data, "job": job_data},
            schema_model=GapAnalysisResult,
        )

    async def build_patch(
        self,
        resume_data: dict,
        gap_result: GapAnalysisResult,
    ) -> AutoPatchResult:
        """Generate a structured resume patch from a gap-analysis result."""
        return await ai_service.generate_structured(
            system_prompt=PATCH_SYSTEM_PROMPT,
            user_payload={
                "current_resume": resume_data,
                "gap_analysis": gap_result.model_dump(),
            },
            schema_model=AutoPatchResult,
        )
