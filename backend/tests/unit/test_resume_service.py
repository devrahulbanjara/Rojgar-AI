from datetime import date

import pytest
from fastapi import HTTPException

from app.schemas.resume import (
    ResumeCertificationUpdate,
    ResumeCreate,
    ResumeEducationUpdate,
    ResumeSkillUpdate,
    ResumeUpdate,
    ResumeWorkExperienceUpdate,
)
from app.schemas.shared import (
    CertificationBase,
    EducationBase,
    SkillBase,
    SocialLinkBase,
    WorkExperienceBase,
)
from app.services.candidate import CandidateService
from app.services.candidate.resume_service import ResumeService


@pytest.mark.unit
class TestResumeService:
    def test_create_resume_fork_from_profile(self, db_session, sample_candidate):
        CandidateService.add_experience(
            db_session,
            sample_candidate.user_id,
            WorkExperienceBase(
                job_title="Software Engineer",
                company="TechCorp",
                start_date=date(2020, 1, 1),
            ),
        )
        CandidateService.add_skill(
            db_session, sample_candidate.user_id, SkillBase(skill_name="Python")
        )
        resume_data = ResumeCreate(
            resume_name="My First Resume",
            target_job_title="Senior Software Engineer",
            custom_summary="Experienced software engineer seeking new opportunities.",
        )
        result = ResumeService.create_resume_fork(
            db_session, sample_candidate.user_id, resume_data
        )
        assert result is not None
        assert result.resume_name == "My First Resume"
        assert result.target_job_title == "Senior Software Engineer"
        assert (
            result.custom_summary
            == "Experienced software engineer seeking new opportunities."
        )
        assert len(result.work_experiences) == 1
        assert len(result.skills) == 1

    def test_create_resume_fork_with_custom_data(self, db_session, sample_candidate):
        resume_data = ResumeCreate(
            resume_name="Custom Resume",
            target_job_title="Full Stack Developer",
            work_experiences=[
                WorkExperienceBase(
                    job_title="Backend Developer",
                    company="StartupXYZ",
                    location="Remote",
                    start_date=date(2019, 6, 1),
                    end_date=date(2021, 12, 31),
                    is_current=False,
                    description="Developed RESTful APIs using Python and FastAPI.",
                )
            ],
            skills=[SkillBase(skill_name="FastAPI"), SkillBase(skill_name="Docker")],
        )
        result = ResumeService.create_resume_fork(
            db_session, sample_candidate.user_id, resume_data
        )
        assert result.resume_name == "Custom Resume"
        assert len(result.work_experiences) == 1
        assert result.work_experiences[0].job_title == "Backend Developer"
        assert len(result.skills) == 2

    def test_create_resume_fork_with_all_fields(self, db_session, sample_candidate):
        resume_data = ResumeCreate(
            resume_name="Complete Resume",
            target_job_title="DevOps Engineer",
            custom_summary="Expert in cloud infrastructure and automation.",
            work_experiences=[
                WorkExperienceBase(
                    job_title="DevOps Engineer",
                    company="CloudTech Inc",
                    location="Kathmandu, Nepal",
                    start_date=date(2021, 1, 1),
                    is_current=True,
                    description="Managing AWS infrastructure.",
                )
            ],
            educations=[
                EducationBase(
                    college_name="Tribhuvan University",
                    degree="Bachelor of Computer Engineering",
                    location="Kathmandu",
                    start_date=date(2015, 8, 1),
                    end_date=date(2019, 7, 31),
                )
            ],
            skills=[
                SkillBase(skill_name="AWS"),
                SkillBase(skill_name="Kubernetes"),
                SkillBase(skill_name="Terraform"),
            ],
            certifications=[
                CertificationBase(
                    certification_name="AWS Solutions Architect",
                    issuing_body="Amazon Web Services",
                    credential_id="AWS-SA-123",
                    issue_date=date(2022, 5, 15),
                    does_not_expire=False,
                    expiration_date=date(2025, 5, 15),
                )
            ],
            social_links=[
                SocialLinkBase(type="GitHub", url="https://github.com/sandeep"),
                SocialLinkBase(type="LinkedIn", url="https://linkedin.com/in/sandeep"),
            ],
        )
        result = ResumeService.create_resume_fork(
            db_session, sample_candidate.user_id, resume_data
        )
        assert len(result.work_experiences) == 1
        assert len(result.educations) == 1
        assert len(result.skills) == 3
        assert len(result.certifications) == 1
        assert len(result.social_links) == 2

    def test_create_resume_profile_not_found(self, db_session):
        resume_data = ResumeCreate(resume_name="Test Resume")
        with pytest.raises(HTTPException) as exc_info:
            ResumeService.create_resume_fork(
                db_session, "nonexistent-user-id", resume_data
            )
        assert exc_info.value.status_code == 404
        assert exc_info.value.detail["error"] == "NOT_FOUND"

    def test_get_resume_success(self, db_session, sample_candidate):
        resume_data = ResumeCreate(
            resume_name="Test Resume", target_job_title="Software Developer"
        )
        created = ResumeService.create_resume_fork(
            db_session, sample_candidate.user_id, resume_data
        )
        result = ResumeService.get_resume(
            db_session, sample_candidate.user_id, created.resume_id
        )
        assert result is not None
        assert result.resume_id == created.resume_id
        assert result.resume_name == "Test Resume"

    def test_get_resume_not_found(self, db_session, sample_candidate):
        with pytest.raises(HTTPException) as exc_info:
            ResumeService.get_resume(
                db_session, sample_candidate.user_id, "nonexistent-resume-id"
            )
        assert exc_info.value.status_code == 404
        assert exc_info.value.detail["error"] == "RESUME_NOT_FOUND"

    def test_get_resume_wrong_owner(
        self, db_session, sample_candidate, sample_recruiter
    ):
        resume_data = ResumeCreate(resume_name="My Resume")
        created = ResumeService.create_resume_fork(
            db_session, sample_candidate.user_id, resume_data
        )
        with pytest.raises(HTTPException) as exc_info:
            ResumeService.get_resume(
                db_session, sample_recruiter.user_id, created.resume_id
            )
        assert exc_info.value.status_code == 404
        assert exc_info.value.detail["error"] == "RESUME_NOT_FOUND"

    def test_list_resumes_success(self, db_session, sample_candidate):
        resume1 = ResumeCreate(resume_name="Resume for Backend Jobs")
        resume2 = ResumeCreate(resume_name="Resume for Frontend Jobs")
        resume3 = ResumeCreate(resume_name="Resume for DevOps Jobs")
        ResumeService.create_resume_fork(db_session, sample_candidate.user_id, resume1)
        ResumeService.create_resume_fork(db_session, sample_candidate.user_id, resume2)
        ResumeService.create_resume_fork(db_session, sample_candidate.user_id, resume3)
        result = ResumeService.list_resumes(db_session, sample_candidate.user_id)
        assert len(result) == 3
        resume_names = [r.resume_name for r in result]
        assert "Resume for Backend Jobs" in resume_names
        assert "Resume for DevOps Jobs" in resume_names

    def test_list_resumes_empty(self, db_session, sample_candidate):
        result = ResumeService.list_resumes(db_session, sample_candidate.user_id)
        assert len(result) == 0

    def test_update_resume_success(self, db_session, sample_candidate):
        resume_data = ResumeCreate(resume_name="Original Name")
        created = ResumeService.create_resume_fork(
            db_session, sample_candidate.user_id, resume_data
        )
        update_data = ResumeUpdate(
            resume_name="Updated Name",
            target_job_title="Senior Engineer",
            custom_summary="Updated summary for better job targeting.",
        )
        result = ResumeService.update_resume(
            db_session, sample_candidate.user_id, created.resume_id, update_data
        )
        assert result.resume_name == "Updated Name"
        assert result.target_job_title == "Senior Engineer"
        assert result.custom_summary == "Updated summary for better job targeting."

    def test_update_resume_partial(self, db_session, sample_candidate):
        resume_data = ResumeCreate(
            resume_name="Original",
            target_job_title="Developer",
            custom_summary="Original summary",
        )
        created = ResumeService.create_resume_fork(
            db_session, sample_candidate.user_id, resume_data
        )
        update_data = ResumeUpdate(resume_name="Only Name Changed")
        result = ResumeService.update_resume(
            db_session, sample_candidate.user_id, created.resume_id, update_data
        )
        assert result.resume_name == "Only Name Changed"
        assert result.target_job_title == "Developer"
        assert result.custom_summary == "Original summary"

    def test_delete_resume_success(self, db_session, sample_candidate):
        resume_data = ResumeCreate(resume_name="Resume to Delete")
        created = ResumeService.create_resume_fork(
            db_session, sample_candidate.user_id, resume_data
        )
        ResumeService.delete_resume(
            db_session, sample_candidate.user_id, created.resume_id
        )
        with pytest.raises(HTTPException) as exc_info:
            ResumeService.get_resume(
                db_session, sample_candidate.user_id, created.resume_id
            )
        assert exc_info.value.status_code == 404
        assert exc_info.value.detail["error"] == "RESUME_NOT_FOUND"

    def test_add_experience_to_resume(self, db_session, sample_candidate):
        resume = ResumeService.create_resume_fork(
            db_session,
            sample_candidate.user_id,
            ResumeCreate(resume_name="Test Resume"),
        )
        exp_data = WorkExperienceBase(
            job_title="Backend Developer",
            company="Banjara Tech",
            location="Pokhara, Nepal",
            start_date=date(2020, 5, 1),
            end_date=date(2023, 4, 30),
            is_current=False,
            description="Developed scalable backend systems.",
        )
        result = ResumeService.add_experience(
            db_session, sample_candidate.user_id, resume.resume_id, exp_data
        )
        assert result is not None
        assert result.job_title == "Backend Developer"
        assert result.company == "Banjara Tech"

    def test_delete_experience_from_resume(self, db_session, sample_candidate):
        resume = ResumeService.create_resume_fork(
            db_session,
            sample_candidate.user_id,
            ResumeCreate(resume_name="Test Resume"),
        )
        exp = ResumeService.add_experience(
            db_session,
            sample_candidate.user_id,
            resume.resume_id,
            WorkExperienceBase(
                job_title="Test Job", company="Test Co", start_date=date(2020, 1, 1)
            ),
        )
        ResumeService.delete_experience(
            db_session,
            sample_candidate.user_id,
            resume.resume_id,
            exp.resume_work_experience_id,
        )
        updated_resume = ResumeService.get_resume(
            db_session, sample_candidate.user_id, resume.resume_id
        )
        assert len(updated_resume.work_experiences) == 0

    def test_update_experience_in_resume(self, db_session, sample_candidate):
        resume = ResumeService.create_resume_fork(
            db_session,
            sample_candidate.user_id,
            ResumeCreate(resume_name="Test Resume"),
        )
        exp = ResumeService.add_experience(
            db_session,
            sample_candidate.user_id,
            resume.resume_id,
            WorkExperienceBase(
                job_title="Junior Developer",
                company="StartupXYZ",
                start_date=date(2019, 1, 1),
            ),
        )
        update_data = ResumeWorkExperienceUpdate(
            job_title="Senior Developer",
            description="Promoted after 2 years of excellent performance.",
        )
        result = ResumeService.update_experience(
            db_session,
            sample_candidate.user_id,
            resume.resume_id,
            exp.resume_work_experience_id,
            update_data,
        )
        assert result.job_title == "Senior Developer"
        assert "Promoted" in result.description
        assert result.company == "StartupXYZ"

    def test_add_education_to_resume(self, db_session, sample_candidate):
        resume = ResumeService.create_resume_fork(
            db_session,
            sample_candidate.user_id,
            ResumeCreate(resume_name="Test Resume"),
        )
        edu_data = EducationBase(
            college_name="Kathmandu University",
            degree="Bachelor of Computer Science",
            location="Dhulikhel, Nepal",
            start_date=date(2016, 8, 1),
            end_date=date(2020, 7, 31),
        )
        result = ResumeService.add_education(
            db_session, sample_candidate.user_id, resume.resume_id, edu_data
        )
        assert result is not None
        assert result.college_name == "Kathmandu University"
        assert result.degree == "Bachelor of Computer Science"

    def test_delete_education_from_resume(self, db_session, sample_candidate):
        resume = ResumeService.create_resume_fork(
            db_session,
            sample_candidate.user_id,
            ResumeCreate(resume_name="Test Resume"),
        )
        edu = ResumeService.add_education(
            db_session,
            sample_candidate.user_id,
            resume.resume_id,
            EducationBase(college_name="Test College", degree="Test Degree"),
        )
        ResumeService.delete_education(
            db_session,
            sample_candidate.user_id,
            resume.resume_id,
            edu.resume_education_id,
        )
        updated_resume = ResumeService.get_resume(
            db_session, sample_candidate.user_id, resume.resume_id
        )
        assert len(updated_resume.educations) == 0

    def test_update_education_in_resume(self, db_session, sample_candidate):
        resume = ResumeService.create_resume_fork(
            db_session,
            sample_candidate.user_id,
            ResumeCreate(resume_name="Test Resume"),
        )
        edu = ResumeService.add_education(
            db_session,
            sample_candidate.user_id,
            resume.resume_id,
            EducationBase(college_name="Old College", degree="BSc Computer Science"),
        )
        update_data = ResumeEducationUpdate(
            college_name="New University", location="Kathmandu, Nepal"
        )
        result = ResumeService.update_education(
            db_session,
            sample_candidate.user_id,
            resume.resume_id,
            edu.resume_education_id,
            update_data,
        )
        assert result.college_name == "New University"
        assert result.location == "Kathmandu, Nepal"
        assert result.degree == "BSc Computer Science"

    def test_add_skill_to_resume(self, db_session, sample_candidate):
        resume = ResumeService.create_resume_fork(
            db_session,
            sample_candidate.user_id,
            ResumeCreate(resume_name="Test Resume"),
        )
        skill_data = SkillBase(skill_name="TypeScript")
        result = ResumeService.add_skill(
            db_session, sample_candidate.user_id, resume.resume_id, skill_data
        )
        assert result is not None
        assert result.skill_name == "TypeScript"

    def test_delete_skill_from_resume(self, db_session, sample_candidate):
        resume = ResumeService.create_resume_fork(
            db_session,
            sample_candidate.user_id,
            ResumeCreate(resume_name="Test Resume"),
        )
        skill = ResumeService.add_skill(
            db_session,
            sample_candidate.user_id,
            resume.resume_id,
            SkillBase(skill_name="Java"),
        )
        ResumeService.delete_skill(
            db_session,
            sample_candidate.user_id,
            resume.resume_id,
            skill.resume_skill_id,
        )
        updated_resume = ResumeService.get_resume(
            db_session, sample_candidate.user_id, resume.resume_id
        )
        assert len(updated_resume.skills) == 0

    def test_update_skill_in_resume(self, db_session, sample_candidate):
        resume = ResumeService.create_resume_fork(
            db_session,
            sample_candidate.user_id,
            ResumeCreate(resume_name="Test Resume"),
        )
        skill = ResumeService.add_skill(
            db_session,
            sample_candidate.user_id,
            resume.resume_id,
            SkillBase(skill_name="Javascripts"),
        )
        update_data = ResumeSkillUpdate(skill_name="JavaScript")
        result = ResumeService.update_skill(
            db_session,
            sample_candidate.user_id,
            resume.resume_id,
            skill.resume_skill_id,
            update_data,
        )
        assert result.skill_name == "JavaScript"

    def test_add_certification_to_resume(self, db_session, sample_candidate):
        resume = ResumeService.create_resume_fork(
            db_session,
            sample_candidate.user_id,
            ResumeCreate(resume_name="Test Resume"),
        )
        cert_data = CertificationBase(
            certification_name="Google Cloud Professional",
            issuing_body="Google",
            credential_url="https://google.com/verify",
            issue_date=date(2023, 3, 15),
            does_not_expire=True,
        )
        result = ResumeService.add_certification(
            db_session, sample_candidate.user_id, resume.resume_id, cert_data
        )
        assert result is not None
        assert result.certification_name == "Google Cloud Professional"
        assert result.does_not_expire is True

    def test_delete_certification_from_resume(self, db_session, sample_candidate):
        resume = ResumeService.create_resume_fork(
            db_session,
            sample_candidate.user_id,
            ResumeCreate(resume_name="Test Resume"),
        )
        cert = ResumeService.add_certification(
            db_session,
            sample_candidate.user_id,
            resume.resume_id,
            CertificationBase(certification_name="Test Cert", issuing_body="Test Body"),
        )
        ResumeService.delete_certification(
            db_session,
            sample_candidate.user_id,
            resume.resume_id,
            cert.resume_certification_id,
        )
        updated_resume = ResumeService.get_resume(
            db_session, sample_candidate.user_id, resume.resume_id
        )
        assert len(updated_resume.certifications) == 0

    def test_update_certification_in_resume(self, db_session, sample_candidate):
        resume = ResumeService.create_resume_fork(
            db_session,
            sample_candidate.user_id,
            ResumeCreate(resume_name="Test Resume"),
        )
        cert = ResumeService.add_certification(
            db_session,
            sample_candidate.user_id,
            resume.resume_id,
            CertificationBase(
                certification_name="Old Certification", issuing_body="Old Body"
            ),
        )
        update_data = ResumeCertificationUpdate(
            certification_name="Updated Certification",
            credential_url="https://updated-cert.com",
        )
        result = ResumeService.update_certification(
            db_session,
            sample_candidate.user_id,
            resume.resume_id,
            cert.resume_certification_id,
            update_data,
        )
        assert result.certification_name == "Updated Certification"
        assert result.credential_url == "https://updated-cert.com"
        assert result.issuing_body == "Old Body"

    def test_complete_resume_workflow(self, db_session, sample_candidate):
        resume_data = ResumeCreate(
            resume_name="Full Stack Developer Resume",
            target_job_title="Full Stack Developer",
            custom_summary="Passionate full-stack developer with 4 years of experience.",
        )
        resume = ResumeService.create_resume_fork(
            db_session, sample_candidate.user_id, resume_data
        )
        ResumeService.add_experience(
            db_session,
            sample_candidate.user_id,
            resume.resume_id,
            WorkExperienceBase(
                job_title="Full Stack Developer",
                company="ConvexHire Technologies",
                location="Kathmandu, Nepal",
                start_date=date(2020, 3, 1),
                is_current=True,
                description="Building recruitment platform with FastAPI and React.",
            ),
        )
        ResumeService.add_education(
            db_session,
            sample_candidate.user_id,
            resume.resume_id,
            EducationBase(
                college_name="Tribhuvan University",
                degree="Bachelor of Engineering in Computer Science",
                location="Kathmandu",
                start_date=date(2015, 8, 1),
                end_date=date(2019, 7, 31),
            ),
        )
        for skill_name in ["Python", "FastAPI", "React", "PostgreSQL", "Docker"]:
            ResumeService.add_skill(
                db_session,
                sample_candidate.user_id,
                resume.resume_id,
                SkillBase(skill_name=skill_name),
            )
        ResumeService.add_certification(
            db_session,
            sample_candidate.user_id,
            resume.resume_id,
            CertificationBase(
                certification_name="AWS Certified Developer - Associate",
                issuing_body="Amazon Web Services",
                credential_id="AWS-DEV-456",
                issue_date=date(2022, 8, 20),
                expiration_date=date(2025, 8, 20),
            ),
        )
        final_resume = ResumeService.get_resume(
            db_session, sample_candidate.user_id, resume.resume_id
        )
        assert final_resume.resume_name == "Full Stack Developer Resume"
        assert len(final_resume.work_experiences) == 1
        assert len(final_resume.educations) == 1
        assert len(final_resume.skills) == 5
        assert len(final_resume.certifications) == 1
        assert final_resume.work_experiences[0].company == "ConvexHire Technologies"

    def test_multiple_resumes_for_different_job_types(
        self, db_session, sample_candidate
    ):
        backend_resume = ResumeService.create_resume_fork(
            db_session,
            sample_candidate.user_id,
            ResumeCreate(
                resume_name="Backend Developer Resume",
                target_job_title="Backend Developer",
                skills=[
                    SkillBase(skill_name="Python"),
                    SkillBase(skill_name="FastAPI"),
                    SkillBase(skill_name="PostgreSQL"),
                ],
            ),
        )
        frontend_resume = ResumeService.create_resume_fork(
            db_session,
            sample_candidate.user_id,
            ResumeCreate(
                resume_name="Frontend Developer Resume",
                target_job_title="Frontend Developer",
                skills=[
                    SkillBase(skill_name="React"),
                    SkillBase(skill_name="TypeScript"),
                    SkillBase(skill_name="CSS"),
                ],
            ),
        )
        devops_resume = ResumeService.create_resume_fork(
            db_session,
            sample_candidate.user_id,
            ResumeCreate(
                resume_name="DevOps Engineer Resume",
                target_job_title="DevOps Engineer",
                skills=[
                    SkillBase(skill_name="AWS"),
                    SkillBase(skill_name="Docker"),
                    SkillBase(skill_name="Kubernetes"),
                ],
            ),
        )
        all_resumes = ResumeService.list_resumes(db_session, sample_candidate.user_id)
        assert len(all_resumes) == 3
        backend = ResumeService.get_resume(
            db_session, sample_candidate.user_id, backend_resume.resume_id
        )
        assert len(backend.skills) == 3
        assert any(s.skill_name == "Python" for s in backend.skills)
        frontend = ResumeService.get_resume(
            db_session, sample_candidate.user_id, frontend_resume.resume_id
        )
        assert any(s.skill_name == "React" for s in frontend.skills)
        devops = ResumeService.get_resume(
            db_session, sample_candidate.user_id, devops_resume.resume_id
        )
        assert any(s.skill_name == "Kubernetes" for s in devops.skills)
