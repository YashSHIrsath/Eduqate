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
        """Retrieve a role by name, optionally scoped to an organization."""
        query = self.db.query(Role).filter(
            Role.name == name,
            Role.deleted_at == None,
        )
        if organization_id:
            query = query.filter(Role.organization_id == organization_id)
        return query.first()

    def update_user_roles(
        self,
        user_id: UUID,
        role_ids: List[UUID],
        organization_id: Optional[UUID] = None,
    ) -> bool:
        """
        Replace a user's roles with the provided list of role IDs.

        Enforces persona consistency: every role assigned must carry the same
        persona_type as the target user. Cross-persona assignments are rejected.
        """
        user = self.db.query(User).filter(
            User.id == user_id,
            User.deleted_at == None,
        ).first()
        if not user:
            return False

        if organization_id and user.organization_id != organization_id:
            return False

        query = self.db.query(Role).filter(
            Role.id.in_(role_ids),
            Role.deleted_at == None,
        )
        if organization_id:
            query = query.filter(Role.organization_id == organization_id)

        roles = query.all()

        # All requested role IDs must resolve
        if len(roles) != len(role_ids):
            return False

        # Enforce persona consistency: no role may have a different persona_type than the user
        mismatched = [r.name for r in roles if r.persona_type != user.persona_type]
        if mismatched:
            raise ValueError(
                f"Cross-persona assignment rejected. "
                f"User persona is '{user.persona_type}' but the following roles belong to a "
                f"different persona: {', '.join(mismatched)}."
            )

        user.roles = roles
        self.db.commit()
        self.db.refresh(user)
        return True
