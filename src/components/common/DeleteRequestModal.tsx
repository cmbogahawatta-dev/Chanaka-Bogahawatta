import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  KeyRound,
  Layers,
  ArrowRight,
  Info,
  X,
  FileText,
  Lock
} from 'lucide-react';
import { DataManagementModule, DeleteRequest } from '../../types/dataManagementTypes';
import { useDataManagement } from '../../context/DataManagementContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { AdminSecurityService } from '../../services/adminSecurityService';

interface DeleteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: DataManagementModule;
  recordType: string;
  recordId: string;
  recordTitle: string;
  recordSummary?: Record<string, any>;
  onDirectDeleteSuccess?: () => void;
}

export const DeleteRequestModal: React.FC<DeleteRequestModalProps> = ({
  isOpen,
  onClose,
  module,
  recordType,
  recordId,
  recordTitle,
  recordSummary,
  onDirectDeleteSuccess
}) => {
  const { currentRole, currentUser } = useEnterprise();
  const {
    analyzeDependencies,
    getRuleForModule,
    submitDeleteRequest,
    approveAndExecuteDelete
  } = useDataManagement();

  const [reason, setReason] = useState('');
  const [justificationType, setJustificationType] = useState<DeleteRequest['justificationType']>('DATA_CLEANUP');
  const [adminActionType, setAdminActionType] = useState<'HARD_DELETE' | 'DEACTIVATE' | 'ARCHIVE'>('HARD_DELETE');
  const [isDirectDelete, setIsDirectDelete] = useState(true);
  const [securityPin, setSecurityPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const rule = getRuleForModule(module);
  const dependencyAnalysis = analyzeDependencies(module, recordId);
  const isAdmin = currentRole === 'ADMIN' || currentRole === 'OWNER';

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setSecurityPin('');
      setPinError(null);
      setSubmitSuccess(false);
      setSuccessMessage('');
      setAdminActionType(dependencyAnalysis.canHardDelete ? 'HARD_DELETE' : 'DEACTIVATE');
      setIsDirectDelete(isAdmin);
    }
  }, [isOpen, module, recordId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    if (reason.trim().length < rule.minJustificationLength) {
      setPinError(`Please provide at least ${rule.minJustificationLength} characters of justification reason.`);
      return;
    }

    // Direct Admin Execution path
    if (isAdmin && isDirectDelete) {
      if (rule.requiresSecurityPinForDelete) {
        if (!securityPin.trim()) {
          setPinError('Admin Security PIN / Key is required for high-risk directory deletion.');
          return;
        }

        setIsVerifying(true);
        const authRes = await AdminSecurityService.verifySecurityKey(
          securityPin.trim(),
          `Directory Deletion: ${module} (${recordTitle})`,
          {
            id: 'admin',
            name: currentUser || 'Administrator',
            role: currentRole
          }
        );
        setIsVerifying(false);

        if (!authRes.success) {
          setPinError(authRes.message || 'Invalid Admin Security Key.');
          return;
        }
      }

      // First create request record, then immediately execute
      const createdReq = submitDeleteRequest({
        module,
        recordType,
        recordId,
        recordTitle,
        recordSummary,
        reason,
        justificationType,
        requestedBy: {
          userId: 'admin',
          userName: currentUser || 'Administrator',
          userRole: currentRole
        }
      });

      const execRes = approveAndExecuteDelete({
        requestId: createdReq.id,
        action: adminActionType,
        reviewer: {
          userId: 'admin',
          userName: currentUser || 'Administrator',
          userRole: currentRole
        },
        adminComment: `Direct execution by ${currentUser || 'Admin'} (${reason})`,
        securityVerified: true
      });

      if (execRes.success) {
        setSuccessMessage(execRes.message);
        setSubmitSuccess(true);
        if (onDirectDeleteSuccess) {
          setTimeout(() => {
            onDirectDeleteSuccess();
            onClose();
          }, 1200);
        }
      } else {
        setPinError(execRes.message);
      }
    } else {
      // Submit Request for Admin Approval Path
      const req = submitDeleteRequest({
        module,
        recordType,
        recordId,
        recordTitle,
        recordSummary,
        reason,
        justificationType,
        requestedBy: {
          userId: 'staff',
          userName: currentUser || 'Staff User',
          userRole: currentRole
        }
      });

      setSuccessMessage(`Delete request ${req.deleteRequestId} has been submitted to the Admin Approval Centre for multi-tier verification.`);
      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                {isAdmin && isDirectDelete ? `Confirm ${adminActionType === 'HARD_DELETE' ? 'Permanent Deletion' : adminActionType === 'DEACTIVATE' ? 'Deactivation' : 'Archiving'}` : 'Submit Delete Request'}
              </h3>
              <p className="text-xs text-slate-400">
                {recordType}: <span className="font-mono font-bold text-slate-200">{recordTitle}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-100">Operation Successful</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Dependency Warning Banner */}
            {dependencyAnalysis.totalDependencies > 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/80 space-y-2 text-xs">
                <div className="flex items-start gap-2 text-amber-300 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>Referential Integrity Alert: {dependencyAnalysis.totalDependencies} Linked Records Detected</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed pl-6">
                  {dependencyAnalysis.warningMessage}
                </p>
                <div className="pl-6 pt-1 flex flex-wrap gap-1.5">
                  {dependencyAnalysis.breakdown.map((item, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-900/60 border border-amber-700/60 text-[10px] font-mono text-amber-200">
                      {item.category}: <strong>{item.count}</strong>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero dependencies detected. This record can be safely removed.</span>
              </div>
            )}

            {/* Action Type Selector (for Admins) */}
            {isAdmin && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">Action Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdminActionType('HARD_DELETE')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                      adminActionType === 'HARD_DELETE'
                        ? 'bg-rose-950/60 border-rose-600 text-rose-300 ring-1 ring-rose-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="block font-bold">Hard Delete</span>
                    <span className="block text-[10px] text-slate-500 font-normal">Permanently purge</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminActionType('DEACTIVATE')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                      adminActionType === 'DEACTIVATE'
                        ? 'bg-amber-950/60 border-amber-600 text-amber-300 ring-1 ring-amber-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="block font-bold">Deactivate</span>
                    <span className="block text-[10px] text-slate-500 font-normal">Mark Inactive</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminActionType('ARCHIVE')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                      adminActionType === 'ARCHIVE'
                        ? 'bg-blue-950/60 border-blue-600 text-blue-300 ring-1 ring-blue-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="block font-bold">Archive</span>
                    <span className="block text-[10px] text-slate-500 font-normal">Historical hold</span>
                  </button>
                </div>
              </div>
            )}

            {/* Justification Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Justification Category *</label>
                <select
                  value={justificationType}
                  onChange={e => setJustificationType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                >
                  <option value="DATA_CLEANUP">Routine Data Cleanup</option>
                  <option value="DUPLICATE">Duplicate Entry</option>
                  <option value="ERRONEOUS_ENTRY">Erroneous / Incorrect Entry</option>
                  <option value="CONTRACT_TERMINATION">Contract Termination / Resignation</option>
                  <option value="OBSOLETE">Obsolete / Decommissioned Asset</option>
                  <option value="OTHER">Other Operational Justification</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Execution Mode</label>
                <div className="flex items-center gap-2 p-1.5 bg-slate-950 border border-slate-800 rounded-xl">
                  {isAdmin ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsDirectDelete(true)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isDirectDelete ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Direct Execute
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDirectDelete(false)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          !isDirectDelete ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Submit Request
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 px-2 py-1">Submit for Admin Approval</span>
                  )}
                </div>
              </div>
            </div>

            {/* Reason Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Reason & Justification * (Min {rule.minJustificationLength} chars)
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={`Explain why this ${recordType} is being deleted or deactivated...`}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
                required
              />
            </div>

            {/* Admin Security PIN Verification (when Direct Delete & rule requires) */}
            {isAdmin && isDirectDelete && rule.requiresSecurityPinForDelete && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-rose-400" />
                    <span>Admin Security Key / PIN Verification *</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Salted SHA-256</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Enter your master security key to authorize this deletion in the system audit trail.
                </p>
                <input
                  type="password"
                  value={securityPin}
                  onChange={e => setSecurityPin(e.target.value)}
                  placeholder="Enter Admin Security Key..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>
            )}

            {/* Error Message */}
            {pinError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 flex items-center gap-2 text-xs text-rose-300">
                <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{pinError}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifying}
                className={`px-5 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all ${
                  isAdmin && isDirectDelete
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                    : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50'
                }`}
              >
                {isVerifying ? (
                  <span>Verifying...</span>
                ) : isAdmin && isDirectDelete ? (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Authorize & Execute {adminActionType.replace('_', ' ')}</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    <span>Submit Delete Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
