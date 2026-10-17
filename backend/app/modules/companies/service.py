from fastapi import HTTPException, UploadFile, status
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import (
    invalidate_company_detail_caches,
    invalidate_job_detail_caches,
)
from app.core.swr_cache import swr_get
from app.infrastructures.storage.service import storage_service
from app.modules.audit.service import create_custom_audit_log
from app.modules.auth.enums import BusinessStatus, MembershipRole, MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import Company, CompanyMembership
from app.modules.companies.schemas import CompanyResponse, UpdateCompanyRequest
from app.modules.companies.team import activate_membership
from app.modules.companies.utils import get_member_company
from app.modules.jobs.models import Job

DOC_MAX_BYTES = 10 * 1024 * 1024


def company_response(company: Company) -> CompanyResponse:
    """Convert a company ORM instance into its response schema."""
    return CompanyResponse.model_validate(company).model_copy(
        update={"has_registration_doc": bool(company.registration_doc_key)}
    )


async def _get_company_job_ids(db: AsyncSession, company_id: str) -> list[str]:
    """Return all job IDs belonging to a company."""
    result = await db.execute(select(Job.id).where(Job.company_id == company_id))
    return [str(job_id) for job_id in result.scalars().all()]


async def invalidate_company_content_caches(db: AsyncSession, company_id: str) -> None:
    """Invalidate the company and its job detail caches."""
    await invalidate_company_detail_caches(db, company_id)

    job_ids = await _get_company_job_ids(db, company_id)
    for job_id in job_ids:
        await invalidate_job_detail_caches(job_id)


async def get_my_company(db: AsyncSession, user: User) -> CompanyResponse:
    """Return the current user's company (SWR-cached)."""
    cache_key = f"company:detail:{user.id}"

    async def _load() -> dict:
        company = await get_member_company(db, user)
        return company_response(company).model_dump(mode="json")

    payload = await swr_get(cache_key, _load, soft_ttl=600, hard_ttl=3600)
    return CompanyResponse.model_validate(payload)


async def update_my_company(
    db: AsyncSession, company: Company, user: User, payload: UpdateCompanyRequest
) -> CompanyResponse:
    """Update the business profile (owner only) and invalidate caches."""
    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(company, field, value)

    await db.commit()
    await db.refresh(company)
    response = company_response(company)

    await invalidate_company_content_caches(db, str(company.id))

    logger.info("Company {} updated by {}", company.id, user.id)
    return response


def _sniff_document(head: bytes) -> tuple[str, str] | None:
    if head.startswith(b"%PDF-"):
        return "pdf", "application/pdf"
    if head.startswith(b"\xff\xd8\xff"):
        return "jpg", "image/jpeg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png", "image/png"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "webp", "image/webp"
    return None


async def store_registration_doc(file: UploadFile) -> str:
    """Validate a certificate photo or PDF and store it privately; returns its key."""
    data = await file.read(DOC_MAX_BYTES + 1)
    if len(data) > DOC_MAX_BYTES:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="The file is over 10 MB. Try a smaller photo.",
        )
    kind = _sniff_document(data[:16])
    if kind is None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, detail="Upload a photo (JPG or PNG) or a PDF."
        )
    extension, content_type = kind
    return await storage_service.upload_private_document(
        data, "business-docs", extension=extension, content_type=content_type
    )


async def create_business(
    db: AsyncSession,
    user: User,
    *,
    name: str,
    business_type: str,
    district: str,
    phone: str,
    pan_number: str | None,
    registration_doc: UploadFile | None,
) -> CompanyResponse:
    """Create a pending business; the creator becomes its owner and works in it."""
    doc_key = (
        await store_registration_doc(registration_doc) if registration_doc else None
    )
    company = Company(
        name=name,
        industry=business_type,
        district=district,
        location=district,
        phone=phone,
        pan_number=pan_number,
        registration_doc_key=doc_key,
        status=BusinessStatus.pending,
        created_by_user_id=user.id,
    )
    db.add(company)
    await db.flush()
    membership = CompanyMembership(
        user_id=user.id,
        company_id=company.id,
        role=MembershipRole.owner,
        status=MembershipStatus.inactive,
    )
    db.add(membership)
    await db.flush()
    await activate_membership(db, membership)
    await create_custom_audit_log(
        db,
        entity_type="company",
        action_type="business_created",
        category="business",
        message=f"{name} was created and is waiting for approval",
        entity_id=company.id,
        company_id=company.id,
        target_user_id=user.id,
        metadata={"district": district, "type": business_type},
    )
    await db.commit()
    await db.refresh(company)
    logger.info("Business {} created by {}", company.id, user.id)
    return company_response(company)


async def update_verification_details(
    db: AsyncSession,
    company: Company,
    *,
    pan_number: str | None,
    registration_doc: UploadFile | None,
) -> CompanyResponse:
    """Owner adds PAN or the certificate; a rejected business goes back to review."""
    if company.status == BusinessStatus.suspended:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="Your business is suspended. Contact Rojgar AI support.",
        )
    old_key = company.registration_doc_key
    if registration_doc is not None:
        company.registration_doc_key = await store_registration_doc(registration_doc)
    if pan_number is not None:
        company.pan_number = pan_number or None
    if company.status == BusinessStatus.rejected:
        company.status = BusinessStatus.pending
    if company.status == BusinessStatus.pending:
        company.status_reason = None
    await create_custom_audit_log(
        db,
        entity_type="company",
        action_type="business_details_added",
        category="business",
        message="Verification details updated",
        entity_id=company.id,
        company_id=company.id,
        metadata={
            "pan_number": bool(company.pan_number),
            "document": registration_doc is not None,
        },
    )
    await db.commit()
    await db.refresh(company)
    if old_key and old_key != company.registration_doc_key:
        await storage_service.delete_key(old_key)
    await invalidate_company_detail_caches(db, str(company.id))
    return company_response(company)
