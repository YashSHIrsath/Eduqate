from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.schemas.permission import PermissionResponse

class RoleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=255)

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=255)

class RoleResponse(BaseModel):
    id: UUID
    organization_id: Optional[UUID]
    name: str
    description: Optional[str] = None
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

