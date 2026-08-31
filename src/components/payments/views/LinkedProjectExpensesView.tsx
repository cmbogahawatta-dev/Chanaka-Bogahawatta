import React, { useState } from 'react';
import {
  FileText,
  Search,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Layers,
  Eye,
  Filter,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { usePettyCash } from '../../../context/PettyCashContext';
import { usePRV } from '../../../context/PRVContext';
import { Expense } from '../../../types/pettyCashTypes';

export const LinkedProjectExpensesView: React.FC = () => {
  const { expenses } = usePettyCash();
  const { openPRVByNumber, openPRVById } = usePRV();

  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');

  // Filter expenses that have PRV integration or show all project expenses with PRV linkage flag
  const projectExpenses = expenses.filter(e => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        e.EXPENSES_ID.toLowerCase().includes(q) ||
        e.EXPENSES_DESCRIPTION.toLowerCase().includes(q) ||
        e.PROJECT.toLowerCase().includes(q) ||
        e.EXPENSES_CATEGORY.toLowerCase().includes(q) ||
        (e.PRV_NUMBER && e.PRV_NUMBER.toLowerCase().includes(q)) ||
        (e.PAYMENT_SOURCE && e.PAYMENT_SOURCE.toLowerCase().includes(q)) ||
        (e.PAYEE && e.PAYEE.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (projectFilter !== 'ALL' && e.PROJECT !== projectFilter) return false;
    if (sourceFilter !== 'ALL' && e.PAYMENT_SOURCE !== sourceFilter) return false;
    return true;
  });

  const prvExpensesCount = expenses.filter(e => !!e.PRV_NUMBER).length;
  const prvExpensesTotal = expenses
    .filter(e => !!e.PRV_NUMBER)
    .reduce((sum, e) => sum + (Number(e.AMOUNT) || 0), 0);

  return (
    <div className="space-y-4 text-xs">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-100">Project Expenses & PRV Ledger Integration</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-mono font-bold">
              {prvExpensesCount} Auto-Posted from PRVs
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time synchronization between Payment Request Vouchers and Project Expenses with source identification (Bank Transfer, Petty Cash, Credit Card).
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-emerald-800/80 text-right min-w-[210px]">
          <span className="text-[10px] text-emerald-400 uppercase font-bold block">Total Auto-Posted PRV Cost</span>
          <div className="text-lg font-mono font-black text-emerald-300">
            AED {prvExpensesTotal.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search expense ID, PRV #, description, category, payee..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 text-xs focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs">Project:</span>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-slate-200 text-xs"
          >
            <option value="ALL">All Projects</option>
            <option value="PIDM 26">PIDM 26</option>
            <option value="PIDM 27">PIDM 27</option>
            <option value="PIDM 28">PIDM 28</option>
          </select>

          <span className="text-slate-400 text-xs ml-2">Source:</span>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-slate-200 text-xs"
          >
            <option value="ALL">All Sources</option>
            <option value="Bank Account">Bank Account</option>
            <option value="Petty Cash">Petty Cash</option>
            <option value="Company Credit Card">Credit Card</option>
            <option value="Direct Bank Transfer">Direct Bank Transfer</option>
            <option value="Cash">Cash</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3.5">Expense ID</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Project / Category</th>
                <th className="py-3 px-3">Description & Payee</th>
                <th className="py-3 px-3">Payment Source</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3">PRV Origin</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {projectExpenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-800/60 transition-colors">
                  <td className="py-3 px-3.5 font-mono font-bold text-slate-200 whitespace-nowrap">
                    {exp.EXPENSES_ID}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap text-slate-400">
                    {exp.DATE_REF || exp.DATE}
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-200 block">{exp.PROJECT}</span>
                    <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                      {exp.EXPENSES_CATEGORY}
                    </span>
                  </td>

                  <td className="py-3 px-3 max-w-[220px]">
                    <span className="font-semibold text-slate-200 block truncate">{exp.EXPENSES_DESCRIPTION}</span>
                    {exp.PAYEE ? (
                      <span className="text-[10px] text-emerald-400 block truncate">Payee: {exp.PAYEE}</span>
                    ) : null}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-purple-300 font-semibold text-[10px] block w-fit">
                      {exp.PAYMENT_SOURCE || (exp.TRANSACTION_TYPE === 'PETTY_CASH_EXPENSE' ? 'Petty Cash' : 'Company Account')}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-100 whitespace-nowrap">
                    <span className="text-[10px] text-slate-400 mr-1">{exp.CURRENCY || 'AED'}</span>
                    {Number(exp.AMOUNT || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    {exp.PRV_NUMBER ? (
                      <button
                        onClick={() => openPRVByNumber(exp.PRV_NUMBER!)}
                        className="flex items-center gap-1 text-[11px] font-mono text-purple-300 font-bold bg-purple-950/60 hover:bg-purple-900/60 px-2 py-0.5 rounded border border-purple-800 transition-colors"
                      >
                        <span>{exp.PRV_NUMBER}</span>
                        <ExternalLink className="w-3 h-3 text-purple-400" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500">Manual Entry</span>
                    )}
                  </td>

                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                    {exp.PRV_NUMBER ? (
                      <button
                        onClick={() => openPRVByNumber(exp.PRV_NUMBER!)}
                        className="text-purple-400 hover:text-purple-300 font-bold text-[10px] inline-flex items-center gap-1"
                      >
                        <span>View PRV Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-slate-500 text-[10px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
