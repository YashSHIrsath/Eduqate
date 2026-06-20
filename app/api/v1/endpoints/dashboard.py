from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.role import Role
from app.models.permission import Permission

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


class DashboardStatsResponse(BaseModel):
    total_users: int
    active_users: int
    roles: int
    permissions: int


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns aggregate statistics for the current user's organization.
    Uses count queries for efficiency rather than loading full rows.
    """
    org_id = current_user.organization_id

    total_users = db.query(func.count(User.id)).filter(
        User.organization_id == org_id,
        User.deleted_at == None
    ).scalar() or 0

    active_users = db.query(func.count(User.id)).filter(
        User.organization_id == org_id,
        User.status == "active",
        User.deleted_at == None
    ).scalar() or 0

    roles_count = db.query(func.count(Role.id)).filter(
        Role.organization_id == org_id,
        Role.deleted_at == None
    ).scalar() or 0

    permissions_count = db.query(func.count(Permission.id)).filter(
        Permission.deleted_at == None
    ).scalar() or 0

    return DashboardStatsResponse(
        total_users=total_users,
        active_users=active_users,
        roles=roles_count,
        permissions=permissions_count
    )
