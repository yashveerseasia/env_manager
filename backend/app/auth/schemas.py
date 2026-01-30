from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional


def _validate_bcrypt_password_limit(password: str) -> str:
    # bcrypt has a strict 72-byte limit (bytes, not chars)
    if password is None:
        return password
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        raise ValueError("Password is too long (bcrypt supports max 72 bytes). Use a shorter password.")
    return password


class UserRegister(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_max_72_bytes(cls, v: str) -> str:
        return _validate_bcrypt_password_limit(v)


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_max_72_bytes(cls, v: str) -> str:
        return _validate_bcrypt_password_limit(v)


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None

