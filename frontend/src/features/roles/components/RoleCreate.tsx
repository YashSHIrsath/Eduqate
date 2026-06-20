import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { createRole } from '../api/roles';
import { ArrowLeft, Shield, Check, Loader2 } from 'lucide-react';

const roleCreateSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100, 'Max 100 characters'),
  description: z.string().max(255, 'Max 255 characters').optional().or(z.literal('')),
});

type RoleCreateFormData = z.infer<typeof roleCreateSchema>;

export const RoleCreate: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoleCreateFormData>({
    resolver: zodResolver(roleCreateSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: RoleCreateFormData) =>
      createRole({ name: data.name, description: data.description || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      navigate({ to: '/roles' });
    },
  });

  const onSubmit = (data: RoleCreateFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/roles"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Roles
        </Link>
        <h2 className="text-2xl font-bold text-slate-800">Create New Role</h2>
        <p className="text-slate-500 text-sm">Define a new role for your organization.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-800">Role Details</h3>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Role Name *
            </label>
            <input
              id="name"
              {...register('name')}
              className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all ${errors.name ? 'border-red-400' : 'border-slate-200'}`}
              placeholder="e.g. Content Manager"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none ${errors.description ? 'border-red-400' : 'border-slate-200'}`}
              placeholder="Briefly describe what this role is for..."
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* Error Display */}
        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {(mutation.error as any)?.response?.data?.detail || 'Failed to create role.'}
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link
            to="/roles"
            className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white gradient-brand shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Create Role
          </button>
        </div>
      </form>
    </div>
  );
};
