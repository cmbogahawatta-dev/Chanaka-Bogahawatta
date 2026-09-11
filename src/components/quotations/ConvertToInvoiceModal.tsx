import React, { useState } from 'react';
import { X, ArrowRight, ShieldCheck, AlertTriangle, FileCheck, CheckCircle2, Building, DollarSign } from 'lucide-react';
import { Quotation } from '../../types/quotationTypes';

interface ConvertToInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
  onConfirmConvert: (quotationId: string) => void;
}

export const ConvertToInvoiceModal: React.FC<ConvertToInvoiceModalProps> = ({
  isOpen,
  onClose,
  quotation,
  onConfirmConvert
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !quotation) return null;

  const handleConvert = () => {
    setIsProcessing(true);
    try {
      onConfirmConvert(quotation.id);
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Convert to Tax Invoice
              </h3>
              <p className="text-xs text-slate-400">
                Transfer commercial quotation data into official Draft Tax Invoice
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

        <div className="p-6 space-y-4 text-xs">
          {/* Document Mapping Summary Card */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-cyan-400 font-bold">{quotation.quotationNumber}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                  {quotation.revision?.revisionLabel || 'Rev.00'}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <FileCheck className="w-4 h-4" />
                <span>New Draft Tax Invoice</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px]">
              <div>
                <span className="block text-slate-500">Purchaser / Client:</span>
                <span className="text-slate-200 font-semibold">{quotation.clientName}</span>
              </div>
              <div>
                <span className="block text-slate-500">Project Association:</span>
                <span className="text-slate-200 font-semibold">{quotation.projectCode || 'General'}</span>
              </div>
              <div>
                <span className="block text-slate-500">Line Items Transferred:</span>
                <span className="text-slate-200 font-semibold">{quotation.lineItems.length} Items</span>
              </div>
              <div>
                <span className="block text-slate-500">Total Invoice Value:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  LKR {quotation.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* CRITICAL COMPLIANCE NOTICE */}
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Strict Commercial Independence &amp; Expense Protection</span>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-200/90">
              Converting this document will generate a standalone Draft Tax Invoice with all line items, client snapshots, and VAT computations.
            </p>
            <p className="text-[11px] leading-relaxed text-emerald-200/80 border-t border-emerald-900/50 pt-1.5">
              <strong>Guaranteed:</strong> This action will <strong>NOT</strong> create, modify, or link to Expenses, Petty Cash expenditures, PRVs, Payment Vouchers, or Supplier Payment ledgers. The original Quotation record is preserved intact with status marked as <strong>CONVERTED</strong>.
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConvert}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-950/60 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm &amp; Generate Tax Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
