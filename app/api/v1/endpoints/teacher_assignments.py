from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional, List

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import RequiresPermission
from app.models.user import User
from app.schemas.teacher_assignment import TeacherAssignmentCreate, TeacherAssignmentUpdate, TeacherAssignmentResponse, TeacherAssignmentListResponse
from app.repositories.teacher_assignment import TeacherAssignmentRepository
from app.repositories.user import UserRepository
from app.repositories.section import SectionRepository
from app.repositories.subject import SubjectRepository
from app.repositories.academic_year import AcademicYearRepository
from app.repositories.audit_log import AuditLogRepository
from app.services.teacher_assignment import TeacherAssignmentService

router = APIRouter(prefix="/teachers/assignments", tags=["Teacher Assignments"])

def get_teacher_assignment_service(db: Session = Depends(get_db)) -> TeacherAssignmentService:
    return TeacherAssignmentService(
        db=db,
        assignment_repo=TeacherAssignmentRepository(db),
        user_repo=UserRepository(db),
        section_repo=SectionRepository(db),
        subject_repo=SubjectRepository(db),
        year_repo=AcademicYearRepository(db),
        audit_repo=AuditLogRepository(db)
    )

def get_request_metadata(request: Request):
    return {
        "ip_address": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown")
    }

@router.post("/", response_model=TeacherAssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_teacher_assignment(
    payload: TeacherAssignmentCreate,
    request: Request,
    current_user: User = Depends(RequiresPermission("teacher_assignments:create")),
    service: TeacherAssignmentService = Depends(get_teacher_assignment_service)
):
    try:
        return service.create_assignment(
            organization_id=current_user.organization_id,
            payload=payload,
            user_id=current_user.id,
            audit_meta=get_request_metadata(request)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=TeacherAssignmentListResponse)
def list_teacher_assignments(
    teacher_id: Optional[UUID] = None,
    academic_year_id: Optional[UUID] = None,
    page: int = 1,
    page_size: int = 10,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    current_user: User = Depends(RequiresPermission("teacher_assignments:view")),
    service: TeacherAssignmentService = Depends(get_teacher_assignment_service)
):
    items, total = service.assignment_repo.get_paginated(
        organization_id=current_user.organization_id,
        teacher_id=teacher_id,
        academic_year_id=academic_year_id,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/{id}", response_model=TeacherAssignmentResponse)
def get_teacher_assignment(
    id: UUID,
    current_user: User = Depends(RequiresPermission("teacher_assignments:view")),
    service: TeacherAssignmentService = Depends(get_teacher_assignment_service)
):
    assignment = service.assignment_repo.get_by_id_tenant(id, current_user.organization_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher assignment not found.")
    return assignment

@router.put("/{id}", response_model=TeacherAssignmentResponse)
def update_teacher_assignment(
    id: UUID,
    payload: TeacherAssignmentUpdate,
    request: Request,
    current_user: User = Depends(RequiresPermission("teacher_assignments:update")),
    service: TeacherAssignmentService = Depends(get_teacher_assignment_service)
):
    try:
        return service.update_assignment(
            id=id,
            organization_id=current_user.organization_id,
            payload=payload,
            user_id=current_user.id,
            audit_meta=get_request_metadata(request)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{id}", response_model=TeacherAssignmentResponse)
def delete_teacher_assignment(
    id: UUID,
    request: Request,
    current_user: User = Depends(RequiresPermission("teacher_assignments:delete")),
    service: TeacherAssignmentService = Depends(get_teacher_assignment_service)
):
    try:
        return service.delete_assignment(
            id=id,
            organization_id=current_user.organization_id,
            user_id=current_user.id,
            audit_meta=get_request_metadata(request)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
