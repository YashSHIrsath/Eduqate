import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import { getSections, deleteSection, getClasses } from '../api/academic';
import { useAuth } from '../../auth';
import { Plus, Eye, Edit, Trash2, Layers, LayoutGrid, Users } from 'lucide-react';

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
  const [search, setSearch] = useState('');

  const { data: classesData } = useQuery({
    queryKey: ['classes-lookup'],
    queryFn: () => getClasses({ page_size: 100 }),
  });
  const classes: any[] = classesData?.items || [];
  const classMap = Object.fromEntries(classes.map((c: any) => [c.id, c]));

  const { data, isLoading } = useQuery({
    queryKey: ['sections-all'],
    queryFn: () => getSections({ page: 1, page_size: 500, sort_by: 'name', sort_order: 'asc' }),
  });
  const allSections: SectionRow[] = data?.items || [];

  const deleteMutation = useMutation({
    mutationFn: deleteSection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections-all'] });
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete section "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const searchLower = search.toLowerCase();
  const filtered = search
    ? allSections.filter((s) => {
        const cls = classMap[s.class_id];
        return (
          s.name.toLowerCase().includes(searchLower) ||
          s.code.toLowerCase().includes(searchLower) ||
          cls?.name?.toLowerCase().includes(searchLower)
        );
      })
    : allSections;

  // Group by class_id, sorted by class name
  const byClass = new Map<string, SectionRow[]>();
  for (const s of filtered) {
    if (!byClass.has(s.class_id)) byClass.set(s.class_id, []);
    byClass.get(s.class_id)!.push(s);
  }
  const classEntries = Array.from(byClass.entries()).sort(([aId], [bId]) => {
    const aName = classMap[aId]?.name || '';
    const bName = classMap[bId]?.name || '';
    return aName.localeCompare(bName);
  });

  const classesWithSections = new Set(allSections.map((s) => s.class_id)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Sections</h2>
          <p className="text-slate-500 text-sm">
            {allSections.length} section{allSections.length !== 1 ? 's' : ''} across {classesWithSections} class{classesWithSections !== 1 ? 'es' : ''}
          </p>
        </div>
        {hasPermission('sections:create') && (
          <Link
            to="/administration/academic/sections/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white gradient-brand shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all text-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Sections
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by section name, code or class…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
        />
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-brand-300 border-t-brand-600 animate-spin" />
          <span className="text-sm">Loading sections…</span>
        </div>
      )}

      {/* Empty */}
      {!isLoading && classEntries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 border border-dashed border-slate-200 rounded-2xl">
          <Layers className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">
            {search ? 'No sections match your search.' : 'No sections created yet.'}
          </p>
          {!search && hasPermission('sections:create') && (
            <Link
              to="/administration/academic/sections/new"
              className="text-xs text-brand-600 font-semibold hover:underline"
            >
              Create the first section →
            </Link>
          )}
        </div>
      )}

      {/* Class cards */}
      {!isLoading && classEntries.map(([classId, sections]) => {
        const cls = classMap[classId];
        const className = cls?.name || 'Unknown Class';
        const activeCount = sections.filter((s) => s.status === 'active').length;
        const totalCapacity = sections.reduce((sum, s) => sum + (s.capacity || 0), 0);

        return (
          <div key={classId} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Class header */}
            <div className="flex items-center gap-4 px-6 py-4 bg-slate-50/60 border-b border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                <LayoutGrid className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <div className="font-bold text-slate-800">{className}</div>
                {cls?.code && <div className="text-xs text-slate-400 font-mono">{cls.code}</div>}
              </div>
              <div className="ml-auto flex items-center gap-5 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-700">{sections.length}</span>
                  <span>section{sections.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>{activeCount} active</span>
                </div>
                {totalCapacity > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>{totalCapacity} seats total</span>
                  </div>
                )}
              </div>
            </div>

            {/* Section tiles */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <Layers className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-800 truncate">{section.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[10px] text-slate-400">{section.code}</span>
                      {section.capacity ? (
                        <span className="text-[10px] text-slate-400">· {section.capacity} seats</span>
                      ) : (
                        <span className="text-[10px] text-slate-300 italic">· no limit</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${section.status === 'active' ? 'bg-emerald-400' : 'bg-slate-300'}`}
                    title={section.status}
                  />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate({ to: '/administration/academic/sections/$sectionId', params: { sectionId: section.id } as any })}
                      className="p-1 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 transition-all"
                      title="View"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    {hasPermission('sections:update') && (
                      <button
                        onClick={() => navigate({ to: '/administration/academic/sections/$sectionId/edit', params: { sectionId: section.id } as any })}
                        className="p-1 rounded-lg border border-slate-200 bg-white text-brand-600 hover:bg-brand-50 transition-all"
                        title="Edit"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {hasPermission('sections:delete') && (
                      <button
                        onClick={() => handleDelete(section.id, section.name)}
                        disabled={deleteMutation.isPending}
                        className="p-1 rounded-lg border border-slate-200 bg-white text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Footer */}
      {!isLoading && classEntries.length > 0 && (
        <p className="text-xs text-slate-400 text-center">
          {filtered.length} section{filtered.length !== 1 ? 's' : ''} in {classEntries.length} class{classEntries.length !== 1 ? 'es' : ''}
        </p>
      )}
    </div>
  );
};
