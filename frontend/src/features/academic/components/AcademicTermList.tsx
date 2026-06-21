import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import { getAcademicTerms, deleteAcademicTerm, getAcademicYears } from '../api/academic';
import { DataTable } from '../../../components/ui/data-table';
import type { Column } from '../../../components/ui/data-table';
import { useAuth } from '../../auth';
import { Plus, Eye, Edit, Trash2, CalendarRange, ListFilter } from 'lucide-react';

interface AcademicTermRow {
  id: string;
  academic_year_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  status: string;
}

export const AcademicTermList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [yearFilter, setYearFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: yearsData } = useQuery({
    queryKey: ['academic-years-lookup'],
    queryFn: () => getAcademicYears({ page_size: 100 }),
  });
  const years = yearsData?.items || [];

  const { data, isLoading } = useQuery({
    queryKey: ['academic-terms', page, pageSize, yearFilter, sortBy, sortOrder],
    queryFn: () =>
      getAcademicTerms({
        page,
        page_size: pageSize,
        academic_year_id: yearFilter || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAcademicTerm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-terms'] });
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the academic term "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const columns: Column<AcademicTermRow>[] = [
    {
      key: 'name',
      label: 'Term Name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <CalendarRange className="h-4.5 w-4.5 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-800">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'academic_year_id',
      label: 'Academic Year',
      render: (row) => {
        const yearObj = years.find((y: any) => y.id === row.academic_year_id);
        return <span>{yearObj?.name || 'Loading year details...'}</span>;
      },
    },
    {
      key: 'timeline',
      label: 'Timeline',
      render: (row) => (
        <span className="text-xs text-slate-500 font-medium">
          {row.start_date} to {row.end_date}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Active Status',
      render: (row) =>
        row.is_active ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active Current
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic">Term Inactive</span>
        ),
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
            onClick={() => navigate({ to: '/administration/academic/terms/$termId', params: { termId: row.id } as any })}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>

          {hasPermission('academic_terms:update') && (
            <button
              onClick={() => navigate({ to: '/administration/academic/terms/$termId/edit', params: { termId: row.id } as any })}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-brand-600 hover:bg-brand-50 transition-all cursor-pointer flex items-center justify-center"
              title="Edit Term"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}

          {hasPermission('academic_terms:delete') && (
            <button
              onClick={() => handleDelete(row.id, row.name)}
              disabled={deleteMutation.isPending}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-red-600 hover:bg-red-50 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
              title="Delete Term"
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
          <h2 className="text-2xl font-bold text-slate-800">Academic Terms</h2>
          <p className="text-slate-500 text-sm">Organize academic periods (semesters, quarters, terms) inside years.</p>
        </div>
        {hasPermission('academic_terms:create') && (
          <Link
            to="/administration/academic/terms/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white gradient-brand shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all text-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Academic Term
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
        filterComponent={
          <div className="flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-200 text-sm px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all cursor-pointer font-medium"
            >
              <option value="">Filter Academic Year...</option>
              {years.map((y: any) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>
        }
      />
    </div>
  );
};
