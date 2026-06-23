import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import {
  createTeacherAssignment,
  getClasses,
  getSections,
  getSubjects,
  getAcademicYears,
  getClassSubjects,
} from '../api/academic';
import { getUsers } from '../../users/api/users';
import { ArrowLeft, Loader2, Star, Users } from 'lucide-react';

type SubjectRole = 'primary' | 'co_teacher';
// sectionId -> subjectId -> role (undefined = not selected)
type SubjectSelections = Record<string, Record<string, SubjectRole | undefined>>;

export const TeacherAssignmentCreate: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [teacherId, setTeacherId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [classId, setClassId] = useState('');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [subjectSelections, setSubjectSelections] = useState<SubjectSelections>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [partialResult, setPartialResult] = useState<{ ok: number; failed: number } | null>(null);

  // Static lookups
  const { data: usersData } = useQuery({
    queryKey: ['users-lookup'],
    queryFn: () => getUsers({ page_size: 100, persona_type: 'teacher' }),
  });
  const teachers: any[] = usersData?.users || [];

  const { data: yearsData } = useQuery({
    queryKey: ['years-lookup'],
    queryFn: () => getAcademicYears({ page_size: 100 }),
  });
  const years: any[] = yearsData?.items || [];

  const { data: classesData } = useQuery({
    queryKey: ['classes-lookup'],
    queryFn: () => getClasses({ page_size: 100 }),
  });
  const classes: any[] = classesData?.items || [];

  const { data: allSubjectsData } = useQuery({
    queryKey: ['subjects-lookup'],
    queryFn: () => getSubjects({ page_size: 100 }),
  });
  const subjectMap: Record<string, any> = Object.fromEntries(
    (allSubjectsData?.items || []).map((s: any) => [s.id, s])
  );

  // Dynamic: sections filtered by chosen class
  const { data: sectionsData, isLoading: sectionsLoading } = useQuery({
    queryKey: ['sections-for-class', classId],
    queryFn: () => getSections({ class_id: classId, page_size: 100 }),
    enabled: !!classId,
  });
  const sections: any[] = sectionsData?.items || [];

  // Dynamic: subjects assigned to chosen class + year
  const { data: classSubjectsData, isLoading: classSubjectsLoading } = useQuery({
    queryKey: ['class-subjects', classId, academicYearId],
    queryFn: () => getClassSubjects(classId, academicYearId),
    enabled: !!classId && !!academicYearId,
  });
  const classSubjects: any[] = classSubjectsData || [];

  const handleClassChange = (newClassId: string) => {
    setClassId(newClassId);
    setSelectedSections([]);
    setSubjectSelections({});
  };

  const toggleSection = (sectionId: string) => {
    setSelectedSections((prev) => {
      if (prev.includes(sectionId)) {
        setSubjectSelections((sel) => {
          const copy = { ...sel };
          delete copy[sectionId];
          return copy;
        });
        return prev.filter((id) => id !== sectionId);
      }
      return [...prev, sectionId];
    });
  };

  const toggleSubject = (sectionId: string, subjectId: string) => {
    setSubjectSelections((prev) => {
      const sec = prev[sectionId] || {};
      if (sec[subjectId] !== undefined) {
        const { [subjectId]: _removed, ...rest } = sec;
        return { ...prev, [sectionId]: rest };
      }
      return { ...prev, [sectionId]: { ...sec, [subjectId]: 'primary' } };
    });
  };

  const setSubjectRole = (sectionId: string, subjectId: string, role: SubjectRole) => {
    setSubjectSelections((prev) => ({
      ...prev,
      [sectionId]: { ...(prev[sectionId] || {}), [subjectId]: role },
    }));
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setPartialResult(null);

    const toCreate: any[] = [];
    for (const sectionId of selectedSections) {
      const secSubs = subjectSelections[sectionId] || {};
      for (const [subjectId, role] of Object.entries(secSubs)) {
        if (role !== undefined) {
          toCreate.push({
            teacher_id: teacherId,
            section_id: sectionId,
            subject_id: subjectId,
            academic_year_id: academicYearId,
            is_primary: role === 'primary',
          });
        }
      }
    }

    if (toCreate.length === 0) {
      setSubmitError('Select at least one subject in a section before saving.');
      return;
    }

    setIsSubmitting(true);
    let ok = 0;
    let failed = 0;
    for (const assignment of toCreate) {
      try {
        await createTeacherAssignment(assignment);
        ok++;
      } catch {
        failed++;
      }
    }
    setIsSubmitting(false);
    queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });

    if (failed === 0) {
      navigate({ to: '/administration/academic/teachers/assignments' });
    } else {
      setPartialResult({ ok, failed });
    }
  };

  const canSubmit =
    !!teacherId &&
    !!academicYearId &&
    !!classId &&
    selectedSections.length > 0 &&
    selectedSections.some((sid) => Object.keys(subjectSelections[sid] || {}).length > 0);

  const isLoadingCascaded = sectionsLoading || classSubjectsLoading;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center">
        <Link
          to="/administration/academic/teachers/assignments"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Teacher Assignments
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-800">Create Teacher Assignment</h2>
        <p className="text-slate-500 text-sm">
          Choose a teacher, pick a class and its sections, then assign subjects with their role.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-8">
        {/* ── Teacher + Year ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Teacher
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all font-medium text-slate-700"
            >
              <option value="">Select Teacher...</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name ? `${t.full_name} (${t.email})` : t.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Academic Year
            </label>
            <select
              value={academicYearId}
              onChange={(e) => setAcademicYearId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all font-medium text-slate-700"
            >
              <option value="">Select Academic Year...</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Class ──────────────────────────────────────────── */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Class
          </label>
          <select
            value={classId}
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
        </div>

        {/* ── Sections + Subjects (cascading) ────────────────── */}
        {classId && (
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sections & Subjects
            </div>

            {isLoadingCascaded ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-6 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading sections and subjects…
              </div>
            ) : sections.length === 0 ? (
              <div className="text-sm text-slate-400 py-6 border border-dashed border-slate-200 rounded-xl text-center">
                No sections found for this class.
              </div>
            ) : (
              sections.map((section) => {
                const isChecked = selectedSections.includes(section.id);
                const secSubs = subjectSelections[section.id] || {};

                return (
                  <div
                    key={section.id}
                    className={`rounded-xl border transition-all ${
                      isChecked
                        ? 'border-brand-300 bg-brand-50/20'
                        : 'border-slate-200 bg-slate-50/20'
                    }`}
                  >
                    {/* Section header row */}
                    <div
                      className="flex items-center gap-3 p-4 cursor-pointer select-none"
                      onClick={() => toggleSection(section.id)}
                    >
                      <div
                        className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-all ${
                          isChecked
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && (
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="font-semibold text-sm text-slate-800">{section.name}</span>
                      {isChecked && (
                        <span className="ml-auto text-xs text-slate-400">
                          {Object.keys(secSubs).length} subject(s) selected
                        </span>
                      )}
                    </div>

                    {/* Subject picker — visible when section is checked */}
                    {isChecked && (
                      <div className="px-4 pb-4 border-t border-slate-100">
                        {classSubjects.length === 0 ? (
                          <p className="text-xs text-slate-400 pt-3">
                            No subjects assigned to this class for the selected year. Go to Classes → Subjects to assign them first.
                          </p>
                        ) : (
                          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {classSubjects.map((cs: any) => {
                              const subject = subjectMap[cs.subject_id];
                              if (!subject) return null;
                              const role = secSubs[cs.subject_id];
                              const isSubjectSelected = role !== undefined;

                              return (
                                <div
                                  key={cs.subject_id}
                                  className={`rounded-lg border p-3 transition-all ${
                                    isSubjectSelected
                                      ? 'border-indigo-300 bg-indigo-50/30'
                                      : 'border-slate-200 bg-white'
                                  }`}
                                >
                                  {/* Subject toggle */}
                                  <div
                                    className="flex items-center gap-2 cursor-pointer"
                                    onClick={() => toggleSubject(section.id, cs.subject_id)}
                                  >
                                    <div
                                      className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-all ${
                                        isSubjectSelected
                                          ? 'border-indigo-600 bg-indigo-600 text-white'
                                          : 'border-slate-300 bg-white'
                                      }`}
                                    >
                                      {isSubjectSelected && (
                                        <svg
                                          className="h-3 w-3"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                          strokeWidth="3"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                    <span className="text-sm font-medium text-slate-800">
                                      {subject.name}
                                    </span>
                                  </div>

                                  {/* Role picker — visible when subject is selected */}
                                  {isSubjectSelected && (
                                    <div className="flex gap-2 mt-2 ml-6">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSubjectRole(section.id, cs.subject_id, 'primary')
                                        }
                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                                          role === 'primary'
                                            ? 'bg-amber-50 border-amber-300 text-amber-700'
                                            : 'bg-white border-slate-200 text-slate-500 hover:border-amber-200 hover:text-amber-600'
                                        }`}
                                      >
                                        <Star
                                          className={`h-3 w-3 ${
                                            role === 'primary'
                                              ? 'fill-amber-400 text-amber-400'
                                              : 'text-slate-400'
                                          }`}
                                        />
                                        Primary Lead
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSubjectRole(section.id, cs.subject_id, 'co_teacher')
                                        }
                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                                          role === 'co_teacher'
                                            ? 'bg-slate-100 border-slate-400 text-slate-700'
                                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                                        }`}
                                      >
                                        <Users className="h-3 w-3" />
                                        Co-Teacher
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Feedback ───────────────────────────────────────── */}
        {submitError && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
            {submitError}
          </div>
        )}
        {partialResult && (
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-sm">
            {partialResult.ok} assignment(s) created successfully.{' '}
            {partialResult.failed} failed — they may already exist for this section-subject pair.
          </div>
        )}

        {/* ── Submit ─────────────────────────────────────────── */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="px-6 py-2.5 rounded-xl font-semibold text-white gradient-brand shadow-md hover:brightness-105 active:scale-[0.98] disabled:opacity-50 transition-all text-sm cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving assignments…
              </span>
            ) : (
              'Save Assignments'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
