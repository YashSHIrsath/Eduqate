import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from '@tanstack/react-router';
import { getTeacherAssignment, updateTeacherAssignment, getClasses, getSections, getSubjects, getAcademicYears } from '../api/academic';
import { getUsers } from '../../users/api/users';
import { TeacherAssignmentForm } from './TeacherAssignmentForm';
import type { TeacherAssignmentFormValues } from './TeacherAssignmentForm';
import { ArrowLeft, Loader2 } from 'lucide-react';

export const TeacherAssignmentEdit: React.FC = () => {
  const { assignmentId } = useParams({ from: '/administration/academic/teachers/assignments/$assignmentId/edit' }) as { assignmentId: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: assignment, isLoading: assignmentLoading } = useQuery({
    queryKey: ['teacher-assignment', assignmentId],
    queryFn: () => getTeacherAssignment(assignmentId),
  });

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
    mutationFn: (values: TeacherAssignmentFormValues) => updateTeacherAssignment(assignmentId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-assignment', assignmentId] });
      navigate({ to: '/administration/academic/teachers/assignments/$assignmentId', params: { assignmentId } as any });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to update teacher assignment.');
    },
  });

  const onSubmit = (values: TeacherAssignmentFormValues) => {
    mutation.mutate(values);
  };

  const isLoading = assignmentLoading || usersLoading || classesLoading || sectionsLoading || subjectsLoading || yearsLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        <span>Loading teacher assignment data...</span>
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
        <h2 className="text-xl font-bold text-slate-800">Edit Teacher Assignment</h2>
        <p className="text-slate-500 text-sm">Update the assigned teacher, class section, subject, academic year, or lead status.</p>
      </div>

      {assignment && (
        <TeacherAssignmentForm
          teachers={teachers}
          classes={classes}
          sections={sections}
          subjects={subjects}
          years={years}
          initialData={assignment}
          onSubmit={onSubmit}
          isPending={mutation.isPending}
          errorMsg={errorMsg}
          submitLabel="Save Changes"
        />
      )}
    </div>
  );
};
