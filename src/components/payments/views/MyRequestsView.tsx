import React from 'react';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Camera,
  RotateCcw,
  Send
} from 'lucide-react';
import { usePRV } from '../../../context/PRVContext';
import { useEnterprise } from '../../../context/EnterpriseContext';
import { PaymentRequestVoucher } from '../../../types/prvTypes';

export const MyRequestsView: React.FC = () => {
  const {
    paymentRequests,
    setIsCreateModalOpen,
    setSelectedPRV,
    setIsDetailModalOpen,
    submitDraftRequest,
    openProofScannerForPRV
  } = usePRV();

  const { currentUser, currentRole } = useEnterprise();

  // Filter to requests by current user
  const myRequests = paymentRequests.filter(
    p => p.requestedBy.trim().toUpperCase() === currentUser.trim().toUpperCase()
  );

  const drafts = myRequests.filter(p => p.status === 'DRAFT');
  const inReview = myRequests.filter(
    p => p.status === 'SUBMITTED' || p.status === 'ACCOUNTS_L1_APPROVED' || p.status === 'ACCOUNTS_L2_APPROVED'
  );
  const approvedOrProof = myRequests.filter(
    p => p.status === 'OWNER_APPROVED' || p.status === 'PAYMENT_PROOF_PENDING'
  );
  const paid = myRequests.filter(p => p.status === 'PAID');
  const returnedOrRejected = myRequests.filter(
    p => p.status.includes('RETURNED') || p.status.includes('REJECTED')
  );

  const handleOpenDetail = (prv: PaymentRequestVoucher) => {
    setSelectedPRV(prv);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-100">My Payment Requests</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-[11px] font-mono font-bold">
              {myRequests.length} Submitted by {currentUser}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Track all your payment vouchers, draft submissions, approval feedback, and payment release confirmations.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-bold shadow-lg active:scale-95 transition-all text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Payment Request</span>
        </button>
      </div>

      {/* Summary Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Drafts</span>
          <div className="text-sm font-bold text-slate-300 font-mono">{drafts.length}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-purple-400 font-bold uppercase">In Review</span>
          <div className="text-sm font-bold text-purple-300 font-mono">{inReview.length}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-amber-400 font-bold uppercase">Owner Approved</span>
          <div className="text-sm font-bold text-amber-300 font-mono">{approvedOrProof.length}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-emerald-400 font-bold uppercase">Completed & Paid</span>
          <div className="text-sm font-bold text-emerald-400 font-mono">{paid.length}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-rose-400 font-bold uppercase">Returned / Rejected</span>
          <div className="text-sm font-bold text-rose-400 font-mono">{returnedOrRejected.length}</div>
        </div>
      </div>

      {/* List of My Requests */}
      <div className="space-y-3">
        {myRequests.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
            <FileText className="w-10 h-10 mx-auto opacity-40 text-purple-400" />
            <h3 className="font-bold text-slate-200 text-sm">No Payment Requests Created Yet</h3>
            <p className="max-w-md mx-auto text-xs">
              You have not created any payment request vouchers under user account <strong>{currentUser}</strong>. Click below to submit your first voucher for site expenses, materials, or supplier payments.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Payment Request</span>
            </button>
          </div>
        ) : (
          myRequests.map(prv => (
            <div
              key={prv.id}
              onClick={() => handleOpenDetail(prv)}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all cursor-pointer space-y-3 shadow-md group"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-purple-300 text-sm">{prv.prvNumber}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      prv.status === 'PAID'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : prv.status === 'OWNER_APPROVED'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : prv.status.includes('REJECTED')
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : prv.status.includes('RETURNED')
                        ? 'bg-orange-950 text-orange-300 border border-orange-800'
                        : 'bg-purple-950 text-purple-300 border border-purple-800'
                    }`}
                  >
                    {prv.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">• {prv.requestDate}</span>
                </div>

                <div className="font-mono font-bold text-sm text-slate-100">
                  <span className="text-xs text-slate-400 font-normal mr-1">{prv.currency}</span>
                  {prv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-slate-300 pt-1 border-t border-slate-800/80">
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-slate-500 block font-semibold">Purpose / Payee</span>
                  <span className="font-bold text-slate-100 block group-hover:text-purple-200">{prv.purpose}</span>
                  <span className="text-[10px] text-emerald-400 block truncate">Payee: {prv.payeeName}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">Project / Category</span>
                  <span className="font-semibold text-slate-200">{prv.projectCode}</span>
                  <span className="text-[10px] text-slate-400 block truncate">{prv.expenseCategory}</span>
                </div>

                <div className="flex items-center justify-end gap-1.5 self-center" onClick={(e) => e.stopPropagation()}>
                  {prv.status === 'DRAFT' && (
                    <button
                      onClick={() => submitDraftRequest(prv.id)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit</span>
                    </button>
                  )}

                  {(prv.status === 'OWNER_APPROVED' || prv.status === 'PAYMENT_PROOF_PENDING') && (
                    <button
                      onClick={() => openProofScannerForPRV(prv)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Scan Proof</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenDetail(prv)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
