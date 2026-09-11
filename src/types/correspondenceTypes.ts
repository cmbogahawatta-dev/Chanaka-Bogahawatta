export type LetterDirection = 'Incoming' | 'Outgoing' | 'Reply' | 'INCOMING' | 'OUTGOING';

export type CorrespondenceDocumentType =
  | 'LETTER'
  | 'EMAIL'
  | 'NOTICE'
  | 'INSTRUCTION'
  | 'SUBMISSION'
  | 'RESPONSE'
  | 'CLAIM'
  | 'EOT'
  | 'VARIATION'
  | 'PAYMENT_REQUEST'
  | 'OTHER';

export type ContractualCategory =
  | 'EOT'
  | 'Delay'
  | 'Variation'
  | 'Payment'
  | 'Contract'
  | 'Procurement'
  | 'Technical'
  | 'QA/QC'
  | 'HSE'
  | 'Planning'
  | 'Commercial'
  | 'Financial'
  | 'General';

export type StakeholderPartyType =
  | 'Client'
  | 'Engineer'
  | 'Consultant'
  | 'Contractor'
  | 'Government'
  | 'Bank'
  | 'Supplier'
  | 'Subcontractor'
  | 'CGF'
  | 'CIDA'
  | 'RDA'
  | 'Other';

export type LetterStatus =
  | 'Draft'
  | 'External Editing'
  | 'Submitted for Review'
  | 'Revision Required'
  | 'Final Review'
  | 'Finalized'
  | 'Pending Approval'
  | 'Approved'
  | 'Issued'
  | 'Archived'
  | 'Review'
  | 'DRAFT'
  | 'RECEIVED'
  | 'SENT'
  | 'ACTION_REQUIRED'
  | 'PENDING_REPLY'
  | 'REPLIED'
  | 'CLOSED'
  | 'OVERDUE';

export type LetterPriority = 'Low' | 'Normal' | 'High' | 'Urgent' | 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type LetterConfidentiality =
  | 'Normal'
  | 'Restricted'
  | 'Confidential'
  | 'Strictly Confidential'
  | 'NORMAL'
  | 'RESTRICTED'
  | 'CONFIDENTIAL';

export interface CorrespondenceActionItem {
  id: string;
  correspondenceId: string;
  action: string;
  responsiblePerson: string;
  dueDate: string;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent' | 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  completionDate?: string;
  remarks?: string;
  createdAt: string;
}

export type LetterheadVariant = 'Company' | 'Project' | 'Finance' | 'Tender' | 'Confidential';
export type LetterheadScope = 'Corporate' | 'Client' | 'Project' | 'Finance' | 'Tender' | 'Confidential';
export type LetterTone = 'Formal' | 'Firm' | 'Diplomatic' | 'Contractual' | 'Conciliatory' | 'Urgent';
export type DocumentSource =
  | 'Application Editor'
  | 'Google Docs'
  | 'Microsoft Word'
  | 'Imported PDF'
  | 'AI Generated'
  | 'Manual Revision';

export interface Letter {
  id: string;
  letterNumber: string; // The primary reference: EMA/{Client Affix}/{Project Affix}/{Year}/{Suffix}
  direction: LetterDirection;
  documentType?: CorrespondenceDocumentType;
  contractualCategory?: ContractualCategory;
  partyType?: StakeholderPartyType;
  category: string; // 'Project' | 'Client' | 'Bank' | 'CIDA' | 'CGF' | 'ISO' | 'Auditor' | 'Insurance' | 'Tax' | 'VAT' | 'Government' | 'Legal' | 'General'
  projectId?: string;
  projectCode?: string;
  projectName?: string;
  projectAffix?: string; // e.g. PIDM26, CWP01
  clientId?: string;
  clientName?: string;
  clientAffix?: string; // e.g. RDA, CECB, MAGA
  contractNumber?: string;
  sequenceYear?: string; // e.g. 2026
  sequenceNumber?: number; // Order index within client/project folder
  linkedEntityType?: 'BANK_ACCOUNT' | 'REGISTRATION' | 'ISO_CERTIFICATE' | 'AUDITOR_REPORT' | 'INSURANCE_POLICY' | 'PROJECT_INVOICE' | 'VARIATION' | 'EOT' | 'CLAIM' | 'IPC';
  linkedEntityId?: string;
  recipientName?: string;
  recipientOrganization?: string;
  recipientAddress?: string;
  attention?: string;
  senderName?: string;
  senderOrganization?: string;
  subject: string;
  ourReference?: string;
  theirReference?: string;
  referenceNumber?: string; // Generic reference number
  replyToLetterId?: string;
  previousLetterId?: string;
  parentCorrespondenceId?: string;
  relatedCorrespondenceIds?: string[];
  relationship?: 'Reply To' | 'Follow-up To' | 'References' | 'Supersedes' | 'Related To' | 'Escalation Of';
  date: string;
  receivedDate?: string; // Stamped intake date for incoming letters
  priority: LetterPriority;
  confidentiality: LetterConfidentiality;
  replyRequired?: boolean;
  replyDueDate?: string;
  responsiblePersonId?: string;
  replyStatus?: 'Pending' | 'Sent' | 'Overdue' | 'PENDING_REPLY' | 'REPLIED' | 'NOT_REQUIRED';
  
  // Action Tracking
  actionRequired?: boolean;
  actionDescription?: string;
  actionOwnerId?: string;
  actionDueDate?: string;
  actionItems?: CorrespondenceActionItem[];

  // Document Revision Tracking
  revisionLabel?: string; // e.g. 'Rev.00', 'Rev.01'
  isSuperseded?: boolean;
  supersededByLetterId?: string;

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
  attachments?: CorrespondenceAttachment[];
  downloadHistory?: LetterDownloadRecord[];
  aiGenerated?: boolean;
  aiSourcesUsed?: string[];
  createdAt: string;
  issuedAt?: string;

  // External Document Editing & Google Workspace Integration
  googleDocumentId?: string;
  googleDocumentUrl?: string;
  googleDriveFileId?: string;
  externalEditor?: 'WORD' | 'GOOGLE_DOCS' | 'NONE';
  externalDocumentCreatedAt?: string;
  externalDocumentUpdatedAt?: string;
  externalLastEditedBy?: string;
  finalDocumentId?: string;
  finalDocumentUrl?: string;
  finalizedAt?: string;
  finalizedBy?: string;
  referencedLetters?: string[];
}

export interface LetterDownloadRecord {
  id: string;
  letterId: string;
  downloadedAt: string;
  downloadedBy: string;
  format: 'PDF' | 'DOCX' | 'PRINT';
  filename: string;
  version: number;
  fileSize?: number;
  letterheadId?: string;
  letterheadName?: string;
  notes?: string;
}

export interface CorrespondenceAttachment {
  id: string;
  letterId: string;
  name: string;
  size: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy: string;
  category:
    | 'DRAFT'
    | 'SUPPORTING_DOCUMENT'
    | 'FINAL_DOCUMENT'
    | 'SIGNED_DOCUMENT'
    | 'MODIFIED_WORD_DOC'
    | 'SIGNED_SCAN'
    | 'SUPPORTING_DOC'
    | 'TECHNICAL_ANNEXURE';
  description?: string;
  dataUrl?: string;
  wordExtractedText?: string;
  versionTagged?: number;
}

export interface LetterVersion {
  id: string;
  letterId: string;
  version: number;
  bodyHtml: string;
  changedBy: string;
  changedAt: string;
  changeDescription?: string;
  source?: DocumentSource;
  status?: LetterStatus;
  isFinal?: boolean;
  documentUrl?: string;
  documentName?: string;
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
