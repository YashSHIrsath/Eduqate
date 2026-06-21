import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import { getTeacherAssignments, deleteTeacherAssignment, getSections, getSubjects, getAcademicYears } from '../api/academic';
import { getUsers } from '../../users/api/users';
import { DataTable } from '../../../components/ui/data-table';
import type { Column } from '../../../components/ui/data-table';
import { useAuth } from '../../auth';
import { Plus, Eye, Edit, Trash2, Users, Star } from 'lucide-react';

interface AssignmentRow {
  id: string;
  teacher_id: string;
  section_id: string;
  subject_id: string;
  academic_year_id: string;
  is_primary: boolean;
  status: string;
}

export const TeacherAssignmentList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Lookups
  const { data: usersData } = useQuery({
    queryKey: ['users-lookup'],
    queryFn: () => getUsers({ page_size: 100, persona_type: 'teacher' }),
  });
  const teachers = usersData?.users || [];

  const { data: sectionsData } = useQuery({
    queryKey: ['sections-lookup'],
    queryFn: () => getSections({ page_size: 100 }),
  });
  const sections = sectionsData?.items || [];

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects-lookup'],
    queryFn: () => getSubjects({ page_size: 100 }),
  });
  const subjects = subjectsData?.items || [];

  const { data: yearsData } = useQuery({
    queryKey: ['years-lookup'],
    queryFn: () => getAcademicYears({ page_size: 100 }),
  });
  const years = yearsData?.items || [];

  const { data, isLoading } = useQuery({
    queryKey: ['teacher-assignments', page, pageSize, sortBy, sortOrder],
    queryFn: () =>
      getTeacherAssignments({
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTeacherAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the assignment for "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const columns: Column<AssignmentRow>[] = [
    {
      key: 'teacher_id',
      label: 'Teacher',
      render: (row) => {
        const teacher = teachers.find((u: any) => u.id === row.teacher_id);
        const displayName = teacher?.full_name || teacher?.email || 'Loading teacher...';
        return (
          <div className="flex items-center gap-2.5">
            <Users className="h-4.5 w-4.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-800">{displayName}</span>
          </div>
        );
      },
    },
    {
      key: 'subject_id',
      label: 'Subject',
      render: (row) => {
        const subject = subjects.find((s: any) => s.id === row.subject_id);
        return <span>{subject?.name || 'Loading subject...'}</span>;
      },
    },
    {
      key: 'section_id',
      label: 'Section',
      render: (row) => {
        const section = sections.find((s: any) => s.id === row.section_id);
        return <span>{section?.name || 'Loading section...'}</span>;
      },
    },
    {
      key: 'academic_year_id',
      label: 'Academic Year',
      render: (row) => {
        const year = years.find((y: any) => y.id === row.academic_year_id);
        return <span>{year?.name || 'Loading year...'}</span>;
      },
    },
    {
      key: 'is_primary',
      label: 'Primary Badge',
      render: (row) =>
        row.is_primary ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
            Primary Lead
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic">Co-Teacher</span>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => {
        const teacher = teachers.find((u: any) => u.id === row.teacher_id);
        const name = teacher?.full_name || 'Assignment';
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate({ to: '/administration/academic/teachers/assignments/$assignmentId', params: { assignmentId: row.id } as any })}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>

            {hasPermission('teacher_assignments:update') && (
              <button
                onClick={() => navigate({ to: '/administration/academic/teachers/assignments/$assignmentId/edit', params: { assignmentId: row.id } as any })}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-brand-600 hover:bg-brand-50 transition-all cursor-pointer flex items-center justify-center"
                title="Edit Assignment"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}

            {hasPermission('teacher_assignments:delete') && (
              <button
                onClick={() => handleDelete(row.id, name)}
                disabled={deleteMutation.isPending}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-red-600 hover:bg-red-50 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
                title="Delete Assignment"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Teacher Assignments</h2>
          <p className="text-slate-500 text-sm">Assign teachers and workloads to specific subjects and sections.</p>
        </div>
        {hasPermission('teacher_assignments:create') && (
          <Link
            to="/administration/academic/teachers/assignments/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white gradient-brand shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all text-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Assignment
          </Link>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.items || []}
        total={data?.total || 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(field, order) => {
          setSortBy(field);
          setSortOrder(order);
        }}
        isLoading={isLoading}
      />
    </div>
  );
};
