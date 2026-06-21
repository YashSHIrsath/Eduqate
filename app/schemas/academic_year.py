from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import date, datetime

class AcademicYearBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    start_date: date
    end_date: date
    is_current: bool = False
    status: str = "active"

class AcademicYearCreate(AcademicYearBase):
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Academic Year 2026-2027",
                    "start_date": "2026-06-01",
                    "end_date": "2027-05-31",
                    "is_current": True,
                    "status": "active"
                }
            ]
        }
    }

class AcademicYearUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None
    status: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Academic Year 2026-2027 (Extended)",
                    "start_date": "2026-06-01",
                    "end_date": "2027-06-30",
                    "is_current": True,
                    "status": "active"
                }
            ]
        }
    }

class AcademicYearResponse(AcademicYearBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AcademicYearListResponse(BaseModel):
    items: List[AcademicYearResponse]
    total: int
    page: int
    page_size: int
