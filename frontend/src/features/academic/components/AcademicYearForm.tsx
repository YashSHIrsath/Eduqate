import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldAlert, Calendar, CheckSquare, Square } from 'lucide-react';

const academicYearSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  start_date: z.string().min(1, { message: 'Start date is required' }),
  end_date: z.string().min(1, { message: 'End date is required' }),
  is_current: z.boolean().default(false),
  status: z.string().default('active'),
}).refine(
  (data) => new Date(data.start_date) < new Date(data.end_date),
  {
    message: 'Start date must precede the end date',
    path: ['end_date'],
  }
);

export type AcademicYearFormValues = z.infer<typeof academicYearSchema>;

interface AcademicYearFormProps {
  initialData?: Partial<AcademicYearFormValues>;
  onSubmit: (values: AcademicYearFormValues) => void;
  isPending?: boolean;
  errorMsg?: string | null;
  submitLabel?: string;
}

export const AcademicYearForm: React.FC<AcademicYearFormProps> = ({
  initialData,
  onSubmit,
  isPending = false,
  errorMsg = null,
  submitLabel = 'Save Academic Year',
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AcademicYearFormValues>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: {
      name: initialData?.name || '',
      start_date: initialData?.start_date || '',
      end_date: initialData?.end_date || '',
      is_current: initialData?.is_current || false,
      status: initialData?.status || 'active',
    },
  });

  const isCurrent = watch('is_current');

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Academic Year Name
          </label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="e.g., Academic Year 2026-2027"
              {...register('name')}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
            />
          </div>
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Start Date
            </label>
            <input
              type="date"
              {...register('start_date')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
            />
            {errors.start_date && (
              <p className="text-red-500 text-xs mt-1">{errors.start_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              End Date
            </label>
            <input
              type="date"
              {...register('end_date')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
            />
            {errors.end_date && (
              <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 pt-2">
          <div
            onClick={() => setValue('is_current', !isCurrent)}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <button
              type="button"
              className="text-brand-600 focus:outline-none"
            >
              {isCurrent ? (
                <CheckSquare className="h-6 w-6" />
              ) : (
                <Square className="h-6 w-6 text-slate-300" />
              )}
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Set as Current Year</span>
              <span className="text-xs text-slate-400">Makes this year the primary active cycle.</span>
            </div>
          </div>

          <div className="flex flex-col flex-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Status
            </label>
            <select
              {...register('status')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 rounded-xl font-semibold text-white gradient-brand shadow-md hover:brightness-105 active:scale-[0.98] disabled:opacity-50 transition-all text-sm cursor-pointer"
          >
            {isPending ? 'Saving...' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
};
