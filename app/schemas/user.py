from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime
import re
from app.schemas.auth import UserResponse
from app.schemas.role import RoleResponse
from app.schemas.permission import PermissionResponse

def email_validator(value: str) -> str:
    """Helper to validate basic email format without external dependencies."""
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", value):
        raise ValueError("Invalid email format.")
    return value

class UserCreate(BaseModel):
    email: str
    role_ids: List[UUID]

    @field_validator("email")
    @classmethod
    def check_email(cls, v: str) -> str:
        return email_validator(v)

class UserCreateResponse(BaseModel):
    user: UserResponse
    temporary_password: str

class UserUpdate(BaseModel):
    email: Optional[str] = Field(None, min_length=1)

    @field_validator("email")
    @classmethod
    def check_email(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return email_validator(v)
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
    status: str
    must_change_password: bool
    created_at: datetime
    roles: List[RoleResponse] = []
    permissions: List[PermissionResponse] = []

    class Config:
        from_attributes = True

class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int
    page: int
    page_size: int

class UserPasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=10)
