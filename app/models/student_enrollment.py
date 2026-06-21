import uuid
from sqlalchemy import Column, String, DateTime, UUID, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import Base, AuditMixin

class StudentEnrollment(Base, AuditMixin):
    __tablename__ = "student_enrollments"
    __table_args__ = (
        UniqueConstraint("organization_id", "section_id", "academic_year_id", "roll_number", "deleted_at", name="uq_section_year_roll_number"),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    section_id = Column(UUID(as_uuid=True), ForeignKey("sections.id", ondelete="CASCADE"), nullable=False, index=True)
    academic_year_id = Column(UUID(as_uuid=True), ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False, index=True)
    roll_number = Column(String(50), nullable=True)
    status = Column(String(50), default="active", nullable=False)
    enrolled_at = Column(DateTime(timezone=True), nullable=False)

    # Relationships
    organization = relationship("Organization", foreign_keys=[organization_id])
    student = relationship("User", foreign_keys=[student_id])
    class_rel = relationship("Class", foreign_keys=[class_id])
    section = relationship("Section", back_populates="enrollments", foreign_keys=[section_id])
    academic_year = relationship("AcademicYear", foreign_keys=[academic_year_id])
