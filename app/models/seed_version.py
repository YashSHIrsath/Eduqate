import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, UUID
from app.models.base import Base

class SeedVersion(Base):
    __tablename__ = "seed_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version = Column(Integer, unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    
    applied_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
