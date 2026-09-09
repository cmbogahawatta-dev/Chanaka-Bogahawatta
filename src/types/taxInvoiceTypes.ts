export type TaxInvoiceStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'ISSUED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'CANCELLED';

export type SequencePolicy = 'CONTINUOUS' | 'MONTHLY_RESET' | 'ANNUAL_RESET';

export interface InvoiceSupplyItem {
  id: string;
  itemNumber: number;
  description: string;
  unitOfMeasure?: string;
  quantity: number;
  unitPrice: number;
  taxableValue: number; // qty * unitPrice
  vatRate: number; // Default 18
  vatAmount: number; // taxableValue * (vatRate / 100)
  totalAmount: number; // taxableValue + vatAmount
}

export interface TaxInvoiceAuditEntry {
  id: string;
  timestamp: string;
  action:
    | 'CREATED'
    | 'UPDATED'
    | 'SUBMITTED'
    | 'APPROVED'
    | 'ISSUED'
    | 'PAYMENT_RECORDED'
    | 'PAYMENT_DELETED'
    | 'CANCELLED'
    | 'CREDIT_NOTE_CREATED'
    | 'QBO_SYNCED';
  performedBy: string;
  userRole?: string;
  notes?: string;
  previousStatus?: TaxInvoiceStatus;
  newStatus?: TaxInvoiceStatus;
}

export interface ClientPaymentRecord {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  projectCode: string;
  clientName: string;
  paymentDate: string;
  amountReceived: number;
  paymentMethod: 'Bank Transfer (NEFT)' | 'Bank Transfer (RTGS)' | 'Cheque' | 'Cash' | 'Letter of Credit';
  paymentReference: string;
  receiptNumber: string;
  bankAccount: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface PurchaserSnapshot {
  clientId?: string;
  clientCode?: string;
  organizationType?: string;
  legalName: string;
  tradeName?: string;
  tin: string;
  vatNumber?: string;
  svatNumber?: string;
  isVatRegistered: boolean;
  registeredAddress: string;
  billingAddress?: string;
  contactPerson?: string;
  contactDesignation?: string;
  contactDepartment?: string;
  phone?: string;
  email?: string;
  paymentTermsDays?: number;
  capturedAt: string; // ISO timestamp when snapshot was taken
}

export interface InvoiceBankDetails {
  bankAccountId?: string;
  accountName: string;
  bankName: string;
  branchName: string;
  accountNumber: string;
  swiftCode?: string;
  currency?: string;
  purpose?: string;
  isPrimary?: boolean;
}

export interface TaxInvoice {
  id: string;
  serialNumber: string; // YYMMM_QQQQ_XXXXX (Permanent once issued) or PREVIEW_...
  isDraft: boolean;
  status: TaxInvoiceStatus;

  // Client Master Link & Immutable Historical Snapshot
  clientId?: string;
  purchaserSnapshot?: PurchaserSnapshot;

  // Settlement Bank Details (Selected from Registered Bank Accounts)
  bankAccountId?: string;
  settlementBankDetails?: InvoiceBankDetails;

  // Key Dates
  invoiceDate: string; // YYYY-MM-DD - Controls the YY and MMM in serial number
  supplyDate?: string; // Date of supply / service period
  dueDate: string;

  // Supplier Details (Apex Global Logistics / EMA Construction)
  supplierName: string;
  supplierTin: string;
  supplierVatNumber: string;
  supplierAddress: string;
  supplierContact: string;

  // Purchaser Details (Must be verified registered person)
  purchaserName: string;
  purchaserTin: string;
  purchaserVatNumber?: string;
  purchaserAddress: string;
  purchaserContactPerson?: string;
  purchaserPhone?: string;
  purchaserEmail?: string;

  // Project & IPC Association
  projectCode: string;
  projectName: string;
  ipcNumber?: string; // Interim Payment Certificate / Milestone reference
  contractNumber?: string;
  purchaseOrderRef?: string;
  billingDescription?: string;

  // Goods/Services Description & Line Items
  lineItems: InvoiceSupplyItem[];

  // Financial Summaries (All VAT @ 18% standard rate)
  currency: string; // 'LKR'
  totalTaxableValue: number; // Total value of taxable supply excluding VAT
  vatRate: number; // Standard 18%
  vatAmount: number; // Value Added Tax charged
  totalConsideration: number; // Total consideration (Taxable + VAT)
  amountInWords: string; // e.g. "Sri Lankan Rupees ... Only"

  // Construction Billing Deductions (Retention, Advance Recovery, etc.)
  retentionRate?: number; // e.g. 5 or 10%
  retentionAmount?: number; // amount withheld as retention
  advanceRecovery?: number; // mobilization advance deduction
  otherDeductions?: number; // other contractual deductions
  netPayable?: number; // Total consideration minus deductions
  proofDocument?: string; // base64 or file URL
  proofDocumentName?: string;
  legacyIncomeId?: string;

  // Settlement & Balances
  amountReceived: number;
  balanceDue: number;
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid';

  // Compliance & Credit Note Flags
  isCreditNote?: boolean;
  originalInvoiceId?: string;
  originalInvoiceNumber?: string;
  creditReason?: string;

  isCancelled?: boolean;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;

  // Gazette 18-Point Compliance Flags
  isGazetteCompliant: boolean;
  complianceNotes?: string[];

  // QuickBooks Integration
  qbo?: {
    status: 'Synced' | 'Pending' | 'Failed';
    qboInvoiceId?: string;
    lastSyncedAt?: string;
    syncError?: string;
  };

  // Workflow Sign-offs
  preparedBy: string;
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  issuedBy?: string;
  issuedAt?: string;

  // Immutability Audit Trail
  auditTrail: TaxInvoiceAuditEntry[];

  notes?: string;
  termsAndConditions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxInvoiceSettings {
  entityCode: string; // QQQQ (e.g. 'EMA', up to 10 alphanumeric chars)
  currentSequence: number; // XXXXX (e.g. 1 -> '00001')
  standardVatRate: number; // 18%
  sequencePolicy: SequencePolicy;
  recommencePolicyNotes: string;
  companyName: string;
  companyTin: string;
  companyVatNumber: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  defaultPaymentTerms: string;
  defaultBankDetails: string;
  autoSyncPettyCashInvoices?: boolean; // Controls whether project invoices from Petty Cash income ledger automatically re-sync into the Tax Invoice register
}

export interface ComplianceTestResult {
  testId: string;
  testName: string;
  description: string;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
}
