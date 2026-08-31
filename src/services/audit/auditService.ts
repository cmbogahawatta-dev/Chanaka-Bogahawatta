import { AuditLogEntry, AuditLogAction, AuditLogModule, UserRole } from '../../types';

const AUDIT_STORAGE_KEY = 'fleettrack_audit_logs_v2';

export class AuditService {
  private static getStoredLogs(): AuditLogEntry[] {
    try {
      const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to load audit logs from storage:', e);
      return [];
    }
  }

  private static saveLogs(logs: AuditLogEntry[]): void {
    try {
      // Keep up to 2,000 most recent audit records in local cache
      const trimmed = logs.slice(0, 2000);
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to save audit logs to storage:', e);
    }
  }

  /**
   * Log an audit event
   */
  public static log(params: {
    enterpriseId: string;
    userId: string;
    userName: string;
    userRole: UserRole;
    action: AuditLogAction;
    module: AuditLogModule;
    recordId: string;
    recordTitle?: string;
    details: string;
    oldValue?: any;
    newValue?: any;
  }): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
      enterpriseId: params.enterpriseId,
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      action: params.action,
      module: params.module,
      recordId: params.recordId,
      recordTitle: params.recordTitle,
      details: params.details,
      oldValue: params.oldValue ? JSON.parse(JSON.stringify(params.oldValue)) : undefined,
      newValue: params.newValue ? JSON.parse(JSON.stringify(params.newValue)) : undefined,
      timestamp: new Date().toISOString(),
      deviceInfo: typeof navigator !== 'undefined' ? `${navigator.userAgent.slice(0, 80)}` : 'Client App'
    };

    const current = this.getStoredLogs();
    const updated = [entry, ...current];
    this.saveLogs(updated);

    return entry;
  }

  /**
   * Query audit logs for an enterprise with optional filtering
   */
  public static getLogs(params: {
    enterpriseId: string;
    module?: AuditLogModule;
    action?: AuditLogAction;
    userId?: string;
    searchQuery?: string;
    limit?: number;
  }): AuditLogEntry[] {
    let logs = this.getStoredLogs().filter(log => log.enterpriseId === params.enterpriseId);

    if (params.module) {
      logs = logs.filter(log => log.module === params.module);
    }

    if (params.action) {
      logs = logs.filter(log => log.action === params.action);
    }

    if (params.userId) {
      logs = logs.filter(log => log.userId === params.userId);
    }

    if (params.searchQuery && params.searchQuery.trim()) {
      const q = params.searchQuery.toLowerCase().trim();
      logs = logs.filter(
        log =>
          log.details.toLowerCase().includes(q) ||
          log.userName.toLowerCase().includes(q) ||
          (log.recordTitle && log.recordTitle.toLowerCase().includes(q)) ||
          log.recordId.toLowerCase().includes(q) ||
          log.module.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q)
      );
    }

    if (params.limit) {
      logs = logs.slice(0, params.limit);
    }

    return logs;
  }

  /**
   * Export audit trail as formatted JSON or CSV string
   */
  public static exportAuditTrail(enterpriseId: string, format: 'json' | 'csv' = 'json'): string {
    const logs = this.getLogs({ enterpriseId });

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    // CSV format
    const headers = ['Timestamp', 'Action', 'Module', 'User', 'Role', 'Record ID', 'Title', 'Details'];
    const rows = logs.map(log => [
      `"${log.timestamp}"`,
      `"${log.action}"`,
      `"${log.module}"`,
      `"${log.userName}"`,
      `"${log.userRole}"`,
      `"${log.recordId}"`,
      `"${log.recordTitle || ''}"`,
      `"${log.details.replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * Clear audit logs for an enterprise (Admin only with audit recording)
   */
  public static clearLogsForEnterprise(enterpriseId: string): void {
    const all = this.getStoredLogs();
    const remaining = all.filter(l => l.enterpriseId !== enterpriseId);
    this.saveLogs(remaining);
  }
}
