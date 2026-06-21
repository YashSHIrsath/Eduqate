import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import { getDepartments, deleteDepartment } from '../api/academic';
import { DataTable } from '../../../components/ui/data-table';
import type { Column } from '../../../components/ui/data-table';
import { useAuth } from '../../auth';
import { Plus, Eye, Edit, Trash2, Building2 } from 'lucide-react';

interface DepartmentRow {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
}

export const DepartmentList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading } = useQuery({
    queryKey: ['departments', page, pageSize, search, statusFilter, sortBy, sortOrder],
    queryFn: () =>
      getDepartments({
        page,
        page_size: pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the department "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const columns: Column<DepartmentRow>[] = [
    {
      key: 'name',
      label: 'Department Name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Building2 className="h-4.5 w-4.5 text-slate-400 shrink-0" />
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
      key: 'description',
      label: 'Description',
      render: (row) => (
        <span className="text-slate-500 text-xs truncate max-w-xs block">
          {row.description || 'No description provided.'}
        </span>
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
            onClick={() => navigate({ to: '/administration/academic/departments/$deptId', params: { deptId: row.id } as any })}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>

          {hasPermission('departments:update') && (
            <button
              onClick={() => navigate({ to: '/administration/academic/departments/$deptId/edit', params: { deptId: row.id } as any })}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-brand-600 hover:bg-brand-50 transition-all cursor-pointer flex items-center justify-center"
              title="Edit Department"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}

          {hasPermission('departments:delete') && (
            <button
              onClick={() => handleDelete(row.id, row.name)}
              disabled={deleteMutation.isPending}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-red-600 hover:bg-red-50 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
              title="Delete Department"
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
          <h2 className="text-2xl font-bold text-slate-800">Departments</h2>
          <p className="text-slate-500 text-sm">Manage institutional departments and faculty divisions.</p>
        </div>
        {hasPermission('departments:create') && (
          <Link
            to="/administration/academic/departments/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white gradient-brand shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all text-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Department
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
        searchPlaceholder="Search departments by name or code..."
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
