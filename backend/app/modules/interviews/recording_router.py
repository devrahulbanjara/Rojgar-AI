import uuid
from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.infrastructures.storage.service import storage_service
from app.modules.auth.dependencies import require_active_membership
from app.modules.auth.models import User
from app.modules.interviews import recording_service
from app.modules.interviews.recording_model import InterviewRecording
from app.modules.interviews.evaluation_schemas import BatchTranscribeCandidateResponse
from app.modules.interviews.recording_schemas import (
    BatchTranscribeRequest,
    InterviewRecordingResponse,
)

router = APIRouter()


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
    response_model=UnifiedResponse[InterviewRecordingResponse],
    summary="Upload a recorded interview audio for an application",
)
async def upload_recording(
    application_id: uuid.UUID,
    file: UploadFile = File(...),
    duration_seconds: int | None = Form(default=None),
    user: User = Depends(require_active_membership),
    db: AsyncSession = Depends(get_db),
):
    """Upload an interview recording for an application."""
    recording = await recording_service.upload_recording(
        db, user.id, application_id, file, duration_seconds
    )
    data = await _to_response(recording)
    return ResponseBuilder.success(data=data, message="Recording uploaded.")


@router.get(
    "/applications/{application_id}/recordings",
    response_model=UnifiedResponse[list[InterviewRecordingResponse]],
    summary="List all recordings for an application",
)
async def list_recordings(
    application_id: uuid.UUID,
    user: User = Depends(require_active_membership),
    db: AsyncSession = Depends(get_db),
):
    """List interview recordings for an application."""
    recordings = await recording_service.get_recordings_for_application(
        db, user.id, application_id
    )
    data = [await _to_response(r) for r in recordings]
    return ResponseBuilder.success(data=data, message="Recordings fetched.")


@router.post(
    "/recordings/{recording_id}/transcribe",
    response_model=UnifiedResponse[InterviewRecordingResponse],
    summary="Trigger Whisper transcription for a recording",
)
async def transcribe_recording(
    recording_id: uuid.UUID,
    user: User = Depends(require_active_membership),
    db: AsyncSession = Depends(get_db),
):
    """Transcribe one interview recording."""
    recording = await recording_service.transcribe_recording(db, user.id, recording_id)
    data = await _to_response(recording)
    return ResponseBuilder.success(data=data, message="Transcription complete.")


@router.post(
    "/recordings/{recording_id}/evaluate",
    response_model=UnifiedResponse[InterviewRecordingResponse],
    summary="Run AI evaluation on a transcribed recording",
)
async def evaluate_recording(
    recording_id: uuid.UUID,
    user: User = Depends(require_active_membership),
    db: AsyncSession = Depends(get_db),
):
    """Run AI evaluation for one transcribed recording."""
    recording = await recording_service.evaluate_recording(db, user.id, recording_id)
    data = await _to_response(recording)
    return ResponseBuilder.success(data=data, message="Evaluation complete.")


@router.post(
    "/jobs/{job_id}/recordings/batch-transcribe",
    response_model=UnifiedResponse[list[InterviewRecordingResponse]],
    summary="Batch transcribe recordings for selected applications under a job",
)
async def batch_transcribe(
    job_id: uuid.UUID,
    payload: BatchTranscribeRequest,
    user: User = Depends(require_active_membership),
    db: AsyncSession = Depends(get_db),
):
    """Batch-transcribe recordings for selected job applications."""
    recordings = await recording_service.batch_transcribe_for_job(
        db, user.id, job_id, payload.application_ids
    )
    data = [await _to_response(r) for r in recordings]
    return ResponseBuilder.success(data=data, message="Batch transcription complete.")


@router.get(
    "/jobs/{job_id}/recordings/batch-candidates",
    response_model=UnifiedResponse[list[BatchTranscribeCandidateResponse]],
    summary="List candidates and latest recording info for batch transcription under a job",
)
async def list_batch_candidates(
    job_id: uuid.UUID,
    user: User = Depends(require_active_membership),
    db: AsyncSession = Depends(get_db),
):
    """List job candidates eligible for batch transcription."""
    data = await recording_service.list_batch_transcribe_candidates(db, user.id, job_id)
    return ResponseBuilder.success(
        data=data, message="Batch transcription candidates fetched."
    )


@router.delete(
    "/recordings/{recording_id}",
    response_model=UnifiedResponse[None],
    summary="Delete a recording and its S3 file",
)
async def delete_recording(
    recording_id: uuid.UUID,
    user: User = Depends(require_active_membership),
    db: AsyncSession = Depends(get_db),
):
    """Delete a recording and its stored media."""
    await recording_service.delete_recording(db, user.id, recording_id)
    return ResponseBuilder.success(data=None, message="Recording deleted.")
