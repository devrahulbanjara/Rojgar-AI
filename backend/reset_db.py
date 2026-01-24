"""
Script to drop all database tables and recreate them.
WARNING: This will delete all data in the database!
"""

from sqlalchemy import text

from app.core.database import Base, engine
from app.models import (  # noqa: F401 - Import all models to register them
    ApplicationStatus,
    CandidateCertification,
    CandidateEducation,
    CandidateProfile,
    CandidateSkills,
    CandidateSocialLink,
    CandidateWorkExperience,
    JobApplication,
    JobApplicationStatusHistory,
    JobDescription,
    JobPosting,
    Organization,
    ReferenceJobDescriptions,
    Resume,
    ResumeCertification,
    ResumeEducation,
    ResumeSkills,
    ResumeSocialLink,
    ResumeWorkExperience,
    User,
    UserGoogle,
    UserRole,
)


def drop_all_tables():
    """Drop all tables from the database."""
    print("Dropping all tables...")
    # Use CASCADE to drop dependent objects by dropping and recreating the schema
    with engine.connect() as conn:
        # Drop schema and recreate it (this drops all tables, views, etc.)
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO postgres"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
        conn.commit()
    print("✓ All tables dropped successfully")


def create_all_tables():
    """Create all tables in the database."""
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ All tables created successfully")


def reset_database():
    """Drop and recreate all database tables."""
    print("=" * 60)
    print("DATABASE RESET")
    print("=" * 60)
    print("WARNING: This will delete ALL data in the database!")
    print("=" * 60)

    try:
        drop_all_tables()
        create_all_tables()
        print("=" * 60)
        print("✓ Database reset completed successfully!")
        print("=" * 60)
    except Exception as e:
        print(f"✗ Error during database reset: {e}")
        raise


if __name__ == "__main__":
    reset_database()
