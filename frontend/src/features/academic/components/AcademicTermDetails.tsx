import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { getAcademicTerm, getAcademicYear } from '../api/academic';
import { ArrowLeft, CalendarRange, Star, Link2 } from 'lucide-react';

export const AcademicTermDetails: React.FC = () => {
  const { termId } = useParams({ from: '/administration/academic/terms/$termId' }) as { termId: string };

  const { data: term, isLoading, error } = useQuery({
    queryKey: ['academic-term', termId],
    queryFn: () => getAcademicTerm(termId),
  });

  const { data: year } = useQuery({
    queryKey: ['academic-year', term?.academic_year_id],
    queryFn: () => getAcademicYear(term.academic_year_id),
    enabled: !!term?.academic_year_id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 animate-pulse">
        <div className="h-8 w-8 text-brand-500 animate-spin rounded-full border-4 border-t-transparent border-brand-200" />
        <span>Loading academic term details...</span>
      </div>
    );
  }

  if (error || !term) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="font-semibold text-slate-500">Academic term not found</p>
        <Link to="/administration/academic/terms" className="text-brand-600 hover:underline text-sm mt-2 block">
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link
          to="/administration/academic/terms"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Academic Terms
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="flex justify-between items-start border-b border-slate-100 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800">{term.name}</h2>
              {term.is_active && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Period
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm flex items-center gap-1">
              <CalendarRange className="h-4 w-4 text-slate-400" />
              Timeline: {term.start_date} to {term.end_date}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            term.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {term.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Relationship Summary Panel */}
        <div className="pt-8 space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Term Relationship Matrix
          </h3>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-inner">
            <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-1.5">
              <Link2 className="h-4 w-4 text-brand-600" />
              Parent Academic Cycle
            </h4>
            {year ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-medium">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400">Cycle Name</span>
                  <Link
                    to="/administration/academic/years/$yearId"
                    params={{ yearId: year.id } as any}
                    className="text-brand-600 hover:underline"
                  >
                    {year.name}
                  </Link>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400">Cycle Boundary</span>
                  <span className="text-slate-700">{year.start_date} to {year.end_date}</span>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic">No parent year details found.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
