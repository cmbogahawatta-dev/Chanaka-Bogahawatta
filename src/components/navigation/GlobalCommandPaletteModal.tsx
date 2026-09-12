import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
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
  Plus,
  ArrowRight,
  Fuel,
  DollarSign,
  ArrowRightLeft,
  X,
  Sparkles,
  Layers,
  MapPin,
  Clock,
  Trash2,
  FileSpreadsheet,
  Receipt,
  Landmark,
  ShieldAlert,
  Mail,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Camera,
  LayoutDashboard,
  Coins,
  Boxes,
  Scale
} from 'lucide-react';
import { useEnterprise } from '../../context/EnterpriseContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { useFleet } from '../../context/FleetContext';
import { usePRV } from '../../context/PRVContext';
import { useStaff } from '../../context/StaffContext';
import { EnterpriseModule } from '../../types/enterpriseTypes';

interface GlobalCommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  onOpenTransfer: () => void;
  onOpenAddFuel: () => void;
  onOpenAddTrip: () => void;
  onOpenNewTransfer: () => void;
  onOpenAddPO: () => void;
  onOpenAddPayment: () => void;
}

export const GlobalCommandPaletteModal: React.FC<GlobalCommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onOpenAddExpense,
  onOpenAddIncome,
  onOpenTransfer,
  onOpenAddFuel,
  onOpenAddTrip,
  onOpenNewTransfer,
  onOpenAddPO,
  onOpenAddPayment
}) => {
  const { setCurrentModule, navigateToModule } = useEnterprise();
  const { expenses = [], projects = [], supervisors = [] } = usePettyCash();
  const { vehicles = [] } = useFleet();
  const { paymentRequests = [], setActiveSubTab } = usePRV();
  const { staffMembers = [] } = useStaff();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset search when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Navigation targets
  const navigationItems = useMemo(() => [
    {
      id: 'nav-overview',
      type: 'Navigation',
      title: 'Executive Overview Dashboard',
      subtitle: 'Multi-project cash flows, fleet utilization, and site milestones',
      icon: Building2,
      color: 'text-amber-400',
      action: () => { setCurrentModule('overview'); onClose(); }
    },
    {
      id: 'nav-dsr',
      type: 'Navigation',
      title: 'Daily Site Records (DSR)',
      subtitle: 'Manpower, equipment hours, weather, and daily progress logs',
      icon: ClipboardList,
      color: 'text-violet-400',
      action: () => { setCurrentModule('site-records'); onClose(); }
    },
    {
      id: 'nav-petty-cash',
      type: 'Navigation',
      title: 'Petty Cash & Expense Register',
      subtitle: 'Float ledgers, supervisor balances, voucher approvals, receipt OCR',
      icon: Wallet,
      color: 'text-emerald-400',
      action: () => { setCurrentModule('petty-cash'); onClose(); }
    },
    {
      id: 'nav-fleet',
      type: 'Navigation',
      title: 'FleetTrack & Equipment Logistics',
      subtitle: 'Running charts, fuel logs, preventive maintenance, GPS map',
      icon: Truck,
      color: 'text-blue-400',
      action: () => { setCurrentModule('fleet'); onClose(); }
    },
    {
      id: 'nav-staff',
      type: 'Navigation',
      title: 'Staff & HR Directory',
      subtitle: 'Workforce allocation, attendance registers, overtime, payroll cycles',
      icon: Users,
      color: 'text-cyan-400',
      action: () => { setCurrentModule('staff'); onClose(); }
    },
    {
      id: 'nav-projects',
      type: 'Navigation',
      title: 'Projects & Construction Matrix',
      subtitle: 'Project codes, site locations, budget allocations, geofences',
      icon: FolderKanban,
      color: 'text-purple-400',
      action: () => { setCurrentModule('projects'); onClose(); }
    },
    {
      id: 'nav-procurement',
      type: 'Navigation',
      title: 'Procurement & Material Orders',
      subtitle: 'Purchase orders (PO), supplier deliveries, material inventory',
      icon: ShoppingCart,
      color: 'text-orange-400',
      action: () => { setCurrentModule('procurement'); onClose(); }
    },
    {
      id: 'nav-inventory',
      type: 'Navigation',
      title: 'Inventory & Store Management',
      subtitle: 'Material Master, Stock Balances, GRN, Issues, Returns, Transfers, Adjustments, Stocktake',
      icon: Boxes,
      color: 'text-amber-400',
      action: () => { setCurrentModule('inventory'); onClose(); }
    },
    // 1. PROJECT INCOME (Incoming money)
    {
      id: 'nav-project-income',
      type: 'Navigation',
      title: 'Project Income Hub',
      subtitle: 'Combined Tax Invoices, Client Payments, Receipts History & Billing Matrix',
      icon: Coins,
      color: 'text-emerald-400',
      action: () => { setCurrentModule('project-income'); onClose(); }
    },
    {
      id: 'nav-tax-invoices',
      type: 'Navigation',
      title: 'Project Income: Tax Invoice',
      subtitle: 'Official IRD Section 60 tax invoices, 18% Output VAT register & QBO sync',
      icon: ShieldCheck,
      color: 'text-cyan-400',
      action: () => { setCurrentModule('tax-invoices'); onClose(); }
    },
    {
      id: 'nav-client-payments',
      type: 'Navigation',
      title: 'Project Income: Client Payments',
      subtitle: 'Milestone collections, client payments ledger, bank deposits & receivables',
      icon: Receipt,
      color: 'text-emerald-400',
      action: () => { setCurrentModule('client-payments'); onClose(); }
    },

    // 2. PRV & DISBURSEMENTS (Outgoing money)
    {
      id: 'nav-payments',
      type: 'Navigation',
      title: 'PRV & Disbursements: Payment Request Vouchers (PRV)',
      subtitle: 'Payment Request Vouchers, requisition status, and corporate payment tracking',
      icon: CreditCard,
      color: 'text-rose-400',
      action: () => { setCurrentModule('payments'); setActiveSubTab('vouchers'); onClose(); }
    },
    {
      id: 'nav-my-prvs',
      type: 'Navigation',
      title: 'PRV & Disbursements: My Payment Requests',
      subtitle: 'Requisitions initiated by current user profile',
      icon: UserCheck,
      color: 'text-cyan-400',
      action: () => { setCurrentModule('payments'); setActiveSubTab('my_requests'); onClose(); }
    },
    {
      id: 'nav-pending-approvals',
      type: 'Navigation',
      title: 'PRV & Disbursements: Pending Approvals (L1 / L2)',
      subtitle: 'Accounts and finance verification queues awaiting review',
      icon: Clock,
      color: 'text-blue-400',
      action: () => { setCurrentModule('payments'); setActiveSubTab('pending_approvals'); onClose(); }
    },
    {
      id: 'nav-director-signoff',
      type: 'Navigation',
      title: 'PRV & Disbursements: Director Sign-Off (Owner)',
      subtitle: 'Managing Director executive sign-off queue for payment release',
      icon: ShieldCheck,
      color: 'text-amber-400',
      action: () => { setCurrentModule('payments'); setActiveSubTab('payment_approvals'); onClose(); }
    },
    {
      id: 'nav-completed-payments',
      type: 'Navigation',
      title: 'PRV & Disbursements: Completed Payments',
      subtitle: 'Settled vouchers with attached banking slips and confirmation proofs',
      icon: CheckCircle2,
      color: 'text-teal-400',
      action: () => { setCurrentModule('payments'); setActiveSubTab('completed_payments'); onClose(); }
    },

    // 3. FINANCIAL INSIGHTS
    // 3. RECEIVABLES & PAYABLES (AR & AP)
    {
      id: 'nav-receivables-payables',
      type: 'Navigation',
      title: '11. Receivables & Payables (AR / AP)',
      subtitle: 'Accounts Receivable (Inflow LKR 25.4M), Accounts Payable (Outflow LKR 17.8M), Net Position (LKR 7.6M)',
      icon: Scale,
      color: 'text-blue-400',
      action: () => { setCurrentModule('receivables-payables'); onClose(); }
    },

    {
      id: 'nav-financial-insights',
      type: 'Navigation',
      title: 'Financial Insights Hub',
      subtitle: 'Combined Payment Proofs, Project Expenses, and Payment Analytics',
      icon: LayoutDashboard,
      color: 'text-amber-400',
      action: () => { setCurrentModule('financial-insights'); onClose(); }
    },
    {
      id: 'nav-proof-documents',
      type: 'Navigation',
      title: 'Financial Insights: Payment Proof Documents',
      subtitle: 'OCR bank slips, cheques, and wire transfer documents archive',
      icon: Camera,
      color: 'text-rose-400',
      action: () => { setCurrentModule('financial-insights'); onClose(); }
    },
    {
      id: 'nav-linked-project-expenses',
      type: 'Navigation',
      title: 'Financial Insights: Linked Project Expenses',
      subtitle: 'PRV line items mapped directly to site project budgets',
      icon: Layers,
      color: 'text-sky-400',
      action: () => { setCurrentModule('financial-insights'); onClose(); }
    },
    {
      id: 'nav-payment-analytics',
      type: 'Navigation',
      title: 'Financial Insights: Payment Analytics Dashboard',
      subtitle: 'Income vs disbursements, cash flow forecasting, category and payee charts',
      icon: LayoutDashboard,
      color: 'text-amber-400',
      action: () => { setCurrentModule('financial-insights'); onClose(); }
    },
    {
      id: 'nav-reports',
      type: 'Navigation',
      title: 'Enterprise Analytics & Reports',
      subtitle: 'Consolidated cash flows, fuel analytics, attendance reports',
      icon: BarChart3,
      color: 'text-teal-400',
      action: () => { setCurrentModule('reports'); onClose(); }
    },
    {
      id: 'nav-documents',
      type: 'Navigation',
      title: 'Universal Documents Vault',
      subtitle: 'Site contracts, delivery notes, proof scans, technical specs',
      icon: FileText,
      color: 'text-indigo-400',
      action: () => { setCurrentModule('documents'); onClose(); }
    },
    {
      id: 'nav-admin',
      type: 'Navigation',
      title: 'Administration & Storage Purge',
      subtitle: 'System master configuration, backup restore, admin clearance tools',
      icon: Settings,
      color: 'text-slate-300',
      action: () => { setCurrentModule('admin'); onClose(); }
    },
    {
      id: 'nav-enterprise-profile',
      type: 'Navigation',
      title: 'Corporate Identity & Legal Registry',
      subtitle: 'Statutory registration numbers, board of directors, shareholders, client profiles',
      icon: Building2,
      color: 'text-emerald-400',
      action: () => { setCurrentModule('enterprise-profile'); onClose(); }
    },
    {
      id: 'nav-bank-accounts',
      type: 'Navigation',
      title: 'Corporate Banking & General Ledger',
      subtitle: 'Multi-currency bank accounts, statements upload, GL audit logs & reconciliations',
      icon: Landmark,
      color: 'text-blue-400',
      action: () => { setCurrentModule('bank-accounts'); onClose(); }
    },
    {
      id: 'nav-compliance',
      type: 'Navigation',
      title: 'Compliance & Expiry Radar',
      subtitle: 'ISO certifications, insurance policies, statutory licences & external audits',
      icon: ShieldAlert,
      color: 'text-amber-400',
      action: () => { setCurrentModule('compliance'); onClose(); }
    },
    {
      id: 'nav-correspondence',
      type: 'Navigation',
      title: 'Official Correspondence & Letterhead Studio',
      subtitle: 'AI-assisted letters, tone adaptation, approval workflow & consultant-grade PDFs',
      icon: Mail,
      color: 'text-purple-400',
      action: () => { setCurrentModule('correspondence'); onClose(); }
    }
  ], [setCurrentModule, onClose]);

  // Quick Create actions
  const actionItems = useMemo(() => [
    {
      id: 'act-expense',
      type: 'Quick Action',
      title: 'New Expense Voucher',
      subtitle: 'Log a new cash disbursement with category & project code',
      icon: Plus,
      color: 'text-emerald-400',
      action: () => { onClose(); onOpenAddExpense(); }
    },
    {
      id: 'act-income',
      type: 'Quick Action',
      title: 'New Float Top-up / Income',
      subtitle: 'Credit supervisor cash float or receive external project fund',
      icon: DollarSign,
      color: 'text-emerald-400',
      action: () => { onClose(); onOpenAddIncome(); }
    },
    {
      id: 'act-transfer',
      type: 'Quick Action',
      title: 'Peer-to-Peer Float Transfer',
      subtitle: 'Transfer funds directly between site supervisors',
      icon: ArrowRightLeft,
      color: 'text-emerald-400',
      action: () => { onClose(); onOpenTransfer(); }
    },
    {
      id: 'act-fuel',
      type: 'Quick Action',
      title: 'New Fuel Record',
      subtitle: 'Log diesel/petrol issue with odometer and pump slip',
      icon: Fuel,
      color: 'text-blue-400',
      action: () => { onClose(); onOpenAddFuel(); }
    },
    {
      id: 'act-trip',
      type: 'Quick Action',
      title: 'New Running Chart Trip',
      subtitle: 'Record vehicle trip dispatch, driver, and kilometer meter reading',
      icon: Truck,
      color: 'text-blue-400',
      action: () => { onClose(); onOpenAddTrip(); }
    },
    {
      id: 'act-vehicle-transfer',
      type: 'Quick Action',
      title: 'Transfer Vehicle to Site',
      subtitle: 'Reallocate heavy machinery or vehicle to another site yard',
      icon: ArrowRightLeft,
      color: 'text-blue-400',
      action: () => { onClose(); onOpenNewTransfer(); }
    },
    {
      id: 'act-po',
      type: 'Quick Action',
      title: 'Create Purchase Order (PO)',
      subtitle: 'Generate procurement order for ready-mix, cement, or steel',
      icon: ShoppingCart,
      color: 'text-orange-400',
      action: () => { onClose(); onOpenAddPO(); }
    },
    {
      id: 'act-prv',
      type: 'Quick Action',
      title: 'New Payment Request Voucher',
      subtitle: 'Initiate PRV payment cycle for contractor or vendor invoice',
      icon: CreditCard,
      color: 'text-rose-400',
      action: () => { onClose(); onOpenAddPayment(); }
    }
  ], [onClose, onOpenAddExpense, onOpenAddIncome, onOpenTransfer, onOpenAddFuel, onOpenAddTrip, onOpenNewTransfer, onOpenAddPO, onOpenAddPayment]);

  // Dynamic live search entries from records
  const dynamicItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const results: Array<{
      id: string;
      type: 'Record';
      title: string;
      subtitle: string;
      icon: any;
      color: string;
      action: () => void;
    }> = [];

    // Search PRVs
    paymentRequests
      .filter(p => p.prvNumber.toLowerCase().includes(q) || p.payeeName.toLowerCase().includes(q) || p.projectCode.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach(p => {
        results.push({
          id: `prv-${p.id}`,
          type: 'Record',
          title: `PRV ${p.prvNumber} - ${p.payeeName}`,
          subtitle: `${p.projectCode} • LKR ${p.totalAmount.toLocaleString()} • Status: ${p.status}`,
          icon: CreditCard,
          color: 'text-rose-400',
          action: () => { navigateToModule('payments'); onClose(); }
        });
      });

    // Search Vehicles
    vehicles
      .filter(v => v.registrationNo.toLowerCase().includes(q) || v.type.toLowerCase().includes(q) || (v.makeModel && v.makeModel.toLowerCase().includes(q)))
      .slice(0, 4)
      .forEach(v => {
        results.push({
          id: `veh-${v.id}`,
          type: 'Record',
          title: `Vehicle ${v.registrationNo} (${v.type})`,
          subtitle: `${v.makeModel || 'Equipment'} • Assigned Site: ${v.assignedProject || 'Central Yard'}`,
          icon: Truck,
          color: 'text-blue-400',
          action: () => { navigateToModule('fleet', 'vehicles'); onClose(); }
        });
      });

    // Search Staff
    staffMembers
      .filter(s => s.fullName.toLowerCase().includes(q) || s.employeeCode.toLowerCase().includes(q) || s.designation.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach(s => {
        results.push({
          id: `staff-${s.id}`,
          type: 'Record',
          title: `${s.fullName} (${s.employeeCode})`,
          subtitle: `${s.designation} • ${s.department} • Site: ${s.assignedProjectName || s.assignedProjectCode || 'HQ'}`,
          icon: Users,
          color: 'text-cyan-400',
          action: () => { navigateToModule('staff'); onClose(); }
        });
      });

    // Search Projects
    projects
      .filter(p => p.PROJECT_NAME.toLowerCase().includes(q) || p.PROJECT_CODE.toLowerCase().includes(q) || (p.LOCATION && p.LOCATION.toLowerCase().includes(q)))
      .slice(0, 3)
      .forEach(p => {
        results.push({
          id: `prj-${p.id}`,
          type: 'Record',
          title: `Project: ${p.PROJECT_NAME} (${p.PROJECT_CODE})`,
          subtitle: `Location: ${p.LOCATION || 'Site Yard'} • Budget: LKR ${(p.TOTAL_BUDGET || 0).toLocaleString()}`,
          icon: FolderKanban,
          color: 'text-purple-400',
          action: () => { navigateToModule('projects'); onClose(); }
        });
      });

    return results;
  }, [searchQuery, paymentRequests, vehicles, staffMembers, projects, navigateToModule, onClose]);

  // Combined filtered items
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return [...actionItems.slice(0, 4), ...navigationItems];
    }
    const filteredNav = navigationItems.filter(item =>
      item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)
    );
    const filteredActions = actionItems.filter(item =>
      item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)
    );
    return [...filteredActions, ...filteredNav, ...dynamicItems];
  }, [searchQuery, navigationItems, actionItems, dynamicItems]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1 < filteredItems.length ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3 border-b border-slate-800 flex items-center gap-3 bg-slate-950/50">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search ERP modules, vouchers, vehicles, staff, or type a command..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-[10px] font-mono text-slate-400">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Search className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-slate-300">No matching enterprise resources found</p>
              <p className="text-slate-500 mt-1">Try searching for "Petty Cash", "PRV", "Toyota", "Diesel", or "Staff"</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg bg-slate-950/70 border border-slate-800 shrink-0 ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-100 truncate">{item.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase tracking-wider ${
                          item.type === 'Quick Action'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                            : item.type === 'Record'
                            ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {item.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>

                  <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-amber-400 translate-x-0.5' : 'text-slate-600'}`} />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span><strong className="text-slate-400">↑↓</strong> Navigate</span>
            <span><strong className="text-slate-400">↵</strong> Select</span>
            <span><strong className="text-slate-400">ESC</strong> Close</span>
          </div>
          <span className="text-[10px] text-slate-500">EMA Corporate ERP • Unified Command</span>
        </div>
      </div>
    </div>
  );
};
