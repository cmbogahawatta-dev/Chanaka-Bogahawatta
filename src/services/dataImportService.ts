/**
 * EMA Enterprise Corporate Suite - Data Import & Migration Service
 * Handles Excel/CSV parsing, column mapping, multi-level validation,
 * template generation, and transaction batch operations.
 */

import * as XLSX from 'xlsx';
import {
  Expense,
  Project,
  Supervisor,
  Income,
  ExpenseCategory,
  ImportType,
  ImportErrorDetail,
  ImportBatchRecord,
  DuplicateAction
} from '../types/pettyCashTypes';

export type { DuplicateAction };

export interface FieldDefinition {
  key: string;
  label: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'boolean';
  description: string;
  aliases: string[];
  example: string;
}

export const EXPENSE_FIELDS: FieldDefinition[] = [
  {
    key: 'EXPENSES_ID',
    label: 'Expense ID / Reference',
    required: false,
    type: 'string',
    description: 'Unique historical voucher or expense code (auto-generated if omitted)',
    aliases: ['expense id', 'expenses_id', 'exp id', 'ref no', 'reference', 'voucher no', 'voucher number', 'id', 'trans id', 'transaction id', 'doc no'],
    example: 'EXP-2024-0891'
  },
  {
    key: 'DATE',
    label: 'Expense Date',
    required: true,
    type: 'date',
    description: 'Transaction date (YYYY-MM-DD or DD/MM/YYYY)',
    aliases: ['date', 'expense date', 'txn date', 'transaction date', 'voucher date', 'bill date', 'paid date'],
    example: '15/04/2024'
  },
  {
    key: 'SUPERVISOR',
    label: 'Supervisor Name / ID',
    required: true,
    type: 'string',
    description: 'Site supervisor responsible for cash disbursement',
    aliases: ['supervisor', 'supervisor name', 'sup', 'in charge', 'site supervisor', 'cashier', 'custodian', 'employee', 'requested by', 'paid to'],
    example: 'BUDDIKA'
  },
  {
    key: 'PROJECT',
    label: 'Project Code / Name',
    required: true,
    type: 'string',
    description: 'Project code (e.g. PIDM 26, HAVELOCK)',
    aliases: ['project', 'project code', 'project name', 'job code', 'site', 'location', 'cost center', 'wbs'],
    example: 'PIDM 26'
  },
  {
    key: 'EXPENSES_CATEGORY',
    label: 'Expense Category / GL Code',
    required: true,
    type: 'string',
    description: 'Account GL or budget category',
    aliases: ['category', 'expense category', 'expenses_category', 'gl category', 'cost code', 'account', 'type', 'head of account'],
    example: '5000 Construction Materials'
  },
  {
    key: 'EXPENSES_DESCRIPTION',
    label: 'Description / Purpose',
    required: true,
    type: 'string',
    description: 'Detail of items or service purchased',
    aliases: ['description', 'expenses_description', 'particulars', 'item description', 'details', 'purpose', 'narrative', 'remark'],
    example: 'Urgent cement and sand purchase for slab cast'
  },
  {
    key: 'AMOUNT',
    label: 'Amount (LKR / Currency)',
    required: true,
    type: 'number',
    description: 'Total transaction amount',
    aliases: ['amount', 'total', 'cost', 'value', 'lkr', 'total amount', 'net amount', 'paid amount', 'sum'],
    example: '45000'
  },
  {
    key: 'PAYMENT_SOURCE',
    label: 'Payment Source',
    required: false,
    type: 'string',
    description: 'Disbursement method (Petty Cash, Bank Transfer, Cheque, etc.)',
    aliases: ['payment source', 'source', 'payment mode', 'mode of payment', 'bank account', 'method', 'paid from', 'channel'],
    example: 'Petty Cash'
  },
  {
    key: 'PRV_NUMBER',
    label: 'Voucher / PRV Number',
    required: false,
    type: 'string',
    description: 'Physical voucher reference or PRV slip number',
    aliases: ['voucher no', 'voucher number', 'prv number', 'prv_number', 'prv no', 'pv no', 'bill no', 'receipt no', 'invoice no'],
    example: 'PRV-2024-00124'
  },
  {
    key: 'PAYMENT_STATUS',
    label: 'Payment Status',
    required: false,
    type: 'string',
    description: 'Status (Approved, Paid, Reimbursed, Pending)',
    aliases: ['status', 'payment status', 'approval status', 'state', 'condition'],
    example: 'Approved'
  },
  {
    key: 'REMARKS',
    label: 'Remarks / Notes',
    required: false,
    type: 'string',
    description: 'Additional historical notes or audit annotations',
    aliases: ['remarks', 'notes', 'comments', 'additional info', 'memo'],
    example: 'Migrated from previous Excel logbook'
  }
];

export const PROJECT_FIELDS: FieldDefinition[] = [
  {
    key: 'PROJECT_CODE',
    label: 'Project Code',
    required: true,
    type: 'string',
    description: 'Unique project code identifier (e.g. PIDM 26)',
    aliases: ['project code', 'project id', 'code', 'job code', 'prj code', 'site code', 'project_code'],
    example: 'PIDM 26'
  },
  {
    key: 'PROJECT_NAME',
    label: 'Project Name',
    required: true,
    type: 'string',
    description: 'Full project title',
    aliases: ['project name', 'project', 'title', 'project title', 'name', 'contract name'],
    example: 'PIDM Residencies High Rise Phase 2'
  },
  {
    key: 'CLIENT',
    label: 'Client Name',
    required: false,
    type: 'string',
    description: 'Employer / Client organization',
    aliases: ['client', 'client name', 'employer', 'customer', 'owner'],
    example: 'Prime Lands Residencies'
  },
  {
    key: 'LOCATION',
    label: 'Location / Site Address',
    required: false,
    type: 'string',
    description: 'Geographic location or city',
    aliases: ['location', 'site', 'address', 'city', 'region'],
    example: 'Colombo 07'
  },
  {
    key: 'CONTRACT_VALUE',
    label: 'Contract Value (LKR)',
    required: false,
    type: 'number',
    description: 'Total contract budget or award value',
    aliases: ['contract value', 'value', 'budget', 'contract amount', 'total contract value'],
    example: '250000000'
  },
  {
    key: 'START_DATE',
    label: 'Start Date',
    required: false,
    type: 'date',
    description: 'Commencement date (YYYY-MM-DD)',
    aliases: ['start date', 'commencement date', 'started', 'commenced'],
    example: '2024-01-15'
  },
  {
    key: 'END_DATE',
    label: 'Completion Date',
    required: false,
    type: 'date',
    description: 'Target or revised completion date',
    aliases: ['end date', 'completion date', 'handover date', 'finish date', 'target date'],
    example: '2025-12-31'
  },
  {
    key: 'STATUS',
    label: 'Project Status',
    required: false,
    type: 'string',
    description: 'Active, On Hold, Completed, or Closed',
    aliases: ['status', 'project status', 'state', 'stage'],
    example: 'Active'
  },
  {
    key: 'PROJECT_MANAGER',
    label: 'Project Manager / Consultant',
    required: false,
    type: 'string',
    description: 'Designated Project Manager or Engineer',
    aliases: ['project manager', 'pm', 'consultant', 'engineer', 'in charge', 'lead'],
    example: 'Eng. K. Perera'
  },
  {
    key: 'BUDGET_PETTY_CASH',
    label: 'Petty Cash Monthly Budget',
    required: false,
    type: 'number',
    description: 'Allocated monthly site petty cash ceiling',
    aliases: ['budget petty cash', 'petty cash limit', 'cash limit', 'monthly budget'],
    example: '1500000'
  },
  {
    key: 'REMARKS',
    label: 'Remarks',
    required: false,
    type: 'string',
    description: 'Project notes',
    aliases: ['remarks', 'notes', 'comments'],
    example: 'Imported from Master ERP Registry'
  }
];

export const SUPERVISOR_FIELDS: FieldDefinition[] = [
  {
    key: 'SUPERVISOR_ID',
    label: 'Supervisor / Employee ID',
    required: false,
    type: 'string',
    description: 'Unique employee ID or supervisor code (e.g. SUP-001)',
    aliases: ['supervisor id', 'emp id', 'employee id', 'code', 'id', 'sup id'],
    example: 'SUP-001'
  },
  {
    key: 'SUPERVISOR_NAME',
    label: 'Full Name',
    required: true,
    type: 'string',
    description: 'Full name of supervisor (used as primary key across expenses)',
    aliases: ['supervisor name', 'name', 'full name', 'supervisor', 'employee name'],
    example: 'BUDDIKA'
  },
  {
    key: 'PHONE',
    label: 'Phone / Mobile',
    required: false,
    type: 'string',
    description: 'Contact telephone number',
    aliases: ['phone', 'mobile', 'contact', 'telephone', 'mobile no', 'cell'],
    example: '+94 77 123 4567'
  },
  {
    key: 'EMAIL',
    label: 'Email Address',
    required: false,
    type: 'string',
    description: 'Corporate email address',
    aliases: ['email', 'email address', 'mail'],
    example: 'buddika@emagroup.lk'
  },
  {
    key: 'OPENING_PETTY_CASH',
    label: 'Opening Cash Float (LKR)',
    required: false,
    type: 'number',
    description: 'Initial petty cash float in hand',
    aliases: ['opening petty cash', 'opening balance', 'initial float', 'opening float', 'cash in hand'],
    example: '50000'
  },
  {
    key: 'DEFAULT_PROJECT',
    label: 'Assigned Project Code',
    required: false,
    type: 'string',
    description: 'Project code supervisor is currently stationed at',
    aliases: ['assigned project', 'default project', 'project code', 'project', 'assigned site', 'site'],
    example: 'PIDM 26'
  },
  {
    key: 'ACTIVE',
    label: 'Active Status (Yes/No)',
    required: false,
    type: 'boolean',
    description: 'Whether supervisor is currently active on site',
    aliases: ['active', 'status', 'is active', 'enabled'],
    example: 'Yes'
  },
  {
    key: 'REMARKS',
    label: 'Remarks',
    required: false,
    type: 'string',
    description: 'Designation or assignment notes',
    aliases: ['remarks', 'notes', 'position', 'designation', 'department'],
    example: 'Senior Site Executive'
  }
];

export const INCOME_FIELDS: FieldDefinition[] = [
  {
    key: 'INCOME_ID',
    label: 'Income / Top-up ID',
    required: false,
    type: 'string',
    description: 'Unique float top-up or receipt reference (e.g. INC-2024-0012)',
    aliases: ['income id', 'receipt id', 'inc id', 'ref no', 'reference', 'receipt no', 'doc no', 'id', 'voucher no', 'trans id'],
    example: 'INC-2024-0042'
  },
  {
    key: 'DATE',
    label: 'Receipt / Transfer Date',
    required: true,
    type: 'date',
    description: 'Receipt or disbursal date (DD/MM/YYYY or YYYY-MM-DD)',
    aliases: ['date', 'income date', 'receipt date', 'disbursal date', 'transfer date', 'paid date', 'credited date', 'txn date'],
    example: '12/04/2024'
  },
  {
    key: 'SUPERVISOR',
    label: 'Recipient Supervisor Name',
    required: true,
    type: 'string',
    description: 'Site supervisor receiving the float allocation',
    aliases: ['supervisor', 'supervisor name', 'custodian', 'paid to', 'recipient', 'site supervisor', 'cashier', 'in charge'],
    example: 'BUDDIKA'
  },
  {
    key: 'PROJECT',
    label: 'Assigned Project Code',
    required: true,
    type: 'string',
    description: 'Project code allocation (e.g. PIDM 26)',
    aliases: ['project', 'project code', 'site', 'location', 'project name', 'cost center', 'wbs'],
    example: 'PIDM 26'
  },
  {
    key: 'AMOUNT',
    label: 'Amount (LKR)',
    required: true,
    type: 'number',
    description: 'Total top-up or cash replenishment amount',
    aliases: ['amount', 'total', 'topup amount', 'top up', 'value', 'lkr', 'sum', 'cash received', 'credited amount'],
    example: '150000'
  },
  {
    key: 'INCOME_SOURCE',
    label: 'Income / Top-up Source',
    required: false,
    type: 'string',
    description: 'Funding channel (Direct Float Top-up, Bank Transfer to Custodian, Cash Deposit, Head Office Disbursal, Other)',
    aliases: ['income source', 'source', 'channel', 'payment mode', 'method', 'mode', 'funding source', 'source type'],
    example: 'Bank Transfer to Custodian'
  },
  {
    key: 'TRANSACTION_TYPE',
    label: 'Transaction Type',
    required: false,
    type: 'string',
    description: 'Type classification (FLOAT_TOPUP, INCOME_RECEIPT, REIMBURSEMENT_CREDIT)',
    aliases: ['transaction type', 'type', 'category', 'class'],
    example: 'FLOAT_TOPUP'
  },
  {
    key: 'REMARKS',
    label: 'Remarks / Notes',
    required: false,
    type: 'string',
    description: 'Internal reference, bank transfer reference, or notes',
    aliases: ['remarks', 'notes', 'memo', 'particulars', 'bank ref', 'narrative', 'comment'],
    example: 'Head Office Float Top-up via BOC Transfer #99218'
  }
];

export const INVOICE_FIELDS: FieldDefinition[] = [
  {
    key: 'INVOICE_NUMBER',
    label: 'Invoice / IPC Number',
    required: true,
    type: 'string',
    description: 'Unique client tax invoice or interim payment certificate (IPC) reference',
    aliases: ['invoice number', 'invoice no', 'inv no', 'inv number', 'invoice #', 'bill no', 'bill number', 'ipc no', 'ipc number', 'certificate no', 'invoice', 'ref no', 'ref'],
    example: 'INV-2024-001'
  },
  {
    key: 'PROJECT',
    label: 'Project Code',
    required: true,
    type: 'string',
    description: 'Assigned construction site / project code (e.g. PIDM 26, HAVELOCK)',
    aliases: ['project', 'project code', 'project id', 'site', 'site code', 'job code', 'project name', 'wbs'],
    example: 'PIDM 26'
  },
  {
    key: 'CLIENT_NAME',
    label: 'Client / Organization',
    required: false,
    type: 'string',
    description: 'Client name, government authority, or employer company',
    aliases: ['client name', 'client', 'customer', 'employer', 'client organization', 'billed to', 'client agency', 'organization', 'agency'],
    example: 'National Water Supply & Drainage Board'
  },
  {
    key: 'INVOICE_DATE',
    label: 'Invoice Date',
    required: true,
    type: 'date',
    description: 'Date issued or certified (DD/MM/YYYY or YYYY-MM-DD)',
    aliases: ['invoice date', 'date', 'bill date', 'issue date', 'dated', 'submission date', 'certified date'],
    example: '15/01/2024'
  },
  {
    key: 'DUE_DATE',
    label: 'Payment Due Date',
    required: false,
    type: 'date',
    description: 'Certificate maturity / contractual payment due date',
    aliases: ['due date', 'payment due date', 'payment due', 'maturity date', 'term date', 'expiry date'],
    example: '15/02/2024'
  },
  {
    key: 'BILLING_DESCRIPTION',
    label: 'Billing Description / Scope',
    required: true,
    type: 'string',
    description: 'Interim payment scope, progress billing milestone, or work particulars',
    aliases: ['billing description', 'description', 'scope', 'milestone', 'particulars', 'work description', 'item', 'certificate title', 'narrative'],
    example: 'Interim Payment Certificate No. 04 - Pipeline Installation Progress'
  },
  {
    key: 'NET_AMOUNT',
    label: 'Net Certified Amount (LKR)',
    required: true,
    type: 'number',
    description: 'Net billing value before Sri Lankan VAT (18%)',
    aliases: ['net amount', 'amount', 'net value', 'base amount', 'subtotal', 'certified amount', 'net billed', 'net', 'contract amount'],
    example: '2500000'
  },
  {
    key: 'VAT_TREATMENT',
    label: 'VAT Treatment',
    required: false,
    type: 'string',
    description: 'Tax category: EXCLUDING_VAT (default), INCLUDING_VAT, or VAT_NOT_APPLICABLE',
    aliases: ['vat treatment', 'vat type', 'vat mode', 'tax treatment', 'vat applied', 'tax category'],
    example: 'EXCLUDING_VAT'
  },
  {
    key: 'VAT_RATE',
    label: 'VAT Rate (%)',
    required: false,
    type: 'number',
    description: 'Sri Lanka standard VAT rate percentage (defaults to 18%)',
    aliases: ['vat rate', 'vat %', 'tax rate', 'vat percentage', 'rate', 'vat percent'],
    example: '18'
  },
  {
    key: 'GROSS_AMOUNT',
    label: 'Gross Invoiced Total (LKR)',
    required: false,
    type: 'number',
    description: 'Total certified bill including VAT. Auto-calculated from net amount + VAT if omitted.',
    aliases: ['gross amount', 'gross total', 'total amount', 'total', 'grand total', 'invoice total', 'gross'],
    example: '2950000'
  },
  {
    key: 'AMOUNT_RECEIVED',
    label: 'Amount Received (LKR)',
    required: false,
    type: 'number',
    description: 'Cash/cheque receipts collected from client towards this invoice',
    aliases: ['amount received', 'received amount', 'paid amount', 'cash received', 'collected', 'collection', 'payments received', 'receipts'],
    example: '1500000'
  },
  {
    key: 'PAYMENT_STATUS',
    label: 'Payment Status',
    required: false,
    type: 'string',
    description: 'Collection status: Approved, Paid, Partially Paid, Overdue, Submitted, Draft',
    aliases: ['payment status', 'status', 'invoice status', 'collection status', 'state'],
    example: 'Approved'
  },
  {
    key: 'PAYMENT_DATE',
    label: 'Receipt / Payment Date',
    required: false,
    type: 'date',
    description: 'Date payment was credited by client (if received)',
    aliases: ['payment date', 'received date', 'collected date', 'paid date', 'collection date'],
    example: '28/01/2024'
  },
  {
    key: 'PAYMENT_REFERENCE',
    label: 'Payment / Bank Reference',
    required: false,
    type: 'string',
    description: 'Client cheque number, RTGS/SLIPS transaction ref',
    aliases: ['payment reference', 'reference', 'cheque no', 'transfer ref', 'receipt ref', 'bank ref', 'deposit slip'],
    example: 'BOC-RTGS-990182'
  },
  {
    key: 'SUPERVISOR',
    label: 'Project Engineer / In-Charge',
    required: false,
    type: 'string',
    description: 'Site project engineer or billing supervisor',
    aliases: ['supervisor', 'engineer', 'manager', 'prepared by', 'in charge', 'contact person'],
    example: 'BUDDIKA'
  },
  {
    key: 'REMARKS',
    label: 'Remarks / Notes',
    required: false,
    type: 'string',
    description: 'Audit memo, retention notes, or certificate remarks',
    aliases: ['remarks', 'notes', 'memo', 'comments', 'retention'],
    example: 'Subject to 5% retention release on practical completion'
  }
];

export interface ParsedRawData {
  headers: string[];
  rows: Record<string, any>[];
  fileName: string;
  fileSize: string;
  sheetNames: string[];
}

export interface ValidationSummary {
  totalRows: number;
  validRowsCount: number;
  warningsCount: number;
  errorsCount: number;
  duplicatesCount: number;
  validatedRows: {
    rowIndex: number;
    raw: Record<string, any>;
    mapped: Record<string, any>;
    isValid: boolean;
    isDuplicate: boolean;
    duplicateId?: string;
    errors: ImportErrorDetail[];
    warnings: ImportErrorDetail[];
  }[];
}

export class DataImportService {
  /**
   * Get fields for given import type
   */
  static getFieldsForType(type: ImportType): FieldDefinition[] {
    switch (type) {
      case 'HISTORICAL_EXPENSES':
        return EXPENSE_FIELDS;
      case 'PROJECT_DIRECTORY':
        return PROJECT_FIELDS;
      case 'SUPERVISOR_DIRECTORY':
        return SUPERVISOR_FIELDS;
      case 'HISTORICAL_INCOME':
        return INCOME_FIELDS;
      case 'PROJECT_INVOICES':
        return INVOICE_FIELDS;
    }
  }

  /**
   * Read and parse an Excel/CSV file buffer using SheetJS
   */
  static async parseFile(file: File): Promise<ParsedRawData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true, raw: false });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Parse as JSON with headers
          const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
            defval: '',
            blankrows: false
          });

          if (!jsonData || jsonData.length === 0) {
            throw new Error('The uploaded file appears to be empty or contains no valid rows.');
          }

          // Extract headers from first object or sheet
          const headers = Object.keys(jsonData[0] || {});

          const formatBytes = (bytes: number) => {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
          };

          resolve({
            headers,
            rows: jsonData,
            fileName: file.name,
            fileSize: formatBytes(file.size),
            sheetNames: workbook.SheetNames
          });
        } catch (err: any) {
          reject(new Error(`Failed to parse file: ${err.message || 'Unknown error'}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read uploaded file'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Parse raw text (TSV from Excel/Google Sheets or CSV)
   */
  static parseRawText(text: string): ParsedRawData {
    if (!text || !text.trim()) {
      throw new Error('Pasted content is empty.');
    }

    const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      throw new Error('No data rows found in pasted text.');
    }

    // Detect delimiter: tab vs comma vs semicolon vs pipe
    const firstLine = lines[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semiCount = (firstLine.match(/;/g) || []).length;
    const pipeCount = (firstLine.match(/\|/g) || []).length;

    let delimiter = '\t';
    if (tabCount >= 1) delimiter = '\t';
    else if (commaCount > semiCount && commaCount > pipeCount) delimiter = ',';
    else if (semiCount > pipeCount) delimiter = ';';
    else if (pipeCount >= 1) delimiter = '|';

    const parseLine = (line: string): string[] => {
      if (delimiter === '\t' || delimiter === '|' || delimiter === ';') {
        return line.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''));
      }
      // Basic CSV split with quote handling
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim().replace(/^["']|["']$/g, ''));
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim().replace(/^["']|["']$/g, ''));
      return result;
    };

    const rawHeaders = parseLine(lines[0]);
    if (rawHeaders.length === 0) {
      throw new Error('Failed to parse column headers from pasted text.');
    }

    // Clean headers
    const headers = rawHeaders.map((h, i) => h || `Column_${i + 1}`);

    const rows: Record<string, any>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.every(v => v === '')) continue; // Skip completely blank lines
      const rowObj: Record<string, any> = {};
      headers.forEach((header, idx) => {
        rowObj[header] = values[idx] !== undefined ? values[idx] : '';
      });
      rows.push(rowObj);
    }

    if (rows.length === 0) {
      throw new Error('No valid data rows found after the header row.');
    }

    return {
      headers,
      rows,
      fileName: 'Pasted_Data_Clipboard.txt',
      fileSize: `${(new Blob([text]).size / 1024).toFixed(1)} KB`,
      sheetNames: ['Pasted Sheet']
    };
  }

  /**
   * Generate automatic mapping suggestions between file headers and target fields
   */
  static autoMapColumns(
    importType: ImportType,
    fileHeaders: string[]
  ): Record<string, string> {
    const fields = this.getFieldsForType(importType);
    const mapping: Record<string, string> = {};

    fields.forEach((field) => {
      const match = fileHeaders.find((header) => {
        const cleanHeader = header.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanLabel = field.label.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanKey = field.key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

        if (cleanHeader === cleanLabel || cleanHeader === cleanKey) return true;

        return field.aliases.some((alias) => {
          const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
          return cleanHeader === cleanAlias || cleanHeader.includes(cleanAlias);
        });
      });

      if (match) {
        mapping[field.key] = match;
      } else {
        mapping[field.key] = '';
      }
    });

    return mapping;
  }

  /**
   * Parse various date representations into standard format (YYYY-MM-DD and DD/MM/YYYY)
   */
  static normalizeDate(val: any): { isoDate: string; displayDate: string; isValid: boolean } {
    if (!val) return { isoDate: '', displayDate: '', isValid: false };

    let dateObj: Date | null = null;

    if (val instanceof Date && !isNaN(val.getTime())) {
      dateObj = val;
    } else if (typeof val === 'number') {
      // Excel serial date number
      dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
    } else if (typeof val === 'string') {
      const str = val.trim();
      // Match DD/MM/YYYY or DD-MM-YYYY
      const ddmmyyyy = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
      if (ddmmyyyy) {
        const day = parseInt(ddmmyyyy[1], 10);
        const month = parseInt(ddmmyyyy[2], 10) - 1;
        const year = parseInt(ddmmyyyy[3], 10);
        dateObj = new Date(year, month, day);
      } else {
        // Try standard Date.parse
        const parsed = new Date(str);
        if (!isNaN(parsed.getTime())) {
          dateObj = parsed;
        }
      }
    }

    if (dateObj && !isNaN(dateObj.getTime())) {
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      return {
        isoDate: `${yyyy}-${mm}-${dd}`,
        displayDate: `${dd}/${mm}/${yyyy}`,
        isValid: true
      };
    }

    return { isoDate: '', displayDate: String(val), isValid: false };
  }

  /**
   * Parse and sanitize numeric amount
   */
  static normalizeNumber(val: any): { numberValue: number; isValid: boolean } {
    if (val === null || val === undefined || val === '') {
      return { numberValue: 0, isValid: true };
    }
    if (typeof val === 'number') {
      return { numberValue: val, isValid: !isNaN(val) };
    }
    if (typeof val === 'string') {
      // Strip currency prefixes, commas, whitespace
      const clean = val.replace(/[^0-9.-]/g, '').trim();
      const num = parseFloat(clean);
      return {
        numberValue: isNaN(num) ? 0 : num,
        isValid: !isNaN(num)
      };
    }
    return { numberValue: 0, isValid: false };
  }

  /**
   * Validate entire dataset against master records and schema rules (alias supporting flexible master context keys)
   */
  static validateData(
    importType: ImportType,
    rawRows: Record<string, any>[],
    columnMapping: Record<string, string>,
    masterContext: {
      expenses?: Expense[];
      projects?: Project[];
      supervisors?: Supervisor[];
      income?: Income[];
      categories?: ExpenseCategory[];
      existingExpenses?: Expense[];
      existingProjects?: Project[];
      existingSupervisors?: Supervisor[];
      existingIncome?: Income[];
      existingCategories?: ExpenseCategory[];
    }
  ): ValidationSummary {
    return this.validateDataset(importType, rawRows, columnMapping, {
      existingExpenses: masterContext.existingExpenses || masterContext.expenses || [],
      existingProjects: masterContext.existingProjects || masterContext.projects || [],
      existingSupervisors: masterContext.existingSupervisors || masterContext.supervisors || [],
      existingIncome: masterContext.existingIncome || masterContext.income || [],
      existingCategories: masterContext.existingCategories || masterContext.categories || []
    });
  }

  /**
   * Validate entire dataset against master records and schema rules
   */
  static validateDataset(
    importType: ImportType,
    rawRows: Record<string, any>[],
    columnMapping: Record<string, string>,
    masterContext: {
      existingExpenses: Expense[];
      existingProjects: Project[];
      existingSupervisors: Supervisor[];
      existingIncome?: Income[];
      existingCategories: ExpenseCategory[];
    }
  ): ValidationSummary {
    const fields = this.getFieldsForType(importType);
    let validCount = 0;
    let warningsCount = 0;
    let errorsCount = 0;
    let duplicatesCount = 0;

    const validatedRows = rawRows.map((raw, idx) => {
      const rowIndex = idx + 1;
      const mapped: Record<string, any> = {};
      const rowErrors: ImportErrorDetail[] = [];
      const rowWarnings: ImportErrorDetail[] = [];
      let isDuplicate = false;
      let duplicateId: string | undefined = undefined;

      // Extract mapped values
      fields.forEach((f) => {
        const sourceCol = columnMapping[f.key];
        const val = sourceCol && raw[sourceCol] !== undefined ? raw[sourceCol] : '';
        mapped[f.key] = val;
      });

      // 1. Specific Validation for HISTORICAL_EXPENSES
      if (importType === 'HISTORICAL_EXPENSES') {
        // Date validation
        const dateResult = this.normalizeDate(mapped['DATE']);
        if (!dateResult.isValid) {
          rowErrors.push({
            row: rowIndex,
            field: 'DATE',
            value: mapped['DATE'],
            error: 'Invalid or missing expense date. Must be DD/MM/YYYY or YYYY-MM-DD.',
            severity: 'ERROR'
          });
        } else {
          mapped['DATE_REF'] = dateResult.isoDate;
          mapped['DATE'] = dateResult.displayDate;
        }

        // Amount validation
        const amtResult = this.normalizeNumber(mapped['AMOUNT']);
        if (!amtResult.isValid || amtResult.numberValue <= 0) {
          rowErrors.push({
            row: rowIndex,
            field: 'AMOUNT',
            value: mapped['AMOUNT'],
            error: 'Amount must be a positive numeric value.',
            severity: 'ERROR'
          });
        } else {
          mapped['AMOUNT'] = amtResult.numberValue;
        }

        // Supervisor validation
        const supVal = String(mapped['SUPERVISOR'] || '').trim();
        if (!supVal) {
          rowErrors.push({
            row: rowIndex,
            field: 'SUPERVISOR',
            value: '',
            error: 'Supervisor is required for petty cash accountability.',
            severity: 'ERROR'
          });
        } else {
          const matchSup = masterContext.existingSupervisors.find(
            s => s.SUPERVISOR_NAME.trim().toUpperCase() === supVal.toUpperCase() ||
                 s.SUPERVISOR_ID.trim().toUpperCase() === supVal.toUpperCase()
          );
          if (!matchSup) {
            rowWarnings.push({
              row: rowIndex,
              field: 'SUPERVISOR',
              value: supVal,
              error: `Supervisor '${supVal}' is not in the Supervisor Directory. A new supervisor record will be registered automatically if imported.`,
              severity: 'WARNING'
            });
          }
        }

        // Project validation
        const prjVal = String(mapped['PROJECT'] || '').trim();
        if (!prjVal) {
          rowErrors.push({
            row: rowIndex,
            field: 'PROJECT',
            value: '',
            error: 'Project code is required.',
            severity: 'ERROR'
          });
        } else {
          const matchPrj = masterContext.existingProjects.find(
            p => p.PROJECT_CODE.trim().toUpperCase() === prjVal.toUpperCase() ||
                 p.PROJECT_NAME.trim().toUpperCase() === prjVal.toUpperCase()
          );
          if (!matchPrj) {
            rowWarnings.push({
              row: rowIndex,
              field: 'PROJECT',
              value: prjVal,
              error: `Project code '${prjVal}' was not found in active projects. Will register as site code '${prjVal}'.`,
              severity: 'WARNING'
            });
          }
        }

        // Description validation
        const descVal = String(mapped['EXPENSES_DESCRIPTION'] || '').trim();
        if (!descVal) {
          rowErrors.push({
            row: rowIndex,
            field: 'EXPENSES_DESCRIPTION',
            value: '',
            error: 'Expense description/particulars is mandatory.',
            severity: 'ERROR'
          });
        }

        // Category validation
        const catVal = String(mapped['EXPENSES_CATEGORY'] || '').trim();
        if (!catVal) {
          mapped['EXPENSES_CATEGORY'] = '5000 Construction Materials';
          rowWarnings.push({
            row: rowIndex,
            field: 'EXPENSES_CATEGORY',
            value: '',
            error: 'Category omitted; defaulted to "5000 Construction Materials".',
            severity: 'WARNING'
          });
        }

        // Payment Source validation
        if (!mapped['PAYMENT_SOURCE'] || !String(mapped['PAYMENT_SOURCE']).trim()) {
          mapped['PAYMENT_SOURCE'] = 'Historical / Not Specified';
          rowWarnings.push({
            row: rowIndex,
            field: 'PAYMENT_SOURCE',
            value: '',
            error: 'Payment Source omitted; set to "Historical / Not Specified".',
            severity: 'WARNING'
          });
        }

        // Payment status default
        if (!mapped['PAYMENT_STATUS'] || !String(mapped['PAYMENT_STATUS']).trim()) {
          mapped['PAYMENT_STATUS'] = 'Approved';
        }

        // Duplicate Check for Expenses (by EXPENSES_ID, PRV_NUMBER, or Voucher)
        const expIdVal = String(mapped['EXPENSES_ID'] || '').trim();
        const prvVal = String(mapped['PRV_NUMBER'] || '').trim();

        if (expIdVal) {
          const dup = masterContext.existingExpenses.find(
            e => e.EXPENSES_ID.trim().toUpperCase() === expIdVal.toUpperCase()
          );
          if (dup) {
            isDuplicate = true;
            duplicateId = dup.EXPENSES_ID;
            rowWarnings.push({
              row: rowIndex,
              field: 'EXPENSES_ID',
              value: expIdVal,
              error: `Expense ID '${expIdVal}' already exists in EMA records.`,
              severity: 'DUPLICATE'
            });
          }
        } else if (prvVal) {
          const dupPrv = masterContext.existingExpenses.find(
            e => e.PRV_NUMBER && e.PRV_NUMBER.trim().toUpperCase() === prvVal.toUpperCase()
          );
          if (dupPrv) {
            isDuplicate = true;
            duplicateId = dupPrv.PRV_NUMBER;
            rowWarnings.push({
              row: rowIndex,
              field: 'PRV_NUMBER',
              value: prvVal,
              error: `Voucher / PRV '${prvVal}' already exists in system records.`,
              severity: 'DUPLICATE'
            });
          }
        }
      }

      // 2. Specific Validation for PROJECT_DIRECTORY
      if (importType === 'PROJECT_DIRECTORY') {
        const prjCode = String(mapped['PROJECT_CODE'] || '').trim();
        const prjName = String(mapped['PROJECT_NAME'] || '').trim();

        if (!prjCode) {
          rowErrors.push({
            row: rowIndex,
            field: 'PROJECT_CODE',
            value: '',
            error: 'Project Code is mandatory (unique primary key).',
            severity: 'ERROR'
          });
        }

        if (!prjName) {
          rowErrors.push({
            row: rowIndex,
            field: 'PROJECT_NAME',
            value: '',
            error: 'Project Name is mandatory.',
            severity: 'ERROR'
          });
        }

        // Contract Value
        const valResult = this.normalizeNumber(mapped['CONTRACT_VALUE']);
        mapped['CONTRACT_VALUE'] = valResult.numberValue;

        // Duplicate Check
        if (prjCode) {
          const dupPrj = masterContext.existingProjects.find(
            p => p.PROJECT_CODE.trim().toUpperCase() === prjCode.toUpperCase()
          );
          if (dupPrj) {
            isDuplicate = true;
            duplicateId = dupPrj.PROJECT_CODE;
            rowWarnings.push({
              row: rowIndex,
              field: 'PROJECT_CODE',
              value: prjCode,
              error: `Project Code '${prjCode}' already exists (${dupPrj.PROJECT_NAME}).`,
              severity: 'DUPLICATE'
            });
          }
        }
      }

      // 3. Specific Validation for SUPERVISOR_DIRECTORY
      if (importType === 'SUPERVISOR_DIRECTORY') {
        const supName = String(mapped['SUPERVISOR_NAME'] || '').trim();
        if (!supName) {
          rowErrors.push({
            row: rowIndex,
            field: 'SUPERVISOR_NAME',
            value: '',
            error: 'Supervisor Full Name is required.',
            severity: 'ERROR'
          });
        }

        const openingResult = this.normalizeNumber(mapped['OPENING_PETTY_CASH']);
        mapped['OPENING_PETTY_CASH'] = openingResult.numberValue;

        // Project Assignment Check
        const assignedPrj = String(mapped['DEFAULT_PROJECT'] || '').trim();
        if (assignedPrj) {
          const matchPrj = masterContext.existingProjects.find(
            p => p.PROJECT_CODE.trim().toUpperCase() === assignedPrj.toUpperCase()
          );
          if (!matchPrj) {
            rowWarnings.push({
              row: rowIndex,
              field: 'DEFAULT_PROJECT',
              value: assignedPrj,
              error: `Assigned project code '${assignedPrj}' is not found in the active project directory.`,
              severity: 'WARNING'
            });
          }
        }

        // Duplicate Check
        const supId = String(mapped['SUPERVISOR_ID'] || '').trim();
        if (supName || supId) {
          const dupSup = masterContext.existingSupervisors.find(
            s => (supName && s.SUPERVISOR_NAME.trim().toUpperCase() === supName.toUpperCase()) ||
                 (supId && s.SUPERVISOR_ID.trim().toUpperCase() === supId.toUpperCase())
          );
          if (dupSup) {
            isDuplicate = true;
            duplicateId = dupSup.SUPERVISOR_NAME;
            rowWarnings.push({
              row: rowIndex,
              field: 'SUPERVISOR_NAME',
              value: supName,
              error: `Supervisor '${supName}' already exists in the system directory.`,
              severity: 'DUPLICATE'
            });
          }
        }
      }

      // 4. Specific Validation for HISTORICAL_INCOME
      if (importType === 'HISTORICAL_INCOME') {
        // Date validation
        const dateResult = this.normalizeDate(mapped['DATE']);
        if (!dateResult.isValid) {
          rowErrors.push({
            row: rowIndex,
            field: 'DATE',
            value: mapped['DATE'],
            error: 'Invalid or missing receipt/transfer date. Must be DD/MM/YYYY or YYYY-MM-DD.',
            severity: 'ERROR'
          });
        } else {
          mapped['DATE_REF'] = dateResult.isoDate;
          mapped['DATE'] = dateResult.displayDate;
        }

        // Amount validation
        const amtResult = this.normalizeNumber(mapped['AMOUNT']);
        if (!amtResult.isValid || amtResult.numberValue <= 0) {
          rowErrors.push({
            row: rowIndex,
            field: 'AMOUNT',
            value: mapped['AMOUNT'],
            error: 'Top-up amount must be a positive numeric value.',
            severity: 'ERROR'
          });
        } else {
          mapped['AMOUNT'] = amtResult.numberValue;
        }

        // Supervisor validation
        const supVal = String(mapped['SUPERVISOR'] || '').trim();
        if (!supVal) {
          rowErrors.push({
            row: rowIndex,
            field: 'SUPERVISOR',
            value: '',
            error: 'Recipient supervisor name is mandatory.',
            severity: 'ERROR'
          });
        } else {
          const matchSup = masterContext.existingSupervisors.find(
            s => s.SUPERVISOR_NAME.trim().toUpperCase() === supVal.toUpperCase() ||
                 s.SUPERVISOR_ID.trim().toUpperCase() === supVal.toUpperCase()
          );
          if (!matchSup) {
            rowWarnings.push({
              row: rowIndex,
              field: 'SUPERVISOR',
              value: supVal,
              error: `Supervisor '${supVal}' not found in directory. A new supervisor record will be registered automatically if imported.`,
              severity: 'WARNING'
            });
          }
        }

        // Project validation
        const prjVal = String(mapped['PROJECT'] || '').trim();
        if (!prjVal) {
          rowErrors.push({
            row: rowIndex,
            field: 'PROJECT',
            value: '',
            error: 'Project allocation code is required.',
            severity: 'ERROR'
          });
        } else {
          const matchPrj = masterContext.existingProjects.find(
            p => p.PROJECT_CODE.trim().toUpperCase() === prjVal.toUpperCase() ||
                 p.PROJECT_NAME.trim().toUpperCase() === prjVal.toUpperCase()
          );
          if (!matchPrj) {
            rowWarnings.push({
              row: rowIndex,
              field: 'PROJECT',
              value: prjVal,
              error: `Project code '${prjVal}' is not in active projects. Will register as site code '${prjVal}'.`,
              severity: 'WARNING'
            });
          }
        }

        // Income Source
        if (!mapped['INCOME_SOURCE'] || !String(mapped['INCOME_SOURCE']).trim()) {
          mapped['INCOME_SOURCE'] = 'Direct Float Top-up';
        }

        // Transaction Type
        if (!mapped['TRANSACTION_TYPE'] || !String(mapped['TRANSACTION_TYPE']).trim()) {
          mapped['TRANSACTION_TYPE'] = 'FLOAT_TOPUP';
        }

        // Duplicate Check by INCOME_ID
        const incIdVal = String(mapped['INCOME_ID'] || '').trim();
        if (incIdVal && masterContext.existingIncome) {
          const dup = masterContext.existingIncome.find(
            inc => inc.INCOME_ID.trim().toUpperCase() === incIdVal.toUpperCase()
          );
          if (dup) {
            isDuplicate = true;
            duplicateId = dup.INCOME_ID;
            rowWarnings.push({
              row: rowIndex,
              field: 'INCOME_ID',
              value: incIdVal,
              error: `Income ID '${incIdVal}' already exists in system records.`,
              severity: 'DUPLICATE'
            });
          }
        }
      }

      // 5. Specific Validation for PROJECT_INVOICES
      if (importType === 'PROJECT_INVOICES') {
        // Invoice Number
        const invNum = String(mapped['INVOICE_NUMBER'] || '').trim();
        if (!invNum) {
          rowErrors.push({
            row: rowIndex,
            field: 'INVOICE_NUMBER',
            value: '',
            error: 'Invoice or IPC number is required.',
            severity: 'ERROR'
          });
        }

        // Project validation
        const prjVal = String(mapped['PROJECT'] || '').trim().toUpperCase();
        if (!prjVal) {
          rowErrors.push({
            row: rowIndex,
            field: 'PROJECT',
            value: '',
            error: 'Assigned Project Code is required.',
            severity: 'ERROR'
          });
        } else {
          mapped['PROJECT'] = prjVal;
          const matchPrj = masterContext.existingProjects.find(
            p => p.PROJECT_CODE.trim().toUpperCase() === prjVal ||
                 p.PROJECT_NAME.trim().toUpperCase() === prjVal
          );
          if (!matchPrj) {
            rowWarnings.push({
              row: rowIndex,
              field: 'PROJECT',
              value: prjVal,
              error: `Project code '${prjVal}' is not in active project directory. Project site will be auto-registered if enabled.`,
              severity: 'WARNING'
            });
          }
        }

        // Invoice Date validation
        const dateResult = this.normalizeDate(mapped['INVOICE_DATE']);
        if (!dateResult.isValid) {
          rowErrors.push({
            row: rowIndex,
            field: 'INVOICE_DATE',
            value: mapped['INVOICE_DATE'],
            error: 'Valid Invoice Date is required (DD/MM/YYYY or YYYY-MM-DD).',
            severity: 'ERROR'
          });
        } else {
          mapped['INVOICE_DATE_ISO'] = dateResult.isoDate;
          mapped['INVOICE_DATE_DISPLAY'] = dateResult.displayDate;
        }

        // Due Date validation (optional)
        if (mapped['DUE_DATE']) {
          const dueDateResult = this.normalizeDate(mapped['DUE_DATE']);
          if (dueDateResult.isValid) {
            mapped['DUE_DATE_ISO'] = dueDateResult.isoDate;
          } else {
            rowWarnings.push({
              row: rowIndex,
              field: 'DUE_DATE',
              value: mapped['DUE_DATE'],
              error: 'Due Date format unreadable; defaulting to 30 days after Invoice Date.',
              severity: 'WARNING'
            });
          }
        }

        // Billing Description
        const descVal = String(mapped['BILLING_DESCRIPTION'] || '').trim();
        if (!descVal) {
          rowErrors.push({
            row: rowIndex,
            field: 'BILLING_DESCRIPTION',
            value: '',
            error: 'Billing description or IPC milestone summary is mandatory.',
            severity: 'ERROR'
          });
        }

        // Net Amount validation
        const netResult = this.normalizeNumber(mapped['NET_AMOUNT']);
        if (!netResult.isValid || netResult.numberValue <= 0) {
          rowErrors.push({
            row: rowIndex,
            field: 'NET_AMOUNT',
            value: mapped['NET_AMOUNT'],
            error: 'Net certified amount must be a positive numeric value.',
            severity: 'ERROR'
          });
        } else {
          mapped['NET_AMOUNT'] = netResult.numberValue;
        }

        // VAT Treatment & Rate
        let vatTreatment = String(mapped['VAT_TREATMENT'] || 'EXCLUDING_VAT').trim().toUpperCase();
        if (!['EXCLUDING_VAT', 'INCLUDING_VAT', 'VAT_NOT_APPLICABLE'].includes(vatTreatment)) {
          if (vatTreatment.includes('INC') || vatTreatment.includes('INCL')) {
            vatTreatment = 'INCLUDING_VAT';
          } else if (vatTreatment.includes('NO') || vatTreatment.includes('EXEMPT') || vatTreatment.includes('NOT') || vatTreatment.includes('ZERO')) {
            vatTreatment = 'VAT_NOT_APPLICABLE';
          } else {
            vatTreatment = 'EXCLUDING_VAT';
          }
        }
        mapped['VAT_TREATMENT'] = vatTreatment;

        const vatRateResult = this.normalizeNumber(mapped['VAT_RATE']);
        const vatRate = vatRateResult.isValid && vatRateResult.numberValue >= 0 ? vatRateResult.numberValue : 18;
        mapped['VAT_RATE'] = vatRate;

        // Auto-calculate Net, VAT, Gross
        const netVal = Number(mapped['NET_AMOUNT']) || 0;
        let vatVal = 0;
        let grossVal = 0;

        if (vatTreatment === 'EXCLUDING_VAT') {
          vatVal = Math.round((netVal * (vatRate / 100)) * 100) / 100;
          grossVal = Math.round((netVal + vatVal) * 100) / 100;
        } else if (vatTreatment === 'INCLUDING_VAT') {
          grossVal = netVal;
          const calculatedNet = Math.round((grossVal / (1 + vatRate / 100)) * 100) / 100;
          vatVal = Math.round((grossVal - calculatedNet) * 100) / 100;
          mapped['NET_AMOUNT'] = calculatedNet;
        } else {
          vatVal = 0;
          grossVal = netVal;
        }

        // Check if explicit GROSS_AMOUNT provided
        if (mapped['GROSS_AMOUNT']) {
          const explicitGross = this.normalizeNumber(mapped['GROSS_AMOUNT']);
          if (explicitGross.isValid && explicitGross.numberValue > 0) {
            grossVal = explicitGross.numberValue;
            if (vatTreatment === 'EXCLUDING_VAT') {
              vatVal = Math.max(0, Math.round((grossVal - netVal) * 100) / 100);
            }
          }
        }
        mapped['CALCULATED_VAT'] = vatVal;
        mapped['CALCULATED_GROSS'] = grossVal;

        // Amount Received & Balance Due
        const receivedResult = this.normalizeNumber(mapped['AMOUNT_RECEIVED']);
        const amountReceived = receivedResult.isValid && receivedResult.numberValue >= 0 ? receivedResult.numberValue : 0;
        mapped['AMOUNT_RECEIVED'] = amountReceived;
        const balanceDue = Math.max(0, Math.round((grossVal - amountReceived) * 100) / 100);
        mapped['BALANCE_DUE'] = balanceDue;

        // Status
        let status = String(mapped['PAYMENT_STATUS'] || '').trim();
        if (!status) {
          if (amountReceived >= grossVal && grossVal > 0) {
            status = 'Paid';
          } else if (amountReceived > 0) {
            status = 'Partially Paid';
          } else {
            status = 'Approved';
          }
        }
        mapped['PAYMENT_STATUS'] = status;

        // Payment Date (if provided)
        if (mapped['PAYMENT_DATE']) {
          const payDateRes = this.normalizeDate(mapped['PAYMENT_DATE']);
          if (payDateRes.isValid) {
            mapped['PAYMENT_DATE_ISO'] = payDateRes.isoDate;
          }
        }

        // Duplicate Check by INVOICE_NUMBER or INCOME_ID
        if (invNum && masterContext.existingIncome) {
          const dup = masterContext.existingIncome.find(
            inc => (inc.invoiceNumber && inc.invoiceNumber.trim().toUpperCase() === invNum.toUpperCase()) ||
                   (inc.INCOME_ID && inc.INCOME_ID.trim().toUpperCase() === invNum.toUpperCase())
          );
          if (dup) {
            isDuplicate = true;
            duplicateId = dup.invoiceNumber || dup.INCOME_ID;
            rowWarnings.push({
              row: rowIndex,
              field: 'INVOICE_NUMBER',
              value: invNum,
              error: `Invoice number '${invNum}' already exists in system records.`,
              severity: 'DUPLICATE'
            });
          }
        }
      }

      const hasErrors = rowErrors.length > 0;
      if (hasErrors) errorsCount++;
      else validCount++;

      if (rowWarnings.length > 0) warningsCount += rowWarnings.length;
      if (isDuplicate) duplicatesCount++;

      return {
        rowIndex,
        raw,
        mapped,
        isValid: !hasErrors,
        isDuplicate,
        duplicateId,
        errors: rowErrors,
        warnings: rowWarnings
      };
    });

    return {
      totalRows: rawRows.length,
      validRowsCount: validCount,
      warningsCount,
      errorsCount,
      duplicatesCount,
      validatedRows
    };
  }

  /**
   * Execute actual batch import and generate batch commit records
   */
  static executeImport(
    batchId: string,
    importType: ImportType,
    validatedSummary: ValidationSummary,
    duplicateAction: DuplicateAction,
    options: {
      performedBy: string;
      userRole: string;
      fileName: string;
      fileSize: string;
      skipInvalid: boolean;
    },
    masterContext: {
      expenses: Expense[];
      projects: Project[];
      supervisors: Supervisor[];
    }
  ): {
    batchRecord: ImportBatchRecord;
    updatedExpenses: Expense[];
    updatedProjects: Project[];
    updatedSupervisors: Supervisor[];
  } {
    const timestamp = new Date().toISOString();
    let importedRows = 0;
    let updatedRows = 0;
    let skippedRows = 0;
    let failedRows = 0;

    let newExpenses = [...masterContext.expenses];
    let newProjects = [...masterContext.projects];
    let newSupervisors = [...masterContext.supervisors];

    const createdRecordIds: {
      expenses: string[];
      projects: string[];
      supervisors: string[];
    } = {
      expenses: [],
      projects: [],
      supervisors: []
    };

    const previousSnapshot: {
      updatedExpenses: Expense[];
      updatedProjects: Project[];
      updatedSupervisors: Supervisor[];
    } = {
      updatedExpenses: [],
      updatedProjects: [],
      updatedSupervisors: []
    };

    const allErrors: ImportErrorDetail[] = [];

    validatedSummary.validatedRows.forEach((row) => {
      if (!row.isValid) {
        if (options.skipInvalid) {
          failedRows++;
          allErrors.push(...row.errors);
          return;
        } else {
          failedRows++;
          allErrors.push(...row.errors);
          return;
        }
      }

      // Handle Duplicates
      if (row.isDuplicate) {
        if (duplicateAction === 'SKIP') {
          skippedRows++;
          return;
        }
        if (duplicateAction === 'CANCEL') {
          throw new Error(`Import cancelled due to duplicate found at row ${row.rowIndex}`);
        }
      }

      // 1. Process HISTORICAL_EXPENSES
      if (importType === 'HISTORICAL_EXPENSES') {
        const m = row.mapped;
        const expenseId = m.EXPENSES_ID && !row.isDuplicate
          ? String(m.EXPENSES_ID).trim()
          : `HIST-EXP-${Date.now().toString().slice(-6)}-${String(row.rowIndex).padStart(4, '0')}`;

        const newExp: Expense = {
          id: `exp_hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          EXPENSES_ID: expenseId,
          DATE_REF: m.DATE_REF || new Date().toISOString().slice(0, 10),
          DATE: m.DATE || '01/01/2026',
          SUPERVISOR: String(m.SUPERVISOR || '').trim().toUpperCase(),
          PROJECT: String(m.PROJECT || '').trim().toUpperCase(),
          EXPENSES_CATEGORY: String(m.EXPENSES_CATEGORY || '5000 Construction Materials').trim(),
          TRANSACTION_TYPE: 'PETTY_CASH_EXPENSE',
          AMOUNT: Number(m.AMOUNT) || 0,
          EXPENSES_DESCRIPTION: String(m.EXPENSES_DESCRIPTION || '').trim(),
          PAYMENT_STATUS: (m.PAYMENT_STATUS as any) || 'Approved',
          PAYMENT_SOURCE: String(m.PAYMENT_SOURCE || 'Historical / Not Specified').trim(),
          PRV_NUMBER: m.PRV_NUMBER ? String(m.PRV_NUMBER).trim() : undefined,
          CREATED_BY: options.performedBy,
          CREATED_DATE: timestamp,
          REMARKS: m.REMARKS ? `[HISTORICAL] ${String(m.REMARKS).trim()}` : `[HISTORICAL IMPORT - Batch ${batchId}]`,
          DATA_SOURCE: 'HISTORICAL_IMPORT',
          IMPORT_BATCH_ID: batchId,
          IMPORTED_BY: options.performedBy,
          IMPORTED_AT: timestamp,
          IS_HISTORICAL: true
        };

        if (row.isDuplicate && duplicateAction === 'UPDATE') {
          const idx = newExpenses.findIndex(
            e => (m.EXPENSES_ID && e.EXPENSES_ID === m.EXPENSES_ID) ||
                 (m.PRV_NUMBER && e.PRV_NUMBER === m.PRV_NUMBER)
          );
          if (idx !== -1) {
            previousSnapshot.updatedExpenses.push({ ...newExpenses[idx] });
            newExpenses[idx] = { ...newExpenses[idx], ...newExp, id: newExpenses[idx].id };
            updatedRows++;
            return;
          }
        }

        newExpenses.unshift(newExp);
        createdRecordIds.expenses.push(newExp.id);
        importedRows++;

        // Auto-register supervisor if absent
        const supName = newExp.SUPERVISOR;
        if (supName && !newSupervisors.some(s => s.SUPERVISOR_NAME.toUpperCase() === supName)) {
          const autoSup: Supervisor = {
            id: `sup_auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            SUPERVISOR_ID: `SUP-AUTO-${String(newSupervisors.length + 1).padStart(3, '0')}`,
            SUPERVISOR_NAME: supName,
            PHONE: '',
            EMAIL: `${supName.toLowerCase().replace(/\s+/g, '')}@emagroup.lk`,
            ACTIVE: true,
            OPENING_PETTY_CASH: 0,
            CURRENT_BALANCE: 0,
            DEFAULT_PROJECT: newExp.PROJECT,
            DATA_SOURCE: 'HISTORICAL_IMPORT',
            IMPORT_BATCH_ID: batchId,
            IMPORTED_BY: options.performedBy,
            IMPORTED_AT: timestamp,
            IS_HISTORICAL: true,
            REMARKS: `Auto-registered via Historical Import Batch ${batchId}`
          };
          newSupervisors.push(autoSup);
          createdRecordIds.supervisors.push(autoSup.id);
        }
      }

      // 2. Process PROJECT_DIRECTORY
      if (importType === 'PROJECT_DIRECTORY') {
        const m = row.mapped;
        const projectCode = String(m.PROJECT_CODE).trim().toUpperCase();

        const newPrj: Project = {
          id: `prj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          PROJECT_ID: `PRJ-${String(newProjects.length + 1).padStart(3, '0')}`,
          PROJECT_CODE: projectCode,
          PROJECT_NAME: String(m.PROJECT_NAME || projectCode).trim(),
          CLIENT: String(m.CLIENT || 'EMA Client').trim(),
          LOCATION: String(m.LOCATION || 'Site Location').trim(),
          CONTRACT_VALUE: Number(m.CONTRACT_VALUE) || 0,
          START_DATE: m.START_DATE ? String(m.START_DATE).trim() : '2024-01-01',
          END_DATE: m.END_DATE ? String(m.END_DATE).trim() : '2026-12-31',
          STATUS: (m.STATUS as any) || 'Active',
          PROJECT_MANAGER: String(m.PROJECT_MANAGER || 'Designated PM').trim(),
          BUDGET_PETTY_CASH: Number(m.BUDGET_PETTY_CASH) || 500000,
          REMARKS: m.REMARKS ? String(m.REMARKS).trim() : `Imported via Batch ${batchId}`,
          DATA_SOURCE: 'HISTORICAL_IMPORT',
          IMPORT_BATCH_ID: batchId,
          IMPORTED_BY: options.performedBy,
          IMPORTED_AT: timestamp,
          IS_HISTORICAL: true
        };

        if (row.isDuplicate && duplicateAction === 'UPDATE') {
          const idx = newProjects.findIndex(p => p.PROJECT_CODE.toUpperCase() === projectCode);
          if (idx !== -1) {
            previousSnapshot.updatedProjects.push({ ...newProjects[idx] });
            newProjects[idx] = { ...newProjects[idx], ...newPrj, id: newProjects[idx].id, PROJECT_ID: newProjects[idx].PROJECT_ID };
            updatedRows++;
            return;
          }
        }

        newProjects.unshift(newPrj);
        createdRecordIds.projects.push(newPrj.id);
        importedRows++;
      }

      // 3. Process SUPERVISOR_DIRECTORY
      if (importType === 'SUPERVISOR_DIRECTORY') {
        const m = row.mapped;
        const supName = String(m.SUPERVISOR_NAME).trim().toUpperCase();
        const supId = m.SUPERVISOR_ID
          ? String(m.SUPERVISOR_ID).trim().toUpperCase()
          : `SUP-${String(newSupervisors.length + 1).padStart(3, '0')}`;

        const newSup: Supervisor = {
          id: `sup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          SUPERVISOR_ID: supId,
          SUPERVISOR_NAME: supName,
          PHONE: String(m.PHONE || '').trim(),
          EMAIL: String(m.EMAIL || '').trim(),
          ACTIVE: m.ACTIVE !== false && String(m.ACTIVE).toLowerCase() !== 'no' && String(m.ACTIVE).toLowerCase() !== 'false',
          OPENING_PETTY_CASH: Number(m.OPENING_PETTY_CASH) || 0,
          CURRENT_BALANCE: Number(m.OPENING_PETTY_CASH) || 0,
          DEFAULT_PROJECT: m.DEFAULT_PROJECT ? String(m.DEFAULT_PROJECT).trim().toUpperCase() : undefined,
          ASSIGNED_PROJECTS: m.DEFAULT_PROJECT ? [String(m.DEFAULT_PROJECT).trim().toUpperCase()] : [],
          REMARKS: m.REMARKS ? String(m.REMARKS).trim() : `Imported via Batch ${batchId}`,
          DATA_SOURCE: 'HISTORICAL_IMPORT',
          IMPORT_BATCH_ID: batchId,
          IMPORTED_BY: options.performedBy,
          IMPORTED_AT: timestamp,
          IS_HISTORICAL: true
        };

        if (row.isDuplicate && duplicateAction === 'UPDATE') {
          const idx = newSupervisors.findIndex(s => s.SUPERVISOR_NAME.toUpperCase() === supName || s.SUPERVISOR_ID.toUpperCase() === supId);
          if (idx !== -1) {
            previousSnapshot.updatedSupervisors.push({ ...newSupervisors[idx] });
            newSupervisors[idx] = { ...newSupervisors[idx], ...newSup, id: newSupervisors[idx].id, SUPERVISOR_ID: newSupervisors[idx].SUPERVISOR_ID };
            updatedRows++;
            return;
          }
        }

        newSupervisors.unshift(newSup);
        createdRecordIds.supervisors.push(newSup.id);
        importedRows++;
      }
    });

    const status = failedRows > 0 ? 'COMPLETED_WITH_WARNINGS' : 'COMPLETED';

    const batchRecord: ImportBatchRecord = {
      id: batchId,
      batchNumber: batchId,
      importType,
      fileName: options.fileName,
      fileSize: options.fileSize,
      totalRows: validatedSummary.totalRows,
      importedRows,
      updatedRows,
      skippedRows,
      failedRows,
      duplicateRows: validatedSummary.duplicatesCount,
      status,
      performedBy: options.performedBy,
      userRole: options.userRole,
      timestamp,
      errorDetails: allErrors,
      createdRecordIds,
      previousSnapshot
    };

    return {
      batchRecord,
      updatedExpenses: newExpenses,
      updatedProjects: newProjects,
      updatedSupervisors: newSupervisors
    };
  }

  /**
   * Execute bulk expense import with dedicated Admin approval controls
   */
  static executeExpenseBulkImportWithApproval(
    batchId: string,
    validatedSummary: ValidationSummary,
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
    },
    masterContext: {
      expenses: Expense[];
      projects: Project[];
      supervisors: Supervisor[];
    }
  ): {
    batchRecord: ImportBatchRecord;
    updatedExpenses: Expense[];
    updatedProjects: Project[];
    updatedSupervisors: Supervisor[];
    totalAmount: number;
  } {
    const timestamp = new Date().toISOString();
    let importedRows = 0;
    let updatedRows = 0;
    let skippedRows = 0;
    let failedRows = 0;
    let totalAmount = 0;

    let newExpenses = [...masterContext.expenses];
    let newProjects = [...masterContext.projects];
    let newSupervisors = [...masterContext.supervisors];

    const createdRecordIds: {
      expenses: string[];
      projects: string[];
      supervisors: string[];
    } = {
      expenses: [],
      projects: [],
      supervisors: []
    };

    const previousSnapshot: {
      updatedExpenses: Expense[];
      updatedProjects: Project[];
      updatedSupervisors: Supervisor[];
    } = {
      updatedExpenses: [],
      updatedProjects: [],
      updatedSupervisors: []
    };

    const allErrors: ImportErrorDetail[] = [];

    validatedSummary.validatedRows.forEach((row) => {
      if (!row.isValid) {
        failedRows++;
        allErrors.push(...row.errors);
        return;
      }

      if (row.isDuplicate) {
        if (options.duplicateAction === 'SKIP') {
          skippedRows++;
          return;
        }
        if (options.duplicateAction === 'CANCEL') {
          throw new Error(`Import cancelled due to duplicate record at row ${row.rowIndex}`);
        }
      }

      const m = row.mapped;
      const amountVal = Number(m.AMOUNT) || 0;
      totalAmount += amountVal;

      const dateObj = new Date();
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const seq = String(newExpenses.length + 1).padStart(4, '0');
      const generatedExpId = m.EXPENSES_ID && !row.isDuplicate
        ? String(m.EXPENSES_ID).trim()
        : `EXP-${yyyy}${mm}-${seq}`;

      const isApproved = options.approvalStatus === 'Approved';

      const newExp: Expense = {
        id: `exp_bulk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        EXPENSES_ID: generatedExpId,
        DATE_REF: m.DATE_REF || new Date().toISOString().slice(0, 10),
        DATE: m.DATE || '01/01/2026',
        SUPERVISOR: String(m.SUPERVISOR || '').trim().toUpperCase(),
        PROJECT: String(m.PROJECT || '').trim().toUpperCase(),
        EXPENSES_CATEGORY: String(m.EXPENSES_CATEGORY || '5000 Construction Materials').trim(),
        TRANSACTION_TYPE: 'PETTY_CASH_EXPENSE',
        AMOUNT: amountVal,
        EXPENSES_DESCRIPTION: String(m.EXPENSES_DESCRIPTION || '').trim(),
        PAYMENT_STATUS: isApproved ? 'Approved' : 'Pending',
        PAYMENT_SOURCE: String(m.PAYMENT_SOURCE || 'Petty Cash').trim(),
        PRV_NUMBER: m.PRV_NUMBER ? String(m.PRV_NUMBER).trim() : undefined,
        CREATED_BY: options.performedBy,
        CREATED_DATE: timestamp,
        APPROVED_BY: isApproved ? (options.approvedBy || options.performedBy || 'Admin Approval') : undefined,
        APPROVED_DATE: isApproved ? new Date().toLocaleString('en-GB') : undefined,
        REMARKS: options.approvalRemarks
          ? `[BULK IMPORT - ${isApproved ? 'APPROVED' : 'PENDING'}] ${options.approvalRemarks}`
          : `[BULK IMPORT - Batch ${batchId}]`,
        DATA_SOURCE: 'HISTORICAL_IMPORT',
        IMPORT_BATCH_ID: batchId,
        IMPORTED_BY: options.performedBy,
        IMPORTED_AT: timestamp,
        IS_HISTORICAL: false
      };

      if (row.isDuplicate && options.duplicateAction === 'UPDATE') {
        const idx = newExpenses.findIndex(
          e => (m.EXPENSES_ID && e.EXPENSES_ID === m.EXPENSES_ID) ||
               (m.PRV_NUMBER && e.PRV_NUMBER === m.PRV_NUMBER)
        );
        if (idx !== -1) {
          previousSnapshot.updatedExpenses.push({ ...newExpenses[idx] });
          newExpenses[idx] = { ...newExpenses[idx], ...newExp, id: newExpenses[idx].id };
          updatedRows++;
          return;
        }
      }

      newExpenses.unshift(newExp);
      createdRecordIds.expenses.push(newExp.id);
      importedRows++;

      // Auto-register supervisor if absent and option enabled
      const supName = newExp.SUPERVISOR;
      if (options.autoRegisterSupervisors !== false && supName && !newSupervisors.some(s => s.SUPERVISOR_NAME.toUpperCase() === supName)) {
        const autoSup: Supervisor = {
          id: `sup_auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          SUPERVISOR_ID: `SUP-AUTO-${String(newSupervisors.length + 1).padStart(3, '0')}`,
          SUPERVISOR_NAME: supName,
          PHONE: '',
          EMAIL: `${supName.toLowerCase().replace(/\s+/g, '')}@emagroup.lk`,
          ACTIVE: true,
          OPENING_PETTY_CASH: 0,
          CURRENT_BALANCE: 0,
          DEFAULT_PROJECT: newExp.PROJECT,
          DATA_SOURCE: 'HISTORICAL_IMPORT',
          IMPORT_BATCH_ID: batchId,
          IMPORTED_BY: options.performedBy,
          IMPORTED_AT: timestamp,
          IS_HISTORICAL: false,
          REMARKS: `Auto-registered via Bulk Expense Import Batch ${batchId}`
        };
        newSupervisors.push(autoSup);
        createdRecordIds.supervisors.push(autoSup.id);
      }

      // Auto-register project if absent and option enabled
      const prjCode = newExp.PROJECT;
      if (options.autoRegisterProjects !== false && prjCode && !newProjects.some(p => p.PROJECT_CODE.toUpperCase() === prjCode)) {
        const autoPrj: Project = {
          id: `prj_auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          PROJECT_ID: `PRJ-AUTO-${String(newProjects.length + 1).padStart(3, '0')}`,
          PROJECT_CODE: prjCode,
          PROJECT_NAME: `${prjCode} Site Project`,
          CLIENT: 'EMA Client',
          LOCATION: 'Site Location',
          CONTRACT_VALUE: 0,
          START_DATE: new Date().toISOString().slice(0, 10),
          END_DATE: '2026-12-31',
          STATUS: 'Active',
          PROJECT_MANAGER: 'Designated PM',
          BUDGET_PETTY_CASH: 500000,
          DATA_SOURCE: 'HISTORICAL_IMPORT',
          IMPORT_BATCH_ID: batchId,
          IMPORTED_BY: options.performedBy,
          IMPORTED_AT: timestamp,
          IS_HISTORICAL: false,
          REMARKS: `Auto-registered via Bulk Expense Import Batch ${batchId}`
        };
        newProjects.unshift(autoPrj);
        createdRecordIds.projects.push(autoPrj.id);
      }
    });

    const status: ImportBatchRecord['status'] =
      failedRows > 0 || allErrors.length > 0 ? 'COMPLETED_WITH_WARNINGS' : 'COMPLETED';

    const batchRecord: ImportBatchRecord = {
      id: batchId,
      batchNumber: batchId,
      importType: 'HISTORICAL_EXPENSES',
      fileName: options.fileName,
      fileSize: options.fileSize,
      totalRows: validatedSummary.totalRows,
      importedRows,
      updatedRows,
      skippedRows,
      failedRows,
      duplicateRows: validatedSummary.duplicatesCount,
      status,
      performedBy: options.performedBy,
      userRole: options.userRole,
      timestamp,
      errorDetails: allErrors,
      createdRecordIds,
      previousSnapshot
    };

    return {
      batchRecord,
      updatedExpenses: newExpenses,
      updatedProjects: newProjects,
      updatedSupervisors: newSupervisors,
      totalAmount
    };
  }

  /**
   * Execute bulk supervisor import with dedicated Admin controls
   */
  static executeSupervisorBulkImportWithApproval(
    batchId: string,
    validatedSummary: ValidationSummary,
    options: {
      performedBy: string;
      userRole: string;
      defaultActiveStatus?: boolean;
      approvalRemarks?: string;
      fileName: string;
      fileSize: string;
      skipInvalid: boolean;
      duplicateAction: DuplicateAction;
    },
    masterContext: {
      supervisors: Supervisor[];
      projects: Project[];
    }
  ): {
    batchRecord: ImportBatchRecord;
    updatedSupervisors: Supervisor[];
  } {
    const timestamp = new Date().toISOString();
    let importedRows = 0;
    let updatedRows = 0;
    let skippedRows = 0;
    let failedRows = 0;

    let newSupervisors = [...masterContext.supervisors];

    const createdRecordIds: { supervisors: string[] } = { supervisors: [] };
    const previousSnapshot: { updatedSupervisors: Supervisor[] } = { updatedSupervisors: [] };
    const allErrors: ImportErrorDetail[] = [];

    validatedSummary.validatedRows.forEach((row) => {
      if (!row.isValid) {
        failedRows++;
        allErrors.push(...row.errors);
        return;
      }

      if (row.isDuplicate) {
        if (options.duplicateAction === 'SKIP') {
          skippedRows++;
          return;
        }
        if (options.duplicateAction === 'CANCEL') {
          throw new Error(`Import cancelled due to duplicate supervisor: ${row.duplicateId}`);
        }
      }

      const m = row.mapped;
      const supName = String(m.SUPERVISOR_NAME).trim().toUpperCase();
      const supId = m.SUPERVISOR_ID && String(m.SUPERVISOR_ID).trim()
        ? String(m.SUPERVISOR_ID).trim().toUpperCase()
        : `SUP-${String(newSupervisors.length + 1).padStart(3, '0')}`;

      const openingFloat = Number(m.OPENING_PETTY_CASH) || 0;
      const isActive = options.defaultActiveStatus !== undefined
        ? options.defaultActiveStatus
        : (m.ACTIVE !== false && String(m.ACTIVE).toLowerCase() !== 'no' && String(m.ACTIVE).toLowerCase() !== 'false');

      const newSup: Supervisor = {
        id: `sup_bulk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        SUPERVISOR_ID: supId,
        SUPERVISOR_NAME: supName,
        PHONE: String(m.PHONE || '+94 77 000 0000').trim(),
        EMAIL: String(m.EMAIL || `${supName.toLowerCase().replace(/\s+/g, '')}@emagroup.lk`).trim(),
        ACTIVE: isActive,
        OPENING_PETTY_CASH: openingFloat,
        CURRENT_BALANCE: openingFloat,
        DEFAULT_PROJECT: m.DEFAULT_PROJECT ? String(m.DEFAULT_PROJECT).trim().toUpperCase() : (masterContext.projects[0]?.PROJECT_CODE || 'PIDM 26'),
        ASSIGNED_PROJECTS: m.DEFAULT_PROJECT ? [String(m.DEFAULT_PROJECT).trim().toUpperCase()] : [masterContext.projects[0]?.PROJECT_CODE || 'PIDM 26'],
        REMARKS: options.approvalRemarks
          ? `[ADMIN IMPORT] ${options.approvalRemarks}`
          : (m.REMARKS ? String(m.REMARKS).trim() : `Imported via Batch ${batchId}`),
        DATA_SOURCE: 'HISTORICAL_IMPORT',
        IMPORT_BATCH_ID: batchId,
        IMPORTED_BY: options.performedBy,
        IMPORTED_AT: timestamp,
        IS_HISTORICAL: false
      };

      if (row.isDuplicate && options.duplicateAction === 'UPDATE') {
        const idx = newSupervisors.findIndex(
          s => s.SUPERVISOR_NAME.toUpperCase() === supName || s.SUPERVISOR_ID.toUpperCase() === supId
        );
        if (idx !== -1) {
          previousSnapshot.updatedSupervisors.push({ ...newSupervisors[idx] });
          newSupervisors[idx] = {
            ...newSupervisors[idx],
            ...newSup,
            id: newSupervisors[idx].id,
            SUPERVISOR_ID: newSupervisors[idx].SUPERVISOR_ID
          };
          updatedRows++;
          return;
        }
      }

      newSupervisors.unshift(newSup);
      createdRecordIds.supervisors.push(newSup.id);
      importedRows++;
    });

    const status: ImportBatchRecord['status'] =
      failedRows > 0 || allErrors.length > 0 ? 'COMPLETED_WITH_WARNINGS' : 'COMPLETED';

    const batchRecord: ImportBatchRecord = {
      id: batchId,
      batchNumber: batchId,
      importType: 'SUPERVISOR_DIRECTORY',
      fileName: options.fileName,
      fileSize: options.fileSize,
      totalRows: validatedSummary.totalRows,
      importedRows,
      updatedRows,
      skippedRows,
      failedRows,
      duplicateRows: validatedSummary.duplicatesCount,
      status,
      performedBy: options.performedBy,
      userRole: options.userRole,
      timestamp,
      errorDetails: allErrors,
      createdRecordIds,
      previousSnapshot
    };

    return {
      batchRecord,
      updatedSupervisors: newSupervisors
    };
  }

  /**
   * Execute bulk project master import with dedicated Admin controls
   */
  static executeProjectBulkImportWithApproval(
    batchId: string,
    validatedSummary: ValidationSummary,
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
    },
    masterContext: {
      projects: Project[];
    }
  ): {
    batchRecord: ImportBatchRecord;
    updatedProjects: Project[];
    totalContractValue: number;
  } {
    const timestamp = new Date().toISOString();
    let importedRows = 0;
    let updatedRows = 0;
    let skippedRows = 0;
    let failedRows = 0;
    let totalContractValue = 0;

    let newProjects = [...masterContext.projects];

    const createdRecordIds: { projects: string[] } = { projects: [] };
    const previousSnapshot: { updatedProjects: Project[] } = { updatedProjects: [] };
    const allErrors: ImportErrorDetail[] = [];

    validatedSummary.validatedRows.forEach((row) => {
      if (!row.isValid) {
        failedRows++;
        allErrors.push(...row.errors);
        return;
      }

      if (row.isDuplicate) {
        if (options.duplicateAction === 'SKIP') {
          skippedRows++;
          return;
        }
        if (options.duplicateAction === 'CANCEL') {
          throw new Error(`Import cancelled due to duplicate project: ${row.duplicateId}`);
        }
      }

      const m = row.mapped;
      const projectCode = String(m.PROJECT_CODE).trim().toUpperCase();
      const contractVal = Number(m.CONTRACT_VALUE) || 0;
      totalContractValue += contractVal;

      const newPrj: Project = {
        id: `prj_bulk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        PROJECT_ID: `PRJ-${String(newProjects.length + 1).padStart(3, '0')}`,
        PROJECT_CODE: projectCode,
        PROJECT_NAME: String(m.PROJECT_NAME || projectCode).trim(),
        CLIENT: String(m.CLIENT || 'Road Development Authority (RDA)').trim(),
        LOCATION: String(m.LOCATION || 'Sri Lanka').trim(),
        CONTRACT_VALUE: contractVal,
        START_DATE: m.START_DATE ? String(m.START_DATE).trim() : new Date().toISOString().slice(0, 10),
        END_DATE: m.END_DATE ? String(m.END_DATE).trim() : '2026-12-31',
        STATUS: options.defaultStatus || (m.STATUS as any) || 'Active',
        PROJECT_MANAGER: String(m.PROJECT_MANAGER || 'Designated Project Engineer').trim(),
        BUDGET_PETTY_CASH: Number(m.BUDGET_PETTY_CASH) || options.defaultPettyCashBudget || 1500000,
        REMARKS: options.approvalRemarks
          ? `[ADMIN IMPORT] ${options.approvalRemarks}`
          : (m.REMARKS ? String(m.REMARKS).trim() : `Imported via Batch ${batchId}`),
        DATA_SOURCE: 'HISTORICAL_IMPORT',
        IMPORT_BATCH_ID: batchId,
        IMPORTED_BY: options.performedBy,
        IMPORTED_AT: timestamp,
        IS_HISTORICAL: false
      };

      if (row.isDuplicate && options.duplicateAction === 'UPDATE') {
        const idx = newProjects.findIndex(p => p.PROJECT_CODE.toUpperCase() === projectCode);
        if (idx !== -1) {
          previousSnapshot.updatedProjects.push({ ...newProjects[idx] });
          newProjects[idx] = {
            ...newProjects[idx],
            ...newPrj,
            id: newProjects[idx].id,
            PROJECT_ID: newProjects[idx].PROJECT_ID
          };
          updatedRows++;
          return;
        }
      }

      newProjects.unshift(newPrj);
      createdRecordIds.projects.push(newPrj.id);
      importedRows++;
    });

    const status: ImportBatchRecord['status'] =
      failedRows > 0 || allErrors.length > 0 ? 'COMPLETED_WITH_WARNINGS' : 'COMPLETED';

    const batchRecord: ImportBatchRecord = {
      id: batchId,
      batchNumber: batchId,
      importType: 'PROJECT_DIRECTORY',
      fileName: options.fileName,
      fileSize: options.fileSize,
      totalRows: validatedSummary.totalRows,
      importedRows,
      updatedRows,
      skippedRows,
      failedRows,
      duplicateRows: validatedSummary.duplicatesCount,
      status,
      performedBy: options.performedBy,
      userRole: options.userRole,
      timestamp,
      errorDetails: allErrors,
      createdRecordIds,
      previousSnapshot
    };

    return {
      batchRecord,
      updatedProjects: newProjects,
      totalContractValue
    };
  }

  /**
   * Execute bulk income/top-up import with dedicated Admin approval controls
   */
  static executeIncomeBulkImportWithApproval(
    batchId: string,
    validatedSummary: ValidationSummary,
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
    },
    masterContext: {
      income: Income[];
      supervisors: Supervisor[];
      projects: Project[];
    }
  ): {
    batchRecord: ImportBatchRecord;
    updatedIncome: Income[];
    updatedSupervisors: Supervisor[];
    updatedProjects: Project[];
    totalAmount: number;
  } {
    const timestamp = new Date().toISOString();
    let importedRows = 0;
    let updatedRows = 0;
    let skippedRows = 0;
    let failedRows = 0;
    let totalAmount = 0;

    let newIncome = [...masterContext.income];
    let newSupervisors = [...masterContext.supervisors];
    let newProjects = [...masterContext.projects];

    const createdRecordIds: {
      income: string[];
      supervisors: string[];
      projects: string[];
    } = {
      income: [],
      supervisors: [],
      projects: []
    };

    const previousSnapshot: {
      updatedIncome: Income[];
      updatedSupervisors: Supervisor[];
      updatedProjects: Project[];
    } = {
      updatedIncome: [],
      updatedSupervisors: [],
      updatedProjects: []
    };

    const allErrors: ImportErrorDetail[] = [];

    validatedSummary.validatedRows.forEach((row) => {
      if (!row.isValid) {
        failedRows++;
        allErrors.push(...row.errors);
        return;
      }

      if (row.isDuplicate) {
        if (options.duplicateAction === 'SKIP') {
          skippedRows++;
          return;
        }
        if (options.duplicateAction === 'CANCEL') {
          throw new Error(`Import cancelled due to duplicate income: ${row.duplicateId}`);
        }
      }

      const m = row.mapped;
      const amountVal = Number(m.AMOUNT) || 0;
      totalAmount += amountVal;

      const dateObj = new Date();
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const seq = String(newIncome.length + 1).padStart(4, '0');
      const generatedIncId = m.INCOME_ID && !row.isDuplicate
        ? String(m.INCOME_ID).trim()
        : `INC-${yyyy}${mm}-${seq}`;

      const newInc: Income = {
        id: `inc_bulk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        INCOME_ID: generatedIncId,
        DATE_REF: m.DATE_REF || new Date().toISOString().slice(0, 10),
        DATE: m.DATE || '01/01/2026',
        SUPERVISOR: String(m.SUPERVISOR || '').trim().toUpperCase(),
        PROJECT: String(m.PROJECT || '').trim().toUpperCase(),
        INCOME_SOURCE: (m.INCOME_SOURCE as any) || 'Bank Transfer to Custodian',
        TRANSACTION_TYPE: (m.TRANSACTION_TYPE as any) || 'FLOAT_TOPUP',
        AMOUNT: amountVal,
        CREATED_BY: options.performedBy,
        CREATED_DATE: timestamp,
        REMARKS: options.approvalRemarks
          ? `[ADMIN TOP-UP IMPORT] ${options.approvalRemarks}`
          : (m.REMARKS ? String(m.REMARKS).trim() : `Imported via Batch ${batchId}`)
      };

      if (row.isDuplicate && options.duplicateAction === 'UPDATE') {
        const idx = newIncome.findIndex(
          inc => m.INCOME_ID && inc.INCOME_ID.toUpperCase() === m.INCOME_ID.toUpperCase()
        );
        if (idx !== -1) {
          previousSnapshot.updatedIncome.push({ ...newIncome[idx] });
          newIncome[idx] = { ...newIncome[idx], ...newInc, id: newIncome[idx].id };
          updatedRows++;
          return;
        }
      }

      newIncome.unshift(newInc);
      createdRecordIds.income.push(newInc.id);
      importedRows++;

      // Auto-register supervisor if absent and option enabled
      const supName = newInc.SUPERVISOR;
      if (options.autoRegisterSupervisors !== false && supName && !newSupervisors.some(s => s.SUPERVISOR_NAME.toUpperCase() === supName)) {
        const autoSup: Supervisor = {
          id: `sup_auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          SUPERVISOR_ID: `SUP-AUTO-${String(newSupervisors.length + 1).padStart(3, '0')}`,
          SUPERVISOR_NAME: supName,
          PHONE: '',
          EMAIL: `${supName.toLowerCase().replace(/\s+/g, '')}@emagroup.lk`,
          ACTIVE: true,
          OPENING_PETTY_CASH: 0,
          CURRENT_BALANCE: amountVal,
          DEFAULT_PROJECT: newInc.PROJECT,
          DATA_SOURCE: 'HISTORICAL_IMPORT',
          IMPORT_BATCH_ID: batchId,
          IMPORTED_BY: options.performedBy,
          IMPORTED_AT: timestamp,
          IS_HISTORICAL: false,
          REMARKS: `Auto-registered via Bulk Income Top-up Batch ${batchId}`
        };
        newSupervisors.push(autoSup);
        createdRecordIds.supervisors.push(autoSup.id);
      }

      // Auto-register project if absent and option enabled
      const prjCode = newInc.PROJECT;
      if (options.autoRegisterProjects !== false && prjCode && !newProjects.some(p => p.PROJECT_CODE.toUpperCase() === prjCode)) {
        const autoPrj: Project = {
          id: `prj_auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          PROJECT_ID: `PRJ-AUTO-${String(newProjects.length + 1).padStart(3, '0')}`,
          PROJECT_CODE: prjCode,
          PROJECT_NAME: `${prjCode} Site Project`,
          CLIENT: 'Road Development Authority (RDA)',
          LOCATION: 'Site Location',
          CONTRACT_VALUE: 0,
          START_DATE: new Date().toISOString().slice(0, 10),
          END_DATE: '2026-12-31',
          STATUS: 'Active',
          PROJECT_MANAGER: 'Designated PM',
          BUDGET_PETTY_CASH: 1000000,
          DATA_SOURCE: 'HISTORICAL_IMPORT',
          IMPORT_BATCH_ID: batchId,
          IMPORTED_BY: options.performedBy,
          IMPORTED_AT: timestamp,
          IS_HISTORICAL: false,
          REMARKS: `Auto-registered via Bulk Income Top-up Batch ${batchId}`
        };
        newProjects.unshift(autoPrj);
        createdRecordIds.projects.push(autoPrj.id);
      }
    });

    const status: ImportBatchRecord['status'] =
      failedRows > 0 || allErrors.length > 0 ? 'COMPLETED_WITH_WARNINGS' : 'COMPLETED';

    const batchRecord: ImportBatchRecord = {
      id: batchId,
      batchNumber: batchId,
      importType: 'HISTORICAL_INCOME',
      fileName: options.fileName,
      fileSize: options.fileSize,
      totalRows: validatedSummary.totalRows,
      importedRows,
      updatedRows,
      skippedRows,
      failedRows,
      duplicateRows: validatedSummary.duplicatesCount,
      status,
      performedBy: options.performedBy,
      userRole: options.userRole,
      timestamp,
      errorDetails: allErrors,
      createdRecordIds,
      previousSnapshot
    };

    return {
      batchRecord,
      updatedIncome: newIncome,
      updatedSupervisors: newSupervisors,
      updatedProjects: newProjects,
      totalAmount
    };
  }

  /**
   * Execute bulk project invoice import with full VAT, receivable accounting & admin audit
   */
  static executeInvoiceBulkImport(
    batchId: string,
    validatedSummary: ValidationSummary,
    options: {
      performedBy: string;
      userRole: string;
      approvalRemarks?: string;
      fileName: string;
      fileSize: string;
      skipInvalid: boolean;
      duplicateAction: DuplicateAction;
      autoRegisterProjects?: boolean;
    },
    masterContext: {
      income: Income[];
      projects: Project[];
    }
  ): {
    batchRecord: ImportBatchRecord;
    updatedIncome: Income[];
    updatedProjects: Project[];
    totalGross: number;
    totalNet: number;
    totalVat: number;
    totalReceived: number;
  } {
    const timestamp = new Date().toISOString();
    let importedRows = 0;
    let updatedRows = 0;
    let skippedRows = 0;
    let failedRows = 0;
    let totalGross = 0;
    let totalNet = 0;
    let totalVat = 0;
    let totalReceived = 0;

    let newIncome = [...masterContext.income];
    let newProjects = [...masterContext.projects];

    const createdRecordIds: {
      income: string[];
      supervisors: string[];
      projects: string[];
    } = {
      income: [],
      supervisors: [],
      projects: []
    };

    const previousSnapshot: {
      updatedIncome: Income[];
      updatedSupervisors: Supervisor[];
      updatedProjects: Project[];
    } = {
      updatedIncome: [],
      updatedSupervisors: [],
      updatedProjects: []
    };

    const allErrors: ImportErrorDetail[] = [];

    validatedSummary.validatedRows.forEach((row) => {
      if (!row.isValid) {
        failedRows++;
        allErrors.push(...row.errors);
        return;
      }

      if (row.isDuplicate) {
        if (options.duplicateAction === 'SKIP') {
          skippedRows++;
          return;
        }
        if (options.duplicateAction === 'CANCEL') {
          throw new Error(`Import cancelled due to duplicate invoice reference: ${row.duplicateId}`);
        }
      }

      const m = row.mapped;
      const invNumber = String(m.INVOICE_NUMBER || '').trim();
      const dateObj = new Date();
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const seq = String(newIncome.length + 1).padStart(4, '0');

      const generatedIncId = invNumber
        ? (invNumber.startsWith('INC-') ? invNumber : `INC-INV-${invNumber.replace(/[^a-zA-Z0-9_-]/g, '')}`)
        : `INC-${yyyy}${mm}-${seq}`;

      const netVal = Number(m.NET_AMOUNT) || 0;
      const vatVal = Number(m.CALCULATED_VAT) || 0;
      const grossVal = Number(m.CALCULATED_GROSS) || (netVal + vatVal);
      const receivedVal = Number(m.AMOUNT_RECEIVED) || 0;
      const dueVal = Number(m.BALANCE_DUE) !== undefined ? Number(m.BALANCE_DUE) : Math.max(0, grossVal - receivedVal);

      totalGross += grossVal;
      totalNet += netVal;
      totalVat += vatVal;
      totalReceived += receivedVal;

      const invoiceDateIso = m.INVOICE_DATE_ISO || new Date().toISOString().slice(0, 10);
      const invoiceDateDisplay = m.INVOICE_DATE_DISPLAY || new Date().toLocaleDateString('en-GB');

      let dueDateIso = m.DUE_DATE_ISO;
      if (!dueDateIso) {
        const d = new Date(invoiceDateIso);
        d.setDate(d.getDate() + 30);
        dueDateIso = d.toISOString().slice(0, 10);
      }

      const clientName = String(m.CLIENT_NAME || '').trim() || 'Client Organization';
      const prjCode = String(m.PROJECT || '').trim().toUpperCase();

      const newInv: Income = {
        id: `inv_bulk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        INCOME_ID: generatedIncId,
        invoiceNumber: invNumber || generatedIncId,
        clientName: clientName,
        clientCode: clientName.substring(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, ''),
        billingDescription: String(m.BILLING_DESCRIPTION || '').trim(),
        invoiceDescription: String(m.BILLING_DESCRIPTION || '').trim(),
        invoiceDate: invoiceDateIso,
        dueDate: dueDateIso,
        netAmount: netVal,
        vatTreatment: (m.VAT_TREATMENT as any) || 'EXCLUDING_VAT',
        vatRate: Number(m.VAT_RATE) || 18,
        vatAmount: vatVal,
        grossAmount: grossVal,
        amountReceived: receivedVal,
        balanceDue: dueVal,
        paymentStatus: (m.PAYMENT_STATUS as any) || (dueVal <= 0 ? 'Paid' : receivedVal > 0 ? 'Partially Paid' : 'Approved'),
        paymentDate: m.PAYMENT_DATE_ISO,
        paymentReference: m.PAYMENT_REFERENCE ? String(m.PAYMENT_REFERENCE).trim() : undefined,

        // Base Income fields for system reconciliation
        DATE_REF: invoiceDateIso,
        DATE: invoiceDateDisplay,
        SUPERVISOR: String(m.SUPERVISOR || 'FINANCE_DIRECTOR').trim().toUpperCase(),
        PROJECT: prjCode,
        INCOME_SOURCE: 'Project Income / Invoice',
        TRANSACTION_TYPE: 'PROJECT_INVOICE_INCOME',
        AMOUNT: grossVal,
        CREATED_BY: options.performedBy,
        CREATED_DATE: timestamp,
        REMARKS: options.approvalRemarks
          ? `[INVOICE BULK IMPORT] ${options.approvalRemarks}`
          : (m.REMARKS ? String(m.REMARKS).trim() : `Imported via Invoice Batch ${batchId}`)
      };

      if (row.isDuplicate && options.duplicateAction === 'UPDATE') {
        const idx = newIncome.findIndex(
          inc => (inc.invoiceNumber && inc.invoiceNumber.toUpperCase() === invNumber.toUpperCase()) ||
                 (inc.INCOME_ID && inc.INCOME_ID.toUpperCase() === generatedIncId.toUpperCase())
        );
        if (idx !== -1) {
          previousSnapshot.updatedIncome.push({ ...newIncome[idx] });
          newIncome[idx] = { ...newIncome[idx], ...newInv, id: newIncome[idx].id };
          updatedRows++;
          return;
        }
      }

      newIncome.unshift(newInv);
      createdRecordIds.income.push(newInv.id);
      importedRows++;

      // Auto-register project if absent and option enabled
      if (options.autoRegisterProjects !== false && prjCode && !newProjects.some(p => p.PROJECT_CODE.toUpperCase() === prjCode)) {
        const autoPrj: Project = {
          id: `prj_auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          PROJECT_ID: `PRJ-AUTO-${String(newProjects.length + 1).padStart(3, '0')}`,
          PROJECT_CODE: prjCode,
          PROJECT_NAME: `${prjCode} Client Project`,
          CLIENT: clientName,
          LOCATION: 'Site Location',
          CONTRACT_VALUE: grossVal * 4,
          START_DATE: invoiceDateIso,
          END_DATE: '2026-12-31',
          STATUS: 'Active',
          DATA_SOURCE: 'HISTORICAL_IMPORT',
          IMPORT_BATCH_ID: batchId,
          IMPORTED_BY: options.performedBy,
          IMPORTED_AT: timestamp,
          IS_HISTORICAL: false,
          REMARKS: `Auto-registered via Project Invoice Bulk Batch ${batchId}`
        };
        newProjects.push(autoPrj);
        createdRecordIds.projects.push(autoPrj.id);
      }
    });

    const status: ImportBatchRecord['status'] =
      failedRows > 0 || allErrors.length > 0 ? 'COMPLETED_WITH_WARNINGS' : 'COMPLETED';

    const batchRecord: ImportBatchRecord = {
      id: batchId,
      batchNumber: batchId,
      importType: 'PROJECT_INVOICES',
      fileName: options.fileName,
      fileSize: options.fileSize,
      totalRows: validatedSummary.totalRows,
      importedRows,
      updatedRows,
      skippedRows,
      failedRows,
      duplicateRows: validatedSummary.duplicatesCount,
      status,
      performedBy: options.performedBy,
      userRole: options.userRole,
      timestamp,
      errorDetails: allErrors,
      createdRecordIds,
      previousSnapshot
    };

    return {
      batchRecord,
      updatedIncome: newIncome,
      updatedProjects: newProjects,
      totalGross,
      totalNet,
      totalVat,
      totalReceived
    };
  }

  /**
   * Rollback an imported batch safely
   */
  static rollbackBatch(
    batch: ImportBatchRecord,
    performedBy: string,
    currentData: {
      expenses: Expense[];
      projects: Project[];
      supervisors: Supervisor[];
      income?: Income[];
    }
  ): {
    rolledBackBatch: ImportBatchRecord;
    updatedExpenses: Expense[];
    updatedProjects: Project[];
    updatedSupervisors: Supervisor[];
    updatedIncome?: Income[];
  } {
    const batchId = batch.id;
    const created = batch.createdRecordIds || {};
    const previous = batch.previousSnapshot || {};

    // Remove created expenses
    let expenses = currentData.expenses.filter(
      e => e.IMPORT_BATCH_ID !== batchId && !(created.expenses && created.expenses.includes(e.id))
    );
    // Restore updated expenses
    if (previous.updatedExpenses && previous.updatedExpenses.length > 0) {
      previous.updatedExpenses.forEach(prevExp => {
        const idx = expenses.findIndex(e => e.id === prevExp.id);
        if (idx !== -1) {
          expenses[idx] = prevExp;
        } else {
          expenses.push(prevExp);
        }
      });
    }

    // Remove created projects
    let projects = currentData.projects.filter(
      p => p.IMPORT_BATCH_ID !== batchId && !(created.projects && created.projects.includes(p.id))
    );
    if (previous.updatedProjects && previous.updatedProjects.length > 0) {
      previous.updatedProjects.forEach(prevPrj => {
        const idx = projects.findIndex(p => p.id === prevPrj.id);
        if (idx !== -1) projects[idx] = prevPrj;
        else projects.push(prevPrj);
      });
    }

    // Remove created supervisors
    let supervisors = currentData.supervisors.filter(
      s => s.IMPORT_BATCH_ID !== batchId && !(created.supervisors && created.supervisors.includes(s.id))
    );
    if (previous.updatedSupervisors && previous.updatedSupervisors.length > 0) {
      previous.updatedSupervisors.forEach(prevSup => {
        const idx = supervisors.findIndex(s => s.id === prevSup.id);
        if (idx !== -1) supervisors[idx] = prevSup;
        else supervisors.push(prevSup);
      });
    }

    // Remove created income
    let incomeList = (currentData.income || []).filter(
      inc => !(created.income && created.income.includes(inc.id))
    );
    if (previous.updatedIncome && previous.updatedIncome.length > 0) {
      previous.updatedIncome.forEach(prevInc => {
        const idx = incomeList.findIndex(inc => inc.id === prevInc.id);
        if (idx !== -1) incomeList[idx] = prevInc;
        else incomeList.push(prevInc);
      });
    }

    const rolledBackBatch: ImportBatchRecord = {
      ...batch,
      status: 'ROLLED_BACK',
      rollbackTimestamp: new Date().toISOString(),
      rollbackBy: performedBy
    };

    return {
      rolledBackBatch,
      updatedExpenses: expenses,
      updatedProjects: projects,
      updatedSupervisors: supervisors,
      updatedIncome: incomeList
    };
  }

  /**
   * Generate Downloadable Excel / CSV Sample Templates
   */
  static downloadTemplate(importType: ImportType, format: 'xlsx' | 'csv' = 'xlsx'): void {
    let headers: string[] = [];
    let sampleData: Record<string, any>[] = [];
    let fileName = '';
    let colWidths: { wch: number }[] = [];
    let validationRules: Record<string, string>[] = [];

    if (importType === 'HISTORICAL_EXPENSES') {
      fileName = `EMA_Historical_Expenses_Template.${format}`;
      headers = [
        'Expense ID',
        'Date',
        'Supervisor',
        'Project',
        'Expense Category',
        'Description',
        'Amount',
        'Payment Source',
        'Voucher No',
        'Payment Status',
        'Remarks'
      ];
      colWidths = [
        { wch: 16 }, // Expense ID
        { wch: 14 }, // Date
        { wch: 18 }, // Supervisor
        { wch: 16 }, // Project
        { wch: 30 }, // Category
        { wch: 45 }, // Description
        { wch: 14 }, // Amount
        { wch: 22 }, // Payment Source
        { wch: 18 }, // Voucher No
        { wch: 16 }, // Payment Status
        { wch: 35 }  // Remarks
      ];
      sampleData = [
        {
          'Expense ID': 'EXP-2024-0001',
          'Date': '15/01/2024',
          'Supervisor': 'BUDDIKA',
          'Project': 'PIDM 26',
          'Expense Category': '5000 Construction Materials',
          'Description': 'Purchased emergency bindings and cutting discs',
          'Amount': 18500,
          'Payment Source': 'Petty Cash',
          'Voucher No': 'PRV-2024-010',
          'Payment Status': 'Approved',
          'Remarks': 'Original historical voucher batch #1'
        },
        {
          'Expense ID': 'EXP-2024-0002',
          'Date': '18/01/2024',
          'Supervisor': 'KASUN',
          'Project': 'HAVELOCK',
          'Expense Category': '5003 Transport & Site Freight',
          'Description': 'Crane truck hire for steel delivery transport',
          'Amount': 35000,
          'Payment Source': 'Direct Bank Transfer',
          'Voucher No': 'PRV-2024-011',
          'Payment Status': 'Approved',
          'Remarks': 'Site logistics receipt attached'
        },
        {
          'Expense ID': 'EXP-2024-0003',
          'Date': '22/01/2024',
          'Supervisor': 'PRADEEP',
          'Project': 'TRILLIUM',
          'Expense Category': '5002 Site Safety & PPE',
          'Description': 'Safety helmets, harnesses and site gloves',
          'Amount': 22400,
          'Payment Source': 'Petty Cash',
          'Voucher No': 'PRV-2024-012',
          'Payment Status': 'Approved',
          'Remarks': 'Quarterly PPE batch'
        },
        {
          'Expense ID': 'EXP-2024-0004',
          'Date': '25/01/2024',
          'Supervisor': 'BUDDIKA',
          'Project': 'PIDM 26',
          'Expense Category': '5001 Fuel & Transport',
          'Description': 'Diesel fuel for site backup generator (50 Liters)',
          'Amount': 19250,
          'Payment Source': 'Petty Cash',
          'Voucher No': 'PRV-2024-013',
          'Payment Status': 'Approved',
          'Remarks': 'Fuel pump receipt #7741'
        },
        {
          'Expense ID': 'EXP-2024-0005',
          'Date': '29/01/2024',
          'Supervisor': 'NUWAN',
          'Project': 'MARINA',
          'Expense Category': '5006 Casual Labor Wage',
          'Description': 'Site cleanup and scaffolding unloading wages (2 workers)',
          'Amount': 12000,
          'Payment Source': 'Petty Cash',
          'Voucher No': 'PRV-2024-014',
          'Payment Status': 'Approved',
          'Remarks': 'Casual labor signoff sheet attached'
        }
      ];

      validationRules = [
        {
          'Field Name': 'Expense ID',
          'Required?': 'Optional',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Unique ID string. If left blank, EMA auto-generates a historical voucher code (e.g. HIST-EXP-xxxx).',
          'Example / Valid Options': 'EXP-2024-0001, PV-1029'
        },
        {
          'Field Name': 'Date',
          'Required?': 'REQUIRED',
          'Data Type': 'Date',
          'Validation Rules & Format': 'Must be in DD/MM/YYYY or YYYY-MM-DD format (e.g., 15/04/2024 or 2024-04-15).',
          'Example / Valid Options': '15/01/2024, 2024-01-15'
        },
        {
          'Field Name': 'Supervisor',
          'Required?': 'REQUIRED',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Name of site supervisor responsible for disbursement. Should match supervisor directory.',
          'Example / Valid Options': 'BUDDIKA, KASUN, PRADEEP, NUWAN'
        },
        {
          'Field Name': 'Project',
          'Required?': 'REQUIRED',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Project Code or Name. Matched against active Project Directory.',
          'Example / Valid Options': 'PIDM 26, HAVELOCK, TRILLIUM, MARINA'
        },
        {
          'Field Name': 'Expense Category',
          'Required?': 'REQUIRED',
          'Data Type': 'Text',
          'Validation Rules & Format': 'GL Code or Category name. If omitted, defaults to "5000 Construction Materials".',
          'Example / Valid Options': '5000 Construction Materials, 5001 Fuel & Transport, 5002 Site Safety & PPE, 5003 Transport & Site Freight, 5004 Tools & Equipment, 5005 Food & Refreshment, 5006 Casual Labor Wage'
        },
        {
          'Field Name': 'Description',
          'Required?': 'REQUIRED',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Detailed purpose or particulars of expense. Non-empty string.',
          'Example / Valid Options': 'Purchased emergency binding wire and cutting discs'
        },
        {
          'Field Name': 'Amount',
          'Required?': 'REQUIRED',
          'Data Type': 'Numeric (LKR)',
          'Validation Rules & Format': 'Positive numeric value without currency symbols or commas.',
          'Example / Valid Options': '18500, 35000.50'
        },
        {
          'Field Name': 'Payment Source',
          'Required?': 'Optional',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Disbursement source. Defaults to "Historical / Not Specified".',
          'Example / Valid Options': 'Petty Cash, Direct Bank Transfer, Cheque'
        },
        {
          'Field Name': 'Voucher No',
          'Required?': 'Optional',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Physical PRV voucher reference number.',
          'Example / Valid Options': 'PRV-2024-010'
        },
        {
          'Field Name': 'Payment Status',
          'Required?': 'Optional',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Status of voucher. Defaults to "Approved".',
          'Example / Valid Options': 'Approved, Paid, Reimbursed, Pending'
        },
        {
          'Field Name': 'Remarks',
          'Required?': 'Optional',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Audit notes or memo.',
          'Example / Valid Options': 'Historical batch migration 2024'
        }
      ];
    } else if (importType === 'PROJECT_DIRECTORY') {
      fileName = `EMA_Project_Directory_Template.${format}`;
      headers = [
        'Project Code',
        'Project Name',
        'Client',
        'Location',
        'Contract Value',
        'Start Date',
        'Completion Date',
        'Status',
        'Project Manager',
        'Petty Cash Budget',
        'Remarks'
      ];
      colWidths = [
        { wch: 16 }, // Project Code
        { wch: 36 }, // Project Name
        { wch: 30 }, // Client
        { wch: 20 }, // Location
        { wch: 18 }, // Contract Value
        { wch: 14 }, // Start Date
        { wch: 16 }, // Completion Date
        { wch: 14 }, // Status
        { wch: 24 }, // Project Manager
        { wch: 18 }, // Petty Cash Budget
        { wch: 35 }  // Remarks
      ];
      sampleData = [
        {
          'Project Code': 'PIDM 26',
          'Project Name': 'PIDM Residencies High Rise Phase 2',
          'Client': 'Prime Lands Residencies PLC',
          'Location': 'Colombo 07',
          'Contract Value': 450000000,
          'Start Date': '2024-01-10',
          'Completion Date': '2026-12-31',
          'Status': 'Active',
          'Project Manager': 'Eng. Kamal Perera',
          'Petty Cash Budget': 1500000,
          'Remarks': '32-story residential tower contract'
        },
        {
          'Project Code': 'HAVELOCK',
          'Project Name': 'Havelock City Commercial Complex',
          'Client': 'Havelock City Properties',
          'Location': 'Colombo 05',
          'Contract Value': 320000000,
          'Start Date': '2024-03-01',
          'Completion Date': '2025-11-30',
          'Status': 'Active',
          'Project Manager': 'Eng. Samantha Silva',
          'Petty Cash Budget': 1200000,
          'Remarks': 'Commercial & MEP works'
        },
        {
          'Project Code': 'TRILLIUM',
          'Project Name': 'Trillium Residencies Superstructure',
          'Client': 'Trillium Property Holdings',
          'Location': 'Colombo 08',
          'Contract Value': 280000000,
          'Start Date': '2024-02-15',
          'Completion Date': '2025-08-31',
          'Status': 'Active',
          'Project Manager': 'Eng. Nalin Jayasuriya',
          'Petty Cash Budget': 950000,
          'Remarks': 'Structural concrete works'
        }
      ];

      validationRules = [
        {
          'Field Name': 'Project Code',
          'Required?': 'REQUIRED',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Unique project short-code / primary key. Cannot be duplicate unless update policy is chosen.',
          'Example / Valid Options': 'PIDM 26, HAVELOCK, TRILLIUM'
        },
        {
          'Field Name': 'Project Name',
          'Required?': 'REQUIRED',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Full project name/title.',
          'Example / Valid Options': 'PIDM Residencies High Rise Phase 2'
        },
        {
          'Field Name': 'Client',
          'Required?': 'Optional',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Client company name.',
          'Example / Valid Options': 'Prime Lands Residencies PLC'
        },
        {
          'Field Name': 'Location',
          'Required?': 'Optional',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Site city or address.',
          'Example / Valid Options': 'Colombo 07, Kandy, Galle'
        },
        {
          'Field Name': 'Contract Value',
          'Required?': 'Optional',
          'Data Type': 'Numeric (LKR)',
          'Validation Rules & Format': 'Total contract sum in LKR.',
          'Example / Valid Options': '450000000'
        },
        {
          'Field Name': 'Start Date',
          'Required?': 'Optional',
          'Data Type': 'Date',
          'Validation Rules & Format': 'YYYY-MM-DD or DD/MM/YYYY.',
          'Example / Valid Options': '2024-01-10'
        },
        {
          'Field Name': 'Completion Date',
          'Required?': 'Optional',
          'Data Type': 'Date',
          'Validation Rules & Format': 'YYYY-MM-DD or DD/MM/YYYY.',
          'Example / Valid Options': '2026-12-31'
        },
        {
          'Field Name': 'Status',
          'Required?': 'Optional',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Active, Planning, On Hold, Completed.',
          'Example / Valid Options': 'Active'
        },
        {
          'Field Name': 'Petty Cash Budget',
          'Required?': 'Optional',
          'Data Type': 'Numeric (LKR)',
          'Validation Rules & Format': 'Approved petty cash monthly allocation ceiling.',
          'Example / Valid Options': '1500000'
        }
      ];
    } else if (importType === 'SUPERVISOR_DIRECTORY') {
      fileName = `EMA_Supervisor_Directory_Template.${format}`;
      headers = [
        'Supervisor ID',
        'Full Name',
        'Mobile',
        'Email',
        'Opening Float',
        'Assigned Project Code',
        'Active',
        'Remarks'
      ];
      colWidths = [
        { wch: 16 }, // Supervisor ID
        { wch: 24 }, // Full Name
        { wch: 18 }, // Mobile
        { wch: 28 }, // Email
        { wch: 16 }, // Opening Float
        { wch: 22 }, // Assigned Project Code
        { wch: 12 }, // Active
        { wch: 35 }  // Remarks
      ];
      sampleData = [
        {
          'Supervisor ID': 'SUP-001',
          'Full Name': 'BUDDIKA',
          'Mobile': '+94 77 123 4567',
          'Email': 'buddika@emagroup.lk',
          'Opening Float': 50000,
          'Assigned Project Code': 'PIDM 26',
          'Active': 'Yes',
          'Remarks': 'Senior Civil Supervisor'
        },
        {
          'Supervisor ID': 'SUP-002',
          'Full Name': 'KASUN',
          'Mobile': '+94 77 234 5678',
          'Email': 'kasun@emagroup.lk',
          'Opening Float': 75000,
          'Assigned Project Code': 'HAVELOCK',
          'Active': 'Yes',
          'Remarks': 'Site Logistics In-Charge'
        },
        {
          'Supervisor ID': 'SUP-003',
          'Full Name': 'PRADEEP',
          'Mobile': '+94 77 345 6789',
          'Email': 'pradeep@emagroup.lk',
          'Opening Float': 60000,
          'Assigned Project Code': 'TRILLIUM',
          'Active': 'Yes',
          'Remarks': 'Structural Site In-Charge'
        }
      ];

      validationRules = [
        {
          'Field Name': 'Supervisor ID',
          'Required?': 'Optional',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Unique ID code. Auto-generated as SUP-xxx if left empty.',
          'Example / Valid Options': 'SUP-001, SUP-002'
        },
        {
          'Field Name': 'Full Name',
          'Required?': 'REQUIRED',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Supervisor full name. Mandatory primary identifier.',
          'Example / Valid Options': 'BUDDIKA, KASUN, PRADEEP'
        },
        {
          'Field Name': 'Mobile',
          'Required?': 'Optional',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Phone contact number.',
          'Example / Valid Options': '+94 77 123 4567'
        },
        {
          'Field Name': 'Email',
          'Required?': 'Optional',
          'Data Type': 'Email',
          'Validation Rules & Format': 'Corporate or personal email address.',
          'Example / Valid Options': 'buddika@emagroup.lk'
        },
        {
          'Field Name': 'Opening Float',
          'Required?': 'Optional',
          'Data Type': 'Numeric (LKR)',
          'Validation Rules & Format': 'Initial petty cash float given at start of record.',
          'Example / Valid Options': '50000, 75000'
        },
        {
          'Field Name': 'Assigned Project Code',
          'Required?': 'Optional',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Code of the project site where supervisor is stationed.',
          'Example / Valid Options': 'PIDM 26, HAVELOCK'
        },
        {
          'Field Name': 'Active',
          'Required?': 'Optional',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Yes / No or True / False. Defaults to Yes.',
          'Example / Valid Options': 'Yes, No'
        }
      ];
    } else if (importType === 'HISTORICAL_INCOME') {
      fileName = `EMA_Historical_Income_Template.${format}`;
      headers = [
        'Income ID',
        'Date',
        'Supervisor',
        'Project',
        'Amount',
        'Income Source',
        'Transaction Type',
        'Remarks'
      ];
      colWidths = [
        { wch: 16 }, // Income ID
        { wch: 14 }, // Date
        { wch: 18 }, // Supervisor
        { wch: 16 }, // Project
        { wch: 16 }, // Amount
        { wch: 28 }, // Income Source
        { wch: 20 }, // Transaction Type
        { wch: 35 }  // Remarks
      ];
      sampleData = [
        {
          'Income ID': 'INC-2024-0001',
          'Date': '05/01/2024',
          'Supervisor': 'BUDDIKA',
          'Project': 'PIDM 26',
          'Amount': 250000,
          'Income Source': 'Bank Transfer to Custodian',
          'Transaction Type': 'FLOAT_TOPUP',
          'Remarks': 'January Opening Float Disbursal via BOC Bank Transfer #99102'
        },
        {
          'Income ID': 'INC-2024-0002',
          'Date': '12/01/2024',
          'Supervisor': 'KASUN',
          'Project': 'HAVELOCK',
          'Amount': 180000,
          'Income Source': 'Head Office Disbursal',
          'Transaction Type': 'FLOAT_TOPUP',
          'Remarks': 'Site float replenishment for Havelock structural work'
        },
        {
          'Income ID': 'INC-2024-0003',
          'Date': '20/01/2024',
          'Supervisor': 'PRADEEP',
          'Project': 'TRILLIUM',
          'Amount': 120000,
          'Income Source': 'Direct Float Top-up',
          'Transaction Type': 'FLOAT_TOPUP',
          'Remarks': 'Replenishment for emergency site safety purchases'
        }
      ];

      validationRules = [
        {
          'Field Name': 'Income ID',
          'Required?': 'Optional',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Unique Income reference (e.g. INC-2024-0001). If omitted, EMA generates INC-YYYYMM-xxxx automatically.',
          'Example / Valid Options': 'INC-2024-0001, TOP-1092'
        },
        {
          'Field Name': 'Date',
          'Required?': 'REQUIRED',
          'Data Type': 'Date',
          'Validation Rules & Format': 'Receipt or transfer date in DD/MM/YYYY or YYYY-MM-DD format.',
          'Example / Valid Options': '05/01/2024, 2024-01-05'
        },
        {
          'Field Name': 'Supervisor',
          'Required?': 'REQUIRED',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Name of site supervisor/custodian receiving the cash float allocation.',
          'Example / Valid Options': 'BUDDIKA, KASUN, PRADEEP, NUWAN'
        },
        {
          'Field Name': 'Project',
          'Required?': 'REQUIRED',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Assigned project code (e.g. PIDM 26, HAVELOCK).',
          'Example / Valid Options': 'PIDM 26, HAVELOCK, TRILLIUM'
        },
        {
          'Field Name': 'Amount',
          'Required?': 'REQUIRED',
          'Data Type': 'Numeric (LKR)',
          'Validation Rules & Format': 'Positive numeric value representing the top-up or cash credit sum in LKR.',
          'Example / Valid Options': '250000, 150000'
        },
        {
          'Field Name': 'Income Source',
          'Required?': 'Optional',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Direct Float Top-up, Bank Transfer to Custodian, Cash Deposit, Head Office Disbursal, Other.',
          'Example / Valid Options': 'Bank Transfer to Custodian, Head Office Disbursal'
        },
        {
          'Field Name': 'Transaction Type',
          'Required?': 'Optional',
          'Data Type': 'Text',
          'Validation Rules & Format': 'FLOAT_TOPUP, INCOME_RECEIPT, REIMBURSEMENT_CREDIT. Defaults to FLOAT_TOPUP.',
          'Example / Valid Options': 'FLOAT_TOPUP'
        },
        {
          'Field Name': 'Remarks',
          'Required?': 'Optional',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Reference note, transfer slip number, or disbursal details.',
          'Example / Valid Options': 'January Opening Float via BOC Transfer #99102'
        }
      ];
    } else if (importType === 'PROJECT_INVOICES') {
      fileName = `EMA_Project_Invoices_Template.${format}`;
      headers = [
        'Invoice Number',
        'Project Code',
        'Client Name',
        'Invoice Date',
        'Due Date',
        'Billing Description',
        'Net Amount',
        'VAT Treatment',
        'VAT Rate',
        'Gross Amount',
        'Amount Received',
        'Payment Status',
        'Payment Date',
        'Payment Reference',
        'Project Engineer',
        'Remarks'
      ];
      colWidths = [
        { wch: 18 }, // Invoice Number
        { wch: 16 }, // Project Code
        { wch: 34 }, // Client Name
        { wch: 14 }, // Invoice Date
        { wch: 14 }, // Due Date
        { wch: 42 }, // Billing Description
        { wch: 18 }, // Net Amount
        { wch: 18 }, // VAT Treatment
        { wch: 12 }, // VAT Rate
        { wch: 18 }, // Gross Amount
        { wch: 18 }, // Amount Received
        { wch: 16 }, // Payment Status
        { wch: 14 }, // Payment Date
        { wch: 20 }, // Payment Reference
        { wch: 18 }, // Project Engineer
        { wch: 35 }  // Remarks
      ];
      sampleData = [
        {
          'Invoice Number': 'INV-2024-001',
          'Project Code': 'PIDM 26',
          'Client Name': 'National Water Supply & Drainage Board',
          'Invoice Date': '15/01/2024',
          'Due Date': '15/02/2024',
          'Billing Description': 'Interim Payment Certificate No. 04 - Pipeline Installation Progress',
          'Net Amount': 2500000,
          'VAT Treatment': 'EXCLUDING_VAT',
          'VAT Rate': 18,
          'Gross Amount': 2950000,
          'Amount Received': 1500000,
          'Payment Status': 'Partially Paid',
          'Payment Date': '28/01/2024',
          'Payment Reference': 'BOC-SLIP-77102',
          'Project Engineer': 'BUDDIKA',
          'Remarks': '50% advance certification release received via RTGS'
        },
        {
          'Invoice Number': 'INV-2024-002',
          'Project Code': 'HAVELOCK',
          'Client Name': 'Urban Development Authority (UDA)',
          'Invoice Date': '22/01/2024',
          'Due Date': '22/02/2024',
          'Billing Description': 'IPC No. 02 - Foundation & Substructure Concrete Pouring',
          'Net Amount': 4200000,
          'VAT Treatment': 'EXCLUDING_VAT',
          'VAT Rate': 18,
          'Gross Amount': 4956000,
          'Amount Received': 4956000,
          'Payment Status': 'Paid',
          'Payment Date': '10/02/2024',
          'Payment Reference': 'PB-CHQ-009182',
          'Project Engineer': 'KASUN',
          'Remarks': "Full settlement cleared via People's Bank Cheque"
        },
        {
          'Invoice Number': 'INV-2024-003',
          'Project Code': 'TRILLIUM',
          'Client Name': 'Trillium Residencies Ltd',
          'Invoice Date': '05/02/2024',
          'Due Date': '05/03/2024',
          'Billing Description': 'IPC No. 06 - External Facade & Curtain Wall Installation',
          'Net Amount': 1850000,
          'VAT Treatment': 'EXCLUDING_VAT',
          'VAT Rate': 18,
          'Gross Amount': 2183000,
          'Amount Received': 0,
          'Payment Status': 'Approved',
          'Payment Date': '',
          'Payment Reference': '',
          'Project Engineer': 'PRADEEP',
          'Remarks': 'Submitted for consultant engineer certificate approval'
        }
      ];
      validationRules = [
        {
          'Field Name': 'Invoice Number',
          'Required?': 'REQUIRED',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Unique invoice or Interim Payment Certificate (IPC) reference string.',
          'Example / Valid Options': 'INV-2024-001, IPC-HAV-004'
        },
        {
          'Field Name': 'Project Code',
          'Required?': 'REQUIRED',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Project code site allocation. Matched against active project directory or auto-created.',
          'Example / Valid Options': 'PIDM 26, HAVELOCK, TRILLIUM'
        },
        {
          'Field Name': 'Client Name',
          'Required?': 'Optional',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Name of the client department, corporation, or employer organization.',
          'Example / Valid Options': 'National Water Supply & Drainage Board, UDA, RDA'
        },
        {
          'Field Name': 'Invoice Date',
          'Required?': 'REQUIRED',
          'Data Type': 'Date',
          'Validation Rules & Format': 'Issue or certification date in DD/MM/YYYY or YYYY-MM-DD format.',
          'Example / Valid Options': '15/01/2024, 2024-01-15'
        },
        {
          'Field Name': 'Due Date',
          'Required?': 'Optional',
          'Data Type': 'Date',
          'Validation Rules & Format': 'Contractual payment due date. Defaults to Invoice Date + 30 days if omitted.',
          'Example / Valid Options': '15/02/2024, 2024-02-15'
        },
        {
          'Field Name': 'Billing Description',
          'Required?': 'REQUIRED',
          'Data Type': 'Text',
          'Validation Rules & Format': 'IPC milestone scope, certified work description, or billing particulars.',
          'Example / Valid Options': 'IPC No. 04 - Pipeline Installation Progress'
        },
        {
          'Field Name': 'Net Amount',
          'Required?': 'REQUIRED',
          'Data Type': 'Numeric (LKR)',
          'Validation Rules & Format': 'Certified net billing sum before Sri Lanka VAT (18%). Non-negative numeric.',
          'Example / Valid Options': '2500000, 4200000.00'
        },
        {
          'Field Name': 'VAT Treatment',
          'Required?': 'Optional',
          'Data Type': 'Text',
          'Validation Rules & Format': 'EXCLUDING_VAT, INCLUDING_VAT, or VAT_NOT_APPLICABLE. Defaults to EXCLUDING_VAT.',
          'Example / Valid Options': 'EXCLUDING_VAT, INCLUDING_VAT, VAT_NOT_APPLICABLE'
        },
        {
          'Field Name': 'VAT Rate',
          'Required?': 'Optional',
          'Data Type': 'Numeric (%)',
          'Validation Rules & Format': 'Sri Lanka standard VAT rate percentage. Defaults to 18%.',
          'Example / Valid Options': '18, 0'
        },
        {
          'Field Name': 'Gross Amount',
          'Required?': 'Optional',
          'Data Type': 'Numeric (LKR)',
          'Validation Rules & Format': 'Total certified bill including VAT. Auto-calculated if omitted.',
          'Example / Valid Options': '2950000'
        },
        {
          'Field Name': 'Amount Received',
          'Required?': 'Optional',
          'Data Type': 'Numeric (LKR)',
          'Validation Rules & Format': 'Amount collected or paid by client towards this invoice.',
          'Example / Valid Options': '1500000, 0'
        },
        {
          'Field Name': 'Payment Status',
          'Required?': 'Optional',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Approved, Paid, Partially Paid, Overdue, Submitted, Draft. Defaults based on receipts.',
          'Example / Valid Options': 'Approved, Paid, Partially Paid'
        },
        {
          'Field Name': 'Payment Date',
          'Required?': 'Optional',
          'Data Type': 'Date',
          'Validation Rules & Format': 'Date client payment was received / cleared.',
          'Example / Valid Options': '28/01/2024'
        },
        {
          'Field Name': 'Payment Reference',
          'Required?': 'Optional',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Cheque number, RTGS/SLIPS transaction ID, or bank reference.',
          'Example / Valid Options': 'BOC-SLIP-77102'
        },
        {
          'Field Name': 'Project Engineer',
          'Required?': 'Optional',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Site engineer or supervisor overseeing work.',
          'Example / Valid Options': 'BUDDIKA, KASUN'
        },
        {
          'Field Name': 'Remarks',
          'Required?': 'Optional',
          'Data Type': 'Text',
          'Validation Rules & Format': 'Internal notes or billing comments.',
          'Example / Valid Options': '50% advance certification release received via RTGS'
        }
      ];
    }

    const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Data');

    // Add Validation Rules Reference Sheet in XLSX
    if (format === 'xlsx' && validationRules.length > 0) {
      const wsRules = XLSX.utils.json_to_sheet(validationRules);
      wsRules['!cols'] = [
        { wch: 22 },
        { wch: 14 },
        { wch: 16 },
        { wch: 55 },
        { wch: 45 }
      ];
      XLSX.utils.book_append_sheet(wb, wsRules, 'Validation_Rules');
    }

    if (format === 'csv') {
      const csvOutput = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
      this.triggerDownload(blob, fileName);
    } else {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      this.triggerDownload(blob, fileName);
    }
  }

  /**
   * Download all official Excel (.xlsx) templates sequentially
   */
  static downloadAllTemplates(format: 'xlsx' | 'csv' = 'xlsx'): void {
    const types: ImportType[] = [
      'HISTORICAL_EXPENSES',
      'PROJECT_DIRECTORY',
      'SUPERVISOR_DIRECTORY',
      'HISTORICAL_INCOME',
      'PROJECT_INVOICES'
    ];
    types.forEach((type, index) => {
      setTimeout(() => {
        this.downloadTemplate(type, format);
      }, index * 250);
    });
  }

  /**
   * Export validation error report to Excel/CSV
   */
  static exportErrorReport(
    batchNumber: string,
    importType: string,
    validationSummary: ValidationSummary,
    format: 'xlsx' | 'csv' = 'xlsx'
  ): void {
    const errorRows: Record<string, any>[] = [];

    validationSummary.validatedRows.forEach((row) => {
      const issues = [...row.errors, ...row.warnings];
      issues.forEach((issue) => {
        errorRows.push({
          'Row #': issue.row,
          'Severity': issue.severity,
          'Field': issue.field,
          'Uploaded Value': issue.value !== undefined ? String(issue.value) : '',
          'Error Description': issue.error,
          'Action Required': issue.severity === 'ERROR' ? 'Must be corrected or skipped' : 'Can be ignored'
        });
      });
    });

    if (errorRows.length === 0) {
      errorRows.push({
        'Row #': 0,
        'Severity': 'INFO',
        'Field': 'N/A',
        'Uploaded Value': 'N/A',
        'Error Description': 'No errors detected in dataset.',
        'Action Required': 'Ready for import.'
      });
    }

    const ws = XLSX.utils.json_to_sheet(errorRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Error_Report');

    const fileName = `EMA_Import_Error_Report_${batchNumber}_${new Date().toISOString().slice(0, 10)}.${format}`;

    if (format === 'csv') {
      const csvOutput = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
      this.triggerDownload(blob, fileName);
    } else {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      this.triggerDownload(blob, fileName);
    }
  }

  private static triggerDownload(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const dataImportService = DataImportService;
