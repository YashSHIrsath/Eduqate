import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from '@tanstack/react-router';
import { getDepartment, updateDepartment } from '../api/academic';
import { DepartmentForm } from './DepartmentForm';
import type { DepartmentFormValues } from './DepartmentForm';
import { ArrowLeft, Loader2 } from 'lucide-react';

export const DepartmentEdit: React.FC = () => {
  const { deptId } = useParams({ from: '/administration/academic/departments/$deptId/edit' }) as { deptId: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: dept, isLoading } = useQuery({
    queryKey: ['department', deptId],
    queryFn: () => getDepartment(deptId),
  });

  const mutation = useMutation({
    mutationFn: (values: DepartmentFormValues) => updateDepartment(deptId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['department', deptId] });
      navigate({ to: '/administration/academic/departments/$deptId', params: { deptId } as any });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to update department.');
    },
  });

  const onSubmit = (values: DepartmentFormValues) => {
    mutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        <span>Loading department data...</span>
      </div>
    );
  }

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
        <h2 className="text-xl font-bold text-slate-800">Edit Department</h2>
        <p className="text-slate-500 text-sm">Update department information, codes, or descriptions.</p>
      </div>

      {dept && (
        <DepartmentForm
          initialData={dept}
          onSubmit={onSubmit}
          isPending={mutation.isPending}
          errorMsg={errorMsg}
          submitLabel="Save Changes"
        />
      )}
    </div>
  );
};
