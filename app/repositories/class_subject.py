from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.class_subject import ClassSubject

class ClassSubjectRepository(BaseRepository[ClassSubject]):
    def __init__(self, db: Session):
        super().__init__(db, ClassSubject)

    def get_by_id_tenant(self, id: UUID, organization_id: UUID) -> Optional[ClassSubject]:
        return self.db.query(ClassSubject).filter(
            ClassSubject.id == id,
            ClassSubject.organization_id == organization_id,
            ClassSubject.deleted_at == None
        ).first()

    def get_by_mapping(self, class_id: UUID, subject_id: UUID, academic_year_id: UUID, organization_id: UUID) -> Optional[ClassSubject]:
        return self.db.query(ClassSubject).filter(
            ClassSubject.class_id == class_id,
            ClassSubject.subject_id == subject_id,
            ClassSubject.academic_year_id == academic_year_id,
            ClassSubject.organization_id == organization_id,
            ClassSubject.deleted_at == None
        ).first()

    def get_subjects_by_class(self, class_id: UUID, academic_year_id: UUID, organization_id: UUID) -> List[ClassSubject]:
        return self.db.query(ClassSubject).filter(
            ClassSubject.class_id == class_id,
            ClassSubject.academic_year_id == academic_year_id,
            ClassSubject.organization_id == organization_id,
            ClassSubject.deleted_at == None
        ).all()
