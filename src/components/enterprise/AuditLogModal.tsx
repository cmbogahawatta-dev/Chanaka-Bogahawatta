import React, { useState } from 'react';
import {
  X,
  Shield,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Database,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { AuditLogAction, AuditLogModule, AuditLogEntry } from '../../types';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const {
    currentEnterprise,
    auditLogs,
    exportAuditLogs,
    refreshAuditLogs,
    databaseStatus
  } = useFleet();

  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter logs
  const filteredLogs = auditLogs.filter(log => {
    if (selectedModule !== 'all' && log.module !== selectedModule) return false;
    if (selectedAction !== 'all' && log.action !== selectedAction) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesDetails = log.details.toLowerCase().includes(q);
      const matchesUser = log.userName.toLowerCase().includes(q);
      const matchesTitle = log.recordTitle ? log.recordTitle.toLowerCase().includes(q) : false;
      const matchesId = log.recordId.toLowerCase().includes(q);
      if (!matchesDetails && !matchesUser && !matchesTitle && !matchesId) return false;
    }
    return true;
  });

  const handleExport = (format: 'json' | 'csv') => {
    const data = exportAuditLogs(format);
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleettrack-audit-${currentEnterprise.code.toLowerCase()}-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setCopiedNotification(`Exported ${filteredLogs.length} audit records as ${format.toUpperCase()}!`);
    setTimeout(() => setCopiedNotification(null), 3500);
  };

  const getActionBadgeClass = (action: AuditLogAction) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'DELETE':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'TRANSFER':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'ROLE_CHANGE':
      case 'APPROVE':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'LOGIN':
      case 'LOGOUT':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div
      id="audit-log-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="audit-log-modal-card"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Enterprise Audit & Compliance Log
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {currentEnterprise.code}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Immutable security trail for all vehicle handovers, fleet mutations, and user authorizations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="refresh-audit-log-btn"
              onClick={refreshAuditLogs}
              title="Refresh logs"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              id="close-audit-log-modal-btn"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Notification */}
        {copiedNotification && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-800 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {copiedNotification}
            </span>
          </div>
        )}

        {/* Database & Security Status Ribbon */}
        <div className="px-6 py-3 bg-slate-100/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <Database className="w-3.5 h-3.5 text-blue-500" />
              Data Architecture:
              <span className="font-semibold text-slate-900 dark:text-white">
                {databaseStatus.backend === 'supabase_postgresql' ? 'Supabase PostgreSQL' : 'Multi-Tenant Local DB (Supabase Ready)'}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              RLS Isolated ({currentEnterprise.id})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="export-audit-csv-btn"
              onClick={() => handleExport('csv')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Export CSV
            </button>
            <button
              id="export-audit-json-btn"
              onClick={() => handleExport('json')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              Export JSON
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-6 pb-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="audit-search-input"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by action, user, vehicle, reason, or details..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="audit-filter-module"
                value={selectedModule}
                onChange={e => setSelectedModule(e.target.value)}
                className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="all">All Modules</option>
                <option value="VEHICLES">Vehicles</option>
                <option value="DRIVERS">Drivers</option>
                <option value="TRIPS">Running Charts</option>
                <option value="FUEL">Fuel Records</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="TRANSFERS">Vehicle Handover</option>
                <option value="SECURITY">Security & Access</option>
              </select>
            </div>

            <select
              id="audit-filter-action"
              value={selectedAction}
              onChange={e => setSelectedAction(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="all">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="TRANSFER">TRANSFER</option>
              <option value="LOGIN">LOGIN</option>
              <option value="EXPORT">EXPORT</option>
            </select>
          </div>
        </div>

        {/* Logs Table / List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 px-4">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No matching audit records found
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Any fleet modifications, user role changes, or vehicle handovers performed in this enterprise will be recorded here permanently.
              </p>
            </div>
          ) : (
            filteredLogs.map(log => {
              const isExpanded = expandedLogId === log.id;
              const hasDiff = !!(log.oldValue || log.newValue);

              return (
                <div
                  key={log.id}
                  id={`audit-row-${log.id}`}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] border ${getActionBadgeClass(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                        {log.module}
                      </span>
                      {log.recordTitle && (
                        <span className="font-bold text-slate-900 dark:text-white">
                          {log.recordTitle}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <strong className="text-slate-700 dark:text-slate-300">{log.userName}</strong> ({log.userRole})
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 font-normal leading-relaxed pt-1">
                    {log.details}
                  </p>

                  {/* Expand Diff button if old or new value is attached */}
                  {hasDiff && (
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" /> Hide Payload State Diff
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" /> Inspect Payload State Diff
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Expanded JSON diff panel */}
                  {isExpanded && hasDiff && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto space-y-2">
                      {log.oldValue && (
                        <div>
                          <div className="text-rose-400 font-bold mb-1">Previous State (Old):</div>
                          <pre className="text-xs text-rose-200/80">{JSON.stringify(log.oldValue, null, 2)}</pre>
                        </div>
                      )}
                      {log.newValue && (
                        <div className="pt-2 border-t border-slate-800">
                          <div className="text-emerald-400 font-bold mb-1">Committed State (New):</div>
                          <pre className="text-xs text-emerald-200/80">{JSON.stringify(log.newValue, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong>{filteredLogs.length}</strong> of <strong>{auditLogs.length}</strong> events
          </div>
          <button
            id="audit-modal-done-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
