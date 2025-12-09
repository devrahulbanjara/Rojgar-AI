from fastapi import APIRouter, Depends, Request, status
from app.core import get_current_user_id
from app.core.dependencies import (
    get_application_by_id,
    get_application_for_delete,
    get_application_for_update,
)
from app.models import Application
from app.schemas.application import (
    ApplicationResponse,
    CreateApplicationRequest,
    UpdateApplicationRequest,
)
from app.services import ApplicationService

router = APIRouter()


@router.get("/", response_model=list[ApplicationResponse])
def get_my_applications(
    request: Request, application_service: ApplicationService = Depends()
):
    user_id = get_current_user_id(request)

    applications = application_service.get_user_applications(user_id)

    return applications


@router.get("/tracking-board", response_model=dict[str, list[dict]])
def get_tracking_board(
    request: Request, application_service: ApplicationService = Depends()
):
    user_id = get_current_user_id(request)

    return application_service.get_tracking_board(user_id)


@router.get("/stats", response_model=dict[str, int])
def get_application_stats(
    request: Request, application_service: ApplicationService = Depends()
):
    user_id = get_current_user_id(request)

    return application_service.get_application_stats(user_id)


@router.post(
    "/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED
)
def create_application(
    app_data: CreateApplicationRequest,
    request: Request,
    application_service: ApplicationService = Depends(),
):
    user_id = get_current_user_id(request)

    new_app = application_service.create_application(
        user_id=user_id,
        job_title=app_data.job_title,
        company_name=app_data.company_name,
        description=app_data.description,
    )
    application_service.db.commit()

    return new_app


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(app: Application = Depends(get_application_by_id)):
    return app


@router.put("/{application_id}", response_model=ApplicationResponse)
def update_application(
    update_data: UpdateApplicationRequest,
    app: Application = Depends(get_application_for_update),
    application_service: ApplicationService = Depends(),
):
    updated_app = application_service.update_application(
        application=app,
        stage=update_data.stage,
        status=update_data.status,
        description=update_data.description,
    )
    application_service.db.commit()

    return updated_app


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    app: Application = Depends(get_application_for_delete),
    application_service: ApplicationService = Depends(),
):
    application_service.delete_application(app)
    application_service.db.commit()

    return None
