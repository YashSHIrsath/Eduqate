import React from 'react';
import { useAuth } from '../../auth';

export const TeacherDashboard: React.FC = () => {
  const { user, roles } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Teacher Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back, {user?.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500 font-medium">My Classes</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">—</p>
          <p className="text-xs text-slate-400 mt-1">Available in Phase 3</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500 font-medium">Pending Attendance</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">—</p>
          <p className="text-xs text-slate-400 mt-1">Available in Phase 3</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500 font-medium">My Roles</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{roles.length}</p>
          <p className="text-xs text-slate-400 mt-1">{roles.map(r => r.name).join(', ')}</p>
        </div>
      </div>
    </div>
  );
};
