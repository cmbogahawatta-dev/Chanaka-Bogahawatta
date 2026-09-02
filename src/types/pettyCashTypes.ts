export type PaymentStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Paid' | 'Reimbursed';

export type PettyCashNavTab =
  | 'master-dashboard'
  | 'dashboard'
  | 'add-expense'
  | 'expenses'
  | 'add-income'
  | 'income'
  | 'petty-cash'
  | 'projects'
  | 'supervisors'
  | 'categories'
  | 'reports'
  | 'documents'
  | 'admin-import'
  | 'settings';

export type IncomeSource = 
  | 'Petty Cash Top-up' 
  | 'Client Payment' 
  | 'Advance' 
  | 'Reimbursement' 
  | 'Other Income' 
  | 'Internal Transfer';

export type TransactionType =
  | 'PETTY_CASH_EXPENSE'
  | 'COMPANY_EXPENSE'
  | 'RECOVERABLE_EXPENSE'
  | 'PERSONAL_EXPENSE'
  | 'LOAN_REPAYMENT'
  | 'PETTY_CASH_TOPUP'
  | 'CLIENT_INCOME'
  | 'INTERNAL_TRANSFER'
  | 'REIMBURSEMENT_SETTLEMENT';

export type PettyCashUserRole = 'ADMIN' | 'FINANCE' | 'SUPERVISOR' | 'VIEWER';

export interface Expense {
  id: string; // Internal unique ID
  EXPENSES_ID: string; // e.g. "EXP-202608-0104"
  DATE_REF: string; // ISO date format "YYYY-MM-DD"
  DATE: string; // Display date "DD/MM/YYYY"
  SUPERVISOR: string; // FK to SUPERVISORS.SUPERVISOR_NAME or Employee name
  SUPERVISOR_ID?: string; // FK to Employee ID (Staff Directory) or legacy supervisor ID
  PROJECT: string; // FK to PROJECTS.PROJECT_CODE
  EXPENSES_CATEGORY: string; // FK to EXPENSE_CATEGORIES.CATEGORY_NAME
  TRANSACTION_TYPE: TransactionType;
  AMOUNT: number; // LKR Value (positive)
  EXPENSES_DESCRIPTION: string;
  PAYMENT_STATUS: PaymentStatus;
  PROOF_DOCUMENT?: string; // URL, Base64 image, or Google Drive link
  PROOF_DOCUMENT_NAME?: string;
  CREATED_BY: string; // User email / display name
  CREATED_DATE: string; // Timestamp
  UPDATED_DATE?: string;
  APPROVED_BY?: string;
  APPROVED_DATE?: string;
  REMARKS?: string;
  REJECTION_REASON?: string;

  // PRV Payment & Source Integration Extensions
  PRV_NUMBER?: string; // e.g. "PRV-2026-00045"
  PAYMENT_REQUEST_ID?: string; // FK to payment_requests.id
  PAYMENT_TRANSACTION_ID?: string; // FK to payment_transactions.id
  PAYMENT_SOURCE?: string; // e.g. "Direct Bank Transfer", "Petty Cash", "Company Credit Card", "Owner Payment"
  BANK_ACCOUNT?: string; // e.g. "EMA Main Account - BOC 77482"
  PAYMENT_REFERENCE?: string; // e.g. "TXN-928374"
  PAID_BY?: string; // User who completed payment
  CURRENCY?: string; // e.g. "AED", "LKR", "USD"
  PAYEE?: string;

  // Historical Import Metadata
  DATA_SOURCE?: 'HISTORICAL_IMPORT' | 'SYSTEM_ORIGINAL' | string;
  IMPORT_BATCH_ID?: string;
  IMPORTED_BY?: string;
  IMPORTED_AT?: string;
  IS_HISTORICAL?: boolean;
}

export interface Income {
  id: string;
  INCOME_ID: string; // e.g. "INC-202608-0042"
  DATE_REF: string;
  DATE: string;
  SUPERVISOR: string; // FK to SUPERVISORS.SUPERVISOR_NAME or Employee name
  SUPERVISOR_ID?: string; // FK to Employee ID (Staff Directory) or legacy supervisor ID
  PROJECT: string;
  INCOME_SOURCE: IncomeSource;
  TRANSACTION_TYPE: TransactionType;
  AMOUNT: number; // LKR Value
  PROOF_DOCUMENT?: string;
  PROOF_DOCUMENT_NAME?: string;
  CREATED_BY: string;
  CREATED_DATE: string;
  REMARKS?: string;
}

export interface PettyCashAllocation {
  employeeId: string;
  supervisorName?: string;
  openingBalance: number;
  currentBalance?: number;
}

export interface Supervisor {
  id: string;
  SUPERVISOR_ID: string; // e.g. "SUP-001" or employee code
  legacySupervisorId?: string; // Preserved legacy supervisor ID
  SUPERVISOR_NAME: string; // e.g. "BUDDIKA"
  FULL_NAME?: string;
  PHONE: string;
  EMAIL: string;
  ACTIVE: boolean;
  OPENING_PETTY_CASH: number; // LKR
  CURRENT_BALANCE: number; // Calculated dynamic balance
  REMARKS?: string;
  DEFAULT_PROJECT?: string;
  ASSIGNED_PROJECTS?: string[];
  AVATAR_COLOR?: string;

  // Staff Directory master link
  staffId?: string;
  employeeCode?: string;
  role?: string;
  department?: string;
  designation?: string;

  // Historical Import Metadata
  DATA_SOURCE?: 'HISTORICAL_IMPORT' | 'SYSTEM_ORIGINAL' | string;
  IMPORT_BATCH_ID?: string;
  IMPORTED_BY?: string;
  IMPORTED_AT?: string;
  IS_HISTORICAL?: boolean;
}

export interface Project {
  id: string;
  PROJECT_ID: string; // e.g. "PRJ-001"
  PROJECT_CODE: string; // e.g. "PIDM 26"
  PROJECT_NAME: string;
  CLIENT?: string;
  CLIENT_NAME?: string;
  LOCATION: string;
  CONTRACT_VALUE?: number; // LKR
  START_DATE?: string;
  END_DATE?: string;
  STATUS: 'Active' | 'On Hold' | 'Completed' | 'Closed';
  PROJECT_MANAGER?: string;
  REMARKS?: string;
  BUDGET_PETTY_CASH?: number;
  BUDGET?: number; // Alias for budget
  budget?: number; // Lowercase alias


  // Historical Import Metadata
  DATA_SOURCE?: 'HISTORICAL_IMPORT' | 'SYSTEM_ORIGINAL' | string;
  IMPORT_BATCH_ID?: string;
  IMPORTED_BY?: string;
  IMPORTED_AT?: string;
  IS_HISTORICAL?: boolean;
}

export type BudgetThresholdLevel = 'NORMAL' | 'WARNING_80' | 'CRITICAL_95' | 'OVER_BUDGET';

export interface ProjectBudgetAlert {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  allocatedBudget: number;
  spentAmount: number;
  pendingAmount: number;
  totalCommitted: number;
  remainingBudget: number;
  utilizationPercentage: number;
  thresholdLevel: 'WARNING_80' | 'CRITICAL_95' | 'OVER_BUDGET';
  thresholdPercent: 80 | 95 | 100;
  severity: 'warning' | 'critical' | 'danger';
  message: string;
  assignedSupervisors: string[];
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  timestamp: string;
}

export interface ProjectBudgetSummary {
  projectId: string;
  projectCode: string;
  projectName: string;
  client?: string;
  status: string;
  allocatedBudget: number;
  approvedSpent: number;
  pendingSpent: number;
  totalCommitted: number;
  remainingBudget: number;
  utilizationPercentage: number;
  thresholdLevel: BudgetThresholdLevel;
  assignedSupervisors: string[];
  alert?: ProjectBudgetAlert;
}

export interface ExpenseCategory {
  id: string;
  CATEGORY_ID: string;
  CATEGORY_CODE: string; // e.g. "5000"
  CATEGORY_NAME: string; // e.g. "5000 Construction Materials"
  CATEGORY_GROUP: 'Direct Project Cost' | 'Site Overheads' | 'Admin & Head Office' | 'Special / Non-Project';
  ACTIVE: boolean;
  REMARKS?: string;
}

export interface InternalTransfer {
  id: string;
  TRANSFER_ID: string; // e.g. "TRF-202608-001"
  DATE: string;
  DATE_REF: string;
  FROM_SUPERVISOR: string;
  TO_SUPERVISOR: string;
  AMOUNT: number; // LKR
  STATUS: 'Completed' | 'Pending' | 'Cancelled';
  REMARKS: string;
  CREATED_BY: string;
  CREATED_DATE: string;
}

export interface PettyCashFilterState {
  dateFrom: string;
  dateTo: string;
  project: string; // 'ALL' or specific project code
  supervisor: string; // 'ALL' or specific supervisor name
  category: string; // 'ALL' or specific category
  status: string; // 'ALL' or specific payment status
  searchQuery: string;
  transactionType: string; // 'ALL' or specific type
  dataSource: 'ALL' | 'SYSTEM' | 'HISTORICAL';
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  spreadsheetName: string;
  isConnected: boolean;
  lastSyncedAt: string;
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
  sheetExpensesName: string;
  sheetIncomeName: string;
  sheetSupervisorsName: string;
  sheetProjectsName: string;
  sheetCategoriesName: string;
  sheetTransfersName: string;
}

export interface PettyCashStatementRow {
  date: string;
  dateRef: string;
  transactionId: string;
  description: string;
  project: string;
  type: 'OPENING' | 'INCOME' | 'EXPENSE' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  incomeAmount: number;
  expenseAmount: number;
  runningBalance: number;
  status: PaymentStatus | 'Completed';
  proofUrl?: string;
  remarks?: string;
}

// ----------------------------------------------------
// Admin Data Import & Migration Types
// ----------------------------------------------------

export type ImportType = 
  | 'HISTORICAL_EXPENSES' 
  | 'PROJECT_DIRECTORY' 
  | 'SUPERVISOR_DIRECTORY'
  | 'HISTORICAL_INCOME';

export type DuplicateAction = 'SKIP' | 'UPDATE' | 'IMPORT_AS_NEW' | 'CANCEL';

export interface ImportErrorDetail {
  row: number;
  field: string;
  value: any;
  error: string;
  severity: 'ERROR' | 'WARNING' | 'DUPLICATE';
  resolved?: boolean;
  ignored?: boolean;
  correctedValue?: any;
}

export interface ImportBatchRecord {
  id: string; // e.g. "IMP-20260829-0007"
  batchNumber: string;
  importType: ImportType;
  fileName: string;
  fileSize: string;
  totalRows: number;
  importedRows: number;
  updatedRows: number;
  skippedRows: number;
  failedRows: number;
  duplicateRows: number;
  status: 'COMPLETED' | 'COMPLETED_WITH_WARNINGS' | 'FAILED' | 'ROLLED_BACK';
  performedBy: string;
  userRole: string;
  timestamp: string;
  errorDetails?: ImportErrorDetail[];
  createdRecordIds?: {
    expenses?: string[];
    projects?: string[];
    supervisors?: string[];
    income?: string[];
  };
  previousSnapshot?: {
    updatedExpenses?: Expense[];
    updatedProjects?: Project[];
    updatedSupervisors?: Supervisor[];
    updatedIncome?: Income[];
  };
  rollbackTimestamp?: string;
  rollbackBy?: string;
}

export interface MappingTemplate {
  id: string;
  name: string;
  importType: ImportType;
  mappings: Record<string, string>; // Target Field Key -> Source File Column Name
  createdAt: string;
}

