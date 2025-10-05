"""
Job data model for JSON-based storage
Clean, production-ready model with proper data validation
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict
from enum import Enum


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


@dataclass
class SalaryRange:
    """Salary range data structure"""
    min: int
    max: int
    currency: str

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SalaryRange':
        """Create from dictionary"""
        return cls(
            min=data["min"],
            max=data["max"],
            currency=data["currency"]
        )


@dataclass
class Company:
    """Company data structure"""
    id: int
    name: str
    logo: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    size: Optional[str] = None
    industry: Optional[str] = None
    brand_color: Optional[str] = None
    founded_year: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Company':
        """Create from dictionary"""
        return cls(
            id=data["id"],
            name=data["name"],
            logo=data.get("logo"),
            website=data.get("website"),
            description=data.get("description"),
            location=data.get("location"),
            size=data.get("size"),
            industry=data.get("industry"),
            brand_color=data.get("brand_color"),
            founded_year=data.get("founded_year")
        )


@dataclass
class Job:
    """Job model for JSON storage with comprehensive data structure"""
    
    id: int
    title: str
    company_id: int
    department: str
    level: JobLevel
    location: str
    location_type: LocationType
    employment_type: EmploymentType
    salary_range: SalaryRange
    description: str
    requirements: List[str]
    skills: List[str]
    benefits: List[str]
    posted_date: str
    application_deadline: str
    status: JobStatus
    is_remote: bool
    is_featured: bool
    applicant_count: int
    views_count: int
    created_by: str
    created_at: str
    updated_at: str

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        data["salary_range"] = self.salary_range.to_dict()
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Job':
        """Create Job instance from dictionary"""
        # Parse salary range
        salary_range = SalaryRange.from_dict(data["salary_range"])
        
        # Parse dates - handle both date and datetime formats
        posted_date = cls._parse_date(data["posted_date"])
        application_deadline = cls._parse_date(data["application_deadline"])
        created_at = cls._parse_datetime(data["created_at"])
        updated_at = cls._parse_datetime(data["updated_at"])
        
        return cls(
            id=data["id"],
            title=data["title"],
            company_id=data["company_id"],
            department=data["department"],
            level=JobLevel(data["level"]),
            location=data["location"],
            location_type=LocationType(data["location_type"]),
            employment_type=EmploymentType(data["employment_type"]),
            salary_range=salary_range,
            description=data["description"],
            requirements=data["requirements"],
            skills=data["skills"],
            benefits=data["benefits"],
            posted_date=posted_date,
            application_deadline=application_deadline,
            status=JobStatus(data["status"]),
            is_remote=data["is_remote"],
            is_featured=data["is_featured"],
            applicant_count=data["applicant_count"],
            views_count=data["views_count"],
            created_by=data["created_by"],
            created_at=created_at,
            updated_at=updated_at
        )

    @staticmethod
    def _parse_date(date_str: str) -> str:
        """Parse date string and return in consistent format"""
        if "T" in date_str:
            return date_str.split("T")[0]
        return date_str

    @staticmethod
    def _parse_datetime(datetime_str: str) -> str:
        """Parse datetime string and return in consistent format"""
        if datetime_str.endswith('Z'):
            return datetime_str[:-1]
        return datetime_str

    def get_company(self, companies: List[Company]) -> Optional[Company]:
        """Get company information for this job"""
        for company in companies:
            if company.id == self.company_id:
                return company
        return None

    def is_active(self) -> bool:
        """Check if job is currently active"""
        return self.status == JobStatus.ACTIVE

    def is_expired(self) -> bool:
        """Check if job application deadline has passed"""
        try:
            deadline = datetime.fromisoformat(self.application_deadline)
            return datetime.now() > deadline
        except ValueError:
            return False

    def can_apply(self) -> bool:
        """Check if job is available for applications"""
        return self.is_active() and not self.is_expired()
