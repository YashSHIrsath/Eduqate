from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class DepartmentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    code: str = Field(..., min_length=2, max_length=50)
    description: Optional[str] = None
    status: str = "active"

class DepartmentCreate(DepartmentBase):
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Science Department",
                    "code": "SCI",
                    "description": "Responsible for physics, chemistry, biology and general sciences.",
                    "status": "active"
                }
            ]
        }
    }

class DepartmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    code: Optional[str] = Field(None, min_length=2, max_length=50)
    description: Optional[str] = None
    status: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Department of Natural Sciences",
                    "code": "NATSCI",
                    "description": "Consolidated natural sciences faculty.",
                    "status": "active"
                }
            ]
        }
    }

class DepartmentResponse(DepartmentBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DepartmentListResponse(BaseModel):
    items: List[DepartmentResponse]
    total: int
    page: int
    page_size: int
