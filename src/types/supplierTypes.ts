export type SupplierType =
  | 'Material Supplier'
  | 'Service Provider'
  | 'Subcontractor'
  | 'Equipment Supplier'
  | 'Plant Hire'
  | 'Consultant'
  | 'Professional Service'
  | 'Transport Supplier'
  | 'Fuel Supplier'
  | 'General Supplier'
  | 'Other';

export type SupplierStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Active'
  | 'Suspended'
  | 'Blocked'
  | 'Inactive';

export type SupplierApprovalStep =
  | 'Draft'
  | 'Submitted'
  | 'Reviewed'
  | 'Approved'
  | 'Active';

export type ContactDesignation =
  | 'Main'
  | 'Finance'
  | 'Sales'
  | 'Technical'
  | 'Site'
  | 'Procurement'
  | 'Managing Director'
  | 'Other';

export interface SupplierContact {
  id: string;
  name: string;
  designation: string;
  department?: string;
  telephone?: string;
  mobile: string;
  email: string;
  whatsApp?: string;
  notes?: string;
  contactType: ContactDesignation;
  isPrimary: boolean;
}

export interface SupplierBankAccount {
  id: string;
  accountName: string;
  bank: string;
  branch: string;
  accountNumber: string;
  swift?: string;
  iban?: string;
  currency: string;
  isDefault: boolean;
  verificationStatus: 'Pending' | 'Verified' | 'Rejected';
  verifiedBy?: string;
  verifiedDate?: string;
}

export type CreditPeriod =
  | 'Cash'
  | '7 Days'
  | '15 Days'
  | '30 Days'
  | '45 Days'
  | '60 Days'
  | 'Custom';

export interface SupplierCreditTerms {
  creditPeriod: CreditPeriod;
  customPeriodDays?: number;
  paymentTerms: string; // e.g. "Net 30 with 2% EPD"
  currency: string; // e.g. "LKR", "USD"
  creditLimit: number;
  advanceRequiredPercent: number; // e.g. 10%
  retentionPercent: number; // e.g. 5%
  earlyPaymentDiscountPercent: number; // e.g. 2%
  latePaymentTerms?: string; // e.g. "1.5% interest per month"
}

export type SupplierCategoryGroup =
  | 'Materials'
  | 'Services'
  | 'Subcontractors'
  | 'Equipment'
  | 'Other';

export interface SupplierCategory {
  id: string;
  name: string;
  group: SupplierCategoryGroup;
  description?: string;
  isActive: boolean;
  isCustom?: boolean;
}

export type SupplierDocumentType =
  | 'Business Registration'
  | 'TIN Certificate'
  | 'VAT Certificate'
  | 'Bank Confirmation'
  | 'Company Profile'
  | 'Insurance'
  | 'Licences'
  | 'Certifications'
  | 'Agreements'
  | 'Contracts'
  | 'Product Certificates'
  | 'Other';

export interface SupplierDocument {
  id: string;
  documentName: string;
  documentType: SupplierDocumentType;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  uploadedDate: string;
  uploadedBy: string;
  status: 'Valid' | 'Expiring Soon' | 'Expired';
  fileData?: string;
  fileName: string;
  fileSizeKb: number;
  notes?: string;
}

export type ContractStatus =
  | 'Draft'
  | 'Active'
  | 'Expired'
  | 'Terminated'
  | 'Completed';

export interface SupplierContract {
  id: string;
  contractNumber: string;
  contractTitle: string;
  title?: string;
  supplierId: string;
  supplierName: string;
  projectCode: string;
  startDate: string;
  endDate: string;
  contractValue: number;
  currency: string;
  scope: string;
  scopeDescription?: string;
  paymentTerms: string;
  retentionPercent: number;
  advancePercent: number;
  status: ContractStatus;
  attachmentName?: string;
  attachmentData?: string;
}

export type GRNStatus = 'Accepted' | 'Partial' | 'Rejected';

export interface GRNItem {
  id?: string;
  description: string;
  quantity?: number;
  orderedQuantity?: number;
  receivedQuantity?: number;
  acceptedQuantity?: number;
  rejectedQuantity?: number;
  unit: string;
  rejectionReason?: string;
}

export interface GoodsReceivedNote {
  id: string;
  grnNumber: string; // e.g. "GRN-202608-001"
  poId?: string;
  poNumber?: string;
  supplierId: string;
  supplierName: string;
  projectCode: string;
  deliveryDate: string;
  receivedBy: string;
  itemDescription?: string;
  orderedQuantity?: number;
  receivedQuantity?: number;
  acceptedQuantity?: number;
  rejectedQuantity?: number;
  unit?: string;
  deliveryNoteNumber?: string;
  vehicleNumber?: string;
  status: GRNStatus;
  remarks?: string;
  items?: GRNItem[];
  inspectionRemarks?: string;
  qualityInspectionRemarks?: string;
  deliveryNoteAttachmentName?: string;
  deliveryNoteAttachmentData?: string;
}

export type InvoiceStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Partially Paid'
  | 'Paid'
  | 'Rejected'
  | 'Cancelled';

export type SupplierInvoiceStatus = InvoiceStatus;

export interface SupplierInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
}

export interface SupplierInvoice {
  id: string;
  invoiceNumber: string; // Internal ref e.g. "SINV-2026-001"
  supplierInvoiceRef: string; // Vendor's official tax invoice number e.g. "INV-99214"
  poId?: string;
  poNumber?: string;
  grnNumber?: string;
  supplierId: string;
  supplierName: string;
  projectCode: string;
  invoiceDate: string;
  dueDate: string;
  grossAmount: number;
  subtotal?: number;
  vatAmount: number;
  discountAmount: number;
  retentionDeducted?: number;
  netAmount: number;
  currency: string;
  status: InvoiceStatus;
  paidAmount: number;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  remarks?: string;
  items?: SupplierInvoiceItem[];
  invoiceAttachmentName?: string;
  invoiceAttachmentData?: string;
  linkedPaymentVoucherId?: string;
  linkedPrvId?: string;
}

export type PerformanceRating =
  | 'Excellent'
  | 'Good'
  | 'Satisfactory'
  | 'Poor'
  | 'Critical';

export interface SupplierPerformanceScore {
  deliveryScore: number; // 0-100 (On-time delivery %)
  qualityScore: number; // 0-100 (Quality / rejection rate)
  priceScore: number; // 0-100 (Competitiveness)
  documentationScore: number; // 0-100 (Required documents accurate)
  paymentComplianceScore: number; // 0-100 (Invoice/billing accuracy)
  responsivenessScore: number; // 0-100 (Response time)
  overallScore: number; // 0-100 (Weighted calculated)
  rating: PerformanceRating;
  lastEvaluatedDate?: string;
  evaluationHistory?: any[];
  isOverridden?: boolean;
  overrideReason?: string;
  overriddenBy?: string;
}

export type SupplierEvaluation = {
  id?: string;
  supplierId?: string;
  evaluationDate: string;
  projectCode?: string;
  evaluator?: string;
  evaluatedBy?: string;
  evaluatorRole?: string;
  scores?: SupplierPerformanceScore;
  overallScore?: number;
  deliveryScore?: number;
  qualityScore?: number;
  priceScore?: number;
  documentationScore?: number;
  rating?: PerformanceRating | string;
  comments?: string;
  correctiveAction?: string;
  finalRating?: PerformanceRating | string;
};

export interface SupplierEvaluationHistory {
  id: string;
  supplierId: string;
  evaluationDate: string;
  projectCode: string;
  evaluator: string;
  evaluatedBy?: string;
  evaluatorRole: string;
  scores: SupplierPerformanceScore;
  comments: string;
  correctiveAction?: string;
  finalRating: PerformanceRating;
  rating?: PerformanceRating | string;
  overallScore?: number;
}

export interface SupplierAuditEntry {
  id: string;
  supplierId: string;
  timestamp: string;
  user: string;
  role: string;
  action:
    | 'Supplier Created'
    | 'Supplier Updated'
    | 'Status Changed'
    | 'Approval Step'
    | 'Bank Account Added'
    | 'Bank Account Verified'
    | 'Bank Account Changed'
    | 'Contact Added'
    | 'Contact Updated'
    | 'Document Uploaded'
    | 'Contract Created'
    | 'Contract Updated'
    | 'Invoice Registered'
    | 'Invoice Approved'
    | 'Payment Recorded'
    | 'Performance Evaluated'
    | 'Blocked Status Overridden';
  details: string;
  previousState?: string;
  newState?: string;
}

export interface SupplierApprovalWorkflow {
  currentStep: SupplierApprovalStep;
  createdBy: string;
  createdAt: string;
  submittedBy?: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  suspensionReason?: string;
  blockedReason?: string;
  overrideAllowedBy?: string;
  overrideReason?: string;
}

export interface Supplier {
  id: string;
  code: string; // e.g. "SUP-001"
  name: string; // Trading / Common Name
  legalName: string; // Registered Legal Entity Name
  tradingName: string;
  supplierType: SupplierType;
  categories: string[]; // Category names or IDs e.g. ["Ready Mix", "Cement"]
  
  // Statutory / Registration Details
  registrationNumber: string;
  businessRegistrationDate?: string;
  tin?: string;
  vatNumber?: string;
  svatNumber?: string;
  isVatRegistered: boolean;
  
  // Physical / Postal Address
  address: string;
  city: string;
  province: string;
  country: string;
  postalCode?: string;
  
  // Direct Quick Contact
  phone: string;
  email: string;
  website?: string;
  
  // Status & Approval Workflow
  status: SupplierStatus;
  approvalWorkflow: SupplierApprovalWorkflow;
  
  // Child Collections
  contacts: SupplierContact[];
  bankAccounts: SupplierBankAccount[];
  creditTerms: SupplierCreditTerms;
  documents: SupplierDocument[];
  contracts: SupplierContract[];
  
  // Performance Scorecard & History
  performance: SupplierPerformanceScore;
  evaluationHistory: SupplierEvaluationHistory[];
  
  // Audit Trail
  auditTrail: SupplierAuditEntry[];
  
  // General Notes
  notes?: string;
}

export interface SupplierFinancialSummary {
  supplierId: string;
  supplierName: string;
  totalPurchases: number; // Total committed PO value
  totalInvoiced: number; // Total approved supplier invoices
  totalPaid: number; // Total settled payments
  outstanding: number; // Approved Invoices - Total Paid
  overdue: number; // Approved Invoices past due date - Paid
  pendingPOValue: number; // Open PO value not yet invoiced
  averagePaymentDays: number;
}
