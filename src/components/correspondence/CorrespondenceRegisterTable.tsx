import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Paperclip,
  GitBranch,
  Building,
  Send,
  Inbox,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  Layers,
  FileDown,
  Plus
} from 'lucide-react';
import {
  Letter,
  LetterStatus,
  LetterPriority,
  CorrespondenceDocumentType,
  ContractualCategory,
  StakeholderPartyType
} from '../../types/correspondenceTypes';

interface CorrespondenceRegisterTableProps {
  viewMode:
    | 'all'
    | 'incoming'
    | 'outgoing'
    | 'drafts'
    | 'pending_action'
    | 'pending_reply'
    | 'overdue';
  letters: Letter[];
  selectedLetterId: string | null;
  onSelectLetter: (letter: Letter) => void;
  onOpenIntakeModal: () => void;
  onOpenComposeModal: () => void;
  onOpenActionTracker: (letter: Letter) => void;
  onOpenThreadView: (letter: Letter) => void;
  onDownloadPdf: (letter: Letter) => void;
  onDownloadWord: (letter: Letter) => void;
}

export const CorrespondenceRegisterTable: React.FC<CorrespondenceRegisterTableProps> = ({
  viewMode,
  letters,
  selectedLetterId,
  onSelectLetter,
  onOpenIntakeModal,
  onOpenComposeModal,
  onOpenActionTracker,
  onOpenThreadView,
  onDownloadPdf,
  onDownloadWord
}) => {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [docTypeFilter, setDocTypeFilter] = useState('ALL');

  // Filter letters based on viewMode
  const modeFilteredLetters = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    return letters.filter(letter => {
      const isIncoming = letter.direction === 'Incoming' || letter.direction === 'INCOMING';
      const isOutgoing = letter.direction === 'Outgoing' || letter.direction === 'OUTGOING';

      if (viewMode === 'incoming') {
        return isIncoming;
      }
      if (viewMode === 'outgoing') {
        return isOutgoing && letter.status !== 'Draft';
      }
      if (viewMode === 'drafts') {
        return letter.status === 'Draft' || letter.status === 'DRAFT';
      }
      if (viewMode === 'pending_action') {
        const hasOpenAction =
          letter.actionItems &&
          letter.actionItems.some(a => a.status === 'OPEN' || a.status === 'IN_PROGRESS');
        return hasOpenAction || (letter.actionRequired && (!letter.actionItems || letter.actionItems.length === 0));
      }
      if (viewMode === 'pending_reply') {
        return (
          letter.replyRequired &&
          (letter.replyStatus === 'Pending' || letter.replyStatus === 'PENDING_REPLY' || !letter.replyStatus)
        );
      }
      if (viewMode === 'overdue') {
        const isReplyOverdue =
          letter.replyRequired &&
          letter.replyDueDate &&
          letter.replyDueDate < today &&
          letter.replyStatus !== 'Sent';
        const isActionOverdue =
          letter.actionItems &&
          letter.actionItems.some(
            a => (a.status === 'OPEN' || a.status === 'IN_PROGRESS') && a.dueDate < today
          );
        return isReplyOverdue || isActionOverdue || letter.replyStatus === 'Overdue';
      }

      // 'all'
      return true;
    });
  }, [letters, viewMode]);

  // Extract distinct projects
  const projectList = useMemo(() => {
    const set = new Set<string>();
    letters.forEach(l => {
      const p = l.projectCode || l.projectAffix || l.projectName;
      if (p) set.add(p);
    });
    return Array.from(set);
  }, [letters]);

  // Apply secondary filters and search
  const filteredList = useMemo(() => {
    return modeFilteredLetters.filter(letter => {
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesRef = letter.letterNumber.toLowerCase().includes(term);
        const matchesSubj = letter.subject.toLowerCase().includes(term);
        const matchesTheirRef = letter.theirReference && letter.theirReference.toLowerCase().includes(term);
        const matchesParty =
          (letter.senderOrganization && letter.senderOrganization.toLowerCase().includes(term)) ||
          (letter.recipientOrganization && letter.recipientOrganization.toLowerCase().includes(term));
        if (!matchesRef && !matchesSubj && !matchesTheirRef && !matchesParty) return false;
      }

      // Project filter
      if (projectFilter !== 'ALL') {
        const p = letter.projectCode || letter.projectAffix || letter.projectName;
        if (p !== projectFilter) return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL') {
        const cat = letter.contractualCategory || letter.category;
        if (cat !== categoryFilter) return false;
      }

      // Priority filter
      if (priorityFilter !== 'ALL') {
        if (letter.priority !== priorityFilter) return false;
      }

      // Doc Type filter
      if (docTypeFilter !== 'ALL') {
        if (letter.documentType !== docTypeFilter) return false;
      }

      return true;
    });
  }, [modeFilteredLetters, searchTerm, projectFilter, categoryFilter, priorityFilter, docTypeFilter]);

  // Titles per view mode
  const getHeaderInfo = () => {
    switch (viewMode) {
      case 'incoming':
        return {
          title: 'Incoming Correspondence Register',
          subtitle: 'Formal letters, instructions, site notices, and transmittals received from Employer, Engineer & Authorities',
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
        };
      case 'outgoing':
        return {
          title: 'Outgoing Correspondence Register',
          subtitle: 'Submissions, contractual claims, delay notices, and official contractor letters issued to stakeholders',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        };
      case 'drafts':
        return {
          title: 'Draft Correspondence & Pending Review',
          subtitle: 'Letters currently being authored, reviewed, or awaiting sign-off before official issuance',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        };
      case 'pending_action':
        return {
          title: 'Action Item & Directive Register',
          subtitle: 'Open technical directives, inspections, site responses, and tasks assigned to project managers',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
        };
      case 'pending_reply':
        return {
          title: 'Awaiting Response Register',
          subtitle: 'Submissions and contractual queries pending formal reply from Engineer or Employer',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
        };
      case 'overdue':
        return {
          title: 'Overdue Contractual Radar',
          subtitle: 'Lapsed reply deadlines and overdue action items requiring urgent management escalation',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
        };
      case 'all':
      default:
        return {
          title: 'Master Correspondence Register',
          subtitle: 'Central document control index for all incoming, outgoing, and internal correspondence',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden">
      {/* View Header Banner */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-100">{headerInfo.title}</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${headerInfo.badgeColor}`}>
              {filteredList.length} {filteredList.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{headerInfo.subtitle}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenIntakeModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all"
          >
            <ArrowDownLeft className="w-4 h-4 text-blue-400" />
            Log Incoming
          </button>
          <button
            onClick={onOpenComposeModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Outgoing Letter
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ref no, subject, employer, contractor, or their ref..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Projects</option>
            {projectList.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Contractual Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Categories</option>
            <option value="Technical">Technical</option>
            <option value="EOT">EOT (Extension of Time)</option>
            <option value="Variation">Variation</option>
            <option value="Payment">Payment</option>
            <option value="Commercial">Commercial</option>
            <option value="QA/QC">QA / QC</option>
            <option value="General">General</option>
          </select>

          {/* Document Type Filter */}
          <select
            value={docTypeFilter}
            onChange={e => setDocTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Document Types</option>
            <option value="LETTER">Letter</option>
            <option value="INSTRUCTION">Instruction</option>
            <option value="NOTICE">Notice</option>
            <option value="SUBMISSION">Submission</option>
            <option value="RESPONSE">Response</option>
            <option value="CLAIM">Claim</option>
            <option value="EOT">EOT</option>
            <option value="VARIATION">Variation</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Main Register Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs text-slate-300 border-collapse">
          <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 sticky top-0 z-10">
            <tr>
              <th className="py-3 px-3.5 whitespace-nowrap">Reference & Direction</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Date / Received</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Parties / Stakeholders</th>
              <th className="py-3 px-3.5 whitespace-nowrap min-w-[280px]">Subject & Scope</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Project</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Action Directive</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Reply Status</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Status</th>
              <th className="py-3 px-3.5 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500 text-xs">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  No correspondence records found matching the active criteria.
                </td>
              </tr>
            ) : (
              filteredList.map(letter => {
                const isSelected = letter.id === selectedLetterId;
                const isIncoming = letter.direction === 'Incoming' || letter.direction === 'INCOMING';
                const hasActions = letter.actionItems && letter.actionItems.length > 0;
                const openActions = hasActions
                  ? letter.actionItems!.filter(a => a.status === 'OPEN' || a.status === 'IN_PROGRESS')
                  : [];

                return (
                  <tr
                    key={letter.id}
                    onClick={() => onSelectLetter(letter)}
                    className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-950/30 font-medium' : ''
                    }`}
                  >
                    {/* 1. Reference & Direction */}
                    <td className="py-3 px-3.5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isIncoming ? 'bg-blue-400' : 'bg-emerald-400'
                            }`}
                          />
                          <span className="font-mono text-xs font-bold text-slate-100">
                            {letter.letterNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span
                            className={`px-1.5 py-0.2 rounded font-semibold ${
                              isIncoming
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {isIncoming ? 'INCOMING' : 'OUTGOING'}
                          </span>
                          {letter.documentType && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-purple-300 font-mono">
                              {letter.documentType}
                            </span>
                          )}
                        </div>
                        {letter.theirReference && (
                          <span className="font-mono text-[10px] text-slate-500 truncate">
                            Ext: {letter.theirReference}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Date / Received */}
                    <td className="py-3 px-3.5 whitespace-nowrap font-mono text-xs">
                      <div>{letter.date}</div>
                      {letter.receivedDate && (
                        <div className="text-[10px] text-blue-400">
                          Rec: {letter.receivedDate}
                        </div>
                      )}
                      {letter.replyDueDate && (
                        <div className="text-[10px] text-amber-400 font-medium">
                          Due: {letter.replyDueDate}
                        </div>
                      )}
                    </td>

                    {/* 3. Parties */}
                    <td className="py-3 px-3.5">
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="text-slate-200 font-medium truncate max-w-[180px]">
                          {isIncoming ? letter.senderOrganization : letter.recipientOrganization}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Building className="w-3 h-3" />
                          <span>{letter.partyType || letter.category}</span>
                          {letter.attention && <span>• {letter.attention}</span>}
                        </div>
                      </div>
                    </td>

                    {/* 4. Subject */}
                    <td className="py-3 px-3.5">
                      <div className="max-w-[340px]">
                        <p className="text-xs font-semibold text-slate-100 line-clamp-2">
                          {letter.subject}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          {letter.contractualCategory && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                              {letter.contractualCategory}
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.2 rounded font-semibold ${
                              letter.priority === 'Urgent'
                                ? 'bg-rose-500/20 text-rose-300'
                                : letter.priority === 'High'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {letter.priority}
                          </span>
                          {letter.attachedDocumentIds && letter.attachedDocumentIds.length > 0 && (
                            <span className="flex items-center gap-0.5 text-slate-400">
                              <Paperclip className="w-3 h-3" />
                              {letter.attachedDocumentIds.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 5. Project */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                        {letter.projectCode || letter.projectAffix || 'General'}
                      </span>
                    </td>

                    {/* 6. Action Directives */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {hasActions ? (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onOpenActionTracker(letter);
                          }}
                          className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 border transition-all ${
                            openActions.length > 0
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {openActions.length > 0
                            ? `${openActions.length} Pending Task${openActions.length > 1 ? 's' : ''}`
                            : 'All Completed'}
                        </button>
                      ) : letter.actionRequired ? (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onOpenActionTracker(letter);
                          }}
                          className="px-2 py-1 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3" />
                          Action Required
                        </button>
                      ) : (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onOpenActionTracker(letter);
                          }}
                          className="text-[11px] text-slate-500 hover:text-indigo-400"
                        >
                          + Assign Task
                        </button>
                      )}
                    </td>

                    {/* 7. Reply Status */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {letter.replyRequired ? (
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            letter.replyStatus === 'Sent'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : letter.replyStatus === 'Overdue'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {letter.replyStatus || 'Pending Reply'}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">—</span>
                      )}
                    </td>

                    {/* 8. Status */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          letter.status === 'Issued'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : letter.status === 'Approved'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : letter.status === 'Draft'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {letter.status}
                      </span>
                    </td>

                    {/* 9. Action Buttons */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onOpenThreadView(letter);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-indigo-400 transition-colors"
                          title="View Contractual Thread"
                        >
                          <GitBranch className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onDownloadPdf(letter);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onDownloadWord(letter);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400 transition-colors"
                          title="Download Word Document (.docx)"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
