from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime
import re
from app.schemas.auth import UserResponse
from app.schemas.role import RoleResponse
from app.schemas.permission import PermissionResponse
from app.core.constants import PersonaType


def email_validator(value: str) -> str:
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", value):
        raise ValueError("Invalid email format.")
    return value


class UserCreate(BaseModel):
    email: str
    full_name: str = Field(..., min_length=1)
    persona_type: PersonaType
    role_ids: List[UUID]

    @field_validator("email")
    @classmethod
    def check_email(cls, v: str) -> str:
        return email_validator(v)

    @field_validator("persona_type", mode="before")
    @classmethod
    def validate_persona(cls, v: str) -> str:
        valid = {p.value for p in PersonaType}
        if v not in valid:
            raise ValueError(f"Invalid persona_type '{v}'. Must be one of: {', '.join(valid)}.")
        return v


class UserCreateResponse(BaseModel):
    user: UserResponse
    temporary_password: str


class UserUpdate(BaseModel):
    email: Optional[str] = Field(None, min_length=1)
    full_name: Optional[str] = Field(None, min_length=1)
    persona_type: Optional[PersonaType] = None

    @field_validator("email")
    @classmethod
    def check_email(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return email_validator(v)
        return v

    @field_validator("persona_type", mode="before")
    @classmethod
    def validate_persona(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid = {p.value for p in PersonaType}
        if v not in valid:
            raise ValueError(f"Invalid persona_type '{v}'. Must be one of: {', '.join(valid)}.")
        return v


class UserStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        valid_statuses = {"active", "inactive", "suspended"}
        if v not in valid_statuses:
            raise ValueError("Status must be one of: active, inactive, suspended.")
        return v


class UserDetailResponse(BaseModel):
    id: UUID
    organization_id: Optional[UUID]
    email: str
    full_name: Optional[str] = None
    persona_type: str
    status: str
    must_change_password: bool
    created_at: datetime
    roles: List[RoleResponse] = []
    permissions: List[PermissionResponse] = []

    class Config:
        from_attributes = True


class RoleListItemResponse(BaseModel):
    id: UUID
    name: str
    persona_type: str
    is_system_role: bool

    class Config:
        from_attributes = True


class UserListItemResponse(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str] = None
    persona_type: str
    status: str
    must_change_password: bool
    created_at: datetime
    roles: List[RoleListItemResponse] = []

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    users: List[UserListItemResponse]
    total: int
    page: int
    page_size: int


class UserPasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=10)
