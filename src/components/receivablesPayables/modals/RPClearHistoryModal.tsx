import React, { useState } from 'react';
import { X, Trash2, RotateCcw, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useReceivablesPayables } from '../../../context/ReceivablesPayablesContext';

interface RPClearHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RPClearHistoryModal: React.FC<RPClearHistoryModalProps> = ({ isOpen, onClose }) => {
  const {
    receivables,
    payables,
    clearReceivablesHistory,
    clearPayablesHistory,
    clearAllHistory,
    resetToDemoData
  } = useReceivablesPayables();

  const [confirmScope, setConfirmScope] = useState<'NONE' | 'AR' | 'AP' | 'ALL' | 'RESET'>('NONE');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecute = () => {
    if (confirmScope === 'AR') {
      clearReceivablesHistory();
      setSuccessMessage('Accounts Receivable history has been wiped.');
    } else if (confirmScope === 'AP') {
      clearPayablesHistory();
      setSuccessMessage('Accounts Payable history has been wiped.');
    } else if (confirmScope === 'ALL') {
      clearAllHistory();
      setSuccessMessage('All Receivables & Payables records have been cleared.');
    } else if (confirmScope === 'RESET') {
      resetToDemoData();
      setSuccessMessage('Reset to baseline dataset (LKR 25.4M Receivables / LKR 17.8M Payables / LKR 7.6M Net Position).');
    }
    setConfirmScope('NONE');
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Clear History &amp; Data Control</h3>
              <p className="text-xs text-slate-400">Manage transaction ledgers or restore baseline audit figures</p>
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
          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {confirmScope === 'NONE' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Select an option below to purge specific registers or restore demo metrics.
              </p>

              {/* Option 1: Clear AR */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition-all">
                <div>
                  <div className="text-xs font-bold text-slate-200">Clear Accounts Receivable Ledgers</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Currently: {receivables.length} customer invoices recorded
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmScope('AR')}
                  disabled={receivables.length === 0}
                  className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear AR</span>
                </button>
              </div>

              {/* Option 2: Clear AP */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition-all">
                <div>
                  <div className="text-xs font-bold text-slate-200">Clear Accounts Payable Ledgers</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Currently: {payables.length} supplier bills &amp; POs recorded
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmScope('AP')}
                  disabled={payables.length === 0}
                  className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear AP</span>
                </button>
              </div>

              {/* Option 3: Clear All */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition-all">
                <div>
                  <div className="text-xs font-bold text-rose-400">Purge Entire Ledgers (AR &amp; AP)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Total {receivables.length + payables.length} active records will be wiped
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmScope('ALL')}
                  disabled={receivables.length === 0 && payables.length === 0}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md shadow-rose-950/50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge All</span>
                </button>
              </div>

              {/* Option 4: Reset Demo Data */}
              <div className="p-3.5 bg-emerald-950/20 border border-emerald-800/40 rounded-xl flex items-center justify-between hover:border-emerald-700/60 transition-all">
                <div>
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Baseline Demo Dataset</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Restores: Receivable <strong>LKR 25.4M</strong>, Payable <strong>LKR 17.8M</strong>, Net <strong>LKR 7.6M</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmScope('RESET')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-950/50"
                >
                  <span>Reset Demo</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2.5 text-rose-400 text-xs font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>
                  {confirmScope === 'RESET'
                    ? 'Confirm Demo Data Restoration'
                    : `Confirm Clearing ${confirmScope === 'AR' ? 'Receivables' : confirmScope === 'AP' ? 'Payables' : 'All Data'}`}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {confirmScope === 'RESET'
                  ? 'This will overwrite current custom entries with the verified standard baseline (Receivable LKR 25.4M, Payable LKR 17.8M, Net LKR 7.6M).'
                  : 'This cannot be undone. Are you certain you want to purge these ledger entries?'}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmScope('NONE')}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecute}
                  className={`px-4 py-1.5 text-white rounded-lg text-xs font-bold transition-colors ${
                    confirmScope === 'RESET'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {confirmScope === 'RESET' ? 'Yes, Reset Data' : 'Yes, Confirm Purge'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
