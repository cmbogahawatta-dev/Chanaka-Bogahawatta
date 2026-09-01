import React, { useState } from 'react';
import {
  FileCheck2,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Printer,
  Download,
  ShieldCheck,
  Building2,
  UserCheck,
  Clock,
  ArrowRight,
  Eye,
  RefreshCw,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { usePayroll } from '../../context/PayrollContext';
import { useStaff } from '../../context/StaffContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { PayrollEmployeeLine } from '../../types/payrollTypes';
import { SalarySlipExporter } from '../../services/export/salarySlipExporter';
import { AdminClearHistoryButton } from '../common/AdminClearHistoryButton';

export const PayrollProcessingView: React.FC = () => {
  const {
    payrollBatches,
    currentBatch,
    activeMonth,
    setActiveMonth,
    generatePayrollBatch,
    validateCurrentMonth,
    approveIndividualEmployee,
    bulkApproveEligibleEmployees,
    transitionBatchStatus,
    lockBatch,
    clearPayrollHistory
  } = usePayroll();

  const { staffMembers } = useStaff();
  const { currentRole } = useEnterprise();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterEligibility, setFilterEligibility] = useState<'ALL' | 'READY' | 'EXCEPTION'>('ALL');
  const [selectedLineForSlip, setSelectedLineForSlip] = useState<PayrollEmployeeLine | null>(null);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [validationResults, setValidationResults] = useState<any[]>([]);

  const isOwner = currentRole === 'OWNER' || currentRole === 'ADMIN';
  const isAccounts = currentRole === 'FINANCE' || currentRole === 'ADMIN' || currentRole === 'OWNER';
  const isHR = currentRole === 'HR' || currentRole === 'ADMIN' || currentRole === 'OWNER';

  const batch = currentBatch;

  // Filtered employee lines
  const displayLines = batch
    ? batch.lines.filter(l => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!l.employeeName.toLowerCase().includes(q) && !l.employeeCode.toLowerCase().includes(q) && !l.projectId.toLowerCase().includes(q)) {
            return false;
          }
        }
        if (filterEligibility === 'READY' && !l.eligibleForBulkApproval) return false;
        if (filterEligibility === 'EXCEPTION' && l.eligibleForBulkApproval) return false;
        return true;
      })
    : [];

  const handleRunValidation = () => {
    const res = validateCurrentMonth();
    setValidationResults(res);
    setIsValidationModalOpen(true);
  };

  const handleRegenerateBatch = () => {
    generatePayrollBatch(activeMonth, 'HR_ADMIN');
  };

  const handleBulkApprove = () => {
    if (!batch) return;
    const { approvedCount } = bulkApproveEligibleEmployees(batch.batchId, 'MANAGING_DIRECTOR', 'OWNER');
    alert(`Bulk approved ${approvedCount} ready employee payroll records.`);
  };

  const handleLockBatch = () => {
    if (!batch) return;
    if (confirm('Are you sure you want to LOCK this payroll batch? Attendance and leave records for this cycle will become strictly immutable.')) {
      lockBatch(batch.batchId, 'MANAGING_DIRECTOR');
    }
  };

  const handleExportBankAdvice = () => {
    if (!batch) return;
    SalarySlipExporter.exportBankTransferAdvice(batch, staffMembers);
  };

  const handleExportEpfEtf = () => {
    if (!batch) return;
    SalarySlipExporter.exportEpfEtfSchedule(batch, staffMembers);
  };

  const handlePrintSlip = (line: PayrollEmployeeLine) => {
    const emp = staffMembers.find(s => s.id === line.employeeId);
    SalarySlipExporter.printEmployeeSalarySlip(line, emp);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Monthly Payroll & Statutory Processing</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pre-flight compliance engine, statutory EPF (8%/12%), ETF (3%), APIT Tax, and single-click bulk approvals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <input
            type="month"
            value={activeMonth}
            onChange={(e) => setActiveMonth(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono focus:outline-none"
          />

          <AdminClearHistoryButton
            id="btn-admin-clear-payroll-view"
            moduleName="Monthly Payroll Batches"
            itemCount={payrollBatches.length}
            itemDescription="payroll cycle batches, computed employee wage lines, and owner approvals"
            preservedItemsDescription="Staff directory, basic salary structures, and statutory EPF/ETF rate settings remain intact."
            onClear={clearPayrollHistory}
          />

          <button
            onClick={handleRunValidation}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Pre-Flight Check
          </button>

          <button
            onClick={handleRegenerateBatch}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Calculate / Recompute Batch
          </button>
        </div>
      </div>

      {/* Batch Workflow Status Ribbon */}
      {batch && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-blue-400 text-sm">{batch.batchId}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                batch.status === 'LOCKED'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : batch.status === 'APPROVED'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : batch.status === 'OWNER_PENDING'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {batch.status}
              </span>
            </div>

            {/* Action transition buttons */}
            <div className="flex items-center gap-2">
              {batch.status === 'HR_REVIEW' && isHR && (
                <button
                  onClick={() => transitionBatchStatus(batch.batchId, 'ACCOUNTS_REVIEW', 'HR_OFFICER')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg"
                >
                  Submit for Accounts Review →
                </button>
              )}

              {batch.status === 'ACCOUNTS_REVIEW' && isAccounts && (
                <button
                  onClick={() => transitionBatchStatus(batch.batchId, 'OWNER_PENDING', 'FINANCE_MANAGER')}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg"
                >
                  Submit for Owner Approval →
                </button>
              )}

              {batch.status === 'OWNER_PENDING' && isOwner && (
                <button
                  onClick={handleBulkApprove}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Single-Click Bulk Approve Ready ({batch.readyEmployees})
                </button>
              )}

              {batch.status === 'APPROVED' && isOwner && (
                <button
                  onClick={handleLockBatch}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-lg"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Lock Payroll Cycle (Section 30)
                </button>
              )}

              {/* Exports */}
              <button
                onClick={handleExportBankAdvice}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                Bank CSV
              </button>

              <button
                onClick={handleExportEpfEtf}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                EPF / ETF
              </button>
            </div>
          </div>

          {/* Financial Totals */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-3 border-t border-slate-800 text-xs">
            <div>
              <span className="text-slate-400">Total Gross:</span>
              <div className="font-mono font-bold text-slate-100">LKR {batch.totalGross.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-slate-400">Total Deductions:</span>
              <div className="font-mono font-bold text-rose-400">LKR {batch.totalDeductions.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-slate-400">Total Net Payable:</span>
              <div className="font-mono font-bold text-emerald-400">LKR {batch.totalNet.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-slate-400">Employer EPF (12%):</span>
              <div className="font-mono text-blue-400">LKR {batch.totalEmployerEpf.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-slate-400">Employer ETF (3%):</span>
              <div className="font-mono text-purple-400">LKR {batch.totalEmployerEtf.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-slate-400">Total Employer Cost:</span>
              <div className="font-mono font-bold text-amber-400">LKR {batch.totalEmployerCost.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Eligibility Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee, project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
          />
        </div>

        <button
          onClick={() => setFilterEligibility('ALL')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            filterEligibility === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Employees ({batch?.lines.length || 0})
        </button>

        <button
          onClick={() => setFilterEligibility('READY')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            filterEligibility === 'READY' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Ready for Bulk Approval ({batch?.readyEmployees || 0})
        </button>

        <button
          onClick={() => setFilterEligibility('EXCEPTION')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            filterEligibility === 'EXCEPTION' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Exceptions ({batch?.exceptionEmployees || 0})
        </button>
      </div>

      {/* Payroll Lines Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Project & Dept</th>
                <th className="px-4 py-3">Basic & Allowances</th>
                <th className="px-4 py-3">Overtime</th>
                <th className="px-4 py-3">Gross Salary</th>
                <th className="px-4 py-3">EPF 8% / APIT</th>
                <th className="px-4 py-3">Net Salary</th>
                <th className="px-4 py-3">Total Cost</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {displayLines.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500 text-sm">
                    No payroll lines found for this batch. Click "Calculate / Recompute Batch" above.
                  </td>
                </tr>
              ) : (
                displayLines.map(line => (
                  <tr key={line.employeeId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-100">{line.employeeName}</div>
                      <div className="text-[11px] text-slate-400">{line.employeeCode} • {line.designation}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-amber-400">{line.projectId}</div>
                      <div className="text-[11px] text-slate-400">{line.department}</div>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <div>LKR {line.basicSalary.toLocaleString()}</div>
                      <div className="text-[11px] text-slate-400">
                        +LKR {(line.earnings.filter(e => e.code !== 'BASIC' && e.code !== 'OVERTIME').reduce((s, e) => s + e.amount, 0)).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {line.approvedOtHours > 0 ? (
                        <div>
                          <div className="text-amber-300">
                            LKR {(line.earnings.find(e => e.code === 'OVERTIME')?.amount || 0).toLocaleString()}
                          </div>
                          <div className="text-[11px] text-slate-400">{line.approvedOtHours} hrs</div>
                        </div>
                      ) : (
                        <span className="text-slate-500">0.0h</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-100">
                      LKR {line.grossSalary.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-rose-400">
                      <div>-LKR {(line.deductions.find(d => d.code === 'EPF_EE')?.amount || Math.round(line.basicSalary * 0.08)).toLocaleString()}</div>
                      {(line.deductions.find(d => d.code === 'APIT')?.amount || 0) > 0 && (
                        <div className="text-[11px]">-LKR {(line.deductions.find(d => d.code === 'APIT')?.amount || 0).toLocaleString()} APIT</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                      LKR {line.netSalary.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-purple-300">
                      LKR {line.totalEmployerCost.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          line.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {line.status}
                        </span>
                        {!line.eligibleForBulkApproval && (
                          <span className="text-[10px] text-rose-400 font-semibold">
                            {line.exceptions[0] || 'Exception'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handlePrintSlip(line)}
                          title="Print Pay Slip"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {line.status !== 'APPROVED' && isOwner && (
                          <button
                            onClick={() => approveIndividualEmployee(batch!.batchId, line.employeeId, 'MANAGING_DIRECTOR')}
                            className="px-2 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/40 rounded text-[11px]"
                          >
                            Approve
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

      {/* Pre-Flight Validation Modal */}
      {isValidationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-slate-100">Payroll Pre-Flight Compliance Report</h3>
              </div>
              <button
                onClick={() => setIsValidationModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {validationResults.map((res, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-2 ${
                    res.isValid
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : 'bg-rose-500/5 border-rose-500/30'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-200">
                      {res.employeeName} ({res.employeeCode})
                    </div>
                    {res.blockingIssues.length > 0 && (
                      <div className="text-rose-400 mt-1 space-y-0.5">
                        {res.blockingIssues.map((issue: string, idx: number) => (
                          <div key={idx}>• {issue}</div>
                        ))}
                      </div>
                    )}
                    {res.warnings.length > 0 && (
                      <div className="text-amber-400 mt-1 space-y-0.5">
                        {res.warnings.map((w: string, idx: number) => (
                          <div key={idx}>⚠️ {w}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    res.isValid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {res.isValid ? 'READY' : 'BLOCKED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
