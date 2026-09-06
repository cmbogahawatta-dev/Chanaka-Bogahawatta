import React, { useState } from 'react';
import { X, Ban, AlertTriangle, ShieldAlert } from 'lucide-react';
import { TaxInvoice } from '../../types/taxInvoiceTypes';
import { useTaxInvoice } from '../../context/TaxInvoiceContext';
import { useEnterprise } from '../../context/EnterpriseContext';

interface CancelInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: TaxInvoice | null;
}

export const CancelInvoiceModal: React.FC<CancelInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice
}) => {
  const { cancelInvoice } = useTaxInvoice();
  const { currentUser } = useEnterprise();

  const [reason, setReason] = useState('');
  const [confirmSerial, setConfirmSerial] = useState('');

  if (!isOpen || !invoice) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      alert('A statutory cancellation justification is required under Gazette Section 60.');
      return;
    }

    if (confirmSerial !== invoice.serialNumber) {
      alert(`Please type the exact serial number "${invoice.serialNumber}" to confirm cancellation.`);
      return;
    }

    cancelInvoice(invoice.id, reason, currentUser || 'Finance Officer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-rose-900/60 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-950 bg-rose-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-800 text-rose-300 flex items-center justify-center">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Cancel Official Tax Invoice</h2>
              <p className="text-xs text-rose-300">
                Gazette Extraordinary No. 2481/22 Statutory Cancellation Procedure
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleConfirm} className="p-6 space-y-4 text-xs text-slate-300">
          {/* Warning Banner */}
          <div className="p-3.5 bg-rose-950/30 rounded-xl border border-rose-900/60 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-rose-200">Statutory Serial Number Retention</h4>
              <p className="text-[11px] text-rose-300 leading-relaxed">
                Under Inland Revenue regulations, issued serial numbers are <strong>never deleted or reused</strong>.
                Serial <strong className="font-mono text-white">{invoice.serialNumber}</strong> will remain permanently logged in the audit register marked as CANCELLED.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Statutory Justification / Cancellation Reason *
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              required
              placeholder="e.g. Scope variation rejected by Supervising Engineer; revised invoice to be issued under subsequent certificate"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Type Serial Number <strong className="text-rose-400 font-mono">{invoice.serialNumber}</strong> to Confirm:
            </label>
            <input
              type="text"
              value={confirmSerial}
              onChange={e => setConfirmSerial(e.target.value)}
              required
              placeholder={invoice.serialNumber}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={confirmSerial !== invoice.serialNumber || !reason.trim()}
              className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold flex items-center gap-2 shadow"
            >
              <Ban className="w-4 h-4" />
              <span>Confirm Invoice Cancellation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
