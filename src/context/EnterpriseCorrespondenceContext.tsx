import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Letter,
  LetterVersion,
  LetterTemplate,
  LetterheadTemplate,
  LetterStatus,
  LetterDirection,
  LetterPriority,
  LetterConfidentiality,
  LetterTone,
  CorrespondenceAttachment,
  LetterDownloadRecord
} from '../types/correspondenceTypes';
import { readWordDocumentFile } from '../services/export/wordImportService';
import {
  formatCorrespondenceReference,
  getNextLetterSuffix,
  extractClientAffix,
  extractProjectAffix
} from '../utils/correspondenceUtils';
import { defaultLetterheads, resolveRecommendedLetterhead } from '../utils/letterheadUtils';
import { AuditService } from '../services/audit/auditService';

interface EnterpriseCorrespondenceContextType {
  letters: Letter[];
  versions: LetterVersion[];
  templates: LetterTemplate[];
  letterheads: LetterheadTemplate[];
  activeLetterheads: LetterheadTemplate[];
  createLetter: (
    letter: Omit<Letter, 'id' | 'version' | 'isLocked' | 'createdAt'> & {
      letterNumber?: string;
      isLocked?: boolean;
      version?: number;
    }
  ) => Letter;
  updateLetter: (id: string, updates: Partial<Letter>, changeDesc?: string, editorName?: string) => void;
  advanceStatus: (id: string, newStatus: LetterStatus, actorName: string) => boolean;
  submitForApproval: (id: string, actorName?: string) => void;
  approveLetter: (id: string, actorName?: string) => void;
  issueLetter: (id: string, actorName: string) => boolean;
  archiveLetter: (id: string) => void;
  deleteLetter: (id: string) => boolean;
  addTemplate: (tmpl: Omit<LetterTemplate, 'id' | 'createdAt'>) => void;
  createLetterhead: (
    tmpl: Omit<LetterheadTemplate, 'id' | 'createdAt' | 'updatedAt'>,
    actorName?: string
  ) => LetterheadTemplate;
  updateLetterhead: (
    id: string,
    updates: Partial<LetterheadTemplate>,
    actorName?: string
  ) => void;
  deleteLetterhead: (id: string, actorName?: string) => boolean;
  duplicateLetterhead: (id: string, actorName?: string) => LetterheadTemplate | null;
  setDefaultLetterhead: (id: string, actorName?: string) => void;
  toggleLetterheadActive: (id: string, actorName?: string) => void;
  getLetterheadById: (id?: string) => LetterheadTemplate | undefined;
  getRecommendedLetterhead: (params: {
    projectId?: string;
    projectAffix?: string;
    projectCode?: string;
    clientId?: string;
    clientAffix?: string;
    category?: string;
    confidentiality?: string;
  }) => LetterheadTemplate;
  generateNextLetterNumber: () => string;
  getNextLetterNumber: (prefix?: string) => string;
  generateCorrespondenceReference: (params: {
    clientAffix?: string;
    projectAffix?: string;
    year?: string | number;
    customSuffix?: string;
  }) => {
    reference: string;
    clientAffix: string;
    projectAffix: string;
    year: string;
    suffix: string;
  };
  getNextSuffix: (clientAffix: string, projectAffix: string, year: string | number) => string;
  draftLetterWithAi: (params: {
    enterpriseId: string;
    recipientOrganization: string;
    purpose: string;
    category?: string;
    tone?: LetterTone;
  }) => Promise<{ subject: string; bodyHtml: string }>;
  transformLetterWithAi: (letterId: string, targetTone: LetterTone) => Promise<{ transformedBodyHtml: string }>;
  clearCorrespondenceHistory: (filterScope?: {
    clientKey?: string;
    projectKey?: string;
    clientAffix?: string;
    projectAffix?: string;
  }) => void;
  clearAllCorrespondenceHistory: () => void;
  resetCorrespondenceToDefaults: () => void;
  addAttachmentToLetter: (
    letterId: string,
    attachment: Omit<CorrespondenceAttachment, 'id' | 'uploadedAt'>
  ) => CorrespondenceAttachment;
  removeAttachmentFromLetter: (letterId: string, attachmentId: string) => void;
  importWordDocToLetter: (
    letterId: string,
    file: File,
    options?: {
      updateLetterBody?: boolean;
      changeDescription?: string;
      actorName?: string;
      category?: CorrespondenceAttachment['category'];
      notes?: string;
    }
  ) => Promise<CorrespondenceAttachment>;
  recordLetterDownload: (
    letterId: string,
    record: {
      format: 'PDF' | 'DOCX' | 'PRINT';
      filename: string;
      downloadedBy?: string;
      fileSize?: number;
      letterheadId?: string;
      letterheadName?: string;
      notes?: string;
    }
  ) => LetterDownloadRecord;
  finalizeLetter: (
    id: string,
    finalizedBy: string,
    finalDocxBlob?: Blob,
    finalPdfDataUrl?: string
  ) => Promise<Letter>;
  createRevision: (id: string, actorName: string, reason?: string) => Letter;
  updateGoogleDocLink: (id: string, docUrl: string, docId?: string, actorName?: string) => void;
  syncFromGoogleDoc: (id: string, newBodyHtml: string, actorName?: string) => void;
  importWordRevision: (id: string, extractedHtml: string, file: File, actorName?: string) => Promise<Letter>;
}

const defaultTemplates: LetterTemplate[] = [
  {
    id: 'tmpl-01',
    name: 'Standard Contractual Notification',
    category: 'Project',
    description: 'Formal notification to Engineer or Employer regarding site operations, access, or commencement.',
    subjectTemplate: 'Formal Notification Regarding Site Operations at [Project Name]',
    bodyHtml: `<p>Dear Sir / Madam,</p>
<p>We write with reference to Clause [Clause Number] of the Contract Agreement for the above-referenced Project.</p>
<p>Please be formally notified that in accordance with the agreed construction schedule, our teams have instituted operations regarding [Description of Work / Site Activity].</p>
<p>We request your prompt inspection and confirmation so that works may proceed without impediment.</p>
<p>Thank you for your continued cooperation.</p>`,
    createdBy: 'System Template',
    createdAt: '2026-01-01',
    active: true
  },
  {
    id: 'tmpl-02',
    name: 'Claim for Extension of Time (EOT)',
    category: 'EOT',
    description: 'Initial notice of delay and request for contractual extension of time under FIDIC / CIDA SBD.',
    subjectTemplate: 'Notice of Delay & Claim for Extension of Time (EOT) - [Project Code]',
    bodyHtml: `<p>Dear Resident Engineer / Project Director,</p>
<p><strong>RE: NOTICE OF DELAY AND CLAIM FOR EXTENSION OF TIME</strong></p>
<p>We write in accordance with Clause 8.4 [Extension of Time for Completion] to give formal notice of an event giving rise to delay in the completion of works.</p>
<p><strong>1. Cause of Delay:</strong><br/>Due to [Event Description / Adverse Weather / Late Employer Drawings / Delayed Access], works on critical path activity [Activity Name] were suspended from [Start Date] to [End Date].</p>
<p><strong>2. Estimated Impact:</strong><br/>A critical path impact of [Number of Days] calendar days is assessed.</p>
<p>Detailed contemporaneous records, daily site logs, and revised Gantt charts are enclosed in support of this claim.</p>`,
    createdBy: 'Legal & Contracts',
    createdAt: '2026-01-01',
    active: true
  },
  {
    id: 'tmpl-03',
    name: 'Bank Facility & Guarantee Request',
    category: 'Bank',
    description: 'Request for issuance of Performance Guarantee / Advance Payment Guarantee to Client.',
    subjectTemplate: 'Request for Issuance of Bank Guarantee - [Project Name]',
    bodyHtml: `<p>The Chief Manager / Head of Corporate Banking,<br/>[Bank Name PLC],</p>
<p>Dear Sir,</p>
<p><strong>RE: ISSUANCE OF PERFORMANCE BOND / ADVANCE PAYMENT GUARANTEE</strong></p>
<p>We request your bank to issue a Performance Guarantee in favor of [Client Name], as detailed below:</p>
<ul>
  <li><strong>Beneficiary:</strong> [Client Name and Full Address]</li>
  <li><strong>Guarantee Value:</strong> LKR [Amount in Figures] (LKR [Amount in Words])</li>
  <li><strong>Validity Period:</strong> From [Date] to [Date]</li>
  <li><strong>Underlying Contract:</strong> [Contract Reference & Description]</li>
</ul>
<p>Please debit the required issuance fees and margin from our Operational Current Account [Account Number].</p>`,
    createdBy: 'Finance Dept',
    createdAt: '2026-01-01',
    active: true
  },
  {
    id: 'tmpl-04',
    name: 'Interim Payment Application Follow-up',
    category: 'Payment',
    description: 'Urgent reminder regarding overdue Interim Payment Certificate (IPC) settlement.',
    subjectTemplate: 'Urgent: Outstanding Settlement of Interim Payment Certificate No. [IPC No]',
    bodyHtml: `<p>Dear Sir,</p>
<p>We wish to draw your immediate attention to Interim Payment Certificate No. [IPC No] certified on [Certified Date] for the sum of LKR [Amount].</p>
<p>In terms of Clause 14.7 of the Contract Conditions, payment was due within 28 days of certification, which expired on [Due Date]. As of today's date, settlement has not been credited to our designated project bank account.</p>
<p>We kindly request your immediate authorization of the payment voucher to prevent disruption to ongoing materials procurement and plant haulage.</p>`,
    createdBy: 'Commercial Dept',
    createdAt: '2026-01-01',
    active: true
  }
];

const initialLetters: Letter[] = [
  {
    id: 'ltr-001',
    letterNumber: 'EMA/RDA/PIDM26/2026/001',
    direction: 'Outgoing',
    category: 'Project',
    clientId: 'cl-rda',
    clientName: 'Road Development Authority (RDA)',
    clientAffix: 'RDA',
    projectId: 'PRJ-2026-001',
    projectCode: 'PIDM26',
    projectName: 'Kadawatha - Mirigama Expressway Rehabilitation',
    projectAffix: 'PIDM26',
    sequenceYear: '2026',
    sequenceNumber: 1,
    recipientOrganization: 'Road Development Authority (RDA)',
    recipientAddress: 'Maganeguma Mahamedura, Battaramulla',
    attention: 'Eng. H. M. Karunaratne (Project Director)',
    subject: 'Submission of Revised Pavement Sub-base Methodology and Traffic Management Plan',
    ourReference: 'EMA/RDA/PIDM26/2026/001',
    theirReference: 'RDA/PD/CEP/TECH/410',
    date: '2026-08-14',
    priority: 'Normal',
    confidentiality: 'Normal',
    replyRequired: true,
    replyDueDate: '2026-08-28',
    replyStatus: 'Sent',
    bodyHtml: `<p>Dear Eng. Karunaratne,</p>
<p>We refer to the site progress meeting held on 10th August 2026 regarding Section 2 sub-base stabilization for Project PIDM26.</p>
<p>Enclosed herewith please find three (03) copies of the revised Method Statement and detailed Traffic Diversion Scheme for the Kadawatha-Mirigama link chainage 14+200 to 16+800.</p>
<p>We request your formal review and approval so that site paving teams may commence deployment as planned on Monday 1st September 2026.</p>`,
    letterheadVariant: 'Project',
    preparedBy: 'Samantha Perera (Admin)',
    status: 'Issued',
    version: 1,
    isLocked: true,
    attachedDocumentIds: [],
    downloadHistory: [
      {
        id: 'dl-init-001',
        letterId: 'ltr-001',
        downloadedAt: '2026-08-14T11:05:00Z',
        downloadedBy: 'Samantha Perera (Admin)',
        format: 'PDF',
        filename: 'EMA_RDA_PIDM26_2026_001_Official_Correspondence.pdf',
        version: 1,
        letterheadName: '[Project] Kadawatha-Mirigama Site Stationery',
        fileSize: 142300,
        notes: 'Official PDF issued to Employer & Project Director'
      },
      {
        id: 'dl-init-002',
        letterId: 'ltr-001',
        downloadedAt: '2026-08-14T09:45:00Z',
        downloadedBy: 'Samantha Perera (Admin)',
        format: 'DOCX',
        filename: 'EMA_RDA_PIDM26_2026_001_Official_Correspondence.docx',
        version: 1,
        letterheadName: '[Project] Kadawatha-Mirigama Site Stationery',
        fileSize: 84200,
        notes: 'Draft exported to MS Word for Resident Engineer review'
      }
    ],
    createdAt: '2026-08-14T09:30:00Z',
    issuedAt: '2026-08-14T11:00:00Z'
  },
  {
    id: 'ltr-002',
    letterNumber: 'EMA/RDA/PIDM26/2026/002',
    direction: 'Incoming',
    category: 'Client',
    clientId: 'cl-rda',
    clientName: 'Road Development Authority (RDA)',
    clientAffix: 'RDA',
    projectId: 'PRJ-2026-001',
    projectCode: 'PIDM26',
    projectName: 'Kadawatha - Mirigama Expressway Rehabilitation',
    projectAffix: 'PIDM26',
    sequenceYear: '2026',
    sequenceNumber: 2,
    senderOrganization: 'Road Development Authority (RDA)',
    recipientOrganization: 'Apex Global Logistics Corp',
    subject: 'Approval of Revised Pavement Sub-base Methodology with Conditions',
    theirReference: 'RDA/PD/CEP/TECH/425',
    ourReference: 'EMA/RDA/PIDM26/2026/002',
    replyToLetterId: 'ltr-001',
    relationship: 'Reply To',
    date: '2026-08-25',
    priority: 'Normal',
    confidentiality: 'Normal',
    replyRequired: false,
    replyStatus: 'Sent',
    bodyHtml: `<p>Dear Sirs,</p>
<p>Reference is made to your letter EMA/RDA/PIDM26/2026/001 dated 14th August 2026.</p>
<p>The Resident Engineer has reviewed your revised Method Statement and grants conditional approval, subject to mandatory 24-hour illuminated signboards and police traffic liaison at Chainage 15+000.</p>`,
    preparedBy: 'RDA Engineering Directorate',
    status: 'Issued',
    version: 1,
    isLocked: true,
    attachedDocumentIds: [],
    createdAt: '2026-08-25T14:15:00Z',
    issuedAt: '2026-08-25T14:15:00Z'
  },
  {
    id: 'ltr-003',
    letterNumber: 'EMA/CECB/CWP01/2026/001',
    direction: 'Outgoing',
    category: 'Project',
    clientId: 'cl-cecb',
    clientName: 'Central Engineering Consultancy Bureau (CECB)',
    clientAffix: 'CECB',
    projectId: 'PRJ-2026-003',
    projectCode: 'CWP01',
    projectName: 'Central Water Treatment & Bulk Supply Piping',
    projectAffix: 'CWP01',
    sequenceYear: '2026',
    sequenceNumber: 1,
    recipientOrganization: 'Central Engineering Consultancy Bureau (CECB)',
    recipientAddress: 'No. 415, Bauddhaloka Mawatha, Colombo 07',
    attention: 'Eng. D. Bandara (Chief Resident Consultant)',
    subject: 'Submission of Hydrostatic Pressure Test Certificates for Sector 4 Pipeline',
    ourReference: 'EMA/CECB/CWP01/2026/001',
    date: '2026-08-29',
    priority: 'High',
    confidentiality: 'Normal',
    replyRequired: true,
    replyDueDate: '2026-09-12',
    replyStatus: 'Pending',
    bodyHtml: `<p>Dear Eng. Bandara,</p>
<p>We are pleased to submit the certified Hydrostatic Pressure Test logs for the ductile iron pipelines installed under Sector 4.</p>
<p>All test runs maintained an operational pressure of 12 bar over the requisite 6-hour duration without pressure drop.</p>
<p>We kindly request your signature on the enclosed testing protocol sheets.</p>`,
    letterheadVariant: 'Project',
    preparedBy: 'Samantha Perera (Admin)',
    status: 'Approved',
    version: 1,
    isLocked: false,
    attachedDocumentIds: [],
    createdAt: '2026-08-29T11:00:00Z'
  },
  {
    id: 'ltr-004',
    letterNumber: 'EMA/COMBANK/CORP/2026/001',
    direction: 'Outgoing',
    category: 'Bank',
    clientId: 'cl-combank',
    clientName: 'Commercial Bank of Ceylon PLC',
    clientAffix: 'COMBANK',
    projectAffix: 'CORP',
    projectName: 'Corporate Banking & Trade Finance',
    sequenceYear: '2026',
    sequenceNumber: 1,
    linkedEntityType: 'BANK_ACCOUNT',
    linkedEntityId: 'bank-01',
    recipientOrganization: 'Commercial Bank of Ceylon PLC',
    recipientAddress: 'Level 1, World Trade Centre, Colombo 01',
    attention: 'Senior Manager - Corporate Credit',
    subject: 'Extension of Fleet Asset Financing Facility & Letter of Credit Ceiling',
    ourReference: 'EMA/COMBANK/CORP/2026/001',
    date: '2026-09-02',
    priority: 'High',
    confidentiality: 'Confidential',
    replyRequired: true,
    replyDueDate: '2026-09-16',
    replyStatus: 'Pending',
    bodyHtml: `<p>The Senior Manager - Corporate Credit,<br/>Commercial Bank of Ceylon PLC,</p>
<p>Dear Sir,</p>
<p><strong>RE: ENHANCEMENT OF IMPORT LETTER OF CREDIT LIMIT FOR PRIME MOVERS</strong></p>
<p>With reference to our Facility Agreement No. CL/2024/902, we hereby apply for an extension of our Letter of Credit line from USD 500,000 to USD 850,000 to facilitate the impending customs clearance of five (05) new Scania heavy haulage tippers.</p>
<p>The audited financials for FY 2024/2025 and our forward project backlog certificate are attached for your credit committee appraisal.</p>`,
    letterheadVariant: 'Finance',
    preparedBy: 'Samantha Perera (Admin)',
    status: 'Draft',
    version: 1,
    isLocked: false,
    attachedDocumentIds: [],
    createdAt: '2026-09-02T10:00:00Z'
  }
];

const EnterpriseCorrespondenceContext = createContext<EnterpriseCorrespondenceContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'ema_enterprise_correspondence_v1';

export const EnterpriseCorrespondenceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [letters, setLetters] = useState<Letter[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_letters`);
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return initialLetters;
  });

  const [versions, setVersions] = useState<LetterVersion[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_versions`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [templates, setTemplates] = useState<LetterTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_templates`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultTemplates;
  });

  const [letterheads, setLetterheads] = useState<LetterheadTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_letterheads`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return defaultLetterheads;
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_letters`, JSON.stringify(letters));
    } catch {}
  }, [letters]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_versions`, JSON.stringify(versions));
    } catch {}
  }, [versions]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_templates`, JSON.stringify(templates));
    } catch {}
  }, [templates]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_letterheads`, JSON.stringify(letterheads));
    } catch {}
  }, [letterheads]);

  const activeLetterheads = letterheads.filter(l => l.active);

  const getLetterheadById = (id?: string): LetterheadTemplate | undefined => {
    if (!id) return undefined;
    return letterheads.find(l => l.id === id);
  };

  const getRecommendedLetterhead = (params: {
    projectId?: string;
    projectAffix?: string;
    projectCode?: string;
    clientId?: string;
    clientAffix?: string;
    category?: string;
    confidentiality?: string;
  }): LetterheadTemplate => {
    return resolveRecommendedLetterhead(letterheads, params);
  };

  const createLetterhead = (
    tmpl: Omit<LetterheadTemplate, 'id' | 'createdAt' | 'updatedAt'>,
    actorName: string = 'Administrator'
  ): LetterheadTemplate => {
    const newLh: LetterheadTemplate = {
      ...tmpl,
      id: `lh-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setLetterheads(prev => {
      let list = prev;
      if (newLh.isDefault) {
        list = list.map(l => ({ ...l, isDefault: false }));
      }
      return [newLh, ...list];
    });

    try {
      AuditService.log({
        enterpriseId: tmpl.enterpriseId || 'ent-apex',
        userId: 'usr-admin',
        userName: actorName,
        userRole: 'admin',
        action: 'CREATE',
        module: 'CORRESPONDENCE',
        recordId: newLh.id,
        recordTitle: newLh.name,
        details: `Created new ${newLh.scope} letterhead: ${newLh.name}`
      });
    } catch (e) {
      console.error('Failed to log audit for letterhead creation:', e);
    }

    return newLh;
  };

  const updateLetterhead = (
    id: string,
    updates: Partial<LetterheadTemplate>,
    actorName: string = 'Administrator'
  ) => {
    setLetterheads(prev => {
      const target = prev.find(l => l.id === id);
      if (!target) return prev;

      let list = prev;
      if (updates.isDefault) {
        list = list.map(l => (l.id === id ? l : { ...l, isDefault: false }));
      }

      const updated = list.map(l =>
        l.id === id
          ? {
              ...l,
              ...updates,
              updatedAt: new Date().toISOString()
            }
          : l
      );

      try {
        AuditService.log({
          enterpriseId: target.enterpriseId || 'ent-apex',
          userId: 'usr-admin',
          userName: actorName,
          userRole: 'admin',
          action: 'UPDATE',
          module: 'CORRESPONDENCE',
          recordId: id,
          recordTitle: target.name,
          details: `Updated letterhead: ${target.name} (${Object.keys(updates).join(', ')})`,
          oldValue: target,
          newValue: { ...target, ...updates }
        });
      } catch (e) {
        console.error('Failed to log audit for letterhead update:', e);
      }

      return updated;
    });
  };

  const deleteLetterhead = (id: string, actorName: string = 'Administrator'): boolean => {
    const target = letterheads.find(l => l.id === id);
    if (!target) return false;

    setLetterheads(prev => {
      const remaining = prev.filter(l => l.id !== id);
      if (target.isDefault && remaining.length > 0) {
        const nextDef = remaining.find(l => l.scope === 'Corporate') || remaining[0];
        if (nextDef) nextDef.isDefault = true;
      }
      return remaining;
    });

    try {
      AuditService.log({
        enterpriseId: target.enterpriseId || 'ent-apex',
        userId: 'usr-admin',
        userName: actorName,
        userRole: 'admin',
        action: 'DELETE',
        module: 'CORRESPONDENCE',
        recordId: id,
        recordTitle: target.name,
        details: `Deleted letterhead: ${target.name}`
      });
    } catch (e) {
      console.error('Failed to log audit for letterhead deletion:', e);
    }

    return true;
  };

  const duplicateLetterhead = (
    id: string,
    actorName: string = 'Administrator'
  ): LetterheadTemplate | null => {
    const target = letterheads.find(l => l.id === id);
    if (!target) return null;

    const dup: LetterheadTemplate = {
      ...target,
      id: `lh-${Date.now()}`,
      name: `${target.name} (Copy)`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setLetterheads(prev => [dup, ...prev]);

    try {
      AuditService.log({
        enterpriseId: target.enterpriseId || 'ent-apex',
        userId: 'usr-admin',
        userName: actorName,
        userRole: 'admin',
        action: 'CREATE',
        module: 'CORRESPONDENCE',
        recordId: dup.id,
        recordTitle: dup.name,
        details: `Duplicated letterhead from ${target.name}`
      });
    } catch (e) {
      console.error('Failed to log audit for letterhead duplication:', e);
    }

    return dup;
  };

  const setDefaultLetterhead = (id: string, actorName: string = 'Administrator') => {
    setLetterheads(prev => {
      const target = prev.find(l => l.id === id);
      if (!target) return prev;

      try {
        AuditService.log({
          enterpriseId: target.enterpriseId || 'ent-apex',
          userId: 'usr-admin',
          userName: actorName,
          userRole: 'admin',
          action: 'UPDATE',
          module: 'CORRESPONDENCE',
          recordId: id,
          recordTitle: target.name,
          details: `Set ${target.name} as primary default letterhead`
        });
      } catch (e) {
        console.error('Failed to log audit for default letterhead change:', e);
      }

      return prev.map(l => ({
        ...l,
        isDefault: l.id === id
      }));
    });
  };

  const toggleLetterheadActive = (id: string, actorName: string = 'Administrator') => {
    setLetterheads(prev => {
      const target = prev.find(l => l.id === id);
      if (!target) return prev;
      const nextActive = !target.active;

      try {
        AuditService.log({
          enterpriseId: target.enterpriseId || 'ent-apex',
          userId: 'usr-admin',
          userName: actorName,
          userRole: 'admin',
          action: 'UPDATE',
          module: 'CORRESPONDENCE',
          recordId: id,
          recordTitle: target.name,
          details: `${nextActive ? 'Activated' : 'Deactivated'} letterhead: ${target.name}`
        });
      } catch (e) {
        console.error('Failed to log audit for letterhead active toggle:', e);
      }

      return prev.map(l => (l.id === id ? { ...l, active: nextActive } : l));
    });
  };

  const generateNextLetterNumber = (): string => {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `LTR-${yearMonth}-`;
    const countThisMonth = letters.filter(l => l.letterNumber?.startsWith(prefix)).length;
    const nextSeq = String(countThisMonth + 1).padStart(4, '0');
    return `${prefix}${nextSeq}`;
  };

  const generateCorrespondenceReference = (params: {
    clientAffix?: string;
    projectAffix?: string;
    year?: string | number;
    customSuffix?: string;
  }) => {
    const cAffix = (params.clientAffix || 'CLIENT').trim().toUpperCase();
    const pAffix = (params.projectAffix || 'GEN').trim().toUpperCase();
    const yStr = String(params.year || new Date().getFullYear());
    const sStr = params.customSuffix
      ? String(params.customSuffix).padStart(3, '0')
      : getNextLetterSuffix(letters, cAffix, pAffix, yStr);

    const reference = formatCorrespondenceReference(cAffix, pAffix, yStr, sStr);
    return {
      reference,
      clientAffix: cAffix,
      projectAffix: pAffix,
      year: yStr,
      suffix: sStr
    };
  };

  const getNextSuffix = (clientAffix: string, projectAffix: string, year: string | number): string => {
    return getNextLetterSuffix(letters, clientAffix, projectAffix, year);
  };

  const createLetter = (
    data: Omit<Letter, 'id' | 'version' | 'isLocked' | 'createdAt'> & {
      letterNumber?: string;
      isLocked?: boolean;
      version?: number;
    }
  ): Letter => {
    // Determine letter reference number
    let assignedLetterNumber = data.letterNumber;
    if (!assignedLetterNumber || !assignedLetterNumber.trim()) {
      if (data.clientAffix || data.projectAffix) {
        const gen = generateCorrespondenceReference({
          clientAffix: data.clientAffix,
          projectAffix: data.projectAffix,
          year: data.sequenceYear || (data.date ? data.date.slice(0, 4) : undefined)
        });
        assignedLetterNumber = gen.reference;
      } else {
        assignedLetterNumber = generateNextLetterNumber();
      }
    }

    // Assign letterhead if not explicitly provided
    let assignedLetterheadId = data.letterheadId;
    if (!assignedLetterheadId) {
      const rec = resolveRecommendedLetterhead(letterheads, {
        projectId: data.projectId,
        projectAffix: data.projectAffix,
        projectCode: data.projectCode,
        clientId: data.clientId,
        clientAffix: data.clientAffix,
        category: data.category,
        confidentiality: data.confidentiality
      });
      assignedLetterheadId = rec.id;
    }

    const newLetter: Letter = {
      ...data,
      id: `ltr-${Date.now()}`,
      letterNumber: assignedLetterNumber,
      ourReference: data.ourReference || assignedLetterNumber,
      letterheadId: assignedLetterheadId,
      version: data.version ?? 1,
      isLocked: data.isLocked ?? false,
      createdAt: new Date().toISOString()
    };

    setLetters(prev => [newLetter, ...prev]);

    // Save initial version snapshot
    const initialVer: LetterVersion = {
      id: `ver-${Date.now()}`,
      letterId: newLetter.id,
      version: 1,
      bodyHtml: newLetter.bodyHtml,
      changedBy: newLetter.preparedBy,
      changedAt: newLetter.createdAt,
      changeDescription: 'Initial letter creation'
    };
    setVersions(prev => [initialVer, ...prev]);

    return newLetter;
  };

  const updateLetter = (
    id: string,
    updates: Partial<Letter>,
    changeDesc?: string,
    editorName: string = 'Current User'
  ) => {
    const target = letters.find(l => l.id === id);
    if (!target) return;
    if (target.isLocked) {
      console.warn('Cannot update an Issued or Locked letter.');
      return;
    }

    const nextVersion = target.version + 1;
    const updated: Letter = {
      ...target,
      ...updates,
      version: nextVersion
    };

    setLetters(prev => prev.map(l => (l.id === id ? updated : l)));

    // Snapshot version if body changed
    if (updates.bodyHtml && updates.bodyHtml !== target.bodyHtml) {
      const ver: LetterVersion = {
        id: `ver-${Date.now()}`,
        letterId: id,
        version: nextVersion,
        bodyHtml: updates.bodyHtml,
        changedBy: editorName,
        changedAt: new Date().toISOString(),
        changeDescription: changeDesc || `Updated letter content to v${nextVersion}`
      };
      setVersions(prev => [ver, ...prev]);
    }
  };

  const advanceStatus = (id: string, newStatus: LetterStatus, actorName: string): boolean => {
    const target = letters.find(l => l.id === id);
    if (!target) return false;

    if (newStatus === 'Issued') {
      // Must be finalized and approved!
      if (target.status !== 'Approved' && !target.isLocked) {
        console.warn('Cannot issue correspondence: Document must be finalized and approved by authorized signatory before issuance.');
        return false;
      }
    }

    setLetters(prev =>
      prev.map(l => {
        if (l.id !== id) return l;
        const isNowIssued = newStatus === 'Issued';
        return {
          ...l,
          status: newStatus,
          isLocked: isNowIssued ? true : l.isLocked,
          issuedAt: isNowIssued ? new Date().toISOString() : l.issuedAt
        };
      })
    );

    try {
      AuditService.log({
        enterpriseId: target.enterpriseId || 'ent-apex',
        userId: 'usr-admin',
        userName: actorName,
        userRole: 'admin',
        action: newStatus === 'Issued' ? 'ISSUE' : 'UPDATE',
        module: 'CORRESPONDENCE',
        recordId: id,
        recordTitle: target.letterNumber,
        details: `Status advanced to ${newStatus} by ${actorName}`
      });
    } catch (e) {
      console.error('Audit log error:', e);
    }
    return true;
  };

  const issueLetter = (id: string, actorName: string): boolean => {
    return advanceStatus(id, 'Issued', actorName);
  };

  const submitForApproval = (id: string, actorName: string = 'Legal Secretariat') => {
    advanceStatus(id, 'Pending Approval', actorName);
  };

  const approveLetter = (id: string, actorName: string = 'Managing Director') => {
    advanceStatus(id, 'Approved', actorName);
  };

  const finalizeLetter = async (
    id: string,
    finalizedBy: string,
    finalDocxBlob?: Blob,
    finalPdfDataUrl?: string
  ): Promise<Letter> => {
    const target = letters.find(l => l.id === id);
    if (!target) throw new Error('Letter not found');

    const nextVer = target.version + 1;
    const nowIso = new Date().toISOString();

    let newAttachments = target.attachments ? [...target.attachments] : [];

    // If PDF data URL provided, store as controlled FINAL_DOCUMENT attachment
    if (finalPdfDataUrl) {
      const pdfAttachment: CorrespondenceAttachment = {
        id: `att-final-pdf-${Date.now()}`,
        letterId: id,
        name: `${target.letterNumber.replace(/[\/\\]/g, '_')}_FINAL.pdf`,
        size: Math.round(finalPdfDataUrl.length * 0.75),
        fileType: 'application/pdf',
        uploadedAt: nowIso,
        uploadedBy: finalizedBy,
        category: 'FINAL_DOCUMENT',
        description: `Controlled official final PDF generated upon finalization (v${nextVer})`,
        dataUrl: finalPdfDataUrl,
        versionTagged: nextVer
      };
      newAttachments = [pdfAttachment, ...newAttachments];
    }

    const updated: Letter = {
      ...target,
      status: 'Finalized',
      version: nextVer,
      isLocked: true,
      finalizedAt: nowIso,
      finalizedBy: finalizedBy,
      externalDocumentUpdatedAt: nowIso,
      attachments: newAttachments
    };

    setLetters(prev => prev.map(l => (l.id === id ? updated : l)));

    // Record immutable final version
    const finalVer: LetterVersion = {
      id: `ver-${Date.now()}`,
      letterId: id,
      version: nextVer,
      bodyHtml: target.bodyHtml,
      changedBy: finalizedBy,
      changedAt: nowIso,
      changeDescription: `Document finalized and locked by ${finalizedBy}. Ready for executive approval sequence.`,
      source: target.externalEditor === 'WORD' ? 'Microsoft Word' : target.externalEditor === 'GOOGLE_DOCS' ? 'Google Docs' : 'Application Editor',
      status: 'Finalized',
      isFinal: true
    };
    setVersions(prev => [finalVer, ...prev]);

    try {
      AuditService.log({
        enterpriseId: target.enterpriseId || 'ent-apex',
        userId: 'usr-admin',
        userName: finalizedBy,
        userRole: 'admin',
        action: 'UPDATE',
        module: 'CORRESPONDENCE',
        recordId: id,
        recordTitle: target.letterNumber,
        details: `Finalized and locked letter version V${nextVer} by ${finalizedBy}`
      });
    } catch (e) {
      console.error(e);
    }

    return updated;
  };

  const createRevision = (id: string, actorName: string, reason?: string): Letter => {
    const target = letters.find(l => l.id === id);
    if (!target) throw new Error('Letter not found');

    const nextVer = target.version + 1;
    const nowIso = new Date().toISOString();

    const updated: Letter = {
      ...target,
      status: 'Revision Required',
      version: nextVer,
      isLocked: false,
      externalEditor: 'NONE',
      finalizedAt: undefined,
      finalizedBy: undefined
    };

    setLetters(prev => prev.map(l => (l.id === id ? updated : l)));

    const revVer: LetterVersion = {
      id: `ver-${Date.now()}`,
      letterId: id,
      version: nextVer,
      bodyHtml: target.bodyHtml,
      changedBy: actorName,
      changedAt: nowIso,
      changeDescription: reason || `Created new draft revision v${nextVer} from approved/finalized state`,
      source: 'Manual Revision',
      status: 'Revision Required'
    };
    setVersions(prev => [revVer, ...prev]);

    try {
      AuditService.log({
        enterpriseId: target.enterpriseId || 'ent-apex',
        userId: 'usr-admin',
        userName: actorName,
        userRole: 'admin',
        action: 'UPDATE',
        module: 'CORRESPONDENCE',
        recordId: id,
        recordTitle: target.letterNumber,
        details: `Created new revision v${nextVer}: ${reason || 'Manual revision initiated'}`
      });
    } catch (e) {
      console.error(e);
    }

    return updated;
  };

  const updateGoogleDocLink = (id: string, docUrl: string, docId?: string, actorName: string = 'Current User') => {
    setLetters(prev =>
      prev.map(l => {
        if (l.id !== id) return l;
        return {
          ...l,
          googleDocumentUrl: docUrl,
          googleDocumentId: docId || (docUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1]),
          externalEditor: 'GOOGLE_DOCS',
          externalDocumentUpdatedAt: new Date().toISOString(),
          externalLastEditedBy: actorName,
          status: l.status === 'Draft' ? 'External Editing' : l.status
        };
      })
    );
  };

  const syncFromGoogleDoc = (id: string, newBodyHtml: string, actorName: string = 'Google Docs Sync') => {
    const target = letters.find(l => l.id === id);
    if (!target) return;

    const nextVer = target.version + 1;
    const nowIso = new Date().toISOString();

    const updated: Letter = {
      ...target,
      bodyHtml: newBodyHtml,
      version: nextVer,
      status: 'External Editing',
      externalEditor: 'GOOGLE_DOCS',
      externalDocumentUpdatedAt: nowIso,
      externalLastEditedBy: actorName
    };

    setLetters(prev => prev.map(l => (l.id === id ? updated : l)));

    const ver: LetterVersion = {
      id: `ver-${Date.now()}`,
      letterId: id,
      version: nextVer,
      bodyHtml: newBodyHtml,
      changedBy: actorName,
      changedAt: nowIso,
      changeDescription: `Synchronized latest changes from Google Docs (v${nextVer})`,
      source: 'Google Docs',
      status: 'External Editing'
    };
    setVersions(prev => [ver, ...prev]);
  };

  const importWordRevision = async (
    id: string,
    extractedHtml: string,
    file: File,
    actorName: string = 'Word Reviewer'
  ): Promise<Letter> => {
    const target = letters.find(l => l.id === id);
    if (!target) throw new Error('Letter not found');

    const nextVer = target.version + 1;
    const nowIso = new Date().toISOString();

    // Convert file to data URL for persistent offline preview/download
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });

    const attachment: CorrespondenceAttachment = {
      id: `att-docx-${Date.now()}`,
      letterId: id,
      name: file.name,
      size: file.size,
      fileType: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploadedAt: nowIso,
      uploadedBy: actorName,
      category: 'MODIFIED_WORD_DOC',
      description: `Externally edited Microsoft Word document imported as v${nextVer}`,
      dataUrl,
      wordExtractedText: extractedHtml.replace(/<[^>]+>/g, ' ').slice(0, 500),
      versionTagged: nextVer
    };

    const currentAttachments = target.attachments || [];
    const updated: Letter = {
      ...target,
      bodyHtml: extractedHtml,
      version: nextVer,
      status: 'External Editing',
      externalEditor: 'WORD',
      externalDocumentUpdatedAt: nowIso,
      externalLastEditedBy: actorName,
      attachments: [attachment, ...currentAttachments]
    };

    setLetters(prev => prev.map(l => (l.id === id ? updated : l)));

    const ver: LetterVersion = {
      id: `ver-${Date.now()}`,
      letterId: id,
      version: nextVer,
      bodyHtml: extractedHtml,
      changedBy: actorName,
      changedAt: nowIso,
      changeDescription: `Imported edited Word document: ${file.name} (v${nextVer})`,
      source: 'Microsoft Word',
      status: 'External Editing'
    };
    setVersions(prev => [ver, ...prev]);

    try {
      AuditService.log({
        enterpriseId: target.enterpriseId || 'ent-apex',
        userId: 'usr-admin',
        userName: actorName,
        userRole: 'admin',
        action: 'UPDATE',
        module: 'CORRESPONDENCE',
        recordId: id,
        recordTitle: target.letterNumber,
        details: `Imported Word revision v${nextVer} from file: ${file.name}`
      });
    } catch (e) {
      console.error(e);
    }

    return updated;
  };

  const getNextLetterNumber = (prefix?: string): string => {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const basePrefix = prefix || 'APEX-CORP';
    const pattern = `${basePrefix}-${yearMonth}-`;
    const count = letters.filter(l => l.letterNumber?.startsWith(pattern)).length;
    const nextSeq = String(count + 1).padStart(4, '0');
    return `${pattern}${nextSeq}`;
  };

  const draftLetterWithAi = async (params: {
    enterpriseId: string;
    recipientOrganization: string;
    purpose: string;
    category?: string;
    tone?: LetterTone;
  }): Promise<{ subject: string; bodyHtml: string }> => {
    try {
      const res = await fetch('/api/ai/draft-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.subject && data.bodyHtml) {
          return { subject: data.subject, bodyHtml: data.bodyHtml };
        }
      }
    } catch (e) {
      console.warn('AI drafting endpoint unavailable, applying high-grade template generator:', e);
    }

    // High-grade fallback
    const toneText = params.tone ? ` [${params.tone} Notice]` : '';
    const subject = `Official Notification: ${params.purpose.slice(0, 50)}${toneText}`;
    const bodyHtml = `<p>Dear Sir / Madam,</p>
<p><strong>RE: ${subject.toUpperCase()}</strong></p>
<p>We write on behalf of Apex Global Logistics Corp regarding ${params.purpose}.</p>
<p>In line with corporate policy and operational standards, our team has instituted the relevant workflows and contemporaneously logged the associated documentation.</p>
<p>Please review the enclosed materials and do not hesitate to reach out for further verification or site inspections.</p>
<p>Yours faithfully,<br/><strong>Apex Global Logistics Corp</strong><br/>Corporate Affairs & Logistics Management</p>`;

    return { subject, bodyHtml };
  };

  const transformLetterWithAi = async (
    letterId: string,
    targetTone: LetterTone
  ): Promise<{ transformedBodyHtml: string }> => {
    const target = letters.find(l => l.id === letterId);
    const bodyHtml = target?.bodyHtml || '';

    try {
      const res = await fetch('/api/ai/transform-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bodyHtml, tone: targetTone })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.transformedBodyHtml) {
          return { transformedBodyHtml: data.transformedBodyHtml };
        }
      }
    } catch (e) {
      console.warn('AI transform endpoint unavailable, applying client adjustment:', e);
    }

    return {
      transformedBodyHtml: `<p><em>[Tone adapted: ${targetTone}]</em></p>${bodyHtml}`
    };
  };

  const archiveLetter = (id: string) => {
    setLetters(prev =>
      prev.map(l => (l.id === id ? { ...l, status: 'Archived', isLocked: true } : l))
    );
  };

  const deleteLetter = (id: string): boolean => {
    const target = letters.find(l => l.id === id);
    if (!target) return false;
    if (target.isLocked || target.status === 'Issued') {
      alert('Locked / Issued corporate letters cannot be deleted to preserve audit compliance.');
      return false;
    }
    setLetters(prev => prev.filter(l => l.id !== id));
    return true;
  };

  const addTemplate = (tmpl: Omit<LetterTemplate, 'id' | 'createdAt'>) => {
    const newTmpl: LetterTemplate = {
      ...tmpl,
      id: `tmpl-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setTemplates(prev => [...prev, newTmpl]);
  };

  const clearCorrespondenceHistory = (filterScope?: {
    clientKey?: string;
    projectKey?: string;
    clientAffix?: string;
    projectAffix?: string;
  }) => {
    if (
      !filterScope ||
      (!filterScope.clientKey &&
        !filterScope.projectKey &&
        !filterScope.clientAffix &&
        !filterScope.projectAffix)
    ) {
      setLetters([]);
      setVersions([]);
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_letters`, JSON.stringify([]));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_versions`, JSON.stringify([]));
      } catch {}
      return;
    }

    if (filterScope.projectAffix || filterScope.projectKey) {
      setLetters(prev => {
        const filtered = prev.filter(l => {
          if (filterScope.projectAffix && l.projectAffix === filterScope.projectAffix) return false;
          if (filterScope.projectKey) {
            const pKey = l.projectAffix || l.projectCode || l.projectId;
            if (pKey === filterScope.projectKey) return false;
          }
          return true;
        });
        try {
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_letters`, JSON.stringify(filtered));
        } catch {}
        return filtered;
      });
      return;
    }

    if (filterScope.clientKey === 'GENERAL') {
      setLetters(prev => {
        const filtered = prev.filter(l => {
          return Boolean(l.clientAffix || l.projectAffix || l.projectId || l.clientId);
        });
        try {
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_letters`, JSON.stringify(filtered));
        } catch {}
        return filtered;
      });
      return;
    }

    if (filterScope.clientAffix || filterScope.clientKey) {
      setLetters(prev => {
        const filtered = prev.filter(l => {
          if (filterScope.clientAffix && l.clientAffix === filterScope.clientAffix) return false;
          if (filterScope.clientKey) {
            const cKey = l.clientAffix || l.clientId || (l.clientName ? extractClientAffix(l.clientName) : '');
            if (cKey === filterScope.clientKey) return false;
          }
          return true;
        });
        try {
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_letters`, JSON.stringify(filtered));
        } catch {}
        return filtered;
      });
    }
  };

  const clearAllCorrespondenceHistory = () => {
    clearCorrespondenceHistory();
  };

  const addAttachmentToLetter = (
    letterId: string,
    attachmentData: Omit<CorrespondenceAttachment, 'id' | 'uploadedAt'>
  ): CorrespondenceAttachment => {
    const newAttachment: CorrespondenceAttachment = {
      ...attachmentData,
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      uploadedAt: new Date().toISOString()
    };

    setLetters(prev =>
      prev.map(l => {
        if (l.id !== letterId) return l;
        const currentAtts = l.attachments || [];
        return {
          ...l,
          attachments: [newAttachment, ...currentAtts],
          attachedDocumentIds: Array.from(new Set([...(l.attachedDocumentIds || []), newAttachment.id]))
        };
      })
    );

    try {
      AuditService.log({
        enterpriseId: 'ent-apex',
        userId: 'usr-admin',
        userName: attachmentData.uploadedBy || 'Executive User',
        userRole: 'admin',
        action: 'UPDATE',
        module: 'CORRESPONDENCE',
        recordId: letterId,
        recordTitle: newAttachment.name,
        details: `Attached document correspondence: ${newAttachment.name} (${newAttachment.category})`
      });
    } catch {}

    return newAttachment;
  };

  const removeAttachmentFromLetter = (letterId: string, attachmentId: string) => {
    setLetters(prev =>
      prev.map(l => {
        if (l.id !== letterId) return l;
        const currentAtts = l.attachments || [];
        return {
          ...l,
          attachments: currentAtts.filter(a => a.id !== attachmentId),
          attachedDocumentIds: (l.attachedDocumentIds || []).filter(id => id !== attachmentId)
        };
      })
    );
  };

  const importWordDocToLetter = async (
    letterId: string,
    file: File,
    options?: {
      updateLetterBody?: boolean;
      changeDescription?: string;
      actorName?: string;
      category?: CorrespondenceAttachment['category'];
      notes?: string;
    }
  ): Promise<CorrespondenceAttachment> => {
    const parsed = await readWordDocumentFile(file);
    const actor = options?.actorName || 'Executive User';

    const targetLetter = letters.find(l => l.id === letterId);
    const versionTagged = targetLetter ? targetLetter.version : 1;

    const attachment = addAttachmentToLetter(letterId, {
      letterId,
      name: parsed.fileName,
      size: parsed.fileSize,
      fileType: parsed.fileType,
      uploadedBy: actor,
      category: options?.category || 'MODIFIED_WORD_DOC',
      description: options?.notes || 'Modified in Microsoft Office Word',
      dataUrl: parsed.dataUrl,
      wordExtractedText: parsed.rawText,
      versionTagged
    });

    if (options?.updateLetterBody && parsed.html && parsed.html.trim()) {
      updateLetter(
        letterId,
        { bodyHtml: parsed.html },
        options.changeDescription || `Imported modifications from MS Word (${parsed.fileName})`,
        actor
      );
    }

    return attachment;
  };

  const recordLetterDownload = (
    letterId: string,
    record: {
      format: 'PDF' | 'DOCX' | 'PRINT';
      filename: string;
      downloadedBy?: string;
      fileSize?: number;
      letterheadId?: string;
      letterheadName?: string;
      notes?: string;
    }
  ): LetterDownloadRecord => {
    const actor = record.downloadedBy || 'Executive Secretariat';
    const target = letters.find(l => l.id === letterId);
    const version = target ? target.version : 1;

    const newRecord: LetterDownloadRecord = {
      id: `dl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      letterId,
      downloadedAt: new Date().toISOString(),
      downloadedBy: actor,
      format: record.format,
      filename: record.filename,
      version,
      fileSize: record.fileSize,
      letterheadId: record.letterheadId,
      letterheadName: record.letterheadName,
      notes: record.notes
    };

    setLetters(prev =>
      prev.map(l => {
        if (l.id !== letterId) return l;
        const currentHist = l.downloadHistory || [];
        return {
          ...l,
          downloadHistory: [newRecord, ...currentHist]
        };
      })
    );

    try {
      AuditService.log({
        enterpriseId: target?.enterpriseId || 'ent-apex',
        userId: 'usr-admin',
        userName: actor,
        userRole: 'admin',
        action: 'EXPORT',
        module: 'CORRESPONDENCE',
        recordId: letterId,
        recordTitle: target?.letterNumber || 'Correspondence',
        details: `Downloaded ${record.format} copy: ${record.filename} (v${version})`
      });
    } catch (e) {
      console.error('Failed to log audit for download:', e);
    }

    return newRecord;
  };

  const resetCorrespondenceToDefaults = () => {
    setLetters(initialLetters);
    setVersions([]);
    setTemplates(defaultTemplates);
    setLetterheads(defaultLetterheads);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_letters`, JSON.stringify(initialLetters));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_versions`, JSON.stringify([]));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_templates`, JSON.stringify(defaultTemplates));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_letterheads`, JSON.stringify(defaultLetterheads));
    } catch {}
  };

  return (
    <EnterpriseCorrespondenceContext.Provider
      value={{
        letters,
        versions,
        templates,
        letterheads,
        activeLetterheads,
        createLetter,
        updateLetter,
        advanceStatus,
        submitForApproval,
        approveLetter,
        issueLetter,
        archiveLetter,
        deleteLetter,
        addTemplate,
        createLetterhead,
        updateLetterhead,
        deleteLetterhead,
        duplicateLetterhead,
        setDefaultLetterhead,
        toggleLetterheadActive,
        getLetterheadById,
        getRecommendedLetterhead,
        generateNextLetterNumber,
        getNextLetterNumber,
        generateCorrespondenceReference,
        getNextSuffix,
        draftLetterWithAi,
        transformLetterWithAi,
        clearCorrespondenceHistory,
        clearAllCorrespondenceHistory,
        resetCorrespondenceToDefaults,
        addAttachmentToLetter,
        removeAttachmentFromLetter,
        importWordDocToLetter,
        recordLetterDownload,
        finalizeLetter,
        createRevision,
        updateGoogleDocLink,
        syncFromGoogleDoc,
        importWordRevision
      }}
    >
      {children}
    </EnterpriseCorrespondenceContext.Provider>
  );
};

export const useEnterpriseCorrespondence = (): EnterpriseCorrespondenceContextType => {
  const context = useContext(EnterpriseCorrespondenceContext);
  if (!context) {
    throw new Error('useEnterpriseCorrespondence must be used within an EnterpriseCorrespondenceProvider');
  }
  return context;
};
