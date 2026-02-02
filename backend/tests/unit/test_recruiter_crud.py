import pytest

from app.core.exceptions import BusinessLogicError, NotFoundError
from app.schemas.organization import UpdateRecruiterRequest
from app.services.organization import RecruiterCRUD


@pytest.mark.unit
class TestRecruiterCRUD:
    def test_get_recruiter_by_id_success(self, db_session, sample_recruiter):
        result = RecruiterCRUD.get_recruiter_by_id(sample_recruiter.user_id, db_session)
        assert result is not None
        assert result.user_id == sample_recruiter.user_id
        assert result.name == sample_recruiter.name
        assert result.email == sample_recruiter.email

    def test_get_recruiter_by_id_not_found(self, db_session):
        result = RecruiterCRUD.get_recruiter_by_id("nonexistent-id", db_session)
        assert result is None

    def test_get_recruiters_by_organization(
        self, db_session, sample_organization, sample_recruiter
    ):
        result = RecruiterCRUD.get_recruiters_by_organization(
            sample_organization.organization_id, db_session
        )
        assert len(result) == 1
        assert result[0].user_id == sample_recruiter.user_id
        assert result[0].organization_id == sample_organization.organization_id

    def test_get_recruiters_by_organization_empty(
        self, db_session, sample_organization
    ):
        result = RecruiterCRUD.get_recruiters_by_organization(
            sample_organization.organization_id, db_session
        )
        assert len(result) == 0

    def test_create_recruiter_success(self, db_session, sample_organization):
        result = RecruiterCRUD.create_recruiter(
            organization_id=sample_organization.organization_id,
            email="new.recruiter@convexhire.com",
            name="Recruiter Sampada",
            password="##sampada's_secure_password123$$",
            db=db_session,
        )
        assert result is not None
        assert result.email == "new.recruiter@convexhire.com"
        assert result.name == "Recruiter Sampada"
        assert result.organization_id == sample_organization.organization_id
        assert result.role == "recruiter"
        assert result.password != "##sampada's_secure_password123$$"

    def test_create_recruiter_duplicate_email(
        self, db_session, sample_organization, sample_recruiter
    ):
        with pytest.raises(BusinessLogicError) as exc_info:
            RecruiterCRUD.create_recruiter(
                organization_id=sample_organization.organization_id,
                email=sample_recruiter.email,
                name="Duplicate Recruiter",
                password="password",
                db=db_session,
            )
        assert exc_info.value.error_code == "BUSINESS_LOGIC_ERROR"
        assert "already registered" in exc_info.value.message.lower()

    def test_create_recruiter_organization_email_conflict(
        self, db_session, sample_organization
    ):
        with pytest.raises(BusinessLogicError) as exc_info:
            RecruiterCRUD.create_recruiter(
                organization_id=sample_organization.organization_id,
                email=sample_organization.email,
                name="Conflict Recruiter",
                password="password",
                db=db_session,
            )
        assert exc_info.value.error_code == "BUSINESS_LOGIC_ERROR"
        assert "already registered" in exc_info.value.message.lower()

    def test_update_recruiter_success(self, db_session, sample_recruiter):
        update_data = UpdateRecruiterRequest(
            name="Updated Name", email="updated@convexhire.com"
        )
        result = RecruiterCRUD.update_recruiter(
            sample_recruiter.user_id, update_data, db_session
        )
        assert result.name == "Updated Name"
        assert result.email == "updated@convexhire.com"
        assert result.updated_at is not None

    def test_update_recruiter_name_only(self, db_session, sample_recruiter):
        update_data = UpdateRecruiterRequest(name="Only Name Updated")
        result = RecruiterCRUD.update_recruiter(
            sample_recruiter.user_id, update_data, db_session
        )
        assert result.name == "Only Name Updated"
        assert result.email == sample_recruiter.email

    def test_update_recruiter_email_only(self, db_session, sample_recruiter):
        update_data = UpdateRecruiterRequest(email="newemail@convexhire.com")
        result = RecruiterCRUD.update_recruiter(
            sample_recruiter.user_id, update_data, db_session
        )
        assert result.email == "newemail@convexhire.com"
        assert result.name == sample_recruiter.name

    def test_update_recruiter_not_found(self, db_session):
        update_data = UpdateRecruiterRequest(name="Updated")
        with pytest.raises(NotFoundError) as exc_info:
            RecruiterCRUD.update_recruiter("nonexistent-id", update_data, db_session)
        assert exc_info.value.error_code == "RESOURCE_NOT_FOUND"
        assert "not found" in exc_info.value.message.lower()

    def test_update_recruiter_duplicate_email(
        self, db_session, sample_organization, sample_recruiter
    ):
        other_recruiter = RecruiterCRUD.create_recruiter(
            organization_id=sample_organization.organization_id,
            email="other@convexhire.com",
            name="Other Recruiter",
            password="password",
            db=db_session,
        )
        update_data = UpdateRecruiterRequest(email=other_recruiter.email)
        with pytest.raises(BusinessLogicError) as exc_info:
            RecruiterCRUD.update_recruiter(
                sample_recruiter.user_id, update_data, db_session
            )
        assert exc_info.value.error_code == "BUSINESS_LOGIC_ERROR"
        assert "already in use" in exc_info.value.message.lower()

    def test_delete_recruiter_success(self, db_session, sample_recruiter):
        RecruiterCRUD.delete_recruiter(sample_recruiter.user_id, db_session)
        result = RecruiterCRUD.get_recruiter_by_id(sample_recruiter.user_id, db_session)
        assert result is None

    def test_delete_recruiter_not_found(self, db_session):
        with pytest.raises(NotFoundError) as exc_info:
            RecruiterCRUD.delete_recruiter("nonexistent-id", db_session)
        assert exc_info.value.error_code == "RESOURCE_NOT_FOUND"
        assert "not found" in exc_info.value.message.lower()
