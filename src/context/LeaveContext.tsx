import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  LeaveType,
  LeaveRequest,
  CoverUpRequest,
  LeaveBalanceSummary,
  LeaveStatus,
  LeaveApprovalStep
} from '../types/leaveTypes';
import { initialLeaveTypes } from '../data/hrInitialData';
import { useStaff } from './StaffContext';
import { useStaffAllocation } from './StaffAllocationContext';
import { useApprovalWorkflow } from './ApprovalWorkflowContext';
import { AuditService } from '../services/audit/auditService';

const LEAVE_TYPES_KEY = 'ema_leave_types_v1';
const LEAVE_REQUESTS_KEY = 'ema_leave_requests_v1';
const COVER_UP_KEY = 'ema_cover_up_requests_v1';

interface LeaveContextType {
  leaveTypes: LeaveType[];
  leaveRequests: LeaveRequest[];
  coverUpRequests: CoverUpRequest[];
  
  getLeaveType: (id: string) => LeaveType | undefined;
  getLeaveBalances: (employeeId: string, year?: string) => LeaveBalanceSummary[];
  
  submitLeaveRequest: (data: {
    employeeId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    workingDays: number;
    isHalfDay?: boolean;
    halfDayPeriod?: 'FIRST_HALF' | 'SECOND_HALF';
    reason: string;
    nominatedCoverUpId?: string;
    attachmentUrl?: string;
  }) => LeaveRequest;

  respondCoverUp: (
    coverUpId: string,
    decision: 'ACCEPTED' | 'REJECTED',
    remarks?: string
  ) => void;

  processApprovalStep: (
    leaveRequestId: string,
    decision: 'APPROVED' | 'REJECTED' | 'RETURNED',
    approverId: string,
    remarks?: string
  ) => void;

  withdrawLeaveRequest: (leaveRequestId: string) => void;
  clearLeaveHistory: () => void;
  resetLeaveData: () => void;
  bulkImportLeaves: (records: Partial<LeaveRequest>[]) => { count: number; batchId: string };
}

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

export const LeaveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { staffMembers } = useStaff();
  const { getCurrentAllocation } = useStaffAllocation();
  const { resolveWorkflowSteps, getDefaultWorkflow } = useApprovalWorkflow();

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>(() => {
    try {
      const saved = localStorage.getItem(LEAVE_TYPES_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading leave types:', e);
    }
    try {
      localStorage.setItem(LEAVE_TYPES_KEY, JSON.stringify(initialLeaveTypes));
    } catch (e) {
      console.error('Failed to seed leave types:', e);
    }
    return initialLeaveTypes;
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    try {
      const saved = localStorage.getItem(LEAVE_REQUESTS_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading leave requests:', e);
    }
    return [];
  });

  const [coverUpRequests, setCoverUpRequests] = useState<CoverUpRequest[]>(() => {
    try {
      const saved = localStorage.getItem(COVER_UP_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading cover ups:', e);
    }
    return [];
  });

  const saveRequests = (requests: LeaveRequest[]) => {
    setLeaveRequests(requests);
    try {
      localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(requests));
    } catch (e) {
      console.error('Failed to save leave requests:', e);
    }
  };

  const saveCoverUps = (covers: CoverUpRequest[]) => {
    setCoverUpRequests(covers);
    try {
      localStorage.setItem(COVER_UP_KEY, JSON.stringify(covers));
    } catch (e) {
      console.error('Failed to save cover ups:', e);
    }
  };

  const getLeaveType = (id: string): LeaveType | undefined => {
    return leaveTypes.find(lt => lt.id === id || lt.code === id);
  };

  const getLeaveBalances = (employeeId: string, year: string = '2026'): LeaveBalanceSummary[] => {
    const employeeLeaves = leaveRequests.filter(
      lr => lr.employeeId === employeeId && lr.startDate.startsWith(year)
    );

    return leaveTypes.map(lt => {
      const typeLeaves = employeeLeaves.filter(lr => lr.leaveTypeId === lt.id);
      const used = typeLeaves
        .filter(lr => lr.status === 'APPROVED')
        .reduce((sum, lr) => sum + lr.workingDays, 0);

      const pending = typeLeaves
        .filter(lr => lr.status !== 'APPROVED' && lr.status !== 'REJECTED' && lr.status !== 'CANCELLED' && lr.status !== 'WITHDRAWN')
        .reduce((sum, lr) => sum + lr.workingDays, 0);

      const entitlement = lt.annualEntitlementDays;
      const available = Math.max(0, entitlement - used - pending);

      return {
        employeeId,
        leaveTypeId: lt.id,
        leaveTypeName: lt.name,
        entitlement,
        used,
        pending,
        available: lt.paid ? available : 999, // No-pay has no cap
        paid: lt.paid
      };
    });
  };

  /**
   * Submit Leave Application with dynamic step resolution
   */
  const submitLeaveRequest = (data: {
    employeeId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    workingDays: number;
    isHalfDay?: boolean;
    halfDayPeriod?: 'FIRST_HALF' | 'SECOND_HALF';
    reason: string;
    nominatedCoverUpId?: string;
    attachmentUrl?: string;
  }): LeaveRequest => {
    const lt = getLeaveType(data.leaveTypeId);
    const allocation = getCurrentAllocation(data.employeeId);
    const reqSeq = leaveRequests.length + 1;
    const leaveRequestId = `LV-2026-${reqSeq.toString().padStart(4, '0')}`;
    const id = `lv-${Date.now()}`;

    // Resolve workflow levels
    const resolvedSteps = resolveWorkflowSteps(lt?.workflowId, allocation, data.employeeId);

    // Setup cover up if required and nominated
    let coverUpId: string | undefined = undefined;
    let initialStatus: LeaveStatus = 'SUBMITTED';

    if (lt?.requiresCoverUp && data.nominatedCoverUpId) {
      const nominee = staffMembers.find(s => s.id === data.nominatedCoverUpId);
      coverUpId = `cov-${Date.now()}`;
      const newCoverUp: CoverUpRequest = {
        id: coverUpId,
        leaveRequestId: id,
        nominatedEmployeeId: data.nominatedCoverUpId,
        nominatedEmployeeName: nominee ? nominee.fullName : 'Nominated Peer',
        status: 'PENDING',
        requestedAt: new Date().toISOString()
      };
      setCoverUpRequests(prev => [newCoverUp, ...prev]);
      initialStatus = 'COVER_UP_PENDING';
    } else {
      initialStatus = 'SUPERVISOR_PENDING';
    }

    const approvalTrail: LeaveApprovalStep[] = resolvedSteps.map(step => ({
      levelType: step.levelType,
      sequence: step.sequence,
      title: step.title,
      approverEmployeeId: step.levelType === 'COVER_UP' && data.nominatedCoverUpId ? data.nominatedCoverUpId : step.approverEmployeeId,
      approverName: step.approverName,
      approverRole: step.approverRole,
      decision: 'PENDING'
    }));

    const newRequest: LeaveRequest = {
      id,
      leaveRequestId,
      employeeId: data.employeeId,
      allocationId: allocation?.id || `alloc-${data.employeeId}`,
      leaveTypeId: data.leaveTypeId,
      leaveTypeName: lt?.name || 'Leave',
      recordSource: 'EMA_NATIVE',
      startDate: data.startDate,
      endDate: data.endDate,
      workingDays: data.workingDays,
      isHalfDay: data.isHalfDay,
      halfDayPeriod: data.halfDayPeriod,
      reason: data.reason,
      attachmentUrl: data.attachmentUrl,
      coverUpRequestId: coverUpId,
      coverUpStatus: coverUpId ? 'PENDING' : 'NONE',
      status: initialStatus,
      approvalTrail,
      currentStepIndex: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newRequest, ...leaveRequests];
    saveRequests(updated);

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: data.employeeId,
      userName: 'Employee',
      userRole: 'viewer',
      action: 'CREATE',
      module: 'LEAVE',
      recordId: leaveRequestId,
      details: `Submitted ${lt?.name || 'Leave'} for ${data.workingDays} days from ${data.startDate} to ${data.endDate}`
    });

    return newRequest;
  };

  /**
   * Respond to Cover-Up Request
   */
  const respondCoverUp = (
    coverUpId: string,
    decision: 'ACCEPTED' | 'REJECTED',
    remarks?: string
  ) => {
    const updatedCovers = coverUpRequests.map(c => {
      if (c.id === coverUpId) {
        return {
          ...c,
          status: decision,
          respondedAt: new Date().toISOString(),
          responseRemarks: remarks
        };
      }
      return c;
    });
    saveCoverUps(updatedCovers);

    const targetCover = updatedCovers.find(c => c.id === coverUpId);
    if (!targetCover) return;

    const updatedLeaves = leaveRequests.map(lr => {
      if (lr.id === targetCover.leaveRequestId) {
        const nextTrail = lr.approvalTrail.map(step => {
          if (step.levelType === 'COVER_UP') {
            return {
              ...step,
              decision: decision === 'ACCEPTED' ? ('APPROVED' as const) : ('REJECTED' as const),
              decidedAt: new Date().toISOString(),
              remarks
            };
          }
          return step;
        });

        const nextStatus: LeaveStatus = decision === 'ACCEPTED' ? 'SUPERVISOR_PENDING' : 'COVER_UP_REJECTED';

        return {
          ...lr,
          coverUpStatus: decision,
          status: nextStatus,
          currentStepIndex: decision === 'ACCEPTED' ? 1 : 0,
          approvalTrail: nextTrail,
          updatedAt: new Date().toISOString()
        };
      }
      return lr;
    });

    saveRequests(updatedLeaves);
  };

  /**
   * Process Standard Approval Step
   */
  const processApprovalStep = (
    leaveRequestId: string,
    decision: 'APPROVED' | 'REJECTED' | 'RETURNED',
    approverId: string,
    remarks?: string
  ) => {
    const updatedLeaves = leaveRequests.map(lr => {
      if (lr.id === leaveRequestId || lr.leaveRequestId === leaveRequestId) {
        const trail = [...lr.approvalTrail];
        const curIdx = lr.currentStepIndex;

        if (trail[curIdx]) {
          trail[curIdx] = {
            ...trail[curIdx],
            decision,
            decidedAt: new Date().toISOString(),
            remarks
          };
        }

        let nextStatus: LeaveStatus = lr.status;
        let nextIndex = curIdx;

        if (decision === 'REJECTED') {
          nextStatus = 'REJECTED';
        } else if (decision === 'RETURNED') {
          nextStatus = 'RETURNED';
        } else if (decision === 'APPROVED') {
          if (curIdx + 1 >= trail.length) {
            nextStatus = 'APPROVED';
          } else {
            nextIndex = curIdx + 1;
            const nextLevel = trail[nextIndex].levelType;
            if (nextLevel === 'IMMEDIATE_SUPERVISOR') nextStatus = 'SUPERVISOR_PENDING';
            else if (nextLevel === 'PROJECT_MANAGER') nextStatus = 'MANAGER_PENDING';
            else if (nextLevel === 'HR') nextStatus = 'HR_PENDING';
            else if (nextLevel === 'OWNER') nextStatus = 'OWNER_PENDING';
          }
        }

        return {
          ...lr,
          approvalTrail: trail,
          currentStepIndex: nextIndex,
          status: nextStatus,
          updatedAt: new Date().toISOString()
        };
      }
      return lr;
    });

    saveRequests(updatedLeaves);

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: approverId,
      userName: 'Approver',
      userRole: 'admin',
      action: decision === 'APPROVED' ? 'APPROVE' : decision === 'REJECTED' ? 'REJECT' : 'UPDATE',
      module: 'LEAVE',
      recordId: leaveRequestId,
      details: `${decision} leave application step. Remarks: ${remarks || 'None'}`
    });
  };

  const withdrawLeaveRequest = (leaveRequestId: string) => {
    const updated = leaveRequests.map(lr => {
      if (lr.id === leaveRequestId || lr.leaveRequestId === leaveRequestId) {
        return {
          ...lr,
          status: 'WITHDRAWN' as const,
          updatedAt: new Date().toISOString()
        };
      }
      return lr;
    });
    saveRequests(updated);
  };

  const clearLeaveHistory = () => {
    localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify([]));
    localStorage.setItem(COVER_UP_KEY, JSON.stringify([]));
    setLeaveRequests([]);
    setCoverUpRequests([]);

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: 'admin',
      userName: 'Administrator',
      userRole: 'admin',
      action: 'DELETE',
      module: 'LEAVE',
      recordId: 'ALL_LEAVE',
      details: 'Cleared all employee leave applications, cover-up requests, and approval histories with Admin Security approval'
    });
  };

  const resetLeaveData = () => {
    try {
      localStorage.setItem(LEAVE_TYPES_KEY, JSON.stringify(initialLeaveTypes));
      localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify([]));
      localStorage.setItem(COVER_UP_KEY, JSON.stringify([]));
    } catch (e) {
      console.error('Failed to reset leave data:', e);
    }
    setLeaveTypes(initialLeaveTypes);
    setLeaveRequests([]);
    setCoverUpRequests([]);
  };

  const bulkImportLeaves = (imported: Partial<LeaveRequest>[]): { count: number; batchId: string } => {
    const batchId = `BATCH-LV-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();
    const newItems: LeaveRequest[] = imported.map((l, i) => ({
      id: l.id || `lv-imp-${Date.now()}-${i}`,
      leaveRequestId: l.leaveRequestId || `LV-2026-${String(leaveRequests.length + i + 1).padStart(4, '0')}`,
      employeeId: l.employeeId || `EMP-${String(i + 1).padStart(3, '0')}`,
      allocationId: l.allocationId || 'alloc-default',
      leaveTypeId: l.leaveTypeId || 'ANNUAL',
      leaveTypeName: l.leaveTypeName || 'Annual Leave',
      recordSource: l.recordSource || 'EMA_NATIVE',
      startDate: l.startDate || new Date().toISOString().slice(0, 10),
      endDate: l.endDate || new Date().toISOString().slice(0, 10),
      workingDays: Number(l.workingDays) || 1,
      isHalfDay: l.isHalfDay || false,
      halfDayPeriod: l.halfDayPeriod,
      reason: l.reason || 'Personal / Family commitments',
      status: (l.status as any) || 'APPROVED',
      approvalTrail: l.approvalTrail || [],
      currentStepIndex: l.currentStepIndex || 0,
      createdAt: nowIso,
      updatedAt: nowIso
    }));

    setLeaveRequests(prev => {
      const merged = [...newItems, ...prev];
      localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(merged));
      return merged;
    });

    return { count: newItems.length, batchId };
  };

  return (
    <LeaveContext.Provider
      value={{
        leaveTypes,
        leaveRequests,
        coverUpRequests,
        getLeaveType,
        getLeaveBalances,
        submitLeaveRequest,
        respondCoverUp,
        processApprovalStep,
        withdrawLeaveRequest,
        clearLeaveHistory,
        resetLeaveData,
        bulkImportLeaves
      }}
    >
      {children}
    </LeaveContext.Provider>
  );
};

export const useLeave = (): LeaveContextType => {
  const context = useContext(LeaveContext);
  if (!context) {
    throw new Error('useLeave must be used within a LeaveProvider');
  }
  return context;
};
