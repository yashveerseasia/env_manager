"""
Router for secure environment share links.
"""

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User
from app.users.dependencies import get_current_user
from app.schemas.env_share import (
    EnvShareAccessRequest,
    EnvShareCreate,
    EnvShareResponse,
    EnvShareViewResponse,
)
from app.services.env_share_service import (
    access_share_download,
    access_share_view,
    create_env_share,
)

router = APIRouter(tags=["env_share"])


@router.post(
    "/env/{environment_id}/share",
    response_model=EnvShareResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_share_link(
    environment_id: int,
    body: EnvShareCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a password-protected share link for an environment.
    """
    share, share_url = create_env_share(
        db=db,
        environment_id=environment_id,
        creator_user_id=current_user.id,
        data=body,
        base_share_url="/share",
    )

    return EnvShareResponse(
        share_url=share_url,
        expires_at=share.expires_at,
        max_views=share.max_views,
        max_downloads=share.max_downloads,
        one_time=share.one_time,
        whitelisted_ips=share.whitelisted_ips,
    )


@router.post(
    "/share/{token}/view",
    response_model=EnvShareViewResponse,
)
def view_shared_env(
    token: str,
    body: EnvShareAccessRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    View shared environment variables via a public share token.
    """
    client_ip = request.client.host if request.client else None
    share, variables = access_share_view(
        db=db,
        token=token,
        password=body.password,
        client_ip=client_ip,
    )

    return EnvShareViewResponse(
        environment_id=share.environment_id,
        variables=variables,
    )


@router.post(
    "/share/{token}/download",
)
def download_shared_env(
    token: str,
    body: EnvShareAccessRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Download shared environment as a .env file via a public share token.
    """
    client_ip = request.client.host if request.client else None
    share, content = access_share_download(
        db=db,
        token=token,
        password=body.password,
        client_ip=client_ip,
    )

    filename = f"env_environment_{share.environment_id}.env"

    return Response(
        content=content,
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


