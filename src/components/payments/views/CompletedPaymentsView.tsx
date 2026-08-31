import React, { useState } from 'react';
import {
  CheckCircle2,
  FileText,
  Search,
  Eye,
  Camera,
  ExternalLink,
  Download,
  Calendar,
  Building2,
  DollarSign,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { usePRV } from '../../../context/PRVContext';
import { usePettyCash } from '../../../context/PettyCashContext';
import { PaymentRequestVoucher } from '../../../types/prvTypes';

export const CompletedPaymentsView: React.FC = () => {
  const { paymentRequests, setSelectedPRV, setIsDetailModalOpen } = usePRV();
  const { expenses } = usePettyCash();

  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');

  const completedPRVs = paymentRequests.filter(p => p.status === 'PAID');

  const filteredCompleted = completedPRVs.filter(p => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        p.prvNumber.toLowerCase().includes(q) ||
        p.purpose.toLowerCase().includes(q) ||
        p.payeeName.toLowerCase().includes(q) ||
        p.projectCode.toLowerCase().includes(q) ||
        (p.paymentReference && p.paymentReference.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (projectFilter !== 'ALL' && p.projectCode !== projectFilter) {
      return false;
    }
    return true;
  });

  const totalPaidSum = completedPRVs.reduce((sum, p) => sum + p.totalAmount, 0);

  const handleOpenDetail = (prv: PaymentRequestVoucher) => {
    setSelectedPRV(prv);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-100">Completed Payments & Settlements</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-mono font-bold">
              {completedPRVs.length} Paid & Reconciled
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Official ledger of disbursed payments with bank transaction references, verified proof documents, and automatic project expense postings.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-emerald-800/80 text-right min-w-[200px]">
          <span className="text-[10px] text-emerald-400 uppercase font-bold block">Total Disbursed Volume</span>
          <div className="text-lg font-mono font-black text-emerald-300">
            AED {totalPaidSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search completed payments by PRV #, Reference, Payee..."
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
        </div>
      </div>

      {/* Completed Payments Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3.5">PRV / Date</th>
                <th className="py-3 px-3">Project & Category</th>
                <th className="py-3 px-3">Payee & Purpose</th>
                <th className="py-3 px-3">Payment Source / Bank Ref</th>
                <th className="py-3 px-3 text-right">Amount Paid</th>
                <th className="py-3 px-3">Linked Project Expense</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredCompleted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50 text-emerald-400" />
                    <p className="font-semibold">No completed payments found.</p>
                  </td>
                </tr>
              ) : (
                filteredCompleted.map(prv => {
                  const linkedExp = prv.linkedExpenseId
                    ? expenses.find(e => e.id === prv.linkedExpenseId || e.PRV_NUMBER === prv.prvNumber)
                    : undefined;

                  return (
                    <tr
                      key={prv.id}
                      onClick={() => handleOpenDetail(prv)}
                      className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-purple-300 block">{prv.prvNumber}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {prv.transaction?.paymentDate || prv.requestDate}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-200 block">{prv.projectCode}</span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                          {prv.expenseCategory}
                        </span>
                      </td>

                      <td className="py-3 px-3 max-w-[200px]">
                        <span className="font-semibold text-slate-100 block truncate group-hover:text-purple-200">
                          {prv.purpose}
                        </span>
                        <span className="text-[10px] text-emerald-400 block truncate">
                          Payee: {prv.payeeName}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-purple-300 block text-[11px]">
                          {prv.paymentSource || prv.paymentMethod}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[160px]">
                          Ref: {prv.paymentReference || 'TXN-CONFIRMED'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                        <span className="text-[10px] text-slate-400 font-normal mr-1">{prv.currency}</span>
                        {prv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {linkedExp ? (
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>{linkedExp.EXPENSES_ID}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">Reconciled</span>
                        )}
                      </td>

                      <td className="py-3 px-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenDetail(prv)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Proof & Receipt</span>
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
    </div>
  );
};
