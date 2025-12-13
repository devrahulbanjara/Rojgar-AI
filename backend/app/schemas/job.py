from typing import List, Optional, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel, Field

# Company object for frontend
class CompanyResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    founded_year: Optional[int] = None

    class Config:
        from_attributes = True

# Properties to return to client - matches frontend Job type
class JobResponse(BaseModel):
    # IDs
    job_id: str
    id: str  # Frontend uses this as key
    company_id: str
    job_description_id: str
    
    # Core job info
    title: str
    department: Optional[str] = None
    level: Optional[str] = None
    
    # Location - both formats
    location: Optional[str] = None  # Combined for frontend
    location_city: Optional[str] = None
    location_country: Optional[str] = None
    is_remote: bool = False
    location_type: Optional[str] = None  # Remote/On-site/Hybrid
    
    # Employment
    employment_type: Optional[str] = "Full-time"
    
    # Salary - both formats
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: Optional[str] = "USD"
    salary_range: Optional[Dict[str, Any]] = None
    
    # Status and dates
    status: str = "open"
    posted_date: Optional[str] = None
    application_deadline: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    # Company - as object for frontend
    company: Optional[CompanyResponse] = None
    company_name: Optional[str] = None
    
    # Description
    description: Optional[str] = None
    role_overview: Optional[str] = None
    
    # Skills - as array for frontend
    skills: List[str] = []
    required_skills: Optional[Dict[str, Any]] = None
    
    # Additional fields frontend might expect
    requirements: List[str] = []
    benefits: List[str] = []
    applicant_count: int = 0
    views_count: int = 0
    is_featured: bool = False
    
    class Config:
        from_attributes = True
        populate_by_name = True

class JobListResponse(BaseModel):
    jobs: List[JobResponse]
    total: int
    page: int
    limit: int
    total_pages: int
    has_next: bool
    has_prev: bool
