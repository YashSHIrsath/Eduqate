import uuid
from sqlalchemy import Column, String, Boolean, UUID, ForeignKey, Table, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import Base, AuditMixin
from app.models.user import user_roles

# Many-to-Many Association Table between Role and Permission
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", UUID(as_uuid=True), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)
)

class Role(Base, AuditMixin):
    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=True, index=True)
    
    name = Column(String(100), nullable=False, index=True)
    description = Column(String(255), nullable=True)
    
    # System role check: true for core system roles like Super Admin
    is_system_role = Column(Boolean, nullable=False, default=False)

    # Unique Constraint per Organization
    __table_args__ = (
        UniqueConstraint("organization_id", "name", name="uq_roles_org_name"),
    )

    # Relationships
    organization = relationship("Organization", back_populates="roles")
    users = relationship("User", secondary=user_roles, back_populates="roles")
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")
