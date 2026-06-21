import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { getRoles, deleteRole } from '../api/roles';
import { useAuth } from '../../auth';
import { Plus, Eye, Edit, Trash2, Shield, ShieldCheck, Loader2, AlertCircle, Crown, GraduationCap, BookOpen, Users } from 'lucide-react';

// ── Persona metadata ──────────────────────────────────────────────────────────
const PERSONA_CONFIG: Record<string, {
  label: string;
  description: string;
  icon: React.ReactNode;
  headerGradient: string;
  iconBg: string;
  badgeBg: string;
  badgeText: string;
  accentBorder: string;
}> = {
  super_admin: {
    label: 'Super Admin',
    description: 'Platform-level administration and system oversight.',
    icon: <Crown className="h-5 w-5" />,
    headerGradient: 'from-violet-600 to-indigo-700',
    iconBg: 'bg-violet-100 text-violet-600',
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-700',
    accentBorder: 'border-violet-200',
  },
  headmaster: {
    label: 'Headmaster',
    description: 'School-level administration, academic governance, and operations.',
    icon: <GraduationCap className="h-5 w-5" />,
    headerGradient: 'from-blue-600 to-sky-700',
    iconBg: 'bg-blue-100 text-blue-600',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    accentBorder: 'border-blue-200',
  },
  teacher: {
    label: 'Teacher',
    description: 'Educator portal access — instruction, grading, and classroom management.',
    icon: <BookOpen className="h-5 w-5" />,
    headerGradient: 'from-emerald-600 to-teal-700',
    iconBg: 'bg-emerald-100 text-emerald-600',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    accentBorder: 'border-emerald-200',
  },
  student: {
    label: 'Student',
    description: 'Learner portal access — courses, assignments, and academic tracking.',
    icon: <Users className="h-5 w-5" />,
    headerGradient: 'from-amber-500 to-orange-600',
    iconBg: 'bg-amber-100 text-amber-600',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    accentBorder: 'border-amber-200',
  },
};

// Enforced display order
const PERSONA_ORDER = ['super_admin', 'headmaster', 'teacher', 'student'];

export const RoleList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const { data: roles = [], isLoading, error } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['roles'] }); },
  });

  const handleDelete = (roleId: string, roleName: string) => {
    if (window.confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`)) {
      deleteMutation.mutate(roleId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        <span>Loading roles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Failed to load roles</h3>
        <p className="text-slate-500 text-sm mt-1">Verify your permissions and try again.</p>
      </div>
    );
  }

  // ── Group roles by persona_type ───────────────────────────────────────────
  const groupedRoles: Record<string, any[]> = {};
  (roles as any[]).forEach((role) => {
    const persona = role.persona_type || 'unknown';
    if (!groupedRoles[persona]) groupedRoles[persona] = [];
    groupedRoles[persona].push(role);
  });

  // Only show personas that have roles
  const activePersonas = PERSONA_ORDER.filter((p) => groupedRoles[p]?.length > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Role Management</h2>
          <p className="text-slate-500 text-sm">Roles organized by persona — each role belongs to exactly one persona boundary.</p>
        </div>
        {hasPermission('roles:create') && (
          <button
            onClick={() => navigate({ to: '/administration/roles/new' })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white gradient-brand shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all text-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Role
          </button>
        )}
      </div>

      {/* ── Persona Sections ─────────────────────────────────────────────── */}
      {activePersonas.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Shield className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-500">No roles configured</p>
          <p className="text-xs mt-1">Create your first role to get started.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {activePersonas.map((personaKey) => {
            const config = PERSONA_CONFIG[personaKey];
            const personaRoles = groupedRoles[personaKey];
            if (!config || !personaRoles) return null;

            return (
              <div key={personaKey} className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${config.accentBorder}`}>
                {/* Persona Header */}
                <div className={`bg-gradient-to-r ${config.headerGradient} px-6 py-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                      {config.icon}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm tracking-wide uppercase">{config.label}</h3>
                      <p className="text-white/70 text-xs mt-0.5">{config.description}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-white/90 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    {personaRoles.length} {personaRoles.length === 1 ? 'role' : 'roles'}
                  </span>
                </div>

                {/* Roles Grid */}
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {personaRoles.map((role: any) => (
                      <div key={role.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-lg ${role.is_system_role ? 'bg-brand-50 text-brand-600' : config.iconBg}`}>
                              {role.is_system_role ? <ShieldCheck className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm">{role.name}</h4>
                              {role.is_system_role && (
                                <span className="text-[9px] uppercase font-bold text-brand-600 tracking-wider">System Role</span>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-slate-500 font-semibold">
                            {role.permissions?.length || 0} perms
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mb-4 min-h-[2rem]">{role.description || 'No description provided.'}</p>

                        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                          <button
                            onClick={() => navigate({ to: '/administration/roles/$roleId', params: { roleId: role.id } as any })}
                            className="flex-1 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                          {hasPermission('roles:update') && !role.is_system_role && (
                            <button
                              onClick={() => navigate({ to: '/administration/roles/$roleId/edit', params: { roleId: role.id } as any })}
                              className="flex-1 py-2 rounded-lg text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Edit className="h-3.5 w-3.5" /> Edit
                            </button>
                          )}
                          {hasPermission('roles:delete') && !role.is_system_role && (
                            <button
                              onClick={() => handleDelete(role.id, role.name)}
                              disabled={deleteMutation.isPending}
                              className="py-2 px-3 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
