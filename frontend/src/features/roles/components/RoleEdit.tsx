import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { getRole, updateRole, updateRolePermissions } from '../api/roles';
import { getPermissionsCatalog } from '../../users/api/users';
import { ArrowLeft, Shield, KeyRound, CheckCircle2, ShieldAlert, RefreshCw } from 'lucide-react';

const roleUpdateSchema = z.object({
  name: z.string().min(2, { message: 'Role name must be at least 2 characters' }),
  description: z.string().optional(),
});

type RoleUpdateValues = z.infer<typeof roleUpdateSchema>;

export const RoleEdit: React.FC = () => {
  const { roleId } = useParams({ from: '/administration/roles/$roleId/edit' });
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'details' | 'permissions'>('details');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const { data: role, isLoading: roleLoading } = useQuery({
    queryKey: ['role-detail', roleId],
    queryFn: () => getRole(roleId),
  });

  const { data: permissionsCatalog = {} } = useQuery({
    queryKey: ['permissions-catalog'],
    queryFn: getPermissionsCatalog,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RoleUpdateValues>({
    resolver: zodResolver(roleUpdateSchema),
  });

  useEffect(() => {
    if (role) {
      reset({ name: role.name, description: role.description });
      setSelectedPermissions(role.permissions.map((p: any) => p.id));
    }
  }, [role, reset]);

  const updateDetailsMutation = useMutation({
    mutationFn: (values: RoleUpdateValues) => updateRole(roleId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-detail', roleId] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      showSuccess('Role details updated successfully.');
    },
    onError: (err: any) => showErr(err.response?.data?.detail || 'Role update failed.'),
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: (permissionIds: string[]) => updateRolePermissions(roleId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-detail', roleId] });
      showSuccess('Role permissions synchronized successfully.');
    },
    onError: (err: any) => showErr(err.response?.data?.detail || 'Permission sync failed.'),
  });

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg); setErrorMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSuccessMsg(null), 3000);
  };
  const showErr = (msg: string) => {
    setErrorMsg(msg); setSuccessMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePermissionToggle = (permId: string) =>
    setSelectedPermissions(prev => prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]);

  if (roleLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <RefreshCw className="h-8 w-8 text-brand-500 animate-spin" />
        <span>Loading role editor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link
          to="/administration/roles/$roleId"
          params={{ roleId } as any}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel and return to Role Profile
        </Link>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm flex gap-3 items-center">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex gap-3 items-center">
          <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div className="flex border-b border-slate-200 bg-slate-50/50 shrink-0">
          {(['details', 'permissions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === tab ? 'border-brand-500 text-brand-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'details' ? <><Shield className="h-4 w-4" /> Role Details</> : <><KeyRound className="h-4 w-4" /> Permissions</>}
            </button>
          ))}
        </div>

        <div className="p-8 flex-1">
          {activeTab === 'details' && (
            <form onSubmit={handleSubmit((values) => updateDetailsMutation.mutate(values))} className="space-y-6 max-w-xl">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Role Name</label>
                <input
                  type="text"
                  {...register('name')}
                  className={`w-full px-4 py-3 rounded-xl border bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all ${
                    errors.name ? 'border-red-400' : 'border-slate-200'
                  }`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1.5">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Description</label>
                <textarea
                  rows={3}
                  {...register('description')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={updateDetailsMutation.isPending}
                className="px-5 py-3 rounded-xl font-semibold text-white gradient-brand shadow-md hover:shadow-lg transition-all text-xs cursor-pointer disabled:opacity-50"
              >
                {updateDetailsMutation.isPending ? 'Saving...' : 'Save Role Details'}
              </button>
            </form>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <div className="space-y-6">
                {Object.keys(permissionsCatalog).map((category) => (
                  <div key={category} className="space-y-2.5">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">{category}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(permissionsCatalog as any)[category].map((perm: any) => {
                        const isChecked = selectedPermissions.includes(perm.id);
                        return (
                          <div
                            key={perm.id}
                            onClick={() => handlePermissionToggle(perm.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                              isChecked ? 'border-indigo-500 bg-indigo-50/20 shadow-sm' : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50/80'
                            }`}
                          >
                            <div className={`mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-all ${
                              isChecked ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {isChecked && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <div>
                              <span className="font-mono text-xs text-slate-700 block">{perm.name}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">{perm.description}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => updatePermissionsMutation.mutate(selectedPermissions)}
                disabled={updatePermissionsMutation.isPending}
                className="px-5 py-3 rounded-xl font-semibold text-white gradient-brand shadow-md hover:shadow-lg transition-all text-xs cursor-pointer disabled:opacity-50"
              >
                {updatePermissionsMutation.isPending ? 'Syncing...' : 'Save Permission Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
