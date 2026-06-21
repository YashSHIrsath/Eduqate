import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import { createAcademicTerm, getAcademicYears } from '../api/academic';
import { AcademicTermForm } from './AcademicTermForm';
import type { AcademicTermFormValues } from './AcademicTermForm';
import { ArrowLeft, Loader2 } from 'lucide-react';

export const AcademicTermCreate: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: yearsData, isLoading: yearsLoading } = useQuery({
    queryKey: ['academic-years-lookup'],
    queryFn: () => getAcademicYears({ page_size: 100 }),
  });
  const years = yearsData?.items || [];

  const mutation = useMutation({
    mutationFn: createAcademicTerm,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['academic-terms'] });
      navigate({ to: '/administration/academic/terms/$termId', params: { termId: data.id } as any });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to create academic term.');
    },
  });

  const onSubmit = (values: AcademicTermFormValues) => {
    mutation.mutate(values);
  };

  if (yearsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        <span>Loading academic cycle choices...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center">
        <Link
          to="/administration/academic/terms"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Academic Terms
        </Link>
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-800">Create Academic Term</h2>
        <p className="text-slate-500 text-sm">Add a new academic term division (e.g., Term 1, Semester 1) to a cycle.</p>
      </div>

      <AcademicTermForm
        years={years}
        onSubmit={onSubmit}
        isPending={mutation.isPending}
        errorMsg={errorMsg}
        submitLabel="Create Academic Term"
      />
    </div>
  );
};
