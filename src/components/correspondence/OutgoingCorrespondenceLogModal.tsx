import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Send,
  Building2,
  Briefcase,
  Hash,
  Copy,
  Check,
  Search,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Paperclip,
  UploadCloud,
  Trash2,
  FileCheck,
  Landmark,
  ShieldCheck,
  Building,
  UserCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useEnterpriseCorrespondence } from '../../context/EnterpriseCorrespondenceContext';
import { useEnterpriseCompany } from '../../context/EnterpriseCompanyContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { Letter, CorrespondenceAttachment } from '../../types/correspondenceTypes';
import {
  extractClientAffix,
  extractProjectAffix,
  extractReceiverInitials,
  formatEmaCorrespondenceReference,
  getNextEmaLetterSuffix,
  STANDARD_RECIPIENTS,
  RecipientOption
} from '../../utils/correspondenceUtils';
import { AuditService } from '../../services/audit/auditService';

export interface OutgoingCorrespondenceLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProjectCode?: string;
  initialProjectName?: string;
  initialProjectAffix?: string;
  initialClientName?: string;
  initialClientAffix?: string;
  initialRelatedIncomingId?: string;
  onLetterCreated?: (createdLetter: Letter) => void;
}

export const OutgoingCorrespondenceLogModal: React.FC<OutgoingCorrespondenceLogModalProps> = ({
  isOpen,
  onClose,
  initialProjectCode,
  initialProjectName,
  initialProjectAffix,
  initialClientName,
  initialClientAffix,
  initialRelatedIncomingId,
  onLetterCreated
}) => {
  const { letters, createLetter, updateReplyStatus, generateEmaCorrespondenceReference } = useEnterpriseCorrespondence();
  const { projects } = usePettyCash();
  const { currentEnterprise } = useEnterprise();

  // Combine projects from pettyCash with any projects discovered from existing letters if not present
  const availableProjects = useMemo(() => {
    const map = new Map<string, {
      id: string;
      code: string;
      name: string;
      clientName: string;
      clientAffix: string;
      projectAffix: string;
    }>();

    // Add registered projects
    if (projects && projects.length > 0) {
      projects.forEach(p => {
        const code = p.PROJECT_CODE || p.CODE || p.PROJECT_ID || 'PRJ';
        const name = p.PROJECT_NAME || p.NAME || code;
        const client = p.CLIENT || p.CLIENT_NAME || 'Road Development Authority (RDA)';
        const cAffix = extractClientAffix(client);
        const pAffix = extractProjectAffix(code);
        map.set(code, {
          id: p.id || p.PROJECT_ID || code,
          code,
          name,
          clientName: client,
          clientAffix: cAffix,
          projectAffix: pAffix
        });
      });
    }

    // Include any projects from existing letters if map is sparse
    letters.forEach(l => {
      const code = l.projectCode || l.projectAffix || '';
      if (code && !map.has(code)) {
        const name = l.projectName || code;
        const client = l.clientName || 'Road Development Authority (RDA)';
        const cAffix = l.clientAffix || extractClientAffix(client);
        const pAffix = l.projectAffix || extractProjectAffix(code);
        map.set(code, {
          id: l.projectId || code,
          code,
          name,
          clientName: client,
          clientAffix: cAffix,
          projectAffix: pAffix
        });
      }
    });

    // Default fallback project if none exist
    if (map.size === 0) {
      map.set('PIDM26', {
        id: 'PRJ-2026-001',
        code: 'PIDM26',
        name: 'Kadawatha - Mirigama Expressway Rehabilitation',
        clientName: 'Road Development Authority (RDA)',
        clientAffix: 'RDA',
        projectAffix: 'PIDM26'
      });
    }

    return Array.from(map.values());
  }, [projects, letters]);

  // Selected Project
  const [selectedProjectCode, setSelectedProjectCode] = useState<string>(() => {
    if (initialProjectCode) return initialProjectCode;
    if (availableProjects.length > 0) return availableProjects[0].code;
    return 'PIDM26';
  });

  const selectedProject = useMemo(() => {
    return (
      availableProjects.find(p => p.code === selectedProjectCode) ||
      availableProjects[0] || {
        id: 'PRJ-2026-001',
        code: 'PIDM26',
        name: 'Kadawatha - Mirigama Expressway Rehabilitation',
        clientName: 'Road Development Authority (RDA)',
        clientAffix: 'RDA',
        projectAffix: 'PIDM26'
      }
    );
  }, [availableProjects, selectedProjectCode]);

  // Project Affix / Initials (used in reference: EMA/{Client initials}/{Project initials}/...)
  const [projectInitials, setProjectInitials] = useState<string>(() => {
    if (initialProjectAffix) return initialProjectAffix;
    return selectedProject.projectAffix || extractProjectAffix(selectedProject.code);
  });

  // Recipient Category: 'CLIENT' | 'BANK' | 'AUTHORITY' | 'OTHER'
  const [recipientType, setRecipientType] = useState<'CLIENT' | 'BANK' | 'AUTHORITY' | 'OTHER'>('CLIENT');

  // Recipient / Organization Name
  const [recipientName, setRecipientName] = useState<string>(() => {
    if (initialClientName) return initialClientName;
    return selectedProject.clientName || 'Road Development Authority';
  });

  // Client / Organization Initials (used in reference: EMA/{Client initials}/...)
  const [clientInitials, setClientInitials] = useState<string>(() => {
    if (initialClientAffix) return initialClientAffix;
    return extractClientAffix(initialClientName || selectedProject.clientName || 'RDA');
  });

  // Receiver's Direction / Designation under client or authority
  const [receiverDesignation, setReceiverDesignation] = useState<string>('Provincial Director');

  // Receiver Initials (used in reference: EMA/.../{Receiver initials}/...)
  const [receiverInitials, setReceiverInitials] = useState<string>('PD');

  // Custom Suffix override state (if empty, auto-computed)
  const [customSuffix, setCustomSuffix] = useState<string>('');

  // Date of correspondence
  const [letterDate, setLetterDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Whether correspondence is linked to a specific project or General Corporate
  const [isProjectLinked, setIsProjectLinked] = useState<boolean>(true);

  // Subject
  const [subject, setSubject] = useState<string>('');

  // Related Incoming Search State
  const [relatedIncomingId, setRelatedIncomingId] = useState<string>(initialRelatedIncomingId || '');
  const [incomingSearchQuery, setIncomingSearchQuery] = useState<string>('');
  const [isIncomingDropdownOpen, setIsIncomingDropdownOpen] = useState<boolean>(false);
  const incomingDropdownRef = useRef<HTMLDivElement>(null);

  // Form Validation & Feedback
  const [errors, setErrors] = useState<{
    recipientName?: string;
    clientInitials?: string;
    projectInitials?: string;
    receiverDesignation?: string;
    receiverInitials?: string;
    subject?: string;
  }>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasCopiedRef, setHasCopiedRef] = useState<boolean>(false);

  // Outgoing Letter Document Upload State
  const [uploadedLetterFile, setUploadedLetterFile] = useState<File | null>(null);
  const [uploadedFileDataUrl, setUploadedFileDataUrl] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Success state for displaying generated reference & logged letter summary
  const [createdLetterResult, setCreatedLetterResult] = useState<{
    letter: Letter;
    hasDoc: boolean;
    fileName?: string;
    fileSize?: number;
  } | null>(null);

  const handleFileSelect = (file: File) => {
    setUploadedLetterFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedFileDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setUploadedLetterFile(null);
    setUploadedFileDataUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Filter preset recipients based on active category
  const filteredPresets = useMemo(() => {
    return STANDARD_RECIPIENTS.filter(r => r.type === recipientType);
  }, [recipientType]);

  // Context-aware receiver presets based on selected recipient or category
  const receiverPresets = useMemo(() => {
    const matchedRecipient = STANDARD_RECIPIENTS.find(
      r => r.name.toLowerCase() === recipientName.toLowerCase() ||
           r.initials.toUpperCase() === clientInitials.toUpperCase()
    );

    if (matchedRecipient && matchedRecipient.defaultReceivers && matchedRecipient.defaultReceivers.length > 0) {
      return matchedRecipient.defaultReceivers;
    }

    if (recipientType === 'BANK') {
      return [
        { designation: 'Branch Manager', initials: 'BM' },
        { designation: 'Credit Officer', initials: 'CO' },
        { designation: 'Senior Manager - Credit', initials: 'SMC' },
        { designation: 'Chief Manager', initials: 'CM' },
        { designation: 'Trade Services & Guarantees', initials: 'TSD' },
        { designation: 'Relationship Manager', initials: 'RM' }
      ];
    }

    if (recipientType === 'AUTHORITY') {
      return [
        { designation: 'Director General', initials: 'DG' },
        { designation: 'Commissioner General', initials: 'CG' },
        { designation: 'General Manager', initials: 'GM' },
        { designation: 'Deputy Commissioner', initials: 'DC' },
        { designation: 'Director - Advisory & Registration', initials: 'DAR' },
        { designation: 'Senior Assessor', initials: 'SA' }
      ];
    }

    // Default for Client
    return [
      { designation: 'Provincial Director', initials: 'PD' },
      { designation: 'Chief Engineer', initials: 'CE' },
      { designation: 'Executive Engineer', initials: 'EE' },
      { designation: 'Project Director', initials: 'PD' },
      { designation: 'Resident Engineer', initials: 'RE' },
      { designation: 'Director General', initials: 'DG' }
    ];
  }, [recipientName, clientInitials, recipientType]);

  // Clean effective Client Initials & Receiver Initials
  const cleanClientInitials = useMemo(() => {
    return (clientInitials || extractClientAffix(recipientName) || 'CLIENT').trim().toUpperCase();
  }, [clientInitials, recipientName]);

  // Clean effective Project Initials / Affix
  const cleanProjectInitials = useMemo(() => {
    if (!isProjectLinked) return 'CORP';
    const raw = (projectInitials || selectedProject.projectAffix || extractProjectAffix(selectedProject.code) || 'GEN')
      .replace(/[^A-Za-z0-9_-]/g, '')
      .toUpperCase();
    return raw || 'GEN';
  }, [isProjectLinked, projectInitials, selectedProject]);

  const cleanReceiverInitials = useMemo(() => {
    return (receiverInitials || extractReceiverInitials(receiverDesignation) || 'DIR').trim().toUpperCase();
  }, [receiverInitials, receiverDesignation]);

  // Auto-calculated next sequence suffix based on Client + Project + Receiver
  const autoNextSuffix = useMemo(() => {
    return getNextEmaLetterSuffix(letters, cleanClientInitials, cleanProjectInitials, cleanReceiverInitials);
  }, [letters, cleanClientInitials, cleanProjectInitials, cleanReceiverInitials]);

  // Effective suffix for reference
  const effectiveSuffix = useMemo(() => {
    if (customSuffix && customSuffix.trim()) {
      return customSuffix.trim().padStart(3, '0');
    }
    return autoNextSuffix;
  }, [customSuffix, autoNextSuffix]);

  // Real-time live EMA reference: EMA/{Client initials}/{Project initials}/{Receiver initials}/{Suffix}
  const liveEmaReference = useMemo(() => {
    return formatEmaCorrespondenceReference(cleanClientInitials, cleanProjectInitials, cleanReceiverInitials, effectiveSuffix);
  }, [cleanClientInitials, cleanProjectInitials, cleanReceiverInitials, effectiveSuffix]);

  // Handle Project Selection from list or chips
  const handleSelectProject = (project: typeof availableProjects[0]) => {
    setSelectedProjectCode(project.code);
    setProjectInitials(project.projectAffix || extractProjectAffix(project.code));
    setIsProjectLinked(true);
    if (errors.projectInitials) setErrors(prev => ({ ...prev, projectInitials: undefined }));
    // Auto-update client if it's currently default and on CLIENT tab
    if (recipientType === 'CLIENT' && (!recipientName || recipientName === 'Road Development Authority' || recipientName === selectedProject.clientName)) {
      setRecipientName(project.clientName);
      setClientInitials(project.clientAffix);
    }
  };

  // Handle Preset Recipient Selection
  const handleSelectPresetRecipient = (preset: RecipientOption) => {
    setRecipientName(preset.name);
    setClientInitials(preset.initials);

    // Pick top receiver direction from preset if available
    if (preset.defaultReceivers && preset.defaultReceivers.length > 0) {
      setReceiverDesignation(preset.defaultReceivers[0].designation);
      setReceiverInitials(preset.defaultReceivers[0].initials);
    }
  };

  // Handle Receiver Preset Selection
  const handleSelectReceiverPreset = (preset: { designation: string; initials: string }) => {
    setReceiverDesignation(preset.designation);
    setReceiverInitials(preset.initials);
  };

  // Available incoming letters for linking
  const incomingLetters = useMemo(() => {
    return letters.filter(
      l => l.direction === 'Incoming' || l.direction === 'INCOMING'
    );
  }, [letters]);

  // Filtered incoming letters based on search query
  const filteredIncoming = useMemo(() => {
    const q = incomingSearchQuery.trim().toLowerCase();
    if (!q) return incomingLetters;
    return incomingLetters.filter(l => {
      const ref = (l.letterNumber || l.theirReference || '').toLowerCase();
      const sub = (l.subject || '').toLowerCase();
      const org = (l.senderOrganization || l.clientName || '').toLowerCase();
      const proj = (l.projectCode || l.projectAffix || l.projectName || '').toLowerCase();
      const dt = (l.date || l.receivedDate || '').toLowerCase();
      return ref.includes(q) || sub.includes(q) || org.includes(q) || proj.includes(q) || dt.includes(q);
    });
  }, [incomingLetters, incomingSearchQuery]);

  // Selected Incoming Letter object
  const selectedIncomingLetter = useMemo(() => {
    if (!relatedIncomingId) return null;
    return incomingLetters.find(l => l.id === relatedIncomingId) || null;
  }, [incomingLetters, relatedIncomingId]);

  // Close incoming dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (incomingDropdownRef.current && !incomingDropdownRef.current.contains(event.target as Node)) {
        setIsIncomingDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Copy Reference to Clipboard
  const handleCopyReference = (refToCopy: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(refToCopy);
      setHasCopiedRef(true);
      setTimeout(() => setHasCopiedRef(false), 2500);
    }
  };

  // Handle Save
  const handleSave = () => {
    const newErrors: {
      recipientName?: string;
      clientInitials?: string;
      projectInitials?: string;
      receiverDesignation?: string;
      receiverInitials?: string;
      subject?: string;
    } = {};

    if (!recipientName.trim()) {
      newErrors.recipientName = 'Recipient / Organization name is required.';
    }

    if (!cleanClientInitials) {
      newErrors.clientInitials = 'Client initials are required.';
    }

    if (isProjectLinked && !cleanProjectInitials) {
      newErrors.projectInitials = 'Project initials are required.';
    }

    if (!receiverDesignation.trim()) {
      newErrors.receiverDesignation = 'Receiver direction / designation is required.';
    }

    if (!cleanReceiverInitials) {
      newErrors.receiverInitials = 'Receiver initials are required.';
    }

    if (!subject.trim()) {
      newErrors.subject = 'Subject is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);

    try {
      // Re-generate to guarantee latest unique sequence with Client + Project + Receiver + Suffix
      const finalGen = generateEmaCorrespondenceReference({
        clientInitials: cleanClientInitials,
        projectInitials: cleanProjectInitials,
        receiverInitials: cleanReceiverInitials,
        customSuffix: customSuffix.trim() || undefined
      });

      const assignedNumber = finalGen.reference;
      const sequenceNumber = parseInt(finalGen.suffix, 10) || 1;
      const letterId = `ltr-${Date.now()}`;

      // If document was uploaded, create attachment object
      let fileAttachment: CorrespondenceAttachment | undefined = undefined;
      if (uploadedLetterFile) {
        fileAttachment = {
          id: `att-${Date.now()}`,
          letterId: letterId,
          name: uploadedLetterFile.name,
          size: uploadedLetterFile.size,
          fileType: uploadedLetterFile.type || (uploadedLetterFile.name.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'Corporate Officer',
          category: uploadedLetterFile.name.toLowerCase().includes('sign') ? 'SIGNED_SCAN' : 'FINAL_DOCUMENT',
          dataUrl: uploadedFileDataUrl || undefined,
          description: 'Final outgoing letter document attached during registration.'
        };
      }

      // Project Affix
      const projectAffix = cleanProjectInitials;

      // Create new Letter log record
      const newLetter: Letter = {
        id: letterId,
        letterNumber: assignedNumber,
        ourReference: assignedNumber,
        direction: 'Outgoing',
        documentType: 'LETTER',
        status: 'Issued',
        date: letterDate || new Date().toISOString().slice(0, 10),
        sequenceYear: letterDate ? letterDate.slice(0, 4) : new Date().getFullYear().toString(),
        sequenceNumber,
        subject: subject.trim(),

        // Recipient details (Client, Bank, Authority)
        recipientType,
        recipientOrganization: recipientName.trim(),
        clientName: recipientName.trim(),
        clientAffix: cleanClientInitials,
        clientId: `cl-${cleanClientInitials.toLowerCase()}`,

        // Receiver's Direction under Client or Authority
        receiverDesignation: receiverDesignation.trim(),
        receiverInitials: cleanReceiverInitials,
        attention: receiverDesignation.trim(),

        // Project details (Optional/Flexible)
        projectId: isProjectLinked ? selectedProject.id : undefined,
        projectCode: isProjectLinked ? selectedProject.code : 'CORP',
        projectName: isProjectLinked ? selectedProject.name : 'General Corporate Operations',
        projectAffix,

        // Linked Incoming Correspondence
        parentCorrespondenceId: selectedIncomingLetter ? selectedIncomingLetter.id : undefined,
        replyToLetterId: selectedIncomingLetter ? selectedIncomingLetter.id : undefined,
        relatedCorrespondenceIds: selectedIncomingLetter ? [selectedIncomingLetter.id] : [],
        relationship: selectedIncomingLetter ? 'Reply To' : undefined,

        // Attached Outgoing Letter Document
        attachedDocumentIds: fileAttachment ? [fileAttachment.id] : [],
        attachments: fileAttachment ? [fileAttachment] : [],
        finalDocumentId: fileAttachment?.id,
        finalDocumentUrl: uploadedFileDataUrl || undefined,
        externalEditor: uploadedLetterFile?.name.endsWith('.docx') || uploadedLetterFile?.name.endsWith('.doc') ? 'WORD' : 'NONE',

        // Metadata & Defaults
        priority: 'Normal',
        confidentiality: 'Normal',
        category: recipientType === 'BANK' ? 'Bank' : recipientType === 'AUTHORITY' ? 'Government' : 'Project',
        preparedBy: 'Corporate Officer',
        bodyHtml: '',
        version: 1,
        isLocked: true,
        createdAt: new Date().toISOString(),
        issuedAt: new Date().toISOString()
      };

      // Persist in correspondence registry
      createLetter(newLetter);

      // If linked to an incoming correspondence, update its reply status
      if (selectedIncomingLetter) {
        updateReplyStatus(selectedIncomingLetter.id, 'Sent', assignedNumber);
      }

      // Record Audit Trail
      try {
        AuditService.log({
          enterpriseId: currentEnterprise?.id || 'ent-default',
          userId: 'user-system',
          userName: 'Corporate Officer',
          userRole: 'admin',
          action: 'CREATE',
          module: 'CORRESPONDENCE',
          recordId: newLetter.id,
          recordTitle: newLetter.letterNumber,
          details: `Logged outgoing correspondence reference ${newLetter.letterNumber} to ${recipientName} (${receiverDesignation}) with subject "${newLetter.subject}"${uploadedLetterFile ? ` and attached file "${uploadedLetterFile.name}"` : ''}.`
        });
      } catch (auditErr) {
        console.warn('Audit log write error:', auditErr);
      }

      if (onLetterCreated) {
        onLetterCreated(newLetter);
      }

      // Show confirmation view
      setCreatedLetterResult({
        letter: newLetter,
        hasDoc: !!fileAttachment,
        fileName: uploadedLetterFile?.name,
        fileSize: uploadedLetterFile?.size
      });
    } catch (err) {
      console.error('Failed to log outgoing correspondence:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="outgoing-correspondence-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in"
    >
      <div
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                Log Outgoing Correspondence
              </h2>
              <p className="text-xs text-slate-400">
                Register correspondence with reference format <span className="font-mono text-emerald-400 font-bold">EMA / Client / Project / Receiver / Suffix</span>
              </p>
            </div>
          </div>
          <button
            id="btn-close-outgoing-modal"
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        {createdLetterResult ? (
          <div className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-100">
                Outgoing Correspondence Registered
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                Official reference generated and logged in the enterprise correspondence register.
              </p>
            </div>

            {/* Official Reference Box */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/40 shadow-inner space-y-2 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Assigned Official Reference Number
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-300 tracking-wider select-all">
                  {createdLetterResult.letter.letterNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyReference(createdLetterResult.letter.letterNumber)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {hasCopiedRef ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Reference
                    </>
                  )}
                </button>
              </div>

              {/* Reference Breakdown Pill */}
              <div className="flex items-center justify-center gap-2 pt-2 text-[11px] font-mono text-slate-400 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Company: EMA</span>
                <span>/</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300">Client: {createdLetterResult.letter.clientAffix}</span>
                <span>/</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300">Project: {createdLetterResult.letter.projectAffix || 'GEN'}</span>
                <span>/</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300">Receiver: {createdLetterResult.letter.receiverInitials}</span>
                <span>/</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300">Suffix: {String(createdLetterResult.letter.sequenceNumber).padStart(3, '0')}</span>
              </div>
            </div>

            {/* Summary Details Table */}
            <div className="bg-slate-800/40 rounded-xl border border-slate-800 p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Recipient / Organization:</span>
                <span className="text-slate-200 font-semibold text-right">
                  {createdLetterResult.letter.clientName} ({createdLetterResult.letter.clientAffix})
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Receiver Direction / Designation:</span>
                <span className="text-slate-200 font-semibold text-right">
                  {createdLetterResult.letter.receiverDesignation} ({createdLetterResult.letter.receiverInitials})
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Subject:</span>
                <span className="text-slate-200 font-semibold max-w-xs text-right truncate">
                  {createdLetterResult.letter.subject}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Project:</span>
                <span className="text-slate-200 font-medium">
                  {createdLetterResult.letter.projectName} [{createdLetterResult.letter.projectCode}]
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Uploaded Document:</span>
                {createdLetterResult.hasDoc ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5" />
                    {createdLetterResult.fileName} ({formatFileSize(createdLetterResult.fileSize)})
                  </span>
                ) : (
                  <span className="text-slate-500 italic">No document attached</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCreatedLetterResult(null);
                  setSubject('');
                  setUploadedLetterFile(null);
                  setUploadedFileDataUrl(null);
                  setRelatedIncomingId('');
                  setCustomSuffix('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Log Another Letter
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/20 transition-colors cursor-pointer"
              >
                Done & View in Register
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* SECTION 1: RECIPIENT CATEGORY TABS (Client, Bank, Authority, Other) */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  Recipient Category <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientType('CLIENT');
                      const firstPreset = STANDARD_RECIPIENTS.find(r => r.type === 'CLIENT');
                      if (firstPreset) handleSelectPresetRecipient(firstPreset);
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      recipientType === 'CLIENT'
                        ? 'bg-blue-600/20 border-blue-500/60 text-blue-300 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span>Client / Employer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRecipientType('BANK');
                      const firstPreset = STANDARD_RECIPIENTS.find(r => r.type === 'BANK');
                      if (firstPreset) handleSelectPresetRecipient(firstPreset);
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      recipientType === 'BANK'
                        ? 'bg-emerald-600/20 border-emerald-500/60 text-emerald-300 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Landmark className="w-4 h-4 text-emerald-400" />
                    <span>Bank</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRecipientType('AUTHORITY');
                      const firstPreset = STANDARD_RECIPIENTS.find(r => r.type === 'AUTHORITY');
                      if (firstPreset) handleSelectPresetRecipient(firstPreset);
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      recipientType === 'AUTHORITY'
                        ? 'bg-amber-600/20 border-amber-500/60 text-amber-300 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Authority (CGF, IRD, CIDA)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecipientType('OTHER')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      recipientType === 'OTHER'
                        ? 'bg-purple-600/20 border-purple-500/60 text-purple-300 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Building className="w-4 h-4 text-purple-400" />
                    <span>Other Entity</span>
                  </button>
                </div>
              </div>

              {/* SECTION 2: RECIPIENT ORGANIZATION & CLIENT INITIALS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="recipient-name-input" className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    {recipientType === 'BANK' ? 'Bank Name' : recipientType === 'AUTHORITY' ? 'Authority Name (CGF, IRD, CIDA, etc.)' : 'Client / Employer Name'}{' '}
                    <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Formula Segment: <strong className="text-amber-300 font-mono">[Client Initials]</strong>
                  </span>
                </div>

                {/* Quick Presets for Selected Category */}
                {filteredPresets.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 mr-1">
                      <Sparkles className="w-3 h-3 text-amber-400" /> Presets:
                    </span>
                    {filteredPresets.map(preset => {
                      const isSelected = clientInitials.toUpperCase() === preset.initials.toUpperCase();
                      return (
                        <button
                          key={preset.initials}
                          type="button"
                          onClick={() => handleSelectPresetRecipient(preset)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                              : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/70 text-slate-300 hover:text-white'
                          }`}
                        >
                          <span className="font-semibold">{preset.initials}</span>
                          <span className="text-[10px] text-slate-400 ml-1">({preset.name.split(' ')[0]})</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Recipient Name Input & Client Initials Input */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <input
                      id="recipient-name-input"
                      type="text"
                      value={recipientName}
                      onChange={e => {
                        const val = e.target.value;
                        setRecipientName(val);
                        // Auto-extract initials if user hasn't explicitly locked it
                        const extracted = extractClientAffix(val);
                        if (extracted) setClientInitials(extracted);
                        if (errors.recipientName) setErrors(prev => ({ ...prev, recipientName: undefined }));
                      }}
                      placeholder={
                        recipientType === 'BANK'
                          ? 'e.g. Bank of Ceylon, Commercial Bank'
                          : recipientType === 'AUTHORITY'
                          ? 'e.g. Construction Guarantee Fund (CGF), Inland Revenue Dept (IRD), CIDA'
                          : 'e.g. Road Development Authority (RDA)'
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all ${
                        errors.recipientName
                          ? 'border-rose-500 focus:border-rose-400 ring-1 ring-rose-500/40'
                          : 'border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30'
                      }`}
                    />
                    {errors.recipientName && (
                      <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" /> {errors.recipientName}
                      </p>
                    )}
                  </div>

                  {/* Client Initials Input */}
                  <div>
                    <div className="relative">
                      <input
                        id="client-initials-input"
                        type="text"
                        value={clientInitials}
                        onChange={e => {
                          const val = e.target.value.replace(/[^A-Za-z0-9_-]/g, '').toUpperCase();
                          setClientInitials(val);
                          if (errors.clientInitials) setErrors(prev => ({ ...prev, clientInitials: undefined }));
                        }}
                        placeholder="e.g. RDA, CGF, BOC"
                        maxLength={8}
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border font-mono font-bold text-xs sm:text-sm text-amber-300 placeholder:text-slate-500 focus:outline-none transition-all ${
                          errors.clientInitials
                            ? 'border-rose-500 focus:border-rose-400'
                            : 'border-slate-700 focus:border-amber-500'
                        }`}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono pointer-events-none">
                        Initials
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: PROJECT SELECTION & PROJECT INITIALS (AFFIX AFTER CLIENT) */}
              <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label htmlFor="project-select-input" className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                    Project Selection <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      Formula Segment: <strong className="text-emerald-300 font-mono">[Project Initials]</strong>
                    </span>
                    <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isProjectLinked}
                        onChange={e => {
                          const checked = e.target.checked;
                          setIsProjectLinked(checked);
                          if (!checked) {
                            setProjectInitials('CORP');
                          } else {
                            setProjectInitials(selectedProject.projectAffix || extractProjectAffix(selectedProject.code));
                          }
                        }}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-800"
                      />
                      <span>Project-Linked</span>
                    </label>
                  </div>
                </div>

                {/* Quick Project Select Chips */}
                {availableProjects.length > 0 && isProjectLinked && (
                  <div className="flex items-center gap-1.5 flex-wrap pb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 mr-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" /> Projects:
                    </span>
                    {availableProjects.map(proj => {
                      const isSelected = selectedProjectCode === proj.code;
                      return (
                        <button
                          key={proj.code}
                          type="button"
                          onClick={() => handleSelectProject(proj)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                              : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/70 text-slate-300 hover:text-white'
                          }`}
                        >
                          <span className="font-semibold">{proj.code}</span>
                          <span className="text-[10px] text-slate-400 ml-1 truncate max-w-[130px]">
                            ({proj.name.slice(0, 18)}...)
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Project Dropdown & Project Initials Input */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    {isProjectLinked ? (
                      <select
                        id="project-select-input"
                        value={selectedProjectCode}
                        onChange={e => {
                          const found = availableProjects.find(p => p.code === e.target.value);
                          if (found) handleSelectProject(found);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all cursor-pointer"
                      >
                        {availableProjects.map(p => (
                          <option key={p.code} value={p.code} className="bg-slate-900 text-slate-100">
                            {p.name} [{p.code}] - Client: {p.clientName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-400 flex items-center gap-2">
                        <Building className="w-4 h-4 text-purple-400 shrink-0" />
                        <span>General Corporate Operations (Non-Project Specific)</span>
                      </div>
                    )}
                  </div>

                  {/* Project Initials Input */}
                  <div>
                    <div className="relative">
                      <input
                        id="project-initials-input"
                        type="text"
                        value={isProjectLinked ? projectInitials : 'CORP'}
                        disabled={!isProjectLinked}
                        onChange={e => {
                          const val = e.target.value.replace(/[^A-Za-z0-9_-]/g, '').toUpperCase();
                          setProjectInitials(val);
                          if (errors.projectInitials) setErrors(prev => ({ ...prev, projectInitials: undefined }));
                        }}
                        placeholder="e.g. PIDM26"
                        maxLength={10}
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border font-mono font-bold text-xs sm:text-sm text-emerald-300 placeholder:text-slate-500 focus:outline-none transition-all ${
                          !isProjectLinked
                            ? 'opacity-60 cursor-not-allowed border-slate-800'
                            : errors.projectInitials
                            ? 'border-rose-500 focus:border-rose-400 ring-1 ring-rose-500/40'
                            : 'border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30'
                        }`}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono pointer-events-none">
                        Initials
                      </span>
                    </div>
                    {errors.projectInitials && (
                      <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" /> {errors.projectInitials}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 4: RECEIVER'S DIRECTION / DESIGNATION UNDER CLIENT OR AUTHORITY */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="receiver-designation-input" className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                    Receiver's Direction / Designation <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Formula Segment: <strong className="text-cyan-300 font-mono">[Receiver Initials]</strong>
                  </span>
                </div>

                {/* Receiver Direction Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pb-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 mr-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" /> Directions:
                  </span>
                  {receiverPresets.map(preset => {
                    const isSelected = receiverInitials.toUpperCase() === preset.initials.toUpperCase();
                    return (
                      <button
                        key={`${preset.initials}-${preset.designation}`}
                        type="button"
                        onClick={() => handleSelectReceiverPreset(preset)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                            : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/70 text-slate-300 hover:text-white'
                        }`}
                      >
                        <span>{preset.designation}</span>
                        <span className="text-[10px] text-cyan-400 font-mono font-bold ml-1">({preset.initials})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Designation Input & Receiver Initials Input */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <input
                      id="receiver-designation-input"
                      type="text"
                      value={receiverDesignation}
                      onChange={e => {
                        const val = e.target.value;
                        setReceiverDesignation(val);
                        const extracted = extractReceiverInitials(val);
                        if (extracted) setReceiverInitials(extracted);
                        if (errors.receiverDesignation) setErrors(prev => ({ ...prev, receiverDesignation: undefined }));
                      }}
                      placeholder="e.g. Provincial Director, Chief Engineer, Branch Manager, Director General"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all ${
                        errors.receiverDesignation
                          ? 'border-rose-500 focus:border-rose-400 ring-1 ring-rose-500/40'
                          : 'border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30'
                      }`}
                    />
                    {errors.receiverDesignation && (
                      <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" /> {errors.receiverDesignation}
                      </p>
                    )}
                  </div>

                  {/* Receiver Initials Input */}
                  <div>
                    <div className="relative">
                      <input
                        id="receiver-initials-input"
                        type="text"
                        value={receiverInitials}
                        onChange={e => {
                          const val = e.target.value.replace(/[^A-Za-z0-9_-]/g, '').toUpperCase();
                          setReceiverInitials(val);
                          if (errors.receiverInitials) setErrors(prev => ({ ...prev, receiverInitials: undefined }));
                        }}
                        placeholder="e.g. PD, CE, BM, DG, CG"
                        maxLength={6}
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border font-mono font-bold text-xs sm:text-sm text-cyan-300 placeholder:text-slate-500 focus:outline-none transition-all ${
                          errors.receiverInitials
                            ? 'border-rose-500 focus:border-rose-400'
                            : 'border-slate-700 focus:border-cyan-500'
                        }`}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono pointer-events-none">
                        Initials
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: AUTO-GENERATED OUTGOING REFERENCE (EMA / Client / Project / Receiver / Suffix) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-emerald-500/40 shadow-inner space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" />
                    Assigned Outgoing Reference (EMA / Client / Project / Receiver / Suffix)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Order Suffix:</span>
                    <input
                      type="text"
                      value={customSuffix || autoNextSuffix}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setCustomSuffix(val);
                      }}
                      className="w-16 px-2 py-0.5 rounded bg-slate-900 border border-emerald-500/50 text-emerald-300 font-mono font-bold text-xs text-center focus:outline-none focus:border-emerald-400"
                      title="Adjust sequential suffix"
                      maxLength={4}
                    />
                  </div>
                </div>

                {/* Prominent Live Reference Display */}
                <div className="flex items-center justify-between gap-3 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xl sm:text-2xl font-black text-emerald-300 tracking-wider select-all">
                      {liveEmaReference}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyReference(liveEmaReference)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-colors cursor-pointer shrink-0"
                    title="Copy reference number"
                  >
                    {hasCopiedRef ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Ref</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Formula Breakdown Tags */}
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                    EMA
                  </span>
                  <span>/</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold" title="Client / Organization Initials">
                    {cleanClientInitials || 'CLIENT'}
                  </span>
                  <span>/</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold" title="Project Initials">
                    {cleanProjectInitials || 'GEN'}
                  </span>
                  <span>/</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold" title="Receiver Direction Initials">
                    {cleanReceiverInitials || 'DIR'}
                  </span>
                  <span>/</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-bold" title="Sequential Order Suffix">
                    {effectiveSuffix}
                  </span>
                  <span className="text-[10px] text-slate-500 font-sans ml-2">
                    (Auto-sequenced for {cleanClientInitials}/{cleanProjectInitials}/{cleanReceiverInitials})
                  </span>
                </div>
              </div>

              {/* SECTION 6: SUBJECT & DATE */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3 space-y-1.5">
                  <label htmlFor="subject-input" className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-400" />
                    Subject <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="subject-input"
                    type="text"
                    value={subject}
                    onChange={e => {
                      setSubject(e.target.value);
                      if (errors.subject) setErrors(prev => ({ ...prev, subject: undefined }));
                    }}
                    placeholder="e.g. Request for Extension of Time due to Adverse Weather"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all ${
                      errors.subject
                        ? 'border-rose-500 focus:border-rose-400 ring-1 ring-rose-500/40'
                        : 'border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
                    }`}
                  />
                  {errors.subject && (
                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" /> {errors.subject}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="letter-date-input" className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    Date
                  </label>
                  <input
                    id="letter-date-input"
                    type="date"
                    value={letterDate}
                    onChange={e => setLetterDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* SECTION 7: UPLOAD OUTGOING LETTER DOCUMENT (OPTIONAL) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                    Upload Outgoing Letter Document <span className="text-slate-500 font-normal lowercase">(optional)</span>
                  </label>
                  <span className="text-[11px] text-slate-400">PDF, DOCX, DOC, Scans</span>
                </div>

                {uploadedLetterFile ? (
                  <div className="p-3.5 rounded-xl bg-slate-800/90 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-inner">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-semibold text-slate-100 truncate max-w-[280px] sm:max-w-md">
                            {uploadedLetterFile.name}
                          </p>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap font-medium">
                            Ready to Log
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatFileSize(uploadedLetterFile.size)} • {uploadedLetterFile.type || 'Document'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Remove uploaded letter"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={e => {
                      e.preventDefault();
                      setIsDraggingFile(true);
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-all ${
                      isDraggingFile
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-700/80 hover:border-emerald-500/50 bg-slate-800/40 hover:bg-slate-800/70'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                    />
                    <div className="flex flex-col items-center justify-center space-y-1.5">
                      <div className="w-9 h-9 rounded-full bg-slate-800/90 flex items-center justify-center text-slate-400">
                        <UploadCloud className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="text-xs sm:text-sm text-slate-200">
                        <span className="font-semibold text-emerald-400 hover:underline">Click to upload</span> or drag and drop outgoing letter
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Finalized document prepared externally (Word document, signed PDF, or scanned transmittal)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 8: RELATED INCOMING CORRESPONDENCE (OPTIONAL) */}
              <div className="space-y-1.5" ref={incomingDropdownRef}>
                <div className="flex items-center justify-between">
                  <label htmlFor="incoming-search-input" className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <ArrowDownLeft className="w-3.5 h-3.5 text-blue-400" />
                    Related Incoming Reference <span className="text-slate-500 font-normal lowercase">(optional)</span>
                  </label>
                  {selectedIncomingLetter && (
                    <button
                      type="button"
                      onClick={() => {
                        setRelatedIncomingId('');
                        setIncomingSearchQuery('');
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-0.5"
                    >
                      <X className="w-3 h-3" /> Clear link
                    </button>
                  )}
                </div>

                {selectedIncomingLetter ? (
                  <div className="p-3 bg-blue-950/40 border border-blue-500/40 rounded-xl flex items-start justify-between gap-3">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 font-mono font-bold text-blue-300">
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-500/30 text-[10px]">
                          INCOMING
                        </span>
                        <span>{selectedIncomingLetter.letterNumber || selectedIncomingLetter.theirReference}</span>
                      </div>
                      <p className="text-slate-200 font-medium">
                        {selectedIncomingLetter.subject}
                      </p>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                        <span>Date: {selectedIncomingLetter.date || selectedIncomingLetter.receivedDate}</span>
                        <span>•</span>
                        <span>From: {selectedIncomingLetter.senderOrganization || selectedIncomingLetter.clientName}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRelatedIncomingId('')}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                      title="Remove link"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        id="incoming-search-input"
                        type="text"
                        value={incomingSearchQuery}
                        onChange={e => {
                          setIncomingSearchQuery(e.target.value);
                          setIsIncomingDropdownOpen(true);
                        }}
                        onFocus={() => setIsIncomingDropdownOpen(true)}
                        placeholder="Search incoming letter by reference, subject, sender, or date..."
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {isIncomingDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 max-h-56 overflow-y-auto bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-30 divide-y divide-slate-700/60">
                        {filteredIncoming.length === 0 ? (
                          <div className="p-3 text-xs text-slate-400 text-center">
                            No matching incoming correspondence records found.
                          </div>
                        ) : (
                          filteredIncoming.map(inc => (
                            <div
                              key={inc.id}
                              onClick={() => {
                                setRelatedIncomingId(inc.id);
                                setIsIncomingDropdownOpen(false);
                                setIncomingSearchQuery('');
                              }}
                              className="p-2.5 hover:bg-slate-700/70 cursor-pointer transition-colors text-xs"
                            >
                              <div className="flex items-center justify-between gap-2 font-mono">
                                <span className="font-bold text-blue-400">
                                  {inc.letterNumber || inc.theirReference || 'Ref N/A'}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {inc.date || inc.receivedDate}
                                </span>
                              </div>
                              <p className="text-slate-200 line-clamp-1 mt-0.5 font-medium">
                                {inc.subject}
                              </p>
                              <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                                <span className="truncate max-w-[200px]">
                                  {inc.senderOrganization || inc.clientName}
                                </span>
                                {inc.projectCode && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono text-purple-300">
                                      {inc.projectCode}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="text-xs text-slate-400 hidden sm:block">
                Reference Format: <span className="font-mono font-bold text-emerald-400">EMA/{cleanClientInitials || 'Client'}/{cleanReceiverInitials || 'Receiver'}/{effectiveSuffix}</span>
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <button
                  id="btn-cancel-outgoing"
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-outgoing"
                  type="button"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {isSaving ? 'Logging...' : 'Save Outgoing Correspondence'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
