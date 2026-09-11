import React from 'react';
import {
  AlertTriangle,
  Trash2,
  X,
  FileText,
  ShieldCheck,
  Building,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Quotation } from '../../types/quotationTypes';
import { formatLkr } from '../../utils/vatCalculations';
import { formatQuotationDate } from '../../utils/quotationUtils';

interface DeleteQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
  onConfirmDelete: (quotationId: string) => void;
}

export const DeleteQuotationModal: React.FC<DeleteQuotationModalProps> = ({
  isOpen,
  onClose,
  quotation,
  onConfirmDelete
}) => {
  if (!isOpen || !quotation) return null;

  const isQuotation = quotation.documentType === 'QUOTATION';
  const docTypeLabel = isQuotation ? 'Quotation' : 'Estimate';

  const handleDelete = () => {
    onConfirmDelete(quotation.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-rose-500/30 rounded-2xl shadow-2xl shadow-rose-950/50 flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-rose-950/40 border-b border-rose-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-200">
                Delete Commercial {docTypeLabel}
              </h3>
              <p className="text-xs text-rose-300/80">
                Permanent record deletion confirmation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 leading-relaxed">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-rose-200 block mb-0.5">
                Are you sure you want to permanently delete this {docTypeLabel.toLowerCase()}?
              </strong>
              This action cannot be undone. The document reference and its line-item calculations will be removed from your active commercial register.
            </div>
          </div>

          {/* Quotation Details Card */}
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-sm font-bold text-slate-100">
                  {quotation.quotationNumber}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  {quotation.revision?.revisionLabel || 'Rev.00'}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-800 text-slate-300 border border-slate-700">
                {quotation.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-900">
              <div>
                <span className="text-slate-500 block">Client:</span>
                <span className="font-medium text-slate-200 truncate block">
                  {quotation.clientName}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Project:</span>
                <span className="font-medium text-purple-300 truncate block">
                  {quotation.projectCode || 'Unassigned'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Document Date:</span>
                <span className="font-mono text-slate-300">
                  {formatQuotationDate(quotation.quotationDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Consideration:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatLkr(quotation.totalAmount)}
                </span>
              </div>
            </div>

            {quotation.status === 'CONVERTED' && quotation.convertedInvoiceNumber && (
              <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-[11px] text-amber-300">
                ⚠️ <strong>Note:</strong> This quotation was converted to Tax Invoice{' '}
                <span className="font-mono font-bold text-amber-200">{quotation.convertedInvoiceNumber}</span>.
                Deleting this quotation will not delete the generated tax invoice.
              </div>
            )}
          </div>

          {/* Zero Expense Impact Assurance */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Expense Isolation Guarantee:</strong> Quotations are independent sales documents. No expenses, petty cash vouchers, or accounting registers will be altered.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 font-semibold transition-colors text-sm"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-all shadow-md shadow-rose-950/60 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Permanently Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
