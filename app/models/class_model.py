import uuid
from sqlalchemy import Column, String, UUID, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import Base, AuditMixin

class Class(Base, AuditMixin):
    __tablename__ = "classes"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", "deleted_at", name="uq_class_organization_code"),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    status = Column(String(50), default="active", nullable=False)

    # Relationships
    organization = relationship("Organization", foreign_keys=[organization_id])
    department = relationship("Department", back_populates="classes", foreign_keys=[department_id])
    sections = relationship("Section", back_populates="class_rel", cascade="all, delete-orphan")
    class_subjects = relationship("ClassSubject", back_populates="class_rel", cascade="all, delete-orphan")
