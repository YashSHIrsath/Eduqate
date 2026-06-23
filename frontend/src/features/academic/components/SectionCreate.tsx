import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import { createSection, getClasses } from '../api/academic';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';

interface SectionRow {
  name: string;
  code: string;
  capacity: string;
}

const emptyRow = (): SectionRow => ({ name: '', code: '', capacity: '' });

export const SectionCreate: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [classId, setClassId] = useState('');
  const [rows, setRows] = useState<SectionRow[]>([emptyRow()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [partialResult, setPartialResult] = useState<{ ok: number; failed: number; failedNames: string[] } | null>(null);

  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['classes-lookup'],
    queryFn: () => getClasses({ page_size: 100 }),
  });
  const classes: any[] = classesData?.items || [];

  const updateRow = (index: number, field: keyof SectionRow, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
    // Clear error for this field on change
    setErrors((prev) => { const next = { ...prev }; delete next[`${index}_${field}`]; return next; });
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => {
      const next: Record<string, string> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const [i, f] = k.split('_');
        const num = parseInt(i);
        if (num < index) next[k] = v;
        else if (num > index) next[`${num - 1}_${f}`] = v;
      });
      return next;
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!classId) errs['classId'] = 'Please select a class.';
    rows.forEach((row, i) => {
      if (!row.name.trim()) errs[`${i}_name`] = 'Name is required.';
      if (!row.code.trim() || row.code.trim().length < 2) errs[`${i}_code`] = 'Code must be ≥ 2 chars.';
      if (row.capacity && isNaN(Number(row.capacity))) errs[`${i}_capacity`] = 'Must be a number.';
    });
    // Check duplicate codes within the form
    const codes = rows.map((r) => r.code.trim().toLowerCase());
    codes.forEach((code, i) => {
      if (code && codes.indexOf(code) !== i) errs[`${i}_code`] = 'Duplicate code in this batch.';
    });
    return errs;
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setPartialResult(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setIsSubmitting(true);
    let ok = 0;
    let failed = 0;
    const failedNames: string[] = [];

    for (const row of rows) {
      try {
        await createSection({
          class_id: classId,
          name: row.name.trim(),
          code: row.code.trim(),
          capacity: row.capacity ? Number(row.capacity) : null,
          status: 'active',
        });
        ok++;
      } catch {
        failed++;
        failedNames.push(row.name || row.code);
      }
    }

    setIsSubmitting(false);
    queryClient.invalidateQueries({ queryKey: ['sections'] });

    if (failed === 0) {
      navigate({ to: '/administration/academic/sections' });
    } else {
      setPartialResult({ ok, failed, failedNames });
    }
  };

  if (classesLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        <span>Loading classes…</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center">
        <Link
          to="/administration/academic/sections"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sections
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-800">Create Sections</h2>
        <p className="text-slate-500 text-sm">
          Select a class, then add all sections for it in one go.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-8">
        {/* Class selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Class
          </label>
          <select
            value={classId}
            onChange={(e) => { setClassId(e.target.value); setErrors((p) => { const n = { ...p }; delete n['classId']; return n; }); }}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all font-medium text-slate-700"
          >
            <option value="">Select Class...</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors['classId'] && <p className="text-red-500 text-xs mt-1">{errors['classId']}</p>}
        </div>

        {/* Sections table */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Sections — {rows.length} to create
          </div>

          {/* Header row */}
          <div className="grid grid-cols-[1fr_1fr_120px_36px] gap-3 px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Name</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Code</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Capacity</span>
            <span />
          </div>

          {/* Section rows */}
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_120px_36px] gap-3 items-start">
              <div>
                <input
                  type="text"
                  value={row.name}
                  onChange={(e) => updateRow(i, 'name', e.target.value)}
                  placeholder="e.g., Section A"
                  className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all ${errors[`${i}_name`] ? 'border-red-400' : 'border-slate-200'}`}
                />
                {errors[`${i}_name`] && <p className="text-red-500 text-[10px] mt-1">{errors[`${i}_name`]}</p>}
              </div>
              <div>
                <input
                  type="text"
                  value={row.code}
                  onChange={(e) => updateRow(i, 'code', e.target.value)}
                  placeholder="e.g., sec-a"
                  className={`w-full px-3 py-2 rounded-lg border text-sm font-mono outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all ${errors[`${i}_code`] ? 'border-red-400' : 'border-slate-200'}`}
                />
                {errors[`${i}_code`] && <p className="text-red-500 text-[10px] mt-1">{errors[`${i}_code`]}</p>}
              </div>
              <div>
                <input
                  type="number"
                  value={row.capacity}
                  onChange={(e) => updateRow(i, 'capacity', e.target.value)}
                  placeholder="e.g., 40"
                  min={1}
                  className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all ${errors[`${i}_capacity`] ? 'border-red-400' : 'border-slate-200'}`}
                />
                {errors[`${i}_capacity`] && <p className="text-red-500 text-[10px] mt-1">{errors[`${i}_capacity`]}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeRow(i)}
                disabled={rows.length === 1}
                className="mt-1 p-1.5 rounded-lg border border-slate-200 text-red-400 hover:bg-red-50 hover:border-red-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="Remove row"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* Add row button */}
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors mt-1"
          >
            <Plus className="h-4 w-4" />
            Add another section
          </button>
        </div>

        {/* Feedback */}
        {submitError && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">{submitError}</div>
        )}
        {partialResult && (
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-sm">
            {partialResult.ok} section(s) created.{' '}
            {partialResult.failed} failed ({partialResult.failedNames.join(', ')}) — codes may already exist.
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl font-semibold text-white gradient-brand shadow-md hover:brightness-105 active:scale-[0.98] disabled:opacity-50 transition-all text-sm cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating sections…
              </span>
            ) : (
              `Create ${rows.length} Section${rows.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
