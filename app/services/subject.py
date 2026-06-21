import json
from uuid import UUID
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.repositories.subject import SubjectRepository
from app.repositories.department import DepartmentRepository
from app.repositories.audit_log import AuditLogRepository
from app.models.subject import Subject
from app.schemas.subject import SubjectCreate, SubjectUpdate

class SubjectService:
    def __init__(self, db: Session, subject_repo: SubjectRepository, dept_repo: DepartmentRepository, audit_repo: AuditLogRepository):
        self.db = db
        self.subject_repo = subject_repo
        self.dept_repo = dept_repo
        self.audit_repo = audit_repo

    def create_subject(self, organization_id: UUID, payload: SubjectCreate, user_id: UUID, audit_meta: dict) -> Subject:
        # Check code uniqueness
        existing = self.subject_repo.get_by_code_tenant(payload.code, organization_id)
        if existing:
            raise ValueError(f"Subject with code '{payload.code}' already exists.")

        # If department is provided, check existence and organization matching
        if payload.department_id:
            dept = self.dept_repo.get_by_id_tenant(payload.department_id, organization_id)
            if not dept:
                raise ValueError("Department not found or belongs to another organization.")

        sub = Subject(
            organization_id=organization_id,
            name=payload.name,
            code=payload.code,
            department_id=payload.department_id,
            description=payload.description,
            status=payload.status,
            created_by=user_id,
            updated_by=user_id
        )
        self.subject_repo.create(sub)

        self.audit_repo.log_action(
            user_id=str(user_id),
            organization_id=str(organization_id),
            action="subject.created",
            entity_type="Subject",
            entity_id=str(sub.id),
            ip_address=audit_meta.get("ip_address", "unknown"),
            user_agent=audit_meta.get("user_agent", "unknown"),
            payload={"name": sub.name, "code": sub.code}
        )
        return sub

    def update_subject(self, id: UUID, organization_id: UUID, payload: SubjectUpdate, user_id: UUID, audit_meta: dict) -> Subject:
        sub = self.subject_repo.get_by_id_tenant(id, organization_id)
        if not sub:
            raise ValueError("Subject not found.")

        update_data = payload.model_dump(exclude_none=True)

        # Check code uniqueness if changing
        if payload.code and payload.code != sub.code:
            existing = self.subject_repo.get_by_code_tenant(payload.code, organization_id)
            if existing:
                raise ValueError(f"Subject with code '{payload.code}' already exists.")

        # Check department if changing
        if payload.department_id:
            dept = self.dept_repo.get_by_id_tenant(payload.department_id, organization_id)
            if not dept:
                raise ValueError("Department not found or belongs to another organization.")

        update_data["updated_by"] = user_id
        self.subject_repo.update(sub, update_data)

        self.audit_repo.log_action(
            user_id=str(user_id),
            organization_id=str(organization_id),
            action="subject.updated",
            entity_type="Subject",
            entity_id=str(sub.id),
            ip_address=audit_meta.get("ip_address", "unknown"),
            user_agent=audit_meta.get("user_agent", "unknown"),
            payload=json.loads(json.dumps(update_data, default=str))
        )
        return sub

    def delete_subject(self, id: UUID, organization_id: UUID, user_id: UUID, audit_meta: dict) -> Subject:
        sub = self.subject_repo.get_by_id_tenant(id, organization_id)
        if not sub:
            raise ValueError("Subject not found.")

        self.subject_repo.remove(id)

        self.audit_repo.log_action(
            user_id=str(user_id),
            organization_id=str(organization_id),
            action="subject.deleted",
            entity_type="Subject",
            entity_id=str(id),
            ip_address=audit_meta.get("ip_address", "unknown"),
            user_agent=audit_meta.get("user_agent", "unknown"),
            payload={"name": sub.name, "code": sub.code}
        )
        return sub
