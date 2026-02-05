from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User
from app.users.dependencies import get_current_user
from app.environments.schemas import EnvironmentCreate, EnvironmentUpdate, EnvironmentResponse
from app.environments.service import (
    create_environment,
    get_environments_by_project,
    update_environment,
    delete_environment,
)
from typing import List

router = APIRouter(prefix="/environments", tags=["environments"])


@router.post("", response_model=EnvironmentResponse, status_code=status.HTTP_201_CREATED)
def create_environment_endpoint(
    environment_data: EnvironmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new environment"""
    environment = create_environment(
        db,
        environment_data.name,
        environment_data.project_id,
        current_user.id
    )
    return environment


@router.get("/{project_id}", response_model=List[EnvironmentResponse])
def get_environments(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all environments for a project"""
    environments = get_environments_by_project(db, project_id, current_user.id)
    return environments


@router.put("/{environment_id}", response_model=EnvironmentResponse)
def update_environment_endpoint(
    environment_id: int,
    environment_data: EnvironmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an environment. User must have access to the project."""
    return update_environment(db, environment_id, current_user.id, environment_data)


@router.delete("/{environment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_environment_endpoint(
    environment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an environment. User must have access to the project."""
    delete_environment(db, environment_id, current_user.id)

