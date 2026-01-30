from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User
from app.users.dependencies import get_current_user
from app.environments.schemas import EnvironmentCreate, EnvironmentResponse
from app.environments.service import create_environment, get_environments_by_project
from typing import List

router = APIRouter(prefix="/environments", tags=["environments"])


@router.post("", response_model=EnvironmentResponse, status_code=201)
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

