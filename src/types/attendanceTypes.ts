export type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Half Day'
  | 'Annual Leave'
  | 'Sick Leave'
  | 'Emergency Leave'
  | 'No-Pay Leave'
  | 'Holiday'
  | 'Off Day'
  | 'Late'
  | 'Early Departure'
  | 'OT';

export type SyncStatus = 'SYNCED' | 'PENDING_SYNC' | 'SYNC_ERROR' | 'NOT_APPLICABLE';
export type GeofenceStatus = 'INSIDE' | 'OUTSIDE' | 'NOT_EVALUATED';
export type FaceVerificationStatus = 'PASSED' | 'FAILED' | 'NOT_REQUIRED';
export type AttendanceRecordSource = 'JIBBLE' | 'MANUAL';

export interface AttendanceRecord {
  id: string;
  attendanceId: string;                 // "ATT-2026-0001"
  employeeId: string;                   // FK to StaffMember.id
  projectId: string;                    // Associated project
  allocationId: string;                 // Active allocation at date of punch

  recordSource: AttendanceRecordSource; // 'JIBBLE' | 'MANUAL'

  date: string;                         // YYYY-MM-DD
  punchIn?: string;                     // HH:mm:ss or ISO
  punchOut?: string;                    // HH:mm:ss or ISO
  checkInLat?: number;
  checkInLng?: number;
  checkOutLat?: number;
  checkOutLng?: number;
  gpsAccuracy?: number;
  geofenceStatus: GeofenceStatus;
  faceVerificationStatus: FaceVerificationStatus;

  jibbleMemberId?: string;
  jibbleTimeEntryId?: string;           // Used for duplicate-prevention; undefined if MANUAL

  workingHours?: number;
  regularHours?: number;
  otHours?: number;

  status: AttendanceStatus;
  syncStatus: SyncStatus;

  supervisorApproval?: 'PENDING' | 'APPROVED' | 'REJECTED';
  hrApproval?: 'PENDING' | 'APPROVED' | 'REJECTED';

  enteredBy?: string;                   // employeeId of entering supervisor/HR if MANUAL
  remarks?: string;

  createdAt: string;
  updatedAt: string;
}

export interface AttendanceCorrectionRequest {
  id: string;
  correctionId: string;                 // "CORR-2026-0001"
  attendanceId: string;                 // FK to original AttendanceRecord.id (immutable original)
  employeeId: string;
  originalValue: Partial<AttendanceRecord>;
  requestedValue: Partial<AttendanceRecord>;
  reason: string;
  attachmentUrl?: string;
  requestedBy: string;                  // employeeId
  supervisorApproval: 'PENDING' | 'APPROVED' | 'REJECTED';
  supervisorRemarks?: string;
  hrApproval: 'PENDING' | 'APPROVED' | 'REJECTED';
  hrRemarks?: string;
  finalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  resolvedAt?: string;
}
