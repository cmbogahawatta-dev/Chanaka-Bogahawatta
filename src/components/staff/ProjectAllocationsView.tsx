import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  UserCheck,
  Building2,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  History,
  X,
  Radio,
  MapPin,
  Camera
} from 'lucide-react';
import { useStaffAllocation } from '../../context/StaffAllocationContext';
import { useStaff } from '../../context/StaffContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { StaffAllocation } from '../../types/staffAllocationTypes';

export const ProjectAllocationsView: React.FC = () => {
  const { allocations, createAllocation, endAllocation, filterAllocations } = useStaffAllocation();
  const { staffMembers } = useStaff();
  const { projects } = usePettyCash();
  const { currentRole } = useEnterprise();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedEmployeeHistory, setSelectedEmployeeHistory] = useState<string | null>(null);

  // Modal State for New Allocation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    projectId: 'PIDM 26',
    site: 'PIDM 26 Main Road Yard',
    department: 'OPERATIONS',
    designation: 'Site Supervisor',
    effectiveFrom: new Date().toISOString().slice(0, 10),
    immediateSupervisorId: '',
    projectManagerId: '',
    departmentHeadId: '',
    hrResponsibleId: '',
    finalApproverId: '',
    attendanceRequired: true,
    jibbleAttendanceRequired: true,
    faceVerificationRequired: true,
    gpsRequired: true,
    geofenceRequired: true,
    remarks: ''
  });

  const isHRorAdmin = currentRole === 'ADMIN' || currentRole === 'HR' || currentRole === 'OWNER';

  // Filtered allocations
  const displayAllocations = allocations.filter(a => {
    const emp = staffMembers.find(s => s.id === a.employeeId);
    const empName = emp ? emp.fullName.toLowerCase() : '';
    const empCode = emp ? emp.employeeCode.toLowerCase() : '';

    if (searchQuery && !empName.includes(searchQuery.toLowerCase()) && !empCode.includes(searchQuery.toLowerCase()) && !a.allocationId.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedProject !== 'ALL' && a.projectId !== selectedProject) return false;
    if (selectedStatus !== 'ALL' && a.status !== selectedStatus) return false;
    return true;
  });

  const handleOpenNewModal = (preselectedEmpId?: string) => {
    const emp = preselectedEmpId ? staffMembers.find(s => s.id === preselectedEmpId) : staffMembers[0];
    const defaultPm = staffMembers.find(s => s.role === 'PROJECT_MANAGER');
    const defaultHr = staffMembers.find(s => s.role === 'HR_OFFICER');
    const defaultDirector = staffMembers.find(s => s.role === 'DIRECTOR');

    setFormData({
      employeeId: emp ? emp.id : '',
      projectId: emp?.assignedProjectCode || 'PIDM 26',
      site: `${emp?.assignedProjectCode || 'PIDM 26'} Main Site Yard`,
      department: emp?.department || 'OPERATIONS',
      designation: emp?.designation || 'Site Supervisor',
      effectiveFrom: new Date().toISOString().slice(0, 10),
      immediateSupervisorId: emp?.reportsToId || '',
      projectManagerId: defaultPm?.id || '',
      departmentHeadId: defaultPm?.id || '',
      hrResponsibleId: defaultHr?.id || '',
      finalApproverId: defaultDirector?.id || '',
      attendanceRequired: true,
      jibbleAttendanceRequired: true,
      faceVerificationRequired: true,
      gpsRequired: true,
      geofenceRequired: true,
      remarks: 'Project operational assignment'
    });
    setIsModalOpen(true);
  };

  const handleSaveAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) {
      alert('Please select an employee');
      return;
    }

    createAllocation({
      employeeId: formData.employeeId,
      projectId: formData.projectId,
      site: formData.site,
      department: formData.department,
      designation: formData.designation,
      effectiveFrom: formData.effectiveFrom,
      immediateSupervisorId: formData.immediateSupervisorId || undefined,
      projectManagerId: formData.projectManagerId || undefined,
      departmentHeadId: formData.departmentHeadId || undefined,
      hrResponsibleId: formData.hrResponsibleId || undefined,
      finalApproverId: formData.finalApproverId || undefined,
      attendanceRequired: formData.attendanceRequired,
      jibbleAttendanceRequired: formData.jibbleAttendanceRequired,
      faceVerificationRequired: formData.faceVerificationRequired,
      gpsRequired: formData.gpsRequired,
      geofenceRequired: formData.geofenceRequired,
      remarks: formData.remarks
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <FolderKanban className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Project Staff Allocations</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative project assignments, dynamic approval hierarchy (Supervisor, PM, HR), and site attendance constraints.
          </p>
        </div>

        {isHRorAdmin && (
          <button
            onClick={() => handleOpenNewModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            New Project Allocation
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee, allocation ID, designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="ALL">All Construction Projects</option>
          {projects.map(p => (
            <option key={p.code} value={p.code}>{p.code} - {p.name}</option>
          ))}
          <option value="HEAD_OFFICE">Head Office</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="Active">Active Currently</option>
          <option value="Superseded">Superseded History</option>
          <option value="Ended">Ended</option>
        </select>
      </div>

      {/* Allocations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Alloc ID</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Assigned Project & Site</th>
                <th className="px-4 py-3">Effective Period</th>
                <th className="px-4 py-3">Reporting Hierarchy</th>
                <th className="px-4 py-3">Attendance Controls</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {displayAllocations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500 text-sm">
                    No project allocations found matching the current filters.
                  </td>
                </tr>
              ) : (
                displayAllocations.map(alloc => {
                  const emp = staffMembers.find(s => s.id === alloc.employeeId);
                  const sup = staffMembers.find(s => s.id === alloc.immediateSupervisorId);
                  const pm = staffMembers.find(s => s.id === alloc.projectManagerId);

                  return (
                    <tr key={alloc.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-blue-400">
                        {alloc.allocationId}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-100">{emp ? emp.fullName : alloc.employeeId}</div>
                        <div className="text-[11px] text-slate-400">{emp?.employeeCode} • {alloc.designation}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[11px]">
                          <Building2 className="w-3 h-3" />
                          {alloc.projectId}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{alloc.site || 'Main Site Yard'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-200">From: {alloc.effectiveFrom}</div>
                        <div className="text-[11px] text-slate-400">
                          To: {alloc.effectiveTo ? alloc.effectiveTo : <span className="text-emerald-400">Present (Active)</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[11px] text-slate-300">
                          <strong>Sup:</strong> {sup ? sup.fullName : <span className="text-slate-500">Unassigned</span>}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          <strong>PM:</strong> {pm ? pm.fullName : <span className="text-slate-500">Auto-resolved</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {alloc.jibbleAttendanceRequired && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] border border-blue-500/20">
                              Jibble
                            </span>
                          )}
                          {alloc.geofenceRequired && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20">
                              Geofence
                            </span>
                          )}
                          {alloc.faceVerificationRequired && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] border border-purple-500/20">
                              Face Verified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            alloc.status === 'Active'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : alloc.status === 'Superseded'
                              ? 'bg-slate-700/50 text-slate-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {alloc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedEmployeeHistory(alloc.employeeId)}
                            title="View Allocation Timeline"
                            className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded transition-colors"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          {isHRorAdmin && alloc.status === 'Active' && (
                            <button
                              onClick={() => handleOpenNewModal(alloc.employeeId)}
                              title="Reallocate / Transfer Project"
                              className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded text-[11px] transition-colors"
                            >
                              Transfer
                            </button>
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

      {/* Modal: New / Reallocate Project */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Create Project Allocation</h3>
                  <p className="text-xs text-slate-400">Prior active allocations will be automatically superseded.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAllocation} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Employee *</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- Choose Employee --</option>
                  {staffMembers.map(s => (
                    <option key={s.id} value={s.id}>{s.employeeCode} - {s.fullName} ({s.designation})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Project Code *</label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value, site: `${e.target.value} Main Site Yard` })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {projects.map(p => (
                      <option key={p.code} value={p.code}>{p.code} - {p.name}</option>
                    ))}
                    <option value="HEAD_OFFICE">HEAD_OFFICE - Corporate Office</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Site / Work Station</label>
                  <input
                    type="text"
                    value={formData.site}
                    onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Designation on Project</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Effective Date *</label>
                  <input
                    type="date"
                    value={formData.effectiveFrom}
                    onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 space-y-2.5">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Operational Hierarchy & Approvers
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Immediate Site Supervisor</label>
                    <select
                      value={formData.immediateSupervisorId}
                      onChange={(e) => setFormData({ ...formData, immediateSupervisorId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-200"
                    >
                      <option value="">-- Direct PM / Head --</option>
                      {staffMembers.filter(s => s.id !== formData.employeeId).map(s => (
                        <option key={s.id} value={s.id}>{s.fullName} ({s.designation})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Project Resident Manager</label>
                    <select
                      value={formData.projectManagerId}
                      onChange={(e) => setFormData({ ...formData, projectManagerId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-200"
                    >
                      <option value="">-- Select PM --</option>
                      {staffMembers.filter(s => s.role === 'PROJECT_MANAGER' || s.role === 'DIRECTOR').map(s => (
                        <option key={s.id} value={s.id}>{s.fullName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/40 space-y-2">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Attendance & Verification Rules
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.jibbleAttendanceRequired}
                      onChange={(e) => setFormData({ ...formData, jibbleAttendanceRequired: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Jibble Sync Required</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.geofenceRequired}
                      onChange={(e) => setFormData({ ...formData, geofenceRequired: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Site Geofence Radius Check</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.faceVerificationRequired}
                      onChange={(e) => setFormData({ ...formData, faceVerificationRequired: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Face ID Verification</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.attendanceRequired}
                      onChange={(e) => setFormData({ ...formData, attendanceRequired: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Daily Attendance Mandatory</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Remarks / Special Order</label>
                <textarea
                  rows={2}
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Project Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {selectedEmployeeHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-slate-100">Project Allocation History</h3>
              </div>
              <button
                onClick={() => setSelectedEmployeeHistory(null)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {allocations
                .filter(a => a.employeeId === selectedEmployeeHistory)
                .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))
                .map((a, idx) => (
                  <div
                    key={a.id}
                    className={`p-3 rounded-lg border text-xs ${
                      a.status === 'Active'
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : 'bg-slate-800/40 border-slate-700/40'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-200">{a.projectId} • {a.site}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        a.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {a.status}
                      </span>
                    </div>
                    <div className="text-slate-400 mt-1">
                      {a.effectiveFrom} → {a.effectiveTo || 'Present'}
                    </div>
                    <div className="text-slate-400 text-[11px] mt-1">
                      Designation: {a.designation} • ID: {a.allocationId}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
