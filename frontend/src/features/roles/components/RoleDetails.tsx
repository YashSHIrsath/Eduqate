import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { getRole } from '../api/roles';
import { getUsers } from '../../users/api/users';
import { ArrowLeft, Edit, Shield, KeyRound, Users, RefreshCw, AlertCircle, ShieldCheck, Crown, GraduationCap, BookOpen } from 'lucide-react';
import { useAuth } from '../../auth';
import { useNavigate } from '@tanstack/react-router';

// ── Persona display metadata ─────────────────────────────────────────────────
const PERSONA_DISPLAY: Record<string, { label: string; gradient: string; iconBg: string; icon: React.ReactNode }> = {
  super_admin: { label: 'SUPER ADMIN', gradient: 'from-violet-600 to-indigo-700', iconBg: 'bg-violet-100 text-violet-600', icon: <Crown className="h-4 w-4" /> },
  headmaster:  { label: 'HEADMASTER',  gradient: 'from-blue-600 to-sky-700',      iconBg: 'bg-blue-100 text-blue-600',    icon: <GraduationCap className="h-4 w-4" /> },
  teacher:     { label: 'TEACHER',     gradient: 'from-emerald-600 to-teal-700',  iconBg: 'bg-emerald-100 text-emerald-600', icon: <BookOpen className="h-4 w-4" /> },
  student:     { label: 'STUDENT',     gradient: 'from-amber-500 to-orange-600',  iconBg: 'bg-amber-100 text-amber-600',  icon: <Users className="h-4 w-4" /> },
};

export const RoleDetails: React.FC = () => {
  const { roleId } = useParams({ from: '/administration/roles/$roleId' });
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'permissions' | 'users'>('permissions');

  const { data: role, isLoading, error } = useQuery({
    queryKey: ['role-detail', roleId],
    queryFn: () => getRole(roleId),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-for-role', roleId],
    queryFn: () => getUsers({ role_id: roleId, page: 1, page_size: 50 }),
    enabled: activeTab === 'users',
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <RefreshCw className="h-8 w-8 text-brand-500 animate-spin" />
        <span>Loading role details...</span>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Failed to load role</h3>
        <Link to="/administration/roles" className="mt-6 inline-flex items-center gap-2 text-sm text-brand-600 font-semibold hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Roles
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/administration/roles"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Role List
        </Link>
        {hasPermission('roles:update') && !role.is_system_role && (
          <button
            onClick={() => navigate({ to: '/administration/roles/$roleId/edit', params: { roleId } as any })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all text-xs cursor-pointer shadow-sm"
          >
            <Edit className="h-4 w-4" />
            Edit Role
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="text-center pb-6 border-b border-slate-100">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${role.is_system_role ? 'bg-brand-50 text-brand-600 border border-brand-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
              {role.is_system_role ? <ShieldCheck className="h-7 w-7" /> : <Shield className="h-7 w-7" />}
            </div>
            <h3 className="font-bold text-slate-800 text-lg">{role.name}</h3>
            {role.is_system_role && (
              <span className="text-[9px] uppercase font-bold text-brand-600 tracking-wider bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100 mt-1 inline-block">System Role</span>
            )}
          </div>

          {/* Persona Badge */}
          {(() => {
            const pd = PERSONA_DISPLAY[role.persona_type] || { label: role.persona_type?.toUpperCase() || '—', gradient: 'from-slate-500 to-slate-600', iconBg: 'bg-slate-100 text-slate-600', icon: <Shield className="h-4 w-4" /> };
            return (
              <div className={`bg-gradient-to-r ${pd.gradient} rounded-xl px-4 py-3 flex items-center gap-3`}>
                <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                  {pd.icon}
                </div>
                <div>
                  <span className="text-[9px] text-white/60 uppercase tracking-widest font-bold block">Persona</span>
                  <span className="text-white font-bold text-sm tracking-wide">{pd.label}</span>
                </div>
              </div>
            );
          })()}

          <div className="space-y-4 text-sm">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Description</span>
              <p className="text-slate-600 text-xs leading-relaxed">{role.description || 'No description provided.'}</p>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Total Permissions</span>
              <span className="font-bold text-slate-800">{role.permissions?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Right Tabbed */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-6 py-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'permissions' ? 'border-brand-500 text-brand-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <KeyRound className="h-4 w-4" />
              Permissions ({role.permissions?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'users' ? 'border-brand-500 text-brand-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="h-4 w-4" />
              Assigned Users ({usersData?.total || '—'})
            </button>
          </div>

          <div className="p-6 flex-1">
            {activeTab === 'permissions' ? (
              <div className="space-y-4">
                {role.permissions?.length === 0 ? (
                  <p className="text-slate-400 text-sm py-8 text-center">No permissions mapped to this role.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {role.permissions.map((perm: any) => (
                      <div key={perm.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/30 flex flex-col">
                        <span className="font-mono text-xs font-semibold text-slate-700">{perm.name}</span>
                        <span className="text-[10px] text-slate-400 mt-1">{perm.description}</span>
                        <span className="text-[9px] font-bold text-indigo-500 uppercase mt-1.5 tracking-wider">{perm.category}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {!usersData?.users?.length ? (
                  <p className="text-slate-400 text-sm py-8 text-center">No users assigned this role.</p>
                ) : (
                  usersData.users.map((user: any) => (
                    <div key={user.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/30 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">{user.email}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        user.status === 'active' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-slate-600 bg-slate-100 border-slate-200'
                      }`}>{user.status}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
