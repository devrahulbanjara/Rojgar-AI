from app.modules.applications.service import _status_email_html
from app.shared.enums import ApplicationStatus


async def test_oversized_request_id_replaced(client):
    resp = await client.get("/health", headers={"X-Request-ID": "x" * 5000})

    assert len(resp.headers["X-Request-ID"]) <= 100


async def test_safe_request_id_echoed(client):
    resp = await client.get("/health", headers={"X-Request-ID": "trace-123"})

    assert resp.headers["X-Request-ID"] == "trace-123"


def test_status_email_escapes_recruiter_controlled_values():
    _, body = _status_email_html(
        ApplicationStatus.shortlisted,
        applicant_name="Sita",
        job_title='<a href="https://phish.example">Click to claim offer</a>',
        company_name="<script>alert(1)</script>",
        app_href="/candidate/applications/1",
    )

    assert "<script>" not in body
    assert 'href="https://phish.example"' not in body
    assert "&lt;script&gt;" in body


async def test_malformed_path_id_is_client_error(client):
    resp = await client.get("/jobs/not-a-uuid")

    assert resp.status_code == 400
