import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  StaffMember,
  StaffFilterState,
  StaffSummaryStats,
  ReportingHierarchyNode,
  DerivedSupervisorView,
  Department,
  EmployeeRole,
  EmploymentType,
  StaffStatus
} from '../types/staffTypes';
import { initialStaffMembers } from '../data/staffData';
import { initialSupervisors } from '../data/pettyCashData';

const STAFF_STORAGE_KEY = 'ema_enterprise_staff_directory_v1';
const LEGACY_SUPERVISORS_KEY = 'ema_petty_supervisors_v1';

export interface ExtendedStaffSummaryStats extends StaffSummaryStats {
  supervisorsCount: number;
}

// Step A Migration Helper: Additive non-destructive migration linking all Supervisors to Staff Directory
const migrateLegacySupervisorsToStaff = (currentStaff: StaffMember[]): StaffMember[] => {
  let updatedStaff = [...currentStaff];
  let legacySupervisors: any[] = [];

  try {
    const savedLegacy = localStorage.getItem(LEGACY_SUPERVISORS_KEY);
    if (savedLegacy) {
      const parsed = JSON.parse(savedLegacy);
      if (Array.isArray(parsed)) {
        legacySupervisors = parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading legacy supervisors for migration:', e);
  }

  // Include initial supervisors to ensure baseline mappings are guaranteed
  initialSupervisors.forEach(initSup => {
    if (!legacySupervisors.some(ls => (ls.SUPERVISOR_ID && ls.SUPERVISOR_ID === initSup.SUPERVISOR_ID) || (ls.SUPERVISOR_NAME && ls.SUPERVISOR_NAME.toUpperCase() === initSup.SUPERVISOR_NAME.toUpperCase()))) {
      legacySupervisors.push(initSup);
    }
  });

  // For every existing Supervisor record:
  legacySupervisors.forEach(sup => {
    if (!sup || (!sup.SUPERVISOR_NAME && !sup.SUPERVISOR_ID)) return;

    const supName = (sup.SUPERVISOR_NAME || '').trim().toUpperCase();
    const supId = (sup.SUPERVISOR_ID || '').trim();

    // 1 & 2. Find matching Staff Directory Employee case-insensitively
    const existingIndex = updatedStaff.findIndex(m => {
      if (supId && (m.supervisorId === supId || m.legacySupervisorId === supId || m.employeeCode === supId || m.id === supId)) {
        return true;
      }
      if (supName) {
        if (m.preferredName && m.preferredName.trim().toUpperCase() === supName) return true;
        if (m.fullName && m.fullName.trim().toUpperCase() === supName) return true;
        if (m.fullName && m.fullName.trim().toUpperCase().split(' ').includes(supName)) return true;
      }
      return false;
    });

    if (existingIndex >= 0) {
      // 3. Link the existing Supervisor to that Employee.
      // 4. Preserve existing SUPERVISOR_ID as legacySupervisorId.
      const existing = updatedStaff[existingIndex];
      const mergedProjects = Array.from(new Set([
        ...(existing.assignedProjectCodes || (existing.assignedProjectCode ? [existing.assignedProjectCode] : [])),
        ...(sup.ASSIGNED_PROJECTS || (sup.DEFAULT_PROJECT ? [sup.DEFAULT_PROJECT] : []))
      ]));

      updatedStaff[existingIndex] = {
        ...existing,
        isSupervisor: true,
        supervisorId: existing.supervisorId || supId || existing.employeeCode,
        legacySupervisorId: supId || existing.legacySupervisorId || existing.supervisorId,
        assignedProjectCodes: mergedProjects.length > 0 ? mergedProjects : existing.assignedProjectCodes
      };
    } else {
      // 5. If no matching Employee exists, create the corresponding Employee from identity information
      const createdId = `STAFF-MIG-${supId || Math.random().toString(36).slice(2, 6)}`;
      const cleanCode = supId ? supId.replace(/[^a-zA-Z0-9]/g, '') : `SUP-${updatedStaff.length + 1}`;
      const employeeCode = `EMA-EMP-${cleanCode}`;
      const assignedProjs = sup.ASSIGNED_PROJECTS && sup.ASSIGNED_PROJECTS.length > 0
        ? sup.ASSIGNED_PROJECTS
        : sup.DEFAULT_PROJECT ? [sup.DEFAULT_PROJECT] : ['PIDM 26'];

      const newEmployee: StaffMember = {
        id: createdId,
        employeeCode,
        nicNumber: '198500000000',
        fullName: sup.FULL_NAME || sup.SUPERVISOR_NAME || 'Migrated Supervisor',
        preferredName: sup.SUPERVISOR_NAME || 'Supervisor',
        email: sup.EMAIL || `${(sup.SUPERVISOR_NAME || 'supervisor').toLowerCase()}@emaconstruction.lk`,
        phone: sup.PHONE || '+94 77 000 0000',
        role: 'SUPERVISOR',
        designation: sup.REMARKS || 'Site Operations Supervisor',
        department: 'Project Operations',
        employmentType: 'Permanent',
        status: sup.ACTIVE !== false ? 'Active' : 'Resigned',
        joinedDate: '2020-01-01',
        assignedProjectCode: assignedProjs[0] || 'PIDM 26',
        assignedProjectName: assignedProjs[0] || 'Primary Project Site',
        assignedProjectCodes: assignedProjs,
        reportsToId: 'STAFF-003',
        reportsToName: 'Eng. Priyantha Dissanayake',
        isSupervisor: true,
        supervisorId: supId || employeeCode,
        legacySupervisorId: supId || employeeCode,
        residentialAddress: 'Sri Lanka',
        emergencyContact: {
          name: 'Emergency Contact',
          relationship: 'Family',
          phone: sup.PHONE || '+94 77 000 0000'
        },
        salaryStructure: {
          basicSalary: 160000,
          budgetaryReliefAllowance: 5000,
          siteAllowance: 35000,
          transportAllowance: 30000,
          phoneAllowance: 6000,
          epfEmployeeRate: 8,
          epfEmployerRate: 12,
          etfEmployerRate: 3,
          bankName: 'Bank of Ceylon',
          bankBranch: 'Main Branch',
          accountNumber: '0000000000',
          paymentMode: 'Bank Transfer',
          effectiveDate: '2026-01-01'
        },
        notes: `Migrated from legacy supervisor record ${supId || ''} (${sup.SUPERVISOR_NAME || ''})`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      updatedStaff.push(newEmployee);
    }
  });

  // 6. Deduplicate by unique id and do NOT delete old Supervisor localStorage data (ema_petty_supervisors_v1).
  const seenStaffIds = new Set<string>();
  return updatedStaff.filter(m => {
    if (!m.id || seenStaffIds.has(m.id)) return false;
    seenStaffIds.add(m.id);
    return true;
  });
};

interface StaffContextType {
  staffMembers: StaffMember[];
  filteredStaff: StaffMember[];
  filterState: StaffFilterState;
  summaryStats: ExtendedStaffSummaryStats;
  selectedStaffMember: StaffMember | null;
  isLoading: boolean;

  // State setters & actions
  setFilterState: React.Dispatch<React.SetStateAction<StaffFilterState>>;
  resetFilters: () => void;
  setSelectedStaffMember: (member: StaffMember | null) => void;
  
  // CRUD
  addStaffMember: (member: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>) => StaffMember;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => void;
  deleteStaffMember: (id: string) => void;
  
  // Query & Lookup helpers
  getStaffMemberById: (id: string) => StaffMember | undefined;
  getDirectReports: (managerId: string) => StaffMember[];
  getReportingHierarchyChain: (employeeId: string) => StaffMember[];
  getOrganizationHierarchyTree: () => ReportingHierarchyNode[];
  getSupervisors: () => StaffMember[];
  getDerivedSupervisors: () => DerivedSupervisorView[];
  getStaffByRole: (role: EmployeeRole) => StaffMember[];
  getStaffByDepartment: (dept: Department) => StaffMember[];
  getStaffByProject: (projectCode: string) => StaffMember[];

  // Allocations & Reassignments
  allocateStaffToProject: (staffId: string, projectCode: string, projectName?: string, secondaryCodes?: string[]) => void;
  reassignStaffSupervisor: (staffId: string, reportsToId?: string) => void;

  // Master Maintenance
  resetStaffDirectory: () => void;
  clearStaffDirectory: () => void;
  bulkImportStaffMembers: (imported: Partial<StaffMember>[]) => { count: number; batchId: string };
}

const initialFilterState: StaffFilterState = {
  searchQuery: '',
  department: 'ALL',
  projectCode: 'ALL',
  role: 'ALL',
  status: 'ALL',
  employmentType: 'ALL',
  supervisorOnly: false,
  reportsToId: 'ALL'
};

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export const StaffProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => {
    let baseList = initialStaffMembers;
    try {
      const saved = localStorage.getItem(STAFF_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          baseList = parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load staff members from localStorage:', e);
    }
    return migrateLegacySupervisorsToStaff(baseList);
  });

  const [filterState, setFilterState] = useState<StaffFilterState>(initialFilterState);
  const [selectedStaffMember, setSelectedStaffMember] = useState<StaffMember | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staffMembers));
    } catch (e) {
      console.error('Failed to save staff members to localStorage:', e);
    }
  }, [staffMembers]);

  // Reset Filters
  const resetFilters = () => {
    setFilterState(initialFilterState);
  };

  // Get Single Member
  const getStaffMemberById = (id: string): StaffMember | undefined => {
    return staffMembers.find(m => m.id === id || m.employeeCode === id);
  };

  // Direct reports of a manager/supervisor
  const getDirectReports = (managerId: string): StaffMember[] => {
    return staffMembers.filter(m => m.reportsToId === managerId);
  };

  // Hierarchy upward chain (Employee -> Direct Supervisor -> PM -> Director)
  const getReportingHierarchyChain = (employeeId: string): StaffMember[] => {
    const chain: StaffMember[] = [];
    const visited = new Set<string>();

    let current = staffMembers.find(m => m.id === employeeId);
    while (current && !visited.has(current.id)) {
      chain.push(current);
      visited.add(current.id);

      if (!current.reportsToId) break;
      current = staffMembers.find(m => m.id === current?.reportsToId);
    }

    return chain;
  };

  // Full Organization Tree
  const getOrganizationHierarchyTree = (): ReportingHierarchyNode[] => {
    const buildSubTree = (member: StaffMember, level: number): ReportingHierarchyNode => {
      const directChildren = staffMembers.filter(m => m.reportsToId === member.id);
      return {
        member,
        level,
        directReports: directChildren.map(child => buildSubTree(child, level + 1))
      };
    };

    // Root nodes are members with no reportsToId or reportsToId not present in directory
    const rootMembers = staffMembers.filter(
      m => !m.reportsToId || !staffMembers.some(sm => sm.id === m.reportsToId)
    );

    return rootMembers.map(root => buildSubTree(root, 0));
  };

  // Get all staff acting as field/operational supervisors
  const getSupervisors = (): StaffMember[] => {
    return staffMembers.filter(m => m.role === 'SUPERVISOR' || m.isSupervisor === true);
  };

  // Derived Operational Supervisor View (for seamless integration with Petty Cash & Field Operations)
  // All active Staff Directory employees appear in the Supervisor operational view
  const getDerivedSupervisors = (): DerivedSupervisorView[] => {
    return staffMembers
      .filter(m => m.status === 'Active')
      .map(m => {
        const assignedProjects = m.assignedProjectCodes && m.assignedProjectCodes.length > 0
          ? m.assignedProjectCodes
          : m.assignedProjectCode && m.assignedProjectCode !== 'HEAD_OFFICE'
            ? [m.assignedProjectCode]
            : [];

        const supervisorName = (m.preferredName || m.fullName.split(' ')[0]).toUpperCase();

        return {
          id: m.supervisorId || m.id,
          staffId: m.id,
          employeeCode: m.employeeCode,
          SUPERVISOR_ID: m.supervisorId || m.employeeCode,
          legacySupervisorId: m.legacySupervisorId || m.supervisorId || m.employeeCode,
          SUPERVISOR_NAME: supervisorName,
          FULL_NAME: m.fullName,
          PHONE: m.phone,
          EMAIL: m.email,
          ACTIVE: m.status === 'Active',
          OPENING_PETTY_CASH: 50000.0,
          REMARKS: m.notes || `${m.designation} - ${m.department}`,
          ASSIGNED_PROJECTS: assignedProjects,
          AVATAR_COLOR: 'emerald',
          role: m.role,
          department: m.department,
          designation: m.designation
        };
      });
  };

  // Query helpers by role, department, project
  const getStaffByRole = (role: EmployeeRole): StaffMember[] => {
    return staffMembers.filter(m => m.role === role);
  };

  const getStaffByDepartment = (dept: Department): StaffMember[] => {
    return staffMembers.filter(m => m.department === dept);
  };

  const getStaffByProject = (projectCode: string): StaffMember[] => {
    return staffMembers.filter(m =>
      m.assignedProjectCode === projectCode ||
      (m.assignedProjectCodes && m.assignedProjectCodes.includes(projectCode))
    );
  };

  // Add Staff Member
  const addStaffMember = (memberData: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>): StaffMember => {
    const now = new Date().toISOString();
    const newId = `STAFF-${String(Date.now()).slice(-4)}-${Math.floor(Math.random() * 1000)}`;

    // Resolve reportsToName if reportsToId is supplied
    let resolvedReportsToName = memberData.reportsToName;
    if (memberData.reportsToId) {
      const manager = staffMembers.find(m => m.id === memberData.reportsToId);
      if (manager) {
        resolvedReportsToName = manager.fullName;
      }
    }

    const newStaff: StaffMember = {
      ...memberData,
      id: newId,
      reportsToName: resolvedReportsToName,
      isSupervisor: memberData.isSupervisor || memberData.role === 'SUPERVISOR',
      assignedProjectCodes: memberData.assignedProjectCodes || (memberData.assignedProjectCode ? [memberData.assignedProjectCode] : []),
      createdAt: now,
      updatedAt: now
    };

    setStaffMembers(prev => [newStaff, ...prev]);
    return newStaff;
  };

  // Update Staff Member
  const updateStaffMember = (id: string, updates: Partial<StaffMember>) => {
    setStaffMembers(prev =>
      prev.map(member => {
        if (member.id !== id) return member;

        let reportsToName = updates.reportsToName !== undefined ? updates.reportsToName : member.reportsToName;
        if (updates.reportsToId !== undefined) {
          if (!updates.reportsToId || updates.reportsToId === 'ALL') {
            reportsToName = undefined;
          } else {
            const manager = prev.find(m => m.id === updates.reportsToId);
            if (manager) {
              reportsToName = manager.fullName;
            }
          }
        }

        const isSupervisor = updates.isSupervisor !== undefined
          ? updates.isSupervisor
          : updates.role
            ? updates.role === 'SUPERVISOR'
            : member.isSupervisor;

        return {
          ...member,
          ...updates,
          isSupervisor,
          reportsToName,
          updatedAt: new Date().toISOString()
        };
      })
    );

    // Keep selected updated
    setSelectedStaffMember(prev => (prev && prev.id === id ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : prev));
  };

  // Delete Staff Member
  const deleteStaffMember = (id: string) => {
    setStaffMembers(prev => prev.filter(m => m.id !== id));
    if (selectedStaffMember?.id === id) {
      setSelectedStaffMember(null);
    }
  };

  // Allocate Staff to Project
  const allocateStaffToProject = (staffId: string, projectCode: string, projectName?: string, secondaryCodes?: string[]) => {
    updateStaffMember(staffId, {
      assignedProjectCode: projectCode,
      assignedProjectName: projectName,
      assignedProjectCodes: secondaryCodes || [projectCode]
    });
  };

  // Reassign Supervisor / Manager
  const reassignStaffSupervisor = (staffId: string, reportsToId?: string) => {
    updateStaffMember(staffId, {
      reportsToId: reportsToId || undefined
    });
  };

  // Reset Staff Directory to Factory Master Data
  const resetStaffDirectory = () => {
    setStaffMembers(initialStaffMembers);
    setFilterState(initialFilterState);
    setSelectedStaffMember(null);
    try {
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(initialStaffMembers));
    } catch (e) {
      console.error('Failed to reset staff storage:', e);
    }
  };

  // Clear All Staff Directory Records
  const clearStaffDirectory = () => {
    setStaffMembers([]);
    setFilterState(initialFilterState);
    setSelectedStaffMember(null);
    try {
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify([]));
    } catch (e) {
      console.error('Failed to clear staff directory storage:', e);
    }
  };

  // Bulk Import Staff Members
  const bulkImportStaffMembers = (imported: Partial<StaffMember>[]): { count: number; batchId: string } => {
    const batchId = `BATCH-STAFF-${Date.now().toString().slice(-6)}`;
    const newItems: StaffMember[] = imported.map((m, i) => ({
      id: m.id || `staff-imp-${Date.now()}-${i}`,
      employeeCode: m.employeeCode || `EMA-EMP-${String(staffMembers.length + i + 1).padStart(3, '0')}`,
      nicNumber: m.nicNumber || '199000000000',
      fullName: m.fullName || 'Employee Name',
      preferredName: m.preferredName || m.fullName?.split(' ')[0] || 'Employee',
      email: m.email || `${(m.preferredName || 'emp').toLowerCase().replace(/\s+/g, '')}@emaconstruction.lk`,
      phone: m.phone || '+94 77 000 0000',
      role: m.role || 'SITE_ENGINEER',
      designation: m.designation || 'Site Executive',
      department: m.department || 'Project Operations',
      employmentType: m.employmentType || 'Permanent',
      status: m.status || 'Active',
      joinedDate: m.joinedDate || new Date().toISOString().slice(0, 10),
      assignedProjectCode: m.assignedProjectCode || 'PIDM 26',
      assignedProjectName: m.assignedProjectName || 'Primary Project Site',
      assignedProjectCodes: m.assignedProjectCodes || (m.assignedProjectCode ? [m.assignedProjectCode] : ['PIDM 26']),
      reportsToId: m.reportsToId,
      reportsToName: m.reportsToName,
      isSupervisor: m.isSupervisor || m.role === 'SUPERVISOR',
      supervisorId: m.supervisorId,
      legacySupervisorId: m.legacySupervisorId,
      residentialAddress: m.residentialAddress || 'Sri Lanka',
      emergencyContact: m.emergencyContact || {
        name: 'Emergency Contact',
        relationship: 'Family',
        phone: m.phone || '+94 77 000 0000'
      },
      salaryStructure: m.salaryStructure || {
        basicSalary: 120000,
        budgetaryReliefAllowance: 5000,
        siteAllowance: 25000,
        transportAllowance: 20000,
        phoneAllowance: 5000,
        epfEmployeeRate: 8,
        epfEmployerRate: 12,
        etfEmployerRate: 3,
        bankName: 'Bank of Ceylon',
        bankBranch: 'Main Branch',
        accountNumber: '0000000000',
        paymentMode: 'Bank Transfer',
        effectiveDate: '2026-01-01'
      },
      notes: m.notes ? `[BULK IMPORT] ${m.notes}` : `Bulk imported via batch ${batchId}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    setStaffMembers(prev => {
      const merged = [...prev];
      newItems.forEach(newItem => {
        const existingIdx = merged.findIndex(
          x => (newItem.employeeCode && x.employeeCode.toUpperCase() === newItem.employeeCode.toUpperCase()) ||
               (newItem.nicNumber && x.nicNumber.toUpperCase() === newItem.nicNumber.toUpperCase())
        );
        if (existingIdx >= 0) {
          merged[existingIdx] = { ...merged[existingIdx], ...newItem };
        } else {
          merged.unshift(newItem);
        }
      });
      try {
        localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(merged));
      } catch (e) {
        console.error('Error persisting bulk staff import:', e);
      }
      return merged;
    });

    return { count: newItems.length, batchId };
  };

  // Filtered staff list computation
  const filteredStaff = useMemo(() => {
    return staffMembers.filter(member => {
      // 1. Search Query (matches name, code, NIC, designation, email, phone, project)
      if (filterState.searchQuery.trim()) {
        const query = filterState.searchQuery.toLowerCase().trim();
        const matchesQuery =
          member.fullName.toLowerCase().includes(query) ||
          member.preferredName.toLowerCase().includes(query) ||
          member.employeeCode.toLowerCase().includes(query) ||
          member.nicNumber.toLowerCase().includes(query) ||
          member.designation.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query) ||
          member.phone.toLowerCase().includes(query) ||
          (member.epfRegistrationNumber && member.epfRegistrationNumber.toLowerCase().includes(query)) ||
          (member.supervisorId && member.supervisorId.toLowerCase().includes(query)) ||
          (member.assignedProjectCode && member.assignedProjectCode.toLowerCase().includes(query)) ||
          (member.assignedProjectName && member.assignedProjectName.toLowerCase().includes(query)) ||
          (member.assignedProjectCodes && member.assignedProjectCodes.some(c => c.toLowerCase().includes(query)));

        if (!matchesQuery) return false;
      }

      // 2. Department Filter
      if (filterState.department && filterState.department !== 'ALL' && member.department !== filterState.department) {
        return false;
      }

      // 3. Project Filter
      if (filterState.projectCode && filterState.projectCode !== 'ALL') {
        const matchesPrimary = member.assignedProjectCode === filterState.projectCode;
        const matchesSecondary = member.assignedProjectCodes && member.assignedProjectCodes.includes(filterState.projectCode);
        if (!matchesPrimary && !matchesSecondary) {
          return false;
        }
      }

      // 4. Role Filter
      if (filterState.role && filterState.role !== 'ALL' && member.role !== filterState.role) {
        return false;
      }

      // 5. Status Filter
      if (filterState.status && filterState.status !== 'ALL' && member.status !== filterState.status) {
        return false;
      }

      // 6. Employment Type Filter
      if (filterState.employmentType && filterState.employmentType !== 'ALL' && member.employmentType !== filterState.employmentType) {
        return false;
      }

      // 7. Supervisor-only Filter
      if (filterState.supervisorOnly && !member.isSupervisor && member.role !== 'SUPERVISOR') {
        return false;
      }

      // 8. Reports To Filter
      if (filterState.reportsToId && filterState.reportsToId !== 'ALL' && member.reportsToId !== filterState.reportsToId) {
        return false;
      }

      return true;
    });
  }, [staffMembers, filterState]);

  // Statistical summary computation
  const summaryStats: ExtendedStaffSummaryStats = useMemo(() => {
    let active = 0;
    let onLeave = 0;
    let siteCount = 0;
    let headOfficeCount = 0;
    let supervisorsCount = 0;
    let totalPayroll = 0;

    const deptMap: Record<Department, number> = {
      'Management': 0,
      'Civil Engineering': 0,
      'Project Operations': 0,
      'Commercial & QS': 0,
      'Finance & Accounts': 0,
      'Logistics & Fleet': 0,
      'HR & Administration': 0,
      'Quality & Safety': 0
    };

    const projMap: Record<string, number> = {};

    staffMembers.forEach(m => {
      if (m.status === 'Active') active++;
      if (m.status === 'On Leave') onLeave++;
      if (m.role === 'SUPERVISOR' || m.isSupervisor === true) supervisorsCount++;

      if (m.assignedProjectCode === 'HEAD_OFFICE' || !m.assignedProjectCode) {
        headOfficeCount++;
      } else {
        siteCount++;
      }

      // Sum gross payroll estimate (basic + allowances)
      const salary = m.salaryStructure;
      if (salary) {
        const gross =
          (salary.basicSalary || 0) +
          (salary.budgetaryReliefAllowance || 0) +
          (salary.siteAllowance || 0) +
          (salary.transportAllowance || 0) +
          (salary.phoneAllowance || 0);
        totalPayroll += gross;
      }

      // Dept count
      if (deptMap[m.department] !== undefined) {
        deptMap[m.department]++;
      }

      // Project count
      const pCode = m.assignedProjectCode || 'UNASSIGNED';
      projMap[pCode] = (projMap[pCode] || 0) + 1;
    });

    return {
      totalStaff: staffMembers.length,
      activeStaff: active,
      onLeaveStaff: onLeave,
      siteAllocatedStaff: siteCount,
      headOfficeStaff: headOfficeCount,
      supervisorsCount,
      totalMonthlyPayroll: totalPayroll,
      departmentBreakdown: deptMap,
      projectBreakdown: projMap
    };
  }, [staffMembers]);

  return (
    <StaffContext.Provider
      value={{
        staffMembers,
        filteredStaff,
        filterState,
        summaryStats,
        selectedStaffMember,
        isLoading,
        setFilterState,
        resetFilters,
        setSelectedStaffMember,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        getStaffMemberById,
        getDirectReports,
        getReportingHierarchyChain,
        getOrganizationHierarchyTree,
        getSupervisors,
        getDerivedSupervisors,
        getStaffByRole,
        getStaffByDepartment,
        getStaffByProject,
        allocateStaffToProject,
        reassignStaffSupervisor,
        resetStaffDirectory,
        clearStaffDirectory,
        bulkImportStaffMembers
      }}
    >
      {children}
    </StaffContext.Provider>
  );
};

export const useStaff = (): StaffContextType => {
  const context = useContext(StaffContext);
  if (!context) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  return context;
};
