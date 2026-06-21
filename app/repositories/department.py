from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc, or_
from app.repositories.base import BaseRepository
from app.models.department import Department

class DepartmentRepository(BaseRepository[Department]):
    def __init__(self, db: Session):
        super().__init__(db, Department)

    def get_by_id_tenant(self, id: UUID, organization_id: UUID) -> Optional[Department]:
        return self.db.query(Department).filter(
            Department.id == id,
            Department.organization_id == organization_id,
            Department.deleted_at == None
        ).first()

    def get_by_code_tenant(self, code: str, organization_id: UUID) -> Optional[Department]:
        return self.db.query(Department).filter(
            Department.code == code,
            Department.organization_id == organization_id,
            Department.deleted_at == None
        ).first()

    def get_paginated(
        self,
        organization_id: UUID,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Tuple[List[Department], int]:
        query = self.db.query(Department).filter(
            Department.organization_id == organization_id,
            Department.deleted_at == None
        )

        if search:
            query = query.filter(
                or_(
                    Department.name.ilike(f"%{search}%"),
                    Department.code.ilike(f"%{search}%")
                )
            )

        if status:
            query = query.filter(Department.status == status)

        total_count = query.count()

        sort_col = getattr(Department, sort_by, Department.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(asc(sort_col))

        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        return items, total_count
