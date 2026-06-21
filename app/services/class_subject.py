from uuid import UUID
from typing import List, Optional
from sqlalchemy.orm import Session
from app.repositories.class_subject import ClassSubjectRepository
from app.repositories.class_model import ClassRepository
from app.repositories.subject import SubjectRepository
from app.repositories.academic_year import AcademicYearRepository
from app.repositories.audit_log import AuditLogRepository
from app.models.class_subject import ClassSubject

class ClassSubjectService:
    def __init__(
        self,
        db: Session,
        class_subject_repo: ClassSubjectRepository,
        class_repo: ClassRepository,
        subject_repo: SubjectRepository,
        year_repo: AcademicYearRepository,
        audit_repo: AuditLogRepository
    ):
        self.db = db
        self.class_subject_repo = class_subject_repo
        self.class_repo = class_repo
        self.subject_repo = subject_repo
        self.year_repo = year_repo
        self.audit_repo = audit_repo

    def assign_subjects_to_class(
        self,
        organization_id: UUID,
        class_id: UUID,
        subject_ids: List[UUID],
        academic_year_id: UUID,
        user_id: UUID,
        audit_meta: dict
    ) -> List[ClassSubject]:
        # Validate class in tenant
        cls_obj = self.class_repo.get_by_id_tenant(class_id, organization_id)
        if not cls_obj:
            raise ValueError("Class not found or belongs to another organization.")

        # Validate academic year in tenant
        year = self.year_repo.get_by_id_tenant(academic_year_id, organization_id)
        if not year:
            raise ValueError("Academic year not found or belongs to another organization.")

        created_mappings = []

        for sub_id in subject_ids:
            # Validate subject in tenant
            sub = self.subject_repo.get_by_id_tenant(sub_id, organization_id)
            if not sub:
                raise ValueError(f"Subject with ID '{sub_id}' not found or belongs to another organization.")

            # Check if mapping already exists
            existing = self.class_subject_repo.get_by_mapping(
                class_id=class_id,
                subject_id=sub_id,
                academic_year_id=academic_year_id,
                organization_id=organization_id
            )
            if existing:
                # If it already exists, skip it (or raise error based on preference, skipping is safe or we can raise ValueError. Let's raise ValueError to be strict as user requested "prevent duplicate mappings").
                raise ValueError(f"Subject '{sub.name}' is already assigned to this class for the selected academic year.")

            mapping = ClassSubject(
                organization_id=organization_id,
                class_id=class_id,
                subject_id=sub_id,
                academic_year_id=academic_year_id,
                status="active",
                created_by=user_id,
                updated_by=user_id
            )
            self.class_subject_repo.create(mapping)
            created_mappings.append(mapping)

            self.audit_repo.log_action(
                user_id=str(user_id),
                organization_id=str(organization_id),
                action="class_subject.created",
                entity_type="ClassSubject",
                entity_id=str(mapping.id),
                ip_address=audit_meta.get("ip_address", "unknown"),
                user_agent=audit_meta.get("user_agent", "unknown"),
                payload={
                    "class_id": str(class_id),
                    "subject_id": str(sub_id),
                    "academic_year_id": str(academic_year_id)
                }
            )

        return created_mappings

    def get_assigned_subjects(
        self,
        organization_id: UUID,
        class_id: UUID,
        academic_year_id: UUID
    ) -> List[ClassSubject]:
        # Validate class in tenant
        cls_obj = self.class_repo.get_by_id_tenant(class_id, organization_id)
        if not cls_obj:
            raise ValueError("Class not found or belongs to another organization.")
            
        return self.class_subject_repo.get_subjects_by_class(class_id, academic_year_id, organization_id)

    def remove_subject_from_class(
        self,
        organization_id: UUID,
        class_id: UUID,
        subject_id: UUID,
        academic_year_id: UUID,
        user_id: UUID,
        audit_meta: dict
    ) -> ClassSubject:
        # Check mapping exists
        mapping = self.class_subject_repo.get_by_mapping(
            class_id=class_id,
            subject_id=subject_id,
            academic_year_id=academic_year_id,
            organization_id=organization_id
        )
        if not mapping:
            raise ValueError("Class-Subject assignment mapping not found.")

        self.class_subject_repo.remove(mapping.id)

        self.audit_repo.log_action(
            user_id=str(user_id),
            organization_id=str(organization_id),
            action="class_subject.deleted",
            entity_type="ClassSubject",
            entity_id=str(mapping.id),
            ip_address=audit_meta.get("ip_address", "unknown"),
            user_agent=audit_meta.get("user_agent", "unknown"),
            payload={
                "class_id": str(class_id),
                "subject_id": str(subject_id),
                "academic_year_id": str(academic_year_id)
            }
        )
        return mapping
