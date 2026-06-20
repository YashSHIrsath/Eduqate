from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.repositories.user import UserRepository
from app.repositories.refresh_token import RefreshTokenRepository
from app.services.password import PasswordService
from app.services.token import TokenService
from app.models.user import User

class AuthService:
    def __init__(
        self,
        db: Session,
        user_repo: UserRepository,
        token_repo: RefreshTokenRepository,
        password_service: PasswordService,
        token_service: TokenService
    ):
        self.db = db
        self.user_repo = user_repo
        self.token_repo = token_repo
        self.password_service = password_service
        self.token_service = token_service

    def authenticate_user(self, email: str, password: str, organization_id: UUID) -> Optional[User]:
        """
        Skeleton method for user authentication.
        Will manage lockout policies, failed login increments, and verification checks.
        """
        # 1. Fetch user using UserRepository
        user = self.user_repo.get_by_email(email, organization_id=organization_id)
        if not user:
            return None

        # 2. Check if user account is locked
        if user.locked_until and user.locked_until > datetime.now(timezone.utc):
            return None # Locked out

        # 3. Verify password
        is_valid = self.password_service.verify_password(password, user.hashed_password)
        if not is_valid:
            # Increment failed attempts and trigger lockout if limit reached
            self.user_repo.increment_failed_attempts(user)
            if user.failed_login_attempts >= 5:
                self.user_repo.lock_account(user, duration_minutes=15)
            return None

        # 4. Success: reset failed attempts
        self.user_repo.reset_failed_attempts(user)
        return user

    def register_user(self, email: str, password: str, organization_id: UUID) -> User:
        """
        Skeleton method for user registration.
        """
        hashed = self.password_service.hash_password(password)
        # Create new user instance (without committing here to allow service-driven transactions)
        user = User(
            email=email,
            hashed_password=hashed,
            organization_id=organization_id,
            status="active" # Transition to pending_verification in later phases
        )
        return self.user_repo.create(user)

    def refresh_session(self, refresh_token: str, ip_address: str, user_agent: str) -> Dict[str, Any]:
        """
        Skeleton method to handle refresh token rotation (RTR) and validation.
        """
        # Placeholder mapping
        return {
            "access_token": "mocked_new_access_token",
            "refresh_token": "mocked_new_refresh_token"
        }

    def logout_session(self, refresh_token_hash: str) -> bool:
        """
        Skeleton method to revoke a single session refresh token.
        """
        return self.token_repo.revoke_token(refresh_token_hash)

    def logout_all_sessions(self, user_id: UUID) -> int:
        """
        Skeleton method to revoke all active sessions for a user (logout all devices).
        """
        return self.token_repo.revoke_all_user_tokens(user_id)
