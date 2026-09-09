import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  TaxInvoice,
  TaxInvoiceSettings,
  ClientPaymentRecord,
  InvoiceSupplyItem,
  TaxInvoiceStatus,
  PurchaserSnapshot
} from '../types/taxInvoiceTypes';
import {
  generateTaxInvoiceSerialNumber,
  calculateTaxInvoiceTotals,
  amountToWordsLKR,
  validateTaxInvoiceForIssuance
} from '../utils/taxInvoiceUtils';
import { generateTaxInvoicePdf } from '../utils/taxInvoicePdf';
import { usePettyCash } from './PettyCashContext';
import { useEnterprise } from './EnterpriseContext';

interface TaxInvoiceContextType {
  invoices: TaxInvoice[];
  settings: TaxInvoiceSettings;
  payments: ClientPaymentRecord[];
  activeInvoiceTab: 'tax-invoices' | 'drafts' | 'issued' | 'credit-notes' | 'cancelled' | 'compliance' | 'settings';
  setActiveInvoiceTab: (tab: 'tax-invoices' | 'drafts' | 'issued' | 'credit-notes' | 'cancelled' | 'compliance' | 'settings') => void;
  createInvoice: (data: Partial<TaxInvoice>, isIssueImmediately?: boolean) => TaxInvoice;
  updateInvoice: (id: string, updates: Partial<TaxInvoice>) => void;
  submitInvoice: (id: string, user: string) => void;
  approveInvoice: (id: string, user: string) => void;
  issueInvoice: (id: string, user: string) => { success: boolean; serialNumber?: string; errors?: string[] };
  recordClientPayment: (payment: Omit<ClientPaymentRecord, 'id' | 'createdAt'>) => void;
  deleteClientPayment: (paymentId: string) => void;
  createCreditNote: (originalInvoiceId: string, reason: string, lineItems: InvoiceSupplyItem[], user: string) => TaxInvoice;
  cancelInvoice: (id: string, reason: string, user: string) => void;
  syncToQuickBooks: (id: string) => void;
  updateSettings: (newSettings: Partial<TaxInvoiceSettings>) => void;
  previewNextSerialNumber: (dateInput?: string) => string;
  downloadInvoicePdf: (invoice: TaxInvoice) => void;
  printInvoicePdf: (invoice: TaxInvoice) => void;
  deleteInvoice: (id: string) => void;
  clearTaxInvoicesHistory: (filterStatus?: string) => void;
  resetTaxInvoicesToDefault: () => void;
  importTaxInvoices: (imported: Partial<TaxInvoice>[]) => { count: number; totalGross: number };
  autoSyncPettyCashInvoices: boolean;
  setAutoSyncPettyCashInvoices: (enabled: boolean) => void;
  syncFromPettyCash: (forceIncludeDeleted?: boolean) => { addedCount: number; skippedCount: number; message: string };
  deletedIdentifiersCount: number;
  resetDeletedIdentifiers: () => void;
}

const DEFAULT_SETTINGS: TaxInvoiceSettings = {
  entityCode: 'EMA',
  currentSequence: 4, // Next invoice will be 00004
  standardVatRate: 18,
  sequencePolicy: 'CONTINUOUS',
  recommencePolicyNotes: 'IRD guidelines recommend maintaining uninterrupted sequential continuity across calendar months. Sequential gap resets require prior Commissioner-General notification.',
  companyName: 'Apex Global Logistics Corp (Pvt) Ltd',
  companyTin: '102938475',
  companyVatNumber: '102938475-7000',
  companyAddress: 'Level 14, West Tower, World Trade Center, Echelon Square, Colombo 01, Sri Lanka',
  companyPhone: '+94 11 244 8900',
  companyEmail: 'finance@apexlogistics.lk',
  defaultPaymentTerms: 'Net 30 Days from milestone certification',
  defaultBankDetails: 'Commercial Bank PLC • Echelon Square Corporate • A/C 1000-8491-0028',
  autoSyncPettyCashInvoices: false // Set to false by default to prevent unexpected resurrection after clear or delete
};

const INITIAL_INVOICES: TaxInvoice[] = [
  {
    id: 'inv-001',
    serialNumber: '26SEP_EMA_00001',
    isDraft: false,
    status: 'ISSUED',
    invoiceDate: '2026-09-01',
    supplyDate: '2026-08-25',
    dueDate: '2026-10-01',
    supplierName: 'Apex Global Logistics Corp (Pvt) Ltd',
    supplierTin: '102938475',
    supplierVatNumber: '102938475-7000',
    supplierAddress: 'Level 14, West Tower, World Trade Center, Echelon Square, Colombo 01',
    supplierContact: '+94 11 244 8900 / finance@apexlogistics.lk',
    purchaserName: 'Colombo Port City Development Authority',
    purchaserTin: '204918274',
    purchaserVatNumber: '204918274-7000',
    purchaserAddress: 'Block A, Port City Boulevard, Colombo 01',
    purchaserContactPerson: 'Eng. K. Wickramasinghe (Chief Engineer)',
    purchaserPhone: '+94 11 755 4000',
    purchaserEmail: 'procurement@portcity.lk',
    projectCode: 'PRJ-PORT-01',
    projectName: 'Colombo Port Expansion Phase II',
    ipcNumber: 'IPC-04',
    contractNumber: 'CPCE-2025-C08',
    purchaseOrderRef: 'PO-CPCDA-9812',
    lineItems: [
      {
        id: 'li-1',
        itemNumber: 1,
        description: 'Deep Water Quay Wall Concrete Casting - Section 3B (250 m³)',
        unitOfMeasure: 'm³',
        quantity: 250,
        unitPrice: 18500,
        taxableValue: 4625000,
        vatRate: 18,
        vatAmount: 832500,
        totalAmount: 5457500
      },
      {
        id: 'li-2',
        itemNumber: 2,
        description: 'Bored Piling Reinforcement & Ultrasonic Testing (48 Nos)',
        unitOfMeasure: 'Nos',
        quantity: 48,
        unitPrice: 32000,
        taxableValue: 1536000,
        vatRate: 18,
        vatAmount: 276480,
        totalAmount: 1812480
      }
    ],
    currency: 'LKR',
    totalTaxableValue: 6161000,
    vatRate: 18,
    vatAmount: 1108980,
    totalConsideration: 7269980,
    amountInWords: 'Sri Lankan Rupees Seven Million Two Hundred Sixty Nine Thousand Nine Hundred Eighty Only',
    amountReceived: 7269980,
    balanceDue: 0,
    paymentStatus: 'Paid',
    isGazetteCompliant: true,
    bankAccountId: 'bank-01',
    settlementBankDetails: {
      bankAccountId: 'bank-01',
      accountName: 'Apex Global Logistics Corporation (Pvt) Ltd - Operations',
      bankName: 'Commercial Bank of Ceylon PLC',
      branchName: 'World Trade Centre Branch',
      accountNumber: '1000849201',
      swiftCode: 'CCEYLKFX',
      currency: 'LKR',
      purpose: 'Main Operating Cashflow & Fleet Running Costs',
      isPrimary: true
    },
    qbo: {
      status: 'Synced',
      qboInvoiceId: 'QBO-91024',
      lastSyncedAt: '2026-09-01T10:30:00Z'
    },
    preparedBy: 'D. Senanayake (Accounts Exec)',
    submittedBy: 'D. Senanayake (Accounts Exec)',
    submittedAt: '2026-09-01T08:30:00Z',
    approvedBy: 'R. Perera (Finance Director)',
    approvedAt: '2026-09-01T09:15:00Z',
    issuedBy: 'R. Perera (Finance Director)',
    issuedAt: '2026-09-01T09:30:00Z',
    auditTrail: [
      {
        id: 'aud-1',
        timestamp: '2026-09-01T08:00:00Z',
        action: 'CREATED',
        performedBy: 'D. Senanayake',
        notes: 'Created initial draft against certified IPC-04'
      },
      {
        id: 'aud-2',
        timestamp: '2026-09-01T08:30:00Z',
        action: 'SUBMITTED',
        performedBy: 'D. Senanayake',
        previousStatus: 'DRAFT',
        newStatus: 'SUBMITTED'
      },
      {
        id: 'aud-3',
        timestamp: '2026-09-01T09:15:00Z',
        action: 'APPROVED',
        performedBy: 'R. Perera',
        previousStatus: 'SUBMITTED',
        newStatus: 'APPROVED'
      },
      {
        id: 'aud-4',
        timestamp: '2026-09-01T09:30:00Z',
        action: 'ISSUED',
        performedBy: 'R. Perera',
        notes: 'Serial 26SEP_EMA_00001 permanently issued under Gazette No. 2481/22',
        previousStatus: 'APPROVED',
        newStatus: 'ISSUED'
      },
      {
        id: 'aud-5',
        timestamp: '2026-09-03T14:00:00Z',
        action: 'PAYMENT_RECORDED',
        performedBy: 'Finance Cashier',
        notes: 'Full settlement received via BOC-RTGS-928410. Receipt RCP-2026-0041 issued.'
      }
    ],
    notes: 'Certified as per Engineer Certificate dated 25 August 2026.',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-03T14:00:00Z'
  },
  {
    id: 'inv-002',
    serialNumber: '26SEP_EMA_00002',
    isDraft: false,
    status: 'ISSUED',
    invoiceDate: '2026-09-02',
    supplyDate: '2026-08-30',
    dueDate: '2026-10-02',
    supplierName: 'Apex Global Logistics Corp (Pvt) Ltd',
    supplierTin: '102938475',
    supplierVatNumber: '102938475-7000',
    supplierAddress: 'Level 14, West Tower, World Trade Center, Echelon Square, Colombo 01',
    supplierContact: '+94 11 244 8900 / finance@apexlogistics.lk',
    purchaserName: 'Access Engineering PLC',
    purchaserTin: '100492817',
    purchaserVatNumber: '100492817-7000',
    purchaserAddress: 'Access Towers, No. 278, Union Place, Colombo 02',
    purchaserContactPerson: 'Mr. N. Jayawardena (Procurement Head)',
    purchaserPhone: '+94 11 230 2300',
    purchaserEmail: 'invoices@accesseng.lk',
    projectCode: 'PRJ-HWY-02',
    projectName: 'Central Expressway Stage III (Rambukkana)',
    ipcNumber: 'IPC-11',
    contractNumber: 'RDA/CEP/2024/09',
    purchaseOrderRef: 'PO-AEL-44812',
    lineItems: [
      {
        id: 'li-3',
        itemNumber: 1,
        description: 'Aggregate Base Course (ABC) Compaction & Sub-base Stabilization (12,000 m²)',
        unitOfMeasure: 'm²',
        quantity: 12000,
        unitPrice: 420,
        taxableValue: 5040000,
        vatRate: 18,
        vatAmount: 907200,
        totalAmount: 5947200
      }
    ],
    currency: 'LKR',
    totalTaxableValue: 5040000,
    vatRate: 18,
    vatAmount: 907200,
    totalConsideration: 5947200,
    amountInWords: 'Sri Lankan Rupees Five Million Nine Hundred Forty Seven Thousand Two Hundred Only',
    amountReceived: 2500000,
    balanceDue: 3447200,
    paymentStatus: 'Partially Paid',
    isGazetteCompliant: true,
    bankAccountId: 'bank-01',
    settlementBankDetails: {
      bankAccountId: 'bank-01',
      accountName: 'Apex Global Logistics Corporation (Pvt) Ltd - Operations',
      bankName: 'Commercial Bank of Ceylon PLC',
      branchName: 'World Trade Centre Branch',
      accountNumber: '1000849201',
      swiftCode: 'CCEYLKFX',
      currency: 'LKR',
      purpose: 'Main Operating Cashflow & Fleet Running Costs',
      isPrimary: true
    },
    qbo: {
      status: 'Synced',
      qboInvoiceId: 'QBO-91025',
      lastSyncedAt: '2026-09-02T11:00:00Z'
    },
    preparedBy: 'D. Senanayake (Accounts Exec)',
    submittedBy: 'D. Senanayake (Accounts Exec)',
    submittedAt: '2026-09-02T09:00:00Z',
    approvedBy: 'R. Perera (Finance Director)',
    approvedAt: '2026-09-02T10:00:00Z',
    issuedBy: 'R. Perera (Finance Director)',
    issuedAt: '2026-09-02T10:15:00Z',
    auditTrail: [
      {
        id: 'aud-6',
        timestamp: '2026-09-02T09:00:00Z',
        action: 'CREATED',
        performedBy: 'D. Senanayake',
        notes: 'Created draft for Central Expressway IPC-11'
      },
      {
        id: 'aud-7',
        timestamp: '2026-09-02T10:15:00Z',
        action: 'ISSUED',
        performedBy: 'R. Perera',
        notes: 'Issued permanent serial 26SEP_EMA_00002'
      },
      {
        id: 'aud-8',
        timestamp: '2026-09-03T16:00:00Z',
        action: 'PAYMENT_RECORDED',
        performedBy: 'Cashier',
        notes: 'Part payment LKR 2,500,000 received via HNB Chq #881290'
      }
    ],
    createdAt: '2026-09-02T09:00:00Z',
    updatedAt: '2026-09-03T16:00:00Z'
  },
  {
    id: 'inv-003',
    serialNumber: '26SEP_EMA_00003',
    isDraft: false,
    status: 'ISSUED',
    invoiceDate: '2026-09-03',
    supplyDate: '2026-09-01',
    dueDate: '2026-10-03',
    supplierName: 'Apex Global Logistics Corp (Pvt) Ltd',
    supplierTin: '102938475',
    supplierVatNumber: '102938475-7000',
    supplierAddress: 'Level 14, West Tower, World Trade Center, Echelon Square, Colombo 01',
    supplierContact: '+94 11 244 8900 / finance@apexlogistics.lk',
    purchaserName: 'Maga Engineering (Pvt) Ltd',
    purchaserTin: '100091823',
    purchaserVatNumber: '100091823-7000',
    purchaserAddress: 'No. 200, Nawala Road, Narahenpita, Colombo 05',
    purchaserContactPerson: 'Mr. T. Samarasinghe (Project Manager)',
    purchaserPhone: '+94 11 280 8835',
    purchaserEmail: 'accounts@maga.lk',
    projectCode: 'PRJ-WTP-03',
    projectName: 'Kelani Right Bank Water Treatment Plant',
    ipcNumber: 'IPC-07',
    contractNumber: 'NWSDB/KRB/2025/14',
    purchaseOrderRef: 'PO-MAGA-7712',
    lineItems: [
      {
        id: 'li-4',
        itemNumber: 1,
        description: 'Ductile Iron Pipe Laying & Pressure Hydro-Testing (850 m)',
        unitOfMeasure: 'm',
        quantity: 850,
        unitPrice: 9500,
        taxableValue: 8075000,
        vatRate: 18,
        vatAmount: 1453500,
        totalAmount: 9528500
      }
    ],
    currency: 'LKR',
    totalTaxableValue: 8075000,
    vatRate: 18,
    vatAmount: 1453500,
    totalConsideration: 9528500,
    amountInWords: 'Sri Lankan Rupees Nine Million Five Hundred Twenty Eight Thousand Five Hundred Only',
    amountReceived: 0,
    balanceDue: 9528500,
    paymentStatus: 'Unpaid',
    isGazetteCompliant: true,
    qbo: {
      status: 'Pending',
      lastSyncedAt: undefined
    },
    preparedBy: 'D. Senanayake (Accounts Exec)',
    approvedBy: 'R. Perera (Finance Director)',
    issuedBy: 'R. Perera (Finance Director)',
    issuedAt: '2026-09-03T11:00:00Z',
    auditTrail: [
      {
        id: 'aud-9',
        timestamp: '2026-09-03T10:00:00Z',
        action: 'CREATED',
        performedBy: 'D. Senanayake'
      },
      {
        id: 'aud-10',
        timestamp: '2026-09-03T11:00:00Z',
        action: 'ISSUED',
        performedBy: 'R. Perera',
        notes: 'Issued permanent serial 26SEP_EMA_00003'
      }
    ],
    createdAt: '2026-09-03T10:00:00Z',
    updatedAt: '2026-09-03T11:00:00Z'
  },
  {
    id: 'inv-draft-001',
    serialNumber: '26SEP_EMA_00004',
    isDraft: true,
    status: 'SUBMITTED',
    invoiceDate: '2026-09-04',
    supplyDate: '2026-09-03',
    dueDate: '2026-10-04',
    supplierName: 'Apex Global Logistics Corp (Pvt) Ltd',
    supplierTin: '102938475',
    supplierVatNumber: '102938475-7000',
    supplierAddress: 'Level 14, West Tower, World Trade Center, Echelon Square, Colombo 01',
    supplierContact: '+94 11 244 8900 / finance@apexlogistics.lk',
    purchaserName: 'Sanken Construction (Pvt) Ltd',
    purchaserTin: '100119284',
    purchaserVatNumber: '100119284-7000',
    purchaserAddress: 'No. 295, Madampitiya Road, Colombo 14',
    purchaserContactPerson: 'Mr. Lalith Silva (Finance Controller)',
    purchaserPhone: '+94 11 252 2841',
    purchaserEmail: 'billing@sanken.lk',
    projectCode: 'PRJ-PORT-01',
    projectName: 'Colombo Port Expansion Phase II',
    ipcNumber: 'IPC-05',
    contractNumber: 'CPCE-2025-C08',
    purchaseOrderRef: 'PO-SANKEN-1029',
    lineItems: [
      {
        id: 'li-5',
        itemNumber: 1,
        description: 'Pre-cast Concrete Tetrapods (10 Tonne Class) - 40 Units',
        unitOfMeasure: 'Units',
        quantity: 40,
        unitPrice: 95000,
        taxableValue: 3800000,
        vatRate: 18,
        vatAmount: 684000,
        totalAmount: 4484000
      }
    ],
    currency: 'LKR',
    totalTaxableValue: 3800000,
    vatRate: 18,
    vatAmount: 684000,
    totalConsideration: 4484000,
    amountInWords: 'Sri Lankan Rupees Four Million Four Hundred Eighty Four Thousand Only',
    amountReceived: 0,
    balanceDue: 4484000,
    paymentStatus: 'Unpaid',
    isGazetteCompliant: true,
    preparedBy: 'D. Senanayake (Accounts Exec)',
    submittedBy: 'D. Senanayake (Accounts Exec)',
    submittedAt: '2026-09-04T08:00:00Z',
    auditTrail: [
      {
        id: 'aud-11',
        timestamp: '2026-09-04T07:30:00Z',
        action: 'CREATED',
        performedBy: 'D. Senanayake',
        notes: 'Created draft awaiting Director authorization'
      },
      {
        id: 'aud-12',
        timestamp: '2026-09-04T08:00:00Z',
        action: 'SUBMITTED',
        performedBy: 'D. Senanayake',
        previousStatus: 'DRAFT',
        newStatus: 'SUBMITTED'
      }
    ],
    createdAt: '2026-09-04T07:30:00Z',
    updatedAt: '2026-09-04T08:00:00Z'
  }
];

const INITIAL_PAYMENTS: ClientPaymentRecord[] = [
  {
    id: 'pay-001',
    invoiceId: 'inv-001',
    invoiceNumber: '26SEP_EMA_00001',
    projectCode: 'PRJ-PORT-01',
    clientName: 'Colombo Port City Development Authority',
    paymentDate: '2026-09-03',
    amountReceived: 7269980,
    paymentMethod: 'Bank Transfer (RTGS)',
    paymentReference: 'BOC-RTGS-928410',
    receiptNumber: 'RCP-2026-0041',
    bankAccount: 'Commercial Bank Echelon Square (1000-8491-0028)',
    notes: 'Full settlement of IPC-04 certified invoice',
    recordedBy: 'Finance Cashier',
    createdAt: '2026-09-03T14:00:00Z'
  },
  {
    id: 'pay-002',
    invoiceId: 'inv-002',
    invoiceNumber: '26SEP_EMA_00002',
    projectCode: 'PRJ-HWY-02',
    clientName: 'Access Engineering PLC',
    paymentDate: '2026-09-03',
    amountReceived: 2500000,
    paymentMethod: 'Cheque',
    paymentReference: 'HNB Cheque #881290',
    receiptNumber: 'RCP-2026-0042',
    bankAccount: 'Commercial Bank Echelon Square (1000-8491-0028)',
    notes: 'Advance part payment for IPC-11',
    recordedBy: 'Finance Cashier',
    createdAt: '2026-09-03T16:00:00Z'
  }
];

const TaxInvoiceContext = createContext<TaxInvoiceContextType | undefined>(undefined);

export const TaxInvoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addIncome, income, updateIncome } = usePettyCash();
  const { currentUser, currentRole } = useEnterprise();

  const [invoices, setInvoices] = useState<TaxInvoice[]>(() => {
    try {
      const stored = localStorage.getItem('apex_tax_invoices');
      if (stored !== null) {
        const parsed: TaxInvoice[] = JSON.parse(stored);
        return parsed.map(inv => ({
          ...inv,
          serialNumber: inv.serialNumber ? inv.serialNumber.replace(/^PREVIEW_/i, '') : inv.serialNumber
        }));
      }
    } catch (e) {
      console.error('Failed to load tax invoices from localStorage:', e);
    }
    return INITIAL_INVOICES.map(inv => ({
      ...inv,
      serialNumber: inv.serialNumber ? inv.serialNumber.replace(/^PREVIEW_/i, '') : inv.serialNumber
    }));
  });

  const [settings, setSettings] = useState<TaxInvoiceSettings>(() => {
    try {
      const stored = localStorage.getItem('apex_tax_invoice_settings');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load settings from localStorage:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [payments, setPayments] = useState<ClientPaymentRecord[]>(() => {
    try {
      const stored = localStorage.getItem('apex_client_payments');
      if (stored !== null) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load payments from localStorage:', e);
    }
    return INITIAL_PAYMENTS;
  });

  const [activeInvoiceTab, setActiveInvoiceTab] = useState<'tax-invoices' | 'drafts' | 'issued' | 'credit-notes' | 'cancelled' | 'compliance' | 'settings'>('tax-invoices');

  // Track deleted invoice identifiers so they are never automatically resurrected
  const [deletedIdentifiers, setDeletedIdentifiers] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('apex_tax_invoices_deleted_ids');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load deleted identifiers from localStorage:', e);
    }
    return [];
  });

  // Persistence to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('apex_tax_invoices', JSON.stringify(invoices));
    } catch (e) {
      console.error('Failed to persist tax invoices:', e);
    }
  }, [invoices]);

  useEffect(() => {
    try {
      localStorage.setItem('apex_tax_invoice_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to persist settings:', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('apex_client_payments', JSON.stringify(payments));
    } catch (e) {
      console.error('Failed to persist payments:', e);
    }
  }, [payments]);

  useEffect(() => {
    try {
      localStorage.setItem('apex_tax_invoices_deleted_ids', JSON.stringify(deletedIdentifiers));
    } catch (e) {
      console.error('Failed to persist deleted identifiers:', e);
    }
  }, [deletedIdentifiers]);

  // Helper to convert historical project income into official Tax Invoice format
  const convertIncomeToTaxInvoice = (inc: any, currentSettings: TaxInvoiceSettings): TaxInvoice => {
    const serial = inc.invoiceNumber || inc.INCOME_ID || `INV-LEGACY-${inc.id}`;
    const gross = Number(inc.grossAmount) || Number(inc.AMOUNT) || 0;
    const vatRate = Number(inc.vatRate) || 18;
    const taxable = Number(inc.taxableAmount) || Number(inc.netAmount) || Math.round(gross / (1 + vatRate / 100) * 100) / 100;
    const vatAmt = Number(inc.vatAmount) || Math.round((gross - taxable) * 100) / 100;
    const rec = Number(inc.amountReceived) || 0;
    const bal = Number(inc.balanceDue) || Math.max(0, gross - rec);
    const invDate = inc.invoiceDate || inc.DATE_REF || inc.RECEIPT_DATE || new Date().toISOString().split('T')[0];
    const statusStr = inc.paymentStatus || 'Pending';
    const finalStatus: TaxInvoiceStatus = statusStr === 'Paid' ? 'PAID' : statusStr === 'Partially Paid' ? 'PARTIALLY_PAID' : 'ISSUED';
    const description = inc.billingDescription || inc.invoiceDescription || inc.DESCRIPTION || inc.REMARKS || 'Project Milestone Billing';

    return {
      id: `legacy-${inc.id}`,
      legacyIncomeId: inc.id,
      serialNumber: serial,
      isDraft: false,
      status: finalStatus,
      invoiceDate: invDate,
      dueDate: inc.dueDate || new Date(new Date(invDate).getTime() + 30 * 86400000).toISOString().split('T')[0],
      supplierName: currentSettings.companyName,
      supplierTin: currentSettings.companyTin,
      supplierVatNumber: currentSettings.companyVatNumber,
      supplierAddress: currentSettings.companyAddress,
      supplierContact: `${currentSettings.companyPhone} / ${currentSettings.companyEmail}`,
      purchaserName: inc.clientName || 'Project Client',
      purchaserTin: inc.clientTin || 'N/A',
      purchaserAddress: inc.clientAddress || '',
      projectCode: inc.PROJECT || 'PRJ-LEGACY',
      projectName: inc.projectName || inc.PROJECT || 'Enterprise Construction Project',
      billingDescription: description,
      lineItems: [
        {
          id: `item-legacy-${inc.id}`,
          itemNumber: 1,
          description,
          unitOfMeasure: 'Lot',
          quantity: 1,
          unitPrice: taxable,
          taxableValue: taxable,
          vatRate,
          vatAmount: vatAmt,
          totalAmount: gross
        }
      ],
      currency: 'LKR',
      totalTaxableValue: taxable,
      vatRate,
      vatAmount: vatAmt,
      totalConsideration: gross,
      amountInWords: amountToWordsLKR(gross),
      amountReceived: rec,
      balanceDue: bal,
      paymentStatus: bal <= 0.05 ? 'Paid' : rec > 0 ? 'Partially Paid' : 'Unpaid',
      isGazetteCompliant: true,
      preparedBy: inc.SUPERVISOR_NAME || 'Finance Officer',
      issuedBy: inc.SUPERVISOR_NAME || 'Finance Officer',
      issuedAt: invDate,
      auditTrail: [
        {
          id: `aud-leg-${inc.id}`,
          timestamp: new Date().toISOString(),
          action: 'ISSUED',
          performedBy: 'System Migration',
          notes: 'Historical project invoice synchronized with official Tax Invoice register'
        }
      ],
      createdAt: invDate,
      updatedAt: new Date().toISOString()
    };
  };

  // Ensure historical project invoices from PettyCashContext are merged ONLY if auto-sync is explicitly enabled
  useEffect(() => {
    // STOP RESYNC: If auto-sync option is disabled or history was explicitly cleared, DO NOT auto-sync
    if (!settings.autoSyncPettyCashInvoices) return;
    if (localStorage.getItem('apex_tax_invoices_cleared') === 'true') return;
    if (!income || income.length === 0) return;

    const legacyInvoices = income.filter(inc =>
      inc.TRANSACTION_TYPE === 'PROJECT_INVOICE_INCOME' ||
      Boolean(inc.invoiceNumber) ||
      inc.INCOME_SOURCE === 'Project Income / Invoice'
    );

    if (legacyInvoices.length === 0) return;

    const deletedSet = new Set(deletedIdentifiers.map(d => (d || '').trim().toUpperCase()));

    setInvoices(prev => {
      let hasChanges = false;
      const existingSerials = new Set(prev.map(i => (i.serialNumber || '').trim().toUpperCase()));
      const existingIds = new Set(prev.map(i => i.id));
      const existingLegacyIds = new Set(prev.map(i => i.legacyIncomeId).filter(Boolean));

      const newInvoices: TaxInvoice[] = [];

      legacyInvoices.forEach(inc => {
        const serial = inc.invoiceNumber || inc.INCOME_ID || `INV-LEGACY-${inc.id}`;
        const serialUpper = serial.toUpperCase();
        const incIdUpper = String(inc.id || '').trim().toUpperCase();

        // CRITICAL: Stop re-syncing if already existing or previously deleted / cleared
        if (
          existingSerials.has(serialUpper) ||
          existingIds.has(inc.id) ||
          existingLegacyIds.has(inc.id) ||
          deletedSet.has(incIdUpper) ||
          deletedSet.has(serialUpper) ||
          deletedSet.has(`LEGACY-${incIdUpper}`)
        ) {
          return;
        }

        hasChanges = true;
        newInvoices.push(convertIncomeToTaxInvoice(inc, settings));
      });

      if (!hasChanges) return prev;
      return [...newInvoices, ...prev];
    });
  }, [income, settings, deletedIdentifiers]);

  // Preview next serial
  const previewNextSerialNumber = (dateInput?: string): string => {
    const targetDate = dateInput || new Date().toISOString().split('T')[0];
    return generateTaxInvoiceSerialNumber(targetDate, settings.entityCode, settings.currentSequence);
  };

  // Create Invoice / Draft
  const createInvoice = (data: Partial<TaxInvoice>, isIssueImmediately = false): TaxInvoice => {
    const invoiceDate = data.invoiceDate || new Date().toISOString().split('T')[0];
    const totals = calculateTaxInvoiceTotals(data.lineItems || [], settings.standardVatRate);
    const amountInWords = amountToWordsLKR(totals.totalConsideration);

    const now = new Date().toISOString();
    const id = `inv-${Date.now()}`;

    let serialNumber = '';
    let status: TaxInvoiceStatus = 'DRAFT';
    let isDraft = true;

    if (isIssueImmediately) {
      serialNumber = generateTaxInvoiceSerialNumber(invoiceDate, settings.entityCode, settings.currentSequence);
      status = 'ISSUED';
      isDraft = false;
      // Increment sequence
      setSettings(prev => ({ ...prev, currentSequence: prev.currentSequence + 1 }));
    } else {
      serialNumber = generateTaxInvoiceSerialNumber(invoiceDate, settings.entityCode, settings.currentSequence);
      status = 'DRAFT';
      isDraft = true;
    }

    const purchaserSnapshot: PurchaserSnapshot = data.purchaserSnapshot || {
      clientId: data.clientId,
      legalName: data.purchaserName || 'Client Entity',
      tin: data.purchaserTin || '',
      vatNumber: data.purchaserVatNumber || '',
      isVatRegistered: Boolean(data.purchaserVatNumber),
      registeredAddress: data.purchaserAddress || '',
      contactPerson: data.purchaserContactPerson || '',
      phone: data.purchaserPhone || '',
      email: data.purchaserEmail || '',
      capturedAt: now
    };

    const newInvoice: TaxInvoice = {
      id,
      serialNumber,
      isDraft,
      status,
      clientId: data.clientId || purchaserSnapshot.clientId,
      purchaserSnapshot,
      bankAccountId: data.bankAccountId || 'bank-01',
      settlementBankDetails: data.settlementBankDetails || {
        bankAccountId: 'bank-01',
        accountName: 'Apex Global Logistics Corporation (Pvt) Ltd - Operations',
        bankName: 'Commercial Bank of Ceylon PLC',
        branchName: 'World Trade Centre Branch',
        accountNumber: '1000849201',
        swiftCode: 'CCEYLKFX',
        currency: 'LKR',
        purpose: 'Main Operating Cashflow & Fleet Running Costs',
        isPrimary: true
      },
      invoiceDate,
      supplyDate: data.supplyDate || invoiceDate,
      dueDate: data.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      supplierName: settings.companyName,
      supplierTin: settings.companyTin,
      supplierVatNumber: settings.companyVatNumber,
      supplierAddress: settings.companyAddress,
      supplierContact: `${settings.companyPhone} / ${settings.companyEmail}`,
      purchaserName: purchaserSnapshot.legalName,
      purchaserTin: purchaserSnapshot.tin,
      purchaserVatNumber: purchaserSnapshot.vatNumber || '',
      purchaserAddress: purchaserSnapshot.registeredAddress,
      purchaserContactPerson: purchaserSnapshot.contactPerson || '',
      purchaserPhone: purchaserSnapshot.phone || '',
      purchaserEmail: purchaserSnapshot.email || '',
      projectCode: data.projectCode || 'PRJ-GEN',
      projectName: data.projectName || 'General Engineering Project',
      ipcNumber: data.ipcNumber || '',
      contractNumber: data.contractNumber || '',
      purchaseOrderRef: data.purchaseOrderRef || '',
      lineItems: totals.computedItems,
      currency: 'LKR',
      totalTaxableValue: totals.totalTaxableValue,
      vatRate: settings.standardVatRate,
      vatAmount: totals.vatAmount,
      totalConsideration: totals.totalConsideration,
      amountInWords,
      amountReceived: 0,
      balanceDue: totals.totalConsideration,
      paymentStatus: 'Unpaid',
      isGazetteCompliant: true,
      preparedBy: currentUser || 'Finance Officer',
      auditTrail: [
        {
          id: `aud-${Date.now()}`,
          timestamp: now,
          action: 'CREATED',
          performedBy: currentUser || 'Finance Officer',
          notes: isIssueImmediately ? `Issued directly with serial ${serialNumber} (Purchaser snapshot sealed)` : 'Created draft with client master snapshot'
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    setInvoices(prev => [newInvoice, ...prev]);

    // If issued immediately, register in PettyCash income ledger
    if (isIssueImmediately) {
      try {
        addIncome({
          PROJECT: newInvoice.projectName,
          INCOME_SOURCE: 'Project Income / Invoice',
          AMOUNT: newInvoice.totalConsideration,
          grossAmount: newInvoice.totalConsideration,
          taxableAmount: newInvoice.totalTaxableValue,
          vatRate: newInvoice.vatRate,
          vatAmount: newInvoice.vatAmount,
          invoiceNumber: newInvoice.serialNumber,
          clientName: newInvoice.purchaserName,
          clientTin: newInvoice.purchaserTin,
          paymentStatus: 'Pending',
          TRANSACTION_TYPE: 'PROJECT_INVOICE_INCOME',
          RECEIPT_DATE: newInvoice.invoiceDate,
          DESCRIPTION: `Tax Invoice ${newInvoice.serialNumber} - ${newInvoice.lineItems[0]?.description || 'Works'}`
        } as any);
      } catch (err) {
        console.warn('Could not sync to PettyCashContext:', err);
      }
    }

    return newInvoice;
  };

  // Update existing invoice
  const updateInvoice = (id: string, updates: Partial<TaxInvoice>) => {
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id !== id) return inv;

        const lineItems = updates.lineItems || inv.lineItems;
        const vatRate = updates.vatRate !== undefined ? updates.vatRate : inv.vatRate;
        const totals = calculateTaxInvoiceTotals(lineItems, vatRate);
        const amountInWords = amountToWordsLKR(totals.totalConsideration);

        const now = new Date().toISOString();

        return {
          ...inv,
          ...updates,
          lineItems: totals.computedItems,
          totalTaxableValue: totals.totalTaxableValue,
          vatAmount: totals.vatAmount,
          totalConsideration: totals.totalConsideration,
          amountInWords,
          balanceDue: totals.totalConsideration - (updates.amountReceived ?? inv.amountReceived),
          updatedAt: now,
          auditTrail: [
            ...inv.auditTrail,
            {
              id: `aud-${Date.now()}`,
              timestamp: now,
              action: 'UPDATED',
              performedBy: currentUser || 'Finance Officer',
              notes: 'Invoice line items or details updated'
            }
          ]
        };
      })
    );
  };

  // Submit Invoice for approval
  const submitInvoice = (id: string, user: string) => {
    const now = new Date().toISOString();
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id !== id) return inv;
        return {
          ...inv,
          status: 'SUBMITTED',
          submittedBy: user,
          submittedAt: now,
          updatedAt: now,
          auditTrail: [
            ...inv.auditTrail,
            {
              id: `aud-${Date.now()}`,
              timestamp: now,
              action: 'SUBMITTED',
              performedBy: user,
              previousStatus: inv.status,
              newStatus: 'SUBMITTED',
              notes: 'Draft submitted for Finance Director authorization'
            }
          ]
        };
      })
    );
  };

  // Approve Invoice
  const approveInvoice = (id: string, user: string) => {
    const now = new Date().toISOString();
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id !== id) return inv;
        return {
          ...inv,
          status: 'APPROVED',
          approvedBy: user,
          approvedAt: now,
          updatedAt: now,
          auditTrail: [
            ...inv.auditTrail,
            {
              id: `aud-${Date.now()}`,
              timestamp: now,
              action: 'APPROVED',
              performedBy: user,
              previousStatus: inv.status,
              newStatus: 'APPROVED',
              notes: 'Invoice approved by Director; ready for official issuance'
            }
          ]
        };
      })
    );
  };

  // Issue Invoice (generates permanent serial, increments sequence, enforces Gazette checklist)
  const issueInvoice = (id: string, user: string): { success: boolean; serialNumber?: string; errors?: string[] } => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return { success: false, errors: ['Invoice not found.'] };

    // Generate permanent serial controlled strictly by invoiceDate
    const permanentSerial = generateTaxInvoiceSerialNumber(inv.invoiceDate, settings.entityCode, settings.currentSequence);

    // Validate 18-point Gazette compliance
    const candidateInvoice: TaxInvoice = {
      ...inv,
      serialNumber: permanentSerial
    };

    const validation = validateTaxInvoiceForIssuance(candidateInvoice);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const now = new Date().toISOString();

    setInvoices(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const finalSnapshot: PurchaserSnapshot = item.purchaserSnapshot || {
          clientId: item.clientId,
          legalName: item.purchaserName,
          tin: item.purchaserTin,
          vatNumber: item.purchaserVatNumber,
          isVatRegistered: Boolean(item.purchaserVatNumber),
          registeredAddress: item.purchaserAddress,
          contactPerson: item.purchaserContactPerson,
          phone: item.purchaserPhone,
          email: item.purchaserEmail,
          capturedAt: now
        };

        return {
          ...item,
          serialNumber: permanentSerial,
          isDraft: false,
          status: 'ISSUED',
          purchaserSnapshot: finalSnapshot,
          issuedBy: user,
          issuedAt: now,
          updatedAt: now,
          auditTrail: [
            ...item.auditTrail,
            {
              id: `aud-${Date.now()}`,
              timestamp: now,
              action: 'ISSUED',
              performedBy: user,
              previousStatus: item.status,
              newStatus: 'ISSUED',
              notes: `Permanently issued under Gazette No. 2481/22. Serial assigned: ${permanentSerial}. Purchaser snapshot sealed.`
            }
          ]
        };
      })
    );

    // Increment sequence number
    setSettings(prev => ({
      ...prev,
      currentSequence: prev.currentSequence + 1
    }));

    // Register in PettyCash income ledger
    try {
      addIncome({
        PROJECT: inv.projectName,
        INCOME_SOURCE: 'Project Income / Invoice',
        AMOUNT: inv.totalConsideration,
        grossAmount: inv.totalConsideration,
        taxableAmount: inv.totalTaxableValue,
        vatRate: inv.vatRate,
        vatAmount: inv.vatAmount,
        invoiceNumber: permanentSerial,
        clientName: inv.purchaserName,
        clientTin: inv.purchaserTin,
        paymentStatus: 'Pending',
        TRANSACTION_TYPE: 'PROJECT_INVOICE_INCOME',
        RECEIPT_DATE: inv.invoiceDate,
        DESCRIPTION: `Official Tax Invoice ${permanentSerial} - ${inv.lineItems[0]?.description || 'Certified Works'}`
      } as any);
    } catch (err) {
      console.warn('Could not register issued invoice in PettyCashContext:', err);
    }

    return { success: true, serialNumber: permanentSerial };
  };

  // Record Client Payment
  const recordClientPayment = (paymentData: Omit<ClientPaymentRecord, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const paymentId = `pay-${Date.now()}`;
    const newRecord: ClientPaymentRecord = {
      ...paymentData,
      id: paymentId,
      createdAt: now
    };

    setPayments(prev => [newRecord, ...prev]);

    // Update invoice balances
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id !== paymentData.invoiceId && inv.serialNumber !== paymentData.invoiceNumber) {
          return inv;
        }

        const newReceived = inv.amountReceived + paymentData.amountReceived;
        const newBalance = Math.max(0, inv.totalConsideration - newReceived);
        const paymentStatus = newBalance <= 0.05 ? 'Paid' : 'Partially Paid';
        const newStatus: TaxInvoiceStatus = newBalance <= 0.05 ? 'PAID' : 'PARTIALLY_PAID';

        return {
          ...inv,
          amountReceived: newReceived,
          balanceDue: newBalance,
          paymentStatus,
          status: newStatus,
          updatedAt: now,
          auditTrail: [
            ...inv.auditTrail,
            {
              id: `aud-${Date.now()}`,
              timestamp: now,
              action: 'PAYMENT_RECORDED',
              performedBy: paymentData.recordedBy || currentUser || 'Cashier',
              notes: `Payment of LKR ${paymentData.amountReceived.toLocaleString()} recorded. Method: ${paymentData.paymentMethod}, Ref: ${paymentData.paymentReference}, Receipt: ${paymentData.receiptNumber}. Remaining balance: LKR ${newBalance.toLocaleString()}`
            }
          ]
        };
      })
    );

    // Also update corresponding income in PettyCashContext if exists
    try {
      const match = income.find(inc =>
        inc.invoiceNumber === paymentData.invoiceNumber ||
        inc.INCOME_ID === paymentData.invoiceId ||
        inc.id === paymentData.invoiceId
      );
      if (match) {
        const prevReceived = Number(match.amountReceived) || 0;
        const newReceived = prevReceived + paymentData.amountReceived;
        const totalGross = Number(match.grossAmount) || Number(match.AMOUNT) || 0;
        const newDue = Math.max(0, totalGross - newReceived);
        updateIncome(match.id, {
          amountReceived: newReceived,
          balanceDue: newDue,
          paymentStatus: newDue <= 0.05 ? 'Paid' : 'Partially Paid',
          paymentDate: paymentData.paymentDate,
          paymentReference: paymentData.paymentReference
        } as any);
      }
    } catch (err) {
      console.warn('Could not sync payment with PettyCashContext income:', err);
    }
  };

  // Delete Client Payment
  const deleteClientPayment = (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId || p.receiptNumber === paymentId);
    if (!payment) return;

    setPayments(prev => prev.filter(p => p.id !== payment.id && p.receiptNumber !== paymentId));

    // Revert invoice balances
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id !== payment.invoiceId && inv.serialNumber !== payment.invoiceNumber) {
          return inv;
        }
        const newReceived = Math.max(0, inv.amountReceived - payment.amountReceived);
        const newBalance = Math.max(0, inv.totalConsideration - newReceived);
        const paymentStatus = newBalance <= 0.05 ? 'Paid' : (newReceived > 0 ? 'Partially Paid' : 'Unpaid');
        const newStatus: TaxInvoiceStatus = newBalance <= 0.05 ? 'PAID' : (newReceived > 0 ? 'PARTIALLY_PAID' : 'ISSUED');
        const now = new Date().toISOString();

        return {
          ...inv,
          amountReceived: newReceived,
          balanceDue: newBalance,
          paymentStatus,
          status: inv.status === 'CANCELLED' ? 'CANCELLED' : newStatus,
          updatedAt: now,
          auditTrail: [
            ...inv.auditTrail,
            {
              id: `aud-${Date.now()}`,
              timestamp: now,
              action: 'PAYMENT_DELETED',
              performedBy: currentUser || 'Admin',
              notes: `Payment receipt ${payment.receiptNumber} of LKR ${payment.amountReceived.toLocaleString()} was deleted with Admin Security Key authorization. Restored balance due to LKR ${newBalance.toLocaleString()}.`
            }
          ]
        };
      })
    );

    // Sync with PettyCash income if exists
    try {
      const match = income.find(inc =>
        inc.invoiceNumber === payment.invoiceNumber ||
        inc.INCOME_ID === payment.invoiceId ||
        inc.id === payment.invoiceId
      );
      if (match) {
        const prevReceived = Number(match.amountReceived) || 0;
        const newReceived = Math.max(0, prevReceived - payment.amountReceived);
        const totalGross = Number(match.grossAmount) || Number(match.AMOUNT) || 0;
        const newDue = Math.max(0, totalGross - newReceived);
        updateIncome(match.id, {
          amountReceived: newReceived,
          balanceDue: newDue,
          paymentStatus: newDue <= 0.05 ? 'Paid' : (newReceived > 0 ? 'Partially Paid' : 'Pending'),
          paymentReference: newReceived > 0 ? match.paymentReference : undefined,
          paymentDate: newReceived > 0 ? match.paymentDate : undefined
        } as any);
      }
    } catch (err) {
      console.warn('Could not sync payment deletion with PettyCashContext income:', err);
    }
  };

  // Create Credit Note
  const createCreditNote = (originalInvoiceId: string, reason: string, lineItems: InvoiceSupplyItem[], user: string): TaxInvoice => {
    const original = invoices.find(i => i.id === originalInvoiceId);
    if (!original) throw new Error('Original invoice not found.');

    const now = new Date().toISOString();
    const invoiceDate = now.split('T')[0];
    const totals = calculateTaxInvoiceTotals(lineItems, original.vatRate);
    const amountInWords = amountToWordsLKR(totals.totalConsideration);

    const creditSerial = `CN_${generateTaxInvoiceSerialNumber(invoiceDate, settings.entityCode, settings.currentSequence)}`;
    setSettings(prev => ({ ...prev, currentSequence: prev.currentSequence + 1 }));

    const creditNote: TaxInvoice = {
      id: `cn-${Date.now()}`,
      serialNumber: creditSerial,
      isDraft: false,
      status: 'ISSUED',
      invoiceDate,
      supplyDate: original.supplyDate,
      dueDate: invoiceDate,
      supplierName: original.supplierName,
      supplierTin: original.supplierTin,
      supplierVatNumber: original.supplierVatNumber,
      supplierAddress: original.supplierAddress,
      supplierContact: original.supplierContact,
      purchaserName: original.purchaserName,
      purchaserTin: original.purchaserTin,
      purchaserVatNumber: original.purchaserVatNumber,
      purchaserAddress: original.purchaserAddress,
      purchaserContactPerson: original.purchaserContactPerson,
      purchaserPhone: original.purchaserPhone,
      purchaserEmail: original.purchaserEmail,
      projectCode: original.projectCode,
      projectName: original.projectName,
      ipcNumber: original.ipcNumber,
      contractNumber: original.contractNumber,
      lineItems: totals.computedItems,
      currency: 'LKR',
      totalTaxableValue: totals.totalTaxableValue,
      vatRate: original.vatRate,
      vatAmount: totals.vatAmount,
      totalConsideration: totals.totalConsideration,
      amountInWords,
      amountReceived: 0,
      balanceDue: totals.totalConsideration,
      paymentStatus: 'Paid',
      isCreditNote: true,
      originalInvoiceId: original.id,
      originalInvoiceNumber: original.serialNumber,
      creditReason: reason,
      isGazetteCompliant: true,
      preparedBy: user,
      issuedBy: user,
      issuedAt: now,
      auditTrail: [
        {
          id: `aud-${Date.now()}`,
          timestamp: now,
          action: 'CREDIT_NOTE_CREATED',
          performedBy: user,
          notes: `Credit note issued against Tax Invoice ${original.serialNumber}. Reason: ${reason}`
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    setInvoices(prev => [creditNote, ...prev]);
    return creditNote;
  };

  // Cancel Invoice (Under Gazette Section 60, serial is permanently retained)
  const cancelInvoice = (id: string, reason: string, user: string) => {
    const now = new Date().toISOString();
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id !== id) return inv;
        return {
          ...inv,
          status: 'CANCELLED',
          isCancelled: true,
          cancellationReason: reason,
          cancelledAt: now,
          cancelledBy: user,
          updatedAt: now,
          auditTrail: [
            ...inv.auditTrail,
            {
              id: `aud-${Date.now()}`,
              timestamp: now,
              action: 'CANCELLED',
              performedBy: user,
              previousStatus: inv.status,
              newStatus: 'CANCELLED',
              notes: `Invoice cancelled under Gazette Section 60. Serial ${inv.serialNumber} retained in audit register. Reason: ${reason}`
            }
          ]
        };
      })
    );
  };

  // QuickBooks sync
  const syncToQuickBooks = (id: string) => {
    const now = new Date().toISOString();
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id !== id) return inv;
        const qboId = `QBO-${Math.floor(10000 + Math.random() * 90000)}`;
        return {
          ...inv,
          qbo: {
            status: 'Synced',
            qboInvoiceId: qboId,
            lastSyncedAt: now
          },
          updatedAt: now,
          auditTrail: [
            ...inv.auditTrail,
            {
              id: `aud-${Date.now()}`,
              timestamp: now,
              action: 'QBO_SYNCED',
              performedBy: currentUser || 'Finance Officer',
              notes: `Synchronized to QuickBooks Online ledger as ${qboId}`
            }
          ]
        };
      })
    );
  };

  // Update Settings
  const updateSettings = (newSettings: Partial<TaxInvoiceSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  // Download PDF
  const downloadInvoicePdf = (invoice: TaxInvoice) => {
    const doc = generateTaxInvoicePdf(invoice);
    const filename = `TaxInvoice_${invoice.serialNumber}_${invoice.invoiceDate}.pdf`;
    doc.save(filename);
  };

  // Print PDF
  const printInvoicePdf = (invoice: TaxInvoice) => {
    const doc = generateTaxInvoicePdf(invoice);
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = blobUrl.toString();
    document.body.appendChild(iframe);
    iframe.contentWindow?.print();
  };

  // Delete invoice with permanent resurrection prevention (tombstone)
  const deleteInvoice = (id: string) => {
    const target = invoices.find(inv => inv.id === id || inv.serialNumber === id);
    
    // Extract all identifiable keys for this invoice to prevent auto-syncing it back
    const idsToBlacklist: string[] = [
      id,
      target?.id,
      target?.serialNumber,
      target?.legacyIncomeId,
      id.startsWith('legacy-') ? id.replace('legacy-', '') : undefined,
      target?.id?.startsWith('legacy-') ? target.id.replace('legacy-', '') : undefined,
    ].filter((val): val is string => Boolean(val && val.trim()));

    setDeletedIdentifiers(prev => {
      const combined = new Set([...prev, ...idsToBlacklist]);
      const updated = Array.from(combined);
      try {
        localStorage.setItem('apex_tax_invoices_deleted_ids', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to store deleted invoice IDs:', e);
      }
      return updated;
    });

    setInvoices(prev => prev.filter(inv => inv.id !== id && inv.serialNumber !== id));
    // Also remove associated payment records for this invoice
    if (target) {
      setPayments(prev => prev.filter(p => p.invoiceId !== target.id && p.invoiceNumber !== target.serialNumber));
    } else {
      setPayments(prev => prev.filter(p => p.invoiceId !== id && p.invoiceNumber !== id));
    }
  };

  // Clear tax invoices history (Admin action) - permanently stops auto-sync to avoid re-syncing
  const clearTaxInvoicesHistory = (filterStatus?: string) => {
    if (filterStatus && filterStatus !== 'ALL') {
      const matchingInvoices = invoices.filter(inv => {
        if (filterStatus === 'DRAFT' && (inv.isDraft || inv.status === 'DRAFT' || inv.status === 'SUBMITTED' || inv.status === 'APPROVED')) return true;
        if (filterStatus === 'CANCELLED' && (inv.status === 'CANCELLED' || inv.isCancelled)) return true;
        if (inv.status === filterStatus) return true;
        return false;
      });

      const idsToBlacklist: string[] = [];
      matchingInvoices.forEach(inv => {
        if (inv.id) idsToBlacklist.push(inv.id);
        if (inv.serialNumber) idsToBlacklist.push(inv.serialNumber);
        if (inv.legacyIncomeId) idsToBlacklist.push(inv.legacyIncomeId);
        if (inv.id.startsWith('legacy-')) idsToBlacklist.push(inv.id.replace('legacy-', ''));
      });

      setDeletedIdentifiers(prev => {
        const next = Array.from(new Set([...prev, ...idsToBlacklist]));
        try {
          localStorage.setItem('apex_tax_invoices_deleted_ids', JSON.stringify(next));
        } catch {}
        return next;
      });

      setInvoices(prev => {
        const next = prev.filter(inv => !matchingInvoices.some(m => m.id === inv.id));
        try {
          localStorage.setItem('apex_tax_invoices', JSON.stringify(next));
        } catch (e) {
          console.error('Failed to update tax invoices in localStorage:', e);
        }
        return next;
      });
    } else {
      // Full clear: blacklist all existing invoices and all current Petty Cash income IDs
      const idsToBlacklist: string[] = [];
      invoices.forEach(inv => {
        if (inv.id) idsToBlacklist.push(inv.id);
        if (inv.serialNumber) idsToBlacklist.push(inv.serialNumber);
        if (inv.legacyIncomeId) idsToBlacklist.push(inv.legacyIncomeId);
        if (inv.id.startsWith('legacy-')) idsToBlacklist.push(inv.id.replace('legacy-', ''));
      });

      if (income && income.length > 0) {
        income.forEach(inc => {
          if (inc.id) idsToBlacklist.push(inc.id);
          if (inc.invoiceNumber) idsToBlacklist.push(inc.invoiceNumber);
          if (inc.INCOME_ID) idsToBlacklist.push(inc.INCOME_ID);
        });
      }

      setDeletedIdentifiers(prev => {
        const next = Array.from(new Set([...prev, ...idsToBlacklist]));
        try {
          localStorage.setItem('apex_tax_invoices_deleted_ids', JSON.stringify(next));
        } catch {}
        return next;
      });

      // Automatically turn OFF auto-sync in settings so deleted invoices never re-sync
      setSettings(prev => ({
        ...prev,
        autoSyncPettyCashInvoices: false
      }));

      setInvoices([]);
      setPayments([]);
      try {
        localStorage.setItem('apex_tax_invoices', JSON.stringify([]));
        localStorage.setItem('apex_client_payments', JSON.stringify([]));
        localStorage.setItem('apex_tax_invoices_cleared', 'true');
      } catch (e) {
        console.error('Failed to clear tax invoices in localStorage:', e);
      }
    }
  };

  // Reset tax invoices to default demo records
  const resetTaxInvoicesToDefault = () => {
    try {
      localStorage.removeItem('apex_tax_invoices_cleared');
      localStorage.removeItem('apex_tax_invoices_deleted_ids');
      localStorage.setItem('apex_tax_invoices', JSON.stringify(INITIAL_INVOICES));
      localStorage.setItem('apex_client_payments', JSON.stringify(INITIAL_PAYMENTS));
    } catch (e) {
      console.error('Failed to reset tax invoices:', e);
    }
    setDeletedIdentifiers([]);
    setInvoices(INITIAL_INVOICES.map(inv => ({
      ...inv,
      serialNumber: inv.serialNumber ? inv.serialNumber.replace(/^PREVIEW_/i, '') : inv.serialNumber
    })));
    setPayments(INITIAL_PAYMENTS);
  };

  // Toggle or arrange the option to auto-sync Petty Cash invoices
  const setAutoSyncPettyCashInvoices = (enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      autoSyncPettyCashInvoices: enabled
    }));
    if (enabled) {
      try {
        localStorage.removeItem('apex_tax_invoices_cleared');
      } catch {}
    }
  };

  // Manual on-demand synchronization from Petty Cash ledger
  const syncFromPettyCash = (forceIncludeDeleted = false) => {
    if (!income || income.length === 0) {
      return { addedCount: 0, skippedCount: 0, message: 'No project invoices found in Petty Cash income ledger.' };
    }

    const legacyInvoices = income.filter(inc =>
      inc.TRANSACTION_TYPE === 'PROJECT_INVOICE_INCOME' ||
      Boolean(inc.invoiceNumber) ||
      inc.INCOME_SOURCE === 'Project Income / Invoice'
    );

    if (legacyInvoices.length === 0) {
      return { addedCount: 0, skippedCount: 0, message: 'No project invoices found in Petty Cash income ledger.' };
    }

    const deletedSet = new Set(deletedIdentifiers.map(d => (d || '').trim().toUpperCase()));
    const existingSerials = new Set(invoices.map(i => (i.serialNumber || '').trim().toUpperCase()));
    const existingIds = new Set(invoices.map(i => i.id));
    const existingLegacyIds = new Set(invoices.map(i => i.legacyIncomeId).filter(Boolean));

    const newInvoices: TaxInvoice[] = [];
    let skippedCount = 0;

    legacyInvoices.forEach(inc => {
      const serial = inc.invoiceNumber || inc.INCOME_ID || `INV-LEGACY-${inc.id}`;
      const serialUpper = serial.toUpperCase();
      const incIdUpper = String(inc.id || '').trim().toUpperCase();

      if (existingSerials.has(serialUpper) || existingIds.has(inc.id) || existingLegacyIds.has(inc.id)) {
        skippedCount++;
        return;
      }

      if (!forceIncludeDeleted && (
        deletedSet.has(incIdUpper) ||
        deletedSet.has(serialUpper) ||
        deletedSet.has(`LEGACY-${incIdUpper}`)
      )) {
        skippedCount++;
        return;
      }

      newInvoices.push(convertIncomeToTaxInvoice(inc, settings));
    });

    if (newInvoices.length > 0) {
      setInvoices(prev => [...newInvoices, ...prev]);
      try {
        localStorage.removeItem('apex_tax_invoices_cleared');
      } catch {}
      return {
        addedCount: newInvoices.length,
        skippedCount,
        message: `Successfully synchronized ${newInvoices.length} project invoice${newInvoices.length === 1 ? '' : 's'} from Petty Cash.`
      };
    }

    return {
      addedCount: 0,
      skippedCount,
      message: skippedCount > 0
        ? `All ${skippedCount} project invoice(s) are already registered or were previously deleted.`
        : 'No un-synchronized project invoices found.'
    };
  };

  // Reset the tombstone list of deleted invoices
  const resetDeletedIdentifiers = () => {
    setDeletedIdentifiers([]);
    try {
      localStorage.removeItem('apex_tax_invoices_deleted_ids');
    } catch {}
  };

  // Bulk import tax invoices
  const importTaxInvoices = (imported: Partial<TaxInvoice>[]): { count: number; totalGross: number } => {
    let count = 0;
    let totalGross = 0;
    const now = new Date().toISOString();
    const createdList: TaxInvoice[] = [];

    imported.forEach(item => {
      const gross = Number(item.totalConsideration) || 0;
      const taxable = Number(item.totalTaxableValue) || Math.round(gross / 1.18 * 100) / 100;
      const vat = Number(item.vatAmount) || Math.round((gross - taxable) * 100) / 100;
      const invDate = item.invoiceDate || now.split('T')[0];
      const serial = item.serialNumber || generateTaxInvoiceSerialNumber(invDate, settings.entityCode, settings.currentSequence + count);
      const received = Number(item.amountReceived) || 0;
      const balance = Math.max(0, gross - received);
      const payStatus = balance <= 0.05 ? 'Paid' : received > 0 ? 'Partially Paid' : 'Unpaid';
      const status: TaxInvoiceStatus = item.status || (payStatus === 'Paid' ? 'PAID' : payStatus === 'Partially Paid' ? 'PARTIALLY_PAID' : 'ISSUED');

      const invRecord: TaxInvoice = {
        id: item.id || `imp-inv-${Date.now()}-${count}`,
        serialNumber: serial,
        isDraft: false,
        status,
        invoiceDate: invDate,
        dueDate: item.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        supplierName: settings.companyName,
        supplierTin: settings.companyTin,
        supplierVatNumber: settings.companyVatNumber,
        supplierAddress: settings.companyAddress,
        supplierContact: `${settings.companyPhone} / ${settings.companyEmail}`,
        purchaserName: item.purchaserName || 'Client Entity',
        purchaserTin: item.purchaserTin || '',
        purchaserAddress: item.purchaserAddress || '',
        projectCode: item.projectCode || 'PRJ-GEN',
        projectName: item.projectName || 'Construction Project',
        billingDescription: item.billingDescription || 'Milestone Works',
        lineItems: item.lineItems && item.lineItems.length > 0 ? item.lineItems : [
          {
            id: `item-imp-${count}`,
            itemNumber: 1,
            description: item.billingDescription || 'Construction Milestone Billing',
            unitOfMeasure: 'Lot',
            quantity: 1,
            unitPrice: taxable,
            taxableValue: taxable,
            vatRate: 18,
            vatAmount: vat,
            totalAmount: gross
          }
        ],
        currency: 'LKR',
        totalTaxableValue: taxable,
        vatRate: 18,
        vatAmount: vat,
        totalConsideration: gross,
        amountInWords: amountToWordsLKR(gross),
        amountReceived: received,
        balanceDue: balance,
        paymentStatus: payStatus,
        isGazetteCompliant: true,
        preparedBy: currentUser || 'Finance Officer',
        issuedBy: currentUser || 'Finance Officer',
        issuedAt: invDate,
        auditTrail: [
          {
            id: `aud-imp-${Date.now()}-${count}`,
            timestamp: now,
            action: 'ISSUED',
            performedBy: currentUser || 'Admin',
            notes: `Bulk imported tax invoice. Serial: ${serial}`
          }
        ],
        createdAt: now,
        updatedAt: now
      };

      createdList.push(invRecord);
      count++;
      totalGross += gross;

      // Register in PettyCash context income
      try {
        addIncome({
          PROJECT: invRecord.projectName,
          INCOME_SOURCE: 'Project Income / Invoice',
          AMOUNT: invRecord.totalConsideration,
          grossAmount: invRecord.totalConsideration,
          taxableAmount: invRecord.totalTaxableValue,
          vatRate: invRecord.vatRate,
          vatAmount: invRecord.vatAmount,
          invoiceNumber: invRecord.serialNumber,
          clientName: invRecord.purchaserName,
          clientTin: invRecord.purchaserTin,
          paymentStatus: invRecord.paymentStatus === 'Paid' ? 'Paid' : invRecord.paymentStatus === 'Partially Paid' ? 'Partially Paid' : 'Pending',
          TRANSACTION_TYPE: 'PROJECT_INVOICE_INCOME',
          RECEIPT_DATE: invRecord.invoiceDate,
          DESCRIPTION: `Official Tax Invoice ${invRecord.serialNumber} - ${invRecord.billingDescription}`
        } as any);
      } catch (err) {
        console.warn('Could not sync imported invoice with PettyCashContext:', err);
      }
    });

    setInvoices(prev => [...createdList, ...prev]);
    setSettings(prev => ({ ...prev, currentSequence: prev.currentSequence + count }));
    return { count, totalGross };
  };

  const value = useMemo(
    () => ({
      invoices,
      settings,
      payments,
      activeInvoiceTab,
      setActiveInvoiceTab,
      createInvoice,
      updateInvoice,
      submitInvoice,
      approveInvoice,
      issueInvoice,
      recordClientPayment,
      deleteClientPayment,
      createCreditNote,
      cancelInvoice,
      syncToQuickBooks,
      updateSettings,
      previewNextSerialNumber,
      downloadInvoicePdf,
      printInvoicePdf,
      deleteInvoice,
      clearTaxInvoicesHistory,
      resetTaxInvoicesToDefault,
      importTaxInvoices,
      autoSyncPettyCashInvoices: settings.autoSyncPettyCashInvoices ?? false,
      setAutoSyncPettyCashInvoices,
      syncFromPettyCash,
      deletedIdentifiersCount: deletedIdentifiers.length,
      resetDeletedIdentifiers
    }),
    [invoices, settings, payments, activeInvoiceTab, deletedIdentifiers]
  );

  return <TaxInvoiceContext.Provider value={value}>{children}</TaxInvoiceContext.Provider>;
};

export const useTaxInvoice = (): TaxInvoiceContextType => {
  const context = useContext(TaxInvoiceContext);
  if (!context) {
    throw new Error('useTaxInvoice must be used within a TaxInvoiceProvider');
  }
  return context;
};
