import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Download,
  RefreshCw,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  FolderLock,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuditLog } from '../../types/authTypes';

export const AuditTrailView: React.FC = () => {
  const { auditLogs, refreshAdminData, hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const modules = Array.from(new Set(auditLogs.map(l => l.module)));

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.description && log.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.recordId && log.recordId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.projectCode && log.projectCode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesModule = moduleFilter === 'ALL' || log.module === moduleFilter;

    return matchesSearch && matchesModule;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAdminData();
    setIsRefreshing(false);
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Employee ID', 'User Name', 'Action', 'Module', 'Record ID', 'Project', 'Description'];
    const rows = filteredLogs.map(l => [
      l.timestamp,
      l.employeeId,
      l.userName,
      l.action,
      l.module,
      l.recordId || '',
      l.projectCode || '',
      `"${(l.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EMA_ERP_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('APPROVED')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (action.includes('REJECTED')) return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    if (action.includes('DISBURSED') || action.includes('PAID')) return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    if (action.includes('LOGIN') || action.includes('AUTH')) return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    if (action.includes('RESET') || action.includes('UPDATE')) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">Immutable System Audit Trail</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-bold">
              {auditLogs.length} Recorded Events
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident logs of all user authentication events, critical approvals, payment releases, and security updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by action, user, employee ID, PRV number, project, or description..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
          >
            <option value="ALL">All Modules ({modules.length})</option>
            {modules.map(m => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                <th className="py-3 px-4">Timestamp (UTC/Local)</th>
                <th className="py-3 px-3">Authorized User</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Module</th>
                <th className="py-3 px-3">Target Record / Project</th>
                <th className="py-3 px-4">Description & Audit Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans text-xs">
                    No audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(log.timestamp).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-sans font-bold text-slate-200">{log.userName}</div>
                      <div className="text-[10px] text-slate-400">{log.employeeId}</div>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-slate-300 font-sans text-[11px] whitespace-nowrap">
                      {log.module}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {log.recordId && (
                        <div className="font-bold text-amber-400">{log.recordId}</div>
                      )}
                      {log.projectCode && (
                        <div className="text-[10px] text-purple-400 font-sans">
                          Proj: {log.projectCode}
                        </div>
                      )}
                      {!log.recordId && !log.projectCode && <span className="text-slate-600">-</span>}
                    </td>

                    <td className="py-2.5 px-4 text-slate-300 font-sans text-[11px]">
                      {log.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
