import uuid
from sqlalchemy import Column, String, Integer, Boolean, DateTime, UUID, ForeignKey, Table, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import Base, AuditMixin

# Many-to-Many Association Tables
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
)

user_permissions = Table(
    "user_permissions",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", UUID(as_uuid=True), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)
)

class User(Base, AuditMixin):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=True, index=True)
    
    email = Column(String(255), nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    
    # Replaces is_active: e.g. "active", "inactive", "suspended"
    status = Column(String(50), nullable=False, default="active")
    must_change_password = Column(Boolean, nullable=False, default=False)


    # Security Tracking Fields
    failed_login_attempts = Column(Integer, nullable=False, default=0)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    last_password_change_at = Column(DateTime(timezone=True), nullable=True)

    # Unique Constraint per Organization
    __table_args__ = (
        UniqueConstraint("organization_id", "email", name="uq_users_org_email"),
    )

    # Relationships
    organization = relationship("Organization", back_populates="users", foreign_keys=[organization_id])
    roles = relationship("Role", secondary=user_roles, back_populates="users")
    permissions = relationship("Permission", secondary=user_permissions, back_populates="users")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")
