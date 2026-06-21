from typing import Optional, List, Tuple
from uuid import UUID
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import asc, desc, or_
from app.repositories.base import BaseRepository
from app.models.user import User
from app.models.role import Role

class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(db, User)

    def get_by_email(self, email: str, organization_id: Optional[UUID] = None) -> Optional[User]:
        """
        Retrieve user by email, optionally scoped by organization.
        Filters out soft-deleted users.
        """
        query = self.db.query(User).filter(
            User.email == email,
            User.deleted_at == None
        )
        if organization_id:
            query = query.filter(User.organization_id == organization_id)
        return query.first()

    def increment_failed_attempts(self, user: User) -> User:
        """Increment the login failure counter for a user."""
        user.failed_login_attempts += 1
        self.db.commit()
        self.db.refresh(user)
        return user

    def lock_account(self, user: User, duration_minutes: int = 15) -> User:
        """Lock the user's account until the specified time."""
        user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=duration_minutes)
        self.db.commit()
        self.db.refresh(user)
        return user

    def reset_failed_attempts(self, user: User) -> User:
        """Clear login failure stats and unlock the user."""
        user.failed_login_attempts = 0
        user.locked_until = None
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_paginated_users(
        self,
        organization_id: UUID,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        status: Optional[str] = None,
        persona_type: Optional[str] = None,
        role_id: Optional[UUID] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Tuple[List[User], int]:
        """Retrieve paginated and filtered users for an organization."""
        query = self.db.query(User).filter(
            User.organization_id == organization_id,
            User.deleted_at == None
        )

        if search:
            query = query.filter(
                or_(
                    User.email.ilike(f"%{search}%"),
                    User.full_name.ilike(f"%{search}%")
                )
            )

        if status:
            query = query.filter(User.status == status)

        if persona_type:
            query = query.filter(User.persona_type == persona_type)

        if role_id:
            query = query.filter(User.roles.any(Role.id == role_id))

        # Total count matching criteria
        total_count = query.count()

        # Dynamic sorting
        sort_col = getattr(User, sort_by, User.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(asc(sort_col))

        # Apply offset and limit
        offset = (page - 1) * page_size
        users = query.options(joinedload(User.roles)).offset(offset).limit(page_size).all()

        return users, total_count

    def get_persona_counts(self, organization_id: UUID) -> dict:
        """Returns user count breakdown by persona for summary cards."""
        from sqlalchemy import func
        results = self.db.query(User.persona_type, func.count(User.id)).filter(
            User.organization_id == organization_id,
            User.deleted_at == None
        ).group_by(User.persona_type).all()
        
        counts = {r[0]: r[1] for r in results}
        return {
            "total": sum(counts.values()),
            "super_admin": counts.get("super_admin", 0),
            "headmaster": counts.get("headmaster", 0),
            "teacher": counts.get("teacher", 0),
            "student": counts.get("student", 0)
        }

