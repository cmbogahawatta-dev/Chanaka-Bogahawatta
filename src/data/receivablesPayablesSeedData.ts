import { ReceivableInvoice, PayableBill } from '../types/receivablesPayablesTypes';

export const INITIAL_RECEIVABLE_INVOICES: ReceivableInvoice[] = [
  {
    id: 'rec-001',
    invoiceNumber: 'INV-2026-0041',
    invoiceDate: '2026-07-15',
    dueDate: '2026-08-15',
    amount: 12000000,
    paid: 4000000,
    outstanding: 8000000,
    overdueDays: 28,
    client: 'Road Development Authority (RDA)',
    project: 'PIDM 26 - Central Expressway Sec 2',
    status: 'OVERDUE',
    workOrderOrContract: 'RDA/EX/2025/C2-014',
    linkedTaxInvoiceId: 'inv-001',
    sourceModule: 'PROJECT_INCOME',
    paymentHistory: [
      {
        id: 'rec-pay-01',
        date: '2026-08-01',
        amount: 4000000,
        referenceNumber: 'RDA-EFT-99120',
        paymentMethod: 'BANK_TRANSFER',
        bankAccount: 'BOC Commercial Main #8821039',
        notes: 'Interim Payment Certificate IPC-04 Advance Part Settlement',
        recordedBy: 'Accounts Receivable Lead',
        recordedAt: '2026-08-01T10:30:00Z'
      }
    ],
    notes: 'Interim claim for culvert and bridge foundation works.',
    createdAt: '2026-07-15T08:00:00Z',
    updatedAt: '2026-08-01T10:30:00Z'
  },
  {
    id: 'rec-002',
    invoiceNumber: 'INV-2026-0058',
    invoiceDate: '2026-07-28',
    dueDate: '2026-08-28',
    amount: 9500000,
    paid: 3500000,
    outstanding: 6000000,
    overdueDays: 15,
    client: 'Access Engineering PLC',
    project: 'Peliyagoda Logistics Park Zone B',
    status: 'OVERDUE',
    workOrderOrContract: 'AEL/PLP/SUB/2026-10',
    paymentHistory: [
      {
        id: 'rec-pay-02',
        date: '2026-08-20',
        amount: 3500000,
        referenceNumber: 'CHQ-AEL-40192',
        paymentMethod: 'CHEQUE',
        bankAccount: 'Commercial Bank Corporate #10029381',
        notes: 'Part payment cleared via Commercial Bank',
        recordedBy: 'Finance Executive',
        recordedAt: '2026-08-20T14:15:00Z'
      }
    ],
    notes: 'Heavy warehouse portal frame erection and roofing claim.',
    createdAt: '2026-07-28T09:00:00Z',
    updatedAt: '2026-08-20T14:15:00Z'
  },
  {
    id: 'rec-003',
    invoiceNumber: 'INV-2026-0064',
    invoiceDate: '2026-08-05',
    dueDate: '2026-09-05',
    amount: 5400000,
    paid: 1000000,
    outstanding: 4400000,
    overdueDays: 7,
    client: 'Urban Development Authority (UDA)',
    project: 'Kandy Municipal Storm Drainage',
    status: 'OVERDUE',
    workOrderOrContract: 'UDA/KMC/DRN-004',
    paymentHistory: [
      {
        id: 'rec-pay-03',
        date: '2026-08-30',
        amount: 1000000,
        referenceNumber: 'SL-GOV-UDA-7718',
        paymentMethod: 'BANK_TRANSFER',
        bankAccount: 'People\'s Bank Treasury #701192',
        notes: 'Initial milestone release',
        recordedBy: 'Senior Accountant',
        recordedAt: '2026-08-30T11:00:00Z'
      }
    ],
    notes: 'Precast stormwater box culvert placement claim.',
    createdAt: '2026-08-05T10:00:00Z',
    updatedAt: '2026-08-30T11:00:00Z'
  },
  {
    id: 'rec-004',
    invoiceNumber: 'INV-2026-0072',
    invoiceDate: '2026-08-20',
    dueDate: '2026-09-20',
    amount: 5000000,
    paid: 1000000,
    outstanding: 4000000,
    overdueDays: -8,
    client: 'Sri Lanka Ports Authority (SLPA)',
    project: 'Port City Elevated Access Corridor',
    status: 'CURRENT',
    workOrderOrContract: 'SLPA/PCE/2026-99',
    paymentHistory: [
      {
        id: 'rec-pay-04',
        date: '2026-09-02',
        amount: 1000000,
        referenceNumber: 'SLPA-TFR-8812',
        paymentMethod: 'BANK_TRANSFER',
        bankAccount: 'BOC Commercial Main #8821039',
        notes: 'Mobilization & testing advance deduction credit',
        recordedBy: 'Commercial Manager',
        recordedAt: '2026-09-02T16:00:00Z'
      }
    ],
    notes: 'Viaduct pier piling test loading certification.',
    createdAt: '2026-08-20T11:30:00Z',
    updatedAt: '2026-09-02T16:00:00Z'
  },
  {
    id: 'rec-005',
    invoiceNumber: 'INV-2026-0079',
    invoiceDate: '2026-08-31',
    dueDate: '2026-09-30',
    amount: 6000000,
    paid: 3000000,
    outstanding: 3000000,
    overdueDays: -18,
    client: 'Ministry of Megapolis & Western Dev',
    project: 'Battaramulla Administrative Complex',
    status: 'CURRENT',
    workOrderOrContract: 'MMWD/BAC/BLD-02',
    paymentHistory: [
      {
        id: 'rec-pay-05',
        date: '2026-09-08',
        amount: 3000000,
        referenceNumber: 'CASH-DEP-SL-991',
        paymentMethod: 'BANK_TRANSFER',
        bankAccount: 'Commercial Bank Corporate #10029381',
        notes: '50% progress payment approved by consultant',
        recordedBy: 'Finance Executive',
        recordedAt: '2026-09-08T09:45:00Z'
      }
    ],
    notes: 'Reinforced concrete basement slab & retaining walls.',
    createdAt: '2026-08-31T09:00:00Z',
    updatedAt: '2026-09-08T09:45:00Z'
  }
];

export const INITIAL_PAYABLE_BILLS: PayableBill[] = [
  {
    id: 'pay-001',
    supplier: 'Tokyo Super Cement (Pvt) Ltd',
    supplierId: 'sup-002',
    poNumber: 'PO-2026-0038',
    grnNumber: 'GRN-2026-0041',
    invoiceNumber: 'TK-INV-8910',
    billDate: '2026-07-25',
    dueDate: '2026-08-25',
    amount: 8500000,
    paid: 3500000,
    outstanding: 5000000,
    overdueDays: 18,
    project: 'PIDM 26 - Central Expressway Sec 2',
    status: 'OVERDUE',
    linkedSupplierInvoiceId: 'inv-sup-01',
    linkedProcurementOrderId: 'PO-2026-0038',
    linkedGrnId: 'GRN-2026-0041',
    linkedPrvId: 'prv-45',
    prvNumber: 'PRV-2026-00045',
    prvStatus: 'OWNER_APPROVED',
    sourceModule: 'PROCUREMENT',
    paymentHistory: [
      {
        id: 'pay-disb-01',
        date: '2026-08-15',
        amount: 3500000,
        referenceNumber: 'PRV-2026-0881',
        paymentMethod: 'BANK_TRANSFER',
        bankAccount: 'BOC Commercial Main #8821039',
        notes: 'PRV approved payment for 700 Bags Portland Cement bulk supply',
        recordedBy: 'Accounts Payable Lead',
        recordedAt: '2026-08-15T15:30:00Z'
      }
    ],
    notes: 'Bulk OPC cement deliveries to central batching plant.',
    createdAt: '2026-07-25T11:00:00Z',
    updatedAt: '2026-08-15T15:30:00Z'
  },
  {
    id: 'pay-002',
    supplier: 'Melwa Steel Rolling Mills Ltd',
    supplierId: 'sup-003',
    poNumber: 'PO-2026-0044',
    grnNumber: 'GRN-2026-0045',
    invoiceNumber: 'MLW-90214',
    billDate: '2026-08-02',
    dueDate: '2026-09-02',
    amount: 6800000,
    paid: 2300000,
    outstanding: 4500000,
    overdueDays: 10,
    project: 'PIDM 26 - Central Expressway Sec 2',
    status: 'OVERDUE',
    linkedSupplierInvoiceId: 'inv-sup-02',
    linkedProcurementOrderId: 'PO-2026-0044',
    linkedGrnId: 'GRN-2026-0045',
    linkedPrvId: 'prv-44',
    prvNumber: 'PRV-2026-00044',
    prvStatus: 'SUBMITTED',
    sourceModule: 'PROCUREMENT',
    paymentHistory: [
      {
        id: 'pay-disb-02',
        date: '2026-08-25',
        amount: 2300000,
        referenceNumber: 'PRV-2026-0894',
        paymentMethod: 'BANK_TRANSFER',
        bankAccount: 'Commercial Bank Corporate #10029381',
        notes: 'First milestone tranche released for TMT 16mm & 25mm rebar',
        recordedBy: 'Senior Disbursement Officer',
        recordedAt: '2026-08-25T14:00:00Z'
      }
    ],
    notes: 'SLS 375 High yield deformed rebar with mill test certs.',
    createdAt: '2026-08-02T10:00:00Z',
    updatedAt: '2026-08-25T14:00:00Z'
  },
  {
    id: 'pay-003',
    supplier: 'Lanka ReadyMix (Pvt) Ltd',
    supplierId: 'sup-001',
    poNumber: 'PO-2026-0052',
    grnNumber: 'GRN-2026-0056',
    invoiceNumber: 'LRM-4402',
    billDate: '2026-08-18',
    dueDate: '2026-09-18',
    amount: 4200000,
    paid: 1000000,
    outstanding: 3200000,
    overdueDays: -6,
    project: 'Peliyagoda Logistics Park Zone B',
    status: 'DUE_SOON',
    paymentHistory: [
      {
        id: 'pay-disb-03',
        date: '2026-08-31',
        amount: 1000000,
        referenceNumber: 'PRV-2026-0912',
        paymentMethod: 'CHEQUE',
        bankAccount: 'BOC Commercial Main #8821039',
        notes: 'Cheque issued for 120m3 G30 pump concrete pouring',
        recordedBy: 'Finance Executive',
        recordedAt: '2026-08-31T12:00:00Z'
      }
    ],
    notes: 'Grade 30 pumpable mix for warehouse flooring slabs.',
    createdAt: '2026-08-18T14:00:00Z',
    updatedAt: '2026-08-31T12:00:00Z'
  },
  {
    id: 'pay-004',
    supplier: 'Access Precast Concrete Elements',
    supplierId: 'sup-004',
    poNumber: 'PO-2026-0061',
    grnNumber: 'GRN-2026-0063',
    invoiceNumber: 'APC-8812',
    billDate: '2026-08-28',
    dueDate: '2026-09-28',
    amount: 3600000,
    paid: 1000000,
    outstanding: 2600000,
    overdueDays: -16,
    project: 'Kandy Municipal Storm Drainage',
    status: 'CURRENT',
    paymentHistory: [
      {
        id: 'pay-disb-04',
        date: '2026-09-05',
        amount: 1000000,
        referenceNumber: 'PRV-2026-0925',
        paymentMethod: 'BANK_TRANSFER',
        bankAccount: 'Commercial Bank Corporate #10029381',
        notes: 'Partial settlement for 1.8m x 1.5m U-drains & cover slabs',
        recordedBy: 'Accounts Payable Lead',
        recordedAt: '2026-09-05T10:30:00Z'
      }
    ],
    notes: 'Heavy duty precast concrete drainage channel components.',
    createdAt: '2026-08-28T09:30:00Z',
    updatedAt: '2026-09-05T10:30:00Z'
  },
  {
    id: 'pay-005',
    supplier: 'Kelani Cables PLC',
    supplierId: 'sup-005',
    poNumber: 'PO-2026-0067',
    grnNumber: 'GRN-2026-0070',
    invoiceNumber: 'KC-INV-1109',
    billDate: '2026-09-05',
    dueDate: '2026-10-05',
    amount: 3000000,
    paid: 500000,
    outstanding: 2500000,
    overdueDays: -23,
    project: 'Port City Elevated Access Corridor',
    status: 'CURRENT',
    paymentHistory: [
      {
        id: 'pay-disb-05',
        date: '2026-09-10',
        amount: 500000,
        referenceNumber: 'PRV-2026-0938',
        paymentMethod: 'BANK_TRANSFER',
        bankAccount: 'BOC Commercial Main #8821039',
        notes: 'Downpayment for 4-core 70mm armoured lighting feeder cable',
        recordedBy: 'Disbursement Officer',
        recordedAt: '2026-09-10T16:45:00Z'
      }
    ],
    notes: 'Substation to viaduct lighting circuits and distribution feeder.',
    createdAt: '2026-09-05T15:00:00Z',
    updatedAt: '2026-09-10T16:45:00Z'
  }
];
