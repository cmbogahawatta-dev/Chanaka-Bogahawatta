export interface CompanyBankAccount {
  id: string;
  enterpriseId: string;
  bank: string;
  bankCode?: string;
  branch: string;
  branchCode?: string;
  branchAddress?: string;
  accountName: string;
  accountNumber: string; // masked in UI unless viewing permission granted
  accountType: 'Current' | 'Savings' | 'Fixed Deposit' | 'Loan' | 'Overdraft';
  currency: string; // e.g. LKR, USD, GBP, EUR
  swift?: string;
  iban?: string;
  openingDate?: string;
  closingDate?: string;
  status: 'Active' | 'Closed' | 'Dormant';
  isPrimary: boolean;
  purpose?: string; // e.g. "Operations", "Tax Collection", "Customs Escrow", "Project Retention"
  projectId?: string;
  glAccountCode?: string;
  qboAccountId?: string;
  responsiblePerson?: string;
  currentBalance?: number;
}

export interface BankAccountAuditEntry {
  id: string;
  bankAccountId: string;
  field: string;
  previousValue: string;
  newValue: string;
  userId: string;
  userName: string;
  timestamp: string;
  reason?: string;
  approvedBy?: string;
}

export interface BankStatement {
  id: string;
  bankAccountId: string;
  month: number; // 1-12
  year: number;  // e.g. 2025, 2026
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
  statementReference?: string;
  documentId?: string;
  documentFileName?: string;
  fileData?: string; // base64 or attachment reference
  uploadedBy: string;
  uploadedDate: string;
  verifiedBy?: string;
  status: 'Uploaded' | 'Missing' | 'Verified' | 'Superseded';
  reconciliationStatus: 'Not Started' | 'In Progress' | 'Reconciled' | 'Discrepancy';
  remarks?: string;
  supersedesStatementId?: string;
}

export interface BankReconciliationRecord {
  id: string;
  bankAccountId: string;
  statementId: string;
  month: number;
  year: number;
  statementBalance: number;
  bookBalance: number;
  difference: number;
  matchedCount: number;
  unmatchedCount: number;
  reconciledBy: string;
  reconciledDate: string;
  status: 'Reconciled' | 'Discrepancy' | 'In Progress';
  notes?: string;
}

export interface RegisteredBank {
  id: string;
  bankName: string;
  bankCode: string;
  shortName?: string;
  swiftCode?: string;
  category?: 'Licensed Commercial Bank' | 'Licensed Specialized Bank' | 'Foreign Bank' | 'Other';
  headOffice?: string;
  branches: string[];
  contactNumber?: string;
  website?: string;
  status: 'Active' | 'Inactive';
  notes?: string;
  createdAt?: string;
}

