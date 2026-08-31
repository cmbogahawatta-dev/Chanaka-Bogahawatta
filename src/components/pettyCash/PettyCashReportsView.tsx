import React, { useState } from 'react';
import {
  FileBarChart,
  Download,
  Calendar,
  Building,
  User,
  Tag,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Receipt,
  TrendingDown,
  TrendingUp,
  WalletCards
} from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';

export const PettyCashReportsView: React.FC = () => {
  const {
    filteredExpenses,
    filteredIncome,
    supervisors,
    projects,
    categories,
    supervisorBalances,
    pivotMatrix,
    exportToCsv
  } = usePettyCash();

  const [selectedReport, setSelectedReport] = useState<string>('project_pivot');
  const [reportSupervisor, setReportSupervisor] = useState<string>('BUDDIKA');

  const formatLKR = (amount: number): string => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount).replace('LKR', 'LKR ');
  };

  const reportsList = [
    {
      id: 'project_pivot',
      title: '1. Project-wise Category Pivot Matrix',
      desc: 'Cross-tabulated matrix of expenses mapped to road packages & GL codes',
      icon: Layers,
      type: 'pivot' as const
    },
    {
      id: 'supervisor_statement',
      title: '2. Supervisor Petty Cash Statement',
      desc: 'Sequential running ledger of float opening, top-ups, and field disbursements',
      icon: WalletCards,
      type: 'statement' as const
    },
    {
      id: 'all_expenses',
      title: '3. Master Expense Vouchers Register',
      desc: 'Itemized list of all approved, pending, and paid site expenditure records',
      icon: Receipt,
      type: 'expenses' as const
    },
    {
      id: 'all_income',
      title: '4. Cash Income & Top-ups Register',
      desc: 'All bank transfers, cheques, and head office petty cash disbursements',
      icon: TrendingUp,
      type: 'income' as const
    },
    {
      id: 'pending_expenses',
      title: '5. Pending Approval Audit Report',
      desc: 'Outstanding unverified vouchers requiring finance/admin action',
      icon: TrendingDown,
      type: 'expenses' as const
    }
  ];

  const handleDownload = (report: typeof reportsList[0]) => {
    if (report.id === 'supervisor_statement') {
      exportToCsv('statement', reportSupervisor);
    } else {
      exportToCsv(report.type);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
        <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
          <FileBarChart className="w-6 h-6 text-emerald-400" />
          <span>Financial Reports & Export Suite</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Generate audit-ready spreadsheets and tabular reports formatted for management and external auditors.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportsList.map((rep) => {
          const Icon = rep.icon;
          return (
            <div
              key={rep.id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all shadow-sm"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-2 border border-emerald-500/30">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-100">{rep.title}</h4>
                <p className="text-xs text-slate-400 mt-1">{rep.desc}</p>
              </div>

              {rep.id === 'supervisor_statement' && (
                <div>
                  <label className="block text-[11px] text-slate-300 font-bold mb-1">Select Supervisor:</label>
                  <select
                    value={reportSupervisor}
                    onChange={(e) => setReportSupervisor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
                  >
                    {supervisors.map(s => (
                      <option key={s.id} value={s.SUPERVISOR_NAME}>{s.SUPERVISOR_NAME}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => handleDownload(rep)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 text-xs font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report (CSV)</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
