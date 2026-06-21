import json
from uuid import UUID
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.repositories.teacher_assignment import TeacherAssignmentRepository
from app.repositories.user import UserRepository
from app.repositories.section import SectionRepository
from app.repositories.subject import SubjectRepository
from app.repositories.academic_year import AcademicYearRepository
from app.repositories.audit_log import AuditLogRepository
from app.models.subject_teacher import SubjectTeacher
from app.schemas.teacher_assignment import TeacherAssignmentCreate, TeacherAssignmentUpdate
from app.core.constants import PersonaType

class TeacherAssignmentService:
    def __init__(
        self,
        db: Session,
        assignment_repo: TeacherAssignmentRepository,
        user_repo: UserRepository,
        section_repo: SectionRepository,
        subject_repo: SubjectRepository,
        year_repo: AcademicYearRepository,
        audit_repo: AuditLogRepository
    ):
        self.db = db
        self.assignment_repo = assignment_repo
        self.user_repo = user_repo
        self.section_repo = section_repo
        self.subject_repo = subject_repo
        self.year_repo = year_repo
        self.audit_repo = audit_repo

    def _validate_assignment_relations(self, organization_id: UUID, teacher_id: UUID, section_id: UUID, subject_id: UUID, academic_year_id: UUID):
        # Validate teacher
        teacher = self.user_repo.get(teacher_id)
        if not teacher or teacher.organization_id != organization_id or teacher.deleted_at is not None:
            raise ValueError("Teacher not found or belongs to another organization.")
        if teacher.persona_type != PersonaType.TEACHER.value:
            raise ValueError(f"Selected user is not a teacher (persona: {teacher.persona_type}).")

        # Validate section
        section = self.section_repo.get_by_id_tenant(section_id, organization_id)
        if not section:
            raise ValueError("Section not found or belongs to another organization.")

        # Validate subject
        subject = self.subject_repo.get_by_id_tenant(subject_id, organization_id)
        if not subject:
            raise ValueError("Subject not found or belongs to another organization.")

        # Validate academic year
        year = self.year_repo.get_by_id_tenant(academic_year_id, organization_id)
        if not year:
            raise ValueError("Academic year not found or belongs to another organization.")

    def create_assignment(self, organization_id: UUID, payload: TeacherAssignmentCreate, user_id: UUID, audit_meta: dict) -> SubjectTeacher:
        self._validate_assignment_relations(
            organization_id,
            payload.teacher_id,
            payload.section_id,
            payload.subject_id,
            payload.academic_year_id
        )

        # Check primary teacher uniqueness constraint
        if payload.is_primary:
            if self.assignment_repo.has_primary_teacher(payload.section_id, payload.subject_id, payload.academic_year_id):
                raise ValueError("A primary teacher is already assigned to this section and subject for the academic year.")

        # Check duplicate teacher assignment (same teacher, section, subject, academic year)
        duplicate = self.db.query(SubjectTeacher).filter(
            SubjectTeacher.organization_id == organization_id,
            SubjectTeacher.teacher_id == payload.teacher_id,
            SubjectTeacher.section_id == payload.section_id,
            SubjectTeacher.subject_id == payload.subject_id,
            SubjectTeacher.academic_year_id == payload.academic_year_id,
            SubjectTeacher.deleted_at == None
        ).first()
        if duplicate:
            raise ValueError("This teacher is already assigned to this section and subject for this academic year.")

        assignment = SubjectTeacher(
            organization_id=organization_id,
            teacher_id=payload.teacher_id,
            section_id=payload.section_id,
            subject_id=payload.subject_id,
            academic_year_id=payload.academic_year_id,
            is_primary=payload.is_primary,
            status=payload.status,
            created_by=user_id,
            updated_by=user_id
        )
        self.assignment_repo.create(assignment)

        self.audit_repo.log_action(
            user_id=str(user_id),
            organization_id=str(organization_id),
            action="teacher_assignment.created",
            entity_type="SubjectTeacher",
            entity_id=str(assignment.id),
            ip_address=audit_meta.get("ip_address", "unknown"),
            user_agent=audit_meta.get("user_agent", "unknown"),
            payload={
                "teacher_id": str(assignment.teacher_id),
                "section_id": str(assignment.section_id),
                "subject_id": str(assignment.subject_id),
                "academic_year_id": str(assignment.academic_year_id),
                "is_primary": assignment.is_primary
            }
        )
        return assignment

    def update_assignment(self, id: UUID, organization_id: UUID, payload: TeacherAssignmentUpdate, user_id: UUID, audit_meta: dict) -> SubjectTeacher:
        assignment = self.assignment_repo.get_by_id_tenant(id, organization_id)
        if not assignment:
            raise ValueError("Teacher assignment not found.")

        # Gather target values
        t_id = payload.teacher_id or assignment.teacher_id
        s_id = payload.section_id or assignment.section_id
        sub_id = payload.subject_id or assignment.subject_id
        y_id = payload.academic_year_id or assignment.academic_year_id
        is_p = payload.is_primary if payload.is_primary is not None else assignment.is_primary

        self._validate_assignment_relations(organization_id, t_id, s_id, sub_id, y_id)

        # If changing is_primary to True or changing the target section/subject/year while is_primary is True
        if is_p and (not assignment.is_primary or s_id != assignment.section_id or sub_id != assignment.subject_id or y_id != assignment.academic_year_id):
            # Check if there is another primary teacher
            other_primary = self.db.query(SubjectTeacher).filter(
                SubjectTeacher.id != assignment.id,
                SubjectTeacher.section_id == s_id,
                SubjectTeacher.subject_id == sub_id,
                SubjectTeacher.academic_year_id == y_id,
                SubjectTeacher.is_primary == True,
                SubjectTeacher.deleted_at == None
            ).first()
            if other_primary:
                raise ValueError("A primary teacher is already assigned to this section and subject for the academic year.")

        # Check duplicate teacher assignment (excluding itself)
        duplicate = self.db.query(SubjectTeacher).filter(
            SubjectTeacher.id != assignment.id,
            SubjectTeacher.organization_id == organization_id,
            SubjectTeacher.teacher_id == t_id,
            SubjectTeacher.section_id == s_id,
            SubjectTeacher.subject_id == sub_id,
            SubjectTeacher.academic_year_id == y_id,
            SubjectTeacher.deleted_at == None
        ).first()
        if duplicate:
            raise ValueError("This teacher is already assigned to this section and subject for this academic year.")

        update_data = payload.model_dump(exclude_none=True)
        update_data["updated_by"] = user_id
        self.assignment_repo.update(assignment, update_data)

        self.audit_repo.log_action(
            user_id=str(user_id),
            organization_id=str(organization_id),
            action="teacher_assignment.updated",
            entity_type="SubjectTeacher",
            entity_id=str(assignment.id),
            ip_address=audit_meta.get("ip_address", "unknown"),
            user_agent=audit_meta.get("user_agent", "unknown"),
            payload=json.loads(json.dumps(update_data, default=str))
        )
        return assignment

    def delete_assignment(self, id: UUID, organization_id: UUID, user_id: UUID, audit_meta: dict) -> SubjectTeacher:
        assignment = self.assignment_repo.get_by_id_tenant(id, organization_id)
        if not assignment:
            raise ValueError("Teacher assignment not found.")

        self.assignment_repo.remove(id)

        self.audit_repo.log_action(
            user_id=str(user_id),
            organization_id=str(organization_id),
            action="teacher_assignment.deleted",
            entity_type="SubjectTeacher",
            entity_id=str(id),
            ip_address=audit_meta.get("ip_address", "unknown"),
            user_agent=audit_meta.get("user_agent", "unknown"),
            payload={
                "teacher_id": str(assignment.teacher_id),
                "section_id": str(assignment.section_id),
                "subject_id": str(assignment.subject_id),
                "academic_year_id": str(assignment.academic_year_id)
            }
        )
        return assignment
