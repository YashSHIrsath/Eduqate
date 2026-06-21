import uuid
from sqlalchemy import Column, String, UUID, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, AuditMixin

class ClassSubject(Base, AuditMixin):
    __tablename__ = "class_subjects"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    academic_year_id = Column(UUID(as_uuid=True), ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="active", nullable=False)

    # Relationships
    organization = relationship("Organization", foreign_keys=[organization_id])
    class_rel = relationship("Class", back_populates="class_subjects", foreign_keys=[class_id])
    subject = relationship("Subject", back_populates="class_subjects", foreign_keys=[subject_id])
    academic_year = relationship("AcademicYear", foreign_keys=[academic_year_id])
