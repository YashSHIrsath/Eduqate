import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import { createTeacherAssignment, getClasses, getSections, getSubjects, getAcademicYears } from '../api/academic';
import { getUsers } from '../../users/api/users';
import { TeacherAssignmentForm } from './TeacherAssignmentForm';
import type { TeacherAssignmentFormValues } from './TeacherAssignmentForm';
import { ArrowLeft, Loader2 } from 'lucide-react';

export const TeacherAssignmentCreate: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lookups
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users-lookup'],
    queryFn: () => getUsers({ page_size: 100, persona_type: 'teacher' }),
  });
  const teachers = usersData?.users || [];

  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['classes-lookup'],
    queryFn: () => getClasses({ page_size: 100 }),
  });
  const classes = classesData?.items || [];

  const { data: sectionsData, isLoading: sectionsLoading } = useQuery({
    queryKey: ['sections-lookup'],
    queryFn: () => getSections({ page_size: 100 }),
  });
  const sections = sectionsData?.items || [];

  const { data: subjectsData, isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects-lookup'],
    queryFn: () => getSubjects({ page_size: 100 }),
  });
  const subjects = subjectsData?.items || [];

  const { data: yearsData, isLoading: yearsLoading } = useQuery({
    queryKey: ['years-lookup'],
    queryFn: () => getAcademicYears({ page_size: 100 }),
  });
  const years = yearsData?.items || [];

  const mutation = useMutation({
    mutationFn: createTeacherAssignment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      navigate({ to: '/administration/academic/teachers/assignments/$assignmentId', params: { assignmentId: data.id } as any });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to create teacher assignment.');
    },
  });

  const onSubmit = (values: TeacherAssignmentFormValues) => {
    mutation.mutate(values);
  };

  const isLoading = usersLoading || classesLoading || sectionsLoading || subjectsLoading || yearsLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        <span>Loading list options for assignment...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center">
        <Link
          to="/administration/academic/teachers/assignments"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Teacher Assignments
        </Link>
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-800">Create Teacher Assignment</h2>
        <p className="text-slate-500 text-sm">Assign a teacher to a section cohort for a particular subject.</p>
      </div>

      <TeacherAssignmentForm
        teachers={teachers}
        classes={classes}
        sections={sections}
        subjects={subjects}
        years={years}
        initialData={{
          academic_year_id: years.find((y: any) => y.is_current)?.id || '',
        }}
        onSubmit={onSubmit}
        isPending={mutation.isPending}
        errorMsg={errorMsg}
        submitLabel="Confirm Assignment"
      />
    </div>
  );
};
