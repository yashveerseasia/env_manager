"""
Pydantic schemas for EnvShare (secure environment sharing).
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class EnvShareCreate(BaseModel):
    """
    Request body for creating a new environment share link.
    """

    password: str = Field(..., min_length=6)
    expires_at: Optional[datetime] = None
    max_views: int = Field(5, ge=0)
    max_downloads: int = Field(1, ge=0)
    one_time: bool = False
    whitelisted_ips: Optional[List[str]] = None


class EnvShareResponse(BaseModel):
    """
    Response model for a newly created share link.
    """

    share_url: str
    expires_at: Optional[datetime]
    max_views: int
    max_downloads: int
    one_time: bool
    whitelisted_ips: Optional[List[str]]


class EnvShareAccessRequest(BaseModel):
    """
    Request body for accessing a share link (view/download).
    """

    password: str


class EnvVarForShare(BaseModel):
    """
    Single environment variable in a shared environment response.
    """

    key: str
    value: str
    is_secret: bool


class EnvShareViewResponse(BaseModel):
    """
    Response for viewing shared environment variables as JSON.
    """

    environment_id: int
    variables: list[EnvVarForShare]


