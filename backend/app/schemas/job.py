from typing import List, Optional, Dict, Any
from pydantic import BaseModel

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

class JobResponse(BaseModel):
    job_id: str
    id: str
    company_id: str
    job_description_id: str
    
    title: str
    department: Optional[str] = None
    level: Optional[str] = None
    
    location: Optional[str] = None
    location_city: Optional[str] = None
    location_country: Optional[str] = None
    is_remote: bool = False
    location_type: Optional[str] = None
    
    employment_type: Optional[str] = "Full-time"
    
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: Optional[str] = "USD"
    salary_range: Optional[Dict[str, Any]] = None
    
    status: str = "active"
    posted_date: Optional[str] = None
    application_deadline: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    company: Optional[CompanyResponse] = None
    company_name: Optional[str] = None
    
    description: Optional[str] = None
    role_overview: Optional[str] = None
    
    skills: List[str] = []
    required_skills: Optional[Dict[str, Any]] = None
    
    requirements: List[str] = []
    benefits: List[str] = []
    nice_to_have: List[str] = []
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


class JobCreate(BaseModel):
    """Schema for creating a new job posting"""
    title: str
    department: Optional[str] = None
    level: Optional[str] = None
    
    # Job Description fields
    description: Optional[str] = ""  # role_overview - optional for drafts
    requiredSkillsAndExperience: Optional[List[str]] = []  # Will be stored as {"required_skills_experience": [...]} - optional for drafts
    niceToHave: Optional[List[str]] = None  # Will be stored as {"nice_to_have": [...]}
    benefits: Optional[List[str]] = None  # Will be stored as {"benefits": [...]} in offers
    
    # Location
    locationCity: Optional[str] = None
    locationCountry: Optional[str] = None
    locationType: str = "On-site"  # Remote, On-site, Hybrid
    employmentType: Optional[str] = None
    
    # Compensation
    salaryMin: Optional[int] = None
    salaryMax: Optional[int] = None
    currency: Optional[str] = "NPR"
    
    # Dates
    applicationDeadline: Optional[str] = None  # ISO date string
    
    # Status
    status: Optional[str] = "active"  # "active", "draft", "expired"