import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import { createDepartment } from '../api/academic';
import { DepartmentForm } from './DepartmentForm';
import type { DepartmentFormValues } from './DepartmentForm';
import { ArrowLeft } from 'lucide-react';

export const DepartmentCreate: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      navigate({ to: '/administration/academic/departments/$deptId', params: { deptId: data.id } as any });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to create department.');
    },
  });

  const onSubmit = (values: DepartmentFormValues) => {
    mutation.mutate(values);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center">
        <Link
          to="/administration/academic/departments"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Departments
        </Link>
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-800">Create Department</h2>
        <p className="text-slate-500 text-sm">Add a new faculty or division to catalog class courses.</p>
      </div>

      <DepartmentForm
        onSubmit={onSubmit}
        isPending={mutation.isPending}
        errorMsg={errorMsg}
        submitLabel="Create Department"
      />
    </div>
  );
};
