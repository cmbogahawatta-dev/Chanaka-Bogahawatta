import { DailyReport, User, ReportStatus } from '../types/dailyReportTypes';
import { auditService } from './dailyReportAuditService';

export class WorkflowService {
  static canSubmit(report: DailyReport, user: User): boolean {
    if (report.isLocked) return false;
    return ['Supervisor', 'Site Admin'].includes(user.role) && 
           ['DRAFT', 'RETURNED'].includes(report.status);
  }

  static canEndorse(report: DailyReport, user: User): boolean {
    if (report.isLocked) return false;
    return ['Site Engineer', 'Site Admin'].includes(user.role) && 
           report.status === 'SUBMITTED';
  }

  static canApprove(report: DailyReport, user: User): boolean {
    if (report.isLocked) return false;
    return ['Project Manager', 'Site Admin'].includes(user.role) && 
           ['ENDORSED', 'SUBMITTED'].includes(report.status);
  }

  static canReturn(report: DailyReport, user: User): boolean {
    if (report.isLocked) return false;
    return ['Site Engineer', 'Project Manager', 'Site Admin'].includes(user.role) && 
           ['SUBMITTED', 'UNDER_REVIEW', 'ENDORSED'].includes(report.status);
  }

  static submitReport(report: DailyReport, user: User, notes?: string): DailyReport {
    const nowIso = new Date().toISOString();
    return {
      ...report,
      status: 'SUBMITTED',
      updatedAt: nowIso,
      auditTrail: auditService.append(
        report.auditTrail,
        'SUBMITTED',
        user.name,
        user.role,
        notes || `Submitted for Engineering Review (${report.revision || 'Rev 00'})`,
        { entityType: 'REPORT', entityId: report.id, userId: user.id || user.name }
      )
    };
  }

  static endorseReport(report: DailyReport, user: User, notes?: string): DailyReport {
    const nowIso = new Date().toISOString();
    return {
      ...report,
      status: 'ENDORSED',
      updatedAt: nowIso,
      siteEngineer: user.name,
      auditTrail: auditService.append(
        report.auditTrail,
        'ENDORSED',
        user.name,
        user.role,
        notes || 'Site Engineer Endorsement & Verification.',
        { entityType: 'REPORT', entityId: report.id, userId: user.id || user.name }
      )
    };
  }

  static approveAndLockReport(report: DailyReport, user: User, notes?: string): DailyReport {
    const nowIso = new Date().toISOString();
    return {
      ...report,
      status: 'APPROVED',
      isLocked: true,
      updatedAt: nowIso,
      projectManager: user.name,
      auditTrail: auditService.append(
        report.auditTrail,
        'APPROVED',
        user.name,
        user.role,
        notes || `Approved & Locked by Management (${report.revision || 'Rev 00'}).`,
        { entityType: 'REPORT', entityId: report.id, userId: user.id || user.name }
      )
    };
  }

  static returnReport(report: DailyReport, user: User, reason: string): DailyReport {
    const nowIso = new Date().toISOString();
    return {
      ...report,
      status: 'RETURNED',
      updatedAt: nowIso,
      auditTrail: auditService.append(
        report.auditTrail,
        'RETURNED',
        user.name,
        user.role,
        `Revision Instructions: ${reason}`,
        { entityType: 'REPORT', entityId: report.id, userId: user.id || user.name }
      )
    };
  }
}

export const workflowService = WorkflowService;
export type { ReportStatus };
