import React, { useState } from 'react';
import {
  TrendingUp,
  PlusCircle,
  Download,
  DollarSign,
  Search,
  Eye,
  Image as ImageIcon,
  Building,
  User,
  ArrowUpDown,
  Edit2,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { PettyCashFilterBar } from './PettyCashFilterBar';
import { Income } from '../../types/pettyCashTypes';
import { AdminClearHistoryButton } from '../common/AdminClearHistoryButton';
import { AddIncomeModal } from './AddIncomeModal';
import { BulkImportIncomeModal } from './BulkImportIncomeModal';

interface IncomeListViewProps {
  onOpenAddIncome: () => void;
}

export const IncomeListView: React.FC<IncomeListViewProps> = ({ onOpenAddIncome }) => {
  const { filteredIncome, exportToCsv, clearIncomeHistory, userRole, deleteIncome } = usePettyCash();
  const { currentRole } = useEnterprise();
  const isAdmin = userRole === 'ADMIN' || currentRole === 'ADMIN';

  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState<boolean>(false);

  const formatLKR = (amount: number): string => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount).replace('LKR', 'LKR ');
  };

  const totalFilteredIncome = filteredIncome.reduce((sum, inc) => sum + (Number(inc.AMOUNT) || 0), 0);

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            <span>Income & Petty Cash Float Top-ups</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Displaying {filteredIncome.length} receipts. Total cash received: <span className="font-bold text-emerald-400 font-mono">{formatLKR(totalFilteredIncome)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AdminClearHistoryButton
            id="btn-admin-clear-income"
            moduleName="Petty Cash Top-ups"
            itemCount={filteredIncome.length}
            itemDescription="float top-up receipts and bank deposit confirmations"
            preservedItemsDescription="Supervisors, projects, and chart of accounts remain intact."
            onClear={() => clearIncomeHistory()}
          />

          <button
            id="btn-bulk-import-income"
            onClick={() => setIsBulkImportOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold shadow-md transition-all active:scale-95"
            title="Bulk import income and top-ups from Excel/CSV with Admin PIN authorization"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Bulk Import</span>
          </button>

          <button
            id="btn-export-income-csv"
            onClick={() => exportToCsv('income')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {(userRole === 'ADMIN' || userRole === 'FINANCE') && (
            <button
              id="btn-add-income-from-list"
              onClick={onOpenAddIncome}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Income / Top-up</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Filter Bar */}
      <PettyCashFilterBar showCategoryFilter={false} showStatusFilter={false} />

      {/* Income Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800 text-slate-300 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-3 px-3.5">Income ID</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Supervisor</th>
                <th className="py-3 px-3">Project / Allocation</th>
                <th className="py-3 px-3">Source / Channel</th>
                <th className="py-3 px-3 text-right">Amount (LKR)</th>
                <th className="py-3 px-3">Created By</th>
                <th className="py-3 px-3 min-w-[180px]">Remarks</th>
                <th className="py-3 px-3 text-center">Slip</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-sans">
              {filteredIncome.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No income records found matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredIncome.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => setSelectedIncome(inc)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3.5 font-mono font-bold text-slate-200">
                      {inc.INCOME_ID}
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-medium">
                      {inc.DATE}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-100">
                      {inc.SUPERVISOR}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-[11px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                        {inc.PROJECT}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-emerald-300 font-medium">
                      {inc.INCOME_SOURCE}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      {formatLKR(inc.AMOUNT)}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {inc.CREATED_BY}
                    </td>
                    <td className="py-3 px-3 text-slate-300 truncate max-w-[200px]" title={inc.REMARKS}>
                      {inc.REMARKS || '-'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {inc.PROOF_DOCUMENT ? (
                        <span className="inline-flex items-center justify-center text-emerald-400" title="Deposit Slip Attached">
                          <ImageIcon className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedIncome(inc)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => setEditingIncome(inc)}
                              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400 transition-colors"
                              title="Admin: Edit Income"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Admin: Are you sure you want to delete income voucher "${inc.INCOME_ID}" for ${inc.SUPERVISOR} (${formatLKR(inc.AMOUNT)})?`)) {
                                  deleteIncome(inc.id);
                                }
                              }}
                              className="p-1.5 rounded bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 transition-colors"
                              title="Admin: Delete Income"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Income Preview Modal */}
      {selectedIncome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="font-mono font-bold text-emerald-400">{selectedIncome.INCOME_ID}</span>
              <button onClick={() => setSelectedIncome(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="font-bold text-base font-mono text-emerald-400">{formatLKR(selectedIncome.AMOUNT)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="text-slate-200 font-medium">{selectedIncome.DATE}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Receiving Supervisor:</span>
                <span className="text-slate-100 font-bold">{selectedIncome.SUPERVISOR}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Project / Allocation:</span>
                <span className="text-slate-100 font-medium">{selectedIncome.PROJECT}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Source:</span>
                <span className="text-slate-200">{selectedIncome.INCOME_SOURCE}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Remarks:</span>
                <span className="text-slate-300 italic">{selectedIncome.REMARKS || 'None'}</span>
              </div>
              {selectedIncome.PROOF_DOCUMENT && (
                <div className="pt-2">
                  <span className="text-slate-400 block mb-1">Attached Bank Slip:</span>
                  <img src={selectedIncome.PROOF_DOCUMENT} alt="slip" className="max-h-48 w-full object-contain rounded-lg border border-slate-800 bg-black/40" />
                </div>
              )}
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <>
                    <button
                      onClick={() => {
                        const target = selectedIncome;
                        setSelectedIncome(null);
                        setEditingIncome(target);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-blue-950 text-slate-300 hover:text-blue-400 text-xs font-medium border border-slate-700 flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Admin: Are you sure you want to delete income voucher "${selectedIncome.INCOME_ID}"?`)) {
                          deleteIncome(selectedIncome.id);
                          setSelectedIncome(null);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 text-xs font-medium border border-slate-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setSelectedIncome(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Income Modal */}
      {editingIncome && (
        <AddIncomeModal
          isOpen={Boolean(editingIncome)}
          onClose={() => setEditingIncome(null)}
          incomeToEdit={editingIncome}
        />
      )}

      {/* Bulk Import Income Modal */}
      <BulkImportIncomeModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />
    </div>
  );
};
