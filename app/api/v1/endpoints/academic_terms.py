from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional, List

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import RequiresPermission
from app.models.user import User
from app.schemas.academic_term import AcademicTermCreate, AcademicTermUpdate, AcademicTermResponse, AcademicTermListResponse
from app.repositories.academic_term import AcademicTermRepository
from app.repositories.academic_year import AcademicYearRepository
from app.repositories.audit_log import AuditLogRepository
from app.services.academic_term import AcademicTermService

router = APIRouter(prefix="/terms", tags=["Academic Terms"])

def get_academic_term_service(db: Session = Depends(get_db)) -> AcademicTermService:
    return AcademicTermService(
        db=db,
        term_repo=AcademicTermRepository(db),
        year_repo=AcademicYearRepository(db),
        audit_repo=AuditLogRepository(db)
    )

def get_request_metadata(request: Request):
    return {
        "ip_address": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown")
    }

@router.post("/", response_model=AcademicTermResponse, status_code=status.HTTP_201_CREATED)
def create_academic_term(
    payload: AcademicTermCreate,
    request: Request,
    current_user: User = Depends(RequiresPermission("academic_terms:create")),
    service: AcademicTermService = Depends(get_academic_term_service)
):
    try:
        return service.create_term(
            organization_id=current_user.organization_id,
            payload=payload,
            user_id=current_user.id,
            audit_meta=get_request_metadata(request)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=AcademicTermListResponse)
def list_academic_terms(
    academic_year_id: Optional[UUID] = None,
    page: int = 1,
    page_size: int = 10,
    status: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    current_user: User = Depends(RequiresPermission("academic_terms:view")),
    service: AcademicTermService = Depends(get_academic_term_service)
):
    items, total = service.term_repo.get_paginated(
        organization_id=current_user.organization_id,
        academic_year_id=academic_year_id,
        page=page,
        page_size=page_size,
        status=status,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/{id}", response_model=AcademicTermResponse)
def get_academic_term(
    id: UUID,
    current_user: User = Depends(RequiresPermission("academic_terms:view")),
    service: AcademicTermService = Depends(get_academic_term_service)
):
    term = service.term_repo.get_by_id_tenant(id, current_user.organization_id)
    if not term:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Academic term not found.")
    return term

@router.put("/{id}", response_model=AcademicTermResponse)
def update_academic_term(
    id: UUID,
    payload: AcademicTermUpdate,
    request: Request,
    current_user: User = Depends(RequiresPermission("academic_terms:update")),
    service: AcademicTermService = Depends(get_academic_term_service)
):
    try:
        return service.update_term(
            id=id,
            organization_id=current_user.organization_id,
            payload=payload,
            user_id=current_user.id,
            audit_meta=get_request_metadata(request)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{id}", response_model=AcademicTermResponse)
def delete_academic_term(
    id: UUID,
    request: Request,
    current_user: User = Depends(RequiresPermission("academic_terms:delete")),
    service: AcademicTermService = Depends(get_academic_term_service)
):
    try:
        return service.delete_term(
            id=id,
            organization_id=current_user.organization_id,
            user_id=current_user.id,
            audit_meta=get_request_metadata(request)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
