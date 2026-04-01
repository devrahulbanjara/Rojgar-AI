from __future__ import annotations

import json
import uuid

from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructures.ai.service import ai_service
from app.infrastructures.storage.service import storage_service
from app.infrastructures.whisper.service import whisper_service
from app.modules.applications.models import Application
from app.modules.auth.enums import MembershipStatus
from app.modules.companies.models import CompanyMembership
from app.modules.interviews.recording_model import InterviewRecording
from app.shared.enums import RecordingStatus


async def _assert_recruiter_owns_application(
    db: AsyncSession, recruiter_user_id: uuid.UUID, application_id: uuid.UUID
) -> Application:
    """Verify the application exists and belongs to the recruiter's company."""
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    membership = await db.execute(
        select(CompanyMembership).where(
            CompanyMembership.user_id == recruiter_user_id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    membership = membership.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized.")

    return application


async def upload_recording(
    db: AsyncSession,
    recruiter_user_id: uuid.UUID,
    application_id: uuid.UUID,
    file: UploadFile,
    duration_seconds: int | None,
) -> InterviewRecording:
    await _assert_recruiter_owns_application(db, recruiter_user_id, application_id)

    s3_url, s3_key = await storage_service.upload_audio(
        file, folder=f"interview-recordings/{application_id}"
    )

    recording = InterviewRecording(
        application_id=application_id,
        s3_audio_url=s3_url,
        s3_audio_key=s3_key,
        status=RecordingStatus.uploaded,
        duration_seconds=duration_seconds,
    )
    db.add(recording)
    await db.commit()
    await db.refresh(recording)
    return recording


async def get_recordings_for_application(
    db: AsyncSession,
    recruiter_user_id: uuid.UUID,
    application_id: uuid.UUID,
) -> list[InterviewRecording]:
    await _assert_recruiter_owns_application(db, recruiter_user_id, application_id)
    result = await db.execute(
        select(InterviewRecording)
        .where(InterviewRecording.application_id == application_id)
        .order_by(InterviewRecording.created_at.desc())
    )
    return list(result.scalars().all())


async def transcribe_recording(
    db: AsyncSession,
    recruiter_user_id: uuid.UUID,
    recording_id: uuid.UUID,
) -> InterviewRecording:
    result = await db.execute(
        select(InterviewRecording).where(InterviewRecording.id == recording_id)
    )
    recording = result.scalar_one_or_none()
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found.")

    await _assert_recruiter_owns_application(
        db, recruiter_user_id, recording.application_id
    )

    if recording.status not in (RecordingStatus.uploaded, RecordingStatus.failed):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transcribe recording in status: {recording.status}",
        )

    recording.status = RecordingStatus.transcribing
    await db.commit()

    try:
        transcript = await whisper_service.transcribe_from_s3(recording.s3_audio_key)
        recording.transcript = transcript
        recording.status = RecordingStatus.transcribed
    except Exception:
        recording.status = RecordingStatus.failed
        await db.commit()
        raise HTTPException(
            status_code=500, detail="Transcription failed. Please retry."
        )

    await db.commit()
    await db.refresh(recording)
    return recording


async def evaluate_recording(
    db: AsyncSession,
    recruiter_user_id: uuid.UUID,
    recording_id: uuid.UUID,
) -> InterviewRecording:
    result = await db.execute(
        select(InterviewRecording).where(InterviewRecording.id == recording_id)
    )
    recording = result.scalar_one_or_none()
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found.")

    await _assert_recruiter_owns_application(
        db, recruiter_user_id, recording.application_id
    )

    if not recording.transcript:
        raise HTTPException(
            status_code=400, detail="Transcript must exist before evaluation."
        )

    recording.status = RecordingStatus.evaluating
    await db.commit()

    try:
        system_prompt = (
            "You are an expert technical interviewer evaluator.\n"
            "Based on the following interview transcript, provide:\n"
            "1. Overall assessment (2-3 sentences)\n"
            "2. Key strengths demonstrated\n"
            "3. Concerns or gaps\n"
            "4. Hiring recommendation: Strong Yes / Yes / Maybe / No\n\n"
            "Return your analysis as plain text with clear section headers."
        )
        user_payload = {"transcript": recording.transcript}

        # Collect the full streamed evaluation text
        chunks: list[str] = []
        async for chunk in ai_service.stream_text(
            system_prompt=system_prompt,
            user_payload=user_payload,
            temperature=0.3,
        ):
            chunks.append(chunk)

        evaluation = "".join(chunks)
        recording.evaluation = evaluation
        recording.status = RecordingStatus.evaluated
    except Exception:
        recording.status = RecordingStatus.transcribed
        await db.commit()
        raise HTTPException(
            status_code=500, detail="Evaluation failed. Please retry."
        )

    await db.commit()
    await db.refresh(recording)
    return recording


async def delete_recording(
    db: AsyncSession,
    recruiter_user_id: uuid.UUID,
    recording_id: uuid.UUID,
) -> None:
    result = await db.execute(
        select(InterviewRecording).where(InterviewRecording.id == recording_id)
    )
    recording = result.scalar_one_or_none()
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found.")

    await _assert_recruiter_owns_application(
        db, recruiter_user_id, recording.application_id
    )

    await storage_service.delete_image(recording.s3_audio_url)
    await db.delete(recording)
    await db.commit()
