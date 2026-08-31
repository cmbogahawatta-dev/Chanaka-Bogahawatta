import React, { useState } from 'react';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  FileText,
  Building2,
  DollarSign,
  AlertTriangle,
  User,
  Paperclip,
  Check
} from 'lucide-react';
import { usePRV } from '../../../context/PRVContext';
import { useEnterprise } from '../../../context/EnterpriseContext';
import { PaymentRequestVoucher } from '../../../types/prvTypes';

export const PendingApprovalsView: React.FC = () => {
  const {
    paymentRequests,
    accountsL1Approve,
    accountsL1Reject,
    accountsL1Return,
    accountsL2Approve,
    accountsL2Reject,
    accountsL2Return,
    setSelectedPRV,
    setIsDetailModalOpen
  } = usePRV();

  const { currentUser, currentRole } = useEnterprise();

  // Active Queue Tab: 'L1' (Review by Accounts) vs 'L2' (Review by Senior Finance)
  const [activeQueue, setActiveQueue] = useState<'L1' | 'L2'>('L1');

  // Quick Action Modal State
  const [actionTarget, setActionTarget] = useState<PaymentRequestVoucher | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'RETURN' | 'REJECT' | null>(null);
  const [comment, setComment] = useState('');

  const l1Queue = paymentRequests.filter(p => p.status === 'SUBMITTED');
  const l2Queue = paymentRequests.filter(p => p.status === 'ACCOUNTS_L1_APPROVED');

  const currentList = activeQueue === 'L1' ? l1Queue : l2Queue;

  const handleOpenDetail = (prv: PaymentRequestVoucher) => {
    setSelectedPRV(prv);
    setIsDetailModalOpen(true);
  };

  const handleConfirmAction = () => {
    if (!actionTarget || !actionType) return;

    if (activeQueue === 'L1') {
      if (actionType === 'APPROVE') {
        accountsL1Approve(actionTarget.id, comment.trim() || 'Verified by Accounts Level 1');
      } else if (actionType === 'RETURN') {
        if (!comment.trim()) {
          alert('Please enter a clarification reason for returning the request.');
          return;
        }
        accountsL1Return(actionTarget.id, comment.trim());
      } else if (actionType === 'REJECT') {
        if (!comment.trim()) {
          alert('Please enter a reason for rejection.');
          return;
        }
        accountsL1Reject(actionTarget.id, comment.trim());
      }
    } else {
      if (actionType === 'APPROVE') {
        accountsL2Approve(actionTarget.id, comment.trim() || 'Budget verified by Financial Controller (Level 2)');
      } else if (actionType === 'RETURN') {
        if (!comment.trim()) {
          alert('Please enter a clarification reason for returning the request.');
          return;
        }
        accountsL2Return(actionTarget.id, comment.trim());
      } else if (actionType === 'REJECT') {
        if (!comment.trim()) {
          alert('Please enter a reason for rejection.');
          return;
        }
        accountsL2Reject(actionTarget.id, comment.trim());
      }
    }

    setActionTarget(null);
    setActionType(null);
    setComment('');
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-100">Accounts Approval Workspace</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 text-[11px] font-mono font-bold">
              {l1Queue.length + l2Queue.length} Pending Accounts Verification
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Accounts verification queue: Level 1 voucher verification & Level 2 budget authorization.
          </p>
        </div>

        {/* Level Tabs */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveQueue('L1')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-all ${
              activeQueue === 'L1'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Accounts Level 1 ({l1Queue.length})</span>
          </button>

          <button
            onClick={() => setActiveQueue('L2')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-all ${
              activeQueue === 'L2'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Accounts Level 2 ({l2Queue.length})</span>
          </button>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-3">
        {currentList.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 opacity-60" />
            <h3 className="font-bold text-slate-200 text-sm">
              All Clear! No Pending Requests in {activeQueue === 'L1' ? 'Level 1 Queue' : 'Level 2 Queue'}
            </h3>
            <p className="text-xs text-slate-500">
              New payment requests submitted by site supervisors and project managers will appear here for verification.
            </p>
          </div>
        ) : (
          currentList.map(prv => (
            <div
              key={prv.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition-all space-y-4 shadow-md"
            >
              {/* Top Row: PRV Number, Priority, Amount */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-purple-300 text-sm">{prv.prvNumber}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      prv.priority === 'Urgent'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : prv.priority === 'High'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {prv.priority} Priority
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Requested on {prv.requestDate} by <strong className="text-slate-300">{prv.requestedBy}</strong>
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Payable Amount</span>
                  <div className="font-mono font-black text-emerald-400 text-base">
                    {prv.currency} {prv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Middle Grid: Purpose, Payee, Project Allocation, Attachments */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold block">Purpose / Description</span>
                  <p className="font-bold text-slate-100">{prv.purpose}</p>
                  <p className="text-slate-400 text-[11px] line-clamp-2">{prv.description}</p>
                </div>

                <div className="space-y-1 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-emerald-400 font-semibold block">Beneficiary & Banking</span>
                  <p className="font-bold text-slate-200">{prv.payeeName} ({prv.payeeType})</p>
                  <p className="font-mono text-slate-400 text-[11px] truncate">
                    {prv.bankName} - {prv.accountNumber}
                  </p>
                  <p className="text-purple-300 text-[10px] font-semibold">Method: {prv.paymentMethod}</p>
                </div>

                <div className="space-y-1 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-purple-400 font-semibold block">Project & Cost Allocation</span>
                  <p className="font-bold text-slate-200">{prv.projectCode} • {prv.department}</p>
                  <p className="text-slate-400 text-[11px] truncate">{prv.expenseCategory}</p>
                  <div className="flex items-center gap-1 text-[10px] text-blue-300 font-semibold mt-1">
                    <Paperclip className="w-3 h-3" />
                    <span>{prv.attachments.length} Supporting Documents</span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => handleOpenDetail(prv)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Full Voucher & Documents</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActionTarget(prv);
                      setActionType('RETURN');
                      setComment('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Return</span>
                  </button>

                  <button
                    onClick={() => {
                      setActionTarget(prv);
                      setActionType('REJECT');
                      setComment('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 font-bold text-xs flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => {
                      setActionTarget(prv);
                      setActionType('APPROVE');
                      setComment('');
                    }}
                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{activeQueue === 'L1' ? 'Accounts L1 Approve' : 'Accounts L2 Approve'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation & Comment Modal */}
      {actionTarget && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm">
                {actionType === 'APPROVE'
                  ? `Approve Voucher (${actionTarget.prvNumber})`
                  : actionType === 'RETURN'
                  ? `Return Voucher (${actionTarget.prvNumber}) to Requester`
                  : `Reject Voucher (${actionTarget.prvNumber})`}
              </h3>
              <button
                onClick={() => {
                  setActionTarget(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-slate-300">
              <p className="text-xs">
                {actionType === 'APPROVE'
                  ? `Confirm approval of ${actionTarget.currency} ${actionTarget.totalAmount.toLocaleString()} for ${actionTarget.payeeName}.`
                  : 'Please specify the exact notes or reason for this decision:'}
              </p>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 text-xs">
                  {actionType === 'APPROVE' ? 'Approval Comments (Optional)' : 'Reason *'}
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    actionType === 'APPROVE'
                      ? 'e.g. Verified quantity and pricing against delivery chit.'
                      : 'e.g. Missing signed delivery chit or rate exceeds contract.'
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 text-xs focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActionTarget(null);
                  setActionType(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`px-5 py-2 rounded-xl font-bold text-white shadow-lg text-xs ${
                  actionType === 'APPROVE'
                    ? 'bg-purple-600 hover:bg-purple-500'
                    : actionType === 'RETURN'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                Confirm {actionType}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
