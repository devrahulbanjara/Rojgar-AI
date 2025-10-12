from datetime import datetime, date
from typing import Optional, List, TYPE_CHECKING
from enum import Enum
from sqlmodel import Field, SQLModel, Column, JSON, Relationship

if TYPE_CHECKING:
    pass  # For avoiding circular imports


# Enums
class JobLevel(str, Enum):
    """Job level enumeration"""
    JUNIOR = "Junior"
    MID = "Mid"
    SENIOR = "Senior"
    LEAD = "Lead"
    PRINCIPAL = "Principal"


class LocationType(str, Enum):
    """Location type enumeration"""
    REMOTE = "Remote"
    ONSITE = "On-site"
    HYBRID = "Hybrid"


class EmploymentType(str, Enum):
    """Employment type enumeration"""
    FULL_TIME = "Full-time"
    PART_TIME = "Part-time"
    CONTRACT = "Contract"
    INTERNSHIP = "Internship"


class JobStatus(str, Enum):
    """Job status enumeration"""
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    CLOSED = "Closed"
    DRAFT = "Draft"


# Nested schema for salary range
class SalaryRange(SQLModel):
    """Salary range schema"""
    min: int
    max: int
    currency: str = "USD"


# Company Models
class CompanyBase(SQLModel):
    """Base company model with common fields"""
    name: str = Field(index=True)
    logo: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    size: Optional[str] = None
    industry: Optional[str] = None
    brand_color: Optional[str] = None
    founded_year: Optional[int] = None


class Company(CompanyBase, table=True):
    """Company table model"""
    __tablename__ = "companies"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Relationship to jobs
    jobs: List["Job"] = Relationship(back_populates="company")


class CompanyRead(CompanyBase):
    """Schema for reading company data"""
    id: int


class CompanyCreate(CompanyBase):
    """Schema for creating a company"""
    pass


# Job Models
class JobBase(SQLModel):
    """Base job model with common fields"""
    title: str
    company_id: int
    department: str
    level: JobLevel
    location: str
    location_type: LocationType
    employment_type: EmploymentType
    salary_min: int
    salary_max: int
    salary_currency: str = "USD"
    description: str
    requirements: List[str] = Field(sa_column=Column(JSON))
    skills: List[str] = Field(sa_column=Column(JSON))
    benefits: List[str] = Field(sa_column=Column(JSON))
    application_deadline: date
    is_remote: bool = False
    is_featured: bool = False


class Job(JobBase, table=True):
    """Job table model"""
    __tablename__ = "jobs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    posted_date: date = Field(default_factory=date.today)
    status: JobStatus = Field(default=JobStatus.ACTIVE, index=True)
    applicant_count: int = Field(default=0)
    views_count: int = Field(default=0)
    created_by: str = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationship to company
    company: Optional["Company"] = Relationship(back_populates="jobs")

    def is_active(self) -> bool:
        """Check if job is currently active"""
        return self.status == JobStatus.ACTIVE

    def is_expired(self) -> bool:
        """Check if job application deadline has passed"""
        return datetime.now().date() > self.application_deadline

    def can_apply(self) -> bool:
        """Check if job is available for applications"""
        return self.is_active() and not self.is_expired()


class JobRead(JobBase):
    """Schema for reading job data (API responses)"""
    id: int
    posted_date: date
    status: JobStatus
    applicant_count: int
    views_count: int
    created_by: str
    created_at: datetime
    updated_at: datetime
    company: Optional[CompanyRead] = None
    
    # Computed field for backward compatibility with API
    @property
    def salary_range(self) -> SalaryRange:
        """Get salary range as nested object"""
        return SalaryRange(
            min=self.salary_min,
            max=self.salary_max,
            currency=self.salary_currency
        )


class JobCreate(JobBase):
    """Schema for creating a job"""
    created_by: str


class JobUpdate(SQLModel):
    """Schema for updating a job"""
    title: Optional[str] = None
    department: Optional[str] = None
    level: Optional[JobLevel] = None
    location: Optional[str] = None
    location_type: Optional[LocationType] = None
    employment_type: Optional[EmploymentType] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    application_deadline: Optional[date] = None
    status: Optional[JobStatus] = None
    is_remote: Optional[bool] = None
    is_featured: Optional[bool] = None


class JobSearchParams(SQLModel):
    """Schema for job search query parameters"""
    page: int = Field(default=1, ge=1, description="Page number")
    limit: int = Field(default=20, ge=1, le=100, description="Items per page")
    search: Optional[str] = Field(default=None, description="Search query")
    location: Optional[str] = Field(default=None, description="Location filter")
    department: Optional[str] = Field(default=None, description="Department filter")
    level: Optional[str] = Field(default=None, description="Job level filter")
    location_type: Optional[str] = Field(default=None, description="Location type filter")
    employment_type: Optional[str] = Field(default=None, description="Employment type filter")
    salary_min: Optional[int] = Field(default=None, ge=0, description="Minimum salary filter")
    salary_max: Optional[int] = Field(default=None, ge=0, description="Maximum salary filter")
    is_remote: Optional[bool] = Field(default=None, description="Remote work filter")
    is_featured: Optional[bool] = Field(default=None, description="Featured jobs filter")
    company_id: Optional[int] = Field(default=None, description="Company filter")
    sort_by: str = Field(default="posted_date", description="Sort field")
    sort_order: str = Field(default="desc", description="Sort order (asc/desc)")
    
    def to_search_dict(self) -> dict:
        """Convert to dictionary suitable for repository search, filtering out None values"""
        data = self.model_dump(exclude_unset=True)
        # Convert single level/location_type/employment_type to list for repository
        if "level" in data and data["level"] is not None:
            data["level"] = [data["level"]]
        if "location_type" in data and data["location_type"] is not None:
            data["location_type"] = [data["location_type"]]
        if "employment_type" in data and data["employment_type"] is not None:
            data["employment_type"] = [data["employment_type"]]
        return {k: v for k, v in data.items() if v is not None}
