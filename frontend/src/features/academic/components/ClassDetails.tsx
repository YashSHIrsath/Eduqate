import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import {
  getClass,
  getDepartment,
  getSections,
  getClassSubjects,
  getSubjects,
  getAcademicYears,
  assignClassSubjects,
  unassignClassSubject,
} from '../api/academic';
import { useAuth } from '../../auth';
import {
  ArrowLeft,
  LayoutGrid,
  Layers,
  BookOpen,
  Users,
  Building2,
  Plus,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CalendarDays,
} from 'lucide-react';

export const ClassDetails: React.FC = () => {
  const { classId } = useParams({ from: '/administration/academic/classes/$classId' }) as { classId: string };
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Active Year Query for fallback lookup
  const { data: yearsData } = useQuery({
    queryKey: ['academic-years-lookup'],
    queryFn: () => getAcademicYears({ page_size: 100 }),
  });
  const years = yearsData?.items || [];
  const currentYear = years.find((y: any) => y.is_current);

  // Class Details
  const { data: cls, isLoading: clsLoading, error } = useQuery({
    queryKey: ['class', classId],
    queryFn: () => getClass(classId),
  });

  // Department
  const { data: dept } = useQuery({
    queryKey: ['department', cls?.department_id],
    queryFn: () => getDepartment(cls.department_id),
    enabled: !!cls?.department_id,
  });

  // Sections
  const { data: sectionsData } = useQuery({
    queryKey: ['sections', { class_id: classId }],
    queryFn: () => getSections({ class_id: classId }),
    enabled: !!classId,
  });

  // Subject Mappings
  const activeYearId = selectedYearId || currentYear?.id || '';
  const { data: assignedSubjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['class-subjects', classId, activeYearId],
    queryFn: () => getClassSubjects(classId, activeYearId),
    enabled: !!classId && !!activeYearId,
  });

  // Master Subjects (for dropdown list in modal)
  const { data: allSubjectsData } = useQuery({
    queryKey: ['all-subjects'],
    queryFn: () => getSubjects({ page_size: 100 }),
    enabled: showAssignModal,
  });
  const allSubjects = allSubjectsData?.items || [];

  const assignMutation = useMutation({
    mutationFn: (payload: { subject_ids: string[]; academic_year_id: string }) =>
      assignClassSubjects(classId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-subjects', classId] });
      setShowAssignModal(false);
      setSelectedSubjectIds([]);
      setAssignError(null);
    },
    onError: (err: any) => {
      setAssignError(err.response?.data?.detail || 'Failed to assign subjects.');
    },
  });

  const unassignMutation = useMutation({
    mutationFn: ({ subjectId, yearId }: { subjectId: string; yearId: string }) =>
      unassignClassSubject(classId, subjectId, yearId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-subjects', classId] });
    },
  });

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYearId) {
      setAssignError('Please select an Academic Year.');
      return;
    }
    if (selectedSubjectIds.length === 0) {
      setAssignError('Please select at least one subject.');
      return;
    }
    setAssignError(null);
    assignMutation.mutate({
      subject_ids: selectedSubjectIds,
      academic_year_id: selectedYearId,
    });
  };

  const handleSubjectToggle = (subId: string) => {
    if (selectedSubjectIds.includes(subId)) {
      setSelectedSubjectIds(selectedSubjectIds.filter((id) => id !== subId));
    } else {
      setSelectedSubjectIds([...selectedSubjectIds, subId]);
    }
  };

  const handleRemoveSubject = (subjectId: string) => {
    if (window.confirm('Are you sure you want to remove this subject assignment?')) {
      unassignMutation.mutate({ subjectId, yearId: activeYearId });
    }
  };

  if (clsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        <span>Loading class details...</span>
      </div>
    );
  }

  if (error || !cls) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="font-semibold text-slate-500">Class not found</p>
        <Link to="/administration/academic/classes" className="text-brand-600 hover:underline text-sm mt-2 block">
          Back to list
        </Link>
      </div>
    );
  }

  const sections = sectionsData?.items || [];
  const sectionsCount = sectionsData?.total || 0;
  const subjectsCount = assignedSubjects.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link
          to="/administration/academic/classes"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Class List
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="flex justify-between items-start border-b border-slate-100 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800">{cls.name}</h2>
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-semibold">
                {cls.code}
              </span>
            </div>
            {dept && (
              <p className="text-slate-500 text-sm flex items-center gap-1.5 font-medium">
                <Building2 className="h-4 w-4 text-slate-400" />
                Department: {dept.name}
              </p>
            )}
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            cls.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {cls.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Relationship Summary Panels */}
        <div className="pt-8 pb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Class Linkages
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-inner flex items-center gap-4">
              <div className="p-3 bg-violet-100 text-violet-600 rounded-xl">
                <Layers className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-800">{sectionsCount}</span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sections (Cohorts)</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-inner flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-800">{subjectsCount}</span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mapped Subjects</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-inner flex items-center gap-4 opacity-75">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                <Users className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-800">—</span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Students (Est.)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Class Sections Cohorts List */}
        <div className="pt-8 border-t border-slate-100 mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Class Sections (Cohorts)</h3>
              <p className="text-xs text-slate-500">Active class sections configured for this level.</p>
            </div>
            {hasPermission('sections:create') && (
              <Link
                to="/administration/academic/sections/new"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white gradient-brand shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Section
              </Link>
            )}
          </div>

          {sections.length === 0 ? (
            <div className="py-12 border border-dashed border-slate-200 rounded-xl text-center text-slate-400">
              <Layers className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-500">No sections created yet</p>
              <p className="text-xs">Select "Add Section" to create class sections.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sections.map((sec: any) => (
                <Link
                  key={sec.id}
                  to="/administration/academic/sections/$sectionId"
                  params={{ sectionId: sec.id } as any}
                  className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 text-sm group-hover:text-brand-600 transition-colors">{sec.name}</span>
                    <span className="font-mono text-xs text-slate-400">{sec.code}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">
                    Capacity: {sec.capacity || 'N/A'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Subject Assignments Nested Grid */}
        <div className="pt-8 border-t border-slate-100 mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Assigned Subjects Schedule</h3>
              <p className="text-xs text-slate-500">Subjects assigned to this class for the active academic cycle.</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedYearId || currentYear?.id || ''}
                onChange={(e) => setSelectedYearId(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
              >
                {years.map((y: any) => (
                  <option key={y.id} value={y.id}>
                    {y.name} {y.is_current ? '(Current)' : ''}
                  </option>
                ))}
              </select>
              {hasPermission('class_subjects:assign') && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white gradient-brand shadow-sm cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Assign Subjects
                </button>
              )}
            </div>
          </div>

          {subjectsLoading ? (
            <div className="py-12 flex justify-center text-slate-400">
              <Loader2 className="h-6 w-6 text-brand-500 animate-spin" />
            </div>
          ) : assignedSubjects.length === 0 ? (
            <div className="py-12 border border-dashed border-slate-200 rounded-xl text-center text-slate-400">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-500">No subjects mapped yet</p>
              <p className="text-xs">Select "Assign Subjects" to associate core learning tracks.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedSubjects.map((mapping: any) => {
                const subObj = allSubjects.find((s: any) => s.id === mapping.subject_id) || mapping.subject;
                const subjectName = subObj?.name || 'Subject';
                const subjectCode = subObj?.code || 'SUBJ';
                return (
                  <div key={mapping.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 flex items-center justify-between group">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 text-sm">{subjectName}</span>
                      <span className="font-mono text-xs text-slate-400">{subjectCode}</span>
                    </div>
                    {hasPermission('class_subjects:assign') && (
                      <button
                        onClick={() => handleRemoveSubject(mapping.subject_id)}
                        disabled={unassignMutation.isPending}
                        className="p-1.5 rounded-lg border border-transparent hover:border-red-200 bg-transparent text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
                        title="Remove Subject"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Assign Subjects Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Assign Subjects to Class</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {assignError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                  <span>{assignError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Academic Year
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                  <select
                    value={selectedYearId}
                    onChange={(e) => setSelectedYearId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all font-semibold text-slate-700"
                  >
                    <option value="">Select Academic Year...</option>
                    {years.map((y: any) => (
                      <option key={y.id} value={y.id}>
                        {y.name} {y.is_current ? '(Current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Select Subjects
                </label>
                {allSubjects.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No subjects configured in system.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1 bg-slate-50/50">
                    {allSubjects.map((sub: any) => {
                      const isAssigned = assignedSubjects.some((m: any) => m.subject_id === sub.id);
                      const isChecked = selectedSubjectIds.includes(sub.id);
                      return (
                        <div
                          key={sub.id}
                          onClick={() => {
                            if (isAssigned) return;
                            handleSubjectToggle(sub.id);
                          }}
                          className={`flex items-center justify-between p-3 rounded-lg text-sm select-none transition-colors ${
                            isAssigned ? 'opacity-50 cursor-not-allowed bg-slate-100/50' : 'cursor-pointer hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700">{sub.name}</span>
                            <span className="font-mono text-xs text-slate-400">{sub.code}</span>
                          </div>
                          {isAssigned ? (
                            <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-100">Mapped</span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4.5 w-4.5"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignMutation.isPending}
                  className="px-5 py-2.5 rounded-xl font-semibold text-white gradient-brand shadow-md hover:brightness-105 active:scale-[0.98] disabled:opacity-50 transition-all text-sm cursor-pointer"
                >
                  {assignMutation.isPending ? 'Mapping...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
