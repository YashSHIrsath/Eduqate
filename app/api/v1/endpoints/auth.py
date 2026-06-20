import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, Header, status, Response, Cookie
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel

from app.core.database import get_db
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserResponse, UserBootstrapResponse
from app.dependencies.auth import get_current_user
from app.models.user import User

# Import Repositories and Services
from app.repositories.user import UserRepository
from app.repositories.refresh_token import RefreshTokenRepository
from app.repositories.organization import OrganizationRepository
from app.repositories.audit_log import AuditLogRepository
from app.services.password import PasswordService
from app.services.token import TokenService
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

class RefreshRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: str

def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    """Dependency provider for AuthService."""
    return AuthService(
        db=db,
        user_repo=UserRepository(db),
        token_repo=RefreshTokenRepository(db),
        org_repo=OrganizationRepository(db),
        audit_repo=AuditLogRepository(db),
        password_service=PasswordService(),
        token_service=TokenService()
    )

def get_request_metadata(request: Request):
    """Utility to extract metadata for audit logging."""
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    # Retrieve X-Request-ID or generate a correlated one
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    device_name = request.headers.get("x-device-name")
    return {
        "ip_address": ip_address,
        "user_agent": user_agent,
        "request_id": request_id,
        "device_name": device_name
    }

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: UserRegister,
    request: Request,
    auth_service: AuthService = Depends(get_auth_service)
):
    metadata = get_request_metadata(request)
    try:
        user = auth_service.register_user(
            email=payload.email,
            password=payload.password,
            organization_slug=payload.organization_slug,
            organization_name=payload.organization_name,
            ip_address=metadata["ip_address"],
            user_agent=metadata["user_agent"],
            request_id=metadata["request_id"]
        )
        return user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/login", response_model=TokenResponse)
def login(
    payload: UserLogin,
    request: Request,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service)
):
    metadata = get_request_metadata(request)
    try:
        tokens = auth_service.login_user(
            email=payload.email,
            password=payload.password,
            organization_slug=payload.organization_slug,
            ip_address=metadata["ip_address"],
            user_agent=metadata["user_agent"],
            device_name=metadata["device_name"],
            request_id=metadata["request_id"]
        )
        
        # Set httponly secure cookie for refresh token
        response.set_cookie(
            key="refresh_token",
            value=tokens["refresh_token"],
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=7 * 24 * 3600  # 7 days
        )
        
        return {
            "access_token": tokens["access_token"],
            "token_type": "bearer"
        }
    except ValueError as e:
        # Check if the error is lockout related to return a specific 423 Locked or 403 Forbidden
        err_msg = str(e)
        if "locked" in err_msg:
            raise HTTPException(status_code=status.HTTP_423_LOCKED, detail=err_msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

@router.post("/refresh", response_model=TokenResponse)
def refresh(
    request: Request,
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    auth_service: AuthService = Depends(get_auth_service)
):
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please sign in again."
        )

    metadata = get_request_metadata(request)
    try:
        tokens = auth_service.refresh_session(
            raw_refresh_token=refresh_token,
            ip_address=metadata["ip_address"],
            user_agent=metadata["user_agent"],
            device_name=metadata["device_name"],
            request_id=metadata["request_id"]
        )
        
        # Set updated rotated refresh token in secure cookie
        response.set_cookie(
            key="refresh_token",
            value=tokens["refresh_token"],
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=7 * 24 * 3600  # 7 days
        )
        
        return {
            "access_token": tokens["access_token"],
            "token_type": "bearer"
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    auth_service: AuthService = Depends(get_auth_service)
):
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session cookie not found."
        )

    metadata = get_request_metadata(request)
    success = auth_service.logout_session(
        raw_refresh_token=refresh_token,
        ip_address=metadata["ip_address"],
        user_agent=metadata["user_agent"],
        request_id=metadata["request_id"]
    )
    
    # Clear the refresh token cookie
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=True,
        samesite="strict"
    )
    
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session not found or already logged out.")
    return {"message": "Logged out successfully"}


@router.post("/logout-all")
def logout_all(
    request: Request,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    metadata = get_request_metadata(request)
    revoked_count = auth_service.logout_all_sessions(
        user_id=current_user.id,
        ip_address=metadata["ip_address"],
        user_agent=metadata["user_agent"],
        request_id=metadata["request_id"]
    )
    return {
        "message": "Logged out from all devices successfully",
        "sessions_revoked": revoked_count
    }

@router.get("/me", response_model=UserBootstrapResponse)
def get_me(
    request: Request,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    metadata = get_request_metadata(request)
    return auth_service.get_bootstrap_data(
        user=current_user,
        ip_address=metadata["ip_address"],
        user_agent=metadata["user_agent"],
        request_id=metadata["request_id"]
    )

@router.get("/permissions", response_model=List[str])
def get_permissions(
    request: Request,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    metadata = get_request_metadata(request)
    return auth_service.get_effective_permissions(
        user=current_user,
        ip_address=metadata["ip_address"],
        user_agent=metadata["user_agent"],
        request_id=metadata["request_id"]
    )

