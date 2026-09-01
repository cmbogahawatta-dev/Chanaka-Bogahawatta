import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  History,
  TrendingUp,
  X,
  Percent,
  Calendar,
  Building,
  CheckCircle,
  CreditCard
} from 'lucide-react';
import { useSalaryHistory } from '../../context/SalaryHistoryContext';
import { useStaff } from '../../context/StaffContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { SalaryHistoryEntry, SalaryComponent } from '../../types/salaryHistoryTypes';

export const SalaryHistoryView: React.FC = () => {
  const {
    salaryHistory,
    payrollRates,
    getCurrentSalary,
    getHistoryForEmployee,
    createSalaryRevision,
    updatePayrollRates
  } = useSalaryHistory();

  const { staffMembers } = useStaff();
  const { currentRole } = useEnterprise();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeHistory, setSelectedEmployeeHistory] = useState<string | null>(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);

  // Revision Form State
  const [formData, setFormData] = useState({
    employeeId: '',
    effectiveFrom: new Date().toISOString().slice(0, 10),
    basicSalary: 85000,
    siteAllowance: 15000,
    transportAllowance: 10000,
    phoneAllowance: 3000,
    otherAllowance: 0,
    epfEligible: true,
    etfEligible: true,
    otEligible: true,
    bankName: 'Commercial Bank of Ceylon',
    bankBranch: 'Colombo 03',
    bankAccountNo: '8004592014',
    paymentMode: 'Bank Transfer' as 'Bank Transfer' | 'Cheque' | 'Petty Cash Voucher' | 'Cash',
    reason: 'Annual salary increment and performance appraisal',
    remarks: 'Approved by Managing Director'
  });

  const isHRorAdmin =
    currentRole === 'ADMIN' ||
    currentRole === 'HR' ||
    currentRole === 'OWNER';

  // Filter staff with their current salary
  const currentStructures = staffMembers.map(emp => {
    const currentSal = getCurrentSalary(emp.id);
    return {
      employee: emp,
      salary: currentSal
    };
  }).filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.employee.fullName.toLowerCase().includes(q) ||
      item.employee.employeeCode.toLowerCase().includes(q) ||
      item.employee.designation.toLowerCase().includes(q)
    );
  });

  const handleOpenRevisionModal = (empId?: string) => {
    const targetId = empId || (staffMembers[0]?.id ?? '');
    const emp = staffMembers.find(s => s.id === targetId);
    const currentSal = targetId ? getCurrentSalary(targetId) : null;

    const existingBasic = currentSal?.basicSalary || emp?.salaryStructure?.basicSalary || 85000;
    const siteAllow = currentSal?.earnings.find(e => e.code === 'SITE_ALLOWANCE')?.amount || emp?.salaryStructure?.siteAllowance || 15000;
    const transportAllow = currentSal?.earnings.find(e => e.code === 'TRANSPORT_ALLOWANCE')?.amount || emp?.salaryStructure?.transportAllowance || 10000;
    const phoneAllow = currentSal?.earnings.find(e => e.code === 'PHONE_ALLOWANCE')?.amount || emp?.salaryStructure?.phoneAllowance || 3000;

    setFormData({
      employeeId: targetId,
      effectiveFrom: new Date().toISOString().slice(0, 10),
      basicSalary: existingBasic,
      siteAllowance: siteAllow,
      transportAllowance: transportAllow,
      phoneAllowance: phoneAllow,
      otherAllowance: 0,
      epfEligible: currentSal?.epfEligible ?? (emp?.epfEligible ?? true),
      etfEligible: currentSal?.etfEligible ?? (emp?.etfEligible ?? true),
      otEligible: currentSal?.otEligible ?? (emp?.otEligible ?? true),
      bankName: currentSal?.bankName || emp?.salaryStructure?.bankName || 'Commercial Bank of Ceylon',
      bankBranch: currentSal?.bankBranch || emp?.salaryStructure?.bankBranch || 'Colombo 03',
      bankAccountNo: currentSal?.bankAccountNo || emp?.salaryStructure?.accountNumber || '8004592014',
      paymentMode: currentSal?.paymentMode || (emp?.salaryStructure?.paymentMode as any) || 'Bank Transfer',
      reason: 'Annual salary increment and performance appraisal',
      remarks: 'Sanctioned by Management'
    });
    setIsRevisionModalOpen(true);
  };

  const handleSaveRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) return;

    const basic = Number(formData.basicSalary) || 0;
    const site = Number(formData.siteAllowance) || 0;
    const transport = Number(formData.transportAllowance) || 0;
    const phone = Number(formData.phoneAllowance) || 0;
    const other = Number(formData.otherAllowance) || 0;

    const earnings: SalaryComponent[] = [
      { id: `comp-b-${Date.now()}`, label: 'Basic Salary', amount: basic, type: 'EARNING', code: 'BASIC', isStatutory: true }
    ];

    if (site > 0) {
      earnings.push({ id: `comp-s-${Date.now()}`, label: 'Site Allowance', amount: site, type: 'EARNING', code: 'SITE_ALLOWANCE' });
    }
    if (transport > 0) {
      earnings.push({ id: `comp-t-${Date.now()}`, label: 'Transport Allowance', amount: transport, type: 'EARNING', code: 'TRANSPORT_ALLOWANCE' });
    }
    if (phone > 0) {
      earnings.push({ id: `comp-p-${Date.now()}`, label: 'Phone Allowance', amount: phone, type: 'EARNING', code: 'PHONE_ALLOWANCE' });
    }
    if (other > 0) {
      earnings.push({ id: `comp-o-${Date.now()}`, label: 'Other Allowance', amount: other, type: 'EARNING', code: 'OTHER_ALLOWANCE' });
    }

    const deductions: SalaryComponent[] = [];
    if (formData.epfEligible) {
      const epfEe = Math.round(basic * payrollRates.epfEmployeeRate);
      deductions.push({ id: `comp-epf-${Date.now()}`, label: 'EPF Employee (8%)', amount: epfEe, type: 'DEDUCTION', code: 'EPF_EE', isStatutory: true });
    }

    createSalaryRevision({
      employeeId: formData.employeeId,
      effectiveFrom: formData.effectiveFrom,
      basicSalary: basic,
      earnings,
      deductions,
      epfEligible: formData.epfEligible,
      etfEligible: formData.etfEligible,
      otEligible: formData.otEligible,
      bankName: formData.bankName,
      bankBranch: formData.bankBranch,
      bankAccountNo: formData.bankAccountNo,
      paymentMode: formData.paymentMode,
      remarks: `${formData.reason} - ${formData.remarks}`,
      createdBy: 'HR_MANAGER'
    });

    setIsRevisionModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Salary Structures & Revision History</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Statutory EPF/ETF allowances, increment logs with immutable effective dates, and Sri Lankan APIT tax brackets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isHRorAdmin && (
            <>
              <button
                onClick={() => setIsRatesModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-all"
              >
                <Percent className="w-3.5 h-3.5 text-emerald-400" />
                Statutory Rates
              </button>
              <button
                onClick={() => handleOpenRevisionModal()}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Record Salary Revision
              </button>
            </>
          )}
        </div>
      </div>

      {/* Statutory Rates Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Employee EPF</span>
          <div className="text-2xl font-bold text-blue-400 mt-1">{(payrollRates.epfEmployeeRate * 100).toFixed(0)}%</div>
          <span className="text-[10px] text-slate-500">Statutory deduction</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Employer EPF</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{(payrollRates.epfEmployerRate * 100).toFixed(0)}%</div>
          <span className="text-[10px] text-slate-500">Company contribution</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Employer ETF</span>
          <div className="text-2xl font-bold text-purple-400 mt-1">{(payrollRates.etfEmployerRate * 100).toFixed(0)}%</div>
          <span className="text-[10px] text-slate-500">Trust Fund contribution</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Standard Work Month</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">{payrollRates.standardMonthlyWorkingHours} hrs</div>
          <span className="text-[10px] text-slate-500">Hourly divisor baseline (200h)</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee by code, name, designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
          />
        </div>
      </div>

      {/* Salary Master Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Effective Since</th>
                <th className="px-4 py-3">Basic Salary</th>
                <th className="px-4 py-3">Fixed Allowances</th>
                <th className="px-4 py-3">Gross Base</th>
                <th className="px-4 py-3">Payment Mode & Bank</th>
                <th className="px-4 py-3">Statutory Flags</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {currentStructures.map(({ employee, salary }) => {
                const basic = salary?.basicSalary || employee.salaryStructure?.basicSalary || 0;
                const allowances = (salary?.earnings || [])
                  .filter(e => e.code !== 'BASIC' && e.code !== 'OVERTIME')
                  .reduce((s, e) => s + e.amount, 0) || ((employee.salaryStructure?.siteAllowance || 0) + (employee.salaryStructure?.transportAllowance || 0) + (employee.salaryStructure?.phoneAllowance || 0));
                const grossBase = basic + allowances;

                return (
                  <tr key={employee.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-100">{employee.fullName}</div>
                      <div className="text-[11px] text-slate-400">{employee.employeeCode} • {employee.designation}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-mono text-[11px]">
                      {salary?.effectiveFrom || employee.joinedDate || '2026-01-01'}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-100">
                      LKR {basic.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      LKR {allowances.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                      LKR {grossBase.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-200">{salary?.bankName || employee.salaryStructure?.bankName || 'Commercial Bank'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {salary?.bankAccountNo || employee.salaryStructure?.accountNumber || '—'} ({salary?.paymentMode || employee.salaryStructure?.paymentMode || 'Bank'})
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {(salary?.epfEligible ?? employee.epfEligible ?? true) && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] border border-blue-500/20 font-bold">
                            EPF
                          </span>
                        )}
                        {(salary?.etfEligible ?? employee.etfEligible ?? true) && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] border border-purple-500/20 font-bold">
                            ETF
                          </span>
                        )}
                        {(salary?.otEligible ?? employee.otEligible ?? true) && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] border border-amber-500/20 font-bold">
                            OT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedEmployeeHistory(employee.id)}
                          title="View Revision Timeline"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        {isHRorAdmin && (
                          <button
                            onClick={() => handleOpenRevisionModal(employee.id)}
                            className="px-2 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/40 rounded text-[11px]"
                          >
                            Revise
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revision History Modal for specific employee */}
      {selectedEmployeeHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-100">Salary Revision History & Increments</h3>
                  <p className="text-xs text-slate-400">
                    {staffMembers.find(s => s.id === selectedEmployeeHistory)?.fullName} ({staffMembers.find(s => s.id === selectedEmployeeHistory)?.employeeCode})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployeeHistory(null)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {getHistoryForEmployee(selectedEmployeeHistory).map((rev, idx) => {
                const totalAllowances = rev.earnings
                  .filter(e => e.code !== 'BASIC' && e.code !== 'OVERTIME')
                  .reduce((sum, e) => sum + e.amount, 0);

                return (
                  <div
                    key={rev.id}
                    className={`p-4 rounded-xl border text-xs space-y-2 ${
                      !rev.effectiveTo
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : 'bg-slate-800/40 border-slate-700/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-100">
                        Effective: {rev.effectiveFrom} {rev.effectiveTo ? `to ${rev.effectiveTo}` : '(Current Active)'}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        !rev.effectiveTo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {!rev.effectiveTo ? 'ACTIVE' : 'HISTORICAL'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-lg font-mono text-[11px]">
                      <div>
                        <span className="text-slate-400">Basic Salary:</span>
                        <div className="text-slate-100 font-bold">LKR {rev.basicSalary.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Fixed Allowances:</span>
                        <div className="text-slate-200">
                          LKR {totalAllowances.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Gross Baseline:</span>
                        <div className="text-emerald-400 font-bold">LKR {(rev.basicSalary + totalAllowances).toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-300">
                      <strong>Remarks:</strong> {rev.remarks || 'Standard employment contract structure'}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Bank: {rev.bankName} - {rev.bankAccountNo} ({rev.paymentMode})</span>
                      <span>Recorded: {rev.createdAt.slice(0, 10)} by {rev.createdBy}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Salary Revision */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">Record Salary Revision</h3>
              </div>
              <button
                onClick={() => setIsRevisionModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRevision} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Employee *</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => {
                    const empId = e.target.value;
                    const curSal = getCurrentSalary(empId);
                    const emp = staffMembers.find(s => s.id === empId);
                    setFormData(prev => ({
                      ...prev,
                      employeeId: empId,
                      basicSalary: curSal?.basicSalary || emp?.salaryStructure?.basicSalary || 85000,
                      siteAllowance: curSal?.earnings.find(item => item.code === 'SITE_ALLOWANCE')?.amount || emp?.salaryStructure?.siteAllowance || 15000,
                      transportAllowance: curSal?.earnings.find(item => item.code === 'TRANSPORT_ALLOWANCE')?.amount || emp?.salaryStructure?.transportAllowance || 10000,
                      phoneAllowance: curSal?.earnings.find(item => item.code === 'PHONE_ALLOWANCE')?.amount || emp?.salaryStructure?.phoneAllowance || 3000
                    }));
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  required
                >
                  {staffMembers.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeCode}) - {emp.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Effective Date (Immutable) *</label>
                  <input
                    type="date"
                    value={formData.effectiveFrom}
                    onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Basic Salary (LKR) *</label>
                  <input
                    type="number"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block mb-2">Allowances Breakdown (LKR)</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Site Allowance</label>
                    <input
                      type="number"
                      value={formData.siteAllowance}
                      onChange={(e) => setFormData({ ...formData, siteAllowance: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Transport / Travel Allowance</label>
                    <input
                      type="number"
                      value={formData.transportAllowance}
                      onChange={(e) => setFormData({ ...formData, transportAllowance: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Mobile / Data Allowance</label>
                    <input
                      type="number"
                      value={formData.phoneAllowance}
                      onChange={(e) => setFormData({ ...formData, phoneAllowance: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Other Fixed Allowance</label>
                    <input
                      type="number"
                      value={formData.otherAllowance}
                      onChange={(e) => setFormData({ ...formData, otherAllowance: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block mb-2">Bank & Payment Disbursement</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={formData.bankAccountNo}
                      onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t border-slate-800 pt-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.epfEligible}
                    onChange={(e) => setFormData({ ...formData, epfEligible: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500"
                  />
                  <span className="text-slate-300">EPF (8%/12%)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.etfEligible}
                    onChange={(e) => setFormData({ ...formData, etfEligible: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500"
                  />
                  <span className="text-slate-300">ETF (3%)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.otEligible}
                    onChange={(e) => setFormData({ ...formData, otEligible: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500"
                  />
                  <span className="text-slate-300">OT Multiplier</span>
                </label>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Revision Reason & Justification</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g. Annual Appraisal Increment, Promotion to Lead Engineer"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Salary Revision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statutory Rates Modal */}
      {isRatesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">Configure Statutory Rates & APIT</h3>
              </div>
              <button
                onClick={() => setIsRatesModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Employee EPF (Rate 0.08)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={payrollRates.epfEmployeeRate}
                    onChange={(e) => updatePayrollRates({ epfEmployeeRate: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Employer EPF (Rate 0.12)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={payrollRates.epfEmployerRate}
                    onChange={(e) => updatePayrollRates({ epfEmployerRate: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Employer ETF (Rate 0.03)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={payrollRates.etfEmployerRate}
                    onChange={(e) => updatePayrollRates({ etfEmployerRate: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-lg text-slate-300 space-y-1">
                <div className="font-bold text-emerald-400">Sri Lanka APIT Tax Brackets (2026/2027)</div>
                <div className="text-[11px] text-slate-400">
                  First LKR 100,000 / month = 0% Tax Relief Exemption<br />
                  Next LKR 41,667 @ 6% | Next LKR 41,667 @ 12% | Next LKR 41,667 @ 18% | Next LKR 41,667 @ 24% | Next LKR 41,667 @ 30% | Balance @ 36%
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-800">
                <button
                  onClick={() => setIsRatesModalOpen(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
