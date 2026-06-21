from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc
from app.repositories.base import BaseRepository
from app.models.academic_year import AcademicYear

class AcademicYearRepository(BaseRepository[AcademicYear]):
    def __init__(self, db: Session):
        super().__init__(db, AcademicYear)

    def get_by_id_tenant(self, id: UUID, organization_id: UUID) -> Optional[AcademicYear]:
        return self.db.query(AcademicYear).filter(
            AcademicYear.id == id,
            AcademicYear.organization_id == organization_id,
            AcademicYear.deleted_at == None
        ).first()

    def get_paginated(
        self,
        organization_id: UUID,
        page: int = 1,
        page_size: int = 10,
        status: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Tuple[List[AcademicYear], int]:
        query = self.db.query(AcademicYear).filter(
            AcademicYear.organization_id == organization_id,
            AcademicYear.deleted_at == None
        )

        if status:
            query = query.filter(AcademicYear.status == status)

        total_count = query.count()

        sort_col = getattr(AcademicYear, sort_by, AcademicYear.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(asc(sort_col))

        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        return items, total_count

    def clear_current_flags(self, organization_id: UUID) -> None:
        """Clear is_current = True flag for all academic years of the organization."""
        self.db.query(AcademicYear).filter(
            AcademicYear.organization_id == organization_id,
            AcademicYear.is_current == True
        ).update({"is_current": False})
        self.db.commit()
