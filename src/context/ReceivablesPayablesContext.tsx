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
    []
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
    []
  );

  // Clear History functions
  const clearReceivablesHistory = useCallback(() => {
    setReceivables([]);
  }, []);

  const clearPayablesHistory = useCallback(() => {
    setPayables([]);
  }, []);

  const clearAllHistory = useCallback(() => {
    setReceivables([]);
    setPayables([]);
  }, []);

  const resetToDemoData = useCallback(() => {
    setReceivables(INITIAL_RECEIVABLE_INVOICES);
    setPayables(INITIAL_PAYABLE_BILLS);
  }, []);

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
        resetToDemoData
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
