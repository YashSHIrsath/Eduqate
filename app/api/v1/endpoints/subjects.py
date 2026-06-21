from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional, List

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import RequiresPermission
from app.models.user import User
from app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectResponse, SubjectListResponse
from app.repositories.subject import SubjectRepository
from app.repositories.department import DepartmentRepository
from app.repositories.audit_log import AuditLogRepository
from app.services.subject import SubjectService

router = APIRouter(prefix="/subjects", tags=["Subjects"])

def get_subject_service(db: Session = Depends(get_db)) -> SubjectService:
    return SubjectService(
        db=db,
        subject_repo=SubjectRepository(db),
        dept_repo=DepartmentRepository(db),
        audit_repo=AuditLogRepository(db)
    )

def get_request_metadata(request: Request):
    return {
        "ip_address": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown")
    }

@router.post("/", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    payload: SubjectCreate,
    request: Request,
    current_user: User = Depends(RequiresPermission("subjects:create")),
    service: SubjectService = Depends(get_subject_service)
):
    try:
        return service.create_subject(
            organization_id=current_user.organization_id,
            payload=payload,
            user_id=current_user.id,
            audit_meta=get_request_metadata(request)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=SubjectListResponse)
def list_subjects(
    department_id: Optional[UUID] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
    status: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    current_user: User = Depends(RequiresPermission("subjects:view")),
    service: SubjectService = Depends(get_subject_service)
):
    items, total = service.subject_repo.get_paginated(
        organization_id=current_user.organization_id,
        department_id=department_id,
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

@router.get("/{id}", response_model=SubjectResponse)
def get_subject(
    id: UUID,
    current_user: User = Depends(RequiresPermission("subjects:view")),
    service: SubjectService = Depends(get_subject_service)
):
    sub = service.subject_repo.get_by_id_tenant(id, current_user.organization_id)
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found.")
    return sub

@router.put("/{id}", response_model=SubjectResponse)
def update_subject(
    id: UUID,
    payload: SubjectUpdate,
    request: Request,
    current_user: User = Depends(RequiresPermission("subjects:update")),
    service: SubjectService = Depends(get_subject_service)
):
    try:
        return service.update_subject(
            id=id,
            organization_id=current_user.organization_id,
            payload=payload,
            user_id=current_user.id,
            audit_meta=get_request_metadata(request)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{id}", response_model=SubjectResponse)
def delete_subject(
    id: UUID,
    request: Request,
    current_user: User = Depends(RequiresPermission("subjects:delete")),
    service: SubjectService = Depends(get_subject_service)
):
    try:
        return service.delete_subject(
            id=id,
            organization_id=current_user.organization_id,
            user_id=current_user.id,
            audit_meta=get_request_metadata(request)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
