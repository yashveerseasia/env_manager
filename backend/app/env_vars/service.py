from sqlalchemy.orm import Session
from app.db.models import EnvVariable, Environment, Role, ProjectMember
from app.core.encryption import encryption_service
from app.environments.service import get_environment_by_id
from app.projects.service import check_project_access
from app.env_vars.schemas import EnvVariableCreate, EnvVariableUpdate
from fastapi import HTTPException, status


def mask_value(value: str) -> str:
    """Mask a secret value"""
    if not value or len(value) <= 4:
        return "****"
    return value[:2] + "*" * (len(value) - 4) + value[-2:]


def check_permission(role: Role, action: str, is_secret: bool) -> bool:
    """Check if user role has permission for action"""
    if role == Role.OWNER:
        return True  # Owner has all permissions
    
    if role == Role.READ_ONLY:
        return False  # Read only has no access
    
    if role == Role.ADMIN:
        return action in ["view", "copy", "edit"]  # Admin can view (masked), copy, edit
    
    if role == Role.DEVELOPER:
        return action == "view" and not is_secret  # Developer can only view non-secrets
    
    return False


def get_user_role_for_environment(db: Session, environment_id: int, user_id: int) -> Role:
    """Get user's role for the environment's project"""
    environment = get_environment_by_id(db, environment_id)
    membership = check_project_access(db, environment.project_id, user_id)
    return membership.role


def create_env_variable(db: Session, env_var_data: EnvVariableCreate, user_id: int) -> EnvVariable:
    """Create a new environment variable"""

    # 🔐 Check user permission
    role = get_user_role_for_environment(db, env_var_data.environment_id, user_id)
    if not check_permission(role, "edit", env_var_data.is_secret):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # ✅ Encrypt ONLY if value is secret
    if env_var_data.is_secret:
        stored_value = encryption_service.encrypt(env_var_data.value)
    else:
        stored_value = env_var_data.value  # plaintext for non-secret

    env_var = EnvVariable(
        key=env_var_data.key,
        value=stored_value,
        is_secret=env_var_data.is_secret,
        environment_id=env_var_data.environment_id
    )

    db.add(env_var)
    db.commit()
    db.refresh(env_var)

    # ❌ DO NOT decrypt here (visibility handled in GET)
    return env_var


# def create_env_variable(db: Session, env_var_data: EnvVariableCreate, user_id: int) -> EnvVariable:
#     """Create a new environment variable"""
#     # Check access
#     role = get_user_role_for_environment(db, env_var_data.environment_id, user_id)
#     if not check_permission(role, "edit", env_var_data.is_secret):
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Insufficient permissions"
#         )
    
#     # Encrypt the value
#     encrypted_value = encryption_service.encrypt(env_var_data.value)
    
#     env_var = EnvVariable(
#         key=env_var_data.key,
#         value=encrypted_value,
#         is_secret=env_var_data.is_secret,
#         environment_id=env_var_data.environment_id
#     )
#     db.add(env_var)
#     db.commit()
#     db.refresh(env_var)
    
#     # Decrypt for response (will be masked in router if needed)
#     env_var.value = encryption_service.decrypt(env_var.value)
#     return env_var


# def get_env_variables(db: Session, environment_id: int, user_id: int, reveal_secrets: bool = False) -> list[EnvVariable]:
#     """Get all environment variables for an environment"""
#     # Check access
#     role = get_user_role_for_environment(db, environment_id, user_id)
    
#     env_vars = db.query(EnvVariable).filter(
#         EnvVariable.environment_id == environment_id
#     ).all()
    
#     result = []
#     for env_var in env_vars:
#         # Decrypt value
#         decrypted_value = encryption_service.decrypt(env_var.value)
        
#         # Check permissions and mask if needed
#         if env_var.is_secret:
#             if role == Role.OWNER:
#                 # Owner can see everything
#                 env_var.value = decrypted_value
#             elif role == Role.ADMIN and reveal_secrets:
#                 # Admin can see if explicitly requested
#                 env_var.value = decrypted_value
#             else:
#                 # Mask for others
#                 env_var.value = mask_value(decrypted_value)
#         else:
#             env_var.value = decrypted_value
        
#         result.append(env_var)
    
#     return result

def get_env_variables_old(db: Session, environment_id: int, user_id: int, reveal_secrets: bool = False) -> list[EnvVariable]:
    """Get all environment variables for an environment"""

    role = get_user_role_for_environment(db, environment_id, user_id)

    env_vars = db.query(EnvVariable).filter(
        EnvVariable.environment_id == environment_id
    ).all()

    result = []

    for env_var in env_vars:

        if env_var.is_secret:
            # 🔐 Secret values → decrypt ONLY if allowed
            if role == Role.OWNER:
                env_var.value = encryption_service.decrypt(env_var.value)
            elif role == Role.ADMIN and reveal_secrets:
                env_var.value = encryption_service.decrypt(env_var.value)
            else:
                env_var.value = "********"  # masked
        else:
            # 🟢 Non-secret values → NEVER decrypt
            env_var.value = env_var.value

        result.append(env_var)

    return result



# def get_env_variable_by_id(db: Session, env_var_id: int, user_id: int, reveal_secret: bool = False) -> EnvVariable:
#     """Get a single environment variable by ID"""
#     env_var = db.query(EnvVariable).filter(EnvVariable.id == env_var_id).first()
#     if not env_var:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Environment variable not found"
#         )
    
#     # Check access
#     role = get_user_role_for_environment(db, env_var.environment_id, user_id)
#     if not check_permission(role, "view", env_var.is_secret):
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Insufficient permissions"
#         )
    
#     # Decrypt value
#     decrypted_value = encryption_service.decrypt(env_var.value)
    
#     # Check permissions and mask if needed
#     if env_var.is_secret:
#         if role == Role.OWNER:
#             env_var.value = decrypted_value
#         elif role == Role.ADMIN and reveal_secret:
#             env_var.value = decrypted_value
#         else:
#             env_var.value = mask_value(decrypted_value)
#     else:
#         env_var.value = decrypted_value
    
#     return env_var

def get_env_variable_by_id_old(db: Session, env_var_id: int, user_id: int, reveal_secret: bool = False) -> EnvVariable:
    """Get a single environment variable by ID"""

    env_var = db.query(EnvVariable).filter(EnvVariable.id == env_var_id).first()
    if not env_var:
        raise HTTPException(status_code=404, detail="Environment variable not found")

    role = get_user_role_for_environment(db, env_var.environment_id, user_id)
    if not check_permission(role, "view", env_var.is_secret):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    if env_var.is_secret:
        # 🔐 Decrypt only if user is allowed
        if role == Role.OWNER:
            env_var.value = encryption_service.decrypt(env_var.value)
        elif role == Role.ADMIN and reveal_secret:
            env_var.value = encryption_service.decrypt(env_var.value)
        else:
            env_var.value = "********"
    else:
        # 🟢 Plain value
        env_var.value = env_var.value

    return env_var



# def update_env_variable(db: Session, env_var_id: int, env_var_data: EnvVariableUpdate, user_id: int) -> EnvVariable:
#     """Update an environment variable"""
#     env_var = db.query(EnvVariable).filter(EnvVariable.id == env_var_id).first()
#     if not env_var:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Environment variable not found"
#         )
    
#     # Check access
#     role = get_user_role_for_environment(db, env_var.environment_id, user_id)
#     if not check_permission(role, "edit", env_var.is_secret):
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Insufficient permissions"
#         )
    
#     # Update fields
#     if env_var_data.key is not None:
#         env_var.key = env_var_data.key
#     if env_var_data.is_secret is not None:
#         env_var.is_secret = env_var_data.is_secret
#     if env_var_data.value is not None:
#         # Encrypt the new value
#         env_var.value = encryption_service.encrypt(env_var_data.value)
    
#     db.commit()
#     db.refresh(env_var)
    
#     # Decrypt for response
#     env_var.value = encryption_service.decrypt(env_var.value)
#     return env_var


# def update_env_variable(db: Session, env_var_id: int, env_var_data: EnvVariableUpdate, user_id: int) -> EnvVariable:
#     """Update an environment variable"""

#     env_var = db.query(EnvVariable).filter(EnvVariable.id == env_var_id).first()
#     if not env_var:
#         raise HTTPException(status_code=404, detail="Environment variable not found")

#     role = get_user_role_for_environment(db, env_var.environment_id, user_id)
#     if not check_permission(role, "edit", env_var.is_secret):
#         raise HTTPException(status_code=403, detail="Insufficient permissions")

#     if env_var_data.key is not None:
#         env_var.key = env_var_data.key

#     if env_var_data.is_secret is not None:
#         env_var.is_secret = env_var_data.is_secret

#     if env_var_data.value is not None:
#         # ✅ Encrypt only if secret
#         if env_var.is_secret:
#             env_var.value = encryption_service.encrypt(env_var_data.value)
#         else:
#             env_var.value = env_var_data.value

#     db.commit()
#     db.refresh(env_var)

#     # ❌ Do NOT decrypt here
#     return env_var


def update_env_variable_1(
    db: Session,
    env_var_id: int,
    env_var_data: EnvVariableUpdate,
    user_id: int
) -> EnvVariable:
    """
    Update an environment variable.

    SECURITY GUARANTEES:
    - Secret values are ALWAYS encrypted in DB
    - Plaintext secrets are impossible after update
    - UI request order does NOT matter
    """

    env_var = db.query(EnvVariable).filter(EnvVariable.id == env_var_id).first()
    if not env_var:
        raise HTTPException(status_code=404, detail="Environment variable not found")

    # 🔐 Permission check
    role = get_user_role_for_environment(db, env_var.environment_id, user_id)
    if not check_permission(role, "edit", env_var.is_secret):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # 🧠 Determine FINAL secret state (critical)
    final_is_secret = (
        env_var_data.is_secret
        if env_var_data.is_secret is not None
        else env_var.is_secret
    )

    # 📝 Update key if provided
    if env_var_data.key is not None:
        env_var.key = env_var_data.key

    # 🔁 Update secret flag FIRST
    env_var.is_secret = final_is_secret

    # 🔐 Update value safely
    if env_var_data.value is not None:
        if final_is_secret:
            # ✅ ALWAYS encrypt secrets
            env_var.value = encryption_service.encrypt(env_var_data.value)
        else:
            # ✅ Store plaintext for non-secrets
            env_var.value = env_var_data.value

    db.commit()
    db.refresh(env_var)

    # 🚫 NEVER decrypt here (handled in GET logic)
    return env_var


def update_env_variable(
    db: Session,
    env_var_id: int,
    env_var_data: EnvVariableUpdate,
    user_id: int
) -> EnvVariable:

    print("\n========== UPDATE ENV VAR DEBUG ==========")
    print("Incoming payload:", env_var_data.dict())

    env_var = db.query(EnvVariable).filter(EnvVariable.id == env_var_id).first()
    if not env_var:
        raise HTTPException(status_code=404, detail="Environment variable not found")

    print("DB BEFORE UPDATE ->")
    print("  id:", env_var.id)
    print("  key:", env_var.key)
    print("  value:", env_var.value)
    print("  is_secret:", env_var.is_secret)

    role = get_user_role_for_environment(db, env_var.environment_id, user_id)
    print("User role:", role)

    if not check_permission(role, "edit", env_var.is_secret):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # 🔥 CRITICAL: final secret state
    final_is_secret = (
        env_var_data.is_secret
        if env_var_data.is_secret is not None
        else env_var.is_secret
    )
    print("Final is_secret decided as:", final_is_secret)

    # Update key
    if env_var_data.key is not None:
        print("Updating key ->", env_var_data.key)
        env_var.key = env_var_data.key

    # Update secret flag
    env_var.is_secret = final_is_secret
    print("is_secret AFTER assignment:", env_var.is_secret)

    # Update value
    if env_var_data.value is not None:
        print("Incoming VALUE:", env_var_data.value)

        if final_is_secret:
            encrypted = encryption_service.encrypt(env_var_data.value)
            print("Encrypted VALUE:", encrypted)
            print("Encrypted starts with 'gAAAA' ?", encrypted.startswith("gAAAA"))
            env_var.value = encrypted
        else:
            print("Storing PLAINTEXT value")
            env_var.value = env_var_data.value

    print("DB BEFORE COMMIT ->")
    print("  value:", env_var.value)
    print("  is_secret:", env_var.is_secret)

    db.commit()
    db.refresh(env_var)

    print("DB AFTER COMMIT ->")
    print("  value:", env_var.value)
    print("  is_secret:", env_var.is_secret)
    print("=========================================\n")

    return env_var


# this is new code update

def env_var_to_response(env_var: EnvVariable, value: str) -> dict:
    return {
        "id": env_var.id,
        "key": env_var.key,
        "value": value,
        "is_secret": env_var.is_secret,
        "environment_id": env_var.environment_id,
        "created_at": env_var.created_at,
        "updated_at": env_var.updated_at,
    }


def get_env_variables(db: Session, environment_id: int, user_id: int, reveal_secrets: bool = False):
    role = get_user_role_for_environment(db, environment_id, user_id)

    env_vars = db.query(EnvVariable).filter(
        EnvVariable.environment_id == environment_id
    ).all()

    response = []

    for env_var in env_vars:
        if env_var.is_secret:
            decrypted = encryption_service.decrypt(env_var.value)

            if role == Role.OWNER or (role == Role.ADMIN and reveal_secrets):
                value = decrypted
            else:
                value = mask_value(decrypted)
        else:
            value = env_var.value  # plaintext stored

        response.append(env_var_to_response(env_var, value))

    return response


def get_env_variable_by_id(
    db: Session,
    env_var_id: int,
    user_id: int,
    reveal_secret: bool = False
):
    env_var = db.query(EnvVariable).filter(EnvVariable.id == env_var_id).first()
    if not env_var:
        raise HTTPException(status_code=404, detail="Not found")

    role = get_user_role_for_environment(db, env_var.environment_id, user_id)
    if not check_permission(role, "view", env_var.is_secret):
        raise HTTPException(status_code=403, detail="Forbidden")

    if env_var.is_secret:
        decrypted = encryption_service.decrypt(env_var.value)
        value = decrypted if (role == Role.OWNER or reveal_secret) else mask_value(decrypted)
    else:
        value = env_var.value

    response = env_var_to_response(env_var, value)
    return env_var, response



# close update code



def delete_env_variable(db: Session, env_var_id: int, user_id: int) -> None:
    """Delete an environment variable"""
    env_var = db.query(EnvVariable).filter(EnvVariable.id == env_var_id).first()
    if not env_var:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Environment variable not found"
        )
    
    # Check access
    role = get_user_role_for_environment(db, env_var.environment_id, user_id)
    if not check_permission(role, "edit", env_var.is_secret):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    db.delete(env_var)
    db.commit()


# def get_env_file_content(db: Session, environment_id: int, user_id: int) -> str:
#     """Get environment variables as .env file content"""
#     # Check if user has permission to download (needs to see secrets)
#     role = get_user_role_for_environment(db, environment_id, user_id)
#     if role not in [Role.OWNER, Role.ADMIN]:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Insufficient permissions to download environment file"
#         )
    
#     # Get raw env vars from database
#     env_vars = db.query(EnvVariable).filter(
#         EnvVariable.environment_id == environment_id
#     ).all()
    
#     lines = []
#     for env_var in env_vars:
#         # Decrypt value for download
#         decrypted_value = encryption_service.decrypt(env_var.value)
#         lines.append(f"{env_var.key}={decrypted_value}")
    
#     return "\n".join(lines)

def get_env_file_content(db: Session, environment_id: int, user_id: int) -> str:
    """Get environment variables as .env file content"""

    role = get_user_role_for_environment(db, environment_id, user_id)
    if role not in [Role.OWNER, Role.ADMIN]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    env_vars = db.query(EnvVariable).filter(
        EnvVariable.environment_id == environment_id
    ).all()

    lines = []
    for env_var in env_vars:
        if env_var.is_secret:
            value = encryption_service.decrypt(env_var.value)
        else:
            value = env_var.value  # plaintext

        lines.append(f"{env_var.key}={value}")

    return "\n".join(lines)
