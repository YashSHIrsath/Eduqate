from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class SectionBase(BaseModel):
    class_id: UUID
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=2, max_length=50)
    capacity: Optional[int] = Field(None, ge=1, le=1000)
    status: str = "active"

class SectionCreate(SectionBase):
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "class_id": "00000000-0000-0000-0000-000000000000",
                    "name": "Section A",
                    "code": "SEC-A",
                    "capacity": 40,
                    "status": "active"
                }
            ]
        }
    }

class SectionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=2, max_length=50)
    capacity: Optional[int] = Field(None, ge=1, le=1000)
    status: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Section A (Advanced)",
                    "code": "SEC-A-ADV",
                    "capacity": 45,
                    "status": "active"
                }
            ]
        }
    }

class SectionResponse(SectionBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SectionListResponse(BaseModel):
    items: List[SectionResponse]
    total: int
    page: int
    page_size: int
