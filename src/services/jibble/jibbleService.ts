import { JibbleEmployeeMapping, JibbleSyncLog, JibbleSyncConfig } from '../../types/jibbleTypes';
import { StaffMember } from '../../types/staffTypes';
import { AttendanceRecord } from '../../types/attendanceTypes';
import { AuditService } from '../audit/auditService';

const JIBBLE_MAPPINGS_KEY = 'ema_jibble_mappings_v1';
const JIBBLE_LOGS_KEY = 'ema_jibble_sync_logs_v1';

export class JibbleService {
  public static getMappings(): JibbleEmployeeMapping[] {
    try {
      const raw = localStorage.getItem(JIBBLE_MAPPINGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load Jibble mappings:', e);
    }
    return [];
  }

  public static saveMappings(mappings: JibbleEmployeeMapping[]): void {
    try {
      localStorage.setItem(JIBBLE_MAPPINGS_KEY, JSON.stringify(mappings));
    } catch (e) {
      console.error('Failed to save Jibble mappings:', e);
    }
  }

  public static getSyncLogs(): JibbleSyncLog[] {
    try {
      const raw = localStorage.getItem(JIBBLE_LOGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load Jibble logs:', e);
    }
    return [];
  }

  public static addSyncLog(log: JibbleSyncLog): void {
    try {
      const current = this.getSyncLogs();
      const updated = [log, ...current].slice(0, 100);
      localStorage.setItem(JIBBLE_LOGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save sync log:', e);
    }
  }

  public static async fetchConfig(): Promise<JibbleSyncConfig> {
    try {
      const res = await fetch('/api/jibble/config');
      if (res.ok) {
        const data = await res.json();
        const mappings = this.getMappings();
        const logs = this.getSyncLogs();
        const lastLog = logs[0];

        return {
          apiKeyConfigured: data.apiKeyConfigured,
          autoSyncEnabled: true,
          syncIntervalMinutes: 30,
          lastSyncedAt: lastLog ? lastLog.completedAt || lastLog.startedAt : undefined,
          lastSyncStatus: lastLog ? lastLog.status : undefined,
          totalMappedEmployees: mappings.filter(m => m.status === 'ACTIVE').length
        };
      }
    } catch (e) {
      console.warn('Could not fetch server Jibble config:', e);
    }

    const mappings = this.getMappings();
    return {
      apiKeyConfigured: false,
      autoSyncEnabled: false,
      syncIntervalMinutes: 30,
      totalMappedEmployees: mappings.filter(m => m.status === 'ACTIVE').length
    };
  }

  public static async syncEmployees(staffList: StaffMember[], currentUserId: string = 'system'): Promise<{
    success: boolean;
    syncedCount: number;
    log: JibbleSyncLog;
  }> {
    const startedAt = new Date().toISOString();
    const logId = `sync-emp-${Date.now()}`;

    try {
      const res = await fetch('/api/jibble/sync-employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employees: staffList.map(s => ({
            id: s.id,
            employeeCode: s.employeeCode,
            fullName: s.fullName,
            preferredName: s.preferredName,
            email: s.email,
            jibbleMemberId: s.jibbleMemberId
          }))
        })
      });

      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const currentMappings = this.getMappings();
      const newMappings: JibbleEmployeeMapping[] = [...currentMappings];

      if (data.mappedMembers && Array.isArray(data.mappedMembers)) {
        data.mappedMembers.forEach((mm: any) => {
          const existingIdx = newMappings.findIndex(m => m.employeeId === mm.employeeId);
          if (existingIdx >= 0) {
            newMappings[existingIdx] = {
              ...newMappings[existingIdx],
              jibbleMemberId: mm.jibbleMemberId,
              status: 'ACTIVE',
              linkedAt: mm.syncedAt
            };
          } else {
            newMappings.push({
              id: `map-${Date.now()}-${mm.employeeId}`,
              employeeId: mm.employeeId,
              jibbleMemberId: mm.jibbleMemberId,
              status: 'ACTIVE',
              linkedAt: mm.syncedAt,
              linkedBy: currentUserId
            });
          }
        });
        this.saveMappings(newMappings);
      }

      const logEntry: JibbleSyncLog = {
        id: logId,
        syncType: 'EMPLOYEE',
        startedAt,
        completedAt: new Date().toISOString(),
        status: 'SUCCESS',
        recordsProcessed: data.processedCount || staffList.length,
        recordsFailed: 0,
        errors: [],
        triggeredBy: 'MANUAL',
        triggeredByUserId: currentUserId
      };

      this.addSyncLog(logEntry);

      AuditService.log({
        enterpriseId: 'ema-constructions-lk',
        userId: currentUserId,
        userName: 'Admin',
        userRole: 'admin',
        action: 'SYNC',
        module: 'JIBBLE_SYNC',
        recordId: logId,
        details: `Synchronized ${data.processedCount || staffList.length} employees with Jibble`
      });

      return { success: true, syncedCount: data.processedCount || staffList.length, log: logEntry };
    } catch (error: any) {
      const failedLog: JibbleSyncLog = {
        id: logId,
        syncType: 'EMPLOYEE',
        startedAt,
        completedAt: new Date().toISOString(),
        status: 'FAILED',
        recordsProcessed: 0,
        recordsFailed: staffList.length,
        errors: [{ message: error?.message || 'Sync request failed' }],
        triggeredBy: 'MANUAL',
        triggeredByUserId: currentUserId
      };

      this.addSyncLog(failedLog);
      return { success: false, syncedCount: 0, log: failedLog };
    }
  }

  public static async pullAttendance(params: {
    startDate: string;
    endDate: string;
    employeeIds: string[];
    currentUserId?: string;
  }): Promise<{
    success: boolean;
    entries: AttendanceRecord[];
    log: JibbleSyncLog;
  }> {
    const startedAt = new Date().toISOString();
    const logId = `sync-att-${Date.now()}`;

    try {
      const res = await fetch('/api/jibble/sync-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const rawEntries = data.entries || [];

      const formattedRecords: AttendanceRecord[] = rawEntries.map((re: any, idx: number) => ({
        id: `att-jbl-${Date.now()}-${idx}`,
        attendanceId: `ATT-${params.startDate.slice(0, 4)}-${(idx + 1).toString().padStart(4, '0')}`,
        employeeId: re.employeeId,
        projectId: 'PIDM 26',
        allocationId: `alloc-${re.employeeId}`,
        recordSource: 'JIBBLE',
        date: re.date,
        punchIn: re.punchIn,
        punchOut: re.punchOut,
        checkInLat: re.checkInLat,
        checkInLng: re.checkInLng,
        checkOutLat: re.checkOutLat,
        checkOutLng: re.checkOutLng,
        gpsAccuracy: re.gpsAccuracy,
        geofenceStatus: re.geofenceStatus || 'INSIDE',
        faceVerificationStatus: re.faceVerificationStatus || 'PASSED',
        jibbleMemberId: re.jibbleMemberId,
        jibbleTimeEntryId: re.jibbleTimeEntryId,
        workingHours: re.workingHours || 8.5,
        regularHours: re.regularHours || 8.0,
        otHours: re.otHours || 0.5,
        status: re.status || 'Present',
        syncStatus: 'SYNCED',
        supervisorApproval: 'APPROVED',
        hrApproval: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      const logEntry: JibbleSyncLog = {
        id: logId,
        syncType: 'ATTENDANCE',
        startedAt,
        completedAt: new Date().toISOString(),
        status: 'SUCCESS',
        recordsProcessed: formattedRecords.length,
        recordsFailed: 0,
        errors: [],
        triggeredBy: 'MANUAL',
        triggeredByUserId: params.currentUserId || 'system'
      };

      this.addSyncLog(logEntry);

      AuditService.log({
        enterpriseId: 'ema-constructions-lk',
        userId: params.currentUserId || 'system',
        userName: 'Admin',
        userRole: 'admin',
        action: 'SYNC',
        module: 'JIBBLE_SYNC',
        recordId: logId,
        details: `Pulled ${formattedRecords.length} attendance punches from Jibble for ${params.startDate} to ${params.endDate}`
      });

      return { success: true, entries: formattedRecords, log: logEntry };
    } catch (error: any) {
      const failedLog: JibbleSyncLog = {
        id: logId,
        syncType: 'ATTENDANCE',
        startedAt,
        completedAt: new Date().toISOString(),
        status: 'FAILED',
        recordsProcessed: 0,
        recordsFailed: params.employeeIds.length,
        errors: [{ message: error?.message || 'Attendance sync error' }],
        triggeredBy: 'MANUAL',
        triggeredByUserId: params.currentUserId || 'system'
      };

      this.addSyncLog(failedLog);
      return { success: false, entries: [], log: failedLog };
    }
  }

  public static linkEmployee(employeeId: string, jibbleMemberId: string, linkedBy: string): JibbleEmployeeMapping {
    const mappings = this.getMappings();
    const existingIdx = mappings.findIndex(m => m.employeeId === employeeId);

    const record: JibbleEmployeeMapping = {
      id: existingIdx >= 0 ? mappings[existingIdx].id : `map-${Date.now()}-${employeeId}`,
      employeeId,
      jibbleMemberId,
      status: 'ACTIVE',
      linkedAt: new Date().toISOString(),
      linkedBy
    };

    if (existingIdx >= 0) {
      mappings[existingIdx] = record;
    } else {
      mappings.push(record);
    }

    this.saveMappings(mappings);
    return record;
  }

  public static unlinkEmployee(employeeId: string): void {
    const mappings = this.getMappings().map(m => {
      if (m.employeeId === employeeId) {
        return {
          ...m,
          status: 'UNLINKED' as const,
          unlinkedAt: new Date().toISOString()
        };
      }
      return m;
    });

    this.saveMappings(mappings);
  }
}
