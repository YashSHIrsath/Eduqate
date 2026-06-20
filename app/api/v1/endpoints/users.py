import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import RequiresPermission
from app.models.user import User
from app.schemas.role import UserRoleAssign
from app.schemas.permission import UserPermissionAssign
from app.schemas.user import (
    UserCreate,
    UserCreateResponse,
    UserUpdate,
    UserStatusUpdate,
    UserDetailResponse,
    UserListResponse,
    UserPasswordChange,
    UserResponse
)
from app.repositories.role import RoleRepository
from app.repositories.permission import PermissionRepository
from app.repositories.user import UserRepository
from app.repositories.refresh_token import RefreshTokenRepository
from app.repositories.audit_log import AuditLogRepository
from app.services.password import PasswordService
from app.services.token import TokenService
from app.services.auth import AuthService

router = APIRouter(prefix="/users", tags=["User Management"])

def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    """Dependency provider for AuthService."""
    return AuthService(
        db=db,
        user_repo=UserRepository(db),
        token_repo=RefreshTokenRepository(db),
        org_repo=RoleRepository(db), # org_repo is not strictly used by profile/permissions but we feed mock/repos
        audit_repo=AuditLogRepository(db),
        password_service=PasswordService(),
        token_service=TokenService()
    )

def get_request_metadata(request: Request):
    """Utility to extract metadata for audit logging."""
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    request_id = request.headers.get("x-request-id") or "unknown"
    return {
        "ip_address": ip_address,
        "user_agent": user_agent,
        "request_id": request_id
    }

def generate_temporary_password(length: int = 12) -> str:
    """Generate a cryptographically secure password meeting policy requirements."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*()-_=+"
    while True:
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        if (any(c.islower() for c in password)
                and any(c.isupper() for c in password)
                and any(c.isdigit() for c in password)
                and any(c in "!@#$%^&*()-_=+" for c in password)):
            return password

@router.get("/", response_model=UserListResponse)
def list_users(
    page: int = 1,
    page_size: int = 10,
    search: Optional[str] = None,
    status: Optional[str] = None,
    role_id: Optional[UUID] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    current_user: User = Depends(RequiresPermission("users:view")),
    db: Session = Depends(get_db)
):
    user_repo = UserRepository(db)
    users, total = user_repo.get_paginated_users(
        organization_id=current_user.organization_id,
        page=page,
        page_size=page_size,
        search=search,
        status=status,
        role_id=role_id,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return {
        "users": users,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/{user_id}", response_model=UserDetailResponse)
def get_user_details(
    user_id: UUID,
    current_user: User = Depends(RequiresPermission("users:view")),
    db: Session = Depends(get_db)
):
    user_repo = UserRepository(db)
    user = user_repo.get(user_id)
    if not user or user.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in organization."
        )
    
    perm_repo = PermissionRepository(db)
    effective_permissions = perm_repo.get_user_permissions(user_id)
    
    return {
        "id": user.id,
        "organization_id": user.organization_id,
        "email": user.email,
        "status": user.status,
        "must_change_password": user.must_change_password,
        "created_at": user.created_at,
        "roles": user.roles,
        "permissions": effective_permissions
    }

@router.post("/", response_model=UserCreateResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    request: Request,
    current_user: User = Depends(RequiresPermission("users:create")),
    db: Session = Depends(get_db)
):
    user_repo = UserRepository(db)
    role_repo = RoleRepository(db)
    audit_repo = AuditLogRepository(db)
    password_service = PasswordService()
    
    # Check duplicate email
    existing_user = user_repo.get_by_email(payload.email, organization_id=current_user.organization_id)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists in the organization."
        )
        
    # Resolve roles and verify organization ownership
    roles = []
    for r_id in payload.role_ids:
        role = role_repo.get(r_id)
        if not role or role.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role ID {r_id} not found in this organization."
            )
        roles.append(role)
        
    # Generate temporary password
    temp_password = generate_temporary_password()
    hashed_password = password_service.hash_password(temp_password)
    
    # Save new user
    new_user = User(
        email=payload.email,
        hashed_password=hashed_password,
        organization_id=current_user.organization_id,
        status="active",
        must_change_password=True  # Force change on first login
    )
    new_user.roles = roles
    created_user = user_repo.create(new_user)
    
    # Audit log
    metadata = get_request_metadata(request)
    audit_repo.log_action(
        user_id=current_user.id,
        organization_id=current_user.organization_id,
        action="user.created",
        ip_address=metadata["ip_address"],
        user_agent=metadata["user_agent"],
        request_id=metadata["request_id"],
        payload={"created_user_id": str(created_user.id), "email": created_user.email}
    )
    
    return {
        "user": created_user,
        "temporary_password": temp_password
    }

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: UUID,
    payload: UserUpdate,
    request: Request,
    current_user: User = Depends(RequiresPermission("users:update")),
    db: Session = Depends(get_db)
):
    user_repo = UserRepository(db)
    user = user_repo.get(user_id)
    if not user or user.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    if payload.email and payload.email != user.email:
        # Check duplicate
        existing = user_repo.get_by_email(payload.email, organization_id=current_user.organization_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered in this organization."
            )
            
    updated_user = user_repo.update(user, payload)
    
    # Audit log
    metadata = get_request_metadata(request)
    audit_repo = AuditLogRepository(db)
    audit_repo.log_action(
        user_id=current_user.id,
        organization_id=current_user.organization_id,
        action="user.updated",
        ip_address=metadata["ip_address"],
        user_agent=metadata["user_agent"],
        request_id=metadata["request_id"],
        payload={"updated_user_id": str(user_id)}
    )
    return updated_user

@router.patch("/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: UUID,
    payload: UserStatusUpdate,
    request: Request,
    current_user: User = Depends(RequiresPermission("users:update")),
    db: Session = Depends(get_db)
):
    user_repo = UserRepository(db)
    user = user_repo.get(user_id)
    if not user or user.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    user.status = payload.status
    db.commit()
    db.refresh(user)
    
    # If deactivating, instantly terminate all active sessions/tokens
    if payload.status in ("inactive", "suspended"):
        token_repo = RefreshTokenRepository(db)
        token_repo.revoke_all_user_tokens(user_id)
        
    # Audit log
    metadata = get_request_metadata(request)
    audit_repo = AuditLogRepository(db)
    audit_repo.log_action(
        user_id=current_user.id,
        organization_id=current_user.organization_id,
        action="user.status_changed",
        ip_address=metadata["ip_address"],
        user_agent=metadata["user_agent"],
        request_id=metadata["request_id"],
        payload={"target_user_id": str(user_id), "status": payload.status}
    )
    return user

@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    payload: UserPasswordChange,
    request: Request,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    metadata = get_request_metadata(request)
    try:
        auth_service.change_user_password(
            user_id=current_user.id,
            current_password=payload.current_password,
            new_password=payload.new_password,
            ip_address=metadata["ip_address"],
            user_agent=metadata["user_agent"],
            request_id=metadata["request_id"]
        )
        return {"message": "Password changed successfully."}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/{user_id}/roles", status_code=status.HTTP_200_OK)
def assign_roles_to_user(
    user_id: UUID,
    payload: UserRoleAssign,
    request: Request,
    current_user: User = Depends(RequiresPermission("users:assign_roles")),
    db: Session = Depends(get_db)
):
    user_repo = UserRepository(db)
    target_user = user_repo.get(user_id)
    if not target_user or target_user.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in organization."
        )

    role_repo = RoleRepository(db)
    success = role_repo.update_user_roles(
        user_id=user_id,
        role_ids=payload.role_ids,
        organization_id=current_user.organization_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to assign roles. Verify that all role IDs are valid and belong to the organization."
        )

    # Audit log
    metadata = get_request_metadata(request)
    audit_repo = AuditLogRepository(db)
    audit_repo.log_action(
        user_id=current_user.id,
        organization_id=current_user.organization_id,
        action="user.roles_assigned",
        ip_address=metadata["ip_address"],
        user_agent=metadata["user_agent"],
        request_id=metadata["request_id"],
        payload={"target_user_id": str(user_id), "role_ids": [str(rid) for rid in payload.role_ids]}
    )
    return {"message": "User roles assigned successfully."}

@router.post("/{user_id}/permissions", status_code=status.HTTP_200_OK)
def assign_permissions_to_user(
    user_id: UUID,
    payload: UserPermissionAssign,
    request: Request,
    current_user: User = Depends(RequiresPermission("users:assign_permissions")),
    db: Session = Depends(get_db)
):
    user_repo = UserRepository(db)
    target_user = user_repo.get(user_id)
    if not target_user or target_user.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in organization."
        )

    perm_repo = PermissionRepository(db)
    success = perm_repo.update_user_permissions(user_id, payload.permission_ids)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to assign permissions. Verify that all permission IDs are valid."
        )

    # Audit log
    metadata = get_request_metadata(request)
    audit_repo = AuditLogRepository(db)
    audit_repo.log_action(
        user_id=current_user.id,
        organization_id=current_user.organization_id,
        action="user.permissions_assigned",
        ip_address=metadata["ip_address"],
        user_agent=metadata["user_agent"],
        request_id=metadata["request_id"],
        payload={"target_user_id": str(user_id), "permission_ids": [str(pid) for pid in payload.permission_ids]}
    )
    return {"message": "User direct permissions assigned successfully."}

