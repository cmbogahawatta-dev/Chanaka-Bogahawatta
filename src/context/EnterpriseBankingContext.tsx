import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  CompanyBankAccount,
  BankAccountAuditEntry,
  BankStatement,
  BankReconciliationRecord,
  RegisteredBank
} from '../types/bankingTypes';
import { useEnterprise } from './EnterpriseContext';
import { DEFAULT_REGISTERED_BANKS } from '../data/registeredBanksData';

interface EnterpriseBankingContextType {
  accounts: CompanyBankAccount[];
  registeredBanks: RegisteredBank[];
  auditEntries: BankAccountAuditEntry[];
  statements: BankStatement[];
  reconciliations: BankReconciliationRecord[];
  addAccount: (acc: Omit<CompanyBankAccount, 'id'>) => void;
  updateAccount: (id: string, updates: Partial<CompanyBankAccount>, reason?: string) => void;
  deleteAccount: (id: string) => void;
  deleteStatement: (id: string) => void;
  deleteReconciliation: (id: string) => void;
  uploadStatement: (stmt: Omit<BankStatement, 'id' | 'uploadedDate'>) => void;
  verifyStatement: (id: string, verifiedBy: string) => void;
  reconcileStatement: (record: Omit<BankReconciliationRecord, 'id' | 'reconciledDate'>) => void;
  maskAccountNumber: (num: string) => string;
  addRegisteredBank: (bank: Omit<RegisteredBank, 'id'>) => RegisteredBank;
  updateRegisteredBank: (id: string, updates: Partial<RegisteredBank>) => void;
  deleteRegisteredBank: (id: string) => void;
  importRegisteredBanks: (
    banks: Array<Omit<RegisteredBank, 'id'>>,
    mode?: 'append' | 'replace'
  ) => { added: number; updated: number; total: number };
  resetRegisteredBanksToDefault: () => void;
}

const initialAccounts: CompanyBankAccount[] = [
  {
    id: 'bank-01',
    enterpriseId: 'ent-apex',
    bank: 'Commercial Bank of Ceylon PLC',
    bankCode: '7010',
    branch: 'World Trade Centre Branch',
    branchCode: '045',
    accountName: 'Apex Global Logistics Corporation (Pvt) Ltd - Operations',
    accountNumber: '1000849201',
    accountType: 'Current',
    currency: 'LKR',
    swift: 'CCEYLKFX',
    status: 'Active',
    isPrimary: true,
    purpose: 'Main Operating Cashflow & Fleet Running Costs',
    responsiblePerson: 'Samantha Perera',
    glAccountCode: '1010-01',
    currentBalance: 14850240
  },
  {
    id: 'bank-02',
    enterpriseId: 'ent-apex',
    bank: 'Hatton National Bank PLC (HNB)',
    bankCode: '7083',
    branch: 'Colombo 04 Corporate',
    branchCode: '102',
    accountName: 'Apex Global Logistics Corporation - Project Escrow',
    accountNumber: '0020491829',
    accountType: 'Current',
    currency: 'LKR',
    swift: 'HBLILKLX',
    status: 'Active',
    isPrimary: false,
    purpose: 'RDA / Infrastructure Project Retention & Guarantees',
    projectId: 'PRJ-2026-001',
    responsiblePerson: 'K. L. Wickramasinghe',
    glAccountCode: '1020-02',
    currentBalance: 32410800
  },
  {
    id: 'bank-03',
    enterpriseId: 'ent-apex',
    bank: 'Standard Chartered Bank',
    bankCode: '7206',
    branch: 'Fort Main Branch',
    branchCode: '001',
    accountName: 'Apex Global Logistics Corp - Foreign Currency Operations',
    accountNumber: '0184910283',
    accountType: 'Current',
    currency: 'USD',
    swift: 'SCBLIKLX',
    status: 'Active',
    isPrimary: false,
    purpose: 'Heavy Equipment Import Letters of Credit & Customs Bond',
    responsiblePerson: 'Deshamanya Rohan Wickremasinghe',
    glAccountCode: '1030-01',
    currentBalance: 185420
  }
];

const initialStatements: BankStatement[] = [
  {
    id: 'stmt-01',
    bankAccountId: 'bank-01',
    month: 7,
    year: 2026,
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    openingBalance: 12400500,
    closingBalance: 14850240,
    statementReference: 'COMBANK/WTC/2026/07-49201',
    documentFileName: 'CommercialBank_Statement_July2026.pdf',
    uploadedBy: 'Finance Department',
    uploadedDate: '2026-08-02',
    verifiedBy: 'Ananda Jayawardena, FCA',
    status: 'Verified',
    reconciliationStatus: 'Reconciled',
    remarks: 'Reconciled against QBO cashbook with zero variance.'
  },
  {
    id: 'stmt-02',
    bankAccountId: 'bank-01',
    month: 8,
    year: 2026,
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    openingBalance: 14850240,
    closingBalance: 16120900,
    statementReference: 'COMBANK/WTC/2026/08-49201',
    documentFileName: 'CommercialBank_Statement_August2026.pdf',
    uploadedBy: 'Samantha Perera',
    uploadedDate: '2026-09-01',
    status: 'Uploaded',
    reconciliationStatus: 'In Progress',
    remarks: 'Pending clearance of 2 outstanding cheques.'
  }
];

const EnterpriseBankingContext = createContext<EnterpriseBankingContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'ema_enterprise_banking_v1';

export const EnterpriseBankingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentEnterprise } = useEnterprise();

  const [accounts, setAccounts] = useState<CompanyBankAccount[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_accounts`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialAccounts;
  });

  const [auditEntries, setAuditEntries] = useState<BankAccountAuditEntry[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_audits`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [statements, setStatements] = useState<BankStatement[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_statements`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialStatements;
  });

  const [reconciliations, setReconciliations] = useState<BankReconciliationRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_reconciliations`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [registeredBanks, setRegisteredBanks] = useState<RegisteredBank[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_registered_banks`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_REGISTERED_BANKS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_registered_banks`, JSON.stringify(registeredBanks));
    } catch {}
  }, [registeredBanks]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_accounts`, JSON.stringify(accounts));
    } catch {}
  }, [accounts]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_audits`, JSON.stringify(auditEntries));
    } catch {}
  }, [auditEntries]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_statements`, JSON.stringify(statements));
    } catch {}
  }, [statements]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_reconciliations`, JSON.stringify(reconciliations));
    } catch {}
  }, [reconciliations]);

  const maskAccountNumber = (num: string): string => {
    if (!num) return '••••';
    const clean = num.replace(/\s+/g, '');
    if (clean.length <= 4) return clean;
    const lastFour = clean.slice(-4);
    return `•••• •••• •••• ${lastFour}`;
  };

  const addAccount = (acc: Omit<CompanyBankAccount, 'id'>) => {
    const newAcc: CompanyBankAccount = {
      ...acc,
      id: `bank-${Date.now()}`,
      enterpriseId: currentEnterprise?.id || 'ent-apex'
    };

    // If marked primary, unmark existing primary
    if (newAcc.isPrimary) {
      setAccounts(prev => prev.map(a => ({ ...a, isPrimary: false })).concat(newAcc));
    } else {
      setAccounts(prev => [...prev, newAcc]);
    }

    // Audit log
    const audit: BankAccountAuditEntry = {
      id: `audit-${Date.now()}`,
      bankAccountId: newAcc.id,
      field: 'ACCOUNT_CREATED',
      previousValue: '',
      newValue: `${newAcc.bank} (${newAcc.accountType})`,
      userId: 'admin-user',
      userName: 'Current Administrator',
      timestamp: new Date().toISOString()
    };
    setAuditEntries(prev => [audit, ...prev]);
  };

  const updateAccount = (id: string, updates: Partial<CompanyBankAccount>, reason?: string) => {
    const target = accounts.find(a => a.id === id);
    if (!target) return;

    // Log audited changes
    const changes: BankAccountAuditEntry[] = Object.entries(updates).map(([field, val]) => ({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      bankAccountId: id,
      field,
      previousValue: String((target as any)[field] ?? ''),
      newValue: String(val ?? ''),
      userId: 'admin-user',
      userName: 'Current Administrator',
      timestamp: new Date().toISOString(),
      reason
    }));

    setAuditEntries(prev => [...changes, ...prev]);

    setAccounts(prev =>
      prev.map(a => {
        if (a.id === id) {
          return { ...a, ...updates };
        }
        if (updates.isPrimary) {
          return { ...a, isPrimary: false };
        }
        return a;
      })
    );
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const deleteStatement = (id: string) => {
    setStatements(prev => prev.filter(s => s.id !== id));
  };

  const deleteReconciliation = (id: string) => {
    setReconciliations(prev => prev.filter(r => r.id !== id));
  };

  const uploadStatement = (stmt: Omit<BankStatement, 'id' | 'uploadedDate'>) => {
    const newStmt: BankStatement = {
      ...stmt,
      id: `stmt-${Date.now()}`,
      uploadedDate: new Date().toISOString().slice(0, 10)
    };
    setStatements(prev => [newStmt, ...prev]);
  };

  const verifyStatement = (id: string, verifiedBy: string) => {
    setStatements(prev =>
      prev.map(s => (s.id === id ? { ...s, status: 'Verified', verifiedBy } : s))
    );
  };

  const reconcileStatement = (record: Omit<BankReconciliationRecord, 'id' | 'reconciledDate'>) => {
    const newRec: BankReconciliationRecord = {
      ...record,
      id: `rec-${Date.now()}`,
      reconciledDate: new Date().toISOString().slice(0, 10)
    };
    setReconciliations(prev => [newRec, ...prev]);

    // Update statement reconciliationStatus
    setStatements(prev =>
      prev.map(s =>
        s.id === record.statementId
          ? { ...s, reconciliationStatus: record.status }
          : s
      )
    );
  };

  const addRegisteredBank = (bank: Omit<RegisteredBank, 'id'>): RegisteredBank => {
    const newBank: RegisteredBank = {
      ...bank,
      id: `rb-${bank.bankCode || Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    setRegisteredBanks(prev => [newBank, ...prev]);
    return newBank;
  };

  const updateRegisteredBank = (id: string, updates: Partial<RegisteredBank>) => {
    setRegisteredBanks(prev =>
      prev.map(b => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  const deleteRegisteredBank = (id: string) => {
    setRegisteredBanks(prev => prev.filter(b => b.id !== id));
  };

  const importRegisteredBanks = (
    incomingBanks: Array<Omit<RegisteredBank, 'id'>>,
    mode: 'append' | 'replace' = 'append'
  ): { added: number; updated: number; total: number } => {
    if (mode === 'replace') {
      const formatted: RegisteredBank[] = incomingBanks.map((b, idx) => ({
        ...b,
        id: `rb-${b.bankCode || Date.now()}-${idx}`,
        createdAt: new Date().toISOString().slice(0, 10)
      }));
      setRegisteredBanks(formatted);
      return { added: formatted.length, updated: 0, total: formatted.length };
    }

    // Append mode: update if same bankCode, otherwise add
    let addedCount = 0;
    let updatedCount = 0;

    setRegisteredBanks(prev => {
      const bankMap = new Map<string, RegisteredBank>();
      prev.forEach(b => bankMap.set(b.bankCode.toLowerCase(), b));

      incomingBanks.forEach((b, idx) => {
        const key = (b.bankCode || '').toLowerCase();
        if (key && bankMap.has(key)) {
          const existing = bankMap.get(key)!;
          // merge branches
          const combinedBranches = Array.from(
            new Set([...existing.branches, ...(b.branches || [])])
          );
          bankMap.set(key, {
            ...existing,
            ...b,
            branches: combinedBranches,
            id: existing.id
          });
          updatedCount++;
        } else {
          const newId = `rb-${b.bankCode || Date.now()}-${idx}`;
          bankMap.set(key || newId, {
            ...b,
            id: newId,
            createdAt: new Date().toISOString().slice(0, 10)
          });
          addedCount++;
        }
      });

      return Array.from(bankMap.values());
    });

    return {
      added: addedCount,
      updated: updatedCount,
      total: addedCount + updatedCount
    };
  };

  const resetRegisteredBanksToDefault = () => {
    setRegisteredBanks(DEFAULT_REGISTERED_BANKS);
  };

  return (
    <EnterpriseBankingContext.Provider
      value={{
        accounts,
        registeredBanks,
        auditEntries,
        statements,
        reconciliations,
        addAccount,
        updateAccount,
        deleteAccount,
        deleteStatement,
        deleteReconciliation,
        uploadStatement,
        verifyStatement,
        reconcileStatement,
        maskAccountNumber,
        addRegisteredBank,
        updateRegisteredBank,
        deleteRegisteredBank,
        importRegisteredBanks,
        resetRegisteredBanksToDefault
      }}
    >
      {children}
    </EnterpriseBankingContext.Provider>
  );
};

export const useEnterpriseBanking = (): EnterpriseBankingContextType => {
  const context = useContext(EnterpriseBankingContext);
  if (!context) {
    throw new Error('useEnterpriseBanking must be used within an EnterpriseBankingProvider');
  }
  return context;
};
