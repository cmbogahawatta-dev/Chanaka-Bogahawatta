export interface StaffAllocation {
  id: string;
  allocationId: string;              // "ALLOC-0001"
  employeeId: string;                // FK to StaffMember.id — never free text

  projectId: string;                 // FK to Project.id (e.g. "PIDM 26")
  site?: string;
  department: string;
  designation: string;

  effectiveFrom: string;             // YYYY-MM-DD
  effectiveTo?: string;              // undefined = current/active

  immediateSupervisorId?: string;    // FK to StaffMember.id
  projectManagerId?: string;         // FK to StaffMember.id
  departmentHeadId?: string;         // FK to StaffMember.id
  hrResponsibleId?: string;          // FK to StaffMember.id
  finalApproverId?: string;          // FK to StaffMember.id

  approvalWorkflowId?: string;       // FK to ApprovalWorkflow.id

  attendanceRequired: boolean;
  jibbleAttendanceRequired: boolean;
  faceVerificationRequired: boolean;
  gpsRequired: boolean;
  geofenceRequired: boolean;

  status: 'Active' | 'Superseded' | 'Ended';
  remarks?: string;

  createdAt: string;
  updatedAt: string;
}

export interface StaffAllocationFilter {
  searchQuery: string;
  projectId: string;
  department: string;
  status: string; // 'ALL' | 'Active' | 'Superseded' | 'Ended'
  supervisorId: string;
}
