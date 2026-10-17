import re
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.core.dependencies import (
    ActiveMember,
    CurrentUser,
    DbSession,
    MemberContext,
    OwnerContext,
    UUIDPath,
)
from app.core.rate_limit import RateLimit
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.infrastructures.storage.service import storage_service
from app.modules.companies import service, team
from app.modules.companies.schemas import (
    BusinessOptions,
    CompanyResponse,
    InviteAccepted,
    InviteCreate,
    InviteCreated,
    InvitePreview,
    InviteResponse,
    MemberResponse,
    RoleUpdate,
    UpdateCompanyRequest,
)
from app.shared.nepal import BUSINESS_TYPES, DISTRICTS
from app.shared.normalize import normalize_phone

router = APIRouter(prefix="/companies", tags=["Companies"])
businesses = APIRouter(prefix="/businesses", tags=["Businesses"])
invites = APIRouter(prefix="/invites", tags=["Businesses"])

_PAN = re.compile(r"^\d{9}$")


def _bad(detail: str) -> HTTPException:
    return HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)


def _clean_pan(value: str | None) -> str | None:
    if value is None:
        return None
    pan = re.sub(r"\D", "", value)
    if pan and not _PAN.match(pan):
        raise _bad("PAN number has 9 digits.")
    return pan


# ---------------------------------------------------------------- active business


@router.get("/me", summary="The business the signed-in member is working in")
async def get_my_company(
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[CompanyResponse]:
    data = await service.get_my_company(db, user)
    return ResponseBuilder.success(data=data, message="Company fetched.")


@router.patch("/me", summary="Update the business profile (owner)")
async def update_my_company(
    payload: UpdateCompanyRequest,
    ctx: OwnerContext,
    db: DbSession,
) -> UnifiedResponse[CompanyResponse]:
    data = await service.update_my_company(db, ctx.business, ctx.user, payload)
    return ResponseBuilder.success(data=data, message="Company updated.")


@router.patch("/me/logo", summary="Upload or replace the business logo (owner)")
async def upload_company_logo(
    ctx: OwnerContext,
    db: DbSession,
    file: UploadFile = File(),
) -> UnifiedResponse[CompanyResponse]:
    company = ctx.business
    previous_logo_url = company.logo_url
    company.logo_url = await storage_service.upload_image(file, folder="logos")
    await db.commit()
    await db.refresh(company)

    if previous_logo_url and previous_logo_url != company.logo_url:
        await storage_service.delete_image(previous_logo_url)

    await service.invalidate_company_content_caches(db, str(company.id))
    return ResponseBuilder.success(
        data=service.company_response(company), message="Company logo updated."
    )


@router.delete("/me/logo", summary="Delete the business logo (owner)")
async def delete_company_logo(
    ctx: OwnerContext, db: DbSession
) -> UnifiedResponse[None]:
    company = ctx.business
    previous_logo_url = company.logo_url
    company.logo_url = None
    await db.commit()

    if previous_logo_url:
        await storage_service.delete_image(previous_logo_url)

    await service.invalidate_company_content_caches(db, str(company.id))
    return ResponseBuilder.success(data=None, message="Company logo removed.")


# ---------------------------------------------------------------- create and verify


@businesses.get("/options", summary="Business types and the 77 districts of Nepal")
async def business_options() -> UnifiedResponse[BusinessOptions]:
    return ResponseBuilder.success(
        data=BusinessOptions(types=list(BUSINESS_TYPES), districts=list(DISTRICTS))
    )


@businesses.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create a business (pending until Rojgar AI approves it)",
    dependencies=[Depends(RateLimit("businesses.create", 5, 3600))],
)
async def create_business(
    user: CurrentUser,
    db: DbSession,
    name: Annotated[str, Form(min_length=2, max_length=120)],
    business_type: Annotated[str, Form(min_length=2, max_length=60)],
    district: Annotated[str, Form()],
    phone: Annotated[str, Form(max_length=20)],
    pan_number: Annotated[str | None, Form(max_length=20)] = None,
    registration_doc: Annotated[UploadFile | None, File()] = None,
) -> UnifiedResponse[CompanyResponse]:
    if district not in DISTRICTS:
        raise _bad("Choose a district from the list.")
    business_phone = normalize_phone(phone)
    if business_phone is None:
        raise _bad("Enter a phone number people can call.")
    data = await service.create_business(
        db,
        user,
        name=" ".join(name.split()),
        business_type=business_type.strip(),
        district=district,
        phone=business_phone,
        pan_number=_clean_pan(pan_number) or None,
        registration_doc=registration_doc,
    )
    return ResponseBuilder.success(
        data=data, message="Business created.", status_code=status.HTTP_201_CREATED
    )


@businesses.post(
    "/{business_id}/verification",
    summary="Add PAN or the registration certificate (owner)",
)
async def update_verification(
    business_id: UUIDPath,
    ctx: OwnerContext,
    db: DbSession,
    pan_number: Annotated[str | None, Form(max_length=20)] = None,
    registration_doc: Annotated[UploadFile | None, File()] = None,
) -> UnifiedResponse[CompanyResponse]:
    del business_id  # resolved by the guard
    data = await service.update_verification_details(
        db,
        ctx.business,
        pan_number=_clean_pan(pan_number),
        registration_doc=registration_doc,
    )
    return ResponseBuilder.success(data=data, message="Details saved.")


# ---------------------------------------------------------------- team


@businesses.get("/{business_id}/members", summary="Everyone on the team")
async def list_members(
    business_id: UUIDPath, ctx: MemberContext, db: DbSession
) -> UnifiedResponse[list[MemberResponse]]:
    del business_id
    data = await team.list_members(db, ctx.business.id)
    return ResponseBuilder.success(data=data)


@businesses.patch(
    "/{business_id}/members/{membership_id}", summary="Change a member's role (owner)"
)
async def change_member_role(
    business_id: UUIDPath,
    membership_id: UUIDPath,
    payload: RoleUpdate,
    ctx: OwnerContext,
    db: DbSession,
) -> UnifiedResponse[MemberResponse]:
    del business_id
    data = await team.change_role(db, ctx.business, membership_id, payload.role)
    return ResponseBuilder.success(data=data, message="Role changed.")


@businesses.delete(
    "/{business_id}/members/{membership_id}", summary="Remove a member (owner)"
)
async def remove_member(
    business_id: UUIDPath, membership_id: UUIDPath, ctx: OwnerContext, db: DbSession
) -> UnifiedResponse[None]:
    del business_id
    await team.remove_member(db, ctx.business, membership_id)
    return ResponseBuilder.success(message="Removed from the team.")


@businesses.get("/{business_id}/invites", summary="Invite links not used yet (owner)")
async def list_invites(
    business_id: UUIDPath, ctx: OwnerContext, db: DbSession
) -> UnifiedResponse[list[InviteResponse]]:
    del business_id
    data = await team.list_open_invites(db, ctx.business.id)
    return ResponseBuilder.success(data=data)


@businesses.post(
    "/{business_id}/invites",
    status_code=status.HTTP_201_CREATED,
    summary="Create an invite link for a role; it works for 7 days (owner)",
)
async def create_invite(
    business_id: UUIDPath, payload: InviteCreate, ctx: OwnerContext, db: DbSession
) -> UnifiedResponse[InviteCreated]:
    del business_id
    data = await team.create_invite(db, ctx.business, ctx.user, payload.role)
    return ResponseBuilder.success(
        data=data, message="Invite link ready.", status_code=status.HTTP_201_CREATED
    )


@businesses.delete(
    "/{business_id}/invites/{invite_id}", summary="Cancel an invite link (owner)"
)
async def revoke_invite(
    business_id: UUIDPath, invite_id: UUIDPath, ctx: OwnerContext, db: DbSession
) -> UnifiedResponse[None]:
    del business_id
    await team.revoke_invite(db, ctx.business, invite_id)
    return ResponseBuilder.success(message="Invite cancelled.")


@invites.get(
    "/{token}",
    summary="What an invite link is for (no sign-in needed)",
    dependencies=[Depends(RateLimit("invites.preview", 30, 60))],
)
async def preview_invite(token: str, db: DbSession) -> UnifiedResponse[InvitePreview]:
    return ResponseBuilder.success(data=await team.preview_invite(db, token))


@invites.post(
    "/{token}/accept",
    summary="Join the business from an invite link",
    dependencies=[Depends(RateLimit("invites.accept", 10, 600))],
)
async def accept_invite(
    token: str, user: CurrentUser, db: DbSession
) -> UnifiedResponse[InviteAccepted]:
    business_id = await team.accept_invite(db, token, user)
    return ResponseBuilder.success(
        data=InviteAccepted(business_id=business_id), message="You're on the team."
    )
