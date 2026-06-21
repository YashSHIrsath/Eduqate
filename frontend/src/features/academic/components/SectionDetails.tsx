import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { getSection, getClass, getTeacherAssignments, getClassSubjects, getSubjects } from '../api/academic';
import { getUsers } from '../../users/api/users';
import { ArrowLeft, Layers, LayoutGrid, Users, BookOpen, Link2 } from 'lucide-react';

export const SectionDetails: React.FC = () => {
  const { sectionId } = useParams({ from: '/administration/academic/sections/$sectionId' }) as { sectionId: string };

  const { data: section, isLoading, error } = useQuery({
    queryKey: ['section', sectionId],
    queryFn: () => getSection(sectionId),
  });

  const { data: cls } = useQuery({
    queryKey: ['class', section?.class_id],
    queryFn: () => getClass(section.class_id),
    enabled: !!section?.class_id,
  });

  const { data: assignmentsData } = useQuery({
    queryKey: ['teacher-assignments'],
    queryFn: () => getTeacherAssignments(),
  });

  const { data: classSubjects = [] } = useQuery({
    queryKey: ['class-subjects', section?.class_id],
    queryFn: () => getClassSubjects(section.class_id),
    enabled: !!section?.class_id,
  });

  const { data: allSubjectsData } = useQuery({
    queryKey: ['subjects-lookup'],
    queryFn: () => getSubjects({ page_size: 100 }),
  });
  const allSubjects = allSubjectsData?.items || [];

  const { data: usersData } = useQuery({
    queryKey: ['users-lookup'],
    queryFn: () => getUsers({ page_size: 100, persona_type: 'teacher' }),
  });
  const teachers = usersData?.users || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 animate-pulse">
        <div className="h-8 w-8 text-brand-500 animate-spin rounded-full border-4 border-t-transparent border-brand-200" />
        <span>Loading section details...</span>
      </div>
    );
  }

  if (error || !section) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="font-semibold text-slate-500">Section not found</p>
        <Link to="/administration/academic/sections" className="text-brand-600 hover:underline text-sm mt-2 block">
          Back to list
        </Link>
      </div>
    );
  }

  // Filter assignments for this section
  const sectionAssignments = (assignmentsData?.items || []).filter(
    (a: any) => a.section_id === sectionId
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link
          to="/administration/academic/sections"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sections
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="flex justify-between items-start border-b border-slate-100 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800">{section.name}</h2>
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-semibold">
                {section.code}
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              Cohorts Capacity: {section.capacity ? `${section.capacity} Seats Max` : 'No Capacity Boundary'}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            section.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {section.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Relationship Summary Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          {/* Class Link */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-inner">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <LayoutGrid className="h-4 w-4" />
              Parent Class
            </h4>
            {cls ? (
              <Link
                to="/administration/academic/classes/$classId"
                params={{ classId: cls.id } as any}
                className="text-sm font-bold text-brand-600 hover:underline"
              >
                {cls.name} ({cls.code})
              </Link>
            ) : (
              <span className="text-xs text-slate-400 italic">No parent class mapped.</span>
            )}
          </div>

          {/* Assigned Teachers List */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-inner">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              Assigned Teachers ({sectionAssignments.length})
            </h4>
            {sectionAssignments.length === 0 ? (
              <span className="text-xs text-slate-400 italic">No teachers assigned.</span>
            ) : (
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {sectionAssignments.map((a: any) => {
                  const tObj = teachers.find((u: any) => u.id === a.teacher_id);
                  const tName = tObj?.full_name || tObj?.email || 'Teacher';
                  return (
                    <div key={a.id} className="text-xs text-slate-700 font-semibold flex justify-between">
                      <span>{tName}</span>
                      {a.is_primary && <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1 border border-amber-100 rounded">Lead</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mapped Class Subjects */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-inner">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              Cohort Subjects ({classSubjects.length})
            </h4>
            {classSubjects.length === 0 ? (
              <span className="text-xs text-slate-400 italic">No class subjects mapped.</span>
            ) : (
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {classSubjects.map((cs: any) => {
                  const sObj = allSubjects.find((s: any) => s.id === cs.subject_id);
                  return (
                    <div key={cs.id} className="text-xs text-slate-700 font-medium">
                      {sObj?.name || 'Class Subject'}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
