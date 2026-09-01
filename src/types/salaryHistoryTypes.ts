export type ComponentType = 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION';

export interface SalaryComponent {
  id: string;
  label: string;                        // e.g. "Basic Salary", "Site Allowance", "Food Allowance", "EPF Employee (8%)"
  amount: number;                       // LKR
  type: ComponentType;
  isStatutory?: boolean;
  code?: string;                        // e.g. "BASIC", "SITE_ALLOWANCE", "EPF_EE", "EPF_ER", "ETF_ER", "APIT"
}

export interface APITBracket {
  minMonthly: number;
  maxMonthly?: number;
  rate: number;                         // e.g. 0.06 (6%), 0.12 (12%), etc.
}

export interface PayrollRateSettings {
  id: string;
  epfEmployeeRate: number;              // Standard 0.08 (8%)
  epfEmployerRate: number;              // Standard 0.12 (12%)
  etfEmployerRate: number;              // Standard 0.03 (3%)
  standardMonthlyWorkingHours: number;  // Standard 200 hours (25 days * 8h)
  standardOvertimeMultiplier: number;   // Standard 1.5x
  holidayOvertimeMultiplier: number;    // Standard 2.0x
  apitBrackets: APITBracket[];
  effectiveFrom: string;                // YYYY-MM-DD
  updatedAt: string;
}

export interface SalaryHistoryEntry {
  id: string;
  employeeId: string;                   // FK to StaffMember.id
  effectiveFrom: string;                // YYYY-MM-DD (immutable historical snapshot)
  effectiveTo?: string;                 // YYYY-MM-DD (undefined if current)
  basicSalary: number;
  earnings: SalaryComponent[];
  deductions: SalaryComponent[];
  epfEligible: boolean;
  etfEligible: boolean;
  otEligible: boolean;
  bankName: string;
  bankBranch?: string;
  bankAccountNo: string;
  paymentMode: 'Bank Transfer' | 'Cheque' | 'Petty Cash Voucher' | 'Cash';
  remarks?: string;
  createdAt: string;
  createdBy: string;
}
