import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from '@tanstack/react-router';
import { getAcademicYear, updateAcademicYear } from '../api/academic';
import { AcademicYearForm } from './AcademicYearForm';
import type { AcademicYearFormValues } from './AcademicYearForm';
import { ArrowLeft, Loader2 } from 'lucide-react';

export const AcademicYearEdit: React.FC = () => {
  const { yearId } = useParams({ from: '/administration/academic/years/$yearId/edit' }) as { yearId: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: year, isLoading } = useQuery({
    queryKey: ['academic-year', yearId],
    queryFn: () => getAcademicYear(yearId),
  });

  const mutation = useMutation({
    mutationFn: (values: AcademicYearFormValues) => updateAcademicYear(yearId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      queryClient.invalidateQueries({ queryKey: ['academic-year', yearId] });
      navigate({ to: '/administration/academic/years/$yearId', params: { yearId } as any });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to update academic year.');
    },
  });

  const onSubmit = (values: AcademicYearFormValues) => {
    mutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        <span>Loading academic year data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center">
        <Link
          to="/administration/academic/years"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Academic Years
        </Link>
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-800">Edit Academic Year</h2>
        <p className="text-slate-500 text-sm">Update the name, dates, status, or current active setting.</p>
      </div>

      {year && (
        <AcademicYearForm
          initialData={year}
          onSubmit={onSubmit}
          isPending={mutation.isPending}
          errorMsg={errorMsg}
          submitLabel="Save Changes"
        />
      )}
    </div>
  );
};
