import { StaffMember } from '../../types/staffTypes';
import { StaffAllocation } from '../../types/staffAllocationTypes';
import { AttendanceRecord } from '../../types/attendanceTypes';
import { LeaveRequest } from '../../types/leaveTypes';
import { OvertimeRecord } from '../../types/overtimeTypes';
import { SalaryHistoryEntry, PayrollRateSettings, SalaryComponent } from '../../types/salaryHistoryTypes';
import { PayrollEmployeeLine, PayrollValidationResult, ValidationIssue } from '../../types/payrollTypes';

export class PayrollCalculationEngine {
  /**
   * Pre-flight Validation (Section 25)
   */
  public static validateEmployeeForPayroll(params: {
    employee: StaffMember;
    allocation?: StaffAllocation;
    salaryEntry?: SalaryHistoryEntry;
    attendanceRecords: AttendanceRecord[];
    pendingLeaves: LeaveRequest[];
    unapprovedOtRecords: OvertimeRecord[];
  }): PayrollValidationResult {
    const { employee, allocation, salaryEntry, attendanceRecords, pendingLeaves, unapprovedOtRecords } = params;
    const issues: ValidationIssue[] = [];

    // 1. Check active allocation
    if (!allocation || allocation.status !== 'Active') {
      issues.push({
        code: 'MISSING_ALLOCATION',
        message: 'No active project allocation found for this employee.',
        isBlocking: true
      });
    }

    // 2. Check salary history entry
    if (!salaryEntry) {
      issues.push({
        code: 'MISSING_SALARY',
        message: 'No salary structure or historical baseline found.',
        isBlocking: true
      });
    } else {
      if (!salaryEntry.bankAccountNo || salaryEntry.bankAccountNo.trim() === '') {
        issues.push({
          code: 'MISSING_BANK',
          message: 'Bank account number is missing for salary transfer.',
          isBlocking: false
        });
      }
    }

    // 3. Check for unapproved / pending attendance
    const pendingPunches = attendanceRecords.filter(
      a => a.supervisorApproval !== 'APPROVED' || a.hrApproval !== 'APPROVED'
    );
    if (pendingPunches.length > 0) {
      issues.push({
        code: 'PENDING_ATTENDANCE',
        message: `${pendingPunches.length} attendance punch(es) are pending supervisor or HR approval.`,
        isBlocking: false
      });
    }

    // 4. Check for pending leave applications
    if (pendingLeaves.length > 0) {
      issues.push({
        code: 'PENDING_LEAVE',
        message: `${pendingLeaves.length} leave application(s) are still pending approval or cover-up acceptance.`,
        isBlocking: false
      });
    }

    // 5. Check for unapproved overtime
    if (unapprovedOtRecords.length > 0) {
      const totalUnapprovedHours = unapprovedOtRecords.reduce((sum, r) => sum + r.hours, 0);
      issues.push({
        code: 'UNAPPROVED_OT',
        message: `${totalUnapprovedHours}h overtime requested but not yet fully approved by HR.`,
        isBlocking: false
      });
    }

    // 6. Zero attendance warning
    if (attendanceRecords.length === 0 && employee.status === 'Active') {
      issues.push({
        code: 'ZERO_ATTENDANCE',
        message: 'No attendance or punch records logged in this payroll period.',
        isBlocking: false
      });
    }

    const hasBlocking = issues.some(i => i.isBlocking);
    const severity = hasBlocking ? 'ERROR' : issues.length > 0 ? 'WARNING' : 'READY';

    return {
      employeeId: employee.id,
      employeeName: employee.fullName,
      severity,
      issues
    };
  }

  /**
   * Calculate Progressive APIT Tax (Sri Lanka Inland Revenue Standard)
   */
  public static calculateAPIT(taxableMonthlyEarnings: number, rates: PayrollRateSettings): number {
    let tax = 0;
    const brackets = rates.apitBrackets || [];

    for (const b of brackets) {
      if (taxableMonthlyEarnings > b.minMonthly) {
        const taxableInThisBracket = b.maxMonthly
          ? Math.min(taxableMonthlyEarnings - b.minMonthly, b.maxMonthly - b.minMonthly)
          : taxableMonthlyEarnings - b.minMonthly;

        tax += taxableInThisBracket * b.rate;
      }
    }

    return Math.round(tax);
  }

  /**
   * Calculate complete Employee Payroll Line (Section 26 & 27)
   */
  public static computeEmployeePayrollLine(params: {
    batchId: string;
    employee: StaffMember;
    allocation: StaffAllocation;
    salaryEntry: SalaryHistoryEntry;
    attendanceRecords: AttendanceRecord[];
    approvedLeaves: LeaveRequest[];
    approvedOtRecords: OvertimeRecord[];
    rates: PayrollRateSettings;
    payrollMonth: string; // e.g. "2026-08"
  }): PayrollEmployeeLine {
    const {
      batchId,
      employee,
      allocation,
      salaryEntry,
      attendanceRecords,
      approvedLeaves,
      approvedOtRecords,
      rates
    } = params;

    const basicSalary = salaryEntry.basicSalary || 0;

    // Attendance stats
    const presentDays = attendanceRecords.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const halfDays = attendanceRecords.filter(a => a.status === 'Half Day').length;
    const adjustedPresentDays = presentDays + halfDays * 0.5;

    const approvedPaidLeaveDays = approvedLeaves
      .filter(l => l.status === 'APPROVED' && l.leaveTypeName !== 'No-Pay Leave')
      .reduce((sum, l) => sum + l.workingDays, 0);

    const noPayLeaveDays = approvedLeaves
      .filter(l => l.status === 'APPROVED' && l.leaveTypeName === 'No-Pay Leave')
      .reduce((sum, l) => sum + l.workingDays, 0);

    const absentDays = Math.max(0, 25 - (adjustedPresentDays + approvedPaidLeaveDays + noPayLeaveDays));

    // Overtime
    const approvedOtHours = approvedOtRecords.reduce((sum, ot) => sum + ot.hours, 0);
    const hourlyRate = rates.standardMonthlyWorkingHours > 0 ? (basicSalary / rates.standardMonthlyWorkingHours) * rates.standardOvertimeMultiplier : 0;
    const calculatedOtAmount = Math.round(approvedOtHours * hourlyRate);

    // Earnings list
    const earnings: SalaryComponent[] = [];
    earnings.push({
      id: `earn-basic-${employee.id}`,
      label: 'Basic Salary',
      amount: basicSalary,
      type: 'EARNING',
      code: 'BASIC',
      isStatutory: true
    });

    // Copy configured custom allowances from salary history
    (salaryEntry.earnings || []).forEach(e => {
      if (e.code !== 'BASIC') {
        earnings.push({ ...e });
      }
    });

    if (calculatedOtAmount > 0) {
      earnings.push({
        id: `earn-ot-${employee.id}`,
        label: `Overtime (${approvedOtHours}h @ 1.5x)`,
        amount: calculatedOtAmount,
        type: 'EARNING',
        code: 'OVERTIME'
      });
    }

    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);

    // Deductions
    const deductions: SalaryComponent[] = [];

    // 1. EPF Employee Contribution (8%)
    const epfLiableAmount = basicSalary;
    const employeeEpf = salaryEntry.epfEligible ? Math.round(epfLiableAmount * rates.epfEmployeeRate) : 0;
    if (employeeEpf > 0) {
      deductions.push({
        id: `ded-epf-ee-${employee.id}`,
        label: `EPF Employee (${Math.round(rates.epfEmployeeRate * 100)}%)`,
        amount: employeeEpf,
        type: 'DEDUCTION',
        code: 'EPF_EE',
        isStatutory: true
      });
    }

    // 2. No-Pay Deduction
    if (noPayLeaveDays > 0) {
      const dailyRate = Math.round(basicSalary / 25);
      const noPayDeductionAmount = Math.round(dailyRate * noPayLeaveDays);
      deductions.push({
        id: `ded-nopay-${employee.id}`,
        label: `No-Pay Leave Deduction (${noPayLeaveDays} days)`,
        amount: noPayDeductionAmount,
        type: 'DEDUCTION',
        code: 'NO_PAY'
      });
    }

    // 3. APIT (Advance Personal Income Tax)
    const apitTax = this.calculateAPIT(totalEarnings, rates);
    if (apitTax > 0) {
      deductions.push({
        id: `ded-apit-${employee.id}`,
        label: 'APIT Income Tax',
        amount: apitTax,
        type: 'DEDUCTION',
        code: 'APIT',
        isStatutory: true
      });
    }

    // 4. Other custom deductions
    (salaryEntry.deductions || []).forEach(d => {
      if (d.code !== 'EPF_EE' && d.code !== 'NO_PAY' && d.code !== 'APIT') {
        deductions.push({ ...d });
      }
    });

    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

    // Employer Contributions
    const employerEpf = salaryEntry.epfEligible ? Math.round(epfLiableAmount * rates.epfEmployerRate) : 0;
    const employerEtf = salaryEntry.etfEligible ? Math.round(epfLiableAmount * rates.etfEmployerRate) : 0;

    const grossSalary = totalEarnings;
    const netSalary = Math.max(0, grossSalary - totalDeductions);
    const totalEmployerCost = grossSalary + employerEpf + employerEtf;

    const exceptions: string[] = [];
    if (absentDays > 3) exceptions.push(`High absenteeism: ${absentDays} unexcused days`);
    if (noPayLeaveDays > 0) exceptions.push(`No-pay leave applied (${noPayLeaveDays} days)`);

    return {
      id: `line-${batchId}-${employee.id}`,
      batchId,
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      employeeName: employee.fullName,
      designation: employee.designation,
      department: employee.department,
      projectId: allocation.projectId || employee.assignedProjectCode || 'PIDM 26',
      allocationId: allocation.id,
      presentDays: adjustedPresentDays,
      absentDays,
      approvedPaidLeaveDays,
      noPayLeaveDays,
      approvedOtHours,
      basicSalary,
      earnings,
      deductions,
      grossSalary,
      netSalary,
      employerEpf,
      employerEtf,
      totalEmployerCost,
      exceptions,
      eligibleForBulkApproval: exceptions.length === 0 && !salaryEntry.remarks?.includes('HOLD'),
      status: 'DRAFT'
    };
  }
}
