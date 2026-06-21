import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { getDepartment, getClasses, getSubjects } from '../api/academic';
import { ArrowLeft, Building2, LayoutGrid, BookOpen } from 'lucide-react';

export const DepartmentDetails: React.FC = () => {
  const { deptId } = useParams({ from: '/administration/academic/departments/$deptId' }) as { deptId: string };

  const { data: dept, isLoading, error } = useQuery({
    queryKey: ['department', deptId],
    queryFn: () => getDepartment(deptId),
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes', { department_id: deptId }],
    queryFn: () => getClasses({ department_id: deptId }),
    enabled: !!deptId,
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects', { department_id: deptId }],
    queryFn: () => getSubjects({ department_id: deptId }),
    enabled: !!deptId,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 animate-pulse">
        <div className="h-8 w-8 text-brand-500 animate-spin rounded-full border-4 border-t-transparent border-brand-200" />
        <span>Loading department details...</span>
      </div>
    );
  }

  if (error || !dept) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="font-semibold text-slate-500">Department not found</p>
        <Link to="/administration/academic/departments" className="text-brand-600 hover:underline text-sm mt-2 block">
          Back to list
        </Link>
      </div>
    );
  }

  const classesCount = classesData?.total || 0;
  const subjectsCount = subjectsData?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link
          to="/administration/academic/departments"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Departments
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="flex justify-between items-start border-b border-slate-100 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800">{dept.name}</h2>
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500">
                {dept.code}
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              {dept.description || 'No description provided.'}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            dept.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {dept.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Relationship Summary Panels */}
        <div className="pt-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Department Linkages
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-inner flex items-center gap-4">
              <div className="p-3 bg-violet-100 text-violet-600 rounded-xl">
                <LayoutGrid className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-800">{classesCount}</span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Classes Mapped</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-inner flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-800">{subjectsCount}</span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subjects Taught</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
