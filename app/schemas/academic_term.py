from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import date, datetime

class AcademicTermBase(BaseModel):
    academic_year_id: UUID
    name: str = Field(..., min_length=2, max_length=100)
    start_date: date
    end_date: date
    is_active: bool = False
    status: str = "active"

class AcademicTermCreate(AcademicTermBase):
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "academic_year_id": "00000000-0000-0000-0000-000000000000",
                    "name": "Term 1",
                    "start_date": "2026-06-01",
                    "end_date": "2026-09-30",
                    "is_active": True,
                    "status": "active"
                }
            ]
        }
    }

class AcademicTermUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None
    status: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Term 1 (Extended)",
                    "start_date": "2026-06-01",
                    "end_date": "2026-10-15",
                    "is_active": True,
                    "status": "active"
                }
            ]
        }
    }

class AcademicTermResponse(AcademicTermBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AcademicTermListResponse(BaseModel):
    items: List[AcademicTermResponse]
    total: int
    page: int
    page_size: int
