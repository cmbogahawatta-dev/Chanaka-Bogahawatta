import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ShieldCheck,
  FileText,
  DollarSign,
  Landmark,
  Save,
  CheckCircle2,
  AlertCircle,
  Tag
} from 'lucide-react';
import { useSupplier } from '../../context/SupplierContext';
import { useEnterpriseBanking } from '../../context/EnterpriseBankingContext';
import {
  Supplier,
  SupplierType,
  SupplierStatus,
  CreditPeriod,
  ContactDesignation
} from '../../types/supplierTypes';

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierToEdit?: Supplier | null;
}

const SUPPLIER_TYPES: SupplierType[] = [
  'Material Supplier',
  'Service Provider',
  'Subcontractor',
  'Equipment Supplier',
  'Plant Hire',
  'Consultant',
  'Professional Service',
  'Transport Supplier',
  'Fuel Supplier',
  'General Supplier',
  'Other'
];

const CREDIT_PERIODS: CreditPeriod[] = [
  'Cash',
  '7 Days',
  '15 Days',
  '30 Days',
  '45 Days',
  '60 Days',
  'Custom'
];

const PROVINCES = [
  'Western Province',
  'Central Province',
  'Southern Province',
  'North Western Province',
  'Sabaragamuwa Province',
  'Eastern Province',
  'Uva Province',
  'North Central Province',
  'Northern Province'
];

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  isOpen,
  onClose,
  supplierToEdit
}) => {
  const { addSupplier, updateSupplier, categories } = useSupplier();
  const { registeredBanks } = useEnterpriseBanking();

  const [activeStep, setActiveStep] = useState<'basic' | 'statutory' | 'contact' | 'bank' | 'credit'>('basic');

  // Form states
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [supplierType, setSupplierType] = useState<SupplierType>('Material Supplier');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [status, setStatus] = useState<SupplierStatus>('Active');

  // Statutory
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [businessRegistrationDate, setBusinessRegistrationDate] = useState('');
  const [tin, setTin] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [svatNumber, setSvatNumber] = useState('');
  const [isVatRegistered, setIsVatRegistered] = useState(true);

  // Address & Quick Contact
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('Western Province');
  const [country, setCountry] = useState('Sri Lanka');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');

  // Primary Contact
  const [contactName, setContactName] = useState('');
  const [contactDesignation, setContactDesignation] = useState('');
  const [contactType, setContactType] = useState<ContactDesignation>('Main');
  const [contactMobile, setContactMobile] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactWhatsApp, setContactWhatsApp] = useState('');

  // Bank
  const [bankName, setBankName] = useState('Commercial Bank of Ceylon');
  const [branch, setBranch] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [swift, setSwift] = useState('');
  const [currency, setCurrency] = useState('LKR');

  // Credit
  const [creditPeriod, setCreditPeriod] = useState<CreditPeriod>('30 Days');
  const [customPeriodDays, setCustomPeriodDays] = useState<number>(30);
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days from invoice submission');
  const [creditLimit, setCreditLimit] = useState<number>(5000000);
  const [advanceRequiredPercent, setAdvanceRequiredPercent] = useState<number>(0);
  const [retentionPercent, setRetentionPercent] = useState<number>(0);
  const [earlyPaymentDiscountPercent, setEarlyPaymentDiscountPercent] = useState<number>(0);
  const [latePaymentTerms, setLatePaymentTerms] = useState('');

  useEffect(() => {
    if (supplierToEdit) {
      setName(supplierToEdit.name);
      setLegalName(supplierToEdit.legalName || supplierToEdit.name);
      setTradingName(supplierToEdit.tradingName || supplierToEdit.name);
      setSupplierType(supplierToEdit.supplierType);
      setSelectedCategories(supplierToEdit.categories || []);
      setStatus(supplierToEdit.status);

      setRegistrationNumber(supplierToEdit.registrationNumber || '');
      setBusinessRegistrationDate(supplierToEdit.businessRegistrationDate || '');
      setTin(supplierToEdit.tin || '');
      setVatNumber(supplierToEdit.vatNumber || '');
      setSvatNumber(supplierToEdit.svatNumber || '');
      setIsVatRegistered(supplierToEdit.isVatRegistered);

      setAddress(supplierToEdit.address || '');
      setCity(supplierToEdit.city || '');
      setProvince(supplierToEdit.province || 'Western Province');
      setCountry(supplierToEdit.country || 'Sri Lanka');
      setPostalCode(supplierToEdit.postalCode || '');
      setPhone(supplierToEdit.phone || '');
      setEmail(supplierToEdit.email || '');
      setWebsite(supplierToEdit.website || '');
      setNotes(supplierToEdit.notes || '');

      const primaryContact = supplierToEdit.contacts.find(c => c.isPrimary) || supplierToEdit.contacts[0];
      if (primaryContact) {
        setContactName(primaryContact.name);
        setContactDesignation(primaryContact.designation);
        setContactType(primaryContact.contactType);
        setContactMobile(primaryContact.mobile);
        setContactEmail(primaryContact.email);
        setContactWhatsApp(primaryContact.whatsApp || '');
      }

      const defaultBank = supplierToEdit.bankAccounts.find(b => b.isDefault) || supplierToEdit.bankAccounts[0];
      if (defaultBank) {
        setBankName(defaultBank.bank);
        setBranch(defaultBank.branch);
        setAccountName(defaultBank.accountName);
        setAccountNumber(defaultBank.accountNumber);
        setSwift(defaultBank.swift || '');
        setCurrency(defaultBank.currency || 'LKR');
      }

      if (supplierToEdit.creditTerms) {
        setCreditPeriod(supplierToEdit.creditTerms.creditPeriod);
        setCustomPeriodDays(supplierToEdit.creditTerms.customPeriodDays || 30);
        setPaymentTerms(supplierToEdit.creditTerms.paymentTerms || '');
        setCreditLimit(supplierToEdit.creditTerms.creditLimit || 0);
        setAdvanceRequiredPercent(supplierToEdit.creditTerms.advanceRequiredPercent || 0);
        setRetentionPercent(supplierToEdit.creditTerms.retentionPercent || 0);
        setEarlyPaymentDiscountPercent(supplierToEdit.creditTerms.earlyPaymentDiscountPercent || 0);
        setLatePaymentTerms(supplierToEdit.creditTerms.latePaymentTerms || '');
      }
    } else {
      // Reset form
      setName('');
      setLegalName('');
      setTradingName('');
      setSupplierType('Material Supplier');
      setSelectedCategories([]);
      setStatus('Active');

      setRegistrationNumber('');
      setBusinessRegistrationDate('');
      setTin('');
      setVatNumber('');
      setSvatNumber('');
      setIsVatRegistered(true);

      setAddress('');
      setCity('');
      setProvince('Western Province');
      setCountry('Sri Lanka');
      setPostalCode('');
      setPhone('');
      setEmail('');
      setWebsite('');
      setNotes('');

      setContactName('');
      setContactDesignation('');
      setContactType('Main');
      setContactMobile('');
      setContactEmail('');
      setContactWhatsApp('');

      setBankName(registeredBanks[0]?.bankName || 'Commercial Bank of Ceylon');
      setBranch('');
      setAccountName('');
      setAccountNumber('');
      setSwift('');
      setCurrency('LKR');

      setCreditPeriod('30 Days');
      setCustomPeriodDays(30);
      setPaymentTerms('Net 30 Days from delivery & invoice verification');
      setCreditLimit(5000000);
      setAdvanceRequiredPercent(0);
      setRetentionPercent(0);
      setEarlyPaymentDiscountPercent(0);
      setLatePaymentTerms('');
      setActiveStep('basic');
    }
  }, [supplierToEdit, isOpen, registeredBanks]);

  if (!isOpen) return null;

  const toggleCategory = (catName: string) => {
    setSelectedCategories(prev =>
      prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Supplier / Company Name is required.');
      setActiveStep('basic');
      return;
    }

    if (supplierToEdit) {
      updateSupplier(supplierToEdit.id, {
        name: name.trim(),
        legalName: legalName.trim() || name.trim(),
        tradingName: tradingName.trim() || name.trim(),
        supplierType,
        categories: selectedCategories,
        status,
        registrationNumber: registrationNumber.trim(),
        businessRegistrationDate: businessRegistrationDate || undefined,
        tin: tin.trim(),
        vatNumber: isVatRegistered ? vatNumber.trim() : undefined,
        svatNumber: isVatRegistered ? svatNumber.trim() : undefined,
        isVatRegistered,
        address: address.trim(),
        city: city.trim(),
        province,
        country,
        postalCode: postalCode.trim(),
        phone: phone.trim(),
        email: email.trim(),
        website: website.trim(),
        notes: notes.trim(),
        creditTerms: {
          creditPeriod,
          customPeriodDays: creditPeriod === 'Custom' ? customPeriodDays : undefined,
          paymentTerms: paymentTerms.trim(),
          currency,
          creditLimit: Number(creditLimit) || 0,
          advanceRequiredPercent: Number(advanceRequiredPercent) || 0,
          retentionPercent: Number(retentionPercent) || 0,
          earlyPaymentDiscountPercent: Number(earlyPaymentDiscountPercent) || 0,
          latePaymentTerms: latePaymentTerms.trim()
        }
      });
    } else {
      const primaryContact = contactName.trim() ? [{
        id: `cnt-${Date.now()}`,
        name: contactName.trim(),
        designation: contactDesignation.trim() || 'Representative',
        contactType,
        mobile: contactMobile.trim() || phone.trim(),
        email: contactEmail.trim() || email.trim(),
        whatsApp: contactWhatsApp.trim(),
        isPrimary: true
      }] : [];

      const initialBank = accountNumber.trim() ? [{
        id: `bnk-${Date.now()}`,
        bank: bankName,
        branch: branch.trim() || 'Main Branch',
        accountName: accountName.trim() || name.trim(),
        accountNumber: accountNumber.trim(),
        swift: swift.trim(),
        currency,
        isDefault: true,
        verificationStatus: 'Pending' as const
      }] : [];

      addSupplier({
        name: name.trim(),
        legalName: legalName.trim() || name.trim(),
        tradingName: tradingName.trim() || name.trim(),
        supplierType,
        categories: selectedCategories,
        status,
        registrationNumber: registrationNumber.trim(),
        businessRegistrationDate: businessRegistrationDate || undefined,
        tin: tin.trim(),
        vatNumber: isVatRegistered ? vatNumber.trim() : undefined,
        svatNumber: isVatRegistered ? svatNumber.trim() : undefined,
        isVatRegistered,
        address: address.trim(),
        city: city.trim(),
        province,
        country,
        postalCode: postalCode.trim(),
        phone: phone.trim(),
        email: email.trim(),
        website: website.trim(),
        notes: notes.trim(),
        contacts: primaryContact,
        bankAccounts: initialBank,
        documents: [],
        contracts: [],
        creditTerms: {
          creditPeriod,
          customPeriodDays: creditPeriod === 'Custom' ? customPeriodDays : undefined,
          paymentTerms: paymentTerms.trim(),
          currency,
          creditLimit: Number(creditLimit) || 0,
          advanceRequiredPercent: Number(advanceRequiredPercent) || 0,
          retentionPercent: Number(retentionPercent) || 0,
          earlyPaymentDiscountPercent: Number(earlyPaymentDiscountPercent) || 0,
          latePaymentTerms: latePaymentTerms.trim()
        }
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-950/80 border border-orange-800/80 flex items-center justify-center text-orange-400 font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {supplierToEdit ? `Edit Supplier Master: ${supplierToEdit.name}` : 'Register New Supplier / Vendor'}
              </h3>
              <p className="text-xs text-slate-400">
                Corporate master profile, statutory tax numbers, verified bank accounts & credit terms.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation Bar */}
        <div className="flex items-center gap-1 px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveStep('basic')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              activeStep === 'basic' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>1. Basic Info & Type</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('statutory')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              activeStep === 'statutory' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>2. Registration & Tax (TIN/VAT)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('contact')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              activeStep === 'contact' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>3. Address & Key Contacts</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('bank')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              activeStep === 'bank' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>4. Bank Settlement Account</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('credit')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              activeStep === 'credit' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>5. Credit & Payment Terms</span>
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* STEP 1: Basic Info & Type */}
          {activeStep === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Trading / Common Supplier Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Lanka ReadyMix (Pvt) Ltd"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Official Legal Name (for contracts & invoices)
                  </label>
                  <input
                    type="text"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="e.g. Lanka ReadyMix Concrete Industrial Solutions (Pvt) Ltd"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Supplier Type <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={supplierType}
                    onChange={(e) => setSupplierType(e.target.value as SupplierType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    {SUPPLIER_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Trading Name / Brand
                  </label>
                  <input
                    type="text"
                    value={tradingName}
                    onChange={(e) => setTradingName(e.target.value)}
                    placeholder="e.g. Lanka ReadyMix"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Supplier Master Status <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as SupplierStatus)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="Active">Active (Eligible for POs)</option>
                    <option value="Approved">Approved (Awaiting Activation)</option>
                    <option value="Pending Approval">Pending Approval (Under Review)</option>
                    <option value="Draft">Draft (Incomplete)</option>
                    <option value="Suspended">Suspended (Temporarily Frozen)</option>
                    <option value="Blocked">Blocked (Quality / Legal Dispute)</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Categories Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Supply Categories (Configurable)</span>
                  <span className="text-[10px] text-slate-500">Select all materials or services provided</span>
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800/80 max-h-40 overflow-y-auto">
                  {categories.map(cat => {
                    const isSelected = selectedCategories.includes(cat.name);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.name)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1 border ${
                          isSelected
                            ? 'bg-orange-600/30 border-orange-500 text-orange-200 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <Tag className="w-3 h-3" />
                        <span>{cat.name}</span>
                        <span className="text-[9px] opacity-60 ml-0.5">({cat.group})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  General Operational Notes & Capabilities
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key products, batching plants, batch testing certifications, emergency contacts..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Statutory & Tax */}
          {activeStep === 'statutory' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Business Registration Number (BR / ROC) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. PV-00192841"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Registration Date
                  </label>
                  <input
                    type="date"
                    value={businessRegistrationDate}
                    onChange={(e) => setBusinessRegistrationDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Value Added Tax (VAT) Registration</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isVatRegistered}
                      onChange={(e) => setIsVatRegistered(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span className="ml-2 text-xs font-semibold text-slate-300">
                      {isVatRegistered ? 'VAT Registered' : 'Non-VAT'}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Taxpayer Identification No (TIN)
                    </label>
                    <input
                      type="text"
                      value={tin}
                      onChange={(e) => setTin(e.target.value)}
                      placeholder="e.g. 209184201"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      VAT Registration Number
                    </label>
                    <input
                      type="text"
                      disabled={!isVatRegistered}
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                      placeholder="e.g. 109184201-7000"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-orange-500 disabled:opacity-40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      SVAT Registration Number
                    </label>
                    <input
                      type="text"
                      disabled={!isVatRegistered}
                      value={svatNumber}
                      onChange={(e) => setSvatNumber(e.target.value)}
                      placeholder="e.g. SVAT-00918"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-orange-500 disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Address & Contacts */}
          {activeStep === 'contact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Street Address / Site Yard / Plant
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="No. 42, Peliyagoda Industrial Zone"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Peliyagoda"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Province</label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    {PROVINCES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="11830"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              {/* Quick Communication */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Company Telephone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+94 11 291 4800"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Official Orders Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="orders@lankareadymix.lk"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Website</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://lankareadymix.lk"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Primary Contact Person Details */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-orange-400 block">
                  Primary Contact Person (Escalation / Account Manager)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Sunil Weerasinghe"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Designation</label>
                    <input
                      type="text"
                      value={contactDesignation}
                      onChange={(e) => setContactDesignation(e.target.value)}
                      placeholder="Commercial Director / Manager"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Role / Department</label>
                    <select
                      value={contactType}
                      onChange={(e) => setContactType(e.target.value as ContactDesignation)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      <option value="Main">Main Corporate</option>
                      <option value="Finance">Finance / Billing</option>
                      <option value="Sales">Sales / Orders</option>
                      <option value="Technical">Technical / Quality</option>
                      <option value="Site">Site / Dispatch</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Mobile</label>
                    <input
                      type="text"
                      value={contactMobile}
                      onChange={(e) => setContactMobile(e.target.value)}
                      placeholder="+94 77 234 5678"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="sunil.w@lankareadymix.lk"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={contactWhatsApp}
                      onChange={(e) => setContactWhatsApp(e.target.value)}
                      placeholder="+94772345678"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Bank Details */}
          {activeStep === 'bank' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-emerald-400" />
                    Default Bank Settlement Account
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                    Electronic Fund Transfers (SLIPS/CEFT)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Bank Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      list="registered-banks-list"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Commercial Bank of Ceylon"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                    <datalist id="registered-banks-list">
                      {registeredBanks.map(b => (
                        <option key={b.id} value={b.bankName} />
                      ))}
                      <option value="Commercial Bank of Ceylon" />
                      <option value="Bank of Ceylon" />
                      <option value="Hatton National Bank" />
                      <option value="Sampath Bank PLC" />
                      <option value="People’s Bank" />
                      <option value="Nations Trust Bank" />
                      <option value="Seylan Bank PLC" />
                      <option value="National Development Bank" />
                      <option value="Standard Chartered Bank" />
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Branch Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="Peliyagoda Branch"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Account Title / Beneficiary Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Lanka ReadyMix (Pvt) Ltd"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Account Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="100084920194"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500 font-mono tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">SWIFT Code / BIC</label>
                    <input
                      type="text"
                      value={swift}
                      onChange={(e) => setSwift(e.target.value)}
                      placeholder="CCEYLKIX"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Settlement Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      <option value="LKR">LKR (Sri Lankan Rupee)</option>
                      <option value="USD">USD (United States Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                    </select>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Note: Multiple bank accounts can be added and verified under the Supplier 360 Detail View once registered.
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: Credit & Payment Terms */}
          {activeStep === 'credit' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Credit Period <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={creditPeriod}
                    onChange={(e) => setCreditPeriod(e.target.value as CreditPeriod)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    {CREDIT_PERIODS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {creditPeriod === 'Custom' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Custom Period (Days)</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={customPeriodDays}
                      onChange={(e) => setCustomPeriodDays(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Approved Credit Limit (LKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100000}
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Standard Contractual Payment Terms
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="e.g. Net 30 with 2% Early Payment Discount if settled within 10 days"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Advance Payment Required %
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={advanceRequiredPercent}
                      onChange={(e) => setAdvanceRequiredPercent(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500 pr-8 font-mono"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Retention Deduction %
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={retentionPercent}
                      onChange={(e) => setRetentionPercent(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500 pr-8 font-mono"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Early Payment Discount %
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      value={earlyPaymentDiscountPercent}
                      onChange={(e) => setEarlyPaymentDiscountPercent(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500 pr-8 font-mono"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">%</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Late Payment Penalty / Terms
                </label>
                <input
                  type="text"
                  value={latePaymentTerms}
                  onChange={(e) => setLatePaymentTerms(e.target.value)}
                  placeholder="e.g. 1.5% interest per month for invoices unpaid past 45 days"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeStep !== 'basic' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeStep === 'credit') setActiveStep('bank');
                    else if (activeStep === 'bank') setActiveStep('contact');
                    else if (activeStep === 'contact') setActiveStep('statutory');
                    else if (activeStep === 'statutory') setActiveStep('basic');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  Previous Step
                </button>
              )}
              {activeStep !== 'credit' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeStep === 'basic') setActiveStep('statutory');
                    else if (activeStep === 'statutory') setActiveStep('contact');
                    else if (activeStep === 'contact') setActiveStep('bank');
                    else if (activeStep === 'bank') setActiveStep('credit');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
                >
                  Next Step
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{supplierToEdit ? 'Save Changes' : 'Register Supplier'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
