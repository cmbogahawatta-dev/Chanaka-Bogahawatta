import React, { createContext, useContext, useState, ReactNode } from 'react';
import { StaffAllocation, StaffAllocationFilter } from '../types/staffAllocationTypes';
import { useStaff } from './StaffContext';
import { initialStaffMembers } from '../data/staffData';
import { AuditService } from '../services/audit/auditService';

const ALLOCATION_STORAGE_KEY = 'ema_staff_allocations_v1';

const generateDefaultAllocations = (staff: any[]): StaffAllocation[] => {
  return staff.map((member, index) => {
    const allocId = `ALLOC-${(index + 1).toString().padStart(4, '0')}`;
    const proj = member.assignedProjectCode || (member.assignedProjectCodes && member.assignedProjectCodes[0]) || 'PIDM 26';
    
    return {
      id: `alloc-init-${member.id}`,
      allocationId: allocId,
      employeeId: member.id,
      projectId: proj,
      site: `${proj} Main Site`,
      department: member.department,
      designation: member.designation,
      effectiveFrom: member.joinedDate || '2026-01-01',
      effectiveTo: undefined,
      immediateSupervisorId: member.reportsToId || undefined,
      projectManagerId: staff.find(s => s.role === 'PROJECT_MANAGER' && s.id !== member.id)?.id,
      departmentHeadId: staff.find(s => s.role === 'DIRECTOR' || s.role === 'PROJECT_MANAGER')?.id,
      hrResponsibleId: staff.find(s => s.role === 'HR_OFFICER')?.id,
      finalApproverId: staff.find(s => s.role === 'DIRECTOR')?.id,
      approvalWorkflowId: 'wf-leave-standard',
      attendanceRequired: true,
      jibbleAttendanceRequired: true,
      faceVerificationRequired: true,
      gpsRequired: true,
      geofenceRequired: true,
      status: member.status === 'Active' ? 'Active' : 'Ended',
      remarks: 'Baseline operational allocation created from master directory',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
};

interface StaffAllocationContextType {
  allocations: StaffAllocation[];
  getCurrentAllocation: (employeeId: string) => StaffAllocation | undefined;
  getAllocationAt: (employeeId: string, date: string) => StaffAllocation | undefined;
  getAllocationsForEmployee: (employeeId: string) => StaffAllocation[];
  createAllocation: (
    allocation: Omit<StaffAllocation, 'id' | 'allocationId' | 'status' | 'createdAt' | 'updatedAt'>
  ) => StaffAllocation;
  endAllocation: (allocationId: string, endDate: string) => void;
  filterAllocations: (filter: Partial<StaffAllocationFilter>) => StaffAllocation[];
  resetAllocationsToDefault: () => void;
  clearAllocationHistory: () => void;
}

const StaffAllocationContext = createContext<StaffAllocationContextType | undefined>(undefined);

export const StaffAllocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { staffMembers } = useStaff();
  const [allocations, setAllocations] = useState<StaffAllocation[]>(() => {
    try {
      const saved = localStorage.getItem(ALLOCATION_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading allocations from storage:', e);
    }
    const initial = generateDefaultAllocations(initialStaffMembers);
    try {
      localStorage.setItem(ALLOCATION_STORAGE_KEY, JSON.stringify(initial));
    } catch (e) {
      console.error('Failed to seed initial allocations:', e);
    }
    return initial;
  });

  const saveAllocations = (newAllocations: StaffAllocation[]) => {
    setAllocations(newAllocations);
    try {
      localStorage.setItem(ALLOCATION_STORAGE_KEY, JSON.stringify(newAllocations));
    } catch (e) {
      console.error('Failed to persist allocations:', e);
    }
  };

  const getCurrentAllocation = (employeeId: string): StaffAllocation | undefined => {
    return allocations.find(
      a => a.employeeId === employeeId && a.status === 'Active' && !a.effectiveTo
    );
  };

  const getAllocationAt = (employeeId: string, date: string): StaffAllocation | undefined => {
    // Return allocation that was effective at date
    const empAllocations = allocations.filter(a => a.employeeId === employeeId);
    return empAllocations.find(a => {
      const fromMatch = a.effectiveFrom <= date;
      const toMatch = !a.effectiveTo || a.effectiveTo >= date;
      return fromMatch && toMatch;
    }) || getCurrentAllocation(employeeId);
  };

  const getAllocationsForEmployee = (employeeId: string): StaffAllocation[] => {
    return allocations
      .filter(a => a.employeeId === employeeId)
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  };

  const createAllocation = (
    newAllocData: Omit<StaffAllocation, 'id' | 'allocationId' | 'status' | 'createdAt' | 'updatedAt'>
  ): StaffAllocation => {
    const nextSeq = allocations.length + 1;
    const allocationId = `ALLOC-${nextSeq.toString().padStart(4, '0')}`;
    const newId = `alloc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    // 1. Auto-supersede prior active allocations for this employee
    const effectiveFromDate = newAllocData.effectiveFrom;
    const oneDayPrior = new Date(effectiveFromDate);
    oneDayPrior.setDate(oneDayPrior.getDate() - 1);
    const priorEndDate = oneDayPrior.toISOString().slice(0, 10);

    const updatedAllocations = allocations.map(a => {
      if (a.employeeId === newAllocData.employeeId && a.status === 'Active') {
        return {
          ...a,
          status: 'Superseded' as const,
          effectiveTo: a.effectiveTo || priorEndDate,
          updatedAt: new Date().toISOString()
        };
      }
      return a;
    });

    const newRecord: StaffAllocation = {
      ...newAllocData,
      id: newId,
      allocationId,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const finalAllocations = [newRecord, ...updatedAllocations];
    saveAllocations(finalAllocations);

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: 'system',
      userName: 'HR Administrator',
      userRole: 'admin',
      action: 'CREATE',
      module: 'ALLOCATION',
      recordId: allocationId,
      recordTitle: `Staff Allocation for Employee ${newAllocData.employeeId}`,
      details: `Created new project allocation for project ${newAllocData.projectId}, supervisor ${newAllocData.immediateSupervisorId || 'N/A'}`
    });

    return newRecord;
  };

  const endAllocation = (allocationId: string, endDate: string) => {
    const updated = allocations.map(a => {
      if (a.id === allocationId || a.allocationId === allocationId) {
        return {
          ...a,
          status: 'Ended' as const,
          effectiveTo: endDate,
          updatedAt: new Date().toISOString()
        };
      }
      return a;
    });

    saveAllocations(updated);

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: 'system',
      userName: 'HR Administrator',
      userRole: 'admin',
      action: 'UPDATE',
      module: 'ALLOCATION',
      recordId: allocationId,
      details: `Ended allocation on ${endDate}`
    });
  };

  const filterAllocations = (filter: Partial<StaffAllocationFilter>): StaffAllocation[] => {
    return allocations.filter(a => {
      if (filter.status && filter.status !== 'ALL' && a.status !== filter.status) {
        return false;
      }
      if (filter.projectId && filter.projectId !== 'ALL' && a.projectId !== filter.projectId) {
        return false;
      }
      if (filter.department && filter.department !== 'ALL' && a.department !== filter.department) {
        return false;
      }
      if (filter.supervisorId && filter.supervisorId !== 'ALL' && a.immediateSupervisorId !== filter.supervisorId) {
        return false;
      }
      return true;
    });
  };

  const clearAllocationHistory = () => {
    localStorage.setItem(ALLOCATION_STORAGE_KEY, JSON.stringify([]));
    setAllocations([]);

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: 'admin',
      userName: 'Administrator',
      userRole: 'admin',
      action: 'DELETE',
      module: 'ALLOCATION',
      recordId: 'ALL_ALLOCATIONS',
      details: 'Cleared all staff project allocation history records with Admin Security approval'
    });
  };

  const resetAllocationsToDefault = () => {
    const initial = generateDefaultAllocations(staffMembers.length > 0 ? staffMembers : initialStaffMembers);
    try {
      localStorage.setItem(ALLOCATION_STORAGE_KEY, JSON.stringify(initial));
    } catch (e) {
      console.error('Failed to reset allocations storage:', e);
    }
    setAllocations(initial);
  };

  return (
    <StaffAllocationContext.Provider
      value={{
        allocations,
        getCurrentAllocation,
        getAllocationAt,
        getAllocationsForEmployee,
        createAllocation,
        endAllocation,
        filterAllocations,
        resetAllocationsToDefault,
        clearAllocationHistory
      }}
    >
      {children}
    </StaffAllocationContext.Provider>
  );
};

export const useStaffAllocation = (): StaffAllocationContextType => {
  const context = useContext(StaffAllocationContext);
  if (!context) {
    throw new Error('useStaffAllocation must be used within a StaffAllocationProvider');
  }
  return context;
};
