"""
EnvShare SQLAlchemy model for secure environment sharing links.
"""

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.sql import func

from app.db.base import Base


class EnvShare(Base):
    """
    Represents a password-protected share link for an Environment's variables.
    """

    __tablename__ = "env_shares"

    id = Column(Integer, primary_key=True, index=True)
    environment_id = Column(Integer, ForeignKey("environments.id"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    max_views = Column(Integer, nullable=False, default=5)
    max_downloads = Column(Integer, nullable=False, default=1)
    view_count = Column(Integer, nullable=False, default=0)
    download_count = Column(Integer, nullable=False, default=0)
    one_time = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)
    whitelisted_ips = Column(JSON, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


