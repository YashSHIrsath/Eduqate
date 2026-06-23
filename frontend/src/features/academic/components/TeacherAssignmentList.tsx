import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import { getTeacherAssignments, deleteTeacherAssignment, getSections, getSubjects, getClasses, getAcademicYears } from '../api/academic';
import { useAuth } from '../../auth';
import { Plus, Eye, Edit, Trash2, Users, Star, BookOpen, LayoutGrid } from 'lucide-react';

interface AssignmentRow {
  id: string;
  teacher_id: string;
  teacher_name: string | null;
  teacher_email: string | null;
  section_id: string;
  subject_id: string;
  academic_year_id: string;
  is_primary: boolean;
  status: string;
}

export const TeacherAssignmentList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');

  // Fetch all assignments (large page to get the full picture for grouping)
  const { data, isLoading } = useQuery({
    queryKey: ['teacher-assignments'],
    queryFn: () => getTeacherAssignments({ page: 1, page_size: 500, sort_by: 'created_at', sort_order: 'desc' }),
  });

  // Lookups needed for names
  const { data: sectionsData } = useQuery({
    queryKey: ['sections-lookup'],
    queryFn: () => getSections({ page_size: 200 }),
  });
  const sections: any[] = sectionsData?.items || [];
  const sectionMap = Object.fromEntries(sections.map((s: any) => [s.id, s]));

  const { data: classesData } = useQuery({
    queryKey: ['classes-lookup'],
    queryFn: () => getClasses({ page_size: 100 }),
  });
  const classMap = Object.fromEntries((classesData?.items || []).map((c: any) => [c.id, c]));

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects-lookup'],
    queryFn: () => getSubjects({ page_size: 100 }),
  });
  const subjectMap = Object.fromEntries((subjectsData?.items || []).map((s: any) => [s.id, s]));

  const { data: yearsData } = useQuery({
    queryKey: ['years-lookup'],
    queryFn: () => getAcademicYears({ page_size: 100 }),
  });
  const yearMap = Object.fromEntries((yearsData?.items || []).map((y: any) => [y.id, y]));

  const deleteMutation = useMutation({
    mutationFn: deleteTeacherAssignment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] }),
  });

  const handleDelete = (id: string, teacherName: string, subjectName: string) => {
    if (window.confirm(`Remove ${teacherName}'s assignment for "${subjectName}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  // ── Group assignments by teacher ──────────────────────────
  const allItems: AssignmentRow[] = data?.items || [];

  const searchLower = search.toLowerCase();
  const filtered = search
    ? allItems.filter((a) => {
        const name = (a.teacher_name || a.teacher_email || '').toLowerCase();
        const section = sectionMap[a.section_id];
        const cls = section ? classMap[section.class_id] : null;
        const subject = subjectMap[a.subject_id];
        return (
          name.includes(searchLower) ||
          cls?.name?.toLowerCase().includes(searchLower) ||
          section?.name?.toLowerCase().includes(searchLower) ||
          subject?.name?.toLowerCase().includes(searchLower)
        );
      })
    : allItems;

  // teacher_id → { name, email, assignments }
  const byTeacher = new Map<string, { name: string; email: string; items: AssignmentRow[] }>();
  for (const a of filtered) {
    if (!byTeacher.has(a.teacher_id)) {
      byTeacher.set(a.teacher_id, {
        name: a.teacher_name || a.teacher_email || 'Unknown Teacher',
        email: a.teacher_email || '',
        items: [],
      });
    }
    byTeacher.get(a.teacher_id)!.items.push(a);
  }

  // For each teacher: group their items by class_id → section_id
  const buildTree = (items: AssignmentRow[]) => {
    // class_id → section_id → AssignmentRow[]
    const tree = new Map<string, Map<string, AssignmentRow[]>>();
    for (const a of items) {
      const section = sectionMap[a.section_id];
      const classId = section?.class_id || '__unknown__';
      if (!tree.has(classId)) tree.set(classId, new Map());
      const classTree = tree.get(classId)!;
      if (!classTree.has(a.section_id)) classTree.set(a.section_id, []);
      classTree.get(a.section_id)!.push(a);
    }
    return tree;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Teacher Assignments</h2>
          <p className="text-slate-500 text-sm">Assign teachers and workloads to specific subjects and sections.</p>
        </div>
        {hasPermission('teacher_assignments:create') && (
          <Link
            to="/administration/academic/teachers/assignments/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white gradient-brand shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all text-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Assignment
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by teacher, class, section or subject…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
        />
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-brand-300 border-t-brand-600 animate-spin" />
          <span className="text-sm">Loading assignments…</span>
        </div>
      )}

      {/* Empty */}
      {!isLoading && byTeacher.size === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 border border-dashed border-slate-200 rounded-2xl">
          <Users className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">
            {search ? 'No assignments match your search.' : 'No teacher assignments yet.'}
          </p>
          {!search && hasPermission('teacher_assignments:create') && (
            <Link
              to="/administration/academic/teachers/assignments/new"
              className="text-xs text-brand-600 font-semibold hover:underline"
            >
              Create the first assignment →
            </Link>
          )}
        </div>
      )}

      {/* Teacher cards */}
      {!isLoading && Array.from(byTeacher.entries()).map(([teacherId, teacher]) => {
        const tree = buildTree(teacher.items);
        const totalSubjects = teacher.items.length;

        return (
          <div key={teacherId} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Teacher header */}
            <div className="flex items-center gap-4 px-6 py-4 bg-slate-50/60 border-b border-slate-100">
              <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <div className="font-bold text-slate-800 text-sm">{teacher.name}</div>
                {teacher.email && teacher.name !== teacher.email && (
                  <div className="text-xs text-slate-400">{teacher.email}</div>
                )}
              </div>
              <div className="ml-auto text-xs text-slate-400 font-medium">
                {totalSubjects} assignment{totalSubjects !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Classes */}
            <div className="divide-y divide-slate-100">
              {Array.from(tree.entries()).map(([classId, sectionTree]) => {
                const cls = classMap[classId];
                const className = cls?.name || 'Unknown Class';

                return (
                  <div key={classId} className="px-6 py-4">
                    {/* Class label */}
                    <div className="flex items-center gap-2 mb-3">
                      <LayoutGrid className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{className}</span>
                    </div>

                    {/* Sections */}
                    <div className="space-y-3 ml-6">
                      {Array.from(sectionTree.entries()).map(([sectionId, assignments]) => {
                        const section = sectionMap[sectionId];
                        const sectionName = section?.name || 'Unknown Section';
                        const year = yearMap[assignments[0]?.academic_year_id];

                        return (
                          <div key={sectionId} className="rounded-xl border border-slate-100 bg-slate-50/40 overflow-hidden">
                            {/* Section sub-header */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100/60 border-b border-slate-100">
                              <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                              <span className="text-xs font-semibold text-slate-600">{sectionName}</span>
                              {year && (
                                <span className="ml-auto text-[10px] text-slate-400">{year.name}</span>
                              )}
                            </div>

                            {/* Subjects in this section */}
                            <div className="divide-y divide-slate-100">
                              {assignments.map((a) => {
                                const subject = subjectMap[a.subject_id];
                                const subjectName = subject?.name || 'Unknown Subject';
                                const displayName = teacher.name;

                                return (
                                  <div
                                    key={a.id}
                                    className="flex items-center gap-3 px-4 py-2.5"
                                  >
                                    {/* Role badge */}
                                    {a.is_primary ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                        <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                                        Primary Lead
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                                        <Users className="h-2.5 w-2.5" />
                                        Co-Teacher
                                      </span>
                                    )}

                                    {/* Subject name */}
                                    <span className="text-sm font-medium text-slate-700 flex-1">{subjectName}</span>

                                    {/* Status dot */}
                                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${a.status === 'active' ? 'bg-emerald-400' : 'bg-slate-300'}`} title={a.status} />

                                    {/* Actions */}
                                    <div className="flex items-center gap-1.5 ml-2">
                                      <button
                                        onClick={() => navigate({ to: '/administration/academic/teachers/assignments/$assignmentId', params: { assignmentId: a.id } as any })}
                                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all"
                                        title="View"
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                      </button>
                                      {hasPermission('teacher_assignments:update') && (
                                        <button
                                          onClick={() => navigate({ to: '/administration/academic/teachers/assignments/$assignmentId/edit', params: { assignmentId: a.id } as any })}
                                          className="p-1.5 rounded-lg border border-slate-200 bg-white text-brand-600 hover:bg-brand-50 transition-all"
                                          title="Edit"
                                        >
                                          <Edit className="h-3.5 w-3.5" />
                                        </button>
                                      )}
                                      {hasPermission('teacher_assignments:delete') && (
                                        <button
                                          onClick={() => handleDelete(a.id, displayName, subjectName)}
                                          disabled={deleteMutation.isPending}
                                          className="p-1.5 rounded-lg border border-slate-200 bg-white text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                                          title="Delete"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Record count footer */}
      {!isLoading && byTeacher.size > 0 && (
        <p className="text-xs text-slate-400 text-center">
          Showing {filtered.length} assignment{filtered.length !== 1 ? 's' : ''} across {byTeacher.size} teacher{byTeacher.size !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};
