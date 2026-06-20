import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { createUser, getRolesList } from '../api/users';
import { ArrowLeft, ShieldCheck, Mail, ShieldAlert, Copy, Check, ArrowRight } from 'lucide-react';

const userCreateSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  persona_type: z.enum(['super_admin', 'headmaster', 'teacher', 'student'], {
    message: 'Select a persona type',
  }),
  roleIds: z.array(z.string()).min(1, { message: 'Select at least one role' }),
});

type UserCreateValues = z.infer<typeof userCreateSchema>;

export const UserCreate: React.FC = () => {
  const navigate = useNavigate();
  const [successData, setSuccessData] = useState<{ email: string; tempPass: string; id: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: getRolesList,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserCreateValues>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: { email: '', persona_type: 'super_admin', roleIds: [] },
  });

  const selectedRoleIds = watch('roleIds') || [];
  const selectedPersona = watch('persona_type');

  const handleRoleToggle = (roleId: string) => {
    if (selectedRoleIds.includes(roleId)) {
      setValue('roleIds', selectedRoleIds.filter(id => id !== roleId));
    } else {
      setValue('roleIds', [...selectedRoleIds, roleId]);
    }
  };

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (data) => {
      setSuccessData({ email: data.user.email, tempPass: data.temporary_password, id: data.user.id });
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to create user.');
    },
  });

  const onSubmit = (values: UserCreateValues) => {
    setErrorMsg(null);
    createMutation.mutate({ email: values.email, persona_type: values.persona_type, role_ids: values.roleIds });
  };

  const handleCopyPassword = () => {
    if (!successData) return;
    navigator.clipboard.writeText(successData.tempPass);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (successData) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-md text-center space-y-6">
          <div className="h-16 w-16 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">User Created Successfully!</h2>
            <p className="text-slate-500 text-sm mt-1.5">
              Account created for <span className="font-semibold text-slate-800">{successData.email}</span>.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900 text-white space-y-4">
            <span className="text-[10px] uppercase font-bold text-brand-400 tracking-widest block">
              Temporary Security Password
            </span>
            <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-lg text-emerald-400 tracking-wider">
              <span>{successData.tempPass}</span>
              <button
                onClick={handleCopyPassword}
                className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Copy Password"
              >
                {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <strong>Security Warning:</strong> This password is system-generated and returned only once. It is never stored in plaintext and cannot be retrieved later. Copy and share it securely with the user.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              onClick={() => navigate({ to: '/administration/users/$userId', params: { userId: successData.id } as any })}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white gradient-brand shadow-lg hover:shadow-xl hover:brightness-105 active:scale-[0.98] transition-all text-sm cursor-pointer"
            >
              Go to User Profile
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center">
        <Link
          to="/administration/users"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to User List
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="border-b border-slate-100 pb-5 mb-6">
          <h2 className="text-xl font-bold text-slate-800">Add New User</h2>
          <p className="text-slate-500 text-sm">Provision a new user account and map their initial organization access roles.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              User Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                placeholder="name@organization.com"
                {...register('email')}
                className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-white/50 focus:bg-white transition-all text-sm outline-none ${
                  errors.email ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-200 focus:ring-2 focus:ring-brand-100 focus:border-brand-500'
                }`}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1.5">{errors.email.message}</p>}
          </div>

          {/* Persona Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Portal Access (Persona)
            </label>
            <select
              {...register('persona_type')}
              className={`w-full px-4 py-3 rounded-xl border bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all ${
                errors.persona_type ? 'border-red-400' : 'border-slate-200'
              }`}
            >
              <option value="super_admin">Super Admin — Administration Portal</option>
              <option value="headmaster">Headmaster — Administration Portal</option>
              <option value="teacher">Teacher — Teacher Portal</option>
              <option value="student">Student — Student Portal</option>
            </select>
            {errors.persona_type && <p className="text-xs text-red-500 mt-1.5">{errors.persona_type.message}</p>}
          </div>

          {/* Roles Checklist */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Assign Organization Roles
            </label>
            {rolesLoading ? (
              <div className="text-center py-4 text-xs text-slate-400">Loading roles...</div>
            ) : roles.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">No roles configured for this organization.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(roles as any[])
                  .filter((role) => !selectedPersona || role.persona_type === selectedPersona)
                  .map((role: any) => {
                    const isChecked = selectedRoleIds.includes(role.id);
                    return (
                      <div
                        key={role.id}
                        onClick={() => handleRoleToggle(role.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                          isChecked ? 'border-brand-500 bg-brand-50/20 shadow-sm' : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50/80'
                        }`}
                      >
                        <div className={`mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-all ${
                          isChecked ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-800 text-xs block truncate">{role.name}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 truncate">{role.description}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
            {errors.roleIds && <p className="text-xs text-red-500 mt-2">{errors.roleIds.message}</p>}
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-3.5 rounded-xl font-semibold text-white gradient-brand shadow-lg hover:shadow-xl hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none mt-4 flex items-center justify-center gap-2 cursor-pointer"
          >
            {createMutation.isPending ? 'Generating Temporary Credentials...' : 'Register User'}
          </button>
        </form>
      </div>
    </div>
  );
};
