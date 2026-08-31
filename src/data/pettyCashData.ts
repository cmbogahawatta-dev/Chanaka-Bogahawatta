import { Expense, Income, Supervisor, Project, ExpenseCategory, InternalTransfer, GoogleSheetsConfig } from '../types/pettyCashTypes';

export const initialSupervisors: Supervisor[] = [
  {
    id: 'sup-1',
    SUPERVISOR_ID: 'SUP-001',
    SUPERVISOR_NAME: 'BUDDIKA',
    PHONE: '+94 77 342 1890',
    EMAIL: 'buddika@company.com',
    ACTIVE: true,
    OPENING_PETTY_CASH: 100000.00,
    CURRENT_BALANCE: 104265.00,
    REMARKS: 'Lead Civil Supervisor - Southern Province & PIDM Projects',
    ASSIGNED_PROJECTS: ['PIDM 26', 'PIDM 28', 'RDA-DIT-MAH-27'],
    AVATAR_COLOR: 'emerald'
  },
  {
    id: 'sup-2',
    SUPERVISOR_ID: 'SUP-002',
    SUPERVISOR_NAME: 'GAYANI',
    PHONE: '+94 71 892 4432',
    EMAIL: 'gayani@company.com',
    ACTIVE: true,
    OPENING_PETTY_CASH: 75000.00,
    CURRENT_BALANCE: 67700.00,
    REMARKS: 'Quantity Surveyor & Procurement Site Supervisor',
    ASSIGNED_PROJECTS: ['PIDB 26', 'PIDM 2', 'RDA-RD-BDL-01'],
    AVATAR_COLOR: 'indigo'
  },
  {
    id: 'sup-3',
    SUPERVISOR_ID: 'SUP-003',
    SUPERVISOR_NAME: 'GEETH',
    PHONE: '+94 76 512 9081',
    EMAIL: 'geeth@company.com',
    ACTIVE: true,
    OPENING_PETTY_CASH: 50000.00,
    CURRENT_BALANCE: 33728.00,
    REMARKS: 'Structural & Earthworks Supervisor',
    ASSIGNED_PROJECTS: ['RDA-DIT-MON-28', 'RDA-RD-BDL-15'],
    AVATAR_COLOR: 'amber'
  },
  {
    id: 'sup-4',
    SUPERVISOR_ID: 'SUP-004',
    SUPERVISOR_NAME: 'LASANTHA',
    PHONE: '+94 77 901 3245',
    EMAIL: 'lasantha@company.com',
    ACTIVE: true,
    OPENING_PETTY_CASH: 50000.00,
    CURRENT_BALANCE: -9721.07,
    REMARKS: 'Site Operations & Asphalt Laying Supervisor',
    ASSIGNED_PROJECTS: ['PIDM 26', 'RDA-RDA-AKK-05'],
    AVATAR_COLOR: 'rose'
  }
];

export const initialProjects: Project[] = [
  {
    id: 'prj-1',
    PROJECT_ID: 'PRJ-001',
    PROJECT_CODE: 'PIDB 26',
    PROJECT_NAME: 'Badulla Provincial Road Widening & Drainage Package 26',
    CLIENT: 'Road Development Authority (RDA)',
    LOCATION: 'Badulla / Passara',
    CONTRACT_VALUE: 185000000.00,
    START_DATE: '01/01/2026',
    END_DATE: '31/12/2026',
    STATUS: 'Active',
    PROJECT_MANAGER: 'Eng. K. Perera',
    REMARKS: 'Bridge culverts and concrete paving phase'
  },
  {
    id: 'prj-2',
    PROJECT_ID: 'PRJ-002',
    PROJECT_CODE: 'PIDM 2',
    PROJECT_NAME: 'Monaragala District Highway Access Link Phase 2',
    CLIENT: 'Ministry of Transport & Highways',
    LOCATION: 'Monaragala',
    CONTRACT_VALUE: 142000000.00,
    START_DATE: '15/02/2026',
    END_DATE: '15/11/2026',
    STATUS: 'Active',
    PROJECT_MANAGER: 'Eng. S. Jayasinghe',
    REMARKS: 'Sub-base compaction and embankment filling'
  },
  {
    id: 'prj-3',
    PROJECT_ID: 'PRJ-003',
    PROJECT_CODE: 'PIDM 26',
    PROJECT_NAME: 'Matara Southern Expressway Feeder Rehabilitation 26',
    CLIENT: 'RDA Southern Provincial Office',
    LOCATION: 'Matara / Akuressa',
    CONTRACT_VALUE: 220000000.00,
    START_DATE: '10/01/2026',
    END_DATE: '28/02/2027',
    STATUS: 'Active',
    PROJECT_MANAGER: 'Eng. D. Weerasinghe',
    REMARKS: 'Heavy asphalt paving & storm water drainage construction'
  },
  {
    id: 'prj-4',
    PROJECT_ID: 'PRJ-004',
    PROJECT_CODE: 'PIDM 28',
    PROJECT_NAME: 'Hambantota Coastal Bypass Connection 28',
    CLIENT: 'Road Development Authority',
    LOCATION: 'Hambantota',
    CONTRACT_VALUE: 168000000.00,
    START_DATE: '01/03/2026',
    END_DATE: '30/11/2026',
    STATUS: 'Active',
    PROJECT_MANAGER: 'Eng. N. Fernando',
    REMARKS: 'Kerb laying and bitumen spraying'
  },
  {
    id: 'prj-5',
    PROJECT_ID: 'PRJ-005',
    PROJECT_CODE: 'RDA-DIT-MAH-27',
    PROJECT_NAME: 'Mahiyangana Town Bypass & Junction Improvement',
    CLIENT: 'RDA Uva Province',
    LOCATION: 'Mahiyangana',
    CONTRACT_VALUE: 95000000.00,
    START_DATE: '15/01/2026',
    END_DATE: '30/09/2026',
    STATUS: 'Active',
    PROJECT_MANAGER: 'Eng. K. Perera',
    REMARKS: 'Retaining walls and pedestrian walkways'
  },
  {
    id: 'prj-6',
    PROJECT_ID: 'PRJ-006',
    PROJECT_CODE: 'RDA-DIT-MON-28',
    PROJECT_NAME: 'Monaragala Town Centre Internal Pavement Upgrade',
    CLIENT: 'Uva Provincial Council',
    LOCATION: 'Monaragala',
    CONTRACT_VALUE: 78000000.00,
    START_DATE: '01/02/2026',
    END_DATE: '31/08/2026',
    STATUS: 'Active',
    PROJECT_MANAGER: 'Eng. S. Jayasinghe',
    REMARKS: 'Interlocking pavers & storm drains'
  },
  {
    id: 'prj-7',
    PROJECT_ID: 'PRJ-007',
    PROJECT_CODE: 'RDA-RD-BDL-01',
    PROJECT_NAME: 'Badulla Ella Scenic Corridor Strengthening 01',
    CLIENT: 'RDA Central & Uva',
    LOCATION: 'Ella / Bandarawela',
    CONTRACT_VALUE: 135000000.00,
    START_DATE: '15/02/2026',
    END_DATE: '31/12/2026',
    STATUS: 'Active',
    PROJECT_MANAGER: 'Eng. N. Fernando',
    REMARKS: 'Slope stabilization & rock bolting works'
  },
  {
    id: 'prj-8',
    PROJECT_ID: 'PRJ-008',
    PROJECT_CODE: 'RDA-RD-BDL-15',
    PROJECT_NAME: 'Badulla Mahiyangana Highway Section 15 Upgrade',
    CLIENT: 'RDA Uva Province',
    LOCATION: 'Badulla',
    CONTRACT_VALUE: 110000000.00,
    START_DATE: '01/01/2026',
    END_DATE: '31/10/2026',
    STATUS: 'Active',
    PROJECT_MANAGER: 'Eng. K. Perera',
    REMARKS: 'Culvert extension and asphalt binder course'
  },
  {
    id: 'prj-9',
    PROJECT_ID: 'PRJ-009',
    PROJECT_CODE: 'RDA-RDA-AKK-05',
    PROJECT_NAME: 'Akkaraipattu Coastal Highway Bridge Approaches',
    CLIENT: 'RDA Eastern Province',
    LOCATION: 'Akkaraipattu / Ampara',
    CONTRACT_VALUE: 190000000.00,
    START_DATE: '01/03/2026',
    END_DATE: '31/01/2027',
    STATUS: 'Active',
    PROJECT_MANAGER: 'Eng. D. Weerasinghe',
    REMARKS: 'Bridge approach slab casting and guardrails'
  }
];

export const initialCategories: ExpenseCategory[] = [
  {
    id: 'cat-5000',
    CATEGORY_ID: 'CAT-5000',
    CATEGORY_CODE: '5000',
    CATEGORY_NAME: '5000 Construction Materials',
    CATEGORY_GROUP: 'Direct Project Cost',
    ACTIVE: true,
    REMARKS: 'Aggregates, cement, sand, reinforcing steel, bricks'
  },
  {
    id: 'cat-5010',
    CATEGORY_ID: 'CAT-5010',
    CATEGORY_CODE: '5010',
    CATEGORY_NAME: '5010 Main Materials (VAT Purchase)',
    CATEGORY_GROUP: 'Direct Project Cost',
    ACTIVE: true,
    REMARKS: 'Direct VAT registered commercial bulk materials'
  },
  {
    id: 'cat-5100',
    CATEGORY_ID: 'CAT-5100',
    CATEGORY_CODE: '5100',
    CATEGORY_NAME: '5100 Sub-Contractors Cost',
    CATEGORY_GROUP: 'Direct Project Cost',
    ACTIVE: true,
    REMARKS: 'Specialist masonry, bar bending, drainage sub-contracts'
  },
  {
    id: 'cat-5110',
    CATEGORY_ID: 'CAT-5110',
    CATEGORY_CODE: '5110',
    CATEGORY_NAME: '5110 Supplier / Subcontractor Advance',
    CATEGORY_GROUP: 'Direct Project Cost',
    ACTIVE: true,
    REMARKS: 'Initial mobilization advances for site sub-contractors'
  },
  {
    id: 'cat-5200',
    CATEGORY_ID: 'CAT-5200',
    CATEGORY_CODE: '5200',
    CATEGORY_NAME: '5200 Labour / Gross Wages',
    CATEGORY_GROUP: 'Direct Project Cost',
    ACTIVE: true,
    REMARKS: 'Daily site labor, overtime, casual workers'
  },
  {
    id: 'cat-5300',
    CATEGORY_ID: 'CAT-5300',
    CATEGORY_CODE: '5300',
    CATEGORY_NAME: '5300 Equipment & Machinery Hire',
    CATEGORY_GROUP: 'Direct Project Cost',
    ACTIVE: true,
    REMARKS: 'Excavator, backhoe, roller, tipper daily rentals'
  },
  {
    id: 'cat-5400',
    CATEGORY_ID: 'CAT-5400',
    CATEGORY_CODE: '5400',
    CATEGORY_NAME: '5400 Fuel & Lubricants – Project Use',
    CATEGORY_GROUP: 'Direct Project Cost',
    ACTIVE: true,
    REMARKS: 'Diesel for site generators, compactors, heavy plant'
  },
  {
    id: 'cat-5510',
    CATEGORY_ID: 'CAT-5510',
    CATEGORY_CODE: '5510',
    CATEGORY_NAME: '5510 Fuel for Company Vehicle',
    CATEGORY_GROUP: 'Direct Project Cost',
    ACTIVE: true,
    REMARKS: 'Fuel for project assigned supervisor double-cabs'
  },
  {
    id: 'cat-5600',
    CATEGORY_ID: 'CAT-5600',
    CATEGORY_CODE: '5600',
    CATEGORY_NAME: '5600 Site Consumables / Small Tools',
    CATEGORY_GROUP: 'Site Overheads',
    ACTIVE: true,
    REMARKS: 'Safety helmets, boots, shovels, wheelbarrows, measuring tapes'
  },
  {
    id: 'cat-5650',
    CATEGORY_ID: 'CAT-5650',
    CATEGORY_CODE: '5650',
    CATEGORY_NAME: '5650 Site Welfare / Food & Beverages',
    CATEGORY_GROUP: 'Site Overheads',
    ACTIVE: true,
    REMARKS: 'Drinking water, tea, overtime refreshments for site crew'
  },
  {
    id: 'cat-5660',
    CATEGORY_ID: 'CAT-5660',
    CATEGORY_CODE: '5660',
    CATEGORY_NAME: '5660 Subcontractors (Employer & Engineer)',
    CATEGORY_GROUP: 'Direct Project Cost',
    ACTIVE: true,
    REMARKS: 'Consultant and engineer site facilitation costs'
  },
  {
    id: 'cat-5700',
    CATEGORY_ID: 'CAT-5700',
    CATEGORY_CODE: '5700',
    CATEGORY_NAME: '5700 Testing / Inspection / Survey Costs',
    CATEGORY_GROUP: 'Direct Project Cost',
    ACTIVE: true,
    REMARKS: 'Cube test, soil compaction test, total station survey fees'
  },
  {
    id: 'cat-5750',
    CATEGORY_ID: 'CAT-5750',
    CATEGORY_CODE: '5750',
    CATEGORY_NAME: '5750 Project Insurance',
    CATEGORY_GROUP: 'Admin & Head Office',
    ACTIVE: true,
    REMARKS: 'CAR (Contractors All Risk) & workmen compensation'
  },
  {
    id: 'cat-5760',
    CATEGORY_ID: 'CAT-5760',
    CATEGORY_CODE: '5760',
    CATEGORY_NAME: '5760 Bond & Guarantees Charges',
    CATEGORY_GROUP: 'Admin & Head Office',
    ACTIVE: true,
    REMARKS: 'Bank guarantee charges, bid bonds, performance bonds'
  },
  {
    id: 'cat-5800',
    CATEGORY_ID: 'CAT-5800',
    CATEGORY_CODE: '5800',
    CATEGORY_NAME: '5800 Temporary Works / Site Setup',
    CATEGORY_GROUP: 'Site Overheads',
    ACTIVE: true,
    REMARKS: 'Site store construction, barricades, warning boards'
  },
  {
    id: 'cat-6000',
    CATEGORY_ID: 'CAT-6000',
    CATEGORY_CODE: '6000',
    CATEGORY_NAME: '6000 Admin Staff Salary & Wages',
    CATEGORY_GROUP: 'Admin & Head Office',
    ACTIVE: true,
    REMARKS: 'Site office clerk & timekeeper salaries'
  },
  {
    id: 'cat-6010',
    CATEGORY_ID: 'CAT-6010',
    CATEGORY_CODE: '6010',
    CATEGORY_NAME: '6010 Rent or Maintenance',
    CATEGORY_GROUP: 'Site Overheads',
    ACTIVE: true,
    REMARKS: 'Site quarters rental, yard rental, maintenance'
  },
  {
    id: 'cat-6020',
    CATEGORY_ID: 'CAT-6020',
    CATEGORY_CODE: '6020',
    CATEGORY_NAME: '6020 Utilities',
    CATEGORY_GROUP: 'Site Overheads',
    ACTIVE: true,
    REMARKS: 'Electricity, water supply bills at site camp'
  },
  {
    id: 'cat-6040',
    CATEGORY_ID: 'CAT-6040',
    CATEGORY_CODE: '6040',
    CATEGORY_NAME: '6040 Traveling Expenses',
    CATEGORY_GROUP: 'Site Overheads',
    ACTIVE: true,
    REMARKS: 'Highway expressway tolls, public transit, site visits'
  },
  {
    id: 'cat-6050',
    CATEGORY_ID: 'CAT-6050',
    CATEGORY_CODE: '6050',
    CATEGORY_NAME: '6050 Bank Charges',
    CATEGORY_GROUP: 'Admin & Head Office',
    ACTIVE: true,
    REMARKS: 'Bank transaction fees, transfer charges'
  },
  {
    id: 'cat-6070',
    CATEGORY_ID: 'CAT-6070',
    CATEGORY_CODE: '6070',
    CATEGORY_NAME: '6070 Other Admin Expenses',
    CATEGORY_GROUP: 'Admin & Head Office',
    ACTIVE: true,
    REMARKS: 'Photocopying, stationery, mobile reloads, couriers'
  },
  {
    id: 'cat-6080',
    CATEGORY_ID: 'CAT-6080',
    CATEGORY_CODE: '6080',
    CATEGORY_NAME: '6080 Repair & Maintenance',
    CATEGORY_GROUP: 'Direct Project Cost',
    ACTIVE: true,
    REMARKS: 'Puncture repairs, hydraulic hose fixing, welder hire'
  },
  {
    id: 'cat-6090',
    CATEGORY_ID: 'CAT-6090',
    CATEGORY_CODE: '6090',
    CATEGORY_NAME: '6090 Legal and Professional Fees',
    CATEGORY_GROUP: 'Admin & Head Office',
    ACTIVE: true,
    REMARKS: 'Affidavits, notary fees, lawyer consultations'
  },
  {
    id: 'cat-6100',
    CATEGORY_ID: 'CAT-6100',
    CATEGORY_CODE: '6100',
    CATEGORY_NAME: '6100 Tender Fees',
    CATEGORY_GROUP: 'Admin & Head Office',
    ACTIVE: true,
    REMARKS: 'Tender document purchase and bidding fees'
  },
  {
    id: 'cat-6120',
    CATEGORY_ID: 'CAT-6120',
    CATEGORY_CODE: '6120',
    CATEGORY_NAME: '6120 Interest Expense',
    CATEGORY_GROUP: 'Admin & Head Office',
    ACTIVE: true,
    REMARKS: 'Supplier credit facility financing interest'
  },
  {
    id: 'cat-6250',
    CATEGORY_ID: 'CAT-6250',
    CATEGORY_CODE: '6250',
    CATEGORY_NAME: '6250 Fuel for Company Vehicle',
    CATEGORY_GROUP: 'Admin & Head Office',
    ACTIVE: true,
    REMARKS: 'Head office management transportation'
  },
  {
    id: 'cat-asset',
    CATEGORY_ID: 'CAT-ASSET',
    CATEGORY_CODE: '9000',
    CATEGORY_NAME: 'Asset Purchase',
    CATEGORY_GROUP: 'Special / Non-Project',
    ACTIVE: true,
    REMARKS: 'Capital tool purchase, generator, welding plant'
  },
  {
    id: 'cat-director',
    CATEGORY_ID: 'CAT-DIR',
    CATEGORY_CODE: '9100',
    CATEGORY_NAME: 'Director Personal Expenses',
    CATEGORY_GROUP: 'Special / Non-Project',
    ACTIVE: true,
    REMARKS: 'Director drawings / non-project reimbursements'
  },
  {
    id: 'cat-transfer',
    CATEGORY_ID: 'CAT-TRF',
    CATEGORY_CODE: '9200',
    CATEGORY_NAME: 'Internal Transfer',
    CATEGORY_GROUP: 'Special / Non-Project',
    ACTIVE: true,
    REMARKS: 'Inter-supervisor petty cash handovers'
  },
  {
    id: 'cat-loan',
    CATEGORY_ID: 'CAT-LOAN',
    CATEGORY_CODE: '9300',
    CATEGORY_NAME: 'Loan Repayment',
    CATEGORY_GROUP: 'Special / Non-Project',
    ACTIVE: true,
    REMARKS: 'Staff short-term emergency loan repayments'
  },
  {
    id: 'cat-rda-exp',
    CATEGORY_ID: 'CAT-RDA-EXP',
    CATEGORY_CODE: '9400',
    CATEGORY_NAME: 'RDA Recoverable Expenses',
    CATEGORY_GROUP: 'Direct Project Cost',
    ACTIVE: true,
    REMARKS: 'Reimbursable claims submitted directly to RDA client'
  },
  {
    id: 'cat-rda-sal',
    CATEGORY_ID: 'CAT-RDA-SAL',
    CATEGORY_CODE: '9410',
    CATEGORY_NAME: 'RDA Recoverable Salary',
    CATEGORY_GROUP: 'Direct Project Cost',
    ACTIVE: true,
    REMARKS: 'Client counterpart staff field allowance claims'
  },
  {
    id: 'cat-bond',
    CATEGORY_ID: 'CAT-BOND',
    CATEGORY_CODE: '9500',
    CATEGORY_NAME: 'Security Bond',
    CATEGORY_GROUP: 'Admin & Head Office',
    ACTIVE: true,
    REMARKS: 'Security deposits with local authorities'
  }
];

export const initialExpenses: Expense[] = [
  {
    id: 'exp-1',
    EXPENSES_ID: 'EXP-202608-0101',
    DATE_REF: '2026-08-25',
    DATE: '25/08/2026',
    SUPERVISOR: 'BUDDIKA',
    PROJECT: 'PIDM 26',
    EXPENSES_CATEGORY: '5000 Construction Materials',
    TRANSACTION_TYPE: 'PETTY_CASH_EXPENSE',
    AMOUNT: 48500.00,
    EXPENSES_DESCRIPTION: 'Purchased 20 bags Portland Cement & binding wire for chainage 12+400 culvert wing walls',
    PAYMENT_STATUS: 'Approved',
    PROOF_DOCUMENT: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80',
    PROOF_DOCUMENT_NAME: 'Invoice_Cement_MataraHardwares_#4819.pdf',
    CREATED_BY: 'buddika@company.com',
    CREATED_DATE: '25/08/2026 10:15:00',
    APPROVED_BY: 'finance@company.com',
    APPROVED_DATE: '25/08/2026 14:00:00',
    REMARKS: 'Verified against site delivery ticket #198'
  },
  {
    id: 'exp-2',
    EXPENSES_ID: 'EXP-202608-0102',
    DATE_REF: '2026-08-25',
    DATE: '25/08/2026',
    SUPERVISOR: 'BUDDIKA',
    PROJECT: 'PIDM 26',
    EXPENSES_CATEGORY: '5400 Fuel & Lubricants – Project Use',
    TRANSACTION_TYPE: 'PETTY_CASH_EXPENSE',
    AMOUNT: 32400.00,
    EXPENSES_DESCRIPTION: 'Diesel refill for CAT 320D Excavator (90 Liters @ LKR 360/L)',
    PAYMENT_STATUS: 'Approved',
    PROOF_DOCUMENT: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    PROOF_DOCUMENT_NAME: 'Ceypetco_Fuel_Slip_#99201.jpg',
    CREATED_BY: 'buddika@company.com',
    CREATED_DATE: '25/08/2026 12:45:00',
    APPROVED_BY: 'finance@company.com',
    APPROVED_DATE: '25/08/2026 14:05:00',
    REMARKS: 'Operator signed on logbook'
  },
  {
    id: 'exp-3',
    EXPENSES_ID: 'EXP-202608-0103',
    DATE_REF: '2026-08-26',
    DATE: '26/08/2026',
    SUPERVISOR: 'GAYANI',
    PROJECT: 'PIDB 26',
    EXPENSES_CATEGORY: '5200 Labour / Gross Wages',
    TRANSACTION_TYPE: 'PETTY_CASH_EXPENSE',
    AMOUNT: 65000.00,
    EXPENSES_DESCRIPTION: 'Casual masonry labour payment for 6 workers - stone masonry drainage line',
    PAYMENT_STATUS: 'Approved',
    PROOF_DOCUMENT: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80',
    PROOF_DOCUMENT_NAME: 'Labour_Attendance_Voucher_26Aug.pdf',
    CREATED_BY: 'gayani@company.com',
    CREATED_DATE: '26/08/2026 17:30:00',
    APPROVED_BY: 'finance@company.com',
    APPROVED_DATE: '26/08/2026 18:00:00',
    REMARKS: 'Daily muster sheet attached'
  },
  {
    id: 'exp-4',
    EXPENSES_ID: 'EXP-202608-0104',
    DATE_REF: '2026-08-26',
    DATE: '26/08/2026',
    SUPERVISOR: 'GEETH',
    PROJECT: 'RDA-DIT-MON-28',
    EXPENSES_CATEGORY: '5600 Site Consumables / Small Tools',
    TRANSACTION_TYPE: 'PETTY_CASH_EXPENSE',
    AMOUNT: 18450.00,
    EXPENSES_DESCRIPTION: 'Bought 4 measuring tapes (50m), masonry trowels, water levels and 10 safety vests',
    PAYMENT_STATUS: 'Approved',
    PROOF_DOCUMENT: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
    PROOF_DOCUMENT_NAME: 'Hardware_Consumables_Receipt.jpg',
    CREATED_BY: 'geeth@company.com',
    CREATED_DATE: '26/08/2026 11:20:00',
    APPROVED_BY: 'finance@company.com',
    APPROVED_DATE: '26/08/2026 16:30:00',
    REMARKS: 'Stock received at Monaragala store'
  },
  {
    id: 'exp-5',
    EXPENSES_ID: 'EXP-202608-0105',
    DATE_REF: '2026-08-27',
    DATE: '27/08/2026',
    SUPERVISOR: 'LASANTHA',
    PROJECT: 'RDA-RDA-AKK-05',
    EXPENSES_CATEGORY: '5300 Equipment & Machinery Hire',
    TRANSACTION_TYPE: 'PETTY_CASH_EXPENSE',
    AMOUNT: 75000.00,
    EXPENSES_DESCRIPTION: 'Daily rental for 10-ton Sakai vibratory roller for sub-base compaction (8 hrs)',
    PAYMENT_STATUS: 'Approved',
    PROOF_DOCUMENT: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f7?w=800&auto=format&fit=crop&q=80',
    PROOF_DOCUMENT_NAME: 'Machinery_Rental_Voucher_Sakai.pdf',
    CREATED_BY: 'lasantha@company.com',
    CREATED_DATE: '27/08/2026 16:00:00',
    APPROVED_BY: 'finance@company.com',
    APPROVED_DATE: '27/08/2026 17:15:00',
    REMARKS: 'Operator log hour meter 3810 to 3818'
  },
  {
    id: 'exp-6',
    EXPENSES_ID: 'EXP-202608-0106',
    DATE_REF: '2026-08-27',
    DATE: '27/08/2026',
    SUPERVISOR: 'LASANTHA',
    PROJECT: 'PIDM 26',
    EXPENSES_CATEGORY: '5650 Site Welfare / Food & Beverages',
    TRANSACTION_TYPE: 'PETTY_CASH_EXPENSE',
    AMOUNT: 14721.07,
    EXPENSES_DESCRIPTION: 'Overtime dinner and tea refreshments for asphalt paving team working late shift',
    PAYMENT_STATUS: 'Approved',
    PROOF_DOCUMENT: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    PROOF_DOCUMENT_NAME: 'Restaurant_Bill_Catering.jpg',
    CREATED_BY: 'lasantha@company.com',
    CREATED_DATE: '27/08/2026 21:00:00',
    APPROVED_BY: 'finance@company.com',
    APPROVED_DATE: '27/08/2026 21:30:00',
    REMARKS: 'Night shift asphalt team 18 pax'
  },
  {
    id: 'exp-7',
    EXPENSES_ID: 'EXP-202608-0107',
    DATE_REF: '2026-08-28',
    DATE: '28/08/2026',
    SUPERVISOR: 'BUDDIKA',
    PROJECT: 'RDA-DIT-MAH-27',
    EXPENSES_CATEGORY: '5700 Testing / Inspection / Survey Costs',
    TRANSACTION_TYPE: 'PETTY_CASH_EXPENSE',
    AMOUNT: 22000.00,
    EXPENSES_DESCRIPTION: 'Concrete core testing charges paid to NBRO (National Building Research Organisation) testing lab',
    PAYMENT_STATUS: 'Pending',
    PROOF_DOCUMENT: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80',
    PROOF_DOCUMENT_NAME: 'NBRO_Test_Receipt_#8812.pdf',
    CREATED_BY: 'buddika@company.com',
    CREATED_DATE: '28/08/2026 09:30:00',
    REMARKS: 'Awaiting laboratory formal compressive test certificate'
  },
  {
    id: 'exp-8',
    EXPENSES_ID: 'EXP-202608-0108',
    DATE_REF: '2026-08-28',
    DATE: '28/08/2026',
    SUPERVISOR: 'GAYANI',
    PROJECT: 'PIDM 2',
    EXPENSES_CATEGORY: '6040 Traveling Expenses',
    TRANSACTION_TYPE: 'PETTY_CASH_EXPENSE',
    AMOUNT: 12500.00,
    EXPENSES_DESCRIPTION: 'Southern Expressway toll cards and driver travel meal allowance for site inspection visit',
    PAYMENT_STATUS: 'Pending',
    PROOF_DOCUMENT: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80',
    PROOF_DOCUMENT_NAME: 'ETC_Toll_Receipts_Combo.pdf',
    CREATED_BY: 'gayani@company.com',
    CREATED_DATE: '28/08/2026 11:00:00',
    REMARKS: 'Inspection with Consultant Engineer'
  },
  {
    id: 'exp-9',
    EXPENSES_ID: 'EXP-202608-0109',
    DATE_REF: '2026-08-28',
    DATE: '28/08/2026',
    SUPERVISOR: 'GEETH',
    PROJECT: 'RDA-RD-BDL-15',
    EXPENSES_CATEGORY: '6080 Repair & Maintenance',
    TRANSACTION_TYPE: 'PETTY_CASH_EXPENSE',
    AMOUNT: 24800.00,
    EXPENSES_DESCRIPTION: 'Emergency hydraulic hose replacement for Komatsu Tipper truck #CAB-8492 on site',
    PAYMENT_STATUS: 'Approved',
    PROOF_DOCUMENT: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f7?w=800&auto=format&fit=crop&q=80',
    PROOF_DOCUMENT_NAME: 'Hydraulics_Repair_Bill_Badulla.pdf',
    CREATED_BY: 'geeth@company.com',
    CREATED_DATE: '28/08/2026 14:10:00',
    APPROVED_BY: 'finance@company.com',
    APPROVED_DATE: '28/08/2026 15:00:00',
    REMARKS: 'Truck back in operational service'
  }
];

export const initialIncome: Income[] = [
  {
    id: 'inc-1',
    INCOME_ID: 'INC-202608-001',
    DATE_REF: '2026-08-01',
    DATE: '01/08/2026',
    SUPERVISOR: 'BUDDIKA',
    PROJECT: 'PIDM 26',
    INCOME_SOURCE: 'Petty Cash Top-up',
    TRANSACTION_TYPE: 'PETTY_CASH_TOPUP',
    AMOUNT: 150000.00,
    PROOF_DOCUMENT: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    PROOF_DOCUMENT_NAME: 'Commercial_Bank_Transfer_Slip_#88921.pdf',
    CREATED_BY: 'finance@company.com',
    CREATED_DATE: '01/08/2026 09:00:00',
    REMARKS: 'Monthly operational petty cash allocation for Southern sites'
  },
  {
    id: 'inc-2',
    INCOME_ID: 'INC-202608-002',
    DATE_REF: '2026-08-01',
    DATE: '01/08/2026',
    SUPERVISOR: 'GAYANI',
    PROJECT: 'PIDB 26',
    INCOME_SOURCE: 'Petty Cash Top-up',
    TRANSACTION_TYPE: 'PETTY_CASH_TOPUP',
    AMOUNT: 175000.00,
    PROOF_DOCUMENT: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    PROOF_DOCUMENT_NAME: 'Bank_Voucher_Topup_Gayani.pdf',
    CREATED_BY: 'finance@company.com',
    CREATED_DATE: '01/08/2026 09:30:00',
    REMARKS: 'Site procurement advance and initial float'
  },
  {
    id: 'inc-3',
    INCOME_ID: 'INC-202608-003',
    DATE_REF: '2026-08-05',
    DATE: '05/08/2026',
    SUPERVISOR: 'GEETH',
    PROJECT: 'RDA-DIT-MON-28',
    INCOME_SOURCE: 'Petty Cash Top-up',
    TRANSACTION_TYPE: 'PETTY_CASH_TOPUP',
    AMOUNT: 80000.00,
    PROOF_DOCUMENT: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    PROOF_DOCUMENT_NAME: 'Slip_Bank_Geeth_Topup.jpg',
    CREATED_BY: 'finance@company.com',
    CREATED_DATE: '05/08/2026 10:00:00',
    REMARKS: 'Monaragala district project cash float'
  },
  {
    id: 'inc-4',
    INCOME_ID: 'INC-202608-004',
    DATE_REF: '2026-08-10',
    DATE: '10/08/2026',
    SUPERVISOR: 'LASANTHA',
    PROJECT: 'PIDM 26',
    INCOME_SOURCE: 'Petty Cash Top-up',
    TRANSACTION_TYPE: 'PETTY_CASH_TOPUP',
    AMOUNT: 60000.00,
    PROOF_DOCUMENT: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    PROOF_DOCUMENT_NAME: 'Cash_Deposit_Lasantha.pdf',
    CREATED_BY: 'finance@company.com',
    CREATED_DATE: '10/08/2026 11:15:00',
    REMARKS: 'Paving team emergency cash float'
  },
  {
    id: 'inc-5',
    INCOME_ID: 'INC-202608-005',
    DATE_REF: '2026-08-20',
    DATE: '20/08/2026',
    SUPERVISOR: 'BUDDIKA',
    PROJECT: 'PIDM 26',
    INCOME_SOURCE: 'Reimbursement',
    TRANSACTION_TYPE: 'REIMBURSEMENT_SETTLEMENT',
    AMOUNT: 35000.00,
    PROOF_DOCUMENT: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    PROOF_DOCUMENT_NAME: 'Settlement_Voucher_Reimb.pdf',
    CREATED_BY: 'finance@company.com',
    CREATED_DATE: '20/08/2026 14:00:00',
    REMARKS: 'Reimbursement for prior site emergency concrete pipeline repairs'
  }
];

export const initialTransfers: InternalTransfer[] = [
  {
    id: 'trf-1',
    TRANSFER_ID: 'TRF-202608-001',
    DATE: '22/08/2026',
    DATE_REF: '2026-08-22',
    FROM_SUPERVISOR: 'LASANTHA',
    TO_SUPERVISOR: 'BUDDIKA',
    AMOUNT: 30000.00,
    STATUS: 'Completed',
    REMARKS: 'Site cash handover for Matara asphalt batching plant fuel purchase',
    CREATED_BY: 'lasantha@company.com',
    CREATED_DATE: '22/08/2026 16:30:00'
  }
];

export const initialGoogleSheetsConfig: GoogleSheetsConfig = {
  spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  spreadsheetName: 'EMA_Petty_Cash_Master_2026',
  isConnected: true,
  lastSyncedAt: new Date().toISOString(),
  autoSyncEnabled: true,
  syncIntervalMinutes: 5,
  sheetExpensesName: 'EXPENSES',
  sheetIncomeName: 'INCOME',
  sheetSupervisorsName: 'SUPERVISORS',
  sheetProjectsName: 'PROJECTS',
  sheetCategoriesName: 'EXPENSE_CATEGORIES',
  sheetTransfersName: 'INTERNAL_TRANSFERS'
};

export const initialImportBatches: import('../types/pettyCashTypes').ImportBatchRecord[] = [
  {
    id: 'IMP-20260815-0001',
    batchNumber: 'IMP-20260815-0001',
    importType: 'HISTORICAL_EXPENSES',
    fileName: 'EMA_Q1_Q2_Historical_PettyCash_2024.xlsx',
    fileSize: '48.2 KB',
    totalRows: 125,
    importedRows: 125,
    updatedRows: 0,
    skippedRows: 0,
    failedRows: 0,
    duplicateRows: 0,
    status: 'COMPLETED',
    performedBy: 'System Administrator (ADMIN)',
    userRole: 'ADMIN',
    timestamp: '2026-08-15T09:45:00.000Z',
    createdRecordIds: {
      expenses: []
    }
  }
];

export const initialMappingTemplates: import('../types/pettyCashTypes').MappingTemplate[] = [
  {
    id: 'tmpl-1',
    name: 'Standard EMA Excel Migration Template (2024-2025)',
    importType: 'HISTORICAL_EXPENSES',
    mappings: {
      EXPENSES_ID: 'Expense ID',
      DATE: 'Date',
      SUPERVISOR: 'Supervisor',
      PROJECT: 'Project',
      EXPENSES_CATEGORY: 'Expense Category',
      EXPENSES_DESCRIPTION: 'Description',
      AMOUNT: 'Amount',
      PAYMENT_SOURCE: 'Payment Source',
      PRV_NUMBER: 'Voucher No',
      PAYMENT_STATUS: 'Payment Status',
      REMARKS: 'Remarks'
    },
    createdAt: '2026-08-01T10:00:00.000Z'
  },
  {
    id: 'tmpl-2',
    name: 'Master Project Registry CSV Format',
    importType: 'PROJECT_DIRECTORY',
    mappings: {
      PROJECT_CODE: 'Project Code',
      PROJECT_NAME: 'Project Name',
      CLIENT: 'Client',
      LOCATION: 'Location',
      CONTRACT_VALUE: 'Contract Value',
      START_DATE: 'Start Date',
      END_DATE: 'Completion Date',
      STATUS: 'Status',
      PROJECT_MANAGER: 'Project Manager',
      BUDGET_PETTY_CASH: 'Petty Cash Budget',
      REMARKS: 'Remarks'
    },
    createdAt: '2026-08-01T10:00:00.000Z'
  }
];

