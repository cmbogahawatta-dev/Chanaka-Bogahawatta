import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  PaymentRequestVoucher,
  PaymentProofDocument,
  PaymentTransaction,
  PaymentApprovalRecord,
  PaymentRequestAttachment,
  PRVAuditEntry,
  PRVStatus,
  PRVPriority,
  PayeeType,
  PRVPaymentMethod,
  PaymentSource,
  CurrencyCode,
  PRVSubMenu,
  PRVFilterState,
  ApprovalLevel
} from '../types/prvTypes';
import { usePettyCash } from './PettyCashContext';
import { useEnterprise } from './EnterpriseContext';

interface PRVContextType {
  paymentRequests: PaymentRequestVoucher[];
  paymentProofs: PaymentProofDocument[];
  paymentTransactions: PaymentTransaction[];
  activeSubTab: PRVSubMenu;
  setActiveSubTab: (tab: PRVSubMenu) => void;
  filters: PRVFilterState;
  setFilters: React.Dispatch<React.SetStateAction<PRVFilterState>>;
  resetFilters: () => void;
  
  // Selected PRV for viewing/modals
  selectedPRV: PaymentRequestVoucher | null;
  setSelectedPRV: (prv: PaymentRequestVoucher | null) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isDetailModalOpen: boolean;
  setIsDetailModalOpen: (open: boolean) => void;
  isScannerModalOpen: boolean;
  setIsScannerModalOpen: (open: boolean) => void;
  isOwnerApprovalModalOpen: boolean;
  setIsOwnerApprovalModalOpen: (open: boolean) => void;
  
  // Target PRV specifically for scanning/owner actions
  targetPRVForAction: PaymentRequestVoucher | null;
  setTargetPRVForAction: (prv: PaymentRequestVoucher | null) => void;

  // Actions
  createPaymentRequest: (data: Omit<PaymentRequestVoucher, 'id' | 'prvNumber' | 'status' | 'approvals' | 'auditTrail' | 'createdAt' | 'updatedAt'>, submitImmediately?: boolean) => PaymentRequestVoucher;
  updatePaymentRequest: (id: string, updates: Partial<PaymentRequestVoucher>) => void;
  deletePaymentRequest: (id: string) => void;
  submitDraftRequest: (id: string) => void;
  
  // Approval Actions
  accountsL1Approve: (id: string, comment: string) => void;
  accountsL1Reject: (id: string, reason: string) => void;
  accountsL1Return: (id: string, reason: string) => void;
  
  accountsL2Approve: (id: string, comment: string) => void;
  accountsL2Reject: (id: string, reason: string) => void;
  accountsL2Return: (id: string, reason: string) => void;
  
  ownerApprove: (id: string, comment: string) => void;
  ownerReject: (id: string, reason: string) => void;
  ownerReturn: (id: string, reason: string) => void;
  
  // Payment Proof & Completion
  completePaymentWithProof: (
    prvId: string,
    proofData: {
      documentType: PaymentProofDocument['documentType'];
      file: string;
      fileName: string;
      fileType: string;
      capturedMethod: 'CAMERA_SCAN' | 'UPLOAD';
      notes?: string;
      pagesCount?: number;
    },
    transactionMeta: {
      paymentDate: string;
      paymentReference: string;
      paymentMethod: PRVPaymentMethod | string;
      paymentSource: PaymentSource | string;
      bankAccount: string;
    }
  ) => void;

  // Navigation / Quick Actions
  openPRVByNumber: (prvNumber: string) => void;
  openPRVById: (id: string) => void;
  openProofScannerForPRV: (prv: PaymentRequestVoucher) => void;
  openOwnerApprovalForPRV: (prv: PaymentRequestVoucher) => void;

  // Clear / Reset History
  clearAllPRVHistory: () => void;
  resetPRVsToDefault: () => void;

  // Computed metrics
  metrics: {
    totalRequests: number;
    myRequestsCount: number;
    pendingAccountsL1Count: number;
    pendingAccountsL2Count: number;
    pendingOwnerCount: number;
    pendingProofCount: number;
    paidCount: number;
    totalAmountRequested: number;
    totalAmountPaid: number;
    totalAmountPending: number;
    paidThisMonthAmount: number;
  };

  filteredRequests: PaymentRequestVoucher[];
}

const defaultPRVFilters: PRVFilterState = {
  searchQuery: '',
  project: 'ALL',
  requestedBy: 'ALL',
  status: 'ALL',
  priority: 'ALL',
  paymentMethod: 'ALL',
  paymentSource: 'ALL',
  expenseCategory: 'ALL',
  currency: 'ALL',
  dateFrom: '',
  dateTo: '',
  approvalLevel: 'ALL',
  payee: '',
  sortBy: 'date',
  sortOrder: 'desc'
};

// Initial Sample Supporting Documents
const SAMPLE_INVOICE_DATA = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=60';
const SAMPLE_RECEIPT_DATA = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=60';

const INITIAL_PRVS: PaymentRequestVoucher[] = [
  {
    id: 'prv-45',
    prvNumber: 'PRV-2026-00045',
    requestDate: '2026-08-27',
    requestedBy: 'BUDDIKA',
    requestedByEmail: 'buddika@emaenterprise.com',
    department: 'Site Operations & Earthwork',
    projectId: 'PRJ-001',
    projectCode: 'PIDM 26',
    costCentre: 'CC-PIDM26-FUEL-DEPOT',
    expenseCategoryId: 'cat-4',
    expenseCategory: 'Plant & Equipment',
    purpose: 'Diesel payment',
    description: 'Emergency diesel fuel supply (1,000 Liters) for Caterpillar 320D excavator and BOMAG roller on Ch 14+200.',
    requiredDate: '2026-08-28',
    priority: 'Urgent',
    payeeName: 'Emirates Petroleum Distribution LLC',
    payeeType: 'Supplier',
    bankName: 'First Abu Dhabi Bank (FAB)',
    accountName: 'Emirates Petroleum Dist LLC',
    accountNumber: '104829374619',
    iban: 'AE44033000104829374619',
    paymentMethod: 'Bank Transfer',
    paymentSource: 'Bank Account',
    amount: 3500,
    currency: 'AED',
    vatRate: 0,
    vatAmount: 0,
    totalAmount: 3500,
    paymentReference: 'PENDING-FAB-TXN',
    status: 'OWNER_APPROVED',
    attachments: [
      {
        id: 'att-45-1',
        name: 'EmiratesPetroleum_Invoice_EP9921.pdf',
        documentType: 'Invoice',
        fileType: 'application/pdf',
        fileData: SAMPLE_INVOICE_DATA,
        fileSizeKb: 380,
        uploadedBy: 'BUDDIKA',
        uploadedAt: '2026-08-27 09:30'
      },
      {
        id: 'att-45-2',
        name: 'Fuel_Depot_Delivery_Chit_Ch14.jpg',
        documentType: 'Delivery note',
        fileType: 'image/jpeg',
        fileData: SAMPLE_RECEIPT_DATA,
        fileSizeKb: 520,
        uploadedBy: 'BUDDIKA',
        uploadedAt: '2026-08-27 09:32'
      }
    ],
    approvals: [
      {
        id: 'app-45-1',
        paymentRequestId: 'prv-45',
        approvalLevel: 'ACCOUNTS_L1',
        approverId: 'acc-1',
        approverName: 'Kusal Mendis (Accounts L1)',
        approverRole: 'FINANCE',
        action: 'APPROVE',
        comment: 'Verified against site meter ticket and invoice rate AED 3.50/Ltr.',
        approvedAt: '2026-08-27 10:15',
        deviceInfo: 'Chrome / macOS (192.168.1.42)'
      },
      {
        id: 'app-45-2',
        paymentRequestId: 'prv-45',
        approvalLevel: 'ACCOUNTS_L2',
        approverId: 'acc-2',
        approverName: 'Dilshan Silva (Senior Finance)',
        approverRole: 'FINANCE',
        action: 'APPROVE',
        comment: 'Sufficient budget remaining in PIDM 26 machinery line.',
        approvedAt: '2026-08-27 11:30',
        deviceInfo: 'Edge / Windows 11 (192.168.1.18)'
      },
      {
        id: 'app-45-3',
        paymentRequestId: 'prv-45',
        approvalLevel: 'OWNER',
        approverId: 'owner-1',
        approverName: 'Managing Director (Owner)',
        approverRole: 'OWNER',
        action: 'APPROVE',
        comment: 'Payment authorized. Please process transfer and attach proof confirmation.',
        approvedAt: '2026-08-27 14:00',
        deviceInfo: 'Mobile Safari / iOS 17 (192.168.1.9)'
      }
    ],
    auditTrail: [
      {
        id: 'aud-45-1',
        timestamp: '2026-08-27 09:35',
        user: 'BUDDIKA',
        role: 'SUPERVISOR',
        action: 'PRV Submitted',
        prevStatus: 'DRAFT',
        newStatus: 'SUBMITTED',
        comment: 'Created emergency diesel fuel voucher'
      },
      {
        id: 'aud-45-2',
        timestamp: '2026-08-27 10:15',
        user: 'Kusal Mendis',
        role: 'FINANCE',
        action: 'Accounts L1 Approved',
        prevStatus: 'SUBMITTED',
        newStatus: 'ACCOUNTS_L1_APPROVED',
        comment: 'Verified quantity & unit pricing'
      },
      {
        id: 'aud-45-3',
        timestamp: '2026-08-27 11:30',
        user: 'Dilshan Silva',
        role: 'FINANCE',
        action: 'Accounts L2 Approved',
        prevStatus: 'ACCOUNTS_L1_APPROVED',
        newStatus: 'ACCOUNTS_L2_APPROVED',
        comment: 'Cost centre allocation verified'
      },
      {
        id: 'aud-45-4',
        timestamp: '2026-08-27 14:00',
        user: 'Managing Director',
        role: 'OWNER',
        action: 'Owner Approved',
        prevStatus: 'ACCOUNTS_L2_APPROVED',
        newStatus: 'OWNER_APPROVED',
        comment: 'Authorized payment release'
      }
    ],
    createdAt: '2026-08-27 09:30:00',
    updatedAt: '2026-08-27 14:00:00'
  },
  {
    id: 'prv-44',
    prvNumber: 'PRV-2026-00044',
    requestDate: '2026-08-25',
    requestedBy: 'BUDDIKA',
    requestedByEmail: 'buddika@emaenterprise.com',
    department: 'Heavy Equipment & Machinery',
    projectId: 'PRJ-001',
    projectCode: 'PIDM 26',
    costCentre: 'CC-PIDM26-EQUIPMENT',
    expenseCategoryId: 'cat-4',
    expenseCategory: 'Plant & Equipment',
    purpose: '50-Ton Mobile Crane Rental (5 Days)',
    description: 'Pre-cast culvert box girder lifting operations at Junction 12+800.',
    requiredDate: '2026-08-26',
    priority: 'High',
    payeeName: 'Al Faris Heavy Lifting Equipment LLC',
    payeeType: 'Contractor',
    bankName: 'Emirates NBD',
    accountName: 'Al Faris Heavy Lifting LLC',
    accountNumber: '109283746201',
    iban: 'AE12024000109283746201',
    paymentMethod: 'Bank Transfer',
    paymentSource: 'Bank Account',
    amount: 5000,
    currency: 'AED',
    vatRate: 0,
    vatAmount: 0,
    totalAmount: 5000,
    paymentReference: 'ENBD-TXN-998231',
    status: 'PAID',
    linkedExpenseId: 'exp-1004',
    attachments: [
      {
        id: 'att-44-1',
        name: 'AlFaris_Quotation_AF5088.pdf',
        documentType: 'Quotation',
        fileType: 'application/pdf',
        fileData: SAMPLE_INVOICE_DATA,
        fileSizeKb: 420,
        uploadedBy: 'BUDDIKA',
        uploadedAt: '2026-08-25 08:00'
      }
    ],
    approvals: [
      {
        id: 'app-44-1',
        paymentRequestId: 'prv-44',
        approvalLevel: 'ACCOUNTS_L1',
        approverId: 'acc-1',
        approverName: 'Kusal Mendis',
        approverRole: 'FINANCE',
        action: 'APPROVE',
        comment: 'Rate is as per standard procurement contract.',
        approvedAt: '2026-08-25 09:30'
      },
      {
        id: 'app-44-2',
        paymentRequestId: 'prv-44',
        approvalLevel: 'ACCOUNTS_L2',
        approverId: 'acc-2',
        approverName: 'Dilshan Silva',
        approverRole: 'FINANCE',
        action: 'APPROVE',
        comment: 'Approved.',
        approvedAt: '2026-08-25 11:00'
      },
      {
        id: 'app-44-3',
        paymentRequestId: 'prv-44',
        approvalLevel: 'OWNER',
        approverId: 'owner-1',
        approverName: 'Managing Director',
        approverRole: 'OWNER',
        action: 'APPROVE',
        comment: 'Authorized. Direct transfer executed via Emirates NBD.',
        approvedAt: '2026-08-25 15:30'
      }
    ],
    transaction: {
      id: 'txn-44',
      paymentRequestId: 'prv-44',
      prvNumber: 'PRV-2026-00044',
      paymentDate: '2026-08-26',
      paymentMethod: 'Bank Transfer',
      paymentSource: 'Bank Account',
      bankAccount: 'EMA Corporate Operations - ENBD A/C #7842',
      paymentReference: 'ENBD-TXN-998231',
      amount: 5000,
      currency: 'AED',
      status: 'COMPLETED',
      paidBy: 'Managing Director (Owner)',
      completedAt: '2026-08-26 16:10',
      linkedExpenseId: 'exp-1004',
      proofs: [
        {
          id: 'prf-44-1',
          proofNumber: 'PRV-2026-00044-PAYMENT-PROOF-01.pdf',
          paymentRequestId: 'prv-44',
          paymentTransactionId: 'txn-44',
          prvNumber: 'PRV-2026-00044',
          paymentDate: '2026-08-26',
          paymentAmount: 5000,
          currency: 'AED',
          paymentReference: 'ENBD-TXN-998231',
          paymentMethod: 'Bank Transfer',
          paymentSource: 'Bank Account',
          bankAccount: 'EMA Corporate Operations - ENBD A/C #7842',
          documentType: 'Bank Transfer Confirmation',
          file: SAMPLE_RECEIPT_DATA,
          fileName: 'ENBD_Wire_Confirmation_998231.pdf',
          fileType: 'application/pdf',
          capturedMethod: 'CAMERA_SCAN',
          capturedBy: 'Managing Director',
          capturedAt: '2026-08-26 16:10',
          notes: 'Scanned official bank transfer confirmation receipt with transaction reference hash.'
        }
      ]
    },
    auditTrail: [
      {
        id: 'aud-44-1',
        timestamp: '2026-08-25 08:30',
        user: 'BUDDIKA',
        role: 'SUPERVISOR',
        action: 'PRV Submitted',
        newStatus: 'SUBMITTED',
        comment: 'Crane rental request submitted'
      },
      {
        id: 'aud-44-2',
        timestamp: '2026-08-25 09:30',
        user: 'Kusal Mendis',
        role: 'FINANCE',
        action: 'Accounts L1 Approved',
        newStatus: 'ACCOUNTS_L1_APPROVED'
      },
      {
        id: 'aud-44-3',
        timestamp: '2026-08-25 11:00',
        user: 'Dilshan Silva',
        role: 'FINANCE',
        action: 'Accounts L2 Approved',
        newStatus: 'ACCOUNTS_L2_APPROVED'
      },
      {
        id: 'aud-44-4',
        timestamp: '2026-08-25 15:30',
        user: 'Managing Director',
        role: 'OWNER',
        action: 'Owner Approved',
        newStatus: 'OWNER_APPROVED'
      },
      {
        id: 'aud-44-5',
        timestamp: '2026-08-26 16:10',
        user: 'Managing Director',
        role: 'OWNER',
        action: 'Payment Proof Uploaded',
        newStatus: 'PAID',
        comment: 'Uploaded bank wire receipt'
      },
      {
        id: 'aud-44-6',
        timestamp: '2026-08-26 16:10',
        user: 'System Bot',
        role: 'ADMIN',
        action: 'Project Expense Created',
        newStatus: 'PAID',
        details: 'Auto-created Project Expense EXP-202608-0104 (PIDM 26 - Plant & Equipment)'
      }
    ],
    createdAt: '2026-08-25 08:30:00',
    updatedAt: '2026-08-26 16:10:00'
  },
  {
    id: 'prv-46',
    prvNumber: 'PRV-2026-00046',
    requestDate: '2026-08-28',
    requestedBy: 'GEETH',
    requestedByEmail: 'geeth@emaenterprise.com',
    department: 'Road Works Construction',
    projectId: 'PRJ-002',
    projectCode: 'PIDM 28',
    costCentre: 'CC-PIDM28-MATERIALS',
    expenseCategoryId: 'cat-1',
    expenseCategory: '5000 Construction Materials',
    purpose: 'Crushed Rock Aggregate 20mm Supply (85 MT)',
    description: 'Road base course compaction aggregate delivered directly to Gampaha site yard section 4.',
    requiredDate: '2026-08-29',
    priority: 'High',
    payeeName: 'Lanka Quarry & Minerals (Pvt) Ltd',
    payeeType: 'Supplier',
    bankName: 'Bank of Ceylon (BOC)',
    accountName: 'Lanka Quarry Minerals Ltd',
    accountNumber: '88291048271',
    iban: '',
    paymentMethod: 'Bank Transfer',
    paymentSource: 'Bank Account',
    amount: 12400,
    currency: 'AED',
    vatRate: 0,
    vatAmount: 0,
    totalAmount: 12400,
    status: 'SUBMITTED',
    attachments: [
      {
        id: 'att-46-1',
        name: 'LankaQuarry_TaxInvoice_LQ882.pdf',
        documentType: 'Invoice',
        fileType: 'application/pdf',
        fileData: SAMPLE_INVOICE_DATA,
        fileSizeKb: 310,
        uploadedBy: 'GEETH',
        uploadedAt: '2026-08-28 08:45'
      }
    ],
    approvals: [],
    auditTrail: [
      {
        id: 'aud-46-1',
        timestamp: '2026-08-28 08:50',
        user: 'GEETH',
        role: 'SUPERVISOR',
        action: 'PRV Submitted',
        newStatus: 'SUBMITTED',
        comment: 'Aggregate materials supply voucher created'
      }
    ],
    createdAt: '2026-08-28 08:45:00',
    updatedAt: '2026-08-28 08:50:00'
  },
  {
    id: 'prv-47',
    prvNumber: 'PRV-2026-00047',
    requestDate: '2026-08-26',
    requestedBy: 'LASANTHA',
    requestedByEmail: 'lasantha@emaenterprise.com',
    department: 'Mechanical Maintenance Workshop',
    projectId: 'PRJ-003',
    projectCode: 'PIDM 27',
    costCentre: 'CC-PIDM27-WORKSHOP',
    expenseCategoryId: 'cat-2',
    expenseCategory: 'Vehicle & Equipment Maintenance',
    purpose: 'Hydraulic Piston Overhaul for Excavator WP-EX-441',
    description: 'Urgent replacement of high pressure main pump seals and valve assembly.',
    requiredDate: '2026-08-28',
    priority: 'Urgent',
    payeeName: 'United Tractor & Equipment (UTE) Ltd',
    payeeType: 'Contractor',
    bankName: 'Commercial Bank of Ceylon',
    accountName: 'United Tractor & Equipment',
    accountNumber: '1092837419',
    paymentMethod: 'Cheque',
    paymentSource: 'Cheque',
    amount: 4800,
    currency: 'AED',
    vatRate: 0,
    vatAmount: 0,
    totalAmount: 4800,
    status: 'ACCOUNTS_L1_APPROVED',
    attachments: [
      {
        id: 'att-47-1',
        name: 'UTE_Service_Quote_CAT320.pdf',
        documentType: 'Quotation',
        fileType: 'application/pdf',
        fileData: SAMPLE_INVOICE_DATA,
        fileSizeKb: 290,
        uploadedBy: 'LASANTHA',
        uploadedAt: '2026-08-26 14:00'
      }
    ],
    approvals: [
      {
        id: 'app-47-1',
        paymentRequestId: 'prv-47',
        approvalLevel: 'ACCOUNTS_L1',
        approverId: 'acc-1',
        approverName: 'Kusal Mendis',
        approverRole: 'FINANCE',
        action: 'APPROVE',
        comment: 'Breakdown critical. Approved for Level 2 review.',
        approvedAt: '2026-08-26 15:30'
      }
    ],
    auditTrail: [
      {
        id: 'aud-47-1',
        timestamp: '2026-08-26 14:15',
        user: 'LASANTHA',
        role: 'SUPERVISOR',
        action: 'PRV Submitted',
        newStatus: 'SUBMITTED'
      },
      {
        id: 'aud-47-2',
        timestamp: '2026-08-26 15:30',
        user: 'Kusal Mendis',
        role: 'FINANCE',
        action: 'Accounts L1 Approved',
        prevStatus: 'SUBMITTED',
        newStatus: 'ACCOUNTS_L1_APPROVED'
      }
    ],
    createdAt: '2026-08-26 14:00:00',
    updatedAt: '2026-08-26 15:30:00'
  },
  {
    id: 'prv-48',
    prvNumber: 'PRV-2026-00048',
    requestDate: '2026-08-27',
    requestedBy: 'BUDDIKA',
    requestedByEmail: 'buddika@emaenterprise.com',
    department: 'Structural Concrete & Culverts',
    projectId: 'PRJ-001',
    projectCode: 'PIDM 26',
    costCentre: 'CC-PIDM26-SUBCONTRACTORS',
    expenseCategoryId: 'cat-3',
    expenseCategory: 'Direct Project Cost',
    purpose: 'Subcontractor Progress Milestone Billing #02',
    description: 'Reinforced concrete casting for Abutment A1 and 4 retaining wing-walls certified by Resident Engineer.',
    requiredDate: '2026-08-30',
    priority: 'High',
    payeeName: 'Lanka Infra Structures (Pvt) Ltd',
    payeeType: 'Contractor',
    bankName: 'Hatton National Bank (HNB)',
    accountName: 'Lanka Infra Structures (Pvt) Ltd',
    accountNumber: '003920194821',
    iban: 'AE992010003920194821',
    paymentMethod: 'Bank Transfer',
    paymentSource: 'Direct Bank Transfer',
    amount: 28500,
    currency: 'AED',
    vatRate: 0,
    vatAmount: 0,
    totalAmount: 28500,
    status: 'ACCOUNTS_L2_APPROVED',
    attachments: [
      {
        id: 'att-48-1',
        name: 'Interim_IPC_02_Certified_RDA.pdf',
        documentType: 'Approval letter',
        fileType: 'application/pdf',
        fileData: SAMPLE_INVOICE_DATA,
        fileSizeKb: 850,
        uploadedBy: 'BUDDIKA',
        uploadedAt: '2026-08-27 11:00'
      },
      {
        id: 'att-48-2',
        name: 'Subcontract_Agreement_PIDM26_LankaInfra.pdf',
        documentType: 'Contract',
        fileType: 'application/pdf',
        fileData: SAMPLE_INVOICE_DATA,
        fileSizeKb: 1400,
        uploadedBy: 'BUDDIKA',
        uploadedAt: '2026-08-27 11:05'
      }
    ],
    approvals: [
      {
        id: 'app-48-1',
        paymentRequestId: 'prv-48',
        approvalLevel: 'ACCOUNTS_L1',
        approverId: 'acc-1',
        approverName: 'Kusal Mendis',
        approverRole: 'FINANCE',
        action: 'APPROVE',
        comment: 'Interim payment certificate checked with 5% retention deduction applied.',
        approvedAt: '2026-08-27 13:00'
      },
      {
        id: 'app-48-2',
        paymentRequestId: 'prv-48',
        approvalLevel: 'ACCOUNTS_L2',
        approverId: 'acc-2',
        approverName: 'Dilshan Silva',
        approverRole: 'FINANCE',
        action: 'APPROVE',
        comment: 'All QS measurement sheets verified against PIDM 26 contract BoQ item 4.02.',
        approvedAt: '2026-08-27 15:45'
      }
    ],
    auditTrail: [
      {
        id: 'aud-48-1',
        timestamp: '2026-08-27 11:15',
        user: 'BUDDIKA',
        role: 'SUPERVISOR',
        action: 'PRV Submitted',
        newStatus: 'SUBMITTED'
      },
      {
        id: 'aud-48-2',
        timestamp: '2026-08-27 13:00',
        user: 'Kusal Mendis',
        role: 'FINANCE',
        action: 'Accounts L1 Approved',
        newStatus: 'ACCOUNTS_L1_APPROVED'
      },
      {
        id: 'aud-48-3',
        timestamp: '2026-08-27 15:45',
        user: 'Dilshan Silva',
        role: 'FINANCE',
        action: 'Accounts L2 Approved',
        newStatus: 'ACCOUNTS_L2_APPROVED',
        comment: 'Forwarded to Managing Director for Owner final authorization'
      }
    ],
    createdAt: '2026-08-27 11:00:00',
    updatedAt: '2026-08-27 15:45:00'
  }
];

const PRVContext = createContext<PRVContextType | undefined>(undefined);

export const PRVProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addExpense } = usePettyCash();
  const { currentUser, currentRole, navigateToModule } = useEnterprise();

  const [paymentRequests, setPaymentRequests] = useState<PaymentRequestVoucher[]>(() => {
    try {
      const saved = localStorage.getItem('ema_prv_requests_v2');
      return saved ? JSON.parse(saved) : INITIAL_PRVS;
    } catch {
      return INITIAL_PRVS;
    }
  });

  const [activeSubTab, setActiveSubTab] = useState<PRVSubMenu>('vouchers');
  const [filters, setFilters] = useState<PRVFilterState>(defaultPRVFilters);

  // Modals state
  const [selectedPRV, setSelectedPRV] = useState<PaymentRequestVoucher | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isOwnerApprovalModalOpen, setIsOwnerApprovalModalOpen] = useState(false);
  const [targetPRVForAction, setTargetPRVForAction] = useState<PaymentRequestVoucher | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('ema_prv_requests_v2', JSON.stringify(paymentRequests));
  }, [paymentRequests]);

  const resetFilters = () => setFilters(defaultPRVFilters);

  // Extract all payment proofs from all PRVs
  const paymentProofs = useMemo<PaymentProofDocument[]>(() => {
    const proofs: PaymentProofDocument[] = [];
    paymentRequests.forEach(prv => {
      if (prv.transaction && prv.transaction.proofs) {
        prv.transaction.proofs.forEach(p => proofs.push(p));
      }
    });
    return proofs;
  }, [paymentRequests]);

  // Extract all payment transactions
  const paymentTransactions = useMemo<PaymentTransaction[]>(() => {
    const txns: PaymentTransaction[] = [];
    paymentRequests.forEach(prv => {
      if (prv.transaction) txns.push(prv.transaction);
    });
    return txns;
  }, [paymentRequests]);

  // Create new PRV
  const createPaymentRequest = (
    data: Omit<PaymentRequestVoucher, 'id' | 'prvNumber' | 'status' | 'approvals' | 'auditTrail' | 'createdAt' | 'updatedAt'>,
    submitImmediately: boolean = true
  ): PaymentRequestVoucher => {
    const year = new Date().getFullYear();
    const count = paymentRequests.length + 1;
    const prvNumber = `PRV-${year}-${String(count).padStart(5, '0')}`;
    const newId = `prv-${Date.now()}`;
    const timestamp = new Date().toLocaleString('en-GB');

    const status: PRVStatus = submitImmediately ? 'SUBMITTED' : 'DRAFT';

    const auditEntry: PRVAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp,
      user: currentUser,
      role: currentRole,
      action: submitImmediately ? 'PRV Submitted' : 'PRV Created',
      newStatus: status,
      comment: submitImmediately ? 'Submitted for Accounts Level 1 review' : 'Saved as draft'
    };

    const newPrv: PaymentRequestVoucher = {
      ...data,
      id: newId,
      prvNumber,
      status,
      approvals: [],
      auditTrail: [auditEntry],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setPaymentRequests(prev => [newPrv, ...prev]);
    return newPrv;
  };

  const updatePaymentRequest = (id: string, updates: Partial<PaymentRequestVoucher>) => {
    setPaymentRequests(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
    if (selectedPRV && selectedPRV.id === id) {
      setSelectedPRV(prev => (prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null));
    }
  };

  const deletePaymentRequest = (id: string) => {
    setPaymentRequests(prev => prev.filter(p => p.id !== id));
    if (selectedPRV && selectedPRV.id === id) {
      setSelectedPRV(null);
      setIsDetailModalOpen(false);
    }
  };

  const submitDraftRequest = (id: string) => {
    const timestamp = new Date().toLocaleString('en-GB');
    setPaymentRequests(prev =>
      prev.map(p => {
        if (p.id === id) {
          const audit: PRVAuditEntry = {
            id: `aud-${Date.now()}`,
            timestamp,
            user: currentUser,
            role: currentRole,
            action: 'PRV Submitted',
            prevStatus: 'DRAFT',
            newStatus: 'SUBMITTED',
            comment: 'Submitted for Accounts Level 1 review'
          };
          return {
            ...p,
            status: 'SUBMITTED',
            auditTrail: [audit, ...p.auditTrail],
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      })
    );
  };

  // Level 1 Accounts Approval
  const accountsL1Approve = (id: string, comment: string) => {
    const timestamp = new Date().toLocaleString('en-GB');
    setPaymentRequests(prev =>
      prev.map(p => {
        if (p.id === id) {
          const newApproval: PaymentApprovalRecord = {
            id: `app-l1-${Date.now()}`,
            paymentRequestId: id,
            approvalLevel: 'ACCOUNTS_L1',
            approverId: currentUser,
            approverName: currentUser,
            approverRole: currentRole,
            action: 'APPROVE',
            comment: comment || 'Verified by Accounts Level 1',
            approvedAt: timestamp
          };
          const audit: PRVAuditEntry = {
            id: `aud-${Date.now()}`,
            timestamp,
            user: currentUser,
            role: currentRole,
            action: 'Accounts L1 Approved',
            prevStatus: p.status,
            newStatus: 'ACCOUNTS_L1_APPROVED',
            comment
          };
          return {
            ...p,
            status: 'ACCOUNTS_L1_APPROVED',
            approvals: [...p.approvals, newApproval],
            auditTrail: [audit, ...p.auditTrail],
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      })
    );
  };

  const accountsL1Reject = (id: string, reason: string) => {
    const timestamp = new Date().toLocaleString('en-GB');
    setPaymentRequests(prev =>
      prev.map(p => {
        if (p.id === id) {
          const newApproval: PaymentApprovalRecord = {
            id: `app-l1-${Date.now()}`,
            paymentRequestId: id,
            approvalLevel: 'ACCOUNTS_L1',
            approverId: currentUser,
            approverName: currentUser,
            approverRole: currentRole,
            action: 'REJECT',
            comment: reason,
            approvedAt: timestamp
          };
          const audit: PRVAuditEntry = {
            id: `aud-${Date.now()}`,
            timestamp,
            user: currentUser,
            role: currentRole,
            action: 'Accounts L1 Rejected',
            prevStatus: p.status,
            newStatus: 'ACCOUNTS_L1_REJECTED',
            comment: reason
          };
          return {
            ...p,
            status: 'ACCOUNTS_L1_REJECTED',
            approvals: [...p.approvals, newApproval],
            auditTrail: [audit, ...p.auditTrail],
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      })
    );
  };

  const accountsL1Return = (id: string, reason: string) => {
    const timestamp = new Date().toLocaleString('en-GB');
    setPaymentRequests(prev =>
      prev.map(p => {
        if (p.id === id) {
          const newApproval: PaymentApprovalRecord = {
            id: `app-l1-${Date.now()}`,
            paymentRequestId: id,
            approvalLevel: 'ACCOUNTS_L1',
            approverId: currentUser,
            approverName: currentUser,
            approverRole: currentRole,
            action: 'RETURN',
            comment: reason,
            approvedAt: timestamp
          };
          const audit: PRVAuditEntry = {
            id: `aud-${Date.now()}`,
            timestamp,
            user: currentUser,
            role: currentRole,
            action: 'Accounts L1 Returned',
            prevStatus: p.status,
            newStatus: 'ACCOUNTS_L1_RETURNED',
            comment: `Returned for correction: ${reason}`
          };
          return {
            ...p,
            status: 'ACCOUNTS_L1_RETURNED',
            approvals: [...p.approvals, newApproval],
            auditTrail: [audit, ...p.auditTrail],
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      })
    );
  };

  // Level 2 Accounts Approval
  const accountsL2Approve = (id: string, comment: string) => {
    const timestamp = new Date().toLocaleString('en-GB');
    setPaymentRequests(prev =>
      prev.map(p => {
        if (p.id === id) {
          const newApproval: PaymentApprovalRecord = {
            id: `app-l2-${Date.now()}`,
            paymentRequestId: id,
            approvalLevel: 'ACCOUNTS_L2',
            approverId: currentUser,
            approverName: currentUser,
            approverRole: currentRole,
            action: 'APPROVE',
            comment: comment || 'Budget verified by Senior Finance (Level 2)',
            approvedAt: timestamp
          };
          const audit: PRVAuditEntry = {
            id: `aud-${Date.now()}`,
            timestamp,
            user: currentUser,
            role: currentRole,
            action: 'Accounts L2 Approved',
            prevStatus: p.status,
            newStatus: 'ACCOUNTS_L2_APPROVED',
            comment
          };
          return {
            ...p,
            status: 'ACCOUNTS_L2_APPROVED',
            approvals: [...p.approvals, newApproval],
            auditTrail: [audit, ...p.auditTrail],
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      })
    );
  };

  const accountsL2Reject = (id: string, reason: string) => {
    const timestamp = new Date().toLocaleString('en-GB');
    setPaymentRequests(prev =>
      prev.map(p => {
        if (p.id === id) {
          const newApproval: PaymentApprovalRecord = {
            id: `app-l2-${Date.now()}`,
            paymentRequestId: id,
            approvalLevel: 'ACCOUNTS_L2',
            approverId: currentUser,
            approverName: currentUser,
            approverRole: currentRole,
            action: 'REJECT',
            comment: reason,
            approvedAt: timestamp
          };
          const audit: PRVAuditEntry = {
            id: `aud-${Date.now()}`,
            timestamp,
            user: currentUser,
            role: currentRole,
            action: 'Accounts L2 Rejected',
            prevStatus: p.status,
            newStatus: 'ACCOUNTS_L2_REJECTED',
            comment: reason
          };
          return {
            ...p,
            status: 'ACCOUNTS_L2_REJECTED',
            approvals: [...p.approvals, newApproval],
            auditTrail: [audit, ...p.auditTrail],
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      })
    );
  };

  const accountsL2Return = (id: string, reason: string) => {
    const timestamp = new Date().toLocaleString('en-GB');
    setPaymentRequests(prev =>
      prev.map(p => {
        if (p.id === id) {
          const newApproval: PaymentApprovalRecord = {
            id: `app-l2-${Date.now()}`,
            paymentRequestId: id,
            approvalLevel: 'ACCOUNTS_L2',
            approverId: currentUser,
            approverName: currentUser,
            approverRole: currentRole,
            action: 'RETURN',
            comment: reason,
            approvedAt: timestamp
          };
          const audit: PRVAuditEntry = {
            id: `aud-${Date.now()}`,
            timestamp,
            user: currentUser,
            role: currentRole,
            action: 'Accounts L2 Returned',
            prevStatus: p.status,
            newStatus: 'ACCOUNTS_L2_RETURNED',
            comment: `Returned for correction: ${reason}`
          };
          return {
            ...p,
            status: 'ACCOUNTS_L2_RETURNED',
            approvals: [...p.approvals, newApproval],
            auditTrail: [audit, ...p.auditTrail],
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      })
    );
  };

  // Owner Final Payment Approval
  const ownerApprove = (id: string, comment: string) => {
    const timestamp = new Date().toLocaleString('en-GB');
    setPaymentRequests(prev =>
      prev.map(p => {
        if (p.id === id) {
          const newApproval: PaymentApprovalRecord = {
            id: `app-owner-${Date.now()}`,
            paymentRequestId: id,
            approvalLevel: 'OWNER',
            approverId: currentUser,
            approverName: currentUser,
            approverRole: 'OWNER',
            action: 'APPROVE',
            comment: comment || 'Authorized payment release by Owner',
            approvedAt: timestamp,
            deviceInfo: navigator.userAgent
          };
          const audit: PRVAuditEntry = {
            id: `aud-${Date.now()}`,
            timestamp,
            user: currentUser,
            role: 'OWNER',
            action: 'Owner Approved',
            prevStatus: p.status,
            newStatus: 'OWNER_APPROVED',
            comment: `Owner authorization granted: ${comment || 'Payment authorized'}. Payment proof required.`
          };
          return {
            ...p,
            status: 'OWNER_APPROVED',
            approvals: [...p.approvals, newApproval],
            auditTrail: [audit, ...p.auditTrail],
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      })
    );
  };

  const ownerReject = (id: string, reason: string) => {
    const timestamp = new Date().toLocaleString('en-GB');
    setPaymentRequests(prev =>
      prev.map(p => {
        if (p.id === id) {
          const newApproval: PaymentApprovalRecord = {
            id: `app-owner-${Date.now()}`,
            paymentRequestId: id,
            approvalLevel: 'OWNER',
            approverId: currentUser,
            approverName: currentUser,
            approverRole: 'OWNER',
            action: 'REJECT',
            comment: reason,
            approvedAt: timestamp
          };
          const audit: PRVAuditEntry = {
            id: `aud-${Date.now()}`,
            timestamp,
            user: currentUser,
            role: 'OWNER',
            action: 'Owner Rejected',
            prevStatus: p.status,
            newStatus: 'OWNER_REJECTED',
            comment: reason
          };
          return {
            ...p,
            status: 'OWNER_REJECTED',
            approvals: [...p.approvals, newApproval],
            auditTrail: [audit, ...p.auditTrail],
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      })
    );
  };

  const ownerReturn = (id: string, reason: string) => {
    const timestamp = new Date().toLocaleString('en-GB');
    setPaymentRequests(prev =>
      prev.map(p => {
        if (p.id === id) {
          const newApproval: PaymentApprovalRecord = {
            id: `app-owner-${Date.now()}`,
            paymentRequestId: id,
            approvalLevel: 'OWNER',
            approverId: currentUser,
            approverName: currentUser,
            approverRole: 'OWNER',
            action: 'RETURN',
            comment: reason,
            approvedAt: timestamp
          };
          const audit: PRVAuditEntry = {
            id: `aud-${Date.now()}`,
            timestamp,
            user: currentUser,
            role: 'OWNER',
            action: 'Owner Returned',
            prevStatus: p.status,
            newStatus: 'OWNER_RETURNED',
            comment: `Returned for clarification: ${reason}`
          };
          return {
            ...p,
            status: 'OWNER_RETURNED',
            approvals: [...p.approvals, newApproval],
            auditTrail: [audit, ...p.auditTrail],
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      })
    );
  };

  // Complete Payment & Automatically Post to Project Expense
  const completePaymentWithProof = (
    prvId: string,
    proofData: {
      documentType: PaymentProofDocument['documentType'];
      file: string;
      fileName: string;
      fileType: string;
      capturedMethod: 'CAMERA_SCAN' | 'UPLOAD';
      notes?: string;
      pagesCount?: number;
    },
    transactionMeta: {
      paymentDate: string;
      paymentReference: string;
      paymentMethod: PRVPaymentMethod | string;
      paymentSource: PaymentSource | string;
      bankAccount: string;
    }
  ) => {
    const targetPrv = paymentRequests.find(p => p.id === prvId);
    if (!targetPrv) return;

    const timestamp = new Date().toLocaleString('en-GB');
    const txnId = `txn-${Date.now()}`;
    const proofNumber = `${targetPrv.prvNumber}-PAYMENT-PROOF-${String(proofData.pagesCount || 1).padStart(2, '0')}`;

    const newProof: PaymentProofDocument = {
      id: `prf-${Date.now()}`,
      proofNumber,
      paymentRequestId: prvId,
      paymentTransactionId: txnId,
      prvNumber: targetPrv.prvNumber,
      paymentDate: transactionMeta.paymentDate,
      paymentAmount: targetPrv.totalAmount,
      currency: targetPrv.currency,
      paymentReference: transactionMeta.paymentReference,
      paymentMethod: transactionMeta.paymentMethod,
      paymentSource: transactionMeta.paymentSource,
      bankAccount: transactionMeta.bankAccount,
      documentType: proofData.documentType,
      file: proofData.file,
      fileName: proofData.fileName,
      fileType: proofData.fileType,
      capturedMethod: proofData.capturedMethod,
      capturedBy: currentUser,
      capturedAt: timestamp,
      notes: proofData.notes,
      pagesCount: proofData.pagesCount || 1
    };

    const newTransaction: PaymentTransaction = {
      id: txnId,
      paymentRequestId: prvId,
      prvNumber: targetPrv.prvNumber,
      paymentDate: transactionMeta.paymentDate,
      paymentMethod: transactionMeta.paymentMethod,
      paymentSource: transactionMeta.paymentSource,
      bankAccount: transactionMeta.bankAccount,
      paymentReference: transactionMeta.paymentReference,
      amount: targetPrv.totalAmount,
      currency: targetPrv.currency,
      status: 'COMPLETED',
      paidBy: currentUser,
      completedAt: timestamp,
      proofs: [newProof]
    };

    // CRITICAL REQUIREMENT 13: Automatically create Project Expense in PettyCashContext!
    const createdExpense = addExpense({
      DATE_REF: transactionMeta.paymentDate,
      DATE: new Date(transactionMeta.paymentDate).toLocaleDateString('en-GB'),
      SUPERVISOR: targetPrv.requestedBy,
      PROJECT: targetPrv.projectCode,
      EXPENSES_CATEGORY: targetPrv.expenseCategory,
      TRANSACTION_TYPE: transactionMeta.paymentSource === 'Petty Cash' ? 'PETTY_CASH_EXPENSE' : 'COMPANY_EXPENSE',
      AMOUNT: targetPrv.totalAmount,
      EXPENSES_DESCRIPTION: `[${targetPrv.prvNumber}] ${targetPrv.purpose} - ${targetPrv.description}`,
      PAYMENT_STATUS: 'Paid',
      PROOF_DOCUMENT: proofData.file,
      PROOF_DOCUMENT_NAME: proofData.fileName,
      CREATED_BY: targetPrv.requestedBy,
      APPROVED_BY: currentUser,
      APPROVED_DATE: timestamp,
      REMARKS: `Auto-posted from ${targetPrv.prvNumber} (${transactionMeta.paymentSource} Ref: ${transactionMeta.paymentReference})`,
      
      // Extended fields
      PRV_NUMBER: targetPrv.prvNumber,
      PAYMENT_REQUEST_ID: prvId,
      PAYMENT_TRANSACTION_ID: txnId,
      PAYMENT_SOURCE: String(transactionMeta.paymentSource),
      BANK_ACCOUNT: transactionMeta.bankAccount,
      PAYMENT_REFERENCE: transactionMeta.paymentReference,
      PAID_BY: currentUser,
      CURRENCY: targetPrv.currency,
      PAYEE: targetPrv.payeeName
    });

    // Update Transaction with created expense ID
    newTransaction.linkedExpenseId = createdExpense.id;

    // Audit logs
    const proofAudit: PRVAuditEntry = {
      id: `aud-proof-${Date.now()}`,
      timestamp,
      user: currentUser,
      role: currentRole,
      action: 'Payment Proof Uploaded',
      prevStatus: targetPrv.status,
      newStatus: 'PAID',
      comment: `Proof document (${proofData.documentType}) captured via ${proofData.capturedMethod}. Ref: ${transactionMeta.paymentReference}`
    };

    const expenseAudit: PRVAuditEntry = {
      id: `aud-exp-${Date.now()}`,
      timestamp,
      user: 'System Engine',
      role: 'ADMIN',
      action: 'Project Expense Created',
      prevStatus: 'PAID',
      newStatus: 'PAID',
      details: `Created Project Expense ${createdExpense.EXPENSES_ID} for ${targetPrv.projectCode} (Category: ${targetPrv.expenseCategory}, Amount: ${targetPrv.currency} ${targetPrv.totalAmount.toLocaleString()})`
    };

    // Update PRV Record
    setPaymentRequests(prev =>
      prev.map(p => {
        if (p.id === prvId) {
          return {
            ...p,
            status: 'PAID',
            paymentReference: transactionMeta.paymentReference,
            paymentSource: transactionMeta.paymentSource as PaymentSource,
            transaction: newTransaction,
            linkedExpenseId: createdExpense.id,
            auditTrail: [expenseAudit, proofAudit, ...p.auditTrail],
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      })
    );

    if (selectedPRV && selectedPRV.id === prvId) {
      setSelectedPRV(prev => (prev ? {
        ...prev,
        status: 'PAID',
        paymentReference: transactionMeta.paymentReference,
        paymentSource: transactionMeta.paymentSource as PaymentSource,
        transaction: newTransaction,
        linkedExpenseId: createdExpense.id,
        auditTrail: [expenseAudit, proofAudit, ...prev.auditTrail],
        updatedAt: new Date().toISOString()
      } : null));
    }
  };

  const openPRVByNumber = (prvNumber: string) => {
    const found = paymentRequests.find(p => p.prvNumber.trim().toUpperCase() === prvNumber.trim().toUpperCase());
    if (found) {
      setSelectedPRV(found);
      setIsDetailModalOpen(true);
    }
  };

  const openPRVById = (id: string) => {
    const found = paymentRequests.find(p => p.id === id);
    if (found) {
      setSelectedPRV(found);
      setIsDetailModalOpen(true);
    }
  };

  const openProofScannerForPRV = (prv: PaymentRequestVoucher) => {
    setTargetPRVForAction(prv);
    setIsScannerModalOpen(true);
  };

  const openOwnerApprovalForPRV = (prv: PaymentRequestVoucher) => {
    setTargetPRVForAction(prv);
    setIsOwnerApprovalModalOpen(true);
  };

  // Filtered list
  const filteredRequests = useMemo(() => {
    return paymentRequests.filter(p => {
      // Search
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const match =
          p.prvNumber.toLowerCase().includes(q) ||
          p.purpose.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.payeeName.toLowerCase().includes(q) ||
          p.projectCode.toLowerCase().includes(q) ||
          p.expenseCategory.toLowerCase().includes(q) ||
          p.requestedBy.toLowerCase().includes(q) ||
          (p.paymentReference && p.paymentReference.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Project
      if (filters.project !== 'ALL' && p.projectCode !== filters.project) {
        return false;
      }

      // Requested By
      if (filters.requestedBy !== 'ALL' && p.requestedBy.toUpperCase() !== filters.requestedBy.toUpperCase()) {
        return false;
      }

      // Status
      if (filters.status !== 'ALL' && p.status !== filters.status) {
        return false;
      }

      // Priority
      if (filters.priority !== 'ALL' && p.priority !== filters.priority) {
        return false;
      }

      // Payment Method
      if (filters.paymentMethod !== 'ALL' && p.paymentMethod !== filters.paymentMethod) {
        return false;
      }

      // Payment Source
      if (filters.paymentSource !== 'ALL' && p.paymentSource !== filters.paymentSource) {
        return false;
      }

      // Expense Category
      if (filters.expenseCategory !== 'ALL' && p.expenseCategory !== filters.expenseCategory) {
        return false;
      }

      // Date Range
      if (filters.dateFrom && p.requestDate < filters.dateFrom) return false;
      if (filters.dateTo && p.requestDate > filters.dateTo) return false;

      // Approval Level Filter
      if (filters.approvalLevel !== 'ALL') {
        if (filters.approvalLevel === 'L1' && p.status !== 'SUBMITTED') return false;
        if (filters.approvalLevel === 'L2' && p.status !== 'ACCOUNTS_L1_APPROVED') return false;
        if (filters.approvalLevel === 'OWNER' && p.status !== 'ACCOUNTS_L2_APPROVED') return false;
        if (filters.approvalLevel === 'PROOF_PENDING' && p.status !== 'OWNER_APPROVED') return false;
      }

      return true;
    }).sort((a, b) => {
      const order = filters.sortOrder === 'asc' ? 1 : -1;
      if (filters.sortBy === 'amount') return (a.totalAmount - b.totalAmount) * order;
      if (filters.sortBy === 'project') return a.projectCode.localeCompare(b.projectCode) * order;
      if (filters.sortBy === 'status') return a.status.localeCompare(b.status) * order;
      return a.requestDate.localeCompare(b.requestDate) * order;
    });
  }, [paymentRequests, filters]);

  // Computed metrics
  const metrics = useMemo(() => {
    let totalAmountRequested = 0;
    let totalAmountPaid = 0;
    let totalAmountPending = 0;
    let paidThisMonthAmount = 0;

    let myRequestsCount = 0;
    let pendingAccountsL1Count = 0;
    let pendingAccountsL2Count = 0;
    let pendingOwnerCount = 0;
    let pendingProofCount = 0;
    let paidCount = 0;

    const currentMonth = new Date().toISOString().slice(0, 7);

    paymentRequests.forEach(p => {
      totalAmountRequested += p.totalAmount;

      if (p.requestedBy.trim().toUpperCase() === currentUser.trim().toUpperCase()) {
        myRequestsCount++;
      }

      if (p.status === 'SUBMITTED') pendingAccountsL1Count++;
      if (p.status === 'ACCOUNTS_L1_APPROVED') pendingAccountsL2Count++;
      if (p.status === 'ACCOUNTS_L2_APPROVED') pendingOwnerCount++;
      if (p.status === 'OWNER_APPROVED') pendingProofCount++;

      if (p.status === 'PAID') {
        paidCount++;
        totalAmountPaid += p.totalAmount;
        if (p.requestDate.startsWith(currentMonth) || (p.transaction && p.transaction.paymentDate.startsWith(currentMonth))) {
          paidThisMonthAmount += p.totalAmount;
        }
      } else if (p.status !== 'CANCELLED' && !p.status.includes('REJECTED')) {
        totalAmountPending += p.totalAmount;
      }
    });

    return {
      totalRequests: paymentRequests.length,
      myRequestsCount,
      pendingAccountsL1Count,
      pendingAccountsL2Count,
      pendingOwnerCount,
      pendingProofCount,
      paidCount,
      totalAmountRequested,
      totalAmountPaid,
      totalAmountPending,
      paidThisMonthAmount
    };
  }, [paymentRequests, currentUser]);

  const clearAllPRVHistory = () => {
    setPaymentRequests([]);
    setSelectedPRV(null);
  };

  const resetPRVsToDefault = () => {
    setPaymentRequests(INITIAL_PRVS);
    setSelectedPRV(null);
  };

  return (
    <PRVContext.Provider
      value={{
        paymentRequests,
        paymentProofs,
        paymentTransactions,
        activeSubTab,
        setActiveSubTab,
        filters,
        setFilters,
        resetFilters,
        selectedPRV,
        setSelectedPRV,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isDetailModalOpen,
        setIsDetailModalOpen,
        isScannerModalOpen,
        setIsScannerModalOpen,
        isOwnerApprovalModalOpen,
        setIsOwnerApprovalModalOpen,
        targetPRVForAction,
        setTargetPRVForAction,
        createPaymentRequest,
        updatePaymentRequest,
        deletePaymentRequest,
        submitDraftRequest,
        accountsL1Approve,
        accountsL1Reject,
        accountsL1Return,
        accountsL2Approve,
        accountsL2Reject,
        accountsL2Return,
        ownerApprove,
        ownerReject,
        ownerReturn,
        completePaymentWithProof,
        openPRVByNumber,
        openPRVById,
        openProofScannerForPRV,
        openOwnerApprovalForPRV,
        clearAllPRVHistory,
        resetPRVsToDefault,
        metrics,
        filteredRequests
      }}
    >
      {children}
    </PRVContext.Provider>
  );
};

export const usePRV = (): PRVContextType => {
  const context = useContext(PRVContext);
  if (!context) {
    throw new Error('usePRV must be used within a PRVProvider');
  }
  return context;
};
