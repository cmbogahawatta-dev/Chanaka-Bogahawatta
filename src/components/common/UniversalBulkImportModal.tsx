import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  FileText,
  HelpCircle,
  Clipboard,
  RefreshCw,
  Layers,
  ArrowRight,
  Database,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { adminSecurityService } from '../../services/adminSecurityService';
import { useEnterprise } from '../../context/EnterpriseContext';

export type DirectoryImportType =
  | 'VEHICLES'
  | 'DRIVERS'
  | 'STAFF'
  | 'PROJECTS'
  | 'SUPERVISORS'
  | 'EXPENSES'
  | 'INCOME'
  | 'PRV'
  | 'PROCUREMENT'
  | 'PAYMENTS'
  | 'SITE_RECORDS'
  | 'ATTENDANCE'
  | 'LEAVES'
  | 'OVERTIME'
  | 'RUNNING_CHARTS'
  | 'FUEL'
  | 'MAINTENANCE'
  | 'TRANSFERS'
  | 'DOCUMENTS';

export interface FieldDefinition {
  key: string;
  label: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'select' | 'boolean';
  options?: string[];
  aliases: string[];
  description: string;
  sampleValue: string | number | boolean;
}

export interface DirectoryConfig {
  title: string;
  description: string;
  directoryName: string;
  iconColor: string;
  fields: FieldDefinition[];
  sampleRows: Record<string, any>[];
}

export const DIRECTORY_CONFIGS: Record<DirectoryImportType, DirectoryConfig> = {
  VEHICLES: {
    title: 'Bulk Import Fleet Vehicles',
    description: 'Import company fleet vehicles, pickups, lorries, and construction machinery.',
    directoryName: 'Vehicle Fleet Registry',
    iconColor: 'text-indigo-600',
    fields: [
      { key: 'registrationNumber', label: 'Registration No *', required: true, type: 'string', aliases: ['reg_no', 'reg_number', 'plate', 'vehicle_no', 'registration'], description: 'Vehicle license plate / Registration (e.g., WP CAB-4521)', sampleValue: 'WP CAB-4521' },
      { key: 'make', label: 'Make', required: false, type: 'string', aliases: ['brand', 'manufacturer'], description: 'Vehicle brand (e.g. Toyota, Isuzu, Mitsubishi)', sampleValue: 'Toyota' },
      { key: 'model', label: 'Model', required: false, type: 'string', aliases: ['vehicle_model'], description: 'Model name (e.g. Hilux Double Cab, D-Max)', sampleValue: 'Hilux Double Cab' },
      { key: 'year', label: 'Year', required: false, type: 'number', aliases: ['mfg_year', 'manufacture_year'], description: 'Year of manufacture', sampleValue: 2023 },
      { key: 'type', label: 'Vehicle Type', required: false, type: 'string', aliases: ['category', 'veh_type'], description: 'Type: pickup, van, truck, lorry, car, suv, excavator', sampleValue: 'pickup' },
      { key: 'fuelType', label: 'Fuel Type', required: false, type: 'string', aliases: ['fuel'], description: 'diesel, petrol, hybrid, electric', sampleValue: 'diesel' },
      { key: 'tankCapacityLiters', label: 'Tank Capacity (L)', required: false, type: 'number', aliases: ['tank_capacity', 'capacity_liters', 'tank_size'], description: 'Fuel tank capacity in liters', sampleValue: 80 },
      { key: 'currentOdometer', label: 'Current Odometer (km)', required: false, type: 'number', aliases: ['odometer', 'current_km', 'mileage'], description: 'Current odometer reading in km', sampleValue: 45200 },
      { key: 'department', label: 'Department / Site', required: false, type: 'string', aliases: ['dept', 'project', 'assigned_to'], description: 'Assigned department or project code', sampleValue: 'Project Operations' },
      { key: 'insuranceExpiryDate', label: 'Insurance Expiry', required: false, type: 'date', aliases: ['insurance_exp', 'insurance_date'], description: 'Insurance policy expiry date (YYYY-MM-DD)', sampleValue: '2027-01-15' },
      { key: 'revenueLicenseExpiryDate', label: 'Revenue License Expiry', required: false, type: 'date', aliases: ['revenue_exp', 'license_exp'], description: 'Revenue license expiry date (YYYY-MM-DD)', sampleValue: '2027-02-28' }
    ],
    sampleRows: [
      { registrationNumber: 'WP CAB-4521', make: 'Toyota', model: 'Hilux D-Cab', year: 2023, type: 'pickup', fuelType: 'diesel', tankCapacityLiters: 80, currentOdometer: 45200, department: 'PIDM 26', insuranceExpiryDate: '2027-01-15', revenueLicenseExpiryDate: '2027-02-28' },
      { registrationNumber: 'WP NA-8842', make: 'Isuzu', model: 'Elf 3.5 Ton Tipper', year: 2022, type: 'truck', fuelType: 'diesel', tankCapacityLiters: 100, currentOdometer: 62400, department: 'PIDM 28', insuranceExpiryDate: '2027-03-20', revenueLicenseExpiryDate: '2027-04-10' },
      { registrationNumber: 'CP CAR-1102', make: 'Toyota', model: 'Land Cruiser Prado', year: 2024, type: 'suv', fuelType: 'diesel', tankCapacityLiters: 87, currentOdometer: 18500, department: 'Management', insuranceExpiryDate: '2027-06-30', revenueLicenseExpiryDate: '2027-07-15' }
    ]
  },

  DRIVERS: {
    title: 'Bulk Import Enterprise Drivers',
    description: 'Import company drivers, heavy vehicle operators, and license details.',
    directoryName: 'Driver Registry',
    iconColor: 'text-blue-600',
    fields: [
      { key: 'employeeId', label: 'Employee ID *', required: true, type: 'string', aliases: ['driver_id', 'emp_id', 'emp_code', 'code'], description: 'Unique driver employee ID (e.g. DRV-001)', sampleValue: 'DRV-001' },
      { key: 'name', label: 'Full Name *', required: true, type: 'string', aliases: ['driver_name', 'full_name', 'employee_name'], description: 'Driver full legal name', sampleValue: 'Sunil Shantha Perera' },
      { key: 'phone', label: 'Phone Number', required: false, type: 'string', aliases: ['mobile', 'contact', 'telephone'], description: 'Contact phone number', sampleValue: '+94 77 123 4567' },
      { key: 'email', label: 'Email', required: false, type: 'string', aliases: ['email_address'], description: 'Driver email address', sampleValue: 'sunil.p@emagroup.lk' },
      { key: 'licenseNumber', label: 'License Number', required: false, type: 'string', aliases: ['driving_license', 'dl_number', 'license_no'], description: 'National driving license number', sampleValue: 'B4892104' },
      { key: 'licenseExpiryDate', label: 'License Expiry', required: false, type: 'date', aliases: ['dl_expiry', 'license_exp'], description: 'Driving license expiry date (YYYY-MM-DD)', sampleValue: '2028-05-12' },
      { key: 'medicalExpiryDate', label: 'Medical Expiry', required: false, type: 'date', aliases: ['medical_exp', 'fitness_exp'], description: 'Medical fitness cert expiry date', sampleValue: '2027-02-15' },
      { key: 'department', label: 'Department', required: false, type: 'string', aliases: ['dept', 'division'], description: 'Assigned department', sampleValue: 'Logistics & Fleet' },
      { key: 'status', label: 'Status', required: false, type: 'string', aliases: ['state'], description: 'active, on_leave, suspended', sampleValue: 'active' }
    ],
    sampleRows: [
      { employeeId: 'DRV-001', name: 'Sunil Shantha Perera', phone: '+94 77 123 4567', email: 'sunil.p@emagroup.lk', licenseNumber: 'B4892104', licenseExpiryDate: '2028-05-12', medicalExpiryDate: '2027-02-15', department: 'Logistics & Fleet', status: 'active' },
      { employeeId: 'DRV-002', name: 'Gamini Rajapaksha', phone: '+94 71 987 6543', email: 'gamini.r@emagroup.lk', licenseNumber: 'A1289451', licenseExpiryDate: '2027-11-20', medicalExpiryDate: '2027-04-10', department: 'Project Operations', status: 'active' },
      { employeeId: 'DRV-003', name: 'Mahinda Jayasinghe', phone: '+94 76 555 1212', email: 'mahinda.j@emagroup.lk', licenseNumber: 'B9920145', licenseExpiryDate: '2029-01-18', medicalExpiryDate: '2027-08-25', department: 'Logistics & Fleet', status: 'active' }
    ]
  },

  STAFF: {
    title: 'Bulk Import Staff Directory',
    description: 'Import company employees, engineers, accountants, and project supervisors.',
    directoryName: 'Staff & Personnel Directory',
    iconColor: 'text-emerald-600',
    fields: [
      { key: 'employeeCode', label: 'Employee Code *', required: true, type: 'string', aliases: ['emp_code', 'emp_id', 'staff_id', 'code'], description: 'Unique staff code (e.g. EMA-EMP-014)', sampleValue: 'EMA-EMP-014' },
      { key: 'fullName', label: 'Full Legal Name *', required: true, type: 'string', aliases: ['name', 'full_name', 'staff_name', 'employee_name'], description: 'Full legal name of staff member', sampleValue: 'Kasun Malinda Jayawardena' },
      { key: 'preferredName', label: 'Preferred Name', required: false, type: 'string', aliases: ['short_name', 'nickname', 'display_name'], description: 'First name or call name', sampleValue: 'Kasun' },
      { key: 'nicNumber', label: 'NIC / Passport', required: false, type: 'string', aliases: ['nic', 'national_id', 'id_number'], description: 'National Identity Card number', sampleValue: '199214502841' },
      { key: 'email', label: 'Email', required: false, type: 'string', aliases: ['official_email', 'work_email'], description: 'Company email address', sampleValue: 'kasun.j@emaconstruction.lk' },
      { key: 'phone', label: 'Phone', required: false, type: 'string', aliases: ['mobile', 'contact_no'], description: 'Contact phone number', sampleValue: '+94 77 458 9621' },
      { key: 'department', label: 'Department', required: false, type: 'string', aliases: ['dept', 'division'], description: 'Civil Engineering, Project Operations, Finance & Accounts, Management, HR & Administration, Logistics & Fleet, Commercial & QS, Quality & Safety', sampleValue: 'Civil Engineering' },
      { key: 'designation', label: 'Designation / Job Title', required: false, type: 'string', aliases: ['role_title', 'position', 'title'], description: 'Job designation (e.g. Senior Site Engineer)', sampleValue: 'Senior Site Engineer' },
      { key: 'assignedProjectCode', label: 'Assigned Project Code', required: false, type: 'string', aliases: ['project_code', 'project', 'site'], description: 'Project code (e.g. PIDM 26, HEAD_OFFICE)', sampleValue: 'PIDM 26' },
      { key: 'joinedDate', label: 'Joined Date', required: false, type: 'date', aliases: ['hire_date', 'start_date', 'join_date'], description: 'Date of employment (YYYY-MM-DD)', sampleValue: '2023-04-01' }
    ],
    sampleRows: [
      { employeeCode: 'EMA-EMP-014', fullName: 'Kasun Malinda Jayawardena', preferredName: 'Kasun', nicNumber: '199214502841', email: 'kasun.j@emaconstruction.lk', phone: '+94 77 458 9621', department: 'Civil Engineering', designation: 'Senior Site Engineer', assignedProjectCode: 'PIDM 26', joinedDate: '2023-04-01' },
      { employeeCode: 'EMA-EMP-015', fullName: 'Niroshan Priyadarshana', preferredName: 'Niroshan', nicNumber: '198824108842', email: 'niroshan.p@emaconstruction.lk', phone: '+94 71 884 1254', department: 'Project Operations', designation: 'General Foreman', assignedProjectCode: 'PIDM 28', joinedDate: '2022-09-15' },
      { employeeCode: 'EMA-EMP-016', fullName: 'Thilini Sandamali Wickrama', preferredName: 'Thilini', nicNumber: '199578401245', email: 'thilini.w@emaconstruction.lk', phone: '+94 76 332 5896', department: 'Finance & Accounts', designation: 'Assistant Accountant', assignedProjectCode: 'HEAD_OFFICE', joinedDate: '2024-01-10' }
    ]
  },

  PROJECTS: {
    title: 'Bulk Import Projects Registry',
    description: 'Import master construction projects, contracts, locations, and milestones.',
    directoryName: 'Master Projects Registry',
    iconColor: 'text-amber-600',
    fields: [
      { key: 'CODE', label: 'Project Code *', required: true, type: 'string', aliases: ['project_code', 'code', 'proj_id'], description: 'Unique project code (e.g. PIDM 26)', sampleValue: 'PIDM 26' },
      { key: 'NAME', label: 'Project Name *', required: true, type: 'string', aliases: ['project_name', 'name', 'title'], description: 'Official project title', sampleValue: 'Kandy - Colombo Expressway Section 2' },
      { key: 'LOCATION', label: 'Location / Site', required: false, type: 'string', aliases: ['site_location', 'address', 'city'], description: 'Project geographic site location', sampleValue: 'Mirigama to Kurunegala' },
      { key: 'SUPERVISOR', label: 'Primary Supervisor', required: false, type: 'string', aliases: ['lead_supervisor', 'manager', 'pic'], description: 'Assigned supervisor name', sampleValue: 'BUDDIKA' },
      { key: 'TOTAL_BUDGET', label: 'Contract Budget (LKR)', required: false, type: 'number', aliases: ['budget', 'contract_value', 'value'], description: 'Total allocated budget in LKR', sampleValue: 85000000 },
      { key: 'STATUS', label: 'Project Status', required: false, type: 'string', aliases: ['state'], description: 'Active, Planning, Completed, On Hold', sampleValue: 'Active' },
      { key: 'START_DATE', label: 'Start Date', required: false, type: 'date', aliases: ['commence_date'], description: 'Project commencement date (YYYY-MM-DD)', sampleValue: '2026-01-15' }
    ],
    sampleRows: [
      { CODE: 'PIDM 26', NAME: 'Kandy - Colombo Expressway Section 2', LOCATION: 'Mirigama to Kurunegala', SUPERVISOR: 'BUDDIKA', TOTAL_BUDGET: 85000000, STATUS: 'Active', START_DATE: '2026-01-15' },
      { CODE: 'PIDM 27', NAME: 'Kelani Valley Bridge Rehabilitation', LOCATION: 'Avissawella Bridgehead', SUPERVISOR: 'LASANTHA', TOTAL_BUDGET: 42000000, STATUS: 'Active', START_DATE: '2026-02-01' },
      { CODE: 'PIDM 28', NAME: 'Gampaha Urban Drainage Canal Project', LOCATION: 'Gampaha Municipal Area', SUPERVISOR: 'GEETH', TOTAL_BUDGET: 29500000, STATUS: 'Active', START_DATE: '2026-03-10' }
    ]
  },

  SUPERVISORS: {
    title: 'Bulk Import Supervisors Master',
    description: 'Import master site supervisors, opening floats, and default projects.',
    directoryName: 'Master Supervisors Registry',
    iconColor: 'text-purple-600',
    fields: [
      { key: 'SUPERVISOR_ID', label: 'Supervisor ID *', required: true, type: 'string', aliases: ['id', 'sup_id', 'code'], description: 'Unique supervisor identifier (e.g. SUP-006)', sampleValue: 'SUP-006' },
      { key: 'NAME', label: 'Supervisor Name *', required: true, type: 'string', aliases: ['supervisor_name', 'full_name', 'name'], description: 'Full name in uppercase (e.g. DILSHAN)', sampleValue: 'DILSHAN' },
      { key: 'PHONE', label: 'Phone Number', required: false, type: 'string', aliases: ['mobile', 'contact'], description: 'Contact phone number', sampleValue: '+94 77 889 4455' },
      { key: 'EMAIL', label: 'Email', required: false, type: 'string', aliases: ['email_address'], description: 'Email address', sampleValue: 'dilshan@emagroup.lk' },
      { key: 'DEFAULT_PROJECT', label: 'Default Project Code', required: false, type: 'string', aliases: ['project', 'assigned_project'], description: 'Default assigned project code', sampleValue: 'PIDM 26' },
      { key: 'OPENING_FLOAT', label: 'Opening Float (LKR)', required: false, type: 'number', aliases: ['float', 'initial_balance'], description: 'Initial petty cash float in LKR', sampleValue: 150000 },
      { key: 'ACTIVE', label: 'Active (TRUE/FALSE)', required: false, type: 'boolean', aliases: ['is_active', 'status'], description: 'Whether active supervisor', sampleValue: true }
    ],
    sampleRows: [
      { SUPERVISOR_ID: 'SUP-006', NAME: 'DILSHAN', PHONE: '+94 77 889 4455', EMAIL: 'dilshan@emagroup.lk', DEFAULT_PROJECT: 'PIDM 26', OPENING_FLOAT: 150000, ACTIVE: true },
      { SUPERVISOR_ID: 'SUP-007', NAME: 'NUWAN', PHONE: '+94 71 223 3445', EMAIL: 'nuwan@emagroup.lk', DEFAULT_PROJECT: 'PIDM 27', OPENING_FLOAT: 200000, ACTIVE: true },
      { SUPERVISOR_ID: 'SUP-008', NAME: 'CHATHURA', PHONE: '+94 76 998 8776', EMAIL: 'chathura@emagroup.lk', DEFAULT_PROJECT: 'PIDM 28', OPENING_FLOAT: 100000, ACTIVE: true }
    ]
  },

  EXPENSES: {
    title: 'Bulk Import Petty Cash Expenses',
    description: 'Import historical site expense vouchers, contractor payouts, and receipts.',
    directoryName: 'Petty Cash Expenses',
    iconColor: 'text-rose-600',
    fields: [
      { key: 'DATE', label: 'Expense Date *', required: true, type: 'date', aliases: ['date_ref', 'transaction_date', 'voucher_date'], description: 'Date of transaction (YYYY-MM-DD)', sampleValue: '2026-08-25' },
      { key: 'SUPERVISOR', label: 'Supervisor Name *', required: true, type: 'string', aliases: ['supervisor', 'officer', 'requested_by'], description: 'Supervisor name (e.g. BUDDIKA, GEETH)', sampleValue: 'BUDDIKA' },
      { key: 'PROJECT', label: 'Project Code *', required: true, type: 'string', aliases: ['project_code', 'site_code'], description: 'Project code (e.g. PIDM 26)', sampleValue: 'PIDM 26' },
      { key: 'EXPENSES_CATEGORY', label: 'Category *', required: true, type: 'string', aliases: ['category', 'expense_type'], description: 'Category (e.g. Site Materials, Casual Labour, Fuel & Transport)', sampleValue: 'Site Materials' },
      { key: 'EXPENSES_DESCRIPTION', label: 'Description *', required: true, type: 'string', aliases: ['description', 'particulars', 'item_details'], description: 'Details of the expense', sampleValue: 'Purchase of binding wire and rapid cement' },
      { key: 'AMOUNT', label: 'Amount (LKR) *', required: true, type: 'number', aliases: ['expense_amount', 'total_lkr', 'cost'], description: 'Total expense amount in LKR', sampleValue: 14500 },
      { key: 'TRANSACTION_TYPE', label: 'Payment Source', required: false, type: 'string', aliases: ['source', 'type'], description: 'PETTY_CASH_EXPENSE or COMPANY_EXPENSE', sampleValue: 'PETTY_CASH_EXPENSE' },
      { key: 'PAYMENT_STATUS', label: 'Payment Status', required: false, type: 'string', aliases: ['status'], description: 'Paid, Pending, Verified', sampleValue: 'Paid' },
      { key: 'PRV_NUMBER', label: 'PRV Voucher Number', required: false, type: 'string', aliases: ['prv_no', 'voucher_no', 'prv_ref'], description: 'Linked PRV number (if applicable)', sampleValue: 'PRV-2026-0042' }
    ],
    sampleRows: [
      { DATE: '2026-08-25', SUPERVISOR: 'BUDDIKA', PROJECT: 'PIDM 26', EXPENSES_CATEGORY: 'Site Materials', EXPENSES_DESCRIPTION: 'Purchase of binding wire and rapid cement bags', AMOUNT: 14500, TRANSACTION_TYPE: 'PETTY_CASH_EXPENSE', PAYMENT_STATUS: 'Paid', PRV_NUMBER: 'PRV-2026-0042' },
      { DATE: '2026-08-26', SUPERVISOR: 'GEETH', PROJECT: 'PIDM 28', EXPENSES_CATEGORY: 'Casual Labour', EXPENSES_DESCRIPTION: 'Excavation helper daily wage settlement (3 workers)', AMOUNT: 12000, TRANSACTION_TYPE: 'PETTY_CASH_EXPENSE', PAYMENT_STATUS: 'Paid', PRV_NUMBER: 'PRV-2026-0043' },
      { DATE: '2026-08-27', SUPERVISOR: 'LASANTHA', PROJECT: 'PIDM 27', EXPENSES_CATEGORY: 'Fuel & Transport', EXPENSES_DESCRIPTION: 'Diesel refuel for water pump generator', AMOUNT: 8500, TRANSACTION_TYPE: 'PETTY_CASH_EXPENSE', PAYMENT_STATUS: 'Paid', PRV_NUMBER: 'PRV-2026-0044' }
    ]
  },

  INCOME: {
    title: 'Bulk Import Float Top-ups & Income',
    description: 'Import cash top-up records, head office bank float transfers, and reimbursements.',
    directoryName: 'Float Top-ups & Income Registry',
    iconColor: 'text-teal-600',
    fields: [
      { key: 'DATE', label: 'Receipt Date *', required: true, type: 'date', aliases: ['income_date', 'received_date', 'date'], description: 'Date received (YYYY-MM-DD)', sampleValue: '2026-08-20' },
      { key: 'SUPERVISOR', label: 'Supervisor Name *', required: true, type: 'string', aliases: ['supervisor', 'received_by'], description: 'Supervisor receiving funds', sampleValue: 'BUDDIKA' },
      { key: 'PROJECT', label: 'Project Code', required: false, type: 'string', aliases: ['project_code'], description: 'Assigned project code', sampleValue: 'PIDM 26' },
      { key: 'AMOUNT', label: 'Amount (LKR) *', required: true, type: 'number', aliases: ['income_amount', 'top_up_amount', 'amount_lkr'], description: 'Top-up amount in LKR', sampleValue: 100000 },
      { key: 'INCOME_SOURCE', label: 'Source of Funds', required: false, type: 'string', aliases: ['source', 'bank', 'payer'], description: 'Head Office Bank Transfer, Cheque, Direct Cash', sampleValue: 'Head Office Bank Transfer' },
      { key: 'TRANSACTION_TYPE', label: 'Income Type', required: false, type: 'string', aliases: ['type', 'category'], description: 'Float Top-up, Direct Reimbursement, Site Refund', sampleValue: 'Float Top-up' },
      { key: 'CHEQUE_NO', label: 'Reference / Cheque No', required: false, type: 'string', aliases: ['ref_no', 'bank_ref', 'slip_no'], description: 'Bank transfer or cheque reference', sampleValue: 'TXN-BOC-994120' }
    ],
    sampleRows: [
      { DATE: '2026-08-20', SUPERVISOR: 'BUDDIKA', PROJECT: 'PIDM 26', AMOUNT: 100000, INCOME_SOURCE: 'Head Office Bank Transfer', TRANSACTION_TYPE: 'Float Top-up', CHEQUE_NO: 'TXN-BOC-994120' },
      { DATE: '2026-08-22', SUPERVISOR: 'GEETH', PROJECT: 'PIDM 28', AMOUNT: 150000, INCOME_SOURCE: 'Commercial Bank Direct Transfer', TRANSACTION_TYPE: 'Float Top-up', CHEQUE_NO: 'TXN-COMB-104822' },
      { DATE: '2026-08-24', SUPERVISOR: 'LASANTHA', PROJECT: 'PIDM 27', AMOUNT: 75000, INCOME_SOURCE: 'Head Office Petty Cash Replenish', TRANSACTION_TYPE: 'Float Top-up', CHEQUE_NO: 'RCP-HO-4412' }
    ]
  },

  PRV: {
    title: 'Bulk Import Payment Request Vouchers (PRV)',
    description: 'Import supplier payment requests, subcontractor invoices, and vouchers.',
    directoryName: 'Payment Request Vouchers (PRV)',
    iconColor: 'text-violet-600',
    fields: [
      { key: 'prvNumber', label: 'PRV Number *', required: true, type: 'string', aliases: ['prv_no', 'voucher_no', 'reference_no', 'prv_id'], description: 'PRV reference number (e.g. PRV-2026-0101)', sampleValue: 'PRV-2026-0101' },
      { key: 'requestDate', label: 'Request Date *', required: true, type: 'date', aliases: ['date', 'date_requested'], description: 'Date of submission (YYYY-MM-DD)', sampleValue: '2026-08-26' },
      { key: 'requestedBy', label: 'Requested By', required: false, type: 'string', aliases: ['requester', 'officer', 'creator'], description: 'Name of requesting supervisor/officer', sampleValue: 'BUDDIKA' },
      { key: 'projectCode', label: 'Project Code *', required: true, type: 'string', aliases: ['project', 'site_code'], description: 'Target project code (e.g. PIDM 26)', sampleValue: 'PIDM 26' },
      { key: 'payeeType', label: 'Payee Type', required: false, type: 'string', aliases: ['vendor_type'], description: 'SUPPLIER, SUBCONTRACTOR, EMPLOYEE, UTILITY, OTHER', sampleValue: 'SUPPLIER' },
      { key: 'payeeName', label: 'Payee / Beneficiary Name *', required: true, type: 'string', aliases: ['payee', 'beneficiary', 'vendor', 'supplier'], description: 'Legal name of recipient or vendor', sampleValue: 'Tokyo Super Cement PLC' },
      { key: 'expenseCategory', label: 'Expense Category', required: false, type: 'string', aliases: ['category'], description: 'Building Materials, Heavy Equipment, Transport, Fuel, Subcontractor Work', sampleValue: 'Building Materials' },
      { key: 'purpose', label: 'Purpose of Voucher', required: false, type: 'string', aliases: ['subject', 'title'], description: 'Brief purpose of the payment', sampleValue: 'Purchase of 200 bags of cement for PIDM 26 bridge section' },
      { key: 'totalAmount', label: 'Total Amount (LKR) *', required: true, type: 'number', aliases: ['amount', 'total_lkr', 'value'], description: 'Total requested voucher amount in LKR', sampleValue: 490000 },
      { key: 'priority', label: 'Priority', required: false, type: 'string', aliases: ['urgency'], description: 'LOW, MEDIUM, HIGH, URGENT', sampleValue: 'HIGH' },
      { key: 'status', label: 'Current Status', required: false, type: 'string', aliases: ['state'], description: 'DRAFT, SUBMITTED, ACCOUNTS_L1_APPROVED, ACCOUNTS_L2_APPROVED, OWNER_APPROVED, PAID', sampleValue: 'SUBMITTED' }
    ],
    sampleRows: [
      { prvNumber: 'PRV-2026-0101', requestDate: '2026-08-26', requestedBy: 'BUDDIKA', projectCode: 'PIDM 26', payeeType: 'SUPPLIER', payeeName: 'Tokyo Super Cement PLC', expenseCategory: 'Building Materials', purpose: 'Purchase of 200 bags of cement for bridge pier', totalAmount: 490000, priority: 'HIGH', status: 'SUBMITTED' },
      { prvNumber: 'PRV-2026-0102', requestDate: '2026-08-27', requestedBy: 'GEETH', projectCode: 'PIDM 28', payeeType: 'SUBCONTRACTOR', payeeName: 'Lakshman Earthmovers Pvt Ltd', expenseCategory: 'Heavy Equipment', purpose: 'Excavator machine hire 45 machine hours', totalAmount: 382500, priority: 'MEDIUM', status: 'SUBMITTED' },
      { prvNumber: 'PRV-2026-0103', requestDate: '2026-08-28', requestedBy: 'LASANTHA', projectCode: 'PIDM 27', payeeType: 'SUPPLIER', payeeName: 'Melwire Rolling Mills Ltd', expenseCategory: 'Building Materials', purpose: 'Tor steel rebar 12mm & 16mm bundles', totalAmount: 840000, priority: 'URGENT', status: 'SUBMITTED' }
    ]
  },

  PROCUREMENT: {
    title: 'Bulk Import Procurement Purchase Orders',
    description: 'Import material purchase requisitions, supplier POs, quantities, and site deliveries.',
    directoryName: 'Procurement & Purchase Orders',
    iconColor: 'text-cyan-600',
    fields: [
      { key: 'PO_NUMBER', label: 'PO Number *', required: true, type: 'string', aliases: ['po_no', 'order_no', 'order_id'], description: 'Purchase order number (e.g. PO-202608-051)', sampleValue: 'PO-202608-051' },
      { key: 'DATE', label: 'PO Date *', required: true, type: 'date', aliases: ['order_date', 'date'], description: 'Issue date (YYYY-MM-DD)', sampleValue: '2026-08-26' },
      { key: 'PROJECT_CODE', label: 'Project Code *', required: true, type: 'string', aliases: ['project', 'site'], description: 'Destination site project code', sampleValue: 'PIDM 26' },
      { key: 'REQUESTED_BY', label: 'Requested By', required: false, type: 'string', aliases: ['requester', 'officer'], description: 'Name of requesting supervisor', sampleValue: 'BUDDIKA' },
      { key: 'SUPPLIER_NAME', label: 'Supplier Name *', required: true, type: 'string', aliases: ['vendor', 'supplier', 'company'], description: 'Vendor or supplier name', sampleValue: 'Tokyo Super Cement PLC' },
      { key: 'ITEM_DESCRIPTION', label: 'Item Description *', required: true, type: 'string', aliases: ['item', 'description', 'materials'], description: 'Description of materials or goods', sampleValue: 'Portland Hydraulic Cement 50kg' },
      { key: 'QUANTITY', label: 'Quantity *', required: true, type: 'number', aliases: ['qty', 'count'], description: 'Quantity ordered', sampleValue: 300 },
      { key: 'UNIT', label: 'Unit of Measure', required: false, type: 'string', aliases: ['uom', 'measure'], description: 'Bags, Tons, Cubes, Nos, Meters, Liters', sampleValue: 'Bags' },
      { key: 'UNIT_PRICE', label: 'Unit Price (LKR)', required: false, type: 'number', aliases: ['rate', 'unit_cost'], description: 'Unit rate in LKR', sampleValue: 2450 },
      { key: 'TOTAL_AMOUNT', label: 'Total Amount (LKR)', required: false, type: 'number', aliases: ['total', 'amount', 'total_cost'], description: 'Total purchase amount in LKR', sampleValue: 735000 },
      { key: 'STATUS', label: 'Order Status', required: false, type: 'string', aliases: ['state'], description: 'Pending Approval, Approved, In Transit, Delivered, Cancelled', sampleValue: 'Approved' },
      { key: 'DELIVERY_LOCATION', label: 'Delivery Location', required: false, type: 'string', aliases: ['site_location', 'destination'], description: 'Site delivery yard address', sampleValue: 'PIDM 26 Main Batching Plant' }
    ],
    sampleRows: [
      { PO_NUMBER: 'PO-202608-051', DATE: '2026-08-26', PROJECT_CODE: 'PIDM 26', REQUESTED_BY: 'BUDDIKA', SUPPLIER_NAME: 'Tokyo Super Cement PLC', ITEM_DESCRIPTION: 'Portland Hydraulic Cement 50kg Bags', QUANTITY: 300, UNIT: 'Bags', UNIT_PRICE: 2450, TOTAL_AMOUNT: 735000, STATUS: 'Approved', DELIVERY_LOCATION: 'PIDM 26 Central Yard' },
      { PO_NUMBER: 'PO-202608-052', DATE: '2026-08-27', PROJECT_CODE: 'PIDM 28', REQUESTED_BY: 'GEETH', SUPPLIER_NAME: 'Maha Oya River Sand Suppliers', ITEM_DESCRIPTION: 'River Sand for Plastering and Masonry', QUANTITY: 10, UNIT: 'Cubes', UNIT_PRICE: 32000, TOTAL_AMOUNT: 320000, STATUS: 'Pending Approval', DELIVERY_LOCATION: 'PIDM 28 Canal Site Section B' },
      { PO_NUMBER: 'PO-202608-053', DATE: '2026-08-28', PROJECT_CODE: 'PIDM 27', REQUESTED_BY: 'LASANTHA', SUPPLIER_NAME: 'Melwire Rolling Mills Ltd', ITEM_DESCRIPTION: 'High Yield TMT Steel Rebar 16mm', QUANTITY: 5, UNIT: 'Tons', UNIT_PRICE: 285000, TOTAL_AMOUNT: 1425000, STATUS: 'In Transit', DELIVERY_LOCATION: 'PIDM 27 Bridge Workshop' }
    ]
  },

  PAYMENTS: {
    title: 'Bulk Import Payment Vouchers',
    description: 'Import direct bank payment settlements, corporate cheque logs, and approvals.',
    directoryName: 'Payment Vouchers Registry',
    iconColor: 'text-emerald-700',
    fields: [
      { key: 'PAYMENT_ID', label: 'Payment ID *', required: true, type: 'string', aliases: ['pay_id', 'voucher_id', 'payment_no'], description: 'Unique payment voucher number (e.g. PAY-202608-021)', sampleValue: 'PAY-202608-021' },
      { key: 'DATE', label: 'Payment Date *', required: true, type: 'date', aliases: ['pay_date', 'date'], description: 'Date of transaction (YYYY-MM-DD)', sampleValue: '2026-08-25' },
      { key: 'PROJECT_CODE', label: 'Project Code', required: false, type: 'string', aliases: ['project', 'site'], description: 'Linked project code', sampleValue: 'PIDM 26' },
      { key: 'BENEFICIARY', label: 'Beneficiary Name *', required: true, type: 'string', aliases: ['payee', 'vendor', 'recipient'], description: 'Recipient payee name', sampleValue: 'Ceylinco General Insurance PLC' },
      { key: 'CATEGORY', label: 'Payment Category', required: false, type: 'string', aliases: ['type', 'category'], description: 'Insurance, Subcontractor, Fuel Depot, Plant Hire, Utilities', sampleValue: 'Insurance' },
      { key: 'AMOUNT', label: 'Amount (LKR) *', required: true, type: 'number', aliases: ['paid_amount', 'total_lkr', 'amount'], description: 'Payment amount in LKR', sampleValue: 185000 },
      { key: 'PAYMENT_METHOD', label: 'Payment Method', required: false, type: 'string', aliases: ['method'], description: 'Direct Bank Transfer, Corporate Cheque, Cash Settlement', sampleValue: 'Direct Bank Transfer' },
      { key: 'CHEQUE_OR_REF_NO', label: 'Reference / Cheque Number', required: false, type: 'string', aliases: ['ref_no', 'cheque_no', 'bank_ref'], description: 'Bank transaction ID or Cheque leaf number', sampleValue: 'TXN-BOC-884219' },
      { key: 'STATUS', label: 'Payment Status', required: false, type: 'string', aliases: ['state'], description: 'Settled, Pending Approval, Under Review', sampleValue: 'Settled' }
    ],
    sampleRows: [
      { PAYMENT_ID: 'PAY-202608-021', DATE: '2026-08-25', PROJECT_CODE: 'PIDM 26', BENEFICIARY: 'Ceylinco General Insurance PLC', CATEGORY: 'Insurance', AMOUNT: 185000, PAYMENT_METHOD: 'Direct Bank Transfer', CHEQUE_OR_REF_NO: 'TXN-BOC-884219', STATUS: 'Settled' },
      { PAYMENT_ID: 'PAY-202608-022', DATE: '2026-08-26', PROJECT_CODE: 'PIDM 28', BENEFICIARY: 'Lanka IOC Fuel Depot', CATEGORY: 'Fuel Depot', AMOUNT: 480000, PAYMENT_METHOD: 'Direct Bank Transfer', CHEQUE_OR_REF_NO: 'TXN-IOC-991204', STATUS: 'Settled' },
      { PAYMENT_ID: 'PAY-202608-023', DATE: '2026-08-27', PROJECT_CODE: 'PIDM 27', BENEFICIARY: 'Holcim Ready-Mix Concrete', CATEGORY: 'Ready-Mix', AMOUNT: 640000, PAYMENT_METHOD: 'Corporate Cheque', CHEQUE_OR_REF_NO: 'CHQ-882194', STATUS: 'Pending Approval' }
    ]
  },

  SITE_RECORDS: {
    title: 'Bulk Import Daily Site Records (DSR)',
    description: 'Import daily construction site journals, weather logs, manpower strength, and activity progress.',
    directoryName: 'Daily Site Records (DSR)',
    iconColor: 'text-amber-700',
    fields: [
      { key: 'projectCode', label: 'Project Code *', required: true, type: 'string', aliases: ['project', 'site_code'], description: 'Site project code (e.g. PIDM 26)', sampleValue: 'PIDM 26' },
      { key: 'date', label: 'Log Date *', required: true, type: 'date', aliases: ['dsr_date', 'log_date', 'date'], description: 'Date of site record (YYYY-MM-DD)', sampleValue: '2026-08-26' },
      { key: 'weatherCondition', label: 'Weather Condition', required: false, type: 'string', aliases: ['weather', 'climate'], description: 'Sunny, Clear, Overcast, Light Rain, Heavy Rain, Stormy', sampleValue: 'Sunny' },
      { key: 'temperatureC', label: 'Temperature (°C)', required: false, type: 'number', aliases: ['temperature', 'temp'], description: 'Average daytime temp in Celsius', sampleValue: 31 },
      { key: 'totalSiteStrength', label: 'Total Manpower Strength', required: false, type: 'number', aliases: ['headcount', 'workers', 'manpower_count'], description: 'Total workers present on site', sampleValue: 24 },
      { key: 'totalManHours', label: 'Total Man-Hours Worked', required: false, type: 'number', aliases: ['man_hours', 'hours'], description: 'Cumulative man hours worked', sampleValue: 192 },
      { key: 'dailyNotes', label: 'Daily Activity / Summary Notes', required: false, type: 'string', aliases: ['notes', 'summary', 'progress_notes'], description: 'Summary of structural and earthworks completed', sampleValue: 'Completed pier foundation concrete pouring. Rebar cage placed.' }
    ],
    sampleRows: [
      { projectCode: 'PIDM 26', date: '2026-08-26', weatherCondition: 'Sunny', temperatureC: 31, totalSiteStrength: 24, totalManHours: 192, dailyNotes: 'Completed pier foundation concrete pouring. Rebar cage placed for Abutment A.' },
      { projectCode: 'PIDM 28', date: '2026-08-26', weatherCondition: 'Clear', temperatureC: 30, totalSiteStrength: 18, totalManHours: 144, dailyNotes: 'Excavation of canal section CH 4+200 to 4+500 completed. Geotextile membrane installed.' },
      { projectCode: 'PIDM 27', date: '2026-08-27', weatherCondition: 'Light Rain', temperatureC: 28, totalSiteStrength: 16, totalManHours: 120, dailyNotes: 'Formwork erection for deck slab ongoing. Rain caused 1.5 hour delay in afternoon.' }
    ]
  },

  ATTENDANCE: {
    title: 'Bulk Import Attendance Register',
    description: 'Import daily biometric / manual timecard logs, punch-in/punch-out times, and working hours.',
    directoryName: 'Attendance Register',
    iconColor: 'text-blue-700',
    fields: [
      { key: 'employeeId', label: 'Employee ID / Code *', required: true, type: 'string', aliases: ['emp_id', 'staff_code', 'employee_code', 'id'], description: 'Employee code (e.g. EMA-EMP-001)', sampleValue: 'EMA-EMP-001' },
      { key: 'employeeName', label: 'Employee Name', required: false, type: 'string', aliases: ['name', 'full_name'], description: 'Name of the employee', sampleValue: 'Kasun Malinda' },
      { key: 'projectId', label: 'Project Code', required: false, type: 'string', aliases: ['project', 'site_code'], description: 'Assigned project site', sampleValue: 'PIDM 26' },
      { key: 'date', label: 'Attendance Date *', required: true, type: 'date', aliases: ['date_ref', 'log_date', 'date'], description: 'Date (YYYY-MM-DD)', sampleValue: '2026-08-26' },
      { key: 'punchIn', label: 'Punch In (HH:mm)', required: false, type: 'string', aliases: ['in_time', 'time_in', 'check_in'], description: 'Morning punch in time (e.g. 08:00)', sampleValue: '08:00' },
      { key: 'punchOut', label: 'Punch Out (HH:mm)', required: false, type: 'string', aliases: ['out_time', 'time_out', 'check_out'], description: 'Evening punch out time (e.g. 17:00)', sampleValue: '17:00' },
      { key: 'status', label: 'Status', required: false, type: 'string', aliases: ['state'], description: 'PRESENT, HALF_DAY, ABSENT, ON_LEAVE', sampleValue: 'PRESENT' },
      { key: 'remarks', label: 'Remarks', required: false, type: 'string', aliases: ['notes'], description: 'Supervisor remarks or biometric note', sampleValue: 'On-time site arrival' }
    ],
    sampleRows: [
      { employeeId: 'EMA-EMP-001', employeeName: 'Kasun Malinda', projectId: 'PIDM 26', date: '2026-08-26', punchIn: '08:00', punchOut: '17:00', status: 'PRESENT', remarks: 'On-time site arrival' },
      { employeeId: 'EMA-EMP-002', employeeName: 'Niroshan Priyadarshana', projectId: 'PIDM 28', date: '2026-08-26', punchIn: '07:45', punchOut: '17:30', status: 'PRESENT', remarks: 'Early site preparation' },
      { employeeId: 'EMA-EMP-003', employeeName: 'Gamini Rajapaksha', projectId: 'PIDM 26', date: '2026-08-26', punchIn: '08:15', punchOut: '17:00', status: 'PRESENT', remarks: 'Fleet driver daily duty' }
    ]
  },

  LEAVES: {
    title: 'Bulk Import Leave Records',
    description: 'Import employee annual leave, medical leave, casual leave records, and approvals.',
    directoryName: 'Leave Management Register',
    iconColor: 'text-indigo-700',
    fields: [
      { key: 'employeeId', label: 'Employee ID *', required: true, type: 'string', aliases: ['emp_id', 'staff_code', 'employee_code'], description: 'Staff code (e.g. EMA-EMP-001)', sampleValue: 'EMA-EMP-001' },
      { key: 'employeeName', label: 'Employee Name', required: false, type: 'string', aliases: ['name', 'full_name'], description: 'Employee name', sampleValue: 'Kasun Malinda' },
      { key: 'leaveTypeId', label: 'Leave Type *', required: true, type: 'string', aliases: ['type', 'leave_category'], description: 'ANNUAL, CASUAL, MEDICAL, DUTY, UNPAID', sampleValue: 'ANNUAL' },
      { key: 'startDate', label: 'Start Date *', required: true, type: 'date', aliases: ['from_date', 'leave_from'], description: 'Start date (YYYY-MM-DD)', sampleValue: '2026-08-10' },
      { key: 'endDate', label: 'End Date *', required: true, type: 'date', aliases: ['to_date', 'leave_to'], description: 'End date (YYYY-MM-DD)', sampleValue: '2026-08-12' },
      { key: 'workingDays', label: 'Working Days *', required: true, type: 'number', aliases: ['days', 'total_days', 'duration'], description: 'Number of working days off', sampleValue: 3 },
      { key: 'reason', label: 'Reason for Leave', required: false, type: 'string', aliases: ['purpose', 'notes'], description: 'Leave explanation', sampleValue: 'Family religious ceremony' }
    ],
    sampleRows: [
      { employeeId: 'EMA-EMP-001', employeeName: 'Kasun Malinda', leaveTypeId: 'ANNUAL', startDate: '2026-08-10', endDate: '2026-08-12', workingDays: 3, reason: 'Family religious ceremony' },
      { employeeId: 'EMA-EMP-004', employeeName: 'Thilini Sandamali', leaveTypeId: 'CASUAL', startDate: '2026-08-15', endDate: '2026-08-15', workingDays: 1, reason: 'Personal errands' },
      { employeeId: 'EMA-EMP-002', employeeName: 'Niroshan Priyadarshana', leaveTypeId: 'MEDICAL', startDate: '2026-08-18', endDate: '2026-08-19', workingDays: 2, reason: 'Medical treatment and doctor advice' }
    ]
  },

  OVERTIME: {
    title: 'Bulk Import Overtime Records',
    description: 'Import employee overtime hours, multipliers, and supervisor verified claims.',
    directoryName: 'Overtime Register',
    iconColor: 'text-orange-600',
    fields: [
      { key: 'employeeId', label: 'Employee ID *', required: true, type: 'string', aliases: ['emp_id', 'staff_code', 'employee_code'], description: 'Employee code (e.g. EMA-EMP-001)', sampleValue: 'EMA-EMP-001' },
      { key: 'employeeName', label: 'Employee Name', required: false, type: 'string', aliases: ['name', 'full_name'], description: 'Staff name', sampleValue: 'Kasun Malinda' },
      { key: 'projectId', label: 'Project Code', required: false, type: 'string', aliases: ['project', 'site_code'], description: 'Site project code', sampleValue: 'PIDM 26' },
      { key: 'date', label: 'Overtime Date *', required: true, type: 'date', aliases: ['ot_date', 'date'], description: 'Date overtime worked (YYYY-MM-DD)', sampleValue: '2026-08-25' },
      { key: 'hours', label: 'OT Hours *', required: true, type: 'number', aliases: ['ot_hours', 'duration', 'total_hours'], description: 'Number of overtime hours (e.g. 2.5)', sampleValue: 2.5 },
      { key: 'multiplier', label: 'OT Rate Multiplier', required: false, type: 'number', aliases: ['rate_multiplier', 'factor'], description: '1.5 for regular OT, 2.0 for Sunday/Holiday', sampleValue: 1.5 },
      { key: 'reason', label: 'Overtime Reason', required: false, type: 'string', aliases: ['justification', 'work_done'], description: 'Reason for overtime work', sampleValue: 'Night-time concrete curing supervision' }
    ],
    sampleRows: [
      { employeeId: 'EMA-EMP-001', employeeName: 'Kasun Malinda', projectId: 'PIDM 26', date: '2026-08-25', hours: 2.5, multiplier: 1.5, reason: 'Night-time concrete curing supervision' },
      { employeeId: 'EMA-EMP-002', employeeName: 'Niroshan Priyadarshana', projectId: 'PIDM 28', date: '2026-08-25', hours: 3.0, multiplier: 1.5, reason: 'Canal embankment emergency stabilization' },
      { employeeId: 'EMA-EMP-003', employeeName: 'Gamini Rajapaksha', projectId: 'PIDM 26', date: '2026-08-26', hours: 2.0, multiplier: 1.5, reason: 'Material delivery transport from Colombo' }
    ]
  },

  RUNNING_CHARTS: {
    title: 'Bulk Import Fleet Running Charts & Trips',
    description: 'Import vehicle daily running charts, trip meter readings, routes, and site purposes.',
    directoryName: 'Fleet Running Charts Registry',
    iconColor: 'text-violet-700',
    fields: [
      { key: 'date', label: 'Trip Date *', required: true, type: 'date', aliases: ['trip_date', 'date'], description: 'Date of travel (YYYY-MM-DD)', sampleValue: '2026-08-26' },
      { key: 'vehicleRegistration', label: 'Vehicle Reg Number *', required: true, type: 'string', aliases: ['vehicle_no', 'reg_no', 'plate', 'vehicle_reg'], description: 'Vehicle license plate (e.g. WP CAB-4521)', sampleValue: 'WP CAB-4521' },
      { key: 'driverName', label: 'Driver Name', required: false, type: 'string', aliases: ['driver', 'operator'], description: 'Driver assigned to trip', sampleValue: 'Sunil Shantha' },
      { key: 'startKm', label: 'Start Odometer (km) *', required: true, type: 'number', aliases: ['start_odometer', 'start_reading', 'km_start'], description: 'Odometer at start of journey', sampleValue: 45200 },
      { key: 'endKm', label: 'End Odometer (km) *', required: true, type: 'number', aliases: ['end_odometer', 'end_reading', 'km_end'], description: 'Odometer at end of journey', sampleValue: 45310 },
      { key: 'distanceKm', label: 'Distance (km)', required: false, type: 'number', aliases: ['distance', 'trip_km', 'total_km'], description: 'Total kilometers travelled', sampleValue: 110 },
      { key: 'route', label: 'Route / Path', required: false, type: 'string', aliases: ['travel_path', 'destination'], description: 'Starting point to destination', sampleValue: 'Colombo HO to Mirigama Site' },
      { key: 'purpose', label: 'Purpose of Trip', required: false, type: 'string', aliases: ['reason', 'task'], description: 'Official duty / site inspection', sampleValue: 'Site inspection and tool transport' },
      { key: 'projectCode', label: 'Project Code', required: false, type: 'string', aliases: ['project'], description: 'Project code (e.g. PIDM 26)', sampleValue: 'PIDM 26' }
    ],
    sampleRows: [
      { date: '2026-08-26', vehicleRegistration: 'WP CAB-4521', driverName: 'Sunil Shantha', startKm: 45200, endKm: 45310, distanceKm: 110, route: 'Colombo HO to Mirigama Site', purpose: 'Site inspection and tool transport', projectCode: 'PIDM 26' },
      { date: '2026-08-27', vehicleRegistration: 'WP NA-8842', driverName: 'Gamini Rajapaksha', startKm: 62400, endKm: 62490, distanceKm: 90, route: 'Gampaha Yard to Quarry and back', purpose: 'Aggregate transport', projectCode: 'PIDM 28' },
      { date: '2026-08-28', vehicleRegistration: 'CP CAR-1102', driverName: 'Mahinda Jayasinghe', startKm: 18500, endKm: 18640, distanceKm: 140, route: 'Colombo to Avissawella Bridgehead', purpose: 'Executive progress review', projectCode: 'PIDM 27' }
    ]
  },

  FUEL: {
    title: 'Bulk Import Fuel Logs',
    description: 'Import fuel station refuel receipts, liters pumped, total costs, and odometer readings.',
    directoryName: 'Fuel Records Registry',
    iconColor: 'text-amber-800',
    fields: [
      { key: 'date', label: 'Refuel Date *', required: true, type: 'date', aliases: ['fuel_date', 'date'], description: 'Date of fueling (YYYY-MM-DD)', sampleValue: '2026-08-26' },
      { key: 'vehicleRegistration', label: 'Vehicle Reg Number *', required: true, type: 'string', aliases: ['vehicle_no', 'reg_no', 'plate'], description: 'Vehicle registration number', sampleValue: 'WP CAB-4521' },
      { key: 'driverName', label: 'Driver Name', required: false, type: 'string', aliases: ['driver'], description: 'Driver who refueled', sampleValue: 'Sunil Shantha' },
      { key: 'liters', label: 'Fuel Quantity (Liters) *', required: true, type: 'number', aliases: ['volume', 'fuel_liters', 'qty'], description: 'Volume in liters pumped', sampleValue: 55.4 },
      { key: 'cost', label: 'Total Cost (LKR) *', required: true, type: 'number', aliases: ['total_cost', 'amount', 'fuel_cost', 'cost_lkr'], description: 'Total cost paid in LKR', sampleValue: 22160 },
      { key: 'fuelStation', label: 'Fuel Station / Shed', required: false, type: 'string', aliases: ['station', 'pump', 'vendor'], description: 'Name of fuel station (e.g. Ceypetco Mirigama)', sampleValue: 'Ceypetco Mirigama Filling Station' },
      { key: 'receiptNumber', label: 'Receipt / Bill Number', required: false, type: 'string', aliases: ['bill_no', 'receipt_no', 'invoice_no'], description: 'Fuel station printout receipt number', sampleValue: 'RCP-CEY-88412' },
      { key: 'odometerReading', label: 'Odometer at Pump', required: false, type: 'number', aliases: ['odometer', 'meter_reading', 'km'], description: 'Odometer reading at time of refuel', sampleValue: 45280 }
    ],
    sampleRows: [
      { date: '2026-08-26', vehicleRegistration: 'WP CAB-4521', driverName: 'Sunil Shantha', liters: 55.4, cost: 22160, fuelStation: 'Ceypetco Mirigama Filling Station', receiptNumber: 'RCP-CEY-88412', odometerReading: 45280 },
      { date: '2026-08-27', vehicleRegistration: 'WP NA-8842', driverName: 'Gamini Rajapaksha', liters: 80.0, cost: 32000, fuelStation: 'Lanka IOC Gampaha Central', receiptNumber: 'RCP-IOC-44120', odometerReading: 62450 },
      { date: '2026-08-28', vehicleRegistration: 'CP CAR-1102', driverName: 'Mahinda Jayasinghe', liters: 65.0, cost: 26000, fuelStation: 'Ceypetco Avissawella Town', receiptNumber: 'RCP-CEY-99214', odometerReading: 18600 }
    ]
  },

  MAINTENANCE: {
    title: 'Bulk Import Vehicle Maintenance & Service Logs',
    description: 'Import periodic service history, garage repair invoices, oil changes, and parts replacements.',
    directoryName: 'Fleet Maintenance Registry',
    iconColor: 'text-red-700',
    fields: [
      { key: 'date', label: 'Service Date *', required: true, type: 'date', aliases: ['maintenance_date', 'date'], description: 'Date serviced (YYYY-MM-DD)', sampleValue: '2026-08-20' },
      { key: 'vehicleRegistration', label: 'Vehicle Reg Number *', required: true, type: 'string', aliases: ['vehicle_no', 'reg_no', 'plate'], description: 'Vehicle registration plate', sampleValue: 'WP CAB-4521' },
      { key: 'serviceType', label: 'Service / Repair Type *', required: true, type: 'string', aliases: ['type', 'category', 'work_done'], description: 'Periodic 5000km Service, Brake Pad Replacement, Tire Change', sampleValue: 'Periodic 5,000km Engine Oil Service' },
      { key: 'serviceCenter', label: 'Garage / Service Center', required: false, type: 'string', aliases: ['garage', 'workshop', 'vendor'], description: 'Name of garage or dealership', sampleValue: 'Toyota Lanka Authorized Service' },
      { key: 'cost', label: 'Total Service Cost (LKR) *', required: true, type: 'number', aliases: ['amount', 'service_cost', 'total_lkr'], description: 'Total invoice cost in LKR', sampleValue: 34500 },
      { key: 'odometerAtService', label: 'Odometer at Service', required: false, type: 'number', aliases: ['odometer', 'meter', 'km'], description: 'Odometer reading during service', sampleValue: 45000 },
      { key: 'invoiceNumber', label: 'Invoice / Job Card No', required: false, type: 'string', aliases: ['invoice_no', 'job_card', 'bill_no'], description: 'Garage invoice reference', sampleValue: 'INV-TYL-99824' },
      { key: 'nextServiceKm', label: 'Next Due Odometer (km)', required: false, type: 'number', aliases: ['next_due', 'next_km'], description: 'Next service mileage threshold', sampleValue: 50000 }
    ],
    sampleRows: [
      { date: '2026-08-20', vehicleRegistration: 'WP CAB-4521', serviceType: 'Periodic 5,000km Engine Oil Service', serviceCenter: 'Toyota Lanka Authorized Service', cost: 34500, odometerAtService: 45000, invoiceNumber: 'INV-TYL-99824', nextServiceKm: 50000 },
      { date: '2026-08-22', vehicleRegistration: 'WP NA-8842', serviceType: 'Hydraulic Tipper Cylinder Seal Replacement', serviceCenter: 'Isuzu Lanka Workshop Gampaha', cost: 58000, odometerAtService: 62000, invoiceNumber: 'INV-ISZ-1104', nextServiceKm: 72000 },
      { date: '2026-08-25', vehicleRegistration: 'CP CAR-1102', serviceType: 'Full Wheel Alignment & Balance', serviceCenter: 'DSI Tyre Clinic Colombo', cost: 14500, odometerAtService: 18000, invoiceNumber: 'INV-DSI-5521', nextServiceKm: 28000 }
    ]
  },

  TRANSFERS: {
    title: 'Bulk Import Vehicle Transfers & Handovers',
    description: 'Import vehicle site re-allocations, driver handover forms, and condition records.',
    directoryName: 'Vehicle Transfers Registry',
    iconColor: 'text-blue-800',
    fields: [
      { key: 'transferDate', label: 'Transfer Date *', required: true, type: 'date', aliases: ['date', 'handover_date'], description: 'Date of vehicle handover (YYYY-MM-DD)', sampleValue: '2026-08-20' },
      { key: 'vehicleRegistration', label: 'Vehicle Reg Number *', required: true, type: 'string', aliases: ['vehicle_no', 'reg_no', 'plate'], description: 'Vehicle registration plate', sampleValue: 'WP CAB-4521' },
      { key: 'fromDriver', label: 'From Driver Name', required: false, type: 'string', aliases: ['previous_driver', 'handed_over_by'], description: 'Previous driver name', sampleValue: 'Sunil Shantha' },
      { key: 'toDriver', label: 'To Driver Name', required: false, type: 'string', aliases: ['new_driver', 'received_by'], description: 'New driver name', sampleValue: 'Gamini Rajapaksha' },
      { key: 'odometerAtTransfer', label: 'Odometer at Transfer', required: false, type: 'number', aliases: ['odometer', 'km'], description: 'Odometer reading at handover', sampleValue: 45100 },
      { key: 'fuelLevel', label: 'Fuel Level', required: false, type: 'string', aliases: ['tank_level'], description: 'Full, 3/4, 1/2, 1/4, Empty', sampleValue: '3/4' },
      { key: 'reason', label: 'Transfer Reason', required: false, type: 'string', aliases: ['purpose', 'remarks'], description: 'Site re-assignment reason', sampleValue: 'Transferred from PIDM 26 to PIDM 28 for bridge foundation work' }
    ],
    sampleRows: [
      { transferDate: '2026-08-20', vehicleRegistration: 'WP CAB-4521', fromDriver: 'Sunil Shantha', toDriver: 'Gamini Rajapaksha', odometerAtTransfer: 45100, fuelLevel: '3/4', reason: 'Transferred from PIDM 26 to PIDM 28 for bridge foundation work' },
      { transferDate: '2026-08-24', vehicleRegistration: 'WP NA-8842', fromDriver: 'Gamini Rajapaksha', toDriver: 'Mahinda Jayasinghe', odometerAtTransfer: 62300, fuelLevel: 'Full', reason: 'Driver roster rotation and site relocation' }
    ]
  },

  DOCUMENTS: {
    title: 'Bulk Import Enterprise Documents',
    description: 'Import document catalog entries, vouchers, insurance policies, permits, and CAD archives.',
    directoryName: 'Documents & Archive Directory',
    iconColor: 'text-slate-700',
    fields: [
      { key: 'DOC_REF', label: 'Document Ref *', required: true, type: 'string', aliases: ['doc_no', 'ref_no', 'id'], description: 'Document code (e.g. DOC-2026-0041)', sampleValue: 'DOC-2026-0041' },
      { key: 'TITLE', label: 'Document Title *', required: true, type: 'string', aliases: ['name', 'file_title', 'description'], description: 'Title or subject of document', sampleValue: 'PIDM 26 Environmental Clearance Permit' },
      { key: 'MODULE', label: 'Target Module', required: false, type: 'string', aliases: ['system_module', 'category_module'], description: 'Petty Cash, FleetTrack, Payments, Projects, HR, Procurement', sampleValue: 'Projects' },
      { key: 'CATEGORY', label: 'Document Category', required: false, type: 'string', aliases: ['type', 'doc_type'], description: 'Invoice, Receipt, Contract, Policy, Permit, Drawing, Report', sampleValue: 'Permit' },
      { key: 'LINKED_ENTITY_ID', label: 'Linked Entity / Project', required: false, type: 'string', aliases: ['entity_ref', 'project_code'], description: 'Project code or vehicle plate (e.g. PIDM 26)', sampleValue: 'PIDM 26' },
      { key: 'FILE_NAME', label: 'File Name', required: false, type: 'string', aliases: ['file', 'attachment_name'], description: 'Original filename', sampleValue: 'Environmental_Clearance_PIDM26.pdf' },
      { key: 'UPLOADED_DATE', label: 'Date Registered', required: false, type: 'date', aliases: ['date', 'issue_date'], description: 'Date registered (YYYY-MM-DD)', sampleValue: '2026-08-20' }
    ],
    sampleRows: [
      { DOC_REF: 'DOC-2026-0041', TITLE: 'PIDM 26 Environmental Clearance Permit', MODULE: 'Projects', CATEGORY: 'Permit', LINKED_ENTITY_ID: 'PIDM 26', FILE_NAME: 'Environmental_Clearance_PIDM26.pdf', UPLOADED_DATE: '2026-08-20' },
      { DOC_REF: 'DOC-2026-0042', TITLE: 'WP CAB-4521 Comprehensive Insurance Policy', MODULE: 'FleetTrack', CATEGORY: 'Policy', LINKED_ENTITY_ID: 'WP CAB-4521', FILE_NAME: 'Insurance_WPCAB4521_2026.pdf', UPLOADED_DATE: '2026-08-22' },
      { DOC_REF: 'DOC-2026-0043', TITLE: 'Tokyo Super Cement Batch Quality Test Certificate', MODULE: 'Procurement', CATEGORY: 'Report', LINKED_ENTITY_ID: 'PO-202608-011', FILE_NAME: 'TokyoSuper_TestCert_Aug2026.pdf', UPLOADED_DATE: '2026-08-25' }
    ]
  }
};

interface UniversalBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importType: DirectoryImportType;
  onImportComplete: (records: Record<string, any>[]) => { count: number; batchId: string } | void;
}

export const UniversalBulkImportModal: React.FC<UniversalBulkImportModalProps> = ({
  isOpen,
  onClose,
  importType,
  onImportComplete
}) => {
  const { currentUser, currentRole } = useEnterprise();
  const config = DIRECTORY_CONFIGS[importType] || DIRECTORY_CONFIGS.VEHICLES;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pasteContent, setPasteContent] = useState<string>('');
  const [step, setStep] = useState<'input' | 'mapping' | 'preview' | 'authorize'>('input');
  const [fileName, setFileName] = useState<string>('');
  
  // Raw parsed matrix
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[][]>([]);

  // Column mapping: fieldKey -> rawHeaderIndex
  const [columnMapping, setColumnMapping] = useState<Record<string, number>>({});

  // Processed Records
  const [processedRecords, setProcessedRecords] = useState<{
    data: Record<string, any>;
    status: 'VALID' | 'WARNING' | 'ERROR';
    messages: string[];
    isDuplicate: boolean;
  }[]>([]);

  const [filterMode, setFilterMode] = useState<'ALL' | 'VALID' | 'ISSUES'>('ALL');
  const [duplicateStrategy, setDuplicateStrategy] = useState<'OVERWRITE' | 'SKIP' | 'APPEND'>('OVERWRITE');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importSuccessResult, setImportSuccessResult] = useState<{ count: number; batchId: string } | null>(null);

  // Admin Security Authorization states
  const [securityKey, setSecurityKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [lockoutSec, setLockoutSec] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      const status = adminSecurityService.getSecurityStatus();
      if (status.isLockedOut) {
        setLockoutSec(status.lockoutRemainingSeconds);
      } else {
        setLockoutSec(0);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (lockoutSec <= 0) return;
    const interval = setInterval(() => {
      setLockoutSec(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSec]);

  if (!isOpen) return null;

  const activeUser = {
    id: 'usr-admin',
    name: currentUser || 'BUDDIKA',
    role: currentRole || 'ADMIN'
  };

  // Auto-map headers
  const autoMapColumns = (headers: string[]) => {
    const mapping: Record<string, number> = {};
    const normalizedHeaders = headers.map(h => String(h || '').toLowerCase().replace(/[^a-z0-9]/g, ''));

    config.fields.forEach(field => {
      // 1. Direct match with key
      const keyNorm = field.key.toLowerCase().replace(/[^a-z0-9]/g, '');
      let foundIdx = normalizedHeaders.findIndex(h => h === keyNorm);

      // 2. Direct match with label
      if (foundIdx === -1) {
        const labelNorm = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');
        foundIdx = normalizedHeaders.findIndex(h => h === labelNorm || h.includes(labelNorm) || labelNorm.includes(h));
      }

      // 3. Aliases match
      if (foundIdx === -1) {
        for (const alias of field.aliases) {
          const aliasNorm = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
          foundIdx = normalizedHeaders.findIndex(h => h === aliasNorm || h.includes(aliasNorm));
          if (foundIdx !== -1) break;
        }
      }

      if (foundIdx !== -1) {
        mapping[field.key] = foundIdx;
      }
    });

    return mapping;
  };

  // Parse Excel / CSV File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (!data || data.length < 2) {
          alert('Uploaded file does not contain enough data rows (minimum header row + 1 data row required).');
          return;
        }

        const headers = data[0].map(h => String(h || '').trim());
        const rows = data.slice(1).filter(r => r.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== ''));

        setRawHeaders(headers);
        setRawRows(rows);

        const initialMapping = autoMapColumns(headers);
        setColumnMapping(initialMapping);
        setStep('mapping');
      } catch (err) {
        console.error('Error parsing file:', err);
        alert('Failed to read Excel / CSV file. Please ensure it is a valid spreadsheet format.');
      }
    };

    reader.readAsBinaryString(file);
  };

  // Parse Pasted Data
  const handleParsePastedData = () => {
    if (!pasteContent.trim()) {
      alert('Please paste table data from Excel or Google Sheets first.');
      return;
    }

    const lines = pasteContent.trim().split(/\r?\n/);
    if (lines.length < 2) {
      alert('Please paste at least 2 rows (header row + at least 1 data row).');
      return;
    }

    // Detect delimiter (Tab or Comma or Semicolon)
    const firstLine = lines[0];
    let delimiter = '\t';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(',')) delimiter = ',';
    else if (firstLine.includes(';')) delimiter = ';';

    const rows = lines.map(line => line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, '')));
    const headers = rows[0];
    const dataRows = rows.slice(1).filter(r => r.some(c => c !== ''));

    setFileName('Pasted_Clipboard_Table.txt');
    setRawHeaders(headers);
    setRawRows(dataRows);

    const initialMapping = autoMapColumns(headers);
    setColumnMapping(initialMapping);
    setStep('mapping');
  };

  // Download Sample Template
  const handleDownloadTemplate = (format: 'xlsx' | 'csv' = 'xlsx') => {
    const ws = XLSX.utils.json_to_sheet(config.sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, config.directoryName.slice(0, 31));

    const exportFileName = `${config.directoryName.replace(/\s+/g, '_')}_Import_Template.${format}`;
    XLSX.writeFile(wb, exportFileName, { bookType: format });
  };

  // Apply mapping and validate rows
  const handleProceedToPreview = () => {
    // Check required fields mapping
    const missingRequired = config.fields
      .filter(f => f.required && columnMapping[f.key] === undefined)
      .map(f => f.label);

    if (missingRequired.length > 0) {
      alert(`Please map all mandatory fields before continuing:\n• ${missingRequired.join('\n• ')}`);
      return;
    }

    const processed = rawRows.map((row, idx) => {
      const record: Record<string, any> = {};
      const messages: string[] = [];
      let status: 'VALID' | 'WARNING' | 'ERROR' = 'VALID';

      config.fields.forEach(field => {
        const colIdx = columnMapping[field.key];
        if (colIdx !== undefined && colIdx >= 0 && colIdx < row.length) {
          let val = row[colIdx];
          
          // Type casting & cleaning
          if (val !== undefined && val !== null) {
            if (field.type === 'number') {
              const num = Number(String(val).replace(/[^0-9.-]/g, ''));
              val = isNaN(num) ? 0 : num;
            } else if (field.type === 'boolean') {
              const s = String(val).toLowerCase().trim();
              val = s === 'true' || s === '1' || s === 'yes' || s === 'active';
            } else if (field.type === 'date') {
              // Convert Excel serial date or standard date
              if (typeof val === 'number') {
                const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
                val = jsDate.toISOString().slice(0, 10);
              } else {
                val = String(val).trim();
              }
            } else {
              val = String(val).trim();
            }
          }

          record[field.key] = val;
        }

        // Validate required field
        if (field.required) {
          const v = record[field.key];
          if (v === undefined || v === null || String(v).trim() === '') {
            status = 'ERROR';
            messages.push(`Missing mandatory field: ${field.label}`);
          }
        }
      });

      return {
        data: record,
        status,
        messages,
        isDuplicate: false
      };
    });

    setProcessedRecords(processed);
    setStep('preview');
  };

  // Proceed to Step 4: Admin Authorization
  const handleProceedToAuthorize = () => {
    const validRows = processedRecords.filter(r => r.status !== 'ERROR');
    if (validRows.length === 0) {
      alert('No valid records to import. Please review mapping and errors.');
      return;
    }

    const status = adminSecurityService.getSecurityStatus();
    if (status.isLockedOut) {
      setLockoutSec(status.lockoutRemainingSeconds);
    } else {
      setLockoutSec(0);
    }
    setSecurityKey('');
    setAuthError('');
    setShowKey(false);
    setStep('authorize');
  };

  // Commit Import with Admin Security Key Authorization
  const handleExecuteAuthorizedImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = processedRecords
      .filter(r => r.status !== 'ERROR')
      .map(r => r.data);

    if (validRows.length === 0) {
      setAuthError('No valid records found for import.');
      return;
    }

    if (!securityKey.trim()) {
      setAuthError('Admin Security Key is required.');
      return;
    }

    setIsProcessing(true);
    setAuthError('');

    const actionDescription = `Bulk import into ${config.directoryName} (${validRows.length} valid records from "${fileName || 'Tabular Data'}")`;

    try {
      // 1. Verify key with centralized Admin Authorization Key service
      const verification = await adminSecurityService.verifySecurityKey(
        securityKey,
        actionDescription,
        activeUser
      );

      if (!verification.success) {
        if (verification.isLockedOut && verification.lockoutRemainingSeconds) {
          setLockoutSec(verification.lockoutRemainingSeconds);
        }
        setAuthError(verification.message || 'Invalid Admin Authorization Key. Import cancelled.');

        // Record failed attempt audit
        adminSecurityService.recordAuditEvent({
          userId: activeUser.id,
          userName: activeUser.name,
          userRole: activeUser.role,
          action: 'IMPORT_AUTHORIZATION_FAILED',
          targetRecord: `${importType}:BULK_IMPORT`,
          result: 'FAILED',
          reason: `Failed authorization for bulk import into ${config.directoryName}. ${verification.message}`
        });

        setIsProcessing(false);
        return;
      }

      // 2. Key is valid: execute import immediately
      const batchId = `BATCH-${importType.slice(0, 4)}-${Date.now().toString().slice(-6)}`;
      const res = onImportComplete(validRows);

      // 3. Record successful import audit event
      adminSecurityService.recordAuditEvent({
        userId: activeUser.id,
        userName: activeUser.name,
        userRole: activeUser.role,
        action: 'IMPORT_EXECUTED',
        targetRecord: `${importType}:${batchId}`,
        result: 'SUCCESS',
        reason: `Bulk import executed successfully: ${validRows.length} records imported into ${config.directoryName} from "${fileName || 'Tabular input'}". Skipped/error rows: ${processedRecords.length - validRows.length}. Strategy: ${duplicateStrategy}.`
      });

      if (res && res.count !== undefined) {
        setImportSuccessResult(res);
      } else {
        setImportSuccessResult({ count: validRows.length, batchId });
      }
    } catch (e: any) {
      setAuthError(`Import error: ${e?.message || 'Failed to complete import process.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered rows for preview table
  const displayedPreviewRows = processedRecords.filter(r => {
    if (filterMode === 'VALID') return r.status === 'VALID';
    if (filterMode === 'ISSUES') return r.status !== 'VALID';
    return true;
  });

  const validCount = processedRecords.filter(r => r.status === 'VALID').length;
  const warningCount = processedRecords.filter(r => r.status === 'WARNING').length;
  const errorCount = processedRecords.filter(r => r.status === 'ERROR').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">{config.title}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {config.directoryName}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{config.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <div className={`flex items-center gap-1.5 font-medium ${step === 'input' ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step === 'input' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>1</span>
              <span>Upload</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            <div className={`flex items-center gap-1.5 font-medium ${step === 'mapping' ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step === 'mapping' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>2</span>
              <span>Mapping</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            <div className={`flex items-center gap-1.5 font-medium ${step === 'preview' ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step === 'preview' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>3</span>
              <span>Validate</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            <div className={`flex items-center gap-1.5 font-medium ${step === 'authorize' ? 'text-amber-600 font-bold' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step === 'authorize' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'}`}>4</span>
              <span>Authorize</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadTemplate('xlsx')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Download Excel Template (.xlsx)
            </button>
            <button
              onClick={() => handleDownloadTemplate('csv')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              CSV (.csv)
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[68vh] overflow-y-auto">

          {/* SUCCESS SCREEN */}
          {importSuccessResult ? (
            <div className="py-12 px-6 text-center max-w-lg mx-auto">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Bulk Import Successfully Completed!</h3>
              <p className="text-slate-600 text-sm mb-6">
                Successfully processed and imported <strong className="text-slate-900 font-bold">{importSuccessResult.count} records</strong> into the <strong className="text-slate-900">{config.directoryName}</strong>.
              </p>
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Batch Identifier:</span>
                  <span className="font-mono font-bold text-slate-800">{importSuccessResult.batchId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Registry:</span>
                  <span className="font-medium text-slate-800">{config.directoryName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Audit Status:</span>
                  <span className="font-semibold text-emerald-700">Logged to Enterprise Audit Vault</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm transition-colors shadow-md"
              >
                Close Window & Return to Directory
              </button>
            </div>
          ) : step === 'input' ? (
            /* STEP 1: UPLOAD / PASTE */
            <div className="space-y-6">
              
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    activeTab === 'upload'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Upload Spreadsheet File (.xlsx, .xls, .csv)
                </button>
                <button
                  onClick={() => setActiveTab('paste')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    activeTab === 'paste'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Clipboard className="w-4 h-4" />
                  Direct Paste from Excel / Google Sheets
                </button>
              </div>

              {activeTab === 'upload' ? (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/30 rounded-2xl p-10 text-center cursor-pointer transition-all duration-150 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="w-16 h-16 bg-white shadow-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 group-hover:scale-105 transition-transform">
                      <Upload className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 mb-1">
                      Choose Excel or CSV file to import
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                      Drag and drop your file here, or click to browse files on your computer. Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv).
                    </p>
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-xs group-hover:border-indigo-300">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      Browse Spreadsheet File
                    </span>
                  </div>

                  {/* Schema fields guidance */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-indigo-500" />
                      Expected Fields & Columns for {config.directoryName}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {config.fields.map(f => (
                        <div key={f.key} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{f.label}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${f.required ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                              {f.required ? 'Mandatory' : 'Optional'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 truncate">{f.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Paste Tabular Data (Include Column Header Row)
                    </label>
                    <textarea
                      rows={10}
                      value={pasteContent}
                      onChange={(e) => setPasteContent(e.target.value)}
                      placeholder={`Copy rows from Excel or Google Sheets (including the top header row) and paste here:\n\n${config.fields.map(f => f.label.replace(' *', '')).join('\t')}\n${config.sampleRows.map(r => Object.values(r).join('\t')).join('\n')}`}
                      className="w-full font-mono text-xs p-4 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleParsePastedData}
                      disabled={!pasteContent.trim()}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm inline-flex items-center gap-2"
                    >
                      <span>Analyze & Map Pasted Data</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : step === 'mapping' ? (
            /* STEP 2: COLUMN MAPPING */
            <div className="space-y-6">
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-indigo-950">Column Mapping Review</h3>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Source: <strong className="font-semibold">{fileName}</strong> ({rawRows.length} data rows detected).
                    Match your spreadsheet columns with the system fields below.
                  </p>
                </div>
                <button
                  onClick={() => setColumnMapping(autoMapColumns(rawHeaders))}
                  className="px-3 py-1.5 bg-white border border-indigo-300 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Re-run Auto Match
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-1/3">Target System Field</th>
                      <th className="p-3 w-1/3">Your File Column</th>
                      <th className="p-3 w-1/3">Sample First Row Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {config.fields.map(field => {
                      const selectedIdx = columnMapping[field.key];
                      const sampleVal = selectedIdx !== undefined && rawRows.length > 0 ? rawRows[0][selectedIdx] : '—';
                      const isMapped = selectedIdx !== undefined && selectedIdx >= 0;

                      return (
                        <tr key={field.key} className={`hover:bg-slate-50/80 transition-colors ${field.required && !isMapped ? 'bg-rose-50/50' : ''}`}>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                              <span>{field.label}</span>
                              {field.required && (
                                <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">
                                  Required
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 block truncate">{field.description}</span>
                          </td>
                          <td className="p-3">
                            <select
                              value={selectedIdx !== undefined ? selectedIdx : ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? undefined : Number(e.target.value);
                                setColumnMapping(prev => {
                                  const next = { ...prev };
                                  if (val === undefined) delete next[field.key];
                                  else next[field.key] = val;
                                  return next;
                                });
                              }}
                              className={`w-full text-xs p-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 bg-white font-medium ${
                                field.required && !isMapped ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                              }`}
                            >
                              <option value="">-- Skip / Unmapped --</option>
                              {rawHeaders.map((header, hIdx) => (
                                <option key={hIdx} value={hIdx}>
                                  Column {hIdx + 1}: {header || `(Column ${hIdx + 1})`}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3 font-mono text-slate-600 bg-slate-50/50">
                            {sampleVal !== undefined && sampleVal !== null && String(sampleVal).trim() !== '' ? (
                              <span className="text-slate-800 font-semibold">{String(sampleVal)}</span>
                            ) : (
                              <span className="text-slate-400 italic">empty</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setStep('input')}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  Back to File Upload
                </button>
                <button
                  onClick={handleProceedToPreview}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm inline-flex items-center gap-2"
                >
                  <span>Proceed to Validate & Review</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : step === 'preview' ? (
            /* STEP 3: PREVIEW & COMMIT */
            <div className="space-y-6">
              
              {/* Summary Stats Badges */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-xs text-slate-500 font-semibold block">Total Rows</span>
                  <span className="text-xl font-bold text-slate-900">{processedRecords.length}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                  <span className="text-xs text-emerald-600 font-semibold block">Ready to Import</span>
                  <span className="text-xl font-bold text-emerald-700">{validCount}</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <span className="text-xs text-amber-600 font-semibold block">Warnings</span>
                  <span className="text-xl font-bold text-amber-700">{warningCount}</span>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                  <span className="text-xs text-rose-600 font-semibold block">Blocking Errors</span>
                  <span className="text-xl font-bold text-rose-700">{errorCount}</span>
                </div>
              </div>

              {/* Filter and Duplicate Strategy */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 uppercase">View:</span>
                  <button
                    onClick={() => setFilterMode('ALL')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${filterMode === 'ALL' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                  >
                    All ({processedRecords.length})
                  </button>
                  <button
                    onClick={() => setFilterMode('VALID')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${filterMode === 'VALID' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 border border-emerald-200'}`}
                  >
                    Valid Only ({validCount})
                  </button>
                  <button
                    onClick={() => setFilterMode('ISSUES')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${filterMode === 'ISSUES' ? 'bg-rose-600 text-white' : 'bg-white text-rose-700 border border-rose-200'}`}
                  >
                    Issues Only ({errorCount + warningCount})
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-600">Existing Records:</span>
                  <select
                    value={duplicateStrategy}
                    onChange={(e) => setDuplicateStrategy(e.target.value as any)}
                    className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="OVERWRITE">Update / Merge Existing Records</option>
                    <option value="SKIP">Skip Duplicates</option>
                    <option value="APPEND">Always Append as New Records</option>
                  </select>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-80 shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="p-2.5 w-12 text-center">#</th>
                      <th className="p-2.5 w-24 text-center">Status</th>
                      {config.fields.map(f => (
                        <th key={f.key} className="p-2.5 whitespace-nowrap">{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {displayedPreviewRows.map((row, idx) => (
                      <tr key={idx} className={`hover:bg-slate-50/80 ${row.status === 'ERROR' ? 'bg-rose-50/40' : ''}`}>
                        <td className="p-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-2.5 text-center">
                          {row.status === 'VALID' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full" title={row.messages.join('; ')}>
                              <XCircle className="w-3 h-3" /> Error
                            </span>
                          )}
                        </td>
                        {config.fields.map(f => (
                          <td key={f.key} className="p-2.5 whitespace-nowrap font-medium text-slate-700 max-w-[200px] truncate">
                            {row.data[f.key] !== undefined && row.data[f.key] !== null ? String(row.data[f.key]) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  Back to Column Mapping
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-bulk-import-proceed-auth"
                    onClick={handleProceedToAuthorize}
                    disabled={isProcessing || validCount === 0}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-md inline-flex items-center gap-2"
                  >
                    <Database className="w-4 h-4" />
                    <span>Proceed to Admin Authorization ({validCount} Records)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* STEP 4: ADMIN AUTHORIZATION */
            <form onSubmit={handleExecuteAuthorizedImport} className="max-w-xl mx-auto py-4 space-y-5">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                      Elevated Data Management
                    </span>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      Admin Authorization Required
                    </h3>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Directory:</span>
                    <strong className="text-white">{config.directoryName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Valid Records:</span>
                    <strong className="text-emerald-400 font-mono">{validCount} rows</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Data Source:</span>
                    <span className="text-slate-300 truncate max-w-[240px]">{fileName || 'Pasted Tabular Data'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Merge Strategy:</span>
                    <span className="text-indigo-300 font-semibold">{duplicateStrategy}</span>
                  </div>
                </div>
              </div>

              {lockoutSec > 0 && (
                <div className="p-3.5 bg-rose-950/60 border border-rose-700 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <p className="font-bold">Security Lockout Active</p>
                    <p className="text-[11px] text-rose-200/80 mt-0.5">
                      Too many incorrect authorization attempts. Access unlocked in <strong>{lockoutSec}s</strong>.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Enter Admin Security Key
                </label>
                <div className="relative">
                  <input
                    id="input-bulk-import-security-key"
                    type={showKey ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={securityKey}
                    onChange={(e) => {
                      setSecurityKey(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    disabled={lockoutSec > 0}
                    autoFocus
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 font-mono tracking-widest placeholder:tracking-normal placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all pr-12 disabled:opacity-50 text-center shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                    tabIndex={-1}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1">
                <span>Authorized Admin: <strong className="text-slate-700">{activeUser.name}</strong></span>
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Audit Vault Logged</span>
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep('preview')}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  Back to Preview
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-authorize-and-import"
                    type="submit"
                    disabled={isProcessing || !securityKey.trim() || lockoutSec > 0}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 active:scale-95"
                  >
                    {isProcessing ? (
                      <span>Verifying & Importing...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Authorize & Import</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
