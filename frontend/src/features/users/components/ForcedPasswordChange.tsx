import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../auth';
import { changePassword } from '../api/users';
import { KeyRound, ShieldAlert, Check } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, { message: 'Current password is required' }),
    newPassword: z.string().min(10, { message: 'New password must be at least 10 characters' }),
    confirmPassword: z.string().min(1, { message: 'Confirm password is required' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;

export const ForcedPasswordChange: React.FC = () => {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
  });

  const onSubmit = async (values: PasswordChangeValues) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await changePassword({
        current_password: values.currentPassword,
        new_password: values.newPassword,
      });
      setIsSuccess(true);
      await refreshProfile();
      setTimeout(() => {
        navigate({ to: '/' });
      }, 1500);
    } catch (err: any) {
      console.error('Password change failed:', err);
      const detail = err.response?.data?.detail || 'Failed to update password. Verify your current password.';
      setErrorMsg(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-2xl border border-white/20 shadow-2xl glass-panel text-center space-y-6">
          <div className="h-16 w-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
            <Check className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Password Updated!</h2>
            <p className="text-slate-500 text-sm mt-1.5">
              Your credentials were changed successfully. Preparing your portal dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-2xl border border-white/20 shadow-2xl glass-panel relative overflow-hidden">
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-xl shadow-lg mb-4 text-white">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Security Password Update</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            First login detected. For compliance and account safety, you are required to change your temporary password before proceeding.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50/80 border border-red-100 flex items-start gap-3 text-red-700 text-sm">
            <ShieldAlert className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
            <div>
              <span className="font-semibold block">Password Change Error</span>
              {errorMsg}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Temporary / Current Password
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              {...register('currentPassword')}
              className={`w-full px-4 py-3 rounded-xl border bg-white/50 focus:bg-white transition-all text-sm outline-none ${
                errors.currentPassword ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-200 focus:ring-2 focus:ring-brand-100 focus:border-brand-500'
              }`}
            />
            {errors.currentPassword && (
              <p className="text-xs text-red-500 mt-1.5">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              New Password
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              {...register('newPassword')}
              className={`w-full px-4 py-3 rounded-xl border bg-white/50 focus:bg-white transition-all text-sm outline-none ${
                errors.newPassword ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-200 focus:ring-2 focus:ring-brand-100 focus:border-brand-500'
              }`}
            />
            {errors.newPassword && (
              <p className="text-xs text-red-500 mt-1.5">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              {...register('confirmPassword')}
              className={`w-full px-4 py-3 rounded-xl border bg-white/50 focus:bg-white transition-all text-sm outline-none ${
                errors.confirmPassword ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-200 focus:ring-2 focus:ring-brand-100 focus:border-brand-500'
              }`}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1.5">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg hover:shadow-xl hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2 flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            {isSubmitting ? 'Updating Credentials...' : 'Activate Account'}
          </button>
        </form>
      </div>
    </div>
  );
};
