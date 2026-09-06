import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  EnterpriseProfileDetails,
  StatutoryRegistration,
  Director,
  Shareholder,
  AuthorizedPerson,
  Client
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
    id: 'cli-01',
    name: 'Road Development Authority (RDA)',
    contactPerson: 'Eng. H. M. Karunaratne (Project Director)',
    address: 'Maganeguma Mahamedura, No. 216, Denzil Kobbekaduwa Mawatha, Battaramulla',
    phone: '+94 11 286 0018',
    email: 'info@rda.gov.lk',
    notes: 'Central Highway & Expressway works authority.',
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
    contactPerson: 'Mr. P. Bandara (Chief Civil Engineer)',
    address: 'No. 50, Sir Chittampalam A. Gardiner Mawatha, Colombo 02',
    phone: '+94 11 232 4471',
    email: 'transmission@ceb.lk',
    notes: 'Substation and High Voltage transmission contracts.',
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
    contactPerson: 'Eng. Mrs. S. Dias',
    address: 'Galle Road, Ratmalana',
    phone: '+94 11 263 8999',
    email: 'procurement@waterboard.lk',
    notes: 'Water distribution piping and pumping civil stations.'
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
      if (saved) return JSON.parse(saved);
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
    const newClient: Client = {
      ...client,
      id: `cli-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    setClients(prev => [newClient, ...prev]);
  };

  const updateClient = (id: string, client: Partial<Client>) => {
    setClients(prev => prev.map(c => (c.id === id ? { ...c, ...client } : c)));
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
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
        deleteClient
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
