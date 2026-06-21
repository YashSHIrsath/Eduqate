from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional, List

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import RequiresPermission
from app.models.user import User
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse, DepartmentListResponse
from app.repositories.department import DepartmentRepository
from app.repositories.audit_log import AuditLogRepository
from app.services.department import DepartmentService

router = APIRouter(prefix="/departments", tags=["Departments"])

def get_department_service(db: Session = Depends(get_db)) -> DepartmentService:
    return DepartmentService(
        db=db,
        dept_repo=DepartmentRepository(db),
        audit_repo=AuditLogRepository(db)
    )

def get_request_metadata(request: Request):
    return {
        "ip_address": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown")
    }

@router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    payload: DepartmentCreate,
    request: Request,
    current_user: User = Depends(RequiresPermission("departments:create")),
    service: DepartmentService = Depends(get_department_service)
):
    try:
        return service.create_department(
            organization_id=current_user.organization_id,
            payload=payload,
            user_id=current_user.id,
            audit_meta=get_request_metadata(request)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=DepartmentListResponse)
def list_departments(
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
    status: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    current_user: User = Depends(RequiresPermission("departments:view")),
    service: DepartmentService = Depends(get_department_service)
):
    items, total = service.dept_repo.get_paginated(
        organization_id=current_user.organization_id,
        page=page,
        page_size=page_size,
        search=search,
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

@router.get("/{id}", response_model=DepartmentResponse)
def get_department(
    id: UUID,
    current_user: User = Depends(RequiresPermission("departments:view")),
    service: DepartmentService = Depends(get_department_service)
):
    dept = service.dept_repo.get_by_id_tenant(id, current_user.organization_id)
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found.")
    return dept

@router.put("/{id}", response_model=DepartmentResponse)
def update_department(
    id: UUID,
    payload: DepartmentUpdate,
    request: Request,
    current_user: User = Depends(RequiresPermission("departments:update")),
    service: DepartmentService = Depends(get_department_service)
):
    try:
        return service.update_department(
            id=id,
            organization_id=current_user.organization_id,
            payload=payload,
            user_id=current_user.id,
            audit_meta=get_request_metadata(request)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{id}", response_model=DepartmentResponse)
def delete_department(
    id: UUID,
    request: Request,
    current_user: User = Depends(RequiresPermission("departments:delete")),
    service: DepartmentService = Depends(get_department_service)
):
    try:
        return service.delete_department(
            id=id,
            organization_id=current_user.organization_id,
            user_id=current_user.id,
            audit_meta=get_request_metadata(request)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
