export type ApprovalLevelType =
  | 'COVER_UP'
  | 'IMMEDIATE_SUPERVISOR'
  | 'PROJECT_MANAGER'
  | 'DEPARTMENT_HEAD'
  | 'HR'
  | 'FINANCE'
  | 'OWNER'
  | 'CUSTOM';

export interface ApprovalWorkflowLevel {
  id: string;
  sequence: number;
  levelType: ApprovalLevelType;
  approverEmployeeId?: string;       // only set for CUSTOM; other types resolve dynamically from active allocation
  mandatory: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  active: boolean;
  title?: string;                    // e.g. "Site Supervisor Review", "HR Verification"
}

export interface ApprovalWorkflow {
  id: string;
  name: string;
  appliesTo: 'LEAVE' | 'PAYROLL' | 'ATTENDANCE_CORRECTION';
  description?: string;
  levels: ApprovalWorkflowLevel[];
  active: boolean;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}
