import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import { getSections, deleteSection, getClasses } from '../api/academic';
import { DataTable } from '../../../components/ui/data-table';
import type { Column } from '../../../components/ui/data-table';
import { useAuth } from '../../auth';
import { Plus, Eye, Edit, Trash2, Layers, ListFilter } from 'lucide-react';

interface SectionRow {
  id: string;
  class_id: string;
  name: string;
  code: string;
  capacity?: number;
  status: string;
}

export const SectionList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: classesData } = useQuery({
    queryKey: ['classes-lookup'],
    queryFn: () => getClasses({ page_size: 100 }),
  });
  const classes = classesData?.items || [];

  const { data, isLoading } = useQuery({
    queryKey: ['sections', page, pageSize, search, classFilter, sortBy, sortOrder],
    queryFn: () =>
      getSections({
        page,
        page_size: pageSize,
        search: search || undefined,
        class_id: classFilter || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the section "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const columns: Column<SectionRow>[] = [
    {
      key: 'name',
      label: 'Section Name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Layers className="h-4.5 w-4.5 text-slate-400 shrink-0" />
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
      key: 'class_id',
      label: 'Parent Class',
      render: (row) => {
        const clsObj = classes.find((c: any) => c.id === row.class_id);
        return <span>{clsObj?.name || 'Loading class details...'}</span>;
      },
    },
    {
      key: 'capacity',
      label: 'Max Capacity',
      sortable: true,
      render: (row) =>
        row.capacity ? (
          <span className="font-semibold text-slate-700">{row.capacity} seats</span>
        ) : (
          <span className="text-xs text-slate-400 italic">No limit</span>
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
            onClick={() => navigate({ to: '/administration/academic/sections/$sectionId', params: { sectionId: row.id } as any })}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>

          {hasPermission('sections:update') && (
            <button
              onClick={() => navigate({ to: '/administration/academic/sections/$sectionId/edit', params: { sectionId: row.id } as any })}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-brand-600 hover:bg-brand-50 transition-all cursor-pointer flex items-center justify-center"
              title="Edit Section"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}

          {hasPermission('sections:delete') && (
            <button
              onClick={() => handleDelete(row.id, row.name)}
              disabled={deleteMutation.isPending}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-red-600 hover:bg-red-50 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
              title="Delete Section"
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
          <h2 className="text-2xl font-bold text-slate-800">Sections</h2>
          <p className="text-slate-500 text-sm">Manage student group cohorts and cohort capacities.</p>
        </div>
        {hasPermission('sections:create') && (
          <Link
            to="/administration/academic/sections/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white gradient-brand shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all text-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Section
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
        searchPlaceholder="Search sections by name or code..."
        isLoading={isLoading}
        filterComponent={
          <div className="flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-200 text-sm px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all cursor-pointer font-medium text-slate-700"
            >
              <option value="">Filter Class...</option>
              {classes.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        }
      />
    </div>
  );
};
