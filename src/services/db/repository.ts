import {
  Enterprise,
  EnterpriseUser,
  Vehicle,
  Driver,
  RunningChartEntry,
  FuelRecord,
  ServiceSchedule,
  MaintenanceLog,
  VehicleTransfer,
  AuditLogEntry
} from '../../types';
import { AuditService } from '../audit/auditService';

/**
 * Multi-Tenant Data Repository
 * 
 * Provides an enterprise-isolated interface for querying, inserting, updating,
 * and deleting fleet assets and records. Automatically enriches records with
 * enterpriseId, validates tenant integrity, and triggers audit logging on mutations.
 */

export class FleetRepository {
  /**
   * Enforces tenant integrity by validating that the entity belongs to the requested enterpriseId
   */
  public static validateTenantAccess<T extends { enterpriseId?: string }>(
    entity: T,
    enterpriseId: string
  ): boolean {
    const entityEnterpriseId = entity.enterpriseId || 'ent-apex';
    return entityEnterpriseId === enterpriseId;
  }

  /**
   * Filters any array of items strictly by enterpriseId
   */
  public static filterByTenant<T extends { enterpriseId?: string }>(
    items: T[],
    enterpriseId: string
  ): T[] {
    return items.filter(item => (item.enterpriseId || 'ent-apex') === enterpriseId);
  }

  /**
   * Helper to execute audited mutation
   */
  public static executeAuditedAction<T>(params: {
    enterpriseId: string;
    userId: string;
    userName: string;
    userRole: any;
    action: any;
    module: any;
    recordId: string;
    recordTitle?: string;
    details: string;
    oldValue?: any;
    newValue?: any;
    mutationFn: () => T;
  }): T {
    const result = params.mutationFn();

    // Fire audit log asynchronously
    try {
      AuditService.log({
        enterpriseId: params.enterpriseId,
        userId: params.userId,
        userName: params.userName,
        userRole: params.userRole,
        action: params.action,
        module: params.module,
        recordId: params.recordId,
        recordTitle: params.recordTitle,
        details: params.details,
        oldValue: params.oldValue,
        newValue: params.newValue
      });
    } catch (err) {
      console.warn('Audit logging failed silently:', err);
    }

    return result;
  }
}
