import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import { getAcademicYears, deleteAcademicYear, updateAcademicYear } from '../api/academic';
import { DataTable } from '../../../components/ui/data-table';
import type { Column } from '../../../components/ui/data-table';
import { useAuth } from '../../auth';
import { Plus, Eye, Edit, Trash2, Calendar, Star, StarOff, Loader2 } from 'lucide-react';

interface AcademicYearRow {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status: string;
}

export const AcademicYearList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading } = useQuery({
    queryKey: ['academic-years', page, pageSize, statusFilter, sortBy, sortOrder],
    queryFn: () =>
      getAcademicYears({
        page,
        page_size: pageSize,
        status: statusFilter || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAcademicYear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
    },
  });

  const setCurrentMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateAcademicYear(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the academic year "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleSetCurrent = (id: string) => {
    setCurrentMutation.mutate({ id, payload: { is_current: true } });
  };

  const columns: Column<AcademicYearRow>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Calendar className="h-4.5 w-4.5 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-800">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'start_date',
      label: 'Start Date',
      sortable: true,
    },
    {
      key: 'end_date',
      label: 'End Date',
      sortable: true,
    },
    {
      key: 'is_current',
      label: 'Current Year',
      render: (row) =>
        row.is_current ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
            Current Active
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic">Ordinary Year</span>
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
            onClick={() => navigate({ to: '/administration/academic/years/$yearId', params: { yearId: row.id } as any })}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>

          {hasPermission('academic_years:update') && (
            <button
              onClick={() => navigate({ to: '/administration/academic/years/$yearId/edit', params: { yearId: row.id } as any })}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-brand-600 hover:bg-brand-50 transition-all cursor-pointer flex items-center justify-center"
              title="Edit Year"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}

          {hasPermission('academic_years:update') && !row.is_current && (
            <button
              onClick={() => handleSetCurrent(row.id)}
              disabled={setCurrentMutation.isPending}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-amber-600 hover:bg-amber-50 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
              title="Set as Current Active"
            >
              <StarOff className="h-4 w-4" />
            </button>
          )}

          {hasPermission('academic_years:delete') && (
            <button
              onClick={() => handleDelete(row.id, row.name)}
              disabled={deleteMutation.isPending}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-red-600 hover:bg-red-50 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
              title="Delete Year"
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
          <h2 className="text-2xl font-bold text-slate-800">Academic Years</h2>
          <p className="text-slate-500 text-sm">Define calendar cycles and manage the primary active year.</p>
        </div>
        {hasPermission('academic_years:create') && (
          <Link
            to="/administration/academic/years/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white gradient-brand shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all text-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Academic Year
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
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-slate-200 text-sm px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        }
      />
    </div>
  );
};
