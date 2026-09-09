import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  EnterpriseProfileDetails,
  StatutoryRegistration,
  Director,
  Shareholder,
  AuthorizedPerson,
  Client,
  ClientAuditEntry
} from '../types/enterpriseProfileTypes';
import { useEnterprise } from './EnterpriseContext';

interface EnterpriseCompanyContextType {
  profile: EnterpriseProfileDetails;
  registrations: StatutoryRegistration[];
  directors: Director[];
  shareholders: Shareholder[];
  authorizedPersons: AuthorizedPerson[];
  clients: Client[];
  updateProfile: (details: Partial<EnterpriseProfileDetails>) => void;
  addRegistration: (reg: Omit<StatutoryRegistration, 'id'>) => void;
  updateRegistration: (id: string, reg: Partial<StatutoryRegistration>) => void;
  deleteRegistration: (id: string) => void;
  addDirector: (director: Omit<Director, 'id'>) => void;
  updateDirector: (id: string, director: Partial<Director>) => void;
  deleteDirector: (id: string) => void;
  addShareholder: (shareholder: Omit<Shareholder, 'id' | 'ownershipPercent'>) => void;
  updateShareholder: (id: string, shareholder: Partial<Shareholder>) => void;
  deleteShareholder: (id: string) => void;
  addAuthorizedPerson: (person: Omit<AuthorizedPerson, 'id'>) => void;
  updateAuthorizedPerson: (id: string, person: Partial<AuthorizedPerson>) => void;
  deleteAuthorizedPerson: (id: string) => void;
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  clearClientsHistory: () => void;
  resetClientsToDefault: () => void;
  clearClientAuditHistory: (clientId: string) => void;
}

const defaultProfile: EnterpriseProfileDetails = {
  legalName: 'Apex Global Logistics Corporation (Pvt) Ltd',
  tradingName: 'Apex Global Logistics & Works',
  shortName: 'Apex Global',
  companyType: 'Private Limited Company',
  registrationNumber: 'PV-00284918',
  incorporationDate: '2016-05-18',
  registeredAddress: 'Level 14, World Trade Centre, Echelon Square, Colombo 01, Sri Lanka',
  businessAddress: 'No. 45/2, Baseline Road, Dematagoda, Colombo 09, Sri Lanka',
  headOfficeAddress: 'Level 14, World Trade Centre, Colombo 01, Sri Lanka',
  postalAddress: 'P.O. Box 1420, Colombo, Sri Lanka',
  telephone: '+94 11 289 4000',
  mobile: '+94 77 123 4567',
  website: 'https://apexlogistics.lk',
  companyStatus: 'Active',
  vatNumber: '102849182-7000',
  tinNumber: '209184910',
  cidaRegistrationNumber: 'CIDA/EM/2022/9481',
  cidaGrade: 'C1 / EM1 (Electro-Mechanical & Civil Works)',
  cidaSpeciality: 'Heavy Infrastructure, Logistics Systems & Industrial Works'
};

const initialRegistrations: StatutoryRegistration[] = [
  {
    id: 'reg-01',
    enterpriseId: 'ent-apex',
    registrationType: 'Company Registration',
    registrationNumber: 'PV-00284918',
    issuingAuthority: 'Department of the Registrar of Companies (ROC), Sri Lanka',
    issueDate: '2016-05-18',
    status: 'Active',
    responsiblePerson: 'Samantha Perera (Admin)',
    remarks: 'Form 1 Certificate of Incorporation verified.',
    supportingDocuments: [
      {
        id: 'doc-roc-01',
        name: 'ROC_Form1_Certificate_Incorporation.pdf',
        fileSize: '342 KB',
        fileType: 'application/pdf',
        uploadedAt: '2016-05-18',
        category: 'Statutory Certificate',
        description: 'Certified True Copy of ROC Form 1 Incorporation'
      }
    ]
  },
  {
    id: 'reg-02',
    enterpriseId: 'ent-apex',
    registrationType: 'VAT',
    registrationNumber: '102849182-7000',
    issuingAuthority: 'Inland Revenue Department (IRD), Sri Lanka',
    issueDate: '2017-01-10',
    status: 'Active',
    responsiblePerson: 'Finance Department',
    remarks: 'Standard VAT Rate 18% filing quarterly.',
    supportingDocuments: [
      {
        id: 'doc-vat-01',
        name: 'VAT_Registration_Certificate_2017.pdf',
        fileSize: '218 KB',
        fileType: 'application/pdf',
        uploadedAt: '2017-01-10',
        category: 'Tax Certificate',
        description: 'IRD Value Added Tax (VAT) Registration Certificate'
      }
    ]
  },
  {
    id: 'reg-03',
    enterpriseId: 'ent-apex',
    registrationType: 'TIN',
    registrationNumber: '209184910',
    issuingAuthority: 'Inland Revenue Department (IRD), Sri Lanka',
    issueDate: '2016-06-01',
    status: 'Active',
    responsiblePerson: 'Finance Department',
    remarks: 'Corporate Income Tax identification.'
  },
  {
    id: 'reg-04',
    enterpriseId: 'ent-apex',
    registrationType: 'CIDA',
    registrationNumber: 'CIDA/EM/2022/9481',
    issuingAuthority: 'Construction Industry Development Authority (CIDA)',
    issueDate: '2023-01-15',
    expiryDate: '2026-12-31',
    renewalDate: '2026-11-01',
    status: 'Active',
    responsiblePerson: 'K. L. Wickramasinghe (Chief Engineer)',
    remarks: 'Grade C1 (Civil) & EM1 (Electro-Mechanical Works).',
    cidaDetails: {
      grade: 'C1 / EM1',
      category: 'Major Contractor',
      specialization: 'Civil & Heavy Mechanical'
    },
    supportingDocuments: [
      {
        id: 'doc-cida-01',
        name: 'CIDA_EM1_Contractor_License_2026.pdf',
        fileSize: '512 KB',
        fileType: 'application/pdf',
        uploadedAt: '2023-01-15',
        category: 'CIDA License',
        description: 'CIDA Grade C1 & EM1 Major Contractor Certification'
      }
    ]
  }
];

const initialDirectors: Director[] = [
  {
    id: 'dir-01',
    enterpriseId: 'ent-apex',
    name: 'Deshamanya Rohan Wickremasinghe',
    nicOrPassport: '651928391V',
    designation: 'Managing Director / Executive Chairman',
    appointmentDate: '2016-05-18',
    status: 'Active',
    address: 'No. 12/4, Gregory Road, Colombo 07',
    contact: '+94 77 739 1000',
    supportingDocuments: [
      {
        id: 'doc-dir-01',
        name: 'NIC_Copy_Rohan_Wickremasinghe.pdf',
        fileSize: '185 KB',
        fileType: 'application/pdf',
        uploadedAt: '2016-05-18',
        category: 'National Identity Proof',
        description: 'Certified copy of Sri Lankan National Identity Card'
      },
      {
        id: 'doc-dir-02',
        name: 'ROC_Form20_Appointment_Notice.pdf',
        fileSize: '290 KB',
        fileType: 'application/pdf',
        uploadedAt: '2016-05-18',
        category: 'Form 20 Consent',
        description: 'ROC Form 20 Consent and Certificate of Director Appointment'
      }
    ]
  },
  {
    id: 'dir-02',
    enterpriseId: 'ent-apex',
    name: 'Samantha Perera',
    nicOrPassport: '821948201V',
    designation: 'Director Operations & Fleet Logistics',
    appointmentDate: '2018-09-01',
    status: 'Active',
    address: 'No. 45/2, Baseline Road, Colombo 09',
    contact: '+94 77 123 4567'
  },
  {
    id: 'dir-03',
    enterpriseId: 'ent-apex',
    name: 'Ananda Jayawardena, FCA',
    nicOrPassport: '702849102V',
    designation: 'Non-Executive Finance Director',
    appointmentDate: '2020-03-15',
    status: 'Active',
    address: 'No. 88, Havelock Road, Colombo 05',
    contact: '+94 71 492 8810'
  }
];

const initialShareholders: Array<Omit<Shareholder, 'ownershipPercent'>> = [
  {
    id: 'sh-01',
    enterpriseId: 'ent-apex',
    name: 'Apex Holdings & Investments (Pvt) Ltd',
    type: 'Corporate',
    nicOrRegistration: 'PV-00192841',
    shares: 600000,
    shareClass: 'Ordinary Voting Shares',
    acquisitionDate: '2016-05-18',
    status: 'Active'
  },
  {
    id: 'sh-02',
    enterpriseId: 'ent-apex',
    name: 'Deshamanya Rohan Wickremasinghe',
    type: 'Individual',
    nicOrRegistration: '651928391V',
    shares: 300000,
    shareClass: 'Ordinary Voting Shares',
    acquisitionDate: '2016-05-18',
    status: 'Active'
  },
  {
    id: 'sh-03',
    enterpriseId: 'ent-apex',
    name: 'Samantha Perera',
    type: 'Individual',
    nicOrRegistration: '821948201V',
    shares: 100000,
    shareClass: 'Ordinary Voting Shares',
    acquisitionDate: '2018-09-01',
    status: 'Active'
  }
];

const initialAuthorizedPersons: AuthorizedPerson[] = [
  {
    id: 'auth-01',
    enterpriseId: 'ent-apex',
    name: 'Samantha Perera',
    role: 'Authorized Signatory',
    scope: 'Banking, Procurement up to LKR 25M, Project Invoices & Contracts',
    contact: '+94 77 123 4567',
    status: 'Active'
  },
  {
    id: 'auth-02',
    enterpriseId: 'ent-apex',
    name: 'Deshamanya Rohan Wickremasinghe',
    role: 'Director',
    scope: 'Unrestricted Signing Authority & Board Resolutions',
    contact: '+94 77 739 1000',
    status: 'Active'
  },
  {
    id: 'auth-03',
    enterpriseId: 'ent-apex',
    name: 'K. L. Wickramasinghe',
    role: 'Finance Manager',
    scope: 'Petty Cash Disbursements, PRV Endorsements, IRD Tax Filings',
    contact: '+94 77 289 4012',
    status: 'Active'
  }
];

const initialClients: Client[] = [
  {
    id: 'cli-cpcda',
    name: 'Colombo Port City Development Authority',
    organizationType: 'Government Authority',
    clientCode: 'CPCDA-001',
    shortName: 'CPCDA',
    registrationNumber: 'GA-2014-CPCDA',
    companyRegistrationDate: '2014-09-17',
    industry: 'Government / Infrastructure',
    clientCategory: 'Tier 1 Government Employer',
    status: 'ACTIVE',
    website: 'https://portcitycolombo.gov.lk',
    country: 'Sri Lanka',
    contactPerson: 'Eng. K. Wickramasinghe',
    address: 'Block A, Port City Boulevard, Colombo 01, Sri Lanka',
    phone: '+94 11 755 4000',
    email: 'billing@portcity.lk',
    notes: 'Master Developer and Employer for Colombo Port City Special Economic Zone infrastructure.',
    assignedProjectIds: ['PRJ-PORT-01', 'PRJ-001'],
    taxDetails: {
      tin: '20491827',
      vatNumber: '204918274-7000',
      svatNumber: 'SVAT-002914',
      isVatRegistered: true,
      taxStatus: 'VAT Registered',
      defaultVatRate: 18,
      defaultInvoiceCurrency: 'LKR',
      defaultPaymentTermsDays: 30,
      defaultDueDateRule: 'Invoice Date + 30 Days',
      invoiceAttentionTo: 'Eng. K. Wickramasinghe (Chief Project Director)',
      invoiceEmail: 'invoices@portcity.lk',
      invoiceDeliveryMethod: 'Email',
      invoiceAddressType: 'Billing Address',
      creditLimit: 500000000,
      isRetentionApplicable: true,
      defaultRetentionPercent: 5,
      isAdvanceApplicable: true,
      defaultAdvancePercent: 10,
      isWithholdingTaxApplicable: true,
      defaultWhtPercent: 2.5,
      isWhtCertificateRequired: true
    },
    taxInvoiceMasterData: {
      displayName: 'Colombo Port City Development Authority',
      address: 'Block A, Port City Boulevard, Colombo 01, Sri Lanka',
      tin: '20491827',
      vatNumber: '204918274-7000',
      attentionTo: 'Eng. K. Wickramasinghe (Chief Project Director)',
      contactPerson: 'Eng. K. Wickramasinghe',
      email: 'billing@portcity.lk',
      telephone: '+94 11 755 4000',
      paymentTerms: '30 Days from milestone certification',
      currency: 'LKR',
      defaultVatRate: 18,
      defaultTaxTreatment: 'Standard 18% Output VAT on Infrastructure Services',
      defaultInvoiceNotes: 'Certified under Port City Infrastructure Framework Agreement & IPC Schedule.',
      defaultInvoiceFooterNotes: 'Official Tax Invoice issued under Inland Revenue Department regulations.'
    },
    primaryContact: {
      name: 'Eng. K. Wickramasinghe',
      designation: 'Chief Project Director / Employer Representative',
      department: 'Engineering & Infrastructure Directorate',
      telephone: '+94 11 755 4000',
      mobile: '+94 77 789 2000',
      email: 'k.wickramasinghe@portcity.lk',
      alternativeEmail: 'billing@portcity.lk',
      fax: '+94 11 755 4001'
    },
    commercialContacts: {
      accountsDepartmentContact: 'Mr. Susantha Alwis (Head of Finance)',
      accountsDepartmentEmail: 'finance@portcity.lk',
      accountsDepartmentTelephone: '+94 11 755 4020',
      projectDirector: 'Eng. K. Wickramasinghe',
      projectDirectorEmail: 'k.wickramasinghe@portcity.lk',
      commercialContact: 'Ms. N. Jayawardena (Commercial Manager)',
      commercialEmail: 'commercial@portcity.lk',
      procurementContact: 'Mr. M. Fernando (Director Procurement)',
      procurementEmail: 'procurement@portcity.lk'
    },
    contacts: [
      {
        id: 'ccon-1',
        name: 'Eng. K. Wickramasinghe',
        designation: 'Chief Project Director',
        department: 'Engineering',
        telephone: '+94 11 755 4000',
        mobile: '+94 77 789 2000',
        email: 'k.wickramasinghe@portcity.lk',
        contactType: 'Project Director',
        isPrimary: true,
        isActive: true,
        isTaxInvoiceContact: true
      },
      {
        id: 'ccon-2',
        name: 'Mr. Susantha Alwis',
        designation: 'Head of Finance & Tax Compliance',
        department: 'Finance & Accounts',
        telephone: '+94 11 755 4020',
        email: 'finance@portcity.lk',
        contactType: 'Finance',
        isPrimary: false,
        isActive: true,
        isTaxInvoiceContact: true
      }
    ],
    registeredAddress: {
      line1: 'Block A, Port City Boulevard',
      line2: 'Financial District',
      city: 'Colombo 01',
      district: 'Colombo',
      province: 'Western Province',
      postalCode: '00100',
      country: 'Sri Lanka'
    },
    billingAddress: {
      sameAsRegistered: true,
      line1: 'Block A, Port City Boulevard',
      city: 'Colombo 01',
      country: 'Sri Lanka'
    },
    paymentTerms: {
      defaultPaymentTermsDays: 30,
      paymentTermsDescription: 'Payment within 30 days from date of Tax Invoice.',
      defaultDueDateRule: 'Invoice Date + 30 Days',
      creditPeriodDays: 30,
      retentionPercent: 5,
      advancePercent: 10,
      whtPercent: 2.5,
      preferredPaymentMethod: 'Bank Transfer',
      specialPaymentInstructions: 'Direct electronic RTGS to Company Treasury Account.'
    },
    bankAccounts: [
      {
        id: 'cbk-1',
        bankName: 'Bank of Ceylon',
        branch: 'Corporate Branch',
        accountName: 'Colombo Port City Development Authority - Escrow Operations',
        accountNumber: '0002849182',
        swift: 'BCEYLKLX',
        bankCode: '7010',
        currency: 'LKR',
        accountType: 'Current',
        isDefault: true
      }
    ],
    initialContract: {
      contractNumber: 'CPCE-2025-C08',
      contractName: 'Colombo Port Expansion Phase II & Breakwater Armor',
      projectName: 'Colombo Port Expansion Phase II',
      projectCode: 'PRJ-PORT-01',
      employerReference: 'CPCDA/ENG/2025/08',
      loaNumber: 'LOA-CPCDA-2025-012',
      loaDate: '2025-01-10',
      contractStartDate: '2025-02-01',
      contractCompletionDate: '2027-01-31',
      contractValue: 450000000,
      currency: 'LKR',
      consultantEngineer: 'Royal HaskoningDHV / Scott Wilson JV',
      contractType: 'FIDIC Red Book (Measurement)',
      paymentTerms: 'Monthly Interim Payment Certificates (30 Days)',
      retentionPercent: 5,
      advancePercent: 10,
      defectsLiabilityPeriod: '365 Days after Taking-Over Certificate'
    },
    documents: [
      {
        id: 'cdoc-1',
        name: 'CPCDA_Master_Framework_Agreement.pdf',
        documentType: 'Master Agreement',
        documentNumber: 'CPCDA-MFA-2025',
        issueDate: '2025-01-15',
        expiryDate: '2028-01-14',
        uploadedBy: 'System Administrator',
        uploadedDate: '2025-01-15',
        fileSize: '1.4 MB',
        fileType: 'application/pdf',
        notes: 'Executed tripartite master framework agreement.',
        status: 'Active'
      },
      {
        id: 'cdoc-2',
        name: 'CPCDA_VAT_TIN_Registration_Certificate.pdf',
        documentType: 'VAT Certificate',
        documentNumber: 'VAT-204918274-7000',
        issueDate: '2024-01-01',
        expiryDate: '2027-12-31',
        uploadedBy: 'Finance Department',
        uploadedDate: '2024-01-02',
        fileSize: '410 KB',
        fileType: 'application/pdf',
        notes: 'IRD Certified registration certificate.',
        status: 'Active'
      }
    ],
    auditTrail: [
      {
        id: 'caud-1',
        timestamp: '2025-01-10 09:30:00',
        user: 'System Admin',
        action: 'Client Created',
        clientName: 'Colombo Port City Development Authority',
        notes: 'Master Client Record initialized with verified tax & project credentials.'
      }
    ]
  },
  {
    id: 'cli-01',
    name: 'Road Development Authority (RDA)',
    organizationType: 'Government Authority',
    clientCode: 'RDA-001',
    shortName: 'RDA',
    registrationNumber: 'GA-1986-RDA',
    companyRegistrationDate: '1986-12-15',
    industry: 'Government / Infrastructure',
    clientCategory: 'State Authority',
    status: 'ACTIVE',
    website: 'https://rda.gov.lk',
    country: 'Sri Lanka',
    contactPerson: 'Eng. H. M. Karunaratne (Project Director)',
    address: 'Maganeguma Mahamedura, No. 216, Denzil Kobbekaduwa Mawatha, Battaramulla',
    phone: '+94 11 286 0018',
    email: 'info@rda.gov.lk',
    notes: 'Central Highway & Expressway works authority.',
    taxDetails: {
      tin: '102948291',
      vatNumber: '102948291-7000',
      isVatRegistered: true,
      taxStatus: 'VAT Registered',
      defaultVatRate: 18,
      defaultInvoiceCurrency: 'LKR',
      defaultPaymentTermsDays: 30,
      invoiceAttentionTo: 'Eng. H. M. Karunaratne (Project Director)',
      invoiceEmail: 'finance@rda.gov.lk',
      isRetentionApplicable: true,
      defaultRetentionPercent: 5,
      isAdvanceApplicable: true,
      defaultAdvancePercent: 10,
      isWithholdingTaxApplicable: true,
      defaultWhtPercent: 2.5,
      isWhtCertificateRequired: true
    },
    taxInvoiceMasterData: {
      displayName: 'Road Development Authority (RDA)',
      address: 'Maganeguma Mahamedura, No. 216, Denzil Kobbekaduwa Mawatha, Battaramulla',
      tin: '102948291',
      vatNumber: '102948291-7000',
      attentionTo: 'Eng. H. M. Karunaratne (Project Director)',
      contactPerson: 'Eng. H. M. Karunaratne',
      email: 'finance@rda.gov.lk',
      telephone: '+94 11 286 0018',
      paymentTerms: '30 Days',
      currency: 'LKR',
      defaultVatRate: 18
    },
    registeredAddress: {
      line1: 'Maganeguma Mahamedura, No. 216',
      line2: 'Denzil Kobbekaduwa Mawatha',
      city: 'Battaramulla',
      country: 'Sri Lanka'
    },
    billingAddress: {
      sameAsRegistered: true,
      line1: 'Maganeguma Mahamedura, No. 216',
      city: 'Battaramulla',
      country: 'Sri Lanka'
    },
    paymentTerms: {
      defaultPaymentTermsDays: 30,
      paymentTermsDescription: 'Payment within 30 days from date of Tax Invoice.',
      preferredPaymentMethod: 'Bank Transfer'
    },
    supportingDocuments: [
      {
        id: 'doc-cli-01',
        name: 'RDA_Framework_Agreement_2024.pdf',
        fileSize: '420 KB',
        fileType: 'application/pdf',
        uploadedAt: '2024-01-15',
        category: 'Client Agreement',
        description: 'Road Development Authority Major Works Framework Agreement'
      }
    ]
  },
  {
    id: 'cli-02',
    name: 'Ceylon Electricity Board (CEB)',
    organizationType: 'State Owned Enterprise',
    clientCode: 'CEB-001',
    shortName: 'CEB',
    registrationNumber: 'SOE-1969-CEB',
    companyRegistrationDate: '1969-11-01',
    industry: 'Energy & Power Infrastructure',
    clientCategory: 'State Corporation',
    status: 'ACTIVE',
    website: 'https://ceb.lk',
    country: 'Sri Lanka',
    contactPerson: 'Mr. P. Bandara (Chief Civil Engineer)',
    address: 'No. 50, Sir Chittampalam A. Gardiner Mawatha, Colombo 02',
    phone: '+94 11 232 4471',
    email: 'transmission@ceb.lk',
    notes: 'Substation and High Voltage transmission contracts.',
    taxDetails: {
      tin: '108392019',
      vatNumber: '108392019-7000',
      isVatRegistered: true,
      taxStatus: 'VAT Registered',
      defaultVatRate: 18,
      defaultInvoiceCurrency: 'LKR',
      defaultPaymentTermsDays: 30,
      invoiceAttentionTo: 'Mr. P. Bandara (Chief Civil Engineer)',
      invoiceEmail: 'accounts@ceb.lk',
      isRetentionApplicable: true,
      defaultRetentionPercent: 5,
      isAdvanceApplicable: true,
      defaultAdvancePercent: 10,
      isWithholdingTaxApplicable: true,
      defaultWhtPercent: 2.5,
      isWhtCertificateRequired: true
    },
    taxInvoiceMasterData: {
      displayName: 'Ceylon Electricity Board (CEB)',
      address: 'No. 50, Sir Chittampalam A. Gardiner Mawatha, Colombo 02',
      tin: '108392019',
      vatNumber: '108392019-7000',
      attentionTo: 'Mr. P. Bandara (Chief Civil Engineer)',
      contactPerson: 'Mr. P. Bandara',
      email: 'transmission@ceb.lk',
      telephone: '+94 11 232 4471',
      paymentTerms: '30 Days',
      currency: 'LKR',
      defaultVatRate: 18
    },
    registeredAddress: {
      line1: 'No. 50, Sir Chittampalam A. Gardiner Mawatha',
      city: 'Colombo 02',
      country: 'Sri Lanka'
    },
    billingAddress: {
      sameAsRegistered: true,
      line1: 'No. 50, Sir Chittampalam A. Gardiner Mawatha',
      city: 'Colombo 02',
      country: 'Sri Lanka'
    },
    paymentTerms: {
      defaultPaymentTermsDays: 30,
      paymentTermsDescription: 'Payment within 30 days from date of Tax Invoice.',
      preferredPaymentMethod: 'Bank Transfer'
    },
    supportingDocuments: [
      {
        id: 'doc-cli-02',
        name: 'CEB_Letter_of_Acceptance_Transmission.pdf',
        fileSize: '315 KB',
        fileType: 'application/pdf',
        uploadedAt: '2024-03-20',
        category: 'Letter of Award',
        description: 'Official CEB Acceptance & Substation Construction Authorization'
      }
    ]
  },
  {
    id: 'cli-03',
    name: 'National Water Supply and Drainage Board (NWSDB)',
    organizationType: 'Statutory Board',
    clientCode: 'NWSDB-001',
    shortName: 'NWSDB',
    registrationNumber: 'SB-1974-NWSDB',
    companyRegistrationDate: '1974-05-20',
    industry: 'Water & Sanitation Infrastructure',
    clientCategory: 'Statutory Board',
    status: 'ACTIVE',
    website: 'https://waterboard.lk',
    country: 'Sri Lanka',
    contactPerson: 'Eng. Mrs. S. Dias',
    address: 'Galle Road, Ratmalana',
    phone: '+94 11 263 8999',
    email: 'procurement@waterboard.lk',
    notes: 'Water distribution piping and pumping civil stations.',
    taxDetails: {
      tin: '109283748',
      vatNumber: '109283748-7000',
      isVatRegistered: true,
      taxStatus: 'VAT Registered',
      defaultVatRate: 18,
      defaultInvoiceCurrency: 'LKR',
      defaultPaymentTermsDays: 30,
      invoiceAttentionTo: 'Eng. Mrs. S. Dias',
      invoiceEmail: 'accounts@waterboard.lk',
      isRetentionApplicable: true,
      defaultRetentionPercent: 5,
      isAdvanceApplicable: true,
      defaultAdvancePercent: 10,
      isWithholdingTaxApplicable: true,
      defaultWhtPercent: 2.5,
      isWhtCertificateRequired: true
    },
    taxInvoiceMasterData: {
      displayName: 'National Water Supply and Drainage Board (NWSDB)',
      address: 'Galle Road, Ratmalana',
      tin: '109283748',
      vatNumber: '109283748-7000',
      attentionTo: 'Eng. Mrs. S. Dias',
      contactPerson: 'Eng. Mrs. S. Dias',
      email: 'procurement@waterboard.lk',
      telephone: '+94 11 263 8999',
      paymentTerms: '30 Days',
      currency: 'LKR',
      defaultVatRate: 18
    },
    registeredAddress: {
      line1: 'Galle Road',
      city: 'Ratmalana',
      country: 'Sri Lanka'
    },
    billingAddress: {
      sameAsRegistered: true,
      line1: 'Galle Road',
      city: 'Ratmalana',
      country: 'Sri Lanka'
    },
    paymentTerms: {
      defaultPaymentTermsDays: 30,
      paymentTermsDescription: 'Payment within 30 days from date of Tax Invoice.',
      preferredPaymentMethod: 'Bank Transfer'
    }
  }
];

const EnterpriseCompanyContext = createContext<EnterpriseCompanyContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'ema_enterprise_corporate_v1';

export const EnterpriseCompanyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentEnterprise } = useEnterprise();

  const [profile, setProfile] = useState<EnterpriseProfileDetails>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_profile`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultProfile;
  });

  const [registrations, setRegistrations] = useState<StatutoryRegistration[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_registrations`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialRegistrations;
  });

  const [directors, setDirectors] = useState<Director[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_directors`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialDirectors;
  });

  const [rawShareholders, setRawShareholders] = useState<Array<Omit<Shareholder, 'ownershipPercent'>>>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_shareholders`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialShareholders;
  });

  const [authorizedPersons, setAuthorizedPersons] = useState<AuthorizedPerson[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_authorized_persons`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialAuthorizedPersons;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_clients`);
      if (saved !== null) {
        const parsed: Client[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
    return initialClients;
  });

  // Calculate dynamic ownership percentage
  const totalShares = rawShareholders.reduce((sum, sh) => sum + (Number(sh.shares) || 0), 0) || 1;
  const shareholders: Shareholder[] = rawShareholders.map(sh => ({
    ...sh,
    ownershipPercent: Number(((sh.shares / totalShares) * 100).toFixed(2))
  }));

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_profile`, JSON.stringify(profile));
    } catch {}
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_registrations`, JSON.stringify(registrations));
    } catch {}
  }, [registrations]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_directors`, JSON.stringify(directors));
    } catch {}
  }, [directors]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_shareholders`, JSON.stringify(rawShareholders));
    } catch {}
  }, [rawShareholders]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_authorized_persons`, JSON.stringify(authorizedPersons));
    } catch {}
  }, [authorizedPersons]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_clients`, JSON.stringify(clients));
    } catch {}
  }, [clients]);

  const updateProfile = (details: Partial<EnterpriseProfileDetails>) => {
    setProfile(prev => ({ ...prev, ...details }));
  };

  const addRegistration = (reg: Omit<StatutoryRegistration, 'id'>) => {
    const newReg: StatutoryRegistration = {
      ...reg,
      id: `reg-${Date.now()}`,
      enterpriseId: currentEnterprise?.id || 'ent-apex'
    };
    setRegistrations(prev => [newReg, ...prev]);
  };

  const updateRegistration = (id: string, reg: Partial<StatutoryRegistration>) => {
    setRegistrations(prev => prev.map(r => (r.id === id ? { ...r, ...reg } : r)));
  };

  const deleteRegistration = (id: string) => {
    setRegistrations(prev => prev.filter(r => r.id !== id));
  };

  const addDirector = (director: Omit<Director, 'id'>) => {
    const newDir: Director = {
      ...director,
      id: `dir-${Date.now()}`,
      enterpriseId: currentEnterprise?.id || 'ent-apex'
    };
    setDirectors(prev => [newDir, ...prev]);
  };

  const updateDirector = (id: string, dir: Partial<Director>) => {
    setDirectors(prev => prev.map(d => (d.id === id ? { ...d, ...dir } : d)));
  };

  const deleteDirector = (id: string) => {
    setDirectors(prev => prev.filter(d => d.id !== id));
  };

  const addShareholder = (sh: Omit<Shareholder, 'id' | 'ownershipPercent'>) => {
    const newSh = {
      ...sh,
      id: `sh-${Date.now()}`,
      enterpriseId: currentEnterprise?.id || 'ent-apex'
    };
    setRawShareholders(prev => [...prev, newSh]);
  };

  const updateShareholder = (id: string, sh: Partial<Shareholder>) => {
    setRawShareholders(prev => prev.map(s => (s.id === id ? { ...s, ...sh } : s)));
  };

  const deleteShareholder = (id: string) => {
    setRawShareholders(prev => prev.filter(s => s.id !== id));
  };

  const addAuthorizedPerson = (person: Omit<AuthorizedPerson, 'id'>) => {
    const newAuth: AuthorizedPerson = {
      ...person,
      id: `auth-${Date.now()}`,
      enterpriseId: currentEnterprise?.id || 'ent-apex'
    };
    setAuthorizedPersons(prev => [newAuth, ...prev]);
  };

  const updateAuthorizedPerson = (id: string, person: Partial<AuthorizedPerson>) => {
    setAuthorizedPersons(prev => prev.map(p => (p.id === id ? { ...p, ...person } : p)));
  };

  const deleteAuthorizedPerson = (id: string) => {
    setAuthorizedPersons(prev => prev.filter(p => p.id !== id));
  };

  const addClient = (client: Omit<Client, 'id'>) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newClient: Client = {
      ...client,
      id: `cli-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
      status: client.status || 'ACTIVE',
      auditTrail: [
        {
          id: `caud-${Date.now()}`,
          timestamp: nowStr,
          user: 'Finance / Admin',
          action: 'Client Created',
          clientName: client.name,
          notes: 'Registered as verified client / employer.'
        },
        ...(client.auditTrail || [])
      ]
    };
    setClients(prev => [newClient, ...prev]);
  };

  const updateClient = (id: string, client: Partial<Client>) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setClients(prev =>
      prev.map(c => {
        if (c.id !== id) return c;
        const action = client.taxDetails
          ? 'Tax Details Changed'
          : client.bankAccounts
          ? 'Bank Details Changed'
          : client.status && client.status !== c.status
          ? 'Client Status Changed'
          : 'Client Edited';
        const newAuditEntry: ClientAuditEntry = {
          id: `caud-${Date.now()}`,
          timestamp: nowStr,
          user: 'Finance / Admin',
          action: action as any,
          clientName: client.name || c.name,
          notes: `Updated client master record (${action}).`
        };
        return {
          ...c,
          ...client,
          auditTrail: [newAuditEntry, ...(c.auditTrail || [])]
        };
      })
    );
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const clearClientsHistory = () => {
    setClients([]);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_clients`, JSON.stringify([]));
    } catch {}
  };

  const resetClientsToDefault = () => {
    setClients(initialClients);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_clients`, JSON.stringify(initialClients));
    } catch {}
  };

  const clearClientAuditHistory = (clientId: string) => {
    setClients(prev =>
      prev.map(c => {
        if (c.id === clientId) {
          return {
            ...c,
            auditTrail: []
          };
        }
        return c;
      })
    );
  };

  return (
    <EnterpriseCompanyContext.Provider
      value={{
        profile,
        registrations,
        directors,
        shareholders,
        authorizedPersons,
        clients,
        updateProfile,
        addRegistration,
        updateRegistration,
        deleteRegistration,
        addDirector,
        updateDirector,
        deleteDirector,
        addShareholder,
        updateShareholder,
        deleteShareholder,
        addAuthorizedPerson,
        updateAuthorizedPerson,
        deleteAuthorizedPerson,
        addClient,
        updateClient,
        deleteClient,
        clearClientsHistory,
        resetClientsToDefault,
        clearClientAuditHistory
      }}
    >
      {children}
    </EnterpriseCompanyContext.Provider>
  );
};

export const useEnterpriseCompany = (): EnterpriseCompanyContextType => {
  const context = useContext(EnterpriseCompanyContext);
  if (!context) {
    throw new Error('useEnterpriseCompany must be used within an EnterpriseCompanyProvider');
  }
  return context;
};
