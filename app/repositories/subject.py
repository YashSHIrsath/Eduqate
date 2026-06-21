from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc, or_
from app.repositories.base import BaseRepository
from app.models.subject import Subject

class SubjectRepository(BaseRepository[Subject]):
    def __init__(self, db: Session):
        super().__init__(db, Subject)

    def get_by_id_tenant(self, id: UUID, organization_id: UUID) -> Optional[Subject]:
        return self.db.query(Subject).filter(
            Subject.id == id,
            Subject.organization_id == organization_id,
            Subject.deleted_at == None
        ).first()

    def get_by_code_tenant(self, code: str, organization_id: UUID) -> Optional[Subject]:
        return self.db.query(Subject).filter(
            Subject.code == code,
            Subject.organization_id == organization_id,
            Subject.deleted_at == None
        ).first()

    def get_paginated(
        self,
        organization_id: UUID,
        department_id: Optional[UUID] = None,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Tuple[List[Subject], int]:
        query = self.db.query(Subject).filter(
            Subject.organization_id == organization_id,
            Subject.deleted_at == None
        )

        if department_id:
            query = query.filter(Subject.department_id == department_id)

        if search:
            query = query.filter(
                or_(
                    Subject.name.ilike(f"%{search}%"),
                    Subject.code.ilike(f"%{search}%")
                )
            )

        if status:
            query = query.filter(Subject.status == status)

        total_count = query.count()

        sort_col = getattr(Subject, sort_by, Subject.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(asc(sort_col))

        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        return items, total_count
