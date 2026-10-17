import re
from datetime import datetime
from typing import Literal
from uuid import UUID
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import AwareDatetime, Field, field_validator

from app.core.schemas import BaseSchema
from app.modules.interviews.scheduling import WEEKDAYS

_HHMM = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")

Recommendation = Literal["strong_yes", "yes", "no", "strong_no"]
ScorecardState = Literal["not_due", "needed", "done"]


class Availability(BaseSchema):
    timezone: str = "Asia/Kathmandu"
    # {"sun": [["10:00", "17:00"]], ..., "sat": []}; missing days = not working.
    weekly_hours: dict[str, list[list[str]]]
    interview_minutes: int = Field(45, ge=15, le=180)
    buffer_minutes: int = Field(15, ge=0, le=120)
    # "auto" = a new Jitsi room per interview; otherwise your Meet/Zoom URL.
    meeting_link: str = Field("auto", max_length=500)

    @field_validator("timezone")
    @classmethod
    def _tz(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError) as exc:
            raise ValueError("Unknown time zone.") from exc
        return value

    @field_validator("weekly_hours")
    @classmethod
    def _hours(cls, value: dict[str, list[list[str]]]):
        cleaned: dict[str, list[list[str]]] = {}
        for day in WEEKDAYS:
            windows = sorted(value.get(day, []))
            if len(windows) > 3:
                raise ValueError("At most 3 time ranges per day.")
            previous_end = "00:00"
            for window in windows:
                if len(window) != 2:
                    raise ValueError(f"Give each range on {day} as [start, end].")
                start, end = window
                if not (_HHMM.match(start) and _HHMM.match(end)) or start >= end:
                    raise ValueError(
                        f"Check the hours for {day}: use HH:MM, start before end."
                    )
                if start < previous_end:
                    raise ValueError(f"Time ranges overlap on {day}.")
                previous_end = end
            cleaned[day] = [list(w) for w in windows]
        if set(value) - set(WEEKDAYS):
            raise ValueError("Days are sun, mon, tue, wed, thu, fri, sat.")
        return cleaned

    @field_validator("meeting_link")
    @classmethod
    def _link(cls, value: str) -> str:
        value = value.strip()
        if value != "auto" and not value.startswith("https://"):
            raise ValueError('Use "auto" or a meeting link starting with https://')
        return value


class InviteRequest(BaseSchema):
    # Email (and SMS where the plan includes it) the link to the candidate.
    notify: bool = True


class InviteResponse(BaseSchema):
    scheduling_url: str


class SlotView(BaseSchema):
    start: datetime
    end: datetime


class BookedInterview(BaseSchema):
    id: UUID
    start: datetime
    end: datetime
    meeting_link: str
    status: str


class PublicSchedule(BaseSchema):
    company_name: str
    job_title: str
    candidate_name: str
    interviewer_name: str
    timezone: str
    interview_minutes: int
    # The current booking, if any; reschedule or cancel it with the same link.
    interview: BookedInterview | None
    slots: list[SlotView]


class BookRequest(BaseSchema):
    start: AwareDatetime


class AgendaItem(BaseSchema):
    id: UUID
    application_id: UUID
    job_id: UUID
    job_title: str
    candidate_name: str
    candidate_email: str | None = None
    interviewer_name: str | None
    start: datetime
    end: datetime
    timezone: str
    meeting_link: str
    status: str
    scorecard: ScorecardState


class Rating(BaseSchema):
    criterion: str = Field(min_length=1, max_length=300)
    rating: int = Field(ge=1, le=4)


class ScorecardRequest(BaseSchema):
    ratings: list[Rating] = Field(default_factory=list, max_length=12)
    recommendation: Recommendation
    notes: str | None = Field(None, max_length=5000)


class ScorecardView(BaseSchema):
    id: UUID
    interview_id: UUID
    author_user_id: UUID | None
    author_name: str | None
    ratings: list[Rating]
    recommendation: Recommendation
    notes: str | None
    updated_at: datetime


class ScorecardForm(BaseSchema):
    interview_id: UUID
    # The job's must-haves, rated 1 (not shown) to 4 (strong).
    criteria: list[str]
    scorecards: list[ScorecardView]
