import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  FileText,
  CreditCard,
  Phone,
  MapPin,
  Landmark,
  Briefcase,
  FileCheck,
  History,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  Eye,
  EyeOff,
  Search,
  Sparkles,
  ShieldCheck,
  Layers
} from 'lucide-react';
import {
  Client,
  ClientOrganizationType,
  ClientStatus,
  ClientTaxStatus,
  ClientContactPerson,
  ClientBankAccount,
  ClientDocumentItem
} from '../../types/enterpriseProfileTypes';
import { useEnterpriseCompany } from '../../context/EnterpriseCompanyContext';
import { usePettyCash } from '../../context/PettyCashContext';

interface RegisterClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: Client | null;
  onClientSaved?: (client: Client) => void;
  initialTab?: 'basic' | 'tax' | 'contact' | 'address' | 'payment' | 'project' | 'documents' | 'audit';
}

const ORG_TYPES: ClientOrganizationType[] = [
  'Government Authority',
  'State Owned Enterprise',
  'Private Limited Company',
  'Public Listed Company',
  'Joint Venture',
  'Multinational',
  'Non-Profit / NGO',
  'Statutory Board',
  'Financial Institution / Bank',
  'Other'
];

const TAX_STATUSES: ClientTaxStatus[] = [
  'VAT Registered',
  'VAT Exempt',
  'Non-VAT Registered',
  'Other'
];

const CLIENT_STATUSES: ClientStatus[] = [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'BLACKLISTED'
];

// Pre-registered major CBSL banks for rapid autofill
const REGISTERED_BANKS_AUTOFILL = [
  { name: 'Bank of Ceylon', code: '7010', swift: 'BCEYLKLX', defaultBranch: 'Corporate Branch' },
  { name: 'People\'s Bank', code: '7135', swift: 'PSBLLKLX', defaultBranch: 'Head Office Branch' },
  { name: 'Commercial Bank of Ceylon PLC', code: '7056', swift: 'CCBLLKLX', defaultBranch: 'Foreign Branch / Corporate' },
  { name: 'Hatton National Bank PLC', code: '7083', swift: 'HNBLLKLX', defaultBranch: 'City Office Branch' },
  { name: 'Sampath Bank PLC', code: '7278', swift: 'BSAMLKLX', defaultBranch: 'Headquarters Branch' },
  { name: 'National Development Bank PLC (NDB)', code: '7214', swift: 'NDBLLKLX', defaultBranch: 'Nawam Mawatha' },
  { name: 'Seylan Bank PLC', code: '7287', swift: 'SEYBLKLX', defaultBranch: 'Seylan Towers Branch' },
  { name: 'Nations Trust Bank PLC', code: '7162', swift: 'NTBLLKLX', defaultBranch: 'Nawam Mawatha' },
  { name: 'DFCC Bank PLC', code: '7461', swift: 'DFCCLKLX', defaultBranch: 'Corporate Banking Unit' },
  { name: 'Standard Chartered Bank', code: '7038', swift: 'SCBLLKLX', defaultBranch: 'Main Branch' },
  { name: 'HSBC Sri Lanka', code: '7092', swift: 'HSBCLKHX', defaultBranch: 'Colombo Main' }
];

export const RegisterClientModal: React.FC<RegisterClientModalProps> = ({
  isOpen,
  onClose,
  clientToEdit,
  onClientSaved,
  initialTab
}) => {
  const { clients, addClient, updateClient, clearClientAuditHistory } = useEnterpriseCompany();
  const { projects } = usePettyCash();

  const [activeTab, setActiveTab] = useState<
    'basic' | 'tax' | 'contact' | 'address' | 'payment' | 'project' | 'documents' | 'audit'
  >(initialTab || 'basic');

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      } else if (!clientToEdit) {
        setActiveTab('basic');
      }
    }
  }, [isOpen, initialTab, clientToEdit]);

  // Basic Information
  const [name, setName] = useState('');
  const [organizationType, setOrganizationType] = useState<ClientOrganizationType>('Private Limited Company');
  const [clientCode, setClientCode] = useState('');
  const [shortName, setShortName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [companyRegistrationDate, setCompanyRegistrationDate] = useState('');
  const [industry, setIndustry] = useState('');
  const [clientCategory, setClientCategory] = useState('');
  const [status, setStatus] = useState<ClientStatus>('ACTIVE');
  const [website, setWebsite] = useState('');
  const [country, setCountry] = useState('Sri Lanka');
  const [notes, setNotes] = useState('');

  // Tax Details
  const [taxStatus, setTaxStatus] = useState<ClientTaxStatus>('VAT Registered');
  const [isVatRegistered, setIsVatRegistered] = useState(true);
  const [tin, setTin] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [svatNumber, setSvatNumber] = useState('');
  const [defaultVatRate, setDefaultVatRate] = useState<number>(18);
  const [defaultInvoiceCurrency, setDefaultInvoiceCurrency] = useState('LKR');
  const [defaultPaymentTermsDays, setDefaultPaymentTermsDays] = useState<number>(30);
  const [invoiceAttentionTo, setInvoiceAttentionTo] = useState('');
  const [invoiceEmail, setInvoiceEmail] = useState('');
  const [invoiceDeliveryMethod, setInvoiceDeliveryMethod] = useState<'Email' | 'Printed/Courier' | 'Portal' | 'Hand Delivery'>('Email');
  const [creditLimit, setCreditLimit] = useState<number | undefined>(undefined);
  const [isRetentionApplicable, setIsRetentionApplicable] = useState(false);
  const [defaultRetentionPercent, setDefaultRetentionPercent] = useState<number>(5);
  const [isAdvanceApplicable, setIsAdvanceApplicable] = useState(false);
  const [defaultAdvancePercent, setDefaultAdvancePercent] = useState<number>(10);
  const [isWithholdingTaxApplicable, setIsWithholdingTaxApplicable] = useState(false);
  const [defaultWhtPercent, setDefaultWhtPercent] = useState<number>(2.5);
  const [isWhtCertificateRequired, setIsWhtCertificateRequired] = useState(false);

  // Tax Invoice Master Data Sub-section
  const [invoiceDisplayName, setInvoiceDisplayName] = useState('');
  const [invoiceBillingAddress, setInvoiceBillingAddress] = useState('');
  const [invoiceTin, setInvoiceTin] = useState('');
  const [invoiceVatNumber, setInvoiceVatNumber] = useState('');
  const [invoiceContactPerson, setInvoiceContactPerson] = useState('');
  const [invoiceTelephone, setInvoiceTelephone] = useState('');
  const [invoicePaymentTerms, setInvoicePaymentTerms] = useState('30 Days');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Contacts
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [primaryDesignation, setPrimaryDesignation] = useState('');
  const [primaryDepartment, setPrimaryDepartment] = useState('');
  const [primaryTelephone, setPrimaryTelephone] = useState('');
  const [primaryMobile, setPrimaryMobile] = useState('');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [primaryAltEmail, setPrimaryAltEmail] = useState('');

  const [accountsContact, setAccountsContact] = useState('');
  const [accountsEmail, setAccountsEmail] = useState('');
  const [accountsPhone, setAccountsPhone] = useState('');
  const [projectDirector, setProjectDirector] = useState('');
  const [projectDirectorEmail, setProjectDirectorEmail] = useState('');
  const [commercialContact, setCommercialContact] = useState('');
  const [commercialEmail, setCommercialEmail] = useState('');
  const [procurementContact, setProcurementContact] = useState('');
  const [procurementEmail, setProcurementEmail] = useState('');

  const [contacts, setContacts] = useState<ClientContactPerson[]>([]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactDesignation, setNewContactDesignation] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactType, setNewContactType] = useState<ClientContactPerson['contactType']>('Finance');

  // Address Details
  const [regAddressLine1, setRegAddressLine1] = useState('');
  const [regAddressLine2, setRegAddressLine2] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regDistrict, setRegDistrict] = useState('');
  const [regProvince, setRegProvince] = useState('');
  const [regPostalCode, setRegPostalCode] = useState('');
  const [regCountry, setRegCountry] = useState('Sri Lanka');

  const [sameAsRegistered, setSameAsRegistered] = useState(true);
  const [billAddressLine1, setBillAddressLine1] = useState('');
  const [billAddressLine2, setBillAddressLine2] = useState('');
  const [billCity, setBillCity] = useState('');
  const [billDistrict, setBillDistrict] = useState('');
  const [billPostalCode, setBillPostalCode] = useState('');
  const [billCountry, setBillCountry] = useState('Sri Lanka');

  // Payment & Bank Accounts
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState<'Bank Transfer' | 'Cheque' | 'Letter of Credit' | 'Other'>('Bank Transfer');
  const [specialPaymentInstructions, setSpecialPaymentInstructions] = useState('');
  const [bankAccounts, setBankAccounts] = useState<ClientBankAccount[]>([]);
  const [revealedBankIds, setRevealedBankIds] = useState<Record<string, boolean>>({});

  const [newBankName, setNewBankName] = useState('');
  const [newBranch, setNewBranch] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newSwift, setNewSwift] = useState('');
  const [newCurrency, setNewCurrency] = useState('LKR');

  // Projects & Contracts
  const [assignedProjectIds, setAssignedProjectIds] = useState<string[]>([]);
  const [contractNumber, setContractNumber] = useState('');
  const [contractName, setContractName] = useState('');
  const [employerReference, setEmployerReference] = useState('');
  const [contractStartDate, setContractStartDate] = useState('');
  const [contractCompletionDate, setContractCompletionDate] = useState('');
  const [contractValue, setContractValue] = useState<number | undefined>(undefined);
  const [consultantEngineer, setConsultantEngineer] = useState('');

  // Documents
  const [documents, setDocuments] = useState<ClientDocumentItem[]>([]);
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState<ClientDocumentItem['documentType']>('Client Contract');
  const [newDocExpiry, setNewDocExpiry] = useState('');
  const [newDocNumber, setNewDocNumber] = useState('');

  // Validation and Duplicate Warning
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<{
    found: boolean;
    clientName?: string;
    matchedField?: string;
    clientCode?: string;
  }>({ found: false });
  const [confirmedDuplicateOverride, setConfirmedDuplicateOverride] = useState(false);

  // Initialize or populate form
  useEffect(() => {
    if (!isOpen) return;

    if (clientToEdit) {
      setName(clientToEdit.name || '');
      setOrganizationType(clientToEdit.organizationType || 'Private Limited Company');
      setClientCode(clientToEdit.clientCode || '');
      setShortName(clientToEdit.shortName || '');
      setRegistrationNumber(clientToEdit.registrationNumber || '');
      setCompanyRegistrationDate(clientToEdit.companyRegistrationDate || '');
      setIndustry(clientToEdit.industry || '');
      setClientCategory(clientToEdit.clientCategory || '');
      setStatus(clientToEdit.status || 'ACTIVE');
      setWebsite(clientToEdit.website || '');
      setCountry(clientToEdit.country || 'Sri Lanka');
      setNotes(clientToEdit.notes || '');

      // Tax Details
      const t = clientToEdit.taxDetails;
      setTaxStatus(t?.taxStatus || 'VAT Registered');
      setIsVatRegistered(t?.isVatRegistered ?? true);
      setTin(t?.tin || '');
      setVatNumber(t?.vatNumber || '');
      setSvatNumber(t?.svatNumber || '');
      setDefaultVatRate(t?.defaultVatRate ?? 18);
      setDefaultInvoiceCurrency(t?.defaultInvoiceCurrency || 'LKR');
      setDefaultPaymentTermsDays(t?.defaultPaymentTermsDays ?? 30);
      setInvoiceAttentionTo(t?.invoiceAttentionTo || '');
      setInvoiceEmail(t?.invoiceEmail || '');
      setInvoiceDeliveryMethod(t?.invoiceDeliveryMethod || 'Email');
      setCreditLimit(t?.creditLimit);
      setIsRetentionApplicable(t?.isRetentionApplicable ?? false);
      setDefaultRetentionPercent(t?.defaultRetentionPercent ?? 5);
      setIsAdvanceApplicable(t?.isAdvanceApplicable ?? false);
      setDefaultAdvancePercent(t?.defaultAdvancePercent ?? 10);
      setIsWithholdingTaxApplicable(t?.isWithholdingTaxApplicable ?? false);
      setDefaultWhtPercent(t?.defaultWhtPercent ?? 2.5);
      setIsWhtCertificateRequired(t?.isWhtCertificateRequired ?? false);

      // Tax Invoice Master Data
      const im = clientToEdit.taxInvoiceMasterData;
      setInvoiceDisplayName(im?.displayName || clientToEdit.name || '');
      setInvoiceBillingAddress(im?.address || clientToEdit.address || '');
      setInvoiceTin(im?.tin || t?.tin || '');
      setInvoiceVatNumber(im?.vatNumber || t?.vatNumber || '');
      setInvoiceContactPerson(im?.contactPerson || clientToEdit.contactPerson || '');
      setInvoiceTelephone(im?.telephone || clientToEdit.phone || '');
      setInvoicePaymentTerms(im?.paymentTerms || '30 Days');
      setInvoiceNotes(im?.defaultInvoiceNotes || '');

      // Primary Contact
      const p = clientToEdit.primaryContact;
      setPrimaryContactName(p?.name || clientToEdit.contactPerson || '');
      setPrimaryDesignation(p?.designation || '');
      setPrimaryDepartment(p?.department || '');
      setPrimaryTelephone(p?.telephone || clientToEdit.phone || '');
      setPrimaryMobile(p?.mobile || '');
      setPrimaryEmail(p?.email || clientToEdit.email || '');
      setPrimaryAltEmail(p?.alternativeEmail || '');

      // Commercial Contacts
      const cc = clientToEdit.commercialContacts;
      setAccountsContact(cc?.accountsDepartmentContact || '');
      setAccountsEmail(cc?.accountsDepartmentEmail || '');
      setAccountsPhone(cc?.accountsDepartmentTelephone || '');
      setProjectDirector(cc?.projectDirector || '');
      setProjectDirectorEmail(cc?.projectDirectorEmail || '');
      setCommercialContact(cc?.commercialContact || '');
      setCommercialEmail(cc?.commercialEmail || '');
      setProcurementContact(cc?.procurementContact || '');
      setProcurementEmail(cc?.procurementEmail || '');

      setContacts(clientToEdit.contacts || []);

      // Registered Address
      const reg = clientToEdit.registeredAddress;
      setRegAddressLine1(reg?.line1 || clientToEdit.address || '');
      setRegAddressLine2(reg?.line2 || '');
      setRegCity(reg?.city || 'Colombo');
      setRegDistrict(reg?.district || 'Colombo');
      setRegProvince(reg?.province || 'Western');
      setRegPostalCode(reg?.postalCode || '');
      setRegCountry(reg?.country || 'Sri Lanka');

      // Billing Address
      const bill = clientToEdit.billingAddress;
      setSameAsRegistered(bill?.sameAsRegistered ?? true);
      setBillAddressLine1(bill?.line1 || '');
      setBillAddressLine2(bill?.line2 || '');
      setBillCity(bill?.city || '');
      setBillDistrict(bill?.district || '');
      setBillPostalCode(bill?.postalCode || '');
      setBillCountry(bill?.country || 'Sri Lanka');

      // Banking & Terms
      const pt = clientToEdit.paymentTerms;
      setPreferredPaymentMethod(pt?.preferredPaymentMethod || 'Bank Transfer');
      setSpecialPaymentInstructions(pt?.specialPaymentInstructions || '');
      setBankAccounts(clientToEdit.bankAccounts || []);

      // Projects & Contracts
      setAssignedProjectIds(clientToEdit.assignedProjectIds || []);
      const ic = clientToEdit.initialContract;
      setContractNumber(ic?.contractNumber || '');
      setContractName(ic?.contractName || '');
      setEmployerReference(ic?.employerReference || '');
      setContractStartDate(ic?.contractStartDate || '');
      setContractCompletionDate(ic?.contractCompletionDate || '');
      setContractValue(ic?.contractValue);
      setConsultantEngineer(ic?.consultantEngineer || '');

      // Documents
      setDocuments(clientToEdit.documents || []);
    } else {
      // Create mode: auto-suggest clean code
      const nextCodeNum = clients.length + 1;
      const suggestedCode = `CLI-${String(nextCodeNum).padStart(3, '0')}`;
      setClientCode(suggestedCode);
      setName('');
      setOrganizationType('Government Authority');
      setShortName('');
      setRegistrationNumber('');
      setCompanyRegistrationDate('');
      setIndustry('');
      setClientCategory('');
      setStatus('ACTIVE');
      setWebsite('');
      setCountry('Sri Lanka');
      setNotes('');
      setTaxStatus('VAT Registered');
      setIsVatRegistered(true);
      setTin('');
      setVatNumber('');
      setSvatNumber('');
      setDefaultVatRate(18);
      setDefaultInvoiceCurrency('LKR');
      setDefaultPaymentTermsDays(30);
      setInvoiceAttentionTo('');
      setInvoiceEmail('');
      setInvoiceDeliveryMethod('Email');
      setInvoiceDisplayName('');
      setInvoiceBillingAddress('');
      setInvoiceTin('');
      setInvoiceVatNumber('');
      setInvoiceContactPerson('');
      setInvoiceTelephone('');
      setInvoicePaymentTerms('30 Days');
      setInvoiceNotes('');
      setPrimaryContactName('');
      setPrimaryDesignation('');
      setPrimaryDepartment('');
      setPrimaryTelephone('');
      setPrimaryMobile('');
      setPrimaryEmail('');
      setPrimaryAltEmail('');
      setAccountsContact('');
      setAccountsEmail('');
      setAccountsPhone('');
      setProjectDirector('');
      setProjectDirectorEmail('');
      setCommercialContact('');
      setCommercialEmail('');
      setProcurementContact('');
      setProcurementEmail('');
      setContacts([]);
      setRegAddressLine1('');
      setRegAddressLine2('');
      setRegCity('Colombo');
      setRegDistrict('Colombo');
      setRegProvince('Western');
      setRegPostalCode('');
      setRegCountry('Sri Lanka');
      setSameAsRegistered(true);
      setBillAddressLine1('');
      setBillAddressLine2('');
      setBillCity('');
      setBillDistrict('');
      setBillPostalCode('');
      setBillCountry('Sri Lanka');
      setPreferredPaymentMethod('Bank Transfer');
      setSpecialPaymentInstructions('');
      setBankAccounts([]);
      setAssignedProjectIds([]);
      setContractNumber('');
      setContractName('');
      setEmployerReference('');
      setContractStartDate('');
      setContractCompletionDate('');
      setContractValue(undefined);
      setConsultantEngineer('');
      setDocuments([]);
    }

    setErrors({});
    setDuplicateWarning({ found: false });
    setConfirmedDuplicateOverride(false);
    setActiveTab('basic');
  }, [isOpen, clientToEdit]);

  // Tax Status Change effect
  useEffect(() => {
    if (taxStatus === 'VAT Registered') {
      setIsVatRegistered(true);
      setDefaultVatRate(18);
    } else {
      setIsVatRegistered(false);
      setDefaultVatRate(0);
    }
  }, [taxStatus]);

  // Duplicate Check logic
  const performDuplicateCheck = () => {
    const trimmedName = name.trim().toLowerCase();
    const trimmedTin = tin.trim().toLowerCase();
    const trimmedVat = vatNumber.trim().toLowerCase();
    const trimmedCode = clientCode.trim().toLowerCase();
    const trimmedReg = registrationNumber.trim().toLowerCase();

    for (const c of clients) {
      if (clientToEdit && c.id === clientToEdit.id) continue;

      if (trimmedCode && (c.clientCode || '').trim().toLowerCase() === trimmedCode) {
        return {
          found: true,
          clientName: c.name,
          clientCode: c.clientCode,
          matchedField: `Matching Client Code "${c.clientCode}"`
        };
      }
      if (trimmedName && c.name.trim().toLowerCase() === trimmedName) {
        return {
          found: true,
          clientName: c.name,
          clientCode: c.clientCode,
          matchedField: `Exact matching Client Name "${c.name}"`
        };
      }
      const cTin = (c.taxDetails?.tin || '').trim().toLowerCase();
      if (trimmedTin && cTin && cTin === trimmedTin) {
        return {
          found: true,
          clientName: c.name,
          clientCode: c.clientCode,
          matchedField: `Matching Tax Identification Number (TIN) ${c.taxDetails?.tin}`
        };
      }
      const cVat = (c.taxDetails?.vatNumber || '').trim().toLowerCase();
      if (trimmedVat && cVat && cVat === trimmedVat) {
        return {
          found: true,
          clientName: c.name,
          clientCode: c.clientCode,
          matchedField: `Matching VAT Registration Number ${c.taxDetails?.vatNumber}`
        };
      }
      const cReg = (c.registrationNumber || '').trim().toLowerCase();
      if (trimmedReg && cReg && cReg === trimmedReg) {
        return {
          found: true,
          clientName: c.name,
          clientCode: c.clientCode,
          matchedField: `Matching Business Registration Number ${c.registrationNumber}`
        };
      }
    }
    return { found: false };
  };

  // Auto-sync Tax Invoice Master Data
  const handleAutoPopulateInvoiceMaster = () => {
    setInvoiceDisplayName(name);
    const resolvedAddress = sameAsRegistered
      ? `${regAddressLine1}${regAddressLine2 ? ', ' + regAddressLine2 : ''}, ${regCity}, ${regCountry}`
      : `${billAddressLine1}${billAddressLine2 ? ', ' + billAddressLine2 : ''}, ${billCity}, ${billCountry}`;
    setInvoiceBillingAddress(resolvedAddress);
    setInvoiceTin(tin);
    setInvoiceVatNumber(vatNumber);
    setInvoiceContactPerson(primaryContactName);
    setInvoiceTelephone(primaryTelephone || primaryMobile);
    setInvoicePaymentTerms(`${defaultPaymentTermsDays} Days`);
  };

  // Add Contact item
  const handleAddContact = () => {
    if (!newContactName.trim()) return;
    const newC: ClientContactPerson = {
      id: `ccon-${Date.now()}`,
      name: newContactName.trim(),
      designation: newContactDesignation.trim(),
      telephone: newContactPhone.trim(),
      email: newContactEmail.trim(),
      contactType: newContactType,
      isActive: true,
      isPrimary: contacts.length === 0,
      isTaxInvoiceContact: newContactType === 'Finance' || newContactType === 'Accounts'
    };
    setContacts(prev => [...prev, newC]);
    setNewContactName('');
    setNewContactDesignation('');
    setNewContactPhone('');
    setNewContactEmail('');
  };

  const handleRemoveContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  // Add Bank item
  const handleAddBank = () => {
    if (!newBankName.trim() || !newAccountNumber.trim()) return;
    const newB: ClientBankAccount = {
      id: `cbk-${Date.now()}`,
      bankName: newBankName.trim(),
      branch: newBranch.trim() || 'Main Branch',
      accountName: newAccountName.trim() || name || 'Client Operating Account',
      accountNumber: newAccountNumber.trim(),
      swift: newSwift.trim(),
      currency: newCurrency || 'LKR',
      accountType: 'Current',
      isDefault: bankAccounts.length === 0
    };
    setBankAccounts(prev => [...prev, newB]);
    setNewBankName('');
    setNewBranch('');
    setNewAccountName('');
    setNewAccountNumber('');
    setNewSwift('');
  };

  const handleRemoveBank = (id: string) => {
    setBankAccounts(prev => prev.filter(b => b.id !== id));
  };

  // Autofill from Registered Bank selector
  const handleSelectPredefinedBank = (bankName: string) => {
    const found = REGISTERED_BANKS_AUTOFILL.find(b => b.name === bankName);
    if (!found) return;
    setNewBankName(found.name);
    setNewBranch(found.defaultBranch);
    setNewSwift(found.swift);
  };

  // Add Document item
  const handleAddDocument = () => {
    if (!newDocName.trim()) return;
    const expiryStatus = (() => {
      if (!newDocExpiry) return 'Active';
      const now = new Date().getTime();
      const exp = new Date(newDocExpiry).getTime();
      const diffDays = Math.round((exp - now) / (1000 * 3600 * 24));
      if (diffDays < 0) return 'Expired';
      if (diffDays <= 60) return 'Expiring Soon';
      return 'Active';
    })();

    const newDoc: ClientDocumentItem = {
      id: `cdoc-${Date.now()}`,
      name: newDocName.trim(),
      documentType: newDocType,
      documentNumber: newDocNumber.trim(),
      uploadedDate: new Date().toISOString().split('T')[0],
      expiryDate: newDocExpiry || undefined,
      uploadedBy: 'Current User',
      fileSize: '450 KB',
      fileType: 'application/pdf',
      status: expiryStatus
    };

    setDocuments(prev => [...prev, newDoc]);
    setNewDocName('');
    setNewDocExpiry('');
    setNewDocNumber('');
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  // Save handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const newErr: Record<string, string> = {};
    if (!name.trim()) newErr.name = 'Client / Employer Name is required';
    if (!clientCode.trim()) newErr.clientCode = 'Client Code is required';
    if (!organizationType) newErr.organizationType = 'Organization Type is required';
    if (!primaryContactName.trim()) newErr.primaryContactName = 'Primary Contact Person is required';
    if (!regAddressLine1.trim()) newErr.regAddressLine1 = 'Registered Address Line 1 is required';
    if (!regCity.trim()) newErr.regCity = 'City is required';

    if (isVatRegistered) {
      if (!tin.trim()) newErr.tin = 'TIN is mandatory for VAT-registered clients';
      if (!vatNumber.trim()) newErr.vatNumber = 'VAT Registration Number is mandatory';
    }

    if (Object.keys(newErr).length > 0) {
      setErrors(newErr);
      // Automatically switch to tab where first error occurs
      if (newErr.name || newErr.clientCode || newErr.organizationType) setActiveTab('basic');
      else if (newErr.tin || newErr.vatNumber) setActiveTab('tax');
      else if (newErr.primaryContactName) setActiveTab('contact');
      else if (newErr.regAddressLine1 || newErr.regCity) setActiveTab('address');
      return;
    }

    // Duplicate check
    const dup = performDuplicateCheck();
    if (dup.found && !confirmedDuplicateOverride) {
      setDuplicateWarning(dup);
      return;
    }

    // Prepare complete Master Data object
    const registeredAddressObj = {
      line1: regAddressLine1.trim(),
      line2: regAddressLine2.trim() || undefined,
      city: regCity.trim(),
      district: regDistrict.trim() || undefined,
      province: regProvince.trim() || undefined,
      postalCode: regPostalCode.trim() || undefined,
      country: regCountry.trim()
    };

    const billingAddressObj = {
      sameAsRegistered,
      line1: sameAsRegistered ? regAddressLine1.trim() : billAddressLine1.trim(),
      line2: sameAsRegistered ? regAddressLine2.trim() || undefined : billAddressLine2.trim() || undefined,
      city: sameAsRegistered ? regCity.trim() : billCity.trim(),
      district: sameAsRegistered ? regDistrict.trim() || undefined : billDistrict.trim() || undefined,
      postalCode: sameAsRegistered ? regPostalCode.trim() || undefined : billPostalCode.trim() || undefined,
      country: sameAsRegistered ? regCountry.trim() : billCountry.trim()
    };

    const primaryContactObj = {
      name: primaryContactName.trim(),
      designation: primaryDesignation.trim() || undefined,
      department: primaryDepartment.trim() || undefined,
      telephone: primaryTelephone.trim() || undefined,
      mobile: primaryMobile.trim() || undefined,
      email: primaryEmail.trim() || undefined,
      alternativeEmail: primaryAltEmail.trim() || undefined
    };

    const taxDetailsObj = {
      tin: tin.trim(),
      vatNumber: vatNumber.trim(),
      svatNumber: svatNumber.trim() || undefined,
      isVatRegistered,
      taxStatus,
      defaultVatRate: Number(defaultVatRate) || 0,
      defaultInvoiceCurrency,
      defaultPaymentTermsDays: Number(defaultPaymentTermsDays) || 30,
      defaultDueDateRule: `Invoice Date + ${defaultPaymentTermsDays} Days`,
      invoiceAttentionTo: invoiceAttentionTo.trim() || primaryContactName.trim(),
      invoiceEmail: invoiceEmail.trim() || primaryEmail.trim(),
      invoiceDeliveryMethod,
      invoiceAddressType: (sameAsRegistered ? 'Registered Address' : 'Billing Address') as any,
      creditLimit: creditLimit ? Number(creditLimit) : undefined,
      isRetentionApplicable,
      defaultRetentionPercent: Number(defaultRetentionPercent) || 0,
      isAdvanceApplicable,
      defaultAdvancePercent: Number(defaultAdvancePercent) || 0,
      isWithholdingTaxApplicable,
      defaultWhtPercent: Number(defaultWhtPercent) || 0,
      isWhtCertificateRequired
    };

    const resolvedInvoiceDisplayName = invoiceDisplayName.trim() || name.trim();
    const activeAddressParts = (sameAsRegistered
      ? [regAddressLine1, regAddressLine2, regCity, regDistrict, regProvince, regPostalCode, regCountry]
      : [billAddressLine1, billAddressLine2, billCity, billDistrict, billPostalCode, billCountry]
    ).map(s => s?.trim()).filter(Boolean);
    const resolvedInvoiceAddress = invoiceBillingAddress.trim() || activeAddressParts.join(', ');

    const taxInvoiceMasterDataObj = {
      displayName: resolvedInvoiceDisplayName,
      address: resolvedInvoiceAddress,
      tin: (invoiceTin.trim() || tin.trim()),
      vatNumber: (invoiceVatNumber.trim() || vatNumber.trim()),
      attentionTo: (invoiceAttentionTo.trim() || primaryContactName.trim()),
      contactPerson: (invoiceContactPerson.trim() || primaryContactName.trim()),
      email: (invoiceEmail.trim() || primaryEmail.trim()),
      telephone: (invoiceTelephone.trim() || primaryTelephone.trim() || primaryMobile.trim()),
      paymentTerms: invoicePaymentTerms.trim() || `${defaultPaymentTermsDays} Days`,
      currency: defaultInvoiceCurrency,
      defaultVatRate: Number(defaultVatRate) || 18,
      defaultTaxTreatment: isVatRegistered ? 'Standard 18% Output VAT' : 'Exempt / Non-VAT',
      defaultInvoiceNotes: invoiceNotes.trim()
    };

    const paymentTermsObj = {
      defaultPaymentTermsDays: Number(defaultPaymentTermsDays) || 30,
      paymentTermsDescription: `Payment within ${defaultPaymentTermsDays} days from date of Tax Invoice.`,
      defaultDueDateRule: `Invoice Date + ${defaultPaymentTermsDays} Days`,
      creditPeriodDays: Number(defaultPaymentTermsDays) || 30,
      retentionPercent: isRetentionApplicable ? Number(defaultRetentionPercent) : 0,
      advancePercent: isAdvanceApplicable ? Number(defaultAdvancePercent) : 0,
      whtPercent: isWithholdingTaxApplicable ? Number(defaultWhtPercent) : 0,
      preferredPaymentMethod,
      specialPaymentInstructions: specialPaymentInstructions.trim() || undefined
    };

    const initialContractObj = contractNumber.trim() ? {
      contractNumber: contractNumber.trim(),
      contractName: contractName.trim() || undefined,
      employerReference: employerReference.trim() || undefined,
      contractStartDate: contractStartDate || undefined,
      contractCompletionDate: contractCompletionDate || undefined,
      contractValue: contractValue ? Number(contractValue) : undefined,
      consultantEngineer: consultantEngineer.trim() || undefined,
      currency: defaultInvoiceCurrency,
      paymentTerms: `${defaultPaymentTermsDays} Days`,
      retentionPercent: isRetentionApplicable ? Number(defaultRetentionPercent) : 0,
      advancePercent: isAdvanceApplicable ? Number(defaultAdvancePercent) : 0
    } : undefined;

    const regAddressParts = [regAddressLine1, regAddressLine2, regCity, regDistrict, regProvince, regPostalCode, regCountry]
      .map(s => s?.trim()).filter(Boolean);
    const formattedSummaryAddress = regAddressParts.join(', ');

    const clientPayload: Omit<Client, 'id'> = {
      name: name.trim(),
      organizationType,
      clientCode: clientCode.trim(),
      shortName: shortName.trim() || undefined,
      registrationNumber: registrationNumber.trim() || undefined,
      companyRegistrationDate: companyRegistrationDate || undefined,
      industry: industry.trim() || undefined,
      clientCategory: clientCategory.trim() || undefined,
      status,
      website: website.trim() || undefined,
      country: country.trim(),

      // Backward compatibility fields
      contactPerson: primaryContactName.trim(),
      address: formattedSummaryAddress,
      phone: primaryTelephone.trim() || primaryMobile.trim() || undefined,
      email: primaryEmail.trim() || undefined,
      notes: notes.trim() || undefined,
      assignedProjectIds,

      // Rich Master Modules
      taxDetails: taxDetailsObj,
      taxInvoiceMasterData: taxInvoiceMasterDataObj,
      primaryContact: primaryContactObj,
      commercialContacts: {
        accountsDepartmentContact: accountsContact.trim() || undefined,
        accountsDepartmentEmail: accountsEmail.trim() || undefined,
        accountsDepartmentTelephone: accountsPhone.trim() || undefined,
        projectDirector: projectDirector.trim() || undefined,
        projectDirectorEmail: projectDirectorEmail.trim() || undefined,
        commercialContact: commercialContact.trim() || undefined,
        commercialEmail: commercialEmail.trim() || undefined,
        procurementContact: procurementContact.trim() || undefined,
        procurementEmail: procurementEmail.trim() || undefined
      },
      contacts,
      registeredAddress: registeredAddressObj,
      billingAddress: billingAddressObj,
      paymentTerms: paymentTermsObj,
      bankAccounts,
      initialContract: initialContractObj,
      documents
    };

    if (clientToEdit) {
      updateClient(clientToEdit.id, clientPayload);
      if (onClientSaved) onClientSaved({ ...clientPayload, id: clientToEdit.id });
    } else {
      addClient(clientPayload);
      if (onClientSaved) onClientSaved({ ...clientPayload, id: `cli-${Date.now()}` });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                {clientToEdit ? 'Edit Client / Employer Master Record' : 'Register New Client / Employer'}
                {status && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                      status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : status === 'SUSPENDED'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : status === 'BLACKLISTED'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-slate-700 text-slate-300 border-slate-600'
                    }`}
                  >
                    {status}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Single Source of Truth for Tax Invoices, Contracts, Projects, and Financial Receivables
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate Warning Banner */}
        {duplicateWarning.found && (
          <div className="mx-6 mt-4 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs flex items-start justify-between gap-3 shrink-0">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300">Possible Existing Client Found</p>
                <p className="mt-0.5 text-amber-200/90">
                  {duplicateWarning.matchedField} matches existing record: <strong>{duplicateWarning.clientName}</strong> ({duplicateWarning.clientCode}).
                </p>
                <p className="mt-1 text-[11px] text-amber-300/70">
                  Please verify to avoid duplicate client balances, invoicing conflicts, or tax discrepancies.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmedDuplicateOverride(true)}
                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors"
              >
                Confirm & Proceed
              </button>
              <button
                type="button"
                onClick={() => setDuplicateWarning({ found: false })}
                className="px-2.5 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="px-6 pt-2 bg-slate-950/60 border-b border-slate-800 flex items-center gap-1 overflow-x-auto shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'basic'
                ? 'text-emerald-400 border-emerald-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Basic Info *</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tax')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'tax'
                ? 'text-emerald-400 border-emerald-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Tax & Invoicing *</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'contact'
                ? 'text-emerald-400 border-emerald-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Contact & Commercial *</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('address')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'address'
                ? 'text-emerald-400 border-emerald-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Address Details *</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payment')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'payment'
                ? 'text-emerald-400 border-emerald-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Banking & Terms ({bankAccounts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('project')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'project'
                ? 'text-emerald-400 border-emerald-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Projects & Contracts ({assignedProjectIds.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'documents'
                ? 'text-emerald-400 border-emerald-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Documents ({documents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'text-emerald-400 border-emerald-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: BASIC INFORMATION */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Client / Employer Legal Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => {
                      setName(e.target.value);
                      if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                    }}
                    placeholder="e.g. Colombo Port City Development Authority"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs sm:text-sm focus:border-emerald-500 outline-none"
                  />
                  {errors.name && <p className="text-[11px] text-rose-400 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Client Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={clientCode}
                    onChange={e => {
                      setClientCode(e.target.value);
                      if (errors.clientCode) setErrors(prev => ({ ...prev, clientCode: '' }));
                    }}
                    placeholder="e.g. CPCDA-001"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs sm:text-sm focus:border-emerald-500 outline-none uppercase"
                  />
                  {errors.clientCode && <p className="text-[11px] text-rose-400 mt-1">{errors.clientCode}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Organization Type <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={organizationType}
                    onChange={e => setOrganizationType(e.target.value as ClientOrganizationType)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                  >
                    {ORG_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Short / Trade Name</label>
                  <input
                    type="text"
                    value={shortName}
                    onChange={e => setShortName(e.target.value)}
                    placeholder="e.g. Port City Authority / CPCDA"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Business Registration No</label>
                  <input
                    type="text"
                    value={registrationNumber}
                    onChange={e => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. GA-2014-CPCDA"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Registration Date</label>
                  <input
                    type="date"
                    value={companyRegistrationDate}
                    onChange={e => setCompanyRegistrationDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Industry / Sector</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={e => setIndustry(e.target.value)}
                    placeholder="e.g. Government Infrastructure"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Client Category</label>
                  <input
                    type="text"
                    value={clientCategory}
                    onChange={e => setClientCategory(e.target.value)}
                    placeholder="e.g. Tier 1 Employer"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Client Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as ClientStatus)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none font-semibold"
                  >
                    {CLIENT_STATUSES.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    placeholder="Sri Lanka"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Official Website</label>
                <input
                  type="url"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  placeholder="https://portcitycolombo.gov.lk"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">General Notes & Background</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Official notes, project eligibility, special contract authorities..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: TAX & INVOICING */}
          {activeTab === 'tax' && (
            <div className="space-y-6">
              {/* Part A: Tax Registration */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Inland Revenue & Tax Registration
                  </h3>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isVatRegistered}
                        onChange={e => setIsVatRegistered(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                      />
                      <span>VAT Registered Person</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tax Status <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={taxStatus}
                      onChange={e => setTaxStatus(e.target.value as ClientTaxStatus)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                    >
                      {TAX_STATUSES.map(ts => (
                        <option key={ts} value={ts}>
                          {ts}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Taxpayer Identification Number (TIN) {isVatRegistered && <span className="text-rose-400">*</span>}
                    </label>
                    <input
                      type="text"
                      value={tin}
                      onChange={e => {
                        setTin(e.target.value);
                        if (errors.tin) setErrors(prev => ({ ...prev, tin: '' }));
                      }}
                      placeholder="e.g. 20491827"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-emerald-500 outline-none"
                    />
                    {errors.tin && <p className="text-[11px] text-rose-400 mt-1">{errors.tin}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      VAT Registration Number {isVatRegistered && <span className="text-rose-400">*</span>}
                    </label>
                    <input
                      type="text"
                      value={vatNumber}
                      onChange={e => {
                        setVatNumber(e.target.value);
                        if (errors.vatNumber) setErrors(prev => ({ ...prev, vatNumber: '' }));
                      }}
                      placeholder="e.g. 204918274-7000"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-emerald-500 outline-none"
                    />
                    {errors.vatNumber && <p className="text-[11px] text-rose-400 mt-1">{errors.vatNumber}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">SVAT Number (if applicable)</label>
                    <input
                      type="text"
                      value={svatNumber}
                      onChange={e => setSvatNumber(e.target.value)}
                      placeholder="e.g. SVAT-002914"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Default VAT Rate (%)</label>
                    <input
                      type="number"
                      value={defaultVatRate}
                      onChange={e => setDefaultVatRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Default Currency</label>
                    <select
                      value={defaultInvoiceCurrency}
                      onChange={e => setDefaultInvoiceCurrency(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-emerald-500 outline-none"
                    >
                      <option value="LKR">LKR (Sri Lankan Rupee)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="GBP">GBP (Pound Sterling)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Default Payment Terms (Days)</label>
                    <input
                      type="number"
                      value={defaultPaymentTermsDays}
                      onChange={e => setDefaultPaymentTermsDays(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Invoice Attention To</label>
                    <input
                      type="text"
                      value={invoiceAttentionTo}
                      onChange={e => setInvoiceAttentionTo(e.target.value)}
                      placeholder="e.g. Chief Project Director / Finance"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Invoice Dispatch Email</label>
                    <input
                      type="email"
                      value={invoiceEmail}
                      onChange={e => setInvoiceEmail(e.target.value)}
                      placeholder="invoices@portcity.lk"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Delivery Method</label>
                    <select
                      value={invoiceDeliveryMethod}
                      onChange={e => setInvoiceDeliveryMethod(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                    >
                      <option value="Email">Email (Electronic PDF)</option>
                      <option value="Printed/Courier">Printed / Physical Courier</option>
                      <option value="Portal">Client Procurement Portal</option>
                      <option value="Hand Delivery">Hand Delivery / Site Office</option>
                    </select>
                  </div>
                </div>

                {/* Deductions & Rules */}
                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isRetentionApplicable}
                        onChange={e => setIsRetentionApplicable(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                      />
                      <span>Retention Applicable</span>
                    </label>
                    {isRetentionApplicable && (
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Retention Rate (%)</label>
                        <input
                          type="number"
                          value={defaultRetentionPercent}
                          onChange={e => setDefaultRetentionPercent(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAdvanceApplicable}
                        onChange={e => setIsAdvanceApplicable(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                      />
                      <span>Mobilization Advance</span>
                    </label>
                    {isAdvanceApplicable && (
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Advance Rate (%)</label>
                        <input
                          type="number"
                          value={defaultAdvancePercent}
                          onChange={e => setDefaultAdvancePercent(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isWithholdingTaxApplicable}
                        onChange={e => setIsWithholdingTaxApplicable(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                      />
                      <span>Withholding Tax (WHT)</span>
                    </label>
                    {isWithholdingTaxApplicable && (
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">WHT Rate (%)</label>
                        <input
                          type="number"
                          value={defaultWhtPercent}
                          onChange={e => setDefaultWhtPercent(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Part B: Dedicated Tax Invoice Master Data Section */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-cyan-800/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-cyan-900/30">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      Tax Invoice Master Data (Purchaser Profile)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Information that automatically populates Purchaser sections when generating Tax Invoices
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoPopulateInvoiceMaster}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/50 text-cyan-300 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Sync from Master Details</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Invoice Legal Display Name
                    </label>
                    <input
                      type="text"
                      value={invoiceDisplayName}
                      onChange={e => setInvoiceDisplayName(e.target.value)}
                      placeholder="Name as it must appear on Tax Invoices"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-cyan-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Invoice Billing Address
                    </label>
                    <input
                      type="text"
                      value={invoiceBillingAddress}
                      onChange={e => setInvoiceBillingAddress(e.target.value)}
                      placeholder="Address line printed on Tax Invoices"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Invoice Contact Person</label>
                    <input
                      type="text"
                      value={invoiceContactPerson}
                      onChange={e => setInvoiceContactPerson(e.target.value)}
                      placeholder="e.g. Eng. K. Wickramasinghe"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-cyan-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Invoice Phone</label>
                    <input
                      type="text"
                      value={invoiceTelephone}
                      onChange={e => setInvoiceTelephone(e.target.value)}
                      placeholder="+94 11 755 4000"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-cyan-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Invoice TIN (Purchaser)</label>
                    <input
                      type="text"
                      value={invoiceTin}
                      onChange={e => setInvoiceTin(e.target.value)}
                      placeholder="20491827"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-cyan-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Invoice VAT No</label>
                    <input
                      type="text"
                      value={invoiceVatNumber}
                      onChange={e => setInvoiceVatNumber(e.target.value)}
                      placeholder="204918274-7000"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Default Invoice Notes</label>
                  <textarea
                    rows={2}
                    value={invoiceNotes}
                    onChange={e => setInvoiceNotes(e.target.value)}
                    placeholder="Standard terms, project IPC certification reference, milestone billing notes..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT & COMMERCIAL */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              {/* Primary Contact */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  Primary Liaison / Employer Representative <span className="text-rose-400">*</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={primaryContactName}
                      onChange={e => {
                        setPrimaryContactName(e.target.value);
                        if (errors.primaryContactName) setErrors(prev => ({ ...prev, primaryContactName: '' }));
                      }}
                      placeholder="e.g. Eng. K. Wickramasinghe"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                    />
                    {errors.primaryContactName && <p className="text-[11px] text-rose-400 mt-1">{errors.primaryContactName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Designation</label>
                    <input
                      type="text"
                      value={primaryDesignation}
                      onChange={e => setPrimaryDesignation(e.target.value)}
                      placeholder="e.g. Chief Project Director"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                    <input
                      type="text"
                      value={primaryDepartment}
                      onChange={e => setPrimaryDepartment(e.target.value)}
                      placeholder="e.g. Engineering & Projects"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Direct Telephone</label>
                    <input
                      type="text"
                      value={primaryTelephone}
                      onChange={e => setPrimaryTelephone(e.target.value)}
                      placeholder="+94 11 755 4000"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile</label>
                    <input
                      type="text"
                      value={primaryMobile}
                      onChange={e => setPrimaryMobile(e.target.value)}
                      placeholder="+94 77 789 2000"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Official Email</label>
                    <input
                      type="email"
                      value={primaryEmail}
                      onChange={e => setPrimaryEmail(e.target.value)}
                      placeholder="k.wickramasinghe@portcity.lk"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Alternative Email</label>
                    <input
                      type="email"
                      value={primaryAltEmail}
                      onChange={e => setPrimaryAltEmail(e.target.value)}
                      placeholder="billing@portcity.lk"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Departmental Commercial Contacts */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Commercial, Accounts & Project Contacts
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-2">
                    <span className="text-xs font-semibold text-emerald-400">Accounts & Billing Department</span>
                    <input
                      type="text"
                      value={accountsContact}
                      onChange={e => setAccountsContact(e.target.value)}
                      placeholder="Head of Finance / Accounts Exec"
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="email"
                        value={accountsEmail}
                        onChange={e => setAccountsEmail(e.target.value)}
                        placeholder="finance@client.lk"
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                      />
                      <input
                        type="text"
                        value={accountsPhone}
                        onChange={e => setAccountsPhone(e.target.value)}
                        placeholder="Direct Phone"
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-2">
                    <span className="text-xs font-semibold text-purple-400">Project Director / Engineer</span>
                    <input
                      type="text"
                      value={projectDirector}
                      onChange={e => setProjectDirector(e.target.value)}
                      placeholder="Project Director / Engineer's Rep"
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                    />
                    <input
                      type="email"
                      value={projectDirectorEmail}
                      onChange={e => setProjectDirectorEmail(e.target.value)}
                      placeholder="project.director@client.lk"
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                    />
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-2">
                    <span className="text-xs font-semibold text-cyan-400">Commercial / QS Department</span>
                    <input
                      type="text"
                      value={commercialContact}
                      onChange={e => setCommercialContact(e.target.value)}
                      placeholder="Chief Quantity Surveyor / Commercial Manager"
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                    />
                    <input
                      type="email"
                      value={commercialEmail}
                      onChange={e => setCommercialEmail(e.target.value)}
                      placeholder="commercial@client.lk"
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                    />
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-2">
                    <span className="text-xs font-semibold text-amber-400">Procurement / Tender Division</span>
                    <input
                      type="text"
                      value={procurementContact}
                      onChange={e => setProcurementContact(e.target.value)}
                      placeholder="Director Procurement / Committee Secretary"
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                    />
                    <input
                      type="email"
                      value={procurementEmail}
                      onChange={e => setProcurementEmail(e.target.value)}
                      placeholder="procurement@client.lk"
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Persons Directory Table */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Additional Authorized Contact Persons ({contacts.length})
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                  <input
                    type="text"
                    value={newContactName}
                    onChange={e => setNewContactName(e.target.value)}
                    placeholder="Contact Name"
                    className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                  <input
                    type="text"
                    value={newContactDesignation}
                    onChange={e => setNewContactDesignation(e.target.value)}
                    placeholder="Designation"
                    className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                  <input
                    type="text"
                    value={newContactPhone}
                    onChange={e => setNewContactPhone(e.target.value)}
                    placeholder="Phone"
                    className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                  <select
                    value={newContactType}
                    onChange={e => setNewContactType(e.target.value as any)}
                    className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  >
                    <option value="Finance">Finance / Accounts</option>
                    <option value="Engineer">Engineer / Site</option>
                    <option value="Project Director">Project Director</option>
                    <option value="Quantity Surveyor">Quantity Surveyor</option>
                    <option value="Procurement">Procurement</option>
                    <option value="Administration">Administration</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddContact}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Contact</span>
                  </button>
                </div>

                {contacts.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-800 rounded-lg overflow-hidden">
                      <thead className="bg-slate-800/80 text-slate-300">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">Role</th>
                          <th className="p-2">Type</th>
                          <th className="p-2">Phone</th>
                          <th className="p-2">Email</th>
                          <th className="p-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {contacts.map(c => (
                          <tr key={c.id} className="hover:bg-slate-800/30">
                            <td className="p-2 font-medium text-white">{c.name}</td>
                            <td className="p-2 text-slate-300">{c.designation || '-'}</td>
                            <td className="p-2">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                                {c.contactType}
                              </span>
                            </td>
                            <td className="p-2 text-slate-400">{c.telephone || '-'}</td>
                            <td className="p-2 text-slate-400">{c.email || '-'}</td>
                            <td className="p-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveContact(c.id)}
                                className="text-rose-400 hover:text-rose-300 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ADDRESS DETAILS */}
          {activeTab === 'address' && (
            <div className="space-y-6">
              {/* Registered Legal Address */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Registered Legal Address <span className="text-rose-400">*</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Address Line 1 <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regAddressLine1}
                      onChange={e => {
                        setRegAddressLine1(e.target.value);
                        if (errors.regAddressLine1) setErrors(prev => ({ ...prev, regAddressLine1: '' }));
                      }}
                      placeholder="e.g. Block A, Port City Boulevard"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                    />
                    {errors.regAddressLine1 && <p className="text-[11px] text-rose-400 mt-1">{errors.regAddressLine1}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Address Line 2</label>
                    <input
                      type="text"
                      value={regAddressLine2}
                      onChange={e => setRegAddressLine2(e.target.value)}
                      placeholder="e.g. Financial District"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      City <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regCity}
                      onChange={e => {
                        setRegCity(e.target.value);
                        if (errors.regCity) setErrors(prev => ({ ...prev, regCity: '' }));
                      }}
                      placeholder="Colombo 01"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                    />
                    {errors.regCity && <p className="text-[11px] text-rose-400 mt-1">{errors.regCity}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">District</label>
                    <input
                      type="text"
                      value={regDistrict}
                      onChange={e => setRegDistrict(e.target.value)}
                      placeholder="Colombo"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Province</label>
                    <input
                      type="text"
                      value={regProvince}
                      onChange={e => setRegProvince(e.target.value)}
                      placeholder="Western Province"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={regPostalCode}
                      onChange={e => setRegPostalCode(e.target.value)}
                      placeholder="00100"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Billing / Invoicing Address */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Billing / Invoicing Address
                  </h3>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAsRegistered}
                      onChange={e => setSameAsRegistered(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <span>Same as Registered Address</span>
                  </label>
                </div>

                {!sameAsRegistered && (
                  <div className="space-y-4 pt-2 border-t border-slate-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Address Line 1</label>
                        <input
                          type="text"
                          value={billAddressLine1}
                          onChange={e => setBillAddressLine1(e.target.value)}
                          placeholder="Finance / Accounts Payable Office"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Address Line 2</label>
                        <input
                          type="text"
                          value={billAddressLine2}
                          onChange={e => setBillAddressLine2(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Billing City</label>
                        <input
                          type="text"
                          value={billCity}
                          onChange={e => setBillCity(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Billing District</label>
                        <input
                          type="text"
                          value={billDistrict}
                          onChange={e => setBillDistrict(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Postal Code</label>
                        <input
                          type="text"
                          value={billPostalCode}
                          onChange={e => setBillPostalCode(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PAYMENT & BANKING */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              {/* Commercial Terms */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Payment Terms & Settlement Preferences
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Preferred Settlement Method</label>
                    <select
                      value={preferredPaymentMethod}
                      onChange={e => setPreferredPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                    >
                      <option value="Bank Transfer">Bank Transfer / Electronic RTGS</option>
                      <option value="Cheque">Account Payee Cheque</option>
                      <option value="Letter of Credit">Letter of Credit (LC)</option>
                      <option value="Other">Other Electronic Gateway</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Special Settlement Instructions</label>
                    <input
                      type="text"
                      value={specialPaymentInstructions}
                      onChange={e => setSpecialPaymentInstructions(e.target.value)}
                      placeholder="e.g. Include Certificate Number on payment advice voucher"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Multiple Bank Accounts */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-emerald-400" />
                      Client Verified Bank Accounts ({bankAccounts.length})
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Bank accounts utilized for client payments, escrow transfers, and invoice settlements
                    </p>
                  </div>

                  {/* Registered Bank Autofill Quick Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Autofill from CBSL Bank:</span>
                    <select
                      onChange={e => {
                        if (e.target.value) handleSelectPredefinedBank(e.target.value);
                      }}
                      defaultValue=""
                      className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white outline-none"
                    >
                      <option value="" disabled>
                        Select Registered Bank...
                      </option>
                      {REGISTERED_BANKS_AUTOFILL.map(b => (
                        <option key={b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Add New Bank Form */}
                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-300">Add New Bank Account</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={newBankName}
                      onChange={e => setNewBankName(e.target.value)}
                      placeholder="Bank Name (e.g. Bank of Ceylon)"
                      className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                    />
                    <input
                      type="text"
                      value={newBranch}
                      onChange={e => setNewBranch(e.target.value)}
                      placeholder="Branch Name (e.g. Corporate Branch)"
                      className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                    />
                    <input
                      type="text"
                      value={newAccountName}
                      onChange={e => setNewAccountName(e.target.value)}
                      placeholder="Account Name / Title"
                      className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                    />
                    <input
                      type="text"
                      value={newAccountNumber}
                      onChange={e => setNewAccountNumber(e.target.value)}
                      placeholder="Account Number"
                      className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono"
                    />
                    <input
                      type="text"
                      value={newSwift}
                      onChange={e => setNewSwift(e.target.value)}
                      placeholder="SWIFT / BIC Code"
                      className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono"
                    />
                    <div className="flex items-center gap-2">
                      <select
                        value={newCurrency}
                        onChange={e => setNewCurrency(e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono"
                      >
                        <option value="LKR">LKR</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleAddBank}
                        className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Account</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bank Accounts List */}
                {bankAccounts.length > 0 && (
                  <div className="space-y-2">
                    {bankAccounts.map(b => {
                      const isRevealed = revealedBankIds[b.id];
                      const maskedNumber = b.accountNumber
                        ? isRevealed
                          ? b.accountNumber
                          : `•••• •••• ${b.accountNumber.slice(-4)}`
                        : '-';

                      return (
                        <div
                          key={b.id}
                          className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                              <Landmark className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{b.bankName}</span>
                                <span className="text-[10px] px-2 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {b.branch}
                                </span>
                                {b.isDefault && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                                    DEFAULT
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-2">
                                <span>A/C: {maskedNumber}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRevealedBankIds(prev => ({ ...prev, [b.id]: !isRevealed }))
                                  }
                                  className="text-slate-500 hover:text-slate-300"
                                  title={isRevealed ? 'Mask number' : 'Reveal full number'}
                                >
                                  {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </button>
                                <span>• {b.accountName}</span>
                                <span>• {b.currency}</span>
                                {b.swift && <span>• SWIFT: {b.swift}</span>}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveBank(b.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: PROJECTS & CONTRACTS */}
          {activeTab === 'project' && (
            <div className="space-y-6">
              {/* Initial Contract Profile */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Initial Major Contract / Framework Agreement
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Contract / Tender Number</label>
                    <input
                      type="text"
                      value={contractNumber}
                      onChange={e => setContractNumber(e.target.value)}
                      placeholder="e.g. CPCE-2025-C08"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Official Contract Title</label>
                    <input
                      type="text"
                      value={contractName}
                      onChange={e => setContractName(e.target.value)}
                      placeholder="e.g. Colombo Port Expansion Phase II & Breakwater Works"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Employer Reference</label>
                    <input
                      type="text"
                      value={employerReference}
                      onChange={e => setEmployerReference(e.target.value)}
                      placeholder="e.g. CPCDA/ENG/2025/08"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Contract Value ({defaultInvoiceCurrency})</label>
                    <input
                      type="number"
                      value={contractValue ?? ''}
                      onChange={e => setContractValue(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="450000000"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={contractStartDate}
                      onChange={e => setContractStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Completion Date</label>
                    <input
                      type="date"
                      value={contractCompletionDate}
                      onChange={e => setContractCompletionDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Consultant Engineer Firm</label>
                  <input
                    type="text"
                    value={consultantEngineer}
                    onChange={e => setConsultantEngineer(e.target.value)}
                    placeholder="e.g. Royal HaskoningDHV / Scott Wilson JV"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                  />
                </div>
              </div>

              {/* Linked Projects Selector */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-purple-400" />
                    Associate Projects with Client ({assignedProjectIds.length})
                  </h3>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {projects.map((proj, idx) => {
                    const isChecked = assignedProjectIds.includes(proj.PROJECT_CODE) || assignedProjectIds.includes(proj.id);

                    return (
                      <label
                        key={`${proj.id || proj.PROJECT_CODE}-${idx}`}
                        className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors text-xs ${
                          isChecked
                            ? 'bg-purple-500/10 border-purple-500/40 text-purple-200'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => {
                              if (e.target.checked) {
                                setAssignedProjectIds(prev => [...prev, proj.PROJECT_CODE]);
                              } else {
                                setAssignedProjectIds(prev =>
                                  prev.filter(id => id !== proj.PROJECT_CODE && id !== proj.id)
                                );
                              }
                            }}
                            className="rounded border-slate-700 text-purple-500 focus:ring-0"
                          />
                          <div>
                            <span className="font-bold font-mono">{proj.PROJECT_CODE}</span>
                            <span className="ml-2 font-medium">{proj.PROJECT_NAME}</span>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {proj.LOCATION || 'Active Site'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  Attach Client Document / Certificate
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    value={newDocName}
                    onChange={e => setNewDocName(e.target.value)}
                    placeholder="Document Title (e.g. Master Agreement)"
                    className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                  <select
                    value={newDocType}
                    onChange={e => setNewDocType(e.target.value as any)}
                    className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  >
                    <option value="Client Contract">Client Contract</option>
                    <option value="Master Agreement">Master Agreement</option>
                    <option value="MOU">MOU</option>
                    <option value="VAT Certificate">VAT Certificate</option>
                    <option value="TIN Certificate">TIN Certificate</option>
                    <option value="Business Registration">Business Registration</option>
                    <option value="Bank Letter">Bank Letter</option>
                    <option value="Other Supporting Documents">Other</option>
                  </select>
                  <input
                    type="date"
                    value={newDocExpiry}
                    onChange={e => setNewDocExpiry(e.target.value)}
                    title="Expiry Date"
                    className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddDocument}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Attach Document</span>
                  </button>
                </div>

                {documents.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    {documents.map(doc => {
                      const isExpired = doc.status === 'Expired';
                      const isExpiringSoon = doc.status === 'Expiring Soon';

                      return (
                        <div
                          key={doc.id}
                          className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                              <FileCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{doc.name}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {doc.documentType}
                                </span>
                                {isExpired && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold uppercase">
                                    EXPIRED
                                  </span>
                                )}
                                {isExpiringSoon && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold uppercase">
                                    EXPIRING SOON
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                <span>Uploaded: {doc.uploadedDate}</span>
                                {doc.expiryDate && <span> • Expires: {doc.expiryDate}</span>}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(doc.id)}
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <History className="w-4 h-4 text-emerald-400" />
                      Client Master Audit Trail Log
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Automated chronological log of changes made to this Client / Employer master record.
                    </p>
                  </div>
                  {clientToEdit?.id && clientToEdit?.auditTrail && clientToEdit.auditTrail.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to clear the audit history for ${clientToEdit.name}?`)) {
                          clearClientAuditHistory(clientToEdit.id);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-semibold transition-colors"
                      title="Clear historical audit logs for this client"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Audit History</span>
                    </button>
                  )}
                </div>

                {clientToEdit?.auditTrail && clientToEdit.auditTrail.length > 0 ? (
                  <div className="space-y-2">
                    {clientToEdit.auditTrail.map(entry => (
                      <div
                        key={entry.id}
                        className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-emerald-400">{entry.action}</span>
                          <span className="text-slate-500 font-mono">{entry.timestamp}</span>
                        </div>
                        <div className="text-slate-300">{entry.notes || 'Master record event logged.'}</div>
                        <div className="text-[10px] text-slate-500">Performed by: {entry.user}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-lg border border-slate-800/80">
                    No historical changes recorded for this client. Changes will appear here as updates occur.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between shrink-0">
            <div className="text-[11px] text-slate-500">
              {clientToEdit ? 'Historical issued Tax Invoices retain their original snapshot.' : 'New master data will be available immediately across ERP modules.'}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{clientToEdit ? 'Save Master Record' : 'Register Client'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
