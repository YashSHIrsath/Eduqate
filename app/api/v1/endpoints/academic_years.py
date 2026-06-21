from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional, List

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import RequiresPermission
from app.models.user import User
from app.schemas.academic_year import AcademicYearCreate, AcademicYearUpdate, AcademicYearResponse, AcademicYearListResponse
from app.repositories.academic_year import AcademicYearRepository
from app.repositories.audit_log import AuditLogRepository
from app.services.academic_year import AcademicYearService

router = APIRouter(prefix="/years", tags=["Academic Years"])

def get_academic_year_service(db: Session = Depends(get_db)) -> AcademicYearService:
    return AcademicYearService(
        db=db,
        year_repo=AcademicYearRepository(db),
        audit_repo=AuditLogRepository(db)
    )

def get_request_metadata(request: Request):
    return {
        "ip_address": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown")
    }

@router.post("/", response_model=AcademicYearResponse, status_code=status.HTTP_201_CREATED)
def create_academic_year(
    payload: AcademicYearCreate,
    request: Request,
    current_user: User = Depends(RequiresPermission("academic_years:create")),
    service: AcademicYearService = Depends(get_academic_year_service)
):
    try:
        return service.create_year(
            organization_id=current_user.organization_id,
            payload=payload,
            user_id=current_user.id,
            audit_meta=get_request_metadata(request)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=AcademicYearListResponse)
def list_academic_years(
    page: int = 1,
    page_size: int = 10,
    status: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    current_user: User = Depends(RequiresPermission("academic_years:view")),
    service: AcademicYearService = Depends(get_academic_year_service)
):
    items, total = service.year_repo.get_paginated(
        organization_id=current_user.organization_id,
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

@router.get("/{id}", response_model=AcademicYearResponse)
def get_academic_year(
    id: UUID,
    current_user: User = Depends(RequiresPermission("academic_years:view")),
    service: AcademicYearService = Depends(get_academic_year_service)
):
    year = service.year_repo.get_by_id_tenant(id, current_user.organization_id)
    if not year:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Academic year not found.")
    return year

@router.put("/{id}", response_model=AcademicYearResponse)
def update_academic_year(
    id: UUID,
    payload: AcademicYearUpdate,
    request: Request,
    current_user: User = Depends(RequiresPermission("academic_years:update")),
    service: AcademicYearService = Depends(get_academic_year_service)
):
    try:
        return service.update_year(
            id=id,
            organization_id=current_user.organization_id,
            payload=payload,
            user_id=current_user.id,
            audit_meta=get_request_metadata(request)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{id}", response_model=AcademicYearResponse)
def delete_academic_year(
    id: UUID,
    request: Request,
    current_user: User = Depends(RequiresPermission("academic_years:delete")),
    service: AcademicYearService = Depends(get_academic_year_service)
):
    try:
        return service.delete_year(
            id=id,
            organization_id=current_user.organization_id,
            user_id=current_user.id,
            audit_meta=get_request_metadata(request)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
