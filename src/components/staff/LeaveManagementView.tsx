import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  UserX,
  FileText,
  ShieldCheck,
  X,
  ArrowRight,
  Eye,
  Layers
} from 'lucide-react';
import { useLeave } from '../../context/LeaveContext';
import { useStaff } from '../../context/StaffContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { LeaveRequest, LeaveType, LeaveStatus } from '../../types/leaveTypes';
import { AdminClearHistoryButton } from '../common/AdminClearHistoryButton';

export const LeaveManagementView: React.FC = () => {
  const {
    leaveRequests,
    leaveTypes,
    coverUpRequests,
    submitLeaveRequest,
    respondCoverUp,
    processApprovalStep,
    withdrawLeaveRequest,
    clearLeaveHistory,
    getLeaveBalances,
    getLeaveType
  } = useLeave();

  const { staffMembers } = useStaff();
  const { currentRole } = useEnterprise();

  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'BALANCES' | 'MY_COVER_UPS'>('REQUESTS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedLeaveType, setSelectedLeaveType] = useState('ALL');

  // Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedRequestDetail, setSelectedRequestDetail] = useState<LeaveRequest | null>(null);

  // Apply Form
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    workingDays: 1,
    reason: '',
    nominatedCoverUpId: '',
    attachmentUrl: ''
  });

  const isSupervisorOrAbove =
    currentRole === 'ADMIN' ||
    currentRole === 'HR' ||
    currentRole === 'OWNER' ||
    currentRole === 'PROJECT_MANAGER' ||
    currentRole === 'SUPERVISOR';

  // Filter requests
  const displayRequests = leaveRequests.filter(req => {
    const emp = staffMembers.find(s => s.id === req.employeeId);
    const empName = emp ? emp.fullName.toLowerCase() : '';
    const empCode = emp ? emp.employeeCode.toLowerCase() : '';

    if (
      searchQuery &&
      !empName.includes(searchQuery.toLowerCase()) &&
      !empCode.includes(searchQuery.toLowerCase()) &&
      !req.leaveRequestId.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (selectedStatus !== 'ALL' && req.status !== selectedStatus) return false;
    if (selectedLeaveType !== 'ALL' && req.leaveTypeId !== selectedLeaveType) return false;
    return true;
  });

  const handleOpenApplyModal = () => {
    const defaultEmp = staffMembers[0];
    const defaultCover = staffMembers.find(s => s.id !== defaultEmp?.id);
    const defaultType = leaveTypes[0];
    setFormData({
      employeeId: defaultEmp?.id || '',
      leaveTypeId: defaultType?.id || '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      workingDays: 1,
      reason: 'Personal family matter',
      nominatedCoverUpId: defaultCover?.id || '',
      attachmentUrl: ''
    });
    setIsApplyModalOpen(true);
  };

  const handleSaveLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.leaveTypeId) return;

    submitLeaveRequest({
      employeeId: formData.employeeId,
      leaveTypeId: formData.leaveTypeId,
      startDate: formData.startDate,
      endDate: formData.endDate,
      workingDays: Number(formData.workingDays),
      reason: formData.reason,
      nominatedCoverUpId: formData.nominatedCoverUpId || undefined,
      attachmentUrl: formData.attachmentUrl || undefined
    });

    setIsApplyModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Leave Management & Approvals</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic stepped approvals, mandatory cover-up acceptance, entitlement tracking, and medical records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <AdminClearHistoryButton
            id="btn-admin-clear-leave-view"
            moduleName="Leave Applications & Approvals"
            itemCount={leaveRequests.length + coverUpRequests.length}
            itemDescription="leave requests, cover-up nominations, and approval audit logs"
            preservedItemsDescription="Configured leave types, entitlement structures, and staff accounts remain intact."
            onClear={clearLeaveHistory}
          />

          <button
            onClick={handleOpenApplyModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Apply for Leave
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('REQUESTS')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'REQUESTS'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Leave Applications ({leaveRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('BALANCES')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'BALANCES'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Leave Balances & Entitlements ({staffMembers.length})
        </button>
      </div>

      {/* Filter Controls */}
      {activeTab === 'REQUESTS' && (
        <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search applicant, leave ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
            />
          </div>

          <select
            value={selectedLeaveType}
            onChange={(e) => setSelectedLeaveType(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Leave Types</option>
            {leaveTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="COVER_UP_PENDING">Pending Cover-Up</option>
            <option value="SUPERVISOR_PENDING">Pending Supervisor Approval</option>
            <option value="MANAGER_PENDING">Pending PM Approval</option>
            <option value="HR_PENDING">Pending HR Endorsement</option>
            <option value="APPROVED">Fully Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      )}

      {/* TAB 1: LEAVE REQUESTS */}
      {activeTab === 'REQUESTS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Leave ID</th>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Type & Period</th>
                  <th className="px-4 py-3">Cover-Up Person</th>
                  <th className="px-4 py-3">Approval Trail</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {displayRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">
                      No leave applications found.
                    </td>
                  </tr>
                ) : (
                  displayRequests.map(req => {
                    const emp = staffMembers.find(s => s.id === req.employeeId);
                    const lt = getLeaveType(req.leaveTypeId) || leaveTypes.find(t => t.id === req.leaveTypeId);
                    const coverReq = coverUpRequests.find(c => c.leaveRequestId === req.id || c.id === req.coverUpRequestId);
                    const coverStaff = coverReq ? staffMembers.find(s => s.id === coverReq.nominatedEmployeeId) : null;

                    return (
                      <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-400">
                          {req.leaveRequestId}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-100">{emp ? emp.fullName : req.employeeId}</div>
                          <div className="text-[11px] text-slate-400">{emp?.employeeCode} • {emp?.department}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold text-[11px]">
                            {lt?.name || req.leaveTypeName || 'Leave'} ({req.workingDays}d)
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {req.startDate} {req.startDate !== req.endDate ? `→ ${req.endDate}` : ''}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {coverStaff ? (
                            <div>
                              <div className="text-slate-200">{coverStaff.fullName}</div>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                coverReq?.status === 'ACCEPTED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : coverReq?.status === 'REJECTED'
                                  ? 'bg-rose-500/10 text-rose-400'
                                  : 'bg-amber-500/10 text-amber-400'
                              }`}>
                                {coverReq?.status || req.coverUpStatus || 'PENDING'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500">None assigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {req.approvalTrail?.map((step, i) => (
                              <span
                                key={i}
                                title={`${step.title || step.levelType}: ${step.decision}`}
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  step.decision === 'APPROVED'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : step.decision === 'REJECTED'
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                                }`}
                              >
                                {step.title ? step.title.charAt(0) : step.levelType.charAt(0)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : req.status === 'REJECTED'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Section 19: Cover up acceptance action */}
                            {req.status === 'COVER_UP_PENDING' && coverReq && (
                              <button
                                onClick={() => respondCoverUp(coverReq.id, 'ACCEPTED', 'Handover accepted')}
                                className="px-2 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/40 rounded text-[11px]"
                              >
                                Accept Cover-Up
                              </button>
                            )}

                            {/* Stepped Approvals */}
                            {req.status.includes('PENDING') && req.status !== 'COVER_UP_PENDING' && (
                              <>
                                <button
                                  onClick={() => {
                                    processApprovalStep(req.id, 'APPROVED', 'APPROVER_USER', 'Approved in sequence');
                                  }}
                                  className="px-2 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/40 rounded text-[11px]"
                                >
                                  Approve Step
                                </button>
                                <button
                                  onClick={() => processApprovalStep(req.id, 'REJECTED', 'APPROVER_USER', 'Manpower constraint on site')}
                                  className="px-2 py-1 bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/40 rounded text-[11px]"
                                >
                                  Reject
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
      )}

      {/* TAB 2: LEAVE BALANCES MATRIX */}
      {activeTab === 'BALANCES' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 font-bold text-slate-100 text-xs uppercase tracking-wider">
            Employee Statutory & Company Leave Balances (Calendar Year 2026)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  {leaveTypes.map(lt => (
                    <th key={lt.id} className="px-4 py-3">{lt.name} ({lt.annualEntitlementDays}d)</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {staffMembers.map(emp => {
                  const balances = getLeaveBalances(emp.id);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-100">{emp.fullName}</div>
                        <div className="text-[11px] text-slate-400">{emp.employeeCode} • {emp.designation}</div>
                      </td>
                      {leaveTypes.map(lt => {
                        const bal = balances.find(b => b.leaveTypeId === lt.id);
                        const available = bal ? bal.available : lt.annualEntitlementDays;
                        const entitlement = bal ? bal.entitlement : lt.annualEntitlementDays;
                        return (
                          <td key={lt.id} className="px-4 py-3">
                            <span className="font-bold text-emerald-400">{available}</span>
                            <span className="text-slate-500 text-[10px]"> / {entitlement}d</span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Apply Leave */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-slate-100">Submit Leave Application</h3>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLeave} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Applying Employee *</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  required
                >
                  <option value="">-- Choose Employee --</option>
                  {staffMembers.map(s => (
                    <option key={s.id} value={s.id}>{s.employeeCode} - {s.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Leave Type *</label>
                  <select
                    value={formData.leaveTypeId}
                    onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  >
                    {leaveTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duration (Working Days) *</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.workingDays}
                    onChange={(e) => setFormData({ ...formData, workingDays: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Date *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
                <label className="block text-slate-300 font-semibold mb-1">
                  Nominated Cover-Up Employee (Handover)
                </label>
                <select
                  value={formData.nominatedCoverUpId}
                  onChange={(e) => setFormData({ ...formData, nominatedCoverUpId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                >
                  <option value="">-- No Cover-Up Required --</option>
                  {staffMembers.filter(s => s.id !== formData.employeeId).map(s => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.designation})</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  The nominated colleague must confirm cover-up acceptance before supervisor approval unlocks.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reason / Purpose of Leave *</label>
                <textarea
                  rows={2}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
