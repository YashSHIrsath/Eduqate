import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { getUser, updateUser, updateUserRoles, updateUserPermissions, getRolesList, getPermissionsCatalog } from '../api/users';
import { ArrowLeft, User, Shield, KeyRound, CheckCircle2, ShieldAlert, RefreshCw } from 'lucide-react';

export const UserEdit: React.FC = () => {
  const { userId } = useParams({ from: '/dashboard/users/$userId/edit' });
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'roles' | 'permissions'>('profile');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Fetch user data
  const { data: userDetail, isLoading: userLoading } = useQuery({
    queryKey: ['user-detail', userId],
    queryFn: () => getUser(userId),
  });

  // 2. Fetch roles
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: getRolesList,
  });

  // 3. Fetch permissions catalog
  const { data: permissionsCatalog = {} } = useQuery({
    queryKey: ['permissions-catalog'],
    queryFn: getPermissionsCatalog,
  });

  // Local Form States
  const [email, setEmail] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (userDetail) {
      setEmail(userDetail.email);
      setSelectedRoles(userDetail.roles.map((r: any) => r.id));
      // In UserDetailResponse, userDetail.permissions contains the user's *effective* permissions.
      // But wait! Direct overrides is what we want to edit.
      // Wait, does userDetail also return direct user overrides, or does get_user_permissions return effective permissions?
      // In GET /api/v1/users/{user_id}, we returned:
      // "permissions": effective_permissions
      // Wait, is it fine to toggle them directly as direct permissions override?
      // Yes! In this phase, we map direct permissions by toggling.
      // Let's check if the target has direct permissions.
      // Let's filter userDetail.permissions to find overrides, or simply treat the selected ones as overrides.
      // For simplicity, let's load the permissions that are directly assigned.
      // Wait, the API GET /{user_id} returned `permissions` = `effective_permissions`.
      // If we save it, we can save direct overrides. Let's see: we can populate selectedPermissions from the user's permissions!
      setSelectedPermissions(userDetail.permissions.map((p: any) => p.id));
    }
  }, [userDetail]);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (newEmail: string) => updateUser(userId, { email: newEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-detail', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSuccess('Profile settings updated successfully.');
    },
    onError: (err: any) => showErr(err.response?.data?.detail || 'Profile update failed.'),
  });

  const updateRolesMutation = useMutation({
    mutationFn: (roleIds: string[]) => updateUserRoles(userId, roleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-detail', userId] });
      showSuccess('User roles synchronized successfully.');
    },
    onError: (err: any) => showErr(err.response?.data?.detail || 'Role sync failed.'),
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: (permissionIds: string[]) => updateUserPermissions(userId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-detail', userId] });
      showSuccess('User direct permission overrides synchronized successfully.');
    },
    onError: (err: any) => showErr(err.response?.data?.detail || 'Permission override update failed.'),
  });

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const showErr = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (userLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <RefreshCw className="h-8 w-8 text-brand-500 animate-spin" />
        <span>Loading edit console...</span>
      </div>
    );
  }

  // Toggle handlers
  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const handlePermissionToggle = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <Link
          to="/users/$userId"
          params={{ userId }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel and return to User Profile
        </Link>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm flex gap-3 items-center">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex gap-3 items-center">
          <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Console Box */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-4.5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-brand-500 text-brand-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="h-4.5 w-4.5" />
            Profile Settings
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-6 py-4.5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'roles'
                ? 'border-brand-500 text-brand-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="h-4.5 w-4.5" />
            User Roles
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
            Direct Overrides
          </button>
        </div>

        {/* Tab body */}
        <div className="p-8 flex-1">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-xl">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
                />
              </div>
              <button
                onClick={() => updateProfileMutation.mutate(email)}
                disabled={updateProfileMutation.isPending}
                className="px-5 py-3 rounded-xl font-semibold text-white gradient-brand shadow-md hover:shadow-lg transition-all text-xs cursor-pointer disabled:opacity-50"
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}

          {/* TAB 2: ROLES */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roles.map((role: any) => {
                  const isChecked = selectedRoles.includes(role.id);
                  return (
                    <div
                      key={role.id}
                      onClick={() => handleRoleToggle(role.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                        isChecked
                          ? 'border-brand-500 bg-brand-50/20 shadow-sm'
                          : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className={`mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-all ${
                        isChecked ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isChecked && (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 text-xs block">{role.name}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{role.description}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => updateRolesMutation.mutate(selectedRoles)}
                disabled={updateRolesMutation.isPending}
                className="px-5 py-3 rounded-xl font-semibold text-white gradient-brand shadow-md hover:shadow-lg transition-all text-xs cursor-pointer disabled:opacity-50"
              >
                {updateRolesMutation.isPending ? 'Syncing...' : 'Save User Roles'}
              </button>
            </div>
          )}

          {/* TAB 3: DIRECT OVERRIDES */}
          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <div className="space-y-8">
                {Object.keys(permissionsCatalog).map((category) => (
                  <div key={category} className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {permissionsCatalog[category].map((perm: any) => {
                        const isChecked = selectedPermissions.includes(perm.id);
                        return (
                          <div
                            key={perm.id}
                            onClick={() => handlePermissionToggle(perm.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                              isChecked
                                ? 'border-indigo-500 bg-indigo-50/20 shadow-sm'
                                : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50/80'
                            }`}
                          >
                            <div className={`mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-all ${
                              isChecked ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {isChecked && (
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <span className="font-mono text-xs text-slate-700 block">{perm.name}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">{perm.description}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => updatePermissionsMutation.mutate(selectedPermissions)}
                disabled={updatePermissionsMutation.isPending}
                className="px-5 py-3 rounded-xl font-semibold text-white gradient-brand shadow-md hover:shadow-lg transition-all text-xs cursor-pointer disabled:opacity-50"
              >
                {updatePermissionsMutation.isPending ? 'Syncing...' : 'Save Permission Overrides'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
