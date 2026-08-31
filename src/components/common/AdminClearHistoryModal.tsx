import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Trash2,
  X,
  CheckCircle2,
  Lock,
  Key,
  ShieldCheck,
  Info
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { useEnterprise } from '../../context/EnterpriseContext';

export interface AdminClearHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  moduleName: string;
  itemCount: number;
  itemDescription?: string;
  preservedItemsDescription?: string;
  requirePin?: boolean;
}

export const AdminClearHistoryModal: React.FC<AdminClearHistoryModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  moduleName,
  itemCount,
  itemDescription = 'transactional records and audit history',
  preservedItemsDescription = 'Master configurations (Vehicles, Drivers, Projects, Accounts, GL Categories) will remain intact.',
  requirePin = true
}) => {
  const { verifyAdminPin, isAdmin } = useFleet();
  const { currentRole, currentUser } = useEnterprise();

  const isRoleAdmin = currentRole === 'ADMIN' || isAdmin;
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExecute = () => {
    if (!isRoleAdmin) {
      alert('Access Denied: Only administrators have authority to clear history data.');
      return;
    }

    if (requirePin) {
      const isValid = verifyAdminPin(pinInput);
      if (!isValid) {
        setPinError(true);
        return;
      }
    }

    setIsSuccess(true);
    setTimeout(() => {
      onConfirm();
      setIsSuccess(false);
      setPinInput('');
      setPinError(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        id="modal-admin-clear-history"
        className="relative w-full max-w-md bg-slate-900 border border-red-500/40 rounded-2xl shadow-2xl overflow-hidden transition-all text-slate-100"
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-red-950/80 via-red-900/40 to-slate-900 px-6 py-4 border-b border-red-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-inner">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100 tracking-wide">
                  Clear History Data
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-red-200/70 font-medium">
                {moduleName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {isSuccess ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-lg font-bold text-slate-100">History Successfully Cleared</p>
              <p className="text-xs text-slate-400">All requested history records were permanently purged from the database.</p>
            </div>
          ) : (
            <>
              {/* Record Impact Counter */}
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-semibold text-red-300">
                    Are you sure you want to clear {itemCount} {itemDescription}?
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    This will permanently delete logged history entries from this module. This action is irreversible and recorded in the audit trail.
                  </p>
                </div>
              </div>

              {/* Preserved Data Reassurance */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <span className="font-semibold text-emerald-400">Protected Core Assets:</span> {preservedItemsDescription}
                </p>
              </div>

              {/* Admin Security PIN Authorization */}
              {requirePin && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Enter Admin Security PIN</span>
                    </span>
                    <span className="text-[10px] text-slate-500">Default PIN: 1234</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={6}
                      value={pinInput}
                      onChange={(e) => {
                        setPinInput(e.target.value);
                        setPinError(false);
                      }}
                      placeholder="••••"
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border ${
                        pinError ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-700'
                      } text-slate-100 text-center tracking-widest text-lg font-mono focus:outline-none focus:border-red-500`}
                      autoFocus
                    />
                    <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  </div>
                  {pinError && (
                    <p className="text-[11px] font-medium text-red-400 flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Incorrect Administrator PIN. Please verify and retry.</span>
                    </p>
                  )}
                </div>
              )}

              {/* User authorization badge */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Authorized User: <strong className="text-slate-200">{currentUser}</strong></span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Session Active</span>
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isSuccess && (
          <div className="bg-slate-950/80 px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              id="btn-cancel-clear-history"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-clear-history"
              onClick={handleExecute}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold shadow-lg shadow-red-900/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              <span>Confirm & Clear History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
