export type InvoiceStatus = 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CURRENT';
export type BillStatus = 'PAID' | 'PARTIAL' | 'OVERDUE' | 'DUE_SOON' | 'CURRENT';

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number; // LKR
  referenceNumber?: string;
  paymentMethod: 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE_SLIP' | 'CASH';
  bankAccount?: string;
  notes?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface ReceivableInvoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-2026-081"
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  amount: number; // Total Invoiced amount in LKR
  paid: number; // Total collected so far
  outstanding: number; // amount - paid
  overdueDays: number; // Computed days past due date (positive = overdue, negative/0 = not overdue)
  client: string; // e.g. "Road Development Authority (RDA)"
  project: string; // e.g. "PIDM 26" or "Peliyagoda Logistics Park"
  status: InvoiceStatus;
  workOrderOrContract?: string;
  linkedTaxInvoiceId?: string;
  linkedIncomeId?: string;
  sourceModule?: 'MANUAL' | 'PROJECT_INCOME' | 'TAX_INVOICE';
  paymentHistory: PaymentRecord[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayableBill {
  id: string;
  supplier: string; // e.g. "Tokyo Super Cement Ltd"
  supplierId?: string;
  poNumber: string; // e.g. "PO-2026-042"
  grnNumber: string; // e.g. "GRN-2026-018"
  invoiceNumber: string; // Supplier Bill / Invoice # e.g. "SUP-INV-9921"
  billDate?: string;
  dueDate: string; // YYYY-MM-DD
  amount: number; // Total payable bill in LKR
  paid: number; // Disbursed amount to date
  outstanding: number; // amount - paid
  overdueDays: number; // Computed days past due date
  project?: string;
  status: BillStatus;
  linkedSupplierInvoiceId?: string;
  linkedProcurementOrderId?: string;
  linkedGrnId?: string;
  linkedPrvId?: string;
  prvNumber?: string;
  prvStatus?: string;
  sourceModule?: 'MANUAL' | 'PROCUREMENT' | 'PRV';
  paymentHistory: PaymentRecord[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgingBucket {
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90Plus: number;
}

export interface ReceivablesPayablesDashboardMetrics {
  totalReceivable: number; // Target: 25.4M
  totalReceivableInvoiced: number;
  totalReceivablePaid: number;
  receivableOverdueAmount: number;
  receivableOverdueCount: number;

  totalPayable: number; // Target: 17.8M
  totalPayableBilled: number;
  totalPayablePaid: number;
  payableOverdueAmount: number;
  payableOverdueCount: number;

  netPosition: number; // Target: 7.6M (Receivable - Payable)

  receivableAging: AgingBucket;
  payableAging: AgingBucket;
}
