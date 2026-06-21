import uuid
from sqlalchemy import Column, String, Text, UUID, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, AuditMixin

class Department(Base, AuditMixin):
    __tablename__ = "departments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="active", nullable=False)

    # Relationships
    organization = relationship("Organization", foreign_keys=[organization_id])
    classes = relationship("Class", back_populates="department")
    subjects = relationship("Subject", back_populates="department")
