from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID


class PermissionResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    category: str
    is_system_permission: bool

    class Config:
        from_attributes = True

class UserPermissionAssign(BaseModel):
    permission_ids: List[UUID]

