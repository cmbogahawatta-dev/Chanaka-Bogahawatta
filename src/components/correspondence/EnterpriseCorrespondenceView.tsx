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
  RotateCcw
} from 'lucide-react';
import { useEnterpriseCorrespondence } from '../../context/EnterpriseCorrespondenceContext';
import { useEnterpriseCompany } from '../../context/EnterpriseCompanyContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { Letter, LetterheadVariant, LetterTone } from '../../types/correspondenceTypes';
import { generateLetterPdf } from '../../services/export/letterheadRenderer';
import { UniversalDeleteModal } from '../common/UniversalDeleteModal';
import { AdminClearHistoryButton } from '../common/AdminClearHistoryButton';
import { CorrespondenceFolderTree } from './CorrespondenceFolderTree';
import { CorrespondenceComposeModal } from './CorrespondenceComposeModal';
import { groupLettersByClientAndProject } from '../../utils/correspondenceUtils';

export const EnterpriseCorrespondenceView: React.FC = () => {
  const {
    letters,
    templates,
    createLetter,
    updateLetter,
    deleteLetter,
    draftLetterWithAi,
    transformLetterWithAi,
    submitForApproval,
    approveLetter,
    generateCorrespondenceReference,
    clearCorrespondenceHistory,
    clearAllCorrespondenceHistory,
    resetCorrespondenceToDefaults
  } = useEnterpriseCorrespondence();

  const { profile } = useEnterpriseCompany();
  const { currentEnterprise } = useEnterprise();

  const [activeTab, setActiveTab] = useState<'outbox' | 'templates'>('outbox');
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(letters[0] || null);

  // Folder navigation states
  const [selectedClientKey, setSelectedClientKey] = useState<string | null>(null);
  const [selectedProjectKey, setSelectedProjectKey] = useState<string | null>(null);
  const [showFolderSidebar, setShowFolderSidebar] = useState<boolean>(true);

  // Compose Modal State
  const [isComposeModalOpen, setIsComposeModalOpen] = useState<boolean>(false);
  const [composeModalParams, setComposeModalParams] = useState<{
    clientAffix?: string;
    clientName?: string;
    projectAffix?: string;
    projectCode?: string;
    projectName?: string;
  }>({});

  // Deletion Target State for Strict Admin Security Key Authorization
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

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

  // Handle open compose modal with preset parameters
  const handleOpenCompose = (params?: {
    clientAffix?: string;
    clientName?: string;
    projectAffix?: string;
    projectCode?: string;
    projectName?: string;
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

  const handleDownloadPdf = (letterToPrint: Letter) => {
    generateLetterPdf(letterToPrint, profile, currentEnterprise?.name || 'Apex Global Logistics Corp');
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
              Official Correspondence & Letterhead Studio
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-medium border border-purple-500/30">
                AI Powered
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Project & Client Folders with Automatic Reference Protocol{' '}
              <span className="font-mono text-purple-300 font-medium">(EMA/Client/Project/Year/Suffix)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Toggle Folder Tree */}
          <button
            onClick={() => setShowFolderSidebar(!showFolderSidebar)}
            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              showFolderSidebar
                ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle Folder Tree Sidebar"
          >
            <FolderTree className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Folders</span>
          </button>

          {/* Templates Tab */}
          <button
            onClick={() => setActiveTab(activeTab === 'templates' ? 'outbox' : 'templates')}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              activeTab === 'templates'
                ? 'bg-purple-600 text-white border-purple-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Templates ({templates.length})
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

          {/* Compose Button */}
          <button
            onClick={() => handleOpenCompose()}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Compose Official Letter</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Compose New Letter
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
            {selectedLetter ? (
              <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950 p-4 sm:p-6">
                {/* Control Action Toolbar */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 mb-6 shadow-xl">
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
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
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

                    {selectedLetter.status === 'Draft' && (
                      <button
                        onClick={() => approveLetter(selectedLetter.id, 'Eng. K. P. Perera (Director Operations)')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Approve & Seal
                      </button>
                    )}

                    <button
                      onClick={() => handleDownloadPdf(selectedLetter)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Official PDF
                    </button>

                    <button
                      onClick={() =>
                        setDeleteTarget({
                          id: selectedLetter.id,
                          title: `${selectedLetter.letterNumber}: ${selectedLetter.subject}`
                        })
                      }
                      className="p-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold transition-colors"
                      title="Delete Letter (Admin Security Key Required)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Consultant-Grade Letterhead Sheet Simulation */}
                <div className="max-w-4xl mx-auto w-full bg-white text-slate-900 rounded-lg shadow-2xl p-8 sm:p-10 border border-slate-200">
                  {/* Letterhead Top Banner */}
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

                  {/* Date & Metadata */}
                  <div className="flex justify-between items-start text-xs text-slate-700 mb-6">
                    <div>
                      <div className="font-bold text-slate-900">TO:</div>
                      <div className="font-bold text-sm text-slate-900">{selectedLetter.recipientOrganization}</div>
                      {selectedLetter.attention && (
                        <div className="italic text-slate-600">Attn: {selectedLetter.attention}</div>
                      )}
                      <div className="text-slate-500 max-w-sm whitespace-pre-line mt-1">
                        {selectedLetter.recipientAddress}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div>
                        <span className="font-bold text-slate-900">Date:</span> {selectedLetter.date}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">Our Ref:</span>{' '}
                        <span className="font-mono font-bold text-purple-700">
                          {selectedLetter.ourReference || selectedLetter.letterNumber}
                        </span>
                      </div>
                      {(selectedLetter.projectName || selectedLetter.projectCode || selectedLetter.projectAffix) && (
                        <div className="text-[11px] text-emerald-700 font-semibold">
                          Project: [{selectedLetter.projectAffix || selectedLetter.projectCode || 'GEN'}]{' '}
                          {selectedLetter.projectName || ''}
                        </div>
                      )}
                      {selectedLetter.theirReference && (
                        <div>
                          <span className="font-bold text-slate-900">Your Ref:</span> {selectedLetter.theirReference}
                        </div>
                      )}
                      <div className="text-[10px] uppercase font-bold text-slate-500">
                        Category: {selectedLetter.category}
                      </div>
                    </div>
                  </div>

                  {/* Subject Line Bar */}
                  <div className="bg-slate-100 border border-slate-300 p-2.5 rounded text-xs font-bold text-slate-900 uppercase tracking-wide mb-6">
                    SUBJECT: {selectedLetter.subject}
                  </div>

                  {/* Letter Body */}
                  <div
                    className="text-sm leading-relaxed text-slate-800 space-y-4 font-serif min-h-[260px]"
                    dangerouslySetInnerHTML={{ __html: selectedLetter.bodyHtml }}
                  />

                  {/* Sign-off & Seal */}
                  <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-end">
                    <div className="text-xs text-slate-700 space-y-1">
                      <div>Yours faithfully,</div>
                      <div className="font-bold text-slate-900 uppercase text-sm">
                        {profile.legalName || currentEnterprise?.name}
                      </div>
                      <div className="h-12 flex items-center">
                        {selectedLetter.status === 'Approved' ? (
                          <div className="px-3 py-1 bg-emerald-50 border border-emerald-300 rounded text-[11px] font-mono text-emerald-800 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            OFFICIALLY SIGNED & SEALED
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">[Pending Board Signature]</span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900">
                        {selectedLetter.approvedBy || selectedLetter.preparedBy}
                      </div>
                      <div className="text-slate-500 text-[11px]">Authorized Signatory</div>
                    </div>

                    <div className="text-right text-[10px] text-slate-400">
                      <div>Ref: {selectedLetter.letterNumber}</div>
                      <div>EMA Project & Client Registry</div>
                    </div>
                  </div>
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

        {/* VIEW 2: STANDARD TEMPLATES REPOSITORY */}
        {activeTab === 'templates' && (
          <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Standard Corporate & Contractual Templates</h3>
                <p className="text-xs text-slate-400">
                  Pre-approved templates for Claims, Submissions, Banking Facilities, and Site Transmittals
                </p>
              </div>
              <button
                onClick={() => handleOpenCompose()}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
              >
                <Plus className="w-4 h-4" /> Custom Letter
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(tpl => (
                <div
                  key={tpl.id}
                  className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 hover:border-purple-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-semibold border border-purple-500/20 uppercase tracking-wider">
                      {tpl.category}
                    </span>
                    <h4 className="text-base font-bold text-slate-100 mt-3">{tpl.name}</h4>
                    <p className="text-xs font-semibold text-emerald-400 mt-1">
                      {tpl.subjectTemplate || tpl.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 italic">{tpl.description}</p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-700/40 flex justify-end">
                    <button
                      onClick={() => {
                        handleOpenCompose();
                        setActiveTab('outbox');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" /> Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: COMPOSE CORRESPONDENCE UNDER PROJECT AND CLIENT BASIS */}
      {isComposeModalOpen && (
        <CorrespondenceComposeModal
          isOpen={isComposeModalOpen}
          onClose={() => setIsComposeModalOpen(false)}
          initialClientAffix={composeModalParams.clientAffix}
          initialClientName={composeModalParams.clientName}
          initialProjectAffix={composeModalParams.projectAffix}
          initialProjectCode={composeModalParams.projectCode}
          initialProjectName={composeModalParams.projectName}
          onLetterCreated={createdLetter => {
            setSelectedLetter(createdLetter);
            setActiveTab('outbox');
          }}
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
    </div>
  );
};
