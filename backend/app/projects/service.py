from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.models import Project, ProjectMember, Role, Environment
from app.models.env_share import EnvShare
from app.projects.schemas import ProjectCreate, ProjectUpdate
from fastapi import HTTPException, status


def create_project(db: Session, name: str, owner_id: int) -> Project:
    """Create a new project. Project name must be unique per user (owner)."""
    name_normalized = name.strip() if name else ""
    if not name_normalized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project name is required",
        )
    existing = (
        db.query(Project)
        .filter(
            Project.owner_id == owner_id,
            func.lower(Project.name) == name_normalized.lower(),
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a project with this name.",
        )
    project = Project(name=name_normalized, owner_id=owner_id)
    db.add(project)
    db.commit()
    db.refresh(project)
    
    # Add owner as project member with OWNER role
    member = ProjectMember(project_id=project.id, user_id=owner_id, role=Role.OWNER)
    db.add(member)
    db.commit()
    
    return project


def get_user_projects(db: Session, user_id: int) -> list[Project]:
    """Get all projects where user is owner or member"""
    projects = db.query(Project).join(ProjectMember).filter(
        ProjectMember.user_id == user_id
    ).all()
    return projects


def get_project_by_id(db: Session, project_id: int) -> Project:
    """Get project by ID"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return project


def check_project_access(db: Session, project_id: int, user_id: int) -> ProjectMember:
    """Check if user has access to project and return membership"""
    membership = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this project"
        )
    
    return membership


def update_project(db: Session, project_id: int, user_id: int, data: ProjectUpdate) -> Project:
    """Update a project. Only OWNER or ADMIN can update."""
    project = get_project_by_id(db, project_id)
    membership = check_project_access(db, project_id, user_id)
    if membership.role not in (Role.OWNER, Role.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owner or admin can update the project",
        )
    if data.name is not None:
        name_normalized = data.name.strip() if data.name else ""
        if not name_normalized:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Project name cannot be empty",
            )
        existing = (
            db.query(Project)
            .filter(
                Project.owner_id == project.owner_id,
                func.lower(Project.name) == name_normalized.lower(),
                Project.id != project_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have a project with this name.",
            )
        project.name = name_normalized
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project_id: int, user_id: int) -> None:
    """Delete a project. Only OWNER can delete."""
    project = get_project_by_id(db, project_id)
    membership = check_project_access(db, project_id, user_id)
    if membership.role != Role.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owner can delete the project",
        )
    # Remove share links for all environments in this project (FK constraint)
    env_ids = [r[0] for r in db.query(Environment.id).filter(Environment.project_id == project_id).all()]
    if env_ids:
        db.query(EnvShare).filter(EnvShare.environment_id.in_(env_ids)).delete(synchronize_session=False)
    db.delete(project)
    db.commit()

