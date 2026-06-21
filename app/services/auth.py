import uuid
from uuid import UUID
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.repositories.user import UserRepository
from app.repositories.refresh_token import RefreshTokenRepository
from app.repositories.organization import OrganizationRepository
from app.repositories.audit_log import AuditLogRepository
from app.repositories.permission import PermissionRepository
from app.services.password import PasswordService
from app.services.token import TokenService


from app.models.user import User
from app.models.organization import Organization
from app.models.refresh_token import RefreshToken
from app.core.constants import PersonaType

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
        super_admin_role = None
        
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

            # Seed permissions and default Super Admin role using seeders
            from app.seeders.permissions import seed_permissions
            from app.seeders.roles import seed_system_roles
            from app.models.seed_version import SeedVersion

            seed_permissions(self.db)
            super_admin_role = seed_system_roles(self.db, org.id)

            # Record seed version 1 as applied
            if not self.db.query(SeedVersion).filter(SeedVersion.version == 1).first():
                record = SeedVersion(
                    version=1,
                    name="Initial permissions & Super Admin role setup"
                )
                self.db.add(record)
                self.db.commit()
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
            # First user bootstrapped via /auth/register is always the platform Super Admin
            persona_type=PersonaType.SUPER_ADMIN,
            organization_id=org.id,
            status="active",
        )
        
        # If this is the first user, assign them to the Super Admin role
        if super_admin_role:
            user.roles.append(super_admin_role)

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
            raise ValueError("Invalid email or password.")

        # 2. Retrieve user
        user = self.user_repo.get_by_email(email, organization_id=org.id)
        if not user:
            # Audit failed login attempt (user not found)
            self.audit_repo.log_action(
                user_id=None,
                organization_id=org.id,
                action="user.failed_login",
                ip_address=ip_address,
                user_agent=user_agent,
                request_id=request_id,
                payload={"email": email}
            )
            raise ValueError("Invalid email or password.")

        # 3. Check Lockout status
        now = datetime.now(timezone.utc)
        if user.locked_until and user.locked_until > now:
            lockout_time_left = int((user.locked_until - now).total_seconds() / 60)
            raise ValueError("Account is temporarily locked. Please try again later.")

        # 4. Verify password
        is_valid = self.password_service.verify_password(password, user.hashed_password)
        if not is_valid:
            # Increment failed attempts and lockout if limit reached (5 attempts)
            self.user_repo.increment_failed_attempts(user)
            if user.failed_login_attempts >= 5:
                self.user_repo.lock_account(user, duration_minutes=15)
                # Audit lockout event
                self.audit_repo.log_action(
                    user_id=user.id,
                    organization_id=org.id,
                    action="user.locked_out",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    request_id=request_id
                )
                raise ValueError("Account is temporarily locked. Please try again later.")
            
            # Audit failed login attempt (incorrect password)
            self.audit_repo.log_action(
                user_id=user.id,
                organization_id=org.id,
                action="user.failed_login",
                ip_address=ip_address,
                user_agent=user_agent,
                request_id=request_id
            )
            raise ValueError("Invalid email or password.")

        if user.status == "suspended":
            raise ValueError("Account has been suspended.")
        if user.status == "inactive":
            raise ValueError("Account is inactive. Contact your administrator.")
        if user.status != "active":
            raise ValueError("Account is inactive. Contact your administrator.")

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

    def get_bootstrap_data(
        self,
        user: User,
        ip_address: str,
        user_agent: str,
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieves bootstrap metadata for the current user (user details, roles, organization, permissions)
        and writes an audit log.
        """
        perm_repo = PermissionRepository(self.db)
        effective_perms = perm_repo.get_user_permissions(user.id)

        # Log audit trail
        self.audit_repo.log_action(
            user_id=user.id,
            organization_id=user.organization_id,
            action="user.bootstrap",
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id
        )

        return {
            "user": user,
            "organization": user.organization,
            "roles": user.roles,
            "permissions": effective_perms
        }

    def get_effective_permissions(
        self,
        user: User,
        ip_address: str,
        user_agent: str,
        request_id: Optional[str] = None
    ) -> List[str]:
        """
        Retrieves effective permission strings for the current user
        and writes an audit log.
        """
        perm_repo = PermissionRepository(self.db)
        effective_perms = perm_repo.get_user_permissions(user.id)
        perm_names = [p.name for p in effective_perms]

        # Log audit trail
        self.audit_repo.log_action(
            user_id=user.id,
            organization_id=user.organization_id,
            action="user.view_permissions",
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id
        )

        return perm_names

    def change_user_password(
        self,
        user_id: UUID,
        current_password: str,
        new_password: str,
        ip_address: str,
        user_agent: str,
        request_id: Optional[str] = None
    ) -> bool:
        """Verify current credentials, validate strength, hash, and update user password."""
        user = self.user_repo.get(user_id)
        if not user or user.status != "active":
            raise ValueError("User not found or inactive.")

        # Verify current password
        if not self.password_service.verify_password(current_password, user.hashed_password):
            raise ValueError("Incorrect current password.")

        # Validate new password strength
        if not self.password_service.validate_password_strength(new_password):
            raise ValueError(
                "New password must be at least 10 characters long, and contain "
                "at least one lowercase, one uppercase, one digit, and one special character."
            )

        # Hash and update
        user.hashed_password = self.password_service.hash_password(new_password)
        user.must_change_password = False
        user.last_password_change_at = datetime.now(timezone.utc)
        self.db.commit()

        # Revoke all other sessions for security
        self.token_repo.revoke_all_user_tokens(user_id)

        # Log action
        self.audit_repo.log_action(
            user_id=user_id,
            organization_id=user.organization_id,
            action="user.password_changed",
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id
        )
        return True


