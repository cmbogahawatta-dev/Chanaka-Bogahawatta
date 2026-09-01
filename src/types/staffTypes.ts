export type EmployeeRole =
  | 'DIRECTOR'
  | 'PROJECT_MANAGER'
  | 'SITE_ENGINEER'
  | 'QUANTITY_SURVEYOR'
  | 'SUPERVISOR'
  | 'ACCOUNTANT'
  | 'FLEET_MANAGER'
  | 'HR_OFFICER'
  | 'SAFETY_OFFICER'
  | 'TECHNICAL_OFFICER'
  | 'SURVEYOR'
  | 'FOREMAN'
  | 'STOREKEEPER'
  | 'ADMIN_ASSISTANT';

export type Department =
  | 'Management'
  | 'Civil Engineering'
  | 'Project Operations'
  | 'Commercial & QS'
  | 'Finance & Accounts'
  | 'Logistics & Fleet'
  | 'HR & Administration'
  | 'Quality & Safety';

export type EmploymentType =
  | 'Permanent'
  | 'Contract'
  | 'Probation'
  | 'Consultant'
  | 'Intern';

export type StaffStatus =
  | 'Active'
  | 'On Leave'
  | 'Transferred'
  | 'Probation'
  | 'Resigned'
  | 'Terminated';

export interface SalaryStructure {
  basicSalary: number;               // LKR Basic
  budgetaryReliefAllowance?: number; // LKR
  siteAllowance?: number;            // LKR Site / Location Allowance
  transportAllowance?: number;       // LKR Vehicle / Fuel / Travel Allowance
  phoneAllowance?: number;           // LKR Communication Allowance
  epfEmployeeRate: number;           // Standard 8%
  epfEmployerRate: number;           // Standard 12%
  etfEmployerRate: number;           // Standard 3%
  bankName: string;                  // e.g. "Commercial Bank of Ceylon", "Bank of Ceylon", "Sampath Bank", "HNB"
  bankBranch: string;                // e.g. "Colombo 03", "Kandy Metro", "Galle Fort"
  accountNumber: string;             // Bank Account Number
  paymentMode: 'Bank Transfer' | 'Cheque' | 'Petty Cash Voucher' | 'Cash';
  taxDeductions?: number;            // APIT / PAYE deduction if applicable
  effectiveDate: string;             // YYYY-MM-DD
}

export interface StaffEmergencyContact {
  name: string;
  relationship: string;              // e.g. "Spouse", "Father", "Mother", "Sibling"
  phone: string;
  alternatePhone?: string;
  address?: string;
}

export interface StaffMember {
  id: string;                        // Unique UUID or ID
  enterpriseId?: string;             // Tenant enterprise association
  employeeCode: string;              // e.g. "EMA-EMP-001"
  nicNumber: string;                 // Sri Lanka NIC (e.g. 198512345678 or 851234567V)
  fullName: string;
  preferredName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  role: EmployeeRole;
  designation: string;               // Display title e.g. "Senior Resident Project Manager"
  department: Department;
  employmentType: EmploymentType;
  status: StaffStatus;
  joinedDate: string;                // YYYY-MM-DD
  confirmationDate?: string;         // YYYY-MM-DD
  assignedProjectCode: string;       // Primary Site e.g. "PRJ-001" or "HEAD_OFFICE" / "ALL"
  assignedProjectName?: string;
  assignedProjectCodes?: string[];   // Multi-project site allocations (e.g. ['PIDM 26', 'PIDM 28'])
  reportsToId?: string;              // Staff ID of Direct Supervisor / Manager
  reportsToName?: string;            // Cached name of Manager for display
  isSupervisor?: boolean;            // Whether employee acts as an operational/field supervisor
  supervisorId?: string;             // Associated operational supervisor ID (e.g. "SUP-001")
  legacySupervisorId?: string;       // Preserved legacy supervisor ID (e.g. "SUP-001")
  avatarUrl?: string;
  residentialAddress: string;
  emergencyContact: StaffEmergencyContact;
  salaryStructure: SalaryStructure;
  qualifications?: string[];         // e.g. ["B.Sc. Civil Eng (Hons)", "Chartered Engineer - IESL"]
  notes?: string;
  epfRegistrationNumber?: string;    // EPF Member No (e.g. "EMA/EPF/1042")
  nicNo?: string;                    // Alias / standard NIC representation
  epfNo?: string;                    // Alias for EPF
  etfNo?: string;                    // ETF registration number
  salaryType?: 'Monthly' | 'Daily' | 'Hourly';
  epfEligible?: boolean;             // Whether subject to EPF contributions
  etfEligible?: boolean;             // Whether subject to ETF contributions
  otEligible?: boolean;              // Whether eligible for Overtime payment
  bankName?: string;                 // e.g. Commercial Bank
  bankAccountNo?: string;            // Account number
  profilePhotoUrl?: string;          // base64 / URL image
  jibbleMemberId?: string;           // Linked external Jibble Member ID
  createdAt: string;                 // ISO Date String
  updatedAt: string;                 // ISO Date String
}

export interface DerivedSupervisorView {
  id: string;                        // Staff ID or Supervisor ID
  staffId: string;                   // Canonical Staff ID in Master Directory
  employeeCode: string;
  SUPERVISOR_ID: string;             // e.g. "SUP-001"
  legacySupervisorId?: string;       // Preserved legacy supervisor ID
  SUPERVISOR_NAME: string;           // e.g. "BUDDIKA"
  FULL_NAME: string;
  PHONE: string;
  EMAIL: string;
  ACTIVE: boolean;
  OPENING_PETTY_CASH: number;
  CURRENT_BALANCE?: number;
  REMARKS: string;
  ASSIGNED_PROJECTS: string[];
  AVATAR_COLOR?: string;
  role: EmployeeRole;
  department: Department;
  designation: string;
}

export interface ReportingHierarchyNode {
  member: StaffMember;
  directReports: ReportingHierarchyNode[];
  level: number;
}

export interface StaffFilterState {
  searchQuery: string;
  department: string;                // "ALL" or Department name
  projectCode: string;               // "ALL" or projectCode
  role: string;                      // "ALL" or EmployeeRole
  status: string;                    // "ALL" or StaffStatus
  employmentType: string;            // "ALL" or EmploymentType
  supervisorOnly?: boolean;          // If true, filter only employees acting as supervisors
  reportsToId?: string;              // "ALL" or manager ID
}

export interface StaffSummaryStats {
  totalStaff: number;
  activeStaff: number;
  onLeaveStaff: number;
  siteAllocatedStaff: number;
  headOfficeStaff: number;
  totalMonthlyPayroll: number;       // LKR sum of basic + allowances
  departmentBreakdown: Record<Department, number>;
  projectBreakdown: Record<string, number>;
}
