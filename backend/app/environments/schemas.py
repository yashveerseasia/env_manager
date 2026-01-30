from pydantic import BaseModel
from datetime import datetime


class EnvironmentCreate(BaseModel):
    name: str
    project_id: int


class EnvironmentResponse(BaseModel):
    id: int
    name: str
    project_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

