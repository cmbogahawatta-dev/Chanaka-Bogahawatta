import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  WalletCards,
  Building,
  Users,
  ShieldAlert,
  ArrowUpRight,
  Receipt,
  DollarSign,
  FileSpreadsheet,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bell,
  AlertTriangle,
  AlertOctagon,
  Sliders
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { usePettyCash } from '../../context/PettyCashContext';
import { PettyCashFilterBar } from './PettyCashFilterBar';
import { BudgetThresholdAlertBanner } from './BudgetThresholdAlertBanner';
import { Expense, PaymentStatus } from '../../types/pettyCashTypes';

interface PettyCashDashboardViewProps {
  onNavigateTab: (tab: any) => void;
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  onSelectExpenseForDetail: (expense: Expense) => void;
  onSelectSupervisorForStatement: (supervisorName: string) => void;
  onOpenBudgetAlerts?: () => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#64748b'];

export const PettyCashDashboardView: React.FC<PettyCashDashboardViewProps> = ({
  onNavigateTab,
  onOpenAddExpense,
  onOpenAddIncome,
  onSelectExpenseForDetail,
  onSelectSupervisorForStatement,
  onOpenBudgetAlerts
}) => {
  const {
    kpiMetrics,
    pivotMatrix,
    supervisorBalances,
    supervisors,
    filteredExpenses,
    filteredIncome,
    projectBudgetSummaries,
    budgetAlerts,
    exportToCsv,
    userRole
  } = usePettyCash();

  const [activePivotCategoryGroup, setActivePivotCategoryGroup] = useState<string>('ALL');

  // Format currency in Sri Lankan Rupees (LKR)
  const formatLKR = (amount: number): string => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount).replace('LKR', 'LKR ');
  };

  // Prepare chart data for Expenses by Project
  const projectChartData = pivotMatrix.projects.map(p => {
    return {
      projectCode: p.PROJECT_CODE,
      amount: pivotMatrix.columnTotals[p.PROJECT_CODE] || 0
    };
  }).filter(d => d.amount > 0);

  // Prepare chart data for Category Breakdown
  const categoryChartData = pivotMatrix.rows
    .filter(r => r.rowTotal > 0)
    .map(r => ({
      name: r.categoryName.replace(/^\d+\s*/, ''), // Strip GL code for chart label
      value: r.rowTotal
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Filter pivot rows by active category group tab if chosen
  const filteredPivotRows = activePivotCategoryGroup === 'ALL'
    ? pivotMatrix.rows
    : pivotMatrix.rows.filter(r => r.categoryGroup === activePivotCategoryGroup);

  // Category group list for filter tabs
  const categoryGroups = ['ALL', 'Direct Project Cost', 'Site Overheads', 'Admin & Head Office', 'Special / Non-Project'];

  return (
    <div className="space-y-6 pb-12">
      {/* Real-time Project Budget Threshold Alert Banner */}
      {onOpenBudgetAlerts && (
        <BudgetThresholdAlertBanner onOpenAlertsModal={onOpenBudgetAlerts} />
      )}

      {/* Top Welcome & KPI Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/50 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              <span>EMA Financial & Petty Cash Dashboard</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Real-time synchronization with central Google Sheets database for site expenses, advances & project cost allocation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="dashboard-btn-export-pivot"
              onClick={() => exportToCsv('pivot')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Pivot (CSV)</span>
            </button>
            <button
              id="dashboard-btn-add-expense-quick"
              onClick={onOpenAddExpense}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition-all active:scale-95"
            >
              <Receipt className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Global Filter Bar */}
        <PettyCashFilterBar />

        {/* 6 High-Impact KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-4">
          {/* 1. Total Expenses */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between shadow-sm hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Expenses</span>
              <TrendingDown className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-sm sm:text-base font-black text-slate-100 tracking-tight">
              {formatLKR(kpiMetrics.totalExpensesApproved)}
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold mt-1">Approved / Paid</span>
          </div>

          {/* 2. Petty Cash Top-ups */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between shadow-sm hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Petty Cash Top-ups</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-sm sm:text-base font-black text-emerald-300 tracking-tight">
              {formatLKR(kpiMetrics.totalIncomeReceived)}
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-1">Supervisor Float Top-ups</span>
          </div>

          {/* 3. Net Cash Flow */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between shadow-sm hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Net Cash Flow</span>
              <DollarSign className="w-4 h-4 text-cyan-400" />
            </div>
            <div className={`text-sm sm:text-base font-black tracking-tight ${
              kpiMetrics.netCashFlow >= 0 ? 'text-cyan-300' : 'text-rose-400'
            }`}>
              {formatLKR(kpiMetrics.netCashFlow)}
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-1">Top-ups - Expenses</span>
          </div>

          {/* 4. Pending Expenses */}
          <div className="bg-slate-950/80 border border-amber-900/30 rounded-xl p-3.5 flex flex-col justify-between shadow-sm hover:border-amber-700/50 transition-all">
            <div className="flex items-center justify-between text-amber-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pending Review</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-sm sm:text-base font-black text-amber-300 tracking-tight">
              {formatLKR(kpiMetrics.totalExpensesPending)}
            </div>
            <span className="text-[10px] text-amber-400 font-semibold mt-1">Requires Approval</span>
          </div>

          {/* 5. Total Petty Cash Balance */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between shadow-sm hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Petty Cash In Hand</span>
              <WalletCards className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-sm sm:text-base font-black text-slate-100 tracking-tight">
              {formatLKR(kpiMetrics.totalPettyCashInHand)}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-slate-400 font-medium">All Supervisors</span>
              {kpiMetrics.overdrawnSupervisorsCount > 0 && (
                <span className="text-[9px] font-bold text-rose-400 bg-rose-950 px-1 py-0.2 rounded border border-rose-800">
                  {kpiMetrics.overdrawnSupervisorsCount} Deficit
                </span>
              )}
            </div>
          </div>

          {/* 6. Operations Scope */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between shadow-sm hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Site Operations</span>
              <Building className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-sm sm:text-base font-black text-slate-100 tracking-tight">
              {kpiMetrics.activeProjectsCount} Projects
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-1">
              {kpiMetrics.activeSupervisorsCount} Active Supervisors
            </span>
          </div>
        </div>
      </div>

      {/* PROJECT-WISE CATEGORY PIVOT MATRIX SECTION (Section 13 & Reference Screenshots) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-100 tracking-tight flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-400" />
              <span>Project-wise Expense Pivot Matrix</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cross-tabulation of approved expenditures across project sites and accounting cost codes.
            </p>
          </div>

          {/* Category Group Filter Pills */}
          <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {categoryGroups.map((grp) => (
              <button
                key={grp}
                onClick={() => setActivePivotCategoryGroup(grp)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                  activePivotCategoryGroup === grp
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {grp}
              </button>
            ))}
          </div>
        </div>

        {/* Pivot Table View */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/90 text-slate-200 border-b border-slate-700">
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider sticky left-0 bg-slate-800 z-10 min-w-[240px]">
                  Expense Category
                </th>
                {pivotMatrix.projects.map((p) => (
                  <th key={p.id} className="py-3 px-3 font-bold uppercase tracking-wider text-right min-w-[130px]">
                    <div className="truncate" title={p.PROJECT_NAME}>
                      {p.PROJECT_CODE}
                    </div>
                  </th>
                ))}
                <th className="py-3 px-3.5 font-black uppercase tracking-wider text-right bg-emerald-950/80 text-emerald-300 min-w-[150px]">
                  Grand Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {filteredPivotRows.map((row) => (
                <tr key={row.categoryId} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-2.5 px-3.5 font-sans font-medium text-slate-200 sticky left-0 bg-slate-950/90 hover:bg-slate-800/90 border-r border-slate-800">
                    <div className="truncate max-w-[260px]" title={row.categoryName}>
                      {row.categoryName}
                    </div>
                    <span className="text-[10px] text-slate-400 font-sans block">{row.categoryGroup}</span>
                  </td>
                  {pivotMatrix.projects.map((p) => {
                    const val = row.projectTotals[p.PROJECT_CODE] || 0;
                    return (
                      <td
                        key={p.id}
                        className={`py-2.5 px-3 text-right ${
                          val > 0 ? 'text-slate-100 font-medium' : 'text-slate-600'
                        }`}
                      >
                        {val > 0 ? val.toLocaleString('en-LK', { minimumFractionDigits: 2 }) : '-'}
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3.5 text-right font-bold bg-emerald-950/30 text-emerald-300">
                    {row.rowTotal > 0 ? row.rowTotal.toLocaleString('en-LK', { minimumFractionDigits: 2 }) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Grand Totals Summary Row */}
            <tfoot>
              <tr className="bg-slate-800 text-slate-100 font-bold border-t-2 border-slate-700">
                <td className="py-3 px-3.5 sticky left-0 bg-slate-800 font-sans uppercase tracking-wider text-xs">
                  TOTAL PROJECT EXPENDITURE
                </td>
                {pivotMatrix.projects.map((p) => {
                  const colTotal = pivotMatrix.columnTotals[p.PROJECT_CODE] || 0;
                  return (
                    <td key={p.id} className="py-3 px-3 text-right font-black text-xs text-slate-100">
                      {colTotal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </td>
                  );
                })}
                <td className="py-3 px-3.5 text-right font-black text-sm bg-emerald-900/80 text-emerald-200">
                  {pivotMatrix.grandTotal.toLocaleString('en-LK', { minimumFractionDigits: 2 })} LKR
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* PROJECT BUDGET THRESHOLD ALERT & UTILIZATION MONITOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-100 tracking-tight flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              <span>Project Budget Threshold Alerts & Utilization</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live tracking against allocated project budgets. Automated notification threshold triggers at 80% (Warning) and 95% (Critical).
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenBudgetAlerts && (
              <button
                onClick={onOpenBudgetAlerts}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-700/60 text-xs font-bold transition-all"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Alerts Center ({budgetAlerts.length})</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectBudgetSummaries.map((summary) => {
            const isExceeded = summary.thresholdLevel === 'OVER_BUDGET';
            const is95 = summary.thresholdLevel === 'CRITICAL_95';
            const is80 = summary.thresholdLevel === 'WARNING_80';

            const cardBorder = isExceeded
              ? 'border-rose-700/80 bg-rose-950/20 shadow-sm shadow-rose-950/20'
              : is95
              ? 'border-orange-700/80 bg-orange-950/20 shadow-sm shadow-orange-950/20'
              : is80
              ? 'border-amber-700/80 bg-amber-950/20 shadow-sm shadow-amber-950/20'
              : 'border-slate-800 bg-slate-950/50';

            const progressBarColor = isExceeded
              ? 'bg-rose-500'
              : is95
              ? 'bg-orange-500'
              : is80
              ? 'bg-amber-400'
              : 'bg-emerald-500';

            return (
              <div key={summary.projectId} className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${cardBorder}`}>
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-slate-100 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded">
                          {summary.projectCode}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[140px]" title={summary.client}>
                          {summary.client}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-200 mt-1 line-clamp-1" title={summary.projectName}>
                        {summary.projectName}
                      </h4>
                    </div>

                    {summary.thresholdLevel !== 'NORMAL' ? (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 flex items-center gap-1 ${
                          isExceeded
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : is95
                            ? 'bg-orange-950 text-orange-300 border border-orange-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {isExceeded ? <ShieldAlert className="w-3 h-3" /> : is95 ? <AlertOctagon className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        <span>{isExceeded ? '100% EXCEEDED' : is95 ? '95% CRITICAL' : '80% WARNING'}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                        HEALTHY
                      </span>
                    )}
                  </div>

                  {/* Progress Bar with markers at 80% and 95% */}
                  <div className="space-y-1 my-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 font-medium">Spent:</span>
                      <span className="font-mono text-xs font-bold text-slate-200">
                        {summary.utilizationPercentage.toFixed(1)}% ({formatLKR(summary.approvedSpent)})
                      </span>
                    </div>
                    <div className="relative w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-amber-400/50 z-10" />
                      <div className="absolute top-0 bottom-0 left-[95%] w-0.5 bg-orange-400/50 z-10" />
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${progressBarColor}`}
                        style={{ width: `${Math.min(100, summary.utilizationPercentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800/80">
                    <div>
                      <span className="block text-[10px] font-sans text-slate-400 uppercase">Allocated Budget</span>
                      <span className="font-bold text-slate-200">{formatLKR(summary.allocatedBudget)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-sans text-slate-400 uppercase">Remaining Buffer</span>
                      <span className={`font-bold ${summary.remainingBudget <= 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                        {formatLKR(summary.remainingBudget)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assigned Supervisors */}
                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Assigned:</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {summary.assignedSupervisors.slice(0, 2).map((s) => (
                      <span key={s} className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold text-[10px]">
                        {s}
                      </span>
                    ))}
                    {summary.assignedSupervisors.length > 2 && (
                      <span className="text-[10px] text-slate-400 font-bold">+{summary.assignedSupervisors.length - 2}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SUPERVISOR PERFORMANCE & PETTY CASH BALANCE SUMMARY (Section 14 & Reference Screenshots) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supervisor Petty Cash Balances (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-100 tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <span>Supervisor Petty Cash Balances & Expenses</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Current float balances with positive (AVAILABLE) and negative (OVERDRAWN) status.
              </p>
            </div>

            <button
              id="btn-view-all-balances"
              onClick={() => onNavigateTab('petty-cash')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Detailed Statement</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Supervisor</th>
                  <th className="py-2.5 px-3 text-right">Opening</th>
                  <th className="py-2.5 px-3 text-right">Top-ups Received</th>
                  <th className="py-2.5 px-3 text-right">Expenses Paid</th>
                  <th className="py-2.5 px-3 text-right">Current Balance</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {supervisors.map((sup) => {
                  const bal = supervisorBalances[sup.SUPERVISOR_NAME.trim().toUpperCase()] || {
                    opening: sup.OPENING_PETTY_CASH,
                    incomeTotal: 0,
                    transfersIn: 0,
                    transfersOut: 0,
                    approvedExpenses: 0,
                    pendingExpenses: 0,
                    currentBalance: sup.OPENING_PETTY_CASH,
                    isOverdrawn: false
                  };

                  return (
                    <tr key={sup.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-sans font-bold text-slate-100">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                            bal.isOverdrawn ? 'bg-rose-600' : 'bg-emerald-600'
                          }`}>
                            {sup.SUPERVISOR_NAME.slice(0, 2)}
                          </div>
                          <span>{sup.SUPERVISOR_NAME}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400">
                        {bal.opening.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-400">
                        +{(bal.incomeTotal + bal.transfersIn).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        -{(bal.approvedExpenses + bal.transfersOut).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold text-xs ${
                        bal.isOverdrawn ? 'text-rose-400' : 'text-emerald-300'
                      }`}>
                        {bal.currentBalance.toLocaleString('en-LK', { minimumFractionDigits: 2 })} LKR
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        {bal.isOverdrawn ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                            OVERDRAWN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            AVAILABLE
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <button
                          onClick={() => onSelectSupervisorForStatement(sup.SUPERVISOR_NAME)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 text-[11px] font-medium transition-colors"
                        >
                          Statement
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses by Category Donut Chart (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-slate-100 tracking-tight flex items-center gap-2">
              <span>Top Expense Distribution</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Highest cost spending categories</p>
          </div>

          <div className="h-48 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatLKR(Number(value)), 'Spent']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {categoryChartData.slice(0, 4).map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="truncate">{c.name}</span>
                </div>
                <span className="font-mono font-medium text-slate-100">{formatLKR(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FINANCIAL CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project-wise Expenditure Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-slate-100 tracking-tight">
                Project-wise Expenditure (LKR)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Total spent per construction road contract package</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="projectCode" stroke="#94a3b8" fontSize={11} angle={-25} textAnchor="end" />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: any) => [formatLKR(Number(value)), 'Spent']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} name="Total Spent (LKR)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Expense Submissions Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-slate-100 tracking-tight flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <span>Recent Expenses Queue</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Latest transactions submitted from site</p>
            </div>
            <button
              onClick={() => onNavigateTab('expenses')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {filteredExpenses.slice(0, 5).map((exp) => (
              <div
                key={exp.id}
                onClick={() => onSelectExpenseForDetail(exp)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-emerald-600/50 cursor-pointer transition-all"
              >
                <div className="space-y-0.5 truncate max-w-[240px] sm:max-w-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{exp.EXPENSES_ID}</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                      {exp.PROJECT}
                    </span>
                    <span className="text-[10px] text-slate-400">{exp.SUPERVISOR}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-200 truncate">{exp.EXPENSES_DESCRIPTION}</p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold font-mono text-slate-100">
                    {formatLKR(exp.AMOUNT)}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                    exp.PAYMENT_STATUS === 'Approved'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : exp.PAYMENT_STATUS === 'Pending'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {exp.PAYMENT_STATUS}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
