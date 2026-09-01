import { SalaryComponent } from './salaryHistoryTypes';

export type PayrollBatchStatus =
  | 'DRAFT'
  | 'HR_REVIEW'
  | 'ACCOUNTS_REVIEW'
  | 'OWNER_PENDING'
  | 'APPROVED'
  | 'PAYMENT_PROCESSING'
  | 'PAID'
  | 'LOCKED';

export interface PayrollEmployeeLine {
  id: string;
  batchId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  designation: string;
  department: string;
  projectId: string;
  allocationId: string;

  // Attendance & Time Stats
  presentDays: number;
  absentDays: number;
  approvedPaidLeaveDays: number;
  noPayLeaveDays: number;
  approvedOtHours: number;

  // Financial Breakdown
  basicSalary: number;
  earnings: SalaryComponent[];
  deductions: SalaryComponent[];
  grossSalary: number;
  netSalary: number;

  // Employer Contributions (reference only)
  employerEpf: number;
  employerEtf: number;
  totalEmployerCost: number;

  // Status & Validation
  exceptions: string[];
  eligibleForBulkApproval: boolean;
  status: 'DRAFT' | 'APPROVED' | 'REJECTED' | 'HOLD';
  holdReason?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface PayrollBatch {
  id: string;
  batchId: string;                      // "PAY-2026-08"
  payrollMonth: string;                 // "2026-08"
  status: PayrollBatchStatus;
  lines: PayrollEmployeeLine[];

  totalEmployees: number;
  readyEmployees: number;
  exceptionEmployees: number;

  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  totalEmployerEpf: number;
  totalEmployerEtf: number;
  totalEmployerCost: number;

  createdAt: string;
  preparedBy: string;
  hrReviewedBy?: string;
  hrReviewedAt?: string;
  accountsReviewedBy?: string;
  accountsReviewedAt?: string;
  ownerApprovedBy?: string;
  ownerApprovedAt?: string;
  lockedAt?: string;
  lockedBy?: string;
}

export interface PayrollApprovalRecord {
  id: string;
  batchId: string;
  employeeId: string;
  netSalary: number;
  approvedBy: string;
  approvalLevel: string;                // e.g. "OWNER_BULK", "OWNER_INDIVIDUAL", "HR_PREPARATION", "FINANCE_VERIFICATION"
  approvedAt: string;
  bulkActionId?: string;                // Links individual records created in a single bulk action
  remarks?: string;
}

export interface ValidationIssue {
  code: string;
  message: string;
  isBlocking: boolean;                  // If true, marked as ERROR; otherwise WARNING
}

export interface PayrollValidationResult {
  employeeId: string;
  employeeName: string;
  severity: 'READY' | 'WARNING' | 'ERROR';
  issues: ValidationIssue[];
}

export interface ProjectLabourCostReport {
  projectId: string;
  projectName: string;
  payrollMonth: string;
  headcount: number;
  totalGrossWage: number;
  totalEmployerEpf: number;
  totalEmployerEtf: number;
  totalLabourCost: number;
  departmentBreakdown: Record<string, number>;
  roleBreakdown: Record<string, number>;
}
