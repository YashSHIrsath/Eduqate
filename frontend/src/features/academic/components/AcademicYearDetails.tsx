import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { getAcademicYear, getAcademicTerms, getClasses, getSections } from '../api/academic';
import { ArrowLeft, Calendar, LayoutGrid, Layers, Users, Star } from 'lucide-react';

export const AcademicYearDetails: React.FC = () => {
  const { yearId } = useParams({ from: '/administration/academic/years/$yearId' }) as { yearId: string };

  const { data: year, isLoading, error } = useQuery({
    queryKey: ['academic-year', yearId],
    queryFn: () => getAcademicYear(yearId),
  });

  const { data: termsData } = useQuery({
    queryKey: ['academic-terms', { academic_year_id: yearId }],
    queryFn: () => getAcademicTerms({ academic_year_id: yearId }),
    enabled: !!yearId,
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => getClasses(),
  });

  const { data: sectionsData } = useQuery({
    queryKey: ['sections'],
    queryFn: () => getSections(),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 animate-pulse">
        <div className="h-8 w-8 text-brand-500 animate-spin rounded-full border-4 border-t-transparent border-brand-200" />
        <span>Loading academic year details...</span>
      </div>
    );
  }

  if (error || !year) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="font-semibold text-slate-500">Academic year not found</p>
        <Link to="/administration/academic/years" className="text-brand-600 hover:underline text-sm mt-2 block">
          Back to list
        </Link>
      </div>
    );
  }

  const termsCount = termsData?.total || 0;
  const classesCount = classesData?.total || 0;
  const sectionsCount = sectionsData?.total || 0;
  const studentsCount = '—'; // Placeholder until enrollment is implemented

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link
          to="/administration/academic/years"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Academic Years
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="flex justify-between items-start border-b border-slate-100 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800">{year.name}</h2>
              {year.is_current && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  Active Year
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm">
              Academic calendar cycle duration: {year.start_date} to {year.end_date}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            year.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {year.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Relationship Summary Panels */}
        <div className="pt-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Cycle Relationship Matrix
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-inner flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-800">{termsCount}</span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Academic Terms</span>
              </div>
            </div>

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
                <Layers className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-800">{sectionsCount}</span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Cohorts</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-inner flex items-center gap-4 opacity-75">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                <Users className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-800">{studentsCount}</span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Students (Est.)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
