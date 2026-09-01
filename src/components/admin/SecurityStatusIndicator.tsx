import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, KeyRound, Clock, Lock, RefreshCw, Key } from 'lucide-react';
import { adminSecurityService } from '../../services/adminSecurityService';
import { AdminSecurityConfirmationModal } from '../common/AdminSecurityConfirmationModal';

export const SecurityStatusIndicator: React.FC = () => {
  const [securityStatus, setSecurityStatus] = useState(() => adminSecurityService.getSecurityStatus());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'SETUP' | 'CHANGE'>('SETUP');

  const refreshStatus = () => {
    setSecurityStatus(adminSecurityService.getSecurityStatus());
  };

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'Never (Not established)';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      id="admin-security-status-indicator"
      className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              securityStatus.configured
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}
          >
            {securityStatus.configured ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-100 tracking-wide">
                Admin Security Key
              </h4>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                  securityStatus.configured
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                    : 'bg-amber-950/80 text-amber-300 border-amber-800'
                }`}
              >
                {securityStatus.configured ? 'Configured' : 'Action Required'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Cryptographic SHA-256 salted authorization
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setModalAction(securityStatus.configured ? 'CHANGE' : 'SETUP');
            setIsModalOpen(true);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            securityStatus.configured
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/50'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>{securityStatus.configured ? 'Update Key' : 'Setup Key'}</span>
        </button>
      </div>

      {/* Details Row: Masked Display & Timestamp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/60 flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Key Value:</span>
          </span>
          <span className="font-mono font-bold tracking-widest text-slate-300">
            {securityStatus.configured ? '•••• •••• ••••' : '(Unset)'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/60 flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Last Changed:</span>
          </span>
          <span className="font-mono text-[11px] text-slate-300">
            {formatDate(securityStatus.lastChangedAt)}
          </span>
        </div>
      </div>

      {securityStatus.isLockedOut && (
        <div className="p-2.5 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            Security Lockout Active: {securityStatus.lockoutRemainingSeconds}s remaining.
          </span>
        </div>
      )}

      {/* Security Confirmation Modal */}
      <AdminSecurityConfirmationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          refreshStatus();
        }}
        onAuthorized={() => {
          setIsModalOpen(false);
          refreshStatus();
        }}
        actionTitle={
          modalAction === 'SETUP'
            ? 'Initialize Admin Security Key'
            : 'Re-authenticate Security Key'
        }
        actionDescription={
          modalAction === 'SETUP'
            ? 'Set a custom cryptographic security key for system-wide elevated administrative actions.'
            : 'Verify administrative authority before updating security credentials.'
        }
      />
    </div>
  );
};
