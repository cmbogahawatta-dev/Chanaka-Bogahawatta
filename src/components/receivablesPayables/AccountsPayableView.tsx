import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Plus,
  Filter,
  DollarSign,
  Edit2,
  Trash2,
  Calendar,
  Building2,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpDown,
  Download,
  ShoppingCart,
  Truck
} from 'lucide-react';
import { PayableBill } from '../../types/receivablesPayablesTypes';
import { useReceivablesPayables, calculateOverdueDays } from '../../context/ReceivablesPayablesContext';
import { formatLKR, formatDate } from '../../utils/helpers';
import { formatMillions } from './ReceivablesDashboardView';

interface AccountsPayableViewProps {
  onOpenCreateModal: () => void;
  onOpenEditModal: (bill: PayableBill) => void;
  onOpenPaymentModal: (bill: PayableBill) => void;
  onOpenDeleteModal: (bill: PayableBill) => void;
}

export const AccountsPayableView: React.FC<AccountsPayableViewProps> = ({
  onOpenCreateModal,
  onOpenEditModal,
  onOpenPaymentModal,
  onOpenDeleteModal
}) => {
  const { payables, createPRVForPayable } = useReceivablesPayables();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OVERDUE' | 'DUE_SOON' | 'PARTIAL' | 'CURRENT' | 'PAID'>('ALL');
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'dueDate' | 'amount' | 'outstanding'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [prvFeedback, setPrvFeedback] = useState<string | null>(null);

  const handleRaisePRV = (bill: PayableBill) => {
    const res = createPRVForPayable(bill.id);
    if (res.success) {
      setPrvFeedback(`Success: Payment Request Voucher ${res.prvNumber} generated for ${bill.supplier}! Linked to Bill #${bill.invoiceNumber}`);
      setTimeout(() => setPrvFeedback(null), 6000);
    } else {
      setPrvFeedback(`Could not generate PRV: ${res.error || 'Unknown error'}`);
      setTimeout(() => setPrvFeedback(null), 5000);
    }
  };

  // Extract distinct suppliers
  const uniqueSuppliers = useMemo(() => {
    const set = new Set<string>();
    payables.forEach(p => {
      if (p.supplier) set.add(p.supplier);
    });
    return Array.from(set);
  }, [payables]);

  // Filter and sort payables
  const filteredPayables = useMemo(() => {
    return payables
      .filter(item => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchSupplier = item.supplier.toLowerCase().includes(q);
          const matchPo = item.poNumber.toLowerCase().includes(q);
          const matchGrn = item.grnNumber.toLowerCase().includes(q);
          const matchInvoice = item.invoiceNumber.toLowerCase().includes(q);
          const matchProject = item.project?.toLowerCase().includes(q);
          if (!matchSupplier && !matchPo && !matchGrn && !matchInvoice && !matchProject) return false;
        }

        // Status filter
        const odDays = calculateOverdueDays(item.dueDate);
        const isPaid = item.outstanding <= 0;
        const isOverdue = !isPaid && odDays > 0;
        const isDueSoon = !isPaid && odDays >= -7 && odDays <= 0;
        const isPartial = !isPaid && item.paid > 0 && !isOverdue && !isDueSoon;
        const isCurrent = !isPaid && odDays < -7 && item.paid === 0;

        if (statusFilter === 'OVERDUE' && !isOverdue) return false;
        if (statusFilter === 'DUE_SOON' && !isDueSoon) return false;
        if (statusFilter === 'PARTIAL' && !isPartial) return false;
        if (statusFilter === 'CURRENT' && !isCurrent) return false;
        if (statusFilter === 'PAID' && !isPaid) return false;

        // Supplier filter
        if (supplierFilter !== 'ALL' && item.supplier !== supplierFilter) return false;

        return true;
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (sortField === 'dueDate') {
          valA = new Date(a.dueDate).getTime();
          valB = new Date(b.dueDate).getTime();
        } else if (sortField === 'amount') {
          valA = a.amount;
          valB = b.amount;
        } else if (sortField === 'outstanding') {
          valA = a.outstanding;
          valB = b.outstanding;
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [payables, searchQuery, statusFilter, supplierFilter, sortField, sortOrder]);

  // Totals for filtered records
  const filteredTotals = useMemo(() => {
    let totalAmt = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;

    filteredPayables.forEach(p => {
      totalAmt += p.amount;
      totalPaid += p.paid;
      totalOutstanding += p.outstanding;
      if (calculateOverdueDays(p.dueDate) > 0 && p.outstanding > 0) {
        totalOverdue += p.outstanding;
      }
    });

    return { totalAmt, totalPaid, totalOutstanding, totalOverdue };
  }, [filteredPayables]);

  const handleExportCsv = () => {
    const headers = [
      'Supplier',
      'PO',
      'GRN',
      'Invoice',
      'Due Date',
      'Amount (LKR)',
      'Paid (LKR)',
      'Outstanding (LKR)',
      'Status'
    ];

    const rows = filteredPayables.map(p => {
      const od = calculateOverdueDays(p.dueDate);
      const statusText = p.outstanding <= 0 ? 'Paid' : od > 0 ? `${od}d Overdue` : od >= -7 ? 'Due Soon' : 'Current';
      return [
        `"${p.supplier.replace(/"/g, '""')}"`,
        p.poNumber,
        p.grnNumber,
        p.invoiceNumber,
        p.dueDate,
        p.amount,
        p.paid,
        p.outstanding,
        statusText
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Accounts_Payable_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by supplier, PO #, GRN #, or supplier invoice #..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <select
              value={supplierFilter}
              onChange={e => setSupplierFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 shrink-0"
            >
              <option value="ALL">All Suppliers ({uniqueSuppliers.length})</option>
              {uniqueSuppliers.map(sup => (
                <option key={sup} value={sup}>
                  {sup}
                </option>
              ))}
            </select>

            <button
              onClick={handleExportCsv}
              className="px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              title="Export filtered records to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={onOpenCreateModal}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-rose-950/40 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Bill</span>
            </button>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs pt-1 border-t border-slate-800/80">
          <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider shrink-0">Status:</span>
          {(['ALL', 'OVERDUE', 'DUE_SOON', 'PARTIAL', 'CURRENT', 'PAID'] as const).map(status => {
            const count = payables.filter(p => {
              if (status === 'ALL') return true;
              const od = calculateOverdueDays(p.dueDate);
              if (status === 'OVERDUE') return p.outstanding > 0 && od > 0;
              if (status === 'DUE_SOON') return p.outstanding > 0 && od >= -7 && od <= 0;
              if (status === 'PARTIAL') return p.outstanding > 0 && p.paid > 0 && od < -7;
              if (status === 'CURRENT') return p.outstanding > 0 && p.paid === 0 && od < -7;
              if (status === 'PAID') return p.outstanding <= 0;
              return false;
            }).length;

            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all shrink-0 ${
                  statusFilter === status
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {status === 'ALL' ? 'All Bills' : status === 'DUE_SOON' ? 'Due Soon (≤7d)' : status} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* PRV Generation Feedback Banner */}
      {prvFeedback && (
        <div className="p-3 bg-purple-950/80 border border-purple-700/80 rounded-xl text-purple-200 text-xs flex items-center justify-between gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-white">{prvFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setPrvFeedback(null)}
            className="text-[11px] font-semibold text-purple-400 hover:text-white px-2 py-0.5 rounded bg-purple-900/60"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Accounts Payable Table (Fields matching exact user prompt: Supplier, PO, GRN, Invoice, Due date, Amount, Paid, Outstanding) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">PO</th>
                <th className="px-4 py-3">GRN</th>
                <th className="px-4 py-3">Invoice</th>
                <th
                  className="px-4 py-3 cursor-pointer hover:text-white"
                  onClick={() => {
                    if (sortField === 'dueDate') setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                    else {
                      setSortField('dueDate');
                      setSortOrder('asc');
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Due Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right cursor-pointer hover:text-white"
                  onClick={() => {
                    if (sortField === 'amount') setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                    else {
                      setSortField('amount');
                      setSortOrder('desc');
                    }
                  }}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Amount</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th
                  className="px-4 py-3 text-right cursor-pointer hover:text-white"
                  onClick={() => {
                    if (sortField === 'outstanding') setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                    else {
                      setSortField('outstanding');
                      setSortOrder('desc');
                    }
                  }}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Outstanding</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredPayables.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-slate-500">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-400">No Accounts Payable Bills Found</p>
                    <p className="text-[11px] mt-1">Try adjusting your search query or click "Add Bill" above.</p>
                  </td>
                </tr>
              ) : (
                filteredPayables.map(item => {
                  const odDays = calculateOverdueDays(item.dueDate);
                  const isPaid = item.outstanding <= 0;
                  const isOverdue = !isPaid && odDays > 0;
                  const isDueSoon = !isPaid && odDays >= -7 && odDays <= 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-950/40 transition-colors group"
                    >
                      {/* Supplier */}
                      <td className="px-4 py-3 font-semibold text-white max-w-[200px] truncate" title={item.supplier}>
                        <div className="flex items-center gap-1.5">
                          <span>{item.supplier}</span>
                          {isPaid ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              PAID
                            </span>
                          ) : isOverdue ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                              {odDays}d OVERDUE
                            </span>
                          ) : isDueSoon ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-950 text-amber-300 border border-amber-800">
                              DUE SOON
                            </span>
                          ) : null}
                        </div>
                        {item.project && (
                          <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                            {item.project}
                          </div>
                        )}
                      </td>

                      {/* PO */}
                      <td className="px-4 py-3 font-mono text-cyan-300 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                          {item.poNumber}
                        </span>
                      </td>

                      {/* GRN */}
                      <td className="px-4 py-3 font-mono text-amber-300 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                          {item.grnNumber}
                        </span>
                      </td>

                      {/* Invoice */}
                      <td className="px-4 py-3 font-mono text-white whitespace-nowrap">
                        <div className="font-bold">{item.invoiceNumber}</div>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          {item.sourceModule === 'PROCUREMENT' && (
                            <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-amber-950/70 text-amber-300 border border-amber-800/80" title="Linked to Procurement Module">
                              Procurement
                            </span>
                          )}
                          {item.prvNumber && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800" title={`Linked to Payment Request ${item.prvNumber} (${item.prvStatus || 'PRV'})`}>
                              {item.prvNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={isOverdue ? 'text-rose-400 font-bold' : isDueSoon ? 'text-amber-400 font-medium' : 'text-slate-300'}>
                          {formatDate(item.dueDate)}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-200 whitespace-nowrap">
                        {formatLKR(item.amount)}
                      </td>

                      {/* Paid */}
                      <td className="px-4 py-3 text-right font-mono text-emerald-400 whitespace-nowrap">
                        {formatLKR(item.paid)}
                      </td>

                      {/* Outstanding */}
                      <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap">
                        <span className={item.outstanding > 0 ? 'text-rose-400' : 'text-slate-500'}>
                          {formatLKR(item.outstanding)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.outstanding > 0 && !item.prvNumber && (
                            <button
                              type="button"
                              onClick={() => handleRaisePRV(item)}
                              className="px-2 py-1 bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-800/80 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm"
                              title="Raise Payment Request Voucher (PRV) in Payment Module"
                            >
                              <Receipt className="w-3 h-3 text-purple-400" />
                              <span>Raise PRV</span>
                            </button>
                          )}

                          {item.outstanding > 0 && (
                            <button
                              type="button"
                              onClick={() => onOpenPaymentModal(item)}
                              className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                              title="Record Disbursement"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Disburse</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onOpenEditModal(item)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            title="Edit Bill"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenDeleteModal(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Delete Bill"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary Bar */}
        <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
          <div>
            Showing <strong className="text-white">{filteredPayables.length}</strong> of{' '}
            <strong className="text-white">{payables.length}</strong> Bills
          </div>

          <div className="flex items-center gap-4 font-mono">
            <span>
              Total Billed: <strong className="text-slate-200">{formatLKR(filteredTotals.totalAmt)}</strong>
            </span>
            <span>
              Disbursed: <strong className="text-emerald-400">{formatLKR(filteredTotals.totalPaid)}</strong>
            </span>
            <span>
              Outstanding:{' '}
              <strong className="text-rose-400 font-bold">{formatLKR(filteredTotals.totalOutstanding)}</strong> (
              {formatMillions(filteredTotals.totalOutstanding)})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
