from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.constants import PersonaType
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.repositories.permission import PermissionRepository


class RequiresPermission:
    """
    Gate 2 — enforces a named permission on the current user.
    Checks the union of role-inherited and direct permissions.
    """
    def __init__(self, permission: str):
        self.permission = permission

    def __call__(
        self,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        # Super admins have unrestricted access — bypass all permission checks
        if current_user.persona_type == PersonaType.SUPER_ADMIN.value:
            return current_user

        perm_repo = PermissionRepository(db)
        perm_names = {p.name for p in perm_repo.get_user_permissions(current_user.id)}

        if self.permission not in perm_names:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required permission: '{self.permission}'.",
            )
        return current_user


class RequiresPersona:
    """
    Gate 1 — enforces that the current user belongs to one of the allowed personas.
    Applied at the router/prefix level before any permission check.
    """
    def __init__(self, *allowed: PersonaType):
        self.allowed = {p.value for p in allowed}

    def __call__(
        self,
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.persona_type not in self.allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: your account does not have access to this portal.",
            )
        return current_user
