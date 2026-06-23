import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { getUser, updateUser, updateUserRoles, updateUserPermissions, getRolesList, getPermissionsCatalog } from '../api/users';
import { ArrowLeft, User, Shield, KeyRound, CheckCircle2, ShieldAlert, RefreshCw } from 'lucide-react';
import type { PersonaType } from '../../auth/types';

const PERSONAS: { value: PersonaType; label: string; description: string }[] = [
  { value: 'super_admin', label: 'Super Admin', description: 'Unrestricted platform access' },
  { value: 'headmaster',  label: 'Headmaster',  description: 'School administrator portal' },
  { value: 'teacher',     label: 'Teacher',     description: 'Educator portal access' },
  { value: 'student',     label: 'Student',     description: 'Learner portal access' },
];

export const UserEdit: React.FC = () => {
  const { userId } = useParams({ from: '/administration/users/$userId/edit' });
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'access' | 'permissions'>('profile');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: userDetail, isLoading: userLoading } = useQuery({
    queryKey: ['user-detail', userId],
    queryFn: () => getUser(userId),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: getRolesList,
  });

  const { data: permissionsCatalog = {} } = useQuery({
    queryKey: ['permissions-catalog'],
    queryFn: getPermissionsCatalog,
  });

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('super_admin');
  const [originalPersona, setOriginalPersona] = useState<PersonaType>('super_admin');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (userDetail) {
      setEmail(userDetail.email);
      setFullName(userDetail.full_name || '');
      const persona = userDetail.persona_type as PersonaType;
      setSelectedPersona(persona);
      setOriginalPersona(persona);
      setSelectedRoles(userDetail.roles.map((r: any) => r.id));
      // Initialize from direct_permissions only — role permissions are inherited automatically
      setSelectedPermissions((userDetail.direct_permissions ?? []).map((p: any) => p.id));
    }
  }, [userDetail]);

  // When persona changes, clear role selection since old roles won't match new persona
  const handlePersonaChange = (persona: PersonaType) => {
    setSelectedPersona(persona);
    setSelectedRoles([]);
  };

  const filteredRoles = (roles as any[]).filter(
    (role) => role.persona_type === selectedPersona
  );

  const updateProfileMutation = useMutation({
    mutationFn: ({ newEmail, newFullName }: { newEmail: string; newFullName: string }) =>
      updateUser(userId, { email: newEmail, full_name: newFullName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-detail', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSuccess('Profile settings updated.');
    },
    onError: (err: any) => showErr(err.response?.data?.detail || 'Profile update failed.'),
  });

  const updateAccessMutation = useMutation({
    mutationFn: async ({ persona, roleIds }: { persona: PersonaType; roleIds: string[] }) => {
      // Persona must be saved BEFORE roles — backend enforces persona match on role assignment
      // To avoid validation deadlock when changing persona, we first clear roles, update persona, and then assign new roles.
      if (persona !== originalPersona) {
        await updateUserRoles(userId, []);
        await updateUser(userId, { persona_type: persona });
      }
      await updateUserRoles(userId, roleIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-detail', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOriginalPersona(selectedPersona);
      showSuccess('Persona and role assignments updated.');
    },
    onError: (err: any) => showErr(err.response?.data?.detail || 'Access update failed.'),
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: (permissionIds: string[]) => updateUserPermissions(userId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-detail', userId] });
      showSuccess('Direct permission overrides updated.');
    },
    onError: (err: any) => showErr(err.response?.data?.detail || 'Permission update failed.'),
  });

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg); setErrorMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSuccessMsg(null), 3000);
  };
  const showErr = (msg: string) => {
    setErrorMsg(msg); setSuccessMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (userLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <RefreshCw className="h-8 w-8 text-brand-500 animate-spin" />
        <span>Loading editor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link
          to="/administration/users/$userId"
          params={{ userId } as any}
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

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex border-b border-slate-200 bg-slate-50/50 shrink-0">
          {(['profile', 'access', 'permissions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === tab ? 'border-brand-500 text-brand-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'profile' && <User className="h-4 w-4" />}
              {tab === 'access' && <Shield className="h-4 w-4" />}
              {tab === 'permissions' && <KeyRound className="h-4 w-4" />}
              {tab === 'profile' ? 'Profile Settings' : tab === 'access' ? 'Persona & Roles' : 'Direct Overrides'}
            </button>
          ))}
        </div>

        <div className="p-8">
          {/* ── Profile ─────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-xl">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
                />
              </div>
              <button
                onClick={() => updateProfileMutation.mutate({ newEmail: email, newFullName: fullName })}
                disabled={updateProfileMutation.isPending}
                className="px-5 py-3 rounded-xl font-semibold text-white gradient-brand shadow-md hover:shadow-lg transition-all text-xs cursor-pointer disabled:opacity-50"
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          )}

          {/* ── Persona & Roles ──────────────────────────────── */}
          {activeTab === 'access' && (
            <div className="space-y-8 max-w-3xl">

              {/* Section 1 — Persona */}
              <div>
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-800">Portal Access (Persona)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Determines which portal this user can enter. Only one persona is allowed.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PERSONAS.map((p) => {
                    const isSelected = selectedPersona === p.value;
                    return (
                      <label
                        key={p.value}
                        className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all select-none ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50/30 shadow-sm'
                            : 'border-slate-200 bg-slate-50/30 hover:bg-slate-50/80'
                        }`}
                      >
                        <input
                          type="radio"
                          name="persona"
                          value={p.value}
                          checked={isSelected}
                          onChange={() => handlePersonaChange(p.value)}
                          className="mt-0.5 accent-brand-600 h-4 w-4 shrink-0"
                        />
                        <div>
                          <span className={`font-semibold text-sm block ${isSelected ? 'text-brand-700' : 'text-slate-800'}`}>
                            {p.label}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">{p.description}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {selectedPersona !== originalPersona && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
                    Changing persona will reassign the user to the <strong>{selectedPersona}</strong> portal. All existing role assignments will be cleared.
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100" />

              {/* Section 2 — Roles */}
              <div>
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-800">
                    Organization Roles
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      — showing roles for <span className="font-semibold text-slate-600">{selectedPersona}</span>
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Roles determine what actions this user can perform within their portal.
                  </p>
                </div>

                {filteredRoles.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    <Shield className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-500">No roles configured for this persona</p>
                    <p className="text-xs mt-1">Create roles with persona_type = <span className="font-mono">{selectedPersona}</span></p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredRoles.map((role: any) => {
                      const isChecked = selectedRoles.includes(role.id);
                      return (
                        <div
                          key={role.id}
                          onClick={() =>
                            setSelectedRoles(prev =>
                              prev.includes(role.id)
                                ? prev.filter(id => id !== role.id)
                                : [...prev, role.id]
                            )
                          }
                          className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer select-none transition-all ${
                            isChecked
                              ? 'border-indigo-500 bg-indigo-50/20 shadow-sm'
                              : 'border-slate-200 bg-slate-50/30 hover:bg-slate-50/80'
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
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800 text-xs block truncate">{role.name}</span>
                              {role.is_system_role && (
                                <span className="text-[8px] uppercase font-bold text-brand-600 tracking-wider bg-brand-50 px-1 py-0.5 rounded border border-brand-100 shrink-0">System</span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5 truncate">{role.description}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={() => updateAccessMutation.mutate({ persona: selectedPersona, roleIds: selectedRoles })}
                disabled={updateAccessMutation.isPending}
                className="px-5 py-3 rounded-xl font-semibold text-white gradient-brand shadow-md hover:shadow-lg transition-all text-xs cursor-pointer disabled:opacity-50"
              >
                {updateAccessMutation.isPending ? 'Saving...' : 'Save Persona & Roles'}
              </button>
            </div>
          )}

          {/* ── Direct Permission Overrides ──────────────────── */}
          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                <span className="font-semibold text-slate-700">How this works: </span>
                Permissions marked <span className="font-semibold text-violet-600">Via Role</span> are already granted through the user's assigned role — no action needed. Use this tab only to grant <span className="font-semibold text-indigo-600">extra permissions</span> beyond what the role provides.
              </div>
              <div className="space-y-8">
                {Object.keys(permissionsCatalog).map((category) => {
                  const effectivePermIds = new Set((userDetail?.permissions ?? []).map((p: any) => p.id));
                  const directPermIds = new Set(selectedPermissions);
                  return (
                    <div key={category} className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">{category}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(permissionsCatalog as any)[category].map((perm: any) => {
                          const isDirect = directPermIds.has(perm.id);
                          const isViaRole = effectivePermIds.has(perm.id) && !isDirect;
                          return isViaRole ? (
                            // Read-only: granted via role
                            <div
                              key={perm.id}
                              className="p-3 rounded-xl border border-violet-200 bg-violet-50/30 flex items-start gap-3 opacity-80"
                            >
                              <div className="mt-0.5 h-4 w-4 shrink-0 rounded border border-violet-400 bg-violet-100 flex items-center justify-center">
                                <svg className="h-3 w-3 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <div>
                                <span className="font-mono text-xs text-slate-700 block">{perm.name}</span>
                                <span className="text-[10px] text-violet-500 font-semibold block mt-0.5">Via Role</span>
                              </div>
                            </div>
                          ) : (
                            // Toggleable: direct override
                            <div
                              key={perm.id}
                              onClick={() =>
                                setSelectedPermissions(prev =>
                                  prev.includes(perm.id)
                                    ? prev.filter(id => id !== perm.id)
                                    : [...prev, perm.id]
                                )
                              }
                              className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                                isDirect ? 'border-indigo-500 bg-indigo-50/20 shadow-sm' : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50/80'
                              }`}
                            >
                              <div className={`mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-all ${
                                isDirect ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                              }`}>
                                {isDirect && (
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
                  );
                })}
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
