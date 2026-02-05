from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class EnvironmentCreate(BaseModel):
    name: str
    project_id: int


class EnvironmentUpdate(BaseModel):
    name: Optional[str] = None
    project_id: Optional[int] = None


class EnvironmentResponse(BaseModel):
    id: int
    name: str
    project_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

