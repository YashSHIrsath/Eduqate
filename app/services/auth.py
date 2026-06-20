import uuid
from uuid import UUID
from typing import Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.repositories.user import UserRepository
from app.repositories.refresh_token import RefreshTokenRepository
from app.repositories.organization import OrganizationRepository
from app.repositories.audit_log import AuditLogRepository
from app.services.password import PasswordService
from app.services.token import TokenService

from app.models.user import User
from app.models.organization import Organization
from app.models.refresh_token import RefreshToken

class AuthService:
    def __init__(
        self,
        db: Session,
        user_repo: UserRepository,
        token_repo: RefreshTokenRepository,
        org_repo: OrganizationRepository,
        audit_repo: AuditLogRepository,
        password_service: PasswordService,
        token_service: TokenService
    ):
        self.db = db
        self.user_repo = user_repo
        self.token_repo = token_repo
        self.org_repo = org_repo
        self.audit_repo = audit_repo
        self.password_service = password_service
        self.token_service = token_service

    def register_user(
        self,
        email: str,
        password: str,
        organization_slug: Optional[str] = None,
        organization_name: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        request_id: Optional[str] = None
    ) -> User:
        """
        Registers a new user under an organization.
        Handles first-user onboarding and organization resolution.
        """
        # 1. Validate password strength
        if not self.password_service.validate_password_strength(password):
            raise ValueError(
                "Password must be at least 10 characters long, and contain "
                "at least one lowercase, one uppercase, one digit, and one special character."
            )

        # 2. Onboarding check: check if database contains any organizations
        first_org = self.org_repo.get_first()
        
        if not first_org:
            # Create default organization for onboarding
            name = organization_name or "Default Academy"
            slug = organization_slug or "default-academy"
            org = Organization(
                name=name,
                code="SYS-01",
                slug=slug,
                status="active"
            )
            self.org_repo.create(org)
        else:
            # Resolve organization by slug
            if not organization_slug:
                raise ValueError("organization_slug is required.")
            org = self.org_repo.get_by_slug(organization_slug)
            if not org:
                raise ValueError("Organization not found.")
            if org.status != "active":
                raise ValueError("Organization is inactive.")

        # 3. Check duplicate user email within the organization
        existing_user = self.user_repo.get_by_email(email, organization_id=org.id)
        if existing_user:
            raise ValueError("Email already registered under this organization.")

        # 4. Hash password and save User
        hashed_password = self.password_service.hash_password(password)
        user = User(
            email=email,
            hashed_password=hashed_password,
            organization_id=org.id,
            status="active"
        )
        created_user = self.user_repo.create(user)

        # 5. Persist audit log
        self.audit_repo.log_action(
            user_id=created_user.id,
            organization_id=org.id,
            action="user.registered",
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id,
            payload={"email": email}
        )

        return created_user

    def login_user(
        self,
        email: str,
        password: str,
        organization_slug: str,
        ip_address: str,
        user_agent: str,
        device_name: Optional[str] = None,
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Verifies login credentials, handles account lockouts, generates session tokens, and audits actions.
        """
        # 1. Resolve organization
        org = self.org_repo.get_by_slug(organization_slug)
        if not org or org.status != "active":
            raise ValueError("Invalid credentials.") # Generic error to avoid user/org enumeration

        # 2. Retrieve user
        user = self.user_repo.get_by_email(email, organization_id=org.id)
        if not user:
            raise ValueError("Invalid credentials.")

        # 3. Check Lockout status
        now = datetime.now(timezone.utc)
        if user.locked_until and user.locked_until > now:
            lockout_time_left = int((user.locked_until - now).total_seconds() / 60)
            raise ValueError(f"Account is locked due to too many failed attempts. Try again in {lockout_time_left} minutes.")

        # 4. Verify password
        is_valid = self.password_service.verify_password(password, user.hashed_password)
        if not is_valid:
            # Increment failed attempts and lockout if limit reached (5 attempts)
            self.user_repo.increment_failed_attempts(user)
            if user.failed_login_attempts >= 5:
                self.user_repo.lock_account(user, duration_minutes=15)
                raise ValueError("Account locked due to too many failed attempts. Try again in 15 minutes.")
            raise ValueError("Invalid credentials.")

        if user.status != "active":
            raise ValueError("User account is disabled.")

        # 5. Login successful: reset failed attempts
        self.user_repo.reset_failed_attempts(user)
        user.last_login_at = now
        self.db.commit()

        # 6. Generate Session
        session_id = uuid.uuid4()
        raw_refresh_token = self.token_service.generate_raw_refresh_token()
        token_hash = self.token_service.hash_token(raw_refresh_token)
        
        # Save Refresh Token
        expires_at = now + timedelta(days=7)
        db_token = RefreshToken(
            id=session_id,
            user_id=user.id,
            token_hash=token_hash,
            device_name=device_name,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=expires_at,
            is_revoked=False
        )
        self.token_repo.create(db_token)

        # Generate Access Token with sid claim linked to session_id
        access_token = self.token_service.create_access_token(
            subject=str(user.id),
            organization_id=str(org.id),
            session_id=str(session_id)
        )

        # 7. Write audit log
        self.audit_repo.log_action(
            user_id=user.id,
            organization_id=org.id,
            action="user.login",
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id
        )

        return {
            "access_token": access_token,
            "refresh_token": raw_refresh_token,
            "token_type": "bearer"
        }

    def refresh_session(
        self,
        raw_refresh_token: str,
        ip_address: str,
        user_agent: str,
        device_name: Optional[str] = None,
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes Refresh Token Rotation (RTR). Validates refresh token and handles replay attacks.
        """
        token_hash = self.token_service.hash_token(raw_refresh_token)
        db_token = self.token_repo.get_by_hash(token_hash)
        
        # Validate existance and expiry
        now = datetime.now(timezone.utc)
        if not db_token or db_token.expires_at < now:
            raise ValueError("Invalid or expired session.")

        # Replay Attack Detection: If token is already revoked, instantly revoke ALL sessions for this user
        if db_token.is_revoked:
            revoked_count = self.token_repo.revoke_all_user_tokens(db_token.user_id)
            self.audit_repo.log_action(
                user_id=db_token.user_id,
                organization_id=None,
                action="token.replay_attack",
                ip_address=ip_address,
                user_agent=user_agent,
                request_id=request_id,
                payload={"revoked_sessions_count": revoked_count}
            )
            raise ValueError("Invalid or expired session.")

        # Resolve user
        user = self.user_repo.get(db_token.user_id)
        if not user or user.status != "active":
            raise ValueError("Invalid or expired session.")

        # Rotate Token:
        # 1. Revoke the old token
        self.token_repo.revoke_token(token_hash)
        
        # 2. Create new session Refresh Token
        new_session_id = uuid.uuid4()
        new_raw_refresh = self.token_service.generate_raw_refresh_token()
        new_token_hash = self.token_service.hash_token(new_raw_refresh)
        
        expires_at = now + timedelta(days=7)
        new_db_token = RefreshToken(
            id=new_session_id,
            user_id=user.id,
            token_hash=new_token_hash,
            device_name=device_name or db_token.device_name,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=expires_at,
            is_revoked=False
        )
        self.token_repo.create(new_db_token)

        # 3. Create new Access Token
        access_token = self.token_service.create_access_token(
            subject=str(user.id),
            organization_id=str(user.organization_id),
            session_id=str(new_session_id)
        )

        # 4. Log action
        self.audit_repo.log_action(
            user_id=user.id,
            organization_id=user.organization_id,
            action="token.refreshed",
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id
        )

        return {
            "access_token": access_token,
            "refresh_token": new_raw_refresh,
            "token_type": "bearer"
        }

    def logout_session(
        self,
        raw_refresh_token: str,
        ip_address: str,
        user_agent: str,
        request_id: Optional[str] = None
    ) -> bool:
        """
        Revokes a single active session token (standard logout).
        """
        token_hash = self.token_service.hash_token(raw_refresh_token)
        db_token = self.token_repo.get_by_hash(token_hash)
        if not db_token or db_token.is_revoked:
            return False

        # Revoke token
        self.token_repo.revoke_token(token_hash)

        # Log logout action
        self.audit_repo.log_action(
            user_id=db_token.user_id,
            organization_id=None,
            action="user.logout",
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id
        )
        return True

    def logout_all_sessions(
        self,
        user_id: UUID,
        ip_address: str,
        user_agent: str,
        request_id: Optional[str] = None
    ) -> int:
        """
        Revokes all active sessions for a user (logout all devices).
        """
        revoked_count = self.token_repo.revoke_all_user_tokens(user_id)
        
        # Log action
        self.audit_repo.log_action(
            user_id=user_id,
            organization_id=None,
            action="user.logout_all",
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id,
            payload={"revoked_count": revoked_count}
        )
        return revoked_count
