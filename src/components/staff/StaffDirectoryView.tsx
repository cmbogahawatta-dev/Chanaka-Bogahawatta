import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  LayoutGrid,
  List,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Eye,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Clock,
  Briefcase,
  AlertTriangle,
  X,
  ChevronRight,
  DollarSign,
  UserCheck,
  UserX,
  HardHat
} from 'lucide-react';
import { useStaff } from '../../context/StaffContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { StaffMember, Department, EmployeeRole, StaffStatus, EmploymentType } from '../../types/staffTypes';
import { StaffProfileModal } from './StaffProfileModal';
import { AddEditStaffModal } from './AddEditStaffModal';

export const StaffDirectoryView: React.FC = () => {
  const {
    staffMembers,
    filteredStaff,
    filterState,
    setFilterState,
    resetFilters,
    summaryStats,
    selectedStaffMember,
    setSelectedStaffMember,
    deleteStaffMember,
    resetStaffDirectory
  } = useStaff();

  const { currentRole } = useEnterprise();
  const { projects } = usePettyCash();

  // Local View States
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<StaffMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<StaffMember | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Check if current user has modification privileges
  const canManageStaff =
    currentRole === 'ADMIN' ||
    currentRole === 'OWNER' ||
    currentRole === 'FINANCE' ||
    currentRole === 'PROJECT_MANAGER';

  const canResetDirectory = currentRole === 'ADMIN' || currentRole === 'OWNER';

  const canViewSalary =
    currentRole === 'ADMIN' ||
    currentRole === 'OWNER' ||
    currentRole === 'FINANCE';

  // Export to Excel / CSV
  const handleExportCSV = () => {
    const headers = [
      'Employee Code',
      'Full Name',
      'Preferred Name',
      'NIC Number',
      'Designation',
      'Role',
      'Department',
      'Employment Type',
      'Status',
      'Joined Date',
      'Assigned Project Code',
      'Assigned Project Name',
      'Reporting Manager',
      'Phone',
      'Email',
      'Basic Salary (LKR)',
      'Site Allowance (LKR)',
      'Transport Allowance (LKR)',
      'Phone Allowance (LKR)',
      'Budgetary Relief (LKR)',
      'Gross Salary (LKR)',
      'Bank Name',
      'Bank Branch',
      'Account Number',
      'Payment Mode',
      'EPF Reg Number',
      'Emergency Contact Name',
      'Emergency Contact Phone',
      'Emergency Relationship'
    ];

    const rows = filteredStaff.map((m) => {
      const gross =
        (m.salaryStructure.basicSalary || 0) +
        (m.salaryStructure.budgetaryReliefAllowance || 0) +
        (m.salaryStructure.siteAllowance || 0) +
        (m.salaryStructure.transportAllowance || 0) +
        (m.salaryStructure.phoneAllowance || 0);

      return [
        `"${m.employeeCode}"`,
        `"${m.fullName.replace(/"/g, '""')}"`,
        `"${m.preferredName.replace(/"/g, '""')}"`,
        `"${m.nicNumber}"`,
        `"${m.designation.replace(/"/g, '""')}"`,
        `"${m.role}"`,
        `"${m.department}"`,
        `"${m.employmentType}"`,
        `"${m.status}"`,
        `"${m.joinedDate}"`,
        `"${m.assignedProjectCode || 'HEAD_OFFICE'}"`,
        `"${(m.assignedProjectName || 'Corporate Head Office').replace(/"/g, '""')}"`,
        `"${(m.reportsToName || 'Direct to Board').replace(/"/g, '""')}"`,
        `"${m.phone}"`,
        `"${m.email}"`,
        canViewSalary ? (m.salaryStructure.basicSalary || 0) : '"CONFIDENTIAL"',
        canViewSalary ? (m.salaryStructure.siteAllowance || 0) : '"CONFIDENTIAL"',
        canViewSalary ? (m.salaryStructure.transportAllowance || 0) : '"CONFIDENTIAL"',
        canViewSalary ? (m.salaryStructure.phoneAllowance || 0) : '"CONFIDENTIAL"',
        canViewSalary ? (m.salaryStructure.budgetaryReliefAllowance || 0) : '"CONFIDENTIAL"',
        canViewSalary ? gross : '"CONFIDENTIAL"',
        `"${(m.salaryStructure.bankName || '').replace(/"/g, '""')}"`,
        `"${(m.salaryStructure.bankBranch || '').replace(/"/g, '""')}"`,
        canViewSalary ? `"${m.salaryStructure.accountNumber || ''}"` : '"CONFIDENTIAL"',
        `"${m.salaryStructure.paymentMode || 'Bank Transfer'}"`,
        `"${m.epfRegistrationNumber || ''}"`,
        `"${(m.emergencyContact.name || '').replace(/"/g, '""')}"`,
        `"${m.emergencyContact.phone || ''}"`,
        `"${m.emergencyContact.relationship || ''}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EMA_Enterprise_Staff_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const getStatusBadge = (status: StaffStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'On Leave':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Probation':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Transferred':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Resigned':
      case 'Terminated':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & KPI METRIC CARDS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-black text-slate-100 tracking-tight">Staff & HR Directory</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-800/80 text-xs font-mono font-bold">
                {summaryStats.totalStaff} Personnel
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Construction human resource records, project allocations, statutory EPF/ETF remits & management hierarchy
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              title="Export Staff Directory to CSV / Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Excel</span>
            </button>

            {canManageStaff && (
              <button
                type="button"
                onClick={() => {
                  setStaffToEdit(null);
                  setIsAddModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-950/50 flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Staff Member</span>
              </button>
            )}

            {canResetDirectory && (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-700/80 text-xs transition-colors"
                title="Admin: Reset Staff Directory to Factory Seed"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              Total Workforce
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-mono font-bold text-slate-100">{summaryStats.totalStaff}</span>
              <span className="text-[11px] font-medium text-emerald-400">{summaryStats.activeStaff} Active</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <HardHat className="w-3.5 h-3.5 text-amber-400" />
              Site Allocated
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-mono font-bold text-amber-400">{summaryStats.siteAllocatedStaff}</span>
              <span className="text-[11px] text-slate-400">Roads & Quarry</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              Head Office
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-mono font-bold text-indigo-400">{summaryStats.headOfficeStaff}</span>
              <span className="text-[11px] text-slate-400">HQ Executives</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              On Leave / Rest
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-mono font-bold text-purple-400">{summaryStats.onLeaveStaff}</span>
              <span className="text-[11px] text-slate-400">Roster status</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Monthly Payroll Sum
            </span>
            <div className="flex items-baseline justify-between">
              {canViewSalary ? (
                <span className="text-sm font-mono font-bold text-emerald-400">
                  LKR {(summaryStats.totalMonthlyPayroll / 1000000).toFixed(2)}M
                </span>
              ) : (
                <span className="text-xs font-mono font-bold text-slate-500">
                  ••••••••
                </span>
              )}
              <span className="text-[10px] text-slate-400">{canViewSalary ? 'Gross Est.' : 'Restricted'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterState.searchQuery}
              onChange={(e) => setFilterState((prev) => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="Search by name, code, NIC, designation, project..."
              className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
            />
            {filterState.searchQuery && (
              <button
                type="button"
                onClick={() => setFilterState((prev) => ({ ...prev, searchQuery: '' }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="lg:col-span-3">
            <select
              value={filterState.department}
              onChange={(e) => setFilterState((prev) => ({ ...prev, department: e.target.value as any }))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Departments ({staffMembers.length})</option>
              <option value="Management">Management ({summaryStats.departmentBreakdown['Management'] || 0})</option>
              <option value="Civil Engineering">Civil Engineering ({summaryStats.departmentBreakdown['Civil Engineering'] || 0})</option>
              <option value="Project Operations">Project Operations ({summaryStats.departmentBreakdown['Project Operations'] || 0})</option>
              <option value="Commercial & QS">Commercial & QS ({summaryStats.departmentBreakdown['Commercial & QS'] || 0})</option>
              <option value="Finance & Accounts">Finance & Accounts ({summaryStats.departmentBreakdown['Finance & Accounts'] || 0})</option>
              <option value="Logistics & Fleet">Logistics & Fleet ({summaryStats.departmentBreakdown['Logistics & Fleet'] || 0})</option>
              <option value="HR & Administration">HR & Administration ({summaryStats.departmentBreakdown['HR & Administration'] || 0})</option>
              <option value="Quality & Safety">Quality & Safety ({summaryStats.departmentBreakdown['Quality & Safety'] || 0})</option>
            </select>
          </div>

          {/* Project Filter */}
          <div className="lg:col-span-3">
            <select
              value={filterState.projectCode}
              onChange={(e) => setFilterState((prev) => ({ ...prev, projectCode: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Project Sites & HQ</option>
              <option value="HEAD_OFFICE">Corporate Head Office</option>
              {projects.map((p) => (
                <option key={p.id} value={p.PROJECT_CODE}>
                  {p.PROJECT_CODE} ({p.PROJECT_NAME})
                </option>
              ))}
            </select>
          </div>

          {/* Status & View Mode */}
          <div className="lg:col-span-2 flex items-center justify-between gap-2">
            <select
              value={filterState.status}
              onChange={(e) => setFilterState((prev) => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Probation">Probation</option>
              <option value="Transferred">Transferred</option>
            </select>

            <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'GRID' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'TABLE' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Table List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Badges */}
        {(filterState.searchQuery ||
          filterState.department !== 'ALL' ||
          filterState.projectCode !== 'ALL' ||
          filterState.status !== 'ALL') && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
            <span className="text-slate-400 text-[11px]">Active Filters:</span>
            {filterState.searchQuery && (
              <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 text-[11px] flex items-center gap-1">
                Query: "{filterState.searchQuery}"
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setFilterState((p) => ({ ...p, searchQuery: '' }))}
                />
              </span>
            )}
            {filterState.department !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 text-[11px] flex items-center gap-1">
                Dept: {filterState.department}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setFilterState((p) => ({ ...p, department: 'ALL' }))}
                />
              </span>
            )}
            {filterState.projectCode !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 text-[11px] flex items-center gap-1">
                Project: {filterState.projectCode}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setFilterState((p) => ({ ...p, projectCode: 'ALL' }))}
                />
              </span>
            )}
            {filterState.status !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 text-[11px] flex items-center gap-1">
                Status: {filterState.status}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setFilterState((p) => ({ ...p, status: 'ALL' }))}
                />
              </span>
            )}
            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] text-cyan-400 hover:underline font-bold ml-auto"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* 3. MAIN WORKFORCE DIRECTORY DISPLAY */}
      {filteredStaff.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <Users className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No personnel records found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No staff members matched your current filter criteria. Try clearing search filters or add a new staff member.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'GRID' ? (
        /* GRID CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((member) => (
            <div
              key={member.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 shadow-sm transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Card Top: Avatar & Codes */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/80 flex items-center justify-center font-black text-sm group-hover:scale-105 transition-transform">
                      {member.preferredName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div>
                      <h3
                        onClick={() => setSelectedStaffMember(member)}
                        className="text-sm font-bold text-slate-100 hover:text-cyan-300 cursor-pointer transition-colors"
                      >
                        {member.fullName}
                      </h3>
                      <p className="text-xs text-cyan-400 font-medium">{member.designation}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(member.status)}`}>
                    {member.status}
                  </span>
                </div>

                {/* Badges and Project allocation */}
                <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Employee Code:</span>
                    <span className="font-mono font-bold text-slate-200">{member.employeeCode}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Department:</span>
                    <span className="text-slate-200 font-medium">{member.department}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Assigned Site:</span>
                    <span className="font-medium text-cyan-300 truncate max-w-[170px]" title={member.assignedProjectName}>
                      {member.assignedProjectName || member.assignedProjectCode}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Reports To:</span>
                    <span className="text-slate-300 truncate max-w-[170px]" title={member.reportsToName}>
                      {member.reportsToName || 'Direct to Board'}
                    </span>
                  </div>
                </div>

                {/* Contact row */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <a
                    href={`tel:${member.phone}`}
                    className="flex items-center gap-1 hover:text-cyan-300 transition-colors"
                  >
                    <Phone className="w-3 h-3 text-cyan-400" />
                    <span className="font-mono text-[11px]">{member.phone}</span>
                  </a>
                  <a
                    href={`mailto:${member.email}`}
                    className="flex items-center gap-1 hover:text-cyan-300 transition-colors"
                    title={member.email}
                  >
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="truncate max-w-[130px] text-[11px]">{member.email}</span>
                  </a>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedStaffMember(member)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-cyan-300 hover:text-cyan-200 font-bold text-xs transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Profile</span>
                </button>

                {canManageStaff && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStaffToEdit(member);
                        setIsAddModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
                      title="Edit Staff Member"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMemberToDelete(member)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Remove Staff Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Designation & Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Assigned Site</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Monthly Basic</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-4 py-3">
                      <div
                        onClick={() => setSelectedStaffMember(member)}
                        className="cursor-pointer group"
                      >
                        <span className="font-bold text-slate-100 group-hover:text-cyan-300 block">
                          {member.fullName}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400">{member.employeeCode}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-200 block">{member.designation}</span>
                      <span className="text-[10px] text-slate-400">{member.role}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-300">{member.department}</td>
                    <td className="px-4 py-3">
                      <span className="text-cyan-300 font-medium block">
                        {member.assignedProjectName || member.assignedProjectCode}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-slate-200 block">{member.phone}</span>
                      <span className="text-[10px] text-slate-400">{member.email}</span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-200">
                      {canViewSalary ? (
                        `LKR ${(member.salaryStructure.basicSalary || 0).toLocaleString()}`
                      ) : (
                        <span className="text-slate-500 italic font-normal text-[11px]">Confidential</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedStaffMember(member)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canManageStaff && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setStaffToEdit(member);
                                setIsAddModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
                              title="Edit Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setMemberToDelete(member)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Delete Member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MODALS & POPUPS */}

      {/* Profile Modal */}
      {selectedStaffMember && (
        <StaffProfileModal
          member={selectedStaffMember}
          onClose={() => setSelectedStaffMember(null)}
          onEdit={
            canManageStaff
              ? (m) => {
                  setSelectedStaffMember(null);
                  setStaffToEdit(m);
                  setIsAddModalOpen(true);
                }
              : undefined
          }
        />
      )}

      {/* Add / Edit Staff Modal */}
      <AddEditStaffModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setStaffToEdit(null);
        }}
        staffToEdit={staffToEdit}
      />

      {/* Delete Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-800 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Confirm Staff Removal</h3>
                <p className="text-xs text-rose-400 font-mono">{memberToDelete.employeeCode}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to remove <strong className="text-white">{memberToDelete.fullName}</strong> ({memberToDelete.designation}) from the corporate staff directory?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteStaffMember(memberToDelete.id);
                  setMemberToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Reset Directory Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Reset Staff Directory</h3>
                <p className="text-xs text-amber-400">Factory Corporate Personnel Seed</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              This action will reset the staff directory back to the 16 corporate seed members across all executive, engineering, commercial QS, and logistics positions.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetStaffDirectory();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors"
              >
                Reset Directory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
