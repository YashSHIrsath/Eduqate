import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (field: string, order: 'asc' | 'desc') => void;
  isLoading?: boolean;
  search?: string;
  onSearchChange?: (search: string) => void;
  searchPlaceholder?: string;
  filterComponent?: React.ReactNode; // Optional extra filters next to search
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortBy,
  sortOrder,
  onSortChange,
  isLoading = false,
  search,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filterComponent,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleSort = (field: string, sortable?: boolean) => {
    if (!sortable || !onSortChange) return;
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(field, newOrder);
  };

  const startRecord = (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      {/* Top action/filter bar */}
      {(onSearchChange || filterComponent) && (
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            {onSearchChange && (
              <>
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search || ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
                />
              </>
            )}
          </div>
          {filterComponent && (
            <div className="flex flex-wrap gap-2 w-full md:w-auto items-center justify-end">
              {filterComponent}
            </div>
          )}
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden relative">
        <div className="overflow-x-auto min-h-[250px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 text-xs font-bold uppercase tracking-wider">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key, col.sortable)}
                    className={`px-6 py-4 select-none ${
                      col.sortable ? 'cursor-pointer hover:bg-slate-100/50 hover:text-slate-800' : ''
                    } transition-colors`}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {col.sortable && onSortChange && (
                        <span>
                          {sortBy === col.key ? (
                            sortOrder === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5 text-brand-600" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-brand-600" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
                      <span>Loading records...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-20 text-center text-slate-400">
                    <p className="text-base font-semibold text-slate-500 mb-1">No records found</p>
                    <p className="text-xs text-slate-400">Try adjusting your filters or search terms.</p>
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    {columns.map((col) => (
                      <td key={col.key} className="px-6 py-4 whitespace-nowrap text-slate-700 font-medium">
                        {col.render ? col.render(row) : (row as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && data.length > 0 && (
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-800">{startRecord}</span> to{' '}
              <span className="font-semibold text-slate-800">{endRecord}</span> of{' '}
              <span className="font-semibold text-slate-800">{total}</span> records
            </div>

            <div className="flex items-center gap-4">
              {/* Page size dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="bg-white border border-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
                >
                  {[5, 10, 25, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prev/Next buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page === 1}
                  onClick={() => onPageChange(page - 1)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4 text-slate-600" />
                </button>
                <span className="text-xs font-semibold text-slate-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => onPageChange(page + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
