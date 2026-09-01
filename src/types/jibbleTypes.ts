export interface JibbleEmployeeMapping {
  id: string;
  employeeId: string;         // FK to StaffMember.id — the authoritative identity
  jibbleMemberId: string;     // Jibble internal member ID
  jibbleMemberEmail?: string; // Display/matching email
  jibbleMemberName?: string;  // Display name in Jibble
  status: 'ACTIVE' | 'UNLINKED';
  linkedAt: string;
  linkedBy: string;
  unlinkedAt?: string;
}

export interface JibbleSyncLog {
  id: string;
  syncType: 'EMPLOYEE' | 'ATTENDANCE' | 'LEAVE';
  startedAt: string;
  completedAt?: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  recordsProcessed: number;
  recordsFailed: number;
  errors: { employeeId?: string; jibbleMemberId?: string; message: string }[];
  triggeredBy: 'SCHEDULED' | 'MANUAL';
  triggeredByUserId?: string;
}

export interface JibbleSyncConfig {
  apiKeyConfigured: boolean;
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
  lastSyncedAt?: string;
  lastSyncStatus?: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  totalMappedEmployees: number;
}
