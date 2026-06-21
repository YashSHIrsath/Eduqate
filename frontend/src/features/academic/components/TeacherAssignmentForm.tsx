import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldAlert, CheckSquare, Square } from 'lucide-react';

const assignmentSchema = z.object({
  teacher_id: z.string().min(1, { message: 'Teacher selection is required' }),
  section_id: z.string().min(1, { message: 'Section selection is required' }),
  subject_id: z.string().min(1, { message: 'Subject selection is required' }),
  academic_year_id: z.string().min(1, { message: 'Academic Year selection is required' }),
  is_primary: z.boolean().default(true),
  status: z.string().default('active'),
});

export type TeacherAssignmentFormValues = z.infer<typeof assignmentSchema>;

interface TeacherAssignmentFormProps {
  teachers: { id: string; full_name?: string; email: string }[];
  classes: { id: string; name: string }[];
  sections: { id: string; name: string; class_id: string }[];
  subjects: { id: string; name: string }[];
  years: { id: string; name: string }[];
  initialData?: Partial<TeacherAssignmentFormValues>;
  onSubmit: (values: TeacherAssignmentFormValues) => void;
  isPending?: boolean;
  errorMsg?: string | null;
  submitLabel?: string;
}

export const TeacherAssignmentForm: React.FC<TeacherAssignmentFormProps> = ({
  teachers,
  classes,
  sections,
  subjects,
  years,
  initialData,
  onSubmit,
  isPending = false,
  errorMsg = null,
  submitLabel = 'Assign Teacher',
}) => {
  // In edit mode, derive the initial class from the pre-selected section's class_id
  const initialClassId = initialData?.section_id
    ? (sections.find((s) => s.id === initialData.section_id)?.class_id ?? '')
    : '';

  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId);

  const filteredSections = selectedClassId
    ? sections.filter((s) => s.class_id === selectedClassId)
    : [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TeacherAssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      teacher_id: initialData?.teacher_id || '',
      section_id: initialData?.section_id || '',
      subject_id: initialData?.subject_id || '',
      academic_year_id: initialData?.academic_year_id || '',
      is_primary: initialData?.is_primary !== undefined ? initialData.is_primary : true,
      status: initialData?.status || 'active',
    },
  });

  const isPrimary = watch('is_primary');

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    // Clear the section if it doesn't belong to the new class
    const currentSectionId = watch('section_id');
    const stillValid = sections.some(
      (s) => s.id === currentSectionId && s.class_id === classId
    );
    if (!stillValid) {
      setValue('section_id', '');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Teacher */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Teacher
          </label>
          <select
            {...register('teacher_id')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all font-medium text-slate-700"
          >
            <option value="">Select Teacher...</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name ? `${t.full_name} (${t.email})` : t.email}
              </option>
            ))}
          </select>
          {errors.teacher_id && (
            <p className="text-red-500 text-xs mt-1">{errors.teacher_id.message}</p>
          )}
        </div>

        {/* Academic Year */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Academic Year
          </label>
          <select
            {...register('academic_year_id')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all font-medium text-slate-700"
          >
            <option value="">Select Academic Year...</option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </select>
          {errors.academic_year_id && (
            <p className="text-red-500 text-xs mt-1">{errors.academic_year_id.message}</p>
          )}
        </div>

        {/* Class → Section (cascading) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all font-medium text-slate-700"
            >
              <option value="">Select Class...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {!selectedClassId && errors.section_id && (
              <p className="text-red-500 text-xs mt-1">Select a class first</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Class Section
            </label>
            <select
              {...register('section_id')}
              disabled={!selectedClassId}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all font-medium text-slate-700 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <option value="">
                {selectedClassId ? 'Select Section...' : 'Select a class first'}
              </option>
              {filteredSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.section_id && selectedClassId && (
              <p className="text-red-500 text-xs mt-1">{errors.section_id.message}</p>
            )}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Subject
          </label>
          <select
            {...register('subject_id')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all font-medium text-slate-700"
          >
            <option value="">Select Subject...</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
          {errors.subject_id && (
            <p className="text-red-500 text-xs mt-1">{errors.subject_id.message}</p>
          )}
        </div>

        {/* Primary + Status */}
        <div className="flex items-center gap-6 pt-2">
          <div
            onClick={() => setValue('is_primary', !isPrimary)}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <button type="button" className="text-brand-600 focus:outline-none">
              {isPrimary ? (
                <CheckSquare className="h-6 w-6" />
              ) : (
                <Square className="h-6 w-6 text-slate-300" />
              )}
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Primary Teacher</span>
              <span className="text-xs text-slate-400">
                Designates this teacher as the lead for this section-subject.
              </span>
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
