from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.repositories.permission import PermissionRepository

class RequiresPermission:
    """
    A reusable FastAPI dependency that enforces a required permission
    by verifying the current user's role-inherited and direct permissions.
    """
    def __init__(self, permission: str):
        self.permission = permission

    def __call__(
        self,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        perm_repo = PermissionRepository(db)
        user_perms = perm_repo.get_user_permissions(current_user.id)
        perm_names = {p.name for p in user_perms}
        
        if self.permission not in perm_names:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required permission: '{self.permission}'."
            )
        return current_user
