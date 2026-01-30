from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class EnvVariableCreate(BaseModel):
    key: str
    value: str
    is_secret: bool = False
    environment_id: int


class EnvVariableUpdate(BaseModel):
    key: Optional[str] = None
    value: Optional[str] = None
    is_secret: Optional[bool] = None


class EnvVariableResponse(BaseModel):
    id: int
    key: str
    value: str  # Will be masked if is_secret=True
    is_secret: bool
    environment_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class EnvVariableDecrypted(BaseModel):
    id: int
    key: str
    value: str  # Decrypted value
    is_secret: bool
    environment_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

