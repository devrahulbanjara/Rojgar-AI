from datetime import date

import pytest
from fastapi import HTTPException

from app.schemas.candidate import CandidateProfileUpdate
from app.schemas.shared import (
    CertificationBase,
    EducationBase,
    SkillBase,
    SocialLinkBase,
    WorkExperienceBase,
)
from app.services.candidate import CandidateService


@pytest.mark.unit
class TestCandidateProfileService:
    def test_get_full_profile_success(self, db_session, sample_candidate):
        """Test successfully retrieving a candidate's full profile."""
        result = CandidateService.get_full_profile(db_session, sample_candidate.user_id)

        assert result is not None
        assert result.user_id == sample_candidate.user_id
        assert result.user.name == sample_candidate.name
        assert result.user.email == sample_candidate.email

    def test_get_full_profile_not_found(self, db_session):
        """Test retrieving a non-existent profile raises 404."""
        with pytest.raises(HTTPException) as exc_info:
            CandidateService.get_full_profile(db_session, "nonexistent-id")

        assert exc_info.value.status_code == 404
        assert "not found" in exc_info.value.detail.lower()

    def test_update_basic_info_success(self, db_session, sample_candidate):
        """Test successfully updating candidate basic info."""
        update_data = CandidateProfileUpdate(
            full_name="Sandeep Kumar Sharma",
            phone="+977-9812345678",
            location_city="Pokhara",
            location_country="Nepal",
            professional_headline="Senior Software Engineer",
            professional_summary="Experienced developer with 5+ years in full-stack development.",
        )

        result = CandidateService.update_basic_info(
            db_session, sample_candidate.user_id, update_data
        )

        assert result.user.name == "Sandeep Kumar Sharma"
        assert result.phone == "+977-9812345678"
        assert result.location_city == "Pokhara"
        assert result.location_country == "Nepal"
        assert result.professional_headline == "Senior Software Engineer"
        assert (
            result.professional_summary
            == "Experienced developer with 5+ years in full-stack development."
        )

    def test_update_basic_info_partial(self, db_session, sample_candidate):
        """Test partially updating candidate basic info."""
        update_data = CandidateProfileUpdate(
            phone="+977-9898989898",
            professional_headline="Full Stack Developer",
        )

        result = CandidateService.update_basic_info(
            db_session, sample_candidate.user_id, update_data
        )

        assert result.phone == "+977-9898989898"
        assert result.professional_headline == "Full Stack Developer"
        assert result.user.name == sample_candidate.name

    def test_add_work_experience_success(self, db_session, sample_candidate):
        """Test successfully adding work experience."""
        exp_data = WorkExperienceBase(
            job_title="Software Engineer",
            company="TechCorp Nepal",
            location="Kathmandu, Nepal",
            start_date=date(2020, 1, 15),
            end_date=date(2022, 6, 30),
            is_current=False,
            description="Developed web applications using Python and React.",
        )

        result = CandidateService.add_experience(
            db_session, sample_candidate.user_id, exp_data
        )

        assert result is not None
        assert result.job_title == "Software Engineer"
        assert result.company == "TechCorp Nepal"
        assert result.location == "Kathmandu, Nepal"
        assert result.is_current is False
        assert "Python and React" in result.description

    def test_add_work_experience_current_job(self, db_session, sample_candidate):
        """Test adding current work experience."""
        exp_data = WorkExperienceBase(
            job_title="Senior Developer",
            company="Banjara Technologies",
            location="Remote",
            start_date=date(2022, 7, 1),
            is_current=True,
            description="Leading development team on enterprise projects.",
        )

        result = CandidateService.add_experience(
            db_session, sample_candidate.user_id, exp_data
        )

        assert result.is_current is True
        assert result.end_date is None
        assert result.company == "Banjara Technologies"

    def test_update_work_experience_success(self, db_session, sample_candidate):
        """Test successfully updating work experience."""
        exp_data = WorkExperienceBase(
            job_title="Junior Developer",
            company="StartupXYZ",
            start_date=date(2019, 1, 1),
        )
        exp = CandidateService.add_experience(
            db_session, sample_candidate.user_id, exp_data
        )

        from app.schemas.candidate import WorkExperienceUpdate

        update_data = WorkExperienceUpdate(
            job_title="Mid-Level Developer",
            company="StartupXYZ Inc",
            description="Promoted to mid-level position.",
        )

        result = CandidateService.update_experience(
            db_session,
            sample_candidate.user_id,
            exp.candidate_work_experience_id,
            update_data,
        )

        assert result.job_title == "Mid-Level Developer"
        assert result.company == "StartupXYZ Inc"
        assert result.description == "Promoted to mid-level position."

    def test_delete_work_experience_success(self, db_session, sample_candidate):
        """Test successfully deleting work experience."""
        exp_data = WorkExperienceBase(
            job_title="Intern",
            company="TechStartup",
            start_date=date(2018, 6, 1),
        )
        exp = CandidateService.add_experience(
            db_session, sample_candidate.user_id, exp_data
        )

        CandidateService.delete_experience(
            db_session, sample_candidate.user_id, exp.candidate_work_experience_id
        )

        profile = CandidateService.get_full_profile(
            db_session, sample_candidate.user_id
        )
        assert len(profile.work_experiences) == 0

    def test_delete_work_experience_not_found(self, db_session, sample_candidate):
        """Test deleting non-existent work experience raises 404."""
        with pytest.raises(HTTPException) as exc_info:
            CandidateService.delete_experience(
                db_session, sample_candidate.user_id, "nonexistent-exp-id"
            )

        assert exc_info.value.status_code == 404

    def test_add_education_success(self, db_session, sample_candidate):
        """Test successfully adding education."""
        edu_data = EducationBase(
            college_name="Tribhuvan University",
            degree="Bachelor of Computer Science",
            location="Kathmandu, Nepal",
            start_date=date(2016, 8, 1),
            end_date=date(2020, 7, 31),
            is_current=False,
        )

        result = CandidateService.add_education(
            db_session, sample_candidate.user_id, edu_data
        )

        assert result is not None
        assert result.college_name == "Tribhuvan University"
        assert result.degree == "Bachelor of Computer Science"
        assert result.location == "Kathmandu, Nepal"
        assert result.is_current is False

    def test_add_education_current(self, db_session, sample_candidate):
        """Test adding current education."""
        edu_data = EducationBase(
            college_name="MIT",
            degree="Master of Computer Science",
            location="Cambridge, USA",
            start_date=date(2023, 9, 1),
            is_current=True,
        )

        result = CandidateService.add_education(
            db_session, sample_candidate.user_id, edu_data
        )

        assert result.is_current is True
        assert result.end_date is None

    def test_update_education_success(self, db_session, sample_candidate):
        """Test successfully updating education."""
        edu_data = EducationBase(
            college_name="Local College",
            degree="BSc Computer Science",
        )
        edu = CandidateService.add_education(
            db_session, sample_candidate.user_id, edu_data
        )

        from app.schemas.candidate import EducationUpdate

        update_data = EducationUpdate(
            college_name="National University",
            location="Kathmandu, Nepal",
        )

        result = CandidateService.update_education(
            db_session,
            sample_candidate.user_id,
            edu.candidate_education_id,
            update_data,
        )

        assert result.college_name == "National University"
        assert result.location == "Kathmandu, Nepal"
        assert result.degree == "BSc Computer Science"

    def test_delete_education_success(self, db_session, sample_candidate):
        """Test successfully deleting education."""
        edu_data = EducationBase(
            college_name="Test College",
            degree="Test Degree",
        )
        edu = CandidateService.add_education(
            db_session, sample_candidate.user_id, edu_data
        )

        CandidateService.delete_education(
            db_session, sample_candidate.user_id, edu.candidate_education_id
        )

        profile = CandidateService.get_full_profile(
            db_session, sample_candidate.user_id
        )
        assert len(profile.educations) == 0

    def test_add_skill_success(self, db_session, sample_candidate):
        """Test successfully adding a skill."""
        skill_data = SkillBase(skill_name="Python")

        result = CandidateService.add_skill(
            db_session, sample_candidate.user_id, skill_data
        )

        assert result is not None
        assert result.skill_name == "Python"

    def test_add_multiple_skills(self, db_session, sample_candidate):
        """Test adding multiple skills."""
        skills = ["Python", "JavaScript", "React", "Django", "PostgreSQL"]

        for skill_name in skills:
            CandidateService.add_skill(
                db_session, sample_candidate.user_id, SkillBase(skill_name=skill_name)
            )

        profile = CandidateService.get_full_profile(
            db_session, sample_candidate.user_id
        )
        assert len(profile.skills) == 5
        skill_names = [s.skill_name for s in profile.skills]
        assert "Python" in skill_names
        assert "React" in skill_names

    def test_update_skill_success(self, db_session, sample_candidate):
        """Test successfully updating a skill."""
        skill = CandidateService.add_skill(
            db_session, sample_candidate.user_id, SkillBase(skill_name="Javascripts")
        )

        from app.schemas.candidate import SkillUpdate

        update_data = SkillUpdate(skill_name="JavaScript")

        result = CandidateService.update_skill(
            db_session, sample_candidate.user_id, skill.candidate_skill_id, update_data
        )

        assert result.skill_name == "JavaScript"

    def test_delete_skill_success(self, db_session, sample_candidate):
        """Test successfully deleting a skill."""
        skill = CandidateService.add_skill(
            db_session, sample_candidate.user_id, SkillBase(skill_name="Java")
        )

        CandidateService.delete_skill(
            db_session, sample_candidate.user_id, skill.candidate_skill_id
        )

        profile = CandidateService.get_full_profile(
            db_session, sample_candidate.user_id
        )
        assert len(profile.skills) == 0

    def test_add_certification_success(self, db_session, sample_candidate):
        """Test successfully adding a certification."""
        cert_data = CertificationBase(
            certification_name="AWS Solutions Architect",
            issuing_body="Amazon Web Services",
            credential_id="AWS-12345",
            credential_url="https://aws.amazon.com/verify/12345",
            issue_date=date(2023, 5, 15),
            expiration_date=date(2026, 5, 15),
            does_not_expire=False,
        )

        result = CandidateService.add_certification(
            db_session, sample_candidate.user_id, cert_data
        )

        assert result is not None
        assert result.certification_name == "AWS Solutions Architect"
        assert result.issuing_body == "Amazon Web Services"
        assert result.credential_id == "AWS-12345"
        assert result.does_not_expire is False

    def test_add_certification_no_expiry(self, db_session, sample_candidate):
        """Test adding certification that does not expire."""
        cert_data = CertificationBase(
            certification_name="MongoDB Certified Developer",
            issuing_body="MongoDB University",
            credential_url="https://university.mongodb.com/verify",
            issue_date=date(2022, 10, 1),
            does_not_expire=True,
        )

        result = CandidateService.add_certification(
            db_session, sample_candidate.user_id, cert_data
        )

        assert result.does_not_expire is True
        assert result.expiration_date is None

    def test_update_certification_success(self, db_session, sample_candidate):
        """Test successfully updating a certification."""
        cert = CandidateService.add_certification(
            db_session,
            sample_candidate.user_id,
            CertificationBase(
                certification_name="Old Cert",
                issuing_body="Old Body",
            ),
        )

        from app.schemas.candidate import CertificationUpdate

        update_data = CertificationUpdate(
            certification_name="Updated Certification",
            credential_url="https://updated.com",
        )

        result = CandidateService.update_certification(
            db_session,
            sample_candidate.user_id,
            cert.candidate_certification_id,
            update_data,
        )

        assert result.certification_name == "Updated Certification"
        assert result.credential_url == "https://updated.com"
        assert result.issuing_body == "Old Body"

    def test_delete_certification_success(self, db_session, sample_candidate):
        """Test successfully deleting a certification."""
        cert = CandidateService.add_certification(
            db_session,
            sample_candidate.user_id,
            CertificationBase(
                certification_name="Test Cert",
                issuing_body="Test Body",
            ),
        )

        CandidateService.delete_certification(
            db_session, sample_candidate.user_id, cert.candidate_certification_id
        )

        profile = CandidateService.get_full_profile(
            db_session, sample_candidate.user_id
        )
        assert len(profile.certifications) == 0

    def test_add_social_link_success(self, db_session, sample_candidate):
        """Test successfully adding a social link."""
        link_data = SocialLinkBase(
            type="LinkedIn",
            url="https://linkedin.com/in/sandeepsharma",
        )

        result = CandidateService.add_social_link(
            db_session, sample_candidate.user_id, link_data
        )

        assert result is not None
        assert result.type == "LinkedIn"
        assert result.url == "https://linkedin.com/in/sandeepsharma"

    def test_add_multiple_social_links(self, db_session, sample_candidate):
        """Test adding multiple social links."""
        links = [
            SocialLinkBase(type="GitHub", url="https://github.com/sandeepsharma"),
            SocialLinkBase(
                type="LinkedIn", url="https://linkedin.com/in/sandeepsharma"
            ),
            SocialLinkBase(type="Portfolio", url="https://sandeepsharma.dev"),
        ]

        for link in links:
            CandidateService.add_social_link(db_session, sample_candidate.user_id, link)

        profile = CandidateService.get_full_profile(
            db_session, sample_candidate.user_id
        )
        assert len(profile.social_links) == 3

    def test_update_social_link_success(self, db_session, sample_candidate):
        """Test successfully updating a social link."""
        link = CandidateService.add_social_link(
            db_session,
            sample_candidate.user_id,
            SocialLinkBase(type="GitHub", url="https://github.com/oldusername"),
        )

        update_data = SocialLinkBase(
            type="GitHub",
            url="https://github.com/sandeepsharma",
        )

        result = CandidateService.update_social_link(
            db_session, sample_candidate.user_id, link.social_link_id, update_data
        )

        assert result.url == "https://github.com/sandeepsharma"

    def test_delete_social_link_success(self, db_session, sample_candidate):
        """Test successfully deleting a social link."""
        link = CandidateService.add_social_link(
            db_session,
            sample_candidate.user_id,
            SocialLinkBase(type="Twitter", url="https://twitter.com/test"),
        )

        CandidateService.delete_social_link(
            db_session, sample_candidate.user_id, link.social_link_id
        )

        profile = CandidateService.get_full_profile(
            db_session, sample_candidate.user_id
        )
        assert len(profile.social_links) == 0

    def test_complete_profile_workflow(self, db_session, sample_candidate):
        """Test a complete workflow of building a candidate profile."""
        # Update basic info
        CandidateService.update_basic_info(
            db_session,
            sample_candidate.user_id,
            CandidateProfileUpdate(
                full_name="Sandeep Kumar Sharma",
                phone="+977-9812345678",
                location_city="Kathmandu",
                location_country="Nepal",
                professional_headline="Full Stack Developer",
                professional_summary="Passionate developer with expertise in web technologies.",
            ),
        )

        # Add work experiences
        CandidateService.add_experience(
            db_session,
            sample_candidate.user_id,
            WorkExperienceBase(
                job_title="Senior Developer",
                company="TechCorp",
                location="Kathmandu",
                start_date=date(2021, 1, 1),
                is_current=True,
                description="Leading development projects.",
            ),
        )

        # Add education
        CandidateService.add_education(
            db_session,
            sample_candidate.user_id,
            EducationBase(
                college_name="Tribhuvan University",
                degree="Bachelor of Computer Science",
                location="Kathmandu",
                start_date=date(2016, 8, 1),
                end_date=date(2020, 6, 1),
            ),
        )

        # Add skills
        for skill in ["Python", "Django", "React", "PostgreSQL"]:
            CandidateService.add_skill(
                db_session, sample_candidate.user_id, SkillBase(skill_name=skill)
            )

        # Add certification
        CandidateService.add_certification(
            db_session,
            sample_candidate.user_id,
            CertificationBase(
                certification_name="AWS Certified Developer",
                issuing_body="Amazon Web Services",
                issue_date=date(2022, 6, 1),
                does_not_expire=False,
                expiration_date=date(2025, 6, 1),
            ),
        )

        # Add social links
        CandidateService.add_social_link(
            db_session,
            sample_candidate.user_id,
            SocialLinkBase(type="LinkedIn", url="https://linkedin.com/in/sandeep"),
        )

        # Verify complete profile
        profile = CandidateService.get_full_profile(
            db_session, sample_candidate.user_id
        )

        assert profile.user.name == "Sandeep Kumar Sharma"
        assert profile.phone == "+977-9812345678"
        assert profile.professional_headline == "Full Stack Developer"
        assert len(profile.work_experiences) == 1
        assert len(profile.educations) == 1
        assert len(profile.skills) == 4
        assert len(profile.certifications) == 1
        assert len(profile.social_links) == 1
