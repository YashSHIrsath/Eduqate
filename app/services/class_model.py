import json
from uuid import UUID
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.repositories.class_model import ClassRepository
from app.repositories.department import DepartmentRepository
from app.repositories.audit_log import AuditLogRepository
from app.models.class_model import Class
from app.schemas.class_model import ClassCreate, ClassUpdate

class ClassService:
    def __init__(self, db: Session, class_repo: ClassRepository, dept_repo: DepartmentRepository, audit_repo: AuditLogRepository):
        self.db = db
        self.class_repo = class_repo
        self.dept_repo = dept_repo
        self.audit_repo = audit_repo

    def create_class(self, organization_id: UUID, payload: ClassCreate, user_id: UUID, audit_meta: dict) -> Class:
        # Check code uniqueness
        existing = self.class_repo.get_by_code_tenant(payload.code, organization_id)
        if existing:
            raise ValueError(f"Class with code '{payload.code}' already exists.")

        # If department is provided, check existence and organization matching
        if payload.department_id:
            dept = self.dept_repo.get_by_id_tenant(payload.department_id, organization_id)
            if not dept:
                raise ValueError("Department not found or belongs to another organization.")

        cls_obj = Class(
            organization_id=organization_id,
            name=payload.name,
            code=payload.code,
            department_id=payload.department_id,
            status=payload.status,
            created_by=user_id,
            updated_by=user_id
        )
        self.class_repo.create(cls_obj)

        self.audit_repo.log_action(
            user_id=str(user_id),
            organization_id=str(organization_id),
            action="class.created",
            entity_type="Class",
            entity_id=str(cls_obj.id),
            ip_address=audit_meta.get("ip_address", "unknown"),
            user_agent=audit_meta.get("user_agent", "unknown"),
            payload={"name": cls_obj.name, "code": cls_obj.code}
        )
        return cls_obj

    def update_class(self, id: UUID, organization_id: UUID, payload: ClassUpdate, user_id: UUID, audit_meta: dict) -> Class:
        cls_obj = self.class_repo.get_by_id_tenant(id, organization_id)
        if not cls_obj:
            raise ValueError("Class not found.")

        update_data = payload.model_dump(exclude_none=True)

        # Check code uniqueness if changing
        if payload.code and payload.code != cls_obj.code:
            existing = self.class_repo.get_by_code_tenant(payload.code, organization_id)
            if existing:
                raise ValueError(f"Class with code '{payload.code}' already exists.")

        # Check department if changing
        if payload.department_id:
            dept = self.dept_repo.get_by_id_tenant(payload.department_id, organization_id)
            if not dept:
                raise ValueError("Department not found or belongs to another organization.")

        update_data["updated_by"] = user_id
        self.class_repo.update(cls_obj, update_data)

        self.audit_repo.log_action(
            user_id=str(user_id),
            organization_id=str(organization_id),
            action="class.updated",
            entity_type="Class",
            entity_id=str(cls_obj.id),
            ip_address=audit_meta.get("ip_address", "unknown"),
            user_agent=audit_meta.get("user_agent", "unknown"),
            payload=json.loads(json.dumps(update_data, default=str))
        )
        return cls_obj

    def delete_class(self, id: UUID, organization_id: UUID, user_id: UUID, audit_meta: dict) -> Class:
        cls_obj = self.class_repo.get_by_id_tenant(id, organization_id)
        if not cls_obj:
            raise ValueError("Class not found.")

        self.class_repo.remove(id)

        self.audit_repo.log_action(
            user_id=str(user_id),
            organization_id=str(organization_id),
            action="class.deleted",
            entity_type="Class",
            entity_id=str(id),
            ip_address=audit_meta.get("ip_address", "unknown"),
            user_agent=audit_meta.get("user_agent", "unknown"),
            payload={"name": cls_obj.name, "code": cls_obj.code}
        )
        return cls_obj
