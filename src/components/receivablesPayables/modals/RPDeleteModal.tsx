import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { formatLKR } from '../../../utils/helpers';

interface RPDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: 'RECEIVABLE' | 'PAYABLE';
  title: string;
  code: string;
  partyName: string;
  amount: number;
  outstanding: number;
  referenceExtra?: string;
}

export const RPDeleteModal: React.FC<RPDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  title,
  code,
  partyName,
  amount,
  outstanding,
  referenceExtra
}) => {
  if (!isOpen) return null;

  const isReceivable = type === 'RECEIVABLE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Top Warning Banner */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-rose-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Confirm Deletion</h3>
              <p className="text-[11px] text-rose-300">
                {isReceivable ? 'Accounts Receivable Record' : 'Accounts Payable Record'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Are you sure you want to delete this {isReceivable ? 'receivable invoice' : 'payable bill'}? This action will permanently remove it and recalculate company cash balance positions.
          </p>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">{isReceivable ? 'Invoice #' : 'Supplier / Bill #'}</span>
              <span className="font-bold text-white font-mono">{code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{isReceivable ? 'Client' : 'Supplier'}</span>
              <span className="font-medium text-slate-200">{partyName}</span>
            </div>
            {referenceExtra && (
              <div className="flex justify-between">
                <span className="text-slate-400">Ref (PO / GRN / Project)</span>
                <span className="font-mono text-slate-300">{referenceExtra}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-800/80 pt-2">
              <span className="text-slate-400">Total Amount</span>
              <span className="font-mono text-slate-200">{formatLKR(amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Outstanding Balance</span>
              <span className={`font-mono font-bold ${isReceivable ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatLKR(outstanding)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-950/50 flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
