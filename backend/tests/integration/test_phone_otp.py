"""Sign in or sign up with a phone number and an SMS code."""

import re
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.core.config import settings
from app.modules.auth.models import PhoneOtp, User
from app.infrastructures.sms.service import get_sms_provider

PHONE = "9812345678"
E164 = "+9779812345678"


def _last_code() -> str:
    to, text = get_sms_provider().sent[-1]
    assert to == PHONE
    return re.match(r"(\d{6}) ", text).group(1)


async def _request(client, phone=PHONE):
    return await client.post("/auth/otp/request", json={"phone": phone})


async def _verify(client, code, phone=PHONE):
    return await client.post("/auth/otp/verify", json={"phone": phone, "code": code})


async def test_new_phone_signs_up_and_gets_a_session(client, db):
    assert (await _request(client)).status_code == 200
    code = _last_code()

    stored = await db.scalar(select(PhoneOtp).where(PhoneOtp.phone == E164))
    assert code not in stored.code_hash

    resp = await _verify(client, code)
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    assert data["is_new"] is True
    assert data["user"]["phone"] == E164 and data["user"]["memberships"] == []
    assert data["tokens"]["access_token"]
    assert "refresh_token=" in resp.headers["set-cookie"]

    # The same code works only once; a second sign-in is not new.
    assert (await _verify(client, code)).status_code == 400
    await _request(client, phone="+977 981-234-5678")
    again = await _verify(client, _last_code())
    assert again.json()["data"]["is_new"] is False
    assert await db.scalar(select(User).where(User.phone == E164))


async def test_wrong_code_counts_down_and_locks_after_five(client, db):
    await _request(client)
    code = _last_code()
    wrong = "000000" if code != "000000" else "111111"
    first = await _verify(client, wrong)
    assert first.status_code == 400
    assert first.json()["message"] == "That code is not right. 4 tries left."
    for _ in range(4):
        await _verify(client, wrong)
    locked = await _verify(client, code)
    assert locked.status_code == 400
    assert locked.json()["message"] == "Too many wrong tries. Ask for a new code."


async def test_code_expires_after_five_minutes(client, db):
    await _request(client)
    code = _last_code()
    otp = await db.scalar(select(PhoneOtp).where(PhoneOtp.phone == E164))
    otp.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    await db.flush()
    resp = await _verify(client, code)
    assert resp.status_code == 400
    assert "expired" in resp.json()["message"]


async def test_new_code_replaces_old_one(client, db):
    await _request(client)
    old = _last_code()
    await _request(client)
    new = _last_code()
    if old != new:
        assert (await _verify(client, old)).status_code == 400
    assert (await _verify(client, new)).status_code == 200


async def test_only_nepali_mobiles(client):
    for bad in ("014412345", "12345", "+15555550123"):
        assert (await _request(client, phone=bad)).status_code == 400


async def test_rate_limited_per_phone_and_ip(client, monkeypatch):
    monkeypatch.setattr(settings, "rate_limit_enabled", True)
    statuses = [(await _request(client)).status_code for _ in range(4)]
    assert statuses == [200, 200, 200, 429]
    # Another phone from the same address still works until the IP cap.
    other = [
        (await _request(client, phone=f"98000000{i:02d}")).status_code for i in range(7)
    ]
    assert other[:6] == [200] * 6 and other[6] == 429
