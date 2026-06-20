from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.role import Role

class RoleRepository(BaseRepository[Role]):
    def __init__(self, db: Session):
        super().__init__(db, Role)

    def get_by_name(self, name: str, organization_id: Optional[UUID] = None) -> Optional[Role]:
        """
        Retrieve role by name, optionally filtered by organization.
        Filters out soft-deleted roles.
        """
        query = self.db.query(Role).filter(
            Role.name == name,
            Role.deleted_at == None
        )
        if organization_id:
            query = query.filter(Role.organization_id == organization_id)
        return query.first()
