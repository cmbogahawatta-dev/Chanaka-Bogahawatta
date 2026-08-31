import React, { useState } from 'react';
import { Image as ImageIcon, Search, ExternalLink, Filter, Calendar, Tag, Building, User } from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';
import { Expense } from '../../types/pettyCashTypes';

interface ProofDocumentsViewProps {
  onSelectExpenseForDetail: (expense: Expense) => void;
}

export const ProofDocumentsView: React.FC<ProofDocumentsViewProps> = ({ onSelectExpenseForDetail }) => {
  const { expenses } = usePettyCash();
  const [search, setSearch] = useState<string>('');

  const expensesWithProof = expenses.filter(e => Boolean(e.PROOF_DOCUMENT));

  const filtered = expensesWithProof.filter(e => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.EXPENSES_ID.toLowerCase().includes(q) ||
      e.SUPERVISOR.toLowerCase().includes(q) ||
      e.PROJECT.toLowerCase().includes(q) ||
      e.EXPENSES_DESCRIPTION.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-emerald-400" />
            <span>Receipts & Proof Document Gallery</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Displaying {filtered.length} attached site vouchers, fuel slips, and cash bills.
          </p>
        </div>

        <div className="w-full sm:w-64 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search proof documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((exp) => (
          <div
            key={exp.id}
            onClick={() => onSelectExpenseForDetail(exp)}
            className="bg-slate-900 border border-slate-800 hover:border-emerald-600/60 rounded-xl overflow-hidden shadow-sm cursor-pointer transition-all flex flex-col justify-between"
          >
            <div className="h-44 bg-slate-950 flex items-center justify-center p-2 relative group overflow-hidden">
              <img
                src={exp.PROOF_DOCUMENT}
                alt="Receipt"
                className="max-h-full max-w-full object-contain rounded transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="px-3 py-1 bg-slate-900 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-600 shadow-md">
                  Inspect Voucher
                </span>
              </div>
            </div>

            <div className="p-3 space-y-1.5 bg-slate-900 border-t border-slate-800/80 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-300">{exp.EXPENSES_ID}</span>
                <span className="font-mono font-bold text-emerald-400">
                  LKR {exp.AMOUNT.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-200">{exp.SUPERVISOR}</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">{exp.PROJECT}</span>
              </div>
              <p className="text-slate-300 truncate text-[11px]">{exp.EXPENSES_DESCRIPTION}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
