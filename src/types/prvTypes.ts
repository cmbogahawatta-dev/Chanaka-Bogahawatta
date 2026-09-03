export type PRVStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ACCOUNTS_L1_APPROVED'
  | 'ACCOUNTS_L1_REJECTED'
  | 'ACCOUNTS_L1_RETURNED'
  | 'ACCOUNTS_L2_APPROVED'
  | 'ACCOUNTS_L2_REJECTED'
  | 'ACCOUNTS_L2_RETURNED'
  | 'OWNER_APPROVED'
  | 'OWNER_REJECTED'
  | 'OWNER_RETURNED'
  | 'PAYMENT_PROOF_PENDING'
  | 'PAID'
  | 'CANCELLED';

export type PRVPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type PayeeType = 'Supplier' | 'Employee' | 'Contractor' | 'Other';

export type PRVPaymentMethod =
  | 'Bank Transfer'
  | 'Cash'
  | 'Cheque'
  | 'Card'
  | 'Online Payment'
  | 'Other';

export type PaymentSource =
  | 'Petty Cash'
  | 'Bank Account'
  | 'Company Credit Card'
  | 'Owner Payment'
  | 'Direct Bank Transfer'
  | 'Cash'
  | 'Cheque'
  | 'Other';

export type CurrencyCode = 'LKR' | 'AED' | 'USD' | 'EUR' | 'GBP' | 'SAR' | 'QAR';

export type PRVSubMenu =
  | 'vouchers'
  | 'project_invoices'
  | 'client_payments'
  | 'my_requests'
  | 'pending_approvals'
  | 'payment_approvals'
  | 'completed_payments'
  | 'proof_documents'
  | 'project_expenses'
  | 'dashboard';

export type ApprovalLevel = 'ACCOUNTS_L1' | 'ACCOUNTS_L2' | 'OWNER';

export interface PaymentRequestAttachment {
  id: string;
  name: string;
  documentType:
    | 'Quotation'
    | 'Invoice'
    | 'Purchase Order'
    | 'Supplier statement'
    | 'Delivery note'
    | 'Contract'
    | 'Approval letter'
    | 'Other';
  fileType: string;
  fileData: string; // Base64 data URL or external URL
  fileSizeKb: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface PaymentApprovalRecord {
  id: string;
  paymentRequestId: string;
  approvalLevel: ApprovalLevel;
  approverId: string;
  approverName: string;
  approverRole: string;
  action: 'APPROVE' | 'REJECT' | 'RETURN';
  comment: string;
  approvedAt: string;
  deviceInfo?: string;
  ipAddress?: string;
}

export interface PaymentProofDocument {
  id: string;
  proofNumber: string; // e.g. "PRV-2026-00045-PAYMENT-PROOF-01.pdf"
  paymentRequestId: string;
  paymentTransactionId?: string;
  prvNumber: string;
  paymentDate: string;
  paymentAmount: number;
  currency: CurrencyCode;
  paymentReference: string;
  paymentMethod: PRVPaymentMethod | string;
  paymentSource: PaymentSource | string;
  bankAccount?: string;
  documentType:
    | 'Bank Transfer Confirmation'
    | 'Payment Receipt'
    | 'Cheque'
    | 'Cash Voucher'
    | 'Online Banking Confirmation'
    | 'Other';
  file: string; // Base64 or image data
  fileName: string;
  fileType: string;
  capturedMethod: 'CAMERA_SCAN' | 'UPLOAD';
  capturedBy: string;
  capturedAt: string;
  notes?: string;
  pagesCount?: number;
}

export interface PaymentTransaction {
  id: string;
  paymentRequestId: string;
  prvNumber: string;
  paymentDate: string;
  paymentMethod: PRVPaymentMethod | string;
  paymentSource: PaymentSource | string;
  bankAccount: string;
  paymentReference: string;
  amount: number;
  currency: CurrencyCode;
  status: 'PENDING_PROOF' | 'COMPLETED';
  paidBy: string;
  completedAt?: string;
  linkedExpenseId?: string;
  proofs: PaymentProofDocument[];
}

export interface PRVAuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action:
    | 'PRV Created'
    | 'PRV Submitted'
    | 'Accounts L1 Approved'
    | 'Accounts L1 Rejected'
    | 'Accounts L1 Returned'
    | 'Accounts L2 Approved'
    | 'Accounts L2 Rejected'
    | 'Accounts L2 Returned'
    | 'Owner Approved'
    | 'Owner Rejected'
    | 'Owner Returned'
    | 'Payment Proof Uploaded'
    | 'Payment Completed'
    | 'Project Expense Created'
    | 'PRV Cancelled';
  prevStatus?: PRVStatus;
  newStatus: PRVStatus;
  comment?: string;
  details?: string;
}

export interface PaymentRequestVoucher {
  id: string;
  prvNumber: string; // e.g. "PRV-2026-00001"
  requestDate: string; // ISO format "YYYY-MM-DD"
  requestedBy: string;
  requestedByEmail?: string;
  department: string;
  projectId: string;
  projectCode: string; // e.g. "PIDM 26"
  costCentre: string;
  expenseCategoryId: string;
  expenseCategory: string; // e.g. "Plant & Equipment"
  purpose: string;
  description: string;
  requiredDate: string;
  priority: PRVPriority;
  
  // Payee & Banking Information
  payeeName: string;
  payeeType: PayeeType;
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban?: string;
  swiftCode?: string;
  paymentMethod: PRVPaymentMethod;
  paymentSource?: PaymentSource;
  
  // Financial amounts
  amount: number;
  currency: CurrencyCode;
  vatRate?: number;
  vatAmount?: number;
  totalAmount: number;
  paymentReference?: string;
  
  // State machine & tracking
  status: PRVStatus;
  attachments: PaymentRequestAttachment[];
  approvals: PaymentApprovalRecord[];
  transaction?: PaymentTransaction;
  linkedExpenseId?: string;
  auditTrail: PRVAuditEntry[];
  
  createdAt: string;
  updatedAt: string;
}

export interface PRVFilterState {
  searchQuery: string;
  project: string;
  requestedBy: string;
  status: string;
  priority: string;
  paymentMethod: string;
  paymentSource: string;
  expenseCategory: string;
  currency: string;
  dateFrom: string;
  dateTo: string;
  approvalLevel: string;
  payee: string;
  sortBy: 'date' | 'amount' | 'project' | 'status' | 'ageing';
  sortOrder: 'asc' | 'desc';
}
