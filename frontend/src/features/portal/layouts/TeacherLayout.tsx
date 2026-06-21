import React from 'react';
import { Outlet, Link, useNavigate } from '@tanstack/react-router';
import { useAuth } from '../../auth';
import {
  LogOut,
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  BarChart2,
  CircleUser,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const TeacherLayout: React.FC = () => {
  const { user, organization, roles, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const toggleSidebar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  const handleLogout = async () => {
    await logout();
    navigate({ to: '/login' });
  };

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}>

        {/* Brand */}
        <div className={`p-5 border-b border-slate-800 flex ${isCollapsed ? 'flex-col gap-3 items-center justify-center' : 'items-center justify-between'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white shadow-md shrink-0">
              EQ
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-bold text-white block text-sm tracking-wide truncate">EDUQATE</span>
                <span className="text-[10px] text-emerald-400 font-semibold tracking-widest uppercase truncate block">Teacher Portal</span>
              </div>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ${isCollapsed ? '' : 'ml-2'}`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <Link
            to="/teacher/dashboard"
            title={isCollapsed ? 'Dashboard' : undefined}
            activeProps={{
              className: isCollapsed
                ? 'bg-emerald-600/20 text-emerald-400 font-semibold'
                : 'bg-emerald-600/10 text-emerald-400 border-l-4 border-emerald-500 font-medium',
            }}
            inactiveProps={{
              className: isCollapsed
                ? 'hover:bg-slate-800/50 hover:text-white'
                : 'hover:bg-slate-800/50 hover:text-white border-l-4 border-transparent',
            }}
            className={`flex items-center rounded-lg text-sm transition-all ${
              isCollapsed ? 'justify-center py-3 px-2 mx-1' : 'gap-3 px-4 py-3'
            }`}
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Dashboard</span>}
          </Link>

          {hasPermission('classes:view') && (
            <div
              title={isCollapsed ? 'My Classes (Unavailable)' : undefined}
              className={`opacity-40 cursor-not-allowed flex items-center rounded-lg text-sm text-slate-500 select-none ${
                isCollapsed ? 'justify-center py-3 px-2 mx-1' : 'gap-3 px-4 py-3 border-l-4 border-transparent'
              }`}
            >
              <BookOpen className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>My Classes</span>}
            </div>
          )}

          {hasPermission('attendance:mark') && (
            <div
              title={isCollapsed ? 'Attendance (Unavailable)' : undefined}
              className={`opacity-40 cursor-not-allowed flex items-center rounded-lg text-sm text-slate-500 select-none ${
                isCollapsed ? 'justify-center py-3 px-2 mx-1' : 'gap-3 px-4 py-3 border-l-4 border-transparent'
              }`}
            >
              <ClipboardList className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Attendance</span>}
            </div>
          )}

          {hasPermission('grades:submit') && (
            <div
              title={isCollapsed ? 'Grades (Unavailable)' : undefined}
              className={`opacity-40 cursor-not-allowed flex items-center rounded-lg text-sm text-slate-500 select-none ${
                isCollapsed ? 'justify-center py-3 px-2 mx-1' : 'gap-3 px-4 py-3 border-l-4 border-transparent'
              }`}
            >
              <BarChart2 className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Grades</span>}
            </div>
          )}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className={`flex items-center ${isCollapsed ? 'justify-center mb-3' : 'gap-3 mb-3'}`}>
            <CircleUser className="h-9 w-9 text-slate-400 shrink-0" />
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user?.email}</p>
                <div className="flex gap-1 mt-0.5 flex-wrap">
                  {roles.map((r) => (
                    <span key={r.id} className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-900/50 text-emerald-300 border border-emerald-800/30 truncate">
                      {r.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className={`flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-800 cursor-pointer ${
              isCollapsed ? 'p-2.5 mx-auto w-10 h-10' : 'w-full gap-2 px-3 py-2 text-xs font-semibold'
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Building2 className="h-5 w-5 text-emerald-600" />
            <span className="font-semibold text-slate-800">{organization?.name}</span>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full font-medium">
            Teacher Portal
          </span>
        </header>
        <main className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
