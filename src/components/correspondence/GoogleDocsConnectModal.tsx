import React, { useState, useEffect } from 'react';
import {
  X,
  Globe,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FileText,
  Copy,
  Check,
  HelpCircle,
  Download
} from 'lucide-react';
import { Letter, LetterheadTemplate } from '../../types/correspondenceTypes';
import {
  isGoogleDocsConfigured,
  createGoogleDocumentFromLetter,
  getGoogleDocument,
  saveGoogleDocumentLink
} from '../../services/googleDocsService';

interface GoogleDocsConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  letter: Letter;
  profile?: any;
  letterhead?: LetterheadTemplate | null;
  onLinkUpdated: (docUrl: string, docId?: string) => void;
  onSyncContent: (newBodyHtml: string) => void;
}

export const GoogleDocsConnectModal: React.FC<GoogleDocsConnectModalProps> = ({
  isOpen,
  onClose,
  letter,
  profile,
  letterhead,
  onLinkUpdated,
  onSyncContent
}) => {
  const [docUrl, setDocUrl] = useState<string>(letter.googleDocumentUrl || '');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const isConfigured = isGoogleDocsConfigured();

  if (!isOpen) return null;

  const handleCreateDocument = async () => {
    setIsCreating(true);
    setStatusMsg(null);
    try {
      if (!isConfigured) {
        setStatusMsg({
          type: 'error',
          text: 'Google Docs integration is not configured. Google OAuth Client ID is not detected in environment variables.'
        });
        return;
      }

      const result = await createGoogleDocumentFromLetter(letter, profile, letterhead);
      setDocUrl(result.webViewLink);
      onLinkUpdated(result.webViewLink, result.documentId);
      setStatusMsg({
        type: 'success',
        text: 'Successfully generated official Google Document! Opening in new tab...'
      });
      window.open(result.webViewLink, '_blank');
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to create Google Document.'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveManualLink = () => {
    if (!docUrl.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid Google Docs URL.' });
      return;
    }
    onLinkUpdated(docUrl.trim());
    setStatusMsg({ type: 'success', text: 'Google Document link successfully saved to letter record.' });
    setTimeout(() => onClose(), 1200);
  };

  const handleSyncDocument = async () => {
    const docId = letter.googleDocumentId || (docUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1]);
    if (!docId) {
      setStatusMsg({ type: 'error', text: 'No valid Google Document ID detected to sync from.' });
      return;
    }

    setIsSyncing(true);
    setStatusMsg(null);
    try {
      if (!isConfigured) {
        setStatusMsg({
          type: 'error',
          text: 'Google Docs integration is not configured.'
        });
        return;
      }

      const doc = await getGoogleDocument(docId);
      if (!doc.bodyHtml || !doc.bodyHtml.trim()) {
        setStatusMsg({ type: 'error', text: 'Google Document returned empty text body.' });
        return;
      }

      onSyncContent(doc.bodyHtml);
      setStatusMsg({
        type: 'success',
        text: `Synchronized ${doc.bodyText.length} characters from Google Docs into application version control!`
      });
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to sync content from Google Docs.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyCleanText = () => {
    const plain = (letter.bodyHtml || '')
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .trim();
    navigator.clipboard.writeText(plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-blue-600/40 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-blue-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Google Docs Document Control
              </h2>
              <p className="text-xs text-blue-300/80">
                External collaborative editing & document synchronization
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

        <div className="p-6 space-y-4">
          {statusMsg && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                  : statusMsg.type === 'error'
                  ? 'bg-rose-950/70 border-rose-500/40 text-rose-300'
                  : 'bg-blue-950/70 border-blue-500/40 text-blue-300'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              )}
              <div className="leading-relaxed">{statusMsg.text}</div>
            </div>
          )}

          {!isConfigured && (
            <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-xl text-xs text-amber-200/90 space-y-2">
              <div className="font-semibold flex items-center gap-2 text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Google Docs integration is not configured.
              </div>
              <p className="leading-relaxed">
                To enable automatic one-click document creation and live syncing via Google Docs API, configure <code className="px-1 py-0.5 bg-slate-800 rounded text-purple-300">VITE_GOOGLE_CLIENT_ID</code>.
              </p>
              <p className="leading-relaxed text-slate-300">
                You can still paste an existing Google Docs share link below to associate it with this letter record, or use <strong>Microsoft Word (.docx)</strong> for complete local external editing!
              </p>
            </div>
          )}

          {/* Action 1: One-Click Create in Google Docs */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200">
                  Generate Google Document with Letterhead
                </h4>
                <p className="text-[11px] text-slate-400">
                  Compiles corporate letterhead, reference, subject, and justified body into Google Docs
                </p>
              </div>
              <button
                type="button"
                onClick={handleCreateDocument}
                disabled={isCreating}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-md shadow-blue-600/20"
              >
                <Globe className="w-4 h-4" />
                {isCreating ? 'Generating...' : 'Edit in Google Docs'}
              </button>
            </div>
          </div>

          {/* Action 2: Associated Google Docs URL & Sync */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
            <label className="block text-xs font-bold text-slate-200">
              Associated Google Document Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={docUrl}
                onChange={e => setDocUrl(e.target.value)}
                placeholder="https://docs.google.com/document/d/.../edit"
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveManualLink}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors shrink-0"
              >
                Save Link
              </button>
              {docUrl && (
                <a
                  href={docUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-blue-900/60 hover:bg-blue-800 text-blue-300 rounded-lg text-xs transition-colors shrink-0"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Sync from Google Docs */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
              <div className="text-[11px] text-slate-400">
                Pull latest content modifications into the letter version control
              </div>
              <button
                type="button"
                onClick={handleSyncDocument}
                disabled={isSyncing || !docUrl}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync from Google Docs'}
              </button>
            </div>
          </div>

          {/* Quick Copy Plain Text Option */}
          <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
            <span>Need draft text for manual pasting?</span>
            <button
              type="button"
              onClick={handleCopyCleanText}
              className="flex items-center gap-1.5 px-3 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied to Clipboard' : 'Copy Draft Text'}
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
