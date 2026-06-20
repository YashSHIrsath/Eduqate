# Eduqate - Feature Tracker

## Phase 1 - Foundation

### Database

* [x] PostgreSQL Connection
* [x] SQLAlchemy Base Structure
* [x] Alembic Setup
* [x] Initial Migration

### Authentication

* [x] User Model
* [x] Password Hashing
* [x] Registration
* [x] Login
* [x] Access Token
* [x] Refresh Token
* [x] Logout
* [x] Token Revocation
* [x] Bootstrap Profile Endpoint (`/auth/me`)
* [x] Effective Permissions Endpoint (`/auth/permissions`)


### Authorization

#### Roles

* [x] Role Model
* [x] Role CRUD

#### Permissions

* [x] Permission Model
* [x] Permission CRUD (Listing, role assignment, and direct user assignment)

#### Mappings

* [x] User Roles
* [x] Role Permissions
* [x] User Permissions (Direct assignment mapping)

#### RBAC

* [x] Permission Middleware (FastAPI RequiresPermission guard)
* [x] Permission Decorators
* [x] Endpoint Protection

### Persona Architecture

* [x] PersonaType enum (SUPER_ADMIN, HEADMASTER, TEACHER, STUDENT)
* [x] `persona_type` column on `users` table (migration + backfill)
* [x] `persona_type` column on `roles` table (migration + backfill)
* [x] Seed Version 2 — four immutable system roles with correct persona + permissions
* [x] Bootstrap lifespan event (startup auto-seeds on every deploy)
* [x] Cross-persona role assignment validation (ValueError → HTTP 400)
* [x] `RequiresPersona` FastAPI dependency (Gate 1 — portal access)
* [x] Admin API router (`/api/v1/admin/*` — SUPER_ADMIN + HEADMASTER)
* [x] Teacher API router (`/api/v1/teacher/*` — TEACHER)
* [x] Student API router (`/api/v1/student/*` — STUDENT)
* [x] Frontend `PersonaType` type + `persona` / `hasPersona()` in AuthProvider
* [x] AdministrationLayout (blue/brand-600 theme)
* [x] TeacherLayout (emerald theme)
* [x] StudentLayout (violet theme)
* [x] Three-portal TanStack Router — persona guards + permission guards per route
* [x] Post-login redirect by persona (`/administration/dashboard`, `/teacher/dashboard`, `/student/dashboard`)

### Audit Logs

* [x] Audit Log Table
* [x] User Action Logging

### Frontend Foundation

* [x] Vite React TypeScript Scaffolding
* [x] Tailwind CSS Styling integration
* [x] TanStack Router Setup (Programmatic routes & guards)
* [x] TanStack Query Caching & state configuration
* [x] Axios Client with silent refresh interceptors
* [x] Auth Context & AuthProvider
* [x] Login Form Card with React Hook Form + Zod
* [x] Protected Dashboard Shell & sidebar nav
* [x] Bootstrap integration (`/auth/me` & `/auth/permissions`)
* [x] 403 Unauthorized redirection page

---

## Phase 2 - User Management

* [x] Users
* [ ] Students
* [ ] Staff
* [ ] Parents

---

## Phase 3 - Academic Structure

* [ ] Academic Years
* [ ] Departments
* [ ] Classes
* [ ] Sections
* [ ] Subjects

---

## Phase 4 - LMS

* [ ] Courses
* [ ] Lessons
* [ ] Learning Content
* [ ] Progress Tracking

---

## Phase 5 - Assessments

* [ ] Quizzes
* [ ] Assignments
* [ ] Exams
* [ ] Grading

---

## Phase 6 - Attendance

* [ ] Student Attendance
* [ ] Staff Attendance

---

## Phase 7 - Communication

* [ ] Notifications
* [ ] Announcements
* [ ] Messaging

---

## Phase 8 - Reporting

* [ ] Reports
* [ ] Analytics
* [ ] Dashboards
