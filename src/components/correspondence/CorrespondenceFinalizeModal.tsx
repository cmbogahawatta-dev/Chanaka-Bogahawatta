import React, { useState } from 'react';
import {
  X,
  Lock,
  AlertTriangle,
  FileCheck,
  Building,
  Layers,
  Calendar,
  User,
  FileText,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Letter, LetterheadTemplate } from '../../types/correspondenceTypes';

interface CorrespondenceFinalizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  letter: Letter;
  letterhead?: LetterheadTemplate | null;
  onConfirmFinalize: (finalizedBy: string) => Promise<void>;
}

export const CorrespondenceFinalizeModal: React.FC<CorrespondenceFinalizeModalProps> = ({
  isOpen,
  onClose,
  letter,
  letterhead,
  onConfirmFinalize
}) => {
  const [officerName, setOfficerName] = useState<string>(letter.preparedBy || 'Document Controller');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerName.trim()) {
      setErrorMsg('Please specify the finalizing officer name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onConfirmFinalize(officerName.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to finalize letter.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-amber-600/40 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-amber-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Finalize Controlled Correspondence
              </h2>
              <p className="text-xs text-amber-300/80">
                Lock letter content & generate official final documents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFinalize} className="p-6 space-y-4">
          {/* Prominent Warning Callout */}
          <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200 leading-relaxed">
              <strong>Controlled Document Warning:</strong> Finalizing this letter will create the controlled final version and prevent further editing of the finalized content.
              A controlled final DOCX and official PDF will be archived automatically.
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-lg text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Letter Metadata Inspection Table */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs space-y-2.5">
            <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Letter Number:</span>
              <span className="text-purple-300 font-mono font-bold">{letter.letterNumber}</span>
            </div>

            <div className="flex items-start justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Subject:</span>
              <span className="text-slate-200 font-semibold max-w-xs text-right truncate">
                {letter.subject}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Current Version:</span>
              <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono font-bold">
                Version {letter.version}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Selected Letterhead:</span>
              <span className="text-emerald-400 font-medium">
                {letterhead?.name || letter.letterheadVariant || 'Default Corporate'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">External Document Source:</span>
              <span className="text-slate-300">
                {letter.googleDocumentUrl ? (
                  <span className="text-blue-400 flex items-center gap-1 font-medium">
                    Google Docs linked
                  </span>
                ) : letter.externalEditor === 'WORD' ? (
                  <span className="text-blue-400 font-medium">Microsoft Word (.docx)</span>
                ) : (
                  'Application Internal Editor'
                )}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400">Initiation Date:</span>
              <span className="text-slate-300 font-mono">{letter.date}</span>
            </div>
          </div>

          {/* Finalizing Officer Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Finalized By (Authorized Officer / Document Controller)
            </label>
            <input
              type="text"
              required
              value={officerName}
              onChange={e => setOfficerName(e.target.value)}
              placeholder="e.g. Eng. Samantha Perera / Document Controller"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-amber-600/20 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {isSubmitting ? 'Finalizing...' : 'Finalize Letter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
