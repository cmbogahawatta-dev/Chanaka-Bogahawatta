import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Expense,
  Income,
  Supervisor,
  Project,
  ExpenseCategory,
  InternalTransfer,
  PettyCashUserRole,
  PettyCashFilterState,
  GoogleSheetsConfig,
  PettyCashStatementRow,
  PaymentStatus,
  TransactionType,
  IncomeSource,
  ImportType,
  ImportBatchRecord,
  MappingTemplate,
  DuplicateAction,
  BudgetThresholdLevel,
  ProjectBudgetAlert,
  ProjectBudgetSummary
} from '../types/pettyCashTypes';
import {
  initialExpenses,
  initialIncome,
  initialSupervisors,
  initialProjects,
  initialCategories,
  initialTransfers,
  initialGoogleSheetsConfig,
  initialImportBatches,
  initialMappingTemplates
} from '../data/pettyCashData';
import { DataImportService, dataImportService, ValidationSummary } from '../services/dataImportService';

interface PivotMatrixRow {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  categoryGroup: string;
  projectTotals: Record<string, number>; // projectCode -> amount
  rowTotal: number;
}

interface PivotMatrixData {
  projects: Project[];
  rows: PivotMatrixRow[];
  columnTotals: Record<string, number>; // projectCode -> total
  grandTotal: number;
}

interface PettyCashContextType {
  // State
  expenses: Expense[];
  income: Income[];
  supervisors: Supervisor[];
  projects: Project[];
  categories: ExpenseCategory[];
  transfers: InternalTransfer[];
  importBatches: ImportBatchRecord[];
  mappingTemplates: MappingTemplate[];
  userRole: PettyCashUserRole;
  currentSupervisorName: string;
  filters: PettyCashFilterState;
  sheetsConfig: GoogleSheetsConfig;
  isSyncingWithSheets: boolean;

  // Setters & Role Actions
  setUserRole: (role: PettyCashUserRole) => void;
  setCurrentSupervisorName: (name: string) => void;
  setFilters: React.Dispatch<React.SetStateAction<PettyCashFilterState>>;
  resetFilters: () => void;

  // Filtered Data according to user role & filters
  filteredExpenses: Expense[];
  filteredIncome: Income[];
  filteredTransfers: InternalTransfer[];

  // Dynamic Calculated Metrics & Summaries
  supervisorBalances: Record<string, {
    opening: number;
    incomeTotal: number;
    transfersIn: number;
    transfersOut: number;
    approvedExpenses: number;
    pendingExpenses: number;
    currentBalance: number;
    isOverdrawn: boolean;
  }>;
  
  kpiMetrics: {
    totalExpensesApproved: number;
    totalExpensesPending: number;
    totalIncomeReceived: number;
    netCashFlow: number;
    totalPettyCashInHand: number;
    overdrawnSupervisorsCount: number;
    activeProjectsCount: number;
    activeSupervisorsCount: number;
  };

  pivotMatrix: PivotMatrixData;

  // Helper Statement Generator
  getSupervisorStatement: (supervisorName: string) => PettyCashStatementRow[];

  // CRUD Operations
  addExpense: (expense: Omit<Expense, 'id' | 'EXPENSES_ID' | 'CREATED_DATE'>) => Expense;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  updateExpenseStatus: (id: string, status: PaymentStatus, remarks?: string, approverName?: string) => void;

  addIncome: (income: Omit<Income, 'id' | 'INCOME_ID' | 'CREATED_DATE'>) => Income;
  updateIncome: (id: string, updates: Partial<Income>) => void;
  deleteIncome: (id: string) => void;

  addTransfer: (transfer: Omit<InternalTransfer, 'id' | 'TRANSFER_ID' | 'CREATED_DATE'>) => InternalTransfer;
  updateTransferStatus: (id: string, status: 'Completed' | 'Pending' | 'Cancelled') => void;

  addSupervisor: (supervisor: Omit<Supervisor, 'id' | 'SUPERVISOR_ID' | 'CURRENT_BALANCE'>) => Supervisor;
  updateSupervisor: (id: string, updates: Partial<Supervisor>) => void;
  deleteSupervisor: (id: string) => void;

  addProject: (project: Omit<Project, 'id' | 'PROJECT_ID'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  addCategory: (category: Omit<ExpenseCategory, 'id' | 'CATEGORY_ID'>) => ExpenseCategory;
  updateCategory: (id: string, updates: Partial<ExpenseCategory>) => void;
  deleteCategory: (id: string) => void;

  // Data Import & Migration actions
  importBatchData: (
    batchId: string,
    importType: ImportType,
    summary: ValidationSummary,
    duplicateAction: DuplicateAction,
    options: {
      performedBy: string;
      userRole: string;
      fileName: string;
      fileSize: string;
      skipInvalid: boolean;
    }
  ) => ImportBatchRecord;
  bulkImportExpenses: (
    batchId: string,
    summary: ValidationSummary,
    options: {
      approvalStatus: 'Approved' | 'Pending';
      performedBy: string;
      userRole: string;
      approvedBy?: string;
      approvalRemarks?: string;
      fileName: string;
      fileSize: string;
      skipInvalid: boolean;
      duplicateAction: DuplicateAction;
      autoRegisterSupervisors?: boolean;
      autoRegisterProjects?: boolean;
    }
  ) => { batchRecord: ImportBatchRecord; totalAmount: number; count: number };
  bulkImportSupervisors: (
    batchId: string,
    summary: ValidationSummary,
    options: {
      performedBy: string;
      userRole: string;
      defaultActiveStatus?: boolean;
      approvalRemarks?: string;
      fileName: string;
      fileSize: string;
      skipInvalid: boolean;
      duplicateAction: DuplicateAction;
    }
  ) => { batchRecord: ImportBatchRecord; count: number };
  bulkImportProjects: (
    batchId: string,
    summary: ValidationSummary,
    options: {
      performedBy: string;
      userRole: string;
      defaultStatus?: 'Active' | 'On Hold' | 'Completed';
      defaultPettyCashBudget?: number;
      approvalRemarks?: string;
      fileName: string;
      fileSize: string;
      skipInvalid: boolean;
      duplicateAction: DuplicateAction;
    }
  ) => { batchRecord: ImportBatchRecord; totalContractValue: number; count: number };
  bulkImportIncome: (
    batchId: string,
    summary: ValidationSummary,
    options: {
      performedBy: string;
      userRole: string;
      approvalRemarks?: string;
      fileName: string;
      fileSize: string;
      skipInvalid: boolean;
      duplicateAction: DuplicateAction;
      autoRegisterSupervisors?: boolean;
      autoRegisterProjects?: boolean;
    }
  ) => { batchRecord: ImportBatchRecord; totalAmount: number; count: number };
  bulkApproveExpenses: (expenseIds: string[], approverName?: string, remarks?: string) => void;
  bulkRejectExpenses: (expenseIds: string[], approverName?: string, reason?: string) => void;
  approveImportBatch: (batchId: string, approverName?: string, remarks?: string) => void;
  rollbackImportBatch: (batchId: string, performedBy: string) => { success: boolean; message: string };
  saveMappingTemplate: (template: Omit<MappingTemplate, 'id' | 'createdAt'>) => void;
  deleteMappingTemplate: (id: string) => void;

  // Google Sheets integration actions
  syncWithGoogleSheets: () => Promise<{ success: boolean; message: string }>;
  updateSheetsConfig: (updates: Partial<GoogleSheetsConfig>) => void;
  exportToCsv: (type: 'expenses' | 'income' | 'pivot' | 'statement', supervisorName?: string) => void;

  // Budget Threshold & Supervisor Alerts
  projectBudgetSummaries: ProjectBudgetSummary[];
  budgetAlerts: ProjectBudgetAlert[];
  acknowledgedAlertIds: string[];
  acknowledgeBudgetAlert: (alertId: string, supervisorName?: string) => void;
  unacknowledgeBudgetAlert: (alertId: string) => void;
  clearAllBudgetAlerts: () => void;
  updateProjectBudget: (projectIdOrCode: string, newBudget: number) => void;
  checkBudgetImpact: (projectCode: string, additionalAmount: number) => {
    currentSpent: number;
    allocatedBudget: number;
    currentPercent: number;
    projectedSpent: number;
    projectedPercent: number;
    currentThreshold: BudgetThresholdLevel;
    projectedThreshold: BudgetThresholdLevel;
    willTrigger80: boolean;
    willTrigger95: boolean;
    willExceed: boolean;
    remainingBudget: number;
    message?: string;
  };
  getSupervisorBudgetAlerts: (supervisorName?: string) => ProjectBudgetAlert[];

  // Reset and Clear actions
  resetPettyCashData: () => void;
  clearExpensesHistory: (supervisorName?: string, projectCode?: string) => void;
  clearIncomeHistory: (supervisorName?: string) => void;
  clearTransfersHistory: () => void;
  clearSupervisorsDirectory: () => void;
  clearProjectsHistory: (projectCode?: string) => void;
  clearAllPettyCashHistory: () => void;
}

const STORAGE_KEYS = {
  EXPENSES: 'ema_petty_expenses_v1',
  INCOME: 'ema_petty_income_v1',
  SUPERVISORS: 'ema_petty_supervisors_v1',
  PROJECTS: 'ema_petty_projects_v1',
  CATEGORIES: 'ema_petty_categories_v1',
  TRANSFERS: 'ema_petty_transfers_v1',
  USER_ROLE: 'ema_petty_role_v1',
  CURRENT_SUPERVISOR: 'ema_petty_current_sup_v1',
  SHEETS_CONFIG: 'ema_petty_sheets_config_v1',
  IMPORT_BATCHES: 'ema_petty_import_batches_v1',
  ACKNOWLEDGED_ALERTS: 'ema_petty_acknowledged_alerts_v1',
  MAPPING_TEMPLATES: 'ema_petty_mapping_templates_v1'
};

const defaultFilters: PettyCashFilterState = {
  dateFrom: '',
  dateTo: '',
  project: 'ALL',
  supervisor: 'ALL',
  category: 'ALL',
  status: 'ALL',
  searchQuery: '',
  transactionType: 'ALL',
  dataSource: 'ALL'
};

const PettyCashContext = createContext<PettyCashContextType | undefined>(undefined);

export const PettyCashProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State Initialization from LocalStorage or Defaults
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [income, setIncome] = useState<Income[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INCOME);
    return saved ? JSON.parse(saved) : initialIncome;
  });

  const [supervisors, setSupervisors] = useState<Supervisor[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPERVISORS);
    return saved ? JSON.parse(saved) : initialSupervisors;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return saved ? JSON.parse(saved) : initialProjects;
  });

  const [categories, setCategories] = useState<ExpenseCategory[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [transfers, setTransfers] = useState<InternalTransfer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
    return saved ? JSON.parse(saved) : initialTransfers;
  });

  const [importBatches, setImportBatches] = useState<ImportBatchRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IMPORT_BATCHES);
    return saved ? JSON.parse(saved) : initialImportBatches;
  });

  const [mappingTemplates, setMappingTemplates] = useState<MappingTemplate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MAPPING_TEMPLATES);
    return saved ? JSON.parse(saved) : initialMappingTemplates;
  });

  const [userRole, setUserRoleState] = useState<PettyCashUserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    return (saved as PettyCashUserRole) || 'ADMIN';
  });

  const [currentSupervisorName, setCurrentSupervisorNameState] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_SUPERVISOR);
    return saved || 'BUDDIKA';
  });

  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHEETS_CONFIG);
    return saved ? JSON.parse(saved) : initialGoogleSheetsConfig;
  });

  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACKNOWLEDGED_ALERTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [filters, setFilters] = useState<PettyCashFilterState>(defaultFilters);
  const [isSyncingWithSheets, setIsSyncingWithSheets] = useState<boolean>(false);

  // Persistence to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INCOME, JSON.stringify(income));
  }, [income]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUPERVISORS, JSON.stringify(supervisors));
  }, [supervisors]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
  }, [transfers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IMPORT_BATCHES, JSON.stringify(importBatches));
  }, [importBatches]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MAPPING_TEMPLATES, JSON.stringify(mappingTemplates));
  }, [mappingTemplates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHEETS_CONFIG, JSON.stringify(sheetsConfig));
  }, [sheetsConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACKNOWLEDGED_ALERTS, JSON.stringify(acknowledgedAlertIds));
  }, [acknowledgedAlertIds]);

  const setUserRole = (role: PettyCashUserRole) => {
    setUserRoleState(role);
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
  };

  const setCurrentSupervisorName = (name: string) => {
    setCurrentSupervisorNameState(name);
    localStorage.setItem(STORAGE_KEYS.CURRENT_SUPERVISOR, name);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  // Dynamic Supervisor Petty Cash Balance calculation engine
  const supervisorBalances = useMemo(() => {
    const balances: Record<string, {
      opening: number;
      incomeTotal: number;
      transfersIn: number;
      transfersOut: number;
      approvedExpenses: number;
      pendingExpenses: number;
      currentBalance: number;
      isOverdrawn: boolean;
    }> = {};

    supervisors.forEach(sup => {
      const supName = sup.SUPERVISOR_NAME.trim().toUpperCase();
      const opening = sup.OPENING_PETTY_CASH || 0;

      // Income / Top-ups to this supervisor
      const incomeTotal = income
        .filter(inc => inc.SUPERVISOR?.trim().toUpperCase() === supName)
        .reduce((sum, inc) => sum + (Number(inc.AMOUNT) || 0), 0);

      // Internal Transfers In
      const transfersIn = transfers
        .filter(trf => trf.TO_SUPERVISOR?.trim().toUpperCase() === supName && trf.STATUS === 'Completed')
        .reduce((sum, trf) => sum + (Number(trf.AMOUNT) || 0), 0);

      // Internal Transfers Out
      const transfersOut = transfers
        .filter(trf => trf.FROM_SUPERVISOR?.trim().toUpperCase() === supName && trf.STATUS === 'Completed')
        .reduce((sum, trf) => sum + (Number(trf.AMOUNT) || 0), 0);

      // Approved / Paid / Reimbursed expenses
      const approvedExpenses = expenses
        .filter(exp => 
          exp.SUPERVISOR?.trim().toUpperCase() === supName && 
          (exp.PAYMENT_STATUS === 'Approved' || exp.PAYMENT_STATUS === 'Paid' || exp.PAYMENT_STATUS === 'Reimbursed')
        )
        .reduce((sum, exp) => sum + (Number(exp.AMOUNT) || 0), 0);

      // Pending expenses (tracked separately, does not deduct yet)
      const pendingExpenses = expenses
        .filter(exp => 
          exp.SUPERVISOR?.trim().toUpperCase() === supName && 
          exp.PAYMENT_STATUS === 'Pending'
        )
        .reduce((sum, exp) => sum + (Number(exp.AMOUNT) || 0), 0);

      const currentBalance = opening + incomeTotal + transfersIn - approvedExpenses - transfersOut;

      balances[supName] = {
        opening,
        incomeTotal,
        transfersIn,
        transfersOut,
        approvedExpenses,
        pendingExpenses,
        currentBalance,
        isOverdrawn: currentBalance < 0
      };
    });

    return balances;
  }, [supervisors, income, expenses, transfers]);

  // Scoped Expenses based on Role + Active Filters
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      // Role scope: Supervisor role can only see their own submitted expenses
      if (userRole === 'SUPERVISOR') {
        if (exp.SUPERVISOR.trim().toUpperCase() !== currentSupervisorName.trim().toUpperCase()) {
          return false;
        }
      }

      // Filter: Supervisor
      if (filters.supervisor !== 'ALL' && exp.SUPERVISOR !== filters.supervisor) {
        return false;
      }

      // Filter: Project
      if (filters.project !== 'ALL' && exp.PROJECT !== filters.project) {
        return false;
      }

      // Filter: Category
      if (filters.category !== 'ALL' && exp.EXPENSES_CATEGORY !== filters.category) {
        return false;
      }

      // Filter: Status
      if (filters.status !== 'ALL' && exp.PAYMENT_STATUS !== filters.status) {
        return false;
      }

      // Filter: Date Range
      if (filters.dateFrom) {
        const expDate = exp.DATE_REF || '';
        if (expDate && expDate < filters.dateFrom) return false;
      }
      if (filters.dateTo) {
        const expDate = exp.DATE_REF || '';
        if (expDate && expDate > filters.dateTo) return false;
      }

      // Filter: Search Query (ID, Description, Category, Remarks)
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const match =
          exp.EXPENSES_ID.toLowerCase().includes(q) ||
          exp.EXPENSES_DESCRIPTION.toLowerCase().includes(q) ||
          exp.EXPENSES_CATEGORY.toLowerCase().includes(q) ||
          exp.PROJECT.toLowerCase().includes(q) ||
          exp.SUPERVISOR.toLowerCase().includes(q) ||
          (exp.PRV_NUMBER && exp.PRV_NUMBER.toLowerCase().includes(q)) ||
          (exp.REMARKS && exp.REMARKS.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Filter: Data Source (All, System, Historical)
      if (filters.dataSource && filters.dataSource !== 'ALL') {
        if (filters.dataSource === 'HISTORICAL') {
          if (!exp.IS_HISTORICAL && exp.DATA_SOURCE !== 'HISTORICAL_IMPORT') return false;
        } else if (filters.dataSource === 'SYSTEM') {
          if (exp.IS_HISTORICAL || exp.DATA_SOURCE === 'HISTORICAL_IMPORT') return false;
        }
      }

      return true;
    });
  }, [expenses, userRole, currentSupervisorName, filters]);

  // Scoped Income based on Role + Active Filters
  const filteredIncome = useMemo(() => {
    return income.filter(inc => {
      if (userRole === 'SUPERVISOR') {
        if (inc.SUPERVISOR.trim().toUpperCase() !== currentSupervisorName.trim().toUpperCase()) {
          return false;
        }
      }

      if (filters.supervisor !== 'ALL' && inc.SUPERVISOR !== filters.supervisor) {
        return false;
      }

      if (filters.project !== 'ALL' && inc.PROJECT !== filters.project) {
        return false;
      }

      if (filters.dateFrom && inc.DATE_REF && inc.DATE_REF < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && inc.DATE_REF && inc.DATE_REF > filters.dateTo) {
        return false;
      }

      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const match =
          inc.INCOME_ID.toLowerCase().includes(q) ||
          inc.INCOME_SOURCE.toLowerCase().includes(q) ||
          inc.SUPERVISOR.toLowerCase().includes(q) ||
          inc.PROJECT.toLowerCase().includes(q) ||
          (inc.REMARKS && inc.REMARKS.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [income, userRole, currentSupervisorName, filters]);

  // Scoped Internal Transfers
  const filteredTransfers = useMemo(() => {
    return transfers.filter(trf => {
      if (userRole === 'SUPERVISOR') {
        const cur = currentSupervisorName.trim().toUpperCase();
        if (trf.FROM_SUPERVISOR.trim().toUpperCase() !== cur && trf.TO_SUPERVISOR.trim().toUpperCase() !== cur) {
          return false;
        }
      }
      return true;
    });
  }, [transfers, userRole, currentSupervisorName]);

  // Top KPI Metrics
  const kpiMetrics = useMemo(() => {
    const totalExpensesApproved = filteredExpenses
      .filter(e => e.PAYMENT_STATUS === 'Approved' || e.PAYMENT_STATUS === 'Paid' || e.PAYMENT_STATUS === 'Reimbursed')
      .reduce((sum, e) => sum + (Number(e.AMOUNT) || 0), 0);

    const totalExpensesPending = filteredExpenses
      .filter(e => e.PAYMENT_STATUS === 'Pending')
      .reduce((sum, e) => sum + (Number(e.AMOUNT) || 0), 0);

    const totalIncomeReceived = filteredIncome
      .reduce((sum, i) => sum + (Number(i.AMOUNT) || 0), 0);

    const netCashFlow = totalIncomeReceived - totalExpensesApproved;

    let totalPettyCashInHand = 0;
    let overdrawnSupervisorsCount = 0;

    Object.values(supervisorBalances).forEach((b: { currentBalance: number; isOverdrawn: boolean }) => {
      totalPettyCashInHand += b.currentBalance;
      if (b.isOverdrawn) overdrawnSupervisorsCount++;
    });

    const activeProjectsCount = projects.filter(p => p.STATUS === 'Active').length;
    const activeSupervisorsCount = supervisors.filter(s => s.ACTIVE).length;

    return {
      totalExpensesApproved,
      totalExpensesPending,
      totalIncomeReceived,
      netCashFlow,
      totalPettyCashInHand,
      overdrawnSupervisorsCount,
      activeProjectsCount,
      activeSupervisorsCount
    };
  }, [filteredExpenses, filteredIncome, supervisorBalances, projects, supervisors]);

  // Project-wise Category Pivot Matrix calculation
  const pivotMatrix = useMemo<PivotMatrixData>(() => {
    // Collect active projects list
    const activeProjectsList = projects.filter(p => p.STATUS === 'Active');
    const columnTotals: Record<string, number> = {};
    activeProjectsList.forEach(p => {
      columnTotals[p.PROJECT_CODE] = 0;
    });

    let overallGrandTotal = 0;

    // Filtered eligible approved/paid expenses for the matrix
    const eligibleExpenses = filteredExpenses.filter(
      e => e.PAYMENT_STATUS === 'Approved' || e.PAYMENT_STATUS === 'Paid' || e.PAYMENT_STATUS === 'Reimbursed'
    );

    const rows: PivotMatrixRow[] = categories.map(cat => {
      const projectTotals: Record<string, number> = {};
      let rowTotal = 0;

      activeProjectsList.forEach(p => {
        const spent = eligibleExpenses
          .filter(e => e.EXPENSES_CATEGORY === cat.CATEGORY_NAME && e.PROJECT === p.PROJECT_CODE)
          .reduce((sum, e) => sum + (Number(e.AMOUNT) || 0), 0);

        projectTotals[p.PROJECT_CODE] = spent;
        rowTotal += spent;
        columnTotals[p.PROJECT_CODE] = (columnTotals[p.PROJECT_CODE] || 0) + spent;
      });

      overallGrandTotal += rowTotal;

      return {
        categoryId: cat.id,
        categoryCode: cat.CATEGORY_CODE,
        categoryName: cat.CATEGORY_NAME,
        categoryGroup: cat.CATEGORY_GROUP,
        projectTotals,
        rowTotal
      };
    });

    return {
      projects: activeProjectsList,
      rows,
      columnTotals,
      grandTotal: overallGrandTotal
    };
  }, [categories, projects, filteredExpenses]);

  // ----------------------------------------------------
  // Project Budget Threshold & Supervisor Alert System
  // ----------------------------------------------------
  const projectBudgetSummaries = useMemo<ProjectBudgetSummary[]>(() => {
    return projects.map(proj => {
      const budget = Number(proj.BUDGET_PETTY_CASH ?? proj.BUDGET ?? 0);

      // Approved expenses for this project
      const approvedExpenses = expenses.filter(
        e => e.PROJECT === proj.PROJECT_CODE && (e.PAYMENT_STATUS === 'Approved' || e.PAYMENT_STATUS === 'Paid' || e.PAYMENT_STATUS === 'Reimbursed')
      );
      const approvedSpent = approvedExpenses.reduce((sum, e) => sum + (Number(e.AMOUNT) || 0), 0);

      // Pending expenses for this project
      const pendingExpenses = expenses.filter(
        e => e.PROJECT === proj.PROJECT_CODE && e.PAYMENT_STATUS === 'Pending'
      );
      const pendingSpent = pendingExpenses.reduce((sum, e) => sum + (Number(e.AMOUNT) || 0), 0);

      const totalCommitted = approvedSpent + pendingSpent;
      const remainingBudget = Math.max(0, budget - approvedSpent);
      const utilizationPercentage = budget > 0 ? (approvedSpent / budget) * 100 : 0;

      let thresholdLevel: BudgetThresholdLevel = 'NORMAL';
      let thresholdPercent: 80 | 95 | 100 = 80;
      let severity: 'warning' | 'critical' | 'danger' = 'warning';

      if (budget > 0) {
        if (utilizationPercentage >= 100) {
          thresholdLevel = 'OVER_BUDGET';
          thresholdPercent = 100;
          severity = 'danger';
        } else if (utilizationPercentage >= 95) {
          thresholdLevel = 'CRITICAL_95';
          thresholdPercent = 95;
          severity = 'critical';
        } else if (utilizationPercentage >= 80) {
          thresholdLevel = 'WARNING_80';
          thresholdPercent = 80;
          severity = 'warning';
        }
      }

      // Find assigned / involved supervisors for this project
      const assignedSupNames = new Set<string>();
      supervisors.forEach(sup => {
        if (sup.ASSIGNED_PROJECTS && sup.ASSIGNED_PROJECTS.some(p => p.trim().toUpperCase() === proj.PROJECT_CODE.trim().toUpperCase())) {
          assignedSupNames.add(sup.SUPERVISOR_NAME);
        }
      });
      // Also include supervisors who recorded expenses for this project
      expenses.filter(e => e.PROJECT === proj.PROJECT_CODE).forEach(e => {
        if (e.SUPERVISOR) assignedSupNames.add(e.SUPERVISOR);
      });
      const assignedSupervisors = Array.from(assignedSupNames);

      let alert: ProjectBudgetAlert | undefined = undefined;
      if (thresholdLevel !== 'NORMAL') {
        const alertId = `alert-${proj.PROJECT_CODE}-${thresholdLevel}`;
        const isAcknowledged = acknowledgedAlertIds.includes(alertId);

        let message = '';
        if (thresholdLevel === 'OVER_BUDGET') {
          message = `Project ${proj.PROJECT_CODE} has EXCEEDED its allocated petty cash budget of LKR ${budget.toLocaleString('en-LK', { minimumFractionDigits: 2 })} by LKR ${(approvedSpent - budget).toLocaleString('en-LK', { minimumFractionDigits: 2 })} (${utilizationPercentage.toFixed(1)}% spent).`;
        } else if (thresholdLevel === 'CRITICAL_95') {
          message = `CRITICAL 95% ALERT: Project ${proj.PROJECT_CODE} has utilized ${utilizationPercentage.toFixed(1)}% (LKR ${approvedSpent.toLocaleString('en-LK', { minimumFractionDigits: 2 })} of LKR ${budget.toLocaleString('en-LK', { minimumFractionDigits: 2 })}) of its allocated budget. Only LKR ${(budget - approvedSpent).toLocaleString('en-LK', { minimumFractionDigits: 2 })} remaining.`;
        } else {
          message = `80% BUDGET WARNING: Project ${proj.PROJECT_CODE} has reached ${utilizationPercentage.toFixed(1)}% (LKR ${approvedSpent.toLocaleString('en-LK', { minimumFractionDigits: 2 })} of LKR ${budget.toLocaleString('en-LK', { minimumFractionDigits: 2 })}) of its allocated petty cash budget.`;
        }

        alert = {
          id: alertId,
          projectId: proj.id,
          projectCode: proj.PROJECT_CODE,
          projectName: proj.PROJECT_NAME,
          allocatedBudget: budget,
          spentAmount: approvedSpent,
          pendingAmount: pendingSpent,
          totalCommitted,
          remainingBudget,
          utilizationPercentage,
          thresholdLevel,
          thresholdPercent,
          severity,
          message,
          assignedSupervisors,
          acknowledged: isAcknowledged,
          timestamp: new Date().toISOString()
        };
      }

      return {
        projectId: proj.id,
        projectCode: proj.PROJECT_CODE,
        projectName: proj.PROJECT_NAME,
        client: proj.CLIENT || proj.CLIENT_NAME,
        status: proj.STATUS,
        allocatedBudget: budget,
        approvedSpent,
        pendingSpent,
        totalCommitted,
        remainingBudget,
        utilizationPercentage,
        thresholdLevel,
        assignedSupervisors,
        alert
      };
    });
  }, [projects, expenses, supervisors, acknowledgedAlertIds]);

  const budgetAlerts = useMemo<ProjectBudgetAlert[]>(() => {
    return projectBudgetSummaries
      .map(s => s.alert)
      .filter((a): a is ProjectBudgetAlert => a !== undefined);
  }, [projectBudgetSummaries]);

  const acknowledgeBudgetAlert = (alertId: string, supervisorName?: string) => {
    setAcknowledgedAlertIds(prev => prev.includes(alertId) ? prev : [...prev, alertId]);
  };

  const unacknowledgeBudgetAlert = (alertId: string) => {
    setAcknowledgedAlertIds(prev => prev.filter(id => id !== alertId));
  };

  const clearAllBudgetAlerts = () => {
    const allAlertIds = budgetAlerts.map(a => a.id);
    setAcknowledgedAlertIds(prev => Array.from(new Set([...prev, ...allAlertIds])));
  };

  const updateProjectBudget = (projectIdOrCode: string, newBudget: number) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectIdOrCode || p.PROJECT_CODE === projectIdOrCode || p.PROJECT_ID === projectIdOrCode) {
        return {
          ...p,
          BUDGET_PETTY_CASH: newBudget,
          BUDGET: newBudget
        };
      }
      return p;
    }));
  };

  const checkBudgetImpact = (projectCode: string, additionalAmount: number) => {
    const proj = projects.find(p => p.PROJECT_CODE === projectCode);
    const budget = Number(proj?.BUDGET_PETTY_CASH ?? proj?.BUDGET ?? 0);
    const approvedExpenses = expenses.filter(
      e => e.PROJECT === projectCode && (e.PAYMENT_STATUS === 'Approved' || e.PAYMENT_STATUS === 'Paid' || e.PAYMENT_STATUS === 'Reimbursed')
    );
    const currentSpent = approvedExpenses.reduce((sum, e) => sum + (Number(e.AMOUNT) || 0), 0);
    const currentPercent = budget > 0 ? (currentSpent / budget) * 100 : 0;
    const projectedSpent = currentSpent + Math.max(0, additionalAmount || 0);
    const projectedPercent = budget > 0 ? (projectedSpent / budget) * 100 : 0;

    let currentThreshold: BudgetThresholdLevel = 'NORMAL';
    if (budget > 0) {
      if (currentPercent >= 100) currentThreshold = 'OVER_BUDGET';
      else if (currentPercent >= 95) currentThreshold = 'CRITICAL_95';
      else if (currentPercent >= 80) currentThreshold = 'WARNING_80';
    }

    let projectedThreshold: BudgetThresholdLevel = 'NORMAL';
    if (budget > 0) {
      if (projectedPercent >= 100) projectedThreshold = 'OVER_BUDGET';
      else if (projectedPercent >= 95) projectedThreshold = 'CRITICAL_95';
      else if (projectedPercent >= 80) projectedThreshold = 'WARNING_80';
    }

    const willTrigger80 = currentPercent < 80 && projectedPercent >= 80 && projectedPercent < 95;
    const willTrigger95 = currentPercent < 95 && projectedPercent >= 95 && projectedPercent < 100;
    const willExceed = currentPercent < 100 && projectedPercent >= 100;

    let message = '';
    if (projectedPercent >= 100) {
      message = `This expense of LKR ${(additionalAmount || 0).toLocaleString()} will cause ${projectCode} to EXCEED its allocated petty cash budget (${projectedPercent.toFixed(1)}% utilized).`;
    } else if (projectedPercent >= 95) {
      message = `Critical 95% Threshold Alert: Adding this expense will push ${projectCode} budget utilization to ${projectedPercent.toFixed(1)}% (LKR ${projectedSpent.toLocaleString()} of LKR ${budget.toLocaleString()}).`;
    } else if (projectedPercent >= 80) {
      message = `80% Threshold Warning: Adding this expense will push ${projectCode} budget utilization to ${projectedPercent.toFixed(1)}% (LKR ${projectedSpent.toLocaleString()} of LKR ${budget.toLocaleString()}).`;
    }

    return {
      currentSpent,
      allocatedBudget: budget,
      currentPercent,
      projectedSpent,
      projectedPercent,
      currentThreshold,
      projectedThreshold,
      willTrigger80,
      willTrigger95,
      willExceed,
      remainingBudget: Math.max(0, budget - projectedSpent),
      message
    };
  };

  const getSupervisorBudgetAlerts = (supervisorName?: string) => {
    const targetName = (supervisorName || currentSupervisorName).trim().toUpperCase();
    return budgetAlerts.filter(a =>
      a.assignedSupervisors.some(s => s.trim().toUpperCase() === targetName)
    );
  };

  // Sequential Supervisor Petty Cash Statement Generator
  const getSupervisorStatement = (supervisorName: string): PettyCashStatementRow[] => {
    const supName = supervisorName.trim().toUpperCase();
    const sup = supervisors.find(s => s.SUPERVISOR_NAME.trim().toUpperCase() === supName);
    const openingBal = sup?.OPENING_PETTY_CASH || 0;

    interface RawItem {
      date: string;
      dateRef: string;
      transactionId: string;
      description: string;
      project: string;
      type: 'OPENING' | 'INCOME' | 'EXPENSE' | 'TRANSFER_IN' | 'TRANSFER_OUT';
      incomeAmount: number;
      expenseAmount: number;
      status: PaymentStatus | 'Completed';
      proofUrl?: string;
      remarks?: string;
    }

    const items: RawItem[] = [];

    // 1. Initial Opening Balance Entry
    items.push({
      date: '01/08/2026',
      dateRef: '2026-08-01',
      transactionId: `OPEN-${sup?.SUPERVISOR_ID || '001'}`,
      description: `Opening Petty Cash Float Allocated`,
      project: 'HEAD_OFFICE',
      type: 'OPENING',
      incomeAmount: openingBal,
      expenseAmount: 0,
      status: 'Completed',
      remarks: 'Initial cash baseline'
    });

    // 2. Incomes / Top-ups
    income
      .filter(inc => inc.SUPERVISOR.trim().toUpperCase() === supName)
      .forEach(inc => {
        items.push({
          date: inc.DATE,
          dateRef: inc.DATE_REF,
          transactionId: inc.INCOME_ID,
          description: `${inc.INCOME_SOURCE} - ${inc.REMARKS || 'Cash Float'}`,
          project: inc.PROJECT,
          type: 'INCOME',
          incomeAmount: Number(inc.AMOUNT) || 0,
          expenseAmount: 0,
          status: 'Completed',
          proofUrl: inc.PROOF_DOCUMENT,
          remarks: inc.REMARKS
        });
      });

    // 3. Expenses
    expenses
      .filter(exp => exp.SUPERVISOR.trim().toUpperCase() === supName)
      .forEach(exp => {
        items.push({
          date: exp.DATE,
          dateRef: exp.DATE_REF,
          transactionId: exp.EXPENSES_ID,
          description: `[${exp.EXPENSES_CATEGORY}] ${exp.EXPENSES_DESCRIPTION}`,
          project: exp.PROJECT,
          type: 'EXPENSE',
          incomeAmount: 0,
          expenseAmount: Number(exp.AMOUNT) || 0,
          status: exp.PAYMENT_STATUS,
          proofUrl: exp.PROOF_DOCUMENT,
          remarks: exp.REMARKS
        });
      });

    // 4. Transfers In
    transfers
      .filter(trf => trf.TO_SUPERVISOR.trim().toUpperCase() === supName && trf.STATUS === 'Completed')
      .forEach(trf => {
        items.push({
          date: trf.DATE,
          dateRef: trf.DATE_REF,
          transactionId: trf.TRANSFER_ID,
          description: `Internal Transfer from ${trf.FROM_SUPERVISOR} - ${trf.REMARKS}`,
          project: 'TRANSFER',
          type: 'TRANSFER_IN',
          incomeAmount: Number(trf.AMOUNT) || 0,
          expenseAmount: 0,
          status: 'Completed',
          remarks: trf.REMARKS
        });
      });

    // 5. Transfers Out
    transfers
      .filter(trf => trf.FROM_SUPERVISOR.trim().toUpperCase() === supName && trf.STATUS === 'Completed')
      .forEach(trf => {
        items.push({
          date: trf.DATE,
          dateRef: trf.DATE_REF,
          transactionId: trf.TRANSFER_ID,
          description: `Internal Transfer to ${trf.TO_SUPERVISOR} - ${trf.REMARKS}`,
          project: 'TRANSFER',
          type: 'TRANSFER_OUT',
          incomeAmount: 0,
          expenseAmount: Number(trf.AMOUNT) || 0,
          status: 'Completed',
          remarks: trf.REMARKS
        });
      });

    // Sort chronologically by dateRef
    items.sort((a, b) => a.dateRef.localeCompare(b.dateRef));

    // Compute sequential running balance (Only completed/approved transactions affect running balance)
    let currentRunning = 0;
    const statement: PettyCashStatementRow[] = items.map(item => {
      const isApprovedOrPaid = item.type === 'OPENING' || item.type === 'INCOME' || item.type === 'TRANSFER_IN' || item.type === 'TRANSFER_OUT' || (item.status === 'Approved' || item.status === 'Paid' || item.status === 'Reimbursed');
      
      if (isApprovedOrPaid) {
        if (item.type === 'OPENING' || item.type === 'INCOME' || item.type === 'TRANSFER_IN') {
          currentRunning += item.incomeAmount;
        } else {
          currentRunning -= item.expenseAmount;
        }
      }

      return {
        ...item,
        runningBalance: currentRunning
      };
    });

    return statement;
  };

  // CRUD Implementations
  const addExpense = (newExpData: Omit<Expense, 'id' | 'EXPENSES_ID' | 'CREATED_DATE'>): Expense => {
    const dateObj = new Date();
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const seq = String(expenses.length + 1).padStart(4, '0');
    const generatedId = `EXP-${yyyy}${mm}-${seq}`;

    const newExpense: Expense = {
      ...newExpData,
      id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      EXPENSES_ID: generatedId,
      CREATED_DATE: new Date().toLocaleString('en-GB')
    };

    setExpenses(prev => [newExpense, ...prev]);
    return newExpense;
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses(prev =>
      prev.map(exp => (exp.id === id ? { ...exp, ...updates, UPDATED_DATE: new Date().toLocaleString('en-GB') } : exp))
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  const updateExpenseStatus = (id: string, status: PaymentStatus, remarks?: string, approverName?: string) => {
    setExpenses(prev =>
      prev.map(exp => {
        if (exp.id === id) {
          return {
            ...exp,
            PAYMENT_STATUS: status,
            APPROVED_BY: status === 'Approved' || status === 'Paid' ? (approverName || 'finance@company.com') : exp.APPROVED_BY,
            APPROVED_DATE: status === 'Approved' || status === 'Paid' ? new Date().toLocaleString('en-GB') : exp.APPROVED_DATE,
            REMARKS: remarks ? `${exp.REMARKS ? exp.REMARKS + ' | ' : ''}${remarks}` : exp.REMARKS,
            REJECTION_REASON: status === 'Rejected' ? remarks : exp.REJECTION_REASON,
            UPDATED_DATE: new Date().toLocaleString('en-GB')
          };
        }
        return exp;
      })
    );
  };

  const addIncome = (newIncData: Omit<Income, 'id' | 'INCOME_ID' | 'CREATED_DATE'>): Income => {
    const dateObj = new Date();
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const seq = String(income.length + 1).padStart(3, '0');
    const generatedId = `INC-${yyyy}${mm}-${seq}`;

    const newInc: Income = {
      ...newIncData,
      id: `inc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      INCOME_ID: generatedId,
      CREATED_DATE: new Date().toLocaleString('en-GB')
    };

    setIncome(prev => [newInc, ...prev]);
    return newInc;
  };

  const updateIncome = (id: string, updates: Partial<Income>) => {
    setIncome(prev => prev.map(inc => (inc.id === id ? { ...inc, ...updates } : inc)));
  };

  const deleteIncome = (id: string) => {
    setIncome(prev => prev.filter(inc => inc.id !== id));
  };

  const addTransfer = (newTrfData: Omit<InternalTransfer, 'id' | 'TRANSFER_ID' | 'CREATED_DATE'>): InternalTransfer => {
    const dateObj = new Date();
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const seq = String(transfers.length + 1).padStart(3, '0');
    const generatedId = `TRF-${yyyy}${mm}-${seq}`;

    const newTrf: InternalTransfer = {
      ...newTrfData,
      id: `trf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      TRANSFER_ID: generatedId,
      CREATED_DATE: new Date().toLocaleString('en-GB')
    };

    setTransfers(prev => [newTrf, ...prev]);
    return newTrf;
  };

  const updateTransferStatus = (id: string, status: 'Completed' | 'Pending' | 'Cancelled') => {
    setTransfers(prev => prev.map(trf => (trf.id === id ? { ...trf, STATUS: status } : trf)));
  };

  const addSupervisor = (sup: Omit<Supervisor, 'id' | 'SUPERVISOR_ID' | 'CURRENT_BALANCE'>): Supervisor => {
    const newId = `sup-${Date.now().toString(36)}`;
    const seq = String(supervisors.length + 1).padStart(3, '0');
    const newSupervisor: Supervisor = {
      ...sup,
      id: newId,
      SUPERVISOR_ID: `SUP-${seq}`,
      CURRENT_BALANCE: sup.OPENING_PETTY_CASH || 0
    };
    setSupervisors(prev => [...prev, newSupervisor]);
    return newSupervisor;
  };

  const updateSupervisor = (id: string, updates: Partial<Supervisor>) => {
    setSupervisors(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSupervisor = (id: string) => {
    setSupervisors(prev => prev.filter(s => s.id !== id));
  };

  const addProject = (prj: Omit<Project, 'id' | 'PROJECT_ID'>): Project => {
    const newId = `prj-${Date.now().toString(36)}`;
    const seq = String(projects.length + 1).padStart(3, '0');
    const newPrj: Project = {
      ...prj,
      id: newId,
      PROJECT_ID: `PRJ-${seq}`
    };
    setProjects(prev => [...prev, newPrj]);
    return newPrj;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const addCategory = (cat: Omit<ExpenseCategory, 'id' | 'CATEGORY_ID'>): ExpenseCategory => {
    const newId = `cat-${Date.now().toString(36)}`;
    const newCat: ExpenseCategory = {
      ...cat,
      id: newId,
      CATEGORY_ID: `CAT-${cat.CATEGORY_CODE || 'NEW'}`
    };
    setCategories(prev => [...prev, newCat]);
    return newCat;
  };

  const updateCategory = (id: string, updates: Partial<ExpenseCategory>) => {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Google Sheets integration actions
  const syncWithGoogleSheets = async (): Promise<{ success: boolean; message: string }> => {
    setIsSyncingWithSheets(true);
    try {
      // Simulate real Google Sheets bidirectional sync latency
      await new Promise(resolve => setTimeout(resolve, 1200));

      const updatedTime = new Date().toISOString();
      setSheetsConfig(prev => ({
        ...prev,
        isConnected: true,
        lastSyncedAt: updatedTime
      }));

      setIsSyncingWithSheets(false);
      return {
        success: true,
        message: `Successfully synchronized ${expenses.length} expenses, ${income.length} income entries, and ${supervisors.length} supervisor balances with Google Sheets "${sheetsConfig.spreadsheetName}"!`
      };
    } catch (e: any) {
      setIsSyncingWithSheets(false);
      return {
        success: false,
        message: `Failed to sync with Google Sheets: ${e?.message || 'Network error'}`
      };
    }
  };

  const updateSheetsConfig = (updates: Partial<GoogleSheetsConfig>) => {
    setSheetsConfig(prev => ({ ...prev, ...updates }));
  };

  // Export engine to CSV / Excel compatible text
  const exportToCsv = (type: 'expenses' | 'income' | 'pivot' | 'statement', supervisorName?: string) => {
    let csvContent = '';
    let fileName = `EMA_PettyCash_${type}_${new Date().toISOString().split('T')[0]}.csv`;

    if (type === 'expenses') {
      const headers = [
        'EXPENSES_ID',
        'DATE',
        'SUPERVISOR',
        'PROJECT',
        'CATEGORY',
        'AMOUNT (LKR)',
        'DESCRIPTION',
        'STATUS',
        'CREATED_BY',
        'CREATED_DATE',
        'APPROVED_BY',
        'REMARKS'
      ];
      const rows = filteredExpenses.map(e => [
        `"${e.EXPENSES_ID}"`,
        `"${e.DATE}"`,
        `"${e.SUPERVISOR}"`,
        `"${e.PROJECT}"`,
        `"${e.EXPENSES_CATEGORY}"`,
        e.AMOUNT,
        `"${(e.EXPENSES_DESCRIPTION || '').replace(/"/g, '""')}"`,
        `"${e.PAYMENT_STATUS}"`,
        `"${e.CREATED_BY}"`,
        `"${e.CREATED_DATE}"`,
        `"${e.APPROVED_BY || ''}"`,
        `"${(e.REMARKS || '').replace(/"/g, '""')}"`
      ]);
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else if (type === 'income') {
      const headers = [
        'INCOME_ID',
        'DATE',
        'SUPERVISOR',
        'PROJECT',
        'SOURCE',
        'AMOUNT (LKR)',
        'CREATED_BY',
        'CREATED_DATE',
        'REMARKS'
      ];
      const rows = filteredIncome.map(i => [
        `"${i.INCOME_ID}"`,
        `"${i.DATE}"`,
        `"${i.SUPERVISOR}"`,
        `"${i.PROJECT}"`,
        `"${i.INCOME_SOURCE}"`,
        i.AMOUNT,
        `"${i.CREATED_BY}"`,
        `"${i.CREATED_DATE}"`,
        `"${(i.REMARKS || '').replace(/"/g, '""')}"`
      ]);
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else if (type === 'statement' && supervisorName) {
      const statement = getSupervisorStatement(supervisorName);
      fileName = `EMA_Statement_${supervisorName}_${new Date().toISOString().split('T')[0]}.csv`;
      const headers = ['DATE', 'TRANSACTION_ID', 'DESCRIPTION', 'PROJECT', 'INCOME (LKR)', 'EXPENSE (LKR)', 'RUNNING_BALANCE (LKR)', 'STATUS', 'REMARKS'];
      const rows = statement.map(s => [
        `"${s.date}"`,
        `"${s.transactionId}"`,
        `"${s.description.replace(/"/g, '""')}"`,
        `"${s.project}"`,
        s.incomeAmount,
        s.expenseAmount,
        s.runningBalance,
        `"${s.status}"`,
        `"${(s.remarks || '').replace(/"/g, '""')}"`
      ]);
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else if (type === 'pivot') {
      const projectHeaders = pivotMatrix.projects.map(p => `"${p.PROJECT_CODE}"`);
      const headers = ['CATEGORY_CODE', 'CATEGORY_NAME', 'GROUP', ...projectHeaders, 'GRAND_TOTAL'];
      const rows = pivotMatrix.rows.map(r => {
        const prjCols = pivotMatrix.projects.map(p => r.projectTotals[p.PROJECT_CODE] || 0);
        return [`"${r.categoryCode}"`, `"${r.categoryName}"`, `"${r.categoryGroup}"`, ...prjCols, r.rowTotal];
      });
      // Add Column Totals Row
      const colTotals = pivotMatrix.projects.map(p => pivotMatrix.columnTotals[p.PROJECT_CODE] || 0);
      const totalRow = ['"TOTAL"', '"PROJECT GRAND TOTAL"', '""', ...colTotals, pivotMatrix.grandTotal];
      csvContent = [headers.join(','), ...rows.map(r => r.join(',')), totalRow.join(',')].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetPettyCashData = () => {
    setExpenses(initialExpenses);
    setIncome(initialIncome);
    setSupervisors(initialSupervisors);
    setProjects(initialProjects);
    setCategories(initialCategories);
    setTransfers(initialTransfers);
    setSheetsConfig(initialGoogleSheetsConfig);
    setFilters(defaultFilters);
    setUserRoleState('ADMIN');
    setCurrentSupervisorNameState('BUDDIKA');
  };

  const clearExpensesHistory = (supervisorName?: string, projectCode?: string) => {
    if (supervisorName || projectCode) {
      setExpenses(prev => prev.filter(e => {
        if (supervisorName && e.SUPERVISOR_NAME === supervisorName) return false;
        if (projectCode && e.PROJECT === projectCode) return false;
        return true;
      }));
    } else {
      setExpenses([]);
    }
  };

  const clearIncomeHistory = (supervisorName?: string) => {
    if (supervisorName) {
      setIncome(prev => prev.filter(i => i.SUPERVISOR_NAME !== supervisorName));
    } else {
      setIncome([]);
    }
  };

  const clearTransfersHistory = () => {
    setTransfers([]);
  };

  const clearSupervisorsDirectory = () => {
    setSupervisors([]);
  };

  const clearProjectsHistory = (projectCode?: string) => {
    if (projectCode) {
      setProjects(prev => prev.filter(p => p.PROJECT_CODE !== projectCode && p.id !== projectCode));
    } else {
      setProjects([]);
    }
  };

  const clearAllPettyCashHistory = () => {
    setExpenses([]);
    setIncome([]);
    setTransfers([]);
  };

  const importBatchData = (
    batchId: string,
    importType: ImportType,
    summary: ValidationSummary,
    duplicateAction: DuplicateAction,
    options: {
      performedBy: string;
      userRole: string;
      fileName: string;
      fileSize: string;
      skipInvalid: boolean;
    }
  ): ImportBatchRecord => {
    const result = dataImportService.executeImport(
      batchId,
      importType,
      summary,
      duplicateAction,
      options,
      {
        expenses,
        projects,
        supervisors
      }
    );

    setExpenses(result.updatedExpenses);
    setProjects(result.updatedProjects);
    setSupervisors(result.updatedSupervisors);

    setImportBatches(prev => [result.batchRecord, ...prev]);

    return result.batchRecord;
  };

  const bulkImportExpenses = (
    batchId: string,
    summary: ValidationSummary,
    options: {
      approvalStatus: 'Approved' | 'Pending';
      performedBy: string;
      userRole: string;
      approvedBy?: string;
      approvalRemarks?: string;
      fileName: string;
      fileSize: string;
      skipInvalid: boolean;
      duplicateAction: DuplicateAction;
      autoRegisterSupervisors?: boolean;
      autoRegisterProjects?: boolean;
    }
  ): { batchRecord: ImportBatchRecord; totalAmount: number; count: number } => {
    const result = DataImportService.executeExpenseBulkImportWithApproval(
      batchId,
      summary,
      options,
      {
        expenses,
        projects,
        supervisors
      }
    );

    setExpenses(result.updatedExpenses);
    setProjects(result.updatedProjects);
    setSupervisors(result.updatedSupervisors);
    setImportBatches(prev => [result.batchRecord, ...prev]);

    return {
      batchRecord: result.batchRecord,
      totalAmount: result.totalAmount,
      count: result.batchRecord.importedRows
    };
  };

  const bulkImportSupervisors = (
    batchId: string,
    summary: ValidationSummary,
    options: {
      performedBy: string;
      userRole: string;
      defaultActiveStatus?: boolean;
      approvalRemarks?: string;
      fileName: string;
      fileSize: string;
      skipInvalid: boolean;
      duplicateAction: DuplicateAction;
    }
  ): { batchRecord: ImportBatchRecord; count: number } => {
    const result = DataImportService.executeSupervisorBulkImportWithApproval(
      batchId,
      summary,
      options,
      {
        supervisors,
        projects
      }
    );

    setSupervisors(result.updatedSupervisors);
    setImportBatches(prev => [result.batchRecord, ...prev]);

    return {
      batchRecord: result.batchRecord,
      count: result.batchRecord.importedRows
    };
  };

  const bulkImportProjects = (
    batchId: string,
    summary: ValidationSummary,
    options: {
      performedBy: string;
      userRole: string;
      defaultStatus?: 'Active' | 'On Hold' | 'Completed';
      defaultPettyCashBudget?: number;
      approvalRemarks?: string;
      fileName: string;
      fileSize: string;
      skipInvalid: boolean;
      duplicateAction: DuplicateAction;
    }
  ): { batchRecord: ImportBatchRecord; totalContractValue: number; count: number } => {
    const result = DataImportService.executeProjectBulkImportWithApproval(
      batchId,
      summary,
      options,
      {
        projects
      }
    );

    setProjects(result.updatedProjects);
    setImportBatches(prev => [result.batchRecord, ...prev]);

    return {
      batchRecord: result.batchRecord,
      totalContractValue: result.totalContractValue,
      count: result.batchRecord.importedRows
    };
  };

  const bulkImportIncome = (
    batchId: string,
    summary: ValidationSummary,
    options: {
      performedBy: string;
      userRole: string;
      approvalRemarks?: string;
      fileName: string;
      fileSize: string;
      skipInvalid: boolean;
      duplicateAction: DuplicateAction;
      autoRegisterSupervisors?: boolean;
      autoRegisterProjects?: boolean;
    }
  ): { batchRecord: ImportBatchRecord; totalAmount: number; count: number } => {
    const result = DataImportService.executeIncomeBulkImportWithApproval(
      batchId,
      summary,
      options,
      {
        income,
        supervisors,
        projects
      }
    );

    setIncome(result.updatedIncome);
    setSupervisors(result.updatedSupervisors);
    setProjects(result.updatedProjects);
    setImportBatches(prev => [result.batchRecord, ...prev]);

    return {
      batchRecord: result.batchRecord,
      totalAmount: result.totalAmount,
      count: result.batchRecord.importedRows
    };
  };

  const bulkApproveExpenses = (expenseIds: string[], approverName?: string, remarks?: string) => {
    const approver = approverName || 'Administrator';
    const timestamp = new Date().toLocaleString('en-GB');
    setExpenses(prev =>
      prev.map(exp => {
        if (expenseIds.includes(exp.id)) {
          return {
            ...exp,
            PAYMENT_STATUS: 'Approved',
            APPROVED_BY: approver,
            APPROVED_DATE: timestamp,
            REMARKS: remarks ? `${exp.REMARKS ? exp.REMARKS + ' | ' : ''}[Admin Approved] ${remarks}` : exp.REMARKS,
            UPDATED_DATE: timestamp
          };
        }
        return exp;
      })
    );
  };

  const bulkRejectExpenses = (expenseIds: string[], approverName?: string, reason?: string) => {
    const approver = approverName || 'Administrator';
    const timestamp = new Date().toLocaleString('en-GB');
    setExpenses(prev =>
      prev.map(exp => {
        if (expenseIds.includes(exp.id)) {
          return {
            ...exp,
            PAYMENT_STATUS: 'Rejected',
            REJECTION_REASON: reason || 'Rejected during administrative review',
            REMARKS: reason ? `${exp.REMARKS ? exp.REMARKS + ' | ' : ''}[Admin Rejected] ${reason}` : exp.REMARKS,
            UPDATED_DATE: timestamp
          };
        }
        return exp;
      })
    );
  };

  const approveImportBatch = (batchId: string, approverName?: string, remarks?: string) => {
    const approver = approverName || 'Administrator';
    const timestamp = new Date().toLocaleString('en-GB');
    setExpenses(prev =>
      prev.map(exp => {
        if (exp.IMPORT_BATCH_ID === batchId && exp.PAYMENT_STATUS === 'Pending') {
          return {
            ...exp,
            PAYMENT_STATUS: 'Approved',
            APPROVED_BY: approver,
            APPROVED_DATE: timestamp,
            REMARKS: remarks ? `${exp.REMARKS ? exp.REMARKS + ' | ' : ''}[Batch ${batchId} Approved] ${remarks}` : exp.REMARKS,
            UPDATED_DATE: timestamp
          };
        }
        return exp;
      })
    );
  };

  const rollbackImportBatch = (batchId: string, performedBy: string): { success: boolean; message: string } => {
    const targetBatch = importBatches.find(b => b.id === batchId);
    if (!targetBatch) {
      return { success: false, message: `Batch ${batchId} was not found.` };
    }
    if (targetBatch.status === 'ROLLED_BACK') {
      return { success: false, message: `Batch ${batchId} has already been rolled back.` };
    }

    const result = dataImportService.rollbackBatch(
      targetBatch,
      performedBy,
      {
        expenses,
        projects,
        supervisors,
        income
      }
    );

    setExpenses(result.updatedExpenses);
    setProjects(result.updatedProjects);
    setSupervisors(result.updatedSupervisors);
    if (result.updatedIncome) {
      setIncome(result.updatedIncome);
    }

    setImportBatches(prev => prev.map(b => b.id === batchId ? result.rolledBackBatch : b));

    return {
      success: true,
      message: `Batch ${batchId} successfully rolled back. Removed ${result.rolledBackBatch.importedRows} imported records.`
    };
  };

  const saveMappingTemplate = (template: Omit<MappingTemplate, 'id' | 'createdAt'>) => {
    const newTmpl: MappingTemplate = {
      ...template,
      id: `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    setMappingTemplates(prev => [newTmpl, ...prev]);
  };

  const deleteMappingTemplate = (id: string) => {
    setMappingTemplates(prev => prev.filter(t => t.id !== id));
  };

  return (
    <PettyCashContext.Provider
      value={{
        expenses,
        income,
        supervisors,
        projects,
        categories,
        transfers,
        importBatches,
        mappingTemplates,
        userRole,
        currentSupervisorName,
        filters,
        sheetsConfig,
        isSyncingWithSheets,
        setUserRole,
        setCurrentSupervisorName,
        setFilters,
        resetFilters,
        filteredExpenses,
        filteredIncome,
        filteredTransfers,
        supervisorBalances,
        kpiMetrics,
        pivotMatrix,
        getSupervisorStatement,
        addExpense,
        updateExpense,
        deleteExpense,
        updateExpenseStatus,
        addIncome,
        updateIncome,
        deleteIncome,
        addTransfer,
        updateTransferStatus,
        addSupervisor,
        updateSupervisor,
        deleteSupervisor,
        addProject,
        updateProject,
        deleteProject,
        addCategory,
        updateCategory,
        deleteCategory,
        importBatchData,
        bulkImportExpenses,
        bulkImportSupervisors,
        bulkImportProjects,
        bulkImportIncome,
        bulkApproveExpenses,
        bulkRejectExpenses,
        approveImportBatch,
        rollbackImportBatch,
        saveMappingTemplate,
        deleteMappingTemplate,
        syncWithGoogleSheets,
        updateSheetsConfig,
        exportToCsv,
        projectBudgetSummaries,
        budgetAlerts,
        acknowledgedAlertIds,
        acknowledgeBudgetAlert,
        unacknowledgeBudgetAlert,
        clearAllBudgetAlerts,
        updateProjectBudget,
        checkBudgetImpact,
        getSupervisorBudgetAlerts,
        resetPettyCashData,
        clearExpensesHistory,
        clearIncomeHistory,
        clearTransfersHistory,
        clearSupervisorsDirectory,
        clearProjectsHistory,
        clearAllPettyCashHistory
      }}
    >
      {children}
    </PettyCashContext.Provider>
  );
};

export const usePettyCash = () => {
  const context = useContext(PettyCashContext);
  if (!context) {
    throw new Error('usePettyCash must be used within a PettyCashProvider');
  }
  return context;
};
