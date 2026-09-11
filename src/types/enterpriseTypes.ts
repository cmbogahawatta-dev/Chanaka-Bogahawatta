export type EnterpriseModule =
  | 'overview'
  | 'site-records'
  | 'petty-cash'
  | 'fleet'
  | 'staff'
  | 'projects'
  | 'procurement'
  | 'project-income'
  | 'payments'
  | 'financial-insights'
  | 'invoices'
  | 'client-payments'
  | 'tax-invoices'
  | 'quotations'
  | 'reports'
  | 'documents'
  | 'enterprise-profile'
  | 'compliance'
  | 'bank-accounts'
  | 'correspondence'
  | 'admin';

export type EnterpriseRole =
  | 'ADMIN'
  | 'HR'
  | 'FINANCE'
  | 'PROJECT_MANAGER'
  | 'SITE_ENGINEER'
  | 'SUPERVISOR'
  | 'FLEET_MANAGER'
  | 'DRIVER'
  | 'VIEWER'
  | 'OWNER';

export type SyncStatus = 'ONLINE' | 'SYNCING' | 'OFFLINE' | 'SYNC_ERROR';

export interface ProcurementOrderItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
}

export interface ProcurementOrder {
  id: string;
  PO_NUMBER: string; // e.g. "PO-202608-012"
  DATE: string;
  PROJECT_CODE: string;
  REQUESTED_BY: string; // Supervisor / Engineer
  SUPPLIER_ID?: string; // Reference to Supplier Master
  SUPPLIER_NAME: string; // Retained for full backward compatibility
  ITEM_DESCRIPTION: string;
  QUANTITY: number;
  UNIT: 'Cubes' | 'MT' | 'Bags' | 'Units' | 'Liters' | 'Hours' | string;
  UNIT_PRICE: number;
  TOTAL_AMOUNT: number; // LKR
  ITEMS?: ProcurementOrderItem[];
  STATUS: 'Pending Approval' | 'Approved' | 'Delivered' | 'Invoiced' | 'Paid' | 'Cancelled';
  PRIORITY: 'Low' | 'Medium' | 'High' | 'Urgent';
  DELIVERY_LOCATION: string;
  LINKED_EXPENSE_ID?: string;
  REMARKS?: string;
  PROOF_DOCUMENT?: string;
}

export interface PaymentVoucher {
  id: string;
  PAYMENT_ID: string; // e.g. "PAY-202608-005"
  DATE: string;
  PROJECT_CODE: string;
  BENEFICIARY: string;
  SUPPLIER_ID?: string;
  SUPPLIER_NAME?: string;
  LINKED_INVOICE_ID?: string;
  CATEGORY: string;
  AMOUNT: number; // LKR
  PAYMENT_METHOD: 'Petty Cash' | 'Cheque' | 'Direct Bank Transfer' | 'Online Banking';
  CHEQUE_OR_REF_NO?: string;
  STATUS: 'Draft' | 'Pending Approval' | 'Approved' | 'Settled' | 'Rejected';
  REQUESTED_BY: string;
  APPROVED_BY?: string;
  PROOF_DOCUMENT?: string;
  REMARKS?: string;
  LINKED_VEHICLE_ID?: string;
}

export interface EnterpriseDocument {
  id: string;
  DOC_REF: string; // e.g. "DOC-2026-089"
  TITLE: string;
  MODULE:
    | 'Petty Cash'
    | 'FleetTrack'
    | 'Projects'
    | 'Procurement'
    | 'Payments'
    | 'General'
    | 'Enterprise Compliance'
    | 'Banking'
    | 'Correspondence';
  CATEGORY:
    | 'Receipt'
    | 'Invoice'
    | 'Vehicle Insurance'
    | 'Revenue License'
    | 'Inspection Certificate'
    | 'Site Contract'
    | 'Site Permit'
    | 'Running Chart Proof'
    | 'Other'
    | 'Statutory Registration'
    | 'VAT/Tax'
    | 'CIDA'
    | 'Director/Shareholder'
    | 'ISO Certificate'
    | 'ISO Audit Report'
    | 'Auditor Report'
    | 'Insurance Policy'
    | 'Licence/Permit'
    | 'Bank Confirmation'
    | 'Bank Statement'
    | 'Board Resolution'
    | 'Incoming Letter'
    | 'Outgoing Letter'
    | 'Letterhead';
  LINKED_ENTITY_TYPE:
    | 'EXPENSE'
    | 'INCOME'
    | 'VEHICLE'
    | 'PROJECT'
    | 'PROCUREMENT'
    | 'SUPPLIER'
    | 'PAYMENT'
    | 'ENTERPRISE_PROFILE'
    | 'REGISTRATION'
    | 'BANK_ACCOUNT'
    | 'BANK_STATEMENT'
    | 'ISO_CERTIFICATE'
    | 'AUDITOR_REPORT'
    | 'INSURANCE_POLICY'
    | 'LICENCE'
    | 'LETTER';
  LINKED_ENTITY_ID: string; // e.g. "EXP-1001", "VEH-001", "PRJ-001", "BANK-01", etc.
  FILE_NAME: string;
  FILE_TYPE: 'image/jpeg' | 'image/png' | 'application/pdf';
  FILE_DATA: string; // Base64 or URL
  UPLOADED_BY: string;
  UPLOADED_DATE: string;
  FILE_SIZE_KB: number;
  REMARKS?: string;
}

export interface EnterpriseNotification {
  id: string;
  TIMESTAMP: string;
  MODULE:
    | 'Petty Cash'
    | 'FleetTrack'
    | 'Projects'
    | 'Procurement'
    | 'Payments'
    | 'System'
    | 'HR'
    | 'Attendance'
    | 'Leave'
    | 'Payroll'
    | 'Staff'
    | 'Compliance'
    | 'Banking'
    | 'Correspondence';
  SEVERITY: 'info' | 'warning' | 'urgent' | 'success';
  TITLE: string;
  MESSAGE: string;
  ACTION_URL?: string;
  TARGET_MODULE?: EnterpriseModule;
  TARGET_TAB?: string;
  READ: boolean;
  LINKED_ID?: string;
}
