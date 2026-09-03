import React, { useState, useEffect } from 'react';
import {
  Trash2,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Archive,
  UserX,
  AlertCircle,
  Database,
  ArrowRight
} from 'lucide-react';
import { adminSecurityService } from '../../services/adminSecurityService';
import { useEnterprise } from '../../context/EnterpriseContext';
import { useDataManagement } from '../../context/DataManagementContext';
import { DataManagementModule } from '../../types/dataManagementTypes';

export interface UniversalDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: DataManagementModule;
  recordType?: string;
  recordId: string;
  recordTitle?: string;
  recordCode?: string;
  recordName?: string;
  additionalDetails?: string;
  recordSummary?: Record<string, any>;
  onDelete: () => void | Promise<void>;
  onDeactivate?: () => void | Promise<void>;
  onSuccess?: () => void;
}

export const UniversalDeleteModal: React.FC<UniversalDeleteModalProps> = ({
  isOpen,
  onClose,
  module,
  recordType,
  recordId,
  recordTitle,
  recordCode,
  recordName,
  additionalDetails,
  recordSummary,
  onDelete,
  onDeactivate,
  onSuccess
}) => {
  const { currentUser, currentRole } = useEnterprise();
  const { analyzeDependencies } = useDataManagement();

  const [step, setStep] = useState<'CONFIRM' | 'AUTHORIZE'>('CONFIRM');
  const [selectedAction, setSelectedAction] = useState<'HARD_DELETE' | 'DEACTIVATE'>('HARD_DELETE');
  const [securityKey, setSecurityKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lockoutSec, setLockoutSec] = useState(0);

  // Dependency analysis
  const [dependencyInfo, setDependencyInfo] = useState<{
    canHardDelete: boolean;
    totalDependencies: number;
    breakdown: { category: string; count: number; description: string; sampleIds: string[] }[];
    warningMessage?: string;
  }>({
    canHardDelete: true,
    totalDependencies: 0,
    breakdown: []
  });

  useEffect(() => {
    if (isOpen) {
      setStep('CONFIRM');
      setSelectedAction(onDeactivate ? 'DEACTIVATE' : 'HARD_DELETE');
      setSecurityKey('');
      setShowKey(false);
      setErrorMsg('');
      setIsProcessing(false);

      const status = adminSecurityService.getSecurityStatus();
      if (status.isLockedOut) {
        setLockoutSec(status.lockoutRemainingSeconds);
      } else {
        setLockoutSec(0);
      }

      // Run live dependency check
      if (analyzeDependencies && recordId) {
        try {
          const analysis = analyzeDependencies(module, recordId);
          setDependencyInfo(analysis);
          if (analysis.totalDependencies > 0 && onDeactivate) {
            setSelectedAction('DEACTIVATE');
          } else {
            setSelectedAction('HARD_DELETE');
          }
        } catch {
          setDependencyInfo({ canHardDelete: true, totalDependencies: 0, breakdown: [] });
        }
      }
    }
  }, [isOpen, module, recordId, onDeactivate, analyzeDependencies]);

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

  if (!isOpen) return null;

  const activeUser = {
    id: 'usr-admin',
    name: currentUser || 'BUDDIKA',
    role: currentRole || 'ADMIN'
  };

  const getModuleLabel = (mod: DataManagementModule) => {
    switch (mod) {
      case 'STAFF': return 'Staff & HR Directory';
      case 'PROJECTS': return 'Projects Registry';
      case 'VEHICLES': return 'Vehicle Fleet Inventory';
      case 'DRIVERS': return 'Driver Registry';
      case 'SUPERVISORS': return 'Site Supervisors Directory';
      case 'RUNNING_CHARTS': return 'Fleet Running Charts & Trips';
      case 'FUEL': return 'Fuel Records & Station Receipts';
      case 'EXPENSES':
      case 'CATEGORIES' as any:
      case 'EXPENSE_CATEGORIES' as any: return 'Expense Categories & GL Codes';
      case 'GEOFENCES': return 'Project Site Geofences';
      default: return `${mod} Directory`;
    }
  };

  const effectiveRecordType = recordType || (
    module === 'RUNNING_CHARTS' ? 'Trip Log' :
    module === 'FUEL' ? 'Fuel Record' :
    module === 'VEHICLES' ? 'Vehicle' :
    module === 'DRIVERS' ? 'Driver Profile' :
    module === 'PROJECTS' ? 'Project' :
    module === 'SUPERVISORS' ? 'Supervisor' :
    module === 'EXPENSES' ? 'Expense Voucher' :
    'Record'
  );

  const effectiveRecordTitle = recordTitle || (
    recordName
      ? (recordCode ? `${recordCode} - ${recordName}` : recordName)
      : (recordCode || recordId)
  );

  const actionDescription = selectedAction === 'HARD_DELETE'
    ? `Permanent deletion of ${effectiveRecordType} "${effectiveRecordTitle}" (${recordId}) from ${getModuleLabel(module)}`
    : `Soft deactivation/archiving of ${effectiveRecordType} "${effectiveRecordTitle}" (${recordId})`;

  const handleProceedToAuthorize = () => {
    setStep('AUTHORIZE');
    setErrorMsg('');
  };

  const handleExecuteDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityKey.trim()) {
      setErrorMsg('Admin Security Key is required.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      // 1. Verify key with centralized Admin Authorization Key Service
      const verification = await adminSecurityService.verifySecurityKey(
        securityKey,
        actionDescription,
        activeUser
      );

      if (!verification.success) {
        if (verification.isLockedOut && verification.lockoutRemainingSeconds) {
          setLockoutSec(verification.lockoutRemainingSeconds);
        }
        setErrorMsg(verification.message || 'Invalid Admin Authorization Key. Deletion cancelled.');
        
        // Log failed attempt audit
        adminSecurityService.recordAuditEvent({
          userId: activeUser.id,
          userName: activeUser.name,
          userRole: activeUser.role,
          action: 'DELETE_AUTHORIZATION_FAILED',
          targetRecord: `${module}:${recordId}`,
          result: 'FAILED',
          reason: `Failed delete authorization for ${recordType}: ${recordTitle} (${recordId}). ${verification.message}`
        });

        setIsProcessing(false);
        return;
      }

      // 2. Execute deletion / deactivation immediately
      if (selectedAction === 'DEACTIVATE' && onDeactivate) {
        await onDeactivate();
      } else {
        await onDelete();
      }

      // 3. Record verified audit event
      adminSecurityService.recordAuditEvent({
        userId: activeUser.id,
        userName: activeUser.name,
        userRole: activeUser.role,
        action: 'DELETE_EXECUTED',
        targetRecord: `${module}:${recordId}`,
        result: 'SUCCESS',
        reason: `${selectedAction === 'HARD_DELETE' ? 'Permanent hard delete' : 'Soft deactivation'} executed for ${effectiveRecordType} "${effectiveRecordTitle}" (${recordId}). Total linked dependencies: ${dependencyInfo.totalDependencies}.`
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(`Deletion execution failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="universal-delete-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="universal-delete-modal"
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border-red-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border bg-red-950/80 text-red-300 border-red-800">
                {getModuleLabel(module)}
              </span>
              <h3 className="text-base font-bold text-slate-100 tracking-tight mt-0.5">
                {step === 'CONFIRM' ? `Delete ${effectiveRecordType}` : 'Admin Authorization Required'}
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

        {/* STEP 1: CONFIRMATION & DEPENDENCY ANALYSIS */}
        {step === 'CONFIRM' ? (
          <div className="p-5 sm:p-6 space-y-4">
            {/* Record Identification Card */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Target {effectiveRecordType}:</span>
                <span className="font-mono text-cyan-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {recordCode || recordId}
                </span>
              </div>
              <h4 className="text-base font-bold text-white tracking-tight">{effectiveRecordTitle}</h4>
              {additionalDetails && (
                <p className="text-xs text-slate-400 pt-0.5">{additionalDetails}</p>
              )}
              {recordSummary && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                  {Object.entries(recordSummary).slice(0, 4).map(([k, v]) => (
                    <div key={k} className="truncate">
                      <span className="text-slate-500 capitalize">{k.replace(/_/g, ' ')}:</span>{' '}
                      <strong className="text-slate-300 font-medium">{String(v)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dependency Check Results */}
            {dependencyInfo.totalDependencies > 0 ? (
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Linked Historical Data Detected ({dependencyInfo.totalDependencies} records)</span>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  This record is referenced by operational ERP transactions. To preserve financial and audit integrity, deactivation is recommended.
                </p>
                <div className="space-y-1.5 pt-1">
                  {dependencyInfo.breakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-950/60 p-2 rounded-lg border border-amber-900/40">
                      <span className="text-slate-300 font-medium">{item.category}</span>
                      <span className="font-mono font-bold text-amber-400">{item.count} records</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero linked transactional dependencies found. Safe for permanent deletion.</span>
              </div>
            )}

            {/* Action Selection (if deactivation available) */}
            {onDeactivate && (
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Select Action Mode:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAction('DEACTIVATE')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                      selectedAction === 'DEACTIVATE'
                        ? 'bg-blue-950/60 border-blue-500 text-blue-200 ring-1 ring-blue-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-slate-200 mb-1">
                      <span className="flex items-center gap-1.5">
                        <Archive className="w-3.5 h-3.5 text-blue-400" />
                        Deactivate / Archive
                      </span>
                      {selectedAction === 'DEACTIVATE' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400">Preserves historical data & past logs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAction('HARD_DELETE')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                      selectedAction === 'HARD_DELETE'
                        ? 'bg-red-950/60 border-red-500 text-red-200 ring-1 ring-red-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-slate-200 mb-1">
                      <span className="flex items-center gap-1.5">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        Permanent Delete
                      </span>
                      {selectedAction === 'HARD_DELETE' && <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400">Irrevocably removes record</span>
                  </button>
                </div>
              </div>
            )}

            {/* Confirmation Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToAuthorize}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95 ${
                  selectedAction === 'HARD_DELETE'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/50'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-950/50'
                }`}
              >
                <span>Proceed to Authorization</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: ADMIN AUTHORIZATION KEY */
          <form onSubmit={handleExecuteDeletion} className="p-5 sm:p-6 space-y-4">
            <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <Lock className="w-3.5 h-3.5" />
                <span>Action: {selectedAction === 'HARD_DELETE' ? 'Permanent Delete' : 'Soft Deactivate'}</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">{actionDescription}</p>
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
                  id="input-delete-security-key"
                  type={showKey ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={securityKey}
                  onChange={(e) => {
                    setSecurityKey(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  disabled={lockoutSec > 0}
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 font-mono tracking-widest placeholder:tracking-normal placeholder-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all pr-12 disabled:opacity-50 text-center"
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

            {/* Footer with actions */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              <span>Authorized Admin: <strong className="text-slate-200">{activeUser.name}</strong></span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Direct Security Mode</span>
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep('CONFIRM')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Back
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  id="btn-authorize-and-delete"
                  type="submit"
                  disabled={isProcessing || !securityKey.trim() || lockoutSec > 0}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                    selectedAction === 'HARD_DELETE'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/50'
                      : 'bg-blue-600 hover:bg-blue-500 shadow-blue-950/50'
                  }`}
                >
                  {isProcessing ? (
                    <span>Verifying & Executing...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{selectedAction === 'HARD_DELETE' ? 'Authorize & Delete' : 'Authorize & Deactivate'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
