import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, AlertCircle, Eye, EyeOff, X, CheckCircle2, ShieldAlert, KeyRound } from 'lucide-react';
import { adminSecurityService } from '../../services/adminSecurityService';
import { useEnterprise } from '../../context/EnterpriseContext';

export interface AdminSecurityConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorized: () => void;
  actionTitle: string;
  actionDescription?: string;
  severity?: 'critical' | 'warning' | 'normal';
  user?: { id?: string; name?: string; role?: string };
}

export const AdminSecurityConfirmationModal: React.FC<AdminSecurityConfirmationModalProps> = ({
  isOpen,
  onClose,
  onAuthorized,
  actionTitle,
  actionDescription = 'This operation requires elevated administrative security authorization.',
  severity = 'critical',
  user
}) => {
  const { currentUser, currentRole } = useEnterprise();
  const activeUser = user || { id: 'admin-usr', name: currentUser || 'BUDDIKA', role: currentRole || 'ADMIN' };

  const [hasKey, setHasKey] = useState<boolean>(true);
  const [securityKey, setSecurityKey] = useState<string>('');
  const [confirmKey, setConfirmKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lockoutSec, setLockoutSec] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      const status = adminSecurityService.getSecurityStatus();
      setHasKey(status.configured);
      if (status.isLockedOut) {
        setLockoutSec(status.lockoutRemainingSeconds);
      } else {
        setLockoutSec(0);
      }
      setSecurityKey('');
      setConfirmKey('');
      setErrorMsg('');
      setSuccessMsg('');
      setShowKey(false);
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSec <= 0) return;
    const interval = setInterval(() => {
      setLockoutSec(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSec]);

  if (!isOpen) return null;

  const strengthCheck = adminSecurityService.calculateKeyStrength(securityKey);

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityKey.trim()) {
      setErrorMsg('Please enter your Admin Security Key.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      const res = await adminSecurityService.verifySecurityKey(securityKey, actionTitle, activeUser);
      if (res.success) {
        setSecurityKey('');
        setSuccessMsg('Authorization successful.');
        setTimeout(() => {
          onAuthorized();
          onClose();
        }, 400);
      } else {
        if (res.isLockedOut && res.lockoutRemainingSeconds) {
          setLockoutSec(res.lockoutRemainingSeconds);
        }
        setErrorMsg(res.message || 'Incorrect Admin Security Key.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred during security authorization.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInitializeKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (securityKey !== confirmKey) {
      setErrorMsg('New Security Key and Confirmation Key do not match.');
      return;
    }

    if (!strengthCheck.valid) {
      setErrorMsg(strengthCheck.message || 'Please choose a stronger security key.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await adminSecurityService.initializeSecurityKey(securityKey, activeUser);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onAuthorized();
          onClose();
        }, 600);
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setErrorMsg('Failed to establish security key.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="admin-security-confirmation-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="admin-security-confirmation-modal"
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div
          className={`p-5 border-b flex items-center justify-between ${
            severity === 'critical'
              ? 'bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border-red-500/30'
              : 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border-amber-500/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                severity === 'critical'
                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              }`}
            >
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  severity === 'critical'
                    ? 'bg-red-950/80 text-red-300 border-red-800'
                    : 'bg-amber-950/80 text-amber-300 border-amber-800'
                }`}
              >
                Elevated Authorization
              </span>
              <h3 className="text-base font-bold text-slate-100 tracking-tight mt-0.5">
                {hasKey ? 'ADMIN SECURITY AUTHORIZATION' : 'SET ADMIN SECURITY KEY'}
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

        {/* Body */}
        {hasKey ? (
          <form onSubmit={handleAuthorize} className="p-5 sm:p-6 space-y-4">
            <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <Lock className="w-3.5 h-3.5" />
                <span>Action: {actionTitle}</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">{actionDescription}</p>
            </div>

            {lockoutSec > 0 && (
              <div className="p-3.5 bg-rose-950/60 border border-rose-700 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <p className="font-bold">Security Lockout Active</p>
                  <p className="text-[11px] text-rose-200/80 mt-0.5">
                    Too many incorrect authorization attempts. Access unlocked in <strong>{lockoutSec}s</strong>.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Enter Admin Security Key
              </label>
              <div className="relative">
                <input
                  id="input-security-confirmation-key"
                  type={showKey ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={securityKey}
                  onChange={(e) => {
                    setSecurityKey(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  disabled={lockoutSec > 0}
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 font-mono tracking-widest placeholder:tracking-normal placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all pr-12 disabled:opacity-50 text-center"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                  tabIndex={-1}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl flex items-center gap-2 text-rose-300 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl flex items-center gap-2 text-emerald-300 text-xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Authorized user bar */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1 border-t border-slate-800">
              <span>Authorized User: <strong className="text-slate-200">{activeUser.name || 'BUDDIKA'}</strong></span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Session Active</span>
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-security-authorize"
                type="submit"
                disabled={isProcessing || !securityKey.trim() || lockoutSec > 0}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-amber-950/50 flex items-center gap-2 transition-all active:scale-95"
              >
                {isProcessing ? (
                  <span>Authorizing...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorize</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleInitializeKey} className="p-5 sm:p-6 space-y-4">
            <div className="p-3.5 bg-blue-950/50 rounded-xl border border-blue-800/60 text-xs text-blue-200 leading-relaxed space-y-1">
              <div className="flex items-center gap-2 font-bold text-blue-300">
                <KeyRound className="w-4 h-4" />
                <span>ADMIN SECURITY KEY SETUP REQUIRED</span>
              </div>
              <p className="text-[11px] text-blue-300/80">
                An Admin Security Key has not yet been configured for this enterprise. Create a cryptographic key (minimum 6 characters/digits) to protect sensitive administrative actions.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                New Security Key
              </label>
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="Enter new strong security key (min 6 chars)"
                value={securityKey}
                onChange={(e) => setSecurityKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
                autoFocus
              />
              {securityKey.length > 0 && (
                <div className="flex items-center justify-between text-[11px] mt-1.5 px-1">
                  <span className="text-slate-400">Security strength:</span>
                  <span
                    className={`font-bold ${
                      strengthCheck.score === 'Strong'
                        ? 'text-emerald-400'
                        : strengthCheck.score === 'Medium'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {strengthCheck.score}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Confirm Security Key
              </label>
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="Re-enter security key"
                value={confirmKey}
                onChange={(e) => setConfirmKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="hover:text-slate-200 flex items-center gap-1"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showKey ? 'Hide Keys' : 'Show Keys'}</span>
              </button>
              <span>Min 6 characters/digits</span>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl flex items-center gap-2 text-rose-300 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-300 text-xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing || !securityKey.trim() || !confirmKey.trim()}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-blue-950/50 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Create Security Key</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

