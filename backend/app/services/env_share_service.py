"""
Service layer for secure environment share links.
"""

from datetime import datetime, timezone
import secrets
from typing import List, Optional, Tuple

from cryptography.fernet import InvalidToken
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.core.encryption import encryption_service
from app.db.models import EnvVariable, Environment
from app.models.env_share import EnvShare
from app.schemas.env_share import EnvShareCreate, EnvVarForShare
from app.audit.service import log_audit
from app.environments.service import get_environment_by_id
from app.projects.service import check_project_access


def _generate_unique_token(db: Session) -> str:
    """
    Generate a unique, URL-safe token for EnvShare.
    """
    while True:
        token = secrets.token_urlsafe(32)
        existing = db.query(EnvShare).filter(EnvShare.token == token).first()
        if not existing:
            return token


def create_env_share(
    db: Session,
    environment_id: int,
    creator_user_id: int,
    data: EnvShareCreate,
    base_share_url: str = "/share",
) -> Tuple[EnvShare, str]:
    """
    Create a new EnvShare record for the given environment.
    """
    # Ensure environment exists
    environment = db.query(Environment).filter(Environment.id == environment_id).first()
    if not environment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Environment not found",
        )

    token = _generate_unique_token(db)
    password_hash = get_password_hash(data.password)

    share = EnvShare(
        environment_id=environment_id,
        token=token,
        password_hash=password_hash,
        expires_at=data.expires_at,
        max_views=data.max_views,
        max_downloads=data.max_downloads,
        one_time=data.one_time,
        whitelisted_ips=data.whitelisted_ips,
        created_by=creator_user_id,
    )

    db.add(share)
    db.commit()
    db.refresh(share)

    share_url = f"{base_share_url}/{share.token}"

    # Audit
    log_audit(
        db=db,
        user_id=creator_user_id,
        action="create",
        resource="env_share",
        resource_id=share.id,
        details=f"Created share link for environment {environment_id}",
    )

    return share, share_url


def list_env_shares(db: Session, environment_id: int, user_id: int) -> List[EnvShare]:
    """
    List all share links for an environment. User must have access to the environment's project.
    """
    environment = get_environment_by_id(db, environment_id)
    check_project_access(db, environment.project_id, user_id)
    return db.query(EnvShare).filter(EnvShare.environment_id == environment_id).order_by(EnvShare.created_at.desc()).all()


def revoke_env_share(db: Session, share_id: int, user_id: int) -> None:
    """
    Revoke a share link (set is_active=False). User must have access to the share's environment.
    """
    share = db.query(EnvShare).filter(EnvShare.id == share_id).first()
    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share link not found",
        )
    environment = get_environment_by_id(db, share.environment_id)
    check_project_access(db, environment.project_id, user_id)
    share.is_active = False
    db.commit()
    log_audit(
        db=db,
        user_id=user_id,
        action="revoke",
        resource="env_share",
        resource_id=share_id,
        details=f"Revoked share link for environment {share.environment_id}",
    )


def _is_expired(share: EnvShare) -> bool:
    if share.expires_at is None:
        return False
    now = datetime.now(timezone.utc)
    # share.expires_at is timezone-aware (server_default now())
    return share.expires_at < now


def _check_ip_allowed(share: EnvShare, client_ip: Optional[str]) -> bool:
    if not share.whitelisted_ips or len(share.whitelisted_ips) == 0:
        # No whitelist configured -> allow all
        return True
    if client_ip is None:
        return False
    return client_ip in share.whitelisted_ips


def _get_share_or_403(db: Session, token: str) -> EnvShare:
    share = db.query(EnvShare).filter(EnvShare.token == token).first()
    if not share or not share.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Share link is invalid or inactive",
        )
    return share


def _validate_share_common(
    db: Session,
    share: EnvShare,
    password: str,
    client_ip: Optional[str],
    for_download: bool,
) -> None:
    """
    Common validation for share access (view/download).
    Raises HTTPException on failure.
    """
    # Expiry
    if _is_expired(share):
        share.is_active = False
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Share link has expired",
        )

    # IP whitelist
    if not _check_ip_allowed(share, client_ip):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="IP address is not allowed for this share link",
        )

    # Password
    if not verify_password(password, share.password_hash):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid password for share link",
        )

    # Limits
    if for_download:
        if share.max_downloads is not None and share.max_downloads >= 0:
            if share.download_count >= share.max_downloads:
                share.is_active = False
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Download limit exceeded for this share link",
                )
    else:
        if share.max_views is not None and share.max_views >= 0:
            if share.view_count >= share.max_views:
                share.is_active = False
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="View limit exceeded for this share link",
                )


def _increment_counters_and_maybe_revoke(
    db: Session,
    share: EnvShare,
    for_download: bool,
) -> None:
    """
    Increment view/download counters atomically and revoke if needed.
    """
    if for_download:
        share.download_count += 1
        # Auto revoke after download regardless of one_time
        share.is_active = False
    else:
        share.view_count += 1
        # Revoke on one-time after first successful view
        if share.one_time:
            share.is_active = False

        # Also revoke if view limit reached
        if share.max_views is not None and share.max_views >= 0:
            if share.view_count >= share.max_views:
                share.is_active = False

    db.commit()
    db.refresh(share)


def get_env_variables_for_share(
    db: Session,
    share: EnvShare,
) -> List[EnvVarForShare]:
    """
    Retrieve decrypted environment variables for a given share's environment.
    """
    env_vars = (
        db.query(EnvVariable)
        .filter(EnvVariable.environment_id == share.environment_id)
        .all()
    )

    result: List[EnvVarForShare] = []
    for ev in env_vars:
        if ev.is_secret:
            try:
                value = encryption_service.decrypt(ev.value)
            except InvalidToken:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Unable to decrypt environment variables. The environment may have been created or modified with a different encryption key. Please contact the link owner.",
                )
        else:
            value = ev.value  # non-secret values are stored in plain text
        result.append(
            EnvVarForShare(
                key=ev.key,
                value=value,
                is_secret=ev.is_secret,
            )
        )
    return result


def get_env_file_content_for_share(
    db: Session,
    share: EnvShare,
) -> str:
    """
    Build .env file content for a given share's environment.
    """
    env_vars = (
        db.query(EnvVariable)
        .filter(EnvVariable.environment_id == share.environment_id)
        .all()
    )

    lines: List[str] = []
    for ev in env_vars:
        if ev.is_secret:
            try:
                value = encryption_service.decrypt(ev.value)
            except InvalidToken:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Unable to decrypt environment variables. The environment may have been created or modified with a different encryption key. Please contact the link owner.",
                )
        else:
            value = ev.value  # non-secret values are stored in plain text
        lines.append(f"{ev.key}={value}")
    return "\n".join(lines)


def access_share_view(
    db: Session,
    token: str,
    password: str,
    client_ip: Optional[str],
) -> Tuple[EnvShare, List[EnvVarForShare]]:
    """
    Perform a secure view access on a share link.
    """
    share = _get_share_or_403(db, token)

    _validate_share_common(
        db=db,
        share=share,
        password=password,
        client_ip=client_ip,
        for_download=False,
    )

    variables = get_env_variables_for_share(db, share)

    _increment_counters_and_maybe_revoke(db=db, share=share, for_download=False)

    # Audit as created_by user
    log_audit(
        db=db,
        user_id=share.created_by,
        action="view",
        resource="env_share",
        resource_id=share.id,
        details=f"Shared environment {share.environment_id} viewed via token",
    )

    return share, variables


def access_share_download(
    db: Session,
    token: str,
    password: str,
    client_ip: Optional[str],
) -> Tuple[EnvShare, str]:
    """
    Perform a secure download access on a share link, returning .env content.
    """
    share = _get_share_or_403(db, token)

    _validate_share_common(
        db=db,
        share=share,
        password=password,
        client_ip=client_ip,
        for_download=True,
    )

    content = get_env_file_content_for_share(db, share)

    _increment_counters_and_maybe_revoke(db=db, share=share, for_download=True)

    # Audit as created_by user
    log_audit(
        db=db,
        user_id=share.created_by,
        action="copy",
        resource="env_share",
        resource_id=share.id,
        details=f"Shared environment {share.environment_id} downloaded as .env via token",
    )

    return share, content


