import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Supplier,
  SupplierCategory,
  SupplierInvoice,
  GoodsReceivedNote,
  SupplierContact,
  SupplierBankAccount,
  SupplierDocument,
  SupplierContract,
  SupplierPerformanceScore,
  SupplierEvaluationHistory,
  SupplierStatus,
  SupplierFinancialSummary
} from '../types/supplierTypes';
import {
  INITIAL_SUPPLIERS,
  INITIAL_SUPPLIER_CATEGORIES,
  INITIAL_SUPPLIER_INVOICES,
  INITIAL_GOODS_RECEIVED_NOTES
} from '../data/supplierData';
import { useEnterprise } from './EnterpriseContext';
import { useAuth } from './AuthContext';
import { AuditService } from '../services/audit/auditService';

interface SupplierContextType {
  suppliers: Supplier[];
  categories: SupplierCategory[];
  invoices: SupplierInvoice[];
  goodsReceivedNotes: GoodsReceivedNote[];
  grns: GoodsReceivedNote[];
  auditLogs: any[];
  
  // Selected supplier for detail drawer / modal
  selectedSupplierId: string | null;
  setSelectedSupplierId: (id: string | null) => void;
  
  // Supplier CRUD
  addSupplier: (supplierData: Omit<Supplier, 'id' | 'code' | 'performance' | 'evaluationHistory' | 'auditTrail' | 'approvalWorkflow'> & { initialWorkflowStep?: string }) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  updateSupplierStatus: (id: string, status: SupplierStatus, reason?: string) => void;
  advanceApprovalWorkflow: (id: string, action: 'SUBMIT' | 'REVIEW' | 'APPROVE' | 'REJECT' | 'SUSPEND' | 'BLOCK' | 'ACTIVATE', reason?: string) => void;
  overrideBlockedStatus: (supplierId: string, reason: string) => boolean;

  // Contacts
  addContact: (supplierId: string, contact: Omit<SupplierContact, 'id'>) => void;
  updateContact: (supplierId: string, contactId: string, updates: Partial<SupplierContact>) => void;
  deleteContact: (supplierId: string, contactId: string) => void;

  // Bank Accounts
  addBankAccount: (supplierId: string, account: Omit<SupplierBankAccount, 'id'>) => void;
  updateBankAccount: (supplierId: string, accountId: string, updates: Partial<SupplierBankAccount>) => void;
  deleteBankAccount: (supplierId: string, accountId: string) => void;
  verifyBankAccount: (supplierId: string, accountId: string, status: 'Verified' | 'Rejected', notes?: string) => void;

  // Documents
  addDocument: (supplierId: string, doc: Omit<SupplierDocument, 'id' | 'uploadedDate' | 'uploadedBy' | 'status'>) => void;
  deleteDocument: (supplierId: string, docId: string) => void;

  // Contracts
  addContract: (supplierId: string, contract: Omit<SupplierContract, 'id' | 'supplierId' | 'supplierName'>) => void;
  updateContract: (supplierId: string, contractId: string, updates: Partial<SupplierContract>) => void;
  deleteContract: (supplierId: string, contractId: string) => void;

  // Categories
  addCategory: (category: Omit<SupplierCategory, 'id' | 'isActive'>) => void;
  updateCategory: (id: string, updates: Partial<SupplierCategory>) => void;
  deleteCategory: (id: string) => void;

  // Invoices
  addInvoice: (invoice: Omit<SupplierInvoice, 'id' | 'invoiceNumber' | 'paidAmount' | 'status'> & { status?: SupplierInvoice['status'] }) => SupplierInvoice;
  updateInvoice: (id: string, updates: Partial<SupplierInvoice>) => void;
  deleteInvoice: (id: string) => void;
  clearInvoicesHistory: () => void;
  updateInvoiceStatus: (invoiceId: string, status: SupplierInvoice['status'], reason?: string) => void;
  recordInvoicePayment: (invoiceId: string, paidAmount: number, paymentRef?: string, voucherId?: string) => void;

  // Goods Received Notes (GRN)
  addGoodsReceivedNote: (grn: Omit<GoodsReceivedNote, 'id' | 'grnNumber'>) => GoodsReceivedNote;
  addGRN: (grn: Omit<GoodsReceivedNote, 'id' | 'grnNumber'>) => GoodsReceivedNote;
  updateGoodsReceivedNote: (id: string, updates: Partial<GoodsReceivedNote>) => void;
  deleteGoodsReceivedNote: (id: string) => void;
  deleteGRN: (id: string) => void;
  clearGRNHistory: () => void;
  updateGRNStatus: (id: string, status: GoodsReceivedNote['status'], reason?: string) => void;
  setPrimaryBank: (supplierId: string, accountId: string) => void;

  // Performance Evaluation
  submitPerformanceEvaluation: (supplierId: string, evaluation: Omit<SupplierEvaluationHistory, 'id' | 'supplierId' | 'evaluationDate' | 'evaluator' | 'evaluatorRole'>) => void;
  deleteEvaluation: (supplierId: string, evalId: string) => void;
  clearEvaluationsHistory: () => void;
  overridePerformanceScore: (supplierId: string, newRating: SupplierPerformanceScore['rating'], reason: string) => void;

  // Analytics & Aggregates
  getSupplierFinancials: (supplierId: string) => SupplierFinancialSummary;
  getSupplierPOs: (supplierId: string) => any[];
  getSupplierInvoices: (supplierId: string) => SupplierInvoice[];
  getSupplierGRNs: (supplierId: string) => GoodsReceivedNote[];
  expiringDocumentsCount: number;
  expiringContractsCount: number;
  pendingApprovalsCount: number;
  totalSuppliersCount: number;
  activeSuppliersCount: number;
  blockedSuppliersCount: number;

  // Helper security formatting
  maskAccountNumber: (accountNumber: string, forceUnmask?: boolean) => string;

  // Admin Data Reset
  resetSuppliersData: () => void;
  clearSuppliersHistory: () => void;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

const STORAGE_KEY_SUPPLIERS = 'ema_enterprise_suppliers_v2';
const STORAGE_KEY_CATEGORIES = 'ema_enterprise_supplier_categories_v1';
const STORAGE_KEY_INVOICES = 'ema_enterprise_supplier_invoices_v1';
const STORAGE_KEY_GRN = 'ema_enterprise_supplier_grn_v1';

export const SupplierProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { procurementOrders, paymentVouchers, currentUser, currentRole, currentEnterprise, addDocument: addGlobalDoc } = useEnterprise();
  const { currentUser: authUser } = useAuth();
  
  const userName = currentUser || authUser?.fullName || 'User';
  const userRole = currentRole || 'ADMIN';
  const enterpriseId = currentEnterprise?.id || 'ent-apex';

  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  // Suppliers state
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUPPLIERS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    try {
      localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS));
    } catch {}
    return INITIAL_SUPPLIERS;
  });

  // Categories state
  const [categories, setCategories] = useState<SupplierCategory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(INITIAL_SUPPLIER_CATEGORIES));
    } catch {}
    return INITIAL_SUPPLIER_CATEGORIES;
  });

  // Supplier Invoices state
  const [invoices, setInvoices] = useState<SupplierInvoice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INVOICES);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    try {
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(INITIAL_SUPPLIER_INVOICES));
    } catch {}
    return INITIAL_SUPPLIER_INVOICES;
  });

  // Goods Received Notes state
  const [goodsReceivedNotes, setGoodsReceivedNotes] = useState<GoodsReceivedNote[]>(() => {
    const normalizeGRNs = (list: GoodsReceivedNote[]): GoodsReceivedNote[] => {
      return list.map(g => ({
        ...g,
        items: g.items && Array.isArray(g.items) && g.items.length > 0
          ? g.items
          : [
              {
                id: `it-${g.id}-1`,
                description: g.itemDescription || 'Material Delivery',
                orderedQuantity: g.orderedQuantity ?? 0,
                receivedQuantity: g.receivedQuantity ?? 0,
                acceptedQuantity: g.acceptedQuantity ?? 0,
                rejectedQuantity: g.rejectedQuantity ?? 0,
                unit: g.unit || ''
              }
            ]
      }));
    };

    try {
      const saved = localStorage.getItem(STORAGE_KEY_GRN);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return normalizeGRNs(parsed);
      }
    } catch {}
    try {
      localStorage.setItem(STORAGE_KEY_GRN, JSON.stringify(INITIAL_GOODS_RECEIVED_NOTES));
    } catch {}
    return normalizeGRNs(INITIAL_GOODS_RECEIVED_NOTES);
  });

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(suppliers));
    } catch {}
  }, [suppliers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    } catch {}
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(invoices));
    } catch {}
  }, [invoices]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GRN, JSON.stringify(goodsReceivedNotes));
    } catch {}
  }, [goodsReceivedNotes]);

  // Security Helper: Mask Account Number
  const maskAccountNumber = (accountNumber: string, forceUnmask: boolean = false): string => {
    if (!accountNumber) return '';
    const canViewUnmasked = forceUnmask || userRole === 'ADMIN' || userRole === 'OWNER' || userRole === 'FINANCE';
    if (canViewUnmasked) {
      return accountNumber;
    }
    const clean = accountNumber.replace(/\s+/g, '');
    if (clean.length <= 4) return '**** ' + clean;
    const last4 = clean.slice(-4);
    return '**** **** ' + last4;
  };

  // Helper: Calculate default performance score
  const calculateOverallScore = (scores: Omit<SupplierPerformanceScore, 'overallScore' | 'rating'>): { overallScore: number; rating: SupplierPerformanceScore['rating'] } => {
    const weights = {
      delivery: 0.25,
      quality: 0.25,
      price: 0.15,
      documentation: 0.15,
      paymentCompliance: 0.10,
      responsiveness: 0.10
    };

    const weighted = Math.round(
      scores.deliveryScore * weights.delivery +
      scores.qualityScore * weights.quality +
      scores.priceScore * weights.price +
      scores.documentationScore * weights.documentation +
      scores.paymentComplianceScore * weights.paymentCompliance +
      scores.responsivenessScore * weights.responsiveness
    );

    let rating: SupplierPerformanceScore['rating'] = 'Satisfactory';
    if (weighted >= 90) rating = 'Excellent';
    else if (weighted >= 80) rating = 'Good';
    else if (weighted >= 65) rating = 'Satisfactory';
    else if (weighted >= 50) rating = 'Poor';
    else rating = 'Critical';

    return { overallScore: weighted, rating };
  };

  // Add Supplier
  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'code' | 'performance' | 'evaluationHistory' | 'auditTrail' | 'approvalWorkflow'> & { initialWorkflowStep?: string }): Supplier => {
    const nextNum = suppliers.length + 1;
    const code = `SUP-${String(nextNum).padStart(3, '0')}`;
    const id = `sup-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;

    const defaultScore = {
      deliveryScore: 85,
      qualityScore: 85,
      priceScore: 85,
      documentationScore: 85,
      paymentComplianceScore: 85,
      responsivenessScore: 85,
      overallScore: 85,
      rating: 'Good' as const
    };

    const newSupplier: Supplier = {
      ...supplierData,
      id,
      code,
      performance: defaultScore,
      evaluationHistory: [],
      auditTrail: [
        {
          id: `aud-${Date.now()}-1`,
          supplierId: id,
          timestamp: new Date().toISOString(),
          user: userName,
          role: userRole,
          action: 'Supplier Created',
          details: `Master record created for ${supplierData.name} (${code}) by ${userName}.`
        }
      ],
      approvalWorkflow: {
        currentStep: (supplierData.initialWorkflowStep as any) || (supplierData.status === 'Active' ? 'Active' : 'Draft'),
        createdBy: userName,
        createdAt: new Date().toISOString().slice(0, 10),
        ...(supplierData.status === 'Active' ? { approvedBy: userName, approvedAt: new Date().toISOString().slice(0, 10) } : {})
      }
    };

    setSuppliers(prev => [newSupplier, ...prev]);

    AuditService.log({
      enterpriseId,
      userId: authUser?.id || userName,
      userName,
      userRole: userRole as any,
      action: 'CREATE',
      module: 'ENTERPRISE',
      recordId: id,
      recordTitle: newSupplier.name,
      details: `Created new supplier master record: ${newSupplier.name} (${code})`
    });

    return newSupplier;
  };

  // Update Supplier
  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id !== id) return s;

      const auditEntry = {
        id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        supplierId: id,
        timestamp: new Date().toISOString(),
        user: userName,
        role: userRole,
        action: 'Supplier Updated' as const,
        details: `Supplier details modified: ${Object.keys(updates).join(', ')}`
      };

      return {
        ...s,
        ...updates,
        auditTrail: [auditEntry, ...s.auditTrail]
      };
    }));

    AuditService.log({
      enterpriseId,
      userId: authUser?.id || userName,
      userName,
      userRole: userRole as any,
      action: 'UPDATE',
      module: 'ENTERPRISE',
      recordId: id,
      details: `Updated supplier profile fields: ${Object.keys(updates).join(', ')}`
    });
  };

  // Delete Supplier
  const deleteSupplier = (id: string) => {
    const target = suppliers.find(s => s.id === id);
    setSuppliers(prev => prev.filter(s => s.id !== id));
    if (selectedSupplierId === id) {
      setSelectedSupplierId(null);
    }

    AuditService.log({
      enterpriseId,
      userId: authUser?.id || userName,
      userName,
      userRole: userRole as any,
      action: 'DELETE',
      module: 'ENTERPRISE',
      recordId: id,
      recordTitle: target?.name,
      details: `Deleted supplier master record ${target?.name} (${target?.code})`
    });
  };

  // Update Supplier Status
  const updateSupplierStatus = (id: string, status: SupplierStatus, reason?: string) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id !== id) return s;
      const prevStatus = s.status;

      const auditEntry = {
        id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        supplierId: id,
        timestamp: new Date().toISOString(),
        user: userName,
        role: userRole,
        action: 'Status Changed' as const,
        details: `Status transitioned from ${prevStatus} to ${status}${reason ? `. Reason: ${reason}` : ''}`,
        previousState: prevStatus,
        newState: status
      };

      const workflowUpdates = { ...s.approvalWorkflow };
      if (status === 'Blocked') {
        workflowUpdates.blockedReason = reason;
      } else if (status === 'Suspended') {
        workflowUpdates.suspensionReason = reason;
      } else if (status === 'Active') {
        workflowUpdates.approvedBy = userName;
        workflowUpdates.approvedAt = new Date().toISOString().slice(0, 10);
      }

      return {
        ...s,
        status,
        approvalWorkflow: workflowUpdates,
        auditTrail: [auditEntry, ...s.auditTrail]
      };
    }));

    AuditService.log({
      enterpriseId,
      userId: authUser?.id || userName,
      userName,
      userRole: userRole as any,
      action: 'UPDATE',
      module: 'ENTERPRISE',
      recordId: id,
      details: `Changed supplier status to ${status} for ${id}: ${reason || 'Status update'}`
    });
  };

  // Workflow transitions (Draft -> Submitted -> Reviewed -> Approved -> Active)
  const advanceApprovalWorkflow = (
    id: string,
    action: 'SUBMIT' | 'REVIEW' | 'APPROVE' | 'REJECT' | 'SUSPEND' | 'BLOCK' | 'ACTIVATE',
    reason?: string
  ) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id !== id) return s;

      let newStatus: SupplierStatus = s.status;
      const workflow = { ...s.approvalWorkflow };
      const today = new Date().toISOString().slice(0, 10);

      switch (action) {
        case 'SUBMIT':
          workflow.currentStep = 'Submitted';
          workflow.submittedBy = userName;
          workflow.submittedAt = today;
          newStatus = 'Pending Approval';
          break;
        case 'REVIEW':
          workflow.currentStep = 'Reviewed';
          workflow.reviewedBy = userName;
          workflow.reviewedAt = today;
          newStatus = 'Pending Approval';
          break;
        case 'APPROVE':
          workflow.currentStep = 'Approved';
          workflow.approvedBy = userName;
          workflow.approvedAt = today;
          newStatus = 'Approved';
          break;
        case 'ACTIVATE':
          workflow.currentStep = 'Active';
          if (!workflow.approvedBy) {
            workflow.approvedBy = userName;
            workflow.approvedAt = today;
          }
          newStatus = 'Active';
          break;
        case 'REJECT':
          workflow.rejectionReason = reason;
          newStatus = 'Draft';
          break;
        case 'SUSPEND':
          workflow.suspensionReason = reason;
          newStatus = 'Suspended';
          break;
        case 'BLOCK':
          workflow.blockedReason = reason;
          newStatus = 'Blocked';
          break;
      }

      const auditEntry = {
        id: `aud-${Date.now()}`,
        supplierId: id,
        timestamp: new Date().toISOString(),
        user: userName,
        role: userRole,
        action: 'Approval Step' as const,
        details: `Workflow action '${action}' applied by ${userName}. Status: ${newStatus}.${reason ? ` Details: ${reason}` : ''}`
      };

      return {
        ...s,
        status: newStatus,
        approvalWorkflow: workflow,
        auditTrail: [auditEntry, ...s.auditTrail]
      };
    }));
  };

  // Override Blocked Status for Authorized PO creation
  const overrideBlockedStatus = (supplierId: string, reason: string): boolean => {
    const isAuthorized = userRole === 'ADMIN' || userRole === 'OWNER' || userRole === 'PROJECT_MANAGER';
    if (!isAuthorized) {
      alert('Only Project Managers or Corporate Directors are authorized to override a blocked supplier.');
      return false;
    }

    setSuppliers(prev => prev.map(s => {
      if (s.id !== supplierId) return s;

      const auditEntry = {
        id: `aud-${Date.now()}`,
        supplierId,
        timestamp: new Date().toISOString(),
        user: userName,
        role: userRole,
        action: 'Blocked Status Overridden' as const,
        details: `Executive override authorized by ${userName} (${userRole}) to permit PO creation. Reason: ${reason}`
      };

      return {
        ...s,
        approvalWorkflow: {
          ...s.approvalWorkflow,
          overrideAllowedBy: `${userName} (${userRole})`,
          overrideReason: reason
        },
        auditTrail: [auditEntry, ...s.auditTrail]
      };
    }));

    AuditService.log({
      enterpriseId,
      userId: authUser?.id || userName,
      userName,
      userRole: userRole as any,
      action: 'OVERRIDE',
      module: 'ENTERPRISE',
      recordId: supplierId,
      details: `Authorized PO override for Blocked Supplier: ${reason}`
    });

    return true;
  };

  // Contacts Operations
  const addContact = (supplierId: string, contact: Omit<SupplierContact, 'id'>) => {
    const newContact: SupplierContact = {
      ...contact,
      id: `cnt-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };

    setSuppliers(prev => prev.map(s => {
      if (s.id !== supplierId) return s;
      return {
        ...s,
        contacts: [...s.contacts, newContact],
        auditTrail: [
          {
            id: `aud-${Date.now()}`,
            supplierId,
            timestamp: new Date().toISOString(),
            user: userName,
            role: userRole,
            action: 'Contact Added',
            details: `Added contact ${newContact.name} (${newContact.designation})`
          },
          ...s.auditTrail
        ]
      };
    }));
  };

  const updateContact = (supplierId: string, contactId: string, updates: Partial<SupplierContact>) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id !== supplierId) return s;
      return {
        ...s,
        contacts: s.contacts.map(c => c.id === contactId ? { ...c, ...updates } : c)
      };
    }));
  };

  const deleteContact = (supplierId: string, contactId: string) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id !== supplierId) return s;
      return {
        ...s,
        contacts: s.contacts.filter(c => c.id !== contactId)
      };
    }));
  };

  // Bank Account Operations
  const addBankAccount = (supplierId: string, account: Omit<SupplierBankAccount, 'id'>) => {
    const newAccount: SupplierBankAccount = {
      ...account,
      id: `bnk-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };

    setSuppliers(prev => prev.map(s => {
      if (s.id !== supplierId) return s;
      // If this is set to default, unset others
      const updatedAccounts = account.isDefault
        ? s.bankAccounts.map(b => ({ ...b, isDefault: false }))
        : [...s.bankAccounts];

      return {
        ...s,
        bankAccounts: [...updatedAccounts, newAccount],
        auditTrail: [
          {
            id: `aud-${Date.now()}`,
            supplierId,
            timestamp: new Date().toISOString(),
            user: userName,
            role: userRole,
            action: 'Bank Account Added',
            details: `Added ${newAccount.bank} (${newAccount.branch}) account ending in ${newAccount.accountNumber.slice(-4)}`
          },
          ...s.auditTrail
        ]
      };
    }));
  };

  const updateBankAccount = (supplierId: string, accountId: string, updates: Partial<SupplierBankAccount>) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id !== supplierId) return s;
      return {
        ...s,
        bankAccounts: s.bankAccounts.map(b => {
          if (b.id === accountId) {
            return { ...b, ...updates };
          }
          if (updates.isDefault) {
            return { ...b, isDefault: false };
          }
          return b;
        })
      };
    }));
  };

  const deleteBankAccount = (supplierId: string, accountId: string) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id !== supplierId) return s;
      return {
        ...s,
        bankAccounts: s.bankAccounts.filter(b => b.id !== accountId)
      };
    }));
  };

  const verifyBankAccount = (supplierId: string, accountId: string, status: 'Verified' | 'Rejected', notes?: string) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id !== supplierId) return s;
      return {
        ...s,
        bankAccounts: s.bankAccounts.map(b => {
          if (b.id !== accountId) return b;
          return {
            ...b,
            verificationStatus: status,
            verifiedBy: userName,
            verifiedDate: new Date().toISOString().slice(0, 10)
          };
        }),
        auditTrail: [
          {
            id: `aud-${Date.now()}`,
            supplierId,
            timestamp: new Date().toISOString(),
            user: userName,
            role: userRole,
            action: 'Bank Account Verified',
            details: `Bank account verification status updated to '${status}' by ${userName}.${notes ? ` Note: ${notes}` : ''}`
          },
          ...s.auditTrail
        ]
      };
    }));
  };

  // Documents Operations
  const addDocument = (supplierId: string, doc: Omit<SupplierDocument, 'id' | 'uploadedDate' | 'uploadedBy' | 'status'>) => {
    const today = new Date().toISOString().slice(0, 10);
    let docStatus: 'Valid' | 'Expiring Soon' | 'Expired' = 'Valid';
    if (doc.expiryDate) {
      const exp = new Date(doc.expiryDate).getTime();
      const now = new Date().getTime();
      const daysUntil = (exp - now) / (1000 * 60 * 60 * 24);
      if (daysUntil < 0) docStatus = 'Expired';
      else if (daysUntil <= 30) docStatus = 'Expiring Soon';
    }

    const newDoc: SupplierDocument = {
      ...doc,
      id: `doc-sup-${Date.now()}`,
      uploadedDate: today,
      uploadedBy: userName,
      status: docStatus
    };

    setSuppliers(prev => prev.map(s => {
      if (s.id !== supplierId) return s;
      return {
        ...s,
        documents: [newDoc, ...s.documents],
        auditTrail: [
          {
            id: `aud-${Date.now()}`,
            supplierId,
            timestamp: new Date().toISOString(),
            user: userName,
            role: userRole,
            action: 'Document Uploaded',
            details: `Uploaded ${newDoc.documentType}: ${newDoc.documentName}`
          },
          ...s.auditTrail
        ]
      };
    }));

    // Cross-register with Enterprise universal documents repository
    try {
      addGlobalDoc({
        TITLE: `[Supplier] ${doc.documentName}`,
        MODULE: 'Procurement',
        CATEGORY: 'Other',
        LINKED_ENTITY_TYPE: 'PROCUREMENT',
        LINKED_ENTITY_ID: supplierId,
        FILE_NAME: doc.fileName,
        FILE_TYPE: (doc.fileName.endsWith('.pdf') ? 'application/pdf' : 'image/png') as any,
        FILE_DATA: doc.fileData || '',
        UPLOADED_BY: userName,
        UPLOADED_DATE: today,
        FILE_SIZE_KB: doc.fileSizeKb || 150,
        REMARKS: `Supplier Document for ${supplierId}. Expiry: ${doc.expiryDate || 'N/A'}`
      });
    } catch (e) {
      console.warn('Global doc integration skipped:', e);
    }
  };

  const deleteDocument = (supplierId: string, docId: string) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id !== supplierId) return s;
      return {
        ...s,
        documents: s.documents.filter(d => d.id !== docId)
      };
    }));
  };

  // Contracts Operations
  const addContract = (supplierId: string, contract: Omit<SupplierContract, 'id' | 'supplierId' | 'supplierName'>) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    const newContract: SupplierContract = {
      ...contract,
      id: `cntr-${Date.now()}`,
      supplierId,
      supplierName: supplier?.name || 'Supplier'
    };

    setSuppliers(prev => prev.map(s => {
      if (s.id !== supplierId) return s;
      return {
        ...s,
        contracts: [newContract, ...s.contracts],
        auditTrail: [
          {
            id: `aud-${Date.now()}`,
            supplierId,
            timestamp: new Date().toISOString(),
            user: userName,
            role: userRole,
            action: 'Contract Created',
            details: `Created supplier contract ${newContract.contractNumber} (${newContract.contractTitle}) for LKR ${newContract.contractValue.toLocaleString()}`
          },
          ...s.auditTrail
        ]
      };
    }));
  };

  const updateContract = (supplierId: string, contractId: string, updates: Partial<SupplierContract>) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id !== supplierId) return s;
      return {
        ...s,
        contracts: s.contracts.map(c => c.id === contractId ? { ...c, ...updates } : c)
      };
    }));
  };

  const deleteContract = (supplierId: string, contractId: string) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id !== supplierId) return s;
      return {
        ...s,
        contracts: s.contracts.filter(c => c.id !== contractId)
      };
    }));
  };

  // Categories Operations
  const addCategory = (category: Omit<SupplierCategory, 'id' | 'isActive'>) => {
    const newCat: SupplierCategory = {
      ...category,
      id: `cat-custom-${Date.now()}`,
      isActive: true,
      isCustom: true
    };
    setCategories(prev => [...prev, newCat]);
  };

  const updateCategory = (id: string, updates: Partial<SupplierCategory>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Invoices Operations
  const addInvoice = (invoice: Omit<SupplierInvoice, 'id' | 'invoiceNumber' | 'paidAmount' | 'status'> & { status?: SupplierInvoice['status'] }): SupplierInvoice => {
    const invoiceNumber = `SINV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
    const newInvoice: SupplierInvoice = {
      ...invoice,
      id: `sinv-${Date.now()}`,
      invoiceNumber,
      status: invoice.status || 'Draft',
      paidAmount: 0
    };

    setInvoices(prev => [newInvoice, ...prev]);

    // Add audit entry to the supplier
    setSuppliers(prev => prev.map(s => {
      if (s.id !== invoice.supplierId) return s;
      return {
        ...s,
        auditTrail: [
          {
            id: `aud-${Date.now()}`,
            supplierId: s.id,
            timestamp: new Date().toISOString(),
            user: userName,
            role: userRole,
            action: 'Invoice Registered',
            details: `Registered invoice ${invoiceNumber} (Ref: ${invoice.supplierInvoiceRef}) for LKR ${invoice.netAmount.toLocaleString()}`
          },
          ...s.auditTrail
        ]
      };
    }));

    return newInvoice;
  };

  const updateInvoiceStatus = (invoiceId: string, status: SupplierInvoice['status'], reason?: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== invoiceId) return inv;
      return {
        ...inv,
        status,
        ...(status === 'Approved' ? { approvedBy: userName, approvedDate: new Date().toISOString().slice(0, 10) } : {}),
        ...(status === 'Rejected' ? { rejectionReason: reason } : {})
      };
    }));
  };

  const recordInvoicePayment = (invoiceId: string, paidAmount: number, paymentRef?: string, voucherId?: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== invoiceId) return inv;
      const totalPaid = (inv.paidAmount || 0) + paidAmount;
      const isFullySettled = totalPaid >= inv.netAmount - 1; // minor rounding tolerance
      return {
        ...inv,
        paidAmount: totalPaid,
        status: isFullySettled ? 'Paid' : 'Partially Paid',
        linkedPaymentVoucherId: voucherId || inv.linkedPaymentVoucherId
      };
    }));
  };

  const updateInvoice = (id: string, updates: Partial<SupplierInvoice>) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
  };

  const deleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  const clearInvoicesHistory = () => {
    try {
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify([]));
    } catch (e) {
      console.error('Failed to clear supplier invoices in localStorage:', e);
    }
    setInvoices([]);
  };

  // Goods Received Notes Operations
  const addGoodsReceivedNote = (grn: Omit<GoodsReceivedNote, 'id' | 'grnNumber'>): GoodsReceivedNote => {
    const grnNumber = `GRN-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(goodsReceivedNotes.length + 1).padStart(3, '0')}`;
    const newGrn: GoodsReceivedNote = {
      ...grn,
      id: `grn-${Date.now()}`,
      grnNumber
    };

    setGoodsReceivedNotes(prev => [newGrn, ...prev]);
    return newGrn;
  };

  const updateGoodsReceivedNote = (id: string, updates: Partial<GoodsReceivedNote>) => {
    setGoodsReceivedNotes(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const deleteGoodsReceivedNote = (id: string) => {
    setGoodsReceivedNotes(prev => prev.filter(g => g.id !== id));
  };

  const deleteGRN = deleteGoodsReceivedNote;

  const clearGRNHistory = () => {
    try {
      localStorage.setItem(STORAGE_KEY_GRN, JSON.stringify([]));
    } catch (e) {
      console.error('Failed to clear GRNs in localStorage:', e);
    }
    setGoodsReceivedNotes([]);
  };

  // Performance Evaluations
  const submitPerformanceEvaluation = (
    supplierId: string,
    evalData: Omit<SupplierEvaluationHistory, 'id' | 'supplierId' | 'evaluationDate' | 'evaluator' | 'evaluatorRole'>
  ) => {
    const computed = calculateOverallScore(evalData.scores);
    const updatedScores: SupplierPerformanceScore = {
      ...evalData.scores,
      overallScore: computed.overallScore,
      rating: computed.rating
    };

    const newEval: SupplierEvaluationHistory = {
      ...evalData,
      id: `eval-${Date.now()}`,
      supplierId,
      evaluationDate: new Date().toISOString().slice(0, 10),
      evaluator: userName,
      evaluatorRole: userRole,
      scores: updatedScores,
      finalRating: computed.rating
    };

    setSuppliers(prev => prev.map(s => {
      if (s.id !== supplierId) return s;
      return {
        ...s,
        performance: updatedScores,
        evaluationHistory: [newEval, ...s.evaluationHistory],
        auditTrail: [
          {
            id: `aud-${Date.now()}`,
            supplierId,
            timestamp: new Date().toISOString(),
            user: userName,
            role: userRole,
            action: 'Performance Evaluated',
            details: `Performance evaluated by ${userName}. Final Score: ${updatedScores.overallScore}% (${computed.rating}). Remarks: ${evalData.comments}`
          },
          ...s.auditTrail
        ]
      };
    }));
  };

  const overridePerformanceScore = (supplierId: string, newRating: SupplierPerformanceScore['rating'], reason: string) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id !== supplierId) return s;
      const updatedPerf: SupplierPerformanceScore = {
        ...s.performance,
        rating: newRating,
        isOverridden: true,
        overrideReason: reason,
        overriddenBy: `${userName} (${userRole})`
      };

      return {
        ...s,
        performance: updatedPerf,
        auditTrail: [
          {
            id: `aud-${Date.now()}`,
            supplierId,
            timestamp: new Date().toISOString(),
            user: userName,
            role: userRole,
            action: 'Performance Evaluated',
            details: `Management manual rating override to '${newRating}' by ${userName}. Reason: ${reason}`
          },
          ...s.auditTrail
        ]
      };
    }));
  };

  const deleteEvaluation = (supplierId: string, evalId: string) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id !== supplierId) return s;
      const filtered = (s.evaluationHistory || []).filter(e => e.id !== evalId);
      const filteredPerf = (s.performance?.evaluationHistory || []).filter((e: any) => e.id !== evalId);
      return {
        ...s,
        evaluationHistory: filtered,
        performance: {
          ...s.performance,
          evaluationHistory: filteredPerf
        }
      };
    }));
  };

  const clearEvaluationsHistory = () => {
    setSuppliers(prev => prev.map(s => ({
      ...s,
      evaluationHistory: [],
      performance: {
        ...s.performance,
        evaluationHistory: []
      }
    })));
  };

  // Aggregation & Financial Calculations
  const getSupplierPOs = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return [];

    return procurementOrders.filter(po => {
      if (po.SUPPLIER_ID && po.SUPPLIER_ID === supplierId) return true;
      if (po.SUPPLIER_NAME && po.SUPPLIER_NAME.trim().toLowerCase() === supplier.name.trim().toLowerCase()) return true;
      if (supplier.tradingName && po.SUPPLIER_NAME.trim().toLowerCase() === supplier.tradingName.trim().toLowerCase()) return true;
      return false;
    });
  };

  const getSupplierInvoices = (supplierId: string) => {
    return invoices.filter(i => i.supplierId === supplierId);
  };

  const getSupplierGRNs = (supplierId: string) => {
    return goodsReceivedNotes.filter(g => g.supplierId === supplierId);
  };

  const getSupplierFinancials = (supplierId: string): SupplierFinancialSummary => {
    const supplier = suppliers.find(s => s.id === supplierId);
    const name = supplier?.name || 'Unknown';

    // 1. Total Purchases = sum of PO amounts
    const pos = getSupplierPOs(supplierId);
    const totalPurchases = pos.reduce((sum, po) => sum + (Number(po.TOTAL_AMOUNT) || 0), 0);

    // 2. Total Invoiced = Approved or Paid Supplier Invoices
    const suppInvoices = invoices.filter(i => i.supplierId === supplierId);
    const approvedInvoices = suppInvoices.filter(i => i.status === 'Approved' || i.status === 'Partially Paid' || i.status === 'Paid');
    const totalInvoiced = approvedInvoices.reduce((sum, inv) => sum + (Number(inv.netAmount) || 0), 0);

    // 3. Total Paid = Settled amounts on invoices + matching settled Payment Vouchers
    const invoicePaidSum = suppInvoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
    
    // Also cross check payment vouchers for beneficiary match
    const matchingVouchers = paymentVouchers.filter(v => 
      v.STATUS === 'Settled' && (
        v.BENEFICIARY.toLowerCase().includes(name.toLowerCase()) ||
        (supplier?.tradingName && v.BENEFICIARY.toLowerCase().includes(supplier.tradingName.toLowerCase()))
      )
    );
    const voucherPaidSum = matchingVouchers.reduce((sum, v) => sum + (Number(v.AMOUNT) || 0), 0);

    const totalPaid = Math.max(invoicePaidSum, voucherPaidSum);

    // 4. Outstanding = Approved Invoices - Paid
    const outstanding = Math.max(0, totalInvoiced - totalPaid);

    // 5. Overdue = Approved invoices past due date that have unpaid balance
    const todayStr = new Date().toISOString().slice(0, 10);
    const overdue = approvedInvoices
      .filter(inv => inv.dueDate < todayStr && (inv.paidAmount || 0) < inv.netAmount)
      .reduce((sum, inv) => sum + (inv.netAmount - (inv.paidAmount || 0)), 0);

    // 6. Pending PO Value = POs that are Approved but not yet invoiced
    const openPOs = pos.filter(po => po.STATUS === 'Approved' || po.STATUS === 'Pending Approval');
    const openPOValue = openPOs.reduce((sum, po) => sum + (Number(po.TOTAL_AMOUNT) || 0), 0);
    const pendingPOValue = Math.max(0, openPOValue - totalInvoiced);

    // 7. Average payment days (default 30 if none recorded)
    const averagePaymentDays = supplier?.creditTerms?.creditPeriod === '7 Days' ? 7
      : supplier?.creditTerms?.creditPeriod === '15 Days' ? 15
      : supplier?.creditTerms?.creditPeriod === '30 Days' ? 28
      : supplier?.creditTerms?.creditPeriod === '45 Days' ? 42
      : supplier?.creditTerms?.creditPeriod === '60 Days' ? 55
      : 30;

    return {
      supplierId,
      supplierName: name,
      totalPurchases,
      totalInvoiced,
      totalPaid,
      outstanding,
      overdue,
      pendingPOValue,
      averagePaymentDays
    };
  };

  // High level counts
  const expiringDocumentsCount = useMemo(() => {
    let count = 0;
    const now = new Date().getTime();
    suppliers.forEach(s => {
      s.documents.forEach(d => {
        if (d.expiryDate) {
          const exp = new Date(d.expiryDate).getTime();
          const days = (exp - now) / (1000 * 60 * 60 * 24);
          if (days <= 30) count++;
        }
      });
    });
    return count;
  }, [suppliers]);

  const expiringContractsCount = useMemo(() => {
    let count = 0;
    const now = new Date().getTime();
    suppliers.forEach(s => {
      s.contracts.forEach(c => {
        if (c.endDate && c.status === 'Active') {
          const exp = new Date(c.endDate).getTime();
          const days = (exp - now) / (1000 * 60 * 60 * 24);
          if (days <= 30) count++;
        }
      });
    });
    return count;
  }, [suppliers]);

  const pendingApprovalsCount = useMemo(() => {
    return suppliers.filter(s => s.status === 'Pending Approval' || s.status === 'Draft').length;
  }, [suppliers]);

  const totalSuppliersCount = suppliers.length;
  const activeSuppliersCount = suppliers.filter(s => s.status === 'Active' || s.status === 'Approved').length;
  const blockedSuppliersCount = suppliers.filter(s => s.status === 'Blocked' || s.status === 'Suspended').length;

  // Admin Data Reset
  const resetSuppliersData = () => {
    try {
      localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS));
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(INITIAL_SUPPLIER_CATEGORIES));
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(INITIAL_SUPPLIER_INVOICES));
      localStorage.setItem(STORAGE_KEY_GRN, JSON.stringify(INITIAL_GOODS_RECEIVED_NOTES));
    } catch (e) {
      console.error('Failed to reset supplier data in localStorage:', e);
    }

    setSuppliers(INITIAL_SUPPLIERS);
    setCategories(INITIAL_SUPPLIER_CATEGORIES);
    setInvoices(INITIAL_SUPPLIER_INVOICES);
    setGoodsReceivedNotes(INITIAL_GOODS_RECEIVED_NOTES);
  };

  const clearSuppliersHistory = () => {
    try {
      localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_GRN, JSON.stringify([]));
    } catch (e) {
      console.error('Failed to clear suppliers in localStorage:', e);
    }
    setSuppliers([]);
    setInvoices([]);
    setGoodsReceivedNotes([]);
  };

  const grns = goodsReceivedNotes;
  const addGRN = addGoodsReceivedNote;
  const updateGRNStatus = (id: string, status: GoodsReceivedNote['status'], reason?: string) => {
    updateGoodsReceivedNote(id, { status, remarks: reason });
  };

  const setPrimaryBank = (supplierId: string, accountId: string) => {
    setSuppliers(prev =>
      prev.map(s => {
        if (s.id !== supplierId) return s;
        return {
          ...s,
          bankAccounts: s.bankAccounts.map(b => ({
            ...b,
            isDefault: b.id === accountId
          }))
        };
      })
    );
  };

  const auditLogs = useMemo(() => {
    return suppliers.flatMap(s =>
      (s.auditTrail || []).map(a => ({
        ...a,
        entityId: s.id,
        supplierName: s.name
      }))
    );
  }, [suppliers]);

  return (
    <SupplierContext.Provider
      value={{
        suppliers,
        categories,
        invoices,
        goodsReceivedNotes,
        grns,
        auditLogs,
        selectedSupplierId,
        setSelectedSupplierId,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        updateSupplierStatus,
        advanceApprovalWorkflow,
        overrideBlockedStatus,
        addContact,
        updateContact,
        deleteContact,
        addBankAccount,
        updateBankAccount,
        deleteBankAccount,
        verifyBankAccount,
        setPrimaryBank,
        addDocument,
        deleteDocument,
        addContract,
        updateContract,
        deleteContract,
        addCategory,
        updateCategory,
        deleteCategory,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        clearInvoicesHistory,
        updateInvoiceStatus,
        recordInvoicePayment,
        addGoodsReceivedNote,
        addGRN,
        updateGoodsReceivedNote,
        deleteGoodsReceivedNote,
        deleteGRN,
        clearGRNHistory,
        updateGRNStatus,
        submitPerformanceEvaluation,
        deleteEvaluation,
        clearEvaluationsHistory,
        overridePerformanceScore,
        getSupplierFinancials,
        getSupplierPOs,
        getSupplierInvoices,
        getSupplierGRNs,
        expiringDocumentsCount,
        expiringContractsCount,
        pendingApprovalsCount,
        totalSuppliersCount,
        activeSuppliersCount,
        blockedSuppliersCount,
        maskAccountNumber,
        resetSuppliersData,
        clearSuppliersHistory
      }}
    >
      {children}
    </SupplierContext.Provider>
  );
};

export const useSupplier = (): SupplierContextType => {
  const context = useContext(SupplierContext);
  if (!context) {
    throw new Error('useSupplier must be used within a SupplierProvider');
  }
  return context;
};

export const useSuppliers = useSupplier;
