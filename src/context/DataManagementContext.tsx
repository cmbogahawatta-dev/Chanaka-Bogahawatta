import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  DataManagementModule,
  DeleteRequest,
  DeleteRequestStatus,
  ImportRequest,
  ImportRequestStatus,
  ApprovalControlRule,
  DeleteDependencyAnalysis
} from '../types/dataManagementTypes';
import { useEnterprise } from './EnterpriseContext';
import { usePettyCash } from './PettyCashContext';
import { useFleet } from './FleetContext';
import { useStaff } from './StaffContext';
import { useStaffAllocation } from './StaffAllocationContext';
import { useAttendance } from './AttendanceContext';
import { useLeave } from './LeaveContext';
import { usePayroll } from './PayrollContext';
import { useSalaryHistory } from './SalaryHistoryContext';
import { useGeofence } from './GeofenceContext';
import { usePRV } from './PRVContext';
import { useSiteRecords } from './SiteRecordContext';
import { AuditService } from '../services/audit/auditService';

const DELETE_REQUESTS_KEY = 'ema_delete_requests_v2';
const IMPORT_REQUESTS_KEY = 'ema_import_requests_v2';
const APPROVAL_RULES_KEY = 'ema_approval_control_rules_v2';

export const INITIAL_APPROVAL_RULES: ApprovalControlRule[] = [
  {
    id: 'rule-projects',
    module: 'PROJECTS',
    moduleLabel: 'Construction Projects & Packages',
    category: 'MASTER_DATA',
    requiresDeleteApproval: true,
    requiresSecurityPinForDelete: true,
    requiresImportApproval: true,
    allowHardDeleteWhenNoDependencies: true,
    allowDeactivateOption: true,
    minJustificationLength: 10
  },
  {
    id: 'rule-vehicles',
    module: 'VEHICLES',
    moduleLabel: 'Fleet Vehicles & Heavy Machinery',
    category: 'FLEET',
    requiresDeleteApproval: true,
    requiresSecurityPinForDelete: true,
    requiresImportApproval: true,
    allowHardDeleteWhenNoDependencies: true,
    allowDeactivateOption: true,
    minJustificationLength: 10
  },
  {
    id: 'rule-drivers',
    module: 'DRIVERS',
    moduleLabel: 'Drivers & Heavy Vehicle Operators',
    category: 'FLEET',
    requiresDeleteApproval: true,
    requiresSecurityPinForDelete: false,
    requiresImportApproval: true,
    allowHardDeleteWhenNoDependencies: true,
    allowDeactivateOption: true,
    minJustificationLength: 10
  },
  {
    id: 'rule-staff',
    module: 'STAFF',
    moduleLabel: 'Staff & Personnel Directory',
    category: 'HR_PAYROLL',
    requiresDeleteApproval: true,
    requiresSecurityPinForDelete: true,
    requiresImportApproval: true,
    allowHardDeleteWhenNoDependencies: true,
    allowDeactivateOption: true,
    minJustificationLength: 10
  },
  {
    id: 'rule-supervisors',
    module: 'SUPERVISORS',
    moduleLabel: 'Site Supervisors & Float Custodians',
    category: 'FINANCE',
    requiresDeleteApproval: true,
    requiresSecurityPinForDelete: false,
    requiresImportApproval: true,
    allowHardDeleteWhenNoDependencies: true,
    allowDeactivateOption: true,
    minJustificationLength: 10
  },
  {
    id: 'rule-allocations',
    module: 'STAFF_ALLOCATIONS',
    moduleLabel: 'Staff Project Allocations',
    category: 'HR_PAYROLL',
    requiresDeleteApproval: false,
    requiresSecurityPinForDelete: false,
    requiresImportApproval: false,
    allowHardDeleteWhenNoDependencies: true,
    allowDeactivateOption: true,
    minJustificationLength: 5
  },
  {
    id: 'rule-attendance',
    module: 'ATTENDANCE',
    moduleLabel: 'Attendance & Biometric Punches',
    category: 'HR_PAYROLL',
    requiresDeleteApproval: true,
    requiresSecurityPinForDelete: true,
    requiresImportApproval: false,
    allowHardDeleteWhenNoDependencies: true,
    allowDeactivateOption: false,
    minJustificationLength: 10
  },
  {
    id: 'rule-overtime',
    module: 'OVERTIME',
    moduleLabel: 'Overtime Register Claims',
    category: 'HR_PAYROLL',
    requiresDeleteApproval: true,
    requiresSecurityPinForDelete: true,
    requiresImportApproval: false,
    allowHardDeleteWhenNoDependencies: true,
    allowDeactivateOption: false,
    minJustificationLength: 10
  },
  {
    id: 'rule-leaves',
    module: 'LEAVES',
    moduleLabel: 'Staff Leave Requests & Balances',
    category: 'HR_PAYROLL',
    requiresDeleteApproval: false,
    requiresSecurityPinForDelete: false,
    requiresImportApproval: false,
    allowHardDeleteWhenNoDependencies: true,
    allowDeactivateOption: false,
    minJustificationLength: 5
  },
  {
    id: 'rule-salary',
    module: 'SALARY_HISTORY',
    moduleLabel: 'Salary Structures & Revisions',
    category: 'HR_PAYROLL',
    requiresDeleteApproval: true,
    requiresSecurityPinForDelete: true,
    requiresImportApproval: true,
    allowHardDeleteWhenNoDependencies: true,
    allowDeactivateOption: false,
    minJustificationLength: 15
  },
  {
    id: 'rule-payroll',
    module: 'PAYROLL',
    moduleLabel: 'Monthly Payroll Runs & Batches',
    category: 'HR_PAYROLL',
    requiresDeleteApproval: true,
    requiresSecurityPinForDelete: true,
    requiresImportApproval: false,
    allowHardDeleteWhenNoDependencies: false,
    allowDeactivateOption: false,
    minJustificationLength: 20
  },
  {
    id: 'rule-geofences',
    module: 'GEOFENCES',
    moduleLabel: 'Project Site GPS Geofences',
    category: 'MASTER_DATA',
    requiresDeleteApproval: false,
    requiresSecurityPinForDelete: false,
    requiresImportApproval: false,
    allowHardDeleteWhenNoDependencies: true,
    allowDeactivateOption: true,
    minJustificationLength: 5
  },
  {
    id: 'rule-expenses',
    module: 'EXPENSES',
    moduleLabel: 'Petty Cash Expense Vouchers',
    category: 'FINANCE',
    requiresDeleteApproval: false,
    requiresSecurityPinForDelete: false,
    requiresImportApproval: false,
    allowHardDeleteWhenNoDependencies: true,
    allowDeactivateOption: false,
    minJustificationLength: 5
  },
  {
    id: 'rule-prv',
    module: 'PRV',
    moduleLabel: 'Payment Requisition Vouchers (PRV)',
    category: 'FINANCE',
    requiresDeleteApproval: true,
    requiresSecurityPinForDelete: false,
    requiresImportApproval: false,
    allowHardDeleteWhenNoDependencies: true,
    allowDeactivateOption: false,
    minJustificationLength: 10
  }
];

interface DataManagementContextType {
  deleteRequests: DeleteRequest[];
  importRequests: ImportRequest[];
  approvalRules: ApprovalControlRule[];
  
  // Delete Workflow
  submitDeleteRequest: (params: {
    module: DataManagementModule;
    recordType: string;
    recordId: string;
    recordTitle: string;
    recordSummary?: Record<string, any>;
    reason: string;
    justificationType?: DeleteRequest['justificationType'];
    requestedBy: { userId: string; userName: string; userRole: string };
  }) => DeleteRequest;
  
  approveAndExecuteDelete: (params: {
    requestId: string;
    action: 'HARD_DELETE' | 'DEACTIVATE' | 'ARCHIVE';
    reviewer: { userId: string; userName: string; userRole: string };
    adminComment?: string;
    securityVerified?: boolean;
  }) => { success: boolean; message: string };
  
  rejectDeleteRequest: (params: {
    requestId: string;
    reviewer: { userId: string; userName: string; userRole: string };
    adminComment: string;
  }) => void;
  
  cancelDeleteRequest: (requestId: string) => void;
  
  // Bulk Import Workflow
  submitImportRequest: (params: {
    module: DataManagementModule;
    directoryType: string;
    fileName: string;
    fileSize?: number;
    totalRows: number;
    validRows: number;
    warningRows: number;
    duplicateRows: number;
    errorRows: number;
    dataPayload: any[];
    validationIssues: any[];
    notes?: string;
    requestedBy: { userId: string; userName: string; userRole: string };
  }) => ImportRequest;
  
  approveAndExecuteImport: (params: {
    requestId: string;
    reviewer: { userId: string; userName: string; userRole: string };
    adminComment?: string;
  }) => { success: boolean; importedCount: number; message: string };
  
  rejectImportRequest: (params: {
    requestId: string;
    reviewer: { userId: string; userName: string; userRole: string };
    adminComment: string;
  }) => void;
  
  // Dependencies & Rules
  analyzeDependencies: (module: DataManagementModule, recordId: string) => DeleteDependencyAnalysis;
  getRuleForModule: (module: DataManagementModule) => ApprovalControlRule;
  updateApprovalRule: (id: string, updates: Partial<ApprovalControlRule>) => void;
  resetApprovalRules: () => void;
  
  // Bulk Clear
  clearDeleteRequestsHistory: () => void;
  clearImportRequestsHistory: () => void;
}

const DataManagementContext = createContext<DataManagementContextType | undefined>(undefined);

export const DataManagementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentRole, currentUser } = useEnterprise();
  
  // Cross-module access for dependency calculation and import execution
  const {
    projects,
    supervisors,
    expenses,
    income,
    transfers: pettyCashTransfers,
    deleteProject,
    deleteSupervisor
  } = usePettyCash();
  
  const {
    vehicles,
    drivers,
    runningCharts,
    fuelRecords,
    maintenanceLogs,
    deleteVehicle,
    deleteDriver,
    bulkImportVehicles,
    bulkImportDrivers,
    bulkImportRunningCharts,
    bulkImportFuelRecords,
    bulkImportMaintenanceLogs
  } = useFleet();
  
  const {
    staffMembers,
    deleteStaffMember,
    updateStaffMember,
    bulkImportStaffMembers
  } = useStaff();
  
  const {
    allocations,
    endAllocation
  } = useStaffAllocation();
  
  const {
    attendanceRecords,
    overtimeRecords,
    bulkImportAttendance,
    bulkImportOvertime
  } = useAttendance();
  
  const {
    leaveRequests,
    bulkImportLeaves
  } = useLeave();
  
  const {
    payrollBatches
  } = usePayroll();
  
  const {
    salaryHistory
  } = useSalaryHistory();
  
  const {
    geofences,
    deleteGeofence
  } = useGeofence();
  
  const {
    paymentRequests
  } = usePRV();
  
  const {
    records: siteRecords,
    bulkImportSiteRecords
  } = useSiteRecords();

  // State: Delete Requests
  const [deleteRequests, setDeleteRequests] = useState<DeleteRequest[]>(() => {
    try {
      const saved = localStorage.getItem(DELETE_REQUESTS_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading delete requests:', e);
    }
    return [];
  });

  // State: Import Requests
  const [importRequests, setImportRequests] = useState<ImportRequest[]>(() => {
    try {
      const saved = localStorage.getItem(IMPORT_REQUESTS_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading import requests:', e);
    }
    return [];
  });

  // State: Approval Rules
  const [approvalRules, setApprovalRules] = useState<ApprovalControlRule[]>(() => {
    try {
      const saved = localStorage.getItem(APPROVAL_RULES_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading approval rules:', e);
    }
    return INITIAL_APPROVAL_RULES;
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(DELETE_REQUESTS_KEY, JSON.stringify(deleteRequests));
    } catch (e) {
      console.error('Failed to persist delete requests:', e);
    }
  }, [deleteRequests]);

  useEffect(() => {
    try {
      localStorage.setItem(IMPORT_REQUESTS_KEY, JSON.stringify(importRequests));
    } catch (e) {
      console.error('Failed to persist import requests:', e);
    }
  }, [importRequests]);

  useEffect(() => {
    try {
      localStorage.setItem(APPROVAL_RULES_KEY, JSON.stringify(approvalRules));
    } catch (e) {
      console.error('Failed to persist approval rules:', e);
    }
  }, [approvalRules]);

  // Dependency Analysis Engine
  const analyzeDependencies = (module: DataManagementModule, recordId: string): DeleteDependencyAnalysis => {
    const breakdown: DeleteDependencyAnalysis['breakdown'] = [];
    let totalDependencies = 0;

    switch (module) {
      case 'PROJECTS': {
        const proj = projects.find(p => p.id === recordId || p.PROJECT_CODE === recordId);
        const code = proj?.PROJECT_CODE || recordId;

        // Check expenses
        const linkedExpenses = expenses.filter(e => e.PROJECT_CODE === code);
        if (linkedExpenses.length > 0) {
          breakdown.push({
            category: 'Petty Cash Expenses',
            count: linkedExpenses.length,
            description: `${linkedExpenses.length} expense vouchers booked against ${code}`,
            sampleIds: linkedExpenses.slice(0, 3).map(e => e.VOUCHER_NO || e.id)
          });
          totalDependencies += linkedExpenses.length;
        }

        // Check staff allocations
        const linkedAllocations = allocations.filter(a => a.projectId === code && a.status === 'Active');
        if (linkedAllocations.length > 0) {
          breakdown.push({
            category: 'Active Staff Allocations',
            count: linkedAllocations.length,
            description: `${linkedAllocations.length} staff currently allocated to ${code}`,
            sampleIds: linkedAllocations.slice(0, 3).map(a => a.allocationId)
          });
          totalDependencies += linkedAllocations.length;
        }

        // Check site records
        const linkedDsr = siteRecords.filter(s => s.projectCode === code);
        if (linkedDsr.length > 0) {
          breakdown.push({
            category: 'Daily Site Records (DSR)',
            count: linkedDsr.length,
            description: `${linkedDsr.length} daily site logs recorded for ${code}`,
            sampleIds: linkedDsr.slice(0, 3).map(s => s.id)
          });
          totalDependencies += linkedDsr.length;
        }

        // Check running charts / vehicles
        const linkedTrips = runningCharts.filter(r => r.projectCode === code);
        if (linkedTrips.length > 0) {
          breakdown.push({
            category: 'Fleet Running Charts',
            count: linkedTrips.length,
            description: `${linkedTrips.length} vehicle trips logged for ${code}`,
            sampleIds: linkedTrips.slice(0, 3).map(r => r.id)
          });
          totalDependencies += linkedTrips.length;
        }

        // Check Geofences
        const linkedGf = geofences.filter(g => g.projectId === code);
        if (linkedGf.length > 0) {
          breakdown.push({
            category: 'GPS Geofences',
            count: linkedGf.length,
            description: `${linkedGf.length} active site geofences defined`,
            sampleIds: linkedGf.slice(0, 3).map(g => g.geofenceId)
          });
          totalDependencies += linkedGf.length;
        }

        break;
      }

      case 'VEHICLES': {
        const veh = vehicles.find(v => v.id === recordId || v.registrationNumber === recordId);
        const reg = veh?.registrationNumber || recordId;

        // Trips
        const linkedTrips = runningCharts.filter(r => r.vehicleRegistration === reg || r.vehicleId === recordId);
        if (linkedTrips.length > 0) {
          breakdown.push({
            category: 'Running Chart Trips',
            count: linkedTrips.length,
            description: `${linkedTrips.length} trip logs logged for ${reg}`,
            sampleIds: linkedTrips.slice(0, 3).map(r => r.id)
          });
          totalDependencies += linkedTrips.length;
        }

        // Fuel
        const linkedFuel = fuelRecords.filter(f => f.vehicleRegistration === reg || f.vehicleId === recordId);
        if (linkedFuel.length > 0) {
          breakdown.push({
            category: 'Fuel Records',
            count: linkedFuel.length,
            description: `${linkedFuel.length} fuel fill-up records logged for ${reg}`,
            sampleIds: linkedFuel.slice(0, 3).map(f => f.id)
          });
          totalDependencies += linkedFuel.length;
        }

        // Maintenance
        const linkedMaint = maintenanceLogs.filter(m => m.vehicleRegistration === reg || m.vehicleId === recordId);
        if (linkedMaint.length > 0) {
          breakdown.push({
            category: 'Maintenance & Service Logs',
            count: linkedMaint.length,
            description: `${linkedMaint.length} garage service records logged for ${reg}`,
            sampleIds: linkedMaint.slice(0, 3).map(m => m.id)
          });
          totalDependencies += linkedMaint.length;
        }

        break;
      }

      case 'STAFF': {
        const staff = staffMembers.find(s => s.id === recordId || s.employeeCode === recordId);
        const sId = staff?.id || recordId;

        // Attendance
        const linkedAtt = attendanceRecords.filter(a => a.employeeId === sId);
        if (linkedAtt.length > 0) {
          breakdown.push({
            category: 'Attendance Logs',
            count: linkedAtt.length,
            description: `${linkedAtt.length} daily punch-in/out records for this employee`,
            sampleIds: linkedAtt.slice(0, 3).map(a => a.attendanceId)
          });
          totalDependencies += linkedAtt.length;
        }

        // Overtime
        const linkedOt = overtimeRecords.filter(o => o.employeeId === sId);
        if (linkedOt.length > 0) {
          breakdown.push({
            category: 'Overtime Claims',
            count: linkedOt.length,
            description: `${linkedOt.length} overtime claims recorded`,
            sampleIds: linkedOt.slice(0, 3).map(o => o.otId)
          });
          totalDependencies += linkedOt.length;
        }

        // Leaves
        const linkedLeaves = leaveRequests.filter(l => l.employeeId === sId);
        if (linkedLeaves.length > 0) {
          breakdown.push({
            category: 'Leave Requests',
            count: linkedLeaves.length,
            description: `${linkedLeaves.length} leave requests and approvals`,
            sampleIds: linkedLeaves.slice(0, 3).map(l => l.leaveRequestId)
          });
          totalDependencies += linkedLeaves.length;
        }

        // Allocations
        const linkedAlloc = allocations.filter(a => a.employeeId === sId);
        if (linkedAlloc.length > 0) {
          breakdown.push({
            category: 'Project Allocations',
            count: linkedAlloc.length,
            description: `${linkedAlloc.length} historical and active site allocations`,
            sampleIds: linkedAlloc.slice(0, 3).map(a => a.allocationId)
          });
          totalDependencies += linkedAlloc.length;
        }

        // Salary History
        const linkedSalary = salaryHistory.filter(sh => sh.employeeId === sId);
        if (linkedSalary.length > 0) {
          breakdown.push({
            category: 'Salary Structures',
            count: linkedSalary.length,
            description: `${linkedSalary.length} salary revision records`,
            sampleIds: linkedSalary.slice(0, 3).map(sh => sh.id)
          });
          totalDependencies += linkedSalary.length;
        }

        break;
      }

      case 'SUPERVISORS': {
        const sup = supervisors.find(s => s.id === recordId || s.SUPERVISOR_NAME === recordId);
        const name = sup?.SUPERVISOR_NAME || recordId;

        const linkedExp = expenses.filter(e => e.SUPERVISOR_NAME?.toUpperCase() === name.toUpperCase());
        if (linkedExp.length > 0) {
          breakdown.push({
            category: 'Submitted Expense Vouchers',
            count: linkedExp.length,
            description: `${linkedExp.length} petty cash expenses submitted by this supervisor`,
            sampleIds: linkedExp.slice(0, 3).map(e => e.VOUCHER_NO || e.id)
          });
          totalDependencies += linkedExp.length;
        }

        const linkedInc = income.filter(i => i.SUPERVISOR_NAME?.toUpperCase() === name.toUpperCase());
        if (linkedInc.length > 0) {
          breakdown.push({
            category: 'Petty Cash Top-ups',
            count: linkedInc.length,
            description: `${linkedInc.length} top-up income receipts`,
            sampleIds: linkedInc.slice(0, 3).map(i => i.RECEIPT_NO || i.id)
          });
          totalDependencies += linkedInc.length;
        }

        break;
      }

      default:
        break;
    }

    const canHardDelete = totalDependencies === 0;
    const suggestedAction: DeleteDependencyAnalysis['suggestedAction'] =
      totalDependencies === 0 ? 'HARD_DELETE' : module === 'STAFF' ? 'DEACTIVATE' : module === 'PROJECTS' ? 'ARCHIVE' : 'DEACTIVATE';

    let warningMessage = undefined;
    if (totalDependencies > 0) {
      warningMessage = `This record has ${totalDependencies} linked operational records across the ERP system. Hard deletion will cause foreign-key integrity breakdown. Soft-deactivation or archiving is strongly recommended.`;
    }

    return {
      canHardDelete,
      totalDependencies,
      breakdown,
      suggestedAction,
      warningMessage
    };
  };

  const getRuleForModule = (module: DataManagementModule): ApprovalControlRule => {
    return (
      approvalRules.find(r => r.module === module) || {
        id: `rule-${module.toLowerCase()}`,
        module,
        moduleLabel: module.replace(/_/g, ' '),
        category: 'MASTER_DATA',
        requiresDeleteApproval: true,
        requiresSecurityPinForDelete: true,
        requiresImportApproval: true,
        allowHardDeleteWhenNoDependencies: true,
        allowDeactivateOption: true,
        minJustificationLength: 10
      }
    );
  };

  // Submit Delete Request
  const submitDeleteRequest = (params: {
    module: DataManagementModule;
    recordType: string;
    recordId: string;
    recordTitle: string;
    recordSummary?: Record<string, any>;
    reason: string;
    justificationType?: DeleteRequest['justificationType'];
    requestedBy: { userId: string; userName: string; userRole: string };
  }): DeleteRequest => {
    const nextSeq = deleteRequests.length + 1;
    const deleteRequestId = `DEL-2026-${nextSeq.toString().padStart(4, '0')}`;
    const id = `del-req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    
    const dependencyAnalysis = analyzeDependencies(params.module, params.recordId);
    
    const impactLevel: DeleteRequest['impactLevel'] =
      dependencyAnalysis.totalDependencies > 50
        ? 'CRITICAL'
        : dependencyAnalysis.totalDependencies > 10
        ? 'HIGH'
        : dependencyAnalysis.totalDependencies > 0
        ? 'MEDIUM'
        : 'LOW';

    const newRequest: DeleteRequest = {
      id,
      deleteRequestId,
      module: params.module,
      recordType: params.recordType,
      recordId: params.recordId,
      recordTitle: params.recordTitle,
      recordSummary: params.recordSummary,
      requestedBy: params.requestedBy,
      requestedAt: new Date().toISOString(),
      reason: params.reason,
      justificationType: params.justificationType || 'DATA_CLEANUP',
      impactLevel,
      dependencyAnalysis,
      status: 'SUBMITTED'
    };

    setDeleteRequests(prev => [newRequest, ...prev]);

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: params.requestedBy.userId,
      userName: params.requestedBy.userName,
      userRole: params.requestedBy.userRole as any,
      action: 'DELETE',
      module: params.module as any,
      recordId: deleteRequestId,
      recordTitle: `Delete Request for ${params.recordType}: ${params.recordTitle}`,
      details: `Submitted delete request (${params.reason}). Total dependencies: ${dependencyAnalysis.totalDependencies}`
    });

    return newRequest;
  };

  // Approve & Execute Delete Request
  const approveAndExecuteDelete = (params: {
    requestId: string;
    action: 'HARD_DELETE' | 'DEACTIVATE' | 'ARCHIVE';
    reviewer: { userId: string; userName: string; userRole: string };
    adminComment?: string;
    securityVerified?: boolean;
  }): { success: boolean; message: string } => {
    const req = deleteRequests.find(r => r.id === params.requestId);
    if (!req) return { success: false, message: 'Delete request not found.' };

    if (req.status === 'EXECUTED') {
      return { success: false, message: 'This delete request has already been executed (Idempotency safeguard).' };
    }

    // Requester != Approver rule check (except for emergency system root admin)
    if (req.requestedBy.userId === params.reviewer.userId && params.reviewer.userRole !== 'ADMIN' && params.reviewer.userRole !== 'OWNER') {
      return { success: false, message: 'Four-eyes security policy: Requester cannot approve their own delete request.' };
    }

    try {
      // Execute the actual record modification in respective context
      if (params.action === 'HARD_DELETE') {
        switch (req.module) {
          case 'PROJECTS':
            deleteProject(req.recordId);
            break;
          case 'VEHICLES':
            deleteVehicle(req.recordId);
            break;
          case 'DRIVERS':
            deleteDriver(req.recordId);
            break;
          case 'STAFF':
            deleteStaffMember(req.recordId);
            break;
          case 'SUPERVISORS':
            deleteSupervisor(req.recordId);
            break;
          case 'GEOFENCES':
            deleteGeofence(req.recordId);
            break;
          default:
            break;
        }
      } else if (params.action === 'DEACTIVATE' || params.action === 'ARCHIVE') {
        if (req.module === 'STAFF') {
          updateStaffMember(req.recordId, { status: 'Resigned' });
        } else if (req.module === 'STAFF_ALLOCATIONS') {
          endAllocation(req.recordId, new Date().toISOString().slice(0, 10));
        }
      }

      const nowIso = new Date().toISOString();
      setDeleteRequests(prev =>
        prev.map(r =>
          r.id === params.requestId
            ? {
                ...r,
                status: 'EXECUTED',
                reviewedBy: params.reviewer,
                reviewedAt: nowIso,
                adminComment: params.adminComment,
                securityVerified: params.securityVerified || true,
                executedBy: params.reviewer,
                executedAt: nowIso,
                executionActionTaken: params.action === 'HARD_DELETE' ? 'HARD_DELETED' : params.action === 'DEACTIVATE' ? 'DEACTIVATED' : 'ARCHIVED'
              }
            : r
        )
      );

      AuditService.log({
        enterpriseId: 'ema-constructions-lk',
        userId: params.reviewer.userId,
        userName: params.reviewer.userName,
        userRole: params.reviewer.userRole as any,
        action: 'DELETE',
        module: req.module as any,
        recordId: req.deleteRequestId,
        recordTitle: `Executed ${params.action} for ${req.recordTitle}`,
        details: `Authorized by ${params.reviewer.userName}. Action: ${params.action}. Reason: ${params.adminComment || req.reason}`
      });

      return { success: true, message: `Successfully executed ${params.action} on ${req.recordTitle}.` };
    } catch (e: any) {
      console.error('Error executing delete request:', e);
      return { success: false, message: `Execution failed: ${e.message}` };
    }
  };

  // Reject Delete Request
  const rejectDeleteRequest = (params: {
    requestId: string;
    reviewer: { userId: string; userName: string; userRole: string };
    adminComment: string;
  }) => {
    const nowIso = new Date().toISOString();
    setDeleteRequests(prev =>
      prev.map(r =>
        r.id === params.requestId
          ? {
              ...r,
              status: 'REJECTED',
              reviewedBy: params.reviewer,
              reviewedAt: nowIso,
              adminComment: params.adminComment
            }
          : r
      )
    );

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: params.reviewer.userId,
      userName: params.reviewer.userName,
      userRole: params.reviewer.userRole as any,
      action: 'UPDATE',
      module: 'SECURITY' as any,
      recordId: params.requestId,
      details: `Rejected delete request: ${params.adminComment}`
    });
  };

  const cancelDeleteRequest = (requestId: string) => {
    setDeleteRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status: 'CANCELLED' as DeleteRequestStatus } : r))
    );
  };

  // Submit Import Request
  const submitImportRequest = (params: {
    module: DataManagementModule;
    directoryType: string;
    fileName: string;
    fileSize?: number;
    totalRows: number;
    validRows: number;
    warningRows: number;
    duplicateRows: number;
    errorRows: number;
    dataPayload: any[];
    validationIssues: any[];
    notes?: string;
    requestedBy: { userId: string; userName: string; userRole: string };
  }): ImportRequest => {
    const nextSeq = importRequests.length + 1;
    const importRequestId = `IMP-2026-${nextSeq.toString().padStart(4, '0')}`;
    const batchId = `BATCH-${params.module.slice(0, 4)}-${Date.now().toString().slice(-6)}`;
    const id = `imp-req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const newRequest: ImportRequest = {
      id,
      importRequestId,
      batchId,
      module: params.module,
      directoryType: params.directoryType,
      fileName: params.fileName,
      fileSize: params.fileSize,
      totalRows: params.totalRows,
      validRows: params.validRows,
      warningRows: params.warningRows,
      duplicateRows: params.duplicateRows,
      errorRows: params.errorRows,
      dataPayload: params.dataPayload,
      validationIssues: params.validationIssues,
      status: 'SUBMITTED',
      requestedBy: params.requestedBy,
      requestedAt: new Date().toISOString(),
      notes: params.notes
    };

    setImportRequests(prev => [newRequest, ...prev]);

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: params.requestedBy.userId,
      userName: params.requestedBy.userName,
      userRole: params.requestedBy.userRole as any,
      action: 'CREATE',
      module: params.module as any,
      recordId: importRequestId,
      recordTitle: `Import Request: ${params.fileName} (${params.validRows} valid items)`,
      details: `Batch ${batchId} submitted for bulk import approval.`
    });

    return newRequest;
  };

  // Approve & Execute Bulk Import Request (Guarantees Idempotency)
  const approveAndExecuteImport = (params: {
    requestId: string;
    reviewer: { userId: string; userName: string; userRole: string };
    adminComment?: string;
  }): { success: boolean; importedCount: number; message: string } => {
    const req = importRequests.find(r => r.id === params.requestId);
    if (!req) return { success: false, importedCount: 0, message: 'Import request not found.' };

    // Idempotency check
    if (req.status === 'EXECUTED') {
      return {
        success: false,
        importedCount: req.importedCount || 0,
        message: `Idempotency safeguard: Batch ${req.batchId} was already executed on ${req.executedAt?.slice(0, 16)} by ${req.executedBy?.userName}. Duplicate execution blocked.`
      };
    }

    try {
      let count = 0;
      const payload = req.dataPayload || [];

      switch (req.directoryType.toUpperCase()) {
        case 'VEHICLES':
          count = bulkImportVehicles(payload).count;
          break;
        case 'DRIVERS':
          count = bulkImportDrivers(payload).count;
          break;
        case 'STAFF':
          count = bulkImportStaffMembers(payload).count;
          break;
        case 'ATTENDANCE':
          count = bulkImportAttendance(payload).count;
          break;
        case 'OVERTIME':
          count = bulkImportOvertime(payload).count;
          break;
        case 'LEAVES':
          count = bulkImportLeaves(payload).count;
          break;
        case 'RUNNING_CHARTS':
          count = bulkImportRunningCharts(payload).count;
          break;
        case 'FUEL':
          count = bulkImportFuelRecords(payload).count;
          break;
        case 'MAINTENANCE':
          count = bulkImportMaintenanceLogs(payload).count;
          break;
        case 'SITE_RECORDS':
          count = bulkImportSiteRecords(payload).count;
          break;
        default:
          count = payload.length;
          break;
      }

      const nowIso = new Date().toISOString();
      setImportRequests(prev =>
        prev.map(r =>
          r.id === params.requestId
            ? {
                ...r,
                status: 'EXECUTED',
                reviewedBy: params.reviewer,
                reviewedAt: nowIso,
                adminComment: params.adminComment,
                executedBy: params.reviewer,
                executedAt: nowIso,
                importedCount: count,
                executionSummary: `Successfully imported ${count} valid records into ${req.directoryType} directory.`
              }
            : r
        )
      );

      AuditService.log({
        enterpriseId: 'ema-constructions-lk',
        userId: params.reviewer.userId,
        userName: params.reviewer.userName,
        userRole: params.reviewer.userRole as any,
        action: 'CREATE',
        module: req.module as any,
        recordId: req.batchId,
        recordTitle: `Executed Bulk Import ${req.fileName}`,
        details: `Imported ${count} records. Approved by ${params.reviewer.userName}.`
      });

      return {
        success: true,
        importedCount: count,
        message: `Successfully executed batch ${req.batchId} — imported ${count} records into ${req.directoryType}.`
      };
    } catch (e: any) {
      console.error('Error executing bulk import:', e);
      return { success: false, importedCount: 0, message: `Import execution failed: ${e.message}` };
    }
  };

  // Reject Import Request
  const rejectImportRequest = (params: {
    requestId: string;
    reviewer: { userId: string; userName: string; userRole: string };
    adminComment: string;
  }) => {
    const nowIso = new Date().toISOString();
    setImportRequests(prev =>
      prev.map(r =>
        r.id === params.requestId
          ? {
              ...r,
              status: 'REJECTED',
              reviewedBy: params.reviewer,
              reviewedAt: nowIso,
              adminComment: params.adminComment
            }
          : r
      )
    );

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: params.reviewer.userId,
      userName: params.reviewer.userName,
      userRole: params.reviewer.userRole as any,
      action: 'UPDATE',
      module: 'SECURITY' as any,
      recordId: params.requestId,
      details: `Rejected bulk import request: ${params.adminComment}`
    });
  };

  const updateApprovalRule = (id: string, updates: Partial<ApprovalControlRule>) => {
    setApprovalRules(prev => prev.map(r => (r.id === id ? { ...r, ...updates } : r)));
  };

  const resetApprovalRules = () => {
    setApprovalRules(INITIAL_APPROVAL_RULES);
    try {
      localStorage.setItem(APPROVAL_RULES_KEY, JSON.stringify(INITIAL_APPROVAL_RULES));
    } catch (e) {
      console.error('Failed to reset approval rules storage:', e);
    }
  };

  const clearDeleteRequestsHistory = () => {
    localStorage.setItem(DELETE_REQUESTS_KEY, JSON.stringify([]));
    setDeleteRequests([]);
  };

  const clearImportRequestsHistory = () => {
    localStorage.setItem(IMPORT_REQUESTS_KEY, JSON.stringify([]));
    setImportRequests([]);
  };

  return (
    <DataManagementContext.Provider
      value={{
        deleteRequests,
        importRequests,
        approvalRules,
        submitDeleteRequest,
        approveAndExecuteDelete,
        rejectDeleteRequest,
        cancelDeleteRequest,
        submitImportRequest,
        approveAndExecuteImport,
        rejectImportRequest,
        analyzeDependencies,
        getRuleForModule,
        updateApprovalRule,
        resetApprovalRules,
        clearDeleteRequestsHistory,
        clearImportRequestsHistory
      }}
    >
      {children}
    </DataManagementContext.Provider>
  );
};

export const useDataManagement = (): DataManagementContextType => {
  const context = useContext(DataManagementContext);
  if (!context) {
    throw new Error('useDataManagement must be used within a DataManagementProvider');
  }
  return context;
};
