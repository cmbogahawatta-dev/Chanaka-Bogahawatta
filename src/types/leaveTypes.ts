import { ApprovalLevelType } from './approvalWorkflowTypes';

export type LeaveStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'COVER_UP_PENDING'
  | 'COVER_UP_REJECTED'
  | 'SUPERVISOR_PENDING'
  | 'MANAGER_PENDING'
  | 'HR_PENDING'
  | 'OWNER_PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'RETURNED'
  | 'WITHDRAWN'
  | 'CANCELLED';

export type LeaveRecordSource = 'JIBBLE' | 'EMA_NATIVE';

export interface LeaveType {
  id: string;
  name: string;                         // 'Annual Leave' | 'Casual Leave' | 'Sick Leave' | 'Emergency Leave' | 'No-Pay Leave' | 'Duty Leave' | 'Maternity Leave'
  code: string;                         // 'AL', 'CL', 'SL', 'EL', 'NPL', 'DL', 'ML'
  paid: boolean;
  annualEntitlementDays: number;
  carryForwardAllowed: boolean;
  maxCarryForwardDays?: number;
  requiresDocument: boolean;
  requiresCoverUp: boolean;
  workflowId?: string;                  // FK to ApprovalWorkflow.id
  color: string;
  active: boolean;
}

export interface CoverUpRequest {
  id: string;
  leaveRequestId: string;
  nominatedEmployeeId: string;          // FK to StaffMember.id — never free text
  nominatedEmployeeName?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  requestedAt: string;
  respondedAt?: string;
  responseRemarks?: string;
}

export interface LeaveApprovalStep {
  levelType: ApprovalLevelType;
  sequence: number;
  title: string;
  approverEmployeeId: string;           // Resolved at submission from active allocation/workflow
  approverName?: string;
  approverRole?: string;
  decision: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  decidedAt?: string;
  remarks?: string;
}

export interface LeaveRequest {
  id: string;
  leaveRequestId: string;               // "LV-2026-0042"
  employeeId: string;                   // FK to StaffMember.id
  allocationId: string;                 // Locks in the active allocation at submission
  leaveTypeId: string;                  // FK to LeaveType.id
  leaveTypeName?: string;

  recordSource: LeaveRecordSource;      // 'JIBBLE' | 'EMA_NATIVE'
  jibbleLeaveEntryId?: string;          // Set only when source = 'JIBBLE'

  startDate: string;                    // YYYY-MM-DD
  endDate: string;                      // YYYY-MM-DD
  workingDays: number;                  // Computed, excludes off-days & public holidays
  isHalfDay?: boolean;
  halfDayPeriod?: 'FIRST_HALF' | 'SECOND_HALF';
  reason: string;
  attachmentUrl?: string;
  coverUpRequestId?: string;
  coverUpStatus?: 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
  status: LeaveStatus;
  approvalTrail: LeaveApprovalStep[];
  currentStepIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalanceSummary {
  employeeId: string;
  leaveTypeId: string;
  leaveTypeName: string;
  entitlement: number;
  used: number;
  pending: number;
  available: number;
  paid: boolean;
}
