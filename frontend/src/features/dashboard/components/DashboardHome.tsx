import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../api/dashboard';
import { useAuth } from '../../auth';
import {
  Users,
  UserCheck,
  Shield,
  KeyRound,
  CircleUser,
  Activity,
  Loader2,
} from 'lucide-react';

export const DashboardHome: React.FC = () => {
  const { user, organization, roles, permissions } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    refetchInterval: 30000,
  });

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.total_users ?? '—',
      icon: Users,
      color: 'from-indigo-500 to-indigo-600',
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
    },
    {
      label: 'Active Users',
      value: stats?.active_users ?? '—',
      icon: UserCheck,
      color: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    {
      label: 'Roles',
      value: stats?.roles ?? '—',
      icon: Shield,
      color: 'from-brand-500 to-brand-600',
      bg: 'bg-brand-50',
      text: 'text-brand-600',
    },
    {
      label: 'Permissions',
      value: stats?.permissions ?? '—',
      icon: KeyRound,
      color: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Overview Dashboard</h2>
        <p className="text-slate-500 text-sm">
          Organization metrics, session context, and RBAC summary.
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.text}`} />
              </div>
              {isLoading && (
                <Loader2 className="h-4 w-4 text-slate-300 animate-spin" />
              )}
            </div>
            <div className="text-3xl font-bold text-slate-800 tracking-tight">
              {isLoading ? (
                <div className="h-9 w-16 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                card.value
              )}
            </div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1.5">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* Context Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <CircleUser className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-800">Session Profile</h3>
          </div>
          <dl className="space-y-3.5 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-400">User ID</dt>
              <dd className="font-mono text-xs text-slate-800">{user?.id}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-400">Email</dt>
              <dd className="font-semibold text-slate-800">{user?.email}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-400">Status</dt>
              <dd>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {user?.status}
                </span>
              </dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-400">Organization</dt>
              <dd className="font-semibold text-slate-800">{organization?.name}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-slate-400">Org Code</dt>
              <dd className="font-mono text-slate-800">{organization?.code}</dd>
            </div>
          </dl>
        </div>

        {/* Roles Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-800">Active Roles</h3>
          </div>
          <div className="space-y-3">
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

      {/* Permissions Badge Cloud */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-800">Effective Permissions</h3>
          </div>
          <span className="text-xs px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 font-semibold">
            {permissions.length} Loaded
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
};
