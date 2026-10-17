from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import FileResponse

from app.infrastructures.storage.service import storage_service, verify_local_file

router = APIRouter(tags=["Files"])


@router.get("/files/{file_key:path}", include_in_schema=False)
def serve_local_file(
    file_key: str, exp: int | None = Query(None), sig: str | None = Query(None)
) -> FileResponse:
    """Serve files kept on disk when the local storage backend is active."""
    if not storage_service.local:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    if file_key.startswith("private/") and not (
        exp is not None and sig and verify_local_file(file_key, exp, sig)
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    path = storage_service._local_path(file_key)
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return FileResponse(path)
