from sqlalchemy.orm import Session
from app.models.permission import Permission

PERMISSION_CATALOG = [
    # -------------------------------------------------------------------------
    # User Management  (admin portal)
    # -------------------------------------------------------------------------
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
    # -------------------------------------------------------------------------
    # Role Management  (admin portal)
    # -------------------------------------------------------------------------
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
    # -------------------------------------------------------------------------
    # Permission Management  (admin portal)
    # -------------------------------------------------------------------------
    {
        "name": "permissions:view",
        "description": "Ability to list available system permissions.",
        "category": "Permission Management",
        "is_system_permission": True
    },
    # -------------------------------------------------------------------------
    # Organization Management  (admin portal)
    # -------------------------------------------------------------------------
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
    # -------------------------------------------------------------------------
    # Audit Trails  (admin portal)
    # -------------------------------------------------------------------------
    {
        "name": "audit_logs:view",
        "description": "Ability to query and search system audit logs.",
        "category": "Audit Trails",
        "is_system_permission": True
    },
    # -------------------------------------------------------------------------
    # System Administration  (admin portal)
    # -------------------------------------------------------------------------
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
    # -------------------------------------------------------------------------
    # Auth Administration  (admin portal)
    # -------------------------------------------------------------------------
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
    },
    # -------------------------------------------------------------------------
    # Student Management  (admin + headmaster portal)
    # -------------------------------------------------------------------------
    {
        "name": "students:create",
        "description": "Ability to enroll new students.",
        "category": "Student Management",
        "is_system_permission": True
    },
    {
        "name": "students:view",
        "description": "Ability to view student profiles and records.",
        "category": "Student Management",
        "is_system_permission": True
    },
    {
        "name": "students:update",
        "description": "Ability to modify student records.",
        "category": "Student Management",
        "is_system_permission": True
    },
    {
        "name": "students:delete",
        "description": "Ability to remove student records.",
        "category": "Student Management",
        "is_system_permission": True
    },
    # -------------------------------------------------------------------------
    # Staff Management  (admin + headmaster portal)
    # -------------------------------------------------------------------------
    {
        "name": "staff:create",
        "description": "Ability to onboard new staff members.",
        "category": "Staff Management",
        "is_system_permission": True
    },
    {
        "name": "staff:view",
        "description": "Ability to view staff profiles.",
        "category": "Staff Management",
        "is_system_permission": True
    },
    {
        "name": "staff:update",
        "description": "Ability to update staff records.",
        "category": "Staff Management",
        "is_system_permission": True
    },
    {
        "name": "staff:delete",
        "description": "Ability to remove staff records.",
        "category": "Staff Management",
        "is_system_permission": True
    },
    # -------------------------------------------------------------------------
    # Academic Management  (admin + headmaster portal)
    # -------------------------------------------------------------------------
    {
        "name": "academic_years:create",
        "description": "Ability to create academic years.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "academic_years:view",
        "description": "Ability to view academic years.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "academic_years:update",
        "description": "Ability to modify academic years.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "academic_years:delete",
        "description": "Ability to delete academic years.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "academic_terms:create",
        "description": "Ability to create academic terms.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "academic_terms:view",
        "description": "Ability to view academic terms.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "academic_terms:update",
        "description": "Ability to modify academic terms.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "academic_terms:delete",
        "description": "Ability to delete academic terms.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "departments:create",
        "description": "Ability to create departments.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "departments:view",
        "description": "Ability to view departments.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "departments:update",
        "description": "Ability to modify departments.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "departments:delete",
        "description": "Ability to delete departments.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "classes:create",
        "description": "Ability to create classes.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "classes:view",
        "description": "Ability to view classes.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "classes:update",
        "description": "Ability to modify classes.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "classes:delete",
        "description": "Ability to delete classes.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "sections:create",
        "description": "Ability to create sections.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "sections:view",
        "description": "Ability to view sections.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "sections:update",
        "description": "Ability to modify sections.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "sections:delete",
        "description": "Ability to delete sections.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "subjects:create",
        "description": "Ability to create subjects.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "subjects:view",
        "description": "Ability to view subjects.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "subjects:update",
        "description": "Ability to modify subjects.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "subjects:delete",
        "description": "Ability to delete subjects.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "teacher_assignments:create",
        "description": "Ability to create teacher assignments.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "teacher_assignments:view",
        "description": "Ability to view teacher assignments.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "teacher_assignments:update",
        "description": "Ability to modify teacher assignments.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "teacher_assignments:delete",
        "description": "Ability to delete teacher assignments.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "class_subjects:assign",
        "description": "Ability to map subjects to classes.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    {
        "name": "class_subjects:view",
        "description": "Ability to view class subject mappings.",
        "category": "Academic Management",
        "is_system_permission": True
    },
    # -------------------------------------------------------------------------
    # Teacher Portal — Teaching capabilities
    # -------------------------------------------------------------------------
    {
        "name": "classes:view",
        "description": "Ability to view assigned classes and their details.",
        "category": "Teaching",
        "is_system_permission": True
    },
    {
        "name": "attendance:mark",
        "description": "Ability to record student attendance.",
        "category": "Teaching",
        "is_system_permission": True
    },
    {
        "name": "attendance:view",
        "description": "Ability to view attendance records.",
        "category": "Teaching",
        "is_system_permission": True
    },
    {
        "name": "grades:submit",
        "description": "Ability to submit student grades and marks.",
        "category": "Teaching",
        "is_system_permission": True
    },
    {
        "name": "grades:view",
        "description": "Ability to view grade records.",
        "category": "Teaching",
        "is_system_permission": True
    },
    {
        "name": "assignments:create",
        "description": "Ability to create and publish assignments.",
        "category": "Teaching",
        "is_system_permission": True
    },
    {
        "name": "assignments:view",
        "description": "Ability to view assignments and submissions.",
        "category": "Teaching",
        "is_system_permission": True
    },
    # -------------------------------------------------------------------------
    # Student Portal — Learning capabilities
    # -------------------------------------------------------------------------
    {
        "name": "courses:view",
        "description": "Ability to view enrolled courses and learning content.",
        "category": "Learning",
        "is_system_permission": True
    },
    {
        "name": "assignments:submit",
        "description": "Ability to submit assignment responses.",
        "category": "Learning",
        "is_system_permission": True
    },
    {
        "name": "results:view",
        "description": "Ability to view own grades and results.",
        "category": "Learning",
        "is_system_permission": True
    },
    {
        "name": "schedule:view",
        "description": "Ability to view personal class schedule.",
        "category": "Learning",
        "is_system_permission": True
    },
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
