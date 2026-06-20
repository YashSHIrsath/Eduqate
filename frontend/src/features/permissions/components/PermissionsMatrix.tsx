import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPermissionsCatalog } from '../api/permissions';
import {
  KeyRound,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export const PermissionsMatrix: React.FC = () => {
  const { data: catalog, isLoading, error } = useQuery({
    queryKey: ['permissions-catalog'],
    queryFn: getPermissionsCatalog,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        <span>Loading permissions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Failed to load permissions</h3>
        <p className="text-slate-500 text-sm mt-1">Verify your permissions and try again.</p>
      </div>
    );
  }

  const categories = Object.entries(catalog || {}) as [string, any[]][];
  const totalPermissions = categories.reduce((sum, [, perms]) => sum + perms.length, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Permissions Matrix</h2>
          <p className="text-slate-500 text-sm">
            System-wide permission reference. Assign permissions to roles via the Role Editor.
          </p>
        </div>
        <span className="text-xs px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 font-semibold">
          {totalPermissions} Permissions
        </span>
      </div>

      {/* Category Cards */}
      <div className="space-y-5">
        {categories.map(([category, perms]) => (
          <div key={category} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Category Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                  <KeyRound className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{category}</h3>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                {perms.length} permission{perms.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Permissions Grid */}
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {perms.map((perm: any) => (
                  <div
                    key={perm.id}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-slate-800">{perm.name}</span>
                      {perm.is_system_permission && (
                        <span className="flex items-center gap-1 text-[9px] uppercase font-bold text-brand-600 tracking-wider bg-brand-50 px-1.5 py-0.5 rounded border border-brand-100 shrink-0 ml-2">
                          <ShieldCheck className="h-2.5 w-2.5" />
                          System
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {perm.description || 'No description available.'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <KeyRound className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-500">No permissions configured</p>
          <p className="text-xs mt-1">Permissions are created during system setup.</p>
        </div>
      )}
    </div>
  );
};
