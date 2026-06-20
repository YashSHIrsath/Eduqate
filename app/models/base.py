import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, UUID, ForeignKey
from sqlalchemy.orm import DeclarativeBase, declared_attr

# Declarative Base for SQLAlchemy 2.0
class Base(DeclarativeBase):
    pass

class AuditMixin:
    """
    Mixin adding audit tracking and soft delete capabilities.
    Uses timezone-aware timestamps.
    """
    @declared_attr
    def created_at(cls):
        return Column(
            DateTime(timezone=True),
            default=lambda: datetime.now(timezone.utc),
            nullable=False
        )

    @declared_attr
    def updated_at(cls):
        return Column(
            DateTime(timezone=True),
            default=lambda: datetime.now(timezone.utc),
            onupdate=lambda: datetime.now(timezone.utc),
            nullable=False
        )

    @declared_attr
    def deleted_at(cls):
        return Column(DateTime(timezone=True), nullable=True)

    @declared_attr
    def created_by(cls):
        return Column(
            UUID(as_uuid=True),
            ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True
        )

    @declared_attr
    def updated_by(cls):
        return Column(
            UUID(as_uuid=True),
            ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True
        )
