from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User
from app.users.dependencies import get_current_user
from app.env_vars.schemas import EnvVariableCreate, EnvVariableUpdate, EnvVariableResponse
from app.env_vars.service import (
    create_env_variable,
    get_env_variables,
    get_env_variable_by_id,
    update_env_variable,
    delete_env_variable,
    get_env_file_content
)
from app.audit.service import log_audit
from typing import List

router = APIRouter(prefix="/env", tags=["env_vars"])


@router.post("", response_model=EnvVariableResponse, status_code=201)
def create_env_variable_endpoint(
    env_var_data: EnvVariableCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new environment variable"""
    env_var = create_env_variable(db, env_var_data, current_user.id)
    
    # Log audit
    log_audit(db, current_user.id, "create", "env_var", env_var.id, f"Created {env_var.key}")
    
    return env_var


@router.get("/{environment_id}", response_model=List[EnvVariableResponse])
def get_env_variables_endpoint(
    environment_id: int,
    reveal_secrets: bool = Query(False, description="Reveal secret values (requires ADMIN or OWNER role)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all environment variables for an environment"""
    env_vars = get_env_variables(db, environment_id, current_user.id, reveal_secrets)
    
    # Log audit
    log_audit(db, current_user.id, "view", "env_var", environment_id, f"Viewed environment {environment_id}")
    
    return env_vars


# @router.get("/item/{id}", response_model=EnvVariableResponse)
# def get_env_variable_endpoint(
#     id: int,
#     reveal_secret: bool = Query(False, description="Reveal secret value (requires ADMIN or OWNER role)"),
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get a single environment variable by ID"""
#     env_var = get_env_variable_by_id(db, id, current_user.id, reveal_secret)
    
#     # Log audit
#     log_audit(db, current_user.id, "view", "env_var", id, f"Viewed {env_var.key}")
    
#     return env_var

@router.get("/item/{id}", response_model=EnvVariableResponse)
def get_env_variable_endpoint(
    id: int,
    reveal_secret: bool = Query(
        False,
        description="Reveal secret value (requires ADMIN or OWNER role)"
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single environment variable by ID"""

    # ✅ unpack model + response
    env_var, response = get_env_variable_by_id(
        db=db,
        env_var_id=id,
        user_id=current_user.id,
        reveal_secret=reveal_secret
    )

    # ✅ audit log uses DB model (not response dict)
    log_audit(
        db,
        current_user.id,
        "view",
        "env_var",
        id,
        f"Viewed {env_var.key}"
    )

    # ✅ API returns response DTO
    return response



@router.put("/{id}", response_model=EnvVariableResponse)
def update_env_variable_endpoint(
    id: int,
    env_var_data: EnvVariableUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an environment variable"""
    env_var = update_env_variable(db, id, env_var_data, current_user.id)
    
    # Log audit
    log_audit(db, current_user.id, "edit", "env_var", id, f"Updated {env_var.key}")
    
    return env_var


@router.delete("/{id}", status_code=204)
def delete_env_variable_endpoint(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an environment variable"""
    # Get env_var before deletion for audit
    from app.db.models import EnvVariable
    env_var = db.query(EnvVariable).filter(EnvVariable.id == id).first()
    key = env_var.key if env_var else "unknown"
    
    delete_env_variable(db, id, current_user.id)
    
    # Log audit
    log_audit(db, current_user.id, "delete", "env_var", id, f"Deleted {key}")


@router.get("/download/{environment_id}")
def download_env_file(
    environment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download environment variables as .env file"""
    content = get_env_file_content(db, environment_id, current_user.id)
    
    # Log audit
    log_audit(db, current_user.id, "copy", "env_var", environment_id, f"Downloaded environment {environment_id}")
    
    return Response(
        content=content,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename=env_{environment_id}.env"}
    )

