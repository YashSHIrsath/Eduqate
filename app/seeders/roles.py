from uuid import UUID
from sqlalchemy.orm import Session
from app.models.role import Role
from app.models.permission import Permission

def seed_system_roles(db: Session, organization_id: UUID) -> Role:
    """
    Seeds default system roles (e.g. Super Admin) for an organization
    and assigns all available system permissions to it.
    """
    # Fetch all permissions currently in database
    all_permissions = db.query(Permission).filter(Permission.deleted_at == None).all()

    # Resolve or create the Super Admin role
    super_admin = db.query(Role).filter(
        Role.name == "Super Admin",
        Role.organization_id == organization_id,
        Role.deleted_at == None
    ).first()

    if not super_admin:
        super_admin = Role(
            name="Super Admin",
            description="System Super Administrator with unrestricted access.",
            is_system_role=True,
            organization_id=organization_id
        )
        db.add(super_admin)
        db.commit()
        db.refresh(super_admin)

    # Sync all permissions to the Super Admin role
    existing_perms = {p.id for p in super_admin.permissions}
    for perm in all_permissions:
        if perm.id not in existing_perms:
            super_admin.permissions.append(perm)
            
    db.commit()
    db.refresh(super_admin)
    return super_admin
