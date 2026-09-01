import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  ApprovalWorkflow,
  ApprovalWorkflowLevel,
  ApprovalLevelType
} from '../types/approvalWorkflowTypes';
import { StaffAllocation } from '../types/staffAllocationTypes';
import { initialApprovalWorkflows } from '../data/hrInitialData';
import { useStaff } from './StaffContext';
import { AuditService } from '../services/audit/auditService';

const WORKFLOWS_STORAGE_KEY = 'ema_approval_workflows_v1';

export interface ResolvedApprovalStep {
  levelType: ApprovalLevelType;
  sequence: number;
  title: string;
  approverEmployeeId: string;
  approverName: string;
  approverRole: string;
  mandatory: boolean;
}

interface ApprovalWorkflowContextType {
  workflows: ApprovalWorkflow[];
  getWorkflow: (id: string) => ApprovalWorkflow | undefined;
  getDefaultWorkflow: (appliesTo: 'LEAVE' | 'PAYROLL' | 'ATTENDANCE_CORRECTION') => ApprovalWorkflow | undefined;
  createWorkflow: (workflow: Omit<ApprovalWorkflow, 'id' | 'createdAt' | 'updatedAt'>) => ApprovalWorkflow;
  updateWorkflow: (id: string, updates: Partial<ApprovalWorkflow>) => void;
  deleteWorkflow: (id: string) => void;
  resolveWorkflowSteps: (
    workflowId: string | undefined,
    allocation: StaffAllocation | undefined,
    requesterId: string
  ) => ResolvedApprovalStep[];
  resetWorkflowsToDefault: () => void;
}

const ApprovalWorkflowContext = createContext<ApprovalWorkflowContextType | undefined>(undefined);

export const ApprovalWorkflowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { staffMembers } = useStaff();
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>(() => {
    try {
      const saved = localStorage.getItem(WORKFLOWS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading approval workflows:', e);
    }
    return initialApprovalWorkflows;
  });

  const saveWorkflows = (newWorkflows: ApprovalWorkflow[]) => {
    setWorkflows(newWorkflows);
    try {
      localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(newWorkflows));
    } catch (e) {
      console.error('Failed to persist workflows:', e);
    }
  };

  const getWorkflow = (id: string): ApprovalWorkflow | undefined => {
    return workflows.find(w => w.id === id);
  };

  const getDefaultWorkflow = (appliesTo: 'LEAVE' | 'PAYROLL' | 'ATTENDANCE_CORRECTION'): ApprovalWorkflow | undefined => {
    return (
      workflows.find(w => w.appliesTo === appliesTo && w.isDefault && w.active) ||
      workflows.find(w => w.appliesTo === appliesTo && w.active)
    );
  };

  const createWorkflow = (
    data: Omit<ApprovalWorkflow, 'id' | 'createdAt' | 'updatedAt'>
  ): ApprovalWorkflow => {
    const newId = `wf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const newWorkflow: ApprovalWorkflow = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [...workflows, newWorkflow];
    saveWorkflows(updated);

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: 'system',
      userName: 'HR Administrator',
      userRole: 'admin',
      action: 'CREATE',
      module: 'WORKFLOW',
      recordId: newId,
      recordTitle: data.name,
      details: `Created new approval workflow for ${data.appliesTo} with ${data.levels.length} levels`
    });

    return newWorkflow;
  };

  const updateWorkflow = (id: string, updates: Partial<ApprovalWorkflow>) => {
    const updated = workflows.map(w => {
      if (w.id === id) {
        return {
          ...w,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return w;
    });

    saveWorkflows(updated);

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: 'system',
      userName: 'HR Administrator',
      userRole: 'admin',
      action: 'UPDATE',
      module: 'WORKFLOW',
      recordId: id,
      details: `Updated workflow properties`
    });
  };

  const deleteWorkflow = (id: string) => {
    const target = workflows.find(w => w.id === id);
    const updated = workflows.filter(w => w.id !== id);
    saveWorkflows(updated);

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: 'system',
      userName: 'HR Administrator',
      userRole: 'admin',
      action: 'DELETE',
      module: 'WORKFLOW',
      recordId: id,
      recordTitle: target?.name,
      details: `Deleted approval workflow`
    });
  };

  /**
   * Dynamic Level Resolution against StaffAllocation (Section 7)
   */
  const resolveWorkflowSteps = (
    workflowId: string | undefined,
    allocation: StaffAllocation | undefined,
    requesterId: string
  ): ResolvedApprovalStep[] => {
    const wf = (workflowId ? getWorkflow(workflowId) : undefined) || getDefaultWorkflow('LEAVE') || workflows[0];
    if (!wf || !wf.levels) return [];

    const activeLevels = wf.levels.filter(lvl => lvl.active).sort((a, b) => a.sequence - b.sequence);
    const resolvedSteps: ResolvedApprovalStep[] = [];

    // Fallback default executives from staff directory
    const defaultHr = staffMembers.find(s => s.role === 'HR_OFFICER');
    const defaultOwner = staffMembers.find(s => s.role === 'DIRECTOR');
    const defaultFinance = staffMembers.find(s => s.role === 'ACCOUNTANT');
    const defaultPm = staffMembers.find(s => s.role === 'PROJECT_MANAGER');

    activeLevels.forEach((lvl, idx) => {
      let approverId = '';
      let title = lvl.title || '';

      switch (lvl.levelType) {
        case 'COVER_UP':
          // Cover up will be resolved when requester nominates a colleague
          title = title || 'Cover-Up Staff Handover';
          approverId = 'COVER_UP_NOMINEE';
          break;

        case 'IMMEDIATE_SUPERVISOR':
          title = title || 'Immediate Site Supervisor';
          approverId = allocation?.immediateSupervisorId || staffMembers.find(s => s.id === requesterId)?.reportsToId || '';
          break;

        case 'PROJECT_MANAGER':
          title = title || 'Project Resident Manager';
          approverId = allocation?.projectManagerId || defaultPm?.id || '';
          break;

        case 'DEPARTMENT_HEAD':
          title = title || 'Department Head Review';
          approverId = allocation?.departmentHeadId || defaultPm?.id || defaultOwner?.id || '';
          break;

        case 'HR':
          title = title || 'HR Officer Verification';
          approverId = allocation?.hrResponsibleId || defaultHr?.id || '';
          break;

        case 'FINANCE':
          title = title || 'Accounts & Finance Verification';
          approverId = defaultFinance?.id || '';
          break;

        case 'OWNER':
          title = title || 'Managing Director / Owner';
          approverId = allocation?.finalApproverId || defaultOwner?.id || '';
          break;

        case 'CUSTOM':
          title = title || 'Designated Approver';
          approverId = lvl.approverEmployeeId || '';
          break;
      }

      const approverStaff = staffMembers.find(s => s.id === approverId);

      resolvedSteps.push({
        levelType: lvl.levelType,
        sequence: idx + 1,
        title,
        approverEmployeeId: approverId,
        approverName: approverStaff ? approverStaff.fullName : approverId === 'COVER_UP_NOMINEE' ? 'Nominated Peer' : 'Pending Allocation',
        approverRole: approverStaff ? approverStaff.designation : lvl.levelType.replace(/_/g, ' '),
        mandatory: lvl.mandatory
      });
    });

    return resolvedSteps;
  };

  const resetWorkflowsToDefault = () => {
    localStorage.removeItem(WORKFLOWS_STORAGE_KEY);
    setWorkflows(initialApprovalWorkflows);
  };

  return (
    <ApprovalWorkflowContext.Provider
      value={{
        workflows,
        getWorkflow,
        getDefaultWorkflow,
        createWorkflow,
        updateWorkflow,
        deleteWorkflow,
        resolveWorkflowSteps,
        resetWorkflowsToDefault
      }}
    >
      {children}
    </ApprovalWorkflowContext.Provider>
  );
};

export const useApprovalWorkflow = (): ApprovalWorkflowContextType => {
  const context = useContext(ApprovalWorkflowContext);
  if (!context) {
    throw new Error('useApprovalWorkflow must be used within an ApprovalWorkflowProvider');
  }
  return context;
};
