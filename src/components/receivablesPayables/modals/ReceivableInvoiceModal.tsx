import React, { useState, useEffect } from 'react';
import { X, FileText, Building2, FolderKanban, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';
import { ReceivableInvoice } from '../../../types/receivablesPayablesTypes';
import { useReceivablesPayables } from '../../../context/ReceivablesPayablesContext';
import { formatLKR } from '../../../utils/helpers';

interface ReceivableInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceToEdit?: ReceivableInvoice | null;
}

export const ReceivableInvoiceModal: React.FC<ReceivableInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoiceToEdit
}) => {
  const { addReceivable, updateReceivable } = useReceivablesPayables();

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paid, setPaid] = useState<number | ''>('');
  const [client, setClient] = useState('');
  const [project, setProject] = useState('');
  const [workOrderOrContract, setWorkOrderOrContract] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(invoiceToEdit);

  useEffect(() => {
    if (invoiceToEdit) {
      setInvoiceNumber(invoiceToEdit.invoiceNumber);
      setInvoiceDate(invoiceToEdit.invoiceDate);
      setDueDate(invoiceToEdit.dueDate);
      setAmount(invoiceToEdit.amount);
      setPaid(invoiceToEdit.paid);
      setClient(invoiceToEdit.client);
      setProject(invoiceToEdit.project);
      setWorkOrderOrContract(invoiceToEdit.workOrderOrContract || '');
      setNotes(invoiceToEdit.notes || '');
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      const dueStr = nextMonth.toISOString().split('T')[0];

      setInvoiceNumber(`INV-2026-${Math.floor(100 + Math.random() * 900)}`);
      setInvoiceDate(todayStr);
      setDueDate(dueStr);
      setAmount('');
      setPaid('');
      setClient('');
      setProject('');
      setWorkOrderOrContract('');
      setNotes('');
    }
    setError(null);
  }, [invoiceToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) {
      setError('Invoice number is required');
      return;
    }
    if (!client.trim()) {
      setError('Client name is required');
      return;
    }
    if (!project.trim()) {
      setError('Project name is required');
      return;
    }
    if (!invoiceDate) {
      setError('Invoice date is required');
      return;
    }
    if (!dueDate) {
      setError('Due date is required');
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid invoice amount');
      return;
    }

    const numPaid = Number(paid) || 0;
    if (numPaid > numAmount) {
      setError('Paid amount cannot exceed total invoice amount');
      return;
    }

    if (isEditing && invoiceToEdit) {
      updateReceivable(invoiceToEdit.id, {
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate,
        dueDate,
        amount: numAmount,
        paid: numPaid,
        client: client.trim(),
        project: project.trim(),
        workOrderOrContract: workOrderOrContract.trim() || undefined,
        notes: notes.trim() || undefined
      });
    } else {
      addReceivable({
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate,
        dueDate,
        amount: numAmount,
        paid: numPaid,
        client: client.trim(),
        project: project.trim(),
        workOrderOrContract: workOrderOrContract.trim() || undefined,
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
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditing ? 'Edit Receivable Invoice' : 'Create Accounts Receivable Invoice'}
              </h2>
              <p className="text-xs text-slate-400">
                Track client billing, milestone certificates, and payment realization
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
                Invoice Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-2026-0081"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Client / Employer <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={client}
                onChange={e => setClient(e.target.value)}
                placeholder="e.g. Road Development Authority (RDA)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Project Name / Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={project}
                onChange={e => setProject(e.target.value)}
                placeholder="e.g. PIDM 26 - Central Expressway Sec 2"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Work Order / Contract Ref
              </label>
              <input
                type="text"
                value={workOrderOrContract}
                onChange={e => setWorkOrderOrContract(e.target.value)}
                placeholder="e.g. RDA/EX/2025/C2-014"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Invoice Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Due Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Total Invoiced Amount (LKR) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Amount Paid / Collected to Date (LKR)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={paid}
                onChange={e => setPaid(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Computed Outstanding Indicator */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Calculated Outstanding Receivable:</span>
            <span className="text-sm font-bold font-mono text-emerald-400">
              {formatLKR(calculatedOutstanding)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notes &amp; Scope Description
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Milestone billing for bridge pier concreting, IPC-04..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Create Invoice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
