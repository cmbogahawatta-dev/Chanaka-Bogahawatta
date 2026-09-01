import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  UserCheck,
  Shield
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'changePin' | 'switchRole';
  onSuccess?: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
  onSuccess
}) => {
  const {
    userRole,
    setUserRole,
    isAdmin,
    verifyAdminPin,
    setAdminPin,
    loginAsAdmin,
    logoutAdmin
  } = useFleet();

  const [tab, setTab] = useState<'login' | 'changePin' | 'role'>(
    initialTab === 'changePin' ? 'changePin' : initialTab === 'switchRole' ? 'role' : 'login'
  );

  // Form states
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Change PIN states
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showChangePins, setShowChangePins] = useState(false);

  if (!isOpen) return null;

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!pinInput.trim()) {
      setErrorMsg('Please enter the Admin Security PIN.');
      return;
    }

    const success = loginAsAdmin(pinInput.trim());
    if (success) {
      setSuccessMsg('Admin access verified successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 600);
    } else {
      setErrorMsg('Incorrect Admin PIN. Access denied.');
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!verifyAdminPin(currentPin.trim())) {
      setErrorMsg('Current Admin PIN is incorrect.');
      return;
    }

    if (newPin.trim().length < 4) {
      setErrorMsg('New PIN must be at least 4 digits or characters.');
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      setErrorMsg('New PIN and Confirmation PIN do not match.');
      return;
    }

    const updated = setAdminPin(newPin.trim());
    if (updated) {
      setSuccessMsg('Admin Security PIN updated successfully!');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMsg('Failed to update PIN. Please verify inputs.');
    }
  };

  const handleRoleChange = (role: 'admin' | 'driver' | 'viewer') => {
    if (role === 'admin') {
      setTab('login');
      return;
    }
    logoutAdmin();
    setSuccessMsg('Switched to Driver/Staff restricted mode.');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isAdmin ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Fleet Administrator Security</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAdmin ? 'Authenticated with full system privileges' : 'Authentication required for restricted actions'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all text-center ${
              tab === 'login'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isAdmin ? 'Admin Status' : 'Admin Login'}
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('changePin');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all text-center ${
              tab === 'changePin'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Change PIN
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('role');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all text-center ${
              tab === 'role'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Switch Role
          </button>
        </div>

        {/* Notification / Error / Success Banners */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-400 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-400 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab 1: Admin Login / Status */}
        {tab === 'login' && (
          <div>
            {isAdmin ? (
              <div className="space-y-4 py-2">
                <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Administrator Privileges Active</h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      You have full access to create, edit, delete, clear, and reset fleet records.
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <UserCheck className="w-3.5 h-3.5" />
                      Role: Fleet Administrator
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('driver')}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock / Switch to Driver Mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                  <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-400" />
                    Admin Authorization Required
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Enter the configured Administrator PIN to unlock management controls, vehicle wiping, and sample data restoration.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Admin Security PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="Enter Admin PIN"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden tracking-widest"
                      maxLength={12}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow transition-colors"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Unlock Admin Mode</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Change Security PIN */}
        {tab === 'changePin' && (
          <form onSubmit={handleChangePin} className="space-y-3.5">
            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-[11px] text-slate-400">
              Update the PIN used to authorize factory data resets, full dataset clears, and administrative configurations.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Current Admin PIN
              </label>
              <input
                type={showChangePins ? 'text' : 'password'}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="Enter current Admin PIN"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                New Admin PIN
              </label>
              <input
                type={showChangePins ? 'text' : 'password'}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Minimum 4 digits/characters"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirm New Admin PIN
              </label>
              <input
                type={showChangePins ? 'text' : 'password'}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Re-enter new PIN"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowChangePins(!showChangePins)}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {showChangePins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showChangePins ? 'Hide PINs' : 'Show PINs'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Update PIN</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 3: Switch Role */}
        {tab === 'role' && (
          <div className="space-y-3">
            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs text-slate-300">
              Select your active interface mode. In <strong>Driver / Staff mode</strong>, high-impact operations like clearing all company data and resetting history require entering the Admin PIN.
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (isAdmin) {
                    onClose();
                  } else {
                    setTab('login');
                  }
                }}
                className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  isAdmin
                    ? 'bg-blue-600/10 border-blue-500/40 text-white'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs text-white">Fleet Administrator</p>
                    {isAdmin && <span className="text-[10px] font-bold text-emerald-400">Active</span>}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Unrestricted access to vehicle registers, driver accounts, fleet resets, and full data clearing.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('driver')}
                className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  !isAdmin
                    ? 'bg-emerald-600/10 border-emerald-500/40 text-white'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs text-white">Driver / Standard Staff View</p>
                    {!isAdmin && <span className="text-[10px] font-bold text-emerald-400">Active</span>}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Standard daily operations (trips, fuel fill-ups, handover checklists). Dangerous clear/reset actions are PIN-locked.
                  </p>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
