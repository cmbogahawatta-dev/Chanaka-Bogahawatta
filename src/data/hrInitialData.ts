import { StaffAllocation } from '../types/staffAllocationTypes';
import { ApprovalWorkflow } from '../types/approvalWorkflowTypes';
import { ProjectGeofence } from '../types/geofenceTypes';
import { JibbleEmployeeMapping } from '../types/jibbleTypes';
import { LeaveType, LeaveRequest } from '../types/leaveTypes';
import { PayrollRateSettings, SalaryHistoryEntry } from '../types/salaryHistoryTypes';
import { AttendanceRecord } from '../types/attendanceTypes';
import { OvertimeRecord } from '../types/overtimeTypes';
import { PayrollBatch } from '../types/payrollTypes';

export const initialApprovalWorkflows: ApprovalWorkflow[] = [
  {
    id: 'wf-leave-standard',
    name: 'Standard Site Staff Leave Workflow',
    appliesTo: 'LEAVE',
    description: 'Covers cover-up staff acceptance, immediate site supervisor endorsement, project manager review, and HR approval.',
    active: true,
    isDefault: true,
    levels: [
      {
        id: 'lvl-1',
        sequence: 1,
        levelType: 'COVER_UP',
        title: 'Cover-Up Staff Acceptance',
        mandatory: true,
        active: true
      },
      {
        id: 'lvl-2',
        sequence: 2,
        levelType: 'IMMEDIATE_SUPERVISOR',
        title: 'Immediate Site Supervisor Review',
        mandatory: true,
        active: true
      },
      {
        id: 'lvl-3',
        sequence: 3,
        levelType: 'PROJECT_MANAGER',
        title: 'Project Resident Manager Approval',
        mandatory: true,
        active: true
      },
      {
        id: 'lvl-4',
        sequence: 4,
        levelType: 'HR',
        title: 'HR Officer Final Verification',
        mandatory: true,
        active: true
      }
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'wf-leave-executive',
    name: 'Executive & Head Office Leave Workflow',
    appliesTo: 'LEAVE',
    description: 'Fast-track approval workflow for department heads and directors directly via HR and Owner.',
    active: true,
    isDefault: false,
    levels: [
      {
        id: 'lvl-ex-1',
        sequence: 1,
        levelType: 'DEPARTMENT_HEAD',
        title: 'Department Head Review',
        mandatory: true,
        active: true
      },
      {
        id: 'lvl-ex-2',
        sequence: 2,
        levelType: 'HR',
        title: 'HR Verification',
        mandatory: true,
        active: true
      },
      {
        id: 'lvl-ex-3',
        sequence: 3,
        levelType: 'OWNER',
        title: 'Executive Owner Approval',
        mandatory: true,
        active: true
      }
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'wf-attendance-correction',
    name: 'Attendance Missed-Punch & Geofence Correction Workflow',
    appliesTo: 'ATTENDANCE_CORRECTION',
    description: 'Site supervisor review followed by HR officer approval.',
    active: true,
    isDefault: true,
    levels: [
      {
        id: 'lvl-att-1',
        sequence: 1,
        levelType: 'IMMEDIATE_SUPERVISOR',
        title: 'Site Supervisor Endorsement',
        mandatory: true,
        active: true
      },
      {
        id: 'lvl-att-2',
        sequence: 2,
        levelType: 'HR',
        title: 'HR Verification',
        mandatory: true,
        active: true
      }
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'wf-payroll-master',
    name: 'Standard Monthly Payroll Approval Cycle',
    appliesTo: 'PAYROLL',
    description: 'HR computation -> Finance/Accounts review -> Managing Director / Owner bulk sign-off.',
    active: true,
    isDefault: true,
    levels: [
      {
        id: 'lvl-pay-1',
        sequence: 1,
        levelType: 'HR',
        title: 'HR Compilation & Validation',
        mandatory: true,
        active: true
      },
      {
        id: 'lvl-pay-2',
        sequence: 2,
        levelType: 'FINANCE',
        title: 'Accounts & Finance Verification',
        mandatory: true,
        active: true
      },
      {
        id: 'lvl-pay-3',
        sequence: 3,
        levelType: 'OWNER',
        title: 'Owner Final Approval & Bank Release',
        mandatory: true,
        active: true
      }
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  }
];

export const initialProjectGeofences: ProjectGeofence[] = [
  {
    id: 'gf-1',
    geofenceId: 'GF-0001',
    projectId: 'PIDM 26',
    siteName: 'PIDM 26 Main Road Project Yard (Ch 14+200)',
    latitude: 6.9271,
    longitude: 79.8612,
    radiusMeters: 300,
    activeFrom: '2026-01-01',
    status: 'Active',
    address: 'Ch 14+200 Base Camp, Western Province, Sri Lanka',
    createdBy: 'SYSTEM_ADMIN',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'gf-2',
    geofenceId: 'GF-0002',
    projectId: 'PIDM 28',
    siteName: 'PIDM 28 Highway Widening & Asphalt Batching Plant',
    latitude: 7.0840,
    longitude: 80.0098,
    radiusMeters: 400,
    activeFrom: '2026-01-01',
    status: 'Active',
    address: 'Gampaha Highway Link, Gampaha District',
    createdBy: 'SYSTEM_ADMIN',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'gf-3',
    geofenceId: 'GF-0003',
    projectId: 'PIDM 27',
    siteName: 'PIDM 27 Bridge & Culvert Construction Section',
    latitude: 7.2906,
    longitude: 80.6337,
    radiusMeters: 250,
    activeFrom: '2026-01-01',
    status: 'Active',
    address: 'Kandy Road Section, Central Province',
    createdBy: 'SYSTEM_ADMIN',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'gf-4',
    geofenceId: 'GF-0004',
    projectId: 'HEAD_OFFICE',
    siteName: 'EMA Constructions Corporate Head Office',
    latitude: 6.9147,
    longitude: 79.8778,
    radiusMeters: 150,
    activeFrom: '2026-01-01',
    status: 'Active',
    address: 'No 45/2 Nawala Road, Nugegoda, Colombo',
    createdBy: 'SYSTEM_ADMIN',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  }
];

export const initialLeaveTypes: LeaveType[] = [
  {
    id: 'lt-annual',
    name: 'Annual Leave',
    code: 'AL',
    paid: true,
    annualEntitlementDays: 14,
    carryForwardAllowed: true,
    maxCarryForwardDays: 7,
    requiresDocument: false,
    requiresCoverUp: true,
    workflowId: 'wf-leave-standard',
    color: '#3b82f6',
    active: true
  },
  {
    id: 'lt-casual',
    name: 'Casual Leave',
    code: 'CL',
    paid: true,
    annualEntitlementDays: 7,
    carryForwardAllowed: false,
    requiresDocument: false,
    requiresCoverUp: true,
    workflowId: 'wf-leave-standard',
    color: '#10b981',
    active: true
  },
  {
    id: 'lt-sick',
    name: 'Sick / Medical Leave',
    code: 'SL',
    paid: true,
    annualEntitlementDays: 7,
    carryForwardAllowed: false,
    requiresDocument: true,
    requiresCoverUp: false,
    workflowId: 'wf-leave-standard',
    color: '#f59e0b',
    active: true
  },
  {
    id: 'lt-emergency',
    name: 'Emergency Leave',
    code: 'EL',
    paid: true,
    annualEntitlementDays: 3,
    carryForwardAllowed: false,
    requiresDocument: false,
    requiresCoverUp: false,
    workflowId: 'wf-leave-standard',
    color: '#ec4899',
    active: true
  },
  {
    id: 'lt-nopay',
    name: 'No-Pay Leave',
    code: 'NPL',
    paid: false,
    annualEntitlementDays: 0,
    carryForwardAllowed: false,
    requiresDocument: false,
    requiresCoverUp: true,
    workflowId: 'wf-leave-standard',
    color: '#ef4444',
    active: true
  },
  {
    id: 'lt-duty',
    name: 'Official Duty / Site Travel Leave',
    code: 'DL',
    paid: true,
    annualEntitlementDays: 30,
    carryForwardAllowed: false,
    requiresDocument: false,
    requiresCoverUp: false,
    workflowId: 'wf-leave-standard',
    color: '#8b5cf6',
    active: true
  }
];

export const initialPayrollRateSettings: PayrollRateSettings = {
  id: 'rates-2026-v1',
  epfEmployeeRate: 0.08,
  epfEmployerRate: 0.12,
  etfEmployerRate: 0.03,
  standardMonthlyWorkingHours: 200,
  standardOvertimeMultiplier: 1.5,
  holidayOvertimeMultiplier: 2.0,
  apitBrackets: [
    { minMonthly: 0, maxMonthly: 150000, rate: 0.0 },
    { minMonthly: 150000, maxMonthly: 200000, rate: 0.06 },
    { minMonthly: 200000, maxMonthly: 250000, rate: 0.12 },
    { minMonthly: 250000, maxMonthly: 300000, rate: 0.18 },
    { minMonthly: 300000, maxMonthly: 350000, rate: 0.24 },
    { minMonthly: 350000, rate: 0.30 }
  ],
  effectiveFrom: '2026-01-01',
  updatedAt: '2026-01-01T00:00:00Z'
};
