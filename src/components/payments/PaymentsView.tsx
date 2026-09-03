import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { usePRV } from '../../context/PRVContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { PRVSubMenu } from '../../types/prvTypes';
import { formatLKR } from '../../utils/helpers';

// Sub-views
import { PRVListView } from './views/PRVListView';
import { MyRequestsView } from './views/MyRequestsView';
import { PendingApprovalsView } from './views/PendingApprovalsView';
import { OwnerApprovalDashboard } from './views/OwnerApprovalDashboard';
import { CompletedPaymentsView } from './views/CompletedPaymentsView';
import { PaymentProofGalleryView } from './views/PaymentProofGalleryView';
import { LinkedProjectExpensesView } from './views/LinkedProjectExpensesView';
import { PaymentAnalyticsDashboard } from './views/PaymentAnalyticsDashboard';
import { ProjectInvoicesView } from '../pettyCash/ProjectInvoicesView';
import { ClientPaymentsView } from './views/ClientPaymentsView';

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
    paymentRequests
  } = usePRV();

  const { currentUser, currentRole, setCurrentModule } = useEnterprise();
  const { income } = usePettyCash();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Sync initial tab from props or route
  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab, setActiveSubTab]);

  // Invoice metrics for badges
  const projectInvoices = income.filter(i =>
    i.TRANSACTION_TYPE === 'PROJECT_INVOICE_INCOME' ||
    Boolean(i.invoiceNumber) ||
    i.INCOME_SOURCE === 'Project Income / Invoice'
  );
  
  const pendingInvoicesCount = projectInvoices.filter(i => {
    const bal = i.balanceDue !== undefined ? i.balanceDue : (Number(i.grossAmount ?? i.AMOUNT) - Number(i.amountReceived ?? 0));
    return bal > 0.01;
  }).length;

  const totalInvoicedGross = projectInvoices.reduce(
    (sum, i) => sum + Number(i.grossAmount ?? i.AMOUNT ?? 0),
    0
  );

  const totalReceivedGross = projectInvoices.reduce(
    (sum, i) => sum + Number(i.amountReceived ?? 0),
    0
  );

  const handleTabSelect = (tabId: PRVSubMenu) => {
    setActiveSubTab(tabId);
    setIsMobileNavOpen(false);

    if (tabId === 'project_invoices') {
      setCurrentModule('invoices');
    } else if (tabId === 'client_payments') {
      setCurrentModule('client-payments');
    } else {
      setCurrentModule('payments');
    }
  };

  // Structured sidebar navigation groups
  const navGroups = [
    {
      title: 'Client Billing & Revenue',
      badge: `${projectInvoices.length} Invoices`,
      badgeColor: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/60',
      items: [
        {
          id: 'project_invoices' as PRVSubMenu,
          label: 'Project Invoices (Inc)',
          shortLabel: 'Invoices (Inc)',
          icon: FileSpreadsheet,
          description: 'Progress billings, tax invoices & retention',
          badge: projectInvoices.length > 0 ? projectInvoices.length : undefined,
          badgeColor: 'bg-indigo-900/80 text-indigo-200 border-indigo-700/80',
          activeBg: 'bg-indigo-600/20 text-indigo-200 border-indigo-500/50 shadow-sm shadow-indigo-950/40',
          hoverBg: 'hover:bg-indigo-950/40 hover:text-indigo-200',
          iconColor: 'text-indigo-400'
        },
        {
          id: 'client_payments' as PRVSubMenu,
          label: 'Client Payments',
          shortLabel: 'Client Payments',
          icon: Receipt,
          description: 'Milestone collections & payments ledger',
          badge: pendingInvoicesCount > 0 ? `${pendingInvoicesCount} Due` : undefined,
          badgeColor: 'bg-emerald-900/80 text-emerald-200 border-emerald-700/80',
          activeBg: 'bg-emerald-600/20 text-emerald-200 border-emerald-500/50 shadow-sm shadow-emerald-950/40',
          hoverBg: 'hover:bg-emerald-950/40 hover:text-emerald-200',
          iconColor: 'text-emerald-400'
        }
      ]
    },
    {
      title: 'Corporate PRVs & Disbursements',
      badge: `${metrics.totalRequests} PRVs`,
      badgeColor: 'text-purple-400 bg-purple-950/60 border-purple-800/60',
      items: [
        {
          id: 'vouchers' as PRVSubMenu,
          label: 'Payment Request Vouchers (PRV)',
          shortLabel: 'All PRV Vouchers',
          icon: FileText,
          description: 'Corporate payment requisitions & tracking',
          badge: metrics.totalRequests,
          badgeColor: 'bg-purple-900/80 text-purple-200 border-purple-700/80',
          activeBg: 'bg-purple-600/20 text-purple-200 border-purple-500/50 shadow-sm shadow-purple-950/40',
          hoverBg: 'hover:bg-purple-950/40 hover:text-purple-200',
          iconColor: 'text-purple-400'
        },
        {
          id: 'my_requests' as PRVSubMenu,
          label: 'My Payment Requests',
          shortLabel: 'My PRVs',
          icon: UserCheck,
          description: 'Requisitions initiated by current user',
          badge: paymentRequests.filter(p => p.requestedBy.toUpperCase() === currentUser.toUpperCase()).length,
          badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
          activeBg: 'bg-slate-700/40 text-slate-100 border-slate-600/60',
          hoverBg: 'hover:bg-slate-800/60 hover:text-slate-200',
          iconColor: 'text-cyan-400'
        },
        {
          id: 'pending_approvals' as PRVSubMenu,
          label: 'Pending Approvals (L1 / L2)',
          shortLabel: 'Pending Approvals',
          icon: Clock,
          description: 'Awaiting Accounts & Finance sign-offs',
          badge: metrics.pendingAccountsL1Count + metrics.pendingAccountsL2Count,
          badgeColor: 'bg-blue-900/80 text-blue-200 border-blue-700/80',
          activeBg: 'bg-blue-600/20 text-blue-200 border-blue-500/50 shadow-sm shadow-blue-950/40',
          hoverBg: 'hover:bg-blue-950/40 hover:text-blue-200',
          iconColor: 'text-blue-400'
        },
        {
          id: 'payment_approvals' as PRVSubMenu,
          label: 'Director Sign-off (Owner)',
          shortLabel: 'Director Approval',
          icon: ShieldCheck,
          description: 'Final executive authorization queue',
          badge: metrics.pendingOwnerCount,
          badgeColor: 'bg-amber-900/80 text-amber-200 border-amber-700/80 animate-pulse',
          activeBg: 'bg-amber-600/20 text-amber-200 border-amber-500/50 shadow-sm shadow-amber-950/40',
          hoverBg: 'hover:bg-amber-950/40 hover:text-amber-200',
          iconColor: 'text-amber-400'
        },
        {
          id: 'completed_payments' as PRVSubMenu,
          label: 'Completed Payments',
          shortLabel: 'Completed',
          icon: CheckCircle2,
          description: 'Settled vouchers with payment proofs',
          badge: metrics.paidCount,
          badgeColor: 'bg-teal-900/80 text-teal-200 border-teal-700/80',
          activeBg: 'bg-teal-600/20 text-teal-200 border-teal-500/50 shadow-sm shadow-teal-950/40',
          hoverBg: 'hover:bg-teal-950/40 hover:text-teal-200',
          iconColor: 'text-teal-400'
        }
      ]
    },
    {
      title: 'Audit & Financial Insights',
      badge: 'Audit',
      badgeColor: 'text-slate-400 bg-slate-900 border-slate-800',
      items: [
        {
          id: 'proof_documents' as PRVSubMenu,
          label: 'Payment Proof Documents',
          shortLabel: 'Proofs & Slips',
          icon: Camera,
          description: 'OCR bank slips, cheques & transfer receipts',
          activeBg: 'bg-rose-600/20 text-rose-200 border-rose-500/50 shadow-sm shadow-rose-950/40',
          hoverBg: 'hover:bg-rose-950/40 hover:text-rose-200',
          iconColor: 'text-rose-400'
        },
        {
          id: 'project_expenses' as PRVSubMenu,
          label: 'Linked Project Expenses',
          shortLabel: 'Project Expenses',
          icon: Layers,
          description: 'PRV line items linked to site budgets',
          activeBg: 'bg-sky-600/20 text-sky-200 border-sky-500/50 shadow-sm shadow-sky-950/40',
          hoverBg: 'hover:bg-sky-950/40 hover:text-sky-200',
          iconColor: 'text-sky-400'
        },
        {
          id: 'dashboard' as PRVSubMenu,
          label: 'Payment Analytics Dashboard',
          shortLabel: 'Analytics',
          icon: LayoutDashboard,
          description: 'Cash-out graphs, categories & aging',
          activeBg: 'bg-amber-600/20 text-amber-200 border-amber-500/50 shadow-sm shadow-amber-950/40',
          hoverBg: 'hover:bg-amber-950/40 hover:text-amber-200',
          iconColor: 'text-amber-400'
        }
      ]
    }
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner on Mobile / Small screens to toggle Finance Sidebar */}
      <div className="lg:hidden bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg flex items-center justify-between">
        <button
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-all"
        >
          {isMobileNavOpen ? <X className="w-4 h-4 text-rose-400" /> : <Menu className="w-4 h-4 text-purple-400" />}
          <span>Finance Menu</span>
        </button>

        {/* Quick mobile pills for top 3 views */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => handleTabSelect('project_invoices')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeSubTab === 'project_invoices'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Invoices (Inc)
          </button>
          <button
            onClick={() => handleTabSelect('client_payments')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeSubTab === 'client_payments'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Client Pay
          </button>
          <button
            onClick={() => handleTabSelect('vouchers')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeSubTab === 'vouchers'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            PRVs
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout: Left Dedicated Sidebar + Right Sub-view */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* FINANCE SIDEBAR NAVIGATION */}
        <aside
          className={`w-full lg:w-64 xl:w-72 shrink-0 bg-slate-900/95 border border-slate-800/90 rounded-2xl p-3 shadow-xl space-y-4 ${
            isMobileNavOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Sidebar Header & Brand */}
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-100 tracking-wide">Finance & Invoicing</h2>
                  <p className="text-[10px] text-slate-400">PRVs, Invoices & Receivables</p>
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                ERP
              </span>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-1.5 mt-3 pt-2.5 border-t border-slate-700/60">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold transition-all shadow-sm shadow-rose-900/40 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New PRV</span>
              </button>
              <button
                onClick={() => setIsScannerModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 text-[11px] font-medium transition-all active:scale-95"
              >
                <Camera className="w-3.5 h-3.5 text-blue-400" />
                <span>Scan Slip</span>
              </button>
            </div>
          </div>

          {/* Navigation Groups List */}
          <div className="space-y-4">
            {navGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {group.title}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${group.badgeColor}`}
                  >
                    {group.badge}
                  </span>
                </div>

                <div className="space-y-1">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeSubTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabSelect(item.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all border ${
                          isActive
                            ? `${item.activeBg} font-semibold`
                            : `border-transparent text-slate-300 ${item.hoverBg}`
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 text-left">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-transform ${
                              isActive ? 'scale-110' : item.iconColor
                            }`}
                          />
                          <div className="min-w-0">
                            <span className="block truncate text-[11.5px] leading-tight">
                              {item.label}
                            </span>
                            {item.description && (
                              <span className="block truncate text-[9.5px] text-slate-400 font-normal leading-tight">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </div>

                        {item.badge !== undefined && (typeof item.badge === 'number' ? item.badge > 0 : true) && (
                          <span
                            className={`ml-1.5 shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              isActive
                                ? 'bg-white/20 text-white border-white/30'
                                : item.badgeColor
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Summary Card */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Invoiced Gross:
              </span>
              <span className="font-mono font-semibold text-emerald-300">
                {formatLKR(totalInvoicedGross)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                Collected:
              </span>
              <span className="font-mono font-semibold text-cyan-300">
                {formatLKR(totalReceivedGross)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10.5px]">
              <span className="text-slate-400">PRVs Settled:</span>
              <span className="font-mono font-bold text-rose-400">
                {formatLKR(metrics.totalAmountPaid)}
              </span>
            </div>
          </div>
        </aside>

        {/* MAIN VIEW CONTAINER */}
        <div className="flex-1 min-w-0 w-full">
          {activeSubTab === 'vouchers' && <PRVListView />}
          {activeSubTab === 'project_invoices' && (
            <ProjectInvoicesView onNavigateToClientPayments={() => handleTabSelect('client_payments')} />
          )}
          {activeSubTab === 'client_payments' && (
            <ClientPaymentsView onNavigateToInvoices={() => handleTabSelect('project_invoices')} />
          )}
          {activeSubTab === 'my_requests' && <MyRequestsView />}
          {activeSubTab === 'pending_approvals' && <PendingApprovalsView />}
          {activeSubTab === 'payment_approvals' && <OwnerApprovalDashboard />}
          {activeSubTab === 'completed_payments' && <CompletedPaymentsView />}
          {activeSubTab === 'proof_documents' && <PaymentProofGalleryView />}
          {activeSubTab === 'project_expenses' && <LinkedProjectExpensesView />}
          {activeSubTab === 'dashboard' && <PaymentAnalyticsDashboard />}
        </div>
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
