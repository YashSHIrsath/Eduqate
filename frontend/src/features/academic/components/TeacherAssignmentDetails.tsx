import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { getTeacherAssignment, getSection, getSubject, getAcademicYear } from '../api/academic';
import { getUsers } from '../../users/api/users';
import { ArrowLeft, UserCheck, Layers, BookOpen, Calendar, Star } from 'lucide-react';

export const TeacherAssignmentDetails: React.FC = () => {
  const { assignmentId } = useParams({ from: '/administration/academic/teachers/assignments/$assignmentId' }) as { assignmentId: string };

  const { data: assignment, isLoading, error } = useQuery({
    queryKey: ['teacher-assignment', assignmentId],
    queryFn: () => getTeacherAssignment(assignmentId),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-lookup'],
    queryFn: () => getUsers({ page_size: 100, persona_type: 'teacher' }),
  });
  const teachers = usersData?.users || [];
  const teacher = teachers.find((u: any) => u.id === assignment?.teacher_id);

  const { data: section } = useQuery({
    queryKey: ['section', assignment?.section_id],
    queryFn: () => getSection(assignment.section_id),
    enabled: !!assignment?.section_id,
  });

  const { data: subject } = useQuery({
    queryKey: ['subject', assignment?.subject_id],
    queryFn: () => getSubject(assignment.subject_id),
    enabled: !!assignment?.subject_id,
  });

  const { data: year } = useQuery({
    queryKey: ['academic-year', assignment?.academic_year_id],
    queryFn: () => getAcademicYear(assignment.academic_year_id),
    enabled: !!assignment?.academic_year_id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 animate-pulse">
        <div className="h-8 w-8 text-brand-500 animate-spin rounded-full border-4 border-t-transparent border-brand-200" />
        <span>Loading assignment details...</span>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="font-semibold text-slate-500">Teacher assignment not found</p>
        <Link to="/administration/academic/teachers/assignments" className="text-brand-600 hover:underline text-sm mt-2 block">
          Back to list
        </Link>
      </div>
    );
  }

  const teacherName = teacher?.full_name || teacher?.email || 'Teacher';

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link
          to="/administration/academic/teachers/assignments"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Teacher Assignments
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="flex justify-between items-start border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-3">
              {teacher ? (
                <Link
                  to="/administration/users/$userId"
                  params={{ userId: teacher.id } as any}
                  className="text-2xl font-bold text-slate-800 hover:text-brand-600 hover:underline transition-colors"
                >
                  {teacherName}
                </Link>
              ) : (
                <h2 className="text-2xl font-bold text-slate-800">{teacherName}</h2>
              )}
              {assignment.is_primary && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  Lead Primary Teacher
                </span>
              )}
            </div>
            {teacher?.email && <p className="text-slate-500 text-sm mt-1">Email: {teacher.email}</p>}
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            assignment.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {assignment.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Relationship Summary Panels */}
        <div className="pt-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Assignment Linkages
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Subject */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-inner flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subject</span>
                {subject ? (
                  <Link
                    to="/administration/academic/subjects/$subjectId"
                    params={{ subjectId: subject.id } as any}
                    className="text-sm font-bold text-brand-600 hover:underline mt-0.5"
                  >
                    {subject.name}
                  </Link>
                ) : (
                  <span className="text-sm font-bold text-slate-700 mt-0.5">Loading...</span>
                )}
              </div>
            </div>

            {/* Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-inner flex items-center gap-4">
              <div className="p-3 bg-violet-100 text-violet-600 rounded-xl">
                <Layers className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Class Section</span>
                {section ? (
                  <Link
                    to="/administration/academic/sections/$sectionId"
                    params={{ sectionId: section.id } as any}
                    className="text-sm font-bold text-brand-600 hover:underline mt-0.5"
                  >
                    {section.name}
                  </Link>
                ) : (
                  <span className="text-sm font-bold text-slate-700 mt-0.5">Loading...</span>
                )}
              </div>
            </div>

            {/* Academic Year */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-inner flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Academic Year</span>
                {year ? (
                  <Link
                    to="/administration/academic/years/$yearId"
                    params={{ yearId: year.id } as any}
                    className="text-sm font-bold text-brand-600 hover:underline mt-0.5"
                  >
                    {year.name}
                  </Link>
                ) : (
                  <span className="text-sm font-bold text-slate-700 mt-0.5">Loading...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
