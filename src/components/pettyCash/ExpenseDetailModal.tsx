import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  Building,
  User,
  Tag,
  FileText,
  Clock,
  ExternalLink,
  Trash2,
  AlertTriangle,
  Edit2
} from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { Expense, PaymentStatus } from '../../types/pettyCashTypes';
import { AddExpenseModal } from './AddExpenseModal';

interface ExpenseDetailModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  expense,
  isOpen,
  onClose
}) => {
  const { userRole, updateExpenseStatus, deleteExpense } = usePettyCash();
  const { currentRole } = useEnterprise();
  const isAdmin = userRole === 'ADMIN' || currentRole === 'ADMIN';

  const [rejectRemarks, setRejectRemarks] = useState<string>('');
  const [showRejectBox, setShowRejectBox] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  if (!isOpen || !expense) return null;

  const formatLKR = (amount: number): string => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount).replace('LKR', 'LKR ');
  };

  const handleApprove = () => {
    updateExpenseStatus(expense.id, 'Approved', 'Approved by Finance');
    onClose();
  };

  const handleReject = () => {
    if (!rejectRemarks.trim()) {
      alert('Please provide a reason for rejecting this expense.');
      return;
    }
    updateExpenseStatus(expense.id, 'Rejected', `Rejected: ${rejectRemarks.trim()}`);
    setShowRejectBox(false);
    onClose();
  };

  const handleMarkPaid = () => {
    updateExpenseStatus(expense.id, 'Paid', 'Disbursed and settled in full');
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to permanently delete expense ${expense.EXPENSES_ID}?`)) {
      deleteExpense(expense.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
              {expense.EXPENSES_ID}
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              expense.PAYMENT_STATUS === 'Approved'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : expense.PAYMENT_STATUS === 'Pending'
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : expense.PAYMENT_STATUS === 'Paid'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : expense.PAYMENT_STATUS === 'Rejected'
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : 'bg-slate-800 text-slate-300'
            }`}>
              {expense.PAYMENT_STATUS}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Main Amount & Purpose Banner */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Transaction Amount
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                {formatLKR(expense.AMOUNT)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Date</span>
              <span className="text-sm font-bold text-slate-200">{expense.DATE}</span>
            </div>
          </div>

          {/* Detailed Attributes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400 block text-[10px] font-bold uppercase mb-1">Supervisor</span>
              <span className="font-bold text-slate-100 text-sm">{expense.SUPERVISOR}</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400 block text-[10px] font-bold uppercase mb-1">Project Code</span>
              <span className="font-bold text-emerald-400 text-sm">{expense.PROJECT}</span>
            </div>

            <div className="sm:col-span-2 p-3 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400 block text-[10px] font-bold uppercase mb-1">Category</span>
              <span className="font-semibold text-slate-200">{expense.EXPENSES_CATEGORY}</span>
            </div>

            <div className="sm:col-span-2 p-3 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400 block text-[10px] font-bold uppercase mb-1">Description</span>
              <p className="text-slate-200 font-medium leading-relaxed">{expense.EXPENSES_DESCRIPTION}</p>
            </div>

            {expense.REMARKS && (
              <div className="sm:col-span-2 p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400 block text-[10px] font-bold uppercase mb-1">Remarks</span>
                <p className="text-slate-300 italic">{expense.REMARKS}</p>
              </div>
            )}

            {expense.REJECTION_REASON && (
              <div className="sm:col-span-2 p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300">
                <span className="text-rose-400 block text-[10px] font-bold uppercase mb-1">Rejection Reason</span>
                <p className="font-semibold">{expense.REJECTION_REASON}</p>
              </div>
            )}
          </div>

          {/* Proof Document Section */}
          <div>
            <span className="text-xs font-bold text-slate-300 block mb-2">Proof Document / Receipt</span>
            {expense.PROOF_DOCUMENT ? (
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2">
                <img
                  src={expense.PROOF_DOCUMENT}
                  alt="Receipt attachment"
                  className="max-h-56 w-full object-contain rounded-lg bg-black/40"
                />
                <div className="mt-2 flex items-center justify-between px-1">
                  <span className="text-xs text-slate-400 truncate max-w-xs">
                    {expense.PROOF_DOCUMENT_NAME || 'Attached Receipt Voucher'}
                  </span>
                  <a
                    href={expense.PROOF_DOCUMENT}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Open Fullscreen</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-400 text-xs">
                No proof receipt attached for this entry.
              </div>
            )}
          </div>

          {/* Audit Metadata */}
          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/50 text-[11px] text-slate-400 space-y-1">
            {(expense.IS_HISTORICAL || expense.DATA_SOURCE === 'HISTORICAL_IMPORT') && (
              <div className="flex justify-between pb-1 mb-1 border-b border-slate-800">
                <span className="text-purple-400 font-bold">Migration Data Source:</span>
                <span className="text-purple-300 font-mono font-semibold">
                  HISTORICAL_IMPORT {expense.IMPORT_BATCH_ID ? `(${expense.IMPORT_BATCH_ID})` : ''}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Created By:</span>
              <span className="text-slate-300 font-mono">{expense.CREATED_BY}</span>
            </div>
            <div className="flex justify-between">
              <span>Submitted On:</span>
              <span className="text-slate-300">{expense.CREATED_DATE}</span>
            </div>
            {expense.APPROVED_BY && (
              <div className="flex justify-between">
                <span>Approved By:</span>
                <span className="text-emerald-400 font-mono">{expense.APPROVED_BY} ({expense.APPROVED_DATE})</span>
              </div>
            )}
          </div>

          {/* Reject Reason Box */}
          {showRejectBox && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 space-y-2">
              <label className="block text-xs font-bold text-rose-300">
                Reason for Rejection *
              </label>
              <textarea
                rows={2}
                placeholder="State reason (e.g., duplicate bill, receipt unreadable, wrong project code)..."
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                className="w-full bg-slate-950 border border-rose-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectBox(false)}
                  className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-2">
          {/* Admin / Finance Actions */}
          <div className="flex items-center gap-2">
            {(userRole === 'ADMIN' || userRole === 'FINANCE') && expense.PAYMENT_STATUS === 'Pending' && (
              <>
                <button
                  id="btn-approve-expense"
                  onClick={handleApprove}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve</span>
                </button>
                <button
                  id="btn-reject-expense"
                  onClick={() => setShowRejectBox(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </>
            )}

            {(userRole === 'ADMIN' || userRole === 'FINANCE') && expense.PAYMENT_STATUS === 'Approved' && (
              <button
                id="btn-mark-paid"
                onClick={handleMarkPaid}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
              >
                <DollarSign className="w-4 h-4" />
                <span>Mark Paid</span>
              </button>
            )}

            {isAdmin && (
              <>
                <button
                  id="btn-edit-expense"
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-blue-950 text-slate-300 hover:text-blue-400 text-xs font-medium border border-slate-700"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  id="btn-delete-expense"
                  onClick={handleDelete}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 text-xs font-medium border border-slate-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>

      {/* Edit Expense Modal for Admin */}
      {isEditModalOpen && (
        <AddExpenseModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            onClose();
          }}
          expenseToEdit={expense}
        />
      )}
    </div>
  );
};
