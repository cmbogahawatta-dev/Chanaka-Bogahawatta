import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Trash2,
  X,
  CheckCircle2,
  Lock,
  KeyRound,
  ShieldCheck,
  Info,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { useEnterprise } from '../../context/EnterpriseContext';
import { adminSecurityService } from '../../services/adminSecurityService';

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
  const { currentRole, currentUser } = useEnterprise();

  const isRoleAdmin = currentRole === 'ADMIN' || currentRole === 'OWNER';
  
  // Stages: 'AUTH' | 'SETUP' | 'CONFIRM' | 'SUCCESS'
  const [step, setStep] = useState<'AUTH' | 'SETUP' | 'CONFIRM' | 'SUCCESS'>('AUTH');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  
  // Verification states
  const [securityKeyInput, setSecurityKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lockoutSec, setLockoutSec] = useState<number>(0);

  // Setup states
  const [newKey, setNewKey] = useState('');
  const [confirmKey, setConfirmKey] = useState('');
  const [showSetupKeys, setShowSetupKeys] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const status = adminSecurityService.getSecurityStatus();
      setIsConfigured(status.configured);
      if (status.isLockedOut) {
        setLockoutSec(status.lockoutRemainingSeconds);
      } else {
        setLockoutSec(0);
      }
      setSecurityKeyInput('');
      setNewKey('');
      setConfirmKey('');
      setErrorMessage(null);
      setShowKey(false);
      setShowSetupKeys(false);
      setIsProcessing(false);

      if (!status.configured) {
        setStep('SETUP');
      } else {
        setStep('AUTH');
      }
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

  const strengthCheck = adminSecurityService.calculateKeyStrength(newKey);

  // Handle Verify Security Key
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRoleAdmin) {
      setErrorMessage('Access Denied: Only administrators have authority to clear history data.');
      return;
    }

    if (!securityKeyInput.trim()) {
      setErrorMessage('Please enter your Admin Security Key.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await adminSecurityService.verifySecurityKey(
        securityKeyInput.trim(),
        `Clear History: ${moduleName}`,
        {
          id: 'admin-usr',
          name: currentUser || 'BUDDIKA',
          role: currentRole
        }
      );

      if (res.success) {
        // Record intermediate audit
        adminSecurityService.recordAuditEvent({
          userId: 'admin-usr',
          userName: currentUser || 'BUDDIKA',
          userRole: currentRole,
          action: 'HISTORY_CLEAR_AUTHORIZED',
          targetRecord: moduleName,
          result: 'SUCCESS',
          reason: `Clear history authorized for ${itemCount} ${itemDescription}`
        });
        setStep('CONFIRM');
      } else {
        if (res.isLockedOut && res.lockoutRemainingSeconds) {
          setLockoutSec(res.lockoutRemainingSeconds);
        }
        setErrorMessage(res.message || 'Incorrect Admin Security Key.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred during security authorization.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Setup Security Key
  const handleSetupKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newKey !== confirmKey) {
      setErrorMessage('New Security Key and Confirmation Key do not match.');
      return;
    }

    if (!strengthCheck.valid) {
      setErrorMessage(strengthCheck.message || 'Please choose a stronger security key.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await adminSecurityService.initializeSecurityKey(newKey, {
        id: 'admin-usr',
        name: currentUser || 'BUDDIKA',
        role: currentRole
      });

      if (res.success) {
        setIsConfigured(true);
        // Record intermediate audit
        adminSecurityService.recordAuditEvent({
          userId: 'admin-usr',
          userName: currentUser || 'BUDDIKA',
          userRole: currentRole,
          action: 'HISTORY_CLEAR_AUTHORIZED',
          targetRecord: moduleName,
          result: 'SUCCESS',
          reason: `Clear history authorized following key establishment for ${itemCount} ${itemDescription}`
        });
        setStep('CONFIRM');
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Failed to configure Admin Security Key.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Final Execution
  const handleFinalExecute = () => {
    setStep('SUCCESS');
    adminSecurityService.recordAuditEvent({
      userId: 'admin-usr',
      userName: currentUser || 'BUDDIKA',
      userRole: currentRole,
      action: 'HISTORY_CLEAR_EXECUTED',
      targetRecord: moduleName,
      result: 'SUCCESS',
      reason: `Permanently purged ${itemCount} ${itemDescription}`
    });

    setTimeout(() => {
      onConfirm();
      onClose();
    }, 700);
  };

  return (
    <div
      id="modal-admin-clear-history-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="modal-admin-clear-history"
        className="relative w-full max-w-md bg-slate-900 border border-red-500/40 rounded-2xl shadow-2xl overflow-hidden transition-all text-slate-100"
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-red-950/90 via-slate-900 to-slate-900 px-6 py-4 border-b border-red-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-inner">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100 tracking-wide">
                  {step === 'SETUP'
                    ? 'SET ADMIN SECURITY KEY'
                    : step === 'CONFIRM'
                    ? 'FINAL CONFIRMATION'
                    : 'ADMIN SECURITY AUTHORIZATION'}
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
          {step === 'SUCCESS' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-lg font-bold text-slate-100">History Successfully Cleared</p>
              <p className="text-xs text-slate-400">All requested history records were permanently purged from the database.</p>
            </div>
          )}

          {/* STEP 1: SETUP KEY (If not configured) */}
          {step === 'SETUP' && (
            <form onSubmit={handleSetupKey} className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-amber-300">
                    ADMIN SECURITY KEY SETUP REQUIRED
                  </p>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    An Admin Security Key has not yet been configured for this enterprise. Create a cryptographic key (minimum 6 characters/digits) to protect high-impact administrative actions.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  New Security Key
                </label>
                <div className="relative">
                  <input
                    id="input-setup-admin-security-key"
                    type={showSetupKeys ? 'text' : 'password'}
                    value={newKey}
                    onChange={(e) => {
                      setNewKey(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Create strong security key (min 6 chars)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    autoFocus
                  />
                </div>
                {newKey.length > 0 && (
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
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Confirm Security Key
                </label>
                <input
                  id="input-setup-admin-confirm-key"
                  type={showSetupKeys ? 'text' : 'password'}
                  value={confirmKey}
                  onChange={(e) => {
                    setConfirmKey(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Re-enter security key"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <button
                  type="button"
                  onClick={() => setShowSetupKeys(!showSetupKeys)}
                  className="hover:text-slate-200 flex items-center gap-1"
                >
                  {showSetupKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showSetupKeys ? 'Hide Keys' : 'Show Keys'}</span>
                </button>
                <span>Min 6 characters/digits</span>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl flex items-center gap-2 text-rose-300 text-xs animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  id="btn-create-admin-security-key"
                  type="submit"
                  disabled={isProcessing || !newKey.trim() || !confirmKey.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-amber-950/50 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Create Security Key</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: VERIFICATION (If key configured) */}
          {step === 'AUTH' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
                <div className="flex items-center justify-between text-slate-200">
                  <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Action: Clear {moduleName}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  This operation permanently purges historical records. Enter your Admin Security Key to authorize this action.
                </p>
              </div>

              {lockoutSec > 0 && (
                <div className="p-3.5 bg-rose-950/60 border border-rose-700 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <p className="font-bold">Security Lockout Active</p>
                    <p className="text-[11px] text-rose-200/80 mt-0.5">
                      Too many incorrect attempts. Retry available in <strong>{lockoutSec}s</strong>.
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
                    id="input-clear-history-security-key"
                    type={showKey ? 'text' : 'password'}
                    value={securityKeyInput}
                    onChange={(e) => {
                      setSecurityKeyInput(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    disabled={lockoutSec > 0}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-center tracking-widest text-base font-mono focus:outline-none focus:border-red-500 disabled:opacity-50"
                    autoFocus
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

              {errorMessage && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl flex items-center gap-2 text-rose-300 text-xs animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* User authorization badge */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1 border-t border-slate-800">
                <span>Authorized User: <strong className="text-slate-200">{currentUser || 'BUDDIKA'}</strong></span>
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Session Active</span>
                </span>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  id="btn-verify-security-key-clear"
                  type="submit"
                  disabled={isProcessing || !securityKeyInput.trim() || lockoutSec > 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-red-950/50 flex items-center gap-2 transition-all active:scale-95"
                >
                  {isProcessing ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Authorize</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: FINAL DESTRUCTIVE ACTION CONFIRMATION */}
          {step === 'CONFIRM' && (
            <div className="space-y-4">
              {/* Record Impact Counter */}
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1.5">
                  <p className="font-bold text-red-300 text-sm">
                    You are about to permanently delete:
                  </p>
                  <p className="font-mono text-slate-100 font-bold text-xs bg-red-950/80 px-2 py-1 rounded border border-red-800">
                    {itemCount} {itemDescription}
                  </p>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    This action cannot be undone. All selected historical logs and transactions will be purged.
                  </p>
                </div>
              </div>

              {/* Preserved Data Reassurance */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-300 leading-relaxed">
                  <p className="font-bold text-emerald-400 mb-0.5">Protected Core Assets:</p>
                  <p className="text-slate-400">{preservedItemsDescription}</p>
                </div>
              </div>

              {/* Authorized state banner */}
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between text-xs text-emerald-300">
                <span className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Security Authorization Granted</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {currentUser || 'BUDDIKA'} ({currentRole})
                </span>
              </div>

              {/* Confirmation Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  id="btn-cancel-final-clear"
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-final-clear"
                  type="button"
                  onClick={handleFinalExecute}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold shadow-lg shadow-red-900/30 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Confirm & Clear History</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

