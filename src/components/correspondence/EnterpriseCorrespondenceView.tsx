import React, { useState, useMemo } from 'react';
import {
  Mail,
  FileText,
  Sparkles,
  Send,
  Download,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Layers,
  Wand2,
  Copy,
  ChevronRight,
  ShieldCheck,
  Building,
  Building2,
  Briefcase,
  FolderTree,
  Folder,
  FolderOpen,
  X,
  ExternalLink,
  RotateCcw,
  SlidersHorizontal,
  Eye,
  Paperclip,
  FileCheck,
  History,
  Lock,
  Unlock,
  GitCompare,
  AlertTriangle,
  Globe,
  RefreshCw,
  Check,
  Inbox,
  LayoutDashboard,
  Table,
  GitBranch,
  Link
} from 'lucide-react';
import { useEnterpriseCorrespondence } from '../../context/EnterpriseCorrespondenceContext';
import { useEnterpriseCompany } from '../../context/EnterpriseCompanyContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { Letter, LetterheadVariant, LetterTone, LetterheadTemplate, CorrespondenceAttachment, LetterVersion } from '../../types/correspondenceTypes';
import { generateLetterPdf } from '../../services/export/letterheadRenderer';
import { exportLetterToWord } from '../../services/export/wordExportService';
import { UniversalDeleteModal } from '../common/UniversalDeleteModal';
import { AdminClearHistoryButton } from '../common/AdminClearHistoryButton';
import { CorrespondenceFolderTree } from './CorrespondenceFolderTree';
import { OutgoingCorrespondenceLogModal } from './OutgoingCorrespondenceLogModal';
import { OutgoingCorrespondenceDetailPanel } from './OutgoingCorrespondenceDetailPanel';
import { CorrespondenceAttachmentModal } from './CorrespondenceAttachmentModal';
import { CorrespondencePriorDownloadModal } from './CorrespondencePriorDownloadModal';
import { CorrespondenceWorkflowBar } from './CorrespondenceWorkflowBar';
import { CorrespondenceFinalDocumentPanel } from './CorrespondenceFinalDocumentPanel';
import { CorrespondenceFinalizeModal } from './CorrespondenceFinalizeModal';
import { GoogleDocsConnectModal } from './GoogleDocsConnectModal';
import { CorrespondenceVersionDiffModal } from './CorrespondenceVersionDiffModal';
import { CorrespondenceDashboardView } from './CorrespondenceDashboardView';
import { CorrespondenceRegisterTable } from './CorrespondenceRegisterTable';
import { CorrespondenceThreadView } from './CorrespondenceThreadView';
import { CorrespondenceActionTrackerModal } from './CorrespondenceActionTrackerModal';
import { CorrespondenceIntakeModal } from './CorrespondenceIntakeModal';
import { CorrespondenceLinkModal } from './CorrespondenceLinkModal';
import { groupLettersByClientAndProject } from '../../utils/correspondenceUtils';

export const EnterpriseCorrespondenceView: React.FC = () => {
  const {
    letters,
    templates,
    letterheads,
    versions,
    getLetterheadById,
    createLetter,
    updateLetter,
    deleteLetter,
    draftLetterWithAi,
    transformLetterWithAi,
    submitForApproval,
    approveLetter,
    finalizeLetter,
    createRevision,
    updateGoogleDocLink,
    syncFromGoogleDoc,
    importWordRevision,
    advanceStatus,
    issueLetter,
    generateCorrespondenceReference,
    clearCorrespondenceHistory,
    clearAllCorrespondenceHistory,
    resetCorrespondenceToDefaults,
    recordLetterDownload,
    addActionItem,
    updateActionItem,
    deleteActionItem,
    linkRelatedCorrespondence,
    unlinkRelatedCorrespondence,
    updateReplyStatus
  } = useEnterpriseCorrespondence();

  const { profile } = useEnterpriseCompany();
  const { currentEnterprise } = useEnterprise();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'register' | 'outbox'>('dashboard');
  const [registerViewMode, setRegisterViewMode] = useState<
    'all' | 'incoming' | 'outgoing' | 'drafts' | 'pending_action' | 'pending_reply' | 'overdue'
  >('all');
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(letters[0] || null);

  // New Contractual Action & Thread Modals
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState<boolean>(false);
  const [actionTrackerLetter, setActionTrackerLetter] = useState<Letter | null>(null);
  const [threadModalLetter, setThreadModalLetter] = useState<Letter | null>(null);
  const [linkModalLetter, setLinkModalLetter] = useState<Letter | null>(null);

  // Modal state for View Prior to Download and Download History
  const [isPriorDownloadModalOpen, setIsPriorDownloadModalOpen] = useState<boolean>(false);
  const [priorDownloadModalLetter, setPriorDownloadModalLetter] = useState<Letter | null>(null);
  const [priorDownloadModalTab, setPriorDownloadModalTab] = useState<'preview' | 'history'>('preview');

  const handleOpenPriorDownloadView = (letterToView: Letter, tab: 'preview' | 'history' = 'preview') => {
    setPriorDownloadModalLetter(letterToView);
    setPriorDownloadModalTab(tab);
    setIsPriorDownloadModalOpen(true);
  };

  // Keep selectedLetter synchronized with context updates (e.g. newly attached documents, edited body)
  const activeSelectedLetter = useMemo(() => {
    if (!selectedLetter) return letters[0] || null;
    return letters.find(l => l.id === selectedLetter.id) || selectedLetter;
  }, [letters, selectedLetter]);

  // MS Word Export & Attachment States
  const [isExportingWord, setIsExportingWord] = useState<boolean>(false);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState<boolean>(false);

  // Document Control & Workflow Modals
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState<boolean>(false);
  const [isGoogleDocsModalOpen, setIsGoogleDocsModalOpen] = useState<boolean>(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState<boolean>(false);
  const [isCreateRevisionModalOpen, setIsCreateRevisionModalOpen] = useState<boolean>(false);
  const [revisionReasonText, setRevisionReasonText] = useState<string>('Updated terms and technical specifications');
  const [approvalErrorMessage, setApprovalErrorMessage] = useState<string | null>(null);

  // Active Letterhead for the selected letter
  const resolvedLetterheadForSelectedLetter = useMemo(() => {
    if (!activeSelectedLetter) return null;
    if (activeSelectedLetter.letterheadId) {
      const match = letterheads.find(l => l.id === activeSelectedLetter.letterheadId);
      if (match) return match;
    }
    return letterheads.find(l => l.isDefault && l.active) || letterheads[0] || null;
  }, [activeSelectedLetter, letterheads]);

  const handleExportWord = async (letterToExport: Letter) => {
    try {
      setIsExportingWord(true);
      await exportLetterToWord(
        letterToExport,
        profile,
        currentEnterprise?.name || 'EMA CORPORATE ENTERPRISE',
        resolvedLetterheadForSelectedLetter
      );
      const filename = `${letterToExport.letterNumber.replace(/[\/\\:]/g, '_')}_Official_Correspondence.docx`;
      recordLetterDownload(letterToExport.id, {
        format: 'DOCX',
        filename,
        downloadedBy: letterToExport.preparedBy || 'Executive Secretariat',
        fileSize: 85000,
        letterheadId: resolvedLetterheadForSelectedLetter?.id,
        letterheadName: resolvedLetterheadForSelectedLetter?.name,
        notes: `Exported to MS Word (.docx) for external review (v${letterToExport.version})`
      });
    } catch (err) {
      console.error('Failed to export letter to MS Word:', err);
      alert('Failed to generate MS Word document. Please try again.');
    } finally {
      setIsExportingWord(false);
    }
  };

  // Folder navigation states
  const [selectedClientKey, setSelectedClientKey] = useState<string | null>(null);
  const [selectedProjectKey, setSelectedProjectKey] = useState<string | null>(null);
  const [showFolderSidebar, setShowFolderSidebar] = useState<boolean>(true);

  // Log Outgoing Modal State
  const [isComposeModalOpen, setIsComposeModalOpen] = useState<boolean>(false);
  const [composeModalParams, setComposeModalParams] = useState<{
    clientAffix?: string;
    clientName?: string;
    projectAffix?: string;
    projectCode?: string;
    projectName?: string;
    letterheadId?: string;
    relatedIncomingId?: string;
  }>({});

  // Deletion Target State for Strict Admin Security Key Authorization
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Preview Sheet Mode: 'all' (stacked), 'page1' (letterhead only), 'page2' (blank continuation sheet only)
  const [previewSheetMode, setPreviewSheetMode] = useState<'all' | 'page1' | 'page2'>('all');

  // AI Tone Transformation
  const [isAiTransforming, setIsAiTransforming] = useState(false);

  // Group letters into Client & Project folders
  const folderHierarchy = useMemo(() => {
    return groupLettersByClientAndProject(letters);
  }, [letters]);

  // Current active folder meta
  const activeFolderMeta = useMemo(() => {
    if (!selectedClientKey && !selectedProjectKey) {
      return { type: 'ALL', title: 'All Correspondence Folders', count: letters.length };
    }
    if (selectedClientKey === 'GENERAL') {
      return {
        type: 'GENERAL',
        title: 'General Corporate & Statutory',
        count: folderHierarchy.generalLetters.length
      };
    }
    const client = folderHierarchy.clientFolders.find(c => c.clientKey === selectedClientKey);
    if (client) {
      if (selectedProjectKey) {
        const proj = client.projects.find(p => p.projectKey === selectedProjectKey);
        if (proj) {
          return {
            type: 'PROJECT',
            clientName: client.clientName,
            clientAffix: client.clientAffix,
            projectName: proj.projectName,
            projectCode: proj.projectCode,
            projectAffix: proj.projectAffix,
            title: `Project: [${proj.projectAffix}] ${proj.projectName}`,
            count: proj.letters.length
          };
        }
      }
      return {
        type: 'CLIENT',
        clientName: client.clientName,
        clientAffix: client.clientAffix,
        title: `Client: ${client.clientName} [${client.clientAffix}]`,
        count: client.totalLetters
      };
    }
    return { type: 'ALL', title: 'All Correspondence Folders', count: letters.length };
  }, [selectedClientKey, selectedProjectKey, folderHierarchy, letters.length]);

  // Filter letters according to Folder Selection + Search + Status
  const folderScopedLetters = useMemo(() => {
    let list: Letter[] = letters;
    if (selectedClientKey === 'GENERAL') {
      list = folderHierarchy.generalLetters;
    } else if (selectedClientKey) {
      const client = folderHierarchy.clientFolders.find(c => c.clientKey === selectedClientKey);
      if (client) {
        if (selectedProjectKey) {
          const proj = client.projects.find(p => p.projectKey === selectedProjectKey);
          list = proj ? proj.letters : [];
        } else {
          // All letters of this client across all projects
          const allClientLetters: Letter[] = [];
          client.projects.forEach(p => allClientLetters.push(...p.letters));
          list = allClientLetters;
        }
      }
    }

    return list.filter(l => {
      const matchesSearch =
        l.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.letterNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.ourReference && l.ourReference.toLowerCase().includes(searchQuery.toLowerCase())) ||
        l.recipientOrganization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.projectCode && l.projectCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (l.projectAffix && l.projectAffix.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (l.clientAffix && l.clientAffix.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [letters, folderHierarchy, selectedClientKey, selectedProjectKey, searchQuery, statusFilter]);

  // Handle open log outgoing modal with preset parameters
  const handleOpenCompose = (params?: {
    clientAffix?: string;
    clientName?: string;
    projectAffix?: string;
    projectCode?: string;
    projectName?: string;
    letterheadId?: string;
    relatedIncomingId?: string;
  }) => {
    if (params) {
      setComposeModalParams(params);
    } else if (activeFolderMeta.type === 'PROJECT') {
      setComposeModalParams({
        clientAffix: activeFolderMeta.clientAffix,
        clientName: activeFolderMeta.clientName,
        projectAffix: activeFolderMeta.projectAffix,
        projectCode: activeFolderMeta.projectCode,
        projectName: activeFolderMeta.projectName
      });
    } else if (activeFolderMeta.type === 'CLIENT') {
      setComposeModalParams({
        clientAffix: activeFolderMeta.clientAffix,
        clientName: activeFolderMeta.clientName
      });
    } else {
      setComposeModalParams({});
    }
    setIsComposeModalOpen(true);
  };

  const handleAiTransformTone = async (targetTone: LetterTone) => {
    if (!selectedLetter) return;
    try {
      setIsAiTransforming(true);
      const res = await transformLetterWithAi(selectedLetter.id, targetTone);
      setSelectedLetter({
        ...selectedLetter,
        bodyHtml: res.transformedBodyHtml
      });
    } catch (err) {
      console.error(err);
      alert('Tone transformation failed.');
    } finally {
      setIsAiTransforming(false);
    }
  };

  const handleSaveIncoming = (letterData: Partial<Letter>, file?: File) => {
    const incomingAttachments: CorrespondenceAttachment[] = file
      ? [
          {
            id: `att-${Date.now()}`,
            letterId: '',
            name: file.name,
            size: file.size,
            fileType: file.type || 'application/pdf',
            uploadedAt: new Date().toISOString(),
            uploadedBy: 'Document Controller',
            category: 'SUPPORTING_DOCUMENT',
            dataUrl: URL.createObjectURL(file)
          }
        ]
      : [];

    const now = new Date().toISOString();
    const created = createLetter({
      direction: 'Incoming',
      status: 'RECEIVED',
      letterNumber: letterData.letterNumber || letterData.theirReference || `IN-${Date.now().toString().slice(-6)}`,
      subject: letterData.subject || 'Incoming Correspondence',
      bodyHtml: letterData.bodyHtml || '<p>Incoming document registered into enterprise correspondence intake register.</p>',
      date: letterData.date || now.split('T')[0],
      receivedDate: letterData.receivedDate || now.split('T')[0],
      senderOrganization: letterData.senderOrganization || 'External Stakeholder',
      senderName: letterData.senderName || '',
      recipientOrganization: letterData.recipientOrganization || currentEnterprise?.name || 'Apex Global Logistics Corp',
      recipientName: letterData.recipientName || 'Managing Director / Secretariat',
      category: letterData.category || 'Project',
      documentType: letterData.documentType || 'LETTER',
      contractualCategory: letterData.contractualCategory || 'General',
      partyType: letterData.partyType || 'Other',
      priority: letterData.priority || 'Normal',
      confidentiality: letterData.confidentiality || 'Normal',
      projectId: letterData.projectId,
      projectCode: letterData.projectCode,
      projectName: letterData.projectName,
      projectAffix: letterData.projectAffix,
      clientId: letterData.clientId,
      clientName: letterData.clientName,
      clientAffix: letterData.clientAffix,
      theirReference: letterData.theirReference,
      ourReference: letterData.ourReference,
      replyRequired: letterData.replyRequired,
      replyDueDate: letterData.replyDueDate,
      replyStatus: letterData.replyRequired ? 'Pending' : undefined,
      actionRequired: letterData.actionRequired,
      actionDescription: letterData.actionDescription,
      actionDueDate: letterData.actionDueDate,
      actionOwnerId: letterData.actionOwnerId,
      actionItems: letterData.actionItems || [],
      relatedCorrespondenceIds: letterData.relatedCorrespondenceIds || [],
      parentCorrespondenceId: letterData.parentCorrespondenceId,
      relationship: letterData.relationship,
      preparedBy: 'Document Controller / Secretariat',
      attachedDocumentIds: [],
      attachments: incomingAttachments
    });

    setIsIntakeModalOpen(false);
    setSelectedLetter(created);
  };

  const handleComposeReply = (parentLetter: Letter) => {
    setComposeModalParams({
      clientAffix: parentLetter.clientAffix,
      clientName: parentLetter.clientName,
      projectAffix: parentLetter.projectAffix,
      projectCode: parentLetter.projectCode,
      projectName: parentLetter.projectName,
      letterheadId: parentLetter.letterheadId,
      relatedIncomingId: parentLetter.id
    });
    setIsComposeModalOpen(true);
  };

  const handleDownloadPdf = (letterToPrint: Letter) => {
    const targetLetterhead = letterToPrint.letterheadId
      ? getLetterheadById(letterToPrint.letterheadId)
      : (letterheads.find(l => l.isDefault && l.active) || letterheads[0]);
    const res = generateLetterPdf(
      letterToPrint,
      profile,
      currentEnterprise?.name || 'EMA CORPORATE ENTERPRISE',
      targetLetterhead
    );
    recordLetterDownload(letterToPrint.id, {
      format: 'PDF',
      filename: res?.filename || `${letterToPrint.letterNumber.replace(/[\/\\:]/g, '_')}_Official_Correspondence.pdf`,
      downloadedBy: letterToPrint.preparedBy || 'Executive Secretariat',
      fileSize: res?.fileSize || 145000,
      letterheadId: targetLetterhead?.id,
      letterheadName: targetLetterhead?.name,
      notes: `Downloaded official PDF (v${letterToPrint.version})`
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
              Official Correspondence Register & Archive
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                Official Register
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Contractual Register, Automated Action Tracking, & Official Reference Protocol{' '}
              <span className="font-mono text-purple-300 font-medium">(EMA/Client/Project/Year/Suffix)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Main Navigation Tabs */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-purple-600 text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-purple-300" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('register')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'register'
                  ? 'bg-purple-600 text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-purple-300" />
              <span>Register</span>
              <span className="ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-purple-300 border border-purple-500/30 font-mono">
                {letters.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('outbox')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'outbox'
                  ? 'bg-purple-600 text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Correspondence Folders & Document Inspector"
            >
              <FolderTree className="w-3.5 h-3.5 text-purple-300" />
              <span>Folders</span>
            </button>
          </div>

          {/* Toggle Folder Tree (Studio view only) */}
          {activeTab === 'outbox' && (
            <button
              onClick={() => setShowFolderSidebar(!showFolderSidebar)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                showFolderSidebar
                  ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Toggle Folder Tree Sidebar"
            >
              <FolderTree className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Folders</span>
            </button>
          )}

          {/* Log Incoming Button */}
          <button
            onClick={() => setIsIntakeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
            title="Log and stamp incoming correspondence, notices, or site instructions"
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Log Incoming</span>
          </button>

          {/* Log Outgoing Button */}
          <button
            onClick={() => handleOpenCompose()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Outgoing</span>
          </button>

          {/* Admin Clear History Button */}
          <AdminClearHistoryButton
            id="btn-admin-clear-correspondence"
            moduleName="Official Correspondence"
            itemCount={letters.length}
            itemDescription="official letters, contractual claims, and letterhead logs"
            preservedItemsDescription="Standard corporate letter templates, client registries, and company credentials will remain intact."
            buttonText="Clear History"
            onClear={() => {
              clearAllCorrespondenceHistory();
              setSelectedLetter(null);
            }}
          />
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* VIEW: DASHBOARD & RADAR */}
        {activeTab === 'dashboard' && (
          <CorrespondenceDashboardView
            letters={letters}
            onSelectTab={tabKey => {
              setRegisterViewMode(tabKey as any);
              setActiveTab('register');
            }}
            onOpenIncomingIntake={() => setIsIntakeModalOpen(true)}
            onOpenOutgoingCompose={() => handleOpenCompose()}
            onSelectLetter={letter => {
              setSelectedLetter(letter);
              setActiveTab('outbox');
            }}
          />
        )}

        {/* VIEW: MASTER CORRESPONDENCE REGISTER */}
        {activeTab === 'register' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
            <CorrespondenceRegisterTable
              viewMode={registerViewMode}
              letters={letters}
              selectedLetterId={activeSelectedLetter?.id || null}
              onSelectLetter={letter => {
                setSelectedLetter(letter);
                setActiveTab('outbox');
              }}
              onOpenIntakeModal={() => setIsIntakeModalOpen(true)}
              onOpenComposeModal={() => handleOpenCompose()}
              onOpenActionTracker={letter => setActionTrackerLetter(letter)}
              onOpenThreadView={letter => setThreadModalLetter(letter)}
              onDownloadPdf={letter => handleDownloadPdf(letter)}
              onDownloadWord={letter => handleExportWord(letter)}
            />
          </div>
        )}
        {/* VIEW 1: OUTBOX & FOLDER EXPLORER */}
        {activeTab === 'outbox' && (
          <div className="flex-1 flex overflow-hidden">
            {/* COLUMN 1: Client & Project Folder Tree Navigator */}
            {showFolderSidebar && (
              <CorrespondenceFolderTree
                clientFolders={folderHierarchy.clientFolders}
                generalLettersCount={folderHierarchy.generalLetters.length}
                totalLettersCount={letters.length}
                selectedClientKey={selectedClientKey}
                selectedProjectKey={selectedProjectKey}
                onSelectFolder={(cKey, pKey) => {
                  setSelectedClientKey(cKey);
                  setSelectedProjectKey(pKey);
                }}
                onCreateInFolder={params => handleOpenCompose(params)}
              />
            )}

            {/* COLUMN 2: Folder Letter Index List */}
            <div className="w-full md:w-96 border-r border-slate-800 flex flex-col bg-slate-900/50">
              {/* Folder Breadcrumb Banner */}
              <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs truncate min-w-0">
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="font-semibold text-slate-200 truncate">
                    {activeFolderMeta.title}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold">
                    {folderScopedLetters.length}
                  </span>
                  {activeFolderMeta.type !== 'ALL' && folderScopedLetters.length > 0 && (
                    <AdminClearHistoryButton
                      id="btn-admin-clear-folder-correspondence"
                      variant="compact"
                      moduleName={activeFolderMeta.title}
                      itemCount={folderScopedLetters.length}
                      itemDescription={`letters in ${activeFolderMeta.title}`}
                      preservedItemsDescription="Other correspondence folders and enterprise master registries remain intact."
                      buttonText="Clear Folder"
                      onClear={() => {
                        if (activeFolderMeta.type === 'PROJECT') {
                          clearCorrespondenceHistory({
                            projectAffix: activeFolderMeta.projectAffix,
                            projectKey: activeFolderMeta.projectCode
                          });
                        } else if (activeFolderMeta.type === 'CLIENT') {
                          clearCorrespondenceHistory({
                            clientAffix: activeFolderMeta.clientAffix,
                            clientKey: selectedClientKey || undefined
                          });
                        } else if (activeFolderMeta.type === 'GENERAL') {
                          clearCorrespondenceHistory({ clientKey: 'GENERAL' });
                        }
                        if (selectedLetter && folderScopedLetters.some(l => l.id === selectedLetter.id)) {
                          setSelectedLetter(null);
                        }
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Project Quick Action Header if in Project Folder */}
              {activeFolderMeta.type === 'PROJECT' && (
                <div className="p-3 bg-emerald-950/30 border-b border-emerald-500/20 flex items-center justify-between gap-2">
                  <div className="text-xs">
                    <div className="font-mono font-bold text-emerald-400">
                      EMA/{activeFolderMeta.clientAffix}/{activeFolderMeta.projectAffix}/...
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {activeFolderMeta.projectName}
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenCompose()}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition-colors flex-shrink-0"
                  >
                    <Plus className="w-3 h-3" /> New
                  </button>
                </div>
              )}

              {/* Search & Status Filters */}
              <div className="p-3 border-b border-slate-800 space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search ref, subject, recipient..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex gap-1 overflow-x-auto text-[11px] pb-0.5">
                  {['ALL', 'Draft', 'Approved', 'Issued'].map(st => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2 py-0.5 rounded font-medium transition-colors whitespace-nowrap ${
                        statusFilter === st
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
                {folderScopedLetters.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs space-y-3">
                    <p>
                      {letters.length === 0
                        ? 'All official correspondence history has been cleared.'
                        : 'No correspondence found in this folder.'}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenCompose()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Log Outgoing Letter
                      </button>
                      {letters.length === 0 && (
                        <button
                          onClick={() => resetCorrespondenceToDefaults()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Restore Sample Correspondence
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  folderScopedLetters.map(letter => {
                    const isSelected = selectedLetter?.id === letter.id;
                    return (
                      <div
                        key={letter.id}
                        onClick={() => setSelectedLetter(letter)}
                        className={`p-3.5 cursor-pointer transition-colors ${
                          isSelected ? 'bg-purple-500/15 border-l-4 border-purple-500' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-mono text-purple-400 font-bold tracking-tight">
                            {letter.letterNumber}
                          </span>
                          <span className="text-slate-400 text-[11px]">{letter.date}</span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-100 line-clamp-1 mb-1">
                          {letter.subject}
                        </h4>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate mb-2">
                          <Building2 className="w-3 h-3 text-amber-400 flex-shrink-0" />
                          <span className="truncate">{letter.recipientOrganization}</span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            {letter.projectAffix && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                                {letter.projectAffix}
                              </span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium truncate">
                              {letter.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {letter.downloadHistory && letter.downloadHistory.length > 0 && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleOpenPriorDownloadView(letter, 'history');
                                }}
                                className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-mono flex items-center gap-0.5 hover:bg-purple-500/20 transition-colors"
                                title={`${letter.downloadHistory.length} prior downloads recorded. Click to view history.`}
                              >
                                <History className="w-2.5 h-2.5" />
                                {letter.downloadHistory.length}
                              </button>
                            )}

                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleOpenPriorDownloadView(letter, 'preview');
                              }}
                              className="p-1 text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 rounded transition-colors"
                              title="View document prior to download"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                                letter.status === 'Approved'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : letter.status === 'Issued'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {letter.status}
                            </span>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setDeleteTarget({
                                  id: letter.id,
                                  title: `${letter.letterNumber}: ${letter.subject}`
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                              title="Delete Letter (Admin Security Key Required)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* COLUMN 3: Active Letter Preview & Action Controls */}
            {selectedLetter && (selectedLetter.direction === 'Outgoing' || selectedLetter.direction === 'OUTGOING') ? (
              <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950 p-4 sm:p-6">
                <OutgoingCorrespondenceDetailPanel
                  letter={activeSelectedLetter || selectedLetter}
                  relatedIncomingLetter={
                    letters.find(
                      l =>
                        (l.direction === 'Incoming' || l.direction === 'INCOMING') &&
                        (l.id === selectedLetter.parentCorrespondenceId ||
                          l.id === selectedLetter.replyToLetterId ||
                          (selectedLetter.relatedCorrespondenceIds && selectedLetter.relatedCorrespondenceIds.includes(l.id)))
                    ) || null
                  }
                  onSelectIncomingLetter={incLetter => setSelectedLetter(incLetter)}
                  onOpenThread={l => setThreadModalLetter(l)}
                  onOpenActionTracker={l => setActionTrackerLetter(l)}
                  onAttachDocs={() => setIsAttachmentModalOpen(true)}
                  onDelete={l =>
                    setDeleteTarget({
                      id: l.id,
                      title: `${l.letterNumber || l.ourReference}: ${l.subject}`
                    })
                  }
                />
              </div>
            ) : selectedLetter ? (
              <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950 p-4 sm:p-6">
                {/* PIPELINE STATUS VISUALIZATION (Requirement 2) */}
                {activeSelectedLetter && (
                  <div className="mb-4">
                    <CorrespondenceWorkflowBar
                      letter={activeSelectedLetter}
                      onAdvanceStatus={(letterId, newStatus) => {
                        advanceStatus(letterId, newStatus, 'Eng. Samantha Perera');
                      }}
                    />
                  </div>
                )}

                {/* Control Action Toolbar */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 mb-4 shadow-xl">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-mono font-black text-purple-400 text-sm sm:text-base tracking-wide">
                      {selectedLetter.letterNumber}
                    </span>
                    {selectedLetter.projectAffix && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {selectedLetter.projectAffix}
                      </span>
                    )}
                    {selectedLetter.clientAffix && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-bold flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {selectedLetter.clientAffix}
                      </span>
                    )}
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                        selectedLetter.status === 'Approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : selectedLetter.status === 'Issued'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : selectedLetter.status === 'Finalized'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {selectedLetter.status}
                    </span>
                  </div>

                  <div className="flex items-center flex-wrap gap-2">
                    {/* Tone Refinement */}
                    <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs">
                      <span className="px-2 text-slate-400 flex items-center gap-1">
                        <Wand2 className="w-3 h-3 text-purple-400" /> Tone:
                      </span>
                      {(['Formal', 'Assertive', 'Conciliatory', 'Urgent'] as LetterTone[]).map(t => (
                        <button
                          key={t}
                          disabled={isAiTransforming}
                          onClick={() => handleAiTransformTone(t)}
                          className="px-2 py-0.5 rounded hover:bg-slate-700 text-slate-300 transition-colors text-[11px]"
                        >
                          {t}
                        </button>
                      ))}
                    </div>


                    {/* VIEW PRIOR TO DOWNLOAD BUTTON */}
                    <button
                      type="button"
                      onClick={() => activeSelectedLetter && handleOpenPriorDownloadView(activeSelectedLetter, 'preview')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-purple-600/20"
                      title="Inspect full-fidelity document layout and A4 pagination prior to download"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Prior to Download
                    </button>

                    {/* PRIOR DOWNLOADS HISTORY BUTTON */}
                    <button
                      type="button"
                      onClick={() => activeSelectedLetter && handleOpenPriorDownloadView(activeSelectedLetter, 'history')}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      title="View history of prior downloads and revision exports"
                    >
                      <History className="w-3.5 h-3.5 text-purple-400" />
                      Prior Downloads
                      {((activeSelectedLetter?.downloadHistory?.length || 0) > 0) && (
                        <span className="ml-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono">
                          {activeSelectedLetter?.downloadHistory?.length}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => activeSelectedLetter && handleExportWord(activeSelectedLetter)}
                      disabled={isExportingWord}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-blue-700/20 disabled:opacity-50"
                      title="Generate authentic Microsoft Office Word (.docx) document with corporate layout and justified text"
                    >
                      <span className="w-3.5 h-3.5 rounded bg-white text-blue-700 font-black text-[10px] flex items-center justify-center leading-none shadow-xs">
                        W
                      </span>
                      {isExportingWord ? 'Exporting...' : 'Open in MS Word (.docx)'}
                    </button>

                    <button
                      onClick={() => setIsAttachmentModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      title="Attach modified Word letters or official document correspondence"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                      Attach Word / Docs
                      {(activeSelectedLetter?.attachments?.length || 0) > 0 && (
                        <span className="ml-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                          {activeSelectedLetter?.attachments?.length}
                        </span>
                      )}
                    </button>

                    {/* ACTION DIRECTIVES TRACKER */}
                    <button
                      type="button"
                      onClick={() => activeSelectedLetter && setActionTrackerLetter(activeSelectedLetter)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors"
                      title="Manage action items, tasks, responsible persons, and deadlines"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Actions
                      {((activeSelectedLetter?.actionItems?.length || 0) > 0 || activeSelectedLetter?.actionRequired) && (
                        <span className="ml-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono">
                          {activeSelectedLetter?.actionItems?.filter(a => a.status === 'OPEN' || a.status === 'IN_PROGRESS').length || (activeSelectedLetter?.actionRequired ? 1 : 0)}
                        </span>
                      )}
                    </button>

                    {/* CONTRACTUAL THREAD & REFERENCES */}
                    <button
                      type="button"
                      onClick={() => activeSelectedLetter && setThreadModalLetter(activeSelectedLetter)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold transition-colors"
                      title="View chronological reference thread and linked contractual letters"
                    >
                      <GitBranch className="w-3.5 h-3.5 text-purple-400" />
                      Thread
                      {((activeSelectedLetter?.relatedCorrespondenceIds?.length || 0) > 0 || activeSelectedLetter?.replyToLetterId || activeSelectedLetter?.parentCorrespondenceId) && (
                        <span className="ml-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono">
                          {(activeSelectedLetter?.relatedCorrespondenceIds?.length || 0) + (activeSelectedLetter?.replyToLetterId ? 1 : 0)}
                        </span>
                      )}
                    </button>

                    {/* LINK RELATED CORRESPONDENCE */}
                    <button
                      type="button"
                      onClick={() => activeSelectedLetter && setLinkModalLetter(activeSelectedLetter)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      title="Link or unlink related letters for claims, delays, or replies"
                    >
                      <Link className="w-3.5 h-3.5 text-blue-400" />
                      Link
                    </button>

                    <button
                      onClick={() => activeSelectedLetter && handleDownloadPdf(activeSelectedLetter)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Official PDF
                    </button>

                    <button
                      onClick={() =>
                        activeSelectedLetter &&
                        setDeleteTarget({
                          id: activeSelectedLetter.id,
                          title: `${activeSelectedLetter.letterNumber}: ${activeSelectedLetter.subject}`
                        })
                      }
                      className="p-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold transition-colors"
                      title="Delete Letter (Admin Security Key Required)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Error Banner for Action Blocks */}
                {approvalErrorMessage && (
                  <div className="max-w-4xl mx-auto w-full mb-4 p-3 bg-rose-950/70 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{approvalErrorMessage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setApprovalErrorMessage(null)}
                      className="text-slate-400 hover:text-white text-xs font-semibold"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* FINAL DOCUMENT CONTROL PANEL (Requirement 9 & 11) */}
                {activeSelectedLetter && (
                  <div className="max-w-4xl mx-auto w-full mb-4">
                    <CorrespondenceFinalDocumentPanel
                      letter={activeSelectedLetter}
                      letterhead={resolvedLetterheadForSelectedLetter}
                      onOpenGoogleDocs={() => setIsGoogleDocsModalOpen(true)}
                      onOpenFinalize={() => setIsFinalizeModalOpen(true)}
                      onDownloadWord={() => handleExportWord(activeSelectedLetter)}
                      onPreviewPdf={() => handleOpenPriorDownloadView(activeSelectedLetter, 'preview')}
                      onCreateRevision={() => setIsCreateRevisionModalOpen(true)}
                      onCompareVersions={() => setIsDiffModalOpen(true)}
                    />
                  </div>
                )}

                {/* APPROVAL INTEGRATION BAR (Requirement 8) */}
                {activeSelectedLetter && (
                  <div className="max-w-4xl mx-auto w-full mb-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                          Official Approval & Release Pipeline
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          Version {activeSelectedLetter.version || 1} • {resolvedLetterheadForSelectedLetter?.name || 'Default Letterhead'}
                        </span>
                      </div>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                        activeSelectedLetter.status === 'Issued'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : activeSelectedLetter.status === 'Approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : activeSelectedLetter.status === 'Finalized'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {activeSelectedLetter.status}
                      </span>
                    </div>

                    {/* Role Chain: Prepared By → Reviewer → Approver → Authorized Signatory → Issued */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                      <div className="p-2 bg-slate-950/70 border border-slate-800 rounded-lg">
                        <span className="text-[10px] text-slate-500 block uppercase font-mono">1. Prepared By</span>
                        <span className="font-semibold text-slate-200 truncate block">{activeSelectedLetter.preparedBy || 'Samantha Perera'}</span>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                          <Check className="w-3 h-3" /> Certified
                        </span>
                      </div>

                      <div className="p-2 bg-slate-950/70 border border-slate-800 rounded-lg">
                        <span className="text-[10px] text-slate-500 block uppercase font-mono">2. Reviewer</span>
                        <span className="font-semibold text-slate-200 truncate block">Eng. H. M. Bandara</span>
                        <span className={`text-[10px] flex items-center gap-1 mt-0.5 ${
                          ['Finalized', 'Approved', 'Issued'].includes(activeSelectedLetter.status)
                            ? 'text-emerald-400'
                            : 'text-slate-500'
                        }`}>
                          {['Finalized', 'Approved', 'Issued'].includes(activeSelectedLetter.status) ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {['Finalized', 'Approved', 'Issued'].includes(activeSelectedLetter.status) ? 'Reviewed' : 'Pending'}
                        </span>
                      </div>

                      <div className="p-2 bg-slate-950/70 border border-slate-800 rounded-lg">
                        <span className="text-[10px] text-slate-500 block uppercase font-mono">3. Approver</span>
                        <span className="font-semibold text-slate-200 truncate block">Eng. K. P. Perera</span>
                        <span className={`text-[10px] flex items-center gap-1 mt-0.5 ${
                          ['Approved', 'Issued'].includes(activeSelectedLetter.status)
                            ? 'text-emerald-400'
                            : 'text-slate-500'
                        }`}>
                          {['Approved', 'Issued'].includes(activeSelectedLetter.status) ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {['Approved', 'Issued'].includes(activeSelectedLetter.status) ? 'Approved' : 'Pending'}
                        </span>
                      </div>

                      <div className="p-2 bg-slate-950/70 border border-slate-800 rounded-lg">
                        <span className="text-[10px] text-slate-500 block uppercase font-mono">4. Signatory</span>
                        <span className="font-semibold text-slate-200 truncate block">Managing Director</span>
                        <span className={`text-[10px] flex items-center gap-1 mt-0.5 ${
                          ['Approved', 'Issued'].includes(activeSelectedLetter.status)
                            ? 'text-emerald-400'
                            : 'text-slate-500'
                        }`}>
                          {['Approved', 'Issued'].includes(activeSelectedLetter.status) ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {['Approved', 'Issued'].includes(activeSelectedLetter.status) ? 'Authorized' : 'Pending'}
                        </span>
                      </div>

                      <div className="p-2 bg-slate-950/70 border border-slate-800 rounded-lg">
                        <span className="text-[10px] text-slate-500 block uppercase font-mono">5. Registry Issue</span>
                        <span className="font-semibold text-slate-200 truncate block">Secretariat</span>
                        <span className={`text-[10px] flex items-center gap-1 mt-0.5 ${
                          activeSelectedLetter.status === 'Issued'
                            ? 'text-blue-400'
                            : 'text-slate-500'
                        }`}>
                          {activeSelectedLetter.status === 'Issued' ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {activeSelectedLetter.status === 'Issued' ? 'Issued' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Action Controls for Approval */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-800">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(activeSelectedLetter)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Download className="w-3 h-3" />
                          Download PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportWord(activeSelectedLetter)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold flex items-center gap-1.5"
                        >
                          <span className="w-3 h-3 rounded bg-white text-blue-700 font-bold text-[8px] flex items-center justify-center">W</span>
                          Download Word (.docx)
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {activeSelectedLetter.status === 'Draft' && (
                          <button
                            type="button"
                            onClick={() => setIsFinalizeModalOpen(true)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-amber-600/20"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            Finalize & Lock Document
                          </button>
                        )}

                        {activeSelectedLetter.status === 'Finalized' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setIsCreateRevisionModalOpen(true)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Request Revision
                            </button>
                            <button
                              type="button"
                              onClick={() => approveLetter(activeSelectedLetter.id, 'Eng. K. P. Perera (Director Operations)')}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Approve Document
                            </button>
                          </>
                        )}

                        {activeSelectedLetter.status === 'Approved' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setIsCreateRevisionModalOpen(true)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Request Revision
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const success = issueLetter(activeSelectedLetter.id, 'Executive Secretariat');
                                if (!success) {
                                  setApprovalErrorMessage('Cannot issue correspondence. The letter must be Finalized and Approved before being Issued.');
                                } else {
                                  setApprovalErrorMessage(null);
                                }
                              }}
                              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Issue Official Correspondence
                            </button>
                          </>
                        )}

                        {activeSelectedLetter.status === 'Issued' && (
                          <div className="flex items-center gap-2 text-xs text-blue-300 bg-blue-950/60 border border-blue-500/40 px-3 py-1.5 rounded-lg font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                            Officially Issued & Dispatched to Registry
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sheet Format Protocol & Page View Selector */}
                <div className="max-w-4xl mx-auto w-full mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-xl shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sheet View:</span>
                    <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setPreviewSheetMode('all')}
                        className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                          previewSheetMode === 'all'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        All Sheets (Stacked)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewSheetMode('page1')}
                        className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                          previewSheetMode === 'page1'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Page 1 (Letterhead Sheet)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewSheetMode('page2')}
                        className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                          previewSheetMode === 'page2'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Page 2 (Blank Sheet)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Letterhead on Page 1 Only • Remaining Pages Blank • Body Justified</span>
                  </div>
                </div>

                {/* ======================================================================= */}
                {/* PAGE 1: OFFICIAL CONSULTANT / CORPORATE LETTERHEAD SHEET                */}
                {/* ======================================================================= */}
                {(previewSheetMode === 'all' || previewSheetMode === 'page1') && (
                  <div
                    className="max-w-4xl mx-auto w-full bg-white text-slate-900 rounded-lg shadow-2xl relative overflow-hidden border border-slate-200 mb-8"
                    style={
                      resolvedLetterheadForSelectedLetter?.fullLetterheadImageUrl
                        ? { minHeight: '1120px' }
                        : undefined
                    }
                  >
                    {/* Full Artwork Background (if uploaded, PAGE 1 ONLY) */}
                    {resolvedLetterheadForSelectedLetter?.fullLetterheadImageUrl && (
                      <img
                        src={resolvedLetterheadForSelectedLetter.fullLetterheadImageUrl}
                        alt="EMA Company Letterhead Artwork"
                        className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                      />
                    )}

                    {/* Letterhead Content Container aligned to Safe Margins */}
                    <div
                      className="relative z-10 p-8 sm:p-10 flex flex-col justify-between"
                      style={{
                        paddingTop: resolvedLetterheadForSelectedLetter?.fullLetterheadImageUrl
                          ? `${Math.max(40, (resolvedLetterheadForSelectedLetter.contentTopMargin || 50) * 1.3)}px`
                          : undefined,
                        paddingBottom: resolvedLetterheadForSelectedLetter?.fullLetterheadImageUrl
                          ? `${Math.max(30, (resolvedLetterheadForSelectedLetter.contentBottomMargin || 35) * 1.3)}px`
                          : undefined,
                        paddingLeft: resolvedLetterheadForSelectedLetter?.fullLetterheadImageUrl
                          ? `${Math.max(28, (resolvedLetterheadForSelectedLetter.contentLeftMargin || 20) * 1.3)}px`
                          : undefined,
                        paddingRight: resolvedLetterheadForSelectedLetter?.fullLetterheadImageUrl
                          ? `${Math.max(28, (resolvedLetterheadForSelectedLetter.contentRightMargin || 20) * 1.3)}px`
                          : undefined,
                        minHeight: resolvedLetterheadForSelectedLetter?.fullLetterheadImageUrl ? '1080px' : undefined
                      }}
                    >
                      <div>
                        {/* Custom Header Graphic Banner (PAGE 1 ONLY) */}
                        {resolvedLetterheadForSelectedLetter?.headerImageUrl && !resolvedLetterheadForSelectedLetter?.fullLetterheadImageUrl && (
                          <div className="mb-6 border-b border-slate-200 pb-3">
                            <img
                              src={resolvedLetterheadForSelectedLetter.headerImageUrl}
                              alt="Company Header Banner"
                              className="w-full object-contain max-h-36 rounded"
                            />
                          </div>
                        )}

                        {/* Default Software-Generated Letterhead Banner (PAGE 1 ONLY, if no custom artwork) */}
                        {!resolvedLetterheadForSelectedLetter?.fullLetterheadImageUrl && !resolvedLetterheadForSelectedLetter?.headerImageUrl && (
                          <div className="border-b-2 border-emerald-600 pb-4 mb-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                                  {profile.legalName || currentEnterprise?.name}
                                </h2>
                                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-widest mt-0.5">
                                  {profile.tradingName || 'Logistics & Heavy Engineering Solutions'}
                                </p>
                              </div>
                              <div className="text-right text-[10px] text-slate-500 leading-tight">
                                <div>Reg No: {profile.registrationNumber}</div>
                                <div>VAT: {profile.vatNumber} | TIN: {profile.tinNumber}</div>
                                <div>CIDA Grade: {profile.cidaGrade}</div>
                              </div>
                            </div>
                            <div className="mt-2 text-[10px] text-slate-600 flex justify-between">
                              <span>Office: {profile.registeredAddress}</span>
                              <span>Tel: {profile.telephone} | Web: {profile.website}</span>
                            </div>
                          </div>
                        )}

                        {/* =============================================================== */}
                        {/* STRUCTURED DUAL BOXES: RECIPIENT & CORRESPONDENCE PARTICULARS    */}
                        {/* =============================================================== */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-4">
                          {/* Box 1: Recipient / Addressee Details */}
                          <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                            <div className="bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-700 tracking-wider uppercase">
                                TO: RECIPIENT & ADDRESSEE
                              </span>
                              <span className="text-[9px] font-semibold text-slate-500 uppercase">Official Delivery</span>
                            </div>
                            <div className="p-3 text-xs space-y-1">
                              <div className="font-bold text-sm text-slate-900 leading-snug">
                                {activeSelectedLetter.recipientOrganization || 'General Addressee / Employer'}
                              </div>
                              {activeSelectedLetter.attention && (
                                <div className="italic text-slate-700 font-medium">
                                  Attn: {activeSelectedLetter.attention}
                                </div>
                              )}
                              <div className="text-slate-500 whitespace-pre-line leading-relaxed text-[11px] pt-0.5">
                                {activeSelectedLetter.recipientAddress || 'Corporate Office / Project Site'}
                              </div>
                            </div>
                          </div>

                          {/* Box 2: Correspondence Particulars */}
                          <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                            <div className="bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-700 tracking-wider uppercase">
                                CORRESPONDENCE PARTICULARS
                              </span>
                              <span className="text-[9px] font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                                {activeSelectedLetter.ourReference || activeSelectedLetter.letterNumber}
                              </span>
                            </div>
                            <div className="p-3 text-xs text-slate-700 space-y-1.5">
                              <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                                <span className="font-bold text-slate-600 text-[11px]">Date:</span>
                                <span className="font-medium text-slate-900">{activeSelectedLetter.date}</span>
                              </div>
                              <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                                <span className="font-bold text-slate-600 text-[11px]">Our Ref:</span>
                                <span className="font-mono font-bold text-purple-800">
                                  {activeSelectedLetter.ourReference || activeSelectedLetter.letterNumber}
                                </span>
                              </div>
                              <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                                <span className="font-bold text-slate-600 text-[11px]">Your Ref:</span>
                                <span className="font-medium text-slate-800">
                                  {activeSelectedLetter.theirReference || '—'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                                <span className="font-bold text-slate-600 text-[11px]">Project:</span>
                                <span className="text-[11px] text-emerald-700 font-semibold truncate max-w-[200px]" title={activeSelectedLetter.projectName}>
                                  [{activeSelectedLetter.projectAffix || activeSelectedLetter.projectCode || 'GEN'}]{' '}
                                  {activeSelectedLetter.projectName || 'General Operations'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-600 text-[11px]">Category:</span>
                                <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                  {activeSelectedLetter.category} ({activeSelectedLetter.confidentiality || 'Normal'})
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* =============================================================== */}
                        {/* STRUCTURED SUBJECT BOX                                          */}
                        {/* =============================================================== */}
                        <div className="bg-slate-50 border border-slate-300 border-l-4 border-l-slate-900 rounded-md p-3.5 mb-5 shadow-2xs">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                            OFFICIAL SUBJECT MATTER:
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide leading-relaxed">
                            SUBJECT: {activeSelectedLetter.subject}
                          </div>
                        </div>

                        {/* =============================================================== */}
                        {/* LETTER BODY BOX - FULLY JUSTIFIED IN STANDARD PRACTICE           */}
                        {/* =============================================================== */}
                        <div className="border border-slate-200 rounded-lg p-5 sm:p-7 bg-white shadow-2xs">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4 flex justify-between items-center">
                            <span>Official Letter Body Text</span>
                            <span className="font-normal text-slate-400 lowercase">Standard Justified Layout</span>
                          </div>
                          <div
                            className="text-sm leading-relaxed text-slate-800 space-y-4 font-serif text-justify [&>p]:text-justify [&>p]:leading-relaxed [&>p]:mb-4"
                            style={{ textAlign: 'justify', textJustify: 'inter-word' }}
                            dangerouslySetInnerHTML={{ __html: activeSelectedLetter.bodyHtml }}
                          />
                        </div>
                      </div>

                      <div>
                        {/* Sign-off & Seal on Page 1 (only when viewing single page 1) */}
                        {previewSheetMode === 'page1' && (
                          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-end">
                            <div className="text-xs text-slate-700 space-y-1">
                              <div>Yours faithfully,</div>
                              <div className="font-bold text-slate-900 uppercase text-sm">
                                {profile.legalName || currentEnterprise?.name}
                              </div>
                              <div className="h-12 flex items-center">
                                {activeSelectedLetter.status === 'Approved' ? (
                                  <div className="px-3 py-1 bg-emerald-50 border border-emerald-300 rounded text-[11px] font-mono text-emerald-800 flex items-center gap-1 font-bold">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    OFFICIALLY SIGNED & SEALED
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">[Pending Board Signature]</span>
                                )}
                              </div>
                              <div className="font-bold text-slate-900">
                                {activeSelectedLetter.approvedBy || activeSelectedLetter.preparedBy}
                              </div>
                              <div className="text-slate-500 text-[11px]">Authorized Signatory</div>
                            </div>

                            <div className="text-right text-[10px] text-slate-400">
                              <div>Ref: {activeSelectedLetter.letterNumber}</div>
                              <div>EMA Project & Client Registry</div>
                            </div>
                          </div>
                        )}

                        {/* Custom Footer Graphic Banner (PAGE 1 ONLY) */}
                        {resolvedLetterheadForSelectedLetter?.footerImageUrl && !resolvedLetterheadForSelectedLetter?.fullLetterheadImageUrl && (
                          <div className="mt-6 pt-3 border-t border-slate-200">
                            <img
                              src={resolvedLetterheadForSelectedLetter.footerImageUrl}
                              alt="Company Footer Banner"
                              className="w-full object-contain max-h-24 rounded"
                            />
                          </div>
                        )}

                        {/* Page 1 Footer Note when Stacked */}
                        {previewSheetMode === 'all' && (
                          <div className="mt-6 pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
                            <span>{profile.legalName || currentEnterprise?.name} • Page 1 (Official Letterhead Sheet)</span>
                            <span className="font-semibold text-purple-700">Continued on Blank Page 2 ➔</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ======================================================================= */}
                {/* PAGE 2: BLANK CONTINUATION SHEET (WITHOUT LETTERHEAD BACKGROUND)        */}
                {/* ======================================================================= */}
                {(previewSheetMode === 'all' || previewSheetMode === 'page2') && (
                  <div className="max-w-4xl mx-auto w-full">
                    {previewSheetMode === 'all' && (
                      <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-slate-700"></div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-900 border border-slate-700 px-3 py-1 rounded-full flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          Continuation Sheet (Blank Page without Letterhead Background)
                        </span>
                        <div className="flex-1 h-px bg-slate-700"></div>
                      </div>
                    )}

                    <div className="w-full bg-white text-slate-900 rounded-lg shadow-2xl relative overflow-hidden border border-slate-200 p-8 sm:p-10 flex flex-col justify-between min-h-[900px]">
                      <div>
                        {/* Standard Minimal Continuation Header at top of Blank Sheet */}
                        <div className="flex items-center justify-between pb-3 mb-6 border-b border-slate-200 text-xs text-slate-600 font-mono">
                          <div>
                            <span className="font-bold text-slate-800">Ref:</span>{' '}
                            {activeSelectedLetter.ourReference || activeSelectedLetter.letterNumber}
                          </div>
                          <div className="text-slate-500 font-normal">
                            Date: {activeSelectedLetter.date}
                          </div>
                          <div className="font-bold text-slate-800">
                            Page 2 of 2 <span className="font-normal text-slate-500">(Continuation Sheet)</span>
                          </div>
                        </div>

                        {/* Continuation Body Box - Fully Justified */}
                        <div className="border border-slate-200 rounded-lg p-5 sm:p-7 bg-white shadow-2xs mb-6">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4 flex justify-between items-center">
                            <span>Continued Text & Determination</span>
                            <span className="font-normal text-slate-400 lowercase">Standard Justified Layout</span>
                          </div>
                          <div
                            className="text-sm leading-relaxed text-slate-800 space-y-4 font-serif text-justify [&>p]:text-justify [&>p]:leading-relaxed [&>p]:mb-4"
                            style={{ textAlign: 'justify', textJustify: 'inter-word' }}
                            dangerouslySetInnerHTML={{ __html: activeSelectedLetter.bodyHtml }}
                          />
                        </div>
                      </div>

                      {/* Formal Sign-off & Seal Block on Continuation Sheet */}
                      <div>
                        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-end">
                          <div className="text-xs text-slate-700 space-y-1">
                            <div>Yours faithfully,</div>
                            <div className="font-bold text-slate-900 uppercase text-sm">
                              {profile.legalName || currentEnterprise?.name}
                            </div>
                            <div className="h-12 flex items-center">
                              {activeSelectedLetter.status === 'Approved' ? (
                                <div className="px-3 py-1 bg-emerald-50 border border-emerald-300 rounded text-[11px] font-mono text-emerald-800 flex items-center gap-1 font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  OFFICIALLY SIGNED & SEALED
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">[Pending Board Signature]</span>
                              )}
                            </div>
                            <div className="font-bold text-slate-900">
                              {activeSelectedLetter.approvedBy || activeSelectedLetter.preparedBy}
                            </div>
                            <div className="text-slate-500 text-[11px]">Authorized Signatory</div>
                          </div>

                          <div className="text-right text-[10px] text-slate-400">
                            <div>Ref: {activeSelectedLetter.letterNumber}</div>
                            <div>EMA Project & Client Registry</div>
                          </div>
                        </div>

                        {/* Minimal Continuation Footer */}
                        <div className="mt-6 pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
                          <span>
                            {profile.legalName || currentEnterprise?.name} • Continuation Sheet (Blank Page Protocol)
                          </span>
                          <span>Page 2 of 2 • Authenticated Corporate Record</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* =============================================================== */}
                {/* DOCUMENT CORRESPONDENCE & ATTACHED WORD LETTERS PANEL           */}
                {/* =============================================================== */}
                <div className="max-w-4xl mx-auto w-full mt-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-base shadow-sm">
                        W
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                          Document Correspondence & Linked MS Word Files
                          <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-mono">
                            {(activeSelectedLetter.attachments?.length || 0)} Enclosed
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          Export to MS Office Word, edit externally, and attach revised documents as official correspondence
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleExportWord(activeSelectedLetter)}
                        disabled={isExportingWord}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                      >
                        <span className="w-3.5 h-3.5 rounded bg-white text-blue-700 font-bold text-[10px] flex items-center justify-center leading-none">
                          W
                        </span>
                        {isExportingWord ? 'Exporting...' : 'Open in MS Word'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAttachmentModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                        Attach Modified Letter / Doc
                      </button>
                    </div>
                  </div>

                  {(!activeSelectedLetter.attachments || activeSelectedLetter.attachments.length === 0) ? (
                    <div className="py-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/60 mt-4">
                      <FileText className="w-9 h-9 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-300">
                        No Document Correspondence attached yet
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-md mx-auto mt-1">
                        Export this letter to Microsoft Office Word (.docx) to adjust layout or text, then attach the modified document right here.
                      </p>
                      <div className="flex items-center justify-center gap-2.5 mt-4">
                        <button
                          type="button"
                          onClick={() => handleExportWord(activeSelectedLetter)}
                          className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                        >
                          <span className="w-3.5 h-3.5 rounded bg-white text-blue-700 font-bold text-[10px] flex items-center justify-center">W</span>
                          Open in MS Word (.docx)
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAttachmentModalOpen(true)}
                          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                          Attach File
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      {activeSelectedLetter.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="p-3.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded-xl flex items-start justify-between gap-3 transition-colors"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                                att.name.endsWith('.docx') || att.category === 'MODIFIED_WORD_DOC'
                                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                  : att.name.endsWith('.pdf')
                                  ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                                  : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {att.name.endsWith('.docx') ? 'W' : att.name.endsWith('.pdf') ? 'PDF' : 'DOC'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-200 truncate">{att.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] bg-slate-700/60 text-slate-300 px-1.5 py-0.2 rounded font-mono">
                                  {att.size < 1024 * 1024 ? `${(att.size / 1024).toFixed(1)} KB` : `${(att.size / (1024 * 1024)).toFixed(1)} MB`}
                                </span>
                                <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                                  {att.category === 'MODIFIED_WORD_DOC' ? 'Word Revision' : att.category}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1 truncate">
                                {att.description || 'Attached correspondence'} • {new Date(att.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {att.dataUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = att.dataUrl!;
                                  link.download = att.name;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded-lg transition-colors"
                                title="Download Attached Document"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setIsAttachmentModalOpen(true)}
                              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                              title="Manage in Attachment Center"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* =============================================================== */}
                {/* PRIOR DOWNLOADS & DOCUMENT AUDIT TRAIL PANEL                    */}
                {/* =============================================================== */}
                <div className="max-w-4xl mx-auto w-full mt-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-base shadow-sm">
                        <History className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                          Prior Downloads & Export Audit Trail
                          <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-mono font-bold">
                            {(activeSelectedLetter.downloadHistory?.length || 0)} Logged
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          Review previous PDF & MS Word downloads, examine document layout prior to export, and maintain ISO compliance records
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenPriorDownloadView(activeSelectedLetter, 'preview')}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Prior to Download
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenPriorDownloadView(activeSelectedLetter, 'history')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <History className="w-3.5 h-3.5 text-purple-400" />
                        View Full History
                      </button>
                    </div>
                  </div>

                  {(!activeSelectedLetter.downloadHistory || activeSelectedLetter.downloadHistory.length === 0) ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      <p>No prior downloads recorded for this letter yet.</p>
                      <p className="text-slate-400 mt-1">
                        Click <strong className="text-purple-400">"View Prior to Download"</strong> above to inspect formatting or download your first copy.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/80 mt-3">
                      {activeSelectedLetter.downloadHistory.slice(0, 3).map((hist, idx) => (
                        <div key={hist.id || idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 ${
                                hist.format === 'DOCX'
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  : hist.format === 'PDF'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {hist.format === 'DOCX' ? 'W' : hist.format === 'PDF' ? 'PDF' : 'PRN'}
                            </span>
                            <div className="min-w-0">
                              <div className="font-mono font-semibold text-slate-200 truncate">
                                {hist.filename}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                                <span>{new Date(hist.downloadedAt).toLocaleString()}</span>
                                <span>•</span>
                                <span>By: {hist.downloadedBy}</span>
                                <span>•</span>
                                <span className="text-purple-400 font-mono">v{hist.version}</span>
                                {hist.letterheadName && (
                                  <>
                                    <span>•</span>
                                    <span className="text-slate-400 truncate max-w-[180px]">{hist.letterheadName}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenPriorDownloadView(activeSelectedLetter, 'preview')}
                            className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                            title="Inspect document & re-download"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Inspect
                          </button>
                        </div>
                      ))}
                      {activeSelectedLetter.downloadHistory.length > 3 && (
                        <div className="pt-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenPriorDownloadView(activeSelectedLetter, 'history')}
                            className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                          >
                            + {activeSelectedLetter.downloadHistory.length - 3} more prior download records...
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm space-y-3">
                <FileText className="w-12 h-12 text-slate-700" />
                <p>Select a letter to preview or create a new letter.</p>
                <button
                  onClick={() => handleOpenCompose()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold"
                >
                  Compose Official Letter
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: LOG OUTGOING CORRESPONDENCE REGISTER */}
      {isComposeModalOpen && (
        <OutgoingCorrespondenceLogModal
          isOpen={isComposeModalOpen}
          onClose={() => setIsComposeModalOpen(false)}
          initialClientAffix={composeModalParams.clientAffix}
          initialClientName={composeModalParams.clientName}
          initialProjectAffix={composeModalParams.projectAffix}
          initialProjectCode={composeModalParams.projectCode}
          initialProjectName={composeModalParams.projectName}
          initialRelatedIncomingId={composeModalParams.relatedIncomingId}
          onLetterCreated={createdLetter => {
            setSelectedLetter(createdLetter);
            setActiveTab('outbox');
          }}
        />
      )}

      {/* MODAL: CORRESPONDENCE ATTACHMENT & WORD DOC LINK */}
      {isAttachmentModalOpen && activeSelectedLetter && (
        <CorrespondenceAttachmentModal
          isOpen={isAttachmentModalOpen}
          onClose={() => setIsAttachmentModalOpen(false)}
          letter={activeSelectedLetter}
        />
      )}

      {/* MODAL: VIEW PRIOR TO DOWNLOAD & DOWNLOAD AUDIT HISTORY */}
      {isPriorDownloadModalOpen && (priorDownloadModalLetter || activeSelectedLetter) && (
        <CorrespondencePriorDownloadModal
          isOpen={isPriorDownloadModalOpen}
          onClose={() => {
            setIsPriorDownloadModalOpen(false);
            setPriorDownloadModalLetter(null);
          }}
          letter={priorDownloadModalLetter || activeSelectedLetter!}
          initialTab={priorDownloadModalTab}
        />
      )}

      {/* Strict Security Key Delete Confirmation Modal */}
      {deleteTarget && (
        <UniversalDeleteModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          recordType="Official Correspondence"
          recordTitle={deleteTarget.title}
          recordId={deleteTarget.id}
          module="DOCUMENTS"
          onDelete={async () => {
            deleteLetter(deleteTarget.id);
            if (selectedLetter?.id === deleteTarget.id) {
              setSelectedLetter(null);
            }
            setDeleteTarget(null);
          }}
        />
      )}

      {/* MODAL: FINALIZE & LOCK CORRESPONDENCE */}
      {isFinalizeModalOpen && activeSelectedLetter && (
        <CorrespondenceFinalizeModal
          isOpen={isFinalizeModalOpen}
          onClose={() => setIsFinalizeModalOpen(false)}
          letter={activeSelectedLetter}
          letterhead={resolvedLetterheadForSelectedLetter}
          onConfirmFinalize={async (officerName) => {
            finalizeLetter(activeSelectedLetter.id, officerName);
          }}
        />
      )}

      {/* MODAL: GOOGLE DOCS INTEGRATION & SYNC */}
      {isGoogleDocsModalOpen && activeSelectedLetter && (
        <GoogleDocsConnectModal
          isOpen={isGoogleDocsModalOpen}
          onClose={() => setIsGoogleDocsModalOpen(false)}
          letter={activeSelectedLetter}
          profile={profile}
          letterhead={resolvedLetterheadForSelectedLetter}
          onLinkUpdated={(docUrl, docId) => {
            updateGoogleDocLink(activeSelectedLetter.id, docUrl, docId);
          }}
          onSyncContent={(newHtml) => {
            syncFromGoogleDoc(activeSelectedLetter.id, newHtml, 'Corporate Officer');
          }}
        />
      )}

      {/* MODAL: VERSION DIFFERENCE COMPARISON */}
      {isDiffModalOpen && activeSelectedLetter && (
        <CorrespondenceVersionDiffModal
          isOpen={isDiffModalOpen}
          onClose={() => setIsDiffModalOpen(false)}
          letter={activeSelectedLetter}
          versions={versions.filter(v => v.letterId === activeSelectedLetter.id)}
        />
      )}

      {/* MODAL: CREATE REVISION FROM FINALIZED LETTER */}
      {isCreateRevisionModalOpen && activeSelectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Create New Revision
                </h3>
                <p className="text-xs text-slate-400">
                  Create a working draft revision (V{(activeSelectedLetter.version || 1) + 1}) from finalized letter
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Version:</span>
                <span className="font-mono text-emerald-400 font-bold">V{activeSelectedLetter.version || 1} (Finalized)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Revision:</span>
                <span className="font-mono text-amber-400 font-bold">V{(activeSelectedLetter.version || 1) + 1} (Draft)</span>
              </div>
              <div className="text-[11px] text-slate-400 pt-1">
                The current finalized letter and its audit history will remain permanently locked in the archive.
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Reason for Revision / Change Summary
              </label>
              <textarea
                rows={3}
                required
                value={revisionReasonText}
                onChange={e => setRevisionReasonText(e.target.value)}
                placeholder="e.g. Updating clause 4.2 regarding extension of time schedule..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateRevisionModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  createRevision(activeSelectedLetter.id, revisionReasonText, 'Eng. Samantha Perera');
                  setIsCreateRevisionModalOpen(false);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-amber-600/20"
              >
                Create Revision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CORRESPONDENCE INTAKE (LOG INCOMING NOTICES & LETTERS) */}
      {isIntakeModalOpen && (
        <CorrespondenceIntakeModal
          existingLetters={letters}
          onClose={() => setIsIntakeModalOpen(false)}
          onSaveIncoming={(letterData, file) => handleSaveIncoming(letterData, file)}
        />
      )}

      {/* MODAL: ACTION ITEMS & CONTRACTUAL DIRECTIVES TRACKER */}
      {actionTrackerLetter && (
        <CorrespondenceActionTrackerModal
          letter={letters.find(l => l.id === actionTrackerLetter.id) || actionTrackerLetter}
          onClose={() => setActionTrackerLetter(null)}
          onAddActionItem={(letterId, item) => addActionItem(letterId, item)}
          onUpdateActionItem={(letterId, actionItemId, updates) => updateActionItem(letterId, actionItemId, updates)}
          onDeleteActionItem={(letterId, actionItemId) => deleteActionItem(letterId, actionItemId)}
        />
      )}

      {/* MODAL: LINK RELATED CORRESPONDENCE & CLAIMS */}
      {linkModalLetter && (
        <CorrespondenceLinkModal
          currentLetter={letters.find(l => l.id === linkModalLetter.id) || linkModalLetter}
          allLetters={letters}
          onClose={() => setLinkModalLetter(null)}
          onLinkLetter={(letterId, targetId) => linkRelatedCorrespondence(letterId, targetId)}
          onUnlinkLetter={(letterId, targetId) => unlinkRelatedCorrespondence(letterId, targetId)}
        />
      )}

      {/* MODAL: CONTRACTUAL REFERENCE THREAD & CHRONOLOGY */}
      {threadModalLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    Contractual Reference Chain & Chronology
                    <span className="font-mono text-purple-400 text-xs font-semibold">
                      {threadModalLetter.letterNumber}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Chronological progression of notices, site instructions, claims, and responses
                  </p>
                </div>
              </div>
              <button
                onClick={() => setThreadModalLetter(null)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/30">
              <CorrespondenceThreadView
                currentLetter={letters.find(l => l.id === threadModalLetter.id) || threadModalLetter}
                allLetters={letters}
                onSelectLetter={l => {
                  setSelectedLetter(l);
                  setThreadModalLetter(l);
                }}
                onComposeReply={l => {
                  setThreadModalLetter(null);
                  handleComposeReply(l);
                }}
                onOpenLinkModal={l => setLinkModalLetter(l)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
