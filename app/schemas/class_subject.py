from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class ClassSubjectResponse(BaseModel):
    id: UUID
    organization_id: UUID
    class_id: UUID
    subject_id: UUID
    academic_year_id: UUID
    status: str
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True
