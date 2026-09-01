import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Trash2,
  Download,
  Clock,
  User,
  AlertTriangle,
  FileText,
  RefreshCw,
  Lock,
  CheckCircle2,
  XCircle,
  Slash
} from 'lucide-react';
import { adminSecurityService, SecurityAuditEvent } from '../../services/adminSecurityService';
import { AdminSecurityConfirmationModal } from '../common/AdminSecurityConfirmationModal';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<SecurityAuditEvent[]>(() => adminSecurityService.getAuditLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED' | 'BLOCKED'>('ALL');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const reloadLogs = () => {
    setLogs(adminSecurityService.getAuditLogs());
  };

  useEffect(() => {
    reloadLogs();
    const interval = setInterval(reloadLogs, 4000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    if (statusFilter !== 'ALL' && log.result !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const actionMatch = log.action.toLowerCase().includes(q);
      const userMatch = (log.userName || '').toLowerCase().includes(q);
      const detailsMatch = (log.reason || '').toLowerCase().includes(q);
      const targetMatch = (log.targetRecord || '').toLowerCase().includes(q);
      return actionMatch || userMatch || detailsMatch || targetMatch;
    }
    return true;
  });

  const handleExportJSON = () => {
    // Sanitize logs before export to guarantee no raw secrets
    const sanitized = logs.map(l => ({
      id: l.id,
      timestamp: l.timestamp,
      action: l.action,
      result: l.result,
      userName: l.userName,
      userRole: l.userRole,
      targetRecord: l.targetRecord,
      reason: l.reason
    }));

    const blob = new Blob([JSON.stringify(sanitized, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-audit-trail-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = async () => {
    // Verified by confirmation modal
    adminSecurityService.clearAuditLogs({ name: 'Admin', role: 'ADMIN' });
    reloadLogs();
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div id="admin-audit-log-view" className="space-y-4">
      {/* Header Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                Security & Administrative Audit Log Trail
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                {logs.length} events logged
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable chronological records of authentication, security-key validations, history resets, and administrative policy updates with sensitive data masking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={reloadLogs}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh Audit Trail"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export Trail</span>
          </button>

          <button
            type="button"
            onClick={() => setIsClearModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Logs</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit actions, user, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs self-start sm:self-center">
          {(['ALL', 'SUCCESS', 'FAILED', 'BLOCKED'] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Entries List */}
      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-bold text-slate-300">No matching audit events</p>
            <p className="text-xs text-slate-500">Security event records will appear here as users perform elevated actions.</p>
          </div>
        ) : (
          filteredLogs.map(log => (
            <div
              key={log.id}
              className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                    log.result === 'SUCCESS'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : log.result === 'FAILED'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {log.result === 'SUCCESS' && <CheckCircle2 className="w-4 h-4" />}
                  {log.result === 'FAILED' && <XCircle className="w-4 h-4" />}
                  {log.result === 'BLOCKED' && <Slash className="w-4 h-4" />}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-100">{log.action}</span>
                    {log.targetRecord && (
                      <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
                        {log.targetRecord}
                      </span>
                    )}
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                        log.result === 'SUCCESS'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : log.result === 'FAILED'
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : 'bg-amber-950 text-amber-300 border-amber-800'
                      }`}
                    >
                      {log.result}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {log.reason || 'Event executed without additional notes.'}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between text-[11px] text-slate-500 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 font-mono">
                <span className="text-slate-300 font-medium flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>{log.userName || 'System User'} ({log.userRole || 'Guest'})</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{formatTimestamp(log.timestamp)}</span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation Modal to Clear Logs */}
      <AdminSecurityConfirmationModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onAuthorized={handleClearLogs}
        actionTitle="Purge Audit Trail"
        actionDescription="This will permanently delete all logged security event records from local memory. This action requires elevated administrator authorization."
        severity="critical"
      />
    </div>
  );
};
