from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional, List

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import RequiresPermission
from app.models.user import User
from app.schemas.class_model import ClassCreate, ClassUpdate, ClassResponse, ClassSubjectAssign, ClassListResponse
from app.schemas.class_subject import ClassSubjectResponse
from app.repositories.class_model import ClassRepository
from app.repositories.department import DepartmentRepository
from app.repositories.class_subject import ClassSubjectRepository
from app.repositories.subject import SubjectRepository
from app.repositories.academic_year import AcademicYearRepository
from app.repositories.audit_log import AuditLogRepository
from app.services.class_model import ClassService
from app.services.class_subject import ClassSubjectService

router = APIRouter(prefix="/classes", tags=["Classes"])

def get_class_service(db: Session = Depends(get_db)) -> ClassService:
    return ClassService(
        db=db,
        class_repo=ClassRepository(db),
        dept_repo=DepartmentRepository(db),
        audit_repo=AuditLogRepository(db)
    )

def get_class_subject_service(db: Session = Depends(get_db)) -> ClassSubjectService:
    return ClassSubjectService(
        db=db,
        class_subject_repo=ClassSubjectRepository(db),
        class_repo=ClassRepository(db),
        subject_repo=SubjectRepository(db),
        year_repo=AcademicYearRepository(db),
        audit_repo=AuditLogRepository(db)
    )

def get_request_metadata(request: Request):
    return {
        "ip_address": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown")
    }

# --- Class CRUD ---

@router.post("/", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(
    payload: ClassCreate,
    request: Request,
    current_user: User = Depends(RequiresPermission("classes:create")),
    service: ClassService = Depends(get_class_service)
):
    try:
        return service.create_class(
            organization_id=current_user.organization_id,
            payload=payload,
            user_id=current_user.id,
            audit_meta=get_request_metadata(request)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=ClassListResponse)
def list_classes(
    department_id: Optional[UUID] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
    status: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    current_user: User = Depends(RequiresPermission("classes:view")),
    service: ClassService = Depends(get_class_service)
):
    items, total = service.class_repo.get_paginated(
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

@router.get("/{id}", response_model=ClassResponse)
def get_class(
    id: UUID,
    current_user: User = Depends(RequiresPermission("classes:view")),
    service: ClassService = Depends(get_class_service)
):
    cls_obj = service.class_repo.get_by_id_tenant(id, current_user.organization_id)
    if not cls_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found.")
    return cls_obj

@router.put("/{id}", response_model=ClassResponse)
def update_class(
    id: UUID,
    payload: ClassUpdate,
    request: Request,
    current_user: User = Depends(RequiresPermission("classes:update")),
    service: ClassService = Depends(get_class_service)
):
    try:
        return service.update_class(
            id=id,
            organization_id=current_user.organization_id,
            payload=payload,
            user_id=current_user.id,
            audit_meta=get_request_metadata(request)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{id}", response_model=ClassResponse)
def delete_class(
    id: UUID,
    request: Request,
    current_user: User = Depends(RequiresPermission("classes:delete")),
    service: ClassService = Depends(get_class_service)
):
    try:
        return service.delete_class(
            id=id,
            organization_id=current_user.organization_id,
            user_id=current_user.id,
            audit_meta=get_request_metadata(request)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# --- Class Subject Assignment APIs ---

@router.post("/{class_id}/subjects", response_model=List[ClassSubjectResponse])
def assign_subjects_to_class(
    class_id: UUID,
    payload: ClassSubjectAssign,
    request: Request,
    current_user: User = Depends(RequiresPermission("class_subjects:assign")),
    service: ClassSubjectService = Depends(get_class_subject_service)
):
    try:
        return service.assign_subjects_to_class(
            organization_id=current_user.organization_id,
            class_id=class_id,
            subject_ids=payload.subject_ids,
            academic_year_id=payload.academic_year_id,
            user_id=current_user.id,
            audit_meta=get_request_metadata(request)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/{class_id}/subjects", response_model=List[ClassSubjectResponse])
def get_class_subjects(
    class_id: UUID,
    academic_year_id: Optional[UUID] = None,
    current_user: User = Depends(RequiresPermission("class_subjects:view")),
    service: ClassSubjectService = Depends(get_class_subject_service),
    db: Session = Depends(get_db)
):
    # Fallback to active academic year of the organization if academic_year_id is not provided
    resolved_year_id = academic_year_id
    if not resolved_year_id:
        from app.models.organization import Organization
        org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
        if org and org.current_academic_year_id:
            resolved_year_id = org.current_academic_year_id
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="academic_year_id is required because no active academic year is configured for the organization."
            )
            
    try:
        return service.get_assigned_subjects(
            organization_id=current_user.organization_id,
            class_id=class_id,
            academic_year_id=resolved_year_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{class_id}/subjects/{subject_id}", response_model=ClassSubjectResponse)
def remove_subject_from_class(
    class_id: UUID,
    subject_id: UUID,
    academic_year_id: UUID,
    request: Request,
    current_user: User = Depends(RequiresPermission("class_subjects:assign")),
    service: ClassSubjectService = Depends(get_class_subject_service)
):
    try:
        return service.remove_subject_from_class(
            organization_id=current_user.organization_id,
            class_id=class_id,
            subject_id=subject_id,
            academic_year_id=academic_year_id,
            user_id=current_user.id,
            audit_meta=get_request_metadata(request)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
