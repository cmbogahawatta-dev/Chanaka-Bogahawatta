import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Search,
  Filter,
  Download,
  PlusCircle,
  FileText,
  Receipt,
  Building,
  Calendar,
  Eye,
  ArrowRight,
  TrendingUp,
  Image as ImageIcon,
  Check,
  Percent
} from 'lucide-react';
import { usePettyCash } from '../../../context/PettyCashContext';
import { Income, InvoicePaymentStatus } from '../../../types/pettyCashTypes';
import { formatLkr, round2 } from '../../../utils/vatCalculations';
import { RecordInvoicePaymentModal } from '../../pettyCash/RecordInvoicePaymentModal';
import { InvoiceDetailModal } from '../../pettyCash/InvoiceDetailModal';

interface ClientPaymentsViewProps {
  onNavigateToInvoices?: () => void;
}

export const ClientPaymentsView: React.FC<ClientPaymentsViewProps> = ({
  onNavigateToInvoices
}) => {
  const {
    income,
    projects,
    userRole
  } = usePettyCash();

  const canManagePayments = userRole === 'ADMIN' || userRole === 'FINANCE';

  // Filters & State
  const [activeTab, setActiveTab] = useState<'receivables' | 'receipts_history'>('receivables');
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Income | null>(null);
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<Income | null>(null);

  // All project corporate invoices
  const projectInvoices = useMemo(() => {
    return income.filter(inc =>
      inc.TRANSACTION_TYPE === 'PROJECT_INVOICE_INCOME' ||
      Boolean(inc.invoiceNumber) ||
      inc.INCOME_SOURCE === 'Project Income / Invoice'
    );
  }, [income]);

  // Filtered invoices
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

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const client = (inv.clientName || inv.clientCode || '').toLowerCase();
        const num = (inv.invoiceNumber || inv.INCOME_ID || '').toLowerCase();
        const proj = (inv.PROJECT || '').toLowerCase();
        const desc = (inv.billingDescription || inv.invoiceDescription || inv.REMARKS || '').toLowerCase();
        const ref = (inv.paymentReference || '').toLowerCase();

        const matches = client.includes(q) || num.includes(q) || proj.includes(q) || desc.includes(q) || ref.includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [projectInvoices, selectedProject, statusFilter, searchQuery]);

  // Overall Financial KPIs
  const metrics = useMemo(() => {
    const targetInvoices = selectedProject === 'ALL'
      ? projectInvoices
      : projectInvoices.filter(i => (i.PROJECT || '').toUpperCase() === selectedProject.toUpperCase());

    let totalBilled = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let overdueCount = 0;
    const now = new Date();

    targetInvoices.forEach(inv => {
      const gross = Number(inv.grossAmount ?? inv.AMOUNT) || 0;
      const rec = Number(inv.amountReceived) || 0;
      const bal = inv.balanceDue !== undefined ? Number(inv.balanceDue) : Math.max(0, gross - rec);

      totalBilled += gross;
      totalCollected += rec;
      totalOutstanding += bal;

      if (bal > 0 && inv.dueDate && new Date(inv.dueDate) < now) {
        overdueCount++;
      }
    });

    const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

    return {
      totalBilled: round2(totalBilled),
      totalCollected: round2(totalCollected),
      totalOutstanding: round2(totalOutstanding),
      collectionRate: Math.min(100, round2(collectionRate)),
      invoiceCount: targetInvoices.length,
      overdueCount
    };
  }, [projectInvoices, selectedProject]);

  // Receipts audit records extracted from invoices with received amounts
  const receiptsHistory = useMemo(() => {
    return projectInvoices.filter(inv => (inv.amountReceived && inv.amountReceived > 0) || inv.paymentReference || inv.paymentDate)
      .map(inv => ({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber || inv.INCOME_ID,
        clientName: inv.clientName || 'General Client',
        project: inv.PROJECT,
        amountReceived: inv.amountReceived || 0,
        grossAmount: inv.grossAmount ?? inv.AMOUNT,
        balanceDue: inv.balanceDue ?? 0,
        paymentDate: inv.paymentDate || inv.DATE_REF || 'N/A',
        paymentReference: inv.paymentReference || 'Direct Settlement',
        proofDocument: inv.PROOF_DOCUMENT,
        proofDocName: inv.PROOF_DOCUMENT_NAME,
        status: inv.paymentStatus || 'Paid',
        remarks: inv.REMARKS || 'Progress billing settlement'
      }))
      .sort((a, b) => (b.paymentDate > a.paymentDate ? 1 : -1));
  }, [projectInvoices]);

  const handleOpenPaymentForInvoice = (invoice: Income) => {
    setSelectedInvoiceForPayment(invoice);
    setIsPaymentModalOpen(true);
  };

  const handleOpenGenericPayment = () => {
    // Find the first unpaid invoice or let user pick from available
    const unpaid = projectInvoices.find(i => (i.balanceDue === undefined ? (i.grossAmount ?? i.AMOUNT) > 0 : i.balanceDue > 0));
    setSelectedInvoiceForPayment(unpaid || projectInvoices[0] || null);
    setIsPaymentModalOpen(true);
  };

  // CSV Export for Client Payments
  const handleExportCsv = () => {
    const headers = [
      'Invoice Number',
      'Client Name',
      'Project Code',
      'Invoice Date',
      'Due Date',
      'Gross Amount (LKR)',
      'Amount Received (LKR)',
      'Balance Due (LKR)',
      'Payment Status',
      'Payment Date',
      'Payment Reference'
    ];

    const rows = filteredInvoices.map(inv => [
      inv.invoiceNumber || inv.INCOME_ID,
      `"${(inv.clientName || '').replace(/"/g, '""')}"`,
      inv.PROJECT,
      inv.invoiceDate || inv.DATE_REF,
      inv.dueDate || '',
      inv.grossAmount ?? inv.AMOUNT,
      inv.amountReceived ?? 0,
      inv.balanceDue ?? (Number(inv.grossAmount ?? inv.AMOUNT) - Number(inv.amountReceived ?? 0)),
      inv.paymentStatus || 'Pending',
      inv.paymentDate || '',
      `"${(inv.paymentReference || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Client_Payments_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
                <span>Client Payments & Receivables</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                  Finance Hub
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Corporate client billing settlements, milestone certificate receipts, and receivables ledger
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onNavigateToInvoices && (
            <button
              onClick={onNavigateToInvoices}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Project Invoices</span>
            </button>
          )}

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {canManagePayments && (
            <button
              onClick={handleOpenGenericPayment}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Client Payment</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial KPIs Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Billed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Total Gross Invoiced</span>
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-100 font-mono tracking-tight">
            {formatLkr(metrics.totalBilled)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Across {metrics.invoiceCount} project invoices</span>
            <span className="text-indigo-400 font-semibold">Incl. 18% VAT</span>
          </div>
        </div>

        {/* Total Received */}
        <div className="bg-slate-900 border border-emerald-900/30 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Total Collected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono tracking-tight">
            {formatLkr(metrics.totalCollected)}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>Settled into company bank accounts</span>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-slate-900 border border-amber-900/30 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Outstanding Balance</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono tracking-tight">
            {formatLkr(metrics.totalOutstanding)}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1 flex items-center justify-between">
            <span>Pending collection</span>
            {metrics.overdueCount > 0 && (
              <span className="text-rose-400 font-bold flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" /> {metrics.overdueCount} Overdue
              </span>
            )}
          </div>
        </div>

        {/* Collection Efficiency Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Collection Rate</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-xl sm:text-2xl font-black text-teal-300 font-mono tracking-tight">
              {metrics.collectionRate.toFixed(1)}%
            </div>
            <span className="text-xs text-slate-400">recovery</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, metrics.collectionRate))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sub-view Navigation Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('receivables')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'receivables'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Invoices & Outstanding Receivables</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
              {filteredInvoices.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('receipts_history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'receipts_history'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Client Receipts History</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {receiptsHistory.length}
            </span>
          </button>
        </div>

        {/* Global Filter Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search client, invoice #, ref..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Project Filter */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
          >
            <option value="ALL">All Projects</option>
            {projects.map(p => (
              <option key={p.PROJECT_CODE} value={p.PROJECT_CODE}>
                {p.PROJECT_CODE} - {p.PROJECT_NAME}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          {activeTab === 'receivables' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending / Approved</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Fully Settled</option>
              <option value="Overdue">Overdue</option>
            </select>
          )}
        </div>
      </div>

      {/* Tab 1: Receivables & Invoices Due */}
      {activeTab === 'receivables' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-300 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-700">
                <tr>
                  <th className="py-3 px-3.5">Invoice #</th>
                  <th className="py-3 px-3">Client Name</th>
                  <th className="py-3 px-3">Project</th>
                  <th className="py-3 px-3">Billing Date</th>
                  <th className="py-3 px-3 text-right">Gross Billed</th>
                  <th className="py-3 px-3 text-right">Received</th>
                  <th className="py-3 px-3 text-right">Balance Due</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Receipt className="w-8 h-8 text-slate-600" />
                        <p className="font-semibold text-slate-400">No project invoices match the current filter.</p>
                        <p className="text-xs text-slate-500">Create a project invoice in the Project Invoices tab to track billing and client receipts.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const gross = Number(inv.grossAmount ?? inv.AMOUNT) || 0;
                    const received = Number(inv.amountReceived) || 0;
                    const balance = inv.balanceDue !== undefined ? Number(inv.balanceDue) : Math.max(0, gross - received);
                    const isOverdue = balance > 0 && inv.dueDate && new Date(inv.dueDate) < new Date();
                    const status = inv.paymentStatus || (balance <= 0.01 ? 'Paid' : (received > 0 ? 'Partially Paid' : 'Approved'));

                    return (
                      <tr key={inv.id} className="hover:bg-slate-800/50 transition-colors">
                        {/* Invoice Number */}
                        <td className="py-3 px-3.5">
                          <button
                            onClick={() => setSelectedInvoiceForDetail(inv)}
                            className="font-mono font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                          >
                            <span>{inv.invoiceNumber || inv.INCOME_ID}</span>
                          </button>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">
                            {inv.billingDescription || inv.invoiceDescription || 'Client Milestone'}
                          </span>
                        </td>

                        {/* Client Name */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-200">
                            {inv.clientName || 'National Water Supply & Drainage Board'}
                          </div>
                          {inv.clientCode && (
                            <span className="text-[10px] text-slate-400 font-mono">Code: {inv.clientCode}</span>
                          )}
                        </td>

                        {/* Project */}
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px] font-bold border border-slate-700">
                            {inv.PROJECT}
                          </span>
                        </td>

                        {/* Billing Date */}
                        <td className="py-3 px-3 text-slate-400 font-mono">
                          {inv.invoiceDate || inv.DATE_REF}
                          {inv.dueDate && (
                            <span className={`block text-[10px] ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                              Due: {inv.dueDate}
                            </span>
                          )}
                        </td>

                        {/* Gross Billed */}
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-200">
                          {formatLkr(gross)}
                        </td>

                        {/* Received */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                          {formatLkr(received)}
                        </td>

                        {/* Balance Due */}
                        <td className="py-3 px-3 text-right font-mono font-black">
                          <span className={balance > 0 ? (isOverdue ? 'text-rose-400' : 'text-amber-400') : 'text-slate-500'}>
                            {formatLkr(balance)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          {status === 'Paid' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Paid
                            </span>
                          ) : status === 'Partially Paid' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <Clock className="w-3 h-3" /> Partial
                            </span>
                          ) : isOverdue ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              <AlertCircle className="w-3 h-3" /> Overdue
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {canManagePayments && balance > 0.01 && (
                              <button
                                onClick={() => handleOpenPaymentForInvoice(inv)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition-all flex items-center gap-1 active:scale-95"
                                title="Apply client payment receipt to this invoice"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Receive</span>
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedInvoiceForDetail(inv)}
                              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              title="View Invoice & Receipt Breakdown"
                            >
                              <Eye className="w-3.5 h-3.5" />
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
      )}

      {/* Tab 2: Client Receipts History */}
      {activeTab === 'receipts_history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-300 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-700">
                <tr>
                  <th className="py-3 px-3.5">Payment Date</th>
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Client Name</th>
                  <th className="py-3 px-3">Project</th>
                  <th className="py-3 px-3">Bank Reference</th>
                  <th className="py-3 px-3 text-right">Amount Received</th>
                  <th className="py-3 px-3 text-right">Remaining Due</th>
                  <th className="py-3 px-3 text-center">Slip Proof</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {receiptsHistory.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Receipt className="w-8 h-8 text-slate-600" />
                        <p className="font-semibold text-slate-400">No client payment receipts recorded yet.</p>
                        <p className="text-xs text-slate-500">Use &quot;Record Client Payment&quot; above to log client milestone collections.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  receiptsHistory.map((rec, idx) => (
                    <tr key={`${rec.invoiceId}-${idx}`} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3.5 font-mono text-slate-300 font-semibold">
                        {rec.paymentDate}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-indigo-400">
                        {rec.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-200">
                        {rec.clientName}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px] font-bold border border-slate-700">
                          {rec.project}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {rec.paymentReference}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-emerald-400">
                        {formatLkr(rec.amountReceived)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-400">
                        {formatLkr(rec.balanceDue)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {rec.proofDocument ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold cursor-pointer hover:underline"
                            onClick={() => {
                              const w = window.open('');
                              if (w) w.document.write(`<img src="${rec.proofDocument}" style="max-width:100%"/>`);
                            }}
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Slip</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">None</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Invoice Payment Modal */}
      {isPaymentModalOpen && selectedInvoiceForPayment && (
        <RecordInvoicePaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedInvoiceForPayment(null);
          }}
          invoice={selectedInvoiceForPayment}
        />
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoiceForDetail && (
        <InvoiceDetailModal
          isOpen={Boolean(selectedInvoiceForDetail)}
          onClose={() => setSelectedInvoiceForDetail(null)}
          invoice={selectedInvoiceForDetail}
          onRecordPayment={() => {
            setSelectedInvoiceForPayment(selectedInvoiceForDetail);
            setSelectedInvoiceForDetail(null);
            setIsPaymentModalOpen(true);
          }}
        />
      )}
    </div>
  );
};
