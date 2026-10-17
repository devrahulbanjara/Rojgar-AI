from fastapi import APIRouter

from app.core.dependencies import ActiveMember, DbSession
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.entitlements import service
from app.modules.entitlements.schemas import CompanyPlanResponse

router = APIRouter(prefix="/company", tags=["Plan"])


@router.get("/plan", summary="Company plan, its limits and this month's usage")
async def get_plan(
    user: ActiveMember, db: DbSession
) -> UnifiedResponse[CompanyPlanResponse]:
    return ResponseBuilder.success(data=await service.get_company_plan(db, user.id))
