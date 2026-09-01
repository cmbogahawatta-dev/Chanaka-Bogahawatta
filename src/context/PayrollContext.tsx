import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  PayrollBatch,
  PayrollEmployeeLine,
  PayrollApprovalRecord,
  PayrollValidationResult,
  ProjectLabourCostReport
} from '../types/payrollTypes';
import { useStaff } from './StaffContext';
import { useStaffAllocation } from './StaffAllocationContext';
import { useAttendance } from './AttendanceContext';
import { useLeave } from './LeaveContext';
import { useSalaryHistory } from './SalaryHistoryContext';
import { PayrollCalculationEngine } from '../services/payroll/PayrollCalculationEngine';
import { AuditService } from '../services/audit/auditService';

const PAYROLL_BATCHES_KEY = 'ema_payroll_batches_v1';
const PAYROLL_APPROVALS_KEY = 'ema_payroll_approvals_v1';

interface PayrollContextType {
  payrollBatches: PayrollBatch[];
  currentBatch: PayrollBatch | undefined;
  activeMonth: string;
  setActiveMonth: (month: string) => void;

  generatePayrollBatch: (month: string, preparedBy?: string) => PayrollBatch;
  validateCurrentMonth: () => PayrollValidationResult[];
  
  approveIndividualEmployee: (
    batchId: string,
    employeeId: string,
    approverId: string,
    approverRole?: string,
    remarks?: string
  ) => void;

  bulkApproveEligibleEmployees: (
    batchId: string,
    approverId: string,
    approverRole?: string
  ) => { approvedCount: number };

  transitionBatchStatus: (
    batchId: string,
    newStatus: PayrollBatch['status'],
    userId: string,
    userName?: string
  ) => void;

  lockBatch: (batchId: string, lockedBy: string) => void;
  
  getLabourCostReport: (payrollMonth: string) => ProjectLabourCostReport[];
  resetPayrollData: () => void;
}

const PayrollContext = createContext<PayrollContextType | undefined>(undefined);

export const PayrollProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { staffMembers } = useStaff();
  const { getCurrentAllocation, getAllocationAt } = useStaffAllocation();
  const { attendanceRecords, getApprovedOvertimeForEmployee } = useAttendance();
  const { leaveRequests } = useLeave();
  const { salaryHistory, payrollRates, getSalaryAt } = useSalaryHistory();

  const [activeMonth, setActiveMonth] = useState<string>('2026-08');
  const [payrollBatches, setPayrollBatches] = useState<PayrollBatch[]>(() => {
    try {
      const saved = localStorage.getItem(PAYROLL_BATCHES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading payroll batches:', e);
    }
    return [];
  });

  const [approvalRecords, setApprovalRecords] = useState<PayrollApprovalRecord[]>(() => {
    try {
      const saved = localStorage.getItem(PAYROLL_APPROVALS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading payroll approvals:', e);
    }
    return [];
  });

  const saveBatches = (batches: PayrollBatch[]) => {
    setPayrollBatches(batches);
    try {
      localStorage.setItem(PAYROLL_BATCHES_KEY, JSON.stringify(batches));
    } catch (e) {
      console.error('Failed to save payroll batches:', e);
    }
  };

  const saveApprovals = (approvals: PayrollApprovalRecord[]) => {
    setApprovalRecords(approvals);
    try {
      localStorage.setItem(PAYROLL_APPROVALS_KEY, JSON.stringify(approvals));
    } catch (e) {
      console.error('Failed to save payroll approvals:', e);
    }
  };

  const currentBatch = payrollBatches.find(b => b.payrollMonth === activeMonth);

  /**
   * Pre-flight Validation for active month
   */
  const validateCurrentMonth = (): PayrollValidationResult[] => {
    return staffMembers.map(emp => {
      const allocation = getCurrentAllocation(emp.id) || getAllocationAt(emp.id, `${activeMonth}-01`);
      const salaryEntry = getSalaryAt(emp.id, `${activeMonth}-25`);
      const empAttendance = attendanceRecords.filter(a => a.employeeId === emp.id && a.date.startsWith(activeMonth));
      const pendingLeaves = leaveRequests.filter(
        l => l.employeeId === emp.id && l.startDate.startsWith(activeMonth) && l.status !== 'APPROVED' && l.status !== 'REJECTED'
      );
      const unapprovedOt = getApprovedOvertimeForEmployee(emp.id, activeMonth);

      return PayrollCalculationEngine.validateEmployeeForPayroll({
        employee: emp,
        allocation,
        salaryEntry,
        attendanceRecords: empAttendance,
        pendingLeaves,
        unapprovedOtRecords: unapprovedOt
      });
    });
  };

  /**
   * Generate/Recalculate Complete Monthly Payroll Batch (Section 26)
   */
  const generatePayrollBatch = (month: string, preparedBy: string = 'HR_EXECUTIVE'): PayrollBatch => {
    const batchId = `PAY-${month}`;
    const lines: PayrollEmployeeLine[] = [];

    staffMembers.forEach(emp => {
      const allocation = getCurrentAllocation(emp.id) || getAllocationAt(emp.id, `${month}-01`);
      const salaryEntry = getSalaryAt(emp.id, `${month}-25`);

      if (!allocation || !salaryEntry) return;

      const empAttendance = attendanceRecords.filter(a => a.employeeId === emp.id && a.date.startsWith(month));
      const empApprovedLeaves = leaveRequests.filter(
        l => l.employeeId === emp.id && l.startDate.startsWith(month) && l.status === 'APPROVED'
      );
      const empApprovedOt = getApprovedOvertimeForEmployee(emp.id, month);

      const line = PayrollCalculationEngine.computeEmployeePayrollLine({
        batchId,
        employee: emp,
        allocation,
        salaryEntry,
        attendanceRecords: empAttendance,
        approvedLeaves: empApprovedLeaves,
        approvedOtRecords: empApprovedOt,
        rates: payrollRates,
        payrollMonth: month
      });

      lines.push(line);
    });

    const totalGross = lines.reduce((sum, l) => sum + l.grossSalary, 0);
    const totalDeductions = lines.reduce((sum, l) => sum + (l.grossSalary - l.netSalary), 0);
    const totalNet = lines.reduce((sum, l) => sum + l.netSalary, 0);
    const totalEmployerEpf = lines.reduce((sum, l) => sum + l.employerEpf, 0);
    const totalEmployerEtf = lines.reduce((sum, l) => sum + l.employerEtf, 0);
    const totalEmployerCost = lines.reduce((sum, l) => sum + l.totalEmployerCost, 0);

    const readyEmployees = lines.filter(l => l.eligibleForBulkApproval).length;
    const exceptionEmployees = lines.length - readyEmployees;

    const newBatch: PayrollBatch = {
      id: `batch-${month}`,
      batchId,
      payrollMonth: month,
      status: 'HR_REVIEW',
      lines,
      totalEmployees: lines.length,
      readyEmployees,
      exceptionEmployees,
      totalGross,
      totalDeductions,
      totalNet,
      totalEmployerEpf,
      totalEmployerEtf,
      totalEmployerCost,
      createdAt: new Date().toISOString(),
      preparedBy,
      hrReviewedBy: preparedBy,
      hrReviewedAt: new Date().toISOString()
    };

    const existingIdx = payrollBatches.findIndex(b => b.payrollMonth === month);
    let updatedBatches: PayrollBatch[];
    if (existingIdx >= 0) {
      updatedBatches = [...payrollBatches];
      updatedBatches[existingIdx] = newBatch;
    } else {
      updatedBatches = [newBatch, ...payrollBatches];
    }

    saveBatches(updatedBatches);

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: preparedBy,
      userName: 'HR Executive',
      userRole: 'admin',
      action: 'CREATE',
      module: 'PAYROLL',
      recordId: batchId,
      details: `Generated payroll batch for ${month}: ${lines.length} employees, Net LKR ${totalNet.toLocaleString()}`
    });

    return newBatch;
  };

  /**
   * Seed Initial Batch if empty on load
   */
  useEffect(() => {
    if (payrollBatches.length === 0 && staffMembers.length > 0 && salaryHistory.length > 0) {
      generatePayrollBatch('2026-08', 'HR_ADMIN');
    }
  }, [payrollBatches.length, staffMembers.length, salaryHistory.length]);

  /**
   * Individual Employee Approval (Section 28)
   */
  const approveIndividualEmployee = (
    batchId: string,
    employeeId: string,
    approverId: string,
    approverRole: string = 'OWNER',
    remarks?: string
  ) => {
    const updated = payrollBatches.map(batch => {
      if (batch.batchId === batchId || batch.id === batchId) {
        const updatedLines = batch.lines.map(line => {
          if (line.employeeId === employeeId) {
            return {
              ...line,
              status: 'APPROVED' as const,
              approvedAt: new Date().toISOString(),
              approvedBy: approverId
            };
          }
          return line;
        });

        return {
          ...batch,
          lines: updatedLines
        };
      }
      return batch;
    });

    saveBatches(updated);

    const newApproval: PayrollApprovalRecord = {
      id: `appr-${Date.now()}-${employeeId}`,
      batchId,
      employeeId,
      netSalary: 0,
      approvedBy: approverId,
      approvalLevel: approverRole,
      approvedAt: new Date().toISOString(),
      remarks
    };

    saveApprovals([newApproval, ...approvalRecords]);

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: approverId,
      userName: 'Approver',
      userRole: 'admin',
      action: 'APPROVE',
      module: 'PAYROLL',
      recordId: batchId,
      details: `Individually approved payroll for employee ${employeeId}`
    });
  };

  /**
   * Bulk Approval for Ready Employees (Section 28)
   */
  const bulkApproveEligibleEmployees = (
    batchId: string,
    approverId: string,
    approverRole: string = 'OWNER'
  ): { approvedCount: number } => {
    let count = 0;
    const bulkActionId = `bulk-${Date.now()}`;
    const newApprovalRecords: PayrollApprovalRecord[] = [];

    const updated = payrollBatches.map(batch => {
      if (batch.batchId === batchId || batch.id === batchId) {
        const updatedLines = batch.lines.map(line => {
          if (line.eligibleForBulkApproval && line.status !== 'APPROVED') {
            count++;
            newApprovalRecords.push({
              id: `appr-${Date.now()}-${line.employeeId}`,
              batchId,
              employeeId: line.employeeId,
              netSalary: line.netSalary,
              approvedBy: approverId,
              approvalLevel: `${approverRole}_BULK`,
              approvedAt: new Date().toISOString(),
              bulkActionId
            });

            return {
              ...line,
              status: 'APPROVED' as const,
              approvedAt: new Date().toISOString(),
              approvedBy: approverId
            };
          }
          return line;
        });

        const allApproved = updatedLines.every(l => l.status === 'APPROVED');

        return {
          ...batch,
          status: allApproved ? ('APPROVED' as const) : batch.status,
          ownerApprovedBy: approverId,
          ownerApprovedAt: new Date().toISOString(),
          lines: updatedLines
        };
      }
      return batch;
    });

    saveBatches(updated);
    if (newApprovalRecords.length > 0) {
      saveApprovals([...newApprovalRecords, ...approvalRecords]);
    }

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: approverId,
      userName: 'Managing Director / Owner',
      userRole: 'admin',
      action: 'BULK_APPROVE',
      module: 'PAYROLL',
      recordId: batchId,
      details: `Bulk approved ${count} ready payroll records in batch ${batchId}`
    });

    return { approvedCount: count };
  };

  const transitionBatchStatus = (
    batchId: string,
    newStatus: PayrollBatch['status'],
    userId: string,
    userName: string = 'User'
  ) => {
    const updated = payrollBatches.map(b => {
      if (b.batchId === batchId || b.id === batchId) {
        return {
          ...b,
          status: newStatus,
          hrReviewedBy: newStatus === 'ACCOUNTS_REVIEW' ? userId : b.hrReviewedBy,
          hrReviewedAt: newStatus === 'ACCOUNTS_REVIEW' ? new Date().toISOString() : b.hrReviewedAt,
          accountsReviewedBy: newStatus === 'OWNER_PENDING' ? userId : b.accountsReviewedBy,
          accountsReviewedAt: newStatus === 'OWNER_PENDING' ? new Date().toISOString() : b.accountsReviewedAt,
          ownerApprovedBy: newStatus === 'APPROVED' ? userId : b.ownerApprovedBy,
          ownerApprovedAt: newStatus === 'APPROVED' ? new Date().toISOString() : b.ownerApprovedAt
        };
      }
      return b;
    });

    saveBatches(updated);

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId,
      userName,
      userRole: 'admin',
      action: 'UPDATE',
      module: 'PAYROLL',
      recordId: batchId,
      details: `Transitioned payroll batch status to ${newStatus}`
    });
  };

  /**
   * Lock Payroll Batch (Section 30)
   */
  const lockBatch = (batchId: string, lockedBy: string) => {
    const updated = payrollBatches.map(b => {
      if (b.batchId === batchId || b.id === batchId) {
        return {
          ...b,
          status: 'LOCKED' as const,
          lockedAt: new Date().toISOString(),
          lockedBy
        };
      }
      return b;
    });

    saveBatches(updated);

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: lockedBy,
      userName: 'Owner/Finance',
      userRole: 'admin',
      action: 'PAYROLL_LOCK',
      module: 'PAYROLL',
      recordId: batchId,
      details: `Locked payroll batch ${batchId}. Time & attendance logs for this cycle are now immutable.`
    });
  };

  /**
   * Project Labour Cost Allocation Report (Section 32)
   */
  const getLabourCostReport = (payrollMonth: string): ProjectLabourCostReport[] => {
    const batch = payrollBatches.find(b => b.payrollMonth === payrollMonth);
    if (!batch) return [];

    const projectMap: Record<
      string,
      {
        headcount: number;
        gross: number;
        epf: number;
        etf: number;
        cost: number;
        dept: Record<string, number>;
        role: Record<string, number>;
      }
    > = {};

    batch.lines.forEach(l => {
      const p = l.projectId || 'Unassigned';
      if (!projectMap[p]) {
        projectMap[p] = { headcount: 0, gross: 0, epf: 0, etf: 0, cost: 0, dept: {}, role: {} };
      }

      projectMap[p].headcount += 1;
      projectMap[p].gross += l.grossSalary;
      projectMap[p].epf += l.employerEpf;
      projectMap[p].etf += l.employerEtf;
      projectMap[p].cost += l.totalEmployerCost;

      projectMap[p].dept[l.department] = (projectMap[p].dept[l.department] || 0) + l.totalEmployerCost;
      projectMap[p].role[l.designation] = (projectMap[p].role[l.designation] || 0) + l.totalEmployerCost;
    });

    return Object.entries(projectMap).map(([projectId, data]) => ({
      projectId,
      projectName: projectId === 'PIDM 26' ? 'PIDM 26 Main Road Project' : projectId === 'PIDM 28' ? 'PIDM 28 Highway Widening' : projectId === 'PIDM 27' ? 'PIDM 27 Bridges & Culverts' : projectId,
      payrollMonth,
      headcount: data.headcount,
      totalGrossWage: data.gross,
      totalEmployerEpf: data.epf,
      totalEmployerEtf: data.etf,
      totalLabourCost: data.cost,
      departmentBreakdown: data.dept,
      roleBreakdown: data.role
    }));
  };

  const resetPayrollData = () => {
    localStorage.removeItem(PAYROLL_BATCHES_KEY);
    localStorage.removeItem(PAYROLL_APPROVALS_KEY);
    setPayrollBatches([]);
    setApprovalRecords([]);
  };

  return (
    <PayrollContext.Provider
      value={{
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
        getLabourCostReport,
        resetPayrollData
      }}
    >
      {children}
    </PayrollContext.Provider>
  );
};

export const usePayroll = (): PayrollContextType => {
  const context = useContext(PayrollContext);
  if (!context) {
    throw new Error('usePayroll must be used within a PayrollProvider');
  }
  return context;
};
