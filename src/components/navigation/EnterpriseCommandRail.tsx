import React from 'react';
import {
  Building2,
  Wallet,
  Truck,
  FolderKanban,
  ShoppingCart,
  CreditCard,
  BarChart3,
  FileText,
  Settings,
  ClipboardList,
  Users,
  ChevronRight,
  ShieldAlert,
  Clock,
  Sparkles,
  AlertCircle,
  FileSpreadsheet,
  Receipt
} from 'lucide-react';
import { useEnterprise } from '../../context/EnterpriseContext';
import { usePRV } from '../../context/PRVContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { useFleet } from '../../context/FleetContext';
import { useStaff } from '../../context/StaffContext';
import { useLeave } from '../../context/LeaveContext';
import { EnterpriseModule } from '../../types/enterpriseTypes';

interface EnterpriseCommandRailProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenCommandPalette: () => void;
}

interface NavItem {
  id: EnterpriseModule;
  label: string;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  activeBg: string;
  shortcut: string;
  badge?: number | string;
  badgeColor?: string;
}

export const EnterpriseCommandRail: React.FC<EnterpriseCommandRailProps> = ({
  isCollapsed,
  onToggleCollapse,
  onOpenCommandPalette
}) => {
  const { currentModule, setCurrentModule } = useEnterprise();
  const { paymentRequests = [] } = usePRV();
  const { budgetAlerts = [], income = [] } = usePettyCash();
  const { vehicles = [] } = useFleet();
  const { leaveRequests = [] } = useLeave();

  const pendingPRVsCount = (paymentRequests || []).filter(
    p => p.status === 'SUBMITTED' || p.status === 'ACCOUNTS_L1_APPROVED' || p.status === 'ACCOUNTS_L2_APPROVED' || p.status === 'PAYMENT_PROOF_PENDING'
  ).length;

  const pendingLeavesCount = (leaveRequests || []).filter(
    l => l.status === 'SUBMITTED' || l.status === 'COVER_UP_PENDING' || l.status === 'SUPERVISOR_PENDING' || l.status === 'MANAGER_PENDING' || l.status === 'HR_PENDING' || l.status === 'OWNER_PENDING'
  ).length;

  const projectInvoices = (income || []).filter(i =>
    i.TRANSACTION_TYPE === 'PROJECT_INVOICE_INCOME' ||
    Boolean(i.invoiceNumber) ||
    i.INCOME_SOURCE === 'Project Income / Invoice'
  );
  const totalInvoicesCount = projectInvoices.length;
  const overdueInvoicesCount = projectInvoices.filter(i => {
    const bal = i.balanceDue !== undefined ? i.balanceDue : (Number(i.grossAmount ?? i.AMOUNT) - Number(i.amountReceived ?? 0));
    return bal > 0.01;
  }).length;

  const activeAlertsCount = (budgetAlerts || []).length;
  const activeFleetCount = (vehicles || []).filter(v => v.status === 'Active').length;

  const coreModules: NavItem[] = [
    {
      id: 'overview',
      label: 'Executive Overview',
      shortLabel: 'Overview',
      icon: Building2,
      color: 'text-amber-400',
      activeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
      shortcut: 'Alt+1'
    },
    {
      id: 'site-records',
      label: 'Daily Site Records (DSR)',
      shortLabel: 'Site DSR',
      icon: ClipboardList,
      color: 'text-violet-400',
      activeBg: 'bg-violet-500/10 border-violet-500/30 text-violet-300',
      shortcut: 'Alt+2'
    },
    {
      id: 'petty-cash',
      label: 'Petty Cash & Expenses',
      shortLabel: 'Petty Cash',
      icon: Wallet,
      color: 'text-emerald-400',
      activeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      shortcut: 'Alt+3',
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-black'
    },
    {
      id: 'fleet',
      label: 'FleetTrack Logistics',
      shortLabel: 'FleetTrack',
      icon: Truck,
      color: 'text-blue-400',
      activeBg: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
      shortcut: 'Alt+4',
      badge: activeFleetCount > 0 ? activeFleetCount : undefined,
      badgeColor: 'bg-blue-900 text-blue-300 border border-blue-700'
    }
  ];

  const projectModules: NavItem[] = [
    {
      id: 'staff',
      label: 'Staff & HR Directory',
      shortLabel: 'Staff / HR',
      icon: Users,
      color: 'text-cyan-400',
      activeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
      shortcut: 'Alt+5',
      badge: pendingLeavesCount > 0 ? pendingLeavesCount : undefined,
      badgeColor: 'bg-cyan-900 text-cyan-200 border border-cyan-700'
    },
    {
      id: 'projects',
      label: 'Projects & Works',
      shortLabel: 'Projects',
      icon: FolderKanban,
      color: 'text-purple-400',
      activeBg: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
      shortcut: 'Alt+6'
    },
    {
      id: 'procurement',
      label: 'Procurement (PO)',
      shortLabel: 'Procurement',
      icon: ShoppingCart,
      color: 'text-orange-400',
      activeBg: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
      shortcut: 'Alt+7'
    }
  ];

  const financeModules: NavItem[] = [
    {
      id: 'payments',
      label: 'Finance & PRV Vouchers',
      shortLabel: 'Finance & PRV',
      icon: CreditCard,
      color: 'text-rose-400',
      activeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
      shortcut: 'Alt+8',
      badge: pendingPRVsCount > 0 ? pendingPRVsCount : undefined,
      badgeColor: 'bg-rose-500 text-white font-bold animate-pulse'
    },
    {
      id: 'invoices',
      label: 'Project Invoices (Inc)',
      shortLabel: 'Invoices (Inc)',
      icon: FileSpreadsheet,
      color: 'text-indigo-400',
      activeBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
      shortcut: 'Alt+I',
      badge: totalInvoicesCount > 0 ? totalInvoicesCount : undefined,
      badgeColor: 'bg-indigo-900 text-indigo-200 border border-indigo-700'
    },
    {
      id: 'client-payments',
      label: 'Client Payments',
      shortLabel: 'Client Pay',
      icon: Receipt,
      color: 'text-emerald-400',
      activeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      shortcut: 'Alt+C',
      badge: overdueInvoicesCount > 0 ? `${overdueInvoicesCount} Due` : undefined,
      badgeColor: 'bg-emerald-900 text-emerald-200 border border-emerald-700'
    }
  ];

  const governanceModules: NavItem[] = [
    {
      id: 'reports',
      label: 'Enterprise Reports',
      shortLabel: 'Reports',
      icon: BarChart3,
      color: 'text-teal-400',
      activeBg: 'bg-teal-500/10 border-teal-500/30 text-teal-300',
      shortcut: 'Alt+9'
    },
    {
      id: 'documents',
      label: 'Documents Vault',
      shortLabel: 'Documents',
      icon: FileText,
      color: 'text-indigo-400',
      activeBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
      shortcut: 'Alt+0'
    },
    {
      id: 'admin',
      label: 'Administration & Purge',
      shortLabel: 'Admin',
      icon: Settings,
      color: 'text-slate-300',
      activeBg: 'bg-slate-800 border-slate-700 text-white',
      shortcut: 'Alt+P'
    }
  ];

  const renderModuleGroup = (title: string, items: NavItem[]) => (
    <div className="space-y-0.5">
      {!isCollapsed && (
        <div className="px-2 py-1 text-[9px] font-bold text-slate-500 tracking-wider uppercase">
          {title}
        </div>
      )}
      {items.map(item => {
        const Icon = item.icon;
        const isActive = currentModule === item.id;
        return (
          <div key={item.id} className="relative group">
            <button
              onClick={() => setCurrentModule(item.id)}
              className={`w-full flex items-center gap-2.5 rounded-lg transition-all text-xs font-semibold ${
                isCollapsed
                  ? 'p-2 justify-center'
                  : 'px-2.5 py-1.5 justify-between'
              } ${
                isActive
                  ? `${item.activeBg} border shadow-sm font-bold`
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? item.color : 'text-slate-400 group-hover:scale-110'}`} />
                {!isCollapsed && (
                  <span className="truncate text-[11px]">{item.label}</span>
                )}
              </div>

              {!isCollapsed && item.badge !== undefined && (
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono leading-none ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                  {item.badge}
                </span>
              )}

              {isCollapsed && item.badge !== undefined && (
                <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${typeof item.badge === 'number' && item.badge > 0 ? 'bg-rose-500 ring-2 ring-slate-950' : 'bg-blue-400'}`} />
              )}
            </button>

            {/* Collapsed Tooltip */}
            {isCollapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-700 text-slate-100 text-xs font-medium rounded-lg shadow-xl z-50 whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95">
                <span>{item.label}</span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1 py-0.2 rounded border border-slate-800">
                  {item.shortcut}
                </span>
                {item.badge !== undefined && (
                  <span className={`text-[10px] font-mono px-1 rounded ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                    {item.badge}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <aside
      className={`shrink-0 bg-slate-950/90 border-r border-slate-800/80 select-none flex flex-col justify-between py-2 transition-all duration-200 ${
        isCollapsed ? 'w-13 sm:w-14' : 'w-56'
      }`}
    >
      {/* Module Navigation List */}
      <div className="px-1.5 space-y-3 overflow-y-auto scrollbar-none flex-1">
        {renderModuleGroup('Core Operations', coreModules)}
        <div className="border-t border-slate-900 mx-1"></div>
        {renderModuleGroup('Workforce & Projects', projectModules)}
        <div className="border-t border-slate-900 mx-1"></div>
        {renderModuleGroup('Finance & Invoicing', financeModules)}
        <div className="border-t border-slate-900 mx-1"></div>
        {renderModuleGroup('Governance', governanceModules)}
      </div>

      {/* Footer shortcut pill */}
      <div className="px-1.5 pt-2 border-t border-slate-900">
        <button
          onClick={onOpenCommandPalette}
          className={`w-full flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800/60 text-slate-400 hover:text-slate-200 transition-all text-xs ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
          title="Open Command Palette (Ctrl+K)"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            {!isCollapsed && <span className="text-[10px] font-semibold">Command Palette</span>}
          </div>
          {!isCollapsed && (
            <kbd className="px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-[9px] font-mono text-slate-400">
              ⌘K
            </kbd>
          )}
        </button>
      </div>
    </aside>
  );
};
