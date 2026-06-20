import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useNavigate } from '@tanstack/react-router';
import { getUser, updateUserStatus } from '../api/users';
import { useAuth } from '../../auth';
import { ArrowLeft, Edit, Shield, KeyRound, User as UserIcon, Calendar, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const UserDetails: React.FC = () => {
  const { userId } = useParams({ from: '/dashboard/users/$userId' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canUpdateUsers = hasPermission('users:update');
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
  const [statusError, setStatusError] = useState<string | null>(null);

  // 1. Fetch user detail data
  const { data: userDetail, isLoading, error } = useQuery({
    queryKey: ['user-detail', userId],
    queryFn: () => getUser(userId),
  });

  // 2. Mutation for status changes
  const statusMutation = useMutation({
    mutationFn: ({ status }: { status: string }) => updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-detail', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setStatusError(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Failed to update user status.';
      setStatusError(msg);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <RefreshCw className="h-8 w-8 text-brand-500 animate-spin" />
        <span>Loading user details...</span>
      </div>
    );
  }

  if (error || !userDetail) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Failed to load user</h3>
        <p className="text-slate-500 text-sm mt-1">Verify that the user ID is valid and belongs to your organization.</p>
        <Link to="/users" className="mt-6 inline-flex items-center gap-2 text-sm text-brand-600 font-semibold hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to list
        </Link>
      </div>
    );
  }

  const handleStatusToggle = () => {
    const newStatus = userDetail.status === 'active' ? 'inactive' : 'active';
    statusMutation.mutate({ status: newStatus });
  };

  const handleSuspendToggle = () => {
    const newStatus = userDetail.status === 'suspended' ? 'active' : 'suspended';
    statusMutation.mutate({ status: newStatus });
  };

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/users"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to User List
        </Link>
        {canUpdateUsers && (
          <button
            onClick={() => navigate({ to: '/users/$userId/edit', params: { userId } })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all text-xs cursor-pointer shadow-sm"
          >
            <Edit className="h-4 w-4" />
            Edit User Profile
          </button>
        )}
      </div>

      {statusError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
          {statusError}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Profile Summary Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="text-center pb-6 border-b border-slate-100">
            <div className="h-16 w-16 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-inner">
              <UserIcon className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg truncate" title={userDetail.email}>
              {userDetail.email}
            </h3>
            <span className="text-xs text-slate-400 block font-mono mt-1 select-all">{userDetail.id}</span>
          </div>

          <div className="space-y-4.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Account Status</span>
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    userDetail.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : userDetail.status === 'inactive'
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : 'bg-red-50 text-red-700 border-red-100'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      userDetail.status === 'active'
                        ? 'bg-emerald-500'
                        : userDetail.status === 'inactive'
                        ? 'bg-slate-400'
                        : 'bg-red-500'
                    }`}
                  />
                  {userDetail.status}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">First Login Flag</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  userDetail.must_change_password
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                }`}
              >
                {userDetail.must_change_password ? 'Change Required' : 'Completed'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Created Date</span>
              <span className="text-slate-800 flex items-center gap-1.5 font-medium">
                <Calendar className="h-4 w-4 text-slate-400" />
                {new Date(userDetail.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Quick Actions Panel */}
          {canUpdateUsers && (
            <div className="pt-6 border-t border-slate-100 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Status Management</h4>
              <button
                onClick={handleStatusToggle}
                disabled={statusMutation.isPending}
                className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                  userDetail.status === 'active'
                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                }`}
              >
                {userDetail.status === 'active' ? (
                  <>
                    <XCircle className="h-4 w-4" /> Deactivate Account
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Activate Account
                  </>
                )}
              </button>

              <button
                onClick={handleSuspendToggle}
                disabled={statusMutation.isPending}
                className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                  userDetail.status === 'suspended'
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                }`}
              >
                {userDetail.status === 'suspended' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Lift Suspension
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" /> Suspend Account
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Tabbed Access Panel */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Tab headers */}
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-6 py-4.5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'roles'
                  ? 'border-brand-500 text-brand-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="h-4.5 w-4.5" />
              Assigned Roles ({userDetail.roles?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-6 py-4.5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'permissions'
                  ? 'border-brand-500 text-brand-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <KeyRound className="h-4.5 w-4.5" />
              Effective Permissions ({userDetail.permissions?.length || 0})
            </button>
          </div>

          {/* Tab content viewport */}
          <div className="p-6 flex-1">
            {activeTab === 'roles' ? (
              <div className="space-y-4">
                {userDetail.roles?.length === 0 ? (
                  <p className="text-slate-400 text-sm py-8 text-center">No roles assigned to this user.</p>
                ) : (
                  userDetail.roles.map((role: any) => (
                    <div key={role.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{role.name}</span>
                          {role.is_system_role && (
                            <span className="text-[9px] uppercase font-bold text-brand-600 tracking-wider bg-brand-50 px-1.5 py-0.5 rounded border border-brand-100">
                              System
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{role.description || 'No description provided.'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {userDetail.permissions?.length === 0 ? (
                  <p className="text-slate-400 text-sm py-8 text-center">No active permissions found.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {userDetail.permissions.map((perm: any) => (
                      <div key={perm.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/30 flex flex-col">
                        <span className="font-mono text-xs font-semibold text-slate-700">{perm.name}</span>
                        <span className="text-[10px] text-slate-400 mt-1">{perm.description}</span>
                        <span className="text-[9px] font-bold text-indigo-500 uppercase mt-1.5 tracking-wider">
                          Category: {perm.category}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
