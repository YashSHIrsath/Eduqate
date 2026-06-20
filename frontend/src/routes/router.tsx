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
import { LoginCard } from '../features/auth/components/LoginCard';
import { UserList } from '../features/users/components/UserList';
import { UserDetails } from '../features/users/components/UserDetails';
import { UserCreate } from '../features/users/components/UserCreate';
import { UserEdit } from '../features/users/components/UserEdit';
import { ForcedPasswordChange } from '../features/users/components/ForcedPasswordChange';

import { 
  Building2, 
  LogOut, 
  LayoutDashboard, 
  ShieldAlert, 
  Settings as SettingsIcon, 
  Shield, 
  User as UserIcon,
  CircleUser,
  Activity,
  KeyRound
} from 'lucide-react';

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

            {/* Scoped Role Management Links */}
            {hasPermission('roles:view') && (
              <div className="opacity-60 cursor-not-allowed flex items-center gap-3 px-4 py-3 rounded-lg text-sm border-l-4 border-transparent text-slate-500 select-none">
                <Shield className="h-4.5 w-4.5" />
                Manage Roles (UI Locked)
              </div>
            )}

            {/* Scoped Permissions Links */}
            {hasPermission('permissions:view') && (
              <div className="opacity-60 cursor-not-allowed flex items-center gap-3 px-4 py-3 rounded-lg text-sm border-l-4 border-transparent text-slate-500 select-none">
                <KeyRound className="h-4.5 w-4.5" />
                System Permissions (UI Locked)
              </div>
            )}

            {/* Scoped Settings Links */}
            {hasPermission('settings:view') && (
              <div className="opacity-60 cursor-not-allowed flex items-center gap-3 px-4 py-3 rounded-lg text-sm border-l-4 border-transparent text-slate-500 select-none">
                <SettingsIcon className="h-4.5 w-4.5" />
                System Settings (UI Locked)
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
  component: () => {
    const { user, organization, roles, permissions } = useAuth();

    return (
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Section */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Overview Dashboard</h2>
          <p className="text-slate-500 text-sm">Verify active auth session bootstrap payloads, token context, and RBAC rules below.</p>
        </div>

        {/* Verification Matrix Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* User & Organization Details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <UserIcon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-800">Profile Bootstrap Details</h3>
            </div>
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <dt className="text-slate-400">User ID</dt>
                <dd className="font-mono text-xs text-slate-800">{user?.id}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <dt className="text-slate-400">Email Address</dt>
                <dd className="font-semibold text-slate-800">{user?.email}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <dt className="text-slate-400">Account Status</dt>
                <dd>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {user?.status}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <dt className="text-slate-400">Organization Name</dt>
                <dd className="font-semibold text-slate-800">{organization?.name}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <dt className="text-slate-400">Organization Code</dt>
                <dd className="font-mono text-slate-800">{organization?.code}</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-slate-400">Created At</dt>
                <dd className="text-slate-800">{new Date(user?.created_at || '').toLocaleString()}</dd>
              </div>
            </dl>
          </div>

          {/* Assigned Roles widget */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
              <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-800">Active Tenant Roles</h3>
            </div>
            <div className="space-y-4">
              {roles.map((role: any) => (
                <div key={role.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-800 text-sm">{role.name}</span>
                    {role.is_system_role && (
                      <span className="text-[10px] uppercase font-bold text-brand-600 tracking-wider bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">
                        System Role
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{role.description || 'No description provided.'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Effective Permissions widget */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-800">Effective Permissions Array</h3>
            </div>
            <span className="text-xs px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 font-semibold">
              {permissions.length} Permissions Loaded
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {permissions.map((perm) => (
              <span
                key={perm}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200"
              >
                {perm}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  },
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
  component: UserList,
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
  component: UserCreate,
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
  component: UserDetails,
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
  component: UserEdit,
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
  component: ForcedPasswordChange,
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
