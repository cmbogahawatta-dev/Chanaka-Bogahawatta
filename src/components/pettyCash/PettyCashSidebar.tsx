import React from 'react';
import {
  Building2,
  LayoutDashboard,
  PlusCircle,
  Receipt,
  DollarSign,
  TrendingUp,
  WalletCards,
  FolderKanban,
  Users,
  Tag,
  FileBarChart,
  FileText,
  Settings,
  X,
  FileSpreadsheet,
  Database,
  ShieldAlert,
  FileCheck
} from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';
import { PettyCashNavTab } from '../../types/pettyCashTypes';

export type { PettyCashNavTab };

interface PettyCashSidebarProps {
  activeTab: PettyCashNavTab;
  setActiveTab: (tab: PettyCashNavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
}

export const PettyCashSidebar: React.FC<PettyCashSidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  onCloseMobile,
  onOpenAddExpense,
  onOpenAddIncome
}) => {
  const { userRole, kpiMetrics, income } = usePettyCash();

  const pendingInvoicesCount = income.filter(i =>
    (i.TRANSACTION_TYPE === 'PROJECT_INVOICE_INCOME' || Boolean(i.invoiceNumber)) &&
    (i.paymentStatus === 'Pending' || i.paymentStatus === 'Partially Paid')
  ).length;

  const navItems: {
    id: PettyCashNavTab;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
    roles?: string[];
    isAction?: boolean;
    action?: () => void;
    section?: string;
  }[] = [
    {
      id: 'master-dashboard',
      label: 'Executive Overview',
      icon: Building2,
      badge: 'Unified',
      badgeColor: 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-black'
    },
    {
      id: 'dashboard',
      label: 'Petty Cash Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'add-expense',
      label: 'Add Expense',
      icon: PlusCircle,
      badge: 'Quick',
      badgeColor: 'bg-emerald-600 text-white',
      isAction: true,
      action: onOpenAddExpense
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: Receipt,
      badge: kpiMetrics.totalExpensesPending > 0 ? `${kpiMetrics.totalExpensesPending > 0 ? 'Pending' : ''}` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
    },
    {
      id: 'add-income',
      label: 'Add Income',
      icon: DollarSign,
      roles: ['ADMIN', 'FINANCE'],
      isAction: true,
      action: onOpenAddIncome
    },
    {
      id: 'income',
      label: 'Income & Top-ups',
      icon: TrendingUp,
      roles: ['ADMIN', 'FINANCE', 'SUPERVISOR', 'VIEWER']
    },
    {
      id: 'petty-cash',
      label: 'Petty Cash Balances',
      icon: WalletCards,
      badge: kpiMetrics.overdrawnSupervisorsCount > 0 ? `${kpiMetrics.overdrawnSupervisorsCount} Alert` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
    },
    {
      id: 'projects',
      label: 'Projects Matrix',
      icon: FolderKanban
    },
    {
      id: 'invoices',
      label: 'Project Invoices',
      icon: FileCheck,
      badge: pendingInvoicesCount > 0 ? `${pendingInvoicesCount} Active` : undefined,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold'
    },
    {
      id: 'supervisors',
      label: 'Supervisors',
      icon: Users,
      roles: ['ADMIN', 'FINANCE', 'VIEWER']
    },
    {
      id: 'categories',
      label: 'Expense Categories',
      icon: Tag,
      roles: ['ADMIN', 'FINANCE', 'VIEWER']
    },
    {
      id: 'reports',
      label: 'Financial Reports',
      icon: FileBarChart
    },
    {
      id: 'documents',
      label: 'Proof & Receipts',
      icon: FileText
    },
    {
      id: 'admin-import',
      label: 'Data Import & Migration',
      icon: Database,
      roles: ['ADMIN'],
      badge: 'Admin Only',
      badgeColor: 'bg-emerald-950 text-emerald-300 border border-emerald-700 font-extrabold',
      section: 'Admin Tools'
    },
    {
      id: 'settings',
      label: 'Google Sheets Sync',
      icon: Settings
    }
  ];

  const handleSelectTab = (item: typeof navItems[0]) => {
    if (item.isAction && item.action) {
      item.action();
    } else {
      setActiveTab(item.id);
    }
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              EMA
            </div>
            <span className="font-bold text-sm text-slate-100">Petty Cash Navigation</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav List */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Petty Cash Modules
          </div>

          {navItems.map((item) => {
            // Check role permissions
            if (item.roles && !item.roles.includes(userRole)) {
              return null;
            }

            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <React.Fragment key={item.id}>
                {item.section && (
                  <div className="pt-3 pb-1 px-3 text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 border-t border-slate-800/80 mt-2">
                    <ShieldAlert className="w-3 h-3" />
                    <span>{item.section}</span>
                  </div>
                )}
                <button
                  id={`petty-nav-${item.id}`}
                  onClick={() => handleSelectTab(item)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        item.badgeColor || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="overflow-hidden">
              <p className="text-[11px] font-bold text-slate-200 truncate">Google Sheets Live</p>
              <p className="text-[10px] text-slate-400 truncate">EMA_Petty_Cash_Master</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
