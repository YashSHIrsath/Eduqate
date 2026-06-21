import json
from uuid import UUID
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.repositories.academic_term import AcademicTermRepository
from app.repositories.academic_year import AcademicYearRepository
from app.repositories.audit_log import AuditLogRepository
from app.models.academic_term import AcademicTerm
from app.schemas.academic_term import AcademicTermCreate, AcademicTermUpdate

class AcademicTermService:
    def __init__(self, db: Session, term_repo: AcademicTermRepository, year_repo: AcademicYearRepository, audit_repo: AuditLogRepository):
        self.db = db
        self.term_repo = term_repo
        self.year_repo = year_repo
        self.audit_repo = audit_repo

    def create_term(self, organization_id: UUID, payload: AcademicTermCreate, user_id: UUID, audit_meta: dict) -> AcademicTerm:
        # Validate dates logical ordering
        if payload.start_date >= payload.end_date:
            raise ValueError("Start date must precede the end date.")

        # Resolve academic year
        year = self.year_repo.get_by_id_tenant(payload.academic_year_id, organization_id)
        if not year:
            raise ValueError("Academic year not found.")

        # Ensure term is within academic year boundary
        if payload.start_date < year.start_date or payload.end_date > year.end_date:
            raise ValueError(f"Term dates must fall within the academic year boundary ({year.start_date} to {year.end_date}).")

        # Validate no overlaps within the same academic year
        existing_terms = self.term_repo.get_terms_by_year(payload.academic_year_id)
        for term in existing_terms:
            if payload.start_date < term.end_date and payload.end_date > term.start_date:
                raise ValueError(f"Term dates overlap with an existing term: '{term.name}' ({term.start_date} to {term.end_date}).")

        term = AcademicTerm(
            organization_id=organization_id,
            academic_year_id=payload.academic_year_id,
            name=payload.name,
            start_date=payload.start_date,
            end_date=payload.end_date,
            is_active=payload.is_active,
            status=payload.status,
            created_by=user_id,
            updated_by=user_id
        )
        self.term_repo.create(term)

        self.audit_repo.log_action(
            user_id=str(user_id),
            organization_id=str(organization_id),
            action="academic_term.created",
            entity_type="AcademicTerm",
            entity_id=str(term.id),
            ip_address=audit_meta.get("ip_address", "unknown"),
            user_agent=audit_meta.get("user_agent", "unknown"),
            payload={"name": term.name, "academic_year_id": str(term.academic_year_id)}
        )
        return term

    def update_term(self, id: UUID, organization_id: UUID, payload: AcademicTermUpdate, user_id: UUID, audit_meta: dict) -> AcademicTerm:
        term = self.term_repo.get_by_id_tenant(id, organization_id)
        if not term:
            raise ValueError("Academic term not found.")

        update_data = payload.model_dump(exclude_none=True)

        start = payload.start_date or term.start_date
        end = payload.end_date or term.end_date

        if start >= end:
            raise ValueError("Start date must precede the end date.")

        # Resolve academic year boundaries
        year = self.year_repo.get_by_id_tenant(term.academic_year_id, organization_id)
        if not year:
            raise ValueError("Associated academic year not found.")

        if start < year.start_date or end > year.end_date:
            raise ValueError(f"Term dates must fall within the academic year boundary ({year.start_date} to {year.end_date}).")

        # Validate no overlaps (excluding this term itself)
        existing_terms = self.term_repo.get_terms_by_year(term.academic_year_id)
        for existing in existing_terms:
            if existing.id == term.id:
                continue
            if start < existing.end_date and end > existing.start_date:
                raise ValueError(f"Term dates overlap with an existing term: '{existing.name}' ({existing.start_date} to {existing.end_date}).")

        update_data["updated_by"] = user_id
        self.term_repo.update(term, update_data)

        self.audit_repo.log_action(
            user_id=str(user_id),
            organization_id=str(organization_id),
            action="academic_term.updated",
            entity_type="AcademicTerm",
            entity_id=str(term.id),
            ip_address=audit_meta.get("ip_address", "unknown"),
            user_agent=audit_meta.get("user_agent", "unknown"),
            payload=json.loads(json.dumps(update_data, default=str))
        )
        return term

    def delete_term(self, id: UUID, organization_id: UUID, user_id: UUID, audit_meta: dict) -> AcademicTerm:
        term = self.term_repo.get_by_id_tenant(id, organization_id)
        if not term:
            raise ValueError("Academic term not found.")

        self.term_repo.remove(id)

        self.audit_repo.log_action(
            user_id=str(user_id),
            organization_id=str(organization_id),
            action="academic_term.deleted",
            entity_type="AcademicTerm",
            entity_id=str(id),
            ip_address=audit_meta.get("ip_address", "unknown"),
            user_agent=audit_meta.get("user_agent", "unknown"),
            payload={"name": term.name}
        )
        return term
