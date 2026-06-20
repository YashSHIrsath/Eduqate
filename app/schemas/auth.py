from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime
import re
from app.schemas.role import RoleResponse
from app.schemas.permission import PermissionResponse


def email_validator(value: str) -> str:
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", value):
        raise ValueError("Invalid email format.")
    return value


class UserRegister(BaseModel):
    email: str
    password: str = Field(..., min_length=10)
    organization_slug: Optional[str] = None
    organization_name: Optional[str] = None

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
    refresh_token: Optional[str] = None
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: UUID
    organization_id: Optional[UUID]
    email: str
    persona_type: str
    status: str
    must_change_password: bool
    created_at: datetime

    class Config:
        from_attributes = True


class OrganizationResponse(BaseModel):
    id: UUID
    name: str
    code: str
    slug: str
    status: str

    class Config:
        from_attributes = True


class UserBootstrapResponse(BaseModel):
    user: UserResponse
    organization: Optional[OrganizationResponse] = None
    roles: List[RoleResponse] = []
    permissions: List[PermissionResponse] = []
