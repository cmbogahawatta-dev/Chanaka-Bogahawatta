import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Camera,
  Eye,
  FileText,
  Building2,
  DollarSign,
  AlertTriangle,
  Lock,
  Layers,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { usePRV } from '../../../context/PRVContext';
import { useEnterprise } from '../../../context/EnterpriseContext';
import { PaymentRequestVoucher } from '../../../types/prvTypes';

export const OwnerApprovalDashboard: React.FC = () => {
  const {
    paymentRequests,
    openOwnerApprovalForPRV,
    openProofScannerForPRV,
    setSelectedPRV,
    setIsDetailModalOpen
  } = usePRV();

  const { currentUser, currentRole } = useEnterprise();

  // Vouchers pending Owner Authorization
  const pendingOwnerVouchers = paymentRequests.filter(p => p.status === 'ACCOUNTS_L2_APPROVED');

  // Vouchers already Owner Approved, awaiting Payment Proof scan/upload
  const proofPendingVouchers = paymentRequests.filter(
    p => p.status === 'OWNER_APPROVED' || p.status === 'PAYMENT_PROOF_PENDING'
  );

  // Totals
  const totalPendingOwnerSum = pendingOwnerVouchers.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalProofPendingSum = proofPendingVouchers.reduce((sum, p) => sum + p.totalAmount, 0);

  const handleOpenDetail = (prv: PaymentRequestVoucher) => {
    setSelectedPRV(prv);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Executive Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-800/60 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              Owner Payment Approval & Authorization Center
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-mono font-bold">
              {pendingOwnerVouchers.length} Awaiting Authorization
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            "Approved ≠ Paid" workflow: Final fund authorization by Managing Director / Business Owner. Once approved, scanning/uploading the payment proof executes the payment and automatically creates the linked Project Expense.
          </p>
        </div>

        {/* Executive Quick Stats */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-800/60 text-right min-w-[170px]">
            <span className="text-[10px] text-amber-400 uppercase font-bold block">Authorized Sum Pending</span>
            <div className="text-lg font-mono font-black text-amber-300">
              AED {totalPendingOwnerSum.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-800/60 text-right min-w-[170px]">
            <span className="text-[10px] text-emerald-400 uppercase font-bold block">Awaiting Proof Scan</span>
            <div className="text-lg font-mono font-black text-emerald-300">
              AED {totalProofPendingSum.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: VOUCHERS AWAITING OWNER AUTHORIZATION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-slate-200 text-sm">
              1. Awaiting Owner Authorization ({pendingOwnerVouchers.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">All Level 1 & Level 2 accounts checks cleared</span>
        </div>

        {pendingOwnerVouchers.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 opacity-60" />
            <p className="font-semibold text-slate-300">No payment vouchers currently awaiting Owner authorization.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingOwnerVouchers.map(prv => (
              <div
                key={prv.id}
                className="bg-slate-900 border border-amber-900/60 hover:border-amber-700/80 rounded-2xl p-4 sm:p-5 transition-all space-y-4 shadow-lg"
              >
                {/* Header Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-amber-300 text-sm">{prv.prvNumber}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">
                      {prv.priority} Priority
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Project: <strong className="text-slate-200">{prv.projectCode}</strong> • Category: <strong className="text-slate-200">{prv.expenseCategory}</strong>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Authorized Amount</span>
                    <div className="font-mono font-black text-emerald-400 text-base">
                      {prv.currency} {prv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold block">Purpose & Requested By</span>
                    <p className="font-bold text-slate-100 text-xs">{prv.purpose}</p>
                    <p className="text-slate-400 text-[11px] line-clamp-2">{prv.description}</p>
                    <p className="text-[10px] text-purple-300 pt-1">
                      Requested by {prv.requestedBy} ({prv.department})
                    </p>
                  </div>

                  <div className="space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-emerald-400 font-semibold block">Payee & Bank Coordinates</span>
                    <p className="font-bold text-slate-200 text-xs">{prv.payeeName}</p>
                    <p className="font-mono text-slate-300 text-[11px]">{prv.bankName}</p>
                    <p className="font-mono text-slate-400 text-[11px]">A/C: {prv.accountNumber || 'N/A'}</p>
                    {prv.iban && <p className="font-mono text-slate-400 text-[10px]">IBAN: {prv.iban}</p>}
                    <p className="text-purple-300 text-[10px] font-semibold mt-1">Method: {prv.paymentMethod}</p>
                  </div>

                  <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-purple-400 font-semibold block">Accounts Approval Endorsement</span>
                    {prv.approvals.map(app => (
                      <div key={app.id} className="text-[11px] border-b border-slate-800/60 pb-1 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">{app.approvalLevel.replace('_', ' ')}</span>
                          <span className="text-[10px] text-emerald-400 font-mono">Passed</span>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">"{app.comment}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Owner Decision Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleOpenDetail(prv)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Supporting Attachments ({prv.attachments.length})</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openOwnerApprovalForPRV(prv)}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Authorize Payment</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: VOUCHERS AUTHORIZED & READY FOR PAYMENT PROOF SCAN */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-slate-200 text-sm">
              2. Owner Approved — Payment Proof Scan Required ({proofPendingVouchers.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">Payment is finalized once proof receipt is scanned/uploaded</span>
        </div>

        {proofPendingVouchers.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
            <p className="text-xs">No vouchers currently waiting for payment proof.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {proofPendingVouchers.map(prv => (
              <div
                key={prv.id}
                className="bg-slate-900 border border-emerald-900/60 rounded-2xl p-4 space-y-3 shadow-md flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-300">{prv.prvNumber}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                        Owner Authorized
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-100 text-xs mt-1">{prv.purpose}</h4>
                    <p className="text-[11px] text-slate-400">Payee: <strong className="text-slate-200">{prv.payeeName}</strong> ({prv.bankName})</p>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-black text-emerald-400 text-sm block">
                      {prv.currency} {prv.totalAmount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">{prv.projectCode}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Proof Document Required</span>
                  </span>

                  <button
                    onClick={() => openProofScannerForPRV(prv)}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 active:scale-95"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Scan Proof & Post Expense</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
