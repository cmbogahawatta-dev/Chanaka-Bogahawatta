import React, { useState, useEffect } from 'react';
import { X, Receipt, ShoppingCart, Truck, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';
import { PayableBill } from '../../../types/receivablesPayablesTypes';
import { useReceivablesPayables } from '../../../context/ReceivablesPayablesContext';
import { formatLKR } from '../../../utils/helpers';

interface PayableBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  billToEdit?: PayableBill | null;
}

export const PayableBillModal: React.FC<PayableBillModalProps> = ({
  isOpen,
  onClose,
  billToEdit
}) => {
  const { addPayable, updatePayable } = useReceivablesPayables();

  const [supplier, setSupplier] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [grnNumber, setGrnNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [billDate, setBillDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paid, setPaid] = useState<number | ''>('');
  const [project, setProject] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(billToEdit);

  useEffect(() => {
    if (billToEdit) {
      setSupplier(billToEdit.supplier);
      setPoNumber(billToEdit.poNumber);
      setGrnNumber(billToEdit.grnNumber);
      setInvoiceNumber(billToEdit.invoiceNumber);
      setBillDate(billToEdit.billDate || '');
      setDueDate(billToEdit.dueDate);
      setAmount(billToEdit.amount);
      setPaid(billToEdit.paid);
      setProject(billToEdit.project || '');
      setNotes(billToEdit.notes || '');
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      const due = new Date();
      due.setDate(due.getDate() + 30);
      const dueStr = due.toISOString().split('T')[0];

      setSupplier('');
      setPoNumber(`PO-2026-${Math.floor(100 + Math.random() * 900)}`);
      setGrnNumber(`GRN-2026-${Math.floor(100 + Math.random() * 900)}`);
      setInvoiceNumber('');
      setBillDate(todayStr);
      setDueDate(dueStr);
      setAmount('');
      setPaid('');
      setProject('');
      setNotes('');
    }
    setError(null);
  }, [billToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier.trim()) {
      setError('Supplier name is required');
      return;
    }
    if (!poNumber.trim()) {
      setError('PO number is required');
      return;
    }
    if (!grnNumber.trim()) {
      setError('GRN number is required');
      return;
    }
    if (!invoiceNumber.trim()) {
      setError('Supplier Invoice / Bill number is required');
      return;
    }
    if (!dueDate) {
      setError('Due date is required');
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid bill amount');
      return;
    }

    const numPaid = Number(paid) || 0;
    if (numPaid > numAmount) {
      setError('Paid amount cannot exceed total bill amount');
      return;
    }

    if (isEditing && billToEdit) {
      updatePayable(billToEdit.id, {
        supplier: supplier.trim(),
        poNumber: poNumber.trim(),
        grnNumber: grnNumber.trim(),
        invoiceNumber: invoiceNumber.trim(),
        billDate,
        dueDate,
        amount: numAmount,
        paid: numPaid,
        project: project.trim() || undefined,
        notes: notes.trim() || undefined
      });
    } else {
      addPayable({
        supplier: supplier.trim(),
        poNumber: poNumber.trim(),
        grnNumber: grnNumber.trim(),
        invoiceNumber: invoiceNumber.trim(),
        billDate,
        dueDate,
        amount: numAmount,
        paid: numPaid,
        project: project.trim() || undefined,
        notes: notes.trim() || undefined
      });
    }

    onClose();
  };

  const calculatedOutstanding = Math.max(0, (Number(amount) || 0) - (Number(paid) || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditing ? 'Edit Accounts Payable Bill' : 'Create Accounts Payable Bill'}
              </h2>
              <p className="text-xs text-slate-400">
                Track supplier liability, linked PO &amp; GRN, and disbursement maturity
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Supplier / Vendor <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                placeholder="e.g. Tokyo Super Cement (Pvt) Ltd"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Supplier Invoice # <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                placeholder="e.g. TK-INV-8910"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Purchase Order (PO) # <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={e => setPoNumber(e.target.value)}
                placeholder="e.g. PO-2026-0038"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Goods Received Note (GRN) # <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={grnNumber}
                onChange={e => setGrnNumber(e.target.value)}
                placeholder="e.g. GRN-2026-0041"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Bill Date
              </label>
              <input
                type="date"
                value={billDate}
                onChange={e => setBillDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Payment Due Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Project / Site
              </label>
              <input
                type="text"
                value={project}
                onChange={e => setProject(e.target.value)}
                placeholder="e.g. PIDM 26"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Total Bill Amount (LKR) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Disbursed / Paid to Date (LKR)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={paid}
                onChange={e => setPaid(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Computed Outstanding Indicator */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Calculated Outstanding Payable:</span>
            <span className="text-sm font-bold font-mono text-rose-400">
              {formatLKR(calculatedOutstanding)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Material Description / Delivery Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. 700 bags Portland cement delivered to batching plant..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
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
              <span>{isEditing ? 'Save Changes' : 'Create Payable Bill'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
