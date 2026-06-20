from sqlalchemy.orm import Session
from app.models.permission import Permission

PERMISSION_CATALOG = [
    # User Management
    {
        "name": "users:create",
        "description": "Ability to create new user accounts.",
        "category": "User Management",
        "is_system_permission": True
    },
    {
        "name": "users:view",
        "description": "Ability to view user profiles and lists.",
        "category": "User Management",
        "is_system_permission": True
    },
    {
        "name": "users:update",
        "description": "Ability to modify user accounts.",
        "category": "User Management",
        "is_system_permission": True
    },
    {
        "name": "users:delete",
        "description": "Ability to soft-delete user accounts.",
        "category": "User Management",
        "is_system_permission": True
    },
    {
        "name": "users:assign_roles",
        "description": "Ability to assign roles to users.",
        "category": "User Management",
        "is_system_permission": True
    },
    {
        "name": "users:assign_permissions",
        "description": "Ability to assign direct permissions to users.",
        "category": "User Management",
        "is_system_permission": True
    },
    # Role Management
    {
        "name": "roles:create",
        "description": "Ability to define new roles for the organization.",
        "category": "Role Management",
        "is_system_permission": True
    },
    {
        "name": "roles:view",
        "description": "Ability to view role lists and details.",
        "category": "Role Management",
        "is_system_permission": True
    },
    {
        "name": "roles:update",
        "description": "Ability to edit role names and descriptions.",
        "category": "Role Management",
        "is_system_permission": True
    },
    {
        "name": "roles:delete",
        "description": "Ability to delete organization roles.",
        "category": "Role Management",
        "is_system_permission": True
    },
    {
        "name": "roles:assign_permissions",
        "description": "Ability to assign permissions to roles.",
        "category": "Role Management",
        "is_system_permission": True
    },
    # Permission Management
    {
        "name": "permissions:view",
        "description": "Ability to list available system permissions.",
        "category": "Permission Management",
        "is_system_permission": True
    },
    # Organization Management
    {
        "name": "organizations:create",
        "description": "Ability to onboard new organizations (restricted to global admins).",
        "category": "Organization Management",
        "is_system_permission": True
    },
    {
        "name": "organizations:view",
        "description": "Ability to view organization profiles.",
        "category": "Organization Management",
        "is_system_permission": True
    },
    {
        "name": "organizations:update",
        "description": "Ability to modify organization status and metadata.",
        "category": "Organization Management",
        "is_system_permission": True
    },
    {
        "name": "organizations:delete",
        "description": "Ability to delete/suspend organizations.",
        "category": "Organization Management",
        "is_system_permission": True
    },
    # Audit Trails
    {
        "name": "audit_logs:view",
        "description": "Ability to query and search system audit logs.",
        "category": "Audit Trails",
        "is_system_permission": True
    },
    # System Administration
    {
        "name": "system:view",
        "description": "Ability to view global system configuration status.",
        "category": "System Administration",
        "is_system_permission": True
    },
    {
        "name": "system:update",
        "description": "Ability to modify core system settings.",
        "category": "System Administration",
        "is_system_permission": True
    },
    {
        "name": "settings:view",
        "description": "Ability to view platform configuration settings.",
        "category": "System Administration",
        "is_system_permission": True
    },
    {
        "name": "settings:update",
        "description": "Ability to edit platform configuration settings.",
        "category": "System Administration",
        "is_system_permission": True
    },
    # Auth Administration
    {
        "name": "auth:lockout_reset",
        "description": "Ability to unlock user lockouts and reset failed counters.",
        "category": "Auth Administration",
        "is_system_permission": True
    },
    {
        "name": "auth:session_revoke",
        "description": "Ability to revoke user sessions and force logout.",
        "category": "Auth Administration",
        "is_system_permission": True
    }
]

def seed_permissions(db: Session):
    """Seed the database with all defined global system permissions."""
    for perm_data in PERMISSION_CATALOG:
        perm = db.query(Permission).filter(Permission.name == perm_data["name"]).first()
        if not perm:
            perm = Permission(
                name=perm_data["name"],
                description=perm_data["description"],
                category=perm_data["category"],
                is_system_permission=perm_data["is_system_permission"]
            )
            db.add(perm)
        else:
            # Synchronize description and category updates
            perm.description = perm_data["description"]
            perm.category = perm_data["category"]
    db.commit()
