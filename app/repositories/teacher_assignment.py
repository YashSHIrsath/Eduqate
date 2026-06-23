from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import asc, desc
from app.repositories.base import BaseRepository
from app.models.subject_teacher import SubjectTeacher

class TeacherAssignmentRepository(BaseRepository[SubjectTeacher]):
    def __init__(self, db: Session):
        super().__init__(db, SubjectTeacher)

    def get_by_id_tenant(self, id: UUID, organization_id: UUID) -> Optional[SubjectTeacher]:
        return self.db.query(SubjectTeacher).options(
            joinedload(SubjectTeacher.teacher)
        ).filter(
            SubjectTeacher.id == id,
            SubjectTeacher.organization_id == organization_id,
            SubjectTeacher.deleted_at == None
        ).first()

    def get_paginated(
        self,
        organization_id: UUID,
        teacher_id: Optional[UUID] = None,
        academic_year_id: Optional[UUID] = None,
        page: int = 1,
        page_size: int = 10,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Tuple[List[SubjectTeacher], int]:
        query = self.db.query(SubjectTeacher).options(
            joinedload(SubjectTeacher.teacher)
        ).filter(
            SubjectTeacher.organization_id == organization_id,
            SubjectTeacher.deleted_at == None
        )

        if teacher_id:
            query = query.filter(SubjectTeacher.teacher_id == teacher_id)

        if academic_year_id:
            query = query.filter(SubjectTeacher.academic_year_id == academic_year_id)

        total_count = query.count()

        sort_col = getattr(SubjectTeacher, sort_by, SubjectTeacher.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(asc(sort_col))

        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        return items, total_count

    def get_assignments_by_teacher(self, teacher_id: UUID, academic_year_id: UUID) -> List[SubjectTeacher]:
        return self.db.query(SubjectTeacher).filter(
            SubjectTeacher.teacher_id == teacher_id,
            SubjectTeacher.academic_year_id == academic_year_id,
            SubjectTeacher.deleted_at == None
        ).all()

    def has_primary_teacher(self, section_id: UUID, subject_id: UUID, academic_year_id: UUID) -> bool:
        """Check if a primary teacher is already assigned to the section-subject for the academic year."""
        return self.db.query(SubjectTeacher).filter(
            SubjectTeacher.section_id == section_id,
            SubjectTeacher.subject_id == subject_id,
            SubjectTeacher.academic_year_id == academic_year_id,
            SubjectTeacher.is_primary == True,
            SubjectTeacher.deleted_at == None
        ).first() is not None
