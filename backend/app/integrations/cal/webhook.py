import uvicorn
from fastapi import FastAPI, HTTPException, Request, status

from app.core.logging_config import logger

app = FastAPI()


@app.post("/webhook/cal")
async def cal_webhook_handler(request: Request):
    try:
        payload = await request.json()
        trigger_event = payload.get("triggerEvent")
        if trigger_event == "BOOKING_CREATED":
            booking = payload.get("payload", {})
            title = booking.get("title")
            start_time = booking.get("startTime")
            end_time = booking.get("endTime")
            attendees = booking.get("attendees", [])
            attendee_email = attendees[0].get("email") if attendees else None
            attendee_name = attendees[0].get("name") if attendees else None
            logger.info(
                f"\n--- Booking Summary ---\nTitle           : {title}\nStart Time      : {start_time}\nEnd Time        : {end_time}\nAttendee Name   : {attendee_name}\nAttendee Email  : {attendee_email}\n------------------------"
            )
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Webhook processing failed"
        )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
