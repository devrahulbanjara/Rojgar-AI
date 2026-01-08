import uuid

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.models import Organization, User, UserRole
from app.models.candidate import CandidateProfile


@pytest.fixture(scope="function")
def db_session():
    """Create an in-memory SQLite database for testing."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_organization(db_session: Session):
    """Create a sample organization for testing."""
    org = Organization(
        organization_id=str(uuid.uuid4()),
        email="admin@convexhire.com",
        password="$$$ConvexHire*789#",
        name="ConvexHire",
        location_city="Kathmandu",
        location_country="Nepal",
        website="https://convexhire.com",
        description="ConvexHire is a Final year and Passion project of Rahul Dev Banjara.",
        industry="Technology",
        founded_year=2025,
    )
    db_session.add(org)
    db_session.commit()
    db_session.refresh(org)
    return org


@pytest.fixture
def sample_recruiter(db_session: Session, sample_organization: Organization):
    """Create a sample recruiter for testing."""
    recruiter = User(
        user_id=str(uuid.uuid4()),
        organization_id=sample_organization.organization_id,
        email="recruiter@convexhire.com",
        name="Shubham Joshi",
        role=UserRole.RECRUITER.value,
        password="%%Shubham_hai_ta987$",
    )
    db_session.add(recruiter)
    db_session.commit()
    db_session.refresh(recruiter)
    return recruiter


@pytest.fixture
def sample_candidate(db_session: Session):
    """Create a sample candidate for testing."""
    candidate = User(
        user_id=str(uuid.uuid4()),
        organization_id=None,
        email="sandeep@gmail.com",
        name="Sandeep Sharma",
        role=UserRole.CANDIDATE.value,
        password="&&Sandeep123#$",
    )
    db_session.add(candidate)
    db_session.flush()

    profile = CandidateProfile(
        profile_id=str(uuid.uuid4()),
        user_id=candidate.user_id,
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(candidate)
    return candidate
