from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class SubjectBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    code: str = Field(..., min_length=2, max_length=50)
    department_id: Optional[UUID] = None
    description: Optional[str] = None
    status: str = "active"

class SubjectCreate(SubjectBase):
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Mathematics",
                    "code": "MATH101",
                    "department_id": "00000000-0000-0000-0000-000000000000",
                    "description": "Foundational algebra, geometry, and calculus.",
                    "status": "active"
                }
            ]
        }
    }

class SubjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    code: Optional[str] = Field(None, min_length=2, max_length=50)
    department_id: Optional[UUID] = None
    description: Optional[str] = None
    status: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Advanced Mathematics",
                    "code": "MATH102",
                    "department_id": None,
                    "description": "Advanced algebraic principles and pre-calculus.",
                    "status": "active"
                }
            ]
        }
    }

class SubjectResponse(SubjectBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SubjectListResponse(BaseModel):
    items: List[SubjectResponse]
    total: int
    page: int
    page_size: int
