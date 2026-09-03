import React, { useState, useMemo } from 'react';
import {
  FileText,
  PlusCircle,
  Download,
  Search,
  Filter,
  DollarSign,
  Building,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Printer,
  Edit2,
  Trash2,
  Percent,
  TrendingUp,
  Scale,
  Calendar,
  Layers,
  ArrowUpRight,
  Sparkles,
  Check,
  X,
  Upload
} from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';
import { Income, InvoicePaymentStatus, Project } from '../../types/pettyCashTypes';
import { formatLkr, VAT_RATE, round2 } from '../../utils/vatCalculations';
import { ProjectInvoiceModal } from './ProjectInvoiceModal';
import { RecordInvoicePaymentModal } from './RecordInvoicePaymentModal';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import { BulkImportInvoicesModal } from './BulkImportInvoicesModal';

interface ProjectInvoicesViewProps {
  initialProjectCode?: string;
  onNavigateToProjects?: () => void;
  onNavigateToClientPayments?: () => void;
}

export const ProjectInvoicesView: React.FC<ProjectInvoicesViewProps> = ({
  initialProjectCode,
  onNavigateToProjects,
  onNavigateToClientPayments
}) => {
  const {
    income,
    expenses,
    projects,
    deleteIncome,
    exportToCsv,
    userRole
  } = usePettyCash();

  // Active sub-tab: 'invoices-list' or 'project-reconciliation'
  const [activeSubTab, setActiveSubTab] = useState<'invoices-list' | 'project-reconciliation'>('invoices-list');

  // Filters
  const [selectedProject, setSelectedProject] = useState<string>(initialProjectCode || 'ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchScope, setSearchScope] = useState<'ALL' | 'CLIENT' | 'INVOICE' | 'PROJECT'>('ALL');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  // Modals state
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState<boolean>(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState<boolean>(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Income | null>(null);
  const [invoiceForPayment, setInvoiceForPayment] = useState<Income | null>(null);
  const [invoiceForDetail, setInvoiceForDetail] = useState<Income | null>(null);

  // All Invoices (filtered to TRANSACTION_TYPE === 'PROJECT_INVOICE_INCOME' or records with invoiceNumber)
  const projectInvoices = useMemo(() => {
    return income.filter(inc =>
      inc.TRANSACTION_TYPE === 'PROJECT_INVOICE_INCOME' ||
      Boolean(inc.invoiceNumber) ||
      inc.INCOME_SOURCE === 'Project Income / Invoice'
    );
  }, [income]);

  // Filtered Invoices according to UI selection
  const filteredInvoices = useMemo(() => {
    return projectInvoices.filter(inv => {
      // Project filter
      if (selectedProject !== 'ALL') {
        const invProj = (inv.PROJECT || '').toUpperCase();
        if (invProj !== selectedProject.toUpperCase()) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        const status = inv.paymentStatus || 'Pending';
        if (statusFilter === 'Overdue') {
          const isOverdue = status !== 'Paid' && inv.dueDate && new Date(inv.dueDate) < new Date();
          if (!isOverdue) return false;
        } else if (status !== statusFilter) {
          return false;
        }
      }

      // Search Query: Client Name, Invoice Number, or Project Code
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const client = (inv.clientName || inv.clientCode || '').toLowerCase();
        const num = (inv.invoiceNumber || inv.INCOME_ID || '').toLowerCase();
        const proj = (inv.PROJECT || '').toLowerCase();
        const desc = (inv.billingDescription || inv.invoiceDescription || inv.REMARKS || '').toLowerCase();

        if (searchScope === 'CLIENT') {
          if (!client.includes(q)) return false;
        } else if (searchScope === 'INVOICE') {
          if (!num.includes(q)) return false;
        } else if (searchScope === 'PROJECT') {
          if (!proj.includes(q)) return false;
        } else {
          // 'ALL': Match client name, invoice number, or project code (or description)
          const matches = client.includes(q) || num.includes(q) || proj.includes(q) || desc.includes(q);
          if (!matches) return false;
        }
      }

      // Date Range Filter
      if (dateRange.start) {
        const invDate = inv.invoiceDate || inv.DATE_REF || '';
        if (invDate && invDate < dateRange.start) return false;
      }
      if (dateRange.end) {
        const invDate = inv.invoiceDate || inv.DATE_REF || '';
        if (invDate && invDate > dateRange.end) return false;
      }

      return true;
    });
  }, [projectInvoices, selectedProject, statusFilter, searchQuery, searchScope, dateRange]);

  // Top KPIs metrics based on current filtered project
  const metrics = useMemo(() => {
    const targetInvoices = selectedProject === 'ALL'
      ? projectInvoices
      : projectInvoices.filter(i => (i.PROJECT || '').toUpperCase() === selectedProject.toUpperCase());

    let totalGrossBilled = 0;
    let totalNetBilled = 0;
    let totalVatBilled = 0;
    let totalReceived = 0;
    let totalBalanceDue = 0;
    let overdueCount = 0;
    let paidCount = 0;
    let pendingCount = 0;
    const now = new Date();

    targetInvoices.forEach(inv => {
      const gross = inv.grossAmount ?? inv.AMOUNT ?? 0;
      const net = inv.netAmount ?? gross;
      const vat = inv.vatAmount ?? 0;
      const received = inv.amountReceived ?? 0;
      const due = inv.balanceDue !== undefined ? inv.balanceDue : Math.max(0, gross - received);

      totalGrossBilled += gross;
      totalNetBilled += net;
      totalVatBilled += vat;
      totalReceived += received;
      totalBalanceDue += due;

      const isOverdue = inv.paymentStatus !== 'Paid' && inv.dueDate && new Date(inv.dueDate) < now;
      if (isOverdue) overdueCount++;

      if (inv.paymentStatus === 'Paid' || due <= 0) {
        paidCount++;
      } else {
        pendingCount++;
      }
    });

    const collectionRate = totalGrossBilled > 0 ? (totalReceived / totalGrossBilled) * 100 : 0;

    return {
      totalCount: targetInvoices.length,
      totalGrossBilled: round2(totalGrossBilled),
      totalNetBilled: round2(totalNetBilled),
      totalVatBilled: round2(totalVatBilled),
      totalReceived: round2(totalReceived),
      totalBalanceDue: round2(totalBalanceDue),
      overdueCount,
      paidCount,
      pendingCount,
      collectionRate
    };
  }, [projectInvoices, selectedProject]);

  // Project-by-Project Reconciliation Financials (Revenue vs Expenses vs VAT Position)
  const projectFinancialSummaries = useMemo(() => {
    return projects.map(proj => {
      const pCode = proj.PROJECT_CODE.toUpperCase();

      // Invoices for this project
      const pInvoices = projectInvoices.filter(i => (i.PROJECT || '').toUpperCase() === pCode);
      const grossBilled = pInvoices.reduce((sum, i) => sum + (i.grossAmount ?? i.AMOUNT ?? 0), 0);
      const netBilled = pInvoices.reduce((sum, i) => sum + (i.netAmount ?? i.AMOUNT ?? 0), 0);
      const outputVat = pInvoices.reduce((sum, i) => sum + (i.vatAmount ?? 0), 0);
      const cashCollected = pInvoices.reduce((sum, i) => sum + (i.amountReceived ?? 0), 0);
      const receivables = Math.max(0, grossBilled - cashCollected);

      // Expenses for this project (Approved / Paid)
      const pExpenses = expenses.filter(e =>
        (e.PROJECT || '').toUpperCase() === pCode &&
        (e.PAYMENT_STATUS === 'Approved' || e.PAYMENT_STATUS === 'Paid' || e.PAYMENT_STATUS === 'Reimbursed')
      );
      const grossCost = pExpenses.reduce((sum, e) => sum + (e.grossAmount ?? e.AMOUNT ?? 0), 0);
      const netCost = pExpenses.reduce((sum, e) => sum + (e.netAmount ?? e.AMOUNT ?? 0), 0);
      const inputVat = pExpenses.reduce((sum, e) => sum + (e.vatAmount ?? 0), 0);

      // Net VAT Position = Output VAT (from sales invoices) - Input VAT (from purchase expenses)
      // If positive -> VAT payable to Inland Revenue Department
      // If negative -> VAT refund / tax credit
      const netVatPosition = round2(outputVat - inputVat);

      // Net Margin (Net Revenue - Net Cost)
      const netProfit = round2(netBilled - netCost);
      const profitMargin = netBilled > 0 ? (netProfit / netBilled) * 100 : 0;

      return {
        project: proj,
        invoiceCount: pInvoices.length,
        grossBilled: round2(grossBilled),
        netBilled: round2(netBilled),
        outputVat: round2(outputVat),
        cashCollected: round2(cashCollected),
        receivables: round2(receivables),
        grossCost: round2(grossCost),
        netCost: round2(netCost),
        inputVat: round2(inputVat),
        netVatPosition,
        netProfit,
        profitMargin
      };
    });
  }, [projects, projectInvoices, expenses]);

  // Handle Delete Invoice
  const handleDeleteInvoice = (inv: Income) => {
    const num = inv.invoiceNumber || inv.INCOME_ID;
    if (window.confirm(`Are you sure you want to permanently delete Invoice "${num}" for ${inv.PROJECT}?\n\nThis will remove the billing record and associated VAT calculations.`)) {
      deleteIncome(inv.id);
    }
  };

  return (
    <div className="space-y-5 pb-14 font-sans">
      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-400" />
            <span>Project Invoices & Revenue Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Certified milestone contractor billing, Inland Revenue 18% VAT tracking & client receivable ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tab switcher button */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveSubTab('invoices-list')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'invoices-list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Invoices Ledger</span>
            </button>
            <button
              onClick={() => setActiveSubTab('project-reconciliation')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'project-reconciliation'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>VAT & Profit Reconciliation</span>
            </button>
          </div>

          {onNavigateToClientPayments && (
            <button
              onClick={onNavigateToClientPayments}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all"
              title="View Client Payments and Collections"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Client Payments</span>
            </button>
          )}

          <button
            id="btn-export-invoices-csv"
            onClick={() => exportToCsv('income')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all"
            title="Export full invoice ledger to CSV"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {(userRole === 'ADMIN' || userRole === 'FINANCE') && (
            <>
              <button
                id="btn-bulk-import-invoices"
                onClick={() => setIsBulkImportOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm hover:border-slate-600 transition-all cursor-pointer"
                title="Bulk import project invoices from Excel or CSV"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                <span>Bulk Import</span>
              </button>

              <button
                id="btn-new-project-invoice"
                onClick={() => {
                  setInvoiceToEdit(null);
                  setIsNewInvoiceOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Project Invoice</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4-Card Executive KPI Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Gross Billed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Billed (Gross)</span>
            <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-400 font-mono text-[11px] font-bold">
              {metrics.totalCount} {metrics.totalCount === 1 ? 'Inv' : 'Invs'}
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-white">
            {formatLkr(metrics.totalGrossBilled)}
          </p>
          <div className="text-[11px] text-slate-400 pt-0.5 flex items-center justify-between font-mono">
            <span>Net Billing: {formatLkr(metrics.totalNetBilled)}</span>
          </div>
        </div>

        {/* Card 2: Output VAT (18%) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-emerald-400 flex items-center gap-1">
              <Percent className="w-3 h-3" />
              <span>Output VAT (18%)</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
              Inland Revenue
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
            {formatLkr(metrics.totalVatBilled)}
          </p>
          <div className="text-[11px] text-slate-400 pt-0.5 font-mono">
            Collected / Billed on client certificates
          </div>
        </div>

        {/* Card 3: Payments Received */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-blue-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Collected Revenue</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold font-mono">
              {metrics.collectionRate.toFixed(1)}% Realized
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-blue-300">
            {formatLkr(metrics.totalReceived)}
          </p>
          <div className="text-[11px] text-slate-400 pt-0.5 font-mono">
            {metrics.paidCount} Fully Paid • {metrics.pendingCount} Active
          </div>
        </div>

        {/* Card 4: Outstanding Receivables */}
        <div className={`border rounded-2xl p-4 shadow-md space-y-1 ${
          metrics.overdueCount > 0
            ? 'bg-rose-950/20 border-rose-800/80 ring-1 ring-rose-500/30'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-amber-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Balance Due (Receivables)</span>
            </span>
            {metrics.overdueCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                {metrics.overdueCount} Overdue
              </span>
            )}
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-amber-400">
            {formatLkr(metrics.totalBalanceDue)}
          </p>
          <div className="text-[11px] text-slate-400 pt-0.5">
            Pending client remittances & certifications
          </div>
        </div>
      </div>

      {activeSubTab === 'invoices-list' ? (
        <>
          {/* Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-md space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Search Bar with Scope Selector */}
              <div className="flex-1 min-w-[280px] flex items-center bg-slate-950 border border-slate-700 rounded-xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                {/* Search Scope Selector */}
                <select
                  id="search-scope-select"
                  value={searchScope}
                  onChange={(e) => setSearchScope(e.target.value as 'ALL' | 'CLIENT' | 'INVOICE' | 'PROJECT')}
                  className="bg-slate-900 border-r border-slate-700 text-slate-300 text-xs px-2.5 py-2 font-medium focus:outline-none cursor-pointer hover:bg-slate-850"
                  title="Choose field to search"
                >
                  <option value="ALL">All Fields</option>
                  <option value="CLIENT">Client Name</option>
                  <option value="INVOICE">Invoice #</option>
                  <option value="PROJECT">Project Code</option>
                </select>

                {/* Input with Icon and Clear button */}
                <div className="relative flex-1 flex items-center">
                  <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
                  <input
                    id="search-invoices-input"
                    type="text"
                    placeholder={
                      searchScope === 'CLIENT'
                        ? 'Search by client name...'
                        : searchScope === 'INVOICE'
                        ? 'Search by invoice # (e.g. INV-2026)...'
                        : searchScope === 'PROJECT'
                        ? 'Search by project code (e.g. PIDM)...'
                        : 'Search by client name, invoice number, or project code...'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent pl-2.5 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 p-0.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Clear search query"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Project Dropdown Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium">Project:</span>
                <select
                  id="filter-project-invoices-select"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="ALL">All Projects ({projectInvoices.length})</option>
                  {projects.map(p => {
                    const count = projectInvoices.filter(i => (i.PROJECT || '').toUpperCase() === p.PROJECT_CODE.toUpperCase()).length;
                    return (
                      <option key={p.id} value={p.PROJECT_CODE}>
                        {p.PROJECT_CODE} — {p.PROJECT_NAME} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Status Tabs Filter */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                {['ALL', 'Pending', 'Partially Paid', 'Paid', 'Overdue'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      statusFilter === st
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Active search filter feedback chip bar */}
            {searchQuery.trim() && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  <span>
                    Searching for <strong className="text-white font-mono">"{searchQuery}"</strong> in{' '}
                    <strong className="text-indigo-400">
                      {searchScope === 'ALL'
                        ? 'Client, Invoice #, or Project Code'
                        : searchScope === 'CLIENT'
                        ? 'Client Name'
                        : searchScope === 'INVOICE'
                        ? 'Invoice Number'
                        : 'Project Code'}
                    </strong>
                    {' '}— found <span className="font-bold text-emerald-400 font-mono">{filteredInvoices.length}</span> matching {filteredInvoices.length === 1 ? 'invoice' : 'invoices'}
                  </span>
                </div>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 font-medium"
                >
                  <X className="w-3 h-3" />
                  <span>Clear Search</span>
                </button>
              </div>
            )}
          </div>

          {/* Invoices Ledger Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-800 text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-3.5">Invoice #</th>
                    <th className="py-3 px-3">Project</th>
                    <th className="py-3 px-3">Client / Organization</th>
                    <th className="py-3 px-3">Billing Scope / Milestone</th>
                    <th className="py-3 px-3">Dates</th>
                    <th className="py-3 px-3 text-right">Net Amount</th>
                    <th className="py-3 px-3 text-right">Output VAT (18%)</th>
                    <th className="py-3 px-3 text-right font-black">Gross Total</th>
                    <th className="py-3 px-3 text-right text-blue-300">Received</th>
                    <th className="py-3 px-3 text-right text-amber-400">Balance Due</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center min-w-[130px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-500 font-sans">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-400" />
                        <p className="font-semibold text-slate-400 text-sm">
                          {searchQuery.trim() ? `No Invoices Matching "${searchQuery}"` : 'No Invoices Found'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                          {searchQuery.trim() ? (
                            <span>
                              We could not find any invoice matching <strong className="text-slate-300">"{searchQuery}"</strong> in{' '}
                              {searchScope === 'CLIENT'
                                ? 'client names'
                                : searchScope === 'INVOICE'
                                ? 'invoice numbers'
                                : searchScope === 'PROJECT'
                                ? 'project codes'
                                : 'client name, invoice number, or project code'}
                              {selectedProject !== 'ALL' && ` for project ${selectedProject}`}.
                            </span>
                          ) : selectedProject !== 'ALL' ? (
                            `No certified billing invoices recorded for project ${selectedProject}.`
                          ) : (
                            'No project invoices recorded yet.'
                          )}
                        </p>

                        <div className="flex items-center justify-center gap-2 mt-4">
                          {searchQuery.trim() && (
                            <button
                              id="btn-clear-search-empty-state"
                              onClick={() => {
                                setSearchQuery('');
                                setSearchScope('ALL');
                              }}
                              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 shadow-md border border-slate-700 transition-colors"
                            >
                              <X className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Clear Search Filter</span>
                            </button>
                          )}

                          {(userRole === 'ADMIN' || userRole === 'FINANCE') && (
                            <div className="flex items-center gap-2">
                              <button
                                id="btn-empty-bulk-import-invoices"
                                onClick={() => setIsBulkImportOpen(true)}
                                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                              >
                                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Bulk Import Invoices</span>
                              </button>

                              <button
                                id="btn-create-first-invoice"
                                onClick={() => {
                                  setInvoiceToEdit(null);
                                  setIsNewInvoiceOpen(true);
                                }}
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Create New Invoice</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const gross = inv.grossAmount ?? inv.AMOUNT;
                      const net = inv.netAmount ?? gross;
                      const vat = inv.vatAmount ?? 0;
                      const received = inv.amountReceived ?? 0;
                      const due = inv.balanceDue !== undefined ? inv.balanceDue : Math.max(0, gross - received);
                      const status = inv.paymentStatus || (due <= 0 ? 'Paid' : received > 0 ? 'Partially Paid' : 'Pending');

                      const isOverdue = status !== 'Paid' && inv.dueDate && new Date(inv.dueDate) < new Date();

                      return (
                        <tr
                          key={inv.id}
                          className="hover:bg-slate-800/50 transition-colors font-sans"
                        >
                          {/* Invoice # */}
                          <td className="py-3 px-3.5">
                            <button
                              onClick={() => setInvoiceForDetail(inv)}
                              className="font-mono font-bold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
                              title="Click to view full Tax Invoice"
                            >
                              <span>{inv.invoiceNumber || inv.INCOME_ID}</span>
                              <ArrowUpRight className="w-3 h-3 opacity-60" />
                            </button>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {inv.INCOME_ID}
                            </div>
                          </td>

                          {/* Project */}
                          <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                            {inv.PROJECT}
                          </td>

                          {/* Client */}
                          <td className="py-3 px-3 font-medium text-slate-200 truncate max-w-[150px]" title={inv.clientName}>
                            {inv.clientName || 'National Water Supply & Drainage Board'}
                          </td>

                          {/* Billing Scope */}
                          <td className="py-3 px-3 text-xs text-slate-300 truncate max-w-[180px]" title={inv.billingDescription || inv.REMARKS}>
                            {inv.billingDescription || inv.REMARKS || 'Certified milestone billing'}
                          </td>

                          {/* Dates */}
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            <div>Inv: {inv.invoiceDate || inv.DATE_REF || inv.DATE}</div>
                            {inv.dueDate && (
                              <div className={isOverdue ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                                Due: {inv.dueDate} {isOverdue && '⚠️'}
                              </div>
                            )}
                          </td>

                          {/* Net */}
                          <td className="py-3 px-3 text-right font-mono text-slate-300">
                            {formatLkr(net)}
                          </td>

                          {/* Output VAT */}
                          <td className="py-3 px-3 text-right font-mono text-emerald-400 font-semibold">
                            {formatLkr(vat)}
                          </td>

                          {/* Gross */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-white">
                            {formatLkr(gross)}
                          </td>

                          {/* Received */}
                          <td className="py-3 px-3 text-right font-mono text-blue-300 font-semibold">
                            {formatLkr(received)}
                          </td>

                          {/* Balance Due */}
                          <td className="py-3 px-3 text-right font-mono font-bold">
                            <span className={due > 0 ? (isOverdue ? 'text-rose-400' : 'text-amber-400') : 'text-slate-500'}>
                              {formatLkr(due)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              status === 'Paid'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : status === 'Partially Paid'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : isOverdue
                                ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {isOverdue ? 'Overdue' : status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Record Payment Button */}
                              {due > 0 && (
                                <button
                                  onClick={() => setInvoiceForPayment(inv)}
                                  title="Record Payment / Collection"
                                  className="p-1.5 rounded-lg bg-emerald-900/40 hover:bg-emerald-800 text-emerald-300 transition-colors"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* View / Print Tax Invoice */}
                              <button
                                onClick={() => setInvoiceForDetail(inv)}
                                title="View & Print Official Tax Invoice"
                                className="p-1.5 rounded-lg bg-indigo-900/40 hover:bg-indigo-800 text-indigo-300 transition-colors"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => {
                                  setInvoiceToEdit(inv);
                                  setIsNewInvoiceOpen(true);
                                }}
                                title="Edit Invoice Details"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              {(userRole === 'ADMIN' || userRole === 'FINANCE') && (
                                <button
                                  onClick={() => handleDeleteInvoice(inv)}
                                  title="Delete Invoice"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Project-by-Project Reconciliation Financials */
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-emerald-400" />
                  <span>Project P&L & Inland Revenue VAT Reconciliation Matrix</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consolidates certified billing revenue, 18% Output VAT liability, direct project costs, 18% Input VAT credits, and Net Tax Position.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                  Standard VAT Rate: <strong>{VAT_RATE}%</strong>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-800 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Project Code</th>
                    <th className="py-2.5 px-3">Project Name & Client</th>
                    <th className="py-2.5 px-3 text-right">Net Revenue</th>
                    <th className="py-2.5 px-3 text-right text-emerald-400">Output VAT (18%)</th>
                    <th className="py-2.5 px-3 text-right">Gross Invoiced</th>
                    <th className="py-2.5 px-3 text-right text-blue-300">Cash Received</th>
                    <th className="py-2.5 px-3 text-right text-amber-400">Receivables</th>
                    <th className="py-2.5 px-3 text-right text-rose-300">Net Cost (Spent)</th>
                    <th className="py-2.5 px-3 text-right text-purple-300">Input VAT Credit</th>
                    <th className="py-2.5 px-3 text-right font-black">Net VAT Position</th>
                    <th className="py-2.5 px-3 text-right font-black text-emerald-300">Net Profit</th>
                    <th className="py-2.5 px-3 text-center">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {projectFinancialSummaries.map(p => (
                    <tr key={p.project.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-emerald-400">
                        {p.project.PROJECT_CODE}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <p className="font-semibold text-slate-200">{p.project.PROJECT_NAME}</p>
                        <p className="text-[10px] text-slate-500">{p.project.CLIENT_NAME || p.project.CLIENT || 'National Water Supply'}</p>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-200">
                        {formatLkr(p.netBilled)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                        {formatLkr(p.outputVat)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">
                        {formatLkr(p.grossBilled)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-blue-300">
                        {formatLkr(p.cashCollected)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-400 font-bold">
                        {formatLkr(p.receivables)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-300">
                        {formatLkr(p.netCost)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-purple-300">
                        {formatLkr(p.inputVat)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black">
                        <span className={p.netVatPosition >= 0 ? 'text-amber-300' : 'text-emerald-400'}>
                          {p.netVatPosition >= 0 ? `+${formatLkr(p.netVatPosition)} (Payable)` : `${formatLkr(p.netVatPosition)} (Credit)`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black">
                        <span className={p.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {formatLkr(p.netProfit)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.profitMargin >= 15
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : p.profitMargin > 0
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {p.profitMargin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Project Invoice Creation / Edit Modal */}
      <ProjectInvoiceModal
        isOpen={isNewInvoiceOpen}
        onClose={() => {
          setIsNewInvoiceOpen(false);
          setInvoiceToEdit(null);
        }}
        invoiceToEdit={invoiceToEdit}
        onSuccess={(invId) => {
          // auto open detail or close
        }}
      />

      {/* Record Invoice Payment Modal */}
      <RecordInvoicePaymentModal
        isOpen={Boolean(invoiceForPayment)}
        onClose={() => setInvoiceForPayment(null)}
        invoice={invoiceForPayment}
        onSuccess={() => setInvoiceForPayment(null)}
      />

      {/* Tax Invoice Detail / Print Preview Modal */}
      <InvoiceDetailModal
        isOpen={Boolean(invoiceForDetail)}
        onClose={() => setInvoiceForDetail(null)}
        invoice={invoiceForDetail}
        onOpenRecordPayment={(inv) => {
          setInvoiceForDetail(null);
          setInvoiceForPayment(inv);
        }}
        onOpenEdit={(inv) => {
          setInvoiceForDetail(null);
          setInvoiceToEdit(inv);
          setIsNewInvoiceOpen(true);
        }}
      />

      {/* Bulk Import Invoices Modal */}
      <BulkImportInvoicesModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />
    </div>
  );
};
