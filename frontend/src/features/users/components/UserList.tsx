import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { getUsers, getRolesList, getUserSummary } from '../api/users';
import { DataTable } from '../../../components/ui/data-table';
import type { Column } from '../../../components/ui/data-table';
import { useAuth } from '../../auth';
import { UserPlus, Eye, Edit, AlertTriangle } from 'lucide-react';

interface UserRow {
  id: string;
  email: string;
  full_name?: string;
  persona_type: string;
  status: string;
  created_at: string;
  must_change_password: boolean;
  roles: { id: string; name: string; persona_type: string; is_system_role: boolean }[];
}

const getInitials = (name?: string, email?: string) => {
  if (!name) return email ? email.substring(0, 2).toUpperCase() : '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const UserList: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canCreateUsers = hasPermission('users:create');
  const canUpdateUsers = hasPermission('users:update');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [personaFilter, setPersonaFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: summary = { total: 0, super_admin: 0, headmaster: 0, teacher: 0, student: 0 } } = useQuery({
    queryKey: ['user-summary'],
    queryFn: getUserSummary,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: getRolesList,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, pageSize, search, statusFilter, personaFilter, roleFilter, sortBy, sortOrder],
    queryFn: () =>
      getUsers({
        page,
        page_size: pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
        persona_type: personaFilter || undefined,
        role_id: roleFilter || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  });

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
  };

  const handlePersonaSelect = (persona: string) => {
    setPersonaFilter(persona);
    setRoleFilter('');
    setPage(1);
  };

  const filteredRoles = (roles as any[]).filter(
    (role) => !personaFilter || role.persona_type === personaFilter
  );

  const columns: Column<UserRow>[] = [
    {
      key: 'full_name',
      label: 'Full Name',
      sortable: true,
      render: (row) => {
        const initials = getInitials(row.full_name, row.email);
        const displayName = row.full_name || 'No Name Set';
        return (
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 select-none border shadow-sm ${
              row.persona_type === 'super_admin' ? 'bg-violet-100/80 text-violet-700 border-violet-200' :
              row.persona_type === 'headmaster' ? 'bg-blue-100/80 text-blue-700 border-blue-200' :
              row.persona_type === 'teacher' ? 'bg-emerald-100/80 text-emerald-700 border-emerald-200' :
              'bg-amber-100/80 text-amber-700 border-amber-200'
            }`}>
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 text-sm truncate">{displayName}</span>
                {row.must_change_password && (
                  <span className="inline-flex items-center gap-1 text-[8px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 shrink-0">
                    <AlertTriangle className="h-2 w-2" />
                    RESET REQUIRED
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 truncate">{row.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'persona_type',
      label: 'Persona',
      sortable: true,
      render: (row) => {
        let badgeStyle = '';
        let label = '';
        if (row.persona_type === 'super_admin') {
          badgeStyle = 'bg-violet-50 text-violet-700 border-violet-200/60';
          label = 'Super Admin';
        } else if (row.persona_type === 'headmaster') {
          badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200/60';
          label = 'Headmaster';
        } else if (row.persona_type === 'teacher') {
          badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
          label = 'Teacher';
        } else {
          badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200/60';
          label = 'Student';
        }
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeStyle}`}>
            <span className={`h-1 w-1 rounded-full ${
              row.persona_type === 'super_admin' ? 'bg-violet-500' :
              row.persona_type === 'headmaster' ? 'bg-blue-500' :
              row.persona_type === 'teacher' ? 'bg-emerald-500' : 'bg-amber-500'
            }`} />
            {label}
          </span>
        );
      },
    },
    {
      key: 'roles',
      label: 'Assigned Roles',
      render: (row) => {
        if (!row.roles || row.roles.length === 0) {
          return <span className="text-xs text-slate-400 italic">No roles</span>;
        }
        const maxVisible = 2;
        const visible = row.roles.slice(0, maxVisible);
        const overflow = row.roles.length - maxVisible;

        return (
          <div className="flex flex-wrap gap-1">
            {visible.map((role) => {
              let badgeColor = 'bg-slate-50 text-slate-600 border-slate-200';
              if (role.persona_type === 'super_admin') badgeColor = 'bg-violet-50/50 text-violet-700 border-violet-100';
              if (role.persona_type === 'headmaster') badgeColor = 'bg-blue-50/50 text-blue-700 border-blue-100';
              if (role.persona_type === 'teacher') badgeColor = 'bg-emerald-50/50 text-emerald-700 border-emerald-100';
              if (role.persona_type === 'student') badgeColor = 'bg-amber-50/50 text-amber-700 border-amber-100';

              return (
                <span key={role.id} className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-semibold ${badgeColor}`}>
                  {role.name}
                </span>
              );
            })}
            {overflow > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold" title={row.roles.slice(maxVisible).map(r => r.name).join(', ')}>
                +{overflow} more
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => {
        let badgeStyle = 'bg-slate-50 text-slate-700 border-slate-200';
        let dotStyle = 'bg-slate-400';
        if (row.status === 'active') {
          badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
          dotStyle = 'bg-emerald-500';
        }
        if (row.status === 'inactive') {
          badgeStyle = 'bg-slate-50 text-slate-600 border-slate-200/60';
          dotStyle = 'bg-slate-400';
        }
        if (row.status === 'suspended') {
          badgeStyle = 'bg-red-50 text-red-700 border-red-200/60';
          dotStyle = 'bg-red-500';
        }

        const capitalizedStatus = row.status.charAt(0).toUpperCase() + row.status.slice(1);

        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dotStyle}`} />
            {capitalizedStatus}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Created Date',
      sortable: true,
      render: (row) => new Date(row.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate({ to: '/administration/users/$userId', params: { userId: row.id } as any })}
            className="p-1.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 text-slate-600 hover:text-blue-600 transition-all active:scale-95 cursor-pointer shadow-sm"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {canUpdateUsers && (
            <button
              onClick={() => navigate({ to: '/administration/users/$userId/edit', params: { userId: row.id } as any })}
              className="p-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-slate-600 hover:text-indigo-600 transition-all active:scale-95 cursor-pointer shadow-sm"
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
    <div className="flex gap-2 items-center">
      <select
        value={statusFilter}
        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        className="bg-white border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all cursor-pointer"
      >
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="suspended">Suspended</option>
      </select>

      <select
        value={roleFilter}
        onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
        className="bg-white border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all cursor-pointer"
      >
        <option value="">All Roles</option>
        {filteredRoles.map((role: any) => (
          <option key={role.id} value={role.id}>{role.name}</option>
        ))}
      </select>

      {canCreateUsers && (
        <button
          onClick={() => navigate({ to: '/administration/users/new' })}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white gradient-brand shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all text-sm cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          Create User
        </button>
      )}
    </div>
  );

  const cards = [
    { key: '', label: 'All Users', count: summary.total, color: 'border-slate-200 bg-white hover:bg-slate-50/50', activeColor: 'border-indigo-600 ring-2 ring-indigo-100' },
    { key: 'super_admin', label: 'Super Admin', count: summary.super_admin, color: 'border-violet-100 bg-violet-50/20 hover:bg-violet-50/50', activeColor: 'border-violet-600 ring-2 ring-violet-100' },
    { key: 'headmaster', label: 'Headmaster', count: summary.headmaster, color: 'border-blue-100 bg-blue-50/20 hover:bg-blue-50/50', activeColor: 'border-blue-600 ring-2 ring-blue-100' },
    { key: 'teacher', label: 'Teacher', count: summary.teacher, color: 'border-emerald-100 bg-emerald-50/20 hover:bg-emerald-50/50', activeColor: 'border-emerald-600 ring-2 ring-emerald-100' },
    { key: 'student', label: 'Student', count: summary.student, color: 'border-amber-100 bg-amber-50/20 hover:bg-amber-50/50', activeColor: 'border-amber-600 ring-2 ring-amber-100' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
          <p className="text-slate-500 text-sm mt-1">Manage platform and portal access, assign roles, and handle user statuses.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((card) => {
          const isActive = personaFilter === card.key;
          return (
            <div
              key={card.key}
              onClick={() => handlePersonaSelect(card.key)}
              className={`p-5 rounded-2xl border cursor-pointer select-none transition-all flex flex-col justify-between shadow-sm relative overflow-hidden ${
                isActive ? card.activeColor : card.color
              }`}
            >
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{card.label}</span>
                <span className="text-2xl font-bold text-slate-800 mt-1 block">{card.count.toLocaleString()}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    card.key === 'super_admin' ? 'bg-violet-500' :
                    card.key === 'headmaster' ? 'bg-blue-500' :
                    card.key === 'teacher' ? 'bg-emerald-500' :
                    card.key === 'student' ? 'bg-amber-500' : 'bg-indigo-500'
                  }`} />
                  {isActive ? 'Active Filter' : 'Click to filter'}
                </span>
              </div>
            </div>
          );
        })}
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
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        searchPlaceholder="Search by name or email..."
        filterComponent={filterComponent}
      />
    </div>
  );
};
