from typing import Annotated

from fastapi import APIRouter, Query

from app.core.dependencies import CurrentUser
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.jobs.role_templates import RoleTemplate, list_templates
from app.shared.enums import JobCategory

router = APIRouter(prefix="/job-templates", tags=["Jobs"])


@router.get("", summary="Role templates (must-haves + knockout questions) by category")
async def get_job_templates(
    _user: CurrentUser,
    category: Annotated[JobCategory | None, Query()] = None,
) -> UnifiedResponse[list[RoleTemplate]]:
    """List ready-made role templates, optionally for one category."""
    items = [RoleTemplate.model_validate(t) for t in list_templates(category)]
    return ResponseBuilder.success(data=items)
