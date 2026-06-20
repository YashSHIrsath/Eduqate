from pydantic import BaseModel, Field, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime
import re

def email_validator(value: str) -> str:
    """Helper to validate basic email format without external dependencies."""
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", value):
        raise ValueError("Invalid email format.")
    return value

class UserRegister(BaseModel):
    email: str
    password: str = Field(..., min_length=10)
    organization_slug: Optional[str] = None
    organization_name: Optional[str] = None # Used for onboarding first tenant

    @field_validator("email")
    @classmethod
    def check_email(cls, v: str) -> str:
        return email_validator(v)

class UserLogin(BaseModel):
    email: str
    password: str
    organization_slug: str

    @field_validator("email")
    @classmethod
    def check_email(cls, v: str) -> str:
        return email_validator(v)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: UUID
    organization_id: Optional[UUID]
    email: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
