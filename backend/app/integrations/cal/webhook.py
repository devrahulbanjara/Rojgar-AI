import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.core.logging_config import logger

app = FastAPI()


class CalWebhook(BaseModel):
    trigger_event: str = Field(alias="triggerEvent")
    created_at: str = Field(alias="createdAt")
    type: str
    title: str
    start_time: str = Field(alias="startTime")
    end_time: str = Field(alias="endTime")
    location: str | None = None
    uid: str
    organizer_name: str = Field(alias="organizer.name")
    organizer_email: str = Field(alias="organizer.email")
    organizer_timezone: str = Field(alias="organizer.timezone")
    attendee_name: str = Field(alias="attendees.0.name")
    attendee_email: str = Field(alias="attendees.0.email")
    attendee_timezone: str = Field(alias="attendees.0.timeZone")

    model_config = ConfigDict(populate_by_name=True, extra="ignore")


@app.get("/test")
async def test():
    return {"status": "online"}


@app.post("/webhook/cal/interview-booking")
async def cal_webhook_handler(data: CalWebhook):
    try:
        if data.trigger_event == "BOOKING_CREATED":
            print(
                f"New Booking: {data.attendee_name} ({data.attendee_email}) | "
                f"{data.start_time} to {data.end_time}"
            )
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error") from e


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
