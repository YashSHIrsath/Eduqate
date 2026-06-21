from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional, List

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import RequiresPermission
from app.models.user import User
from app.schemas.section import SectionCreate, SectionUpdate, SectionResponse, SectionListResponse
from app.repositories.section import SectionRepository
from app.repositories.class_model import ClassRepository
from app.repositories.audit_log import AuditLogRepository
from app.services.section import SectionService

router = APIRouter(prefix="/sections", tags=["Sections"])

def get_section_service(db: Session = Depends(get_db)) -> SectionService:
    return SectionService(
        db=db,
        section_repo=SectionRepository(db),
        class_repo=ClassRepository(db),
        audit_repo=AuditLogRepository(db)
    )

def get_request_metadata(request: Request):
    return {
        "ip_address": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown")
    }

@router.post("/", response_model=SectionResponse, status_code=status.HTTP_201_CREATED)
def create_section(
    payload: SectionCreate,
    request: Request,
    current_user: User = Depends(RequiresPermission("sections:create")),
    service: SectionService = Depends(get_section_service)
):
    try:
        return service.create_section(
            organization_id=current_user.organization_id,
            payload=payload,
            user_id=current_user.id,
            audit_meta=get_request_metadata(request)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=SectionListResponse)
def list_sections(
    class_id: Optional[UUID] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
    status: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    current_user: User = Depends(RequiresPermission("sections:view")),
    service: SectionService = Depends(get_section_service)
):
    items, total = service.section_repo.get_paginated(
        organization_id=current_user.organization_id,
        class_id=class_id,
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

@router.get("/{id}", response_model=SectionResponse)
def get_section(
    id: UUID,
    current_user: User = Depends(RequiresPermission("sections:view")),
    service: SectionService = Depends(get_section_service)
):
    sec = service.section_repo.get_by_id_tenant(id, current_user.organization_id)
    if not sec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found.")
    return sec

@router.put("/{id}", response_model=SectionResponse)
def update_section(
    id: UUID,
    payload: SectionUpdate,
    request: Request,
    current_user: User = Depends(RequiresPermission("sections:update")),
    service: SectionService = Depends(get_section_service)
):
    try:
        return service.update_section(
            id=id,
            organization_id=current_user.organization_id,
            payload=payload,
            user_id=current_user.id,
            audit_meta=get_request_metadata(request)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{id}", response_model=SectionResponse)
def delete_section(
    id: UUID,
    request: Request,
    current_user: User = Depends(RequiresPermission("sections:delete")),
    service: SectionService = Depends(get_section_service)
):
    try:
        return service.delete_section(
            id=id,
            organization_id=current_user.organization_id,
            user_id=current_user.id,
            audit_meta=get_request_metadata(request)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
