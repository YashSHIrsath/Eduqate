# Eduqate - Development Standards

## Mandatory Reading

Before starting ANY task, read:

1. PROJECT_OVERVIEW.md
2. CODE_STANDARDS.md
3. FEATURE_TRACKER.md

These files are the source of truth.

---

# Development Workflow

Before implementation provide:

## Analysis

* Current state
* Dependencies
* Risks

## Plan

* What will be built
* Why it is required
* Where it fits in architecture

## Files

* Files to create
* Files to modify

## Database Impact

* Tables affected
* Migrations required
* Relationships affected

## Security Impact

* Authentication impact
* Authorization impact
* Data protection concerns

Wait for approval when requested.

---

# Dependency Management

Never install packages automatically.

Before adding any package:

1. Explain why it is required.
2. Explain alternatives.
3. Explain tradeoffs.
4. Wait for approval.

No exceptions.

---

# Architecture Rules

Follow:

* Clean Architecture
* SOLID Principles
* Separation of Concerns
* DRY
* Modular Design

Avoid:

* Massive files
* Duplicate logic
* Business logic in routes
* Tight coupling
* Hidden dependencies

---

# Project Structure Standards

This structure is mandatory.

app/
├── api/
│   └── v1/
│       ├── endpoints/
│       └── router.py
│
├── core/
│   ├── config.py
│   ├── database.py
│   ├── security.py
│   └── constants.py
│
├── models/
│   ├── base.py
│   ├── organization.py
│   ├── user.py
│   ├── role.py
│   ├── permission.py
│   ├── refresh_token.py
│   └── audit_log.py
│
├── schemas/
│
├── services/
│
├── repositories/
│
├── dependencies/
│
├── middleware/
│
├── utils/
│
└── main.py

alembic/
tests/
docs/

Rules:

1. Routes belong in api/.
2. Models belong in models/.
3. Schemas belong in schemas/.
4. Business logic belongs in services/.
5. Database access belongs in repositories/.
6. Auth dependencies belong in dependencies/.
7. Middleware belongs in middleware/.
8. Shared utilities belong in utils/.
9. No SQL queries in routes.
10. No business logic in routes.
11. Services should communicate with repositories.
12. Repositories should communicate with database/models.

Do not create new top-level folders without approval.

---

# Database Standards

All schema changes must be migration-driven.

Never modify database tables manually.

Use:

* SQLAlchemy 2.x
* Alembic

Every table should contain:

* id
* created_at
* updated_at

Where applicable:

* deleted_at
* created_by
* updated_by

Use UUID primary keys.

Use timezone-aware timestamps.

---

# Authentication Standards

Authentication must be enterprise-grade.

Requirements:

* JWT Access Tokens
* Refresh Tokens
* Refresh Token Rotation
* Token Revocation
* Account Locking
* Secure Password Hashing

Use:

* Argon2

Do not:

* Store plain passwords
* Store raw refresh tokens
* Hardcode secrets

---

# Authorization Standards

Authorization must be database-driven.

No hardcoded permissions.

No hardcoded roles.

Required Tables:

* users
* roles
* permissions
* user_roles
* user_permissions
* role_permissions

Permission Format:

resource:action

Examples:

* users:create

* users:view

* users:update

* users:delete

* roles:create

* roles:view

* courses:create

* courses:view

Future UI will manage permissions using checkboxes.

---

# Audit Standards

Critical actions must be auditable.

Audit logs should track:

* user
* action
* entity_type
* entity_id
* ip_address
* user_agent
* payload

Examples:

* user.login
* user.logout
* role.created
* permission.updated

---

# Multi-Tenant Standards

Eduqate must support multiple organizations.

Organization support should be considered in all future modules.

Examples:

* School A
* School B
* College C

Do not design modules assuming only one organization exists.

All business entities must be organization-aware unless explicitly global.

---

# Documentation Standards

For every major task provide:

* Plan
* Files Modified
* Database Impact
* Security Impact
* Verification Steps

---

# Feature Tracking

Whenever a feature is completed:

1. Update FEATURE_TRACKER.md
2. Mark completed items
3. Add notes if needed
4. Identify next logical task

---

# Scope Control

Implement only the approved scope.

Do not:

* Add future features early
* Create unnecessary abstractions
* Build modules not requested
* Skip project phases

Focus on the current milestone.
