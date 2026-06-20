import uuid
from sqlalchemy import Column, String, Boolean, UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, AuditMixin
from app.models.user import user_permissions
from app.models.role import role_permissions

class Permission(Base, AuditMixin):
    __tablename__ = "permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    category = Column(String(100), nullable=False, default="General")

    
    # System permission check: true for built-in/non-modifiable permissions
    is_system_permission = Column(Boolean, nullable=False, default=False)

    # Relationships
    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")
    users = relationship("User", secondary=user_permissions, back_populates="permissions")
