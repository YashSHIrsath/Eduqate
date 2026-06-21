from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc
from app.repositories.base import BaseRepository
from app.models.academic_term import AcademicTerm

class AcademicTermRepository(BaseRepository[AcademicTerm]):
    def __init__(self, db: Session):
        super().__init__(db, AcademicTerm)

    def get_by_id_tenant(self, id: UUID, organization_id: UUID) -> Optional[AcademicTerm]:
        return self.db.query(AcademicTerm).filter(
            AcademicTerm.id == id,
            AcademicTerm.organization_id == organization_id,
            AcademicTerm.deleted_at == None
        ).first()

    def get_paginated(
        self,
        organization_id: UUID,
        academic_year_id: Optional[UUID] = None,
        page: int = 1,
        page_size: int = 10,
        status: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Tuple[List[AcademicTerm], int]:
        query = self.db.query(AcademicTerm).filter(
            AcademicTerm.organization_id == organization_id,
            AcademicTerm.deleted_at == None
        )

        if academic_year_id:
            query = query.filter(AcademicTerm.academic_year_id == academic_year_id)

        if status:
            query = query.filter(AcademicTerm.status == status)

        total_count = query.count()

        sort_col = getattr(AcademicTerm, sort_by, AcademicTerm.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(asc(sort_col))

        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        return items, total_count

    def get_terms_by_year(self, academic_year_id: UUID) -> List[AcademicTerm]:
        return self.db.query(AcademicTerm).filter(
            AcademicTerm.academic_year_id == academic_year_id,
            AcademicTerm.deleted_at == None
        ).all()
