import uuid
from sqlalchemy import Column, String, Boolean, UUID, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.models.base import Base, AuditMixin

class AcademicYear(Base, AuditMixin):
    __tablename__ = "academic_years"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_current = Column(Boolean, default=False, nullable=False)
    status = Column(String(50), default="active", nullable=False)

    # Relationships
    organization = relationship("Organization", foreign_keys=[organization_id])
    academic_terms = relationship("AcademicTerm", back_populates="academic_year", cascade="all, delete-orphan")
