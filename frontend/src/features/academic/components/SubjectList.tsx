import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import { getSubjects, deleteSubject, getDepartments } from '../api/academic';
import { DataTable } from '../../../components/ui/data-table';
import type { Column } from '../../../components/ui/data-table';
import { useAuth } from '../../auth';
import { Plus, Eye, Edit, Trash2, BookOpen, ListFilter } from 'lucide-react';

interface SubjectRow {
  id: string;
  name: string;
  code: string;
  department_id?: string;
  status: string;
}

export const SubjectList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: deptsData } = useQuery({
    queryKey: ['departments-lookup'],
    queryFn: () => getDepartments({ page_size: 100 }),
  });
  const departments = deptsData?.items || [];

  const { data, isLoading } = useQuery({
    queryKey: ['subjects', page, pageSize, search, deptFilter, sortBy, sortOrder],
    queryFn: () =>
      getSubjects({
        page,
        page_size: pageSize,
        search: search || undefined,
        department_id: deptFilter || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the subject "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const columns: Column<SubjectRow>[] = [
    {
      key: 'name',
      label: 'Subject Name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <BookOpen className="h-4.5 w-4.5 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-800">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      render: (row) => <span className="font-mono text-xs">{row.code}</span>,
    },
    {
      key: 'department_id',
      label: 'Department',
      render: (row) => {
        if (!row.department_id) return <span className="text-xs text-slate-400 italic">None</span>;
        const dept = departments.find((d: any) => d.id === row.department_id);
        return <span>{dept?.name || 'Loading department...'}</span>;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          row.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${row.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {row.status === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate({ to: '/administration/academic/subjects/$subjectId', params: { subjectId: row.id } as any })}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>

          {hasPermission('subjects:update') && (
            <button
              onClick={() => navigate({ to: '/administration/academic/subjects/$subjectId/edit', params: { subjectId: row.id } as any })}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-brand-600 hover:bg-brand-50 transition-all cursor-pointer flex items-center justify-center"
              title="Edit Subject"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}

          {hasPermission('subjects:delete') && (
            <button
              onClick={() => handleDelete(row.id, row.name)}
              disabled={deleteMutation.isPending}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-red-600 hover:bg-red-50 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
              title="Delete Subject"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Subjects</h2>
          <p className="text-slate-500 text-sm">Define and catalog core academic syllabus subjects.</p>
        </div>
        {hasPermission('subjects:create') && (
          <Link
            to="/administration/academic/subjects/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white gradient-brand shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all text-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Subject
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
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search subjects by name or code..."
        isLoading={isLoading}
        filterComponent={
          <div className="flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-200 text-sm px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all cursor-pointer font-medium text-slate-700"
            >
              <option value="">Filter Department...</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        }
      />
    </div>
  );
};
