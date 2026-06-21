import json
from uuid import UUID
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.repositories.section import SectionRepository
from app.repositories.class_model import ClassRepository
from app.repositories.audit_log import AuditLogRepository
from app.models.section import Section
from app.schemas.section import SectionCreate, SectionUpdate

class SectionService:
    def __init__(self, db: Session, section_repo: SectionRepository, class_repo: ClassRepository, audit_repo: AuditLogRepository):
        self.db = db
        self.section_repo = section_repo
        self.class_repo = class_repo
        self.audit_repo = audit_repo

    def create_section(self, organization_id: UUID, payload: SectionCreate, user_id: UUID, audit_meta: dict) -> Section:
        # Validate parent class exists and belongs to the same org
        parent_class = self.class_repo.get_by_id_tenant(payload.class_id, organization_id)
        if not parent_class:
            raise ValueError("Class not found or belongs to another organization.")

        # Check section code uniqueness in parent class
        existing = self.section_repo.get_by_code_class(payload.code, payload.class_id, organization_id)
        if existing:
            raise ValueError(f"Section with code '{payload.code}' already exists for this class.")

        sec = Section(
            organization_id=organization_id,
            class_id=payload.class_id,
            name=payload.name,
            code=payload.code,
            capacity=payload.capacity,
            status=payload.status,
            created_by=user_id,
            updated_by=user_id
        )
        self.section_repo.create(sec)

        self.audit_repo.log_action(
            user_id=str(user_id),
            organization_id=str(organization_id),
            action="section.created",
            entity_type="Section",
            entity_id=str(sec.id),
            ip_address=audit_meta.get("ip_address", "unknown"),
            user_agent=audit_meta.get("user_agent", "unknown"),
            payload={"name": sec.name, "code": sec.code, "class_id": str(sec.class_id)}
        )
        return sec

    def update_section(self, id: UUID, organization_id: UUID, payload: SectionUpdate, user_id: UUID, audit_meta: dict) -> Section:
        sec = self.section_repo.get_by_id_tenant(id, organization_id)
        if not sec:
            raise ValueError("Section not found.")

        update_data = payload.model_dump(exclude_none=True)

        # Check section code uniqueness in parent class if changing
        if payload.code and payload.code != sec.code:
            existing = self.section_repo.get_by_code_class(payload.code, sec.class_id, organization_id)
            if existing:
                raise ValueError(f"Section with code '{payload.code}' already exists for this class.")

        update_data["updated_by"] = user_id
        self.section_repo.update(sec, update_data)

        self.audit_repo.log_action(
            user_id=str(user_id),
            organization_id=str(organization_id),
            action="section.updated",
            entity_type="Section",
            entity_id=str(sec.id),
            ip_address=audit_meta.get("ip_address", "unknown"),
            user_agent=audit_meta.get("user_agent", "unknown"),
            payload=json.loads(json.dumps(update_data, default=str))
        )
        return sec

    def delete_section(self, id: UUID, organization_id: UUID, user_id: UUID, audit_meta: dict) -> Section:
        sec = self.section_repo.get_by_id_tenant(id, organization_id)
        if not sec:
            raise ValueError("Section not found.")

        self.section_repo.remove(id)

        self.audit_repo.log_action(
            user_id=str(user_id),
            organization_id=str(organization_id),
            action="section.deleted",
            entity_type="Section",
            entity_id=str(id),
            ip_address=audit_meta.get("ip_address", "unknown"),
            user_agent=audit_meta.get("user_agent", "unknown"),
            payload={"name": sec.name, "code": sec.code}
        )
        return sec
