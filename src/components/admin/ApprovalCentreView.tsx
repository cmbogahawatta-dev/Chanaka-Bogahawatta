import React, { useState } from 'react';
import {
  CheckSquare,
  Trash2,
  Upload,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Download,
  Eye,
  KeyRound,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Info,
  Calendar,
  User,
  RotateCcw,
  Sliders,
  History
} from 'lucide-react';
import { useDataManagement } from '../../context/DataManagementContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { useAttendance } from '../../context/AttendanceContext';
import { useLeave } from '../../context/LeaveContext';
import { usePayroll } from '../../context/PayrollContext';
import { DeleteRequest, ImportRequest } from '../../types/dataManagementTypes';
import { AdminSecurityService } from '../../services/adminSecurityService';
import { AuditLogView } from './AuditLogView';

export const ApprovalCentreView: React.FC = () => {
  const { currentRole, currentUser } = useEnterprise();
  const {
    deleteRequests,
    importRequests,
    approvalRules,
    approveAndExecuteDelete,
    rejectDeleteRequest,
    approveAndExecuteImport,
    rejectImportRequest,
    updateApprovalRule,
    resetApprovalRules
  } = useDataManagement();

  const { correctionRequests, overtimeRecords } = useAttendance();
  const { leaveRequests } = useLeave();
  const { payrollBatches } = usePayroll();

  const [activeTab, setActiveTab] = useState<'DELETE' | 'IMPORT' | 'OPERATIONAL' | 'RULES' | 'AUDIT'>('DELETE');
  const [deleteFilterStatus, setDeleteFilterStatus] = useState<string>('ALL');
  const [importFilterStatus, setImportFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected item modal for deep inspection
  const [selectedDeleteReq, setSelectedDeleteReq] = useState<DeleteRequest | null>(null);
  const [selectedImportReq, setSelectedImportReq] = useState<ImportRequest | null>(null);

  // Review action state
  const [reviewAction, setReviewAction] = useState<'HARD_DELETE' | 'DEACTIVATE' | 'ARCHIVE'>('HARD_DELETE');
  const [adminComment, setAdminComment] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const pendingDeleteCount = deleteRequests.filter(r => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length;
  const pendingImportCount = importRequests.filter(r => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length;
  const pendingAttendanceCount = correctionRequests.filter(c => c.finalStatus === 'PENDING').length;
  const pendingLeaveCount = leaveRequests.filter(l => ['SUBMITTED', 'COVER_UP_PENDING', 'SUPERVISOR_PENDING', 'MANAGER_PENDING', 'HR_PENDING', 'OWNER_PENDING'].includes(l.status)).length;
  const pendingOtCount = overtimeRecords.filter(o => o.status === 'PENDING').length;
  const pendingPayrollCount = payrollBatches.filter(b => ['HR_REVIEW', 'ACCOUNTS_REVIEW', 'OWNER_PENDING'].includes(b.status)).length;

  // Filtered Delete Requests
  const filteredDeleteRequests = deleteRequests.filter(r => {
    if (deleteFilterStatus !== 'ALL' && r.status !== deleteFilterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.deleteRequestId.toLowerCase().includes(q) ||
        r.recordTitle.toLowerCase().includes(q) ||
        r.recordId.toLowerCase().includes(q) ||
        r.module.toLowerCase().includes(q) ||
        r.requestedBy.userName.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered Import Requests
  const filteredImportRequests = importRequests.filter(r => {
    if (importFilterStatus !== 'ALL' && r.status !== importFilterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.importRequestId.toLowerCase().includes(q) ||
        r.batchId.toLowerCase().includes(q) ||
        r.fileName.toLowerCase().includes(q) ||
        r.module.toLowerCase().includes(q) ||
        r.directoryType.toLowerCase().includes(q) ||
        r.requestedBy.userName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handle Delete Review Execution
  const handleExecuteDeleteReview = async (request: DeleteRequest, action: 'HARD_DELETE' | 'DEACTIVATE' | 'ARCHIVE') => {
    setPinError(null);

    // Security PIN verification if hard deleting or high risk
    if (action === 'HARD_DELETE') {
      if (!securityPin.trim()) {
        setPinError('Admin Security PIN is required for hard deletion authorization.');
        return;
      }

      setIsProcessing(true);
      const authRes = await AdminSecurityService.verifySecurityKey(
        securityPin.trim(),
        `Authorize Deletion: ${request.module} (${request.recordTitle})`,
        {
          id: 'admin',
          name: currentUser || 'Administrator',
          role: currentRole
        }
      );
      setIsProcessing(false);

      if (!authRes.success) {
        setPinError(authRes.message || 'Invalid security key.');
        return;
      }
    }

    setIsProcessing(true);
    const result = approveAndExecuteDelete({
      requestId: request.id,
      action,
      reviewer: {
        userId: 'admin',
        userName: currentUser || 'Administrator',
        userRole: currentRole
      },
      adminComment: adminComment || `Approved ${action} by ${currentUser || 'Admin'}`,
      securityVerified: true
    });
    setIsProcessing(false);

    if (result.success) {
      setActionSuccessMsg(result.message);
      setTimeout(() => {
        setActionSuccessMsg(null);
        setSelectedDeleteReq(null);
        setSecurityPin('');
        setAdminComment('');
      }, 1200);
    } else {
      setPinError(result.message);
    }
  };

  const handleRejectDelete = (request: DeleteRequest) => {
    if (!adminComment.trim()) {
      setPinError('Please enter a rejection comment for the audit trail.');
      return;
    }

    rejectDeleteRequest({
      requestId: request.id,
      reviewer: {
        userId: 'admin',
        userName: currentUser || 'Administrator',
        userRole: currentRole
      },
      adminComment
    });

    setActionSuccessMsg(`Delete request ${request.deleteRequestId} rejected.`);
    setTimeout(() => {
      setActionSuccessMsg(null);
      setSelectedDeleteReq(null);
      setAdminComment('');
    }, 1200);
  };

  // Handle Import Review Execution
  const handleExecuteImportReview = (request: ImportRequest) => {
    setIsProcessing(true);
    const result = approveAndExecuteImport({
      requestId: request.id,
      reviewer: {
        userId: 'admin',
        userName: currentUser || 'Administrator',
        userRole: currentRole
      },
      adminComment: adminComment || `Approved bulk import by ${currentUser || 'Admin'}`
    });
    setIsProcessing(false);

    if (result.success) {
      setActionSuccessMsg(result.message);
      setTimeout(() => {
        setActionSuccessMsg(null);
        setSelectedImportReq(null);
        setAdminComment('');
      }, 1200);
    } else {
      setPinError(result.message);
    }
  };

  const handleRejectImport = (request: ImportRequest) => {
    if (!adminComment.trim()) {
      setPinError('Please enter a rejection reason.');
      return;
    }

    rejectImportRequest({
      requestId: request.id,
      reviewer: {
        userId: 'admin',
        userName: currentUser || 'Administrator',
        userRole: currentRole
      },
      adminComment
    });

    setActionSuccessMsg(`Import batch ${request.batchId} rejected.`);
    setTimeout(() => {
      setActionSuccessMsg(null);
      setSelectedImportReq(null);
      setAdminComment('');
    }, 1200);
  };

  // Export Import Validation Issues as CSV
  const downloadValidationReportCsv = (req: ImportRequest) => {
    if (!req.validationIssues || req.validationIssues.length === 0) return;
    const headers = ['Row', 'Field', 'Value', 'Severity', 'Message'];
    const rows = req.validationIssues.map(i => [
      i.row,
      `"${(i.field || '').replace(/"/g, '""')}"`,
      `"${String(i.value ?? '').replace(/"/g, '""')}"`,
      i.severity,
      `"${(i.message || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error_report_${req.batchId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 backdrop-blur p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Admin Approval Centre & Verification Hub</span>
              {(pendingDeleteCount > 0 || pendingImportCount > 0) && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono">
                  {pendingDeleteCount + pendingImportCount} Pending
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Four-eyes governance, deletion approvals, bulk import idempotent authorization, and operational workflows.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-slate-300">
            Signer: <span className="text-amber-400">{currentUser || 'Administrator'}</span> ({currentRole})
          </span>
        </div>
      </div>

      {/* 2. Primary Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
        <button
          onClick={() => { setActiveTab('DELETE'); setSearchQuery(''); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'DELETE' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Requests</span>
          {pendingDeleteCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-200 border border-rose-400 text-[10px]">
              {pendingDeleteCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('IMPORT'); setSearchQuery(''); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'IMPORT' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Bulk Import Batches</span>
          {pendingImportCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-200 border border-indigo-400 text-[10px]">
              {pendingImportCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('OPERATIONAL'); setSearchQuery(''); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'OPERATIONAL' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Operational Queues</span>
          {(pendingAttendanceCount + pendingLeaveCount + pendingOtCount + pendingPayrollCount) > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-200 border border-amber-400 text-[10px]">
              {pendingAttendanceCount + pendingLeaveCount + pendingOtCount + pendingPayrollCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('RULES'); setSearchQuery(''); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'RULES' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Approval Rules Matrix</span>
        </button>

        <button
          onClick={() => { setActiveTab('AUDIT'); setSearchQuery(''); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'AUDIT' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Log Trail</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB A: Delete Requests */}
      {activeTab === 'DELETE' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search delete requests..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              <select
                value={deleteFilterStatus}
                onChange={e => setDeleteFilterStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Statuses ({deleteRequests.length})</option>
                <option value="SUBMITTED">Pending Review ({pendingDeleteCount})</option>
                <option value="EXECUTED">Executed ({deleteRequests.filter(r => r.status === 'EXECUTED').length})</option>
                <option value="REJECTED">Rejected ({deleteRequests.filter(r => r.status === 'REJECTED').length})</option>
              </select>
            </div>

            <div className="text-[11px] text-slate-400">
              Showing <span className="font-bold text-slate-200">{filteredDeleteRequests.length}</span> requests
            </div>
          </div>

          {/* Delete Requests Table */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                    <th className="p-3 font-semibold">Request ID</th>
                    <th className="p-3 font-semibold">Module & Record</th>
                    <th className="p-3 font-semibold">Requested By</th>
                    <th className="p-3 font-semibold">Reason</th>
                    <th className="p-3 font-semibold">Dependencies</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredDeleteRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500 italic">
                        No deletion requests found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredDeleteRequests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-rose-300">
                          {req.deleteRequestId}
                        </td>
                        <td className="p-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 mr-1.5">
                            {req.module}
                          </span>
                          <span className="font-bold text-slate-100">{req.recordTitle}</span>
                          <span className="block text-[10px] text-slate-500 font-mono">ID: {req.recordId}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-200 block">{req.requestedBy.userName}</span>
                          <span className="text-[10px] text-slate-500">{new Date(req.requestedAt).toLocaleDateString()}</span>
                        </td>
                        <td className="p-3 max-w-xs">
                          <p className="text-slate-300 truncate" title={req.reason}>
                            {req.reason}
                          </p>
                          <span className="text-[10px] text-slate-500 font-mono">{req.justificationType}</span>
                        </td>
                        <td className="p-3">
                          {req.dependencyAnalysis.totalDependencies > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono font-bold">
                              {req.dependencyAnalysis.totalDependencies} linked
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono">
                              0 (Clean)
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              req.status === 'SUBMITTED'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : req.status === 'EXECUTED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : req.status === 'REJECTED'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedDeleteReq(req);
                              setAdminComment('');
                              setSecurityPin('');
                              setPinError(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center gap-1 ml-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB B: Bulk Import Requests */}
      {activeTab === 'IMPORT' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search bulk import batches..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={importFilterStatus}
                onChange={e => setImportFilterStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Batches ({importRequests.length})</option>
                <option value="SUBMITTED">Pending Approval ({pendingImportCount})</option>
                <option value="EXECUTED">Executed ({importRequests.filter(r => r.status === 'EXECUTED').length})</option>
                <option value="REJECTED">Rejected ({importRequests.filter(r => r.status === 'REJECTED').length})</option>
              </select>
            </div>

            <div className="text-[11px] text-slate-400">
              Showing <span className="font-bold text-slate-200">{filteredImportRequests.length}</span> batches
            </div>
          </div>

          {/* Import Requests Table */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                    <th className="p-3 font-semibold">Batch ID</th>
                    <th className="p-3 font-semibold">Directory & File</th>
                    <th className="p-3 font-semibold">Requested By</th>
                    <th className="p-3 font-semibold">Row Statistics</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredImportRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500 italic">
                        No bulk import requests logged.
                      </td>
                    </tr>
                  ) : (
                    filteredImportRequests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-indigo-300">
                          {req.batchId}
                        </td>
                        <td className="p-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 mr-1.5">
                            {req.directoryType}
                          </span>
                          <span className="font-bold text-slate-100">{req.fileName}</span>
                          <span className="block text-[10px] text-slate-500">{req.importRequestId}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-200 block">{req.requestedBy.userName}</span>
                          <span className="text-[10px] text-slate-500">{new Date(req.requestedAt).toLocaleDateString()}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 text-[11px] font-mono">
                            <span className="text-emerald-400 font-bold">{req.validRows} valid</span>
                            {req.duplicateRows > 0 && <span className="text-amber-400 font-bold">{req.duplicateRows} dups</span>}
                            {req.errorRows > 0 && <span className="text-rose-400 font-bold">{req.errorRows} errs</span>}
                            <span className="text-slate-500">/ {req.totalRows} total</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              req.status === 'SUBMITTED'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : req.status === 'EXECUTED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : req.status === 'REJECTED'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedImportReq(req);
                              setAdminComment('');
                              setPinError(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center gap-1 ml-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview & Review</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB C: Operational Queues */}
      {activeTab === 'OPERATIONAL' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Attendance Corrections ({pendingAttendanceCount} Pending)</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Missed punch-in and geofence correction requests submitted by site supervisors and staff.
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
              {correctionRequests.length === 0 ? (
                <p className="text-slate-500 italic py-4 text-center">No correction requests pending.</p>
              ) : (
                correctionRequests.map(c => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-blue-300">{c.correctionId}</span>
                      <span className="block text-[11px] text-slate-400">Employee: {c.employeeId} ({c.reason})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      {c.finalStatus}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Leave Approvals ({pendingLeaveCount} Pending)</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Multi-tier leave requests requiring supervisor and HR sign-offs.
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
              {leaveRequests.length === 0 ? (
                <p className="text-slate-500 italic py-4 text-center">No leave requests logged.</p>
              ) : (
                leaveRequests.map(l => (
                  <div key={l.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-indigo-300">{l.leaveRequestId}</span>
                      <span className="block text-[11px] text-slate-400">{l.leaveTypeId} • {l.workingDays} days ({l.startDate})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      {l.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB D: Rules Matrix */}
      {activeTab === 'RULES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Approval Governance & Deletion Control Rules</h3>
              <p className="text-xs text-slate-400">
                Configure which master directories require four-eyes sign-offs, security PINs, and mandatory justification length.
              </p>
            </div>
            <button
              onClick={resetApprovalRules}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvalRules.map(rule => (
              <div key={rule.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-100 text-xs">{rule.moduleLabel}</h4>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-400 border border-slate-800">
                    {rule.category}
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">Requires Delete Approval</span>
                    <input
                      type="checkbox"
                      checked={rule.requiresDeleteApproval}
                      onChange={e => updateApprovalRule(rule.id, { requiresDeleteApproval: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">Requires Security PIN</span>
                    <input
                      type="checkbox"
                      checked={rule.requiresSecurityPinForDelete}
                      onChange={e => updateApprovalRule(rule.id, { requiresSecurityPinForDelete: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">Requires Import Sign-off</span>
                    <input
                      type="checkbox"
                      checked={rule.requiresImportApproval}
                      onChange={e => updateApprovalRule(rule.id, { requiresImportApproval: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
                    />
                  </label>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-400 text-[11px]">Min Justification Chars</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={rule.minJustificationLength}
                      onChange={e => updateApprovalRule(rule.id, { minJustificationLength: parseInt(e.target.value) || 0 })}
                      className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-right font-mono text-slate-200"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB E: Audit Log View */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-4">
          <AuditLogView />
        </div>
      )}

      {/* MODAL 1: Delete Request Inspection & Sign-off */}
      {selectedDeleteReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden my-8">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Review Delete Request: {selectedDeleteReq.deleteRequestId}</h3>
                  <span className="text-[11px] text-slate-400">{selectedDeleteReq.recordType} • {selectedDeleteReq.recordTitle}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDeleteReq(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Request Info Card */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Requested By</span>
                    <span className="font-bold text-slate-200">{selectedDeleteReq.requestedBy.userName} ({selectedDeleteReq.requestedBy.userRole})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Date & Time</span>
                    <span className="font-mono text-slate-300">{new Date(selectedDeleteReq.requestedAt).toLocaleString()}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Justification Reason</span>
                  <p className="text-slate-300 p-2 rounded bg-slate-900 border border-slate-800 mt-0.5">
                    {selectedDeleteReq.reason}
                  </p>
                </div>
              </div>

              {/* Dependency Breakdown */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Referential Dependency Analysis</span>
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">
                    {selectedDeleteReq.dependencyAnalysis.totalDependencies} Linked Items
                  </span>
                </div>

                {selectedDeleteReq.dependencyAnalysis.totalDependencies > 0 ? (
                  <div className="space-y-1.5">
                    {selectedDeleteReq.dependencyAnalysis.breakdown.map((b, idx) => (
                      <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                        <span className="text-slate-300">{b.category}</span>
                        <span className="font-mono font-bold text-amber-300">{b.count} records</span>
                      </div>
                    ))}
                    <p className="text-[11px] text-amber-400 pt-1">
                      ⚠️ Soft-Deactivation or Archiving is recommended to preserve ledger history.
                    </p>
                  </div>
                ) : (
                  <p className="text-emerald-400">Zero dependent records. Safe to permanently hard delete.</p>
                )}
              </div>

              {/* Action Form if still pending */}
              {selectedDeleteReq.status === 'SUBMITTED' ? (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Execution Action</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setReviewAction('HARD_DELETE')}
                        className={`p-2 rounded-lg text-xs font-bold border transition-all ${
                          reviewAction === 'HARD_DELETE'
                            ? 'bg-rose-950 border-rose-600 text-rose-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        Hard Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewAction('DEACTIVATE')}
                        className={`p-2 rounded-lg text-xs font-bold border transition-all ${
                          reviewAction === 'DEACTIVATE'
                            ? 'bg-amber-950 border-amber-600 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        Deactivate
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewAction('ARCHIVE')}
                        className={`p-2 rounded-lg text-xs font-bold border transition-all ${
                          reviewAction === 'ARCHIVE'
                            ? 'bg-blue-950 border-blue-600 text-blue-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        Archive
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Admin Comment</label>
                    <input
                      type="text"
                      value={adminComment}
                      onChange={e => setAdminComment(e.target.value)}
                      placeholder="Enter verification notes..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                    />
                  </div>

                  {reviewAction === 'HARD_DELETE' && (
                    <div>
                      <label className="block text-xs font-bold text-rose-300 mb-1 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Admin Security Key / PIN Verification *</span>
                      </label>
                      <input
                        type="password"
                        value={securityPin}
                        onChange={e => setSecurityPin(e.target.value)}
                        placeholder="Enter master security key..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
                      />
                    </div>
                  )}

                  {pinError && (
                    <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                      {pinError}
                    </div>
                  )}

                  {actionSuccessMsg && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs">
                      {actionSuccessMsg}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleRejectDelete(selectedDeleteReq)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold text-xs"
                    >
                      Reject Request
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleExecuteDeleteReview(selectedDeleteReq, reviewAction)}
                      className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Authorize & Execute {reviewAction.replace('_', ' ')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 space-y-1">
                  <span className="font-bold text-slate-300 block">Status: {selectedDeleteReq.status}</span>
                  {selectedDeleteReq.reviewedBy && (
                    <span>Reviewed by {selectedDeleteReq.reviewedBy.userName} on {new Date(selectedDeleteReq.reviewedAt || '').toLocaleString()}</span>
                  )}
                  {selectedDeleteReq.adminComment && (
                    <p className="text-slate-300 text-[11px] mt-1">"{selectedDeleteReq.adminComment}"</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Bulk Import Batch Inspection & Execution */}
      {selectedImportReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden my-8">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Bulk Import Batch: {selectedImportReq.batchId}</h3>
                  <span className="text-[11px] text-slate-400">{selectedImportReq.directoryType} • {selectedImportReq.fileName}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedImportReq(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Row Stats */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Total Rows</span>
                  <span className="text-sm font-mono font-bold text-slate-200">{selectedImportReq.totalRows}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-emerald-400 block">Valid Rows</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">{selectedImportReq.validRows}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-amber-400 block">Duplicates</span>
                  <span className="text-sm font-mono font-bold text-amber-400">{selectedImportReq.duplicateRows}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-rose-400 block">Errors</span>
                  <span className="text-sm font-mono font-bold text-rose-400">{selectedImportReq.errorRows}</span>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Data Rows Preview (First 5 Rows)</span>
                  {selectedImportReq.validationIssues && selectedImportReq.validationIssues.length > 0 && (
                    <button
                      onClick={() => downloadValidationReportCsv(selectedImportReq)}
                      className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 text-[11px]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Issues CSV ({selectedImportReq.validationIssues.length})</span>
                    </button>
                  )}
                </div>

                <div className="max-h-48 overflow-x-auto overflow-y-auto rounded-xl bg-slate-950 border border-slate-800 p-2">
                  <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap">
                    {JSON.stringify(selectedImportReq.dataPayload.slice(0, 5), null, 2)}
                  </pre>
                </div>
              </div>

              {/* Review & Execute Form */}
              {selectedImportReq.status === 'SUBMITTED' ? (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Admin Verification Comment</label>
                    <input
                      type="text"
                      value={adminComment}
                      onChange={e => setAdminComment(e.target.value)}
                      placeholder="Notes for import execution..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                    />
                  </div>

                  {pinError && (
                    <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                      {pinError}
                    </div>
                  )}

                  {actionSuccessMsg && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs">
                      {actionSuccessMsg}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleRejectImport(selectedImportReq)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold text-xs"
                    >
                      Reject Batch
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing || selectedImportReq.validRows === 0}
                      onClick={() => handleExecuteImportReview(selectedImportReq)}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Execute Import ({selectedImportReq.validRows} Records)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 space-y-1">
                  <span className="font-bold text-slate-300 block">Status: {selectedImportReq.status}</span>
                  {selectedImportReq.executedBy && (
                    <span>Executed by {selectedImportReq.executedBy.userName} on {new Date(selectedImportReq.executedAt || '').toLocaleString()}</span>
                  )}
                  {selectedImportReq.executionSummary && (
                    <p className="text-emerald-400 text-[11px] mt-1">{selectedImportReq.executionSummary}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
