from __future__ import annotations

import uuid

from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.infrastructures.ai.service import ai_service
from app.infrastructures.storage.service import storage_service
from app.infrastructures.whisper.service import whisper_service
from app.modules.applications.models import Application
from app.modules.auth.enums import MembershipStatus
from app.modules.companies.models import CompanyMembership
from app.modules.jobs.models import Job
from app.modules.interviews.evaluation_schemas import BatchTranscribeCandidateResponse
from app.modules.interviews.recording_model import InterviewRecording
from app.shared.enums import RecordingStatus


async def _assert_recruiter_owns_application(
    db: AsyncSession, recruiter_user_id: uuid.UUID, application_id: uuid.UUID
) -> Application:
    """Verify the application exists and belongs to the recruiter's company."""
    result = await db.execute(
        select(Application)
        .join(Job, Job.id == Application.job_id)
        .join(
            CompanyMembership,
            CompanyMembership.company_id == Job.company_id,
        )
        .where(
            Application.id == application_id,
            CompanyMembership.user_id == recruiter_user_id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    return application


async def _get_active_company_membership(
    db: AsyncSession, recruiter_user_id: uuid.UUID
) -> CompanyMembership:
    membership = await db.execute(
        select(CompanyMembership).where(
            CompanyMembership.user_id == recruiter_user_id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    membership = membership.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized.")
    return membership


async def list_batch_transcribe_candidates(
    db: AsyncSession,
    recruiter_user_id: uuid.UUID,
    job_id: uuid.UUID,
) -> list[BatchTranscribeCandidateResponse]:
    membership = await _get_active_company_membership(db, recruiter_user_id)

    job = await db.scalar(
        select(Job).where(Job.id == job_id, Job.company_id == membership.company_id)
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    rows = (
        await db.execute(
            select(Application)
            .where(Application.job_id == job_id)
            .order_by(Application.updated_at.desc(), Application.created_at.desc())
        )
    ).scalars()

    items: list[BatchTranscribeCandidateResponse] = []
    for application in rows:
        recording = await db.scalar(
            select(InterviewRecording)
            .where(InterviewRecording.application_id == application.id)
            .order_by(InterviewRecording.created_at.desc())
            .limit(1)
        )
        items.append(
            BatchTranscribeCandidateResponse(
                application_id=application.id,
                job_id=job_id,
                candidate_name=application.shared_full_name
                or application.user.full_name,
                candidate_email=application.shared_email_value
                or application.user.email,
                latest_recording_id=recording.id if recording else None,
                latest_recording_duration_seconds=recording.duration_seconds
                if recording
                else None,
                latest_recording_status=recording.status.value if recording else None,
                transcript_available=bool(recording and recording.transcript),
                can_batch_transcribe=bool(
                    recording
                    and recording.status
                    in {RecordingStatus.uploaded, RecordingStatus.failed}
                ),
            )
        )

    return items


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
        audio_bytes = await _download_from_s3(recording.s3_audio_key)
        filename = recording.s3_audio_key.rsplit("/", 1)[-1]
        transcript = await whisper_service.transcribe_from_bytes(audio_bytes, filename)
        recording.transcript = transcript
        recording.status = RecordingStatus.transcribed
    except Exception as exc:
        logger.exception("Transcription failed for recording %s: %s", recording_id, exc)
        recording.status = RecordingStatus.failed
        await db.commit()
        raise HTTPException(
            status_code=500, detail="Transcription failed. Please retry."
        )

    await db.commit()
    await db.refresh(recording)
    return recording


async def _download_from_s3(s3_key: str) -> bytes:
    import asyncio
    import boto3
    from app.core.config import settings

    def _fetch():
        s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region,
        )
        response = s3.get_object(Bucket=settings.s3_bucket_name, Key=s3_key)
        return response["Body"].read()

    return await asyncio.to_thread(_fetch)


async def batch_transcribe_for_job(
    db: AsyncSession,
    recruiter_user_id: uuid.UUID,
    job_id: uuid.UUID,
    application_ids: list[uuid.UUID],
) -> list[InterviewRecording]:
    """
    Transcribes the latest uploaded/failed recording for each selected application,
    one by one in order. Skips applications with no recording or already transcribed.
    """
    membership = await _get_active_company_membership(db, recruiter_user_id)
    job = await db.scalar(
        select(Job).where(Job.id == job_id, Job.company_id == membership.company_id)
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    results = []
    valid_application_ids = {
        application_id
        for application_id in (
            await db.execute(select(Application.id).where(Application.job_id == job_id))
        ).scalars()
    }

    for application_id in application_ids:
        if application_id not in valid_application_ids:
            logger.warning(
                "Application %s does not belong to job %s, skipping batch transcription.",
                application_id,
                job_id,
            )
            continue

        # Get the latest recording for this application that needs transcription
        result = await db.execute(
            select(InterviewRecording)
            .where(
                InterviewRecording.application_id == application_id,
                InterviewRecording.status.in_(
                    [RecordingStatus.uploaded, RecordingStatus.failed]
                ),
            )
            .order_by(InterviewRecording.created_at.desc())
            .limit(1)
        )
        recording = result.scalar_one_or_none()

        if not recording:
            logger.info(
                "No pending recording for application %s, skipping.", application_id
            )
            continue

        recording.status = RecordingStatus.transcribing
        await db.commit()

        try:
            audio_bytes = await _download_from_s3(recording.s3_audio_key)
            filename = recording.s3_audio_key.rsplit("/", 1)[-1]
            transcript = await whisper_service.transcribe_from_bytes(
                audio_bytes, filename
            )
            recording.transcript = transcript
            recording.status = RecordingStatus.transcribed
            logger.info("Batch: transcribed application %s", application_id)
        except Exception as exc:
            logger.exception(
                "Batch: transcription failed for application %s: %s",
                application_id,
                exc,
            )
            recording.status = RecordingStatus.failed

        await db.commit()
        await db.refresh(recording)
        results.append(recording)

    return results


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
        raise HTTPException(status_code=500, detail="Evaluation failed. Please retry.")

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
