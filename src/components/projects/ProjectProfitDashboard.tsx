import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Building2,
  AlertCircle,
  CheckCircle2,
  Download,
  Printer,
  Search,
  Filter,
  Layers,
  FileText,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  X,
  ChevronRight,
  Info,
  Calendar,
  Coins,
  Briefcase,
  Scale,
  Receipt,
  Truck,
  Wrench,
  ShoppingCart,
  Wallet,
  Clock,
  ArrowRightLeft
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { usePettyCash } from '../../context/PettyCashContext';
import { useFleet } from '../../context/FleetContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { useTaxInvoice } from '../../context/TaxInvoiceContext';
import { Project } from '../../types/pettyCashTypes';

interface ProjectProfitDashboardProps {
  onSelectProjectForCost?: (projectCode: string) => void;
  onNavigateToInvoice?: (invoiceId: string) => void;
}

export interface ProjectProfitRecord {
  projectId: string;
  projectCode: string;
  projectName: string;
  client: string;
  location: string;
  contractValue: number;
  status: string;

  // Revenue & Income (Earned P&L Revenue, Excludes Advances)
  grossBilledRevenue: number; // Gross certified invoices issued
  netEarnedRevenue: number; // Taxable earned value of supply
  outputVat: number;
  earnedCashCollected: number; // Cash received against certified work
  outstandingReceivables: number; // Balance due on certified invoices
  collectionRate: number; // %

  // Advance & Liability Accounting (Advances are Liabilities, NOT Income)
  advanceReceived: number; // Client mobilization / cash advance deposits received
  advanceRecovered: number; // Deducted/amortized against IPC billings
  advanceLiability: number; // Outstanding Current Liability balance to client
  totalCashInflow: number; // Total cash collected = earnedCashCollected + advanceReceived

  // Incurred Costs & Expenses (All direct sources)
  pettyCashCost: number;
  fuelCost: number;
  maintenanceCost: number;
  procurementCost: number;
  paymentVouchersCost: number;
  totalExpenses: number;
  expensesExclVat: number;
  inputVat: number;

  // Profitability
  netProfit: number; // Net Earned Revenue (Excl Advances) - Total Expenses
  grossProfit: number; // Gross Billed Revenue (Excl Advances) - Total Expenses
  profitMarginPercent: number; // (netProfit / netEarnedRevenue) * 100
  budgetUtilization: number; // (totalExpenses / contractValue) * 100

  // Cash Flow vs Profit Reconciliation
  netCashFlow: number; // totalCashInflow - totalExpenses
  cashProfitVariance: number; // netCashFlow - netProfit (= advanceLiability + AP - AR)

  // Counts for audit
  invoiceCount: number;
  expenseCount: number;
  voucherCount: number;
}

export const ProjectProfitDashboard: React.FC<ProjectProfitDashboardProps> = ({
  onSelectProjectForCost,
  onNavigateToInvoice
}) => {
  const { projects = [], expenses = [], income = [] } = usePettyCash();
  const { fuelRecords = [], vehicles = [], maintenanceLogs = [] } = useFleet();
  const { procurementOrders = [], paymentVouchers = [] } = useEnterprise();
  const { invoices = [], payments = [] } = useTaxInvoice();

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('ALL');
  const [profitFilter, setProfitFilter] = useState<'ALL' | 'PROFITABLE' | 'HEALTHY' | 'LOW_MARGIN' | 'LOSS' | 'HAS_ADVANCE'>('ALL');
  const [sortBy, setSortBy] = useState<'profit' | 'revenue' | 'expenses' | 'margin' | 'advance' | 'contract'>('profit');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedProjectCode, setSelectedProjectCode] = useState<string | null>(null);
  const [showAccountingPolicyNote, setShowAccountingPolicyNote] = useState(true);

  // Currency Formatter
  const formatLKR = (amt: number): string => {
    return `LKR ${Number(amt || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;
  };

  const formatShortLKR = (amt: number): string => {
    const val = Number(amt || 0);
    if (Math.abs(val) >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(2)}M`;
    }
    if (Math.abs(val) >= 1_000) {
      return `${(val / 1_000).toFixed(1)}k`;
    }
    return val.toLocaleString();
  };

  // Master Project Financial & Profit Calculation with Strict Accounting Rules
  const projectProfits = useMemo<ProjectProfitRecord[]>(() => {
    return projects.map(proj => {
      const pCode = proj.PROJECT_CODE;
      const pName = proj.PROJECT_NAME;

      // ==========================================
      // 1. INVOICES & REVENUE (Tax Invoices + Project Income)
      // ==========================================
      const projInvoices = invoices.filter(
        inv => (inv.projectCode === pCode || inv.projectName === pName) && !inv.isCancelled && inv.status !== 'DRAFT'
      );

      // Check for standalone project income entries (PettyCashContext)
      const projDirectIncome = income.filter(
        i => (i.PROJECT === pCode || i.PROJECT === pName) && i.TRANSACTION_TYPE !== 'PETTY_CASH_TOPUP'
      );

      // Distinguish Advance receipts vs Certified Progress Billings
      const isAdvanceRecord = (invOrInc: { ipcNumber?: string; billingDescription?: string; invoiceDescription?: string; remarks?: string; REMARKS?: string; INCOME_SOURCE?: string }) => {
        const text = [
          invOrInc.ipcNumber,
          invOrInc.billingDescription,
          invOrInc.invoiceDescription,
          invOrInc.remarks,
          invOrInc.REMARKS,
          invOrInc.INCOME_SOURCE
        ].filter(Boolean).join(' ').toLowerCase();
        return text.includes('advance') || text.includes('mobilization') || text.includes('deposit');
      };

      // Invoices that are mobilization advances vs certified IPC progress bills
      let advanceReceived = 0;
      let advanceRecovered = 0;
      let grossBilledRevenue = 0;
      let netEarnedRevenue = 0;
      let outputVat = 0;
      let earnedCashCollected = 0;

      // Process official Tax Invoices
      projInvoices.forEach(inv => {
        const isAdv = isAdvanceRecord(inv);
        if (isAdv) {
          // Mobilization Advance Invoice: Treated as Liability, NOT Earned Revenue!
          advanceReceived += Number(inv.amountReceived || inv.totalConsideration || 0);
        } else {
          // Certified Progress Billing: Earned Revenue
          grossBilledRevenue += Number(inv.totalConsideration || 0);
          netEarnedRevenue += Number(inv.totalTaxableValue || 0);
          outputVat += Number(inv.vatAmount || 0);
          earnedCashCollected += Number(inv.amountReceived || 0);

          // Advance recovery inside IPC bill amortizes/liquidates the advance liability
          if (inv.advanceRecovery && Number(inv.advanceRecovery) > 0) {
            advanceRecovered += Number(inv.advanceRecovery);
          }
        }
      });

      // Process Direct Project Incomes (that are not already captured via TaxInvoice IDs)
      projDirectIncome.forEach(inc => {
        if (!inc.invoiceNumber || !projInvoices.some(inv => inv.serialNumber === inc.invoiceNumber)) {
          const isAdv = isAdvanceRecord(inc);
          const incGross = Number(inc.grossAmount ?? inc.AMOUNT ?? 0);
          const incNet = Number(inc.netAmount ?? inc.AMOUNT ?? 0);
          const incVat = Number(inc.vatAmount ?? 0);
          const incReceived = inc.amountReceived !== undefined ? Number(inc.amountReceived) : (inc.paymentStatus === 'Paid' ? incGross : 0);

          if (isAdv) {
            advanceReceived += incGross;
          } else {
            grossBilledRevenue += incGross;
            netEarnedRevenue += incNet;
            outputVat += incVat;
            earnedCashCollected += incReceived;
          }
        }
      });

      // Also check client receipts / payments that mention advance
      const projPayments = payments.filter(pay => pay.projectCode === pCode);
      projPayments.forEach(pay => {
        const notes = (pay.notes || '').toLowerCase();
        if (notes.includes('advance') && !projInvoices.some(inv => inv.id === pay.invoiceId && isAdvanceRecord(inv))) {
          // Part-payment or deposit flagged explicitly as advance
          advanceReceived += Number(pay.amountReceived || 0);
        }
      });

      // Advance Liability = Total Advance Received minus Advances Recovered / Amortized
      const advanceLiability = Math.max(0, advanceReceived - advanceRecovered);

      // Receivables on certified revenue
      const outstandingReceivables = Math.max(0, grossBilledRevenue - earnedCashCollected);
      const collectionRate = grossBilledRevenue > 0 ? (earnedCashCollected / grossBilledRevenue) * 100 : 0;
      const totalCashInflow = earnedCashCollected + advanceReceived;

      // ==========================================
      // 2. EXPENSES (Comprehensive Cost Aggregation)
      // ==========================================
      // A. Direct Site Petty Cash Expenses
      const projExpenses = expenses.filter(
        e => (e.PROJECT === pCode || e.PROJECT === pName) && e.PAYMENT_STATUS !== 'Rejected' && e.PAYMENT_STATUS !== 'Draft'
      );
      const pettyCashCost = projExpenses.reduce((sum, e) => sum + Number(e.AMOUNT || 0), 0);

      // B. Fleet Fuel Costs
      const projFuel = fuelRecords.filter(
        f => f.siteOrProject === pCode || f.siteOrProject === pName
      );
      const fuelCost = projFuel.reduce((sum, f) => sum + Number(f.totalCost || 0), 0);

      // C. Heavy Equipment & Vehicle Maintenance
      const projVehicles = vehicles.filter(
        v => v.currentSite === pCode || v.currentSite === pName
      );
      const projVehicleIds = projVehicles.map(v => v.id);
      const projMaintenance = maintenanceLogs.filter(
        m => projVehicleIds.includes(m.vehicleId)
      );
      const maintenanceCost = projMaintenance.reduce((sum, m) => sum + Number(m.cost || 0), 0);

      // D. Site Procurement Orders (Materials / POs)
      const projProcurement = procurementOrders.filter(
        p => p.PROJECT_CODE === pCode && p.STATUS !== 'Cancelled'
      );
      const procurementCost = projProcurement.reduce((sum, p) => sum + Number(p.TOTAL_AMOUNT || 0), 0);

      // E. Payment Vouchers / Subcontractors (PRVs)
      const projVouchers = paymentVouchers.filter(
        p => p.PROJECT_CODE === pCode && p.STATUS !== 'Rejected'
      );
      const paymentVouchersCost = projVouchers.reduce((sum, p) => sum + Number(p.AMOUNT || 0), 0);

      // Total Expenses
      const totalExpenses = pettyCashCost + fuelCost + maintenanceCost + procurementCost + paymentVouchersCost;
      const inputVat = projExpenses.reduce((sum, e) => sum + Number(e.vatAmount || 0), 0);
      const expensesExclVat = totalExpenses - inputVat;

      // ==========================================
      // 3. PROFITABILITY (Accounting Standard: Advance Excluded!)
      // ==========================================
      // Standard Formula: Net Profit = Earned Recognized Income (Excl Advances) - Total Incurred Expenses
      // If netEarnedRevenue is 0 (unbilled project), use grossBilledRevenue or compare with 0
      const netProfit = (netEarnedRevenue > 0 ? netEarnedRevenue : grossBilledRevenue) - totalExpenses;
      const grossProfit = grossBilledRevenue - totalExpenses;
      const earnedBase = netEarnedRevenue > 0 ? netEarnedRevenue : (grossBilledRevenue > 0 ? grossBilledRevenue : 1);
      const profitMarginPercent = earnedBase > 1 ? (netProfit / earnedBase) * 100 : (totalExpenses > 0 ? -100 : 0);

      const contractValue = Number(proj.CONTRACT_VALUE || 15000000);
      const budgetUtilization = contractValue > 0 ? (totalExpenses / contractValue) * 100 : 0;

      // Cash Flow vs Profit Variance
      const netCashFlow = totalCashInflow - totalExpenses;
      const cashProfitVariance = netCashFlow - netProfit;

      return {
        projectId: proj.id,
        projectCode: pCode,
        projectName: proj.PROJECT_NAME,
        client: proj.CLIENT || proj.CLIENT_NAME || 'Road Development Authority (RDA)',
        location: proj.LOCATION || 'Sri Lanka',
        contractValue,
        status: proj.STATUS || 'Active',

        grossBilledRevenue,
        netEarnedRevenue,
        outputVat,
        earnedCashCollected,
        outstandingReceivables,
        collectionRate,

        advanceReceived,
        advanceRecovered,
        advanceLiability,
        totalCashInflow,

        pettyCashCost,
        fuelCost,
        maintenanceCost,
        procurementCost,
        paymentVouchersCost,
        totalExpenses,
        expensesExclVat,
        inputVat,

        netProfit,
        grossProfit,
        profitMarginPercent,
        budgetUtilization,

        netCashFlow,
        cashProfitVariance,

        invoiceCount: projInvoices.length,
        expenseCount: projExpenses.length,
        voucherCount: projVouchers.length
      };
    });
  }, [projects, invoices, income, payments, expenses, fuelRecords, vehicles, maintenanceLogs, procurementOrders, paymentVouchers]);

  // Portfolio Totals
  const portfolioSummary = useMemo(() => {
    return projectProfits.reduce(
      (acc, curr) => {
        acc.totalContractValue += curr.contractValue;
        acc.totalGrossBilled += curr.grossBilledRevenue;
        acc.totalNetEarned += curr.netEarnedRevenue;
        acc.totalAdvanceLiability += curr.advanceLiability;
        acc.totalAdvanceReceived += curr.advanceReceived;
        acc.totalCashInflow += curr.totalCashInflow;
        acc.totalEarnedCollected += curr.earnedCashCollected;
        acc.totalReceivables += curr.outstandingReceivables;

        acc.totalPettyCash += curr.pettyCashCost;
        acc.totalFuel += curr.fuelCost;
        acc.totalMaintenance += curr.maintenanceCost;
        acc.totalProcurement += curr.procurementCost;
        acc.totalPayments += curr.paymentVouchersCost;
        acc.totalExpenses += curr.totalExpenses;

        acc.totalNetProfit += curr.netProfit;
        acc.totalNetCashFlow += curr.netCashFlow;

        if (curr.netProfit > 0) acc.profitableProjectsCount += 1;
        if (curr.netProfit < 0) acc.lossMakingProjectsCount += 1;
        if (curr.advanceLiability > 0) acc.advanceLiabilityProjectsCount += 1;

        return acc;
      },
      {
        totalContractValue: 0,
        totalGrossBilled: 0,
        totalNetEarned: 0,
        totalAdvanceLiability: 0,
        totalAdvanceReceived: 0,
        totalCashInflow: 0,
        totalEarnedCollected: 0,
        totalReceivables: 0,
        totalPettyCash: 0,
        totalFuel: 0,
        totalMaintenance: 0,
        totalProcurement: 0,
        totalPayments: 0,
        totalExpenses: 0,
        totalNetProfit: 0,
        totalNetCashFlow: 0,
        profitableProjectsCount: 0,
        lossMakingProjectsCount: 0,
        advanceLiabilityProjectsCount: 0
      }
    );
  }, [projectProfits]);

  // Overall Portfolio Profit Margin %
  const portfolioMarginPercent = portfolioSummary.totalNetEarned > 0
    ? (portfolioSummary.totalNetProfit / portfolioSummary.totalNetEarned) * 100
    : (portfolioSummary.totalGrossBilled > 0
        ? (portfolioSummary.totalNetProfit / portfolioSummary.totalGrossBilled) * 100
        : 0);

  // Clients List for Dropdown
  const uniqueClients = useMemo(() => {
    const set = new Set<string>();
    projectProfits.forEach(p => {
      if (p.client) set.add(p.client);
    });
    return Array.from(set).sort();
  }, [projectProfits]);

  // Filtered & Sorted Projects
  const filteredProjects = useMemo(() => {
    return projectProfits
      .filter(p => {
        const matchesSearch =
          searchTerm === '' ||
          p.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.location.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesClient = clientFilter === 'ALL' || p.client === clientFilter;

        let matchesProfit = true;
        if (profitFilter === 'PROFITABLE') matchesProfit = p.netProfit > 0;
        else if (profitFilter === 'HEALTHY') matchesProfit = p.profitMarginPercent >= 15;
        else if (profitFilter === 'LOW_MARGIN') matchesProfit = p.profitMarginPercent >= 0 && p.profitMarginPercent < 15;
        else if (profitFilter === 'LOSS') matchesProfit = p.netProfit < 0;
        else if (profitFilter === 'HAS_ADVANCE') matchesProfit = p.advanceLiability > 0;

        return matchesSearch && matchesClient && matchesProfit;
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;
        switch (sortBy) {
          case 'profit':
            valA = a.netProfit;
            valB = b.netProfit;
            break;
          case 'revenue':
            valA = a.netEarnedRevenue || a.grossBilledRevenue;
            valB = b.netEarnedRevenue || b.grossBilledRevenue;
            break;
          case 'expenses':
            valA = a.totalExpenses;
            valB = b.totalExpenses;
            break;
          case 'margin':
            valA = a.profitMarginPercent;
            valB = b.profitMarginPercent;
            break;
          case 'advance':
            valA = a.advanceLiability;
            valB = b.advanceLiability;
            break;
          case 'contract':
            valA = a.contractValue;
            valB = b.contractValue;
            break;
          default:
            valA = a.netProfit;
            valB = b.netProfit;
        }
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      });
  }, [projectProfits, searchTerm, clientFilter, profitFilter, sortBy, sortOrder]);

  // Chart Data: Top 8 Projects Comparison (Expenses vs Earned Revenue vs Net Profit vs Advance Liability)
  const chartData = useMemo(() => {
    return filteredProjects.slice(0, 8).map(p => ({
      name: p.projectCode,
      fullName: p.projectName,
      EarnedRevenue: Math.max(0, p.netEarnedRevenue || p.grossBilledRevenue),
      TotalExpenses: p.totalExpenses,
      NetProfit: p.netProfit,
      AdvanceLiability: p.advanceLiability
    }));
  }, [filteredProjects]);

  // Selected Project for Reconciliation Modal
  const activeModalProject = useMemo(() => {
    if (!selectedProjectCode) return null;
    return projectProfits.find(p => p.projectCode === selectedProjectCode) || null;
  }, [selectedProjectCode, projectProfits]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Project Code',
      'Project Name',
      'Client',
      'Contract Budget (LKR)',
      'Gross Billed (LKR)',
      'Earned Net Revenue (LKR)',
      'Client Advance Received (LKR)',
      'Advance Liability (LKR)',
      'Total Expenses (LKR)',
      'Site Petty Cash (LKR)',
      'Fleet Fuel (LKR)',
      'Machinery Maintenance (LKR)',
      'Site Procurement (LKR)',
      'Subcontractor PRVs (LKR)',
      'Net Profit / Loss (LKR)',
      'Profit Margin (%)',
      'Total Cash Inflow (LKR)',
      'Net Cash Flow (LKR)',
      'Financial Status'
    ];

    const rows = filteredProjects.map(p => [
      `"${p.projectCode}"`,
      `"${p.projectName}"`,
      `"${p.client}"`,
      p.contractValue,
      p.grossBilledRevenue,
      p.netEarnedRevenue,
      p.advanceReceived,
      p.advanceLiability,
      p.totalExpenses,
      p.pettyCashCost,
      p.fuelCost,
      p.maintenanceCost,
      p.procurementCost,
      p.paymentVouchersCost,
      p.netProfit,
      p.profitMarginPercent.toFixed(2),
      p.totalCashInflow,
      p.netCashFlow,
      p.netProfit >= 0 ? 'Profitable' : 'Deficit'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Apex_Project_Profitability_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="project-profit-dashboard-container" className="space-y-6">
      {/* 1. Header & Context */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Project Profit & Loss Dashboard
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  SLFRS 15 / IFRS 15
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Comparative financial performance: Earned Revenue vs Incurred Expenses & Client Advance Liabilities
              </p>
            </div>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAccountingPolicyNote(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
            title="Toggle Accounting Policy Rule"
          >
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>Accounting Rule</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export P&L (CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 2. Standard Accounting Policy Rule Banner */}
      {showAccountingPolicyNote && (
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200/90 flex items-start justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-amber-300 text-xs flex items-center gap-2">
                <span>Construction Accounting Principle: Client Advances Treated as Current Liability</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-200 border border-amber-700">
                  Strict Liability Rule
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Client mobilization advances and unearned milestone deposits are <strong className="text-amber-300">NOT recognized as P&L Revenue or Profit</strong>. 
                They are classified strictly as a <strong className="text-amber-300">Balance Sheet Liability (Unearned Contract Revenue)</strong> until work execution is certified by the client via Interim Payment Certificates (IPCs). 
                <span className="text-emerald-300 font-semibold ml-1">
                  Net Project Profit = Recognized Earned Revenue (excluding Advances) − Total Incurred Site Costs.
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAccountingPolicyNote(false)}
            className="text-slate-400 hover:text-slate-200 p-1"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Top Portfolio KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Earned Revenue */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Recognized Earned Income</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-mono font-black text-emerald-300">
            {formatLKR(portfolioSummary.totalNetEarned || portfolioSummary.totalGrossBilled)}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Excludes unearned advances</span>
            <span className="text-slate-300 font-mono font-semibold">
              {((portfolioSummary.totalGrossBilled / (portfolioSummary.totalContractValue || 1)) * 100).toFixed(1)}% Billed
            </span>
          </div>
        </div>

        {/* Card 2: Total Incurred Costs */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Incurred Expenses</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-mono font-black text-rose-300">
            {formatLKR(portfolioSummary.totalExpenses)}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Petty Cash, Fuel, PO & PRVs</span>
            <span className="text-slate-300 font-mono font-semibold">
              {((portfolioSummary.totalExpenses / (portfolioSummary.totalContractValue || 1)) * 100).toFixed(1)}% of Budget
            </span>
          </div>
        </div>

        {/* Card 3: Net Project Profit */}
        <div className={`p-4 rounded-2xl bg-slate-900/90 border ${
          portfolioSummary.totalNetProfit >= 0 ? 'border-emerald-800/60' : 'border-rose-800/60'
        } space-y-2`}>
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Net Operating Profit / (Loss)</span>
            {portfolioSummary.totalNetProfit >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className={`text-xl font-mono font-black ${
            portfolioSummary.totalNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {formatLKR(portfolioSummary.totalNetProfit)}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Overall Margin</span>
            <span className={`font-mono font-bold ${
              portfolioMarginPercent >= 15 ? 'text-emerald-400' : portfolioMarginPercent >= 0 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {portfolioMarginPercent.toFixed(1)}% Margin
            </span>
          </div>
        </div>

        {/* Card 4: Client Advance Liabilities */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-900/50 space-y-2 relative">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span className="flex items-center gap-1 text-amber-300">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Client Advance Liabilities</span>
            </span>
            <span className="text-[9px] font-mono px-1 rounded bg-amber-950 text-amber-300 border border-amber-800">
              Liability
            </span>
          </div>
          <div className="text-xl font-mono font-black text-amber-400">
            {formatLKR(portfolioSummary.totalAdvanceLiability)}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Unearned Mobilization Float</span>
            <span className="text-slate-300 font-mono font-semibold">
              Across {portfolioSummary.advanceLiabilityProjectsCount} Projects
            </span>
          </div>
        </div>
      </div>

      {/* 4. Comparative Bar Chart (Expenses vs Earned Revenue vs Net Profit) */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span>Comparative Performance: Earned Revenue vs Project Expenses vs Net Profit (LKR)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Comparing earned billings against direct cost incurred. Note that client advance liability is tracked separately.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span>Earned Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-rose-500" />
              <span>Incurred Costs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-indigo-400" />
              <span>Net Profit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-amber-500" />
              <span>Advance Liability</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 15, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(val) => formatShortLKR(val)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                  fontSize: '12px'
                }}
                formatter={(val: number) => [formatLKR(val), '']}
              />
              <Bar dataKey="EarnedRevenue" name="Earned Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="TotalExpenses" name="Total Incurred Costs" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="NetProfit" name="Net Profit / Loss" fill="#818cf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="AdvanceLiability" name="Advance Liability" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2.5 flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
          <input
            type="text"
            placeholder="Search project code, name, client, or site location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-0 text-slate-200 placeholder-slate-500 text-xs focus:ring-0 focus:outline-none w-full"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Client Filter */}
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Clients / Employers</option>
            {uniqueClients.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Profitability Filter */}
          <select
            value={profitFilter}
            onChange={(e) => setProfitFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Profit Statuses</option>
            <option value="PROFITABLE">Profitable (&gt; 0 LKR)</option>
            <option value="HEALTHY">High Margin (&ge; 15%)</option>
            <option value="LOW_MARGIN">Low Margin (0 - 15%)</option>
            <option value="LOSS">Loss Making / Cost Overrun</option>
            <option value="HAS_ADVANCE">Has Client Advance Liability</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-xl px-2 py-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-0 text-slate-200 text-xs focus:outline-none font-semibold cursor-pointer"
            >
              <option value="profit" className="bg-slate-900">Net Profit</option>
              <option value="margin" className="bg-slate-900">Margin %</option>
              <option value="revenue" className="bg-slate-900">Earned Revenue</option>
              <option value="expenses" className="bg-slate-900">Incurred Cost</option>
              <option value="advance" className="bg-slate-900">Advance Liability</option>
              <option value="contract" className="bg-slate-900">Contract Value</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="text-slate-400 hover:text-slate-200 ml-1 p-0.5 rounded text-xs font-mono"
              title="Toggle sort direction"
            >
              {sortOrder === 'desc' ? '▼' : '▲'}
            </button>
          </div>
        </div>
      </div>

      {/* 6. Comprehensive Project Profit & Loss Comparison Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Project-Wise Income vs Expense & Profit Reconciliation Matrix</span>
            </h3>
            <p className="text-xs text-slate-400">
              Showing {filteredProjects.length} projects. Click on any row to open the complete Financial Statement & Reconciliation.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="text-slate-400">Total Filtered Profit:</span>
            <span className={`font-mono font-bold ${
              filteredProjects.reduce((s, p) => s + p.netProfit, 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {formatLKR(filteredProjects.reduce((s, p) => s + p.netProfit, 0))}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4 text-right">Contract Budget</th>
                <th className="py-3 px-4 text-right">
                  <span className="text-emerald-400">Earned Revenue</span>
                  <div className="text-[9px] text-slate-500 font-normal">Excl. Advance</div>
                </th>
                <th className="py-3 px-4 text-right">
                  <span className="text-amber-400">Advance Liability</span>
                  <div className="text-[9px] text-amber-500/80 font-normal">Balance Sheet</div>
                </th>
                <th className="py-3 px-4 text-right">
                  <span className="text-rose-400">Total Expenses</span>
                  <div className="text-[9px] text-slate-500 font-normal">Direct Site Costs</div>
                </th>
                <th className="py-3 px-4 text-right">
                  <span>Net Profit / (Loss)</span>
                  <div className="text-[9px] text-slate-500 font-normal">P&L Operating</div>
                </th>
                <th className="py-3 px-4 text-center">Margin %</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    No projects match the selected search or profitability filters.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p, idx) => {
                  const isProfitable = p.netProfit >= 0;
                  const isHealthy = p.profitMarginPercent >= 15;
                  const isLoss = p.netProfit < 0;

                  return (
                    <tr
                      key={`${p.projectCode}-${idx}`}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedProjectCode(p.projectCode)}
                    >
                      {/* Project Code & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-purple-300 bg-slate-950 px-2 py-0.5 rounded border border-purple-900/50 text-[11px]">
                            {p.projectCode}
                          </span>
                        </div>
                        <div className="text-slate-200 font-semibold mt-0.5 max-w-xs truncate" title={p.projectName}>
                          {p.projectName}
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4 text-slate-400 max-w-[160px] truncate" title={p.client}>
                        {p.client}
                      </td>

                      {/* Contract Value */}
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        {formatLKR(p.contractValue)}
                      </td>

                      {/* Earned Revenue (Excluding Advances) */}
                      <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">
                        {formatLKR(p.netEarnedRevenue || p.grossBilledRevenue)}
                      </td>

                      {/* Client Advance Liability */}
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {p.advanceLiability > 0 ? (
                          <div className="inline-flex items-center gap-1 text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/60">
                            <span>{formatLKR(p.advanceLiability)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Total Incurred Expenses */}
                      <td className="py-3 px-4 text-right font-mono text-rose-300 font-bold">
                        {formatLKR(p.totalExpenses)}
                      </td>

                      {/* Net Profit */}
                      <td className="py-3 px-4 text-right font-mono font-black">
                        <span className={isProfitable ? 'text-emerald-400' : 'text-rose-400'}>
                          {formatLKR(p.netProfit)}
                        </span>
                      </td>

                      {/* Margin % */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                          isHealthy
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : isProfitable
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {p.profitMarginPercent.toFixed(1)}%
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {isLoss ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400">
                            <AlertCircle className="w-3 h-3" />
                            <span>Overrun</span>
                          </span>
                        ) : isHealthy ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Strong</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
                            <Clock className="w-3 h-3" />
                            <span>Moderate</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedProjectCode(p.projectCode)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-purple-400" />
                          <span>P&L Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Comprehensive Single-Project Drill-Down & Reconciliation Modal */}
      {activeModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-lg bg-purple-950 border border-purple-800 text-purple-300 font-mono font-bold text-xs">
                    {activeModalProject.projectCode}
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {activeModalProject.projectName}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-3">
                  <span>Client: <strong className="text-slate-200">{activeModalProject.client}</strong></span>
                  <span>Location: <strong className="text-slate-200">{activeModalProject.location}</strong></span>
                  <span>Contract Budget: <strong className="text-slate-200">{formatLKR(activeModalProject.contractValue)}</strong></span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProjectCode(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reconciliation KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Recognized Earned Income</span>
                <span className="text-lg font-mono font-black text-emerald-400 mt-0.5 block">
                  {formatLKR(activeModalProject.netEarnedRevenue || activeModalProject.grossBilledRevenue)}
                </span>
                <span className="text-[10px] text-slate-500">Excludes Advance Deposits</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Incurred Cost</span>
                <span className="text-lg font-mono font-black text-rose-400 mt-0.5 block">
                  {formatLKR(activeModalProject.totalExpenses)}
                </span>
                <span className="text-[10px] text-slate-500">Site Direct Expenditures</span>
              </div>

              <div className={`p-3.5 rounded-xl bg-slate-950/80 border ${
                activeModalProject.netProfit >= 0 ? 'border-emerald-800/60' : 'border-rose-800/60'
              }`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Project Profit</span>
                <span className={`text-lg font-mono font-black mt-0.5 block ${
                  activeModalProject.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {formatLKR(activeModalProject.netProfit)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {activeModalProject.profitMarginPercent.toFixed(1)}% Profit Margin
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/50">
                <span className="text-[10px] uppercase font-bold text-amber-300 block">Client Advance Liability</span>
                <span className="text-lg font-mono font-black text-amber-400 mt-0.5 block">
                  {formatLKR(activeModalProject.advanceLiability)}
                </span>
                <span className="text-[10px] text-amber-300/70">Unearned Liability Balance</span>
              </div>
            </div>

            {/* Side-by-Side Accounting Breakdown: Revenue Side vs Cost Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Revenue & Liability Accounting */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5" />
                    <span>Revenue & Client Liability</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">P&L vs Balance Sheet</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Gross Certified Invoices Issued</span>
                    <span className="font-mono text-slate-200 font-semibold">{formatLKR(activeModalProject.grossBilledRevenue)}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Less: Output VAT (18%)</span>
                    <span className="font-mono text-slate-400">-{formatLKR(activeModalProject.outputVat)}</span>
                  </div>

                  <div className="flex justify-between py-1 bg-emerald-950/20 px-2 rounded font-bold text-emerald-300">
                    <span>Recognized Net Earned Revenue (P&L)</span>
                    <span className="font-mono">{formatLKR(activeModalProject.netEarnedRevenue || activeModalProject.grossBilledRevenue)}</span>
                  </div>

                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">Advance Liability Accounting</span>
                    <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Mobilization Advance Received</span>
                        <span className="font-mono text-amber-400 font-semibold">+{formatLKR(activeModalProject.advanceReceived)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Advance Recovered via IPCs</span>
                        <span className="font-mono text-slate-400">-{formatLKR(activeModalProject.advanceRecovered)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold border-t border-slate-800 pt-1 text-amber-300">
                        <span>Current Contract Liability to Client</span>
                        <span className="font-mono">{formatLKR(activeModalProject.advanceLiability)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between py-1 pt-2">
                    <span className="text-slate-400">Certified Cash Collected from Client</span>
                    <span className="font-mono text-slate-200">{formatLKR(activeModalProject.earnedCashCollected)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Outstanding Certified Receivables</span>
                    <span className="font-mono text-amber-400 font-semibold">{formatLKR(activeModalProject.outstandingReceivables)}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Direct Cost Breakdown */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Incurred Site Cost Breakdown</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">5-Source ERP Cost</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-slate-300">Site Petty Cash Vouchers</span>
                    </div>
                    <span className="font-mono text-slate-200 font-semibold">{formatLKR(activeModalProject.pettyCashCost)}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                    <div className="flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-slate-300">Fleet Diesel & Fuel Dispensed</span>
                    </div>
                    <span className="font-mono text-slate-200 font-semibold">{formatLKR(activeModalProject.fuelCost)}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-slate-300">Heavy Plant & Vehicle Maintenance</span>
                    </div>
                    <span className="font-mono text-slate-200 font-semibold">{formatLKR(activeModalProject.maintenanceCost)}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-slate-300">Site Materials Procurement (POs)</span>
                    </div>
                    <span className="font-mono text-slate-200 font-semibold">{formatLKR(activeModalProject.procurementCost)}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-slate-300">Subcontractor Payment Vouchers (PRVs)</span>
                    </div>
                    <span className="font-mono text-slate-200 font-semibold">{formatLKR(activeModalProject.paymentVouchersCost)}</span>
                  </div>

                  <div className="flex justify-between py-1.5 bg-rose-950/20 px-2 rounded font-bold text-rose-300 mt-2">
                    <span>Total Incurred Actual Expenses</span>
                    <span className="font-mono">{formatLKR(activeModalProject.totalExpenses)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reconciliation Statement: Cash Flow vs Net Profit */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-purple-400" />
                <span>Reconciliation of Cash Flow vs Operating Profit</span>
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Total Cash Inflow is <strong className="text-slate-200">{formatLKR(activeModalProject.totalCashInflow)}</strong> 
                (which includes <strong className="text-amber-300">{formatLKR(activeModalProject.advanceReceived)}</strong> in unearned client advances).
                Because the advance is an unearned liability, the Net Cash Flow of <strong className="text-indigo-300">{formatLKR(activeModalProject.netCashFlow)}</strong> 
                exceeds the true Net Operating Profit of <strong className={activeModalProject.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatLKR(activeModalProject.netProfit)}</strong> 
                by the unearned advance liability buffer.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {onSelectProjectForCost && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectProjectForCost(activeModalProject.projectCode);
                    setSelectedProjectCode(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/25 transition-all"
                >
                  View Cost Tracking Details
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedProjectCode(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
