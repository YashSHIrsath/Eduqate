import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { getRole } from '../api/roles';
import { getUsers } from '../../users/api/users';
import { useAuth } from '../../auth';
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  KeyRound,
  Users,
  Edit,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export const RoleDetails: React.FC = () => {
  const { roleId } = useParams({ from: '/dashboard/roles/$roleId' });
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'permissions' | 'users'>('permissions');

  const { data: role, isLoading, error } = useQuery({
    queryKey: ['role', roleId],
    queryFn: () => getRole(roleId),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['role-users', roleId],
    queryFn: () => getUsers({ role_id: roleId, page_size: 100 }),
    enabled: activeTab === 'users',
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        <span>Loading role...</span>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Role not found</h3>
        <Link to="/roles" className="text-brand-600 text-sm mt-2 inline-block font-semibold">← Back to Roles</Link>
      </div>
    );
  }

  const tabs = [
    { key: 'permissions' as const, label: 'Permissions', icon: KeyRound, count: role.permissions?.length || 0 },
    { key: 'users' as const, label: 'Users', icon: Users, count: usersData?.items?.length ?? '...' },
  ];

  // Group permissions by category
  const groupedPermissions: Record<string, any[]> = {};
  (role.permissions || []).forEach((perm: any) => {
    const cat = perm.category || 'General';
    if (!groupedPermissions[cat]) groupedPermissions[cat] = [];
    groupedPermissions[cat].push(perm);
  });

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/roles"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Roles
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${role.is_system_role ? 'bg-brand-50 text-brand-600' : 'bg-indigo-50 text-indigo-600'}`}>
              {role.is_system_role ? <ShieldCheck className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-800">{role.name}</h2>
                {role.is_system_role && (
                  <span className="text-[10px] uppercase font-bold text-brand-600 tracking-wider bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-100">
                    System Role
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm mt-0.5">{role.description || 'No description provided.'}</p>
            </div>
          </div>
          {hasPermission('roles:update') && !role.is_system_role && (
            <Link
              to="/roles/$roleId/edit"
              params={{ roleId }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white gradient-brand shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all"
            >
              <Edit className="h-4 w-4" /> Edit Role
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'text-brand-600 border-brand-500 bg-brand-50/60'
                : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'permissions' && (
        <div className="space-y-5">
          {Object.keys(groupedPermissions).length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <KeyRound className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-500">No permissions assigned</p>
              <p className="text-xs mt-1">Edit this role to assign permissions.</p>
            </div>
          )}
          {Object.entries(groupedPermissions).map(([category, perms]) => (
            <div key={category} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">{category}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {perms.map((perm: any) => (
                  <div key={perm.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <span className="font-mono text-xs font-semibold text-slate-700">{perm.name}</span>
                      {perm.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{perm.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          {usersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 text-brand-500 animate-spin" />
            </div>
          ) : usersData?.items?.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-500">No users assigned to this role</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {usersData?.items?.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase">
                      {user.email?.charAt(0)}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-800">{user.email}</span>
                      <p className="text-[11px] text-slate-400 font-mono">{user.id}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    user.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {user.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
