import json
from uuid import UUID
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.repositories.academic_year import AcademicYearRepository
from app.repositories.audit_log import AuditLogRepository
from app.models.academic_year import AcademicYear
from app.schemas.academic_year import AcademicYearCreate, AcademicYearUpdate

class AcademicYearService:
    def __init__(self, db: Session, year_repo: AcademicYearRepository, audit_repo: AuditLogRepository):
        self.db = db
        self.year_repo = year_repo
        self.audit_repo = audit_repo

    def create_year(self, organization_id: UUID, payload: AcademicYearCreate, user_id: UUID, audit_meta: dict) -> AcademicYear:
        # Check start date before end date
        if payload.start_date >= payload.end_date:
            raise ValueError("Start date must precede the end date.")

        # Handle current year exclusivity
        if payload.is_current:
            self.year_repo.clear_current_flags(organization_id)

        # Create record
        year = AcademicYear(
            organization_id=organization_id,
            name=payload.name,
            start_date=payload.start_date,
            end_date=payload.end_date,
            is_current=payload.is_current,
            status=payload.status,
            created_by=user_id,
            updated_by=user_id
        )
        self.year_repo.create(year)

        # If set as current, update the organization's current_academic_year_id
        if payload.is_current:
            from app.models.organization import Organization
            org = self.db.query(Organization).filter(Organization.id == organization_id).first()
            if org:
                org.current_academic_year_id = year.id
                self.db.commit()

        # Audit log
        self.audit_repo.log_action(
            user_id=str(user_id),
            organization_id=str(organization_id),
            action="academic_year.created",
            entity_type="AcademicYear",
            entity_id=str(year.id),
            ip_address=audit_meta.get("ip_address", "unknown"),
            user_agent=audit_meta.get("user_agent", "unknown"),
            payload={"name": year.name}
        )
        return year

    def update_year(self, id: UUID, organization_id: UUID, payload: AcademicYearUpdate, user_id: UUID, audit_meta: dict) -> AcademicYear:
        year = self.year_repo.get_by_id_tenant(id, organization_id)
        if not year:
            raise ValueError("Academic year not found.")

        update_data = payload.model_dump(exclude_none=True)
        
        # Check date logical consistency if dates are changing
        start = payload.start_date or year.start_date
        end = payload.end_date or year.end_date
        if start >= end:
            raise ValueError("Start date must precede the end date.")

        # Handle current flag exclusivity
        if "is_current" in update_data and update_data["is_current"]:
            self.year_repo.clear_current_flags(organization_id)
            # Update organization
            from app.models.organization import Organization
            org = self.db.query(Organization).filter(Organization.id == organization_id).first()
            if org:
                org.current_academic_year_id = year.id
        elif "is_current" in update_data and not update_data["is_current"] and year.is_current:
            # If turning off the current flag, clear on organization as well
            from app.models.organization import Organization
            org = self.db.query(Organization).filter(Organization.id == organization_id).first()
            if org and org.current_academic_year_id == year.id:
                org.current_academic_year_id = None

        # Apply update
        update_data["updated_by"] = user_id
        self.year_repo.update(year, update_data)

        self.audit_repo.log_action(
            user_id=str(user_id),
            organization_id=str(organization_id),
            action="academic_year.updated",
            entity_type="AcademicYear",
            entity_id=str(year.id),
            ip_address=audit_meta.get("ip_address", "unknown"),
            user_agent=audit_meta.get("user_agent", "unknown"),
            payload=json.loads(json.dumps(update_data, default=str))
        )
        return year

    def delete_year(self, id: UUID, organization_id: UUID, user_id: UUID, audit_meta: dict) -> AcademicYear:
        year = self.year_repo.get_by_id_tenant(id, organization_id)
        if not year:
            raise ValueError("Academic year not found.")

        # If deleting the current year, clear organization's pointer
        if year.is_current:
            from app.models.organization import Organization
            org = self.db.query(Organization).filter(Organization.id == organization_id).first()
            if org and org.current_academic_year_id == year.id:
                org.current_academic_year_id = None

        self.year_repo.remove(id)

        self.audit_repo.log_action(
            user_id=str(user_id),
            organization_id=str(organization_id),
            action="academic_year.deleted",
            entity_type="AcademicYear",
            entity_id=str(id),
            ip_address=audit_meta.get("ip_address", "unknown"),
            user_agent=audit_meta.get("user_agent", "unknown"),
            payload={"name": year.name}
        )
        return year
