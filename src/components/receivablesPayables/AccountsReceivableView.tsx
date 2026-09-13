import React, { useState, useMemo } from 'react';
import {
  FileText,
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
  Download
} from 'lucide-react';
import { ReceivableInvoice } from '../../types/receivablesPayablesTypes';
import { useReceivablesPayables, calculateOverdueDays } from '../../context/ReceivablesPayablesContext';
import { formatLKR, formatDate } from '../../utils/helpers';
import { formatMillions } from './ReceivablesDashboardView';

interface AccountsReceivableViewProps {
  onOpenCreateModal: () => void;
  onOpenEditModal: (invoice: ReceivableInvoice) => void;
  onOpenPaymentModal: (invoice: ReceivableInvoice) => void;
  onOpenDeleteModal: (invoice: ReceivableInvoice) => void;
}

export const AccountsReceivableView: React.FC<AccountsReceivableViewProps> = ({
  onOpenCreateModal,
  onOpenEditModal,
  onOpenPaymentModal,
  onOpenDeleteModal
}) => {
  const { receivables } = useReceivablesPayables();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OVERDUE' | 'PARTIAL' | 'CURRENT' | 'PAID'>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'dueDate' | 'amount' | 'outstanding' | 'overdueDays'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Extract distinct projects
  const uniqueProjects = useMemo(() => {
    const set = new Set<string>();
    receivables.forEach(r => {
      if (r.project) set.add(r.project);
    });
    return Array.from(set);
  }, [receivables]);

  // Filter and sort receivables
  const filteredReceivables = useMemo(() => {
    return receivables
      .filter(item => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchInvoice = item.invoiceNumber.toLowerCase().includes(q);
          const matchClient = item.client.toLowerCase().includes(q);
          const matchProject = item.project.toLowerCase().includes(q);
          if (!matchInvoice && !matchClient && !matchProject) return false;
        }

        // Status filter
        const odDays = calculateOverdueDays(item.dueDate);
        const isPaid = item.outstanding <= 0;
        const isOverdue = !isPaid && odDays > 0;
        const isPartial = !isPaid && item.paid > 0 && !isOverdue;
        const isCurrent = !isPaid && odDays <= 0 && item.paid === 0;

        if (statusFilter === 'OVERDUE' && !isOverdue) return false;
        if (statusFilter === 'PARTIAL' && !isPartial) return false;
        if (statusFilter === 'CURRENT' && !isCurrent) return false;
        if (statusFilter === 'PAID' && !isPaid) return false;

        // Project filter
        if (projectFilter !== 'ALL' && item.project !== projectFilter) return false;

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
        } else if (sortField === 'overdueDays') {
          valA = calculateOverdueDays(a.dueDate);
          valB = calculateOverdueDays(b.dueDate);
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [receivables, searchQuery, statusFilter, projectFilter, sortField, sortOrder]);

  // Totals for filtered records
  const filteredTotals = useMemo(() => {
    let totalAmt = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;

    filteredReceivables.forEach(r => {
      totalAmt += r.amount;
      totalPaid += r.paid;
      totalOutstanding += r.outstanding;
      if (calculateOverdueDays(r.dueDate) > 0 && r.outstanding > 0) {
        totalOverdue += r.outstanding;
      }
    });

    return { totalAmt, totalPaid, totalOutstanding, totalOverdue };
  }, [filteredReceivables]);

  const handleExportCsv = () => {
    const headers = [
      'Invoice',
      'Invoice Date',
      'Due Date',
      'Amount (LKR)',
      'Paid (LKR)',
      'Outstanding (LKR)',
      'Overdue Days',
      'Client',
      'Project'
    ];

    const rows = filteredReceivables.map(r => {
      const od = calculateOverdueDays(r.dueDate);
      return [
        r.invoiceNumber,
        r.invoiceDate,
        r.dueDate,
        r.amount,
        r.paid,
        r.outstanding,
        od > 0 ? `${od} days overdue` : od === 0 ? 'Due today' : `Due in ${Math.abs(od)} days`,
        `"${r.client.replace(/"/g, '""')}"`,
        `"${r.project.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Accounts_Receivable_${new Date().toISOString().split('T')[0]}.csv`);
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
              placeholder="Search by invoice number, client, or project..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <select
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 shrink-0"
            >
              <option value="ALL">All Projects ({uniqueProjects.length})</option>
              {uniqueProjects.map(proj => (
                <option key={proj} value={proj}>
                  {proj}
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Invoice</span>
            </button>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs pt-1 border-t border-slate-800/80">
          <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider shrink-0">Status:</span>
          {(['ALL', 'OVERDUE', 'PARTIAL', 'CURRENT', 'PAID'] as const).map(status => {
            const count = receivables.filter(r => {
              if (status === 'ALL') return true;
              const od = calculateOverdueDays(r.dueDate);
              if (status === 'OVERDUE') return r.outstanding > 0 && od > 0;
              if (status === 'PARTIAL') return r.outstanding > 0 && r.paid > 0 && od <= 0;
              if (status === 'CURRENT') return r.outstanding > 0 && r.paid === 0 && od <= 0;
              if (status === 'PAID') return r.outstanding <= 0;
              return false;
            }).length;

            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all shrink-0 ${
                  statusFilter === status
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {status === 'ALL' ? 'All Invoices' : status} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Accounts Receivable Table (Fields matching exact user prompt) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Invoice Date</th>
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
                <th
                  className="px-4 py-3 text-center cursor-pointer hover:text-white"
                  onClick={() => {
                    if (sortField === 'overdueDays') setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                    else {
                      setSortField('overdueDays');
                      setSortOrder('desc');
                    }
                  }}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Overdue Days</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredReceivables.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-10 text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-400">No Accounts Receivable Invoices Found</p>
                    <p className="text-[11px] mt-1">Try adjusting your search query or click "Add Invoice" above.</p>
                  </td>
                </tr>
              ) : (
                filteredReceivables.map(item => {
                  const odDays = calculateOverdueDays(item.dueDate);
                  const isPaid = item.outstanding <= 0;
                  const isOverdue = !isPaid && odDays > 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-950/40 transition-colors group"
                    >
                      {/* Invoice */}
                      <td className="px-4 py-3 font-mono font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{item.invoiceNumber}</span>
                          {isPaid ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              PAID
                            </span>
                          ) : isOverdue ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                              OVERDUE
                            </span>
                          ) : item.paid > 0 ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-950 text-amber-300 border border-amber-800">
                              PARTIAL
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-blue-950 text-blue-300 border border-blue-800">
                              CURRENT
                            </span>
                          )}
                          {(item.sourceModule === 'TAX_INVOICE' || item.sourceModule === 'PROJECT_INCOME' || item.linkedTaxInvoiceId) && (
                            <span className="text-[9px] font-sans px-1.5 py-0.2 rounded font-normal bg-cyan-950/70 text-cyan-300 border border-cyan-800/80" title="Synchronized from Project Income Tax Invoices">
                              Income
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Invoice Date */}
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                        {formatDate(item.invoiceDate)}
                      </td>

                      {/* Due Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}>
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
                        <span className={item.outstanding > 0 ? 'text-emerald-400' : 'text-slate-500'}>
                          {formatLKR(item.outstanding)}
                        </span>
                      </td>

                      {/* Overdue Days */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {isPaid ? (
                          <span className="text-slate-500 font-medium">—</span>
                        ) : isOverdue ? (
                          <span className="px-2 py-0.5 rounded-full font-mono font-bold text-[10px] bg-rose-950 text-rose-300 border border-rose-800">
                            {odDays} {odDays === 1 ? 'day' : 'days'} overdue
                          </span>
                        ) : odDays === 0 ? (
                          <span className="px-2 py-0.5 rounded-full font-mono font-bold text-[10px] bg-amber-950 text-amber-300 border border-amber-800">
                            Due today
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full font-mono font-medium text-[10px] bg-slate-950 text-slate-400 border border-slate-800">
                            Due in {Math.abs(odDays)}d
                          </span>
                        )}
                      </td>

                      {/* Client */}
                      <td className="px-4 py-3 font-medium text-slate-200 max-w-[200px] truncate" title={item.client}>
                        {item.client}
                      </td>

                      {/* Project */}
                      <td className="px-4 py-3 text-slate-300 max-w-[180px] truncate" title={item.project}>
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px]">
                          {item.project}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.outstanding > 0 && (
                            <button
                              type="button"
                              onClick={() => onOpenPaymentModal(item)}
                              className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                              title="Record Client Settlement"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Settle</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onOpenEditModal(item)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            title="Edit Invoice"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenDeleteModal(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Delete Invoice"
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
            Showing <strong className="text-white">{filteredReceivables.length}</strong> of{' '}
            <strong className="text-white">{receivables.length}</strong> Invoices
          </div>

          <div className="flex items-center gap-4 font-mono">
            <span>
              Total: <strong className="text-slate-200">{formatLKR(filteredTotals.totalAmt)}</strong>
            </span>
            <span>
              Collected: <strong className="text-emerald-400">{formatLKR(filteredTotals.totalPaid)}</strong>
            </span>
            <span>
              Outstanding:{' '}
              <strong className="text-emerald-400 font-bold">{formatLKR(filteredTotals.totalOutstanding)}</strong> (
              {formatMillions(filteredTotals.totalOutstanding)})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
