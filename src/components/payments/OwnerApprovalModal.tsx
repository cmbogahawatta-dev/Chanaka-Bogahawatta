import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Camera,
  FileText,
  AlertTriangle,
  Building2,
  DollarSign,
  UserCheck,
  Lock
} from 'lucide-react';
import { usePRV } from '../../context/PRVContext';
import { useEnterprise } from '../../context/EnterpriseContext';

interface OwnerApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OwnerApprovalModal: React.FC<OwnerApprovalModalProps> = ({ isOpen, onClose }) => {
  const {
    targetPRVForAction,
    ownerApprove,
    ownerReject,
    ownerReturn,
    openProofScannerForPRV
  } = usePRV();
  const { currentUser, currentRole } = useEnterprise();

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [comment, setComment] = useState('');
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'RETURN'>('APPROVE');
  const [reason, setReason] = useState('');

  if (!isOpen || !targetPRVForAction) return null;

  const prv = targetPRVForAction;

  const handleExecute = (thenScanProof: boolean = false) => {
    if (actionType === 'APPROVE') {
      if (!isConfirmed) {
        alert('Please check the confirmation box: "I confirm that I authorize this payment."');
        return;
      }
      ownerApprove(prv.id, comment.trim() || 'Authorized payment release by Owner');
      onClose();
      if (thenScanProof) {
        // Open scanner immediately
        setTimeout(() => {
          openProofScannerForPRV(prv);
        }, 200);
      }
    } else if (actionType === 'REJECT') {
      if (!reason.trim()) {
        alert('Please provide a mandatory reason for rejecting this payment voucher.');
        return;
      }
      ownerReject(prv.id, reason.trim());
      onClose();
    } else if (actionType === 'RETURN') {
      if (!reason.trim()) {
        alert('Please provide a mandatory clarification reason for returning this voucher to accounts.');
        return;
      }
      ownerReturn(prv.id, reason.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base">Owner Payment Authorization</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-mono font-bold">
                  {prv.prvNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Final authorization required before payment release & proof scan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-300">
          {/* PRV Summary Banner */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Purpose / Subject</span>
                <span className="font-bold text-slate-100 text-sm">{prv.purpose}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Amount Payable</span>
                <span className="font-mono font-black text-emerald-400 text-base">
                  {prv.currency} {prv.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Project</span>
                <span className="font-bold text-slate-200">{prv.projectCode}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Category</span>
                <span className="font-bold text-slate-200">{prv.expenseCategory}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Requested By</span>
                <span className="font-bold text-slate-200">{prv.requestedBy}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Priority</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    prv.priority === 'Urgent'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : prv.priority === 'High'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}
                >
                  {prv.priority}
                </span>
              </div>
            </div>

            {/* Payee Banking Box */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block">Payee</span>
                <span className="font-bold text-slate-200">{prv.payeeName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Bank / A/C</span>
                <span className="font-mono text-slate-300">{prv.bankName} - {prv.accountNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Method</span>
                <span className="font-bold text-purple-300">{prv.paymentMethod}</span>
              </div>
            </div>
          </div>

          {/* Verification & Approvals History */}
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Prior Accounts Verification History
            </span>
            <div className="space-y-1.5">
              {prv.approvals.map(app => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-200">{app.approvalLevel.replace('_', ' ')}</span>
                      <span className="text-slate-400 mx-1.5">by</span>
                      <span className="text-purple-300 font-medium">{app.approverName}</span>
                      <p className="text-[10px] text-slate-400 italic mt-0.5">"{app.comment}"</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">{app.approvedAt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Choice Tabs */}
          <div className="space-y-2 pt-1">
            <label className="block text-slate-300 font-bold">Select Decision:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActionType('APPROVE')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  actionType === 'APPROVE'
                    ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-500/50'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Authorize Payment</span>
              </button>
              <button
                type="button"
                onClick={() => setActionType('RETURN')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  actionType === 'RETURN'
                    ? 'bg-amber-600 text-white shadow-lg ring-2 ring-amber-500/50'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Return to Accounts</span>
              </button>
              <button
                type="button"
                onClick={() => setActionType('REJECT')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  actionType === 'REJECT'
                    ? 'bg-rose-600 text-white shadow-lg ring-2 ring-rose-500/50'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject Voucher</span>
              </button>
            </div>
          </div>

          {/* Explicit Confirmation Checkbox (FOR APPROVE) */}
          {actionType === 'APPROVE' && (
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-950/40 border-2 border-amber-600/60 cursor-pointer select-none hover:bg-amber-950/60 transition-colors">
                <input
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer shrink-0"
                />
                <div>
                  <span className="font-bold text-amber-200 text-xs block">
                    I confirm that I authorize this payment.
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    By checking this box, you authorize the disbursement of <strong>{prv.currency} {prv.totalAmount.toLocaleString()}</strong> to <strong>{prv.payeeName}</strong>. Payment status will transition to <em>Owner Approved (Payment Proof Pending)</em>.
                  </span>
                </div>
              </label>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Owner Authorization Remarks (Optional)</label>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g. Authorized. Process wire transfer and attach bank slip."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Reason Input (FOR REJECT / RETURN) */}
          {(actionType === 'REJECT' || actionType === 'RETURN') && (
            <div className="space-y-2 pt-2">
              <label className="block text-slate-300 font-bold">
                {actionType === 'REJECT' ? 'Reason for Rejection *' : 'Reason for Return to Accounts *'}
              </label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  actionType === 'REJECT'
                    ? 'Explain why this payment request is rejected...'
                    : 'Detail what additional documentation or rate adjustment is needed...'
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-rose-500 focus:outline-none text-xs"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400">
            Authorizing as: <strong className="text-amber-400">{currentUser} (Owner)</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Cancel
            </button>

            {actionType === 'APPROVE' ? (
              <>
                <button
                  type="button"
                  onClick={() => handleExecute(false)}
                  disabled={!isConfirmed}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                    isConfirmed
                      ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-700 cursor-pointer'
                      : 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-800'
                  }`}
                >
                  Authorize Only
                </button>
                <button
                  type="button"
                  onClick={() => handleExecute(true)}
                  disabled={!isConfirmed}
                  className={`px-5 py-2 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 text-xs flex items-center gap-2 ${
                    isConfirmed
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/30 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Authorize & Scan Proof Now</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleExecute(false)}
                className={`px-5 py-2 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 text-xs ${
                  actionType === 'REJECT'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                {actionType === 'REJECT' ? 'Confirm Rejection' : 'Return Voucher to Accounts'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
