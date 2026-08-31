import { AuditLog, UserRole } from '../types/dailyReportTypes';

export class AuditService {
  static createEntry(
    action: AuditLog['action'],
    performedBy: string,
    userRole: UserRole,
    remarks?: string,
    options?: {
      entityType?: 'REPORT' | 'PROJECT' | 'USER';
      entityId?: string;
      userId?: string;
      before?: unknown;
      after?: unknown;
      metadata?: Record<string, any>;
    }
  ): AuditLog {
    return {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      entityType: options?.entityType || 'REPORT',
      entityId: options?.entityId || 'REP-ACTIVE',
      action,
      userId: options?.userId || performedBy,
      role: userRole,
      timestamp: new Date().toISOString(),
      remarks: remarks || undefined,
      before: options?.before,
      after: options?.after,
      performedBy,
      userRole,
      notes: remarks || undefined
    };
  }

  static append(
    existingTrail: AuditLog[] | undefined,
    action: AuditLog['action'],
    performedBy: string,
    userRole: UserRole,
    remarks?: string,
    options?: {
      entityType?: 'REPORT' | 'PROJECT' | 'USER';
      entityId?: string;
      userId?: string;
      before?: unknown;
      after?: unknown;
      metadata?: Record<string, any>;
    }
  ): AuditLog[] {
    const entry = this.createEntry(action, performedBy, userRole, remarks, options);
    return [...(existingTrail || []), entry];
  }
}

export const auditService = AuditService;
