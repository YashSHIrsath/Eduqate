import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import { createAcademicYear } from '../api/academic';
import { AcademicYearForm } from './AcademicYearForm';
import type { AcademicYearFormValues } from './AcademicYearForm';
import { ArrowLeft } from 'lucide-react';

export const AcademicYearCreate: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createAcademicYear,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      navigate({ to: '/administration/academic/years/$yearId', params: { yearId: data.id } as any });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to create academic year.');
    },
  });

  const onSubmit = (values: AcademicYearFormValues) => {
    mutation.mutate(values);
  };

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
        <h2 className="text-xl font-bold text-slate-800">Create Academic Year</h2>
        <p className="text-slate-500 text-sm">Add a new active calendar term cycle to the organization.</p>
      </div>

      <AcademicYearForm
        onSubmit={onSubmit}
        isPending={mutation.isPending}
        errorMsg={errorMsg}
        submitLabel="Create Academic Year"
      />
    </div>
  );
};
