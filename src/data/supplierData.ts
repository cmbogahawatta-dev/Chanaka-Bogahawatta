import {
  Supplier,
  SupplierCategory,
  SupplierInvoice,
  GoodsReceivedNote
} from '../types/supplierTypes';

export const INITIAL_SUPPLIER_CATEGORIES: SupplierCategory[] = [
  // Materials
  { id: 'cat-mat-01', name: 'Ready Mix', group: 'Materials', description: 'Grade 20, 25, 30, 35 ready-mix concrete', isActive: true },
  { id: 'cat-mat-02', name: 'Cement', group: 'Materials', description: 'Portland hydraulic, masonry & bulk cement', isActive: true },
  { id: 'cat-mat-03', name: 'Sand', group: 'Materials', description: 'River sand, offshore sand, manufactured sand', isActive: true },
  { id: 'cat-mat-04', name: 'Aggregate', group: 'Materials', description: 'ABC, 3/4 inch, 1/2 inch, quarry dust', isActive: true },
  { id: 'cat-mat-05', name: 'Steel', group: 'Materials', description: 'Tor steel, wire mesh, structural steel beams', isActive: true },
  { id: 'cat-mat-06', name: 'Bitumen', group: 'Materials', description: '60/70 Penetration bitumen, tack coat emulsion', isActive: true },
  { id: 'cat-mat-07', name: 'Pipes', group: 'Materials', description: 'HDPE, PVC, Hume concrete pipes for drainage', isActive: true },
  { id: 'cat-mat-08', name: 'Electrical', group: 'Materials', description: 'Armoured cable, conduit, site power distribution', isActive: true },
  { id: 'cat-mat-09', name: 'Plumbing', group: 'Materials', description: 'Piping, fittings, valves, water storage tanks', isActive: true },
  { id: 'cat-mat-10', name: 'Hardware', group: 'Materials', description: 'Fasteners, tie wire, shuttering accessories', isActive: true },
  { id: 'cat-mat-11', name: 'Construction Chemicals', group: 'Materials', description: 'Admixtures, waterproofing membranes, grouts', isActive: true },

  // Services
  { id: 'cat-srv-01', name: 'Surveying', group: 'Services', description: 'Total station, topographical & GPS bathymetry', isActive: true },
  { id: 'cat-srv-02', name: 'Laboratory', group: 'Services', description: 'Soil compaction testing, concrete cube crushing', isActive: true },
  { id: 'cat-srv-03', name: 'Transport', group: 'Services', description: 'Heavy tipper transport, low-bed hauler services', isActive: true },
  { id: 'cat-srv-04', name: 'Equipment Hire', group: 'Services', description: 'Crane hire, generator hire, water bowser rental', isActive: true },
  { id: 'cat-srv-05', name: 'Consultancy', group: 'Services', description: 'Geotechnical, structural audit, safety consultancy', isActive: true },
  { id: 'cat-srv-06', name: 'Security', group: 'Services', description: 'Site static guards, CCTV & perimeter security', isActive: true },
  { id: 'cat-srv-07', name: 'Testing', group: 'Services', description: 'Non-destructive testing, ultrasonic weld inspection', isActive: true },

  // Subcontractors
  { id: 'cat-sub-01', name: 'Civil', group: 'Subcontractors', description: 'Piling, earth excavation, formwork, concreting', isActive: true },
  { id: 'cat-sub-02', name: 'Electrical', group: 'Subcontractors', description: 'Substation installation, street lighting, cabling', isActive: true },
  { id: 'cat-sub-03', name: 'Mechanical', group: 'Subcontractors', description: 'HVAC, ducting, pump station installation', isActive: true },
  { id: 'cat-sub-04', name: 'Plumbing', group: 'Subcontractors', description: 'Deep sewer lines, booster pump installations', isActive: true },
  { id: 'cat-sub-05', name: 'Landscaping', group: 'Subcontractors', description: 'Turfing, hydroseeding, slope protection', isActive: true },
  { id: 'cat-sub-06', name: 'Road Works', group: 'Subcontractors', description: 'Asphalt paving, curb laying, road markings', isActive: true },
  { id: 'cat-sub-07', name: 'Structural', group: 'Subcontractors', description: 'Precast fabrication, steel truss erection', isActive: true }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-001',
    code: 'SUP-001',
    name: 'Lanka ReadyMix (Pvt) Ltd',
    legalName: 'Lanka ReadyMix Concrete Industrial Solutions (Pvt) Ltd',
    tradingName: 'Lanka ReadyMix',
    supplierType: 'Material Supplier',
    categories: ['Ready Mix', 'Construction Chemicals'],
    registrationNumber: 'PV-00192841',
    businessRegistrationDate: '2012-04-18',
    tin: '209184201',
    vatNumber: '109184201-7000',
    svatNumber: 'SVAT-00918',
    isVatRegistered: true,
    address: 'No. 42, Peliyagoda Industrial Zone',
    city: 'Peliyagoda',
    province: 'Western Province',
    country: 'Sri Lanka',
    postalCode: '11830',
    phone: '+94 11 291 4800',
    email: 'orders@lankareadymix.lk',
    website: 'https://lankareadymix.lk',
    status: 'Active',
    approvalWorkflow: {
      currentStep: 'Active',
      createdBy: 'BUDDIKA',
      createdAt: '2025-01-10',
      submittedBy: 'BUDDIKA',
      submittedAt: '2025-01-11',
      reviewedBy: 'GEETH (Engineer)',
      reviewedAt: '2025-01-12',
      approvedBy: 'Managing Director',
      approvedAt: '2025-01-14'
    },
    contacts: [
      {
        id: 'cnt-001-1',
        name: 'Sunil Weerasinghe',
        designation: 'Commercial Director',
        department: 'Executive',
        telephone: '+94 11 291 4801',
        mobile: '+94 77 234 5678',
        email: 'sunil.w@lankareadymix.lk',
        whatsApp: '+94772345678',
        notes: 'Main corporate escalation contact',
        contactType: 'Main',
        isPrimary: true
      },
      {
        id: 'cnt-001-2',
        name: 'Kumari Jayatissa',
        designation: 'Finance & Invoicing Manager',
        department: 'Accounts',
        telephone: '+94 11 291 4805',
        mobile: '+94 71 884 9210',
        email: 'billing@lankareadymix.lk',
        whatsApp: '+94718849210',
        notes: 'Contact for statements, SVAT forms & credit notes',
        contactType: 'Finance',
        isPrimary: false
      },
      {
        id: 'cnt-001-3',
        name: 'Chaminda Silva',
        designation: 'Batching Plant Dispatcher',
        department: 'Operations',
        mobile: '+94 77 912 3456',
        email: 'dispatch@lankareadymix.lk',
        whatsApp: '+94779123456',
        notes: 'Transit mixer dispatch for Western province sites',
        contactType: 'Site',
        isPrimary: false
      }
    ],
    bankAccounts: [
      {
        id: 'bnk-001-1',
        accountName: 'Lanka ReadyMix (Pvt) Ltd',
        bank: 'Commercial Bank of Ceylon',
        branch: 'Peliyagoda Branch',
        accountNumber: '100084920194',
        swift: 'CCEYLKIX',
        currency: 'LKR',
        isDefault: true,
        verificationStatus: 'Verified',
        verifiedBy: 'Finance Officer',
        verifiedDate: '2025-01-15'
      },
      {
        id: 'bnk-001-2',
        accountName: 'Lanka ReadyMix (Pvt) Ltd',
        bank: 'Bank of Ceylon',
        branch: 'Corporate Branch Colombo',
        accountNumber: '0074910284',
        swift: 'BCEYLKLX',
        currency: 'LKR',
        isDefault: false,
        verificationStatus: 'Verified',
        verifiedBy: 'Finance Officer',
        verifiedDate: '2025-01-15'
      }
    ],
    creditTerms: {
      creditPeriod: '30 Days',
      paymentTerms: 'Net 30 with 2% Early Payment Discount if settled within 10 days',
      currency: 'LKR',
      creditLimit: 15000000,
      advanceRequiredPercent: 0,
      retentionPercent: 0,
      earlyPaymentDiscountPercent: 2,
      latePaymentTerms: '1.5% interest per month for invoices unpaid past 45 days'
    },
    documents: [
      {
        id: 'doc-sup-001-1',
        documentName: 'Business Registration Form 1',
        documentType: 'Business Registration',
        documentNumber: 'PV-00192841',
        issueDate: '2012-04-18',
        expiryDate: '2030-12-31',
        uploadedDate: '2025-01-12',
        uploadedBy: 'BUDDIKA',
        status: 'Valid',
        fileName: 'Lanka_ReadyMix_BR_Cert.pdf',
        fileSizeKb: 680
      },
      {
        id: 'doc-sup-001-2',
        documentName: 'Inland Revenue VAT Registration Certificate',
        documentType: 'VAT Certificate',
        documentNumber: '109184201-7000',
        issueDate: '2018-01-01',
        expiryDate: '2027-12-31',
        uploadedDate: '2025-01-12',
        uploadedBy: 'BUDDIKA',
        status: 'Valid',
        fileName: 'Lanka_ReadyMix_VAT_Certificate.pdf',
        fileSizeKb: 420
      },
      {
        id: 'doc-sup-001-3',
        documentName: 'ISO 9001:2015 Quality Management Concrete Certification',
        documentType: 'Certifications',
        documentNumber: 'ISO-QMS-2023-8812',
        issueDate: '2023-08-10',
        expiryDate: '2026-10-15',
        uploadedDate: '2025-01-12',
        uploadedBy: 'BUDDIKA',
        status: 'Valid',
        fileName: 'ISO9001_LankaReadyMix.pdf',
        fileSizeKb: 950
      }
    ],
    contracts: [
      {
        id: 'cntr-001',
        contractNumber: 'SC-2026-001',
        contractTitle: 'Annual Ready Mix Concrete Supply Agreement for PIDM 26 & 28',
        supplierId: 'sup-001',
        supplierName: 'Lanka ReadyMix (Pvt) Ltd',
        projectCode: 'PIDM 26',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        contractValue: 25000000,
        currency: 'LKR',
        scope: 'Supply and on-site pumping of Grade 25, 30 and 35 Ready Mix concrete with 28-day cube strength warranty.',
        paymentTerms: '30 Days Net from invoice date and site engineer slump test acceptance',
        retentionPercent: 0,
        advancePercent: 0,
        status: 'Active',
        attachmentName: 'Master_Supply_Agreement_LankaReadyMix_2026.pdf'
      }
    ],
    performance: {
      deliveryScore: 92,
      qualityScore: 96,
      priceScore: 88,
      documentationScore: 95,
      paymentComplianceScore: 94,
      responsivenessScore: 90,
      overallScore: 93,
      rating: 'Excellent'
    },
    evaluationHistory: [
      {
        id: 'eval-001',
        supplierId: 'sup-001',
        evaluationDate: '2026-07-30',
        projectCode: 'PIDM 26',
        evaluator: 'BUDDIKA',
        evaluatorRole: 'Project Manager',
        scores: {
          deliveryScore: 92,
          qualityScore: 96,
          priceScore: 88,
          documentationScore: 95,
          paymentComplianceScore: 94,
          responsivenessScore: 90,
          overallScore: 93,
          rating: 'Excellent'
        },
        comments: 'Prompt delivery of Grade 30 mixes on site. Slump tests consistently in compliance with RDA specifications.',
        correctiveAction: 'Maintain cold-weather ice dosing when ambient temperature exceeds 32°C.',
        finalRating: 'Excellent'
      }
    ],
    auditTrail: [
      {
        id: 'aud-sup-001-1',
        supplierId: 'sup-001',
        timestamp: '2025-01-10T09:30:00Z',
        user: 'BUDDIKA',
        role: 'ADMIN',
        action: 'Supplier Created',
        details: 'Initial master profile entered for Lanka ReadyMix (Pvt) Ltd.'
      },
      {
        id: 'aud-sup-001-2',
        supplierId: 'sup-001',
        timestamp: '2025-01-14T15:00:00Z',
        user: 'Managing Director',
        role: 'OWNER',
        action: 'Approval Step',
        details: 'Approved corporate supplier status. Verified BR, VAT and Commercial Bank settlement account.'
      }
    ],
    notes: 'Strategic supplier for highway structures and culverts. Requires 24-hour advance booking for weekend pours.'
  },
  {
    id: 'sup-002',
    code: 'SUP-002',
    name: 'Tokyo Super Cement PLC',
    legalName: 'Tokyo Cement Company (Lanka) PLC',
    tradingName: 'Tokyo Super Cement',
    supplierType: 'Material Supplier',
    categories: ['Cement', 'Construction Chemicals'],
    registrationNumber: 'PQ-00014298',
    businessRegistrationDate: '1982-03-17',
    tin: '201004819',
    vatNumber: '101004819-7000',
    svatNumber: 'SVAT-00142',
    isVatRegistered: true,
    address: '469 1/1, Galle Road, Colombo 03',
    city: 'Colombo',
    province: 'Western Province',
    country: 'Sri Lanka',
    postalCode: '00300',
    phone: '+94 11 255 8100',
    email: 'corporate.sales@tokyocement.lk',
    website: 'https://tokyocement.com',
    status: 'Active',
    approvalWorkflow: {
      currentStep: 'Active',
      createdBy: 'GEETH',
      createdAt: '2025-01-15',
      submittedBy: 'GEETH',
      submittedAt: '2025-01-16',
      reviewedBy: 'BUDDIKA',
      reviewedAt: '2025-01-17',
      approvedBy: 'Managing Director',
      approvedAt: '2025-01-18'
    },
    contacts: [
      {
        id: 'cnt-002-1',
        name: 'Rohan Wickremasinghe',
        designation: 'Institutional Key Account Manager',
        department: 'Sales',
        telephone: '+94 11 255 8120',
        mobile: '+94 77 345 6789',
        email: 'rohan.w@tokyocement.lk',
        whatsApp: '+94773456789',
        notes: 'Bulk pricing and monthly quota allocations',
        contactType: 'Sales',
        isPrimary: true
      },
      {
        id: 'cnt-002-2',
        name: 'Anoma Fernando',
        designation: 'Credit Control Officer',
        department: 'Finance',
        telephone: '+94 11 255 8145',
        mobile: '+94 71 456 7890',
        email: 'credit.control@tokyocement.lk',
        contactType: 'Finance',
        isPrimary: false
      }
    ],
    bankAccounts: [
      {
        id: 'bnk-002-1',
        accountName: 'Tokyo Cement Company (Lanka) PLC',
        bank: 'Hatton National Bank',
        branch: 'Head Office Branch',
        accountNumber: '003010481920',
        swift: 'HBLILKLX',
        currency: 'LKR',
        isDefault: true,
        verificationStatus: 'Verified',
        verifiedBy: 'Accountant',
        verifiedDate: '2025-01-18'
      }
    ],
    creditTerms: {
      creditPeriod: '45 Days',
      paymentTerms: 'Net 45 Days against delivery notes and authorized gate pass',
      currency: 'LKR',
      creditLimit: 20000000,
      advanceRequiredPercent: 0,
      retentionPercent: 0,
      earlyPaymentDiscountPercent: 1.5
    },
    documents: [
      {
        id: 'doc-sup-002-1',
        documentName: 'Public Listed Company Certificate',
        documentType: 'Business Registration',
        documentNumber: 'PQ-14298',
        uploadedDate: '2025-01-16',
        uploadedBy: 'GEETH',
        status: 'Valid',
        fileName: 'TokyoCement_BR.pdf',
        fileSizeKb: 512
      },
      {
        id: 'doc-sup-002-2',
        documentName: 'SLS 107 SLS 1253 Certified Batch Standards',
        documentType: 'Product Certificates',
        documentNumber: 'SLS-107-CERT-2025',
        issueDate: '2025-01-01',
        expiryDate: '2026-12-31',
        uploadedDate: '2025-01-16',
        uploadedBy: 'GEETH',
        status: 'Valid',
        fileName: 'SLS_107_Certificate.pdf',
        fileSizeKb: 840
      }
    ],
    contracts: [],
    performance: {
      deliveryScore: 94,
      qualityScore: 98,
      priceScore: 86,
      documentationScore: 96,
      paymentComplianceScore: 95,
      responsivenessScore: 92,
      overallScore: 94,
      rating: 'Excellent'
    },
    evaluationHistory: [],
    auditTrail: [],
    notes: 'Premium supplier for hydraulic bagged and bulk cement.'
  },
  {
    id: 'sup-003',
    code: 'SUP-003',
    name: 'Maha Oya River Sand Suppliers',
    legalName: 'Maha Oya Sand & Minerals Exploration (Pvt) Ltd',
    tradingName: 'Maha Oya River Sand',
    supplierType: 'Material Supplier',
    categories: ['Sand', 'Aggregate'],
    registrationNumber: 'PV-00849201',
    businessRegistrationDate: '2015-08-22',
    tin: '204918204',
    vatNumber: '104918204-7000',
    isVatRegistered: true,
    address: 'No. 18, Sand Yard Road, Kochchikade',
    city: 'Negombo',
    province: 'Western Province',
    country: 'Sri Lanka',
    phone: '+94 31 227 4910',
    email: 'sales@mahaoyasand.lk',
    status: 'Active',
    approvalWorkflow: {
      currentStep: 'Active',
      createdBy: 'LASANTHA',
      createdAt: '2025-02-01',
      approvedBy: 'BUDDIKA',
      approvedAt: '2025-02-05'
    },
    contacts: [
      {
        id: 'cnt-003-1',
        name: 'Lasantha Wickramaratne',
        designation: 'Managing Partner',
        department: 'Management',
        mobile: '+94 77 456 7890',
        email: 'lasantha@mahaoyasand.lk',
        whatsApp: '+94774567890',
        contactType: 'Main',
        isPrimary: true
      }
    ],
    bankAccounts: [
      {
        id: 'bnk-003-1',
        accountName: 'Maha Oya Sand & Minerals Exploration',
        bank: 'Sampath Bank PLC',
        branch: 'Negombo Main Branch',
        accountNumber: '002910048192',
        currency: 'LKR',
        isDefault: true,
        verificationStatus: 'Verified',
        verifiedBy: 'Finance Officer',
        verifiedDate: '2025-02-05'
      }
    ],
    creditTerms: {
      creditPeriod: '15 Days',
      paymentTerms: 'Payment within 15 days upon GSMB transport permit verification',
      currency: 'LKR',
      creditLimit: 5000000,
      advanceRequiredPercent: 0,
      retentionPercent: 0,
      earlyPaymentDiscountPercent: 0
    },
    documents: [
      {
        id: 'doc-sup-003-1',
        documentName: 'GSMB Mining & Transport License 2026',
        documentType: 'Licences',
        documentNumber: 'GSMB/ML/WP/2026/841',
        issueDate: '2026-01-01',
        expiryDate: '2026-12-31',
        uploadedDate: '2026-01-05',
        uploadedBy: 'LASANTHA',
        status: 'Valid',
        fileName: 'GSMB_Mining_License_2026.pdf',
        fileSizeKb: 720
      }
    ],
    contracts: [],
    performance: {
      deliveryScore: 88,
      qualityScore: 92,
      priceScore: 84,
      documentationScore: 90,
      paymentComplianceScore: 88,
      responsivenessScore: 85,
      overallScore: 88,
      rating: 'Good'
    },
    evaluationHistory: [],
    auditTrail: []
  },
  {
    id: 'sup-004',
    code: 'SUP-004',
    name: 'Access Heavy Machinery & Plant Hire',
    legalName: 'Access Plant Hire & Engineering Services Ltd',
    tradingName: 'Access Heavy Plant',
    supplierType: 'Plant Hire',
    categories: ['Equipment Hire', 'Equipment'],
    registrationNumber: 'PV-00049182',
    tin: '202918401',
    vatNumber: '102918401-7000',
    isVatRegistered: true,
    address: 'No. 278, Union Place, Colombo 02',
    city: 'Colombo',
    province: 'Western Province',
    country: 'Sri Lanka',
    phone: '+94 11 230 2300',
    email: 'planthire@access.lk',
    status: 'Active',
    approvalWorkflow: {
      currentStep: 'Active',
      createdBy: 'BUDDIKA',
      createdAt: '2025-01-08',
      approvedBy: 'Managing Director',
      approvedAt: '2025-01-10'
    },
    contacts: [
      {
        id: 'cnt-004-1',
        name: 'Pradeep Kulatunga',
        designation: 'Fleet & Plant Coordinator',
        department: 'Operations',
        mobile: '+94 77 567 8901',
        email: 'pradeep.k@access.lk',
        contactType: 'Sales',
        isPrimary: true
      }
    ],
    bankAccounts: [
      {
        id: 'bnk-004-1',
        accountName: 'Access Plant Hire & Engineering',
        bank: 'Commercial Bank of Ceylon',
        branch: 'City Office Branch',
        accountNumber: '103004819284',
        swift: 'CCEYLKIX',
        currency: 'LKR',
        isDefault: true,
        verificationStatus: 'Verified',
        verifiedBy: 'Accountant',
        verifiedDate: '2025-01-10'
      }
    ],
    creditTerms: {
      creditPeriod: '30 Days',
      paymentTerms: 'Monthly meter hours billing with operator log sheet signoff',
      currency: 'LKR',
      creditLimit: 12000000,
      advanceRequiredPercent: 10,
      retentionPercent: 0,
      earlyPaymentDiscountPercent: 1
    },
    documents: [],
    contracts: [],
    performance: {
      deliveryScore: 90,
      qualityScore: 91,
      priceScore: 82,
      documentationScore: 94,
      paymentComplianceScore: 92,
      responsivenessScore: 89,
      overallScore: 90,
      rating: 'Excellent'
    },
    evaluationHistory: [],
    auditTrail: []
  },
  {
    id: 'sup-005',
    code: 'SUP-005',
    name: 'Lanka IOC Petroleum',
    legalName: 'Lanka IOC PLC',
    tradingName: 'Lanka IOC Petroleum',
    supplierType: 'Fuel Supplier',
    categories: ['Transport', 'Materials'],
    registrationNumber: 'PQ-00008492',
    tin: '200194829',
    vatNumber: '100194829-7000',
    isVatRegistered: true,
    address: 'Level 20, West Tower, World Trade Centre, Colombo 01',
    city: 'Colombo',
    province: 'Western Province',
    country: 'Sri Lanka',
    phone: '+94 11 247 2472',
    email: 'bulkfuel@lankaioc.com',
    status: 'Active',
    approvalWorkflow: {
      currentStep: 'Active',
      createdBy: 'BUDDIKA',
      createdAt: '2025-01-05',
      approvedBy: 'Managing Director',
      approvedAt: '2025-01-06'
    },
    contacts: [
      {
        id: 'cnt-005-1',
        name: 'Dilhan Perera',
        designation: 'Commercial Depot Manager',
        department: 'Bulk Supply',
        mobile: '+94 77 678 9012',
        email: 'dilhan.p@lankaioc.com',
        contactType: 'Main',
        isPrimary: true
      }
    ],
    bankAccounts: [
      {
        id: 'bnk-005-1',
        accountName: 'Lanka IOC PLC Commercial Bulk Account',
        bank: 'Standard Chartered Bank',
        branch: 'Colombo Main',
        accountNumber: '010048192841',
        swift: 'SCBLIKLX',
        currency: 'LKR',
        isDefault: true,
        verificationStatus: 'Verified',
        verifiedBy: 'Finance Officer',
        verifiedDate: '2025-01-06'
      }
    ],
    creditTerms: {
      creditPeriod: '15 Days',
      paymentTerms: 'Direct bank transfer within 15 days or bank guarantee',
      currency: 'LKR',
      creditLimit: 10000000,
      advanceRequiredPercent: 0,
      retentionPercent: 0,
      earlyPaymentDiscountPercent: 0
    },
    documents: [],
    contracts: [],
    performance: {
      deliveryScore: 96,
      qualityScore: 99,
      priceScore: 90,
      documentationScore: 98,
      paymentComplianceScore: 97,
      responsivenessScore: 95,
      overallScore: 96,
      rating: 'Excellent'
    },
    evaluationHistory: [],
    auditTrail: []
  },
  {
    id: 'sup-006',
    code: 'SUP-006',
    name: 'Electro-Civil Infrastructure Ltd',
    legalName: 'Electro-Civil Infrastructure & Piling Works Ltd',
    tradingName: 'Electro-Civil',
    supplierType: 'Subcontractor',
    categories: ['Civil', 'Structural', 'Electrical'],
    registrationNumber: 'PV-00148192',
    tin: '209481920',
    vatNumber: '109481920-7000',
    isVatRegistered: true,
    address: 'No. 88/4, Nawala Road, Rajagiriya',
    city: 'Colombo',
    province: 'Western Province',
    country: 'Sri Lanka',
    phone: '+94 11 288 4900',
    email: 'info@electrocivil.lk',
    status: 'Pending Approval',
    approvalWorkflow: {
      currentStep: 'Submitted',
      createdBy: 'GEETH',
      createdAt: '2026-08-20',
      submittedBy: 'GEETH',
      submittedAt: '2026-08-21'
    },
    contacts: [
      {
        id: 'cnt-006-1',
        name: 'Eng. Mahen Samarasinghe',
        designation: 'Managing Director & Chartered Engineer',
        department: 'Executive',
        mobile: '+94 77 789 0123',
        email: 'mahen@electrocivil.lk',
        contactType: 'Main',
        isPrimary: true
      }
    ],
    bankAccounts: [
      {
        id: 'bnk-006-1',
        accountName: 'Electro-Civil Infrastructure Ltd',
        bank: 'Seylan Bank PLC',
        branch: 'Rajagiriya Branch',
        accountNumber: '004819284192',
        currency: 'LKR',
        isDefault: true,
        verificationStatus: 'Pending'
      }
    ],
    creditTerms: {
      creditPeriod: '30 Days',
      paymentTerms: 'Interim payment certificates with 5% retention deduction',
      currency: 'LKR',
      creditLimit: 8000000,
      advanceRequiredPercent: 15,
      retentionPercent: 5,
      earlyPaymentDiscountPercent: 0
    },
    documents: [],
    contracts: [],
    performance: {
      deliveryScore: 78,
      qualityScore: 82,
      priceScore: 80,
      documentationScore: 75,
      paymentComplianceScore: 82,
      responsivenessScore: 78,
      overallScore: 79,
      rating: 'Satisfactory'
    },
    evaluationHistory: [],
    auditTrail: []
  },
  {
    id: 'sup-007',
    code: 'SUP-007',
    name: 'Kelani Aggregate Quarries',
    legalName: 'Kelani Valley Quarries & Metal Crushers (Pvt) Ltd',
    tradingName: 'Kelani Aggregates',
    supplierType: 'Material Supplier',
    categories: ['Aggregate'],
    registrationNumber: 'PV-00819284',
    tin: '208192841',
    isVatRegistered: false,
    address: 'Quarry Site 3, Hanwella Road, Avissawella',
    city: 'Avissawella',
    province: 'Western Province',
    country: 'Sri Lanka',
    phone: '+94 36 225 8491',
    email: 'orders@kelaniquarries.lk',
    status: 'Blocked',
    approvalWorkflow: {
      currentStep: 'Draft',
      createdBy: 'LASANTHA',
      createdAt: '2025-06-10',
      blockedReason: 'Failed aggregate crushing value (ACV) laboratory tests on Bridge Pier batch. Non-compliant quarry dust ratio.'
    },
    contacts: [
      {
        id: 'cnt-007-1',
        name: 'Dharmasena Bandara',
        designation: 'Quarry Manager',
        department: 'Operations',
        mobile: '+94 77 890 1234',
        email: 'bandara@kelaniquarries.lk',
        contactType: 'Main',
        isPrimary: true
      }
    ],
    bankAccounts: [
      {
        id: 'bnk-007-1',
        accountName: 'Kelani Valley Quarries (Pvt) Ltd',
        bank: 'People’s Bank',
        branch: 'Avissawella Branch',
        accountNumber: '028192849102',
        currency: 'LKR',
        isDefault: true,
        verificationStatus: 'Verified',
        verifiedBy: 'Accountant',
        verifiedDate: '2025-06-12'
      }
    ],
    creditTerms: {
      creditPeriod: 'Cash',
      paymentTerms: 'Immediate cash on delivery',
      currency: 'LKR',
      creditLimit: 0,
      advanceRequiredPercent: 100,
      retentionPercent: 0,
      earlyPaymentDiscountPercent: 0
    },
    documents: [],
    contracts: [],
    performance: {
      deliveryScore: 60,
      qualityScore: 42,
      priceScore: 78,
      documentationScore: 50,
      paymentComplianceScore: 65,
      responsivenessScore: 55,
      overallScore: 56,
      rating: 'Critical'
    },
    evaluationHistory: [],
    auditTrail: [
      {
        id: 'aud-sup-007-1',
        supplierId: 'sup-007',
        timestamp: '2026-06-25T11:00:00Z',
        user: 'BUDDIKA',
        role: 'ADMIN',
        action: 'Status Changed',
        details: 'Blocked supplier due to structural quality failure in aggregate batch.'
      }
    ],
    notes: 'DO NOT ISSUE PURCHASE ORDERS WITHOUT PROJECT DIRECTOR EXPLICIT OVERRIDE'
  }
];

export const INITIAL_SUPPLIER_INVOICES: SupplierInvoice[] = [
  {
    id: 'sinv-001',
    invoiceNumber: 'SINV-2026-001',
    supplierInvoiceRef: 'LRM-INV-2026-4421',
    poId: 'po-1',
    poNumber: 'PO-202608-010',
    supplierId: 'sup-001',
    supplierName: 'Lanka ReadyMix (Pvt) Ltd',
    projectCode: 'PIDM 26',
    invoiceDate: '2026-08-26',
    dueDate: '2026-09-25',
    grossAmount: 513000,
    vatAmount: 92340,
    discountAmount: 10260,
    netAmount: 595080,
    currency: 'LKR',
    status: 'Approved',
    paidAmount: 0,
    approvedBy: 'Finance Officer',
    approvedDate: '2026-08-27',
    remarks: 'Matching delivery note and 18 cubes Grade 30 concrete acceptance report.'
  },
  {
    id: 'sinv-002',
    invoiceNumber: 'SINV-2026-002',
    supplierInvoiceRef: 'TSC-TAX-98214',
    poId: 'po-2',
    poNumber: 'PO-202608-011',
    supplierId: 'sup-002',
    supplierName: 'Tokyo Super Cement PLC',
    projectCode: 'PIDM 28',
    invoiceDate: '2026-08-28',
    dueDate: '2026-10-12',
    grossAmount: 612500,
    vatAmount: 110250,
    discountAmount: 0,
    netAmount: 722750,
    currency: 'LKR',
    status: 'Approved',
    paidAmount: 722750,
    approvedBy: 'Accountant',
    approvedDate: '2026-08-29',
    remarks: '250 bags hydraulic cement verified at central store. Settled via Direct Bank Transfer.',
    linkedPaymentVoucherId: 'pay-2'
  },
  {
    id: 'sinv-003',
    invoiceNumber: 'SINV-2026-003',
    supplierInvoiceRef: 'IOC-BULK-8419',
    poNumber: 'PO-BULK-2026-005',
    supplierId: 'sup-005',
    supplierName: 'Lanka IOC Petroleum',
    projectCode: 'PIDM 26',
    invoiceDate: '2026-08-25',
    dueDate: '2026-09-09',
    grossAmount: 480000,
    vatAmount: 0,
    discountAmount: 0,
    netAmount: 480000,
    currency: 'LKR',
    status: 'Pending Approval',
    paidAmount: 0,
    remarks: 'Monthly diesel delivery voucher. Awaiting final meter calibration log sign-off.'
  }
];

export const INITIAL_GOODS_RECEIVED_NOTES: GoodsReceivedNote[] = [
  {
    id: 'grn-001',
    grnNumber: 'GRN-202608-001',
    poId: 'po-1',
    poNumber: 'PO-202608-010',
    supplierId: 'sup-001',
    supplierName: 'Lanka ReadyMix (Pvt) Ltd',
    projectCode: 'PIDM 26',
    deliveryDate: '2026-08-26',
    receivedBy: 'BUDDIKA (Project Manager)',
    itemDescription: 'Grade 30 Ready Mix Concrete for Culvert Base',
    orderedQuantity: 18,
    receivedQuantity: 18,
    acceptedQuantity: 18,
    rejectedQuantity: 0,
    unit: 'Cubes',
    items: [
      {
        id: 'grn-item-001-1',
        description: 'Grade 30 Ready Mix Concrete for Culvert Base',
        orderedQuantity: 18,
        receivedQuantity: 18,
        acceptedQuantity: 18,
        rejectedQuantity: 0,
        unit: 'Cubes'
      }
    ],
    deliveryNoteNumber: 'DN-LRM-88194',
    vehicleNumber: 'WP-LH-4412',
    status: 'Accepted',
    remarks: 'Slump 100mm. Cube specimens casted for 7 and 28 day strength testing.',
    inspectionRemarks: 'Slump measured at 100mm within tolerance. Ready-mix transit time within 90 minutes.'
  },
  {
    id: 'grn-002',
    grnNumber: 'GRN-202608-002',
    poId: 'po-2',
    poNumber: 'PO-202608-011',
    supplierId: 'sup-002',
    supplierName: 'Tokyo Super Cement PLC',
    projectCode: 'PIDM 28',
    deliveryDate: '2026-08-27',
    receivedBy: 'GEETH (Site Engineer)',
    itemDescription: 'Portland Hydraulic Cement 50kg Bags',
    orderedQuantity: 250,
    receivedQuantity: 250,
    acceptedQuantity: 250,
    rejectedQuantity: 0,
    unit: 'Bags',
    items: [
      {
        id: 'grn-item-002-1',
        description: 'Portland Hydraulic Cement 50kg Bags',
        orderedQuantity: 250,
        receivedQuantity: 250,
        acceptedQuantity: 250,
        rejectedQuantity: 0,
        unit: 'Bags'
      }
    ],
    deliveryNoteNumber: 'DN-TSC-29410',
    vehicleNumber: 'WP-NA-7721',
    status: 'Accepted',
    remarks: 'Stored on elevated timber pallets with polythene covering.',
    inspectionRemarks: 'Packaging intact, no hardened bags observed, batch test certificates verified.'
  }
];
