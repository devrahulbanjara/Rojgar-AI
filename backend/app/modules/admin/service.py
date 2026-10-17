"""Platform staff actions. Every change writes an audit row with the actor."""

import hashlib
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy import delete, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import (
    invalidate_company_detail_caches,
    invalidate_job_detail_caches,
)
from app.core.config import settings
from app.infrastructures.email.service import EmailService
from app.infrastructures.storage.service import storage_service
from app.modules.admin.models import JobReport, JobTakedown, ManualPayment
from app.modules.admin import billing
from app.modules.admin.schemas import (
    ApprovalItem,
    BusinessRow,
    FlaggedJob,
    PaymentRow,
    PaymentsOverview,
    PaidPlanRow,
    ReportCreate,
    ReportItem,
)
from app.modules.audit.service import create_custom_audit_log
from app.modules.auth.enums import BusinessStatus, MembershipRole
from app.modules.auth.models import User
from app.modules.companies.models import Company, CompanyMembership
from app.modules.entitlements.models import JobPass
from app.modules.entitlements.plans import PassKind, PlanId
from app.modules.jobs.models import Job
from app.infrastructures.sms.service import send_sms


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def _business(db: AsyncSession, business_id: str) -> Company:
    company = await db.get(Company, uuid.UUID(business_id))
    if company is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Business not found.")
    return company


async def _owners(db: AsyncSession, company_id: uuid.UUID) -> list[User]:
    rows = await db.scalars(
        select(User)
        .join(CompanyMembership, CompanyMembership.user_id == User.id)
        .where(
            CompanyMembership.company_id == company_id,
            CompanyMembership.role == MembershipRole.owner,
        )
    )
    return list(rows)


async def _tell_owners(
    db: AsyncSession, company: Company, sms: str, subject: str, html: str
) -> None:
    """SMS to the business phone and email to each owner who has one."""
    phones = {company.phone} | {o.phone for o in await _owners(db, company.id)}
    for phone in {p for p in phones if p}:
        await send_sms(phone, sms)
    for owner in await _owners(db, company.id):
        if owner.email:
            await EmailService.send_generic_email(owner.email, subject, html)


def _audit(db, *, action: str, message: str, company: Company, **extra):
    return create_custom_audit_log(
        db,
        entity_type=extra.pop("entity_type", "company"),
        entity_id=extra.pop("entity_id", company.id),
        action_type=action,
        category="platform",
        message=message,
        company_id=company.id,
        **extra,
    )


# ---------------------------------------------------------------- approvals


async def list_approvals(db: AsyncSession) -> list[ApprovalItem]:
    rows = await db.execute(
        select(Company, User)
        .outerjoin(User, User.id == Company.created_by_user_id)
        .where(Company.status == BusinessStatus.pending)
        .order_by(Company.created_at)
    )
    items = []
    for company, creator in rows.all():
        doc_key = company.registration_doc_key
        items.append(
            ApprovalItem(
                id=company.id,
                name=company.name,
                business_type=company.industry,
                district=company.district,
                phone=company.phone,
                pan_number=company.pan_number,
                document_url=(
                    await storage_service.generate_presigned_url(doc_key, 900)
                    if doc_key
                    else None
                ),
                document_is_pdf=bool(doc_key and doc_key.endswith(".pdf")),
                created_by_name=creator.full_name if creator else None,
                created_by_contact=(creator.phone or creator.email)
                if creator
                else None,
                info_requested=company.status_reason,
                created_at=company.created_at,
            )
        )
    return items


def _require_status(company: Company, *allowed: BusinessStatus) -> None:
    if company.status not in allowed:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=f"{company.name} is {company.status.value} now. Refresh the list.",
        )


async def approve(db: AsyncSession, business_id: str) -> None:
    company = await _business(db, business_id)
    _require_status(company, BusinessStatus.pending, BusinessStatus.rejected)
    company.status = BusinessStatus.active
    company.status_reason = None
    company.verified_at = _now()
    await _audit(
        db,
        action="business_approved",
        message=f"Approved {company.name}",
        company=company,
    )
    await db.commit()
    await invalidate_company_detail_caches(db, str(company.id))
    await _tell_owners(
        db,
        company,
        f"{settings.product_name}: {company.name} is approved. Your jobs can go live now.",
        f"{company.name} is approved",
        f"<p>{company.name} is approved on {settings.product_name}. "
        "Your jobs can go live now.</p>",
    )


async def request_info(db: AsyncSession, business_id: str, message: str) -> None:
    company = await _business(db, business_id)
    _require_status(company, BusinessStatus.pending)
    company.status_reason = message
    await _audit(
        db,
        action="business_info_requested",
        message=f"Asked {company.name} for more information",
        company=company,
        reason=message,
    )
    await db.commit()
    await invalidate_company_detail_caches(db, str(company.id))
    await _tell_owners(
        db,
        company,
        f"{settings.product_name}: we need a little more to approve {company.name}. "
        f"{message}",
        f"One more step to approve {company.name}",
        f"<p>We need a little more to approve {company.name}:</p><p>{message}</p>"
        f"<p>Open {settings.frontend_url}/start to add it.</p>",
    )


async def reject(db: AsyncSession, business_id: str, reason: str) -> None:
    company = await _business(db, business_id)
    _require_status(company, BusinessStatus.pending)
    company.status = BusinessStatus.rejected
    company.status_reason = reason
    await _audit(
        db,
        action="business_rejected",
        message=f"Rejected {company.name}",
        company=company,
        reason=reason,
    )
    await db.commit()
    await invalidate_company_detail_caches(db, str(company.id))
    await _tell_owners(
        db,
        company,
        f"{settings.product_name}: {company.name} wasn't approved. {reason}",
        f"{company.name} wasn't approved",
        f"<p>{company.name} wasn't approved on {settings.product_name}.</p><p>{reason}</p>",
    )


# ---------------------------------------------------------------- businesses


async def list_businesses(
    db: AsyncSession, q: str | None, status_filter: BusinessStatus | None
) -> list[BusinessRow]:
    members = (
        select(func.count(CompanyMembership.id))
        .where(CompanyMembership.company_id == Company.id)
        .scalar_subquery()
    )
    jobs = (
        select(func.count(Job.id)).where(Job.company_id == Company.id).scalar_subquery()
    )
    reports = (
        select(func.count(JobReport.id))
        .where(JobReport.company_id == Company.id, JobReport.resolved_at.is_(None))
        .scalar_subquery()
    )
    stmt = select(Company, members, jobs, reports).order_by(Company.created_at.desc())
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Company.name.ilike(like),
                Company.district.ilike(like),
                Company.phone.ilike(like),
                Company.pan_number.ilike(like),
            )
        )
    if status_filter:
        stmt = stmt.where(Company.status == status_filter)
    rows = await db.execute(stmt.limit(500))
    return [
        BusinessRow(
            id=c.id,
            name=c.name,
            slug=c.slug,
            business_type=c.industry,
            district=c.district,
            status=c.status,
            status_reason=c.status_reason,
            plan=c.plan,
            members=m,
            jobs=j,
            open_reports=r,
            created_at=c.created_at,
        )
        for c, m, j, r in rows.all()
    ]


async def _invalidate_public_job_pages(db: AsyncSession, company_id: uuid.UUID) -> None:
    for job_id in await db.scalars(select(Job.id).where(Job.company_id == company_id)):
        await invalidate_job_detail_caches(str(job_id))


async def suspend(db: AsyncSession, business_id: str, admin: User, reason: str) -> None:
    company = await _business(db, business_id)
    _require_status(company, BusinessStatus.active, BusinessStatus.pending)
    company.status = BusinessStatus.suspended
    company.status_reason = reason
    await _resolve_reports(
        db, admin, "business_suspended", JobReport.company_id == company.id
    )
    await _audit(
        db,
        action="business_suspended",
        message=f"Suspended {company.name}",
        company=company,
        reason=reason,
    )
    await db.commit()
    await invalidate_company_detail_caches(db, str(company.id))
    await _invalidate_public_job_pages(db, company.id)
    await _tell_owners(
        db,
        company,
        f"{settings.product_name}: {company.name} is suspended and its jobs are hidden. {reason}",
        f"{company.name} is suspended",
        f"<p>{company.name} is suspended on {settings.product_name} and its jobs are hidden.</p>"
        f"<p>{reason}</p>",
    )


async def restore(db: AsyncSession, business_id: str) -> None:
    company = await _business(db, business_id)
    _require_status(company, BusinessStatus.suspended)
    company.status = BusinessStatus.active
    company.status_reason = None
    company.verified_at = company.verified_at or _now()
    await _audit(
        db,
        action="business_restored",
        message=f"Restored {company.name}",
        company=company,
    )
    await db.commit()
    await invalidate_company_detail_caches(db, str(company.id))
    await _invalidate_public_job_pages(db, company.id)


# ---------------------------------------------------------------- reports and flags


async def _job_with_company(db: AsyncSession, job_id: str) -> tuple[Job, Company]:
    row = (
        await db.execute(
            select(Job, Company)
            .join(Company, Company.id == Job.company_id)
            .where(Job.id == uuid.UUID(job_id))
        )
    ).first()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Job not found.")
    return row[0], row[1]


async def list_flagged_jobs(
    db: AsyncSession, include_resolved: bool
) -> list[FlaggedJob]:
    stmt = (
        select(JobReport, Job, Company)
        .join(Job, Job.id == JobReport.job_id)
        .join(Company, Company.id == JobReport.company_id)
        .order_by(JobReport.created_at.desc())
    )
    if not include_resolved:
        stmt = stmt.where(JobReport.resolved_at.is_(None))
    rows = (await db.execute(stmt.limit(1000))).all()
    taken_down = set(
        await db.scalars(
            select(JobTakedown.job_id).where(
                JobTakedown.job_id.in_({job.id for _, job, _ in rows})
            )
        )
    )
    grouped: dict[uuid.UUID, FlaggedJob] = {}
    for report, job, company in rows:
        entry = grouped.get(job.id)
        if entry is None:
            entry = grouped[job.id] = FlaggedJob(
                job_id=job.id,
                job_title=job.title,
                job_slug=job.slug,
                business_id=company.id,
                business_name=company.name,
                business_status=company.status,
                unpublished=job.id in taken_down,
                reports=[],
                latest_at=report.created_at,
            )
        entry.reports.append(ReportItem.model_validate(report))
    return list(grouped.values())


async def _resolve_reports(
    db: AsyncSession, admin: User, resolution: str, *conditions
) -> None:
    await db.execute(
        update(JobReport)
        .where(JobReport.resolved_at.is_(None), *conditions)
        .values(resolved_at=_now(), resolution=resolution, resolved_by_user_id=admin.id)
    )


async def unpublish_job(
    db: AsyncSession, job_id: str, admin: User, reason: str | None
) -> None:
    job, company = await _job_with_company(db, job_id)
    if await db.get(JobTakedown, job.id) is None:
        db.add(JobTakedown(job_id=job.id, reason=reason, created_by_user_id=admin.id))
    await _resolve_reports(db, admin, "unpublished", JobReport.job_id == job.id)
    await _audit(
        db,
        action="job_unpublished",
        message=f"Unpublished {job.title} ({company.name})",
        company=company,
        entity_type="job",
        entity_id=job.id,
        reason=reason,
    )
    await db.commit()
    await invalidate_job_detail_caches(str(job.id))


async def restore_job(db: AsyncSession, job_id: str) -> None:
    job, company = await _job_with_company(db, job_id)
    await db.execute(delete(JobTakedown).where(JobTakedown.job_id == job.id))
    await _audit(
        db,
        action="job_restored",
        message=f"Restored {job.title} ({company.name})",
        company=company,
        entity_type="job",
        entity_id=job.id,
    )
    await db.commit()
    await invalidate_job_detail_caches(str(job.id))


async def dismiss_reports(db: AsyncSession, job_id: str, admin: User) -> None:
    job, company = await _job_with_company(db, job_id)
    await _resolve_reports(db, admin, "dismissed", JobReport.job_id == job.id)
    await _audit(
        db,
        action="job_reports_dismissed",
        message=f"Dismissed reports on {job.title} ({company.name})",
        company=company,
        entity_type="job",
        entity_id=job.id,
    )
    await db.commit()


async def report_job(
    db: AsyncSession, slug: str, payload: ReportCreate, ip: str
) -> None:
    """An applicant reports a public job. Repeats from one address are ignored."""
    job = await db.scalar(select(Job).where(Job.slug == slug))
    if job is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Job not found.")
    ip_hash = hashlib.sha256(f"{settings.secret_key}:{ip}".encode()).hexdigest()
    duplicate = await db.scalar(
        select(JobReport.id).where(
            JobReport.job_id == job.id,
            JobReport.reporter_ip_hash == ip_hash,
            JobReport.reason == payload.reason,
            JobReport.resolved_at.is_(None),
        )
    )
    if duplicate:
        return
    db.add(
        JobReport(
            job_id=job.id,
            company_id=job.company_id,
            source="applicant",
            reason=payload.reason,
            details=(payload.details or "").strip() or None,
            reporter_ip_hash=ip_hash,
        )
    )
    await db.commit()
    logger.info("Job {} reported: {}", job.id, payload.reason)


# ---------------------------------------------------------------- payments


def payment_row(payment: ManualPayment, business_name: str, job_title: str | None):
    return PaymentRow(
        id=payment.id,
        business_id=payment.company_id,
        business_name=business_name,
        kind=payment.kind,
        item=billing.PURCHASES[payment.kind].label,
        job_title=job_title,
        amount_npr=payment.amount_npr,
        reference=payment.reference,
        status=payment.status,
        created_at=payment.created_at,
        received_at=payment.received_at,
    )


async def payments_overview(db: AsyncSession) -> PaymentsOverview:
    rows = await db.execute(
        select(ManualPayment, Company.name, Job.title)
        .join(Company, Company.id == ManualPayment.company_id)
        .outerjoin(Job, Job.id == ManualPayment.job_id)
        .order_by(
            (ManualPayment.status == "awaiting").desc(), ManualPayment.created_at.desc()
        )
        .limit(500)
    )
    live_passes = (
        select(func.count(JobPass.id))
        .where(
            JobPass.company_id == Company.id,
            JobPass.kind != PassKind.first_job.value,
            JobPass.expires_at > _now(),
        )
        .scalar_subquery()
    )
    paid = await db.execute(
        select(Company.id, Company.name, Company.plan, live_passes)
        .where(or_(Company.plan != PlanId.free.value, live_passes > 0))
        .order_by(Company.name)
    )
    return PaymentsOverview(
        transfers=[payment_row(p, name, title) for p, name, title in rows.all()],
        paid=[
            PaidPlanRow(business_id=i, business_name=n, plan=plan, active_passes=c)
            for i, n, plan, c in paid.all()
        ],
    )


async def mark_received(
    db: AsyncSession, payment_id: str, admin: User, reference: str | None
) -> None:
    payment = await db.get(ManualPayment, uuid.UUID(payment_id), with_for_update=True)
    if payment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Payment not found.")
    if payment.status == "received":
        return
    company = await db.get(Company, payment.company_id)
    await billing.apply(db, payment)
    payment.received_by_user_id = admin.id
    if reference:
        payment.reference = reference
    item = billing.PURCHASES[payment.kind].label
    await _audit(
        db,
        action="payment_received",
        message=f"Bank transfer received: {item}, NPR {payment.amount_npr:,}",
        company=company,
        entity_type="payment",
        entity_id=payment.id,
        metadata={
            "reference": payment.reference,
            "amount_npr": payment.amount_npr,
            "kind": payment.kind,
        },
    )
    await db.commit()
    await invalidate_company_detail_caches(db, str(company.id))
