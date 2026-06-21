from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class TeacherAssignmentBase(BaseModel):
    teacher_id: UUID
    section_id: UUID
    subject_id: UUID
    academic_year_id: UUID
    is_primary: bool = True
    status: str = "active"

class TeacherAssignmentCreate(TeacherAssignmentBase):
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "teacher_id": "00000000-0000-0000-0000-000000000000",
                    "section_id": "11111111-1111-1111-1111-111111111111",
                    "subject_id": "22222222-2222-2222-2222-222222222222",
                    "academic_year_id": "33333333-3333-3333-3333-333333333333",
                    "is_primary": True,
                    "status": "active"
                }
            ]
        }
    }

class TeacherAssignmentUpdate(BaseModel):
    teacher_id: Optional[UUID] = None
    section_id: Optional[UUID] = None
    subject_id: Optional[UUID] = None
    academic_year_id: Optional[UUID] = None
    is_primary: Optional[bool] = None
    status: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "teacher_id": "00000000-0000-0000-0000-000000000000",
                    "section_id": "11111111-1111-1111-1111-111111111111",
                    "subject_id": "22222222-2222-2222-2222-222222222222",
                    "academic_year_id": "33333333-3333-3333-3333-333333333333",
                    "is_primary": False,
                    "status": "active"
                }
            ]
        }
    }

class TeacherAssignmentResponse(TeacherAssignmentBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TeacherAssignmentListResponse(BaseModel):
    items: List[TeacherAssignmentResponse]
    total: int
    page: int
    page_size: int

class TeacherWorkloadResponse(BaseModel):
    teacher_id: UUID
    teacher_name: str
    teacher_email: str
    assignment_count: int
    assignments: List[TeacherAssignmentResponse] = []
