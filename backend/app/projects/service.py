from sqlalchemy.orm import Session
from app.db.models import Project, ProjectMember, Role
from app.projects.schemas import ProjectCreate
from fastapi import HTTPException, status


def create_project(db: Session, name: str, owner_id: int) -> Project:
    """Create a new project"""
    project = Project(name=name, owner_id=owner_id)
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

