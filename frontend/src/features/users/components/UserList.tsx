import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { getUsers, getRolesList } from '../api/users';
import { DataTable } from '../../../components/ui/data-table';
import type { Column } from '../../../components/ui/data-table';
import { useAuth } from '../../auth';
import { UserPlus, Eye, Edit, AlertTriangle } from 'lucide-react';

interface UserRow {
  id: string;
  email: string;
  status: string;
  created_at: string;
  must_change_password: boolean;
}

export const UserList: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canCreateUsers = hasPermission('users:create');
  const canUpdateUsers = hasPermission('users:update');
  
  // Table search and pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch roles list for filters
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: getRolesList,
  });

  // Fetch paginated users
  const { data, isLoading } = useQuery({
    queryKey: ['users', page, pageSize, search, statusFilter, roleFilter, sortBy, sortOrder],
    queryFn: () =>
      getUsers({
        page,
        page_size: pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
        role_id: roleFilter || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  });

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
  };

  const columns: Column<UserRow>[] = [
    {
      key: 'email',
      label: 'Email Address',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">{row.email}</span>
          {row.must_change_password && (
            <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-100 rounded-md px-1.5 py-0.5 w-max">
              <AlertTriangle className="h-3 w-3" />
              Change Password Forced
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => {
        let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
        if (row.status === 'active') badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-100';
        if (row.status === 'inactive') badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
        if (row.status === 'suspended') badgeStyle = 'bg-red-50 text-red-700 border-red-100';
        
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle}`}>
            {row.status}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Created Date',
      sortable: true,
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate({ to: '/users/$userId', params: { userId: row.id } })}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {canUpdateUsers && (
            <button
              onClick={() => navigate({ to: '/users/$userId/edit', params: { userId: row.id } })}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Edit Profile"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const filterComponent = (
    <div className="flex gap-2">
      {/* Status Filter */}
      <select
        value={statusFilter}
        onChange={(e) => {
          setStatusFilter(e.target.value);
          setPage(1);
        }}
        className="bg-white border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
      >
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="suspended">Suspended</option>
      </select>

      {/* Role Filter */}
      <select
        value={roleFilter}
        onChange={(e) => {
          setRoleFilter(e.target.value);
          setPage(1);
        }}
        className="bg-white border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
      >
        <option value="">All Roles</option>
        {roles.map((role: any) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>

      {/* Create User Button */}
      {canCreateUsers && (
        <button
          onClick={() => navigate({ to: '/users/new' })}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white gradient-brand shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all text-xs cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          Create User
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
          <p className="text-slate-500 text-sm">Provision users, configure their roles, and manage credentials access.</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.users || []}
        total={data?.total || 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        isLoading={isLoading}
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search by user email..."
        filterComponent={filterComponent}
      />
    </div>
  );
};
