import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { createRole } from '../api/roles';
import { getPermissionsCatalog } from '../../users/api/users';
import { ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';

const roleCreateSchema = z.object({
  name: z.string().min(2, { message: 'Role name must be at least 2 characters' }),
  description: z.string().optional(),
  persona_type: z.enum(['super_admin', 'headmaster', 'teacher', 'student'], {
    message: 'Select a persona type',
  }),
  permissionIds: z.array(z.string()),
});

type RoleCreateValues = z.infer<typeof roleCreateSchema>;

export const RoleCreate: React.FC = () => {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: permissionsCatalog = {} } = useQuery({
    queryKey: ['permissions-catalog'],
    queryFn: getPermissionsCatalog,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoleCreateValues>({
    resolver: zodResolver(roleCreateSchema),
    defaultValues: { name: '', description: '', persona_type: 'super_admin', permissionIds: [] },
  });

  const selectedPermissionIds = watch('permissionIds') || [];

  const handlePermissionToggle = (permId: string) => {
    if (selectedPermissionIds.includes(permId)) {
      setValue('permissionIds', selectedPermissionIds.filter(id => id !== permId));
    } else {
      setValue('permissionIds', [...selectedPermissionIds, permId]);
    }
  };

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: (data) => {
      navigate({ to: '/administration/roles/$roleId', params: { roleId: data.id } as any });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to create role.');
    },
  });

  const onSubmit = (values: RoleCreateValues) => {
    setErrorMsg(null);
    createMutation.mutate({
      name: values.name,
      description: values.description,
      persona_type: values.persona_type,
      permission_ids: values.permissionIds,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center">
        <Link
          to="/administration/roles"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Role List
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="border-b border-slate-100 pb-5 mb-6">
          <h2 className="text-xl font-bold text-slate-800">Create New Role</h2>
          <p className="text-slate-500 text-sm">Define a role and assign the permission set it will carry.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Role Name</label>
            <input
              type="text"
              placeholder="e.g. Department Head"
              {...register('name')}
              className={`w-full px-4 py-3 rounded-xl border bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all ${
                errors.name ? 'border-red-400' : 'border-slate-200'
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1.5">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Description (Optional)</label>
            <textarea
              rows={3}
              placeholder="Brief description of what this role is for..."
              {...register('description')}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Persona Type (Portal)</label>
            <select
              {...register('persona_type')}
              className={`w-full px-4 py-3 rounded-xl border bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all ${
                errors.persona_type ? 'border-red-400' : 'border-slate-200'
              }`}
            >
              <option value="super_admin">Super Admin</option>
              <option value="headmaster">Headmaster</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
            {errors.persona_type && <p className="text-xs text-red-500 mt-1.5">{errors.persona_type.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Permissions ({selectedPermissionIds.length} selected)
            </label>
            <div className="space-y-6">
              {Object.keys(permissionsCatalog).map((category) => (
                <div key={category} className="space-y-2.5">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">{category}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(permissionsCatalog as any)[category].map((perm: any) => {
                      const isChecked = selectedPermissionIds.includes(perm.id);
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
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-3.5 rounded-xl font-semibold text-white gradient-brand shadow-lg hover:shadow-xl hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            {createMutation.isPending ? 'Creating Role...' : 'Create Role'}
          </button>
        </form>
      </div>
    </div>
  );
};
