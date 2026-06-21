import uuid
from sqlalchemy import Column, String, Boolean, UUID, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.models.base import Base, AuditMixin

class AcademicTerm(Base, AuditMixin):
    __tablename__ = "academic_terms"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    academic_year_id = Column(UUID(as_uuid=True), ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)
    status = Column(String(50), default="active", nullable=False)

    # Relationships
    organization = relationship("Organization", foreign_keys=[organization_id])
    academic_year = relationship("AcademicYear", back_populates="academic_terms", foreign_keys=[academic_year_id])
