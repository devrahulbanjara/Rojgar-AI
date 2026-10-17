from enum import Enum


class LocationType(str, Enum):
    remote = "remote"
    onsite = "onsite"
    hybrid = "hybrid"


class EmploymentType(str, Enum):
    full_time = "full_time"
    part_time = "part_time"
    contract = "contract"
    internship = "internship"


class JobCategory(str, Enum):
    banking_finance = "banking_finance"
    healthcare = "healthcare"
    education = "education"
    hospitality_tourism = "hospitality_tourism"
    sales_retail = "sales_retail"
    manufacturing = "manufacturing"
    logistics_driving = "logistics_driving"
    it_software = "it_software"
    ngo_ingo = "ngo_ingo"
    government_public = "government_public"
    office_admin = "office_admin"
    construction_engineering = "construction_engineering"
    other = "other"


JOB_CATEGORY_LABELS: dict[JobCategory, str] = {
    JobCategory.banking_finance: "Banking & Finance",
    JobCategory.healthcare: "Healthcare",
    JobCategory.education: "Education",
    JobCategory.hospitality_tourism: "Hospitality & Tourism",
    JobCategory.sales_retail: "Sales & Retail",
    JobCategory.manufacturing: "Manufacturing",
    JobCategory.logistics_driving: "Logistics & Driving",
    JobCategory.it_software: "IT & Software",
    JobCategory.ngo_ingo: "NGO/INGO",
    JobCategory.government_public: "Government & Public",
    JobCategory.office_admin: "Office & Admin",
    JobCategory.construction_engineering: "Construction & Engineering",
    JobCategory.other: "Other",
}

# Jobs in these categories ask for a CV unless the team turns it off. Drivers,
# cooks, cleaners, shop and factory staff are often hired without one.
CV_REQUIRED_CATEGORIES = frozenset(
    {
        JobCategory.banking_finance,
        JobCategory.healthcare,
        JobCategory.education,
        JobCategory.it_software,
        JobCategory.ngo_ingo,
        JobCategory.government_public,
        JobCategory.office_admin,
    }
)


class JobStatus(str, Enum):
    draft = "draft"
    open = "open"
    closed = "closed"


class JobClosedReason(str, Enum):
    hired = "hired"
    cancelled = "cancelled"
    expired = "expired"


class ApplicationStage(str, Enum):
    new = "new"
    shortlisted = "shortlisted"
    interview = "interview"
    offer = "offer"
    hired = "hired"
    rejected = "rejected"
    withdrawn = "withdrawn"


# Stages a candidate can still move out of with a forward decision.
ACTIVE_STAGES = frozenset(
    {
        ApplicationStage.new,
        ApplicationStage.shortlisted,
        ApplicationStage.interview,
        ApplicationStage.offer,
    }
)


class ApplicationSource(str, Enum):
    linkedin = "linkedin"
    facebook = "facebook"
    merojob = "merojob"
    viber = "viber"
    qr = "qr"
    walk_in = "walk_in"
    phone = "phone"
    referral = "referral"
    direct = "direct"
    other = "other"


# Sources a recruiter records when adding someone by hand.
QUICK_ADD_SOURCES = frozenset(
    {ApplicationSource.walk_in, ApplicationSource.phone, ApplicationSource.referral}
)


class ReviewTriage(str, Enum):
    """How far the cost-controlled review went for one application."""

    knockout = "knockout"  # a knockout answer decided it; no LLM call
    extract = "extract"  # cheap pass only (clearly not plausible)
    full = "full"  # cheap pass + full evidence review


class RejectedReason(str, Enum):
    not_a_fit = "not_a_fit"
    position_filled = "position_filled"
    no_response = "no_response"
    other = "other"


class ReviewState(str, Enum):
    pending = "pending"
    done = "done"
    failed = "failed"
    needs_person = "needs_person"
    # The business has no reviews left this month; runs when it gets more.
    waiting_for_quota = "waiting_for_quota"


class Fit(str, Enum):
    strong = "strong"
    possible = "possible"
    weak = "weak"


class CheckResult(str, Enum):
    met = "met"
    partly = "partly"
    missing = "missing"


class EventType(str, Enum):
    applied = "applied"
    stage_changed = "stage_changed"
    email_scheduled = "email_scheduled"
    email_sent = "email_sent"
    interview_booked = "interview_booked"
    interview_done = "interview_done"
    note = "note"
    review_done = "review_done"
    flag_cleared = "flag_cleared"


class QuestionType(str, Enum):
    short_text = "short_text"
    yes_no = "yes_no"


class SyncAction(str, Enum):
    UPSERT = "UPSERT"
    DELETE = "DELETE"


class SyncStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
