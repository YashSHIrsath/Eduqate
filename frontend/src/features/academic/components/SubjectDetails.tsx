import React from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { getSubject, getDepartment, getClasses, getClassSubjects, getTeacherAssignments } from '../api/academic';
import { getUsers } from '../../users/api/users';
import { ArrowLeft, BookOpen, Building2, LayoutGrid, Users } from 'lucide-react';

export const SubjectDetails: React.FC = () => {
  const { subjectId } = useParams({ from: '/administration/academic/subjects/$subjectId' }) as { subjectId: string };

  const { data: subject, isLoading, error } = useQuery({
    queryKey: ['subject', subjectId],
    queryFn: () => getSubject(subjectId),
  });

  const { data: dept } = useQuery({
    queryKey: ['department', subject?.department_id],
    queryFn: () => getDepartment(subject.department_id),
    enabled: !!subject?.department_id,
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => getClasses({ page_size: 100 }),
  });
  const classes = classesData?.items || [];

  const classSubjectsQueries = useQueries({
    queries: classes.map((c: any) => ({
      queryKey: ['class-subjects', c.id],
      queryFn: () => getClassSubjects(c.id),
      enabled: !!c.id,
    })),
  });

  const assignedClasses = classes.filter((c: any, index: number) => {
    const queryResult = classSubjectsQueries[index];
    return queryResult?.data?.some((mapping: any) => mapping.subject_id === subjectId) ?? false;
  });

  const { data: assignmentsData } = useQuery({
    queryKey: ['teacher-assignments'],
    queryFn: () => getTeacherAssignments({ page_size: 100 }),
  });
  const assignments = assignmentsData?.items || [];

  const { data: usersData } = useQuery({
    queryKey: ['users-lookup'],
    queryFn: () => getUsers({ page_size: 100, persona_type: 'teacher' }),
  });
  const teachers = usersData?.users || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 animate-pulse">
        <div className="h-8 w-8 text-brand-500 animate-spin rounded-full border-4 border-t-transparent border-brand-200" />
        <span>Loading subject details...</span>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="font-semibold text-slate-500">Subject not found</p>
        <Link to="/administration/academic/subjects" className="text-brand-600 hover:underline text-sm mt-2 block">
          Back to list
        </Link>
      </div>
    );
  }

  // Filter teachers assigned to this subject
  const subjectTeachers = assignments.filter((a: any) => a.subject_id === subjectId);

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link
          to="/administration/academic/subjects"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Subjects
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="flex justify-between items-start border-b border-slate-100 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800">{subject.name}</h2>
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-semibold">
                {subject.code}
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
            subject.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {subject.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Relationship Summary Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          {/* Assigned Classes Panel */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-inner">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <LayoutGrid className="h-4 w-4" />
              Assigned Classes ({assignedClasses.length})
            </h4>
            {assignedClasses.length === 0 ? (
              <span className="text-xs text-slate-400 italic">Not mapped to any classes.</span>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {assignedClasses.map((c: any) => (
                  <div key={c.id} className="text-xs text-slate-700 font-semibold">
                    <Link
                      to="/administration/academic/classes/$classId"
                      params={{ classId: c.id } as any}
                      className="text-brand-600 hover:underline"
                    >
                      {c.name} ({c.code})
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assigned Teachers List */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-inner">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              Assigned Teachers ({subjectTeachers.length})
            </h4>
            {subjectTeachers.length === 0 ? (
              <span className="text-xs text-slate-400 italic">No teacher assigned to teach this subject.</span>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {subjectTeachers.map((a: any) => {
                  const tObj = teachers.find((u: any) => u.id === a.teacher_id);
                  const tName = tObj?.full_name || tObj?.email || 'Teacher';
                  return (
                    <div key={a.id} className="text-xs text-slate-700 font-semibold flex justify-between">
                      <span>{tName}</span>
                      {a.is_primary && (
                        <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1 border border-amber-100 rounded">
                          Lead
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Department Link */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-inner">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              Faculty Division
            </h4>
            {dept ? (
              <Link
                to="/administration/academic/departments/$deptId"
                params={{ deptId: dept.id } as any}
                className="text-sm font-bold text-brand-600 hover:underline"
              >
                {dept.name} ({dept.code})
              </Link>
            ) : (
              <span className="text-xs text-slate-400 italic">Subject is optional and not mapped to any department.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
