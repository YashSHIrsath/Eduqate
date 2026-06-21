from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc, or_
from app.repositories.base import BaseRepository
from app.models.class_model import Class

class ClassRepository(BaseRepository[Class]):
    def __init__(self, db: Session):
        super().__init__(db, Class)

    def get_by_id_tenant(self, id: UUID, organization_id: UUID) -> Optional[Class]:
        return self.db.query(Class).filter(
            Class.id == id,
            Class.organization_id == organization_id,
            Class.deleted_at == None
        ).first()

    def get_by_code_tenant(self, code: str, organization_id: UUID) -> Optional[Class]:
        return self.db.query(Class).filter(
            Class.code == code,
            Class.organization_id == organization_id,
            Class.deleted_at == None
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
    ) -> Tuple[List[Class], int]:
        query = self.db.query(Class).filter(
            Class.organization_id == organization_id,
            Class.deleted_at == None
        )

        if department_id:
            query = query.filter(Class.department_id == department_id)

        if search:
            query = query.filter(
                or_(
                    Class.name.ilike(f"%{search}%"),
                    Class.code.ilike(f"%{search}%")
                )
            )

        if status:
            query = query.filter(Class.status == status)

        total_count = query.count()

        sort_col = getattr(Class, sort_by, Class.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(asc(sort_col))

        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        return items, total_count
