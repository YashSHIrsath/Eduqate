from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.schemas.permission import PermissionResponse
from app.core.constants import PersonaType


class RoleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=255)


class RoleCreate(RoleBase):
    persona_type: PersonaType

    @field_validator("persona_type", mode="before")
    @classmethod
    def validate_persona(cls, v: str) -> str:
        valid = {p.value for p in PersonaType}
        if v not in valid:
            raise ValueError(f"Invalid persona_type '{v}'. Must be one of: {', '.join(valid)}.")
        return v


class RoleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=255)


class RoleResponse(BaseModel):
    id: UUID
    organization_id: Optional[UUID]
    name: str
    description: Optional[str] = None
    persona_type: str
    is_system_role: bool
    created_at: datetime
    updated_at: datetime
    permissions: List[PermissionResponse] = []

    class Config:
        from_attributes = True


class RolePermissionAssign(BaseModel):
    permission_ids: List[UUID]


class UserRoleAssign(BaseModel):
    role_ids: List[UUID]
