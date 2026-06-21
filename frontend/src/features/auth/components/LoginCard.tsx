import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { KeyRound, ShieldAlert, Sparkles, Building2, Mail } from 'lucide-react';

const loginSchema = z.object({
  organizationSlug: z.string().min(1, { message: 'Organization slug is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(10, { message: 'Password must be at least 10 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginCardProps {
  onSuccess: (user: any) => void;
}

export const LoginCard: React.FC<LoginCardProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      organizationSlug: 'default-academy', // Default value helper
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const authData = await login(values.email, values.password, values.organizationSlug);
      onSuccess(authData?.user);
    } catch (err: any) {
      console.error('Login error details:', err);
      const detail = err.response?.data?.detail || 'Authentication failed. Please verify credentials.';
      setErrorMsg(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl border border-white/20 shadow-2xl glass-panel relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-brand-500/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-8 relative">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-brand-600 to-indigo-600 rounded-xl shadow-lg mb-4 text-white">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-600 via-indigo-600 to-indigo-800 bg-clip-text text-transparent">
          Welcome to Eduqate
        </h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to manage your academy portal</p>
      </div>

      {/* Error Alert Box */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50/80 border border-red-100 flex items-start gap-3 text-red-700 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
          <div>
            <span className="font-semibold block">Login Error</span>
            {errorMsg}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Organization Slug
          </label>
          <div className="relative">
            <Building2 className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. default-academy"
              {...register('organizationSlug')}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-white/50 focus:bg-white transition-all text-sm outline-none ${
                errors.organizationSlug ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-200 focus:ring-2 focus:ring-brand-100 focus:border-brand-500'
              }`}
            />
          </div>
          {errors.organizationSlug && (
            <p className="text-xs text-red-500 mt-1.5">{errors.organizationSlug.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="email"
              placeholder="name@organization.com"
              {...register('email')}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-white/50 focus:bg-white transition-all text-sm outline-none ${
                errors.email ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-200 focus:ring-2 focus:ring-brand-100 focus:border-brand-500'
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500 mt-1.5">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Password
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="password"
              placeholder="••••••••••••"
              {...register('password')}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-white/50 focus:bg-white transition-all text-sm outline-none ${
                errors.password ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-200 focus:ring-2 focus:ring-brand-100 focus:border-brand-500'
              }`}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 mt-1.5">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-xl font-semibold text-white gradient-brand shadow-lg hover:shadow-xl hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Authenticating...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
    </div>
  );
};
