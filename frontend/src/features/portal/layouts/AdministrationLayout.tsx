import React from 'react';
import { Outlet, Link, useNavigate } from '@tanstack/react-router';
import { useAuth } from '../../auth';
import {
  Building2,
  LogOut,
  LayoutDashboard,
  Shield,
  KeyRound,
  User as UserIcon,
  CircleUser,
} from 'lucide-react';

export const AdministrationLayout: React.FC = () => {
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

        {/* Brand */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="h-9 w-9 bg-brand-600 rounded-lg flex items-center justify-center font-bold text-white shadow-md">
            EQ
          </div>
          <div>
            <span className="font-bold text-white block text-sm tracking-wide">EDUQATE</span>
            <span className="text-[10px] text-brand-400 font-semibold tracking-widest uppercase">Administration</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <Link
            to="/administration/dashboard"
            activeProps={{ className: 'bg-brand-600/10 text-brand-400 border-l-4 border-brand-500 font-medium' }}
            inactiveProps={{ className: 'hover:bg-slate-800/50 hover:text-white border-l-4 border-transparent' }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all"
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </Link>

          {hasPermission('users:view') && (
            <Link
              to="/administration/users"
              activeProps={{ className: 'bg-brand-600/10 text-brand-400 border-l-4 border-brand-500 font-medium' }}
              inactiveProps={{ className: 'hover:bg-slate-800/50 hover:text-white border-l-4 border-transparent' }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all"
            >
              <UserIcon className="h-4 w-4" />
              Manage Users
            </Link>
          )}

          {hasPermission('roles:view') && (
            <Link
              to="/administration/roles"
              activeProps={{ className: 'bg-brand-600/10 text-brand-400 border-l-4 border-brand-500 font-medium' }}
              inactiveProps={{ className: 'hover:bg-slate-800/50 hover:text-white border-l-4 border-transparent' }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all"
            >
              <Shield className="h-4 w-4" />
              Manage Roles
            </Link>
          )}

          {hasPermission('permissions:view') && (
            <Link
              to="/administration/permissions"
              activeProps={{ className: 'bg-brand-600/10 text-brand-400 border-l-4 border-brand-500 font-medium' }}
              inactiveProps={{ className: 'hover:bg-slate-800/50 hover:text-white border-l-4 border-transparent' }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all"
            >
              <KeyRound className="h-4 w-4" />
              Permissions
            </Link>
          )}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 mb-3">
            <CircleUser className="h-9 w-9 text-slate-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.email}</p>
              <div className="flex gap-1 mt-0.5 flex-wrap">
                {roles.map((r) => (
                  <span key={r.id} className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-900/50 text-brand-300 border border-brand-800/30 truncate">
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

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Building2 className="h-5 w-5 text-brand-600" />
            <span className="font-semibold text-slate-800">{organization?.name}</span>
            <span className="text-xs px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-slate-500 font-mono">
              {organization?.slug}
            </span>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full font-medium">
            Administration Portal
          </span>
        </header>
        <main className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
