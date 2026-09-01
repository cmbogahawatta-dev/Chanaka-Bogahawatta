import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  AttendanceRecord,
  AttendanceCorrectionRequest,
  AttendanceStatus
} from '../types/attendanceTypes';
import { OvertimeRecord } from '../types/overtimeTypes';
import { useStaff } from './StaffContext';
import { useStaffAllocation } from './StaffAllocationContext';
import { AuditService } from '../services/audit/auditService';

const ATTENDANCE_STORAGE_KEY = 'ema_attendance_records_v1';
const CORRECTIONS_STORAGE_KEY = 'ema_attendance_corrections_v1';
const OVERTIME_STORAGE_KEY = 'ema_overtime_records_v1';

interface AttendanceContextType {
  attendanceRecords: AttendanceRecord[];
  correctionRequests: AttendanceCorrectionRequest[];
  overtimeRecords: OvertimeRecord[];
  
  // Manual Attendance (Section 14a)
  addManualAttendance: (
    data: {
      employeeId: string;
      projectId: string;
      date: string;
      punchIn: string;
      punchOut: string;
      status?: AttendanceStatus;
      enteredBy: string;
      remarks?: string;
    }
  ) => AttendanceRecord;

  // Jibble Sync Ingestion with de-duplication
  ingestSyncedAttendance: (records: AttendanceRecord[]) => number;

  // Attendance Corrections (Section 15)
  requestCorrection: (
    attendanceId: string,
    employeeId: string,
    requestedChanges: Partial<AttendanceRecord>,
    reason: string,
    attachmentUrl?: string
  ) => AttendanceCorrectionRequest;
  
  approveCorrection: (
    correctionId: string,
    level: 'SUPERVISOR' | 'HR',
    approverId: string,
    remarks?: string
  ) => void;
  
  rejectCorrection: (
    correctionId: string,
    level: 'SUPERVISOR' | 'HR',
    approverId: string,
    remarks?: string
  ) => void;

  // Approvals
  approveAttendanceBySupervisor: (attendanceId: string, approverId: string) => void;
  approveAttendanceByHr: (attendanceId: string, approverId: string) => void;

  // Overtime Management (Section 20)
  addManualOvertime: (
    data: {
      employeeId: string;
      attendanceId?: string;
      date: string;
      hours: number;
      multiplier?: number;
      reason: string;
    }
  ) => OvertimeRecord;
  approveOvertime: (otId: string, level: 'SUPERVISOR' | 'HR', approverId: string, remarks?: string) => void;
  approveOvertimeBySupervisor: (otId: string, approverId: string, remarks?: string) => void;
  approveOvertimeByHr: (otId: string, approverId: string, hours?: number, remarks?: string) => void;
  rejectOvertime: (otId: string, level: 'SUPERVISOR' | 'HR', approverId: string, remarks?: string) => void;

  // Query helpers
  getRecordsForEmployee: (employeeId: string, monthPrefix?: string) => AttendanceRecord[];
  getApprovedOvertimeForEmployee: (employeeId: string, monthPrefix: string) => OvertimeRecord[];
  clearAttendanceHistory: () => void;
  clearOvertimeHistory: () => void;
  resetAttendanceData: () => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

// Helper to compute hours between two HH:mm strings
function calculateHours(punchIn?: string, punchOut?: string): { workingHours: number; regularHours: number; otHours: number } {
  if (!punchIn || !punchOut) return { workingHours: 0, regularHours: 0, otHours: 0 };
  const [inH, inM] = punchIn.split(':').map(Number);
  const [outH, outM] = punchOut.split(':').map(Number);
  const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
  if (totalMinutes <= 0) return { workingHours: 0, regularHours: 0, otHours: 0 };
  const workingHours = Math.round((totalMinutes / 60) * 10) / 10;
  const regularHours = Math.min(8.0, workingHours);
  const otHours = Math.max(0, Math.round((workingHours - 8.0) * 10) / 10);
  return { workingHours, regularHours, otHours };
}

export const AttendanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { staffMembers } = useStaff();
  const { getCurrentAllocation } = useStaffAllocation();

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading attendance:', e);
    }
    return [];
  });

  const [correctionRequests, setCorrectionRequests] = useState<AttendanceCorrectionRequest[]>(() => {
    try {
      const saved = localStorage.getItem(CORRECTIONS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading corrections:', e);
    }
    return [];
  });

  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>(() => {
    try {
      const saved = localStorage.getItem(OVERTIME_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading overtime:', e);
    }
    return [];
  });

  // Seed sample attendance & overtime for current month if empty
  useEffect(() => {
    if (attendanceRecords.length === 0 && staffMembers.length > 0) {
      const seededAttendance: AttendanceRecord[] = [];
      const seededOt: OvertimeRecord[] = [];

      // Seed past 10 working days of August 2026
      const dates = [
        '2026-08-17',
        '2026-08-18',
        '2026-08-19',
        '2026-08-20',
        '2026-08-21',
        '2026-08-24',
        '2026-08-25',
        '2026-08-26',
        '2026-08-27',
        '2026-08-28'
      ];

      let recIdx = 1;
      let otIdx = 1;

      staffMembers.slice(0, 10).forEach(emp => {
        dates.forEach(date => {
          const isLate = Math.random() < 0.15;
          const punchIn = isLate ? '08:45:00' : '08:00:00';
          const hasOt = Math.random() < 0.35;
          const punchOut = hasOt ? '19:30:00' : '17:00:00';
          const { workingHours, regularHours, otHours } = calculateHours(punchIn, punchOut);

          const attId = `ATT-2026-${recIdx.toString().padStart(4, '0')}`;
          const attRecordId = `att-seed-${recIdx}`;

          const newAtt: AttendanceRecord = {
            id: attRecordId,
            attendanceId: attId,
            employeeId: emp.id,
            projectId: emp.assignedProjectCode || 'PIDM 26',
            allocationId: `alloc-${emp.id}`,
            recordSource: 'JIBBLE',
            date,
            punchIn,
            punchOut,
            checkInLat: 6.9271,
            checkInLng: 79.8612,
            checkOutLat: 6.9271,
            checkOutLng: 79.8612,
            gpsAccuracy: 6,
            geofenceStatus: 'INSIDE',
            faceVerificationStatus: 'PASSED',
            jibbleMemberId: emp.jibbleMemberId || `jbl-${emp.employeeCode}`,
            jibbleTimeEntryId: `jbl-time-${emp.id}-${date}`,
            workingHours,
            regularHours,
            otHours,
            status: isLate ? 'Late' : 'Present',
            syncStatus: 'SYNCED',
            supervisorApproval: 'APPROVED',
            hrApproval: 'APPROVED',
            createdAt: `${date}T17:05:00Z`,
            updatedAt: `${date}T17:05:00Z`
          };

          seededAttendance.push(newAtt);

          if (hasOt && otHours > 0) {
            const otId = `OT-2026-${otIdx.toString().padStart(4, '0')}`;
            const basic = emp.salaryStructure?.basicSalary || 85000;
            const hourlyRate = Math.round((basic / 200) * 1.5);

            seededOt.push({
              id: `ot-seed-${otIdx}`,
              otId,
              employeeId: emp.id,
              attendanceId: attRecordId,
              date,
              hours: otHours,
              multiplier: 1.5,
              hourlyRate,
              totalAmount: Math.round(hourlyRate * otHours),
              source: 'AUTO_CALCULATED',
              reason: 'Concrete casting and road compaction overtime',
              supervisorApproval: 'APPROVED',
              hrApproval: 'APPROVED',
              status: 'APPROVED',
              createdAt: `${date}T19:35:00Z`,
              updatedAt: `${date}T19:35:00Z`
            });

            otIdx++;
          }

          recIdx++;
        });
      });

      setAttendanceRecords(seededAttendance);
      setOvertimeRecords(seededOt);
      try {
        localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(seededAttendance));
        localStorage.setItem(OVERTIME_STORAGE_KEY, JSON.stringify(seededOt));
      } catch (e) {
        console.error('Failed to seed attendance data:', e);
      }
    }
  }, [staffMembers, attendanceRecords.length]);

  const saveAttendance = (records: AttendanceRecord[]) => {
    setAttendanceRecords(records);
    try {
      localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save attendance:', e);
    }
  };

  const saveCorrections = (corrections: AttendanceCorrectionRequest[]) => {
    setCorrectionRequests(corrections);
    try {
      localStorage.setItem(CORRECTIONS_STORAGE_KEY, JSON.stringify(corrections));
    } catch (e) {
      console.error('Failed to save corrections:', e);
    }
  };

  const saveOvertime = (ot: OvertimeRecord[]) => {
    setOvertimeRecords(ot);
    try {
      localStorage.setItem(OVERTIME_STORAGE_KEY, JSON.stringify(ot));
    } catch (e) {
      console.error('Failed to save overtime:', e);
    }
  };

  /**
   * Manual Attendance Entry (Section 14a)
   */
  const addManualAttendance = (data: {
    employeeId: string;
    projectId: string;
    date: string;
    punchIn: string;
    punchOut: string;
    status?: AttendanceStatus;
    enteredBy: string;
    remarks?: string;
  }): AttendanceRecord => {
    const nextSeq = attendanceRecords.length + 1;
    const year = data.date.slice(0, 4) || '2026';
    const attendanceId = `ATT-${year}-${nextSeq.toString().padStart(4, '0')}`;
    const id = `att-manual-${Date.now()}`;
    const allocation = getCurrentAllocation(data.employeeId);

    const { workingHours, regularHours, otHours } = calculateHours(data.punchIn, data.punchOut);

    const newRecord: AttendanceRecord = {
      id,
      attendanceId,
      employeeId: data.employeeId,
      projectId: data.projectId,
      allocationId: allocation?.id || `alloc-${data.employeeId}`,
      recordSource: 'MANUAL',
      date: data.date,
      punchIn: data.punchIn,
      punchOut: data.punchOut,
      geofenceStatus: 'NOT_EVALUATED',
      faceVerificationStatus: 'NOT_REQUIRED',
      workingHours,
      regularHours,
      otHours,
      status: data.status || 'Present',
      syncStatus: 'NOT_APPLICABLE',
      supervisorApproval: 'APPROVED', // Manual entries require supervisor sign-off at creation
      hrApproval: 'PENDING',
      enteredBy: data.enteredBy,
      remarks: data.remarks || 'Manually logged by supervisor/HR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newRecord, ...attendanceRecords];
    saveAttendance(updated);

    // If OT generated, auto-create unapproved OT record
    if (otHours > 0) {
      const otSeq = overtimeRecords.length + 1;
      const otRecord: OvertimeRecord = {
        id: `ot-${Date.now()}`,
        otId: `OT-${year}-${otSeq.toString().padStart(4, '0')}`,
        employeeId: data.employeeId,
        attendanceId: id,
        date: data.date,
        hours: otHours,
        multiplier: 1.5,
        source: 'AUTO_CALCULATED',
        reason: data.remarks || 'Manual punch generated overtime',
        supervisorApproval: 'APPROVED',
        hrApproval: 'PENDING',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveOvertime([otRecord, ...overtimeRecords]);
    }

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: data.enteredBy,
      userName: 'Supervisor/HR',
      userRole: 'admin',
      action: 'CREATE',
      module: 'ATTENDANCE',
      recordId: attendanceId,
      details: `Created manual attendance for Employee ${data.employeeId} on ${data.date}`
    });

    return newRecord;
  };

  /**
   * Jibble Synced Attendance Ingestion with deduplication
   */
  const ingestSyncedAttendance = (syncedEntries: AttendanceRecord[]): number => {
    let insertedCount = 0;
    const current = [...attendanceRecords];

    syncedEntries.forEach(incoming => {
      // Check duplicate on jibbleTimeEntryId or date+employeeId
      const exists = current.some(
        c =>
          (incoming.jibbleTimeEntryId && c.jibbleTimeEntryId === incoming.jibbleTimeEntryId) ||
          (c.employeeId === incoming.employeeId && c.date === incoming.date)
      );

      if (!exists) {
        current.unshift(incoming);
        insertedCount++;

        // If OT present in synced log, register OT record
        if (incoming.otHours && incoming.otHours > 0) {
          const otSeq = overtimeRecords.length + 1;
          const otRecord: OvertimeRecord = {
            id: `ot-jbl-${Date.now()}-${insertedCount}`,
            otId: `OT-${incoming.date.slice(0, 4)}-${otSeq.toString().padStart(4, '0')}`,
            employeeId: incoming.employeeId,
            attendanceId: incoming.id,
            date: incoming.date,
            hours: incoming.otHours,
            multiplier: 1.5,
            source: 'AUTO_CALCULATED',
            reason: 'Synced from Jibble punch log',
            supervisorApproval: 'APPROVED',
            hrApproval: 'PENDING',
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setOvertimeRecords(prev => [otRecord, ...prev]);
        }
      }
    });

    if (insertedCount > 0) {
      saveAttendance(current);
    }

    return insertedCount;
  };

  /**
   * Attendance Correction Request (Section 15)
   */
  const requestCorrection = (
    attendanceId: string,
    employeeId: string,
    requestedChanges: Partial<AttendanceRecord>,
    reason: string,
    attachmentUrl?: string
  ): AttendanceCorrectionRequest => {
    const original = attendanceRecords.find(a => a.id === attendanceId || a.attendanceId === attendanceId);
    const nextSeq = correctionRequests.length + 1;
    const correctionId = `CORR-${new Date().getFullYear()}-${nextSeq.toString().padStart(4, '0')}`;

    const newCorrection: AttendanceCorrectionRequest = {
      id: `corr-${Date.now()}`,
      correctionId,
      attendanceId: original?.id || attendanceId,
      employeeId,
      originalValue: original ? { ...original } : {},
      requestedValue: requestedChanges,
      reason,
      attachmentUrl,
      requestedBy: employeeId,
      supervisorApproval: 'PENDING',
      hrApproval: 'PENDING',
      finalStatus: 'PENDING',
      createdAt: new Date().toISOString()
    };

    const updated = [newCorrection, ...correctionRequests];
    saveCorrections(updated);

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: employeeId,
      userName: 'Employee',
      userRole: 'viewer',
      action: 'CORRECTION',
      module: 'ATTENDANCE',
      recordId: correctionId,
      details: `Submitted attendance correction request for attendance ${attendanceId}: ${reason}`
    });

    return newCorrection;
  };

  const approveCorrection = (
    correctionId: string,
    level: 'SUPERVISOR' | 'HR',
    approverId: string,
    remarks?: string
  ) => {
    const updatedCorrections = correctionRequests.map(c => {
      if (c.id === correctionId || c.correctionId === correctionId) {
        const nextSup = level === 'SUPERVISOR' ? 'APPROVED' : c.supervisorApproval;
        const nextHr = level === 'HR' ? 'APPROVED' : c.hrApproval;
        const isFinal = nextSup === 'APPROVED' && nextHr === 'APPROVED';

        return {
          ...c,
          supervisorApproval: nextSup as any,
          supervisorRemarks: level === 'SUPERVISOR' ? remarks : c.supervisorRemarks,
          hrApproval: nextHr as any,
          hrRemarks: level === 'HR' ? remarks : c.hrRemarks,
          finalStatus: isFinal ? ('APPROVED' as const) : c.finalStatus,
          resolvedAt: isFinal ? new Date().toISOString() : c.resolvedAt
        };
      }
      return c;
    });

    saveCorrections(updatedCorrections);

    // If fully approved, apply derived values to attendance record
    const target = updatedCorrections.find(c => c.id === correctionId || c.correctionId === correctionId);
    if (target && target.finalStatus === 'APPROVED') {
      const updatedAttendance = attendanceRecords.map(att => {
        if (att.id === target.attendanceId || att.attendanceId === target.attendanceId) {
          const newIn = target.requestedValue.punchIn || att.punchIn;
          const newOut = target.requestedValue.punchOut || att.punchOut;
          const { workingHours, regularHours, otHours } = calculateHours(newIn, newOut);

          return {
            ...att,
            ...target.requestedValue,
            workingHours,
            regularHours,
            otHours,
            remarks: `${att.remarks || ''} [Corrected via ${target.correctionId}]`.trim(),
            updatedAt: new Date().toISOString()
          };
        }
        return att;
      });

      saveAttendance(updatedAttendance);
    }
  };

  const rejectCorrection = (
    correctionId: string,
    level: 'SUPERVISOR' | 'HR',
    approverId: string,
    remarks?: string
  ) => {
    const updatedCorrections = correctionRequests.map(c => {
      if (c.id === correctionId || c.correctionId === correctionId) {
        return {
          ...c,
          supervisorApproval: level === 'SUPERVISOR' ? ('REJECTED' as const) : c.supervisorApproval,
          supervisorRemarks: level === 'SUPERVISOR' ? remarks : c.supervisorRemarks,
          hrApproval: level === 'HR' ? ('REJECTED' as const) : c.hrApproval,
          hrRemarks: level === 'HR' ? remarks : c.hrRemarks,
          finalStatus: 'REJECTED' as const,
          resolvedAt: new Date().toISOString()
        };
      }
      return c;
    });

    saveCorrections(updatedCorrections);
  };

  const approveAttendanceBySupervisor = (attendanceId: string, approverId: string) => {
    const updated = attendanceRecords.map(a => {
      if (a.id === attendanceId || a.attendanceId === attendanceId) {
        return {
          ...a,
          supervisorApproval: 'APPROVED' as const,
          updatedAt: new Date().toISOString()
        };
      }
      return a;
    });
    saveAttendance(updated);
  };

  const approveAttendanceByHr = (attendanceId: string, approverId: string) => {
    const updated = attendanceRecords.map(a => {
      if (a.id === attendanceId || a.attendanceId === attendanceId) {
        return {
          ...a,
          hrApproval: 'APPROVED' as const,
          updatedAt: new Date().toISOString()
        };
      }
      return a;
    });
    saveAttendance(updated);
  };

  const addManualOvertime = (data: {
    employeeId: string;
    attendanceId?: string;
    date: string;
    hours: number;
    multiplier?: number;
    reason: string;
  }): OvertimeRecord => {
    const otSeq = overtimeRecords.length + 1;
    const year = data.date.slice(0, 4) || '2026';
    const otId = `OT-${year}-${otSeq.toString().padStart(4, '0')}`;
    const emp = staffMembers.find(s => s.id === data.employeeId);
    const basic = emp?.salaryStructure?.basicSalary || 85000;
    const mult = data.multiplier || 1.5;
    const hourlyRate = Math.round((basic / 200) * mult);

    const record: OvertimeRecord = {
      id: `ot-manual-${Date.now()}`,
      otId,
      employeeId: data.employeeId,
      attendanceId: data.attendanceId || `att-${data.employeeId}-${data.date}`,
      date: data.date,
      hours: data.hours,
      multiplier: mult,
      hourlyRate,
      totalAmount: Math.round(hourlyRate * data.hours),
      source: 'MANUAL_REQUEST',
      reason: data.reason,
      supervisorApproval: 'PENDING',
      hrApproval: 'PENDING',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [record, ...overtimeRecords];
    saveOvertime(updated);
    return record;
  };

  const approveOvertime = (otId: string, level: 'SUPERVISOR' | 'HR', approverId: string, remarks?: string) => {
    const updated = overtimeRecords.map(ot => {
      if (ot.id === otId || ot.otId === otId) {
        const nextSup = level === 'SUPERVISOR' ? 'APPROVED' : ot.supervisorApproval;
        const nextHr = level === 'HR' ? 'APPROVED' : ot.hrApproval;
        const isBothApproved = nextSup === 'APPROVED' && nextHr === 'APPROVED';

        return {
          ...ot,
          supervisorApproval: nextSup as any,
          supervisorRemarks: level === 'SUPERVISOR' ? remarks : ot.supervisorRemarks,
          hrApproval: nextHr as any,
          hrRemarks: level === 'HR' ? remarks : ot.hrRemarks,
          status: isBothApproved ? ('APPROVED' as const) : ot.status,
          updatedAt: new Date().toISOString()
        };
      }
      return ot;
    });

    saveOvertime(updated);
  };

  const rejectOvertime = (otId: string, level: 'SUPERVISOR' | 'HR', approverId: string, remarks?: string) => {
    const updated = overtimeRecords.map(ot => {
      if (ot.id === otId || ot.otId === otId) {
        return {
          ...ot,
          supervisorApproval: level === 'SUPERVISOR' ? ('REJECTED' as const) : ot.supervisorApproval,
          supervisorRemarks: level === 'SUPERVISOR' ? remarks : ot.supervisorRemarks,
          hrApproval: level === 'HR' ? ('REJECTED' as const) : ot.hrApproval,
          hrRemarks: level === 'HR' ? remarks : ot.hrRemarks,
          status: 'REJECTED' as const,
          updatedAt: new Date().toISOString()
        };
      }
      return ot;
    });

    saveOvertime(updated);
  };

  const getRecordsForEmployee = (employeeId: string, monthPrefix?: string): AttendanceRecord[] => {
    return attendanceRecords.filter(a => {
      if (a.employeeId !== employeeId) return false;
      if (monthPrefix && !a.date.startsWith(monthPrefix)) return false;
      return true;
    });
  };

  const getApprovedOvertimeForEmployee = (employeeId: string, monthPrefix: string): OvertimeRecord[] => {
    // Strictly ONLY approved OT (both supervisor & HR) is eligible for payroll (Section 20)
    return overtimeRecords.filter(
      ot =>
        ot.employeeId === employeeId &&
        ot.date.startsWith(monthPrefix) &&
        ot.supervisorApproval === 'APPROVED' &&
        ot.hrApproval === 'APPROVED'
    );
  };

  const approveOvertimeBySupervisor = (otId: string, approverId: string, remarks?: string) => {
    approveOvertime(otId, 'SUPERVISOR', approverId, remarks);
  };

  const approveOvertimeByHr = (otId: string, approverId: string, hours?: number, remarks?: string) => {
    approveOvertime(otId, 'HR', approverId, remarks);
  };

  const clearAttendanceHistory = () => {
    localStorage.removeItem(ATTENDANCE_STORAGE_KEY);
    localStorage.removeItem(CORRECTIONS_STORAGE_KEY);
    setAttendanceRecords([]);
    setCorrectionRequests([]);

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: 'admin',
      userName: 'Administrator',
      userRole: 'admin',
      action: 'DELETE',
      module: 'ATTENDANCE',
      recordId: 'ALL_ATTENDANCE',
      details: 'Cleared all daily attendance punch logs and missed-punch correction requests with Admin Security approval'
    });
  };

  const clearOvertimeHistory = () => {
    localStorage.removeItem(OVERTIME_STORAGE_KEY);
    setOvertimeRecords([]);

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: 'admin',
      userName: 'Administrator',
      userRole: 'admin',
      action: 'DELETE',
      module: 'OVERTIME',
      recordId: 'ALL_OVERTIME',
      details: 'Cleared all overtime register records and approval records with Admin Security approval'
    });
  };

  const resetAttendanceData = () => {
    localStorage.removeItem(ATTENDANCE_STORAGE_KEY);
    localStorage.removeItem(CORRECTIONS_STORAGE_KEY);
    localStorage.removeItem(OVERTIME_STORAGE_KEY);
    setAttendanceRecords([]);
    setCorrectionRequests([]);
    setOvertimeRecords([]);
  };

  return (
    <AttendanceContext.Provider
      value={{
        attendanceRecords,
        correctionRequests,
        overtimeRecords,
        addManualAttendance,
        ingestSyncedAttendance,
        requestCorrection,
        approveCorrection,
        rejectCorrection,
        approveAttendanceBySupervisor,
        approveAttendanceByHr,
        addManualOvertime,
        approveOvertime,
        approveOvertimeBySupervisor,
        approveOvertimeByHr,
        rejectOvertime,
        getRecordsForEmployee,
        getApprovedOvertimeForEmployee,
        clearAttendanceHistory,
        clearOvertimeHistory,
        resetAttendanceData
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = (): AttendanceContextType => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
