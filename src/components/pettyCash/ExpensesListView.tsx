import React, { useState } from 'react';
import {
  Receipt,
  PlusCircle,
  Download,
  Search,
  Filter,
  Eye,
  FileSpreadsheet,
  CheckCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpDown,
  Image as ImageIcon,
  Edit2,
  Trash2,
  Upload,
  ShieldCheck,
  ShieldAlert,
  CheckSquare,
  Square,
  Layers,
  Sparkles
} from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { PettyCashFilterBar } from './PettyCashFilterBar';
import { Expense } from '../../types/pettyCashTypes';
import { AdminClearHistoryButton } from '../common/AdminClearHistoryButton';
import { AddExpenseModal } from './AddExpenseModal';
import { BulkImportExpensesModal } from './BulkImportExpensesModal';
import { AdminSecurityService } from '../../services/adminSecurityService';

interface ExpensesListViewProps {
  onOpenAddExpense: () => void;
  onSelectExpenseForDetail: (expense: Expense) => void;
}

export const ExpensesListView: React.FC<ExpensesListViewProps> = ({
  onOpenAddExpense,
  onSelectExpenseForDetail
}) => {
  const {
    filteredExpenses,
    exportToCsv,
    clearExpensesHistory,
    userRole,
    deleteExpense,
    bulkApproveExpenses,
    bulkRejectExpenses
  } = usePettyCash();
  const { currentRole } = useEnterprise();
  const isAdmin = userRole === 'ADMIN' || currentRole === 'ADMIN' || AdminSecurityService.isVerified();

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState<boolean>(false);

  // Multi-selection state for batch admin actions
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);

  // Sorting state
  const [sortField, setSortField] = useState<'DATE_REF' | 'AMOUNT' | 'EXPENSES_ID'>('DATE_REF');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const formatLKR = (amount: number): string => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount).replace('LKR', 'LKR ');
  };

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (sortField === 'AMOUNT') {
      return sortAsc ? a.AMOUNT - b.AMOUNT : b.AMOUNT - a.AMOUNT;
    }
    if (sortField === 'EXPENSES_ID') {
      return sortAsc ? a.EXPENSES_ID.localeCompare(b.EXPENSES_ID) : b.EXPENSES_ID.localeCompare(a.EXPENSES_ID);
    }
    // Default DATE_REF
    return sortAsc ? (a.DATE_REF || '').localeCompare(b.DATE_REF || '') : (b.DATE_REF || '').localeCompare(a.DATE_REF || '');
  });

  const toggleSort = (field: 'DATE_REF' | 'AMOUNT' | 'EXPENSES_ID') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Pending expenses count & sum
  const pendingExpenses = filteredExpenses.filter(e => e.PAYMENT_STATUS === 'Pending');
  const pendingTotalAmount = pendingExpenses.reduce((sum, e) => sum + (Number(e.AMOUNT) || 0), 0);

  const totalFilteredAmount = filteredExpenses.reduce((sum, exp) => sum + (Number(exp.AMOUNT) || 0), 0);

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedExpenseIds.length === sortedExpenses.length) {
      setSelectedExpenseIds([]);
    } else {
      setSelectedExpenseIds(sortedExpenses.map(e => e.id));
    }
  };

  const handleToggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedExpenseIds(prev => {
      const arr = Array.isArray(prev) ? prev : [];
      return arr.includes(id) ? arr.filter(item => item !== id) : [...arr, id];
    });
  };

  const handleBulkApproveSelected = () => {
    if (selectedExpenseIds.length === 0) return;
    if (window.confirm(`Admin: Approve all ${selectedExpenseIds.length} selected expense vouchers?`)) {
      bulkApproveExpenses(selectedExpenseIds, 'Administrator / Finance Controller', 'Bulk approved by Admin');
      setSelectedExpenseIds([]);
    }
  };

  const handleBulkRejectSelected = () => {
    if (selectedExpenseIds.length === 0) return;
    const reason = window.prompt(`Admin: Enter rejection reason for ${selectedExpenseIds.length} selected vouchers:`, 'Declined during bulk review');
    if (reason !== null) {
      bulkRejectExpenses(selectedExpenseIds, 'Administrator', reason);
      setSelectedExpenseIds([]);
    }
  };

  const handleApproveAllPending = () => {
    const pendingIds = pendingExpenses.map(e => e.id);
    if (pendingIds.length === 0) return;
    if (window.confirm(`Admin: Approve all ${pendingIds.length} pending expense vouchers (Total: ${formatLKR(pendingTotalAmount)})?`)) {
      bulkApproveExpenses(pendingIds, 'Administrator / Finance Controller', 'Batch approved all pending site vouchers');
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-400" />
            <span>Site Expenses Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Displaying {filteredExpenses.length} expense vouchers. Total value: <span className="font-bold text-emerald-400 font-mono">{formatLKR(totalFilteredAmount)}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AdminClearHistoryButton
            id="btn-admin-clear-expenses"
            moduleName="Petty Cash Expenses"
            itemCount={filteredExpenses.length}
            itemDescription="expense vouchers and bill receipts"
            preservedItemsDescription="Supervisors, projects, and chart of accounts remain intact."
            onClear={() => clearExpensesHistory()}
          />
          <button
            id="btn-export-expenses-csv"
            onClick={() => exportToCsv('expenses')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            id="btn-bulk-import-expenses"
            onClick={() => setIsBulkImportOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-emerald-950/70 text-emerald-300 border border-emerald-700/60 text-xs font-bold shadow-sm hover:border-emerald-600 transition-all active:scale-95"
            title="Bulk import expenses from Excel/CSV with Admin approval"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bulk Import</span>
          </button>
          <button
            id="btn-add-expense-from-list"
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Pending Approvals Alert Banner */}
      {pendingExpenses.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/80 shadow-md flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-900/70 border border-amber-700 flex items-center justify-center text-amber-300 flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-amber-200">
                  {pendingExpenses.length} Expense Voucher{pendingExpenses.length > 1 ? 's' : ''} Awaiting Admin Approval
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.2 rounded bg-amber-900 text-amber-300 border border-amber-700">
                  Action Required
                </span>
              </div>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Total pending sign-off value: <strong className="text-amber-200 font-mono">{formatLKR(pendingTotalAmount)}</strong>. These entries do not deduct supervisor funds until authorized.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedExpenseIds(pendingExpenses.map(e => e.id));
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-700 text-xs font-bold transition-colors"
            >
              Select Pending ({pendingExpenses.length})
            </button>
            <button
              onClick={handleApproveAllPending}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Approve All Pending</span>
            </button>
          </div>
        </div>
      )}

      {/* Bulk Selection Action Bar */}
      {selectedExpenseIds.length > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-600 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-slate-100">
              <span className="text-emerald-400 font-mono font-black">{selectedExpenseIds.length}</span> expense{selectedExpenseIds.length > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkApproveSelected}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-all active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve Selected ({selectedExpenseIds.length})</span>
            </button>
            <button
              onClick={handleBulkRejectSelected}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold transition-all active:scale-95"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject Selected</span>
            </button>
            <button
              onClick={() => setSelectedExpenseIds([])}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Global Filter Bar */}
      <PettyCashFilterBar />

      {/* Expenses Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800 text-slate-300 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                    title="Select All Rows"
                  >
                    {selectedExpenseIds.length > 0 && selectedExpenseIds.length === sortedExpenses.length ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th
                  onClick={() => toggleSort('EXPENSES_ID')}
                  className="py-3 px-3.5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Expense ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('DATE_REF')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Supervisor</th>
                <th className="py-3 px-3">Project</th>
                <th className="py-3 px-3">Category</th>
                <th
                  onClick={() => toggleSort('AMOUNT')}
                  className="py-3 px-3 cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Amount (LKR)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 min-w-[200px]">Description</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Proof</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-sans">
              {sortedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No expense records found matching current criteria.
                  </td>
                </tr>
              ) : (
                sortedExpenses.map((exp) => {
                  const isSelected = selectedExpenseIds.includes(exp.id);
                  return (
                    <tr
                      key={exp.id}
                      onClick={() => onSelectExpenseForDetail(exp)}
                      className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center" onClick={(e) => handleToggleSelectOne(exp.id, e)}>
                        <button className="text-slate-400 hover:text-slate-200">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span>{exp.EXPENSES_ID}</span>
                          {(exp.IS_HISTORICAL || exp.DATA_SOURCE === 'HISTORICAL_IMPORT') && (
                            <span
                              className="text-[9px] font-extrabold tracking-wider uppercase px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-800"
                              title={`Historical record migrated in batch ${exp.IMPORT_BATCH_ID || 'HISTORICAL'}`}
                            >
                              Batch
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-medium">
                        {exp.DATE}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-100">
                        {exp.SUPERVISOR}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-[11px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                          {exp.PROJECT}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 truncate max-w-[160px]" title={exp.EXPENSES_CATEGORY}>
                        {exp.EXPENSES_CATEGORY}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">
                        {formatLKR(exp.AMOUNT)}
                      </td>
                      <td className="py-3 px-3 text-slate-300 truncate max-w-[240px]" title={exp.EXPENSES_DESCRIPTION}>
                        {exp.EXPENSES_DESCRIPTION}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          exp.PAYMENT_STATUS === 'Approved'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : exp.PAYMENT_STATUS === 'Pending'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : exp.PAYMENT_STATUS === 'Paid'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : exp.PAYMENT_STATUS === 'Rejected'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {exp.PAYMENT_STATUS}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {exp.PROOF_DOCUMENT ? (
                          <span className="inline-flex items-center justify-center text-emerald-400" title="Receipt Attached">
                            <ImageIcon className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onSelectExpenseForDetail(exp)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => setEditingExpense(exp)}
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400 transition-colors"
                                title="Admin: Edit Expense"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Admin: Are you sure you want to delete expense voucher "${exp.EXPENSES_ID}" (${exp.EXPENSES_DESCRIPTION})?`)) {
                                    deleteExpense(exp.id);
                                  }
                                }}
                                className="p-1.5 rounded bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 transition-colors"
                                title="Admin: Delete Expense"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
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

      {/* Edit Expense Modal for Admin */}
      {editingExpense && (
        <AddExpenseModal
          isOpen={Boolean(editingExpense)}
          onClose={() => setEditingExpense(null)}
          expenseToEdit={editingExpense}
        />
      )}

      {/* Bulk Import Expenses with Admin Approval Modal */}
      {isBulkImportOpen && (
        <BulkImportExpensesModal
          isOpen={isBulkImportOpen}
          onClose={() => setIsBulkImportOpen(false)}
        />
      )}
    </div>
  );
};
