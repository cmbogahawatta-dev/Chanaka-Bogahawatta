import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  ShieldCheck,
  CreditCard,
  Ban,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Settings,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Eye,
  Building,
  TrendingUp,
  Trash2,
  Edit3,
  Landmark,
  RotateCcw
} from 'lucide-react';
import { TaxInvoice, TaxInvoiceStatus } from '../../types/taxInvoiceTypes';
import { useTaxInvoice } from '../../context/TaxInvoiceContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { useEnterpriseBanking } from '../../context/EnterpriseBankingContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { formatDateToGazette, runComplianceTests } from '../../utils/taxInvoiceUtils';
import { UniversalDeleteModal } from '../common/UniversalDeleteModal';
import { AdminClearHistoryButton } from '../common/AdminClearHistoryButton';

import { TaxInvoiceDetailModal } from './TaxInvoiceDetailModal';
import { CreateTaxInvoiceModal } from './CreateTaxInvoiceModal';
import { RecordPaymentModal } from './RecordPaymentModal';
import { CancelInvoiceModal } from './CancelInvoiceModal';
import { CreditNoteModal } from './CreditNoteModal';
import { TaxInvoicePreviewModal } from './TaxInvoicePreviewModal';

export const TaxInvoiceRegisterView: React.FC = () => {
  const {
    invoices,
    settings,
    payments,
    activeInvoiceTab,
    setActiveInvoiceTab,
    previewNextSerialNumber,
    downloadInvoicePdf,
    printInvoicePdf,
    deleteInvoice,
    clearTaxInvoicesHistory,
    resetTaxInvoicesToDefault,
    updateSettings,
    autoSyncPettyCashInvoices,
    setAutoSyncPettyCashInvoices,
    syncFromPettyCash,
    deletedIdentifiersCount,
    resetDeletedIdentifiers
  } = useTaxInvoice();

  const { currentUser } = useEnterprise();
  const { accounts } = useEnterpriseBanking();
  const { income } = usePettyCash();

  // Sync notifications & feedback
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const availablePettyCashCount = useMemo(() => {
    if (!income) return 0;
    return income.filter(inc =>
      inc.TRANSACTION_TYPE === 'PROJECT_INVOICE_INCOME' ||
      Boolean(inc.invoiceNumber) ||
      inc.INCOME_SOURCE === 'Project Income / Invoice'
    ).length;
  }, [income]);

  const unsyncedPettyCashCount = useMemo(() => {
    if (!income) return 0;
    const existingSerials = new Set(invoices.map(i => (i.serialNumber || '').trim().toUpperCase()));
    const existingIds = new Set(invoices.map(i => i.id));
    const existingLegacyIds = new Set(invoices.map(i => i.legacyIncomeId).filter(Boolean));

    return income.filter(inc => {
      const isProj = inc.TRANSACTION_TYPE === 'PROJECT_INVOICE_INCOME' || Boolean(inc.invoiceNumber) || inc.INCOME_SOURCE === 'Project Income / Invoice';
      if (!isProj) return false;
      const serial = (inc.invoiceNumber || inc.INCOME_ID || `INV-LEGACY-${inc.id}`).toUpperCase();
      return !existingSerials.has(serial) && !existingIds.has(inc.id) && !existingLegacyIds.has(inc.id);
    }).length;
  }, [income, invoices]);

  const handleManualSync = (forceIncludeDeleted = false) => {
    const res = syncFromPettyCash(forceIncludeDeleted);
    setSyncFeedback({
      message: res.message,
      type: res.addedCount > 0 ? 'success' : 'info'
    });
    setTimeout(() => setSyncFeedback(null), 6000);
  };

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<TaxInvoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<TaxInvoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<TaxInvoice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCreditNoteOpen, setIsCreditNoteOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<TaxInvoice | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Compliance test results state
  const [complianceTests, setComplianceTests] = useState(() => runComplianceTests());

  const handleRerunTests = () => {
    setComplianceTests(runComplianceTests());
  };

  // KPIs
  const kpis = useMemo(() => {
    let totalInvoiced = 0;
    let totalVat = 0;
    let totalReceived = 0;
    let totalOutstanding = 0;
    let draftCount = 0;
    let issuedCount = 0;
    let cancelledCount = 0;

    invoices.forEach(inv => {
      if (inv.status === 'CANCELLED') {
        cancelledCount++;
        return;
      }
      if (inv.isDraft || inv.status === 'DRAFT' || inv.status === 'SUBMITTED' || inv.status === 'APPROVED') {
        draftCount++;
      } else {
        issuedCount++;
        totalInvoiced += inv.totalConsideration;
        totalVat += inv.vatAmount;
        totalReceived += inv.amountReceived;
        totalOutstanding += inv.balanceDue;
      }
    });

    return {
      totalInvoiced,
      totalVat,
      totalReceived,
      totalOutstanding,
      draftCount,
      issuedCount,
      cancelledCount
    };
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Tab filter
      if (activeInvoiceTab === 'drafts' && !inv.isDraft && inv.status !== 'DRAFT' && inv.status !== 'SUBMITTED' && inv.status !== 'APPROVED') return false;
      if (activeInvoiceTab === 'issued' && (inv.isDraft || inv.status === 'DRAFT' || inv.status === 'SUBMITTED' || inv.status === 'APPROVED' || inv.status === 'CANCELLED' || inv.isCreditNote)) return false;
      if (activeInvoiceTab === 'credit-notes' && !inv.isCreditNote) return false;
      if (activeInvoiceTab === 'cancelled' && inv.status !== 'CANCELLED') return false;

      // Status dropdown filter
      if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSerial = inv.serialNumber.toLowerCase().includes(q);
        const matchClient = inv.purchaserName.toLowerCase().includes(q);
        const matchTin = inv.purchaserTin.toLowerCase().includes(q);
        const matchProj = inv.projectCode.toLowerCase().includes(q) || inv.projectName.toLowerCase().includes(q);
        const matchIpc = inv.ipcNumber?.toLowerCase().includes(q);
        if (!matchSerial && !matchClient && !matchTin && !matchProj && !matchIpc) return false;
      }

      return true;
    });
  }, [invoices, activeInvoiceTab, statusFilter, searchQuery]);

  const handleOpenDetail = (inv: TaxInvoice) => {
    setSelectedInvoice(inv);
    setIsDetailOpen(true);
  };

  const handleOpenPayment = (inv: TaxInvoice) => {
    setSelectedInvoice(inv);
    setIsPaymentOpen(true);
  };

  const handleOpenCancel = (inv: TaxInvoice) => {
    setSelectedInvoice(inv);
    setIsCancelOpen(true);
  };

  const handleOpenCreditNote = (inv: TaxInvoice) => {
    setSelectedInvoice(inv);
    setIsCreditNoteOpen(true);
  };

  const handleOpenEdit = (inv: TaxInvoice) => {
    setEditingInvoice(inv);
    setIsCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-mono text-[11px] font-bold border border-cyan-800 tracking-wider">
                IRD GAZETTE NO. 2481/22 & 2500/106
              </span>
              <span className="text-slate-400 text-xs">Section 60 Statutory Serial Number Engine</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Tax Invoice Register & Receivable Management</span>
            </h1>
            <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
              Permanent immutable sequential serial numbers formatted as <strong className="text-cyan-300 font-mono">YYMMM_QQQQ_XXXXX</strong>.
              Automated 18% Output VAT calculation, full-lifecycle approval workflow, client receipting, credit notes, and QuickBooks synchronization.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Petty Cash Re-Sync Option Toggle Button */}
            <div className="flex items-center gap-1.5">
              <button
                id="btn-tax-invoice-sync-toggle"
                onClick={() => {
                  const nextState = !autoSyncPettyCashInvoices;
                  setAutoSyncPettyCashInvoices(nextState);
                  setSyncFeedback({
                    message: nextState
                      ? 'Petty Cash auto-sync enabled. Newly added milestone invoices in Petty Cash will sync into the Tax Invoice register.'
                      : 'Petty Cash auto-sync stopped. Invoices will not re-sync automatically after clearing history or deleting.',
                    type: nextState ? 'success' : 'warning'
                  });
                  setTimeout(() => setSyncFeedback(null), 5000);
                }}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer shadow ${
                  autoSyncPettyCashInvoices
                    ? 'bg-emerald-950/70 border-emerald-700/80 text-emerald-300 hover:bg-emerald-900/70'
                    : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
                title={
                  autoSyncPettyCashInvoices
                    ? 'Auto-Sync is ON. Click to stop re-syncing.'
                    : 'Auto-Sync is STOPPED. Deleted invoices will not reappear. Click to enable.'
                }
              >
                {autoSyncPettyCashInvoices ? (
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
                ) : (
                  <Ban className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Auto-Sync: {autoSyncPettyCashInvoices ? 'ON' : 'STOPPED'}</span>
              </button>

              <button
                id="btn-tax-invoice-sync-now"
                onClick={() => handleManualSync(false)}
                className="px-2.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors shadow cursor-pointer"
                title={`Manual Sync from Petty Cash (${unsyncedPettyCashCount} un-synced)`}
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Sync</span>
                {unsyncedPettyCashCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-800">
                    {unsyncedPettyCashCount}
                  </span>
                )}
              </button>
            </div>

            <button
              id="btn-tax-invoice-gazette-tests"
              onClick={() => setActiveInvoiceTab('compliance')}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition-colors shadow"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Gazette Tests</span>
            </button>

            <AdminClearHistoryButton
              id="btn-admin-clear-tax-invoices-register"
              moduleName="Statutory Tax Invoices & Billing Register"
              itemCount={invoices.length}
              itemDescription="statutory tax invoices, provisional drafts, credit notes, and payment records"
              preservedItemsDescription="Supplier TIN, VAT registration, continuous sequence settings, and bank details remain intact. Petty Cash re-sync is automatically stopped."
              buttonText="Clear History"
              variant="outline"
              alwaysShow={true}
              onClear={() => {
                clearTaxInvoicesHistory();
                setSyncFeedback({
                  message: 'Tax invoice register cleared. Auto-sync is stopped to prevent deleted invoices from re-syncing.',
                  type: 'warning'
                });
                setTimeout(() => setSyncFeedback(null), 6000);
              }}
            />

            <button
              id="btn-create-tax-invoice"
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black flex items-center gap-2 transition-colors shadow-lg shadow-cyan-900/30"
            >
              <Plus className="w-4 h-4" />
              <span>Create Tax Invoice</span>
            </button>
          </div>
        </div>

        {/* Sync Notification Banner */}
        {syncFeedback && (
          <div className={`mt-4 p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
              : syncFeedback.type === 'warning'
              ? 'bg-amber-950/80 border-amber-800 text-amber-200'
              : 'bg-cyan-950/80 border-cyan-800 text-cyan-200'
          }`}>
            <div className="flex items-center gap-2">
              {syncFeedback.type === 'warning' ? (
                <Ban className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{syncFeedback.message}</span>
            </div>
            <button
              onClick={() => setSyncFeedback(null)}
              className="text-slate-400 hover:text-white font-bold px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Next Serial Callout */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Next Official Serial:</span>
            <span className="font-mono font-black text-cyan-300 bg-slate-950 px-2.5 py-1 rounded-md border border-cyan-900/60">
              {previewNextSerialNumber()}
            </span>
            <span className="text-[11px] text-slate-500">
              (Entity: <strong className="text-slate-300">{settings.entityCode}</strong> • Continuous Sequence: <strong className="text-slate-300">#{settings.currentSequence}</strong>)
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>Statutory VAT Rate: <strong className="text-white">18.0%</strong></span>
            <span>Supplier TIN: <strong className="font-mono text-cyan-300">{settings.companyTin}</strong></span>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Issued Turnover</span>
            <Building className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-mono font-black text-white">
            LKR {kpis.totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-500 block">
            Across {kpis.issuedCount} certified tax invoices
          </span>
        </div>

        {/* Output VAT (18%) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Output VAT Charged (18%)</span>
            <FileSpreadsheet className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-xl font-mono font-black text-red-400">
            LKR {kpis.totalVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-500 block">
            Payable to Inland Revenue Dept
          </span>
        </div>

        {/* Total Settled / Received */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Receipts Collected</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-mono font-black text-emerald-400">
            LKR {kpis.totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-500 block">
            Directly remitted into bank account
          </span>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Outstanding Balance</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-mono font-black text-amber-400">
            LKR {kpis.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-500 block">
            {kpis.draftCount} provisional drafts pending
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveInvoiceTab('tax-invoices')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeInvoiceTab === 'tax-invoices'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>All Invoices</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-950/60 text-[10px] font-mono">
              {invoices.length}
            </span>
          </button>

          <button
            onClick={() => setActiveInvoiceTab('issued')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeInvoiceTab === 'issued'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Issued Official</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-950/60 text-[10px] font-mono">
              {kpis.issuedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveInvoiceTab('drafts')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeInvoiceTab === 'drafts'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Provisional Drafts</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-950/60 text-[10px] font-mono">
              {kpis.draftCount}
            </span>
          </button>

          <button
            onClick={() => setActiveInvoiceTab('credit-notes')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeInvoiceTab === 'credit-notes'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Credit Notes</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-950/60 text-[10px] font-mono">
              {invoices.filter(i => i.isCreditNote).length}
            </span>
          </button>

          <button
            onClick={() => setActiveInvoiceTab('cancelled')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeInvoiceTab === 'cancelled'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Cancelled Register</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-950/60 text-[10px] font-mono">
              {kpis.cancelledCount}
            </span>
          </button>

          <button
            onClick={() => setActiveInvoiceTab('compliance')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeInvoiceTab === 'compliance'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Gazette Tests</span>
          </button>

          <button
            onClick={() => setActiveInvoiceTab('settings')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeInvoiceTab === 'settings'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Sequence Settings</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: INVOICE TABLE (When not in compliance/settings tab) */}
      {activeInvoiceTab !== 'compliance' && activeInvoiceTab !== 'settings' && (
        <div className="space-y-4">
          {/* Search & Filter bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search serial number, client name, TIN, project code, IPC..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-white text-xs outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">DRAFT</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="APPROVED">APPROVED</option>
                <option value="ISSUED">ISSUED</option>
                <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                <option value="PAID">PAID</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold">
                    <th className="py-3 px-4">Serial Number</th>
                    <th className="py-3 px-4">Invoice Date</th>
                    <th className="py-3 px-4">Purchaser (Client)</th>
                    <th className="py-3 px-4">Project & Milestone</th>
                    <th className="py-3 px-4 text-right">Taxable (LKR)</th>
                    <th className="py-3 px-4 text-right">VAT 18% (LKR)</th>
                    <th className="py-3 px-4 text-right">Total Consideration</th>
                    <th className="py-3 px-4 text-center">Settlement</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm font-semibold text-slate-400">No tax invoices found</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                          {invoices.length === 0
                            ? 'The tax invoice register history is currently empty or has been cleared.'
                            : 'No records match your active search and filter criteria.'}
                        </p>
                        {invoices.length === 0 && (
                          <div className="mt-3 space-y-3">
                            <p className="text-[11px] text-amber-400/90 font-medium max-w-md mx-auto">
                              Petty Cash auto-sync is currently <strong className={autoSyncPettyCashInvoices ? 'text-emerald-400' : 'text-amber-300'}>{autoSyncPettyCashInvoices ? 'ACTIVE' : 'STOPPED'}</strong>. {autoSyncPettyCashInvoices ? 'New project invoices will sync automatically.' : 'Deleted or cleared invoices will not reappear.'}
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-3">
                              <button
                                id="btn-empty-create-invoice"
                                onClick={() => setIsCreateOpen(true)}
                                className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Create Tax Invoice</span>
                              </button>
                              {availablePettyCashCount > 0 && (
                                <button
                                  id="btn-empty-manual-sync"
                                  onClick={() => handleManualSync(false)}
                                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                                  title="Manually sync available milestone invoices from Petty Cash"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Sync from Petty Cash ({unsyncedPettyCashCount} un-synced)</span>
                                </button>
                              )}
                              <button
                                id="btn-empty-restore-demo"
                                onClick={() => resetTaxInvoicesToDefault()}
                                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Restore Demo Data</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map(inv => {
                      const isIssued = inv.status === 'ISSUED' || inv.status === 'PAID' || inv.status === 'PARTIALLY_PAID';
                      const isCancelled = inv.status === 'CANCELLED';

                      return (
                        <tr
                          key={inv.id}
                          className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                          onClick={() => handleOpenDetail(inv)}
                        >
                          {/* Serial */}
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-cyan-300 group-hover:text-cyan-200">
                              {inv.serialNumber}
                            </span>
                            {inv.isCreditNote && (
                              <span className="block text-[9.5px] text-indigo-400 font-semibold">
                                Credit Note
                              </span>
                            )}
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {inv.invoiceDate}
                          </td>

                          {/* Purchaser */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white group-hover:text-cyan-100">
                              {inv.purchaserName}
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">
                              TIN: {inv.purchaserTin || 'Unverified'}
                            </span>
                          </td>

                          {/* Project & IPC */}
                          <td className="py-3 px-4">
                            <span className="text-slate-300 font-medium">{inv.projectCode}</span>
                            {inv.ipcNumber && (
                              <span className="block text-[10px] text-cyan-400 font-mono">
                                {inv.ipcNumber}
                              </span>
                            )}
                          </td>

                          {/* Taxable Value */}
                          <td className="py-3 px-4 text-right font-mono text-slate-300">
                            {inv.totalTaxableValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>

                          {/* Output VAT */}
                          <td className="py-3 px-4 text-right font-mono text-red-400">
                            {inv.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>

                          {/* Total Consideration */}
                          <td className="py-3 px-4 text-right font-mono font-bold text-white">
                            {inv.totalConsideration.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>

                          {/* Settlement */}
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              inv.paymentStatus === 'Paid'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : inv.paymentStatus === 'Partially Paid'
                                ? 'bg-amber-950 text-amber-300 border-amber-800'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {inv.paymentStatus}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isIssued ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                              isCancelled ? 'bg-rose-950 text-rose-300 border-rose-800' :
                              inv.status === 'APPROVED' ? 'bg-indigo-950 text-indigo-300 border-indigo-800' :
                              inv.status === 'SUBMITTED' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                              'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {inv.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Option prior to Download or Print */}
                              <button
                                id={`btn-view-invoice-${inv.id}`}
                                onClick={() => {
                                  setPreviewInvoice(inv);
                                  setIsPreviewModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-cyan-300 bg-cyan-950/70 hover:bg-cyan-900/90 border border-cyan-800/70 hover:border-cyan-700 transition-all font-medium text-xs shadow-sm active:scale-95"
                                title="View / Preview invoice document prior to download or print"
                              >
                                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                <span>View</span>
                              </button>

                              <button
                                id={`btn-download-invoice-${inv.id}`}
                                onClick={() => downloadInvoicePdf(inv)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
                                title="Download A4 PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              <button
                                id={`btn-print-invoice-${inv.id}`}
                                onClick={() => printInvoicePdf(inv)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
                                title="Print Invoice"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {isIssued && inv.balanceDue > 0 && (
                                <button
                                  onClick={() => handleOpenPayment(inv)}
                                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow flex items-center gap-1"
                                  title="Record Payment Receipt"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  <span>Pay</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleOpenDetail(inv)}
                                className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800"
                                title="Open Invoice"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleOpenEdit(inv)}
                                className="p-1.5 rounded text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                                title="Edit / Revise Tax Invoice"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setInvoiceToDelete(inv)}
                                className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                                title="Delete Tax Invoice (Admin Security Key required)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
        </div>
      )}

      {/* VIEW 2: COMPLIANCE TEST RUNNER */}
      {activeInvoiceTab === 'compliance' && (
        <div className="space-y-6">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-xl">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Statutory Section 60 Serial Number Compliance Tests</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Automated test harness verifying Gazette Extraordinary No. 2481/22 and No. 2500/106 requirements.
              </p>
            </div>
            <button
              onClick={handleRerunTests}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-run Compliance Tests</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complianceTests.map(test => (
              <div
                key={test.testId}
                className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-400 text-xs font-bold">{test.testId}</span>
                    <h4 className="font-bold text-white text-xs">{test.testName}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    test.passed ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700'
                  }`}>
                    {test.passed ? 'PASSED ✓' : 'FAILED ✗'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">{test.description}</p>

                <div className="p-2.5 bg-slate-950 rounded-lg font-mono text-[11px] space-y-1">
                  <div className="text-slate-500">Input: <span className="text-slate-300">{test.input}</span></div>
                  <div className="text-slate-500">Expected: <span className="text-cyan-300">{test.expected}</span></div>
                  <div className="text-slate-500">Actual: <span className={test.passed ? 'text-emerald-400' : 'text-rose-400'}>{test.actual}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: SETTINGS & SEQUENCE CONFIGURATION */}
      {activeInvoiceTab === 'settings' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6 shadow-xl max-w-4xl">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              <span>Tax Invoice Engine & Sequence Configuration</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure Entity Code (QQQQ), sequential number continuity, statutory VAT rates, and corporate letterhead details.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Entity Code (QQQQ, max 10 chars)
              </label>
              <input
                type="text"
                value={settings.entityCode}
                onChange={e => updateSettings({ entityCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-cyan-500 outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Embedded inside serial: <code className="text-cyan-300">26SEP_{settings.entityCode || 'EMA'}_00004</code>
              </span>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Next Sequential Number (XXXXX)
              </label>
              <input
                type="number"
                value={settings.currentSequence}
                onChange={e => updateSettings({ currentSequence: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-cyan-500 outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Increments automatically upon each official issuance.
              </span>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Standard VAT Rate (%)
              </label>
              <input
                type="number"
                value={settings.standardVatRate}
                onChange={e => updateSettings({ standardVatRate: parseFloat(e.target.value) || 18 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-cyan-500 outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Sri Lanka statutory standard rate is 18%.
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3 text-xs">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
              Supplier Registered Entity & VAT Details
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Legal Company Name</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={e => updateSettings({ companyName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Supplier TIN</label>
                <input
                  type="text"
                  value={settings.companyTin}
                  onChange={e => updateSettings({ companyTin: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white font-mono text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Supplier VAT Registration No.</label>
                <input
                  type="text"
                  value={settings.companyVatNumber}
                  onChange={e => updateSettings({ companyVatNumber: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white font-mono text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Contact Email & Phone</label>
                <input
                  type="text"
                  value={settings.companyEmail}
                  onChange={e => updateSettings({ companyEmail: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Registered Office Address</label>
              <input
                type="text"
                value={settings.companyAddress}
                onChange={e => updateSettings({ companyAddress: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white text-xs outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Default Settlement Bank Account (Enterprise Banking)</span>
                </label>
                <span className="text-[10px] text-cyan-400">Linked to Company Bank Registry</span>
              </div>
              <select
                value={settings.defaultBankDetails}
                onChange={e => updateSettings({ defaultBankDetails: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white text-xs outline-none focus:border-cyan-500"
              >
                {accounts.map(acc => {
                  const label = `${acc.bank} • ${acc.branch} • A/C ${acc.accountNumber}`;
                  return (
                    <option key={acc.id} value={label}>
                      {label} {acc.isPrimary ? '★ (Primary)' : ''}
                    </option>
                  );
                })}
              </select>
              <p className="text-[10.5px] text-slate-500 mt-1">
                This account will be pre-selected when generating new tax invoices and statutory PDF documents.
              </p>
            </div>

            {/* Petty Cash & Project Invoices Synchronization Controls */}
            <div className="pt-5 mt-5 border-t border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-cyan-400" />
                    <span>Petty Cash & Project Invoices Synchronization</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xl">
                    Controls whether milestone invoices recorded in the Petty Cash income ledger automatically re-sync into the official statutory Tax Invoice register.
                  </p>
                </div>

                <button
                  id="btn-setting-toggle-sync"
                  onClick={() => {
                    const next = !autoSyncPettyCashInvoices;
                    setAutoSyncPettyCashInvoices(next);
                    setSyncFeedback({
                      message: next
                        ? 'Petty Cash auto-sync turned ON. Project invoices will sync into the Tax Invoice register.'
                        : 'Petty Cash auto-sync STOPPED. Invoices will not re-sync automatically after clearing history or deleting.',
                      type: next ? 'success' : 'warning'
                    });
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-colors cursor-pointer shrink-0 ${
                    autoSyncPettyCashInvoices
                      ? 'bg-emerald-950/70 border-emerald-600 text-emerald-300 hover:bg-emerald-900/70'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {autoSyncPettyCashInvoices ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Auto-Sync: Active</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-4 h-4 text-amber-400" />
                      <span>Auto-Sync: Stopped</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status & Options Info Box */}
              <div className="p-4 bg-slate-950/80 border border-slate-800/90 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg">
                    <span className="text-slate-400 text-[10.5px] block">Auto-Sync Status</span>
                    <span className={`font-bold font-mono mt-0.5 inline-block ${autoSyncPettyCashInvoices ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {autoSyncPettyCashInvoices ? 'ACTIVE' : 'STOPPED'}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {autoSyncPettyCashInvoices
                        ? 'Project invoices sync automatically'
                        : 'Re-sync is stopped to prevent deleted items from reappearing'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg">
                    <span className="text-slate-400 text-[10.5px] block">Deleted Invoice Tombstones</span>
                    <span className="font-bold font-mono text-cyan-400 mt-0.5 inline-block">
                      {deletedIdentifiersCount} Blocked
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Deleted or cleared invoices permanently blocked from resurrecting
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg">
                    <span className="text-slate-400 text-[10.5px] block">Petty Cash Invoices</span>
                    <span className="font-bold font-mono text-slate-200 mt-0.5 inline-block">
                      {availablePettyCashCount} Total ({unsyncedPettyCashCount} Unsynced)
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Project milestone invoices in Petty Cash ledger
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    id="btn-settings-manual-sync"
                    onClick={() => handleManualSync(false)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-900/40 hover:bg-cyan-900/70 text-cyan-300 text-xs font-semibold border border-cyan-800/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync From Petty Cash Now</span>
                  </button>

                  <button
                    id="btn-settings-force-sync"
                    onClick={() => {
                      if (window.confirm('Force re-sync all Petty Cash invoices including previously deleted or cleared ones?')) {
                        handleManualSync(true);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Force Re-sync All (Include Deleted)</span>
                  </button>

                  {deletedIdentifiersCount > 0 && (
                    <button
                      id="btn-settings-reset-blocklist"
                      onClick={() => {
                        if (window.confirm(`Clear the blacklist of ${deletedIdentifiersCount} deleted invoice IDs? This will allow them to be re-synced if auto-sync is turned on.`)) {
                          resetDeletedIdentifiers();
                          setSyncFeedback({
                            message: 'Cleared deleted invoices blacklist.',
                            type: 'info'
                          });
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 text-xs font-semibold border border-rose-900/50 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Sync Blocklist ({deletedIdentifiersCount})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Administrative History Clearance & Reset */}
            <div className="pt-5 mt-5 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Invoice Register Clearance &amp; Factory Reset</span>
              </h3>
              <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                Purge all operational tax invoices, provisional drafts, credit notes, and associated client payments. Company settings, supplier TIN/VAT, and sequence policies are preserved. Automatic re-sync from Petty Cash is automatically stopped to prevent records from reappearing.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <AdminClearHistoryButton
                  id="btn-admin-clear-tax-invoices-settings"
                  moduleName="Statutory Tax Invoices & Billing Register"
                  itemCount={invoices.length}
                  itemDescription="tax invoices, provisional drafts, credit notes, and payment records"
                  preservedItemsDescription="Supplier TIN, VAT registration, sequence settings, and bank details remain intact. Petty Cash re-sync is automatically stopped."
                  buttonText="Clear Invoices History"
                  variant="danger"
                  alwaysShow={true}
                  onClear={() => {
                    clearTaxInvoicesHistory();
                    setSyncFeedback({
                      message: 'Tax invoice register cleared. Auto-sync is stopped to prevent deleted invoices from re-syncing.',
                      type: 'warning'
                    });
                  }}
                />

                <button
                  id="btn-reset-demo-tax-invoices-settings"
                  onClick={() => {
                    if (window.confirm('Reset tax invoice register to standard demo records? This will restore sample gazette-compliant invoices.')) {
                      resetTaxInvoicesToDefault();
                    }
                  }}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Restore Demo Invoices</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateTaxInvoiceModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingInvoice(null);
        }}
        editInvoice={editingInvoice}
      />

      <TaxInvoiceDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        invoice={selectedInvoice}
        onOpenRecordPayment={handleOpenPayment}
        onOpenCancelInvoice={handleOpenCancel}
        onOpenCreditNote={handleOpenCreditNote}
        onOpenEditInvoice={(inv) => {
          setIsDetailOpen(false);
          handleOpenEdit(inv);
        }}
        onOpenDeleteInvoice={(inv) => {
          setIsDetailOpen(false);
          setInvoiceToDelete(inv);
        }}
      />

      <RecordPaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        invoice={selectedInvoice}
      />

      <CancelInvoiceModal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        invoice={selectedInvoice}
      />

      <CreditNoteModal
        isOpen={isCreditNoteOpen}
        onClose={() => setIsCreditNoteOpen(false)}
        invoice={selectedInvoice}
      />

      {/* A4 Tax Invoice Document & PDF Preview Modal */}
      <TaxInvoicePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setPreviewInvoice(null);
        }}
        invoice={previewInvoice}
        onPrint={printInvoicePdf}
        onDownload={downloadInvoicePdf}
        onOpenDetails={(inv) => {
          setSelectedInvoice(inv);
          setIsDetailOpen(true);
        }}
      />

      {/* Strict Security Key Delete Confirmation Modal */}
      {invoiceToDelete && (
        <UniversalDeleteModal
          isOpen={Boolean(invoiceToDelete)}
          onClose={() => setInvoiceToDelete(null)}
          recordType="Statutory Tax Invoice"
          recordTitle={`${invoiceToDelete.serialNumber} - ${invoiceToDelete.purchaserName}`}
          recordCode={invoiceToDelete.serialNumber}
          recordName={invoiceToDelete.purchaserName}
          recordId={invoiceToDelete.id}
          additionalDetails={`Total Consideration: LKR ${invoiceToDelete.totalConsideration.toLocaleString(undefined, { minimumFractionDigits: 2 })} • VAT 18%: LKR ${invoiceToDelete.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} • Status: ${invoiceToDelete.status}`}
          module="TAX_INVOICES"
          onDelete={async () => {
            const serial = invoiceToDelete.serialNumber;
            deleteInvoice(invoiceToDelete.id);
            setInvoiceToDelete(null);
            setSyncFeedback({
              message: `Invoice ${serial} deleted and permanently blocked from re-syncing.`,
              type: 'info'
            });
            setTimeout(() => setSyncFeedback(null), 5000);
          }}
        />
      )}
    </div>
  );
};
