import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Clock,
  Lock,
  RotateCcw,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  UserCheck,
  AlertTriangle,
  Info
} from 'lucide-react';
import { adminSecurityService, KeyStrengthResult } from '../../services/adminSecurityService';
import { useEnterprise } from '../../context/EnterpriseContext';
import { useFleet } from '../../context/FleetContext';

export const SecurityStatusIndicator: React.FC = () => {
  const { currentRole, currentUser } = useEnterprise();
  const { verifyAdminPin } = useFleet();

  const [securityStatus, setSecurityStatus] = useState(() => adminSecurityService.getSecurityStatus());
  
  // Modals: null | 'SETUP' | 'CHANGE' | 'RESET'
  const [activeModal, setActiveModal] = useState<null | 'SETUP' | 'CHANGE' | 'RESET'>(null);
  
  // Form fields
  const [currentKeyInput, setCurrentKeyInput] = useState('');
  const [newKeyInput, setNewKeyInput] = useState('');
  const [confirmKeyInput, setConfirmKeyInput] = useState('');
  const [enterprisePinInput, setEnterprisePinInput] = useState('');
  const [showKeys, setShowKeys] = useState(false);

  // States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lockoutSec, setLockoutSec] = useState<number>(0);

  const isRoleAdminOrOwner = currentRole === 'ADMIN' || currentRole === 'OWNER';

  const refreshStatus = () => {
    const status = adminSecurityService.getSecurityStatus();
    setSecurityStatus(status);
    if (status.isLockedOut) {
      setLockoutSec(status.lockoutRemainingSeconds);
    } else {
      setLockoutSec(0);
    }
  };

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Lockout timer
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

  const handleOpenModal = (modalType: 'SETUP' | 'CHANGE' | 'RESET') => {
    if (!isRoleAdminOrOwner) {
      alert('Access Denied: Only administrators and owners can manage the Admin Security Key.');
      return;
    }
    setCurrentKeyInput('');
    setNewKeyInput('');
    setConfirmKeyInput('');
    setEnterprisePinInput('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowKeys(false);
    setIsProcessing(false);
    setActiveModal(modalType);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    refreshStatus();
  };

  const strengthCheck: KeyStrengthResult = adminSecurityService.calculateKeyStrength(newKeyInput);

  // SETUP KEY
  const handleSetupKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newKeyInput !== confirmKeyInput) {
      setErrorMessage('New Security Key and Confirmation Key do not match.');
      return;
    }

    if (!strengthCheck.valid) {
      setErrorMessage(strengthCheck.message || 'Please choose a stronger security key.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await adminSecurityService.initializeSecurityKey(newKeyInput, {
        id: 'admin-usr',
        name: currentUser || 'BUDDIKA',
        role: currentRole
      });

      if (res.success) {
        setSuccessMessage('Your Admin Security Key has been configured successfully.');
        setTimeout(() => {
          handleCloseModal();
        }, 1200);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Failed to configure security key.');
    } finally {
      setIsProcessing(false);
    }
  };

  // CHANGE KEY
  const handleChangeKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentKeyInput.trim()) {
      setErrorMessage('Current Security Key is required.');
      return;
    }

    if (newKeyInput !== confirmKeyInput) {
      setErrorMessage('New Security Key and Confirmation Key do not match.');
      return;
    }

    if (!strengthCheck.valid) {
      setErrorMessage(strengthCheck.message || 'Please choose a stronger security key.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await adminSecurityService.changeSecurityKey(currentKeyInput, newKeyInput, {
        id: 'admin-usr',
        name: currentUser || 'BUDDIKA',
        role: currentRole
      });

      if (res.success) {
        setSuccessMessage('Admin Security Key updated successfully. Previous key has been invalidated.');
        setTimeout(() => {
          handleCloseModal();
        }, 1200);
      } else {
        if (res.isLockedOut && res.lockoutRemainingSeconds) {
          setLockoutSec(res.lockoutRemainingSeconds);
        }
        setErrorMessage(res.message || 'Failed to change security key.');
      }
    } catch {
      setErrorMessage('An error occurred during security key update.');
    } finally {
      setIsProcessing(false);
    }
  };

  // RESET / RECOVERY KEY
  const handleResetRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isRoleAdminOrOwner) {
      setErrorMessage('Access Denied: Only authenticated Owner/Admin can perform emergency reset.');
      return;
    }

    // Require Enterprise PIN verification to re-authenticate admin identity
    if (!enterprisePinInput.trim()) {
      setErrorMessage('Please enter your Enterprise Admin Login PIN to verify identity.');
      return;
    }

    const isPinValid = verifyAdminPin(enterprisePinInput.trim());
    if (!isPinValid) {
      setErrorMessage('Incorrect Enterprise Admin Login PIN. Identity re-authentication failed.');
      return;
    }

    if (newKeyInput !== confirmKeyInput) {
      setErrorMessage('New Security Key and Confirmation Key do not match.');
      return;
    }

    if (!strengthCheck.valid) {
      setErrorMessage(strengthCheck.message || 'Please choose a stronger security key.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await adminSecurityService.resetSecurityKey(newKeyInput, {
        id: 'admin-usr',
        name: currentUser || 'BUDDIKA',
        role: currentRole
      });

      if (res.success) {
        setSuccessMessage('Admin Security Key reset successfully. Old credentials invalidated.');
        setTimeout(() => {
          handleCloseModal();
        }, 1200);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Failed to reset security key.');
    } finally {
      setIsProcessing(false);
    }
  };

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
      className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-4 text-slate-100"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${
              securityStatus.configured
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}
          >
            {securityStatus.configured ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-100 tracking-wide">
                Admin Security Key
              </h4>
              <span
                id="badge-admin-security-status"
                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded border ${
                  securityStatus.configured
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                    : 'bg-amber-950/80 text-amber-300 border-amber-800'
                }`}
              >
                {securityStatus.configured ? '● Configured' : '● Action Required'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cryptographic SHA-256 salted hash credential protecting elevated administrative actions
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!securityStatus.configured ? (
            <button
              id="btn-open-setup-security-key"
              type="button"
              onClick={() => handleOpenModal('SETUP')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/50 flex items-center gap-1.5 transition-all"
            >
              <KeyRound className="w-4 h-4" />
              <span>Set Up Security Key</span>
            </button>
          ) : (
            <>
              <button
                id="btn-open-change-security-key"
                type="button"
                onClick={() => handleOpenModal('CHANGE')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change Security Key</span>
              </button>
              <button
                id="btn-open-reset-security-key"
                type="button"
                onClick={() => handleOpenModal('RESET')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 flex items-center gap-1.5 transition-all"
                title="Reset or recover security key with Owner credentials"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset / Recovery</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Metadata Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/60 flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Stored Credential:</span>
          </span>
          <span className="font-mono font-bold tracking-widest text-slate-300">
            {securityStatus.configured ? 'SHA-256 (Salted)' : '(Unset)'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/60 flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Last Changed:</span>
          </span>
          <span className="font-mono text-[11px] text-slate-300">
            {formatDate(securityStatus.lastChangedAt)}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/60 flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Configured By:</span>
          </span>
          <span className="font-mono font-bold text-[11px] text-slate-300">
            {securityStatus.configuredBy || 'BUDDIKA (ADMIN)'}
          </span>
        </div>
      </div>

      {/* Security Caveat & Lockout Banner */}
      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-400">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-300">Architecture Note:</strong> Client-side credential protection is not tamper-resistant production authentication. For enterprise environments, cryptographic authorization keys are salted and hashed with zero plaintext storage.
        </p>
      </div>

      {securityStatus.isLockedOut && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            Security Lockout Active: Too many failed verification attempts. Retry available in <strong>{lockoutSec}s</strong>.
          </span>
        </div>
      )}

      {/* MODAL 1: SETUP SECURITY KEY */}
      {activeModal === 'SETUP' && (
        <div
          id="modal-setup-security-key-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
        >
          <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
            <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 px-6 py-4 border-b border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">Set Up Admin Security Key</h3>
              </div>
              <button onClick={handleCloseModal} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSetupKey} className="p-6 space-y-4">
              <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                <p className="font-bold text-amber-300">ADMIN SECURITY KEY SETUP</p>
                <p className="text-[11px] text-amber-200/80 mt-1">
                  Create a custom security key (minimum 6 characters/digits). Weak passwords like 1234, 0000, or admin are rejected.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  New Security Key
                </label>
                <input
                  id="input-setup-key-val"
                  type={showKeys ? 'text' : 'password'}
                  value={newKeyInput}
                  onChange={(e) => setNewKeyInput(e.target.value)}
                  placeholder="Enter strong security key (min 6 chars)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  autoFocus
                />
                {newKeyInput.length > 0 && (
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
                  id="input-setup-key-confirm"
                  type={showKeys ? 'text' : 'password'}
                  value={confirmKeyInput}
                  onChange={(e) => setConfirmKeyInput(e.target.value)}
                  placeholder="Re-enter security key"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <button
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="hover:text-slate-200 flex items-center gap-1"
                >
                  {showKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showKeys ? 'Hide Keys' : 'Show Keys'}</span>
                </button>
                <span>Min 6 characters/digits</span>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-initial-security-key"
                  type="submit"
                  disabled={isProcessing || !newKeyInput.trim() || !confirmKeyInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-amber-950/50 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Save Security Key</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CHANGE SECURITY KEY */}
      {activeModal === 'CHANGE' && (
        <div
          id="modal-change-security-key-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
        >
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">Change Admin Security Key</h3>
              </div>
              <button onClick={handleCloseModal} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangeKey} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Current Security Key
                </label>
                <input
                  id="input-current-security-key"
                  type={showKeys ? 'text' : 'password'}
                  value={currentKeyInput}
                  onChange={(e) => setCurrentKeyInput(e.target.value)}
                  placeholder="Enter existing security key"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  New Security Key
                </label>
                <input
                  id="input-new-security-key"
                  type={showKeys ? 'text' : 'password'}
                  value={newKeyInput}
                  onChange={(e) => setNewKeyInput(e.target.value)}
                  placeholder="Enter new strong security key (min 6 chars)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
                {newKeyInput.length > 0 && (
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
                  Confirm New Security Key
                </label>
                <input
                  id="input-confirm-new-security-key"
                  type={showKeys ? 'text' : 'password'}
                  value={confirmKeyInput}
                  onChange={(e) => setConfirmKeyInput(e.target.value)}
                  placeholder="Re-enter new security key"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <button
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="hover:text-slate-200 flex items-center gap-1"
                >
                  {showKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showKeys ? 'Hide Keys' : 'Show Keys'}</span>
                </button>
                <span>Min 6 characters/digits</span>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-change-security-key"
                  type="submit"
                  disabled={isProcessing || !currentKeyInput.trim() || !newKeyInput.trim() || !confirmKeyInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-amber-950/50 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Change Key</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RESET / RECOVERY */}
      {activeModal === 'RESET' && (
        <div
          id="modal-reset-security-key-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
        >
          <div className="relative w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
            <div className="bg-gradient-to-r from-rose-950/90 via-slate-900 to-slate-900 px-6 py-4 border-b border-rose-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-slate-100">Reset Admin Security Key</h3>
              </div>
              <button onClick={handleCloseModal} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetRecovery} className="p-6 space-y-4">
              <div className="p-3.5 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-rose-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>RESET ADMIN SECURITY KEY</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  This emergency recovery will invalidate the existing Admin Security Key.
                </p>
                <div className="pt-1 text-[11px] text-slate-300 font-mono">
                  <span>Current Authenticated User: <strong>{currentUser || 'BUDDIKA'}</strong></span>
                  <br />
                  <span>Role: <strong>{currentRole}</strong></span>
                </div>
              </div>

              {/* Re-authenticate with Enterprise Login PIN */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Enterprise Login PIN (Identity Re-authentication)
                </label>
                <input
                  id="input-reset-enterprise-pin"
                  type="password"
                  value={enterprisePinInput}
                  onChange={(e) => setEnterprisePinInput(e.target.value)}
                  placeholder="Enter your Enterprise Login PIN"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Create New Security Key
                </label>
                <input
                  id="input-reset-new-key"
                  type={showKeys ? 'text' : 'password'}
                  value={newKeyInput}
                  onChange={(e) => setNewKeyInput(e.target.value)}
                  placeholder="Enter new strong security key (min 6 chars)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
                {newKeyInput.length > 0 && (
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
                  Confirm New Security Key
                </label>
                <input
                  id="input-reset-confirm-new-key"
                  type={showKeys ? 'text' : 'password'}
                  value={confirmKeyInput}
                  onChange={(e) => setConfirmKeyInput(e.target.value)}
                  placeholder="Re-enter new security key"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <button
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="hover:text-slate-200 flex items-center gap-1"
                >
                  {showKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showKeys ? 'Hide Keys' : 'Show Keys'}</span>
                </button>
                <span>Min 6 characters/digits</span>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  id="btn-execute-reset-security-key"
                  type="submit"
                  disabled={isProcessing || !enterprisePinInput.trim() || !newKeyInput.trim() || !confirmKeyInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-rose-950/50 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset & Replace Key</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

