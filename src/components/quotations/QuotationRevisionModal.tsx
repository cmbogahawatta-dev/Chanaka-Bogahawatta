import React, { useState } from 'react';
import { X, GitFork, AlertCircle, CheckCircle2, Edit3, Layers } from 'lucide-react';
import { Quotation } from '../../types/quotationTypes';
import { formatLkr } from '../../utils/vatCalculations';

interface QuotationRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
  onConfirmRevision: (reason: string, openEditor?: boolean) => void;
}

export const QuotationRevisionModal: React.FC<QuotationRevisionModalProps> = ({
  isOpen,
  onClose,
  quotation,
  onConfirmRevision
}) => {
  const [reason, setReason] = useState('');
  const [openEditorImmediately, setOpenEditorImmediately] = useState(true);

  if (!isOpen || !quotation) return null;

  const currentRevNum = quotation.revision?.revisionNumber || 0;
  const nextRevLabel = `Rev.${String(currentRevNum + 1).padStart(2, '0')}`;
  const isQuotation = quotation.documentType === 'QUOTATION';
  const docTypeLabel = isQuotation ? 'Quotation' : 'Estimate';

  const handleGenerate = (openEditor: boolean) => {
    if (!reason.trim()) {
      alert('Please state a reason for this revision.');
      return;
    }
    onConfirmRevision(reason.trim(), openEditor);
    setReason('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGenerate(openEditorImmediately);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Create Commercial Revision ({nextRevLabel})
              </h3>
              <p className="text-xs text-slate-400">
                Clone {quotation.quotationNumber} with upgraded revision tracking
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>Original Document:</span>
              <span className="font-mono text-slate-200 font-bold">{quotation.quotationNumber}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Current Revision:</span>
              <span className="font-mono text-purple-400 font-bold">{quotation.revision?.revisionLabel || 'Rev.00'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>New Target Revision:</span>
              <span className="font-mono text-emerald-400 font-bold">{nextRevLabel}</span>
            </div>
            <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1.5">
              <span>Client Target:</span>
              <span className="text-slate-200 font-medium">{quotation.clientName}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Items to Duplicate:</span>
              <span className="font-mono text-slate-300">
                {quotation.lineItems.length} items ({formatLkr(quotation.totalAmount)})
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
              Reason for Commercial Revision *
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Revised earthworks quantities following client site survey; updated unit rate discount."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 text-xs"
            />
          </div>

          {/* Active Edit Option Toggle */}
          <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/40 hover:border-purple-600/60 transition-colors">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={openEditorImmediately}
                onChange={e => setOpenEditorImmediately(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-purple-600 focus:ring-purple-500 w-4 h-4 bg-slate-900 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold text-slate-100 text-xs">
                    Open editor immediately after generating {nextRevLabel}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Active Edit
                  </span>
                </div>
                <p className="text-[11px] text-slate-300/80 mt-1 leading-normal">
                  Launches full line-item worksheet to adjust quantities, unit rates, scope of work, discount terms, and bank details for {nextRevLabel}.
                </p>
              </div>
            </label>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-[11px] leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-purple-400" />
            <span>
              The existing {docTypeLabel.toLowerCase()} document will remain safely preserved in history. A new draft copy will be initialized under <strong>{nextRevLabel}</strong>.
            </span>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 font-medium transition-colors text-xs"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleGenerate(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 flex items-center gap-1.5 transition-colors"
                title="Generate revision without opening editor"
              >
                <GitFork className="w-3.5 h-3.5 text-purple-400" />
                <span>Generate Only</span>
              </button>

              <button
                type="button"
                onClick={() => handleGenerate(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-950/50 flex items-center gap-2"
                title="Generate revision and launch editor immediately"
              >
                <Edit3 className="w-4 h-4 text-amber-300" />
                <span>Generate &amp; Edit {nextRevLabel}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
