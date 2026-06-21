from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class ClassBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    code: str = Field(..., min_length=2, max_length=50)
    department_id: Optional[UUID] = None
    status: str = "active"

class ClassCreate(ClassBase):
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Class 10",
                    "code": "C10",
                    "department_id": "00000000-0000-0000-0000-000000000000",
                    "status": "active"
                }
            ]
        }
    }

class ClassUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    code: Optional[str] = Field(None, min_length=2, max_length=50)
    department_id: Optional[UUID] = None
    status: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Class 10 - High School",
                    "code": "C10-HS",
                    "department_id": None,
                    "status": "active"
                }
            ]
        }
    }

class ClassResponse(ClassBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ClassListResponse(BaseModel):
    items: List[ClassResponse]
    total: int
    page: int
    page_size: int

class ClassSubjectAssign(BaseModel):
    subject_ids: List[UUID]
    academic_year_id: UUID

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "subject_ids": [
                        "00000000-0000-0000-0000-000000000000",
                        "11111111-1111-1111-1111-111111111111"
                    ],
                    "academic_year_id": "22222222-2222-2222-2222-222222222222"
                }
            ]
        }
    }
