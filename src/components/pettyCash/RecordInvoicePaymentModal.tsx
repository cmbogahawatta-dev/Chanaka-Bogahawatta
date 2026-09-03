import React, { useState } from 'react';
import {
  X,
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Hash,
  FileText
} from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';
import { Income } from '../../types/pettyCashTypes';
import { formatLkr, round2 } from '../../utils/vatCalculations';

interface RecordInvoicePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Income | null;
  onSuccess?: () => void;
}

export const RecordInvoicePaymentModal: React.FC<RecordInvoicePaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess
}) => {
  const { recordInvoicePayment } = usePettyCash();
  const todayIso = new Date().toISOString().split('T')[0];

  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(todayIso);
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen || !invoice) return null;

  const grossTotal = invoice.grossAmount ?? invoice.AMOUNT;
  const alreadyReceived = invoice.amountReceived ?? 0;
  const currentBalanceDue = invoice.balanceDue !== undefined ? invoice.balanceDue : Math.max(0, grossTotal - alreadyReceived);

  const numericPayment = parseFloat(paymentAmount.replace(/,/g, '')) || 0;
  const projectedBalanceDue = round2(Math.max(0, currentBalanceDue - numericPayment));

  const handlePayFull = () => {
    setPaymentAmount(currentBalanceDue.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (numericPayment <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }

    if (numericPayment > currentBalanceDue + 0.01) {
      setError(`Payment amount (${formatLkr(numericPayment)}) cannot exceed current balance due (${formatLkr(currentBalanceDue)}).`);
      return;
    }

    try {
      recordInvoicePayment(invoice.id, numericPayment, {
        paymentDate,
        paymentReference: paymentReference.trim() || undefined,
        notes: notes.trim() || undefined
      });
      setIsSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err?.message || 'Failed to record payment.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Record Invoice Payment</h2>
              <p className="text-[11px] text-slate-400">
                Invoice {invoice.invoiceNumber || invoice.INCOME_ID} • {invoice.PROJECT}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">Payment Recorded Successfully</h3>
            <p className="text-xs text-slate-400">
              {formatLkr(numericPayment)} recorded against {invoice.invoiceNumber || invoice.INCOME_ID}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Invoice Summary Card */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="text-[10px] text-slate-400">Gross Invoice</p>
                <p className="font-mono font-bold text-slate-200">{formatLkr(grossTotal)}</p>
              </div>
              <div>
                <p className="text-[10px] text-emerald-400">Received So Far</p>
                <p className="font-mono font-bold text-emerald-400">{formatLkr(alreadyReceived)}</p>
              </div>
              <div>
                <p className="text-[10px] text-amber-400 font-semibold">Balance Due</p>
                <p className="font-mono font-bold text-amber-400">{formatLkr(currentBalanceDue)}</p>
              </div>
            </div>

            {/* Payment Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">
                  Payment Amount to Record (LKR) *
                </label>
                <button
                  type="button"
                  onClick={handlePayFull}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold underline"
                >
                  Pay Full Balance ({formatLkr(currentBalanceDue)})
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400 font-mono">
                  LKR
                </span>
                <input
                  id="record-payment-amount-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={currentBalanceDue + 0.01}
                  required
                  placeholder={currentBalanceDue.toString()}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-14 pr-3 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {numericPayment > 0 && (
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between">
                <span className="text-slate-400">Projected Remaining Balance:</span>
                <span className={`font-mono font-bold ${projectedBalanceDue === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {projectedBalanceDue === 0 ? 'LKR 0.00 (Fully Paid)' : formatLkr(projectedBalanceDue)}
                </span>
              </div>
            )}

            {/* Payment Date & Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Payment Date *
                </label>
                <input
                  id="record-payment-date-input"
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Bank / Cheque / Slip Ref
                </label>
                <input
                  id="record-payment-ref-input"
                  type="text"
                  placeholder="e.g. BOC-49910 or Cheque #019"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Payment Remarks / Notes
              </label>
              <input
                id="record-payment-notes-input"
                type="text"
                placeholder="e.g. Received via direct client bank transfer to Commercial Bank"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-confirm-record-payment"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Update Balance</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
