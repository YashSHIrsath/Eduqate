from uuid import UUID
from sqlalchemy.orm import Session
from app.models.role import Role
from app.models.permission import Permission
from app.core.constants import PersonaType

# Permissions granted to the Headmaster system role
HEADMASTER_PERMISSIONS = {
    "users:create", "users:view", "users:update", "users:delete",
    "users:assign_roles", "users:assign_permissions",
    "roles:view",
    "permissions:view",
    "students:create", "students:view", "students:update", "students:delete",
    "staff:create", "staff:view", "staff:update", "staff:delete",
    "academic:create", "academic:view", "academic:update", "academic:delete",
    "audit_logs:view",
    "settings:view",
    "auth:lockout_reset",
}

# Permissions granted to the Teacher system role
TEACHER_PERMISSIONS = {
    "classes:view",
    "attendance:mark", "attendance:view",
    "grades:submit", "grades:view",
    "assignments:create", "assignments:view",
    "students:view",
}

# Permissions granted to the Student system role
STUDENT_PERMISSIONS = {
    "courses:view",
    "assignments:submit", "assignments:view",
    "results:view",
    "schedule:view",
    "attendance:view",
}


def _resolve_or_create_role(
    db: Session,
    organization_id: UUID,
    name: str,
    persona_type: str,
    description: str,
) -> Role:
    """Return the named system role for the org, creating (or promoting) it if absent."""
    role = db.query(Role).filter(
        Role.name == name,
        Role.organization_id == organization_id,
        Role.deleted_at == None,
    ).first()

    if role:
        # Promote to system role and correct persona_type if needed
        changed = False
        if not role.is_system_role:
            role.is_system_role = True
            changed = True
        if role.persona_type != persona_type:
            role.persona_type = persona_type
            changed = True
        if changed:
            db.commit()
            db.refresh(role)
        return role

    role = Role(
        name=name,
        description=description,
        persona_type=persona_type,
        is_system_role=True,
        organization_id=organization_id,
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def _sync_permissions(db: Session, role: Role, permission_names: set) -> None:
    """Assign the given permission names to a role, adding any that are missing."""
    existing_names = {p.name for p in role.permissions}
    new_perms = db.query(Permission).filter(
        Permission.name.in_(permission_names - existing_names),
        Permission.deleted_at == None,
    ).all()
    for perm in new_perms:
        role.permissions.append(perm)
    db.commit()
    db.refresh(role)


def seed_system_roles(db: Session, organization_id: UUID) -> Role:
    """
    Seeds all four immutable system roles for an organization.
    Returns the Super Admin role (used during first-user bootstrap).
    """
    all_permissions = db.query(Permission).filter(Permission.deleted_at == None).all()

    # --- Super Admin: receives every permission ---
    super_admin = _resolve_or_create_role(
        db, organization_id,
        name="Super Admin",
        persona_type=PersonaType.SUPER_ADMIN,
        description="Platform-level administrator with unrestricted access.",
    )
    existing_super = {p.id for p in super_admin.permissions}
    for perm in all_permissions:
        if perm.id not in existing_super:
            super_admin.permissions.append(perm)
    db.commit()
    db.refresh(super_admin)

    # --- Headmaster ---
    headmaster = _resolve_or_create_role(
        db, organization_id,
        name="Headmaster",
        persona_type=PersonaType.HEADMASTER,
        description="School administrator managing academic, staff, and student operations.",
    )
    _sync_permissions(db, headmaster, HEADMASTER_PERMISSIONS)

    # --- Teacher ---
    teacher = _resolve_or_create_role(
        db, organization_id,
        name="Teacher",
        persona_type=PersonaType.TEACHER,
        description="Educator with access to classes, attendance, grades, and assignments.",
    )
    _sync_permissions(db, teacher, TEACHER_PERMISSIONS)

    # --- Student ---
    student = _resolve_or_create_role(
        db, organization_id,
        name="Student",
        persona_type=PersonaType.STUDENT,
        description="Learner with access to courses, assignments, and results.",
    )
    _sync_permissions(db, student, STUDENT_PERMISSIONS)

    return super_admin
