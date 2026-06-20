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

// Direct imports for small components
import { LoginCard } from '../features/auth/components/LoginCard';

// Lazy-loaded feature modules (Vite code-splitting)
const UserList = React.lazy(() => import('../features/users/components/UserList').then(m => ({ default: m.UserList })));
const UserDetails = React.lazy(() => import('../features/users/components/UserDetails').then(m => ({ default: m.UserDetails })));
const UserCreate = React.lazy(() => import('../features/users/components/UserCreate').then(m => ({ default: m.UserCreate })));
const UserEdit = React.lazy(() => import('../features/users/components/UserEdit').then(m => ({ default: m.UserEdit })));
const ForcedPasswordChange = React.lazy(() => import('../features/users/components/ForcedPasswordChange').then(m => ({ default: m.ForcedPasswordChange })));
const DashboardHome = React.lazy(() => import('../features/dashboard/components/DashboardHome').then(m => ({ default: m.DashboardHome })));
const RoleList = React.lazy(() => import('../features/roles/components/RoleList').then(m => ({ default: m.RoleList })));
const RoleCreate = React.lazy(() => import('../features/roles/components/RoleCreate').then(m => ({ default: m.RoleCreate })));
const RoleDetails = React.lazy(() => import('../features/roles/components/RoleDetails').then(m => ({ default: m.RoleDetails })));
const RoleEdit = React.lazy(() => import('../features/roles/components/RoleEdit').then(m => ({ default: m.RoleEdit })));
const PermissionsMatrix = React.lazy(() => import('../features/permissions/components/PermissionsMatrix').then(m => ({ default: m.PermissionsMatrix })));

import { 
  Building2, 
  LogOut, 
  LayoutDashboard, 
  ShieldAlert, 
  Settings as SettingsIcon, 
  Shield, 
  User as UserIcon,
  CircleUser,
  KeyRound,
  Loader2
} from 'lucide-react';

// Suspense fallback component for lazy routes
const RouteFallback = () => (
  <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
    <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
    <span className="text-sm font-semibold">Loading module...</span>
  </div>
);

// Wrap lazy component in Suspense
const withSuspense = (LazyComponent: React.LazyExoticComponent<React.FC>) => {
  const SuspenseWrapped: React.FC = () => (
    <Suspense fallback={<RouteFallback />}>
      <LazyComponent />
    </Suspense>
  );
  SuspenseWrapped.displayName = 'SuspenseWrappedRoute';
  return SuspenseWrapped;
};

// 1. Define Route Context structure
export interface MyRouterContext {
  auth: {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: any;
    organization: any;
    roles: any[];
    permissions: string[];
    hasPermission: (permission: string) => boolean;
    logout: () => Promise<void>;
  };
}

// 2. Create Root Route
export const rootRoute = createRootRouteWithContext<MyRouterContext>()({
  component: () => {
    const { isLoading } = useAuth();
    
    // Loading Screen
    if (isLoading) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
          <div className="relative flex items-center justify-center">
            <div className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-brand-500 opacity-75" />
            <div className="relative rounded-full h-12 w-12 bg-brand-600 flex items-center justify-center font-bold text-lg shadow-lg">
              EQ
            </div>
          </div>
          <p className="mt-6 text-slate-400 text-sm tracking-wider uppercase font-semibold animate-pulse">
            Loading Eduqate Portal...
          </p>
        </div>
      );
    }
    
    return <Outlet />;
  },
});

// 3. Create Route Tree Nodes
// Auth Layout (centered panel)
const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth',
  component: () => (
    <div className="min-h-screen gradient-dark flex items-center justify-center p-4">
      <Outlet />
    </div>
  ),
});

// Login Page Route
const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/login',
  beforeLoad: ({ context }) => {
    // If already authenticated, bypass login and redirect to dashboard
    if (context.auth.isAuthenticated) {
      if (context.auth.user?.must_change_password) {
        throw redirect({ to: '/change-password' });
      }
      throw redirect({ to: '/dashboard' });
    }
  },
  component: () => {
    const navigate = useNavigate();
    return (
      <LoginCard
        onSuccess={() => {
          navigate({ to: '/dashboard' });
        }}
      />
    );
  },
});

// Protected Dashboard Layout Route
const dashboardLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'dashboard',
  beforeLoad: ({ context }) => {
    // Guard: Force redirect to login if not authenticated
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
    // Guard: Force redirect to change password page if must_change_password flag is True
    if (context.auth.user?.must_change_password) {
      throw redirect({ to: '/change-password' });
    }
  },
  component: () => {
    const { user, organization, roles, logout, hasPermission } = useAuth();
    const navigate = useNavigate();
    
    const handleLogout = async () => {
      await logout();
      navigate({ to: '/login' });
    };

    return (
      <div className="min-h-screen flex bg-slate-50">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="h-9 w-9 bg-brand-600 rounded-lg flex items-center justify-center font-bold text-white shadow-md">
              EQ
            </div>
            <div>
              <span className="font-bold text-white block text-sm tracking-wide">EDUQATE</span>
              <span className="text-[10px] text-brand-400 font-semibold tracking-widest uppercase">Admin Shell</span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 p-4 space-y-1">
            <Link
              to="/dashboard"
              activeProps={{ className: 'bg-brand-600/10 text-brand-400 border-l-4 border-brand-500 font-medium' }}
              inactiveProps={{ className: 'hover:bg-slate-800/50 hover:text-white border-l-4 border-transparent' }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all"
            >
              <LayoutDashboard className="h-4.5 w-4.5" />
              Overview Dashboard
            </Link>

            {/* Scoped User Management Link */}
            {hasPermission('users:view') && (
              <Link
                to="/users"
                activeProps={{ className: 'bg-brand-600/10 text-brand-400 border-l-4 border-brand-500 font-medium' }}
                inactiveProps={{ className: 'hover:bg-slate-800/50 hover:text-white border-l-4 border-transparent' }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all"
              >
                <UserIcon className="h-4.5 w-4.5" />
                Manage Users
              </Link>
            )}

            {/* Scoped Role Management Link */}
            {hasPermission('roles:view') && (
              <Link
                to="/roles"
                activeProps={{ className: 'bg-brand-600/10 text-brand-400 border-l-4 border-brand-500 font-medium' }}
                inactiveProps={{ className: 'hover:bg-slate-800/50 hover:text-white border-l-4 border-transparent' }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all"
              >
                <Shield className="h-4.5 w-4.5" />
                Manage Roles
              </Link>
            )}

            {/* Scoped Permissions Link */}
            {hasPermission('permissions:view') && (
              <Link
                to="/permissions"
                activeProps={{ className: 'bg-brand-600/10 text-brand-400 border-l-4 border-brand-500 font-medium' }}
                inactiveProps={{ className: 'hover:bg-slate-800/50 hover:text-white border-l-4 border-transparent' }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all"
              >
                <KeyRound className="h-4.5 w-4.5" />
                System Permissions
              </Link>
            )}

            {/* Scoped Settings Link (UI Locked — not in this sprint) */}
            {hasPermission('settings:view') && (
              <div className="opacity-60 cursor-not-allowed flex items-center gap-3 px-4 py-3 rounded-lg text-sm border-l-4 border-transparent text-slate-500 select-none">
                <SettingsIcon className="h-4.5 w-4.5" />
                System Settings
              </div>
            )}
          </nav>

          {/* User profile footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/40">
            <div className="flex items-center gap-3 mb-3">
              <CircleUser className="h-9 w-9 text-slate-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user?.email}</p>
                <div className="flex gap-1 mt-0.5 overflow-hidden">
                  {roles.map((r: any) => (
                    <span key={r.id} className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-900/50 text-brand-300 border border-brand-800/30 truncate block">
                      {r.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-800 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <Building2 className="h-5 w-5 text-brand-600" />
              <span className="font-semibold text-slate-800">{organization?.name}</span>
              <span className="text-xs px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-slate-500 font-mono">
                {organization?.slug}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400">Environment: Development</span>
            </div>
          </header>

          {/* Sub-routes Viewport */}
          <main className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    );
  },
});

// Dashboard Home View Route
const dashboardHomeRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/dashboard',
  component: withSuspense(DashboardHome),
});

// Users List Route
const usersListRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/users',
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission('users:view')) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  component: withSuspense(UserList),
});

// Create User Route
const userCreateRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/users/new',
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission('users:create')) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  component: withSuspense(UserCreate),
});

// User Details Route
const userDetailsRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/users/$userId',
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission('users:view')) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  component: withSuspense(UserDetails),
});

// Edit User Route
const userEditRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/users/$userId/edit',
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission('users:update')) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  component: withSuspense(UserEdit),
});

// Roles List Route
const rolesListRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/roles',
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission('roles:view')) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  component: withSuspense(RoleList),
});

// Create Role Route
const roleCreateRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/roles/new',
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission('roles:create')) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  component: withSuspense(RoleCreate),
});

// Role Details Route
const roleDetailsRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/roles/$roleId',
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission('roles:view')) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  component: withSuspense(RoleDetails),
});

// Role Edit Route
const roleEditRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/roles/$roleId/edit',
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission('roles:update')) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  component: withSuspense(RoleEdit),
});

// Permissions Matrix Route
const permissionsRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/permissions',
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission('permissions:view')) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  component: withSuspense(PermissionsMatrix),
});

// Forced Password Change Route
const changePasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/change-password',
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
    if (!context.auth.user?.must_change_password) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: withSuspense(ForcedPasswordChange),
});

// Unauthorized Page Route
const unauthorizedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/unauthorized',
  component: () => (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="h-16 w-16 rounded-2xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center mb-6">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800">403 Unauthorized</h2>
      <p className="text-slate-500 mt-2 max-w-sm">
        You do not have the required permissions to access this page. Please contact your system administrator.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 px-5 py-2.5 bg-brand-600 text-white font-semibold rounded-xl shadow-md hover:brightness-105 transition-all text-sm cursor-pointer"
      >
        Return to Overview
      </Link>
    </div>
  ),
});

// Redirect from index route '/' to `/dashboard` or `/login`
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      if (context.auth.user?.must_change_password) {
        throw redirect({ to: '/change-password' });
      }
      throw redirect({ to: '/dashboard' });
    } else {
      throw redirect({ to: '/login' });
    }
  },
});

// 4. Assemble the route tree programmatically (ensures order of dependency injection)
const routeTree = rootRoute.addChildren([
  indexRoute,
  unauthorizedRoute,
  changePasswordRoute,
  authLayoutRoute.addChildren([loginRoute]),
  dashboardLayoutRoute.addChildren([
    dashboardHomeRoute,
    usersListRoute,
    userCreateRoute,
    userDetailsRoute,
    userEditRoute,
    rolesListRoute,
    roleCreateRoute,
    roleDetailsRoute,
    roleEditRoute,
    permissionsRoute,
  ]),
]);

// 5. Instanciate Router
export const router = createRouter({
  routeTree,
  context: {
    auth: undefined!, // Injected inside app mounting wrapper dynamically
  },
});

// 6. Register Router types for type-safety autocomplete
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
