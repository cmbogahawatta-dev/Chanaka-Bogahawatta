import { InvoiceBankDetails } from './taxInvoiceTypes';

export type QuotationType = 'QUOTATION' | 'ESTIMATE';

export type QuotationStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'CONVERTED';

export interface QuotationItem {
  id: string;
  itemNumber: number;
  description: string;
  unitOfMeasure?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number; // 0 to 100
  discountAmount?: number; // Calculated or manual
  taxableValue: number; // (qty * unitPrice) - discountAmount
  vatRate: number; // Standard 18% or 0% for exempt
  vatAmount: number; // taxableValue * (vatRate / 100)
  totalAmount: number; // taxableValue + vatAmount
}

export interface QuotationRevision {
  revisionNumber: number; // 0 for original, 1 for Rev.01, etc.
  revisionLabel: string; // "Rev.00", "Rev.01"
  revisionDate: string;
  revisedBy: string;
  revisionReason?: string;
}

export interface QuotationClientSnapshot {
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
  capturedAt: string; // ISO timestamp
}

export interface QuotationAuditEntry {
  id: string;
  timestamp: string;
  action:
    | 'CREATED'
    | 'UPDATED'
    | 'SENT'
    | 'ACCEPTED'
    | 'REJECTED'
    | 'EXPIRED'
    | 'REVISED'
    | 'CANCELLED'
    | 'CONVERTED'
    | 'DELETED';
  performedBy: string;
  userRole?: string;
  notes?: string;
  previousStatus?: QuotationStatus;
  newStatus?: QuotationStatus;
}

export interface Quotation {
  id: string;
  documentType: QuotationType; // 'QUOTATION' | 'ESTIMATE'
  quotationNumber: string; // e.g. QT-2026-00001 or EST-2026-00001
  revision: QuotationRevision;
  parentQuotationId?: string; // If revised from earlier quotation
  status: QuotationStatus;

  // Key Dates
  quotationDate: string; // YYYY-MM-DD
  validUntilDate: string; // YYYY-MM-DD
  validityDays: number; // e.g. 30, 60, 90
  expectedStartDate?: string;
  estimatedDuration?: string; // e.g. "45 Working Days", "6 Months"

  // Supplier / Service Provider Details (Immutable Company snapshot)
  supplierName: string;
  supplierTin: string;
  supplierVatNumber: string;
  supplierAddress: string;
  supplierContact: string;

  // Client Master Link & Immutable Historical Snapshot
  clientId?: string;
  clientSnapshot?: QuotationClientSnapshot;

  // Purchaser / Client Contact
  clientName: string;
  clientTin: string;
  clientVatNumber?: string;
  clientAddress: string;
  clientContactPerson?: string;
  clientPhone?: string;
  clientEmail?: string;

  // Project Association (Commercial reference only - NOT linked to expenses)
  projectCode?: string;
  projectName?: string;
  scopeOfWork?: string;
  tenderRef?: string;
  rfqNumber?: string; // Request for Quotation reference from client

  // Financial Items & Calculations
  currency: string; // 'LKR'
  lineItems: QuotationItem[];
  subtotalAmount: number; // Sum of (quantity * unitPrice) before discount
  totalDiscountAmount: number; // Total discount given
  taxableAmount: number; // subtotal - discount
  vatRate: number; // Default 18%
  vatAmount: number; // Total VAT charged
  totalAmount: number; // Total consideration (Taxable + VAT)
  amountInWords: string;

  // Commercial Terms & Conditions
  paymentTerms: string;
  deliveryTerms?: string;
  warrantyPeriod?: string;
  exclusions?: string;
  termsAndConditions?: string;
  notes?: string;

  // Settlement Bank Details (Reference for payment upon acceptance)
  bankAccountId?: string;
  settlementBankDetails?: InvoiceBankDetails;

  // Sign-off & Workflow
  preparedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  sentTo?: string;
  sentAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;

  // Conversion to Tax Invoice
  convertedInvoiceId?: string;
  convertedInvoiceNumber?: string;
  convertedAt?: string;
  convertedBy?: string;

  // Audit Log
  auditTrail: QuotationAuditEntry[];

  createdAt: string;
  updatedAt: string;
}

export interface QuotationSettings {
  quotationPrefix: string; // default "QT"
  estimatePrefix: string; // default "EST"
  entityCode: string; // e.g. "EMA"
  nextQuotationSequence: number; // e.g. 1 -> 00001
  nextEstimateSequence: number; // e.g. 1 -> 00001
  standardVatRate: number; // 18%
  defaultValidityDays: number; // 30
  companyName: string;
  companyTin: string;
  companyVatNumber: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  defaultPaymentTerms: string;
  defaultDeliveryTerms: string;
  defaultWarranty: string;
  defaultExclusions: string;
  defaultTermsAndConditions: string;
  defaultBankDetails: string;
}
