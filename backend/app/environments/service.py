from sqlalchemy.orm import Session
from app.db.models import Environment
from app.models.env_share import EnvShare
from app.projects.service import check_project_access
from app.environments.schemas import EnvironmentUpdate
from fastapi import HTTPException, status


def create_environment(db: Session, name: str, project_id: int, user_id: int) -> Environment:
    """Create a new environment"""
    # Check project access
    check_project_access(db, project_id, user_id)
    
    environment = Environment(name=name, project_id=project_id)
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
    if data.name is not None:
        environment.name = data.name
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

