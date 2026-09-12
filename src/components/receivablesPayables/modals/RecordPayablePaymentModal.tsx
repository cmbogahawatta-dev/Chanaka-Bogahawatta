import React, { useState, useEffect } from 'react';
import { X, Receipt, Calendar, Landmark, CheckCircle2, AlertCircle } from 'lucide-react';
import { PayableBill } from '../../../types/receivablesPayablesTypes';
import { useReceivablesPayables } from '../../../context/ReceivablesPayablesContext';
import { formatLKR } from '../../../utils/helpers';

interface RecordPayablePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: PayableBill | null;
}

export const RecordPayablePaymentModal: React.FC<RecordPayablePaymentModalProps> = ({
  isOpen,
  onClose,
  bill
}) => {
  const { recordPayablePayment } = useReceivablesPayables();

  const [date, setDate] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE_SLIP' | 'CASH'>('BANK_TRANSFER');
  const [bankAccount, setBankAccount] = useState('BOC Commercial Main #8821039');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bill) {
      const todayStr = new Date().toISOString().split('T')[0];
      setDate(todayStr);
      setAmount(bill.outstanding > 0 ? bill.outstanding : '');
      setReferenceNumber(`PRV-2026-${Math.floor(100 + Math.random() * 900)}`);
      setNotes('');
      setError(null);
    }
  }, [bill, isOpen]);

  if (!isOpen || !bill) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid disbursement amount greater than zero');
      return;
    }
    if (numAmount > bill.outstanding) {
      setError(`Disbursement amount cannot exceed outstanding balance (${formatLKR(bill.outstanding)})`);
      return;
    }

    recordPayablePayment(bill.id, {
      date,
      amount: numAmount,
      referenceNumber: referenceNumber.trim() || undefined,
      paymentMethod,
      bankAccount: bankAccount.trim() || undefined,
      notes: notes.trim() || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Record Supplier Disbursement</h2>
              <p className="text-xs text-slate-400">
                Supplier: <span className="text-rose-400 font-semibold">{bill.supplier}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bill Summary Box */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Total Bill</div>
            <div className="text-xs font-bold font-mono text-white mt-0.5">{formatLKR(bill.amount)}</div>
          </div>
          <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Paid to Date</div>
            <div className="text-xs font-bold font-mono text-emerald-400 mt-0.5">{formatLKR(bill.paid)}</div>
          </div>
          <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Outstanding Due</div>
            <div className="text-xs font-bold font-mono text-rose-400 mt-0.5">{formatLKR(bill.outstanding)}</div>
          </div>
        </div>

        {/* References info */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>PO: <strong className="text-slate-300 font-mono">{bill.poNumber}</strong></span>
          <span>GRN: <strong className="text-slate-300 font-mono">{bill.grnNumber}</strong></span>
          <span>Inv: <strong className="text-slate-300 font-mono">{bill.invoiceNumber}</strong></span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Disbursement Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Disbursed Amount (LKR) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-rose-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Disbursement Mode <span className="text-rose-400">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="BANK_TRANSFER">Corporate Online Banking / CEFT</option>
                <option value="CHEQUE">Company Account Payee Cheque</option>
                <option value="ONLINE_SLIP">Bank Counter Voucher Slip</option>
                <option value="CASH">Direct Cash Voucher</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Voucher / PRV / Cheque #
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                placeholder="e.g. PRV-2026-0881 or CHQ-99120"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Disbursing Company Bank Account
            </label>
            <input
              type="text"
              value={bankAccount}
              onChange={e => setBankAccount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notes &amp; Settlement Remarks
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Cleared via BOC commercial portal, approved by finance"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-950/50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Disbursement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
