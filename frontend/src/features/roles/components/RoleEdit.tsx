import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { getRole, updateRole, assignPermissionsToRole } from '../api/roles';
import { getPermissionsCatalog } from '../../permissions/api/permissions';
import {
  ArrowLeft,
  Shield,
  KeyRound,
  Check,
  Loader2,
  AlertCircle,
  Save,
} from 'lucide-react';

const roleEditSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100, 'Max 100 characters'),
  description: z.string().max(255, 'Max 255 characters').optional().or(z.literal('')),
});

type RoleEditFormData = z.infer<typeof roleEditSchema>;

export const RoleEdit: React.FC = () => {
  const { roleId } = useParams({ from: '/dashboard/roles/$roleId/edit' });
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'details' | 'permissions'>('details');
  const [selectedPermIds, setSelectedPermIds] = useState<Set<string>>(new Set());

  const { data: role, isLoading, error } = useQuery({
    queryKey: ['role', roleId],
    queryFn: () => getRole(roleId),
  });

  const { data: permCatalog, isLoading: permLoading } = useQuery({
    queryKey: ['permissions-catalog'],
    queryFn: getPermissionsCatalog,
  });

  // Initialize form with existing role data
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<RoleEditFormData>({
    resolver: zodResolver(roleEditSchema),
  });

  useEffect(() => {
    if (role) {
      reset({ name: role.name, description: role.description || '' });
      setSelectedPermIds(new Set(role.permissions?.map((p: any) => p.id) || []));
    }
  }, [role, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: RoleEditFormData) =>
      updateRole(roleId, { name: data.name, description: data.description || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role', roleId] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  const permMutation = useMutation({
    mutationFn: (permIds: string[]) => assignPermissionsToRole(roleId, permIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role', roleId] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  const onSubmitDetails = (data: RoleEditFormData) => {
    updateMutation.mutate(data);
  };

  const handleSavePermissions = () => {
    permMutation.mutate(Array.from(selectedPermIds));
  };

  const togglePerm = (permId: string) => {
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
      return next;
    });
  };

  const toggleCategory = (categoryPerms: any[]) => {
    const allSelected = categoryPerms.every((p) => selectedPermIds.has(p.id));
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      categoryPerms.forEach((p) => {
        if (allSelected) {
          next.delete(p.id);
        } else {
          next.add(p.id);
        }
      });
      return next;
    });
  };

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
    { key: 'details' as const, label: 'Details', icon: Shield },
    { key: 'permissions' as const, label: 'Permissions', icon: KeyRound },
  ];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/roles/$roleId"
          params={{ roleId }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Role Details
        </Link>
        <h2 className="text-2xl font-bold text-slate-800">Edit Role: {role.name}</h2>
        <p className="text-slate-500 text-sm">Modify role details and manage permission assignments.</p>
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
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <form onSubmit={handleSubmit(onSubmitDetails)} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Role Name *
              </label>
              <input
                id="name"
                {...register('name')}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all ${errors.name ? 'border-red-400' : 'border-slate-200'}`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={3}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none ${errors.description ? 'border-red-400' : 'border-slate-200'}`}
              />
            </div>
          </div>

          {/* Mutation status */}
          {updateMutation.isSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700 flex items-center gap-2">
              <Check className="h-4 w-4" /> Role details saved successfully.
            </div>
          )}
          {updateMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              {(updateMutation.error as any)?.response?.data?.detail || 'Failed to update role.'}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending || !isDirty}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white gradient-brand shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Details
            </button>
          </div>
        </form>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="space-y-5">
          {permLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 text-brand-500 animate-spin" />
            </div>
          ) : (
            <>
              {Object.entries(permCatalog || {}).map(([category, perms]: [string, any]) => {
                const allSelected = perms.every((p: any) => selectedPermIds.has(p.id));

                return (
                  <div key={category} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">{category}</h4>
                      <button
                        type="button"
                        onClick={() => toggleCategory(perms)}
                        className={`text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                          allSelected
                            ? 'bg-brand-50 text-brand-600 border-brand-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {perms.map((perm: any) => {
                        const checked = selectedPermIds.has(perm.id);
                        return (
                          <label
                            key={perm.id}
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              checked
                                ? 'bg-brand-50/60 border-brand-200'
                                : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePerm(perm.id)}
                              className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                            />
                            <div>
                              <span className="font-mono text-xs font-semibold text-slate-700">{perm.name}</span>
                              {perm.description && (
                                <p className="text-[11px] text-slate-400 mt-0.5">{perm.description}</p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Save permissions */}
              {permMutation.isSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700 flex items-center gap-2">
                  <Check className="h-4 w-4" /> Permissions updated successfully.
                </div>
              )}
              {permMutation.isError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                  {(permMutation.error as any)?.response?.data?.detail || 'Failed to update permissions.'}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={permMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white gradient-brand shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
                >
                  {permMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Permissions ({selectedPermIds.size} selected)
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
