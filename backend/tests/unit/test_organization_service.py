import pytest
from fastapi import HTTPException

from app.schemas.organization import OrganizationUpdateRequest
from app.services.organization import OrganizationService


@pytest.mark.unit
class TestOrganizationService:
    def test_get_organization_by_id_success(self, db_session, sample_organization):
        result = OrganizationService.get_organization_by_id(
            sample_organization.organization_id, db_session
        )
        assert result is not None
        assert result.organization_id == sample_organization.organization_id
        assert result.name == sample_organization.name
        assert result.email == sample_organization.email

    def test_get_organization_by_id_not_found(self, db_session):
        result = OrganizationService.get_organization_by_id(
            "nonexistent-id", db_session
        )
        assert result is None

    def test_update_organization_success(self, db_session, sample_organization):
        update_data = OrganizationUpdateRequest(
            name="BanjaraGroups",
            location_city="Kathmandu",
            website="https://banjaragroups.com",
        )
        result = OrganizationService.update_organization(
            sample_organization.organization_id, update_data, db_session
        )
        assert result.name == "BanjaraGroups"
        assert result.location_city == "Kathmandu"
        assert result.website == "https://banjaragroups.com"
        assert result.location_country == sample_organization.location_country

    def test_update_organization_partial(self, db_session, sample_organization):
        update_data = OrganizationUpdateRequest(name="Partially Updated")
        result = OrganizationService.update_organization(
            sample_organization.organization_id, update_data, db_session
        )
        assert result.name == "Partially Updated"
        assert result.location_city == sample_organization.location_city
        assert result.email == sample_organization.email

    def test_update_organization_not_found(self, db_session):
        update_data = OrganizationUpdateRequest(name="Updated")
        with pytest.raises(HTTPException) as exc_info:
            OrganizationService.update_organization(
                "nonexistent-id", update_data, db_session
            )
        assert exc_info.value.status_code == 404
        assert exc_info.value.detail["error"] == "ORGANIZATION_NOT_FOUND"
        assert "not found" in exc_info.value.detail["message"].lower()

    def test_update_organization_all_fields(self, db_session, sample_organization):
        update_data = OrganizationUpdateRequest(
            name="LetsgoRahulCompany",
            location_city="Austin",
            location_country="USA",
            website="https://letsgorahulcompany.com",
            description="Rahul's new healthcare firm.",
            industry="Healthcare",
            founded_year=2021,
        )
        result = OrganizationService.update_organization(
            sample_organization.organization_id, update_data, db_session
        )
        assert result.name == "LetsgoRahulCompany"
        assert result.location_city == "Austin"
        assert result.location_country == "USA"
        assert result.website == "https://letsgorahulcompany.com"
        assert result.description == "Rahul's new healthcare firm."
        assert result.industry == "Healthcare"
        assert result.founded_year == 2021
        assert result.updated_at is not None
