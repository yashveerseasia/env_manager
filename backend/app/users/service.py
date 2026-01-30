from sqlalchemy.orm import Session
from app.db.models import User
from fastapi import HTTPException, status


def get_current_user(db: Session, user_id: int) -> User:
    """Get current user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

