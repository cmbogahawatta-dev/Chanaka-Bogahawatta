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

export interface Client {
  id: string;
  name: string;
  contactPerson?: string;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt?: string;
  supportingDocuments?: SupportingDocument[];
  assignedProjectIds?: string[];
}
