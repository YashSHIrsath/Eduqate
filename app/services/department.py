import json
from uuid import UUID
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.repositories.department import DepartmentRepository
from app.repositories.audit_log import AuditLogRepository
from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate

class DepartmentService:
    def __init__(self, db: Session, dept_repo: DepartmentRepository, audit_repo: AuditLogRepository):
        self.db = db
        self.dept_repo = dept_repo
        self.audit_repo = audit_repo

    def create_department(self, organization_id: UUID, payload: DepartmentCreate, user_id: UUID, audit_meta: dict) -> Department:
        # Check code uniqueness
        existing = self.dept_repo.get_by_code_tenant(payload.code, organization_id)
        if existing:
            raise ValueError(f"Department with code '{payload.code}' already exists.")

        dept = Department(
            organization_id=organization_id,
            name=payload.name,
            code=payload.code,
            description=payload.description,
            status=payload.status,
            created_by=user_id,
            updated_by=user_id
        )
        self.dept_repo.create(dept)

        self.audit_repo.log_action(
            user_id=str(user_id),
            organization_id=str(organization_id),
            action="department.created",
            entity_type="Department",
            entity_id=str(dept.id),
            ip_address=audit_meta.get("ip_address", "unknown"),
            user_agent=audit_meta.get("user_agent", "unknown"),
            payload={"name": dept.name, "code": dept.code}
        )
        return dept

    def update_department(self, id: UUID, organization_id: UUID, payload: DepartmentUpdate, user_id: UUID, audit_meta: dict) -> Department:
        dept = self.dept_repo.get_by_id_tenant(id, organization_id)
        if not dept:
            raise ValueError("Department not found.")

        update_data = payload.model_dump(exclude_none=True)

        # Check code uniqueness if changing
        if payload.code and payload.code != dept.code:
            existing = self.dept_repo.get_by_code_tenant(payload.code, organization_id)
            if existing:
                raise ValueError(f"Department with code '{payload.code}' already exists.")

        update_data["updated_by"] = user_id
        self.dept_repo.update(dept, update_data)

        self.audit_repo.log_action(
            user_id=str(user_id),
            organization_id=str(organization_id),
            action="department.updated",
            entity_type="Department",
            entity_id=str(dept.id),
            ip_address=audit_meta.get("ip_address", "unknown"),
            user_agent=audit_meta.get("user_agent", "unknown"),
            payload=json.loads(json.dumps(update_data, default=str))
        )
        return dept

    def delete_department(self, id: UUID, organization_id: UUID, user_id: UUID, audit_meta: dict) -> Department:
        dept = self.dept_repo.get_by_id_tenant(id, organization_id)
        if not dept:
            raise ValueError("Department not found.")

        self.dept_repo.remove(id)

        self.audit_repo.log_action(
            user_id=str(user_id),
            organization_id=str(organization_id),
            action="department.deleted",
            entity_type="Department",
            entity_id=str(id),
            ip_address=audit_meta.get("ip_address", "unknown"),
            user_agent=audit_meta.get("user_agent", "unknown"),
            payload={"name": dept.name, "code": dept.code}
        )
        return dept
