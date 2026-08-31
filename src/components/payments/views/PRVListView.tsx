import React from 'react';
import {
  Search,
  Filter,
  Plus,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  ChevronRight,
  Eye,
  Camera,
  ShieldCheck,
  RotateCcw,
  ArrowUpDown,
  Download,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { usePRV } from '../../../context/PRVContext';
import { usePettyCash } from '../../../context/PettyCashContext';
import { useEnterprise } from '../../../context/EnterpriseContext';
import { PaymentRequestVoucher, PRVStatus } from '../../../types/prvTypes';
import { AdminClearHistoryButton } from '../../common/AdminClearHistoryButton';

export const PRVListView: React.FC = () => {
  const {
    filteredRequests,
    filters,
    setFilters,
    resetFilters,
    metrics,
    clearAllPRVHistory,
    deletePaymentRequest,
    setIsCreateModalOpen,
    setSelectedPRV,
    setIsDetailModalOpen,
    openProofScannerForPRV,
    openOwnerApprovalForPRV
  } = usePRV();

  const { projects, categories } = usePettyCash();
  const { currentUser, currentRole } = useEnterprise();
  const isAdmin = currentRole === 'ADMIN' || currentRole === 'OWNER';

  const handleRowClick = (prv: PaymentRequestVoucher) => {
    setSelectedPRV(prv);
    setIsDetailModalOpen(true);
  };

  const getStatusBadge = (status: PRVStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-bold">Draft</span>;
      case 'SUBMITTED':
        return <span className="px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold">Pending L1</span>;
      case 'ACCOUNTS_L1_APPROVED':
        return <span className="px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-bold">Pending L2</span>;
      case 'ACCOUNTS_L2_APPROVED':
        return <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-bold">Pending Owner</span>;
      case 'OWNER_APPROVED':
      case 'PAYMENT_PROOF_PENDING':
        return <span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">Proof Pending</span>;
      case 'PAID':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">Paid</span>;
      case 'ACCOUNTS_L1_REJECTED':
      case 'ACCOUNTS_L2_REJECTED':
      case 'OWNER_REJECTED':
        return <span className="px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold">Rejected</span>;
      case 'ACCOUNTS_L1_RETURNED':
      case 'ACCOUNTS_L2_RETURNED':
      case 'OWNER_RETURNED':
        return <span className="px-2 py-0.5 rounded-md bg-orange-950 text-orange-300 border border-orange-800 text-[10px] font-bold">Returned</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px]">{status}</span>;
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Top Quick Action & Summary Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-100">Payment Request Vouchers (PRV)</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-[11px] font-mono font-bold">
              {metrics.totalRequests} Total Vouchers
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Multi-stage enterprise verification: Requester → Accounts Level 1 → Accounts Level 2 → Owner Approval → Proof Scan → Auto-posted Project Expense
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <AdminClearHistoryButton
            id="btn-admin-clear-prv"
            moduleName="Payment Request Vouchers (PRV)"
            itemCount={metrics.totalRequests}
            itemDescription="payment vouchers, approval audit trails, and proof attachments"
            preservedItemsDescription="Core projects, chart of accounts, and user profiles remain intact."
            onClear={() => clearAllPRVHistory()}
          />
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-bold shadow-lg active:scale-95 transition-all text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Payment Request</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Requested</span>
          <div className="text-sm sm:text-base font-mono font-bold text-slate-100">
            AED {metrics.totalAmountRequested.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider">Accounts L1 Queue</span>
          <div className="text-sm sm:text-base font-mono font-bold text-purple-300 flex items-center justify-between">
            <span>{metrics.pendingAccountsL1Count}</span>
            <Clock className="w-3.5 h-3.5 text-purple-400" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider">Accounts L2 Queue</span>
          <div className="text-sm sm:text-base font-mono font-bold text-indigo-300 flex items-center justify-between">
            <span>{metrics.pendingAccountsL2Count}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">Owner Approval</span>
          <div className="text-sm sm:text-base font-mono font-bold text-amber-300 flex items-center justify-between">
            <span>{metrics.pendingOwnerCount}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-teal-400 uppercase font-bold tracking-wider">Proof Pending</span>
          <div className="text-sm sm:text-base font-mono font-bold text-teal-300 flex items-center justify-between">
            <span>{metrics.pendingProofCount}</span>
            <Camera className="w-3.5 h-3.5 text-teal-400" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Paid & Posted</span>
          <div className="text-sm sm:text-base font-mono font-bold text-emerald-400 flex items-center justify-between">
            <span>{metrics.paidCount}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="Search PRV #, Payee, Purpose, Ref #..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none text-xs"
            />
          </div>

          {/* Project Filter */}
          <div>
            <select
              value={filters.project}
              onChange={(e) => setFilters(prev => ({ ...prev, project: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-300 focus:border-purple-500 focus:outline-none text-xs"
            >
              <option value="ALL">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.PROJECT_CODE}>{p.PROJECT_CODE} - {p.PROJECT_NAME}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-300 focus:border-purple-500 focus:outline-none text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Pending Accounts L1</option>
              <option value="ACCOUNTS_L1_APPROVED">Pending Accounts L2</option>
              <option value="ACCOUNTS_L2_APPROVED">Pending Owner Approval</option>
              <option value="OWNER_APPROVED">Payment Proof Pending</option>
              <option value="PAID">Paid (Completed)</option>
              <option value="ACCOUNTS_L1_REJECTED">Accounts L1 Rejected</option>
              <option value="ACCOUNTS_L2_REJECTED">Accounts L2 Rejected</option>
              <option value="OWNER_REJECTED">Owner Rejected</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-300 focus:border-purple-500 focus:outline-none text-xs"
            >
              <option value="ALL">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Extended Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>Showing <strong className="text-slate-200">{filteredRequests.length}</strong> vouchers</span>
            <button
              onClick={resetFilters}
              className="text-purple-400 hover:text-purple-300 font-semibold"
            >
              Reset Filters
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sort by:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
              className="bg-slate-950 border border-slate-800 rounded p-1 text-slate-300 text-xs"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="project">Project</option>
              <option value="status">Status</option>
            </select>
            <button
              onClick={() => setFilters(prev => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Toggle Sort Order"
            >
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Vouchers Master Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3.5">PRV Number</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Project / GL</th>
                <th className="py-3 px-3">Purpose & Payee</th>
                <th className="py-3 px-3">Requested By</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold">No payment request vouchers match your filter criteria.</p>
                    <button
                      onClick={resetFilters}
                      className="mt-2 text-purple-400 hover:text-purple-300 font-bold"
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredRequests.map(prv => (
                  <tr
                    key={prv.id}
                    onClick={() => handleRowClick(prv)}
                    className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3.5 font-mono font-bold text-purple-300 whitespace-nowrap">
                      {prv.prvNumber}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-slate-400">
                      {prv.requestDate}
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

                    <td className="py-3 px-3 whitespace-nowrap text-slate-300 font-medium">
                      {prv.requestedBy}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          prv.priority === 'Urgent'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : prv.priority === 'High'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {prv.priority}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-100 whitespace-nowrap">
                      <span className="text-[10px] text-slate-400 font-normal mr-1">{prv.currency}</span>
                      {prv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {getStatusBadge(prv.status)}
                    </td>

                    <td className="py-3 px-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {prv.status === 'ACCOUNTS_L2_APPROVED' && (
                          <button
                            onClick={() => openOwnerApprovalForPRV(prv)}
                            className="p-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 font-bold text-[10px] flex items-center gap-1"
                            title="Owner Authorization"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Authorize</span>
                          </button>
                        )}

                        {(prv.status === 'OWNER_APPROVED' || prv.status === 'PAYMENT_PROOF_PENDING') && (
                          <button
                            onClick={() => openProofScannerForPRV(prv)}
                            className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 font-bold text-[10px] flex items-center gap-1"
                            title="Scan Payment Proof"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Scan Proof</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleRowClick(prv)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="View Voucher Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Admin: Are you sure you want to delete Payment Request Voucher ${prv.prvNumber} (${prv.currency} ${prv.totalAmount.toLocaleString()}) for "${prv.purpose}"?`)) {
                                deletePaymentRequest(prv.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-800 transition-colors"
                            title="Admin: Delete PRV"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
    </div>
  );
};
