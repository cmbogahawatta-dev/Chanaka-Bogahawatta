import React, { useState } from 'react';
import {
  ShieldAlert,
  Award,
  FileCheck,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Download,
  Calendar,
  DollarSign,
  Briefcase,
  FileSpreadsheet,
  FileText,
  Search,
  X
} from 'lucide-react';
import { useEnterpriseCompliance } from '../../context/EnterpriseComplianceContext';
import {
  IsoCertificate,
  IsoAudit,
  Auditor,
  AuditorReport,
  AuditFinding,
  InsurancePolicy,
  Licence
} from '../../types/complianceTypes';
import { UniversalDeleteModal } from '../common/UniversalDeleteModal';

export const EnterpriseComplianceView: React.FC = () => {
  const {
    isoCertificates,
    isoAudits,
    auditors,
    auditorReports,
    auditFindings,
    insurancePolicies,
    licences,
    expiryAlerts,
    addIsoCertificate,
    deleteIsoCertificate,
    addIsoAudit,
    deleteIsoAudit,
    addAuditor,
    deleteAuditor,
    addAuditorReport,
    deleteAuditorReport,
    addAuditFinding,
    updateAuditFinding,
    deleteAuditFinding,
    addInsurancePolicy,
    deleteInsurancePolicy,
    addLicence,
    deleteLicence
  } = useEnterpriseCompliance();

  const [activeTab, setActiveTab] = useState<'radar' | 'iso' | 'auditors' | 'insurance' | 'licences'>('radar');

  // Deletion Target State for Strict Admin Security Key Authorization
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'isoCertificate' | 'isoAudit' | 'auditor' | 'auditorReport' | 'auditFinding' | 'insurancePolicy' | 'licence';
    id: string;
    title: string;
  } | null>(null);

  // Modals
  const [isAddIsoOpen, setIsAddIsoOpen] = useState(false);
  const [isoForm, setIsoForm] = useState<Omit<IsoCertificate, 'id' | 'status'>>({
    enterpriseId: 'ent-apex',
    standard: 'ISO 9001:2015',
    certificateNumber: '',
    certificationBody: '',
    scope: '',
    issueDate: new Date().toISOString().slice(0, 10),
    expiryDate: '',
    leadAuditor: '',
    remarks: ''
  });

  const [isAddInsuranceOpen, setIsAddInsuranceOpen] = useState(false);
  const [insuranceForm, setInsuranceForm] = useState<Omit<InsurancePolicy, 'id' | 'status'>>({
    enterpriseId: 'ent-apex',
    policyType: 'Contractors All Risk (CAR)',
    policyNumber: '',
    insurer: '',
    coverageAmount: 10000000,
    premiumAmount: 250000,
    startDate: new Date().toISOString().slice(0, 10),
    expiryDate: '',
    remarks: ''
  });

  const [isAddLicenceOpen, setIsAddLicenceOpen] = useState(false);
  const [licenceForm, setLicenceForm] = useState<Omit<Licence, 'id' | 'status'>>({
    enterpriseId: 'ent-apex',
    licenceType: 'Trade Licence',
    licenceNumber: '',
    issuingAuthority: '',
    issueDate: new Date().toISOString().slice(0, 10),
    expiryDate: '',
    remarks: ''
  });

  const [isAddAuditorOpen, setIsAddAuditorOpen] = useState(false);
  const [auditorForm, setAuditorForm] = useState<Omit<Auditor, 'id'>>({
    enterpriseId: 'ent-apex',
    firmName: '',
    partnerName: '',
    engagementType: 'External Financial Auditor',
    appointedDate: new Date().toISOString().slice(0, 10),
    tenureYears: 1,
    status: 'Active',
    contactEmail: '',
    contactPhone: '',
    address: ''
  });

  // Expiry counts
  const expiredCount = expiryAlerts.filter(a => a.daysRemaining <= 0).length;
  const criticalCount = expiryAlerts.filter(a => a.daysRemaining > 0 && a.daysRemaining <= 30).length;
  const warningCount = expiryAlerts.filter(a => a.daysRemaining > 30 && a.daysRemaining <= 90).length;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-100 p-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              Corporate Compliance & Expiry Radar
              {criticalCount > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-medium border border-rose-500/30">
                  {criticalCount} Critical Expiries
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-400">
              ISO Standards, External Auditor Management Letters, CAR Insurance & Statutory Permits
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddInsuranceOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Insurance
          </button>
          <button
            onClick={() => setIsAddIsoOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-amber-600/20"
          >
            <Award className="w-4 h-4" />
            Register ISO Certificate
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mt-6 gap-2 overflow-x-auto">
        {[
          { id: 'radar', label: `Central Expiry Radar (${expiryAlerts.length})`, icon: Clock },
          { id: 'iso', label: `ISO Certifications (${isoCertificates.length})`, icon: Award },
          { id: 'auditors', label: `Auditors & Opinions (${auditorReports.length})`, icon: FileCheck },
          { id: 'insurance', label: `Insurance Policies (${insurancePolicies.length})`, icon: Building2 },
          { id: 'licences', label: `Statutory Licences (${licences.length})`, icon: Briefcase }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: CENTRAL EXPIRY RADAR */}
      {activeTab === 'radar' && (
        <div className="mt-6 space-y-6">
          {/* Quick Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Expired Documents</span>
                <span className="text-xl font-bold font-mono text-rose-400">{expiredCount}</span>
              </div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Critical (1 - 30 Days)</span>
                <span className="text-xl font-bold font-mono text-rose-300">{criticalCount}</span>
              </div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Expiring Soon (31 - 90 Days)</span>
                <span className="text-xl font-bold font-mono text-amber-300">{warningCount}</span>
              </div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Healthy (&gt; 90 Days)</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {expiryAlerts.length - (expiredCount + criticalCount + warningCount)}
                </span>
              </div>
            </div>
          </div>

          {/* Unified Expiry Table */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/60 text-slate-400 text-xs border-b border-slate-700/60">
                <tr>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Item / Certificate Title</th>
                  <th className="px-4 py-3">Reference / Policy No</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3">Days Remaining</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Responsible Liaison</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {expiryAlerts.map(item => {
                  let badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                  let daysColor = 'text-emerald-400';

                  if (item.daysRemaining <= 0) {
                    badgeBg = 'bg-rose-950 text-rose-300 border-rose-800 font-bold';
                    daysColor = 'text-rose-500 font-bold';
                  } else if (item.daysRemaining <= 30) {
                    badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/30 font-semibold';
                    daysColor = 'text-rose-400 font-bold';
                  } else if (item.daysRemaining <= 90) {
                    badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                    daysColor = 'text-amber-400';
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                          {item.entityType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-100">{item.title}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-300">{item.referenceNumber}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-200">{item.expiryDate}</td>
                      <td className={`px-4 py-3.5 font-mono ${daysColor}`}>
                        {item.daysRemaining <= 0 ? `EXPIRED (${Math.abs(item.daysRemaining)}d ago)` : `${item.daysRemaining} days`}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border ${badgeBg}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400">{item.responsiblePerson || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ISO CERTIFICATIONS */}
      {activeTab === 'iso' && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isoCertificates.map(cert => (
              <div
                key={cert.id}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg">
                      <Award className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        cert.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {cert.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-100 mt-3">{cert.standard}</h3>
                  <p className="text-xs font-mono text-amber-400">Cert: {cert.certificateNumber}</p>
                  <p className="text-xs text-slate-400 mt-1">Body: {cert.certificationBody}</p>

                  <div className="mt-3 p-2.5 bg-slate-900/60 rounded border border-slate-800 text-xs text-slate-300">
                    <span className="block text-slate-500 font-medium mb-0.5">Scope:</span>
                    {cert.scope}
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Issue Date:</span>
                      <span className="font-mono">{cert.issueDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Expiry Date:</span>
                      <span className="font-mono font-semibold text-slate-100">{cert.expiryDate}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/40 flex justify-end">
                  <button
                    onClick={() => {
                      setDeleteTarget({
                        type: 'isoCertificate',
                        id: cert.id,
                        title: `${cert.standard} (${cert.certificateNumber})`
                      });
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium transition-colors"
                    title="Remove Certificate (Admin Security Key Required)"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Surveillance Audits */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
            <h4 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Surveillance & Recertification Audit History
            </h4>
            <div className="space-y-3">
              {isoAudits.map(aud => (
                <div
                  key={aud.id}
                  className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200">
                      {aud.auditType} — {aud.auditingFirm} ({aud.auditorName})
                    </div>
                    <div className="text-slate-400 mt-0.5">
                      Audit Date: {aud.auditDate} | NCs: {aud.majorNonConformances} Major,{' '}
                      {aud.minorNonConformances} Minor, {aud.observations} Observations
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-medium">
                      {aud.outcome}
                    </span>
                    <button
                      onClick={() => {
                        setDeleteTarget({
                          type: 'isoAudit',
                          id: aud.id,
                          title: `${aud.auditType} — ${aud.auditingFirm} (${aud.auditDate})`
                        });
                      }}
                      className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                      title="Delete Audit History (Admin Security Key Required)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDITORS & OPINIONS */}
      {activeTab === 'auditors' && (
        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              External Chartered Accountants, Statutory Audit Opinions & Management Letter Follow-up
            </p>
            <button
              onClick={() => setIsAddAuditorOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-amber-600/20"
            >
              <Plus className="w-4 h-4" />
              Register Auditor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {auditors.map(aud => (
              <div key={aud.id} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {aud.engagementType}
                    </span>
                    <h3 className="text-base font-bold text-slate-100 mt-2">{aud.firmName}</h3>
                    <p className="text-xs text-slate-400">Partner: {aud.partnerName}</p>
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold">{aud.status}</span>
                </div>

                <div className="mt-3 text-xs space-y-1 text-slate-300 border-t border-slate-700/40 pt-3">
                  <div>Appointed: {aud.appointedDate} ({aud.tenureYears} Years Tenure)</div>
                  <div>Email: {aud.contactEmail}</div>
                  <div>Phone: {aud.contactPhone}</div>
                  <div className="text-slate-400">{aud.address}</div>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setDeleteTarget({
                        type: 'auditor',
                        id: aud.id,
                        title: `${aud.firmName} (${aud.partnerName})`
                      })}
                      className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium text-xs transition-colors"
                      title="Deregister Auditor (Admin Security Key Required)"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Auditor
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Audit Reports & Opinions */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
            <h4 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              Financial Year Audit Reports & Opinions
            </h4>

            {auditorReports.map(rep => (
              <div key={rep.id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400">{rep.financialYear}</span>
                      <h5 className="font-bold text-slate-100">{rep.reportTitle}</h5>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Signed Date: {rep.reportDate}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      Opinion: {rep.auditOpinion}
                    </span>
                    <button
                      onClick={() => setDeleteTarget({
                        type: 'auditorReport',
                        id: rep.id,
                        title: `Audit Report FY ${rep.financialYear} (${rep.reportTitle})`
                      })}
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                      title="Delete Audit Report (Admin Security Key Required)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-2 italic">{rep.remarks}</p>

                {/* Audit Findings */}
                <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-slate-400 block">
                    Management Letter Action Items:
                  </span>
                  {auditFindings
                    .filter(f => f.reportId === rep.id)
                    .map(f => (
                      <div
                        key={f.id}
                        className="p-2.5 bg-slate-800/80 rounded border border-slate-700 text-xs space-y-1"
                      >
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-200">
                            [{f.category}] {f.issueDescription}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                f.status === 'Resolved'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {f.status}
                            </span>
                            <button
                              onClick={() => setDeleteTarget({
                                type: 'auditFinding',
                                id: f.id,
                                title: `Finding [${f.category}]: ${f.issueDescription.slice(0, 35)}...`
                              })}
                              className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors"
                              title="Delete Finding (Admin Security Key Required)"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-slate-400">Recommendation: {f.recommendation}</div>
                        {f.managementResponse && (
                          <div className="text-emerald-400 text-[11px]">Action: {f.managementResponse}</div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: INSURANCE POLICIES */}
      {activeTab === 'insurance' && (
        <div className="mt-6 space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsAddInsuranceOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Policy
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insurancePolicies.map(pol => (
              <div
                key={pol.id}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {pol.policyType}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        pol.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {pol.status}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-100 mt-3">{pol.insurer}</h4>
                  <p className="text-xs font-mono text-slate-400">Policy: {pol.policyNumber}</p>

                  <div className="mt-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sum Insured:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        LKR {Number(pol.coverageAmount).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Annual Premium:</span>
                      <span className="font-mono text-slate-300">
                        LKR {Number(pol.premiumAmount).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Expiry Date:</span>
                      <span className="font-mono font-semibold text-slate-200">{pol.expiryDate}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/40 flex justify-end">
                  <button
                    onClick={() => {
                      setDeleteTarget({
                        type: 'insurancePolicy',
                        id: pol.id,
                        title: `${pol.policyType} — ${pol.insurer} (${pol.policyNumber})`
                      });
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium transition-colors"
                    title="Remove Policy (Admin Security Key Required)"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: STATUTORY LICENCES */}
      {activeTab === 'licences' && (
        <div className="mt-6 space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsAddLicenceOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Licence
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {licences.map(lic => (
              <div
                key={lic.id}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {lic.licenceType}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                      {lic.status}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-100 mt-3">{lic.issuingAuthority}</h4>
                  <p className="text-xs font-mono text-purple-400">Licence: {lic.licenceNumber}</p>

                  <div className="mt-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Issue Date:</span>
                      <span className="font-mono text-slate-300">{lic.issueDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Expiry Date:</span>
                      <span className="font-mono font-semibold text-slate-100">{lic.expiryDate}</span>
                    </div>
                    {lic.remarks && <p className="text-slate-400 mt-1 italic">{lic.remarks}</p>}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/40 flex justify-end">
                  <button
                    onClick={() => {
                      setDeleteTarget({
                        type: 'licence',
                        id: lic.id,
                        title: `${lic.licenceType} — ${lic.issuingAuthority} (${lic.licenceNumber})`
                      });
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium transition-colors"
                    title="Remove Licence (Admin Security Key Required)"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD ISO */}
      {isAddIsoOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Register ISO Certificate
              </h3>
              <button onClick={() => setIsAddIsoOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                addIsoCertificate(isoForm);
                setIsAddIsoOpen(false);
              }}
              className="mt-4 space-y-4 text-sm"
            >
              <div>
                <label className="block text-xs text-slate-400 mb-1">Standard</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ISO 9001:2015"
                  value={isoForm.standard}
                  onChange={e => setIsoForm({ ...isoForm, standard: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Certificate Number</label>
                  <input
                    type="text"
                    required
                    value={isoForm.certificateNumber}
                    onChange={e => setIsoForm({ ...isoForm, certificateNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Certification Body</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SGS / Bureau Veritas"
                    value={isoForm.certificationBody}
                    onChange={e => setIsoForm({ ...isoForm, certificationBody: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Scope</label>
                <textarea
                  rows={2}
                  value={isoForm.scope}
                  onChange={e => setIsoForm({ ...isoForm, scope: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={isoForm.issueDate}
                    onChange={e => setIsoForm({ ...isoForm, issueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={isoForm.expiryDate}
                    onChange={e => setIsoForm({ ...isoForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddIsoOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium"
                >
                  Save Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD INSURANCE */}
      {isAddInsuranceOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                Add Insurance Policy
              </h3>
              <button onClick={() => setIsAddInsuranceOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                addInsurancePolicy(insuranceForm);
                setIsAddInsuranceOpen(false);
              }}
              className="mt-4 space-y-4 text-sm"
            >
              <div>
                <label className="block text-xs text-slate-400 mb-1">Policy Type</label>
                <select
                  value={insuranceForm.policyType}
                  onChange={e => setInsuranceForm({ ...insuranceForm, policyType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                >
                  <option value="Contractors All Risk (CAR)">Contractors All Risk (CAR)</option>
                  <option value="Workmen Compensation">Workmen Compensation</option>
                  <option value="Public Liability">Public Liability</option>
                  <option value="Plant & Machinery">Plant & Machinery</option>
                  <option value="Directors & Officers">Directors & Officers</option>
                  <option value="Professional Indemnity">Professional Indemnity</option>
                  <option value="Fire & Allied Perils">Fire & Allied Perils</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Policy Number</label>
                  <input
                    type="text"
                    required
                    value={insuranceForm.policyNumber}
                    onChange={e => setInsuranceForm({ ...insuranceForm, policyNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Insurer</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sri Lanka Insurance"
                    value={insuranceForm.insurer}
                    onChange={e => setInsuranceForm({ ...insuranceForm, insurer: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Sum Insured (LKR)</label>
                  <input
                    type="number"
                    required
                    value={insuranceForm.coverageAmount}
                    onChange={e => setInsuranceForm({ ...insuranceForm, coverageAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={insuranceForm.expiryDate}
                    onChange={e => setInsuranceForm({ ...insuranceForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddInsuranceOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD AUDITOR */}
      {isAddAuditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                Register Auditor Firm
              </h3>
              <button onClick={() => setIsAddAuditorOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                addAuditor(auditorForm);
                setIsAddAuditorOpen(false);
              }}
              className="mt-4 space-y-4 text-sm"
            >
              <div>
                <label className="block text-xs text-slate-400 mb-1">Audit Firm Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KPMG Sri Lanka"
                  value={auditorForm.firmName}
                  onChange={e => setAuditorForm({ ...auditorForm, firmName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Engagement Partner</label>
                  <input
                    type="text"
                    required
                    value={auditorForm.partnerName}
                    onChange={e => setAuditorForm({ ...auditorForm, partnerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Type</label>
                  <select
                    value={auditorForm.engagementType}
                    onChange={e => setAuditorForm({ ...auditorForm, engagementType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  >
                    <option value="External Financial Auditor">External Financial Auditor</option>
                    <option value="Internal Auditor">Internal Auditor</option>
                    <option value="Tax Consultant">Tax Consultant</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={auditorForm.contactEmail}
                    onChange={e => setAuditorForm({ ...auditorForm, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={auditorForm.contactPhone}
                    onChange={e => setAuditorForm({ ...auditorForm, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddAuditorOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium"
                >
                  Save Auditor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD LICENCE */}
      {isAddLicenceOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-400" />
                Add Statutory Licence / Permit
              </h3>
              <button onClick={() => setIsAddLicenceOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                addLicence(licenceForm);
                setIsAddLicenceOpen(false);
              }}
              className="mt-4 space-y-4 text-sm"
            >
              <div>
                <label className="block text-xs text-slate-400 mb-1">Licence Category</label>
                <select
                  value={licenceForm.licenceType}
                  onChange={e => setLicenceForm({ ...licenceForm, licenceType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                >
                  <option value="Trade Licence">Trade Licence</option>
                  <option value="Environmental Protection Licence (EPL)">Environmental Protection Licence (EPL)</option>
                  <option value="Mining & Quarrying Permit">Mining & Quarrying Permit</option>
                  <option value="Explosives Storage/Use">Explosives Storage/Use</option>
                  <option value="Municipal / Local Council">Municipal / Local Council</option>
                  <option value="Telecommunications / Radio">Telecommunications / Radio</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Licence Number</label>
                  <input
                    type="text"
                    required
                    value={licenceForm.licenceNumber}
                    onChange={e => setLicenceForm({ ...licenceForm, licenceNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Issuing Authority</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Central Environmental Authority"
                    value={licenceForm.issuingAuthority}
                    onChange={e => setLicenceForm({ ...licenceForm, issuingAuthority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={licenceForm.issueDate}
                    onChange={e => setLicenceForm({ ...licenceForm, issueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={licenceForm.expiryDate}
                    onChange={e => setLicenceForm({ ...licenceForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddLicenceOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium"
                >
                  Save Licence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Strict Security Key Delete Confirmation Modal */}
      {deleteTarget && (
        <UniversalDeleteModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          recordType={
            deleteTarget.type === 'isoCertificate'
              ? 'ISO Certificate'
              : deleteTarget.type === 'isoAudit'
              ? 'ISO Audit Record'
              : deleteTarget.type === 'auditor'
              ? 'Registered Auditor'
              : deleteTarget.type === 'auditorReport'
              ? 'Statutory Audit Report'
              : deleteTarget.type === 'auditFinding'
              ? 'Audit Finding'
              : deleteTarget.type === 'insurancePolicy'
              ? 'Insurance Policy'
              : 'Statutory Licence'
          }
          recordTitle={deleteTarget.title}
          recordId={deleteTarget.id}
          module="Compliance & Expiry Radar"
          onDelete={async () => {
            if (deleteTarget.type === 'isoCertificate') deleteIsoCertificate(deleteTarget.id);
            else if (deleteTarget.type === 'isoAudit') deleteIsoAudit(deleteTarget.id);
            else if (deleteTarget.type === 'auditor') deleteAuditor(deleteTarget.id);
            else if (deleteTarget.type === 'auditorReport') deleteAuditorReport(deleteTarget.id);
            else if (deleteTarget.type === 'auditFinding') deleteAuditFinding(deleteTarget.id);
            else if (deleteTarget.type === 'insurancePolicy') deleteInsurancePolicy(deleteTarget.id);
            else if (deleteTarget.type === 'licence') deleteLicence(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
};
