import React, { useState } from 'react';
import {
  FileText,
  UserCheck,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Camera,
  Layers,
  LayoutDashboard,
  Plus,
  ArrowRight
} from 'lucide-react';
import { usePRV } from '../../context/PRVContext';
import { useEnterprise } from '../../context/EnterpriseContext';

// Sub-views
import { PRVListView } from './views/PRVListView';
import { MyRequestsView } from './views/MyRequestsView';
import { PendingApprovalsView } from './views/PendingApprovalsView';
import { OwnerApprovalDashboard } from './views/OwnerApprovalDashboard';
import { CompletedPaymentsView } from './views/CompletedPaymentsView';
import { PaymentProofGalleryView } from './views/PaymentProofGalleryView';
import { LinkedProjectExpensesView } from './views/LinkedProjectExpensesView';
import { PaymentAnalyticsDashboard } from './views/PaymentAnalyticsDashboard';

// Modals
import { CreatePRVModal } from './CreatePRVModal';
import { PaymentProofScannerModal } from './PaymentProofScannerModal';
import { OwnerApprovalModal } from './OwnerApprovalModal';
import { PRVDetailModal } from './PRVDetailModal';

export const PaymentsView: React.FC = () => {
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
    paymentRequests
  } = usePRV();

  const { currentUser, currentRole } = useEnterprise();

  // Submenu items with dynamic badges
  const navTabs = [
    {
      id: 'vouchers',
      label: 'Payment Request Vouchers',
      icon: FileText,
      badge: metrics.totalRequests,
      badgeColor: 'bg-purple-950 text-purple-300 border-purple-800'
    },
    {
      id: 'my_requests',
      label: 'My Payment Requests',
      icon: UserCheck,
      badge: paymentRequests.filter(p => p.requestedBy.toUpperCase() === currentUser.toUpperCase()).length,
      badgeColor: 'bg-slate-800 text-slate-300'
    },
    {
      id: 'pending_approvals',
      label: 'Pending Approvals',
      icon: Clock,
      badge: metrics.pendingAccountsL1Count + metrics.pendingAccountsL2Count,
      badgeColor: 'bg-blue-950 text-blue-300 border-blue-800'
    },
    {
      id: 'payment_approvals',
      label: 'Payment Approvals (Owner)',
      icon: ShieldCheck,
      badge: metrics.pendingOwnerCount,
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800'
    },
    {
      id: 'completed_payments',
      label: 'Completed Payments',
      icon: CheckCircle2,
      badge: metrics.paidCount,
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800'
    },
    {
      id: 'proof_documents',
      label: 'Payment Proof Documents',
      icon: Camera,
      badge: undefined
    },
    {
      id: 'project_expenses',
      label: 'Project Expenses',
      icon: Layers,
      badge: undefined
    },
    {
      id: 'dashboard',
      label: 'Payment Dashboard',
      icon: LayoutDashboard,
      badge: undefined
    }
  ];

  return (
    <div className="space-y-4">
      {/* Module Horizontal Navigation Tabs Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-xl overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-[980px]">
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold border ${
                      isActive ? 'bg-white/20 text-white border-white/30' : tab.badgeColor
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Sub-View */}
      <div className="min-h-[500px]">
        {activeSubTab === 'vouchers' && <PRVListView />}
        {activeSubTab === 'my_requests' && <MyRequestsView />}
        {activeSubTab === 'pending_approvals' && <PendingApprovalsView />}
        {activeSubTab === 'payment_approvals' && <OwnerApprovalDashboard />}
        {activeSubTab === 'completed_payments' && <CompletedPaymentsView />}
        {activeSubTab === 'proof_documents' && <PaymentProofGalleryView />}
        {activeSubTab === 'project_expenses' && <LinkedProjectExpensesView />}
        {activeSubTab === 'dashboard' && <PaymentAnalyticsDashboard />}
      </div>

      {/* Modals */}
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
