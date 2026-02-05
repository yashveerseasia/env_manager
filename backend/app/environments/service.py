from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.models import Environment
from app.models.env_share import EnvShare
from app.projects.service import check_project_access
from app.environments.schemas import EnvironmentUpdate
from fastapi import HTTPException, status


def create_environment(db: Session, name: str, project_id: int, user_id: int) -> Environment:
    """Create a new environment. Environment name must be unique per project."""
    # Check project access
    check_project_access(db, project_id, user_id)
    name_normalized = name.strip() if name else ""
    if not name_normalized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Environment name is required",
        )
    existing = (
        db.query(Environment)
        .filter(
            Environment.project_id == project_id,
            func.lower(Environment.name) == name_normalized.lower(),
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This project already has an environment with this name.",
        )
    environment = Environment(name=name_normalized, project_id=project_id)
    db.add(environment)
    db.commit()
    db.refresh(environment)
    return environment


def get_environments_by_project(db: Session, project_id: int, user_id: int) -> list[Environment]:
    """Get all environments for a project"""
    # Check project access
    check_project_access(db, project_id, user_id)
    
    environments = db.query(Environment).filter(
        Environment.project_id == project_id
    ).all()
    return environments


def get_environment_by_id(db: Session, environment_id: int) -> Environment:
    """Get environment by ID"""
    environment = db.query(Environment).filter(Environment.id == environment_id).first()
    if not environment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Environment not found"
        )
    return environment


def update_environment(db: Session, environment_id: int, user_id: int, data: EnvironmentUpdate) -> Environment:
    """Update an environment. User must have access to the project."""
    environment = get_environment_by_id(db, environment_id)
    check_project_access(db, environment.project_id, user_id)
    project_id_for_name = data.project_id if data.project_id is not None else environment.project_id
    if data.name is not None:
        name_normalized = data.name.strip() if data.name else ""
        if not name_normalized:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Environment name cannot be empty",
            )
        existing = (
            db.query(Environment)
            .filter(
                Environment.project_id == project_id_for_name,
                func.lower(Environment.name) == name_normalized.lower(),
                Environment.id != environment_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This project already has an environment with this name.",
            )
        environment.name = name_normalized
    if data.project_id is not None:
        check_project_access(db, data.project_id, user_id)
        environment.project_id = data.project_id
    db.commit()
    db.refresh(environment)
    return environment


def delete_environment(db: Session, environment_id: int, user_id: int) -> None:
    """Delete an environment. User must have access to the project."""
    environment = get_environment_by_id(db, environment_id)
    check_project_access(db, environment.project_id, user_id)
    # Remove share links that reference this environment (FK constraint)
    db.query(EnvShare).filter(EnvShare.environment_id == environment_id).delete()
    db.delete(environment)
    db.commit()

