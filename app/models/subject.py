import uuid
from sqlalchemy import Column, String, Text, UUID, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import Base, AuditMixin

class Subject(Base, AuditMixin):
    __tablename__ = "subjects"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", "deleted_at", name="uq_subject_organization_code"),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="active", nullable=False)

    # Relationships
    organization = relationship("Organization", foreign_keys=[organization_id])
    department = relationship("Department", back_populates="subjects", foreign_keys=[department_id])
    class_subjects = relationship("ClassSubject", back_populates="subject", cascade="all, delete-orphan")
    teachers = relationship("SubjectTeacher", back_populates="subject", cascade="all, delete-orphan")
