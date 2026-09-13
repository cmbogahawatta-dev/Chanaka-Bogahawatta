import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Receipt,
  CreditCard,
  TrendingUp,
  FileSpreadsheet,
  Building,
  DollarSign,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Calendar,
  Layers,
  FileText,
  Scale
} from 'lucide-react';
import { useTaxInvoice } from '../../context/TaxInvoiceContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { TaxInvoiceRegisterView } from '../invoices/TaxInvoiceRegisterView';
import { QuotationRegisterView } from '../quotations/QuotationRegisterView';
import { useQuotation } from '../../context/QuotationContext';
import { ClientPaymentsView } from '../payments/views/ClientPaymentsView';
import { ProjectProfitDashboard } from '../projects/ProjectProfitDashboard';
import { formatLkr } from '../../utils/vatCalculations';

export type ProjectIncomeTab =
  | 'quotations'
  | 'tax_invoices'
  | 'client_payments'
  | 'receipts_history'
  | 'revenue_matrix';

interface ProjectIncomeViewProps {
  initialTab?: ProjectIncomeTab;
}

export const ProjectIncomeView: React.FC<ProjectIncomeViewProps> = ({
  initialTab = 'tax_invoices'
}) => {
  const [activeTab, setActiveTab] = useState<ProjectIncomeTab>(initialTab);
  const { invoices = [] } = useTaxInvoice();
  const { quotations = [] } = useQuotation();
  const { income = [], projects = [] } = usePettyCash();
  const { setCurrentModule } = useEnterprise();

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Project Invoices Count
  const totalInvoicesCount = invoices.length;

  // Project income records from Petty Cash context
  const projectIncomes = useMemo(() => {
    return (income || []).filter(i =>
      i.TRANSACTION_TYPE === 'PROJECT_INVOICE_INCOME' ||
      Boolean(i.invoiceNumber) ||
      i.INCOME_SOURCE === 'Project Income / Invoice'
    );
  }, [income]);

  // Overdue count
  const overdueCount = useMemo(() => {
    return projectIncomes.filter(i => {
      const bal = i.balanceDue !== undefined ? i.balanceDue : (Number(i.grossAmount ?? i.AMOUNT) - Number(i.amountReceived ?? 0));
      return bal > 0.01;
    }).length;
  }, [projectIncomes]);

  // Receipts Count
  const receiptsList = useMemo(() => {
    return projectIncomes
      .filter(inv => (inv.amountReceived && inv.amountReceived > 0) || inv.paymentReference || inv.paymentDate)
      .map(inv => ({
        id: inv.id,
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
        remarks: inv.REMARKS || 'Progress milestone billing settlement'
      }))
      .sort((a, b) => (b.paymentDate > a.paymentDate ? 1 : -1));
  }, [projectIncomes]);

  // Revenue & Billing Matrix by Project
  const projectMatrix = useMemo(() => {
    const map = new Map<string, {
      projectCode: string;
      projectName: string;
      client: string;
      totalBilled: number;
      totalCollected: number;
      balanceDue: number;
      invoiceCount: number;
    }>();

    // Group from project incomes
    projectIncomes.forEach(inv => {
      const pCode = inv.PROJECT || 'GENERAL';
      const existing = map.get(pCode) || {
        projectCode: pCode,
        projectName: inv.PROJECT || 'Corporate Head Office',
        client: inv.clientName || 'Government / Private Client',
        totalBilled: 0,
        totalCollected: 0,
        balanceDue: 0,
        invoiceCount: 0
      };

      const gross = Number(inv.grossAmount ?? inv.AMOUNT ?? 0);
      const received = Number(inv.amountReceived ?? 0);
      const bal = inv.balanceDue !== undefined ? Number(inv.balanceDue) : (gross - received);

      existing.totalBilled += gross;
      existing.totalCollected += received;
      existing.balanceDue += Math.max(0, bal);
      existing.invoiceCount += 1;

      map.set(pCode, existing);
    });

    // Also enrich with projects list if available
    projects.forEach(p => {
      const pCode = p.PROJECT_CODE;
      if (pCode && !map.has(pCode)) {
        map.set(pCode, {
          projectCode: pCode,
          projectName: p.PROJECT_NAME,
          client: p.CLIENT || 'Registered Authority',
          totalBilled: 0,
          totalCollected: 0,
          balanceDue: 0,
          invoiceCount: 0
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalBilled - a.totalBilled);
  }, [projectIncomes, projects]);

  // Overall totals
  const overallTotals = useMemo(() => {
    let billed = 0;
    let collected = 0;
    let balance = 0;
    projectMatrix.forEach(p => {
      billed += p.totalBilled;
      collected += p.totalCollected;
      balance += p.balanceDue;
    });
    const collectionRate = billed > 0 ? (collected / billed) * 100 : 0;
    return { billed, collected, balance, collectionRate };
  }, [projectMatrix]);

  return (
    <div className="space-y-4 w-full">
      {/* 0. PROJECT INCOME COMBINED HORIZONTAL NAVIGATION PANE (MATCHING STAFF & HR DIRECTORY PATTERN) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 text-xs shadow-sm">
          {/* Tab 0: Commercial Quotations & Estimates */}
          <button
            id="tab-project-quotations"
            type="button"
            onClick={() => setActiveTab('quotations')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'quotations'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Quotations &amp; Estimates</span>
            {quotations.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'quotations'
                    ? 'bg-cyan-950 text-cyan-200 border border-cyan-400/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {quotations.length}
              </span>
            )}
          </button>

          {/* Tab 1: Tax Invoices */}
          <button
            id="tab-project-tax-invoices"
            type="button"
            onClick={() => setActiveTab('tax_invoices')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'tax_invoices'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Tax Invoices</span>
            {totalInvoicesCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'tax_invoices'
                    ? 'bg-cyan-950 text-cyan-200 border border-cyan-400/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {totalInvoicesCount} Inv
              </span>
            )}
          </button>

          {/* Tab 2: Client Payments */}
          <button
            id="tab-project-client-payments"
            type="button"
            onClick={() => setActiveTab('client_payments')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'client_payments'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Client Payments</span>
            {overdueCount > 0 ? (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'client_payments'
                    ? 'bg-emerald-950 text-emerald-200 border border-emerald-400/40'
                    : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                }`}
              >
                {overdueCount} Due
              </span>
            ) : projectIncomes.length > 0 ? (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'client_payments'
                    ? 'bg-emerald-950 text-emerald-200 border border-emerald-400/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {projectIncomes.length}
              </span>
            ) : null}
          </button>

          {/* Tab 3: Receipts Audit History */}
          <button
            id="tab-project-receipts-history"
            type="button"
            onClick={() => setActiveTab('receipts_history')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'receipts_history'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Receipts History</span>
            {receiptsList.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'receipts_history'
                    ? 'bg-indigo-950 text-indigo-200 border border-indigo-400/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {receiptsList.length}
              </span>
            )}
          </button>

          {/* Tab 4: Project Profit & Loss Dashboard */}
          <button
            id="tab-project-revenue-matrix"
            type="button"
            onClick={() => setActiveTab('revenue_matrix')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'revenue_matrix'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Project Profit & Loss</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
              SLFRS 15
            </span>
          </button>
        </div>

        {/* Quick Context Indicator / Status Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setCurrentModule('receivables-payables')}
            className="px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-xs bg-blue-950/70 hover:bg-blue-900 text-blue-300 border border-blue-800/80 shadow-sm"
            title="Jump to 11. Receivables & Payables Ledger"
          >
            <Scale className="w-3.5 h-3.5 text-blue-400" />
            <span>AR / AP Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
          </button>

          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Total Billed:</span>
            <span className="font-mono font-bold text-emerald-400">
              LKR {overallTotals.billed.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Collection:</span>
            <span className="font-mono font-bold text-cyan-400">
              {overallTotals.collectionRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* VIEW CONTENT ROUTING */}
      {activeTab === 'quotations' && (
        <div className="animate-in fade-in duration-200">
          <QuotationRegisterView />
        </div>
      )}

      {activeTab === 'tax_invoices' && (
        <div className="animate-in fade-in duration-200">
          <TaxInvoiceRegisterView />
        </div>
      )}

      {activeTab === 'client_payments' && (
        <div className="animate-in fade-in duration-200">
          <ClientPaymentsView onNavigateToInvoices={() => setActiveTab('tax_invoices')} />
        </div>
      )}

      {/* Tab 3 Content: Direct Receipts Audit Log */}
      {activeTab === 'receipts_history' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
                    <span>Client Payment Receipts & Bank Deposits</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-bold">
                      Audit Trail
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Chronological verification register of milestone collections, cheque deposits, and direct account settlements
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 font-mono">
                <span className="text-slate-400 mr-2">Total Settled:</span>
                <span className="text-indigo-300 font-bold">
                  LKR {overallTotals.collected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Receipts Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Receipt Date</th>
                    <th className="py-3 px-4">Invoice / Milestone</th>
                    <th className="py-3 px-4">Client / Authority</th>
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4 text-right">Amount Received</th>
                    <th className="py-3 px-4">Payment Reference</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {receiptsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-500">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30 text-indigo-400" />
                        <p className="font-semibold text-slate-400">No client receipts recorded yet</p>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Record a settlement under "Client Payments" to populate this ledger.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    receiptsList.map((rec, idx) => (
                      <tr key={rec.id || idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 text-slate-300 font-mono flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{rec.paymentDate}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {rec.invoiceNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-200 font-semibold">
                          {rec.clientName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-purple-950/60 text-purple-300 border border-purple-800/60 font-mono text-[11px]">
                            {rec.project}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                          {formatLkr(rec.amountReceived)}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {rec.paymentReference}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                            Verified
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4 Content: Project Profit & Loss Dashboard (Expenses vs Income, Advances as Liability) */}
      {activeTab === 'revenue_matrix' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <ProjectProfitDashboard
            onNavigateToInvoice={() => setActiveTab('tax_invoices')}
          />
        </div>
      )}
    </div>
  );
};
