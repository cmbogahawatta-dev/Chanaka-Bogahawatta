import React, { useState } from 'react';
import { X, ArrowRightLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';

interface InternalTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InternalTransferModal: React.FC<InternalTransferModalProps> = ({
  isOpen,
  onClose
}) => {
  const { supervisors, addTransfer, currentSupervisorName, userRole } = usePettyCash();

  const todayIso = new Date().toISOString().split('T')[0];
  const [dateRef, setDateRef] = useState<string>(todayIso);
  const [fromSupervisor, setFromSupervisor] = useState<string>(
    userRole === 'SUPERVISOR' ? currentSupervisorName : supervisors[0]?.SUPERVISOR_NAME || 'BUDDIKA'
  );
  const [toSupervisor, setToSupervisor] = useState<string>(
    supervisors[1]?.SUPERVISOR_NAME || 'GAYANI'
  );
  const [amount, setAmount] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submittedTransferId, setSubmittedTransferId] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatDateDisplay = (isoStr: string) => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return isoStr;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (fromSupervisor === toSupervisor) {
      setError('Source and Destination supervisors cannot be the same person.');
      return;
    }

    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid positive LKR amount.');
      return;
    }

    try {
      const displayDate = formatDateDisplay(dateRef);
      const newTrf = addTransfer({
        DATE_REF: dateRef,
        DATE: displayDate,
        FROM_SUPERVISOR: fromSupervisor,
        TO_SUPERVISOR: toSupervisor,
        AMOUNT: numericAmount,
        REMARKS: remarks.trim() || 'Inter-supervisor cash handover on site',
        STATUS: 'Completed'
      });

      setSubmittedTransferId(newTrf.TRANSFER_ID);
    } catch (err: any) {
      setError(err?.message || 'Failed to record transfer.');
    }
  };

  const handleResetAndClose = () => {
    setSubmittedTransferId(null);
    setAmount('');
    setRemarks('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Inter-Supervisor Cash Transfer</h3>
              <p className="text-xs text-slate-400">Transfer cash float between site supervisors</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedTransferId ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-100">Cash Transfer Completed!</h4>
              <p className="text-xs text-slate-400 mt-1">
                Both supervisor balances have been adjusted automatically. Transfer ID:
              </p>
              <div className="mt-2 font-mono text-sm font-bold bg-slate-950 border border-emerald-800 text-emerald-300 py-1.5 px-3 rounded-lg inline-block">
                {submittedTransferId}
              </div>
            </div>
            <div className="pt-3 flex justify-center">
              <button
                onClick={handleResetAndClose}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Close & Return
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Transfer Date *
              </label>
              <input
                type="date"
                required
                value={dateRef}
                onChange={(e) => setDateRef(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  From (Source Supervisor) *
                </label>
                <select
                  required
                  value={fromSupervisor}
                  disabled={userRole === 'SUPERVISOR'}
                  onChange={(e) => setFromSupervisor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {supervisors.map(s => (
                    <option key={s.id} value={s.SUPERVISOR_NAME}>
                      {s.SUPERVISOR_NAME}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  To (Recipient Supervisor) *
                </label>
                <select
                  required
                  value={toSupervisor}
                  onChange={(e) => setToSupervisor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {supervisors.map(s => (
                    <option key={s.id} value={s.SUPERVISOR_NAME}>
                      {s.SUPERVISOR_NAME}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Transfer Amount in LKR *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400 font-mono">
                  LKR
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 10000.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-14 pr-3 py-2 text-sm font-mono font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Transfer Reason / Remarks
              </label>
              <input
                type="text"
                placeholder="e.g. Urgent cash handover for Colombo road site diesel purchase"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                Confirm Transfer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
