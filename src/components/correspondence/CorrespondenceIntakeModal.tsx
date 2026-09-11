import React, { useState } from 'react';
import {
  X,
  Inbox,
  Calendar,
  Building,
  FileText,
  Clock,
  AlertCircle,
  Paperclip,
  UploadCloud,
  CheckCircle2,
  Send,
  Link,
  Shield,
  UserCheck
} from 'lucide-react';
import {
  Letter,
  CorrespondenceDocumentType,
  ContractualCategory,
  StakeholderPartyType,
  LetterPriority,
  CorrespondenceAttachment
} from '../../types/correspondenceTypes';

interface CorrespondenceIntakeModalProps {
  onClose: () => void;
  onSaveIncoming: (letterData: Partial<Letter>, file?: File) => void;
  existingLetters: Letter[];
}

export const CorrespondenceIntakeModal: React.FC<CorrespondenceIntakeModalProps> = ({
  onClose,
  onSaveIncoming,
  existingLetters
}) => {
  const today = new Date().toISOString().split('T')[0];

  // Core Fields
  const [receivedDate, setReceivedDate] = useState(today);
  const [letterDate, setLetterDate] = useState(today);
  const [senderReference, setSenderReference] = useState('');
  const [senderOrganization, setSenderOrganization] = useState('');
  const [senderPerson, setSenderPerson] = useState('');
  const [partyType, setPartyType] = useState<StakeholderPartyType>('Client');
  const [documentType, setDocumentType] = useState<CorrespondenceDocumentType>('LETTER');
  const [contractualCategory, setContractualCategory] = useState<ContractualCategory>('Technical');
  
  // Project / Category
  const [category, setCategory] = useState<'Project' | 'Client' | 'Bank' | 'CGF' | 'CIDA' | 'Government'>('Project');
  const [projectId, setProjectId] = useState('PRJ-2026-001');
  const [projectAffix, setProjectAffix] = useState('PIDM26');
  const [projectName, setProjectName] = useState('Kadawatha - Mirigama Expressway Rehabilitation');
  
  const [subject, setSubject] = useState('');
  const [summaryHtml, setSummaryHtml] = useState('');
  const [priority, setPriority] = useState<LetterPriority>('Normal');
  const [confidentiality, setConfidentiality] = useState<'Normal' | 'Confidential' | 'Strictly Confidential'>('Normal');

  // Reply Tracking
  const [replyRequired, setReplyRequired] = useState(false);
  const [replyDueDate, setReplyDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  // Action Tracking
  const [actionRequired, setActionRequired] = useState(false);
  const [actionDesc, setActionDesc] = useState('');
  const [actionAssignee, setActionAssignee] = useState('');
  const [actionDueDate, setActionDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  // Related Link
  const [replyToLetterId, setReplyToLetterId] = useState('');

  // Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderOrganization.trim() || !subject.trim()) return;

    // Generate internal reference for incoming
    const year = new Date().getFullYear();
    const seq = existingLetters.length + 1;
    const internalRef = `EMA/IN/${projectAffix || 'CORP'}/${year}/${String(seq).padStart(3, '0')}`;

    const newLetterData: Partial<Letter> = {
      direction: 'Incoming',
      letterNumber: internalRef,
      ourReference: internalRef,
      theirReference: senderReference.trim() || undefined,
      senderOrganization: senderOrganization.trim(),
      attention: senderPerson.trim() || undefined,
      recipientOrganization: 'Apex Global Logistics Corp (Contractor)',
      partyType,
      documentType,
      contractualCategory,
      category,
      projectId: category === 'Project' ? projectId : undefined,
      projectAffix: category === 'Project' ? projectAffix : undefined,
      projectName: category === 'Project' ? projectName : undefined,
      subject: subject.trim(),
      date: letterDate,
      receivedDate,
      priority,
      confidentiality,
      replyRequired,
      replyDueDate: replyRequired ? replyDueDate : undefined,
      replyStatus: replyRequired ? 'Pending' : undefined,
      replyToLetterId: replyToLetterId || undefined,
      parentCorrespondenceId: replyToLetterId || undefined,
      relatedCorrespondenceIds: replyToLetterId ? [replyToLetterId] : [],
      bodyHtml: summaryHtml.trim() ? `<p>${summaryHtml.replace(/\n/g, '<br/>')}</p>` : `<p>Official incoming correspondence logged from ${senderOrganization}.</p>`,
      status: 'Issued',
      isLocked: true,
      actionRequired,
      actionItems: actionRequired && actionDesc.trim() ? [
        {
          id: `act-${Date.now()}`,
          correspondenceId: '',
          action: actionDesc.trim(),
          responsiblePerson: actionAssignee.trim() || 'Site Team',
          dueDate: actionDueDate,
          priority: priority === 'Urgent' ? 'URGENT' : priority === 'High' ? 'HIGH' : 'NORMAL',
          status: 'OPEN',
          createdAt: new Date().toISOString()
        }
      ] : []
    };

    onSaveIncoming(newLetterData, selectedFile || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                Log Incoming Correspondence / Directive
              </h3>
              <p className="text-xs text-slate-400">
                Register incoming letters, site instructions, employer notices, and CIDA/Bank letters.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Row 1: Dates & References */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Date Received *
              </label>
              <input
                type="date"
                required
                value={receivedDate}
                onChange={e => setReceivedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Letter / Notice Date *
              </label>
              <input
                type="date"
                required
                value={letterDate}
                onChange={e => setLetterDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Sender's Reference No.
              </label>
              <input
                type="text"
                placeholder="e.g. RDA/PD/CEP/450"
                value={senderReference}
                onChange={e => setSenderReference(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Row 2: Sender Info & Party Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Sender Organization *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Road Development Authority (RDA) / CECB Consultant"
                value={senderOrganization}
                onChange={e => setSenderOrganization(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Party / Stakeholder Type
              </label>
              <select
                value={partyType}
                onChange={e => setPartyType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="Client">Client / Employer</option>
                <option value="Engineer">Engineer / Consultant</option>
                <option value="Consultant">Sub-Consultant</option>
                <option value="Contractor">Joint Venture Partner</option>
                <option value="Subcontractor">Subcontractor</option>
                <option value="RDA">RDA (Road Dev Authority)</option>
                <option value="Bank">Bank / Financial Institution</option>
                <option value="CGF">CGF (Credit Guarantee)</option>
                <option value="CIDA">CIDA / Regulatory</option>
                <option value="Government">Government / Ministry</option>
                <option value="Other">Other Stakeholder</option>
              </select>
            </div>
          </div>

          {/* Row 3: Document Type & Contractual Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Document Type
              </label>
              <select
                value={documentType}
                onChange={e => setDocumentType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="LETTER">Official Letter</option>
                <option value="INSTRUCTION">Site Instruction / Engineer Instruction</option>
                <option value="NOTICE">Contractual Notice / Clause 20.1</option>
                <option value="SUBMISSION">Material / Work Submission</option>
                <option value="RESPONSE">Official Response / Clarification</option>
                <option value="CLAIM">Contractor Claim / Dispute</option>
                <option value="EOT">Extension of Time (EOT)</option>
                <option value="VARIATION">Variation Order (VO)</option>
                <option value="PAYMENT_CERTIFICATE">Payment / Interim Certificate</option>
                <option value="MINUTES">Meeting Minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contractual Category
              </label>
              <select
                value={contractualCategory}
                onChange={e => setContractualCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="Technical">Technical / Method Statement</option>
                <option value="EOT">EOT (Extension of Time)</option>
                <option value="Variation">Variation / Star Rate</option>
                <option value="Payment">Payment / IPC / Invoicing</option>
                <option value="Commercial">Commercial / Bonds / LC</option>
                <option value="QA/QC">QA / QC / Inspection Logs</option>
                <option value="Safety">HSE / Safety Directive</option>
                <option value="General">General Administrative</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Project Association
              </label>
              <select
                value={projectId}
                onChange={e => {
                  const id = e.target.value;
                  setProjectId(id);
                  if (id === 'PRJ-2026-001') {
                    setProjectAffix('PIDM26');
                    setProjectName('Kadawatha - Mirigama Expressway Rehabilitation');
                  } else if (id === 'PRJ-2026-003') {
                    setProjectAffix('CWP01');
                    setProjectName('Central Water Treatment & Bulk Supply Piping');
                  } else {
                    setProjectAffix('CORP');
                    setProjectName('General Corporate / Head Office');
                  }
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="PRJ-2026-001">PIDM26 - Kadawatha Expressway</option>
                <option value="PRJ-2026-003">CWP01 - Central Water Supply</option>
                <option value="GEN-CORP">General Corporate / Head Office</option>
              </select>
            </div>
          </div>

          {/* Row 4: Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Subject Line *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Engineer Instruction EI-14: Relocation of Utility Culvert at CH 15+400"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Row 5: Priority & Confidentiality */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent (Immediate Contractual Deadline)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confidentiality
              </label>
              <select
                value={confidentiality}
                onChange={e => setConfidentiality(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="Normal">Normal</option>
                <option value="Confidential">Confidential</option>
                <option value="Strictly Confidential">Strictly Confidential</option>
              </select>
            </div>
          </div>

          {/* Row 6: Link to Existing Correspondence (Reply Chain) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-indigo-400" />
              In Response To / Related Letter (Optional)
            </label>
            <select
              value={replyToLetterId}
              onChange={e => setReplyToLetterId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="">-- Standalone (Not responding to an existing letter) --</option>
              {existingLetters.map(l => (
                <option key={l.id} value={l.id}>
                  [{l.direction}] {l.letterNumber} - {l.subject.substring(0, 50)}...
                </option>
              ))}
            </select>
          </div>

          {/* Row 7: Action Item Assignment */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={actionRequired}
                  onChange={e => setActionRequired(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                />
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  Requires Internal Site Action / Directive Follow-up
                </span>
              </label>
            </div>

            {actionRequired && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Action Description *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Conduct Joint Dip Survey"
                    value={actionDesc}
                    onChange={e => setActionDesc(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Responsible Assignee *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Eng. K. Samarasinghe"
                    value={actionAssignee}
                    onChange={e => setActionAssignee(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Action Due Date *
                  </label>
                  <input
                    type="date"
                    value={actionDueDate}
                    onChange={e => setActionDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Row 8: Reply Required Toggle */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={replyRequired}
                  onChange={e => setReplyRequired(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-700"
                />
                <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-blue-400" />
                  Contractor Response / Reply Required by Employer/Engineer
                </span>
              </label>
            </div>

            {replyRequired && (
              <div className="pt-2 max-w-xs">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Contractual Reply Due Date *
                </label>
                <input
                  type="date"
                  value={replyDueDate}
                  onChange={e => setReplyDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100"
                />
              </div>
            )}
          </div>

          {/* Row 9: Content Summary */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Letter Summary / Key Directives
            </label>
            <textarea
              rows={3}
              placeholder="Brief summary of the instructions, conditions, or requests contained in the received letter..."
              value={summaryHtml}
              onChange={e => setSummaryHtml(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Row 10: File Scan Attachment */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Paperclip className="w-3.5 h-3.5 text-slate-400" />
              Attach Scanned Document / PDF / Word File
            </label>
            <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/40 text-center hover:border-blue-500/50 transition-colors">
              <input
                type="file"
                id="file-incoming-upload"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
                className="hidden"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              />
              <label
                htmlFor="file-incoming-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <UploadCloud className="w-7 h-7 text-blue-400" />
                <span className="text-xs text-slate-300 font-medium">
                  {selectedFile ? (
                    <strong className="text-blue-400">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)</strong>
                  ) : (
                    'Click to upload scanned incoming copy (PDF, DOCX, or Image)'
                  )}
                </span>
                <span className="text-[11px] text-slate-500">
                  Files are saved as verified signed scans in document control
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Register Incoming Correspondence
          </button>
        </div>
      </div>
    </div>
  );
};
