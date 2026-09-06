import React, { useEffect } from 'react';
import {
  FileText,
  UserCheck,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Camera,
  Plus
} from 'lucide-react';
import { usePRV } from '../../context/PRVContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { PRVSubMenu } from '../../types/prvTypes';

// Sub-views
import { PRVListView } from './views/PRVListView';
import { MyRequestsView } from './views/MyRequestsView';
import { PendingApprovalsView } from './views/PendingApprovalsView';
import { OwnerApprovalDashboard } from './views/OwnerApprovalDashboard';
import { CompletedPaymentsView } from './views/CompletedPaymentsView';

// Modals
import { CreatePRVModal } from './CreatePRVModal';
import { PaymentProofScannerModal } from './PaymentProofScannerModal';
import { OwnerApprovalModal } from './OwnerApprovalModal';
import { PRVDetailModal } from './PRVDetailModal';

interface PaymentsViewProps {
  initialTab?: PRVSubMenu;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({ initialTab }) => {
  const {
    activeSubTab,
    setActiveSubTab,
    metrics,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isScannerModalOpen,
    setIsScannerModalOpen,
    isOwnerApprovalModalOpen,
    setIsOwnerApprovalModalOpen,
    isDetailModalOpen,
    setIsDetailModalOpen,
    paymentRequests,
    paymentProofs
  } = usePRV();

  const { currentUser, setCurrentModule } = useEnterprise();

  // Ensure activeSubTab is strictly one of the 5 PRV & Disbursements sub features
  const validPRVTabs = ['vouchers', 'my_requests', 'pending_approvals', 'payment_approvals', 'completed_payments'];
  const currentPRVTab = validPRVTabs.includes(activeSubTab) ? activeSubTab : 'vouchers';

  // Sync initial tab from props or route
  useEffect(() => {
    if (initialTab && validPRVTabs.includes(initialTab)) {
      setActiveSubTab(initialTab);
    } else if (!validPRVTabs.includes(activeSubTab)) {
      setActiveSubTab('vouchers');
    }
  }, [initialTab, activeSubTab, setActiveSubTab]);

  const myRequestsCount = paymentRequests.filter(
    p => p.requestedBy.toUpperCase() === (currentUser || '').toUpperCase()
  ).length;

  const pendingPRVsTotal = metrics.pendingAccountsL1Count + metrics.pendingAccountsL2Count + metrics.pendingOwnerCount;

  return (
    <div className="space-y-4 w-full">
      {/* 0. PRV & DISBURSEMENTS HORIZONTAL NAVIGATION RIBBON (EXCLUSIVELY PRV & DISBURSEMENT SUB-FEATURES) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 text-xs shadow-sm">
          {/* Sub-Feature 1: Payment Request Vouchers (PRV) */}
          <button
            id="tab-prv-vouchers"
            type="button"
            onClick={() => setActiveSubTab('vouchers')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              currentPRVTab === 'vouchers'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Payment Request Vouchers</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              currentPRVTab === 'vouchers'
                ? 'bg-rose-950 text-rose-200 border border-rose-400/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {metrics.totalRequests}
            </span>
          </button>

          {/* Sub-Feature 2: My Payment Requests */}
          <button
            id="tab-prv-my-requests"
            type="button"
            onClick={() => setActiveSubTab('my_requests')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              currentPRVTab === 'my_requests'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>My Payment Requests</span>
            {myRequestsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                currentPRVTab === 'my_requests'
                  ? 'bg-indigo-950 text-indigo-200 border border-indigo-400/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {myRequestsCount}
              </span>
            )}
          </button>

          {/* Sub-Feature 3: Pending Approvals */}
          <button
            id="tab-prv-pending-approvals"
            type="button"
            onClick={() => setActiveSubTab('pending_approvals')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              currentPRVTab === 'pending_approvals'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Approvals</span>
            {pendingPRVsTotal > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                currentPRVTab === 'pending_approvals'
                  ? 'bg-blue-950 text-blue-200 border border-blue-400/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {pendingPRVsTotal}
              </span>
            )}
          </button>

          {/* Sub-Feature 4: Director Sign-Off */}
          <button
            id="tab-prv-director-signoff"
            type="button"
            onClick={() => setActiveSubTab('payment_approvals')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              currentPRVTab === 'payment_approvals'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Director Sign-Off</span>
            {metrics.pendingOwnerCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono animate-pulse ${
                currentPRVTab === 'payment_approvals'
                  ? 'bg-amber-950 text-amber-200 border border-amber-400/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {metrics.pendingOwnerCount}
              </span>
            )}
          </button>

          {/* Sub-Feature 5: Completed Payments */}
          <button
            id="tab-prv-completed-payments"
            type="button"
            onClick={() => setActiveSubTab('completed_payments')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              currentPRVTab === 'completed_payments'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed Payments</span>
            {metrics.paidCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                currentPRVTab === 'completed_payments'
                  ? 'bg-teal-950 text-teal-200 border border-teal-400/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {metrics.paidCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-950/50 flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New PRV</span>
          </button>
          <button
            type="button"
            onClick={() => setIsScannerModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <Camera className="w-3.5 h-3.5 text-blue-400" />
            <span>Scan Slip</span>
          </button>
        </div>
      </div>

      {/* PRV SUB-FEATURE ROUTING */}
      {currentPRVTab === 'vouchers' && <PRVListView />}
      {currentPRVTab === 'my_requests' && <MyRequestsView />}
      {currentPRVTab === 'pending_approvals' && <PendingApprovalsView />}
      {currentPRVTab === 'payment_approvals' && <OwnerApprovalDashboard />}
      {currentPRVTab === 'completed_payments' && <CompletedPaymentsView />}

      {/* MODALS */}
      <CreatePRVModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <PaymentProofScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
      />

      <OwnerApprovalModal
        isOpen={isOwnerApprovalModalOpen}
        onClose={() => setIsOwnerApprovalModalOpen(false)}
      />

      <PRVDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
};
