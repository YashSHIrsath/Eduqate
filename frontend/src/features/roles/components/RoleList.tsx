import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { getRoles, deleteRole } from '../api/roles';
import { useAuth } from '../../auth';
import { Plus, Eye, Edit, Trash2, Shield, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Role Management</h2>
          <p className="text-slate-500 text-sm">Configure roles and map permission access for your organization.</p>
        </div>
        {hasPermission('roles:create') && (
          <button
            onClick={() => navigate({ to: '/roles/new' })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white gradient-brand shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all text-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Role
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {roles.map((role: any) => (
          <div
            key={role.id}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${role.is_system_role ? 'bg-brand-50 text-brand-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  {role.is_system_role ? <ShieldCheck className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{role.name}</h3>
                  {role.is_system_role && (
                    <span className="text-[9px] uppercase font-bold text-brand-600 tracking-wider">System Role</span>
                  )}
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-slate-500 font-semibold">
                {role.permissions?.length || 0} perms
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-5 min-h-[2rem]">
              {role.description || 'No description provided.'}
            </p>

            <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => navigate({ to: '/roles/$roleId', params: { roleId: role.id } })}
                className="flex-1 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Eye className="h-3.5 w-3.5" /> View
              </button>
              {hasPermission('roles:update') && !role.is_system_role && (
                <button
                  onClick={() => navigate({ to: '/roles/$roleId/edit', params: { roleId: role.id } })}
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

        {roles.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400">
            <Shield className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-500">No roles configured</p>
            <p className="text-xs mt-1">Create your first role to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};
