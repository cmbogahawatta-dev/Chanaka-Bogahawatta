import React, { useState } from 'react';
import {
  Clock,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Camera,
  Calendar,
  Radio,
  FileCheck2,
  X,
  Eye,
  ShieldCheck,
  Building2,
  RotateCcw
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { useStaff } from '../../context/StaffContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { AttendanceRecord, AttendanceStatus } from '../../types/attendanceTypes';

export const AttendanceManagementView: React.FC = () => {
  const {
    attendanceRecords,
    correctionRequests,
    addManualAttendance,
    requestCorrection,
    approveCorrection,
    rejectCorrection,
    approveAttendanceBySupervisor,
    approveAttendanceByHr
  } = useAttendance();

  const { staffMembers } = useStaff();
  const { projects } = usePettyCash();
  const { currentRole } = useEnterprise();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('2026-08');

  // Sub-tabs: Punch Register vs Correction Requests
  const [subTab, setSubTab] = useState<'REGISTER' | 'CORRECTIONS'>('REGISTER');

  // Modal States
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [targetAttendanceForCorrection, setTargetAttendanceForCorrection] = useState<AttendanceRecord | null>(null);

  // Manual Attendance Form State
  const [manualForm, setManualForm] = useState({
    employeeId: '',
    projectId: 'PIDM 26',
    date: new Date().toISOString().slice(0, 10),
    punchIn: '08:00',
    punchOut: '17:00',
    status: 'Present' as AttendanceStatus,
    remarks: ''
  });

  // Correction Form State
  const [corrForm, setCorrForm] = useState({
    punchIn: '08:00',
    punchOut: '17:00',
    status: 'Present' as AttendanceStatus,
    reason: '',
    attachmentUrl: ''
  });

  const isSupervisorOrAbove =
    currentRole === 'ADMIN' ||
    currentRole === 'HR' ||
    currentRole === 'OWNER' ||
    currentRole === 'PROJECT_MANAGER' ||
    currentRole === 'SUPERVISOR';

  // Filtered Punch Records
  const displayRecords = attendanceRecords.filter(rec => {
    const emp = staffMembers.find(s => s.id === rec.employeeId);
    const empName = emp ? emp.fullName.toLowerCase() : '';
    const empCode = emp ? emp.employeeCode.toLowerCase() : '';

    if (searchQuery && !empName.includes(searchQuery.toLowerCase()) && !empCode.includes(searchQuery.toLowerCase()) && !rec.attendanceId.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedProject !== 'ALL' && rec.projectId !== selectedProject) return false;
    if (selectedStatus !== 'ALL' && rec.status !== selectedStatus) return false;
    if (selectedSource !== 'ALL' && rec.recordSource !== selectedSource) return false;
    if (selectedMonth && !rec.date.startsWith(selectedMonth)) return false;
    return true;
  });

  // Summary Metrics for the active month
  const monthRecords = attendanceRecords.filter(r => r.date.startsWith(selectedMonth));
  const presentCount = monthRecords.filter(r => r.status === 'Present').length;
  const lateCount = monthRecords.filter(r => r.status === 'Late').length;
  const totalOtHours = monthRecords.reduce((sum, r) => sum + (r.otHours || 0), 0);
  const pendingCorrectionsCount = correctionRequests.filter(c => c.finalStatus === 'PENDING').length;

  const handleOpenManualModal = () => {
    setManualForm({
      employeeId: staffMembers[0]?.id || '',
      projectId: 'PIDM 26',
      date: new Date().toISOString().slice(0, 10),
      punchIn: '08:00',
      punchOut: '17:00',
      status: 'Present',
      remarks: 'Manual entry by site supervisor'
    });
    setIsManualModalOpen(true);
  };

  const handleSaveManualAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.employeeId) return;

    addManualAttendance({
      employeeId: manualForm.employeeId,
      projectId: manualForm.projectId,
      date: manualForm.date,
      punchIn: `${manualForm.punchIn}:00`,
      punchOut: `${manualForm.punchOut}:00`,
      status: manualForm.status,
      enteredBy: 'SUPERVISOR_USER',
      remarks: manualForm.remarks
    });

    setIsManualModalOpen(false);
  };

  const handleOpenCorrectionModal = (rec: AttendanceRecord) => {
    setTargetAttendanceForCorrection(rec);
    setCorrForm({
      punchIn: rec.punchIn ? rec.punchIn.slice(0, 5) : '08:00',
      punchOut: rec.punchOut ? rec.punchOut.slice(0, 5) : '17:00',
      status: rec.status,
      reason: 'Biometric punch missed due to site network connectivity',
      attachmentUrl: ''
    });
    setIsCorrectionModalOpen(true);
  };

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAttendanceForCorrection) return;

    requestCorrection(
      targetAttendanceForCorrection.id,
      targetAttendanceForCorrection.employeeId,
      {
        punchIn: `${corrForm.punchIn}:00`,
        punchOut: `${corrForm.punchOut}:00`,
        status: corrForm.status
      },
      corrForm.reason,
      corrForm.attachmentUrl
    );

    setIsCorrectionModalOpen(false);
    setTargetAttendanceForCorrection(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Time & Daily Attendance Register</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Biometric Jibble logs, site geofence verifications, manual supervisor entries, and missed-punch corrections.
          </p>
        </div>

        {isSupervisorOrAbove && (
          <button
            onClick={handleOpenManualModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Manual Attendance Entry
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Present Punches</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{presentCount}</div>
          <span className="text-[10px] text-slate-500">Period: {selectedMonth}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Late Arrivals</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">{lateCount}</div>
          <span className="text-[10px] text-slate-500">After 08:30 AM grace</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Overtime Logged</span>
          <div className="text-2xl font-bold text-purple-400 mt-1">{totalOtHours}h</div>
          <span className="text-[10px] text-slate-500">Auto-calculated</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Pending Corrections</span>
          <div className="text-2xl font-bold text-rose-400 mt-1">{pendingCorrectionsCount}</div>
          <span className="text-[10px] text-slate-500">Requires review</span>
        </div>
      </div>

      {/* View Switcher Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setSubTab('REGISTER')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            subTab === 'REGISTER'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Daily Punch Register ({displayRecords.length})
        </button>
        <button
          onClick={() => setSubTab('CORRECTIONS')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            subTab === 'CORRECTIONS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Missed-Punch & Geofence Corrections ({correctionRequests.length})
        </button>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee, punch ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
        />

        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
        >
          <option value="ALL">All Projects</option>
          {projects.map(p => (
            <option key={p.code} value={p.code}>{p.code}</option>
          ))}
          <option value="HEAD_OFFICE">HEAD_OFFICE</option>
        </select>

        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
        >
          <option value="ALL">All Sources</option>
          <option value="JIBBLE">Jibble Biometric</option>
          <option value="MANUAL">Manual Supervisor Entry</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
        >
          <option value="ALL">All Attendance Statuses</option>
          <option value="Present">Present</option>
          <option value="Late">Late Arrival</option>
          <option value="Half Day">Half Day</option>
          <option value="Absent">Absent</option>
        </select>
      </div>

      {/* SUB-TAB 1: DAILY PUNCH REGISTER */}
      {subTab === 'REGISTER' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Punch ID & Date</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">In / Out Time</th>
                  <th className="px-4 py-3">Hours & OT</th>
                  <th className="px-4 py-3">Evidence & GPS</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Approval</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {displayRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500 text-sm">
                      No attendance records found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  displayRecords.map(rec => {
                    const emp = staffMembers.find(s => s.id === rec.employeeId);

                    return (
                      <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono">
                          <div className="font-bold text-blue-400">{rec.attendanceId}</div>
                          <div className="text-[11px] text-slate-400">{rec.date}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-100">{emp ? emp.fullName : rec.employeeId}</div>
                          <div className="text-[11px] text-slate-400">{emp?.employeeCode} • {rec.projectId}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px]">
                          <div className="text-emerald-400">In: {rec.punchIn || '--:--'}</div>
                          <div className="text-rose-400">Out: {rec.punchOut || '--:--'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-200">{rec.workingHours || 0} hrs total</div>
                          {rec.otHours && rec.otHours > 0 ? (
                            <div className="text-[11px] text-purple-400 font-semibold font-mono">
                              +{rec.otHours}h OT
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] border ${
                              rec.geofenceStatus === 'INSIDE'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : rec.geofenceStatus === 'OUTSIDE'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {rec.geofenceStatus}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                              {rec.recordSource}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rec.status === 'Present'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : rec.status === 'Late'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px]">
                          <div className="text-slate-300">
                            Sup: <span className={rec.supervisorApproval === 'APPROVED' ? 'text-emerald-400' : 'text-amber-400'}>{rec.supervisorApproval || 'PENDING'}</span>
                          </div>
                          <div className="text-slate-400">
                            HR: <span className={rec.hrApproval === 'APPROVED' ? 'text-emerald-400' : 'text-amber-400'}>{rec.hrApproval || 'PENDING'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleOpenCorrectionModal(rec)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors"
                          >
                            Correct Punch
                          </button>
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

      {/* SUB-TAB 2: ATTENDANCE CORRECTIONS */}
      {subTab === 'CORRECTIONS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Correction ID</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Original Punch</th>
                  <th className="px-4 py-3">Requested Correction</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Approvals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {correctionRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">
                      No correction requests currently pending.
                    </td>
                  </tr>
                ) : (
                  correctionRequests.map(c => {
                    const emp = staffMembers.find(s => s.id === c.employeeId);

                    return (
                      <tr key={c.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono font-bold text-blue-400">{c.correctionId}</td>
                        <td className="px-4 py-3 font-semibold text-slate-100">{emp?.fullName || c.employeeId}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                          {c.originalValue?.punchIn || '--'} - {c.originalValue?.punchOut || '--'}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-emerald-400">
                          {c.requestedValue?.punchIn || '--'} - {c.requestedValue?.punchOut || '--'}
                        </td>
                        <td className="px-4 py-3 text-slate-300 max-w-xs">{c.reason}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.finalStatus === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : c.finalStatus === 'REJECTED'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {c.finalStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {c.finalStatus === 'PENDING' && isSupervisorOrAbove && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => approveCorrection(c.id, 'SUPERVISOR', 'SUPERVISOR_USER', 'Approved on site log')}
                                className="px-2 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/40 rounded text-[11px]"
                              >
                                Sup Appr
                              </button>
                              <button
                                onClick={() => approveCorrection(c.id, 'HR', 'HR_OFFICER', 'Verified with site resident')}
                                className="px-2 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/40 rounded text-[11px]"
                              >
                                HR Appr
                              </button>
                              <button
                                onClick={() => rejectCorrection(c.id, 'HR', 'HR_OFFICER', 'Invalid punch rationale')}
                                className="px-2 py-1 bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/40 rounded text-[11px]"
                              >
                                Reject
                              </button>
                            </div>
                          )}
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

      {/* Modal: Manual Attendance Entry */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-slate-100">Manual Attendance Entry</h3>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualAttendance} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Employee *</label>
                <select
                  value={manualForm.employeeId}
                  onChange={(e) => setManualForm({ ...manualForm, employeeId: e.target.value })}
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
                  <label className="block text-slate-300 font-semibold mb-1">Project Code *</label>
                  <select
                    value={manualForm.projectId}
                    onChange={(e) => setManualForm({ ...manualForm, projectId: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  >
                    {projects.map(p => (
                      <option key={p.code} value={p.code}>{p.code}</option>
                    ))}
                    <option value="HEAD_OFFICE">HEAD_OFFICE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Attendance Date *</label>
                  <input
                    type="date"
                    value={manualForm.date}
                    onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Punch In Time *</label>
                  <input
                    type="time"
                    value={manualForm.punchIn}
                    onChange={(e) => setManualForm({ ...manualForm, punchIn: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Punch Out Time *</label>
                  <input
                    type="time"
                    value={manualForm.punchOut}
                    onChange={(e) => setManualForm({ ...manualForm, punchOut: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Supervisor Justification / Remarks *</label>
                <textarea
                  rows={2}
                  value={manualForm.remarks}
                  onChange={(e) => setManualForm({ ...manualForm, remarks: e.target.value })}
                  placeholder="Reason for manual logging instead of biometric punch..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Manual Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Punch Correction Request */}
      {isCorrectionModalOpen && targetAttendanceForCorrection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100">Submit Attendance Correction</h3>
              </div>
              <button
                onClick={() => setIsCorrectionModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCorrection} className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-slate-800/60 rounded-lg text-slate-300 space-y-1">
                <div><strong>Original Punch ID:</strong> {targetAttendanceForCorrection.attendanceId}</div>
                <div><strong>Date:</strong> {targetAttendanceForCorrection.date}</div>
                <div><strong>Recorded Punches:</strong> {targetAttendanceForCorrection.punchIn || '--:--'} to {targetAttendanceForCorrection.punchOut || '--:--'}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Corrected Punch In *</label>
                  <input
                    type="time"
                    value={corrForm.punchIn}
                    onChange={(e) => setCorrForm({ ...corrForm, punchIn: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Corrected Punch Out *</label>
                  <input
                    type="time"
                    value={corrForm.punchOut}
                    onChange={(e) => setCorrForm({ ...corrForm, punchOut: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Correction Reason / Justification *</label>
                <textarea
                  rows={3}
                  value={corrForm.reason}
                  onChange={(e) => setCorrForm({ ...corrForm, reason: e.target.value })}
                  placeholder="Explain why the biometric punch was missed or outside geofence..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCorrectionModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-sm"
                >
                  Submit Correction Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
