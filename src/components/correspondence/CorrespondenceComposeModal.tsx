import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Send,
  Sparkles,
  Wand2,
  Copy,
  Check,
  Building2,
  Briefcase,
  Layers,
  FileText,
  Calendar,
  Hash,
  RefreshCw,
  FolderOpen,
  Landmark,
  CheckCircle2,
  MapPin,
  ExternalLink,
  Eye,
  Ruler,
  Download,
  Upload,
  Globe,
  Lock,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  Info
} from 'lucide-react';
import { useEnterpriseCorrespondence } from '../../context/EnterpriseCorrespondenceContext';
import { useEnterpriseCompany } from '../../context/EnterpriseCompanyContext';
import { useEnterpriseBanking } from '../../context/EnterpriseBankingContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import {
  Letter,
  LetterTemplate,
  LetterheadVariant,
  LetterTone,
  LetterheadTemplate,
  CorrespondenceAttachment
} from '../../types/correspondenceTypes';
import { LetterheadPreviewModal } from './LetterheadPreviewModal';
import { GoogleDocsConnectModal } from './GoogleDocsConnectModal';
import { CorrespondenceFinalizeModal } from './CorrespondenceFinalizeModal';
import { exportLetterToWord } from '../../services/export/wordExportService';
import { readWordDocumentFile } from '../../services/export/wordImportService';
import { validateImportedLetterIntegrity } from '../../utils/letterheadProtection';
import {
  extractClientAffix,
  extractProjectAffix,
  formatCorrespondenceReference,
  getNextLetterSuffix
} from '../../utils/correspondenceUtils';

interface CorrespondenceComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClientAffix?: string;
  initialClientName?: string;
  initialProjectAffix?: string;
  initialProjectCode?: string;
  initialProjectName?: string;
  initialLetterheadId?: string;
  onLetterCreated: (createdLetter: Letter) => void;
}

export const CorrespondenceComposeModal: React.FC<CorrespondenceComposeModalProps> = ({
  isOpen,
  onClose,
  initialClientAffix,
  initialClientName,
  initialProjectAffix,
  initialProjectCode,
  initialProjectName,
  initialLetterheadId,
  onLetterCreated
}) => {
  const {
    letters,
    templates,
    letterheads,
    activeLetterheads,
    createLetter,
    draftLetterWithAi,
    generateCorrespondenceReference,
    getRecommendedLetterhead
  } = useEnterpriseCorrespondence();

  const { clients, profile } = useEnterpriseCompany();
  const { registeredBanks } = useEnterpriseBanking();
  const { projects } = usePettyCash();
  const { currentEnterprise } = useEnterprise();

  // Entity Type: Client/Employer vs Registered Bank/Financial Institution
  const [entityType, setEntityType] = useState<'CLIENT' | 'BANK'>('CLIENT');
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [selectedBankBranch, setSelectedBankBranch] = useState<string>('');

  // Selected Client State
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientName, setClientName] = useState<string>(initialClientName || '');
  const [clientAffix, setClientAffix] = useState<string>(
    initialClientAffix || (initialClientName ? extractClientAffix(initialClientName) : 'RDA')
  );
  const [isCustomClient, setIsCustomClient] = useState<boolean>(false);

  // Selected Project State
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projectCode, setProjectCode] = useState<string>(initialProjectCode || '');
  const [projectName, setProjectName] = useState<string>(initialProjectName || '');
  const [projectAffix, setProjectAffix] = useState<string>(
    initialProjectAffix || (initialProjectCode ? extractProjectAffix(initialProjectCode) : 'PIDM26')
  );
  const [isCustomProject, setIsCustomProject] = useState<boolean>(false);

  // Date & Year State
  const [letterDate, setLetterDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const initiatedYear = useMemo(() => {
    try {
      return letterDate ? letterDate.slice(0, 4) : String(new Date().getFullYear());
    } catch {
      return String(new Date().getFullYear());
    }
  }, [letterDate]);

  // Sequential Order Suffix
  const [suffix, setSuffix] = useState<string>('001');
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  // Auto-calculate Suffix when client, project, or year changes
  useEffect(() => {
    const nextSuf = getNextLetterSuffix(letters, clientAffix, projectAffix, initiatedYear);
    setSuffix(nextSuf);
  }, [letters, clientAffix, projectAffix, initiatedYear]);

  // Live Reference Number
  const liveReference = useMemo(() => {
    return formatCorrespondenceReference(clientAffix, projectAffix, initiatedYear, suffix);
  }, [clientAffix, projectAffix, initiatedYear, suffix]);

  // Selected Bank Object
  const selectedBankObj = useMemo(() => {
    return registeredBanks.find(
      b => b.id === selectedBankId ||
           (clientName && b.bankName.toLowerCase() === clientName.toLowerCase()) ||
           (clientAffix && b.shortName?.toUpperCase() === clientAffix.toUpperCase())
    );
  }, [registeredBanks, selectedBankId, clientName, clientAffix]);

  // Re-sync initial props when modal opens or banks change
  useEffect(() => {
    if (initialClientName || initialClientAffix) {
      const matchBank = registeredBanks.find(
        b => (initialClientAffix && b.shortName?.toUpperCase() === initialClientAffix.toUpperCase()) ||
             (initialClientName && b.bankName.toLowerCase() === initialClientName.toLowerCase())
      );
      if (matchBank) {
        setEntityType('BANK');
        setSelectedBankId(matchBank.id);
        setClientName(matchBank.bankName);
        setClientAffix(matchBank.shortName || extractClientAffix(matchBank.bankName));
        setRecipientOrg(matchBank.bankName);
        setCategory('Bank');
        setLetterheadVariant('Finance');
        if (matchBank.branches && matchBank.branches.length > 0) {
          setSelectedBankBranch(matchBank.branches[0]);
          setAttention(`The Senior Manager, Corporate Banking Division (${matchBank.branches[0]})`);
        } else {
          setAttention('The Senior Manager, Corporate & Commercial Banking Division');
        }
        if (matchBank.headOffice) {
          setRecipientAddress(matchBank.headOffice);
        }
      } else if (initialClientName) {
        setClientName(initialClientName);
        setClientAffix(initialClientAffix || extractClientAffix(initialClientName));
      }
    }
    if (initialProjectCode) {
      setProjectCode(initialProjectCode);
      setProjectName(initialProjectName || `Project ${initialProjectCode}`);
      setProjectAffix(initialProjectAffix || extractProjectAffix(initialProjectCode));
    }
  }, [initialClientName, initialClientAffix, initialProjectCode, initialProjectName, initialProjectAffix, registeredBanks]);

  // Combined client options (from EnterpriseCompany + PettyCash projects)
  const allClientOptions = useMemo(() => {
    const list: { id: string; name: string; affix: string }[] = [];
    const seen = new Set<string>();

    // From EnterpriseCompanyContext
    clients.forEach(c => {
      if (c.name && !seen.has(c.name.toLowerCase())) {
        seen.add(c.name.toLowerCase());
        list.push({
          id: c.id,
          name: c.name,
          affix: extractClientAffix(c.name)
        });
      }
    });

    // From PettyCash projects
    projects.forEach(p => {
      const cName = p.CLIENT || p.CLIENT_NAME;
      if (cName && !seen.has(cName.toLowerCase())) {
        seen.add(cName.toLowerCase());
        list.push({
          id: `proj-client-${cName}`,
          name: cName,
          affix: extractClientAffix(cName)
        });
      }
    });

    // Ensure common defaults exist
    const defaults = [
      { name: 'Road Development Authority (RDA)', affix: 'RDA' },
      { name: 'Central Engineering Consultancy Bureau (CECB)', affix: 'CECB' },
      { name: 'Sri Lanka Ports Authority (SLPA)', affix: 'SLPA' },
      { name: 'National Water Supply & Drainage Board (NWSDB)', affix: 'NWSDB' }
    ];

    defaults.forEach(d => {
      if (!seen.has(d.name.toLowerCase())) {
        seen.add(d.name.toLowerCase());
        list.push({ id: `def-${d.affix}`, name: d.name, affix: d.affix });
      }
    });

    return list;
  }, [clients, projects]);

  // Filter projects by selected client if possible
  const filteredProjects = useMemo(() => {
    if (!clientName) return projects;
    const lower = clientName.toLowerCase();
    const matches = projects.filter(
      p => (p.CLIENT && p.CLIENT.toLowerCase().includes(lower)) ||
           (p.CLIENT_NAME && p.CLIENT_NAME.toLowerCase().includes(lower))
    );
    return matches.length > 0 ? matches : projects;
  }, [projects, clientName]);

  // Handle Client Selection
  const handleSelectClient = (clientId: string) => {
    if (clientId === 'CUSTOM') {
      setIsCustomClient(true);
      setSelectedClientId('CUSTOM');
      setSelectedBankId('');
      return;
    }
    setIsCustomClient(false);
    setSelectedClientId(clientId);
    setSelectedBankId('');
    const found = allClientOptions.find(c => c.id === clientId);
    if (found) {
      setClientName(found.name);
      setClientAffix(found.affix);
      if (!recipientOrg || recipientOrg.includes('Bank')) {
        setRecipientOrg(found.name);
      }
    }
  };

  // Handle Bank Selection (from Registered Banks Master Registry)
  const handleSelectBank = (bankId: string) => {
    if (bankId === 'CUSTOM') {
      setIsCustomClient(true);
      setSelectedBankId('CUSTOM');
      setSelectedClientId('');
      return;
    }
    setIsCustomClient(false);
    setSelectedBankId(bankId);
    setSelectedClientId('');
    const found = registeredBanks.find(b => b.id === bankId);
    if (found) {
      setClientName(found.bankName);
      const affix = (found.shortName || extractClientAffix(found.bankName)).slice(0, 7).toUpperCase();
      setClientAffix(affix);
      setRecipientOrg(found.bankName);
      setCategory('Bank');
      setLetterheadVariant('Finance');
      if (found.branches && found.branches.length > 0) {
        setSelectedBankBranch(found.branches[0]);
        setAttention(`The Senior Manager, Corporate Banking Division (${found.branches[0]})`);
      } else {
        setSelectedBankBranch('');
        setAttention('The Senior Manager, Corporate & Commercial Banking Division');
      }
      if (found.headOffice) {
        setRecipientAddress(found.headOffice);
      }
    }
  };

  // Handle Bank Branch Change
  const handleSelectBankBranch = (branch: string) => {
    setSelectedBankBranch(branch);
    if (branch) {
      setAttention(`The Senior Manager, Corporate Banking Division (${branch})`);
    } else if (selectedBankObj) {
      setAttention('The Senior Manager, Corporate & Commercial Banking Division');
    }
  };

  // Handle Project Selection
  const handleSelectProject = (projId: string) => {
    if (projId === 'CUSTOM') {
      setIsCustomProject(true);
      setSelectedProjectId('CUSTOM');
      return;
    }
    if (projId === 'NONE') {
      setIsCustomProject(false);
      setSelectedProjectId('NONE');
      setProjectCode('GEN');
      setProjectName('General Operations');
      setProjectAffix('GEN');
      return;
    }
    setIsCustomProject(false);
    setSelectedProjectId(projId);
    const found = projects.find(p => p.id === projId || p.PROJECT_CODE === projId);
    if (found) {
      setProjectCode(found.PROJECT_CODE);
      setProjectName(found.PROJECT_NAME);
      setProjectAffix(extractProjectAffix(found.PROJECT_CODE));
    }
  };

  // Recipient & Body Details
  const [recipientOrg, setRecipientOrg] = useState(initialClientName || 'Road Development Authority (RDA)');
  const [attention, setAttention] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Project');
  const [letterheadVariant, setLetterheadVariant] = useState<LetterheadVariant>('Project');
  const [selectedLetterheadId, setSelectedLetterheadId] = useState<string>(initialLetterheadId || '');
  const [previewLetterheadTarget, setPreviewLetterheadTarget] = useState<LetterheadTemplate | null>(null);

  // Auto-resolve recommended letterhead if not explicitly set
  useEffect(() => {
    if (initialLetterheadId) {
      setSelectedLetterheadId(initialLetterheadId);
    } else if (activeLetterheads.length > 0) {
      const rec = getRecommendedLetterhead({
        clientId: selectedClientId,
        clientAffix,
        projectId: selectedProjectId,
        projectAffix,
        category
      });
      setSelectedLetterheadId(rec.id);
    }
  }, [
    initialLetterheadId,
    clientAffix,
    projectAffix,
    category,
    selectedClientId,
    selectedProjectId,
    activeLetterheads.length
  ]);

  const activeLetterheadObj = useMemo(() => {
    return letterheads.find(l => l.id === selectedLetterheadId) || activeLetterheads[0];
  }, [letterheads, activeLetterheads, selectedLetterheadId]);

  const [bodyHtml, setBodyHtml] = useState(
    '<p>Dear Sir / Madam,</p><p>We write with reference to the above-mentioned project regarding...</p>'
  );
  const [preparedBy, setPreparedBy] = useState('Samantha Perera (Executive Secretariat)');

  // AI Assistant States
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState<LetterTone>('Formal');
  const [isAiDrafting, setIsAiDrafting] = useState(false);

  // MS Word & Google Docs Document Editing States & Handlers
  const [importedWordFileName, setImportedWordFileName] = useState<string | null>(null);
  const [isImportingWord, setIsImportingWord] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const wordFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const pdfFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [googleDocUrl, setGoogleDocUrl] = useState<string | null>(null);
  const [googleDocId, setGoogleDocId] = useState<string | null>(null);
  const [isGoogleDocsModalOpen, setIsGoogleDocsModalOpen] = useState(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [isPreviewFinalModalOpen, setIsPreviewFinalModalOpen] = useState(false);
  const [wordInstructionBanner, setWordInstructionBanner] = useState<string | null>(null);
  const [attachedFinalPdf, setAttachedFinalPdf] = useState<{
    name: string;
    dataUrl: string;
    size: number;
  } | null>(null);
  const [integrityWarning, setIntegrityWarning] = useState<{
    missingFields: string[];
    missingElements: string[];
    htmlPayload: string;
    fileName: string;
  } | null>(null);

  const handleImportWordFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsImportingWord(true);
      const parsed = await readWordDocumentFile(file);
      if (parsed.html && parsed.html.trim()) {
        // Letterhead Protection Check: Validate essential header/reference fields
        const draftLetterForCheck = {
          letterNumber: liveReference,
          subject: subject,
          recipientOrganization: recipientOrg,
        } as Letter;

        const validation = validateImportedLetterIntegrity(
          parsed.html,
          draftLetterForCheck,
          currentEnterprise?.name || profile?.legalName || 'Apex Global'
        );

        if (!validation.isValid && validation.missingElements.length > 0) {
          setIntegrityWarning({
            missingFields: validation.missingElements,
            missingElements: validation.missingElements,
            htmlPayload: parsed.html,
            fileName: file.name
          });
        } else {
          setBodyHtml(parsed.html);
          setImportedWordFileName(file.name);
          setWordInstructionBanner(null);
        }
      }
    } catch (err: any) {
      console.error('Failed to parse Word document:', err);
      alert('Could not read Word document: ' + (err.message || 'Unknown error'));
    } finally {
      setIsImportingWord(false);
      if (wordFileInputRef.current) wordFileInputRef.current.value = '';
    }
  };

  const handleConfirmIntegrityBypass = () => {
    if (integrityWarning) {
      setBodyHtml(integrityWarning.htmlPayload);
      setImportedWordFileName(integrityWarning.fileName);
      setIntegrityWarning(null);
      setWordInstructionBanner(null);
    }
  };

  const handleUploadFinalPdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFinalPdf({
        name: file.name,
        dataUrl: reader.result as string,
        size: file.size
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleExportDraftToWord = async () => {
    try {
      setIsExportingWord(true);
      const draftLetterObj: Letter = {
        id: 'draft-temp',
        letterNumber: liveReference,
        ourReference: liveReference,
        direction: 'Outgoing',
        category,
        subject: subject || 'OFFICIAL DRAFT CORRESPONDENCE',
        bodyHtml,
        date: letterDate,
        recipientOrganization: recipientOrg,
        recipientAddress,
        attention,
        projectAffix,
        projectName,
        preparedBy,
        status: 'Draft',
        version: 1,
        isLocked: false,
        attachedDocumentIds: [],
        priority: 'Normal',
        confidentiality: 'Normal',
        createdAt: new Date().toISOString()
      };

      await exportLetterToWord(
        draftLetterObj,
        profile,
        currentEnterprise?.name || 'EMA CORPORATE ENTERPRISE',
        activeLetterheadObj
      );

      setWordInstructionBanner(
        "Edit this document in Microsoft Word and upload the completed version using 'Import Edited Word Document'."
      );
    } catch (err) {
      console.error('Failed to export draft to MS Word:', err);
      alert('Failed to export draft to MS Word');
    } finally {
      setIsExportingWord(false);
    }
  };

  // Template Handler
  const handleApplyTemplate = (tmplId: string) => {
    const tmpl = templates.find(t => t.id === tmplId);
    if (!tmpl) return;
    setSubject(tmpl.subjectTemplate || tmpl.name);
    setCategory(tmpl.category === 'EOT' || tmpl.category === 'Payment' ? 'Project' : tmpl.category);
    setBodyHtml(tmpl.bodyHtml);
  };

  // AI Generation Handler
  const handleAiDraft = async () => {
    if (!aiPrompt.trim()) return;
    try {
      setIsAiDrafting(true);
      const res = await draftLetterWithAi({
        enterpriseId: currentEnterprise?.id || 'ent-apex',
        recipientOrganization: recipientOrg || clientName || 'Valued Authority',
        purpose: `${aiPrompt} (Project: ${projectCode || projectAffix} - ${projectName || ''})`,
        category,
        tone: aiTone
      });

      if (res.subject) setSubject(res.subject);
      if (res.bodyHtml) setBodyHtml(res.bodyHtml);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiDrafting(false);
    }
  };

  // Copy Reference
  const handleCopyRef = () => {
    navigator.clipboard.writeText(liveReference);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const initialAttachments: CorrespondenceAttachment[] = [];
    if (attachedFinalPdf) {
      initialAttachments.push({
        id: `att-pdf-${Date.now()}`,
        letterId: 'pending',
        name: attachedFinalPdf.name,
        size: attachedFinalPdf.size,
        fileType: 'application/pdf',
        uploadedAt: new Date().toISOString(),
        uploadedBy: preparedBy,
        category: 'FINAL_DOCUMENT',
        description: 'Uploaded official final PDF document',
        dataUrl: attachedFinalPdf.dataUrl,
        versionTagged: 1
      });
    }

    const newLetterData = {
      letterNumber: liveReference,
      ourReference: liveReference,
      direction: 'Outgoing' as const,
      category,
      clientId: selectedClientId && selectedClientId !== 'CUSTOM' ? selectedClientId : undefined,
      clientName: clientName || recipientOrg,
      clientAffix: clientAffix.toUpperCase(),
      linkedEntityType: entityType === 'BANK' ? ('BANK_ACCOUNT' as const) : undefined,
      linkedEntityId: entityType === 'BANK' && selectedBankObj ? selectedBankObj.id : undefined,
      projectId: selectedProjectId && selectedProjectId !== 'CUSTOM' ? selectedProjectId : undefined,
      projectCode: projectCode || projectAffix,
      projectName: projectName || `Project ${projectAffix}`,
      projectAffix: projectAffix.toUpperCase(),
      sequenceYear: initiatedYear,
      sequenceNumber: parseInt(suffix, 10) || 1,
      recipientOrganization: recipientOrg,
      recipientAddress,
      attention,
      subject,
      date: letterDate,
      priority: 'Normal' as const,
      confidentiality: 'Normal' as const,
      bodyHtml,
      letterheadId: selectedLetterheadId || undefined,
      letterheadVariant,
      preparedBy,
      status: 'Draft' as const,
      attachedDocumentIds: [],
      enterpriseId: currentEnterprise?.id || 'ent-apex',
      googleDocumentUrl: googleDocUrl || undefined,
      googleDocumentId: googleDocId || undefined,
      externalEditor: googleDocUrl ? ('GOOGLE_DOCS' as const) : importedWordFileName ? ('WORD' as const) : ('NONE' as const),
      attachments: initialAttachments
    };

    const created = createLetter(newLetterData);
    onLetterCreated(created);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Compose Official Correspondence
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-semibold border border-emerald-500/30">
                  Client & Project Registry
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Automatic Project Reference Protocol: <span className="font-mono text-purple-400 font-medium">EMA/Client Effix/Project Effix/Year/Suffix</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SECTION 1: PROJECT & CLIENT / BANK BASIS WITH LIVE REFERENCE NUMBER GENERATOR */}
          <div className="bg-slate-950/70 border border-purple-500/30 rounded-xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <span>1. Project & Client / Bank Folder Basis</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Assigns correspondence under specific Client, Registered Bank & Project folders
              </span>
            </div>

            {/* Grid 1: Client / Bank Selector and Affix (Effix) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    {entityType === 'BANK' ? (
                      <>
                        <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Select Bank / Financial Institution</span>
                      </>
                    ) : (
                      <>
                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Select Client / Employer</span>
                      </>
                    )}
                  </label>

                  {/* Mode Selector Toggle: Clients vs Registered Banks */}
                  <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setEntityType('CLIENT');
                        setIsCustomClient(false);
                      }}
                      className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors font-medium ${
                        entityType === 'CLIENT'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Select client or employer"
                    >
                      <Building2 className="w-3 h-3" />
                      <span>Clients ({allClientOptions.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEntityType('BANK');
                        setIsCustomClient(false);
                        if (!selectedBankId && registeredBanks.length > 0) {
                          handleSelectBank(registeredBanks[0].id);
                        }
                      }}
                      className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors font-medium ${
                        entityType === 'BANK'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Select bank from master Registered Banks registry"
                    >
                      <Landmark className="w-3 h-3 text-emerald-400" />
                      <span>Registered Banks ({registeredBanks.length})</span>
                    </button>
                  </div>
                </div>

                {/* Entity Selector: CLIENT MODE */}
                {entityType === 'CLIENT' && (
                  <>
                    {!isCustomClient ? (
                      <select
                        value={selectedClientId}
                        onChange={e => {
                          const val = e.target.value;
                          if (val.startsWith('BANK_')) {
                            setEntityType('BANK');
                            handleSelectBank(val.replace('BANK_', ''));
                            return;
                          }
                          handleSelectClient(val);
                        }}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-amber-500 focus:outline-none font-medium"
                      >
                        <option value="">-- Choose from Registered Clients --</option>
                        <optgroup label="Registered Clients & Employers">
                          {allClientOptions.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} [{c.affix}]
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label={`🏦 Registered Banks Registry (${registeredBanks.length} Banks)`}>
                          {registeredBanks.map(b => (
                            <option key={`opt-b-${b.id}`} value={`BANK_${b.id}`}>
                              🏦 [{b.bankCode}] {b.bankName} ({b.shortName || b.bankCode})
                            </option>
                          ))}
                        </optgroup>
                        <option value="CUSTOM">+ Type Custom Client / Authority...</option>
                      </select>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Provincial Road Development Authority"
                          value={clientName}
                          onChange={e => {
                            setClientName(e.target.value);
                            setClientAffix(extractClientAffix(e.target.value));
                          }}
                          className="flex-1 px-3 py-2 bg-slate-800 border border-amber-500/50 rounded-lg text-xs text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => setIsCustomClient(false)}
                          className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                        >
                          Pick List
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Entity Selector: REGISTERED BANK MODE */}
                {entityType === 'BANK' && (
                  <div className="space-y-2">
                    {!isCustomClient ? (
                      <select
                        value={selectedBankId}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === 'CUSTOM') {
                            setIsCustomClient(true);
                            return;
                          }
                          if (val.startsWith('CLIENT_')) {
                            setEntityType('CLIENT');
                            handleSelectClient(val.replace('CLIENT_', ''));
                            return;
                          }
                          handleSelectBank(val);
                        }}
                        className="w-full px-3 py-2 bg-slate-800 border border-emerald-500/50 rounded-lg text-xs text-slate-100 focus:border-emerald-500 focus:outline-none font-medium"
                      >
                        <option value="" disabled>-- Choose from Registered Banks ({registeredBanks.length} Institutions) --</option>
                        <optgroup label="Licensed Commercial Banks">
                          {registeredBanks
                            .filter(b => b.category === 'Licensed Commercial Bank')
                            .map(b => (
                              <option key={b.id} value={b.id}>
                                [{b.bankCode}] {b.bankName} ({b.shortName || b.bankCode})
                              </option>
                            ))}
                        </optgroup>
                        <optgroup label="Licensed Specialized & Foreign Banks">
                          {registeredBanks
                            .filter(b => b.category !== 'Licensed Commercial Bank')
                            .map(b => (
                              <option key={b.id} value={b.id}>
                                [{b.bankCode}] {b.bankName} ({b.shortName || b.bankCode}) - {b.category || 'Specialized'}
                              </option>
                            ))}
                        </optgroup>
                        <optgroup label="🏢 Switch to Registered Clients">
                          {allClientOptions.slice(0, 5).map(c => (
                            <option key={`opt-c-${c.id}`} value={`CLIENT_${c.id}`}>
                              🏢 {c.name} [{c.affix}]
                            </option>
                          ))}
                        </optgroup>
                        <option value="CUSTOM">+ Type Custom Bank / Financial Entity...</option>
                      </select>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Seylan Bank PLC - Corporate Banking"
                          value={clientName}
                          onChange={e => {
                            setClientName(e.target.value);
                            setClientAffix(extractClientAffix(e.target.value));
                          }}
                          className="flex-1 px-3 py-2 bg-slate-800 border border-emerald-500/50 rounded-lg text-xs text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => setIsCustomClient(false)}
                          className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                        >
                          Pick Bank
                        </button>
                      </div>
                    )}

                    {/* Registered Bank Verification Badge & Branch Selection */}
                    {selectedBankObj && !isCustomClient && (
                      <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>
                            <strong className="text-emerald-200">Registered Bank:</strong> Code{' '}
                            <span className="font-mono font-bold text-emerald-300">{selectedBankObj.bankCode}</span>
                            {selectedBankObj.swiftCode ? ` • SWIFT: ${selectedBankObj.swiftCode}` : ''}
                            {selectedBankObj.category ? ` • ${selectedBankObj.category}` : ''}
                          </span>
                        </div>
                        {selectedBankObj.branches && selectedBankObj.branches.length > 0 && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[11px] text-slate-400">Branch:</span>
                            <select
                              value={selectedBankBranch}
                              onChange={e => handleSelectBankBranch(e.target.value)}
                              className="px-2 py-1 bg-slate-900 border border-emerald-500/40 rounded text-[11px] text-emerald-200 focus:outline-none"
                            >
                              <option value="">Head Office / Corporate</option>
                              {selectedBankObj.branches.map((br, idx) => (
                                <option key={idx} value={br}>
                                  {br}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Client or Bank Affix (Effix) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>{entityType === 'BANK' ? 'Bank Affix (Effix)' : 'Client Affix (Effix)'}</span>
                  <span className="text-[10px] text-amber-400 font-mono">2-6 Chars</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={entityType === 'BANK' ? 'e.g. COMB' : 'e.g. RDA'}
                  value={clientAffix}
                  onChange={e => setClientAffix(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-amber-300 font-mono font-bold tracking-wider uppercase focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Grid 2: Project and Project Effix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                  Select Project
                </label>
                {!isCustomProject ? (
                  <select
                    value={selectedProjectId}
                    onChange={e => handleSelectProject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">-- Choose Project Code --</option>
                    {filteredProjects.map((p, idx) => (
                      <option key={`${p.id || p.PROJECT_CODE}-${idx}`} value={p.id}>
                        {p.PROJECT_CODE} - {p.PROJECT_NAME} ({p.CLIENT || 'General'})
                      </option>
                    ))}
                    <option value="NONE">General / Corporate (Non-Project)</option>
                    <option value="CUSTOM">+ Type Custom Project Code...</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. PIDM26 - Expressway Link"
                      value={projectCode}
                      onChange={e => {
                        setProjectCode(e.target.value);
                        setProjectAffix(extractProjectAffix(e.target.value));
                      }}
                      className="flex-1 px-3 py-2 bg-slate-800 border border-emerald-500/50 rounded-lg text-xs text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomProject(false)}
                      className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                    >
                      Pick List
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Project Affix (Effix)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">e.g. PIDM26</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PIDM26"
                  value={projectAffix}
                  onChange={e => setProjectAffix(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-emerald-300 font-mono font-bold tracking-wider uppercase focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Grid 3: Date, Initiated Year & Sequential Suffix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  Initiated Date
                </label>
                <input
                  type="date"
                  required
                  value={letterDate}
                  onChange={e => setLetterDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Initiated Year
                </label>
                <input
                  type="text"
                  readOnly
                  value={initiatedYear}
                  className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/80 rounded-lg text-xs text-blue-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-purple-400" /> Suffix (Order)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = getNextLetterSuffix(letters, clientAffix, projectAffix, initiatedYear);
                      setSuffix(next);
                    }}
                    className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-0.5"
                    title="Recalculate order suffix"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> Auto
                  </button>
                </label>
                <input
                  type="text"
                  required
                  placeholder="001"
                  value={suffix}
                  onChange={e => setSuffix(e.target.value.replace(/[^0-9]/g, '').padStart(3, '0'))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-purple-300 font-mono font-bold focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* LIVE REFERENCE NUMBER PREVIEW BANNER */}
            <div className="bg-slate-900 border border-purple-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  Generated Official Reference Number:
                </div>
                <div className="font-mono text-lg font-black text-slate-100 tracking-wider flex items-center gap-2">
                  <span className="text-purple-400">EMA</span>/
                  <span className="text-amber-400">{clientAffix || 'CLIENT'}</span>/
                  <span className="text-emerald-400">{projectAffix || 'GEN'}</span>/
                  <span className="text-blue-400">{initiatedYear}</span>/
                  <span className="text-purple-300">{suffix || '001'}</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>Folder Destination:</span>
                  <span className="text-amber-300 font-medium">📁 {clientName || clientAffix || 'Client'}</span>
                  <span>&gt;</span>
                  <span className="text-emerald-300 font-medium">🏗️ {projectCode || projectAffix || 'Project'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyRef}
                className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-mono transition-colors"
              >
                {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedRef ? 'Copied' : 'Copy Ref'}
              </button>
            </div>
          </div>

          {/* SECTION 2: AI DRAFTSMAN & TEMPLATES */}
          <div className="bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  AI Letter Draftsman & Templates
                </span>
              </div>
              {templates.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Load Template:</span>
                  <select
                    onChange={e => handleApplyTemplate(e.target.value)}
                    className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200"
                  >
                    <option value="">-- Choose Standard Template --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.category})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <textarea
                rows={2}
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="e.g. Notify the Project Director regarding delayed site access due to monsoon rain and submit initial claim for 14-day Extension of Time..."
                className="w-full px-3 py-2 bg-slate-900/90 border border-purple-500/30 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Tone:</span>
                  <select
                    value={aiTone}
                    onChange={e => setAiTone(e.target.value as LetterTone)}
                    className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200"
                  >
                    <option value="Formal">Formal & Professional</option>
                    <option value="Assertive">Assertive & Contractual</option>
                    <option value="Conciliatory">Conciliatory & Collaborative</option>
                    <option value="Urgent">High Priority & Urgent</option>
                  </select>
                </div>
                <button
                  type="button"
                  disabled={isAiDrafting || !aiPrompt.trim()}
                  onClick={handleAiDraft}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  {isAiDrafting ? 'Drafting...' : 'Generate Body & Subject'}
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: RECIPIENT & LETTER CONTENT */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
              2. Recipient, Classification & Delivery Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Recipient Organization
                </label>
                <input
                  type="text"
                  required
                  value={recipientOrg}
                  onChange={e => setRecipientOrg(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Attention (Official / Consultant Title)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Eng. H. M. Karunaratne (Project Director)"
                  value={attention}
                  onChange={e => setAttention(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Recipient Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maganeguma Mahamedura, No. 216, Denzil Kobbekaduwa Mawatha, Battaramulla"
                  value={recipientAddress}
                  onChange={e => setRecipientAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-200">
                    Company Letterhead
                  </label>
                  {activeLetterheadObj && (
                    <button
                      type="button"
                      onClick={() => setPreviewLetterheadTarget(activeLetterheadObj)}
                      className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview Sheet</span>
                    </button>
                  )}
                </div>
                <select
                  value={selectedLetterheadId}
                  onChange={e => {
                    setSelectedLetterheadId(e.target.value);
                    const lh = letterheads.find(l => l.id === e.target.value);
                    if (lh) {
                      if (lh.scope === 'Project') setLetterheadVariant('Project');
                      else if (lh.scope === 'Finance') setLetterheadVariant('Finance');
                      else if (lh.scope === 'Tender') setLetterheadVariant('Tender');
                      else if (lh.scope === 'Confidential') setLetterheadVariant('Confidential');
                      else setLetterheadVariant('Company');
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 font-medium focus:border-purple-500 focus:outline-none"
                >
                  {activeLetterheads.map(lh => (
                    <option key={lh.id} value={lh.id}>
                      [{lh.scope}] {lh.name} {lh.isDefault ? '★ (Default)' : ''}
                      {lh.fullLetterheadImageUrl ? ' • Full Artwork' : lh.headerImageUrl ? ' • Custom Banner' : ''}
                    </option>
                  ))}
                </select>
                {activeLetterheadObj && (
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>
                      Safe Margin: Top {activeLetterheadObj.contentTopMargin || 50}mm • Bot {activeLetterheadObj.contentBottomMargin || 35}mm
                    </span>
                    <span className="text-emerald-400">
                      {activeLetterheadObj.fullLetterheadImageUrl ? 'Full Artwork' : activeLetterheadObj.headerImageUrl ? 'Header Banner' : 'EMA Vector'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Subject Line
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SUBMISSION OF REVISED METHOD STATEMENT & PROGRESS SCHEDULE"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 font-semibold focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* PROMINENT SECTION: DOCUMENT EDITING */}
            <div className="bg-slate-950/80 border border-blue-500/40 rounded-xl p-4 space-y-3.5 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-900/40 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                      DOCUMENT EDITING
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Collaborate in Google Docs or Microsoft Word for complex document formatting
                    </p>
                  </div>
                </div>

                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/60 font-mono font-semibold">
                  External Control Bridges
                </span>
              </div>

              {/* Instructions banner when Edit in Word was clicked */}
              {wordInstructionBanner && (
                <div className="p-3 bg-blue-950/60 border border-blue-500/40 rounded-lg text-xs text-blue-200 flex items-start justify-between gap-3 animate-fade-in">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold text-white mb-0.5">Workflow Instruction:</strong>
                      {wordInstructionBanner}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWordInstructionBanner(null)}
                    className="text-slate-400 hover:text-slate-200 text-xs font-semibold shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Google Docs Status Banner */}
              {googleDocUrl && (
                <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-lg text-xs text-blue-300 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="truncate">Google Document linked: <strong className="text-white font-mono">{googleDocUrl}</strong></span>
                  </div>
                  <a
                    href={googleDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-300 hover:text-white underline text-[11px] font-semibold flex items-center gap-1 shrink-0 ml-2"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Imported Word Status Banner */}
              {importedWordFileName && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Imported edited Word document: <strong className="text-white">{importedWordFileName}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImportedWordFileName(null)}
                    className="text-slate-400 hover:text-slate-200 text-xs font-semibold"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Attached Final PDF Banner */}
              {attachedFinalPdf && (
                <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-lg text-xs text-purple-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Official Final PDF attached: <strong className="text-white">{attachedFinalPdf.name}</strong> ({Math.round(attachedFinalPdf.size / 1024)} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachedFinalPdf(null)}
                    className="text-slate-400 hover:text-slate-200 text-xs font-semibold"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Action Buttons Toolbar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {/* 1. Edit in Google Docs */}
                <button
                  type="button"
                  onClick={() => setIsGoogleDocsModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>Edit in Google Docs</span>
                </button>

                {/* 2. Download / Edit in Microsoft Word */}
                <button
                  type="button"
                  onClick={handleExportDraftToWord}
                  disabled={isExportingWord}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  title="Generate Word (.docx) with letterhead for offline editing"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>{isExportingWord ? 'Exporting...' : 'Download / Edit in Microsoft Word'}</span>
                </button>

                {/* 3. Import Edited Word Document */}
                <input
                  ref={wordFileInputRef}
                  type="file"
                  accept=".docx,.doc"
                  onChange={handleImportWordFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => wordFileInputRef.current?.click()}
                  disabled={isImportingWord}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isImportingWord ? 'Importing...' : 'Import Edited Word Document'}</span>
                </button>

                {/* 4. Upload Final PDF */}
                <input
                  ref={pdfFileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleUploadFinalPdf}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => pdfFileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  <FileCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Upload Final PDF</span>
                </button>

                {/* 5. Preview Final Letter */}
                <button
                  type="button"
                  onClick={() => setIsPreviewFinalModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Preview Final Letter</span>
                </button>

                {/* 6. Finalize Letter */}
                <button
                  type="button"
                  onClick={() => setIsFinalizeModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-amber-600/20"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Finalize Letter</span>
                </button>
              </div>
            </div>

            {/* LETTER CONTENT BODY */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Letter Content Body (In-App Editor & Controlled Justified Preview)
                </label>
                <span className="text-[11px] text-slate-400">
                  {bodyHtml.length} characters
                </span>
              </div>

              <textarea
                rows={8}
                required
                value={bodyHtml}
                onChange={e => setBodyHtml(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono leading-relaxed focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Prepared By (Officer / Secretary)
                </label>
                <input
                  type="text"
                  value={preparedBy}
                  onChange={e => setPreparedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Category Classification
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100"
                >
                  <option value="Project">Project Engineering & Site</option>
                  <option value="Client">Client Relations & Employer</option>
                  <option value="EOT">Claim for Extension of Time (EOT)</option>
                  <option value="Payment">Interim Payment & Valuation</option>
                  <option value="Bank">Bank & Performance Security</option>
                  <option value="Tender">Tender & Pre-Qualification</option>
                  <option value="Legal">Legal & Statutory Notice</option>
                </select>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-400 font-mono">
              Reference: <span className="text-purple-300 font-bold">{liveReference}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-emerald-600/20"
              >
                <Send className="w-4 h-4" />
                Create Official Letter
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Google Docs Integration Modal */}
      {isGoogleDocsModalOpen && (
        <GoogleDocsConnectModal
          isOpen={isGoogleDocsModalOpen}
          onClose={() => setIsGoogleDocsModalOpen(false)}
          letter={{
            id: 'temp-draft',
            letterNumber: liveReference,
            ourReference: liveReference,
            direction: 'Outgoing',
            category,
            subject: subject || 'OFFICIAL CORRESPONDENCE',
            bodyHtml,
            date: letterDate,
            recipientOrganization: recipientOrg,
            recipientAddress,
            attention,
            projectAffix,
            projectName,
            preparedBy,
            status: 'Draft',
            version: 1,
            isLocked: false,
            attachedDocumentIds: [],
            priority: 'Normal',
            confidentiality: 'Normal',
            googleDocumentUrl: googleDocUrl || undefined,
            googleDocumentId: googleDocId || undefined,
            createdAt: new Date().toISOString()
          }}
          profile={profile}
          letterhead={activeLetterheadObj}
          onLinkUpdated={(docUrl, docId) => {
            setGoogleDocUrl(docUrl);
            if (docId) setGoogleDocId(docId);
          }}
          onSyncContent={(newBodyHtml) => {
            setBodyHtml(newBodyHtml);
          }}
        />
      )}

      {/* Preview Final Letter Modal */}
      {isPreviewFinalModalOpen && activeLetterheadObj && (
        <LetterheadPreviewModal
          isOpen={isPreviewFinalModalOpen}
          onClose={() => setIsPreviewFinalModalOpen(false)}
          letterhead={activeLetterheadObj}
        />
      )}

      {/* Finalize Letter Modal in Compose Flow */}
      {isFinalizeModalOpen && (
        <CorrespondenceFinalizeModal
          isOpen={isFinalizeModalOpen}
          onClose={() => setIsFinalizeModalOpen(false)}
          letter={{
            id: 'temp-draft',
            letterNumber: liveReference,
            ourReference: liveReference,
            direction: 'Outgoing',
            category,
            subject: subject || 'OFFICIAL CORRESPONDENCE',
            bodyHtml,
            date: letterDate,
            recipientOrganization: recipientOrg,
            recipientAddress,
            attention,
            projectAffix,
            projectName,
            preparedBy,
            status: 'Draft',
            version: 1,
            isLocked: false,
            attachedDocumentIds: [],
            priority: 'Normal',
            confidentiality: 'Normal',
            googleDocumentUrl: googleDocUrl || undefined,
            createdAt: new Date().toISOString()
          }}
          letterhead={activeLetterheadObj}
          onConfirmFinalize={async (officerName) => {
            // Create finalized letter directly
            const initialAttachments: CorrespondenceAttachment[] = [];
            if (attachedFinalPdf) {
              initialAttachments.push({
                id: `att-pdf-${Date.now()}`,
                letterId: 'pending',
                name: attachedFinalPdf.name,
                size: attachedFinalPdf.size,
                fileType: 'application/pdf',
                uploadedAt: new Date().toISOString(),
                uploadedBy: officerName,
                category: 'FINAL_DOCUMENT',
                description: 'Uploaded official final PDF document',
                dataUrl: attachedFinalPdf.dataUrl,
                versionTagged: 1
              });
            }

            const created = createLetter({
              letterNumber: liveReference,
              ourReference: liveReference,
              direction: 'Outgoing' as const,
              category,
              clientId: selectedClientId && selectedClientId !== 'CUSTOM' ? selectedClientId : undefined,
              clientName: clientName || recipientOrg,
              clientAffix: clientAffix.toUpperCase(),
              linkedEntityType: entityType === 'BANK' ? ('BANK_ACCOUNT' as const) : undefined,
              linkedEntityId: entityType === 'BANK' && selectedBankObj ? selectedBankObj.id : undefined,
              projectId: selectedProjectId && selectedProjectId !== 'CUSTOM' ? selectedProjectId : undefined,
              projectCode: projectCode || projectAffix,
              projectName: projectName || `Project ${projectAffix}`,
              projectAffix: projectAffix.toUpperCase(),
              sequenceYear: initiatedYear,
              sequenceNumber: parseInt(suffix, 10) || 1,
              recipientOrganization: recipientOrg,
              recipientAddress,
              attention,
              subject,
              date: letterDate,
              priority: 'Normal' as const,
              confidentiality: 'Normal' as const,
              bodyHtml,
              letterheadId: selectedLetterheadId || undefined,
              letterheadVariant,
              preparedBy: officerName,
              status: 'Finalized' as const,
              isLocked: true,
              finalizedAt: new Date().toISOString(),
              finalizedBy: officerName,
              attachedDocumentIds: [],
              enterpriseId: currentEnterprise?.id || 'ent-apex',
              googleDocumentUrl: googleDocUrl || undefined,
              googleDocumentId: googleDocId || undefined,
              externalEditor: googleDocUrl ? 'GOOGLE_DOCS' : importedWordFileName ? 'WORD' : 'NONE',
              attachments: initialAttachments
            });

            onLetterCreated(created);
            onClose();
          }}
        />
      )}

      {/* Letterhead Protection Integrity Warning Modal */}
      {integrityWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-amber-600/50 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Letterhead Integrity Warning
                </h3>
                <p className="text-xs text-amber-300/80">
                  Official letterhead elements appear to be missing from the imported document.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-200/90 space-y-2">
              <p>The system detected missing verification anchors in the imported Word document:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 font-mono">
                {integrityWarning.missingElements.map((elem, idx) => (
                  <li key={idx}>{elem}</li>
                ))}
              </ul>
              <p className="text-slate-400 text-[11px] pt-1">
                Importing without letterhead elements may affect formal company compliance. Do you want to proceed with import anyway?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIntegrityWarning(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
              >
                Cancel / Keep Current
              </button>
              <button
                type="button"
                onClick={handleConfirmIntegrityBypass}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-amber-600/20"
              >
                Proceed with Import
              </button>
            </div>
          </div>
        </div>
      )}

      {previewLetterheadTarget && (
        <LetterheadPreviewModal
          isOpen={!!previewLetterheadTarget}
          onClose={() => setPreviewLetterheadTarget(null)}
          letterhead={previewLetterheadTarget}
        />
      )}
    </div>
  );
};
