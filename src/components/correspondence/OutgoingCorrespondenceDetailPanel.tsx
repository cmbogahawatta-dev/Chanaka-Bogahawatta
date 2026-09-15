import React, { useState, useRef } from 'react';
import {
  Send,
  Calendar,
  Briefcase,
  Building2,
  FileText,
  ArrowDownLeft,
  ArrowRight,
  CheckCircle2,
  User,
  Clock,
  Copy,
  Check,
  GitBranch,
  Paperclip,
  Trash2,
  Hash,
  ExternalLink,
  Tag,
  ShieldCheck,
  UploadCloud,
  Download,
  Eye,
  FileCheck,
  Plus
} from 'lucide-react';
import { Letter, CorrespondenceAttachment } from '../../types/correspondenceTypes';
import { useEnterpriseCorrespondence } from '../../context/EnterpriseCorrespondenceContext';

interface OutgoingCorrespondenceDetailPanelProps {
  letter: Letter;
  relatedIncomingLetter?: Letter | null;
  onSelectIncomingLetter: (incoming: Letter) => void;
  onOpenThread?: (letter: Letter) => void;
  onOpenActionTracker?: (letter: Letter) => void;
  onAttachDocs?: (letter: Letter) => void;
  onDelete?: (letter: Letter) => void;
}

export const OutgoingCorrespondenceDetailPanel: React.FC<OutgoingCorrespondenceDetailPanelProps> = ({
  letter,
  relatedIncomingLetter,
  onSelectIncomingLetter,
  onOpenThread,
  onOpenActionTracker,
  onAttachDocs,
  onDelete
}) => {
  const [copiedRef, setCopiedRef] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addAttachmentToLetter, removeAttachmentFromLetter } = useEnterpriseCorrespondence();

  const formatDisplayDate = (dStr?: string) => {
    if (!dStr) return '—';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
    } catch {
      return dStr;
    }
  };

  const formatDisplayDateTime = (dtStr?: string) => {
    if (!dtStr) return '—';
    try {
      const d = new Date(dtStr);
      if (isNaN(d.getTime())) return dtStr;
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day}-${months[d.getMonth()]}-${d.getFullYear()} ${hours}:${mins}`;
    } catch {
      return dtStr;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleCopy = () => {
    const textToCopy = letter.letterNumber || letter.ourReference;
    if (navigator.clipboard && textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handleDownloadAttachment = (att: CorrespondenceAttachment) => {
    if (att.dataUrl) {
      const link = document.createElement('a');
      link.href = att.dataUrl;
      link.download = att.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`Document: ${att.name}\n(Physical or simulated file reference)`);
    }
  };

  const handleOpenAttachment = (att: CorrespondenceAttachment) => {
    if (att.dataUrl) {
      const newWin = window.open();
      if (newWin) {
        newWin.document.write(
          `<iframe src="${att.dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
        );
      } else {
        handleDownloadAttachment(att);
      }
    } else {
      handleDownloadAttachment(att);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      addAttachmentToLetter(letter.id, {
        letterId: letter.id,
        name: file.name,
        size: file.size,
        fileType: file.type || 'application/pdf',
        uploadedBy: 'Corporate Officer',
        category: file.name.toLowerCase().includes('sign') ? 'SIGNED_SCAN' : 'FINAL_DOCUMENT',
        description: 'Uploaded outgoing letter document',
        dataUrl
      });
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      {/* Top Banner Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  OUTGOING CORRESPONDENCE
                </span>
                <span className="text-[11px] font-semibold text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                  {letter.status || 'Issued'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 font-mono tracking-tight mt-1">
                {letter.letterNumber || letter.ourReference}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
              title="Copy Reference"
            >
              {copiedRef ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Ref</span>
                </>
              )}
            </button>

            {onOpenThread && (
              <button
                type="button"
                onClick={() => onOpenThread(letter)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold transition-colors"
                title="View Thread"
              >
                <GitBranch className="w-3.5 h-3.5 text-purple-400" />
                <span>Thread</span>
              </button>
            )}

            {onOpenActionTracker && (
              <button
                type="button"
                onClick={() => onOpenActionTracker(letter)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors"
                title="Action Items"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Actions</span>
              </button>
            )}

            {onAttachDocs && (
              <button
                type="button"
                onClick={() => onAttachDocs(letter)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                title="Manage Attachments"
              >
                <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                <span>Docs</span>
                {(letter.attachments?.length || 0) > 0 && (
                  <span className="ml-0.5 bg-blue-500/20 text-blue-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {letter.attachments?.length}
                  </span>
                )}
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(letter)}
                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs transition-colors"
                title="Delete Record (Admin)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Structured Correspondence Registry Data Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8 pt-5">
          {/* Reference */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Reference
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-sm font-mono font-bold text-emerald-400 bg-slate-950/60 border border-slate-800 px-3 py-2 rounded-lg inline-block">
                {letter.letterNumber || letter.ourReference}
              </div>
              {letter.clientAffix && letter.receiverInitials && (
                <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-950/40 px-2 py-1 rounded border border-slate-800">
                  <span className="text-slate-300 font-bold">EMA</span>
                  <span>/</span>
                  <span className="text-amber-300 font-bold">{letter.clientAffix}</span>
                  <span>/</span>
                  <span className="text-emerald-300 font-bold">{letter.projectAffix || letter.projectCode || 'GEN'}</span>
                  <span>/</span>
                  <span className="text-cyan-300 font-bold">{letter.receiverInitials}</span>
                  <span>/</span>
                  <span className="text-indigo-300 font-bold">{String(letter.sequenceNumber || 1).padStart(3, '0')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Date
            </span>
            <div className="text-sm text-slate-200 font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              {formatDisplayDate(letter.date)}
            </div>
          </div>

          {/* Project */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Project
            </span>
            <div className="text-sm text-slate-100 font-semibold flex items-start gap-2">
              <Briefcase className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-mono text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded mr-1.5 text-xs">
                  {letter.projectCode || letter.projectAffix || 'PIDM26'}
                </span>
                <span>{letter.projectName || 'General Project'}</span>
              </div>
            </div>
          </div>

          {/* Recipient / Client / Bank / Authority */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {letter.recipientType === 'BANK'
                  ? 'Bank / Financial Entity'
                  : letter.recipientType === 'AUTHORITY'
                  ? 'Statutory Authority'
                  : 'Client / Employer'}
              </span>
              {letter.recipientType && (
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 border border-amber-500/30">
                  {letter.recipientType}
                </span>
              )}
            </div>
            <div className="text-sm text-slate-100 font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{letter.clientName || letter.recipientOrganization || 'Recipient Organization'}</span>
              {letter.clientAffix && (
                <span className="font-mono text-amber-300 bg-amber-500/10 text-xs px-1.5 py-0.5 rounded border border-amber-500/20">
                  {letter.clientAffix}
                </span>
              )}
            </div>
          </div>

          {/* Receiver Direction / Designation */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Receiver Direction / Designation
            </span>
            <div className="text-sm text-slate-100 font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{letter.receiverDesignation || letter.attention || 'Direct Attention'}</span>
              {letter.receiverInitials && (
                <span className="font-mono text-cyan-300 bg-cyan-500/10 text-xs px-1.5 py-0.5 rounded border border-cyan-500/20">
                  {letter.receiverInitials}
                </span>
              )}
            </div>
          </div>

          {/* Subject (Full Width) */}
          <div className="md:col-span-2 space-y-1 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Subject
            </span>
            <p className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed">
              {letter.subject}
            </p>
          </div>

          {/* Outgoing Letter Document & Attachments */}
          <div className="md:col-span-2 space-y-3 bg-slate-950/40 p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Outgoing Letter Document & Attachments
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {letter.attachments?.length || 0} file{letter.attachments?.length === 1 ? '' : 's'}
                </span>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isUploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </div>

            {letter.attachments && letter.attachments.length > 0 ? (
              <div className="space-y-2 pt-1">
                {letter.attachments.map((att, idx) => (
                  <div
                    key={att.id || idx}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs sm:text-sm font-semibold text-slate-200 truncate max-w-xs sm:max-w-md">
                            {att.name}
                          </p>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                            {formatFileSize(att.size)}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {att.category || 'FINAL_DOCUMENT'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Uploaded {formatDisplayDateTime(att.uploadedAt)} • by {att.uploadedBy || 'Corporate Officer'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {att.dataUrl && (
                        <button
                          type="button"
                          onClick={() => handleOpenAttachment(att)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          title="Preview document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDownloadAttachment(att)}
                        className="px-2.5 py-1 text-xs font-medium text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="Download document"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAttachmentFromLetter(letter.id, att.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Remove attachment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-xl border border-dashed border-slate-800 hover:border-emerald-500/40 bg-slate-900/40 hover:bg-slate-900/80 text-center cursor-pointer transition-colors group"
              >
                <div className="flex flex-col items-center justify-center space-y-1">
                  <UploadCloud className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  <p className="text-xs text-slate-300">
                    No document attached to this outgoing reference yet.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Click to attach the finalized PDF, Word document, or signed scan.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Related Incoming (Section 12 & 13) */}
          <div className="md:col-span-2 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Related Incoming
            </span>
            {relatedIncomingLetter ? (
              <div
                onClick={() => onSelectIncomingLetter(relatedIncomingLetter)}
                className="p-4 rounded-xl bg-blue-950/40 hover:bg-blue-900/40 border border-blue-500/40 hover:border-blue-400 transition-all cursor-pointer group flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-300 group-hover:text-blue-200 flex items-center gap-1.5">
                      <ArrowDownLeft className="w-3.5 h-3.5 text-blue-400" />
                      {relatedIncomingLetter.letterNumber || relatedIncomingLetter.theirReference || 'Incoming Record'}
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Linked Reply
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium group-hover:text-white line-clamp-1">
                    {relatedIncomingLetter.subject}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    From: {relatedIncomingLetter.senderOrganization || relatedIncomingLetter.clientName} • Date: {formatDisplayDate(relatedIncomingLetter.date || relatedIncomingLetter.receivedDate)}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-blue-400 group-hover:text-blue-300 group-hover:translate-x-1 transition-transform">
                  <span>View Incoming</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic bg-slate-950/30 border border-slate-800/80 px-3.5 py-2.5 rounded-lg">
                No related incoming correspondence linked to this dispatch.
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Status
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                {letter.status || 'Issued'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Seq #{letter.sequenceNumber || 1}
              </span>
            </div>
          </div>

          {/* Logged By */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Logged By
            </span>
            <div className="text-sm text-slate-200 font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span>{letter.preparedBy || 'Corporate Officer'}</span>
            </div>
          </div>

          {/* Created Timestamp */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Created
            </span>
            <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatDisplayDateTime(letter.createdAt)}</span>
            </div>
          </div>

          {/* External Preparation Note */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Document Delivery
            </span>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>External letter logged in corporate dispatch registry.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
