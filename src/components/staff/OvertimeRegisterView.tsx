import React, { useState } from 'react';
import {
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  DollarSign,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { useStaff } from '../../context/StaffContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { OvertimeRecord } from '../../types/overtimeTypes';

export const OvertimeRegisterView: React.FC = () => {
  const {
    overtimeRecords,
    approveOvertimeBySupervisor,
    approveOvertimeByHr,
    rejectOvertime
  } = useAttendance();

  const { staffMembers } = useStaff();
  const { projects } = usePettyCash();
  const { currentRole } = useEnterprise();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const isSupervisorOrAbove =
    currentRole === 'ADMIN' ||
    currentRole === 'HR' ||
    currentRole === 'OWNER' ||
    currentRole === 'PROJECT_MANAGER' ||
    currentRole === 'SUPERVISOR';

  // Filter records
  const displayRecords = overtimeRecords.filter(ot => {
    const emp = staffMembers.find(s => s.id === ot.employeeId);
    const empName = emp ? emp.fullName.toLowerCase() : '';
    const empCode = emp ? emp.employeeCode.toLowerCase() : '';
    const otCode = (ot.otId || ot.id).toLowerCase();

    if (searchQuery && !empName.includes(searchQuery.toLowerCase()) && !empCode.includes(searchQuery.toLowerCase()) && !otCode.includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedProject !== 'ALL' && emp?.assignedProjectCode !== selectedProject) return false;
    if (selectedMonth && !ot.date.startsWith(selectedMonth)) return false;
    if (selectedStatus !== 'ALL' && ot.status !== selectedStatus) return false;
    return true;
  });

  const totalOtHours = displayRecords.reduce((sum, r) => sum + (r.hours || 0), 0);
  const pendingCount = displayRecords.filter(r => r.status === 'PENDING').length;
  const approvedCount = displayRecords.filter(r => r.status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Overtime Register & Multipliers</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Normal Day OT (1.5x) vs Poya/Holiday OT (2.0x), dual Supervisor + HR approval, and payroll integration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs">
            <span className="text-slate-400 mr-2">Total OT Hours:</span>
            <span className="font-bold text-amber-400">{totalOtHours.toFixed(1)} hrs</span>
          </div>
          <div className="px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs">
            <span className="text-slate-400 mr-2">Pending Dual-Signoff:</span>
            <span className="font-bold text-rose-400">{pendingCount}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Approved for Payroll</div>
          <div className="text-2xl font-bold text-emerald-400">{approvedCount} records</div>
          <div className="text-[11px] text-slate-500 mt-1">Dual supervisor & HR sign-off complete</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Standard Multipliers</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold">1.5x Normal Weekday</span>
            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold">2.0x Poya / Mercantile</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Formula: (Basic Salary / 200) × Hours × Multiplier</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Audit Trail</div>
          <div className="text-xs text-slate-300 font-semibold mt-1">Sri Lanka Shop & Office Statutory</div>
          <div className="text-[11px] text-slate-500 mt-1">Enforces dual signoff before batch payroll inclusion</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee name, code, OT ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
          />
        </div>

        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
        >
          <option value="ALL">All Project Sites</option>
          {projects.map(p => (
            <option key={p.id} value={p.project_code || p.id}>{p.name} ({p.project_code || p.id})</option>
          ))}
        </select>

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
        >
          <option value="2026-08">August 2026</option>
          <option value="2026-07">July 2026</option>
          <option value="2026-06">June 2026</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">OT Record ID</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Project / Site</th>
                <th className="px-4 py-3">Hours & Rate</th>
                <th className="px-4 py-3">Task / Justification</th>
                <th className="px-4 py-3">Supervisor Sign</th>
                <th className="px-4 py-3">HR Sign</th>
                <th className="px-4 py-3">Final Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500 text-sm">
                    No overtime records found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                displayRecords.map(ot => {
                  const emp = staffMembers.find(s => s.id === ot.employeeId);

                  return (
                    <tr key={ot.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono">
                        <div className="font-bold text-amber-400">{ot.otId || ot.id}</div>
                        <div className="text-[11px] text-slate-400">{ot.date}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-100">{emp ? emp.fullName : ot.employeeId}</div>
                        <div className="text-[11px] text-slate-400">{emp?.employeeCode} • {emp?.designation}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-200">{emp?.assignedProjectCode || 'Site Base'}</div>
                        <div className="text-[11px] text-slate-400">{ot.source}</div>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <div className="font-bold text-amber-300">{ot.hours} hrs claimed</div>
                        <div className="text-[11px] text-slate-400">Multiplier: {ot.multiplier}x</div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 max-w-xs">{ot.reason || 'Concrete casting / shift extended'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ot.supervisorApproval === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {ot.supervisorApproval}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ot.hrApproval === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {ot.hrApproval}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ot.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : ot.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {ot.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isSupervisorOrAbove && ot.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-1.5">
                            {ot.supervisorApproval === 'PENDING' && (
                              <button
                                onClick={() => approveOvertimeBySupervisor(ot.id, 'SUPERVISOR_USER', 'Approved by site supervisor')}
                                className="px-2 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/40 rounded text-[11px]"
                              >
                                Sup Appr
                              </button>
                            )}
                            {ot.supervisorApproval === 'APPROVED' && ot.hrApproval === 'PENDING' && (
                              <button
                                onClick={() => approveOvertimeByHr(ot.id, 'HR_OFFICER', ot.hours, 'Approved by HR officer')}
                                className="px-2 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/40 rounded text-[11px]"
                              >
                                HR Finalize
                              </button>
                            )}
                            <button
                              onClick={() => rejectOvertime(ot.id, 'SUPERVISOR', 'SUPERVISOR_USER', 'Unauthorized overtime')}
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
    </div>
  );
};
