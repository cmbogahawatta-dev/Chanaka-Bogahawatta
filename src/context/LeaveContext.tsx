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
  resetLeaveData: () => void;
}

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

export const LeaveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { staffMembers } = useStaff();
  const { getCurrentAllocation } = useStaffAllocation();
  const { resolveWorkflowSteps, getDefaultWorkflow } = useApprovalWorkflow();

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>(() => {
    try {
      const saved = localStorage.getItem(LEAVE_TYPES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading leave types:', e);
    }
    return initialLeaveTypes;
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    try {
      const saved = localStorage.getItem(LEAVE_REQUESTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading leave requests:', e);
    }
    return [];
  });

  const [coverUpRequests, setCoverUpRequests] = useState<CoverUpRequest[]>(() => {
    try {
      const saved = localStorage.getItem(COVER_UP_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading cover ups:', e);
    }
    return [];
  });

  // Seed sample leave requests on first run
  useEffect(() => {
    if (leaveRequests.length === 0 && staffMembers.length >= 2) {
      const emp1 = staffMembers[0];
      const emp2 = staffMembers[1];
      const annualType = initialLeaveTypes.find(lt => lt.code === 'AL') || initialLeaveTypes[0];

      const sampleReqId = `LV-2026-0001`;
      const sampleId = `lv-seed-1`;
      const coverId = `cov-seed-1`;

      const seedCover: CoverUpRequest = {
        id: coverId,
        leaveRequestId: sampleId,
        nominatedEmployeeId: emp2.id,
        nominatedEmployeeName: emp2.fullName,
        status: 'ACCEPTED',
        requestedAt: '2026-08-10T09:00:00Z',
        respondedAt: '2026-08-10T10:30:00Z',
        responseRemarks: 'Glad to cover duties for casting supervision.'
      };

      const seedLeave: LeaveRequest = {
        id: sampleId,
        leaveRequestId: sampleReqId,
        employeeId: emp1.id,
        allocationId: `alloc-${emp1.id}`,
        leaveTypeId: annualType.id,
        leaveTypeName: annualType.name,
        recordSource: 'EMA_NATIVE',
        startDate: '2026-08-12',
        endDate: '2026-08-13',
        workingDays: 2,
        reason: 'Personal family obligation in hometown',
        coverUpRequestId: coverId,
        coverUpStatus: 'ACCEPTED',
        status: 'APPROVED',
        currentStepIndex: 3,
        approvalTrail: [
          {
            levelType: 'COVER_UP',
            sequence: 1,
            title: 'Cover-Up Staff Acceptance',
            approverEmployeeId: emp2.id,
            approverName: emp2.fullName,
            approverRole: emp2.designation,
            decision: 'APPROVED',
            decidedAt: '2026-08-10T10:30:00Z',
            remarks: 'Accepted'
          },
          {
            levelType: 'IMMEDIATE_SUPERVISOR',
            sequence: 2,
            title: 'Site Supervisor Endorsement',
            approverEmployeeId: 'staff-pm-1',
            approverName: 'Eng. Sunil Perera',
            approverRole: 'Project Manager',
            decision: 'APPROVED',
            decidedAt: '2026-08-10T14:00:00Z',
            remarks: 'Work schedule coordinated.'
          },
          {
            levelType: 'HR',
            sequence: 3,
            title: 'HR Officer Final Verification',
            approverEmployeeId: 'staff-hr-1',
            approverName: 'Kavindi Bandara',
            approverRole: 'HR Executive',
            decision: 'APPROVED',
            decidedAt: '2026-08-11T09:15:00Z',
            remarks: 'Entitlement verified and approved.'
          }
        ],
        createdAt: '2026-08-10T09:00:00Z',
        updatedAt: '2026-08-11T09:15:00Z'
      };

      setLeaveRequests([seedLeave]);
      setCoverUpRequests([seedCover]);
      try {
        localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify([seedLeave]));
        localStorage.setItem(COVER_UP_KEY, JSON.stringify([seedCover]));
      } catch (e) {
        console.error('Failed to seed leave data:', e);
      }
    }
  }, [staffMembers, leaveRequests.length]);

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

  const resetLeaveData = () => {
    localStorage.removeItem(LEAVE_TYPES_KEY);
    localStorage.removeItem(LEAVE_REQUESTS_KEY);
    localStorage.removeItem(COVER_UP_KEY);
    setLeaveTypes(initialLeaveTypes);
    setLeaveRequests([]);
    setCoverUpRequests([]);
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
        resetLeaveData
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
