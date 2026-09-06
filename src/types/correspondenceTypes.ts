export type LetterDirection = 'Incoming' | 'Outgoing' | 'Reply';
export type LetterStatus = 'Draft' | 'Review' | 'Pending Approval' | 'Approved' | 'Issued' | 'Archived';
export type LetterPriority = 'Low' | 'Normal' | 'High' | 'Urgent';
export type LetterConfidentiality = 'Normal' | 'Restricted' | 'Confidential';
export type LetterheadVariant = 'Company' | 'Project' | 'Finance' | 'Tender' | 'Confidential';
export type LetterheadScope = 'Corporate' | 'Client' | 'Project' | 'Finance' | 'Tender' | 'Confidential';
export type LetterTone = 'Formal' | 'Firm' | 'Diplomatic' | 'Contractual' | 'Conciliatory' | 'Urgent';

export interface Letter {
  id: string;
  letterNumber: string; // The primary reference: EMA/{Client Affix}/{Project Affix}/{Year}/{Suffix}
  direction: LetterDirection;
  category: string; // 'Project' | 'Client' | 'Bank' | 'CIDA' | 'CGF' | 'ISO' | 'Auditor' | 'Insurance' | 'Tax' | 'VAT' | 'Government' | 'Legal' | 'General'
  projectId?: string;
  projectCode?: string;
  projectName?: string;
  projectAffix?: string; // e.g. PIDM26, CWP01
  clientId?: string;
  clientName?: string;
  clientAffix?: string; // e.g. RDA, CECB, MAGA
  sequenceYear?: string; // e.g. 2026
  sequenceNumber?: number; // Order index within client/project folder
  linkedEntityType?: 'BANK_ACCOUNT' | 'REGISTRATION' | 'ISO_CERTIFICATE' | 'AUDITOR_REPORT' | 'INSURANCE_POLICY' | 'PROJECT_INVOICE';
  linkedEntityId?: string;
  recipientOrganization?: string;
  recipientAddress?: string;
  attention?: string;
  senderOrganization?: string;
  subject: string;
  ourReference?: string;
  theirReference?: string;
  replyToLetterId?: string;
  previousLetterId?: string;
  relationship?: 'Reply To' | 'Follow-up To' | 'References' | 'Supersedes' | 'Related To' | 'Escalation Of';
  date: string;
  priority: LetterPriority;
  confidentiality: LetterConfidentiality;
  replyRequired?: boolean;
  replyDueDate?: string;
  responsiblePersonId?: string;
  replyStatus?: 'Pending' | 'Sent' | 'Overdue';
  bodyHtml: string;
  templateId?: string;
  letterheadVariant?: 'Company' | 'Project' | 'Finance' | 'Tender' | 'Confidential';
  letterheadId?: string; // Reference to custom uploaded or configured letterhead template
  preparedBy: string;
  reviewerId?: string;
  approverId?: string;
  approvedBy?: string;
  signatoryId?: string;
  remarks?: string;
  enterpriseId?: string;
  status: LetterStatus;
  version: number;
  isLocked: boolean;
  attachedDocumentIds: string[];
  aiGenerated?: boolean;
  aiSourcesUsed?: string[];
  createdAt: string;
  issuedAt?: string;
}

export interface LetterVersion {
  id: string;
  letterId: string;
  version: number;
  bodyHtml: string;
  changedBy: string;
  changedAt: string;
  changeDescription?: string;
}

export interface LetterTemplate {
  id: string;
  name: string;
  category: 'General' | 'Project' | 'Contractor' | 'Employer' | 'Engineer' | 'Payment' | 'EOT' | 'Claim' | 'Bank' | 'CIDA' | 'CGF' | 'ISO' | 'Auditor' | 'Insurance' | 'Government' | 'Tender';
  description?: string;
  subjectTemplate?: string;
  bodyHtml: string;
  createdBy: string;
  createdAt: string;
  active: boolean;
}

export interface LetterheadTemplate {
  id: string;
  enterpriseId: string;
  name: string;
  description?: string;
  scope: LetterheadScope;
  clientId?: string;
  clientName?: string;
  clientAffix?: string;
  projectId?: string;
  projectCode?: string;
  projectName?: string;
  projectAffix?: string;
  pageSize: 'A4' | 'Letter' | 'Legal';
  orientation: 'Portrait' | 'Landscape';
  headerImageUrl?: string; // Data URL for uploaded header banner
  footerImageUrl?: string; // Data URL for uploaded footer banner
  fullLetterheadImageUrl?: string; // Data URL for uploaded full-page letterhead scan/asset
  headerHeight: number; // in mm, default 45
  footerHeight: number; // in mm, default 30
  contentTopMargin: number; // in mm, default 50
  contentBottomMargin: number; // in mm, default 35
  contentLeftMargin: number; // in mm, default 20
  contentRightMargin: number; // in mm, default 20
  active: boolean;
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
