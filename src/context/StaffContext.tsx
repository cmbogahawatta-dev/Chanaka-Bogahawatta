import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  StaffMember,
  StaffFilterState,
  StaffSummaryStats,
  ReportingHierarchyNode,
  Department,
  EmployeeRole,
  EmploymentType,
  StaffStatus
} from '../types/staffTypes';
import { initialStaffMembers } from '../data/staffData';

const STAFF_STORAGE_KEY = 'ema_enterprise_staff_directory_v1';

interface StaffContextType {
  staffMembers: StaffMember[];
  filteredStaff: StaffMember[];
  filterState: StaffFilterState;
  summaryStats: StaffSummaryStats;
  selectedStaffMember: StaffMember | null;
  isLoading: boolean;

  // Actions
  setFilterState: React.Dispatch<React.SetStateAction<StaffFilterState>>;
  resetFilters: () => void;
  setSelectedStaffMember: (member: StaffMember | null) => void;
  addStaffMember: (member: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>) => StaffMember;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => void;
  deleteStaffMember: (id: string) => void;
  getStaffMemberById: (id: string) => StaffMember | undefined;
  getDirectReports: (managerId: string) => StaffMember[];
  getReportingHierarchyChain: (employeeId: string) => StaffMember[];
  getOrganizationHierarchyTree: () => ReportingHierarchyNode[];
  resetStaffDirectory: () => void;
}

const initialFilterState: StaffFilterState = {
  searchQuery: '',
  department: 'ALL',
  projectCode: 'ALL',
  role: 'ALL',
  status: 'ALL',
  employmentType: 'ALL'
};

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export const StaffProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => {
    try {
      const saved = localStorage.getItem(STAFF_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load staff members from localStorage:', e);
    }
    return initialStaffMembers;
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
    return staffMembers.find(m => m.id === id);
  };

  // Direct reports
  const getDirectReports = (managerId: string): StaffMember[] => {
    return staffMembers.filter(m => m.reportsToId === managerId);
  };

  // Hierarchy upward chain (e.g. Employee -> Direct Supervisor -> PM -> Director)
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
          if (!updates.reportsToId) {
            reportsToName = undefined;
          } else {
            const manager = prev.find(m => m.id === updates.reportsToId);
            if (manager) {
              reportsToName = manager.fullName;
            }
          }
        }

        return {
          ...member,
          ...updates,
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

  // Reset Staff Directory to Factory Data
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

  // Filtered staff list computation
  const filteredStaff = useMemo(() => {
    return staffMembers.filter(member => {
      // 1. Search Query (matches name, code, NIC, designation, email, phone)
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
          (member.assignedProjectCode && member.assignedProjectCode.toLowerCase().includes(query)) ||
          (member.assignedProjectName && member.assignedProjectName.toLowerCase().includes(query));

        if (!matchesQuery) return false;
      }

      // 2. Department Filter
      if (filterState.department !== 'ALL' && member.department !== filterState.department) {
        return false;
      }

      // 3. Project Filter
      if (filterState.projectCode !== 'ALL' && member.assignedProjectCode !== filterState.projectCode) {
        return false;
      }

      // 4. Role Filter
      if (filterState.role !== 'ALL' && member.role !== filterState.role) {
        return false;
      }

      // 5. Status Filter
      if (filterState.status !== 'ALL' && member.status !== filterState.status) {
        return false;
      }

      // 6. Employment Type Filter
      if (filterState.employmentType !== 'ALL' && member.employmentType !== filterState.employmentType) {
        return false;
      }

      return true;
    });
  }, [staffMembers, filterState]);

  // Statistical summary computation
  const summaryStats: StaffSummaryStats = useMemo(() => {
    let active = 0;
    let onLeave = 0;
    let siteCount = 0;
    let headOfficeCount = 0;
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
        resetStaffDirectory
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
