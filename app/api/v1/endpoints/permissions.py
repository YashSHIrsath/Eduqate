from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, List

from app.core.database import get_db
from app.dependencies.permissions import RequiresPermission
from app.models.user import User
from app.models.permission import Permission
from app.schemas.permission import PermissionResponse
from app.repositories.permission import PermissionRepository

router = APIRouter(prefix="/permissions", tags=["Permission Management"])

@router.get("/", response_model=Dict[str, List[PermissionResponse]])
def list_permissions(
    current_user: User = Depends(RequiresPermission("permissions:view")),
    db: Session = Depends(get_db)
):
    perm_repo = PermissionRepository(db)
    # Get all active permissions from repository
    perms = db.query(Permission).filter(Permission.deleted_at == None).all()

    # Group permissions by category
    grouped_permissions: Dict[str, List[Permission]] = {}
    for perm in perms:
        category = perm.category or "General"
        if category not in grouped_permissions:
            grouped_permissions[category] = []
        grouped_permissions[category].append(perm)

    return grouped_permissions
