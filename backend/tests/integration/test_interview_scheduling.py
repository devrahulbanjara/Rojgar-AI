"""Native interview scheduling: slots, booking race, reschedule, cancel,
calendar files, reminders and scorecards."""

import asyncio
from datetime import UTC, date, datetime, timedelta
from zoneinfo import ZoneInfo

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select, update

from app.infrastructures.email.service import EmailService
from app.infrastructures.sms import service as sms
from app.modules.entitlements.plans import PassKind
from app.modules.entitlements.service import grant_job_pass
from app.modules.interviews.models import DEFAULT_WEEKLY_HOURS, Interview
from app.modules.interviews.reminders import send_due_reminders
from app.modules.interviews.scheduling import (
    build_ics,
    make_token,
    open_slots,
    read_token,
)
from app.modules.applications.models import ApplicationEvent
from app.shared.enums import ApplicationStage
from main import app
from tests.integration.helpers import (
    auth_headers,
    make_active_job,
    make_application,
    make_candidate_with_resume,
    make_recruiter_admin,
)

KTM = ZoneInfo("Asia/Kathmandu")


@pytest.fixture
def outbox(monkeypatch):
    sent = []

    async def calendar(to_email, subject, html_body, ics, method):
        sent.append({"to": to_email, "subject": subject, "ics": ics, "method": method})
        return True

    async def generic(to_email, subject, html_body):
        sent.append({"to": to_email, "subject": subject, "ics": None, "method": None})

    monkeypatch.setattr(EmailService, "send_calendar_email", staticmethod(calendar))
    monkeypatch.setattr(EmailService, "send_generic_email", staticmethod(generic))
    return sent


# --- pure helpers ------------------------------------------------------------


def test_default_slots_sunday_to_friday_ten_working_days():
    now = datetime(2026, 10, 16, 2, 0, tzinfo=UTC)  # Fri 07:45 in Nepal
    slots = open_slots(
        weekly_hours=DEFAULT_WEEKLY_HOURS,
        tz="Asia/Kathmandu",
        interview_minutes=45,
        buffer_minutes=15,
        busy=[],
        now=now,
    )
    days = sorted({s.start.astimezone(KTM).date() for s in slots})
    assert len(days) == 10
    assert all(d.weekday() != 5 for d in days)  # never Saturday
    first_day = [s for s in slots if s.start.astimezone(KTM).date() == days[0]]
    assert [s.start.astimezone(KTM).strftime("%H:%M") for s in first_day] == [
        "10:00",
        "11:00",
        "12:00",
        "13:00",
        "14:00",
        "15:00",
        "16:00",
    ]
    assert first_day[0].end - first_day[0].start == timedelta(minutes=45)


def test_slots_skip_busy_times_with_buffer_and_short_notice():
    now = datetime(2026, 10, 18, 4, 0, tzinfo=UTC)  # Sun 09:45 Nepal
    busy_start = datetime(2026, 10, 18, 14, 0, tzinfo=KTM)
    slots = open_slots(
        weekly_hours=DEFAULT_WEEKLY_HOURS,
        tz="Asia/Kathmandu",
        interview_minutes=45,
        buffer_minutes=15,
        busy=[(busy_start, busy_start + timedelta(minutes=45))],
        now=now,
        days_ahead=1,
    )
    times = [s.start.astimezone(KTM).strftime("%H:%M") for s in slots]
    # 10:00 and 11:00 are within 2 hours; 14:00 is taken.
    assert times == ["12:00", "13:00", "15:00", "16:00"]


def test_token_roundtrip_and_tamper():
    import uuid

    invite_id = uuid.uuid4()
    token = make_token(invite_id)
    assert len(token) <= 40
    assert read_token(token) == invite_id
    assert read_token(token[:-2] + ("AA" if token[-2:] != "AA" else "BB")) is None
    assert read_token("not-a-token") is None


def test_ics_request_and_cancel_are_calendar_compatible():
    start = datetime(2026, 10, 20, 10, 0, tzinfo=KTM)
    common = dict(
        uid="interview-123@rojgarai",
        start=start,
        end=start + timedelta(minutes=45),
        tz="Asia/Kathmandu",
        summary="Interview: Sita, Backend; Acme",
        description="Join: https://meet.jit.si/rojgarai-x\nReschedule: https://x/schedule/t",
        location="https://meet.jit.si/rojgarai-x",
        organizer=("Rojgar AI", "noreply@rojgarai.com"),
        attendees=[("Sita Rai", "sita@test.dev"), ("Priya", "priya@test.dev")],
    )
    ics = build_ics(method="REQUEST", sequence=0, **common)
    assert ics.startswith("BEGIN:VCALENDAR\r\n") and ics.endswith("END:VCALENDAR\r\n")
    assert "METHOD:REQUEST" in ics
    assert "UID:interview-123@rojgarai" in ics
    assert "SEQUENCE:0" in ics
    assert "TZID:Asia/Kathmandu" in ics and "TZOFFSETTO:+0545" in ics
    assert "DTSTART;TZID=Asia/Kathmandu:20261020T100000" in ics
    assert "DTEND;TZID=Asia/Kathmandu:20261020T104500" in ics
    assert "STATUS:CONFIRMED" in ics
    assert "SUMMARY:Interview: Sita\\, Backend\\; Acme" in ics
    assert (
        "ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;" in ics
    )
    assert all(len(line.encode()) <= 75 for line in ics.split("\r\n"))

    cancel = build_ics(method="CANCEL", sequence=2, **common)
    assert "METHOD:CANCEL" in cancel and "STATUS:CANCELLED" in cancel
    assert "SEQUENCE:2" in cancel and "BEGIN:VALARM" not in cancel


# --- API flow ----------------------------------------------------------------


async def _shortlisted(db, n=1, company=None, admin=None, job=None):
    if company is None:
        admin, company = await make_recruiter_admin(db, email=f"admin{n}@test.dev")
        job = await make_active_job(
            db, company.id, title="Backend Engineer", must_haves=["Python", "SQL"]
        )
    user, resume = await make_candidate_with_resume(db, email=f"cand{n}@test.dev")
    application = await make_application(
        db, user.id, job.id, resume.id, ApplicationStage.shortlisted
    )
    application.shared_phone_value = "+977 9801234567"
    await db.flush()
    return admin, company, job, application


async def _invite(client, admin, application, notify=True):
    resp = await client.post(
        f"/applications/{application.id}/invite",
        json={"notify": notify},
        headers=auth_headers(admin.id),
    )
    assert resp.status_code == 200, resp.text
    url = resp.json()["data"]["scheduling_url"]
    return url.rsplit("/", 1)[1]


async def test_availability_defaults_and_update(client, db):
    admin, *_ = await _shortlisted(db)
    headers = auth_headers(admin.id)

    data = (await client.get("/me/availability", headers=headers)).json()["data"]
    assert data["timezone"] == "Asia/Kathmandu"
    assert data["weekly_hours"]["sun"] == [["10:00", "17:00"]]
    assert data["weekly_hours"]["sat"] == []
    assert data["interview_minutes"] == 45
    assert data["meeting_link"] == "auto"

    data["meeting_link"] = "https://meet.google.com/abc-defg-hij"
    data["weekly_hours"]["fri"] = [["10:00", "13:00"]]
    saved = await client.put("/me/availability", json=data, headers=headers)
    assert saved.status_code == 200
    again = (await client.get("/me/availability", headers=headers)).json()["data"]
    assert again["meeting_link"] == "https://meet.google.com/abc-defg-hij"
    assert again["weekly_hours"]["fri"] == [["10:00", "13:00"]]

    data["weekly_hours"]["mon"] = [["17:00", "10:00"]]
    assert (
        await client.put("/me/availability", json=data, headers=headers)
    ).status_code == 400
    data["weekly_hours"]["mon"] = []
    data["meeting_link"] = "javascript:alert(1)"
    assert (
        await client.put("/me/availability", json=data, headers=headers)
    ).status_code == 400
    # A mistyped Google Meet code is caught on save, not on interview day.
    data["meeting_link"] = "https://meet.google.com/demo-f1soft-int"
    assert (
        await client.put("/me/availability", json=data, headers=headers)
    ).status_code == 400


async def test_invite_requires_shortlisted(client, db):
    admin, company, job, _ = await _shortlisted(db)
    user, resume = await make_candidate_with_resume(db, email="new@test.dev")
    fresh = await make_application(db, user.id, job.id, resume.id)

    resp = await client.post(
        f"/applications/{fresh.id}/invite", headers=auth_headers(admin.id)
    )
    assert resp.status_code == 409


async def test_book_reschedule_cancel_flow(client, db, outbox):
    admin, company, job, application = await _shortlisted(db)
    await grant_job_pass(db, company.id, job.id, PassKind.job_pass)  # SMS feature
    provider = sms.get_sms_provider()
    sms_before = len(provider.sent)

    token = await _invite(client, admin, application)
    assert outbox[-1]["to"] == "cand1@test.dev" and outbox[-1]["ics"] is None
    assert provider.sent[-1][0] == "9801234567"  # shortlisted SMS with the link
    assert token in provider.sent[-1][1]

    page = (await client.get(f"/public/schedule/{token}")).json()["data"]
    assert page["job_title"] == "Backend Engineer"
    assert page["interview"] is None
    slots = page["slots"]
    assert slots

    booked = await client.post(
        f"/public/schedule/{token}/book", json={"start": slots[0]["start"]}
    )
    assert booked.status_code == 200, booked.text
    link = booked.json()["data"]["meeting_link"]
    assert link.startswith("https://meet.jit.si/rojgarai-")
    await db.refresh(application)
    assert application.stage == ApplicationStage.interview
    invites = [m for m in outbox if m["method"] == "REQUEST"]
    assert {m["to"] for m in invites} == {"cand1@test.dev", "admin1@test.dev"}
    assert "SEQUENCE:0" in invites[0]["ics"]

    again = await client.post(
        f"/public/schedule/{token}/book", json={"start": slots[1]["start"]}
    )
    assert again.status_code == 409

    page = (await client.get(f"/public/schedule/{token}")).json()["data"]
    assert page["interview"]["start"] == booked.json()["data"]["start"]
    assert slots[0]["start"] not in [s["start"] for s in page["slots"]]

    moved = await client.post(
        f"/public/schedule/{token}/reschedule", json={"start": slots[2]["start"]}
    )
    assert moved.status_code == 200
    assert moved.json()["data"]["meeting_link"] == link  # same room
    update_ics = outbox[-1]["ics"]
    assert "SEQUENCE:1" in update_ics and "METHOD:REQUEST" in update_ics

    cancelled = await client.post(f"/public/schedule/{token}/cancel")
    assert cancelled.status_code == 200
    assert cancelled.json()["data"]["status"] == "cancelled"
    assert outbox[-1]["method"] == "CANCEL" and "SEQUENCE:2" in outbox[-1]["ics"]
    await db.refresh(application)
    assert application.stage == ApplicationStage.shortlisted
    assert len(provider.sent) - sms_before == 4  # invite, booked, moved, cancelled

    rebook = await client.post(
        f"/public/schedule/{token}/book", json={"start": slots[3]["start"]}
    )
    assert rebook.status_code == 200


async def test_phone_only_applicant_can_book(client, db, outbox):
    admin, _, _, application = await _shortlisted(db)
    application.shared_email_value = None
    from app.modules.auth.models import User

    (await db.get(User, application.user_id)).email = None
    await db.flush()
    token = await _invite(client, admin, application, notify=False)
    slots = (await client.get(f"/public/schedule/{token}")).json()["data"]["slots"]
    booked = await client.post(
        f"/public/schedule/{token}/book", json={"start": slots[0]["start"]}
    )
    assert booked.status_code == 200, booked.text
    interview = await db.scalar(
        select(Interview).where(Interview.application_id == application.id)
    )
    assert interview.candidate_email is None
    assert {m["to"] for m in outbox} == {"admin1@test.dev"}


async def test_rejected_candidate_link_is_closed(client, db):
    admin, _, _, application = await _shortlisted(db)
    token = await _invite(client, admin, application, notify=False)
    application.stage = ApplicationStage.rejected
    await db.flush()

    assert (await client.get(f"/public/schedule/{token}")).status_code == 410
    assert (await client.get("/public/schedule/" + "A" * 35)).status_code == 404


async def test_slot_not_offered_is_refused(client, db):
    admin, _, _, application = await _shortlisted(db)
    token = await _invite(client, admin, application, notify=False)
    saturday = datetime(2030, 1, 5, 10, 0, tzinfo=KTM)
    resp = await client.post(
        f"/public/schedule/{token}/book", json={"start": saturday.isoformat()}
    )
    assert resp.status_code == 409


async def test_two_candidates_racing_for_one_slot(committed, outbox):
    async with committed() as s:
        admin, company, job, first = await _shortlisted(s, 1)
        *_, second = await _shortlisted(s, 2, company, admin, job)
        await s.commit()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        tokens = [await _invite(c, admin, a, notify=False) for a in (first, second)]
        slot = (await c.get(f"/public/schedule/{tokens[0]}")).json()["data"]["slots"][0]
        results = await asyncio.gather(
            *[
                c.post(f"/public/schedule/{t}/book", json={"start": slot["start"]})
                for t in tokens
            ]
        )
        codes = sorted(r.status_code for r in results)
        assert codes == [200, 409]

        # The same candidate double-clicking two different times also books once.
        *_, third = await _shortlisted_committed(committed, company, admin, job)
        token = await _invite(c, admin, third, notify=False)
        open_ = (await c.get(f"/public/schedule/{token}")).json()["data"]["slots"]
        results = await asyncio.gather(
            *[
                c.post(f"/public/schedule/{token}/book", json={"start": s_["start"]})
                for s_ in open_[:2]
            ]
        )
        assert sorted(r.status_code for r in results) == [200, 409]

    async with committed() as s:
        booked = await s.scalars(
            select(Interview).where(Interview.company_id == company.id)
        )
        assert len(list(booked)) == 2


async def _shortlisted_committed(committed, company, admin, job):
    async with committed() as s:
        result = await _shortlisted(s, 3, company, admin, job)
        await s.commit()
    return result


async def _booked(client, db, outbox):
    admin, company, job, application = await _shortlisted(db)
    token = await _invite(client, admin, application, notify=False)
    slot = (await client.get(f"/public/schedule/{token}")).json()["data"]["slots"][0]
    resp = await client.post(
        f"/public/schedule/{token}/book", json={"start": slot["start"]}
    )
    interview = await db.get(Interview, resp.json()["data"]["id"])
    return admin, job, application, interview


async def test_reminders_sent_once(client, db, outbox):
    _, _, _, interview = await _booked(client, db, outbox)
    start = interview.start_time
    old = start - timedelta(days=3)
    await db.execute(
        update(Interview).where(Interview.id == interview.id).values(updated_at=old)
    )
    outbox.clear()

    day_before = start - timedelta(hours=23)
    assert await send_due_reminders(db, day_before) == 1
    assert await send_due_reminders(db, day_before) == 0
    assert {m["to"] for m in outbox} == {"cand1@test.dev", "admin1@test.dev"}
    assert outbox[0]["subject"].startswith("Reminder")

    hour_before = start - timedelta(minutes=50)
    assert await send_due_reminders(db, hour_before) == 1
    assert await send_due_reminders(db, hour_before + timedelta(minutes=5)) == 0
    assert await send_due_reminders(db, start + timedelta(minutes=1)) == 0


async def test_parallel_reminder_sweeps_send_once(committed, outbox):
    async with committed() as s:
        admin, company, job, application = await _shortlisted(s)
        start = datetime.now(UTC) + timedelta(minutes=30)
        s.add(
            Interview(
                application_id=application.id,
                company_id=company.id,
                interviewer_user_id=admin.id,
                candidate_name="Cand",
                candidate_email="cand1@test.dev",
                start_time=start,
                end_time=start + timedelta(minutes=45),
                location="https://meet.jit.si/rojgarai-x",
                title="Interview",
                ics_uid="interview-race@rojgarai",
            )
        )
        from app.modules.interviews.models import InterviewInvite

        s.add(
            InterviewInvite(application_id=application.id, interviewer_user_id=admin.id)
        )
        await s.commit()

    async def sweep():
        async with committed() as s:
            return await send_due_reminders(s)

    results = await asyncio.gather(*[sweep() for _ in range(4)])
    assert sum(results) == 1


async def test_scorecard_and_agenda(client, db, outbox):
    admin, job, application, interview = await _booked(client, db, outbox)
    headers = auth_headers(admin.id)
    card = {
        "ratings": [
            {"criterion": "Python", "rating": 4},
            {"criterion": "SQL", "rating": 2},
        ],
        "recommendation": "yes",
        "notes": "Clear on data modelling.",
    }

    early = await client.post(
        f"/interviews/{interview.id}/scorecard", json=card, headers=headers
    )
    assert early.status_code == 409

    start = interview.start_time
    agenda = await client.get(
        "/interviews",
        params={"range": "week", "start": start.astimezone(KTM).date().isoformat()},
        headers=headers,
    )
    item = agenda.json()["data"][0]
    assert item["candidate_name"] and item["job_title"] == "Backend Engineer"
    assert item["meeting_link"].startswith("https://meet.jit.si/")
    assert item["scorecard"] == "not_due"

    past = datetime.now(UTC) - timedelta(hours=2)
    interview.start_time, interview.end_time = past, past + timedelta(minutes=45)
    await db.flush()
    agenda = await client.get(
        "/interviews",
        params={"range": "day", "start": past.astimezone(KTM).date().isoformat()},
        headers=headers,
    )
    assert agenda.json()["data"][0]["scorecard"] == "needed"

    form = (
        await client.get(f"/interviews/{interview.id}/scorecard", headers=headers)
    ).json()
    assert form["data"]["criteria"] == ["Python", "SQL"]

    bad = dict(card, ratings=[{"criterion": "Golf", "rating": 3}])
    assert (
        await client.post(
            f"/interviews/{interview.id}/scorecard", json=bad, headers=headers
        )
    ).status_code == 400
    out_of_range = dict(card, ratings=[{"criterion": "Python", "rating": 5}])
    assert (
        await client.post(
            f"/interviews/{interview.id}/scorecard", json=out_of_range, headers=headers
        )
    ).status_code == 400

    saved = await client.post(
        f"/interviews/{interview.id}/scorecard", json=card, headers=headers
    )
    assert saved.status_code == 200, saved.text
    assert saved.json()["data"]["recommendation"] == "yes"
    edited = await client.post(
        f"/interviews/{interview.id}/scorecard",
        json=dict(card, recommendation="strong_yes"),
        headers=headers,
    )
    assert edited.json()["data"]["recommendation"] == "strong_yes"
    form = (
        await client.get(f"/interviews/{interview.id}/scorecard", headers=headers)
    ).json()
    assert len(form["data"]["scorecards"]) == 1

    # The interview is on the timeline; the stage stays for a person to decide.
    await db.refresh(application)
    assert application.stage == ApplicationStage.interview
    done = await db.scalar(
        select(ApplicationEvent).where(
            ApplicationEvent.application_id == application.id,
            ApplicationEvent.type == "interview_done",
        )
    )
    assert done is not None
    agenda = await client.get(
        "/interviews",
        params={"range": "day", "start": past.astimezone(KTM).date().isoformat()},
        headers=headers,
    )
    assert agenda.json()["data"][0]["scorecard"] == "done"


async def test_agenda_is_company_scoped(client, db, outbox):
    await _booked(client, db, outbox)
    other, _ = await make_recruiter_admin(
        db, email="other@test.dev", company_name="Other"
    )
    resp = await client.get(
        "/interviews",
        params={"range": "month", "start": date.today().isoformat()},
        headers=auth_headers(other.id),
    )
    assert resp.json()["data"] == []
