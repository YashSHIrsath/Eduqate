import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldAlert } from 'lucide-react';

const sectionSchema = z.object({
  class_id: z.string().min(1, { message: 'Class selection is required' }),
  name: z.string().min(1, { message: 'Name is required' }),
  code: z.string().min(2, { message: 'Code must be at least 2 characters' }),
  capacity: z.number().min(1, { message: 'Capacity must be at least 1' }).nullable().optional(),
  status: z.string().default('active'),
});

export type SectionFormValues = z.infer<typeof sectionSchema>;

interface SectionFormProps {
  classes: { id: string; name: string }[];
  initialData?: Partial<SectionFormValues>;
  onSubmit: (values: SectionFormValues) => void;
  isPending?: boolean;
  errorMsg?: string | null;
  submitLabel?: string;
}

export const SectionForm: React.FC<SectionFormProps> = ({
  classes,
  initialData,
  onSubmit,
  isPending = false,
  errorMsg = null,
  submitLabel = 'Save Section',
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      class_id: initialData?.class_id || '',
      name: initialData?.name || '',
      code: initialData?.code || '',
      capacity: initialData?.capacity || null,
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
            Class
          </label>
          <select
            {...register('class_id')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all font-medium text-slate-700"
          >
            <option value="">Select Class...</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.class_id && (
            <p className="text-red-500 text-xs mt-1">{errors.class_id.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Section Name
          </label>
          <input
            type="text"
            placeholder="e.g., Section A, Group B"
            {...register('name')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Section Code
          </label>
          <input
            type="text"
            placeholder="e.g., SEC-A, G-B"
            {...register('code')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all font-mono"
          />
          {errors.code && (
            <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Capacity (Optional)
          </label>
          <input
            type="number"
            placeholder="e.g., 40"
            onChange={(e) => setValue('capacity', e.target.value === '' ? null : Number(e.target.value))}
            defaultValue={initialData?.capacity || ''}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
          />
          {errors.capacity && (
            <p className="text-red-500 text-xs mt-1">{errors.capacity.message}</p>
          )}
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
