export interface SupportingDocument {
  id: string;
  name: string;
  fileSize?: string;
  fileType?: string;
  dataUrl?: string;
  uploadedAt: string;
  category?: string;
  description?: string;
}

export interface EnterpriseProfileDetails {
  legalName?: string;
  tradingName?: string;
  shortName?: string;
  companyType?: string;
  registrationNumber?: string;
  incorporationDate?: string;
  registeredAddress?: string;
  businessAddress?: string;
  headOfficeAddress?: string;
  postalAddress?: string;
  telephone?: string;
  mobile?: string;
  website?: string;
  companyStatus?: 'Active' | 'Dormant' | 'Under Liquidation' | 'Struck Off';
  vatNumber?: string;
  tinNumber?: string;
  cidaRegistrationNumber?: string;
  cidaGrade?: string;
  cidaSpeciality?: string;
  supportingDocuments?: SupportingDocument[];
}

export interface StatutoryRegistration {
  id: string;
  enterpriseId: string;
  registrationType: 'Company Registration' | 'VAT' | 'TIN' | 'CIDA' | 'Government' | 'Industry' | 'Other';
  registrationNumber: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate?: string;
  renewalDate?: string;
  status: 'Active' | 'Expiring Soon' | 'Expired';
  responsiblePerson?: string;
  documentId?: string;
  remarks?: string;
  cidaDetails?: {
    grade?: string;
    category?: string;
    specialization?: string;
  };
  supportingDocuments?: SupportingDocument[];
}

export interface Director {
  id: string;
  enterpriseId: string;
  name: string;
  nicOrPassport: string;
  designation: string;
  appointmentDate: string;
  resignationDate?: string;
  status: 'Active' | 'Resigned';
  address?: string;
  contact?: string;
  signatureDocumentId?: string;
  documentIds?: string[];
  supportingDocuments?: SupportingDocument[];
}

export interface Shareholder {
  id: string;
  enterpriseId: string;
  name: string;
  type: 'Individual' | 'Corporate';
  nicOrRegistration: string;
  shares: number;
  shareClass?: string;
  ownershipPercent: number; // computed: shares / total * 100
  acquisitionDate: string;
  transferDate?: string;
  status: 'Active' | 'Transferred';
  supportingDocuments?: SupportingDocument[];
}

export interface AuthorizedPerson {
  id: string;
  enterpriseId: string;
  name: string;
  role: 'Director' | 'Authorized Signatory' | 'Company Secretary' | 'Finance Manager' | 'Accountant' | 'Other';
  scope?: string;
  contact?: string;
  status: 'Active' | 'Revoked';
  supportingDocuments?: SupportingDocument[];
}

export type ClientOrganizationType =
  | 'Government Authority'
  | 'State Owned Enterprise'
  | 'Private Limited Company'
  | 'Public Listed Company'
  | 'Joint Venture'
  | 'Multinational'
  | 'Non-Profit / NGO'
  | 'Statutory Board'
  | 'Financial Institution / Bank'
  | 'Other';

export type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLACKLISTED';

export type ClientTaxStatus = 'VAT Registered' | 'VAT Exempt' | 'Non-VAT Registered' | 'Other';

export interface ClientAddressDetail {
  line1: string;
  line2?: string;
  line3?: string;
  city: string;
  district?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

export interface ClientBillingAddress extends ClientAddressDetail {
  sameAsRegistered: boolean;
}

export interface ClientSiteAddress {
  id: string;
  name: string;
  address: string;
  district?: string;
  city?: string;
}

export interface ClientContactPerson {
  id: string;
  name: string;
  designation?: string;
  department?: string;
  telephone?: string;
  mobile?: string;
  email?: string;
  contactType:
    | 'Project Director'
    | 'Engineer'
    | 'Quantity Surveyor'
    | 'Finance'
    | 'Accounts'
    | 'Procurement'
    | 'Commercial'
    | 'Administration'
    | 'Other';
  isPrimary?: boolean;
  isActive?: boolean;
  isTaxInvoiceContact?: boolean;
}

export interface ClientBankAccount {
  id: string;
  bankName: string;
  branch: string;
  accountName: string;
  accountNumber: string;
  swift?: string;
  bankCode?: string;
  branchCode?: string;
  currency: string;
  accountType?: 'Current' | 'Savings' | 'Escrow' | 'Treasury';
  isDefault: boolean;
}

export interface ClientTaxDetails {
  tin?: string;
  vatNumber?: string;
  svatNumber?: string;
  isVatRegistered: boolean;
  taxStatus: ClientTaxStatus;
  defaultVatRate: number; // e.g. 18
  defaultInvoiceCurrency: string; // e.g. 'LKR'
  defaultPaymentTermsDays: number; // e.g. 30
  defaultDueDateRule?: string; // e.g. 'Invoice Date + Payment Terms'
  invoiceAttentionTo?: string;
  invoiceEmail?: string;
  invoiceDeliveryMethod?: 'Email' | 'Printed/Courier' | 'Portal' | 'Hand Delivery';
  invoiceAddressType?: 'Registered Address' | 'Billing Address' | 'Other';
  creditLimit?: number;
  isRetentionApplicable: boolean;
  defaultRetentionPercent?: number;
  isAdvanceApplicable: boolean;
  defaultAdvancePercent?: number;
  isWithholdingTaxApplicable: boolean;
  defaultWhtPercent?: number;
  isWhtCertificateRequired: boolean;
}

export interface ClientTaxInvoiceMasterData {
  displayName?: string;
  address?: string;
  tin?: string;
  vatNumber?: string;
  attentionTo?: string;
  contactPerson?: string;
  email?: string;
  telephone?: string;
  paymentTerms?: string;
  currency?: string;
  defaultVatRate?: number;
  defaultTaxTreatment?: string;
  defaultInvoiceNotes?: string;
  defaultInvoiceFooterNotes?: string;
}

export interface ClientPaymentTerms {
  defaultPaymentTermsDays: number;
  paymentTermsDescription?: string;
  defaultDueDateRule?: string;
  creditPeriodDays?: number;
  retentionPercent?: number;
  advancePercent?: number;
  whtPercent?: number;
  otherDeductionsPercent?: number;
  preferredPaymentMethod: 'Bank Transfer' | 'Cheque' | 'Letter of Credit' | 'Other';
  specialPaymentInstructions?: string;
}

export interface ClientContractInfo {
  contractNumber?: string;
  contractName?: string;
  projectName?: string;
  projectCode?: string;
  employerReference?: string;
  loaNumber?: string;
  loaDate?: string;
  contractStartDate?: string;
  contractCompletionDate?: string;
  contractValue?: number;
  currency?: string;
  consultantEngineer?: string;
  contractType?: string;
  paymentTerms?: string;
  retentionPercent?: number;
  advancePercent?: number;
  defectsLiabilityPeriod?: string;
  otherConditions?: string;
}

export interface ClientDocumentItem {
  id: string;
  name: string;
  documentType:
    | 'Client Contract'
    | 'Master Agreement'
    | 'MOU'
    | 'VAT Certificate'
    | 'TIN Certificate'
    | 'Business Registration'
    | 'Government Registration'
    | 'Bank Letter'
    | 'Purchase Order'
    | 'LOA'
    | 'Other Supporting Documents';
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  uploadedBy?: string;
  uploadedDate: string;
  fileSize?: string;
  fileType?: string;
  dataUrl?: string;
  notes?: string;
  status?: 'Active' | 'Expiring Soon' | 'Expired';
}

export interface ClientAuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action:
    | 'Client Created'
    | 'Client Edited'
    | 'Tax Details Changed'
    | 'Bank Details Changed'
    | 'Contact Added'
    | 'Contact Edited'
    | 'Document Uploaded'
    | 'Client Status Changed';
  clientName: string;
  changedFields?: string;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  organizationType?: ClientOrganizationType;
  clientCode?: string;
  shortName?: string;
  registrationNumber?: string;
  companyRegistrationDate?: string;
  industry?: string;
  clientCategory?: string;
  status?: ClientStatus;
  website?: string;
  country?: string;

  // Compatibility fields
  contactPerson?: string;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt?: string;
  supportingDocuments?: SupportingDocument[];
  assignedProjectIds?: string[];

  // Detailed Master Data Modules
  taxDetails?: ClientTaxDetails;
  taxInvoiceMasterData?: ClientTaxInvoiceMasterData;
  primaryContact?: {
    name: string;
    designation?: string;
    department?: string;
    telephone?: string;
    mobile?: string;
    email?: string;
    alternativeEmail?: string;
    fax?: string;
  };
  commercialContacts?: {
    accountsDepartmentContact?: string;
    accountsDepartmentEmail?: string;
    accountsDepartmentTelephone?: string;
    projectDirector?: string;
    projectDirectorEmail?: string;
    commercialContact?: string;
    commercialEmail?: string;
    procurementContact?: string;
    procurementEmail?: string;
  };
  contacts?: ClientContactPerson[];
  registeredAddress?: ClientAddressDetail;
  billingAddress?: ClientBillingAddress;
  siteAddresses?: ClientSiteAddress[];
  paymentTerms?: ClientPaymentTerms;
  bankAccounts?: ClientBankAccount[];
  initialContract?: ClientContractInfo;
  documents?: ClientDocumentItem[];
  auditTrail?: ClientAuditEntry[];
}
