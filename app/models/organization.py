import uuid
from sqlalchemy import Column, String, UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, AuditMixin

class Organization(Base, AuditMixin):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    
    # Status replaces is_active: e.g. "active", "inactive", "suspended"
    status = Column(String(50), nullable=False, default="active")

    # Relationships
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    roles = relationship("Role", back_populates="organization", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="organization")
