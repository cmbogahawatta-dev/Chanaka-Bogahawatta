import React, { useState, useEffect } from 'react';
import {
  Building2,
  FileCheck2,
  Users2,
  PieChart,
  ShieldCheck,
  Briefcase,
  Edit3,
  Plus,
  Trash2,
  Download,
  Search,
  ExternalLink,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Phone,
  Mail,
  MapPin,
  Archive,
  Save,
  X,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Paperclip,
  FolderPlus,
  Link2,
  Unlink,
  DollarSign,
  Landmark,
  Upload
} from 'lucide-react';
import { useEnterpriseCompany } from '../../context/EnterpriseCompanyContext';
import { useEnterpriseBanking } from '../../context/EnterpriseBankingContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { useEnterpriseCompliance } from '../../context/EnterpriseComplianceContext';
import { useFleet } from '../../context/FleetContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { adminSecurityService } from '../../services/adminSecurityService';
import {
  EnterpriseProfileDetails,
  StatutoryRegistration,
  Director,
  Shareholder,
  AuthorizedPerson,
  Client,
  SupportingDocument
} from '../../types/enterpriseProfileTypes';
import { generateTenderPackZip } from '../../services/export/tenderPackExporter';
import { SupportingDocumentUploadInput } from './SupportingDocumentUploadInput';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { AttachDocumentModal } from './AttachDocumentModal';
import { AddProjectForClientModal } from './AddProjectForClientModal';
import { RegisteredBanksTab } from './RegisteredBanksTab';
import { CorrespondenceComposeModal } from '../correspondence/CorrespondenceComposeModal';
import { extractClientAffix, extractProjectAffix } from '../../utils/correspondenceUtils';

export const EnterpriseProfileView: React.FC = () => {
  const {
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
  } = useEnterpriseCompany();

  const {
    registeredBanks,
    addRegisteredBank,
    updateRegisteredBank,
    deleteRegisteredBank,
    importRegisteredBanks,
    resetRegisteredBanksToDefault
  } = useEnterpriseBanking();

  const { currentEnterprise, documents, currentUser, currentRole } = useEnterprise();
  const { expiryAlerts } = useEnterpriseCompliance();
  const { verifyAdminPin, adminPin } = useFleet();
  const { projects, updateProject } = usePettyCash();

  const [activeTab, setActiveTab] = useState<
    'identity' | 'registrations' | 'directors' | 'shareholders' | 'signatories' | 'clients' | 'banks'
  >('identity');

  // Modal States
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<EnterpriseProfileDetails>(profile);

  // Document Preview & Attach Modals State
  const [previewDocument, setPreviewDocument] = useState<SupportingDocument | null>(null);
  const [attachTarget, setAttachTarget] = useState<{
    type: 'registration' | 'director' | 'shareholder' | 'signatory' | 'client' | 'profile';
    id: string;
    title: string;
    subtitle?: string;
    documents: SupportingDocument[];
  } | null>(null);

  // Add Project for Client Modal State
  const [clientForAddProject, setClientForAddProject] = useState<Client | null>(null);

  const handleSaveAttachedDocuments = (updatedDocs: SupportingDocument[]) => {
    if (!attachTarget) return;
    const { type, id } = attachTarget;

    if (type === 'registration') {
      updateRegistration(id, { supportingDocuments: updatedDocs });
    } else if (type === 'director') {
      updateDirector(id, { supportingDocuments: updatedDocs });
    } else if (type === 'shareholder') {
      updateShareholder(id, { supportingDocuments: updatedDocs });
    } else if (type === 'signatory') {
      updateAuthorizedPerson(id, { supportingDocuments: updatedDocs });
    } else if (type === 'client') {
      updateClient(id, { supportingDocuments: updatedDocs });
    } else if (type === 'profile') {
      updateProfile({ supportingDocuments: updatedDocs });
    }
  };

  const handleUnlinkProject = (projectId: string) => {
    updateProject(projectId, {
      CLIENT: 'Unassigned',
      CLIENT_NAME: 'Unassigned'
    });
  };

  // Correspondence Creation State (Client / Project basis)
  const [clientForCorrespondence, setClientForCorrespondence] = useState<{
    clientAffix?: string;
    clientName?: string;
    projectAffix?: string;
    projectCode?: string;
    projectName?: string;
  } | null>(null);
  const [correspondenceSuccessMessage, setCorrespondenceSuccessMessage] = useState<string | null>(null);

  // Address Quick/Inline Edit States
  const [editingHeadOffice, setEditingHeadOffice] = useState(false);
  const [headOfficeValue, setHeadOfficeValue] = useState('');
  const [editingPostal, setEditingPostal] = useState(false);
  const [postalValue, setPostalValue] = useState('');

  // Delete / Remove Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'registration' | 'director' | 'shareholder' | 'signatory' | 'client';
    id: string;
    title: string;
    subtitle?: string;
  } | null>(null);
  const [deleteFeedback, setDeleteFeedback] = useState<string | null>(null);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lockoutSec, setLockoutSec] = useState<number>(0);

  const openDeleteModal = (target: {
    type: 'registration' | 'director' | 'shareholder' | 'signatory' | 'client';
    id: string;
    title: string;
    subtitle?: string;
  }) => {
    setAdminPinInput('');
    setPinError(null);
    setShowPin(false);
    setIsDeleting(false);
    const status = adminSecurityService.getSecurityStatus();
    if (status.isLockedOut) {
      setLockoutSec(status.lockoutRemainingSeconds);
    } else {
      setLockoutSec(0);
    }
    setDeleteTarget(target);
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setAdminPinInput('');
    setPinError(null);
    setShowPin(false);
    setIsDeleting(false);
  };

  // Lockout countdown timer
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

  useEffect(() => {
    if (!deleteFeedback) return;
    const timer = setTimeout(() => setDeleteFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [deleteFeedback]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;

    const trimmedPin = adminPinInput.trim();
    if (!trimmedPin) {
      setPinError('Please enter the Admin Security Key or PIN to authorize deletion.');
      return;
    }

    setIsDeleting(true);
    setPinError(null);

    try {
      // 1. Verify key using strict Admin Security Key check for deletion (strictly disallows default PINs like 8902)
      const verification = await adminSecurityService.verifySecurityKeyForDeletion(
        trimmedPin,
        `Delete Enterprise Profile Record: ${deleteTarget.title} (${deleteTarget.type})`,
        {
          id: 'admin-usr',
          name: currentUser || 'BUDDIKA',
          role: currentRole || 'ADMIN'
        }
      );

      if (!verification.success) {
        if (verification.isLockedOut && verification.lockoutRemainingSeconds) {
          setLockoutSec(verification.lockoutRemainingSeconds);
        }
        setPinError(verification.message || 'Invalid Admin Security Key or PIN. Authorized credentials required.');
        setIsDeleting(false);
        return;
      }

      // 2. Execute deletion
      const { type, id, title } = deleteTarget;
      if (type === 'registration') {
        deleteRegistration(id);
        setDeleteFeedback(`Statutory Registration "${title}" was permanently deleted.`);
      } else if (type === 'director') {
        deleteDirector(id);
        setDeleteFeedback(`Board Director "${title}" was removed from the registry.`);
      } else if (type === 'shareholder') {
        deleteShareholder(id);
        setDeleteFeedback(`Shareholder "${title}" was removed from the register.`);
      } else if (type === 'signatory') {
        deleteAuthorizedPerson(id);
        setDeleteFeedback(`Authorized Signatory "${title}" was successfully revoked.`);
      } else if (type === 'client') {
        deleteClient(id);
        setDeleteFeedback(`Client / Employer "${title}" was removed.`);
      }

      // 3. Record verified audit event
      adminSecurityService.recordAuditEvent({
        userId: 'admin-usr',
        userName: currentUser || 'BUDDIKA',
        userRole: currentRole || 'ADMIN',
        action: 'DELETE_EXECUTED',
        targetRecord: `EnterpriseProfile:${deleteTarget.type}:${deleteTarget.id}`,
        result: 'SUCCESS',
        reason: `Authorized removal of ${deleteTarget.type} "${title}" from corporate registry.`
      });

      closeDeleteModal();
    } catch (err: any) {
      setPinError(err?.message || 'Security verification failed.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Keep profileForm in sync with profile
  useEffect(() => {
    if (!isEditProfileOpen) {
      setProfileForm(profile);
    }
  }, [profile, isEditProfileOpen]);

  const [isAddRegOpen, setIsAddRegOpen] = useState(false);
  const [regForm, setRegForm] = useState<Omit<StatutoryRegistration, 'id'>>({
    enterpriseId: currentEnterprise?.id || 'ent-apex',
    registrationType: 'Company Registration',
    registrationNumber: '',
    issuingAuthority: '',
    issueDate: new Date().toISOString().slice(0, 10),
    status: 'Active',
    responsiblePerson: '',
    remarks: '',
    supportingDocuments: []
  });

  const [isAddDirectorOpen, setIsAddDirectorOpen] = useState(false);
  const [directorForm, setDirectorForm] = useState<Omit<Director, 'id'>>({
    enterpriseId: currentEnterprise?.id || 'ent-apex',
    name: '',
    nicOrPassport: '',
    designation: '',
    appointmentDate: new Date().toISOString().slice(0, 10),
    status: 'Active',
    address: '',
    contact: '',
    supportingDocuments: []
  });

  const [isAddShareholderOpen, setIsAddShareholderOpen] = useState(false);
  const [shareholderForm, setShareholderForm] = useState<Omit<Shareholder, 'id' | 'ownershipPercent'>>({
    enterpriseId: currentEnterprise?.id || 'ent-apex',
    name: '',
    type: 'Individual',
    nicOrRegistration: '',
    shares: 10000,
    shareClass: 'Ordinary Voting Shares',
    acquisitionDate: new Date().toISOString().slice(0, 10),
    status: 'Active',
    supportingDocuments: []
  });

  const [isAddSignatoryOpen, setIsAddSignatoryOpen] = useState(false);
  const [signatoryForm, setSignatoryForm] = useState<Omit<AuthorizedPerson, 'id'>>({
    enterpriseId: currentEnterprise?.id || 'ent-apex',
    name: '',
    role: 'Authorized Signatory',
    scope: '',
    contact: '',
    status: 'Active',
    supportingDocuments: []
  });

  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [clientForm, setClientForm] = useState<Omit<Client, 'id'>>({
    name: '',
    contactPerson: '',
    address: '',
    phone: '',
    email: '',
    notes: '',
    supportingDocuments: []
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isExportingTenderPack, setIsExportingTenderPack] = useState(false);

  // Total share capital
  const totalShares = shareholders.reduce((acc, s) => acc + (Number(s.shares) || 0), 0);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profileForm);
    setIsEditProfileOpen(false);
  };

  const handleDownloadTenderPack = async () => {
    try {
      setIsExportingTenderPack(true);
      await generateTenderPackZip({
        packName: `${profile.shortName || 'Enterprise'}_Corporate_Tender_Pack`,
        clientName: 'Consolidated Corporate Credentials',
        documents: documents || []
      });
    } catch (err) {
      console.error(err);
      alert('Failed to generate tender pack.');
    } finally {
      setIsExportingTenderPack(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-100 p-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                {profile.legalName || currentEnterprise?.name}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                  {profile.companyStatus || 'Active Entity'}
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Official Corporate Identity, Statutory Registrations, Board of Directors & Client Directory
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadTenderPack}
            disabled={isExportingTenderPack}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Download className="w-4 h-4" />
            {isExportingTenderPack ? 'Packaging ZIP...' : 'Export Tender Pack (ZIP)'}
          </button>
          <button
            onClick={() => {
              setProfileForm(profile);
              setIsEditProfileOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit Corporate Info
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 mt-6 gap-2 overflow-x-auto">
        {[
          { id: 'identity', label: 'Corporate Identity', icon: Building2 },
          { id: 'registrations', label: `Statutory Regs (${registrations.length})`, icon: FileCheck2 },
          { id: 'directors', label: `Board of Directors (${directors.length})`, icon: Users2 },
          { id: 'shareholders', label: `Shareholders (${shareholders.length})`, icon: PieChart },
          { id: 'signatories', label: `Authorized Signatories (${authorizedPersons.length})`, icon: ShieldCheck },
          { id: 'clients', label: `Clients & Employers (${clients.length})`, icon: Briefcase },
          { id: 'banks', label: `Registered Banks (${registeredBanks.length})`, icon: Landmark }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Action Feedback Banner */}
      {deleteFeedback && (
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm rounded-xl flex items-center justify-between gap-3 shadow-lg shadow-emerald-500/5 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{deleteFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeleteFeedback(null)}
            className="text-slate-400 hover:text-slate-200 p-1"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: CORPORATE IDENTITY */}
      {activeTab === 'identity' && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6">
              <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Legal & Trade Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Registered Legal Name</span>
                  <span className="font-semibold text-slate-100">{profile.legalName || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Trading / Commercial Name</span>
                  <span className="font-semibold text-slate-100">{profile.tradingName || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Short Name / Code</span>
                  <span className="font-semibold text-emerald-400">{profile.shortName || 'Apex'}</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Company Legal Form</span>
                  <span className="font-semibold text-slate-100">{profile.companyType || 'Private Limited'}</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Company Registration Number</span>
                  <span className="font-mono font-semibold text-slate-100">{profile.registrationNumber}</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Incorporation Date</span>
                  <span className="font-semibold text-slate-100">{profile.incorporationDate || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Official Addresses & Locations
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setProfileForm(profile);
                    setIsEditProfileOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit in Corporate Info
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Registered Statutory Office (ROC)</span>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileForm(profile);
                        setIsEditProfileOpen(true);
                      }}
                      className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  </div>
                  <span className="text-slate-200">{profile.registeredAddress || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Operational & Workshop Depot</span>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileForm(profile);
                        setIsEditProfileOpen(true);
                      }}
                      className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  </div>
                  <span className="text-slate-200">{profile.businessAddress || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Corporate Head Office Section */}
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                          Corporate Head Office
                        </span>
                        {!editingHeadOffice && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setHeadOfficeValue(profile.headOfficeAddress || '');
                                setEditingHeadOffice(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded transition-all active:scale-95"
                              title="Quick edit Corporate Head Office"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {editingHeadOffice ? (
                        <div className="space-y-2 mt-1.5">
                          <textarea
                            rows={2}
                            value={headOfficeValue}
                            onChange={e => setHeadOfficeValue(e.target.value)}
                            placeholder="Enter Corporate Head Office address"
                            className="w-full px-2.5 py-1.5 bg-slate-800 border border-emerald-500/60 rounded text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            autoFocus
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingHeadOffice(false)}
                              className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                updateProfile({ headOfficeAddress: headOfficeValue });
                                setEditingHeadOffice(false);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded shadow transition-all active:scale-95"
                            >
                              <Save className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-200 block text-xs sm:text-sm leading-relaxed">
                          {profile.headOfficeAddress || 'N/A'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Postal Address Section */}
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-cyan-400" />
                          Postal Address
                        </span>
                        {!editingPostal && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setPostalValue(profile.postalAddress || '');
                                setEditingPostal(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded transition-all active:scale-95"
                              title="Quick edit Postal Address"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {editingPostal ? (
                        <div className="space-y-2 mt-1.5">
                          <textarea
                            rows={2}
                            value={postalValue}
                            onChange={e => setPostalValue(e.target.value)}
                            placeholder="Enter Postal / P.O. Box address"
                            className="w-full px-2.5 py-1.5 bg-slate-800 border border-cyan-500/60 rounded text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            autoFocus
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingPostal(false)}
                              className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                updateProfile({ postalAddress: postalValue });
                                setEditingPostal(false);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded shadow transition-all active:scale-95"
                            >
                              <Save className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-200 block text-xs sm:text-sm leading-relaxed">
                          {profile.postalAddress || 'N/A'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Tax & Industry Registrations */}
          <div className="space-y-6">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6">
              <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Statutory Tax & CIDA Credentials
              </h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-400 block">VAT Number</span>
                    <span className="font-mono font-bold text-slate-100">{profile.vatNumber || 'Not Registered'}</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Standard 18%
                  </span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400 block">Tax Identification Number (TIN)</span>
                  <span className="font-mono font-bold text-slate-100">{profile.tinNumber || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-amber-500/20 bg-amber-500/5">
                  <span className="text-xs text-amber-400 font-semibold block mb-1">CIDA Contractor Registration</span>
                  <div className="font-mono font-bold text-amber-300">{profile.cidaRegistrationNumber || 'N/A'}</div>
                  <div className="text-xs text-slate-300 mt-1 font-medium">{profile.cidaGrade}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{profile.cidaSpeciality}</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6">
              <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400" />
                Contact & Digital Presence
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-slate-300">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{profile.telephone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{currentEnterprise?.adminEmail || 'admin@apexlogistics.lk'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline"
                  >
                    {profile.website || 'https://apexlogistics.lk'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STATUTORY REGISTRATIONS */}
      {activeTab === 'registrations' && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search registrations..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              onClick={() => setIsAddRegOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              Add Statutory Registration
            </button>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/60 text-slate-400 text-xs border-b border-slate-700/60">
                <tr>
                  <th className="px-4 py-3">Registration Type</th>
                  <th className="px-4 py-3">Reference / Reg No</th>
                  <th className="px-4 py-3">Issuing Authority</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3">Supporting Documents</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {registrations.filter(
                  r =>
                    r.registrationType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.issuingAuthority.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <FileCheck2 className="w-8 h-8 text-slate-600 mb-1" />
                        <p className="text-sm font-medium text-slate-300">No statutory registrations found</p>
                        <p className="text-xs text-slate-500">
                          {searchTerm
                            ? 'No statutory registrations match your search keyword.'
                            : 'Click "Add Statutory Registration" to register legal and regulatory credentials.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  registrations
                    .filter(
                      r =>
                        r.registrationType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.issuingAuthority.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(reg => (
                      <tr key={reg.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-slate-100 flex items-center gap-2">
                          <FileCheck2 className="w-4 h-4 text-emerald-400" />
                          {reg.registrationType}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-emerald-400 font-semibold">
                          {reg.registrationNumber}
                        </td>
                        <td className="px-4 py-3.5 text-slate-300">{reg.issuingAuthority}</td>
                        <td className="px-4 py-3.5 text-slate-400">{reg.issueDate || '—'}</td>
                        <td className="px-4 py-3.5">
                          {reg.expiryDate ? (
                            <span className="text-slate-300 font-medium">{reg.expiryDate}</span>
                          ) : (
                            <span className="text-slate-500 text-xs">Permanent / No Expiry</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-1.5 items-start">
                            {reg.supportingDocuments && reg.supportingDocuments.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {reg.supportingDocuments.map(doc => (
                                  <button
                                    key={doc.id}
                                    type="button"
                                    onClick={() => setPreviewDocument(doc)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium transition-colors max-w-[190px] truncate"
                                    title={`Preview document: ${doc.name}`}
                                  >
                                    <Paperclip className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{doc.name}</span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500 italic">None attached</span>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setAttachTarget({
                                  type: 'registration',
                                  id: reg.id,
                                  title: reg.registrationNumber,
                                  subtitle: reg.registrationType,
                                  documents: reg.supportingDocuments || []
                                })
                              }
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline"
                            >
                              <Plus className="w-3 h-3" />
                              <span>{reg.supportingDocuments?.length ? 'Add / Manage' : 'Attach Document'}</span>
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              reg.status === 'Active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {reg.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              openDeleteModal({
                                type: 'registration',
                                id: reg.id,
                                title: reg.registrationNumber,
                                subtitle: reg.registrationType
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-all active:scale-95"
                            title={`Delete registration ${reg.registrationNumber}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BOARD OF DIRECTORS */}
      {activeTab === 'directors' && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Company Law & ROC Form 20 recorded Executive & Non-Executive Board Members
            </p>
            <button
              onClick={() => setIsAddDirectorOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              Appoint Director
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {directors.length === 0 ? (
              <div className="col-span-full p-10 text-center bg-slate-800/40 border border-slate-700/50 rounded-xl">
                <Users2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-300">No board directors appointed</p>
                <p className="text-xs text-slate-500 mt-1">Click "Appoint Director" to record corporate board members.</p>
              </div>
            ) : (
              directors.map(dir => (
                <div
                  key={dir.id}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 hover:border-slate-600 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                        <Users2 className="w-5 h-5" />
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        {dir.status}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-100 mt-3">{dir.name}</h4>
                    <p className="text-xs font-medium text-emerald-400 mb-3">{dir.designation}</p>

                    <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-700/40 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">NIC / Passport:</span>
                        <span className="font-mono font-medium text-slate-200">{dir.nicOrPassport}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Appointment Date:</span>
                        <span className="text-slate-200">{dir.appointmentDate}</span>
                      </div>
                      {dir.contact && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Contact:</span>
                          <span className="text-slate-200">{dir.contact}</span>
                        </div>
                      )}
                      {dir.address && (
                        <div className="mt-2 text-slate-400">
                          <span className="block text-slate-500">Address:</span>
                          {dir.address}
                        </div>
                      )}
                    </div>

                    {/* Supporting Documents */}
                    <div className="mt-3 p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                          <Paperclip className="w-3 h-3 text-emerald-400" />
                          Documents ({dir.supportingDocuments?.length || 0})
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setAttachTarget({
                              type: 'director',
                              id: dir.id,
                              title: dir.name,
                              subtitle: dir.designation,
                              documents: dir.supportingDocuments || []
                            })
                          }
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                        >
                          + Attach
                        </button>
                      </div>
                      {dir.supportingDocuments && dir.supportingDocuments.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {dir.supportingDocuments.map(doc => (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => setPreviewDocument(doc)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-medium truncate max-w-full"
                              title={`Preview ${doc.name}`}
                            >
                              <FileText className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{doc.name}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">No credentials attached</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/40 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() =>
                        setAttachTarget({
                          type: 'director',
                          id: dir.id,
                          title: dir.name,
                          subtitle: dir.designation,
                          documents: dir.supportingDocuments || []
                        })
                      }
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1"
                    >
                      <Paperclip className="w-3 h-3" />
                      <span>Attach Documents</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        openDeleteModal({
                          type: 'director',
                          id: dir.id,
                          title: dir.name,
                          subtitle: dir.designation
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-all active:scale-95"
                      title={`Remove director ${dir.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Director</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SHAREHOLDERS */}
      {activeTab === 'shareholders' && (
        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Share Register & Equity Allocation</h3>
              <p className="text-xs text-slate-400">
                Total Stated Share Capital: {totalShares.toLocaleString()} Ordinary Voting Shares
              </p>
            </div>
            <button
              onClick={() => setIsAddShareholderOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              Add Shareholder
            </button>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/60 text-slate-400 text-xs border-b border-slate-700/60">
                <tr>
                  <th className="px-4 py-3">Shareholder Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">NIC / Registration</th>
                  <th className="px-4 py-3">Shares Held</th>
                  <th className="px-4 py-3">Ownership %</th>
                  <th className="px-4 py-3">Share Class</th>
                  <th className="px-4 py-3">Supporting Documents</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {shareholders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <PieChart className="w-8 h-8 text-slate-600 mb-1" />
                        <p className="text-sm font-medium text-slate-300">No shareholders registered</p>
                        <p className="text-xs text-slate-500">Click "Add Shareholder" to record share capital and equity holders.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  shareholders.map(sh => (
                    <tr key={sh.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-slate-100 flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-emerald-400" />
                        {sh.name}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                          {sh.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-300">{sh.nicOrRegistration}</td>
                      <td className="px-4 py-3.5 font-mono font-semibold text-slate-100">
                        {Number(sh.shares).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, sh.ownershipPercent)}%` }}
                            />
                          </div>
                          <span className="font-mono text-emerald-400 font-bold">{sh.ownershipPercent}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400">{sh.shareClass}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          {sh.supportingDocuments && sh.supportingDocuments.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {sh.supportingDocuments.map(doc => (
                                <button
                                  key={doc.id}
                                  type="button"
                                  onClick={() => setPreviewDocument(doc)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-medium transition-colors max-w-[170px] truncate"
                                  title={`Preview document: ${doc.name}`}
                                >
                                  <Paperclip className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">{doc.name}</span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">None attached</span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setAttachTarget({
                                type: 'shareholder',
                                id: sh.id,
                                title: sh.name,
                                subtitle: `${Number(sh.shares).toLocaleString()} shares`,
                                documents: sh.supportingDocuments || []
                              })
                            }
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>{sh.supportingDocuments?.length ? 'Add / Manage' : 'Attach'}</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            openDeleteModal({
                              type: 'shareholder',
                              id: sh.id,
                              title: sh.name,
                              subtitle: `${Number(sh.shares).toLocaleString()} shares (${sh.ownershipPercent}%)`
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-all active:scale-95"
                          title={`Remove shareholder ${sh.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AUTHORIZED SIGNATORIES */}
      {activeTab === 'signatories' && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Corporate Delegations, Bank Mandates, and Procurement Financial Limits
            </p>
            <button
              onClick={() => setIsAddSignatoryOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              Add Authorized Signatory
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {authorizedPersons.length === 0 ? (
              <div className="col-span-full p-10 text-center bg-slate-800/40 border border-slate-700/50 rounded-xl">
                <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-300">No authorized signatories registered</p>
                <p className="text-xs text-slate-500 mt-1">Click "Add Authorized Signatory" to establish signing powers & financial mandates.</p>
              </div>
            ) : (
              authorizedPersons.map(person => (
                <div
                  key={person.id}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {person.status}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-100 mt-3">{person.name}</h4>
                    <p className="text-xs font-semibold text-blue-400 mb-2">{person.role}</p>
                    <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs text-slate-300 mt-2">
                      <span className="text-slate-400 block mb-1 font-medium">Scope of Authority:</span>
                      {person.scope}
                    </div>

                    {/* Supporting Documents */}
                    <div className="mt-3 p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                          <Paperclip className="w-3 h-3 text-blue-400" />
                          Mandates & Resolutions ({person.supportingDocuments?.length || 0})
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setAttachTarget({
                              type: 'signatory',
                              id: person.id,
                              title: person.name,
                              subtitle: person.role,
                              documents: person.supportingDocuments || []
                            })
                          }
                          className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          + Attach
                        </button>
                      </div>
                      {person.supportingDocuments && person.supportingDocuments.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {person.supportingDocuments.map(doc => (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => setPreviewDocument(doc)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-medium truncate max-w-full"
                              title={`Preview ${doc.name}`}
                            >
                              <FileText className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{doc.name}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">No board resolution attached</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/40 flex justify-between items-center text-xs">
                    <span className="text-slate-400">{person.contact || 'No phone'}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setAttachTarget({
                            type: 'signatory',
                            id: person.id,
                            title: person.name,
                            subtitle: person.role,
                            documents: person.supportingDocuments || []
                          })
                        }
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
                      >
                        <Paperclip className="w-3 h-3" />
                        <span>Attach</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          openDeleteModal({
                            type: 'signatory',
                            id: person.id,
                            title: person.name,
                            subtitle: person.role
                          })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-all active:scale-95"
                        title={`Remove authorization for ${person.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: CLIENTS & EMPLOYERS */}
      {activeTab === 'clients' && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-400" />
                Clients, Employers & Associated Projects
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Government Authorities, Institutional Employers, and Commercial Project Clients
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setClientForm({
                    name: '',
                    contactPerson: '',
                    address: '',
                    phone: '',
                    email: '',
                    notes: '',
                    supportingDocuments: []
                  });
                  setIsAddClientOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-lg shadow-emerald-700/20"
                title="Add bank or financial institution to client registry from registered banks"
              >
                <Landmark className="w-4 h-4 text-emerald-300" />
                <span>Add Bank to Clients</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (clients.length > 0) {
                    setClientForAddProject(clients[0]);
                  } else {
                    setIsAddClientOpen(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-lg shadow-purple-600/20"
                title="Add or link project for client"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Add Project to Client</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setClientForm({
                    name: '',
                    contactPerson: '',
                    address: '',
                    phone: '',
                    email: '',
                    notes: '',
                    supportingDocuments: []
                  });
                  setIsAddClientOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-lg shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Register Client / Employer</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.length === 0 ? (
              <div className="col-span-full p-10 text-center bg-slate-800/40 border border-slate-700/50 rounded-xl">
                <Briefcase className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-300">No clients or employers registered</p>
                <p className="text-xs text-slate-500 mt-1">Click "Register Client / Employer" to add customer organizations and project liaisons.</p>
              </div>
            ) : (
              clients.map(cli => {
                const clientProjects = projects.filter(p => {
                  const pClient = (p.CLIENT || '').trim().toLowerCase();
                  const pClientName = (p.CLIENT_NAME || '').trim().toLowerCase();
                  const cName = cli.name.trim().toLowerCase();
                  return (
                    pClient === cName ||
                    pClientName === cName ||
                    (cli.id && (p.CLIENT === cli.id || p.CLIENT_NAME === cli.id)) ||
                    (cli.assignedProjectIds && (cli.assignedProjectIds.includes(p.id) || cli.assignedProjectIds.includes(p.PROJECT_CODE)))
                  );
                });

                const clientDocs = cli.supportingDocuments || [];

                return (
                  <div
                    key={cli.id}
                    className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between hover:border-slate-600 transition-all shadow-sm"
                  >
                    <div className="space-y-4">
                      {/* Client Header Info */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg">
                            <Briefcase className="w-5 h-5" />
                          </div>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                            {clientProjects.length} {clientProjects.length === 1 ? 'Project' : 'Projects'}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-100 mt-3">{cli.name}</h4>
                        {cli.contactPerson && (
                          <p className="text-xs text-purple-400 font-medium mt-1">Liaison: {cli.contactPerson}</p>
                        )}
                        {cli.address && <p className="text-xs text-slate-400 mt-2">{cli.address}</p>}

                        <div className="mt-3 space-y-1 text-xs text-slate-300 border-t border-slate-700/40 pt-2">
                          {cli.phone && <div>Tel: {cli.phone}</div>}
                          {cli.email && <div>Email: {cli.email}</div>}
                          {cli.notes && <div className="text-slate-400 italic mt-1">{cli.notes}</div>}
                        </div>
                      </div>

                      {/* Supporting Documents Section */}
                      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                            Supporting Documents ({clientDocs.length})
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setAttachTarget({
                                type: 'client',
                                id: cli.id,
                                title: cli.name,
                                subtitle: cli.contactPerson,
                                documents: clientDocs
                              })
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Attach</span>
                          </button>
                        </div>

                        {clientDocs.length > 0 ? (
                          <div className="space-y-1.5">
                            {clientDocs.map(doc => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between gap-2 p-1.5 bg-slate-800/80 rounded border border-slate-700/60 text-xs"
                              >
                                <button
                                  type="button"
                                  onClick={() => setPreviewDocument(doc)}
                                  className="flex items-center gap-1.5 min-w-0 text-left hover:text-emerald-300 transition-colors"
                                  title={`Click to preview: ${doc.name}`}
                                >
                                  <FileText className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span className="truncate font-medium text-slate-200 text-[11px]">
                                    {doc.name}
                                  </span>
                                </button>
                                {doc.fileSize && (
                                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                                    {doc.fileSize}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 italic">
                            No contract or award documents attached yet.
                          </p>
                        )}
                      </div>

                      {/* Associated Projects Section */}
                      <div className="p-3 bg-purple-950/20 rounded-lg border border-purple-500/20 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                            <FolderPlus className="w-3.5 h-3.5 text-purple-400" />
                            Associated Projects ({clientProjects.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => setClientForAddProject(cli)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-[11px] font-semibold transition-all active:scale-95"
                            title="Add project for this client"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Project</span>
                          </button>
                        </div>

                        {clientProjects.length > 0 ? (
                          <div className="space-y-2">
                            {clientProjects.map(proj => (
                              <div
                                key={proj.id}
                                className="p-2 bg-slate-900/80 rounded-lg border border-slate-800 flex items-start justify-between gap-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-purple-400 font-bold text-[11px]">
                                      {proj.PROJECT_CODE}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                      {proj.STATUS}
                                    </span>
                                  </div>
                                  <p className="text-xs font-medium text-slate-200 truncate mt-0.5">
                                    {proj.PROJECT_NAME}
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                    {proj.LOCATION && <span>{proj.LOCATION}</span>}
                                    {proj.CONTRACT_VALUE ? (
                                      <span className="text-emerald-400 font-mono">
                                        • LKR {Number(proj.CONTRACT_VALUE).toLocaleString()}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setClientForCorrespondence({
                                        clientName: cli.name,
                                        clientAffix: extractClientAffix(cli.name),
                                        projectCode: proj.PROJECT_CODE,
                                        projectName: proj.PROJECT_NAME,
                                        projectAffix: extractProjectAffix(proj.PROJECT_CODE)
                                      })
                                    }
                                    className="px-2 py-0.5 rounded bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 text-[10px] font-semibold border border-blue-700/40 flex items-center gap-1 transition-colors"
                                    title={`Create official correspondence for ${proj.PROJECT_CODE} under ${cli.name}`}
                                  >
                                    <Mail className="w-3 h-3 text-blue-400" />
                                    <span>Letter</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUnlinkProject(proj.id)}
                                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                                    title="Unlink project from this client"
                                  >
                                    <Unlink className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-2 text-center">
                            <p className="text-[11px] text-slate-400">
                              No projects currently linked to this client.
                            </p>
                            <button
                              type="button"
                              onClick={() => setClientForAddProject(cli)}
                              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:text-purple-300 underline underline-offset-2"
                            >
                              <Plus className="w-3 h-3" />
                              Add or Link a Project
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setClientForCorrespondence({
                              clientName: cli.name,
                              clientAffix: extractClientAffix(cli.name)
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-all"
                          title={`Create official correspondence for ${cli.name}`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>New Letter</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setClientForAddProject(cli)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg transition-all"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                          <span>Add Project</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openDeleteModal({
                            type: 'client',
                            id: cli.id,
                            title: cli.name,
                            subtitle: cli.contactPerson
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-all active:scale-95"
                        title={`Remove client ${cli.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 7: REGISTERED BANKS & DIRECTORY */}
      {activeTab === 'banks' && (
        <div className="mt-6">
          <RegisteredBanksTab
            registeredBanks={registeredBanks}
            onAddBank={addRegisteredBank}
            onUpdateBank={updateRegisteredBank}
            onDeleteBank={deleteRegisteredBank}
            onImportBanks={importRegisteredBanks}
            onResetToDefault={resetRegisteredBanksToDefault}
          />
        </div>
      )}

      {/* MODAL: EDIT CORPORATE INFO */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-400" />
                Edit Corporate Profile Details
              </h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Legal Company Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.legalName}
                    onChange={e => setProfileForm({ ...profileForm, legalName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Commercial / Trading Name</label>
                  <input
                    type="text"
                    value={profileForm.tradingName}
                    onChange={e => setProfileForm({ ...profileForm, tradingName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Short Name / Brand</label>
                  <input
                    type="text"
                    value={profileForm.shortName}
                    onChange={e => setProfileForm({ ...profileForm, shortName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Company Reg Number (ROC)</label>
                  <input
                    type="text"
                    required
                    value={profileForm.registrationNumber}
                    onChange={e => setProfileForm({ ...profileForm, registrationNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Incorporation Date</label>
                  <input
                    type="date"
                    value={profileForm.incorporationDate}
                    onChange={e => setProfileForm({ ...profileForm, incorporationDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">VAT Registration Number</label>
                  <input
                    type="text"
                    value={profileForm.vatNumber}
                    onChange={e => setProfileForm({ ...profileForm, vatNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">TIN Number</label>
                  <input
                    type="text"
                    value={profileForm.tinNumber}
                    onChange={e => setProfileForm({ ...profileForm, tinNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">CIDA Reg Number</label>
                  <input
                    type="text"
                    value={profileForm.cidaRegistrationNumber}
                    onChange={e => setProfileForm({ ...profileForm, cidaRegistrationNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">CIDA Grade & Speciality</label>
                  <input
                    type="text"
                    value={profileForm.cidaGrade}
                    onChange={e => setProfileForm({ ...profileForm, cidaGrade: e.target.value })}
                    placeholder="e.g. C1 / EM1 (Civil & Heavy Mechanical Works)"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Registered Address (ROC Form 1)</label>
                  <textarea
                    rows={2}
                    value={profileForm.registeredAddress}
                    onChange={e => setProfileForm({ ...profileForm, registeredAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Operational Yard / Depot Address</label>
                  <textarea
                    rows={2}
                    value={profileForm.businessAddress}
                    onChange={e => setProfileForm({ ...profileForm, businessAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Corporate Head Office</label>
                  <textarea
                    rows={2}
                    value={profileForm.headOfficeAddress || ''}
                    onChange={e => setProfileForm({ ...profileForm, headOfficeAddress: e.target.value })}
                    placeholder="e.g. Level 14, World Trade Centre, Colombo 01, Sri Lanka"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Postal Address</label>
                  <textarea
                    rows={2}
                    value={profileForm.postalAddress || ''}
                    onChange={e => setProfileForm({ ...profileForm, postalAddress: e.target.value })}
                    placeholder="e.g. P.O. Box 1420, Colombo, Sri Lanka"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Official Telephone</label>
                  <input
                    type="text"
                    value={profileForm.telephone}
                    onChange={e => setProfileForm({ ...profileForm, telephone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Website URL</label>
                  <input
                    type="text"
                    value={profileForm.website}
                    onChange={e => setProfileForm({ ...profileForm, website: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium"
                >
                  <Save className="w-4 h-4" /> Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD STATUTORY REGISTRATION */}
      {isAddRegOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-400" />
                Add Statutory Registration
              </h3>
              <button onClick={() => setIsAddRegOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                addRegistration(regForm);
                setIsAddRegOpen(false);
              }}
              className="mt-4 space-y-4 text-sm"
            >
              <div>
                <label className="block text-xs text-slate-400 mb-1">Registration Category</label>
                <select
                  value={regForm.registrationType}
                  onChange={e => setRegForm({ ...regForm, registrationType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                >
                  <option value="Company Registration">Company Registration (ROC Form 1)</option>
                  <option value="VAT">Value Added Tax (VAT)</option>
                  <option value="TIN">Tax Identification Number (TIN)</option>
                  <option value="CIDA">CIDA Contractor Registration</option>
                  <option value="EPF">Employees Provident Fund (EPF)</option>
                  <option value="ETF">Employees Trust Fund (ETF)</option>
                  <option value="Customs">Customs Import/Export Clearance</option>
                  <option value="Other">Other Statutory Permit</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Registration Number</label>
                  <input
                    type="text"
                    required
                    value={regForm.registrationNumber}
                    onChange={e => setRegForm({ ...regForm, registrationNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Issuing Authority</label>
                  <input
                    type="text"
                    required
                    value={regForm.issuingAuthority}
                    onChange={e => setRegForm({ ...regForm, issuingAuthority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={regForm.issueDate}
                    onChange={e => setRegForm({ ...regForm, issueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={regForm.expiryDate || ''}
                    onChange={e => setRegForm({ ...regForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={regForm.remarks}
                  onChange={e => setRegForm({ ...regForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              {/* Supporting Document Upload Input */}
              <SupportingDocumentUploadInput
                documents={regForm.supportingDocuments || []}
                onDocumentsChange={docs => setRegForm({ ...regForm, supportingDocuments: docs })}
                label="Attach Certificate / Document (PDF, JPG, PNG)"
              />

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddRegOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium"
                >
                  Add Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: APPOINT DIRECTOR */}
      {isAddDirectorOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Users2 className="w-5 h-5 text-emerald-400" />
                Appoint Board Director
              </h3>
              <button onClick={() => setIsAddDirectorOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                addDirector(directorForm);
                setIsAddDirectorOpen(false);
              }}
              className="mt-4 space-y-4 text-sm"
            >
              <div>
                <label className="block text-xs text-slate-400 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={directorForm.name}
                  onChange={e => setDirectorForm({ ...directorForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">NIC or Passport No</label>
                  <input
                    type="text"
                    required
                    value={directorForm.nicOrPassport}
                    onChange={e => setDirectorForm({ ...directorForm, nicOrPassport: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Managing Director"
                    value={directorForm.designation}
                    onChange={e => setDirectorForm({ ...directorForm, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Appointment Date</label>
                  <input
                    type="date"
                    required
                    value={directorForm.appointmentDate}
                    onChange={e => setDirectorForm({ ...directorForm, appointmentDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={directorForm.contact}
                    onChange={e => setDirectorForm({ ...directorForm, contact: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Residential Address</label>
                <textarea
                  rows={2}
                  value={directorForm.address}
                  onChange={e => setDirectorForm({ ...directorForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              {/* Supporting Document Upload Input */}
              <SupportingDocumentUploadInput
                documents={directorForm.supportingDocuments || []}
                onDocumentsChange={docs => setDirectorForm({ ...directorForm, supportingDocuments: docs })}
                label="Attach Director Credentials / NIC / Passport (PDF, JPG, PNG)"
              />

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddDirectorOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium"
                >
                  Save Director
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SHAREHOLDER */}
      {isAddShareholderOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-400" />
                Add Shareholder to Register
              </h3>
              <button onClick={() => setIsAddShareholderOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                addShareholder(shareholderForm);
                setIsAddShareholderOpen(false);
              }}
              className="mt-4 space-y-4 text-sm"
            >
              <div>
                <label className="block text-xs text-slate-400 mb-1">Shareholder Name</label>
                <input
                  type="text"
                  required
                  value={shareholderForm.name}
                  onChange={e => setShareholderForm({ ...shareholderForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Entity Type</label>
                  <select
                    value={shareholderForm.type}
                    onChange={e => setShareholderForm({ ...shareholderForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Trust">Trust / Fund</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">NIC or Business Reg</label>
                  <input
                    type="text"
                    required
                    value={shareholderForm.nicOrRegistration}
                    onChange={e => setShareholderForm({ ...shareholderForm, nicOrRegistration: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Quantity of Shares</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={shareholderForm.shares}
                    onChange={e => setShareholderForm({ ...shareholderForm, shares: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Share Class</label>
                  <input
                    type="text"
                    value={shareholderForm.shareClass}
                    onChange={e => setShareholderForm({ ...shareholderForm, shareClass: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              {/* Supporting Document Upload Input */}
              <SupportingDocumentUploadInput
                documents={shareholderForm.supportingDocuments || []}
                onDocumentsChange={docs => setShareholderForm({ ...shareholderForm, supportingDocuments: docs })}
                label="Attach Share Certificate / Transfer Resolution (PDF, JPG, PNG)"
              />

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddShareholderOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium"
                >
                  Record Shares
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SIGNATORY */}
      {isAddSignatoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Add Authorized Signatory
              </h3>
              <button onClick={() => setIsAddSignatoryOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                addAuthorizedPerson(signatoryForm);
                setIsAddSignatoryOpen(false);
              }}
              className="mt-4 space-y-4 text-sm"
            >
              <div>
                <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={signatoryForm.name}
                  onChange={e => setSignatoryForm({ ...signatoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Designation / Role</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Authorized Signatory / Finance Manager"
                  value={signatoryForm.role}
                  onChange={e => setSignatoryForm({ ...signatoryForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Scope of Authority & Financial Limit</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Bank signing mandate, PO approval up to LKR 10M, Site certifications"
                  value={signatoryForm.scope}
                  onChange={e => setSignatoryForm({ ...signatoryForm, scope: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={signatoryForm.contact}
                  onChange={e => setSignatoryForm({ ...signatoryForm, contact: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              {/* Supporting Document Upload Input */}
              <SupportingDocumentUploadInput
                documents={signatoryForm.supportingDocuments || []}
                onDocumentsChange={docs => setSignatoryForm({ ...signatoryForm, supportingDocuments: docs })}
                label="Attach Board Resolution / Power of Attorney / Mandate (PDF, JPG, PNG)"
              />

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddSignatoryOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium"
                >
                  Save Signatory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CLIENT */}
      {isAddClientOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-400" />
                Register Client / Employer
              </h3>
              <button onClick={() => setIsAddClientOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Pre-fill from Registered Bank Directory */}
            <div className="mt-3 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-emerald-400" />
                  <span>Add from Registered Bank List</span>
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-medium">
                  {registeredBanks.length} Banks in Registry
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Instantly populate company, liaison, CBSL codes, and head office address from verified registered banks.
              </p>
              <select
                onChange={e => {
                  const bId = e.target.value;
                  if (!bId) return;
                  const b = registeredBanks.find(item => item.id === bId);
                  if (b) {
                    setClientForm({
                      ...clientForm,
                      name: b.bankName,
                      contactPerson: b.branches && b.branches.length > 0 ? `Corporate Banking Division (${b.branches[0]})` : 'Senior Manager, Corporate Banking Division',
                      address: b.headOffice || '',
                      phone: b.contactNumber || '',
                      email: b.website ? `info@${b.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '')}` : '',
                      notes: `Registered Bank (Code: ${b.bankCode}, SWIFT: ${b.swiftCode}, ${b.category})`
                    });
                  }
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-emerald-500/40 rounded-lg text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- Choose Registered Bank to Pre-fill --</option>
                <optgroup label="Licensed Commercial Banks">
                  {registeredBanks
                    .filter(b => b.category === 'Licensed Commercial Bank')
                    .map(b => (
                      <option key={b.id} value={b.id}>
                        [{b.bankCode}] {b.bankName} ({b.shortName || b.bankCode})
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Licensed Specialized & Foreign Banks">
                  {registeredBanks
                    .filter(b => b.category !== 'Licensed Commercial Bank')
                    .map(b => (
                      <option key={b.id} value={b.id}>
                        [{b.bankCode}] {b.bankName} ({b.shortName || b.bankCode}) - {b.category || 'Specialized'}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                addClient(clientForm);
                setIsAddClientOpen(false);
              }}
              className="mt-4 space-y-4 text-sm"
            >
              <div>
                <label className="block text-xs text-slate-400 mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ceylon Electricity Board"
                  value={clientForm.name}
                  onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Contact Person / Engineer</label>
                <input
                  type="text"
                  placeholder="e.g. Eng. H. M. Karunaratne (Project Director)"
                  value={clientForm.contactPerson}
                  onChange={e => setClientForm({ ...clientForm, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Office Address</label>
                <textarea
                  rows={2}
                  value={clientForm.address}
                  onChange={e => setClientForm({ ...clientForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Telephone</label>
                  <input
                    type="text"
                    value={clientForm.phone}
                    onChange={e => setClientForm({ ...clientForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={clientForm.email}
                    onChange={e => setClientForm({ ...clientForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Contract / Project Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Standard 30-day payment term, retention 5%"
                  value={clientForm.notes}
                  onChange={e => setClientForm({ ...clientForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              {/* Supporting Document Upload Input */}
              <SupportingDocumentUploadInput
                documents={clientForm.supportingDocuments || []}
                onDocumentsChange={docs => setClientForm({ ...clientForm, supportingDocuments: docs })}
                label="Attach Client Contract / Master Agreement / MOU (PDF, JPG, PNG)"
              />

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddClientOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium"
                >
                  Register Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE / REMOVE CONFIRMATION */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-100">
                  {deleteTarget.type === 'registration' && 'Delete Statutory Registration'}
                  {deleteTarget.type === 'director' && 'Remove Board Director'}
                  {deleteTarget.type === 'shareholder' && 'Remove Shareholder'}
                  {deleteTarget.type === 'signatory' && 'Revoke Authorized Signatory'}
                  {deleteTarget.type === 'client' && 'Remove Client / Employer'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  Are you sure you want to permanently remove{' '}
                  <span className="text-rose-300 font-semibold">{deleteTarget.title}</span>
                  {deleteTarget.subtitle ? (
                    <span className="text-slate-400"> ({deleteTarget.subtitle})</span>
                  ) : null}{' '}
                  from the enterprise registry?
                </p>
                <div className="mt-3 text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>This action takes effect immediately and updates all compliance and tender profiles.</span>
                </div>
              </div>
            </div>

            {/* Admin Security Key / PIN Verification Input - Unified with Staff & other directories */}
            <div className="mt-5 pt-4 border-t border-slate-800 space-y-2.5">
              {lockoutSec > 0 && (
                <div className="p-3 bg-rose-950/60 border border-rose-700 rounded-xl text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <p className="font-bold">Security Lockout Active</p>
                    <p className="text-[11px] text-rose-200/80 mt-0.5">
                      Too many incorrect attempts. Security unlocks in <strong>{lockoutSec}s</strong>.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-rose-400" />
                  <span>Admin Security Key Required *</span>
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 font-semibold border border-rose-500/20">
                  Default keys (e.g. 8902) prohibited
                </span>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  value={adminPinInput}
                  onChange={e => {
                    setAdminPinInput(e.target.value);
                    if (pinError) setPinError(null);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmDelete();
                    }
                  }}
                  disabled={lockoutSec > 0 || isDeleting}
                  placeholder="Enter custom Admin Security Key..."
                  className="w-full bg-slate-950/90 border border-slate-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl pl-9 pr-10 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-500 transition-colors disabled:opacity-50"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  tabIndex={-1}
                  title={showPin ? 'Hide Key' : 'Show Key'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {pinError && (
                <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{pinError}</span>
                </div>
              )}

              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Strict Security: Only your configured Admin Security Key is accepted. Default Master PIN (8902) is strictly rejected for all deletions.</span>
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting || lockoutSec > 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs sm:text-sm font-semibold shadow-lg shadow-rose-600/20 transition-all active:scale-95"
              >
                {isDeleting ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>
                      {deleteTarget.type === 'registration' ? 'Confirm Delete' : 'Confirm Remove'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ATTACH SUPPORTING DOCUMENTS */}
      {attachTarget && (
        <AttachDocumentModal
          isOpen={true}
          onClose={() => setAttachTarget(null)}
          entityType={attachTarget.type}
          entityTitle={attachTarget.title}
          entitySubtitle={attachTarget.subtitle}
          initialDocuments={attachTarget.documents}
          onSave={handleSaveAttachedDocuments}
          onPreview={doc => setPreviewDocument(doc)}
        />
      )}

      {/* MODAL: ADD / LINK PROJECT FOR CLIENT */}
      {clientForAddProject && (
        <AddProjectForClientModal
          isOpen={true}
          onClose={() => setClientForAddProject(null)}
          client={clientForAddProject}
          clientsList={clients}
          onProjectAdded={(newProj) => {
            // Update client's assignedProjectIds in EnterpriseCompanyContext if needed
            if (clientForAddProject) {
              const currentIds = clientForAddProject.assignedProjectIds || [];
              if (!currentIds.includes(newProj.id)) {
                updateClient(clientForAddProject.id, {
                  assignedProjectIds: [...currentIds, newProj.id]
                });
              }
            }
          }}
        />
      )}

      {/* MODAL: DOCUMENT PREVIEW */}
      <DocumentPreviewModal
        document={previewDocument}
        onClose={() => setPreviewDocument(null)}
      />

      {/* MODAL: CORRESPONDENCE CREATION (CLIENT & PROJECT BASIS) */}
      {clientForCorrespondence && (
        <CorrespondenceComposeModal
          isOpen={true}
          onClose={() => setClientForCorrespondence(null)}
          initialClientAffix={clientForCorrespondence.clientAffix}
          initialClientName={clientForCorrespondence.clientName}
          initialProjectAffix={clientForCorrespondence.projectAffix}
          initialProjectCode={clientForCorrespondence.projectCode}
          initialProjectName={clientForCorrespondence.projectName}
          onLetterCreated={(createdLetter) => {
            setCorrespondenceSuccessMessage(`Letter created: ${createdLetter.letterNumber} under ${createdLetter.clientName || 'Client'}`);
            setTimeout(() => setCorrespondenceSuccessMessage(null), 6000);
          }}
        />
      )}

      {/* SUCCESS TOAST FOR CORRESPONDENCE CREATION */}
      {correspondenceSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-emerald-500/50 text-emerald-300 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-slate-100">Correspondence Created Successfully</p>
            <p className="text-[11px] font-mono text-emerald-400">{correspondenceSuccessMessage}</p>
          </div>
          <button
            onClick={() => setCorrespondenceSuccessMessage(null)}
            className="text-slate-400 hover:text-slate-200 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
