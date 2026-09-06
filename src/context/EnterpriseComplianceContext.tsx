import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
  IsoCertificate,
  IsoAudit,
  Auditor,
  AuditorReport,
  AuditFinding,
  InsurancePolicy,
  Licence,
  ExpiryAlertItem,
  ExpiryStatus
} from '../types/complianceTypes';
import { useEnterprise } from './EnterpriseContext';
import { useEnterpriseCompany } from './EnterpriseCompanyContext';

interface EnterpriseComplianceContextType {
  isoCertificates: IsoCertificate[];
  isoAudits: IsoAudit[];
  auditors: Auditor[];
  auditorReports: AuditorReport[];
  auditFindings: AuditFinding[];
  insurancePolicies: InsurancePolicy[];
  licences: Licence[];
  expiryAlerts: ExpiryAlertItem[];
  addIsoCertificate: (cert: Omit<IsoCertificate, 'id' | 'status'>) => void;
  updateIsoCertificate: (id: string, cert: Partial<IsoCertificate>) => void;
  deleteIsoCertificate: (id: string) => void;
  addIsoAudit: (audit: Omit<IsoAudit, 'id'>) => void;
  updateIsoAudit: (id: string, audit: Partial<IsoAudit>) => void;
  deleteIsoAudit: (id: string) => void;
  addAuditor: (auditor: Omit<Auditor, 'id'>) => void;
  updateAuditor: (id: string, auditor: Partial<Auditor>) => void;
  deleteAuditor: (id: string) => void;
  addAuditorReport: (report: Omit<AuditorReport, 'id'>) => void;
  updateAuditorReport: (id: string, report: Partial<AuditorReport>) => void;
  deleteAuditorReport: (id: string) => void;
  addAuditFinding: (finding: Omit<AuditFinding, 'id'>) => void;
  updateAuditFinding: (id: string, finding: Partial<AuditFinding>) => void;
  deleteAuditFinding: (id: string) => void;
  addInsurancePolicy: (policy: Omit<InsurancePolicy, 'id' | 'status'>) => void;
  updateInsurancePolicy: (id: string, policy: Partial<InsurancePolicy>) => void;
  deleteInsurancePolicy: (id: string) => void;
  addLicence: (licence: Omit<Licence, 'id' | 'status'>) => void;
  updateLicence: (id: string, licence: Partial<Licence>) => void;
  deleteLicence: (id: string) => void;
}

const calculateDaysRemaining = (expiryDate: string): number => {
  if (!expiryDate) return 999;
  const expiry = new Date(expiryDate).getTime();
  const now = new Date().getTime();
  return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
};

const determineExpiryStatus = (daysRemaining: number): ExpiryStatus => {
  if (daysRemaining <= 0) return 'Expired';
  if (daysRemaining <= 60) return 'Expiring Soon';
  return 'Active';
};

const initialIsoCertificates: Array<Omit<IsoCertificate, 'status'>> = [
  {
    id: 'iso-01',
    enterpriseId: 'ent-apex',
    standard: 'ISO 9001:2015',
    certificateNumber: 'LK23/91024',
    certificationBody: 'SGS Lanka (Pvt) Ltd',
    scope: 'Provision of Project Logistics, Heavy Freight Forwarding & Construction Contract Services',
    issueDate: '2023-10-15',
    expiryDate: '2026-10-14',
    leadAuditor: 'Mr. N. Senanayake',
    remarks: 'Surveillance 2 completed successfully.'
  },
  {
    id: 'iso-02',
    enterpriseId: 'ent-apex',
    standard: 'ISO 14001:2015',
    certificateNumber: 'EMS-00912',
    certificationBody: 'Bureau Veritas Certification',
    scope: 'Environmental Management System for Fleet Depot, Workshops & Site Haulage Operations',
    issueDate: '2024-02-01',
    expiryDate: '2027-01-31',
    leadAuditor: 'Ms. T. Fernando',
    remarks: 'Zero environmental non-conformances in latest audit.'
  },
  {
    id: 'iso-03',
    enterpriseId: 'ent-apex',
    standard: 'ISO 45001:2018',
    certificateNumber: 'OHS-88210',
    certificationBody: 'Sri Lanka Standards Institution (SLSI)',
    scope: 'Occupational Health and Safety for Construction Sites & Transport Yards',
    issueDate: '2023-08-20',
    expiryDate: '2026-08-19',
    leadAuditor: 'Eng. K. Abeyratne',
    remarks: 'Recertification audit scheduled for Q3 2026.'
  }
];

const initialIsoAudits: IsoAudit[] = [
  {
    id: 'audit-01',
    isoCertificateId: 'iso-01',
    auditType: 'Surveillance 1',
    auditDate: '2024-10-12',
    auditorName: 'Mr. N. Senanayake',
    auditingFirm: 'SGS Lanka',
    findingsCount: 1,
    majorNonConformances: 0,
    minorNonConformances: 1,
    observations: 3,
    outcome: 'Passed',
    nextAuditDueDate: '2025-10-10',
    remarks: 'Minor finding on calibration log of tire pressure gauges closed.'
  },
  {
    id: 'audit-02',
    isoCertificateId: 'iso-01',
    auditType: 'Surveillance 2',
    auditDate: '2025-10-08',
    auditorName: 'Mr. N. Senanayake',
    auditingFirm: 'SGS Lanka',
    findingsCount: 0,
    majorNonConformances: 0,
    minorNonConformances: 0,
    observations: 2,
    outcome: 'Passed',
    nextAuditDueDate: '2026-10-01',
    remarks: 'Clean surveillance pass. Recommended for recertification.'
  }
];

const initialAuditors: Auditor[] = [
  {
    id: 'aud-01',
    enterpriseId: 'ent-apex',
    firmName: 'KPMG Sri Lanka (Chartered Accountants)',
    partnerName: 'Mr. Suren Rajanathan, FCA',
    engagementType: 'External Financial Auditor',
    appointedDate: '2021-04-01',
    tenureYears: 5,
    status: 'Active',
    contactEmail: 'srajanathan@kpmg.lk',
    contactPhone: '+94 11 542 6426',
    address: 'No. 32A, Sir Mohamed Macan Markar Mawatha, Colombo 03'
  },
  {
    id: 'aud-02',
    enterpriseId: 'ent-apex',
    firmName: 'BDO Partners (Consulting)',
    partnerName: 'Ms. Priyanthi Fonseka',
    engagementType: 'Tax Consultant',
    appointedDate: '2022-01-15',
    tenureYears: 4,
    status: 'Active',
    contactEmail: 'tax@bdo.lk',
    contactPhone: '+94 11 257 5123',
    address: 'Chartered House, No. 65/2, Sir Chittampalam A. Gardiner Mawatha, Colombo 02'
  }
];

const initialAuditorReports: AuditorReport[] = [
  {
    id: 'rep-01',
    auditorId: 'aud-01',
    financialYear: 'FY 2024/2025',
    reportTitle: 'Independent Auditor Report on Consolidated Financial Statements',
    auditOpinion: 'Unqualified (Clean)',
    reportDate: '2025-08-30',
    managementLetterPresent: true,
    remarks: 'Clean opinion issued. Two low-risk internal control points noted in Management Letter.'
  }
];

const initialAuditFindings: AuditFinding[] = [
  {
    id: 'find-01',
    reportId: 'rep-01',
    category: 'Internal Control',
    severity: 'Medium',
    issueDescription: 'Site petty cash physical voucher signoffs experienced a 5-day verification lag on Outstation Projects.',
    recommendation: 'Enforce digital daily synchronization via EMA Mobile and weekly supervisor sign-off locks.',
    managementResponse: 'Fully implemented through EMA Corporate Petty Cash module version 2.4.',
    assignedTo: 'Finance Manager (K. L. Wickramasinghe)',
    targetDate: '2025-11-30',
    status: 'Resolved'
  }
];

const initialInsurancePolicies: Array<Omit<InsurancePolicy, 'status'>> = [
  {
    id: 'ins-01',
    enterpriseId: 'ent-apex',
    policyType: 'Contractors All Risk (CAR)',
    policyNumber: 'CAR-2025-9941',
    insurer: 'Sri Lanka Insurance Corporation (SLIC)',
    coverageAmount: 250000000,
    premiumAmount: 1850000,
    startDate: '2025-06-01',
    expiryDate: '2026-06-30',
    projectId: 'PRJ-2026-001',
    remarks: 'Comprehensive coverage for Central Expressway Extension Section 2.'
  },
  {
    id: 'ins-02',
    enterpriseId: 'ent-apex',
    policyType: 'Workmen Compensation',
    policyNumber: 'WC-40182-2026',
    insurer: 'Ceylinco General Insurance PLC',
    coverageAmount: 75000000,
    premiumAmount: 620000,
    startDate: '2026-01-01',
    expiryDate: '2026-12-31',
    remarks: 'Covers all site labor, mechanics, supervisors, and vehicle crew members.'
  },
  {
    id: 'ins-03',
    enterpriseId: 'ent-apex',
    policyType: 'Plant & Machinery',
    policyNumber: 'CPM-88910',
    insurer: 'Allianz Insurance Lanka Ltd',
    coverageAmount: 420000000,
    premiumAmount: 3400000,
    startDate: '2025-09-15',
    expiryDate: '2026-09-14',
    remarks: 'Heavy earthmovers, tippers, prime movers, and hydraulic excavators.'
  }
];

const initialLicences: Array<Omit<Licence, 'status'>> = [
  {
    id: 'lic-01',
    enterpriseId: 'ent-apex',
    licenceType: 'Trade Licence',
    licenceNumber: 'TL/COL01/2026/410',
    issuingAuthority: 'Colombo Municipal Council (CMC)',
    issueDate: '2026-01-02',
    expiryDate: '2026-12-31',
    remarks: 'Annual municipal trade licence for headquarters & depot.'
  },
  {
    id: 'lic-02',
    enterpriseId: 'ent-apex',
    licenceType: 'Environmental Protection Licence (EPL)',
    licenceNumber: 'CEA/EPL/WP/0948/2024',
    issuingAuthority: 'Central Environmental Authority (CEA)',
    issueDate: '2024-05-10',
    expiryDate: '2027-05-09',
    remarks: 'Heavy machinery service depot and oil interceptor compliance.'
  },
  {
    id: 'lic-03',
    enterpriseId: 'ent-apex',
    licenceType: 'Mining & Quarrying Permit',
    licenceNumber: 'GSMB/AML/2025/119',
    issuingAuthority: 'Geological Survey and Mines Bureau (GSMB)',
    issueDate: '2025-07-01',
    expiryDate: '2026-06-30',
    remarks: 'Aggregates extraction permit for project batching plant.'
  }
];

const EnterpriseComplianceContext = createContext<EnterpriseComplianceContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'ema_enterprise_compliance_v1';

export const EnterpriseComplianceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentEnterprise } = useEnterprise();
  const { registrations } = useEnterpriseCompany();

  const [rawIsoCertificates, setRawIsoCertificates] = useState<Array<Omit<IsoCertificate, 'status'>>>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_iso_certs`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialIsoCertificates;
  });

  const [isoAudits, setIsoAudits] = useState<IsoAudit[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_iso_audits`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialIsoAudits;
  });

  const [auditors, setAuditors] = useState<Auditor[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_auditors`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialAuditors;
  });

  const [auditorReports, setAuditorReports] = useState<AuditorReport[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_auditor_reports`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialAuditorReports;
  });

  const [auditFindings, setAuditFindings] = useState<AuditFinding[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_audit_findings`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialAuditFindings;
  });

  const [rawInsurancePolicies, setRawInsurancePolicies] = useState<Array<Omit<InsurancePolicy, 'status'>>>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_insurance`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialInsurancePolicies;
  });

  const [rawLicences, setRawLicences] = useState<Array<Omit<Licence, 'status'>>>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_licences`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialLicences;
  });

  // Calculate statuses dynamically
  const isoCertificates: IsoCertificate[] = useMemo(() => {
    return rawIsoCertificates.map(c => ({
      ...c,
      status: determineExpiryStatus(calculateDaysRemaining(c.expiryDate))
    }));
  }, [rawIsoCertificates]);

  const insurancePolicies: InsurancePolicy[] = useMemo(() => {
    return rawInsurancePolicies.map(p => ({
      ...p,
      status: determineExpiryStatus(calculateDaysRemaining(p.expiryDate))
    }));
  }, [rawInsurancePolicies]);

  const licences: Licence[] = useMemo(() => {
    return rawLicences.map(l => ({
      ...l,
      status: determineExpiryStatus(calculateDaysRemaining(l.expiryDate))
    }));
  }, [rawLicences]);

  // Aggregate Central Expiry Alerts (Section 20)
  const expiryAlerts: ExpiryAlertItem[] = useMemo(() => {
    const items: ExpiryAlertItem[] = [];

    // 1. Statutory Registrations
    registrations.forEach(r => {
      if (r.expiryDate) {
        const days = calculateDaysRemaining(r.expiryDate);
        items.push({
          id: `alert-reg-${r.id}`,
          entityType: 'REGISTRATION',
          title: `${r.registrationType} Registration`,
          referenceNumber: r.registrationNumber,
          expiryDate: r.expiryDate,
          daysRemaining: days,
          status: determineExpiryStatus(days),
          responsiblePerson: r.responsiblePerson
        });
      }
    });

    // 2. ISO Certificates
    isoCertificates.forEach(c => {
      const days = calculateDaysRemaining(c.expiryDate);
      items.push({
        id: `alert-iso-${c.id}`,
        entityType: 'ISO',
        title: `${c.standard} Certification`,
        referenceNumber: c.certificateNumber,
        expiryDate: c.expiryDate,
        daysRemaining: days,
        status: determineExpiryStatus(days),
        responsiblePerson: c.leadAuditor
      });
    });

    // 3. Insurance Policies
    insurancePolicies.forEach(p => {
      const days = calculateDaysRemaining(p.expiryDate);
      items.push({
        id: `alert-ins-${p.id}`,
        entityType: 'INSURANCE',
        title: `${p.policyType} Policy`,
        referenceNumber: p.policyNumber,
        expiryDate: p.expiryDate,
        daysRemaining: days,
        status: determineExpiryStatus(days),
        responsiblePerson: p.insurer
      });
    });

    // 4. Licences
    licences.forEach(l => {
      const days = calculateDaysRemaining(l.expiryDate);
      items.push({
        id: `alert-lic-${l.id}`,
        entityType: 'LICENCE',
        title: `${l.licenceType}`,
        referenceNumber: l.licenceNumber,
        expiryDate: l.expiryDate,
        daysRemaining: days,
        status: determineExpiryStatus(days),
        responsiblePerson: l.issuingAuthority
      });
    });

    // Sort by urgent (least days remaining first)
    return items.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [registrations, isoCertificates, insurancePolicies, licences]);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_iso_certs`, JSON.stringify(rawIsoCertificates));
    } catch {}
  }, [rawIsoCertificates]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_iso_audits`, JSON.stringify(isoAudits));
    } catch {}
  }, [isoAudits]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_auditors`, JSON.stringify(auditors));
    } catch {}
  }, [auditors]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_auditor_reports`, JSON.stringify(auditorReports));
    } catch {}
  }, [auditorReports]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_audit_findings`, JSON.stringify(auditFindings));
    } catch {}
  }, [auditFindings]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_insurance`, JSON.stringify(rawInsurancePolicies));
    } catch {}
  }, [rawInsurancePolicies]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_licences`, JSON.stringify(rawLicences));
    } catch {}
  }, [rawLicences]);

  const addIsoCertificate = (cert: Omit<IsoCertificate, 'id' | 'status'>) => {
    const newCert = {
      ...cert,
      id: `iso-${Date.now()}`,
      enterpriseId: currentEnterprise?.id || 'ent-apex'
    };
    setRawIsoCertificates(prev => [newCert, ...prev]);
  };

  const updateIsoCertificate = (id: string, cert: Partial<IsoCertificate>) => {
    setRawIsoCertificates(prev => prev.map(c => (c.id === id ? { ...c, ...cert } : c)));
  };

  const deleteIsoCertificate = (id: string) => {
    setRawIsoCertificates(prev => prev.filter(c => c.id !== id));
  };

  const addIsoAudit = (audit: Omit<IsoAudit, 'id'>) => {
    const newAudit = { ...audit, id: `audit-${Date.now()}` };
    setIsoAudits(prev => [newAudit, ...prev]);
  };

  const updateIsoAudit = (id: string, audit: Partial<IsoAudit>) => {
    setIsoAudits(prev => prev.map(a => (a.id === id ? { ...a, ...audit } : a)));
  };

  const deleteIsoAudit = (id: string) => {
    setIsoAudits(prev => prev.filter(a => a.id !== id));
  };

  const addAuditor = (auditor: Omit<Auditor, 'id'>) => {
    const newAuditor = {
      ...auditor,
      id: `aud-${Date.now()}`,
      enterpriseId: currentEnterprise?.id || 'ent-apex'
    };
    setAuditors(prev => [newAuditor, ...prev]);
  };

  const updateAuditor = (id: string, auditor: Partial<Auditor>) => {
    setAuditors(prev => prev.map(a => (a.id === id ? { ...a, ...auditor } : a)));
  };

  const deleteAuditor = (id: string) => {
    setAuditors(prev => prev.filter(a => a.id !== id));
  };

  const addAuditorReport = (report: Omit<AuditorReport, 'id'>) => {
    const newRep = { ...report, id: `rep-${Date.now()}` };
    setAuditorReports(prev => [newRep, ...prev]);
  };

  const updateAuditorReport = (id: string, report: Partial<AuditorReport>) => {
    setAuditorReports(prev => prev.map(r => (r.id === id ? { ...r, ...report } : r)));
  };

  const deleteAuditorReport = (id: string) => {
    setAuditorReports(prev => prev.filter(r => r.id !== id));
  };

  const addAuditFinding = (finding: Omit<AuditFinding, 'id'>) => {
    const newFind = { ...finding, id: `find-${Date.now()}` };
    setAuditFindings(prev => [newFind, ...prev]);
  };

  const updateAuditFinding = (id: string, finding: Partial<AuditFinding>) => {
    setAuditFindings(prev => prev.map(f => (f.id === id ? { ...f, ...finding } : f)));
  };

  const deleteAuditFinding = (id: string) => {
    setAuditFindings(prev => prev.filter(f => f.id !== id));
  };

  const addInsurancePolicy = (policy: Omit<InsurancePolicy, 'id' | 'status'>) => {
    const newPol = {
      ...policy,
      id: `ins-${Date.now()}`,
      enterpriseId: currentEnterprise?.id || 'ent-apex'
    };
    setRawInsurancePolicies(prev => [newPol, ...prev]);
  };

  const updateInsurancePolicy = (id: string, policy: Partial<InsurancePolicy>) => {
    setRawInsurancePolicies(prev => prev.map(p => (p.id === id ? { ...p, ...policy } : p)));
  };

  const deleteInsurancePolicy = (id: string) => {
    setRawInsurancePolicies(prev => prev.filter(p => p.id !== id));
  };

  const addLicence = (licence: Omit<Licence, 'id' | 'status'>) => {
    const newLic = {
      ...licence,
      id: `lic-${Date.now()}`,
      enterpriseId: currentEnterprise?.id || 'ent-apex'
    };
    setRawLicences(prev => [newLic, ...prev]);
  };

  const updateLicence = (id: string, licence: Partial<Licence>) => {
    setRawLicences(prev => prev.map(l => (l.id === id ? { ...l, ...licence } : l)));
  };

  const deleteLicence = (id: string) => {
    setRawLicences(prev => prev.filter(l => l.id !== id));
  };

  return (
    <EnterpriseComplianceContext.Provider
      value={{
        isoCertificates,
        isoAudits,
        auditors,
        auditorReports,
        auditFindings,
        insurancePolicies,
        licences,
        expiryAlerts,
        addIsoCertificate,
        updateIsoCertificate,
        deleteIsoCertificate,
        addIsoAudit,
        updateIsoAudit,
        deleteIsoAudit,
        addAuditor,
        updateAuditor,
        deleteAuditor,
        addAuditorReport,
        updateAuditorReport,
        deleteAuditorReport,
        addAuditFinding,
        updateAuditFinding,
        deleteAuditFinding,
        addInsurancePolicy,
        updateInsurancePolicy,
        deleteInsurancePolicy,
        addLicence,
        updateLicence,
        deleteLicence
      }}
    >
      {children}
    </EnterpriseComplianceContext.Provider>
  );
};

export const useEnterpriseCompliance = (): EnterpriseComplianceContextType => {
  const context = useContext(EnterpriseComplianceContext);
  if (!context) {
    throw new Error('useEnterpriseCompliance must be used within an EnterpriseComplianceProvider');
  }
  return context;
};
