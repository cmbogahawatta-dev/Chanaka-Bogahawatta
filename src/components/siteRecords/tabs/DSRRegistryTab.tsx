import React, { useState } from 'react';
import {
  Calendar,
  Search,
  Filter,
  FileText,
  Download,
  Copy,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  CloudSun,
  Users,
  Truck,
  Package,
  Plus,
  Eye,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { DailySiteRecord } from '../../../types/siteRecordTypes';
import { useSiteRecords } from '../../../context/SiteRecordContext';
import { usePettyCash } from '../../../context/PettyCashContext';
import { useEnterprise } from '../../../context/EnterpriseContext';
import { AdminClearHistoryButton } from '../../common/AdminClearHistoryButton';

interface DSRRegistryTabProps {
  onOpenCreateModal: () => void;
  onOpenDetailModal: (record: DailySiteRecord) => void;
  onEditRecord: (record: DailySiteRecord) => void;
}

export const DSRRegistryTab: React.FC<DSRRegistryTabProps> = ({
  onOpenCreateModal,
  onOpenDetailModal,
  onEditRecord
}) => {
  const {
    records,
    filteredRecords,
    filter,
    setFilter,
    downloadRecordPDF,
    cloneRecordForTomorrow,
    deleteRecord,
    downloadAllExcel,
    clearAllRecords,
    resetToDefaultRecords
  } = useSiteRecords();
  const { projects } = usePettyCash();
  const { currentRole } = useEnterprise();

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const isAdminOrEngineer =
    currentRole === 'ADMIN' || currentRole === 'SITE_ENGINEER' || currentRole === 'PROJECT_MANAGER' || currentRole === 'OWNER';

  const handleDelete = (r: DailySiteRecord) => {
    if (window.confirm(`Are you sure you want to delete ${r.dsrNumber} (${r.date})?`)) {
      deleteRecord(r.id);
    }
  };

  const handleClone = (r: DailySiteRecord) => {
    cloneRecordForTomorrow(r.id);
    alert(`Cloned ${r.dsrNumber} for today! A new draft has been added to the registry.`);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Control Ribbon */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center flex-1 min-w-[240px] max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filter.searchTerm}
            onChange={e => setFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
            placeholder="Search by DSR #, project, chainage, engineer..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Project Filter */}
          <select
            value={filter.projectCode}
            onChange={e => setFilter(prev => ({ ...prev, projectCode: e.target.value }))}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.PROJECT_CODE}>
                {p.PROJECT_CODE}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filter.status}
            onChange={e => setFilter(prev => ({ ...prev, status: e.target.value as any }))}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Verified & Approved">Verified & Approved</option>
            <option value="Submitted for Review">Submitted for Review</option>
            <option value="Draft">Draft</option>
          </select>

          {/* Date Range */}
          <select
            value={filter.dateRange}
            onChange={e => setFilter(prev => ({ ...prev, dateRange: e.target.value as any }))}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Dates</option>
            <option value="TODAY">Today's Logs</option>
          </select>

          {/* Export Excel Button */}
          <button
            onClick={downloadAllExcel}
            title="Download multi-tab Excel workbook"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          {/* Admin Clear History Button */}
          <AdminClearHistoryButton
            id="btn-admin-clear-dsr-registry-tab"
            moduleName="Daily Site Report Journal"
            itemCount={records.length}
            itemDescription="daily site journals, manpower entries, equipment logs, and HSE sign-offs"
            preservedItemsDescription="Construction projects, supervisor rosters, and asset registries will remain intact."
            onClear={clearAllRecords}
            label="Clear History"
          />

          {/* New DSR Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Daily Log</span>
          </button>
        </div>
      </div>

      {/* Results Count & View Switcher */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong className="text-slate-200">{filteredRecords.length}</strong> daily site journals
        </span>
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-2 py-1 rounded text-[11px] font-bold ${
              viewMode === 'cards' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-2 py-1 rounded text-[11px] font-bold ${
              viewMode === 'table' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {/* Records Listing */}
      {filteredRecords.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl space-y-3">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">
            {records.length === 0 ? 'Daily Report History Cleared' : 'No Daily Site Records Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {records.length === 0
              ? 'All daily site reports have been purged. You can record a fresh daily log or restore sample records.'
              : 'No daily journals matched your current filter criteria. Create your first site log or adjust filters.'}
          </p>
          <div className="flex items-center justify-center gap-2.5 flex-wrap pt-2">
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Daily Site Record</span>
            </button>
            {records.length === 0 && (
              <button
                onClick={resetToDefaultRecords}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold border border-purple-500/30 shadow-md transition-all active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Sample Daily Reports</span>
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map(r => {
            const totalMen = r.manpower.reduce((acc, curr) => acc + (curr.headCount || 0), 0);
            const totalHours = r.manpower.reduce(
              (acc, curr) => acc + (curr.headCount || 0) * ((curr.regularHours || 0) + (curr.overtimeHours || 0)),
              0
            );

            return (
              <div
                key={r.id}
                className="p-4 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col justify-between space-y-3 transition-all hover:shadow-xl group"
              >
                {/* Card Header */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-purple-400 group-hover:text-purple-300">
                      {r.dsrNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.signOff.status === 'Verified & Approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {r.signOff.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                    <span className="text-amber-400">{r.projectCode}</span>
                    <span>•</span>
                    <span className="truncate">{r.projectName}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span className="font-semibold text-slate-300">{r.date}</span>
                    <span>•</span>
                    <span>{r.shift} Shift ({r.workingHoursStart}-{r.workingHoursEnd})</span>
                  </p>
                </div>

                {/* Weather & Site Metrics Mini-Grid */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px]">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Manpower</span>
                    <strong className="text-slate-200 font-bold">{totalMen} Men</strong>
                    <span className="text-[9px] text-slate-400 block">{totalHours}h</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block">Machinery</span>
                    <strong className="text-blue-400 font-bold">{r.equipment.length} Units</strong>
                    <span className="text-[9px] text-slate-400 block">{r.equipment.reduce((a,c)=>a+c.hoursWorked,0)}h work</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block">Weather</span>
                    <strong className="text-amber-400 font-bold truncate block">{r.temperatureC}°C</strong>
                    <span className="text-[9px] text-slate-400 truncate block">{r.weatherMorning.split('/')[0]}</span>
                  </div>
                </div>

                {/* Summary snippet */}
                {r.executiveSummary && (
                  <p className="text-xs text-slate-400 line-clamp-2 italic">
                    "{r.executiveSummary}"
                  </p>
                )}

                {/* Card Actions Footer */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-500">By {r.signOff.preparedByName}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenDetailModal(r)}
                      title="View Complete Report"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => downloadRecordPDF(r)}
                      title="Download Official PDF"
                      className="p-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleClone(r)}
                      title="Copy for Today"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {isAdminOrEngineer && (
                      <>
                        <button
                          onClick={() => onEditRecord(r)}
                          title="Edit Log"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(r)}
                          title="Delete"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/90 shadow-md">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-3 px-4">DSR Number</th>
                <th className="py-3 px-4">Date & Shift</th>
                <th className="py-3 px-4">Project & Location</th>
                <th className="py-3 px-4 text-center">Manpower</th>
                <th className="py-3 px-4 text-center">Plant</th>
                <th className="py-3 px-4 text-center">Weather</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredRecords.map(r => {
                const totalMen = r.manpower.reduce((acc, curr) => acc + (curr.headCount || 0), 0);
                const totalHours = r.manpower.reduce(
                  (acc, curr) => acc + (curr.headCount || 0) * ((curr.regularHours || 0) + (curr.overtimeHours || 0)),
                  0
                );

                return (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-purple-400">{r.dsrNumber}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-200 block">{r.date}</span>
                      <span className="text-[10px] text-slate-400">{r.shift} Shift</span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <strong className="text-slate-200 block">{r.projectCode}</strong>
                      <span className="text-[11px] text-slate-400 truncate block">{r.siteLocation}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <strong className="text-slate-100 block">{totalMen} Men</strong>
                      <span className="text-[10px] text-slate-400">{totalHours}h total</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <strong className="text-blue-400">{r.equipment.length} Units</strong>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-300">
                      <span>{r.temperatureC}°C</span>
                      <span className="text-[10px] text-slate-500 block">{r.rainfallMm}mm</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.signOff.status === 'Verified & Approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {r.signOff.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onOpenDetailModal(r)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => downloadRecordPDF(r)}
                          className="p-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
