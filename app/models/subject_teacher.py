import uuid
from sqlalchemy import Column, String, Boolean, UUID, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import Base, AuditMixin

class SubjectTeacher(Base, AuditMixin):
    __tablename__ = "subject_teachers"
    __table_args__ = (
        UniqueConstraint("organization_id", "teacher_id", "section_id", "subject_id", "academic_year_id", "deleted_at", name="uq_teacher_section_subject_year"),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    section_id = Column(UUID(as_uuid=True), ForeignKey("sections.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    academic_year_id = Column(UUID(as_uuid=True), ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False, index=True)
    is_primary = Column(Boolean, default=True, nullable=False)
    status = Column(String(50), default="active", nullable=False)

    # Relationships
    organization = relationship("Organization", foreign_keys=[organization_id])
    teacher = relationship("User", foreign_keys=[teacher_id])
    section = relationship("Section", back_populates="teachers", foreign_keys=[section_id])
    subject = relationship("Subject", back_populates="teachers", foreign_keys=[subject_id])
    academic_year = relationship("AcademicYear", foreign_keys=[academic_year_id])
