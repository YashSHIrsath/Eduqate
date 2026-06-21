import uuid
from sqlalchemy import Column, String, Integer, UUID, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, AuditMixin

class Section(Base, AuditMixin):
    __tablename__ = "sections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False, index=True)
    capacity = Column(Integer, nullable=True)
    status = Column(String(50), default="active", nullable=False)

    # Relationships
    organization = relationship("Organization", foreign_keys=[organization_id])
    class_rel = relationship("Class", back_populates="sections", foreign_keys=[class_id])
    enrollments = relationship("StudentEnrollment", back_populates="section", cascade="all, delete-orphan")
    teachers = relationship("SubjectTeacher", back_populates="section", cascade="all, delete-orphan")
