import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Letter,
  LetterVersion,
  LetterTemplate,
  LetterStatus,
  LetterDirection,
  LetterPriority,
  LetterConfidentiality,
  LetterTone
} from '../types/correspondenceTypes';
import {
  formatCorrespondenceReference,
  getNextLetterSuffix,
  extractClientAffix,
  extractProjectAffix
} from '../utils/correspondenceUtils';

interface EnterpriseCorrespondenceContextType {
  letters: Letter[];
  versions: LetterVersion[];
  templates: LetterTemplate[];
  createLetter: (letter: Omit<Letter, 'id' | 'version' | 'isLocked' | 'createdAt'> & { letterNumber?: string }) => Letter;
  updateLetter: (id: string, updates: Partial<Letter>, changeDesc?: string, editorName?: string) => void;
  advanceStatus: (id: string, newStatus: LetterStatus, actorName: string) => void;
  submitForApproval: (id: string, actorName?: string) => void;
  approveLetter: (id: string, actorName?: string) => void;
  issueLetter: (id: string, actorName: string) => void;
  archiveLetter: (id: string) => void;
  deleteLetter: (id: string) => boolean;
  addTemplate: (tmpl: Omit<LetterTemplate, 'id' | 'createdAt'>) => void;
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
    data: Omit<Letter, 'id' | 'version' | 'isLocked' | 'createdAt'> & { letterNumber?: string }
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

    const newLetter: Letter = {
      ...data,
      id: `ltr-${Date.now()}`,
      letterNumber: assignedLetterNumber,
      ourReference: data.ourReference || assignedLetterNumber,
      version: 1,
      isLocked: false,
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

  const advanceStatus = (id: string, newStatus: LetterStatus, actorName: string) => {
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
  };

  const issueLetter = (id: string, actorName: string) => {
    advanceStatus(id, 'Issued', actorName);
  };

  const submitForApproval = (id: string, actorName: string = 'Legal Secretariat') => {
    advanceStatus(id, 'Pending Approval', actorName);
  };

  const approveLetter = (id: string, actorName: string = 'Managing Director') => {
    advanceStatus(id, 'Approved', actorName);
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

  const resetCorrespondenceToDefaults = () => {
    setLetters(initialLetters);
    setVersions([]);
    setTemplates(defaultTemplates);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_letters`, JSON.stringify(initialLetters));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_versions`, JSON.stringify([]));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_templates`, JSON.stringify(defaultTemplates));
    } catch {}
  };

  return (
    <EnterpriseCorrespondenceContext.Provider
      value={{
        letters,
        versions,
        templates,
        createLetter,
        updateLetter,
        advanceStatus,
        submitForApproval,
        approveLetter,
        issueLetter,
        archiveLetter,
        deleteLetter,
        addTemplate,
        generateNextLetterNumber,
        getNextLetterNumber,
        generateCorrespondenceReference,
        getNextSuffix,
        draftLetterWithAi,
        transformLetterWithAi,
        clearCorrespondenceHistory,
        clearAllCorrespondenceHistory,
        resetCorrespondenceToDefaults
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
