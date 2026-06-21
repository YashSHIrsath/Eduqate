import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import { createSubject, getDepartments } from '../api/academic';
import { SubjectForm } from './SubjectForm';
import type { SubjectFormValues } from './SubjectForm';
import { ArrowLeft, Loader2 } from 'lucide-react';

export const SubjectCreate: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: deptsData, isLoading: deptsLoading } = useQuery({
    queryKey: ['departments-lookup'],
    queryFn: () => getDepartments({ page_size: 100 }),
  });
  const departments = deptsData?.items || [];

  const mutation = useMutation({
    mutationFn: createSubject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      navigate({ to: '/administration/academic/subjects/$subjectId', params: { subjectId: data.id } as any });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to create subject.');
    },
  });

  const onSubmit = (values: SubjectFormValues) => {
    mutation.mutate(values);
  };

  if (deptsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        <span>Loading department options...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center">
        <Link
          to="/administration/academic/subjects"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Subjects
        </Link>
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-800">Create Subject</h2>
        <p className="text-slate-500 text-sm">Add a new subject to catalog class curriculum assignments.</p>
      </div>

      <SubjectForm
        departments={departments}
        onSubmit={onSubmit}
        isPending={mutation.isPending}
        errorMsg={errorMsg}
        submitLabel="Create Subject"
      />
    </div>
  );
};
