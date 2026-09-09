export type DataManagementModule =
  | 'STAFF'
  | 'PROJECTS'
  | 'Projects Directory'
  | 'VEHICLES'
  | 'DRIVERS'
  | 'SUPERVISORS'
  | 'EXPENSES'
  | 'PETTY_CASH'
  | 'INCOME'
  | 'Income & Replenishments'
  | 'PETTY_CASH_TRANSFERS'
  | 'PRV'
  | 'PRV & Disbursements'
  | 'PROCUREMENT'
  | 'Procurement (PO)'
  | 'PAYMENTS'
  | 'SITE_RECORDS'
  | 'Daily Site Records'
  | 'STAFF_ALLOCATIONS'
  | 'ATTENDANCE'
  | 'OVERTIME'
  | 'LEAVES'
  | 'LEAVE_TYPES'
  | 'SALARY_HISTORY'
  | 'PAYROLL'
  | 'RUNNING_CHARTS'
  | 'FUEL'
  | 'MAINTENANCE'
  | 'Fleet Maintenance'
  | 'FLEET_TRANSFERS'
  | 'DOCUMENTS'
  | 'Documents Vault'
  | 'GEOFENCES'
  | 'APPROVAL_WORKFLOWS'
  | 'EXPENSE_CATEGORIES'
  | 'CATEGORIES'
  | 'TAX_INVOICES'
  | 'Tax Invoices & Revenue'
  | 'CLIENT_PAYMENTS'
  | (string & {});

export type DeleteRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTED'
  | 'CANCELLED';

export type ImportRequestStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTED'
  | 'CANCELLED';

export interface DeleteDependencyItem {
  category: string;
  count: number;
  description: string;
  sampleIds?: string[];
}

export interface DeleteDependencyAnalysis {
  canHardDelete: boolean;
  totalDependencies: number;
  breakdown: DeleteDependencyItem[];
  suggestedAction: 'HARD_DELETE' | 'DEACTIVATE' | 'ARCHIVE' | 'END_ALLOCATION' | 'SUPERSEDE';
  warningMessage?: string;
}

export interface DeleteRequest {
  id: string;
  deleteRequestId: string; // e.g. DEL-2026-0001
  module: DataManagementModule;
  recordType: string; // e.g. "Project", "Vehicle", "Staff Member", "Driver"
  recordId: string;
  recordTitle: string;
  recordSummary?: Record<string, any>;
  requestedBy: {
    userId: string;
    userName: string;
    userRole: string;
  };
  requestedAt: string;
  reason: string;
  justificationType?: 'ERRONEOUS_ENTRY' | 'DUPLICATE' | 'CONTRACT_TERMINATION' | 'OBSOLETE' | 'DATA_CLEANUP' | 'OTHER';
  impactLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dependencyAnalysis: DeleteDependencyAnalysis;
  status: DeleteRequestStatus;
  
  // Review & Execution
  reviewedBy?: {
    userId: string;
    userName: string;
    userRole: string;
  };
  reviewedAt?: string;
  adminComment?: string;
  securityVerified?: boolean;
  executedBy?: {
    userId: string;
    userName: string;
    userRole: string;
  };
  executedAt?: string;
  executionActionTaken?: 'HARD_DELETED' | 'DEACTIVATED' | 'ARCHIVED' | 'ENDED';
}

export interface ImportValidationIssue {
  row: number;
  field: string;
  value: any;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

export interface ImportRequest {
  id: string;
  importRequestId: string; // e.g. IMP-2026-0001
  batchId: string;
  module: DataManagementModule;
  directoryType: string;
  fileName: string;
  fileSize?: number;
  totalRows: number;
  validRows: number;
  warningRows: number;
  duplicateRows: number;
  errorRows: number;
  dataPayload: any[];
  validationIssues: ImportValidationIssue[];
  status: ImportRequestStatus;
  requestedBy: {
    userId: string;
    userName: string;
    userRole: string;
  };
  requestedAt: string;
  notes?: string;
  
  // Execution tracking (Idempotency guarantee)
  reviewedBy?: {
    userId: string;
    userName: string;
    userRole: string;
  };
  reviewedAt?: string;
  adminComment?: string;
  executedBy?: {
    userId: string;
    userName: string;
    userRole: string;
  };
  executedAt?: string;
  importedCount?: number;
  executionSummary?: string;
}

export interface ApprovalControlRule {
  id: string;
  module: DataManagementModule;
  moduleLabel: string;
  category: 'MASTER_DATA' | 'TRANSACTION' | 'HR_PAYROLL' | 'FLEET' | 'FINANCE';
  requiresDeleteApproval: boolean;
  requiresSecurityPinForDelete: boolean;
  requiresImportApproval: boolean;
  allowHardDeleteWhenNoDependencies: boolean;
  allowDeactivateOption: boolean;
  minJustificationLength: number;
}
