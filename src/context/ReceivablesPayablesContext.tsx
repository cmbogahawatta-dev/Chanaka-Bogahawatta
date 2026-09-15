import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  ReceivableInvoice,
  PayableBill,
  PaymentRecord,
  ReceivablesPayablesDashboardMetrics,
  InvoiceStatus,
  BillStatus,
  AgingBucket
} from '../types/receivablesPayablesTypes';
import {
  INITIAL_RECEIVABLE_INVOICES,
  INITIAL_PAYABLE_BILLS
} from '../data/receivablesPayablesSeedData';
import { useTaxInvoice } from './TaxInvoiceContext';
import { useSupplier } from './SupplierContext';
import { usePRV } from './PRVContext';

interface ReceivablesPayablesContextType {
  receivables: ReceivableInvoice[];
  payables: PayableBill[];
  dashboardMetrics: ReceivablesPayablesDashboardMetrics;

  // Receivables Actions
  addReceivable: (
    data: {
      invoiceNumber: string;
      invoiceDate: string;
      dueDate: string;
      amount: number;
      paid?: number;
      client: string;
      project: string;
      workOrderOrContract?: string;
      linkedTaxInvoiceId?: string;
      sourceModule?: 'MANUAL' | 'PROJECT_INCOME' | 'TAX_INVOICE';
      notes?: string;
    }
  ) => ReceivableInvoice;
  updateReceivable: (id: string, updates: Partial<ReceivableInvoice>) => void;
  deleteReceivable: (id: string) => void;
  recordReceivablePayment: (
    invoiceId: string,
    payment: {
      date: string;
      amount: number;
      referenceNumber?: string;
      paymentMethod: 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE_SLIP' | 'CASH';
      bankAccount?: string;
      notes?: string;
      recordedBy?: string;
    }
  ) => void;

  // Payables Actions
  addPayable: (
    data: {
      supplier: string;
      supplierId?: string;
      poNumber: string;
      grnNumber: string;
      invoiceNumber: string;
      billDate?: string;
      dueDate: string;
      amount: number;
      paid?: number;
      project?: string;
      linkedSupplierInvoiceId?: string;
      linkedProcurementOrderId?: string;
      linkedGrnId?: string;
      linkedPrvId?: string;
      prvNumber?: string;
      prvStatus?: string;
      sourceModule?: 'MANUAL' | 'PROCUREMENT' | 'PRV';
      notes?: string;
    }
  ) => PayableBill;
  updatePayable: (id: string, updates: Partial<PayableBill>) => void;
  deletePayable: (id: string) => void;
  recordPayablePayment: (
    billId: string,
    payment: {
      date: string;
      amount: number;
      referenceNumber?: string;
      paymentMethod: 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE_SLIP' | 'CASH';
      bankAccount?: string;
      notes?: string;
      recordedBy?: string;
    }
  ) => void;

  // Cross-Module Linking & Synchronization
  syncFromProjectIncome: () => { addedCount: number; updatedCount: number; message: string };
  syncFromProcurement: () => { addedCount: number; updatedCount: number; message: string };
  syncFromPRV: () => { updatedCount: number; message: string };
  createPRVForPayable: (
    payableId: string,
    options?: {
      amount?: number;
      purpose?: string;
      expenseCategory?: string;
      costCentre?: string;
      requestedBy?: string;
    }
  ) => { success: boolean; prvNumber?: string; error?: string };
  linkPayableToPRV: (payableId: string, prvId: string) => void;
  linkPayableToProcurement: (payableId: string, supplierInvoiceId: string, poNumber?: string, grnNumber?: string) => void;
  linkReceivableToTaxInvoice: (receivableId: string, taxInvoiceId: string) => void;
  syncAllCrossModule: () => {
    totalSynced: number;
    taxInvoicesAdded: number;
    taxInvoicesUpdated: number;
    supplierInvoicesAdded: number;
    supplierInvoicesUpdated: number;
    prvLinksUpdated: number;
    message: string;
  };

  // Clear / Reset Actions
  clearReceivablesHistory: () => void;
  clearPayablesHistory: () => void;
  clearAllHistory: () => void;
  resetToDemoData: () => void;
}

const STORAGE_KEYS = {
  RECEIVABLES: 'app_receivables_v1',
  PAYABLES: 'app_payables_v1'
};

const ReceivablesPayablesContext = createContext<ReceivablesPayablesContextType | undefined>(undefined);

// Helper to compute overdue days
export function calculateOverdueDays(dueDateStr: string): number {
  if (!dueDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - due.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// Compute invoice status
export function getInvoiceStatus(amount: number, paid: number, dueDateStr: string): InvoiceStatus {
  const outstanding = Math.max(0, amount - paid);
  if (outstanding <= 0) return 'PAID';
  const overdueDays = calculateOverdueDays(dueDateStr);
  if (overdueDays > 0) return 'OVERDUE';
  if (paid > 0) return 'PARTIAL';
  return 'CURRENT';
}

// Compute payable bill status
export function getBillStatus(amount: number, paid: number, dueDateStr: string): BillStatus {
  const outstanding = Math.max(0, amount - paid);
  if (outstanding <= 0) return 'PAID';
  const overdueDays = calculateOverdueDays(dueDateStr);
  if (overdueDays > 0) return 'OVERDUE';
  if (overdueDays >= -7 && overdueDays <= 0) return 'DUE_SOON';
  if (paid > 0) return 'PARTIAL';
  return 'CURRENT';
}

export const ReceivablesPayablesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Connected ERP Contexts
  const { invoices: taxInvoices, recordClientPayment: recordTaxInvoicePayment } = useTaxInvoice();
  const { invoices: supplierInvoices, recordInvoicePayment: recordSupplierInvoicePayment } = useSupplier();
  const { paymentRequests, createPaymentRequest } = usePRV();

  // Load receivables from localStorage or initial seed
  const [receivables, setReceivables] = useState<ReceivableInvoice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECEIVABLES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading receivables from localStorage', e);
    }
    return INITIAL_RECEIVABLE_INVOICES;
  });

  // Load payables from localStorage or initial seed
  const [payables, setPayables] = useState<PayableBill[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAYABLES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading payables from localStorage', e);
    }
    return INITIAL_PAYABLE_BILLS;
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECEIVABLES, JSON.stringify(receivables));
    } catch (e) {
      console.error('Error saving receivables to localStorage', e);
    }
  }, [receivables]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PAYABLES, JSON.stringify(payables));
    } catch (e) {
      console.error('Error saving payables to localStorage', e);
    }
  }, [payables]);

  // Add Receivable
  const addReceivable = useCallback(
    (data: {
      invoiceNumber: string;
      invoiceDate: string;
      dueDate: string;
      amount: number;
      paid?: number;
      client: string;
      project: string;
      workOrderOrContract?: string;
      notes?: string;
    }): ReceivableInvoice => {
      const paidAmount = Number(data.paid) || 0;
      const totalAmount = Number(data.amount) || 0;
      const outstanding = Math.max(0, totalAmount - paidAmount);
      const overdueDays = calculateOverdueDays(data.dueDate);
      const status = getInvoiceStatus(totalAmount, paidAmount, data.dueDate);

      const newInvoice: ReceivableInvoice = {
        id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        invoiceNumber: data.invoiceNumber.trim(),
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        amount: totalAmount,
        paid: paidAmount,
        outstanding,
        overdueDays,
        client: data.client.trim(),
        project: data.project.trim(),
        status,
        workOrderOrContract: data.workOrderOrContract?.trim(),
        paymentHistory: paidAmount > 0 ? [
          {
            id: `pay-${Date.now()}`,
            date: data.invoiceDate,
            amount: paidAmount,
            referenceNumber: 'Initial Receipt / Advance',
            paymentMethod: 'BANK_TRANSFER',
            notes: 'Advance recorded on invoice creation',
            recordedBy: 'Finance System',
            recordedAt: new Date().toISOString()
          }
        ] : [],
        notes: data.notes?.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setReceivables(prev => [newInvoice, ...prev]);
      return newInvoice;
    },
    []
  );

  // Update Receivable
  const updateReceivable = useCallback((id: string, updates: Partial<ReceivableInvoice>) => {
    setReceivables(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const merged = { ...item, ...updates, updatedAt: new Date().toISOString() };
        merged.outstanding = Math.max(0, (merged.amount || 0) - (merged.paid || 0));
        merged.overdueDays = calculateOverdueDays(merged.dueDate);
        merged.status = getInvoiceStatus(merged.amount, merged.paid, merged.dueDate);
        return merged;
      })
    );
  }, []);

  // Delete Receivable
  const deleteReceivable = useCallback((id: string) => {
    setReceivables(prev => prev.filter(item => item.id !== id));
  }, []);

  // Record Payment on Receivable
  const recordReceivablePayment = useCallback(
    (
      invoiceId: string,
      payment: {
        date: string;
        amount: number;
        referenceNumber?: string;
        paymentMethod: 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE_SLIP' | 'CASH';
        bankAccount?: string;
        notes?: string;
        recordedBy?: string;
      }
    ) => {
      setReceivables(prev =>
        prev.map(inv => {
          if (inv.id !== invoiceId) return inv;
          const newPayment: PaymentRecord = {
            id: `rec-pay-${Date.now()}`,
            date: payment.date,
            amount: Number(payment.amount) || 0,
            referenceNumber: payment.referenceNumber?.trim(),
            paymentMethod: payment.paymentMethod,
            bankAccount: payment.bankAccount?.trim(),
            notes: payment.notes?.trim(),
            recordedBy: payment.recordedBy || 'Finance Officer',
            recordedAt: new Date().toISOString()
          };
          const updatedPaid = (inv.paid || 0) + newPayment.amount;
          const updatedOutstanding = Math.max(0, inv.amount - updatedPaid);
          const updatedStatus = getInvoiceStatus(inv.amount, updatedPaid, inv.dueDate);

          // Cross-record payment to linked Project Income (Tax Invoice) if present
          if (inv.linkedTaxInvoiceId && recordTaxInvoicePayment) {
            try {
              recordTaxInvoicePayment({
                invoiceId: inv.linkedTaxInvoiceId,
                invoiceNumber: inv.invoiceNumber,
                projectCode: inv.project,
                clientName: inv.client,
                paymentDate: payment.date,
                amountReceived: Number(payment.amount) || 0,
                paymentMethod: payment.paymentMethod === 'CHEQUE' ? 'Cheque' : payment.paymentMethod === 'CASH' ? 'Cash' : 'Bank Transfer (NEFT)',
                paymentReference: payment.referenceNumber || 'AR-REC',
                receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
                bankAccount: payment.bankAccount || 'Commercial Bank Corporate',
                recordedBy: payment.recordedBy || 'Finance Officer',
                notes: payment.notes || 'Recorded via Accounts Receivable ledger'
              });
            } catch (err) {
              console.warn('Cross-record to TaxInvoice error:', err);
            }
          }

          return {
            ...inv,
            paid: updatedPaid,
            outstanding: updatedOutstanding,
            status: updatedStatus,
            paymentHistory: [newPayment, ...(inv.paymentHistory || [])],
            updatedAt: new Date().toISOString()
          };
        })
      );
    },
    [recordTaxInvoicePayment]
  );

  // Add Payable
  const addPayable = useCallback(
    (data: {
      supplier: string;
      supplierId?: string;
      poNumber: string;
      grnNumber: string;
      invoiceNumber: string;
      billDate?: string;
      dueDate: string;
      amount: number;
      paid?: number;
      project?: string;
      notes?: string;
    }): PayableBill => {
      const paidAmount = Number(data.paid) || 0;
      const totalAmount = Number(data.amount) || 0;
      const outstanding = Math.max(0, totalAmount - paidAmount);
      const overdueDays = calculateOverdueDays(data.dueDate);
      const status = getBillStatus(totalAmount, paidAmount, data.dueDate);

      const newBill: PayableBill = {
        id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        supplier: data.supplier.trim(),
        supplierId: data.supplierId,
        poNumber: data.poNumber.trim(),
        grnNumber: data.grnNumber.trim(),
        invoiceNumber: data.invoiceNumber.trim(),
        billDate: data.billDate || new Date().toISOString().split('T')[0],
        dueDate: data.dueDate,
        amount: totalAmount,
        paid: paidAmount,
        outstanding,
        overdueDays,
        project: data.project?.trim(),
        status,
        paymentHistory: paidAmount > 0 ? [
          {
            id: `disb-${Date.now()}`,
            date: data.billDate || new Date().toISOString().split('T')[0],
            amount: paidAmount,
            referenceNumber: 'Initial Supplier Advance',
            paymentMethod: 'BANK_TRANSFER',
            notes: 'Advance disbursement recorded on bill entry',
            recordedBy: 'Accounts Payable System',
            recordedAt: new Date().toISOString()
          }
        ] : [],
        notes: data.notes?.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setPayables(prev => [newBill, ...prev]);
      return newBill;
    },
    []
  );

  // Update Payable
  const updatePayable = useCallback((id: string, updates: Partial<PayableBill>) => {
    setPayables(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const merged = { ...item, ...updates, updatedAt: new Date().toISOString() };
        merged.outstanding = Math.max(0, (merged.amount || 0) - (merged.paid || 0));
        merged.overdueDays = calculateOverdueDays(merged.dueDate);
        merged.status = getBillStatus(merged.amount, merged.paid, merged.dueDate);
        return merged;
      })
    );
  }, []);

  // Delete Payable
  const deletePayable = useCallback((id: string) => {
    setPayables(prev => prev.filter(item => item.id !== id));
  }, []);

  // Record Payment on Payable
  const recordPayablePayment = useCallback(
    (
      billId: string,
      payment: {
        date: string;
        amount: number;
        referenceNumber?: string;
        paymentMethod: 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE_SLIP' | 'CASH';
        bankAccount?: string;
        notes?: string;
        recordedBy?: string;
      }
    ) => {
      setPayables(prev =>
        prev.map(bill => {
          if (bill.id !== billId) return bill;
          const newDisbursement: PaymentRecord = {
            id: `pay-disb-${Date.now()}`,
            date: payment.date,
            amount: Number(payment.amount) || 0,
            referenceNumber: payment.referenceNumber?.trim(),
            paymentMethod: payment.paymentMethod,
            bankAccount: payment.bankAccount?.trim(),
            notes: payment.notes?.trim(),
            recordedBy: payment.recordedBy || 'Disbursement Officer',
            recordedAt: new Date().toISOString()
          };
          const updatedPaid = (bill.paid || 0) + newDisbursement.amount;
          const updatedOutstanding = Math.max(0, bill.amount - updatedPaid);
          const updatedStatus = getBillStatus(bill.amount, updatedPaid, bill.dueDate);

          // Cross-record disbursement to linked Procurement Supplier Invoice if present
          if (bill.linkedSupplierInvoiceId && recordSupplierInvoicePayment) {
            try {
              recordSupplierInvoicePayment(
                bill.linkedSupplierInvoiceId,
                newDisbursement.amount,
                payment.referenceNumber || 'AP-DISB'
              );
            } catch (err) {
              console.warn('Cross-record to SupplierInvoice error:', err);
            }
          }

          return {
            ...bill,
            paid: updatedPaid,
            outstanding: updatedOutstanding,
            status: updatedStatus,
            paymentHistory: [newDisbursement, ...(bill.paymentHistory || [])],
            updatedAt: new Date().toISOString()
          };
        })
      );
    },
    [recordSupplierInvoicePayment]
  );

  // Clear History functions
  const clearReceivablesHistory = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECEIVABLES, JSON.stringify([]));
    } catch (e) {
      console.error('Error saving empty receivables to localStorage', e);
    }
    setReceivables([]);
  }, []);

  const clearPayablesHistory = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PAYABLES, JSON.stringify([]));
    } catch (e) {
      console.error('Error saving empty payables to localStorage', e);
    }
    setPayables([]);
  }, []);

  const clearAllHistory = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECEIVABLES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.PAYABLES, JSON.stringify([]));
    } catch (e) {
      console.error('Error clearing all in localStorage', e);
    }
    setReceivables([]);
    setPayables([]);
  }, []);

  const resetToDemoData = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECEIVABLES, JSON.stringify(INITIAL_RECEIVABLE_INVOICES));
      localStorage.setItem(STORAGE_KEYS.PAYABLES, JSON.stringify(INITIAL_PAYABLE_BILLS));
    } catch (e) {
      console.error('Error resetting demo data in localStorage', e);
    }
    setReceivables(INITIAL_RECEIVABLE_INVOICES);
    setPayables(INITIAL_PAYABLE_BILLS);
  }, []);

  // 1. Sync Receivables with Project Income (Tax Invoices)
  const syncFromProjectIncome = useCallback(() => {
    if (!taxInvoices || taxInvoices.length === 0) {
      return { addedCount: 0, updatedCount: 0, message: 'No tax invoices found in Project Income' };
    }

    let addedCount = 0;
    let updatedCount = 0;

    setReceivables(prev => {
      const updatedList = [...prev];

      taxInvoices.forEach(tInv => {
        // Skip cancelled or draft invoices if needed, but include all valid ones
        if (tInv.status === 'CANCELLED') return;

        const existingIdx = updatedList.findIndex(
          r => r.linkedTaxInvoiceId === tInv.id || r.invoiceNumber.toLowerCase() === tInv.serialNumber.toLowerCase()
        );

        const paid = tInv.amountReceived || 0;
        const amount = tInv.netPayable || tInv.totalConsideration || 0;
        const outstanding = Math.max(0, amount - paid);
        const dueDate = tInv.dueDate || tInv.invoiceDate;
        const overdueDays = calculateOverdueDays(dueDate);
        const status = getInvoiceStatus(amount, paid, dueDate);

        if (existingIdx >= 0) {
          const curr = updatedList[existingIdx];
          const newPaid = Math.max(curr.paid || 0, paid);
          updatedList[existingIdx] = {
            ...curr,
            amount,
            paid: newPaid,
            outstanding: Math.max(0, amount - newPaid),
            dueDate,
            overdueDays,
            status: getInvoiceStatus(amount, newPaid, dueDate),
            linkedTaxInvoiceId: tInv.id,
            sourceModule: 'PROJECT_INCOME',
            client: tInv.purchaserName || curr.client,
            project: tInv.projectCode || tInv.projectName || curr.project,
            updatedAt: new Date().toISOString()
          };
          updatedCount++;
        } else {
          const newRec: ReceivableInvoice = {
            id: `rec-tax-${tInv.id}`,
            invoiceNumber: tInv.serialNumber,
            invoiceDate: tInv.invoiceDate,
            dueDate,
            amount,
            paid,
            outstanding,
            overdueDays,
            client: tInv.purchaserName || 'Client Authority',
            project: tInv.projectCode || tInv.projectName || 'PIDM 26',
            status,
            workOrderOrContract: tInv.projectCode,
            linkedTaxInvoiceId: tInv.id,
            sourceModule: 'PROJECT_INCOME',
            paymentHistory: paid > 0 ? [
              {
                id: `pay-sync-${Date.now()}-${tInv.id}`,
                date: tInv.invoiceDate,
                amount: paid,
                referenceNumber: 'Project Income Payment Sync',
                paymentMethod: 'BANK_TRANSFER',
                notes: 'Synced from Project Income Tax Invoice',
                recordedBy: 'Income Ledger Sync',
                recordedAt: new Date().toISOString()
              }
            ] : [],
            notes: `Synced from Official IRD Tax Invoice ${tInv.serialNumber}`,
            createdAt: tInv.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          updatedList.unshift(newRec);
          addedCount++;
        }
      });

      return updatedList;
    });

    return {
      addedCount,
      updatedCount,
      message: `Project Income sync complete: ${addedCount} new receivables imported, ${updatedCount} updated.`
    };
  }, [taxInvoices]);

  // 2. Sync Payables with Procurement (Supplier Invoices & PO/GRN)
  const syncFromProcurement = useCallback(() => {
    if (!supplierInvoices || supplierInvoices.length === 0) {
      return { addedCount: 0, updatedCount: 0, message: 'No supplier invoices found in Procurement' };
    }

    let addedCount = 0;
    let updatedCount = 0;

    setPayables(prev => {
      const updatedList = [...prev];

      supplierInvoices.forEach(sInv => {
        const existingIdx = updatedList.findIndex(
          p => p.linkedSupplierInvoiceId === sInv.id || p.invoiceNumber.toLowerCase() === sInv.invoiceNumber.toLowerCase()
        );

        const paid = sInv.paidAmount || 0;
        const amount = sInv.netAmount || sInv.grossAmount || 0;
        const outstanding = Math.max(0, amount - paid);
        const dueDate = sInv.dueDate;
        const overdueDays = calculateOverdueDays(dueDate);
        const status = getBillStatus(amount, paid, dueDate);

        if (existingIdx >= 0) {
          const curr = updatedList[existingIdx];
          const newPaid = Math.max(curr.paid || 0, paid);
          updatedList[existingIdx] = {
            ...curr,
            amount,
            paid: newPaid,
            outstanding: Math.max(0, amount - newPaid),
            dueDate,
            overdueDays,
            status: getBillStatus(amount, newPaid, dueDate),
            linkedSupplierInvoiceId: sInv.id,
            linkedProcurementOrderId: sInv.poNumber || curr.poNumber,
            linkedGrnId: sInv.grnNumber || curr.grnNumber,
            sourceModule: 'PROCUREMENT',
            updatedAt: new Date().toISOString()
          };
          updatedCount++;
        } else {
          const newPay: PayableBill = {
            id: `pay-proc-${sInv.id}`,
            supplier: sInv.supplierName,
            supplierId: sInv.supplierId,
            poNumber: sInv.poNumber || 'PO-2026-GEN',
            grnNumber: sInv.grnNumber || 'GRN-2026-GEN',
            invoiceNumber: sInv.invoiceNumber,
            billDate: sInv.invoiceDate || new Date().toISOString().split('T')[0],
            dueDate,
            amount,
            paid,
            outstanding,
            overdueDays,
            project: sInv.projectCode || 'PIDM 26',
            status,
            linkedSupplierInvoiceId: sInv.id,
            linkedProcurementOrderId: sInv.poNumber,
            linkedGrnId: sInv.grnNumber,
            sourceModule: 'PROCUREMENT',
            paymentHistory: paid > 0 ? [
              {
                id: `disb-sync-${Date.now()}-${sInv.id}`,
                date: sInv.invoiceDate || new Date().toISOString().split('T')[0],
                amount: paid,
                referenceNumber: 'Procurement Disbursement Sync',
                paymentMethod: 'BANK_TRANSFER',
                notes: 'Synced from Procurement Supplier Invoice',
                recordedBy: 'Procurement Sync',
                recordedAt: new Date().toISOString()
              }
            ] : [],
            notes: `Synced from Procurement Supplier Invoice ${sInv.supplierInvoiceRef || sInv.invoiceNumber}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          updatedList.unshift(newPay);
          addedCount++;
        }
      });

      return updatedList;
    });

    return {
      addedCount,
      updatedCount,
      message: `Procurement sync complete: ${addedCount} new bills imported, ${updatedCount} updated.`
    };
  }, [supplierInvoices]);

  // 3. Sync Payables with PRV (Payment Request Vouchers & Disbursements)
  const syncFromPRV = useCallback(() => {
    if (!paymentRequests || paymentRequests.length === 0) {
      return { updatedCount: 0, message: 'No Payment Request Vouchers found' };
    }

    let updatedCount = 0;

    setPayables(prev =>
      prev.map(bill => {
        // Find matching PRV
        const matchingPrv = paymentRequests.find(
          p =>
            p.linkedPayableBillId === bill.id ||
            (p.supplierInvoiceNumber && p.supplierInvoiceNumber.trim().toLowerCase() === bill.invoiceNumber.trim().toLowerCase()) ||
            (p.poNumber && bill.poNumber && p.poNumber.trim().toLowerCase() === bill.poNumber.trim().toLowerCase())
        );

        if (!matchingPrv) return bill;

        const isPaidInPRV = matchingPrv.status === 'PAID';
        const prvPaidAmount = isPaidInPRV ? matchingPrv.totalAmount : 0;
        const newPaid = Math.max(bill.paid || 0, prvPaidAmount);
        const newOutstanding = Math.max(0, bill.amount - newPaid);
        const newStatus = getBillStatus(bill.amount, newPaid, bill.dueDate);

        const hasChanges =
          bill.linkedPrvId !== matchingPrv.id ||
          bill.prvNumber !== matchingPrv.prvNumber ||
          bill.prvStatus !== matchingPrv.status ||
          (isPaidInPRV && bill.paid < prvPaidAmount);

        if (hasChanges) {
          updatedCount++;
          const paymentHistory = [...(bill.paymentHistory || [])];
          if (isPaidInPRV && !paymentHistory.some(p => p.referenceNumber === matchingPrv.prvNumber)) {
            paymentHistory.unshift({
              id: `pay-prv-disb-${matchingPrv.id}`,
              date: new Date().toISOString().split('T')[0],
              amount: matchingPrv.totalAmount,
              referenceNumber: matchingPrv.prvNumber,
              paymentMethod: 'BANK_TRANSFER',
              bankAccount: 'Commercial Bank Corporate #10029381',
              notes: `Disbursement completed via PRV ${matchingPrv.prvNumber}`,
              recordedBy: 'PRV Payment Settlement',
              recordedAt: new Date().toISOString()
            });
          }

          return {
            ...bill,
            linkedPrvId: matchingPrv.id,
            prvNumber: matchingPrv.prvNumber,
            prvStatus: matchingPrv.status,
            paid: newPaid,
            outstanding: newOutstanding,
            status: newStatus,
            paymentHistory,
            updatedAt: new Date().toISOString()
          };
        }

        return bill;
      })
    );

    return {
      updatedCount,
      message: `PRV link sync complete: ${updatedCount} payables updated with live PRV status.`
    };
  }, [paymentRequests]);

  // Keep PRVs synchronized with Payables automatically when paymentRequests change
  useEffect(() => {
    if (paymentRequests && paymentRequests.length > 0) {
      syncFromPRV();
    }
  }, [paymentRequests, syncFromPRV]);

  // 4. Create a Payment Request Voucher (PRV) directly from an Accounts Payable bill
  const createPRVForPayable = useCallback(
    (
      payableId: string,
      options?: {
        amount?: number;
        purpose?: string;
        expenseCategory?: string;
        costCentre?: string;
        requestedBy?: string;
      }
    ) => {
      const bill = payables.find(p => p.id === payableId);
      if (!bill) {
        return { success: false, error: 'Payable bill not found' };
      }

      const disburseAmount = options?.amount ?? bill.outstanding;
      if (disburseAmount <= 0) {
        return { success: false, error: 'Bill has zero outstanding liability' };
      }

      try {
        const newPrv = createPaymentRequest(
          {
            requestDate: new Date().toISOString().split('T')[0],
            requestedBy: options?.requestedBy || 'Procurement & Finance Desk',
            requestedByEmail: 'procurement@emaenterprise.com',
            department: 'Procurement & Accounts Payable',
            projectId: bill.project || 'PRJ-GEN',
            projectCode: bill.project || 'PIDM 26',
            costCentre: options?.costCentre || `CC-${bill.project || 'AP-DISBURSEMENT'}`,
            expenseCategoryId: 'cat-materials',
            expenseCategory: options?.expenseCategory || 'Material Supply & Subcontracts',
            purpose: options?.purpose || `Settlement for Invoice ${bill.invoiceNumber} (${bill.supplier})`,
            description: `Payment Request Voucher generated from Accounts Payable for ${bill.supplier}. Bill #${bill.invoiceNumber}, PO: ${bill.poNumber}, GRN: ${bill.grnNumber}. Total liability: LKR ${bill.amount.toLocaleString()}, Outstanding: LKR ${bill.outstanding.toLocaleString()}.`,
            requiredDate: bill.dueDate || new Date().toISOString().split('T')[0],
            priority: 'Medium',
            payeeType: 'Supplier',
            payeeName: bill.supplier,
            accountName: bill.supplier,
            bankName: 'Commercial Bank of Ceylon',
            accountNumber: '1000-8491-0028',
            paymentMethod: 'Bank Transfer',
            amount: disburseAmount,
            totalAmount: disburseAmount,
            currency: 'LKR',
            attachments: [],
            linkedPayableBillId: bill.id,
            poNumber: bill.poNumber,
            grnNumber: bill.grnNumber,
            supplierInvoiceNumber: bill.invoiceNumber
          },
          true
        );

        // Update bill with linked PRV number and status
        setPayables(prev =>
          prev.map(p =>
            p.id === payableId
              ? {
                  ...p,
                  linkedPrvId: newPrv.id,
                  prvNumber: newPrv.prvNumber,
                  prvStatus: newPrv.status,
                  updatedAt: new Date().toISOString()
                }
              : p
          )
        );

        return { success: true, prvNumber: newPrv.prvNumber, prvId: newPrv.id };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to generate Payment Request Voucher' };
      }
    },
    [payables, createPaymentRequest]
  );

  // Link specific Payable to PRV
  const linkPayableToPRV = useCallback((payableId: string, prvId: string) => {
    const targetPrv = paymentRequests?.find(p => p.id === prvId);
    if (!targetPrv) return;

    setPayables(prev =>
      prev.map(b =>
        b.id === payableId
          ? {
              ...b,
              linkedPrvId: targetPrv.id,
              prvNumber: targetPrv.prvNumber,
              prvStatus: targetPrv.status,
              updatedAt: new Date().toISOString()
            }
          : b
      )
    );
  }, [paymentRequests]);

  // Link specific Payable to Procurement
  const linkPayableToProcurement = useCallback((payableId: string, supplierInvoiceId: string, poNumber?: string, grnNumber?: string) => {
    setPayables(prev =>
      prev.map(b =>
        b.id === payableId
          ? {
              ...b,
              linkedSupplierInvoiceId: supplierInvoiceId,
              linkedProcurementOrderId: poNumber || b.poNumber,
              linkedGrnId: grnNumber || b.grnNumber,
              sourceModule: 'PROCUREMENT',
              updatedAt: new Date().toISOString()
            }
          : b
      )
    );
  }, []);

  // Link specific Receivable to Tax Invoice
  const linkReceivableToTaxInvoice = useCallback((receivableId: string, taxInvoiceId: string) => {
    setReceivables(prev =>
      prev.map(r =>
        r.id === receivableId
          ? {
              ...r,
              linkedTaxInvoiceId: taxInvoiceId,
              sourceModule: 'PROJECT_INCOME',
              updatedAt: new Date().toISOString()
            }
          : r
      )
    );
  }, []);

  // Master cross-module sync
  const syncAllCrossModule = useCallback(() => {
    const incRes = syncFromProjectIncome();
    const procRes = syncFromProcurement();
    const prvRes = syncFromPRV();
    const totalChanges =
      incRes.addedCount +
      incRes.updatedCount +
      procRes.addedCount +
      procRes.updatedCount +
      prvRes.updatedCount;

    return {
      totalSynced: totalChanges,
      taxInvoicesAdded: incRes.addedCount,
      taxInvoicesUpdated: incRes.updatedCount,
      supplierInvoicesAdded: procRes.addedCount,
      supplierInvoicesUpdated: procRes.updatedCount,
      prvLinksUpdated: prvRes.updatedCount,
      message: `Cross-module synchronization complete (${totalChanges} updates processed).`
    };
  }, [syncFromProjectIncome, syncFromProcurement, syncFromPRV]);

  // Compute Dashboard Metrics
  const dashboardMetrics = useMemo((): ReceivablesPayablesDashboardMetrics => {
    let totalReceivable = 0;
    let totalReceivableInvoiced = 0;
    let totalReceivablePaid = 0;
    let receivableOverdueAmount = 0;
    let receivableOverdueCount = 0;

    const receivableAging: AgingBucket = {
      current: 0,
      days1to30: 0,
      days31to60: 0,
      days61to90: 0,
      days90Plus: 0
    };

    receivables.forEach(inv => {
      const outstanding = Math.max(0, inv.amount - inv.paid);
      totalReceivable += outstanding;
      totalReceivableInvoiced += inv.amount;
      totalReceivablePaid += inv.paid;

      const odDays = calculateOverdueDays(inv.dueDate);
      if (odDays > 0 && outstanding > 0) {
        receivableOverdueAmount += outstanding;
        receivableOverdueCount++;

        if (odDays <= 30) receivableAging.days1to30 += outstanding;
        else if (odDays <= 60) receivableAging.days31to60 += outstanding;
        else if (odDays <= 90) receivableAging.days61to90 += outstanding;
        else receivableAging.days90Plus += outstanding;
      } else if (outstanding > 0) {
        receivableAging.current += outstanding;
      }
    });

    let totalPayable = 0;
    let totalPayableBilled = 0;
    let totalPayablePaid = 0;
    let payableOverdueAmount = 0;
    let payableOverdueCount = 0;

    const payableAging: AgingBucket = {
      current: 0,
      days1to30: 0,
      days31to60: 0,
      days61to90: 0,
      days90Plus: 0
    };

    payables.forEach(bill => {
      const outstanding = Math.max(0, bill.amount - bill.paid);
      totalPayable += outstanding;
      totalPayableBilled += bill.amount;
      totalPayablePaid += bill.paid;

      const odDays = calculateOverdueDays(bill.dueDate);
      if (odDays > 0 && outstanding > 0) {
        payableOverdueAmount += outstanding;
        payableOverdueCount++;

        if (odDays <= 30) payableAging.days1to30 += outstanding;
        else if (odDays <= 60) payableAging.days31to60 += outstanding;
        else if (odDays <= 90) payableAging.days61to90 += outstanding;
        else payableAging.days90Plus += outstanding;
      } else if (outstanding > 0) {
        payableAging.current += outstanding;
      }
    });

    const netPosition = totalReceivable - totalPayable;

    return {
      totalReceivable,
      totalReceivableInvoiced,
      totalReceivablePaid,
      receivableOverdueAmount,
      receivableOverdueCount,

      totalPayable,
      totalPayableBilled,
      totalPayablePaid,
      payableOverdueAmount,
      payableOverdueCount,

      netPosition,

      receivableAging,
      payableAging
    };
  }, [receivables, payables]);

  return (
    <ReceivablesPayablesContext.Provider
      value={{
        receivables,
        payables,
        dashboardMetrics,
        addReceivable,
        updateReceivable,
        deleteReceivable,
        recordReceivablePayment,
        addPayable,
        updatePayable,
        deletePayable,
        recordPayablePayment,
        clearReceivablesHistory,
        clearPayablesHistory,
        clearAllHistory,
        resetToDemoData,
        syncFromProjectIncome,
        syncFromProcurement,
        syncFromPRV,
        createPRVForPayable,
        linkPayableToPRV,
        linkPayableToProcurement,
        linkReceivableToTaxInvoice,
        syncAllCrossModule
      }}
    >
      {children}
    </ReceivablesPayablesContext.Provider>
  );
};

export const useReceivablesPayables = () => {
  const context = useContext(ReceivablesPayablesContext);
  if (!context) {
    throw new Error('useReceivablesPayables must be used within a ReceivablesPayablesProvider');
  }
  return context;
};
