from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User
from app.users.dependencies import get_current_user
from app.projects.schemas import ProjectCreate, ProjectResponse
from app.projects.service import create_project, get_user_projects
from typing import List

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project_endpoint(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new project"""
    project = create_project(db, project_data.name, current_user.id)
    return project


@router.get("", response_model=List[ProjectResponse])
def get_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all projects for current user"""
    projects = get_user_projects(db, current_user.id)
    return projects

