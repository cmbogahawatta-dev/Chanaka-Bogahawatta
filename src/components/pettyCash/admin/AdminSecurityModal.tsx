import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, Eye, EyeOff, X, KeyRound, CheckCircle2 } from 'lucide-react';
import { adminSecurityService } from '../../../services/adminSecurityService';

interface AdminSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  actionTitle?: string;
  actionDescription?: string;
}

export const AdminSecurityModal: React.FC<AdminSecurityModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  actionTitle = 'ADMIN DATA IMPORT & MIGRATION',
  actionDescription = 'This tool migrates company historical records directly into live operational tables. Enter your Admin Security Code to authorize access.'
}) => {
  const [securityCode, setSecurityCode] = useState<string>('');
  const [showCode, setShowCode] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityCode.trim()) {
      setErrorMsg('Please enter the Admin Security Code.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');

    try {
      const res = await adminSecurityService.verifyCode(securityCode);
      if (res.success) {
        setSecurityCode('');
        onVerified();
      } else {
        setErrorMsg(res.message || 'Verification failed. Incorrect Admin Security Code.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred during verification. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="admin-security-verification-modal"
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-slate-100"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-5 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300">
                  Security Level 1
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100 tracking-tight">
                ADMIN SECURITY VERIFICATION
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <div className="flex items-center gap-2 font-semibold text-emerald-400 mb-1">
              <Lock className="w-4 h-4" />
              <span>Restricted Authorization Required</span>
            </div>
            <p className="text-slate-400 text-[11px]">{actionDescription}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
              Enter Admin Security Code
            </label>
            <div className="relative">
              <input
                id="admin-security-code-input"
                type={showCode ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={securityCode}
                onChange={(e) => {
                  setSecurityCode(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 font-mono tracking-widest placeholder:tracking-normal placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                tabIndex={-1}
              >
                {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-slate-400" />
              <span>Contact your system administrator if you do not possess an authorization code.</span>
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl flex items-center gap-2 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="admin-security-verify-btn"
              type="submit"
              disabled={isVerifying || !securityCode.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all active:scale-95"
            >
              {isVerifying ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Unlock Import</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
