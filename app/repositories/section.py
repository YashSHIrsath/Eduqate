from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc, or_
from app.repositories.base import BaseRepository
from app.models.section import Section

class SectionRepository(BaseRepository[Section]):
    def __init__(self, db: Session):
        super().__init__(db, Section)

    def get_by_id_tenant(self, id: UUID, organization_id: UUID) -> Optional[Section]:
        return self.db.query(Section).filter(
            Section.id == id,
            Section.organization_id == organization_id,
            Section.deleted_at == None
        ).first()

    def get_by_code_class(self, code: str, class_id: UUID, organization_id: UUID) -> Optional[Section]:
        return self.db.query(Section).filter(
            Section.code == code,
            Section.class_id == class_id,
            Section.organization_id == organization_id,
            Section.deleted_at == None
        ).first()

    def get_paginated(
        self,
        organization_id: UUID,
        class_id: Optional[UUID] = None,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Tuple[List[Section], int]:
        query = self.db.query(Section).filter(
            Section.organization_id == organization_id,
            Section.deleted_at == None
        )

        if class_id:
            query = query.filter(Section.class_id == class_id)

        if search:
            query = query.filter(
                or_(
                    Section.name.ilike(f"%{search}%"),
                    Section.code.ilike(f"%{search}%")
                )
            )

        if status:
            query = query.filter(Section.status == status)

        total_count = query.count()

        sort_col = getattr(Section, sort_by, Section.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(asc(sort_col))

        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        return items, total_count
