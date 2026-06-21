import React, { Suspense } from 'react';
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router';

import { useAuth } from '../features/auth';
import type { PersonaType } from '../features/auth/types';
import { LoginCard } from '../features/auth/components/LoginCard';

import { AdministrationLayout } from '../features/portal/layouts/AdministrationLayout';
import { TeacherLayout } from '../features/portal/layouts/TeacherLayout';
import { StudentLayout } from '../features/portal/layouts/StudentLayout';

const UserList            = React.lazy(() => import('../features/users/components/UserList').then(m => ({ default: m.UserList })));
const UserDetails         = React.lazy(() => import('../features/users/components/UserDetails').then(m => ({ default: m.UserDetails })));
const UserCreate          = React.lazy(() => import('../features/users/components/UserCreate').then(m => ({ default: m.UserCreate })));
const UserEdit            = React.lazy(() => import('../features/users/components/UserEdit').then(m => ({ default: m.UserEdit })));
const ForcedPasswordChange = React.lazy(() => import('../features/users/components/ForcedPasswordChange').then(m => ({ default: m.ForcedPasswordChange })));
const DashboardHome       = React.lazy(() => import('../features/dashboard/components/DashboardHome').then(m => ({ default: m.DashboardHome })));
const RoleList            = React.lazy(() => import('../features/roles/components/RoleList').then(m => ({ default: m.RoleList })));
const RoleCreate          = React.lazy(() => import('../features/roles/components/RoleCreate').then(m => ({ default: m.RoleCreate })));
const RoleDetails         = React.lazy(() => import('../features/roles/components/RoleDetails').then(m => ({ default: m.RoleDetails })));
const RoleEdit            = React.lazy(() => import('../features/roles/components/RoleEdit').then(m => ({ default: m.RoleEdit })));
const PermissionsMatrix   = React.lazy(() => import('../features/permissions/components/PermissionsMatrix').then(m => ({ default: m.PermissionsMatrix })));
const TeacherDashboard    = React.lazy(() => import('../features/portal/components/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));
const StudentDashboard    = React.lazy(() => import('../features/portal/components/StudentDashboard').then(m => ({ default: m.StudentDashboard })));

// Academic Years
const AcademicYearList    = React.lazy(() => import('../features/academic/components/AcademicYearList').then(m => ({ default: m.AcademicYearList })));
const AcademicYearDetails = React.lazy(() => import('../features/academic/components/AcademicYearDetails').then(m => ({ default: m.AcademicYearDetails })));
const AcademicYearCreate  = React.lazy(() => import('../features/academic/components/AcademicYearCreate').then(m => ({ default: m.AcademicYearCreate })));
const AcademicYearEdit    = React.lazy(() => import('../features/academic/components/AcademicYearEdit').then(m => ({ default: m.AcademicYearEdit })));

// Academic Terms
const AcademicTermList    = React.lazy(() => import('../features/academic/components/AcademicTermList').then(m => ({ default: m.AcademicTermList })));
const AcademicTermDetails = React.lazy(() => import('../features/academic/components/AcademicTermDetails').then(m => ({ default: m.AcademicTermDetails })));
const AcademicTermCreate  = React.lazy(() => import('../features/academic/components/AcademicTermCreate').then(m => ({ default: m.AcademicTermCreate })));
const AcademicTermEdit    = React.lazy(() => import('../features/academic/components/AcademicTermEdit').then(m => ({ default: m.AcademicTermEdit })));

// Departments
const DepartmentList      = React.lazy(() => import('../features/academic/components/DepartmentList').then(m => ({ default: m.DepartmentList })));
const DepartmentDetails   = React.lazy(() => import('../features/academic/components/DepartmentDetails').then(m => ({ default: m.DepartmentDetails })));
const DepartmentCreate    = React.lazy(() => import('../features/academic/components/DepartmentCreate').then(m => ({ default: m.DepartmentCreate })));
const DepartmentEdit      = React.lazy(() => import('../features/academic/components/DepartmentEdit').then(m => ({ default: m.DepartmentEdit })));

// Classes
const ClassList           = React.lazy(() => import('../features/academic/components/ClassList').then(m => ({ default: m.ClassList })));
const ClassDetails        = React.lazy(() => import('../features/academic/components/ClassDetails').then(m => ({ default: m.ClassDetails })));
const ClassCreate         = React.lazy(() => import('../features/academic/components/ClassCreate').then(m => ({ default: m.ClassCreate })));
const ClassEdit           = React.lazy(() => import('../features/academic/components/ClassEdit').then(m => ({ default: m.ClassEdit })));

// Sections
const SectionList         = React.lazy(() => import('../features/academic/components/SectionList').then(m => ({ default: m.SectionList })));
const SectionDetails      = React.lazy(() => import('../features/academic/components/SectionDetails').then(m => ({ default: m.SectionDetails })));
const SectionCreate       = React.lazy(() => import('../features/academic/components/SectionCreate').then(m => ({ default: m.SectionCreate })));
const SectionEdit         = React.lazy(() => import('../features/academic/components/SectionEdit').then(m => ({ default: m.SectionEdit })));

// Subjects
const SubjectList         = React.lazy(() => import('../features/academic/components/SubjectList').then(m => ({ default: m.SubjectList })));
const SubjectDetails      = React.lazy(() => import('../features/academic/components/SubjectDetails').then(m => ({ default: m.SubjectDetails })));
const SubjectCreate       = React.lazy(() => import('../features/academic/components/SubjectCreate').then(m => ({ default: m.SubjectCreate })));
const SubjectEdit         = React.lazy(() => import('../features/academic/components/SubjectEdit').then(m => ({ default: m.SubjectEdit })));

// Teacher Assignments
const TeacherAssignmentList    = React.lazy(() => import('../features/academic/components/TeacherAssignmentList').then(m => ({ default: m.TeacherAssignmentList })));
const TeacherAssignmentDetails = React.lazy(() => import('../features/academic/components/TeacherAssignmentDetails').then(m => ({ default: m.TeacherAssignmentDetails })));
const TeacherAssignmentCreate  = React.lazy(() => import('../features/academic/components/TeacherAssignmentCreate').then(m => ({ default: m.TeacherAssignmentCreate })));
const TeacherAssignmentEdit    = React.lazy(() => import('../features/academic/components/TeacherAssignmentEdit').then(m => ({ default: m.TeacherAssignmentEdit })));


import { Loader2, ShieldAlert } from 'lucide-react';

const PORTAL_BY_PERSONA: Record<PersonaType, string> = {
  super_admin: '/administration/dashboard',
  headmaster:  '/administration/dashboard',
  teacher:     '/teacher/dashboard',
  student:     '/student/dashboard',
};

const RouteFallback = () => (
  <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
    <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
    <span className="text-sm font-semibold">Loading module...</span>
  </div>
);

const withSuspense = (LazyComponent: React.LazyExoticComponent<React.FC>) => {
  const Wrapped: React.FC = () => (
    <Suspense fallback={<RouteFallback />}>
      <LazyComponent />
    </Suspense>
  );
  Wrapped.displayName = 'SuspenseWrapped';
  return Wrapped;
};

// ---------------------------------------------------------------------------
// Router context
// ---------------------------------------------------------------------------
export interface MyRouterContext {
  auth: {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: any;
    organization: any;
    roles: any[];
    permissions: string[];
    persona: PersonaType | null;
    hasPermission: (permission: string) => boolean;
    hasPersona: (...personas: PersonaType[]) => boolean;
    logout: () => Promise<void>;
  };
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
export const rootRoute = createRootRouteWithContext<MyRouterContext>()({
  component: () => {
    const { isLoading } = useAuth();
    if (isLoading) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
          <div className="relative flex items-center justify-center">
            <div className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-brand-500 opacity-75" />
            <div className="relative rounded-full h-12 w-12 bg-brand-600 flex items-center justify-center font-bold text-lg shadow-lg">EQ</div>
          </div>
          <p className="mt-6 text-slate-400 text-sm tracking-wider uppercase font-semibold animate-pulse">
            Loading Eduqate...
          </p>
        </div>
      );
    }
    return <Outlet />;
  },
});

// ---------------------------------------------------------------------------
// Auth layout
// ---------------------------------------------------------------------------
const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth',
  component: () => (
    <div className="min-h-screen gradient-dark flex items-center justify-center p-4">
      <Outlet />
    </div>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/login',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (context.auth.isAuthenticated) {
      if (context.auth.user?.must_change_password) throw redirect({ to: '/change-password' });
      const dest = context.auth.persona ? PORTAL_BY_PERSONA[context.auth.persona] : '/administration/dashboard';
      throw redirect({ to: dest });
    }
  },
  component: () => {
    const navigate = useNavigate();

    const handleSuccess = (freshUser: any) => {
      if (freshUser?.must_change_password) { navigate({ to: '/change-password' }); return; }
      const persona = freshUser?.persona_type as PersonaType;
      navigate({ to: persona ? PORTAL_BY_PERSONA[persona] : '/administration/dashboard' });
    };

    return <LoginCard onSuccess={handleSuccess} />;
  },
});

// ---------------------------------------------------------------------------
// Utility routes
// ---------------------------------------------------------------------------
const changePasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/change-password',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.isAuthenticated) throw redirect({ to: '/login' });
    if (!context.auth.user?.must_change_password) {
      throw redirect({ to: context.auth.persona ? PORTAL_BY_PERSONA[context.auth.persona] : '/administration/dashboard' });
    }
  },
  component: withSuspense(ForcedPasswordChange),
});

const unauthorizedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/unauthorized',
  component: () => {
    const { persona, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-slate-400 gap-3">
          <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
          <span className="text-sm font-semibold">Loading authorization context...</span>
        </div>
      );
    }

    const dashboardLink = persona ? PORTAL_BY_PERSONA[persona] : '/login';
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center mb-6">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">403 Unauthorized</h2>
        <p className="text-slate-500 mt-2 max-w-sm">You do not have the required permissions to access this page.</p>
        <Link
          to={dashboardLink}
          className="mt-6 px-5 py-2.5 bg-brand-600 text-white font-semibold rounded-xl shadow-md hover:brightness-105 transition-all text-sm cursor-pointer"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  },
});

// Index: redirect to correct portal
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (context.auth.isAuthenticated) {
      if (context.auth.user?.must_change_password) throw redirect({ to: '/change-password' });
      throw redirect({ to: context.auth.persona ? PORTAL_BY_PERSONA[context.auth.persona] : '/administration/dashboard' });
    }
    throw redirect({ to: '/login' });
  },
});

// Redirect /dashboard to the actual persona dashboard
const dashboardRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (context.auth.isAuthenticated) {
      if (context.auth.user?.must_change_password) throw redirect({ to: '/change-password' });
      throw redirect({ to: context.auth.persona ? PORTAL_BY_PERSONA[context.auth.persona] : '/administration/dashboard' });
    }
    throw redirect({ to: '/login' });
  },
});

// ---------------------------------------------------------------------------
// Administration Portal  (SUPER_ADMIN + HEADMASTER)
// Route tree: /administration → dashboard | users | users/new | users/$userId | ...
// ---------------------------------------------------------------------------
const administrationLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/administration',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.isAuthenticated) throw redirect({ to: '/login' });
    if (context.auth.user?.must_change_password) throw redirect({ to: '/change-password' });
    if (!context.auth.hasPersona('super_admin', 'headmaster')) throw redirect({ to: '/unauthorized' });
  },
  component: AdministrationLayout,
});

const administrationDashboardRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'dashboard',
  component: withSuspense(DashboardHome),
});

const administrationUsersRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'users',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('users:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(UserList),
});

const administrationUserCreateRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'users/new',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('users:create')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(UserCreate),
});

const administrationUserDetailsRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'users/$userId',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('users:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(UserDetails),
});

const administrationUserEditRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'users/$userId/edit',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('users:update')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(UserEdit),
});

const administrationRolesRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'roles',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('roles:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(RoleList),
});

const administrationRoleCreateRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'roles/new',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('roles:create')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(RoleCreate),
});

const administrationRoleDetailsRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'roles/$roleId',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('roles:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(RoleDetails),
});

const administrationRoleEditRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'roles/$roleId/edit',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('roles:update')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(RoleEdit),
});

const administrationPermissionsRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'permissions',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('permissions:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(PermissionsMatrix),
});

// Academic Years
const administrationAcademicYearsRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/years',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('academic_years:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(AcademicYearList),
});

const administrationAcademicYearCreateRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/years/new',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('academic_years:create')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(AcademicYearCreate),
});

const administrationAcademicYearDetailsRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/years/$yearId',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('academic_years:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(AcademicYearDetails),
});

const administrationAcademicYearEditRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/years/$yearId/edit',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('academic_years:update')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(AcademicYearEdit),
});

// Academic Terms
const administrationAcademicTermsRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/terms',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('academic_terms:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(AcademicTermList),
});

const administrationAcademicTermCreateRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/terms/new',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('academic_terms:create')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(AcademicTermCreate),
});

const administrationAcademicTermDetailsRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/terms/$termId',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('academic_terms:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(AcademicTermDetails),
});

const administrationAcademicTermEditRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/terms/$termId/edit',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('academic_terms:update')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(AcademicTermEdit),
});

// Departments
const administrationDepartmentsRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/departments',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('departments:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(DepartmentList),
});

const administrationDepartmentCreateRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/departments/new',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('departments:create')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(DepartmentCreate),
});

const administrationDepartmentDetailsRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/departments/$deptId',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('departments:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(DepartmentDetails),
});

const administrationDepartmentEditRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/departments/$deptId/edit',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('departments:update')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(DepartmentEdit),
});

// Classes
const administrationClassesRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/classes',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('classes:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(ClassList),
});

const administrationClassCreateRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/classes/new',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('classes:create')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(ClassCreate),
});

const administrationClassDetailsRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/classes/$classId',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('classes:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(ClassDetails),
});

const administrationClassEditRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/classes/$classId/edit',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('classes:update')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(ClassEdit),
});

// Sections
const administrationSectionsRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/sections',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('sections:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(SectionList),
});

const administrationSectionCreateRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/sections/new',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('sections:create')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(SectionCreate),
});

const administrationSectionDetailsRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/sections/$sectionId',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('sections:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(SectionDetails),
});

const administrationSectionEditRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/sections/$sectionId/edit',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('sections:update')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(SectionEdit),
});

// Subjects
const administrationSubjectsRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/subjects',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('subjects:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(SubjectList),
});

const administrationSubjectCreateRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/subjects/new',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('subjects:create')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(SubjectCreate),
});

const administrationSubjectDetailsRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/subjects/$subjectId',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('subjects:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(SubjectDetails),
});

const administrationSubjectEditRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/subjects/$subjectId/edit',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('subjects:update')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(SubjectEdit),
});

// Teacher Assignments
const administrationTeacherAssignmentsRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/teachers/assignments',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('teacher_assignments:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(TeacherAssignmentList),
});

const administrationTeacherAssignmentCreateRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/teachers/assignments/new',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('teacher_assignments:create')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(TeacherAssignmentCreate),
});

const administrationTeacherAssignmentDetailsRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/teachers/assignments/$assignmentId',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('teacher_assignments:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(TeacherAssignmentDetails),
});

const administrationTeacherAssignmentEditRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'academic/teachers/assignments/$assignmentId/edit',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.hasPermission('teacher_assignments:update')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(TeacherAssignmentEdit),
});

// ---------------------------------------------------------------------------
// Teacher Portal  (TEACHER)
// ---------------------------------------------------------------------------
const teacherLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/teacher',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.isAuthenticated) throw redirect({ to: '/login' });
    if (context.auth.user?.must_change_password) throw redirect({ to: '/change-password' });
    if (!context.auth.hasPersona('teacher')) throw redirect({ to: '/unauthorized' });
  },
  component: TeacherLayout,
});

const teacherDashboardRoute = createRoute({
  getParentRoute: () => teacherLayoutRoute,
  path: 'dashboard',
  component: withSuspense(TeacherDashboard),
});

// ---------------------------------------------------------------------------
// Student Portal  (STUDENT)
// ---------------------------------------------------------------------------
const studentLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/student',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.isAuthenticated) throw redirect({ to: '/login' });
    if (context.auth.user?.must_change_password) throw redirect({ to: '/change-password' });
    if (!context.auth.hasPersona('student')) throw redirect({ to: '/unauthorized' });
  },
  component: StudentLayout,
});

const studentDashboardRoute = createRoute({
  getParentRoute: () => studentLayoutRoute,
  path: 'dashboard',
  component: withSuspense(StudentDashboard),
});

// ---------------------------------------------------------------------------
// Route tree
// ---------------------------------------------------------------------------
const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRedirectRoute,
  unauthorizedRoute,
  changePasswordRoute,
  authLayoutRoute.addChildren([loginRoute]),
  administrationLayoutRoute.addChildren([
    administrationDashboardRoute,
    administrationUsersRoute,
    administrationUserCreateRoute,
    administrationUserDetailsRoute,
    administrationUserEditRoute,
    administrationRolesRoute,
    administrationRoleCreateRoute,
    administrationRoleDetailsRoute,
    administrationRoleEditRoute,
    administrationPermissionsRoute,
    
    // Academic Years
    administrationAcademicYearsRoute,
    administrationAcademicYearCreateRoute,
    administrationAcademicYearDetailsRoute,
    administrationAcademicYearEditRoute,
    
    // Academic Terms
    administrationAcademicTermsRoute,
    administrationAcademicTermCreateRoute,
    administrationAcademicTermDetailsRoute,
    administrationAcademicTermEditRoute,
    
    // Departments
    administrationDepartmentsRoute,
    administrationDepartmentCreateRoute,
    administrationDepartmentDetailsRoute,
    administrationDepartmentEditRoute,
    
    // Classes
    administrationClassesRoute,
    administrationClassCreateRoute,
    administrationClassDetailsRoute,
    administrationClassEditRoute,
    
    // Sections
    administrationSectionsRoute,
    administrationSectionCreateRoute,
    administrationSectionDetailsRoute,
    administrationSectionEditRoute,
    
    // Subjects
    administrationSubjectsRoute,
    administrationSubjectCreateRoute,
    administrationSubjectDetailsRoute,
    administrationSubjectEditRoute,
    
    // Teacher Assignments
    administrationTeacherAssignmentsRoute,
    administrationTeacherAssignmentCreateRoute,
    administrationTeacherAssignmentDetailsRoute,
    administrationTeacherAssignmentEditRoute,
  ]),
  teacherLayoutRoute.addChildren([teacherDashboardRoute]),
  studentLayoutRoute.addChildren([studentDashboardRoute]),
]);

export const router = createRouter({

  routeTree,
  context: { auth: undefined! },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
