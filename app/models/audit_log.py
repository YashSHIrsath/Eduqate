import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, UUID, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.models.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True)
    
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=True)
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(512), nullable=True)
    payload = Column(JSONB, nullable=True)
    
    # Request Correlation ID
    request_id = Column(String(100), nullable=True, index=True)

    # Standard audit timestamps
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="audit_logs")
    organization = relationship("Organization", back_populates="audit_logs")
