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
    const { user, persona } = useAuth();
    const navigate = useNavigate();

    const handleSuccess = () => {
      if (user?.must_change_password) { navigate({ to: '/change-password' }); return; }
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
  component: () => (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="h-16 w-16 rounded-2xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center mb-6">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800">403 Unauthorized</h2>
      <p className="text-slate-500 mt-2 max-w-sm">You do not have the required permissions to access this page.</p>
      <Link
        to="/administration/dashboard"
        className="mt-6 px-5 py-2.5 bg-brand-600 text-white font-semibold rounded-xl shadow-md hover:brightness-105 transition-all text-sm cursor-pointer"
      >
        Return to Dashboard
      </Link>
    </div>
  ),
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
    if (!context.auth.hasPermission('users:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(UserList),
});

const administrationUserCreateRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'users/new',
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission('users:create')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(UserCreate),
});

const administrationUserDetailsRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'users/$userId',
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission('users:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(UserDetails),
});

const administrationUserEditRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'users/$userId/edit',
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission('users:update')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(UserEdit),
});

const administrationRolesRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'roles',
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission('roles:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(RoleList),
});

const administrationRoleCreateRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'roles/new',
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission('roles:create')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(RoleCreate),
});

const administrationRoleDetailsRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'roles/$roleId',
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission('roles:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(RoleDetails),
});

const administrationRoleEditRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'roles/$roleId/edit',
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission('roles:update')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(RoleEdit),
});

const administrationPermissionsRoute = createRoute({
  getParentRoute: () => administrationLayoutRoute,
  path: 'permissions',
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission('permissions:view')) throw redirect({ to: '/unauthorized' });
  },
  component: withSuspense(PermissionsMatrix),
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
