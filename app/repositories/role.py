from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.role import Role
from app.models.user import User

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

    def update_user_roles(self, user_id: UUID, role_ids: List[UUID], organization_id: Optional[UUID] = None) -> bool:
        """Replace a user's roles with the provided list of role IDs."""
        user = self.db.query(User).filter(User.id == user_id, User.deleted_at == None).first()
        if not user:
            return False

        # If organization_id is provided, verify user belongs to it
        if organization_id and user.organization_id != organization_id:
            return False

        query = self.db.query(Role).filter(
            Role.id.in_(role_ids),
            Role.deleted_at == None
        )
        if organization_id:
            query = query.filter(Role.organization_id == organization_id)

        roles = query.all()
        # Verify all provided role_ids were successfully resolved
        if len(roles) != len(role_ids):
            return False

        user.roles = roles
        self.db.commit()
        self.db.refresh(user)
        return True

