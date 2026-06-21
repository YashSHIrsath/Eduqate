import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from '@tanstack/react-router';
import { getSection, updateSection, getClasses } from '../api/academic';
import { SectionForm } from './SectionForm';
import type { SectionFormValues } from './SectionForm';
import { ArrowLeft, Loader2 } from 'lucide-react';

export const SectionEdit: React.FC = () => {
  const { sectionId } = useParams({ from: '/administration/academic/sections/$sectionId/edit' }) as { sectionId: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: section, isLoading: sectionLoading } = useQuery({
    queryKey: ['section', sectionId],
    queryFn: () => getSection(sectionId),
  });

  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['classes-lookup'],
    queryFn: () => getClasses({ page_size: 100 }),
  });
  const classes = classesData?.items || [];

  const mutation = useMutation({
    mutationFn: (values: SectionFormValues) => updateSection(sectionId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      queryClient.invalidateQueries({ queryKey: ['section', sectionId] });
      navigate({ to: '/administration/academic/sections/$sectionId', params: { sectionId } as any });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to update section.');
    },
  });

  const onSubmit = (values: SectionFormValues) => {
    mutation.mutate(values);
  };

  if (sectionLoading || classesLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        <span>Loading section data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center">
        <Link
          to="/administration/academic/sections"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sections
        </Link>
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-800">Edit Section</h2>
        <p className="text-slate-500 text-sm">Update section names, codes, capacity boundaries, or statuses.</p>
      </div>

      {section && (
        <SectionForm
          classes={classes}
          initialData={section}
          onSubmit={onSubmit}
          isPending={mutation.isPending}
          errorMsg={errorMsg}
          submitLabel="Save Changes"
        />
      )}
    </div>
  );
};
