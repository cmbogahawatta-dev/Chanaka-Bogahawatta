import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  SalaryHistoryEntry,
  PayrollRateSettings,
  SalaryComponent
} from '../types/salaryHistoryTypes';
import { initialPayrollRateSettings } from '../data/hrInitialData';
import { useStaff } from './StaffContext';
import { AuditService } from '../services/audit/auditService';

const SALARY_HISTORY_KEY = 'ema_salary_history_v1';
const PAYROLL_RATES_KEY = 'ema_payroll_rates_v1';

interface SalaryHistoryContextType {
  salaryHistory: SalaryHistoryEntry[];
  payrollRates: PayrollRateSettings;
  getCurrentSalary: (employeeId: string) => SalaryHistoryEntry | undefined;
  getSalaryAt: (employeeId: string, date: string) => SalaryHistoryEntry | undefined;
  getHistoryForEmployee: (employeeId: string) => SalaryHistoryEntry[];
  createSalaryRevision: (
    entry: Omit<SalaryHistoryEntry, 'id' | 'createdAt'>
  ) => SalaryHistoryEntry;
  updatePayrollRates: (updates: Partial<PayrollRateSettings>) => void;
  resetSalaryHistory: () => void;
}

const SalaryHistoryContext = createContext<SalaryHistoryContextType | undefined>(undefined);

export const SalaryHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { staffMembers } = useStaff();

  const [payrollRates, setPayrollRates] = useState<PayrollRateSettings>(() => {
    try {
      const saved = localStorage.getItem(PAYROLL_RATES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading payroll rates:', e);
    }
    return initialPayrollRateSettings;
  });

  const [salaryHistory, setSalaryHistory] = useState<SalaryHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem(SALARY_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading salary history:', e);
    }
    return [];
  });

  // Seed baseline salary history from staff directory if empty
  useEffect(() => {
    if (salaryHistory.length === 0 && staffMembers.length > 0) {
      const initial: SalaryHistoryEntry[] = staffMembers.map((member, idx) => {
        const basic = member.salaryStructure?.basicSalary || (member.role === 'PROJECT_MANAGER' ? 175000 : member.role === 'SITE_ENGINEER' ? 120000 : 75000);
        const allowances = (member.salaryStructure?.siteAllowance || 0) + (member.salaryStructure?.transportAllowance || 0) + (member.salaryStructure?.phoneAllowance || 0) || (member.role === 'PROJECT_MANAGER' ? 35000 : 15000);

        const earnings: SalaryComponent[] = [
          { id: `comp-b-${idx}`, label: 'Basic Salary', amount: basic, type: 'EARNING', code: 'BASIC', isStatutory: true },
          { id: `comp-a-${idx}`, label: 'Site & Travel Allowance', amount: allowances, type: 'EARNING', code: 'SITE_ALLOWANCE' }
        ];

        const epfEe = Math.round(basic * payrollRates.epfEmployeeRate);
        const deductions: SalaryComponent[] = [
          { id: `comp-d-${idx}`, label: 'EPF Employee (8%)', amount: epfEe, type: 'DEDUCTION', code: 'EPF_EE', isStatutory: true }
        ];

        return {
          id: `sal-init-${member.id}`,
          employeeId: member.id,
          effectiveFrom: member.joinedDate || '2026-01-01',
          effectiveTo: undefined,
          basicSalary: basic,
          earnings,
          deductions,
          epfEligible: member.epfEligible ?? true,
          etfEligible: member.etfEligible ?? true,
          otEligible: member.otEligible ?? (member.role === 'SUPERVISOR' || member.role === 'FOREMAN' || member.role === 'STOREKEEPER' || member.role === 'SITE_ENGINEER'),
          bankName: member.salaryStructure?.bankName || member.bankName || 'Commercial Bank of Ceylon',
          bankBranch: member.salaryStructure?.bankBranch || 'Kollupitiya',
          bankAccountNo: member.salaryStructure?.accountNumber || member.bankAccountNo || '8004592014',
          paymentMode: member.salaryStructure?.paymentMode || 'Bank Transfer',
          remarks: 'Initial employment salary baseline',
          createdAt: new Date().toISOString(),
          createdBy: 'HR_SYSTEM'
        };
      });

      setSalaryHistory(initial);
      try {
        localStorage.setItem(SALARY_HISTORY_KEY, JSON.stringify(initial));
      } catch (e) {
        console.error('Failed to seed salary history:', e);
      }
    }
  }, [staffMembers, salaryHistory.length, payrollRates]);

  const saveHistory = (newHistory: SalaryHistoryEntry[]) => {
    setSalaryHistory(newHistory);
    try {
      localStorage.setItem(SALARY_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (e) {
      console.error('Failed to save salary history:', e);
    }
  };

  const getCurrentSalary = (employeeId: string): SalaryHistoryEntry | undefined => {
    return salaryHistory.find(
      s => s.employeeId === employeeId && !s.effectiveTo
    );
  };

  const getSalaryAt = (employeeId: string, date: string): SalaryHistoryEntry | undefined => {
    const list = salaryHistory.filter(s => s.employeeId === employeeId);
    return list.find(s => {
      const fromMatch = s.effectiveFrom <= date;
      const toMatch = !s.effectiveTo || s.effectiveTo >= date;
      return fromMatch && toMatch;
    }) || getCurrentSalary(employeeId);
  };

  const getHistoryForEmployee = (employeeId: string): SalaryHistoryEntry[] => {
    return salaryHistory
      .filter(s => s.employeeId === employeeId)
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  };

  /**
   * Salary Revision (Section 23 - Immutable historical snapshots)
   */
  const createSalaryRevision = (
    entryData: Omit<SalaryHistoryEntry, 'id' | 'createdAt'>
  ): SalaryHistoryEntry => {
    const newId = `sal-${Date.now()}`;
    const oneDayPrior = new Date(entryData.effectiveFrom);
    oneDayPrior.setDate(oneDayPrior.getDate() - 1);
    const priorEndDate = oneDayPrior.toISOString().slice(0, 10);

    // 1. Close prior active salary entry
    const updated = salaryHistory.map(s => {
      if (s.employeeId === entryData.employeeId && !s.effectiveTo) {
        return {
          ...s,
          effectiveTo: priorEndDate
        };
      }
      return s;
    });

    const newRecord: SalaryHistoryEntry = {
      ...entryData,
      id: newId,
      createdAt: new Date().toISOString()
    };

    const finalHistory = [newRecord, ...updated];
    saveHistory(finalHistory);

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: entryData.createdBy,
      userName: 'HR Executive',
      userRole: 'admin',
      action: 'UPDATE',
      module: 'SALARY',
      recordId: newId,
      recordTitle: `Salary Revision for ${entryData.employeeId}`,
      details: `Revised basic salary to LKR ${entryData.basicSalary.toLocaleString()} effective from ${entryData.effectiveFrom}`
    });

    return newRecord;
  };

  const updatePayrollRates = (updates: Partial<PayrollRateSettings>) => {
    const updated: PayrollRateSettings = {
      ...payrollRates,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    setPayrollRates(updated);
    try {
      localStorage.setItem(PAYROLL_RATES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save payroll rates:', e);
    }

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: 'system',
      userName: 'Admin',
      userRole: 'admin',
      action: 'UPDATE',
      module: 'PAYROLL',
      recordId: 'payroll-rates',
      details: `Updated statutory EPF/ETF or APIT payroll rates`
    });
  };

  const resetSalaryHistory = () => {
    localStorage.removeItem(SALARY_HISTORY_KEY);
    localStorage.removeItem(PAYROLL_RATES_KEY);
    setSalaryHistory([]);
    setPayrollRates(initialPayrollRateSettings);
  };

  return (
    <SalaryHistoryContext.Provider
      value={{
        salaryHistory,
        payrollRates,
        getCurrentSalary,
        getSalaryAt,
        getHistoryForEmployee,
        createSalaryRevision,
        updatePayrollRates,
        resetSalaryHistory
      }}
    >
      {children}
    </SalaryHistoryContext.Provider>
  );
};

export const useSalaryHistory = (): SalaryHistoryContextType => {
  const context = useContext(SalaryHistoryContext);
  if (!context) {
    throw new Error('useSalaryHistory must be used within a SalaryHistoryProvider');
  }
  return context;
};
