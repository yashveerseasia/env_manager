from sqlalchemy.orm import Session
from app.db.models import AuditLog


def log_audit(
    db: Session,
    user_id: int,
    action: str,
    resource: str,
    resource_id: int = None,
    details: str = None
) -> AuditLog:
    """Create an audit log entry"""
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        resource=resource,
        resource_id=resource_id,
        details=details
    )
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log

