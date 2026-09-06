export type ExpiryStatus = 'Active' | 'Expiring Soon' | 'Expired';

export interface IsoCertificate {
  id: string;
  enterpriseId: string;
  standard: string; // e.g. "ISO 9001:2015", "ISO 14001:2015", "ISO 45001:2018"
  certificateNumber: string;
  certificationBody: string; // e.g. "SGS", "Bureau Veritas", "SLSI"
  scope: string;
  issueDate: string;
  expiryDate: string;
  status: ExpiryStatus;
  leadAuditor?: string;
  documentId?: string;
  remarks?: string;
}

export interface IsoAudit {
  id: string;
  isoCertificateId: string;
  auditType: 'Initial Certification' | 'Surveillance 1' | 'Surveillance 2' | 'Recertification' | 'Special Audit';
  auditDate: string;
  auditorName: string;
  auditingFirm: string;
  findingsCount: number;
  majorNonConformances: number;
  minorNonConformances: number;
  observations: number;
  outcome: 'Passed' | 'Conditional Pass' | 'Corrective Action Required' | 'Failed';
  nextAuditDueDate?: string;
  documentId?: string;
  remarks?: string;
}

export interface Auditor {
  id: string;
  enterpriseId: string;
  firmName: string;
  partnerName: string;
  engagementType: 'External Financial Auditor' | 'Internal Auditor' | 'Tax Consultant' | 'ISO Certification Body';
  appointedDate: string;
  tenureYears?: number;
  status: 'Active' | 'Past';
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

export interface AuditorReport {
  id: string;
  auditorId: string;
  financialYear: string; // e.g. "FY 2025/2026"
  reportTitle: string;
  auditOpinion: 'Unqualified (Clean)' | 'Qualified' | 'Adverse' | 'Disclaimer of Opinion';
  reportDate: string;
  documentId?: string;
  managementLetterPresent: boolean;
  remarks?: string;
}

export interface AuditFinding {
  id: string;
  reportId: string;
  category: 'Financial' | 'Statutory' | 'Taxation' | 'Internal Control' | 'ISO Compliance';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  issueDescription: string;
  recommendation: string;
  managementResponse?: string;
  assignedTo?: string;
  targetDate?: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
}

export interface InsurancePolicy {
  id: string;
  enterpriseId: string;
  policyType: 'Contractors All Risk (CAR)' | 'Workmen Compensation' | 'Public Liability' | 'Plant & Machinery' | 'Directors & Officers' | 'Professional Indemnity' | 'Fire & Allied Perils';
  policyNumber: string;
  insurer: string; // e.g. "Sri Lanka Insurance", "Ceylinco General", "Allianz"
  coverageAmount: number;
  premiumAmount: number;
  startDate: string;
  expiryDate: string;
  status: ExpiryStatus;
  projectId?: string; // If project-specific policy
  documentId?: string;
  remarks?: string;
}

export interface Licence {
  id: string;
  enterpriseId: string;
  licenceType: 'Trade Licence' | 'Environmental Protection Licence (EPL)' | 'Mining & Quarrying Permit' | 'Explosives Storage/Use' | 'Municipal / Local Council' | 'Telecommunications / Radio';
  licenceNumber: string;
  issuingAuthority: string; // e.g. "CEA", "GSMB", "Colombo Municipal Council"
  issueDate: string;
  expiryDate: string;
  status: ExpiryStatus;
  documentId?: string;
  remarks?: string;
}

export interface ExpiryAlertItem {
  id: string;
  entityType: 'REGISTRATION' | 'ISO' | 'INSURANCE' | 'LICENCE' | 'STATEMENT';
  title: string;
  referenceNumber: string;
  expiryDate: string;
  daysRemaining: number;
  status: ExpiryStatus;
  responsiblePerson?: string;
}
