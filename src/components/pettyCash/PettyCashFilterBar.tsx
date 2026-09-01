import React from 'react';
import { Search, Filter, RotateCcw, Calendar, Building, User, Tag, CheckCircle } from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';

interface PettyCashFilterBarProps {
  showCategoryFilter?: boolean;
  showStatusFilter?: boolean;
  showSupervisorFilter?: boolean;
  showProjectFilter?: boolean;
}

export const PettyCashFilterBar: React.FC<PettyCashFilterBarProps> = ({
  showCategoryFilter = true,
  showStatusFilter = true,
  showSupervisorFilter = true,
  showProjectFilter = true
}) => {
  const { filters, setFilters, resetFilters, projects, supervisors, categories, userRole } = usePettyCash();

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const isFiltered =
    filters.project !== 'ALL' ||
    filters.supervisor !== 'ALL' ||
    filters.category !== 'ALL' ||
    filters.status !== 'ALL' ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo) ||
    Boolean(filters.searchQuery.trim());

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 mb-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Filters & Global Search
          </span>
          {isFiltered && (
            <span className="text-[10px] font-semibold bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800">
              Active Filters
            </span>
          )}
        </div>

        {isFiltered && (
          <button
            id="btn-reset-petty-cash-filters"
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:underline transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {/* Search input */}
        <div className="lg:col-span-2 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            id="filter-search-query-input"
            type="text"
            placeholder="Search ID, desc, receipt..."
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Project Selector */}
        {showProjectFilter && (
          <div>
            <select
              id="filter-project-select"
              value={filters.project}
              onChange={(e) => handleFilterChange('project', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="ALL">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.PROJECT_CODE}>
                  {p.PROJECT_CODE} - {p.PROJECT_NAME.slice(0, 20)}...
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Supervisor Selector (Hidden if Supervisor role is locked to self) */}
        {showSupervisorFilter && userRole !== 'SUPERVISOR' && (
          <div>
            <select
              id="filter-supervisor-select"
              value={filters.supervisor}
              onChange={(e) => handleFilterChange('supervisor', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="ALL">All Supervisors / Staff</option>
              {supervisors.map(s => (
                <option key={s.id} value={s.SUPERVISOR_NAME}>
                  {s.employeeCode || s.SUPERVISOR_ID} — {s.FULL_NAME || s.SUPERVISOR_NAME}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Category Selector */}
        {showCategoryFilter && (
          <div>
            <select
              id="filter-category-select"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.CATEGORY_NAME}>
                  {c.CATEGORY_NAME}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Payment Status Selector */}
        {showStatusFilter && (
          <div>
            <select
              id="filter-status-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Paid">Paid</option>
              <option value="Reimbursed">Reimbursed</option>
              <option value="Rejected">Rejected</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        )}

        {/* Data Source Selector */}
        <div>
          <select
            id="filter-data-source-select"
            value={filters.dataSource || 'ALL'}
            onChange={(e) => handleFilterChange('dataSource', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
          >
            <option value="ALL">All Sources</option>
            <option value="SYSTEM">Live Operational</option>
            <option value="HISTORICAL">Historical Migrated</option>
          </select>
        </div>

        {/* Date From */}
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1">
          <span className="text-[10px] text-slate-400 whitespace-nowrap">From:</span>
          <input
            id="filter-date-from-input"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="w-full bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
          />
        </div>

        {/* Date To */}
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1">
          <span className="text-[10px] text-slate-400 whitespace-nowrap">To:</span>
          <input
            id="filter-date-to-input"
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="w-full bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
