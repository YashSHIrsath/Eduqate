from typing import Optional
from uuid import UUID
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.user import User

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
