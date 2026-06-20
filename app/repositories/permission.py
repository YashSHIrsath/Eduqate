from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.permission import Permission
from app.models.role import Role
from app.models.user import User

class PermissionRepository(BaseRepository[Permission]):
    def __init__(self, db: Session):
        super().__init__(db, Permission)

    def get_by_name(self, name: str) -> Optional[Permission]:
        """Retrieve a global system permission by name."""
        return self.db.query(Permission).filter(
            Permission.name == name,
            Permission.deleted_at == None
        ).first()

    def get_user_permissions(self, user_id: UUID) -> List[Permission]:
        """
        Retrieve all permissions for a user.
        Calculates the union of permissions inherited from roles AND permissions directly assigned.
        """
        # Query role permissions
        role_perms = self.db.query(Permission).join(
            Permission.roles
        ).join(
            Role.users
        ).filter(
            User.id == user_id,
            Permission.deleted_at == None,
            Role.deleted_at == None
        )

        # Query direct user permissions
        direct_perms = self.db.query(Permission).join(
            Permission.users
        ).filter(
            User.id == user_id,
            Permission.deleted_at == None
        )

        # Return combined unique permissions list
        return list(set(role_perms.all() + direct_perms.all()))

    def get_role_permissions(self, role_id: UUID) -> List[Permission]:
        """Retrieve all permissions mapped to a specific role."""
        role = self.db.query(Role).filter(
            Role.id == role_id,
            Role.deleted_at == None
        ).first()
        if not role:
            return []
        return [p for p in role.permissions if p.deleted_at is None]

    def assign_permission(self, target_id: UUID, permission_id: UUID, is_role: bool = True) -> bool:
        """
        Assign a permission directly to a Role or a User.
        """
        permission = self.get(permission_id)
        if not permission:
            return False

        if is_role:
            role = self.db.query(Role).filter(Role.id == target_id, Role.deleted_at == None).first()
            if role and permission not in role.permissions:
                role.permissions.append(permission)
                self.db.commit()
                return True
        else:
            user = self.db.query(User).filter(User.id == target_id, User.deleted_at == None).first()
            if user and permission not in user.permissions:
                user.permissions.append(permission)
                self.db.commit()
                return True
        return False

    def remove_permission(self, target_id: UUID, permission_id: UUID, is_role: bool = True) -> bool:
        """
        Remove a permission assignment from a Role or a User.
        """
        permission = self.get(permission_id)
        if not permission:
            return False

        if is_role:
            role = self.db.query(Role).filter(Role.id == target_id, Role.deleted_at == None).first()
            if role and permission in role.permissions:
                role.permissions.remove(permission)
                self.db.commit()
                return True
        else:
            user = self.db.query(User).filter(User.id == target_id, User.deleted_at == None).first()
            if user and permission in user.permissions:
                user.permissions.remove(permission)
                self.db.commit()
                return True
        return False

    def update_role_permissions(self, role_id: UUID, permission_ids: List[UUID]) -> bool:
        """Replace the current permissions of a role with the provided list of permission IDs."""
        role = self.db.query(Role).filter(Role.id == role_id, Role.deleted_at == None).first()
        if not role:
            return False

        # Fetch permissions
        permissions = self.db.query(Permission).filter(
            Permission.id.in_(permission_ids),
            Permission.deleted_at == None
        ).all()

        role.permissions = permissions
        self.db.commit()
        self.db.refresh(role)
        return True

    def update_user_permissions(self, user_id: UUID, permission_ids: List[UUID]) -> bool:
        """Replace direct permissions of a user with the provided list of permission IDs."""
        user = self.db.query(User).filter(User.id == user_id, User.deleted_at == None).first()
        if not user:
            return False

        # Fetch permissions
        permissions = self.db.query(Permission).filter(
            Permission.id.in_(permission_ids),
            Permission.deleted_at == None
        ).all()

        user.permissions = permissions
        self.db.commit()
        self.db.refresh(user)
        return True

