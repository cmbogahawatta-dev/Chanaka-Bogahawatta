export interface OvertimeRecord {
  id: string;
  otId: string;                         // "OT-2026-0001"
  employeeId: string;                   // FK to StaffMember.id
  attendanceId: string;                 // FK to AttendanceRecord.id
  date: string;                         // YYYY-MM-DD
  hours: number;                        // OT hours (e.g. 2.5)
  claimedHours?: number;
  hourlyRate?: number;                  // LKR computed from basic salary / 200 * multiplier
  multiplier: number;                   // Standard 1.5x (normal OT) or 2.0x (Sunday/Holiday)
  rateMultiplier?: number;
  totalAmount?: number;                 // LKR
  source: 'AUTO_CALCULATED' | 'MANUAL_REQUEST';
  reason?: string;
  taskDescription?: string;
  projectId?: string;
  dayType?: string;
  supervisorApproval: 'PENDING' | 'APPROVED' | 'REJECTED';
  supervisorApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  supervisorRemarks?: string;
  hrApproval: 'PENDING' | 'APPROVED' | 'REJECTED';
  hrApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  hrRemarks?: string;
  finalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; // Ready for payroll when both supervisor & HR approve
  createdAt: string;
  updatedAt: string;
}
