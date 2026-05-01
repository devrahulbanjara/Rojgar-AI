import uuid
from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile

from app.core.dependencies import ActiveMember, DbSession
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.infrastructures.storage.service import storage_service
from app.modules.interviews import recording_service
from app.modules.interviews.recording_model import InterviewRecording
from app.modules.interviews.evaluation_schemas import BatchTranscribeCandidateResponse
from app.modules.interviews.recording_schemas import (
    BatchTranscribeRequest,
    InterviewRecordingResponse,
)

router = APIRouter(prefix="/interview-recordings", tags=["Interview Recordings"])


async def _to_response(recording: InterviewRecording) -> InterviewRecordingResponse:
    """Serialize a recording and attach a temporary download URL."""
    data = InterviewRecordingResponse.model_validate(recording)
    presigned = await storage_service.generate_presigned_url(
        recording.s3_audio_key, 3600
    )
    data.s3_audio_url = presigned
    return data


@router.post(
    "/applications/{application_id}/recordings",
    summary="Upload a recorded interview audio for an application",
)
async def upload_recording(
    application_id: uuid.UUID,
    file: UploadFile = File(),
    duration_seconds: Annotated[int | None, Form()] = None,
    user: ActiveMember = None,
    db: DbSession = None,
) -> UnifiedResponse[InterviewRecordingResponse]:
    """Upload an interview recording for an application."""
    recording = await recording_service.upload_recording(
        db, user.id, application_id, file, duration_seconds
    )
    data = await _to_response(recording)
    return ResponseBuilder.success(data=data, message="Recording uploaded.")


@router.get(
    "/applications/{application_id}/recordings",
    summary="List all recordings for an application",
)
async def list_recordings(
    application_id: uuid.UUID,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[list[InterviewRecordingResponse]]:
    """List interview recordings for an application."""
    recordings = await recording_service.get_recordings_for_application(
        db, user.id, application_id
    )
    data = [await _to_response(r) for r in recordings]
    return ResponseBuilder.success(data=data, message="Recordings fetched.")


@router.post(
    "/recordings/{recording_id}/transcribe",
    summary="Trigger Whisper transcription for a recording",
)
async def transcribe_recording(
    recording_id: uuid.UUID,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[InterviewRecordingResponse]:
    """Transcribe one interview recording."""
    recording = await recording_service.transcribe_recording(db, user.id, recording_id)
    data = await _to_response(recording)
    return ResponseBuilder.success(data=data, message="Transcription complete.")


@router.post(
    "/recordings/{recording_id}/evaluate",
    summary="Run AI evaluation on a transcribed recording",
)
async def evaluate_recording(
    recording_id: uuid.UUID,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[InterviewRecordingResponse]:
    """Run AI evaluation for one transcribed recording."""
    recording = await recording_service.evaluate_recording(db, user.id, recording_id)
    data = await _to_response(recording)
    return ResponseBuilder.success(data=data, message="Evaluation complete.")


@router.post(
    "/jobs/{job_id}/recordings/batch-transcribe",
    summary="Batch transcribe recordings for selected applications under a job",
)
async def batch_transcribe(
    job_id: uuid.UUID,
    payload: BatchTranscribeRequest,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[list[InterviewRecordingResponse]]:
    """Batch-transcribe recordings for selected job applications."""
    recordings = await recording_service.batch_transcribe_for_job(
        db, user.id, job_id, payload.application_ids
    )
    data = [await _to_response(r) for r in recordings]
    return ResponseBuilder.success(data=data, message="Batch transcription complete.")


@router.get(
    "/jobs/{job_id}/recordings/batch-candidates",
    summary="List candidates and latest recording info for batch transcription under a job",
)
async def list_batch_candidates(
    job_id: uuid.UUID,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[list[BatchTranscribeCandidateResponse]]:
    """List job candidates eligible for batch transcription."""
    data = await recording_service.list_batch_transcribe_candidates(db, user.id, job_id)
    return ResponseBuilder.success(
        data=data, message="Batch transcription candidates fetched."
    )


@router.delete(
    "/recordings/{recording_id}",
    summary="Delete a recording and its S3 file",
)
async def delete_recording(
    recording_id: uuid.UUID,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[None]:
    """Delete a recording and its stored media."""
    await recording_service.delete_recording(db, user.id, recording_id)
    return ResponseBuilder.success(data=None, message="Recording deleted.")
