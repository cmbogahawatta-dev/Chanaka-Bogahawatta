import React, { useState } from 'react';
import { X, CreditCard, CheckCircle2, DollarSign, Receipt, AlertCircle, Landmark } from 'lucide-react';
import { TaxInvoice, ClientPaymentRecord } from '../../types/taxInvoiceTypes';
import { useTaxInvoice } from '../../context/TaxInvoiceContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { useEnterpriseBanking } from '../../context/EnterpriseBankingContext';
import { amountToWordsLKR } from '../../utils/taxInvoiceUtils';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: TaxInvoice | null;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice
}) => {
  const { recordClientPayment } = useTaxInvoice();
  const { currentUser } = useEnterprise();
  const { accounts } = useEnterpriseBanking();

  if (!isOpen || !invoice) return null;

  const today = new Date().toISOString().split('T')[0];

  const defaultBankLabel = invoice.settlementBankDetails
    ? `${invoice.settlementBankDetails.bankName} (${invoice.settlementBankDetails.accountNumber})`
    : accounts.length > 0
    ? `${accounts[0].bank} • ${accounts[0].branch} (${accounts[0].accountNumber})`
    : 'Commercial Bank of Ceylon (1000849201)';

  const [paymentDate, setPaymentDate] = useState(today);
  const [amountReceived, setAmountReceived] = useState<number>(invoice.balanceDue);
  const [paymentMethod, setPaymentMethod] = useState<ClientPaymentRecord['paymentMethod']>('Bank Transfer (RTGS)');
  const [paymentReference, setPaymentReference] = useState('');
  const [receiptNumber, setReceiptNumber] = useState(`RCP-${Date.now().toString().slice(-6)}`);
  const [bankAccount, setBankAccount] = useState(defaultBankLabel);
  const [notes, setNotes] = useState('');

  const remainingAfterPayment = Math.max(0, invoice.balanceDue - (Number(amountReceived) || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amountReceived || amountReceived <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    if (!paymentReference.trim()) {
      alert('Bank transfer reference, cheque number, or transaction ID is required.');
      return;
    }

    recordClientPayment({
      invoiceId: invoice.id,
      invoiceNumber: invoice.serialNumber,
      projectCode: invoice.projectCode,
      clientName: invoice.purchaserName,
      paymentDate,
      amountReceived: Number(amountReceived),
      paymentMethod,
      paymentReference,
      receiptNumber,
      bankAccount,
      notes,
      recordedBy: currentUser || 'Finance Cashier'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Record Client Payment</h2>
              <p className="text-xs text-slate-400">
                Invoice: <span className="font-mono text-cyan-300 font-bold">{invoice.serialNumber}</span> • {invoice.purchaserName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-300">
          {/* Outstanding Summary */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-slate-500 block text-[10px]">Total Invoiced</span>
              <strong className="font-mono text-white text-xs">
                LKR {invoice.totalConsideration.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Already Paid</span>
              <strong className="font-mono text-emerald-400 text-xs">
                LKR {invoice.amountReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Current Balance Due</span>
              <strong className="font-mono text-amber-400 text-xs">
                LKR {invoice.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Payment Date *</label>
              <input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Receipt Number</label>
              <input
                type="text"
                value={receiptNumber}
                onChange={e => setReceiptNumber(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-400 font-semibold">Amount Received (LKR) *</label>
              <button
                type="button"
                onClick={() => setAmountReceived(invoice.balanceDue)}
                className="text-[10px] text-cyan-400 hover:underline"
              >
                Pay Full Balance
              </button>
            </div>
            <input
              type="number"
              step="0.01"
              value={amountReceived}
              onChange={e => setAmountReceived(Number(e.target.value))}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-emerald-300 font-mono font-bold text-sm focus:border-cyan-500 outline-none"
            />
            <span className="block text-[10px] text-slate-500 mt-0.5 italic">
              {amountToWordsLKR(Number(amountReceived) || 0)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:border-cyan-500 outline-none"
              >
                <option value="Bank Transfer (RTGS)">Bank Transfer (RTGS)</option>
                <option value="Bank Transfer (NEFT)">Bank Transfer (NEFT)</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
                <option value="Letter of Credit">Letter of Credit</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Transaction Ref / Cheque # *</label>
              <input
                type="text"
                value={paymentReference}
                onChange={e => setPaymentReference(e.target.value)}
                placeholder="e.g. BOC-RTGS-928120 or Chq 8812"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-cyan-400" />
                <span>Receiving Bank Account</span>
              </label>
              <span className="text-[10px] text-cyan-400">From Registered Accounts</span>
            </div>
            <select
              value={bankAccount}
              onChange={e => setBankAccount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-cyan-500"
            >
              {accounts.map(acc => {
                const label = `${acc.bank} • ${acc.branch} (${acc.accountNumber})`;
                return (
                  <option key={acc.id} value={label}>
                    {label} {acc.isPrimary ? '★ (Primary)' : ''}
                  </option>
                );
              })}
              {defaultBankLabel && !accounts.some(acc => `${acc.bank} • ${acc.branch} (${acc.accountNumber})` === defaultBankLabel) && (
                <option value={defaultBankLabel}>{defaultBankLabel} (Invoice Settlement Bank)</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Settlement Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Settlement of certified milestone IPC-04"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none"
            />
          </div>

          {/* Balance Preview */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Remaining Balance after this receipt:</span>
            <span className={`font-mono font-bold text-sm ${remainingAfterPayment === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              LKR {remainingAfterPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              {remainingAfterPayment === 0 && ' (Fully Settled)'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Record Receipt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
