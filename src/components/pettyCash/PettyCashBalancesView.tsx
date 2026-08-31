import React, { useState } from 'react';
import {
  WalletCards,
  Users,
  DollarSign,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Download,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  ArrowUpRight,
  Clock,
  Image as ImageIcon
} from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';
import { Supervisor } from '../../types/pettyCashTypes';

interface PettyCashBalancesViewProps {
  initialSupervisor?: string;
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  onOpenTransfer: () => void;
}

export const PettyCashBalancesView: React.FC<PettyCashBalancesViewProps> = ({
  initialSupervisor,
  onOpenAddExpense,
  onOpenAddIncome,
  onOpenTransfer
}) => {
  const {
    supervisors,
    supervisorBalances,
    getSupervisorStatement,
    exportToCsv,
    userRole,
    currentSupervisorName
  } = usePettyCash();

  // If initialSupervisor is passed or role is supervisor, select it
  const defaultSelected = userRole === 'SUPERVISOR'
    ? currentSupervisorName
    : initialSupervisor || supervisors[0]?.SUPERVISOR_NAME || 'BUDDIKA';

  const [selectedSupervisor, setSelectedSupervisor] = useState<string>(defaultSelected);

  const formatLKR = (amount: number): string => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount).replace('LKR', 'LKR ');
  };

  const activeSup = supervisors.find(
    s => s.SUPERVISOR_NAME.trim().toUpperCase() === selectedSupervisor.trim().toUpperCase()
  );

  const activeBal = supervisorBalances[selectedSupervisor.trim().toUpperCase()] || {
    opening: activeSup?.OPENING_PETTY_CASH || 0,
    incomeTotal: 0,
    transfersIn: 0,
    transfersOut: 0,
    approvedExpenses: 0,
    pendingExpenses: 0,
    currentBalance: activeSup?.OPENING_PETTY_CASH || 0,
    isOverdrawn: false
  };

  const statement = getSupervisorStatement(selectedSupervisor);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <WalletCards className="w-6 h-6 text-emerald-400" />
            <span>Supervisor Petty Cash Balances & Ledgers</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic real-time calculation: Opening Balance + Incomes/Transfers In - Approved Expenses/Transfers Out = Current Balance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-supervisor-statement-csv"
            onClick={() => exportToCsv('statement', selectedSupervisor)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Statement (CSV)</span>
          </button>

          {(userRole === 'ADMIN' || userRole === 'FINANCE') && (
            <button
              onClick={onOpenAddIncome}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <DollarSign className="w-4 h-4" />
              <span>Top-up Float</span>
            </button>
          )}

          <button
            onClick={onOpenTransfer}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      {/* Supervisor Selector Cards Grid */}
      {userRole !== 'SUPERVISOR' && (
        supervisors.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
            <p className="font-semibold text-slate-400 text-sm">No Site Supervisors in Directory</p>
            <p className="text-xs text-slate-500 mt-0.5">Please add supervisors in Master Management to view individual ledgers and float balances.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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

              const isSelected = selectedSupervisor.trim().toUpperCase() === sup.SUPERVISOR_NAME.trim().toUpperCase();

              return (
                <div
                  key={sup.id}
                  onClick={() => setSelectedSupervisor(sup.SUPERVISOR_NAME)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                        bal.isOverdrawn ? 'bg-rose-600' : 'bg-emerald-600'
                      }`}>
                        {sup.SUPERVISOR_NAME.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">{sup.SUPERVISOR_NAME}</h4>
                        <span className="text-[10px] text-slate-400">{sup.PHONE}</span>
                      </div>
                    </div>

                    {bal.isOverdrawn ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                        DEFICIT
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">Petty Cash In Hand:</span>
                    <span className={`text-sm font-mono font-black ${
                      bal.isOverdrawn ? 'text-rose-400' : 'text-emerald-300'
                    }`}>
                      {formatLKR(bal.currentBalance)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* SELECTED SUPERVISOR DETAILED ACCOUNT OVERVIEW */}
      {activeSup && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-md ${
                activeBal.isOverdrawn ? 'bg-rose-600' : 'bg-emerald-600'
              }`}>
                {activeSup.SUPERVISOR_NAME.slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-100">{activeSup.SUPERVISOR_NAME}</h3>
                  <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {activeSup.SUPERVISOR_ID}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assigned Project: <span className="font-semibold text-emerald-400">{activeSup.DEFAULT_PROJECT || 'General'}</span> | {activeSup.EMAIL} | {activeSup.PHONE}
                </p>
              </div>
            </div>

            {/* Current Net Balance Indicator Box */}
            <div className={`px-5 py-3 rounded-xl border flex flex-col items-end ${
              activeBal.isOverdrawn
                ? 'bg-rose-950/40 border-rose-800'
                : 'bg-emerald-950/40 border-emerald-800'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Net Current Petty Cash Balance
              </span>
              <span className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                activeBal.isOverdrawn ? 'text-rose-400' : 'text-emerald-300'
              }`}>
                {formatLKR(activeBal.currentBalance)}
              </span>
              <span className={`text-[10px] font-bold mt-0.5 ${
                activeBal.isOverdrawn ? 'text-rose-300' : 'text-emerald-400'
              }`}>
                {activeBal.isOverdrawn ? '⚠️ Overdrawn / Negative Balance' : '✓ Float Available in Hand'}
              </span>
            </div>
          </div>

          {/* Supervisor Financial Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Opening Float</span>
              <span className="text-sm font-bold font-mono text-slate-200">{formatLKR(activeBal.opening)}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block">Total Received (+)</span>
              <span className="text-sm font-bold font-mono text-emerald-400">
                {formatLKR(activeBal.incomeTotal + activeBal.transfersIn)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-rose-400 uppercase font-bold block">Approved Spent (-)</span>
              <span className="text-sm font-bold font-mono text-rose-400">
                {formatLKR(activeBal.approvedExpenses + activeBal.transfersOut)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-amber-400 uppercase font-bold block">Pending Expenses</span>
              <span className="text-sm font-bold font-mono text-amber-300">{formatLKR(activeBal.pendingExpenses)}</span>
            </div>
          </div>

          {/* SEQUENTIAL RUNNING LEDGER STATEMENT TABLE */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Running Petty Cash Ledger Statement ({statement.length} Records)</span>
              </h4>
              <span className="text-xs text-slate-400">Chronological statement of cash float movements</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800 text-slate-300 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Ref ID</th>
                    <th className="py-2.5 px-3 min-w-[220px]">Description</th>
                    <th className="py-2.5 px-3">Project</th>
                    <th className="py-2.5 px-3 text-right text-emerald-400">Cash In (+)</th>
                    <th className="py-2.5 px-3 text-right text-rose-400">Cash Out (-)</th>
                    <th className="py-2.5 px-3 text-right text-slate-100 bg-slate-800/80">Running Balance</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {statement.map((row, idx) => (
                    <tr key={`${row.transactionId}-${idx}`} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-sans text-slate-300">{row.date}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-300">{row.transactionId}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-200">
                        {row.description}
                        {row.remarks && <span className="text-[10px] text-slate-400 italic block">{row.remarks}</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-sans font-bold text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                          {row.project}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-400">
                        {row.incomeAmount > 0 ? formatLKR(row.incomeAmount) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-400">
                        {row.expenseAmount > 0 ? formatLKR(row.expenseAmount) : '-'}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-black bg-slate-900/90 ${
                        row.runningBalance < 0 ? 'text-rose-400' : 'text-emerald-300'
                      }`}>
                        {formatLKR(row.runningBalance)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block ${
                          row.status === 'Approved' || row.status === 'Paid' || row.status === 'Completed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : row.status === 'Pending'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        {row.proofUrl ? (
                          <span className="text-emerald-400 inline-block" title="Document attached">
                            <ImageIcon className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
