import React from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Building2,
  PieChart as PieIcon,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  FileSpreadsheet,
  Receipt,
  Coins,
  AlertTriangle,
  Scale
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';
import { usePRV } from '../../../context/PRVContext';
import { usePettyCash } from '../../../context/PettyCashContext';
import { formatLKR } from '../../../utils/helpers';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6'];

export const PaymentAnalyticsDashboard: React.FC = () => {
  const { paymentRequests, metrics } = usePRV();
  const { projects, income = [] } = usePettyCash();

  // Project Income calculations
  const projectInvoices = (income || []).filter(i =>
    i.TRANSACTION_TYPE === 'PROJECT_INVOICE_INCOME' ||
    Boolean(i.invoiceNumber) ||
    i.INCOME_SOURCE === 'Project Income / Invoice'
  );

  const totalInvoiced = projectInvoices.reduce(
    (sum, i) => sum + Number(i.grossAmount ?? i.AMOUNT ?? 0),
    0
  );

  const totalCollected = projectInvoices.reduce(
    (sum, i) => sum + Number(i.amountReceived ?? 0),
    0
  );

  const outstandingReceivables = Math.max(0, totalInvoiced - totalCollected);

  const overdueInvoicesCount = projectInvoices.filter(i => {
    const bal = i.balanceDue !== undefined ? i.balanceDue : (Number(i.grossAmount ?? i.AMOUNT) - Number(i.amountReceived ?? 0));
    return bal > 0.01;
  }).length;

  const collectionRate = totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : '0.0';

  // PRV & Disbursement calculations
  const pendingPRVsCount = metrics.pendingAccountsL1Count + metrics.pendingAccountsL2Count + metrics.pendingOwnerCount;
  const approvedPRVsCount = paymentRequests.filter(p => p.status === 'OWNER_APPROVED' || p.status === 'PAYMENT_PROOF_PENDING').length;

  // 1. Project-wise spending breakdown
  const projectSpendingMap: { [key: string]: number } = {};
  paymentRequests.forEach(p => {
    projectSpendingMap[p.projectCode] = (projectSpendingMap[p.projectCode] || 0) + p.totalAmount;
  });
  const projectChartData = Object.keys(projectSpendingMap).map(proj => ({
    name: proj,
    amount: projectSpendingMap[proj]
  }));

  // 2. Category distribution
  const categoryMap: { [key: string]: number } = {};
  paymentRequests.forEach(p => {
    categoryMap[p.expenseCategory] = (categoryMap[p.expenseCategory] || 0) + p.totalAmount;
  });
  const categoryChartData = Object.keys(categoryMap).map(cat => ({
    name: cat,
    value: categoryMap[cat]
  }));

  // 3. Payment Method breakdown
  const methodMap: { [key: string]: number } = {};
  paymentRequests.forEach(p => {
    methodMap[p.paymentMethod] = (methodMap[p.paymentMethod] || 0) + p.totalAmount;
  });
  const methodChartData = Object.keys(methodMap).map(m => ({
    name: m,
    value: methodMap[m]
  }));

  // 4. Monthly trend
  const monthMap: { [key: string]: number } = {};
  paymentRequests.forEach(p => {
    const month = p.requestDate.substring(0, 7);
    monthMap[month] = (monthMap[month] || 0) + p.totalAmount;
  });
  const monthChartData = Object.keys(monthMap).sort().map(m => ({
    month: m,
    disbursed: monthMap[m]
  }));

  // Top Payees
  const payeeMap: { [key: string]: { amount: number; count: number } } = {};
  paymentRequests.forEach(p => {
    if (!payeeMap[p.payeeName]) {
      payeeMap[p.payeeName] = { amount: 0, count: 0 };
    }
    payeeMap[p.payeeName].amount += p.totalAmount;
    payeeMap[p.payeeName].count += 1;
  });
  const topPayees = Object.keys(payeeMap)
    .map(name => ({ name, ...payeeMap[name] }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <div className="space-y-5 text-xs">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-100">Financial Payment Analytics & Insights</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-[11px] font-mono font-bold">
              Real-Time Ledger Insights
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Segregated analytics for incoming Project Income vs outgoing PRV Disbursements with budget consumption, category breakdown, and settlement velocity.
          </p>
        </div>
      </div>

      {/* SEPARATED FINANCIAL DUAL PANELS (Section 11 Requirement) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* PANEL 1: PROJECT INCOME */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 border border-emerald-900/50 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-900/60">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 tracking-wide">PROJECT INCOME</h3>
                <p className="text-[10px] text-emerald-400">Client billings, tax invoices & milestone collections</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              {collectionRate}% Collected
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[9.5px] text-slate-400 uppercase tracking-wider block">Total Invoiced</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-emerald-300 block mt-0.5">
                {formatLKR(totalInvoiced)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[9.5px] text-slate-400 uppercase tracking-wider block">Total Collected</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-cyan-300 block mt-0.5">
                {formatLKR(totalCollected)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[9.5px] text-slate-400 uppercase tracking-wider block">Outstanding Due</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-amber-300 block mt-0.5">
                {formatLKR(outstandingReceivables)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[9.5px] text-slate-400 uppercase tracking-wider block">Number of Invoices</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-slate-200 block mt-0.5">
                {projectInvoices.length} Invoices
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[9.5px] text-slate-400 uppercase tracking-wider block">Overdue Invoices</span>
              <span className={`text-xs sm:text-sm font-mono font-bold block mt-0.5 ${overdueInvoicesCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {overdueInvoicesCount} Overdue
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[9.5px] text-slate-400 uppercase tracking-wider block">Collection Rate</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400 block mt-0.5">
                {collectionRate}%
              </span>
            </div>
          </div>
        </div>

        {/* PANEL 2: PRV & DISBURSEMENTS */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/20 border border-purple-900/50 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-purple-900/60">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 tracking-wide">PRV & DISBURSEMENTS</h3>
                <p className="text-[10px] text-purple-400">Payment Request Vouchers, Approvals & Settled payments</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
              {metrics.totalRequests} PRVs Total
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[9.5px] text-slate-400 uppercase tracking-wider block">Total PRVs</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-purple-300 block mt-0.5">
                {metrics.totalRequests} PRVs
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[9.5px] text-slate-400 uppercase tracking-wider block">Pending PRVs</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-amber-300 block mt-0.5">
                {pendingPRVsCount} in Queue
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[9.5px] text-slate-400 uppercase tracking-wider block">Pending Approval Amount</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-amber-400 block mt-0.5">
                {formatLKR(metrics.totalAmountPending)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[9.5px] text-slate-400 uppercase tracking-wider block">Approved PRVs</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-blue-300 block mt-0.5">
                {approvedPRVsCount} Approved
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[9.5px] text-slate-400 uppercase tracking-wider block">Completed Payments</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-teal-300 block mt-0.5">
                {metrics.paidCount} Settled
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[9.5px] text-slate-400 uppercase tracking-wider block">Total Disbursement</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-rose-400 block mt-0.5">
                {formatLKR(metrics.totalAmountPaid)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Project Wise Spending Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 text-sm">Disbursements by Project</h3>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  formatter={(value: any) => [`LKR ${Number(value).toLocaleString()}`, 'Total Amount']}
                />
                <Bar dataKey="amount" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 text-sm">Expense Category Breakdown (GL)</h3>
            <PieIcon className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  formatter={(value: any) => [`LKR ${Number(value).toLocaleString()}`, 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lower Row: Top Payees & Payment Method Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Payees (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
          <h3 className="font-bold text-slate-100 text-sm">Top Beneficiaries & Suppliers</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase font-bold">
                  <th className="py-2">Payee / Beneficiary</th>
                  <th className="py-2 text-center">Vouchers</th>
                  <th className="py-2 text-right">Total Disbursed (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {topPayees.map((payee, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2.5 font-bold text-slate-200">{payee.name}</td>
                    <td className="py-2.5 text-center font-mono text-slate-400">{payee.count}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                      {payee.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
          <h3 className="font-bold text-slate-100 text-sm">Payment Methods</h3>
          <div className="space-y-2.5">
            {methodChartData.map((m, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="font-bold text-slate-200">{m.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-300">LKR {m.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
