import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldAlert } from 'lucide-react';

const subjectSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  code: z.string().min(2, { message: 'Code must be at least 2 characters' }),
  department_id: z.string().nullable().optional(),
  description: z.string().optional(),
  status: z.string().default('active'),
});

export type SubjectFormValues = z.infer<typeof subjectSchema>;

interface SubjectFormProps {
  departments: { id: string; name: string }[];
  initialData?: Partial<SubjectFormValues>;
  onSubmit: (values: SubjectFormValues) => void;
  isPending?: boolean;
  errorMsg?: string | null;
  submitLabel?: string;
}

export const SubjectForm: React.FC<SubjectFormProps> = ({
  departments,
  initialData,
  onSubmit,
  isPending = false,
  errorMsg = null,
  submitLabel = 'Save Subject',
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: initialData?.name || '',
      code: initialData?.code || '',
      department_id: initialData?.department_id || null,
      description: initialData?.description || '',
      status: initialData?.status || 'active',
    },
  });

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
            Subject Name
          </label>
          <input
            type="text"
            placeholder="e.g., Mathematics, English Literature"
            {...register('name')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Subject Code
          </label>
          <input
            type="text"
            placeholder="e.g., MATH-101, ENG-LIT"
            {...register('code')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all font-mono"
          />
          {errors.code && (
            <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Department (Optional)
          </label>
          <select
            onChange={(e) => setValue('department_id', e.target.value === '' ? null : e.target.value)}
            defaultValue={initialData?.department_id || ''}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all font-medium text-slate-700"
          >
            <option value="">None (Optional)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Description
          </label>
          <textarea
            placeholder="Optional subject description..."
            {...register('description')}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
          />
        </div>

        <div>
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
