import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Building,
  DollarSign,
  FileText,
  AlertCircle,
  Briefcase,
  Building2,
  Sparkles,
  Lock,
  CheckCircle2,
  Landmark,
  Percent,
  Clock,
  ShieldCheck
} from 'lucide-react';
import {
  Quotation,
  QuotationItem,
  QuotationType,
  QuotationClientSnapshot
} from '../../types/quotationTypes';
import { useQuotation } from '../../context/QuotationContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { useEnterpriseCompany } from '../../context/EnterpriseCompanyContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { useEnterpriseBanking } from '../../context/EnterpriseBankingContext';
import {
  calculateQuotationTotals,
  amountToWordsLKR,
  generateQuotationNumber
} from '../../utils/quotationUtils';
import { InvoiceBankDetails } from '../../types/taxInvoiceTypes';

interface CreateQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  editQuotation?: Quotation | null;
  initialType?: QuotationType;
}

export const CreateQuotationModal: React.FC<CreateQuotationModalProps> = ({
  isOpen,
  onClose,
  editQuotation,
  initialType = 'QUOTATION'
}) => {
  const { settings, createQuotation, updateQuotation } = useQuotation();
  const { currentUser } = useEnterprise();
  const { clients } = useEnterpriseCompany();
  const { projects } = usePettyCash();
  const { accounts } = useEnterpriseBanking();

  const today = new Date().toISOString().split('T')[0];

  // Document Type: Quotation or Estimate
  const [documentType, setDocumentType] = useState<QuotationType>(() => {
    return editQuotation?.documentType || initialType;
  });

  // Dates & Validity
  const [quotationDate, setQuotationDate] = useState(today);
  const [validityDays, setValidityDays] = useState<number>(settings.defaultValidityDays || 30);
  const [expectedStartDate, setExpectedStartDate] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('45 Calendar Days');

  // Client Selection
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientName, setClientName] = useState('Colombo Port City Development Authority');
  const [clientTin, setClientTin] = useState('204918274');
  const [clientVatNumber, setClientVatNumber] = useState('204918274-7000');
  const [clientAddress, setClientAddress] = useState('Block A, Port City Boulevard, Colombo 01');
  const [clientContactPerson, setClientContactPerson] = useState('Eng. K. Wickramasinghe');
  const [clientPhone, setClientPhone] = useState('+94 11 755 4000');
  const [clientEmail, setClientEmail] = useState('procurement@portcity.lk');

  // Project Association (Commercial reference only)
  const [projectCode, setProjectCode] = useState('PRJ-PORT-01');
  const [projectName, setProjectName] = useState('Colombo Port Expansion Phase II');
  const [scopeOfWork, setScopeOfWork] = useState('Deep Water Quay Wall & Bored Piling Works');
  const [tenderRef, setTenderRef] = useState('CPCDA/ENG/2026/08');
  const [rfqNumber, setRfqNumber] = useState('RFQ-PORT-2026-88');

  // Bank details
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>(() => {
    return editQuotation?.bankAccountId || accounts.find(a => a.isPrimary)?.id || accounts[0]?.id || '';
  });

  // Line items
  const [lineItems, setLineItems] = useState<QuotationItem[]>([
    {
      id: 'item-1',
      itemNumber: 1,
      description: 'Deep Water Quay Wall Concrete Casting - High Strength Marine Grade C40/50',
      unitOfMeasure: 'm³',
      quantity: 350,
      unitPrice: 18500,
      discountPercent: 2,
      discountAmount: 129500,
      taxableValue: 6345500,
      vatRate: 18,
      vatAmount: 1142190,
      totalAmount: 7487690
    }
  ]);

  // Commercial terms
  const [paymentTerms, setPaymentTerms] = useState(settings.defaultPaymentTerms);
  const [deliveryTerms, setDeliveryTerms] = useState(settings.defaultDeliveryTerms);
  const [warrantyPeriod, setWarrantyPeriod] = useState(settings.defaultWarranty);
  const [exclusions, setExclusions] = useState(settings.defaultExclusions);
  const [termsAndConditions, setTermsAndConditions] = useState(settings.defaultTermsAndConditions);
  const [notes, setNotes] = useState('');

  // Synchronize if editing existing quotation
  useEffect(() => {
    if (editQuotation) {
      setDocumentType(editQuotation.documentType);
      setQuotationDate(editQuotation.quotationDate);
      setValidityDays(editQuotation.validityDays);
      setExpectedStartDate(editQuotation.expectedStartDate || '');
      setEstimatedDuration(editQuotation.estimatedDuration || '');
      setSelectedClientId(editQuotation.clientId || '');
      setClientName(editQuotation.clientName);
      setClientTin(editQuotation.clientTin || '');
      setClientVatNumber(editQuotation.clientVatNumber || '');
      setClientAddress(editQuotation.clientAddress || '');
      setClientContactPerson(editQuotation.clientContactPerson || '');
      setClientPhone(editQuotation.clientPhone || '');
      setClientEmail(editQuotation.clientEmail || '');
      setProjectCode(editQuotation.projectCode || '');
      setProjectName(editQuotation.projectName || '');
      setScopeOfWork(editQuotation.scopeOfWork || '');
      setTenderRef(editQuotation.tenderRef || '');
      setRfqNumber(editQuotation.rfqNumber || '');
      setLineItems(editQuotation.lineItems);
      setPaymentTerms(editQuotation.paymentTerms);
      setDeliveryTerms(editQuotation.deliveryTerms || '');
      setWarrantyPeriod(editQuotation.warrantyPeriod || '');
      setExclusions(editQuotation.exclusions || '');
      setTermsAndConditions(editQuotation.termsAndConditions || '');
      setNotes(editQuotation.notes || '');
      if (editQuotation.bankAccountId) {
        setSelectedBankAccountId(editQuotation.bankAccountId);
      }
    } else {
      setDocumentType(initialType);
    }
  }, [editQuotation, initialType]);

  // Bank resolution
  const selectedAccount = useMemo(() => {
    return accounts.find(a => a.id === selectedBankAccountId) || accounts.find(a => a.isPrimary) || accounts[0];
  }, [accounts, selectedBankAccountId]);

  const resolvedBankDetails: InvoiceBankDetails | undefined = useMemo(() => {
    if (!selectedAccount) return undefined;
    return {
      bankAccountId: selectedAccount.id,
      accountName: selectedAccount.accountName,
      bankName: selectedAccount.bank,
      branchName: selectedAccount.branch,
      accountNumber: selectedAccount.accountNumber,
      swiftCode: selectedAccount.swift,
      currency: selectedAccount.currency,
      purpose: selectedAccount.purpose,
      isPrimary: selectedAccount.isPrimary
    };
  }, [selectedAccount]);

  // Handle Client Selection & Snapshotting
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const invData = client.taxInvoiceMasterData;
    const taxData = client.taxDetails;
    const primContact = client.primaryContact;
    const billAddr = client.billingAddress;
    const regAddr = client.registeredAddress;

    const resolvedName = invData?.displayName || client.name || '';
    const resolvedTin = invData?.tin || taxData?.tin || '';
    const resolvedVat = invData?.vatNumber || taxData?.vatNumber || '';

    let resolvedAddress = '';
    const activeAddr = (billAddr && !billAddr.sameAsRegistered && (billAddr.line1 || billAddr.city)) ? billAddr : regAddr;
    if (activeAddr) {
      const parts = [
        activeAddr.line1,
        activeAddr.line2,
        activeAddr.city,
        activeAddr.district,
        activeAddr.province,
        activeAddr.postalCode,
        activeAddr.country
      ].map(p => p?.trim()).filter(Boolean);
      if (parts.length > 0) {
        resolvedAddress = parts.join(', ');
      }
    }
    if (!resolvedAddress && invData?.address) {
      resolvedAddress = invData.address.replace(/^[,\s]+/, '').trim();
    }
    if (!resolvedAddress && client.address) {
      resolvedAddress = client.address.replace(/^[,\s]+/, '').trim();
    }

    const resolvedContact = invData?.contactPerson || primContact?.name || client.contactPerson || '';
    const resolvedPhone = invData?.telephone || primContact?.telephone || primContact?.mobile || client.phone || '';
    const resolvedEmail = invData?.email || taxData?.invoiceEmail || primContact?.email || client.email || '';

    setClientName(resolvedName);
    setClientTin(resolvedTin);
    setClientVatNumber(resolvedVat);
    setClientAddress(resolvedAddress);
    setClientContactPerson(resolvedContact);
    setClientPhone(resolvedPhone);
    setClientEmail(resolvedEmail);

    if (client.assignedProjectIds && client.assignedProjectIds.length > 0) {
      const matched = projects.find(
        p => client.assignedProjectIds?.includes(p.PROJECT_CODE) || client.assignedProjectIds?.includes(p.id)
      );
      if (matched) {
        setProjectCode(matched.PROJECT_CODE);
        setProjectName(matched.PROJECT_NAME);
      }
    }
  };

  // Live preview number
  const liveNumber = useMemo(() => {
    if (editQuotation) return editQuotation.quotationNumber;
    const seq = documentType === 'QUOTATION' ? settings.nextQuotationSequence : settings.nextEstimateSequence;
    const prefix = documentType === 'QUOTATION' ? settings.quotationPrefix : settings.estimatePrefix;
    return generateQuotationNumber(documentType, quotationDate, seq, prefix);
  }, [documentType, quotationDate, settings, editQuotation]);

  // Valid Until Date calculation
  const validUntilDate = useMemo(() => {
    const d = new Date(quotationDate);
    if (isNaN(d.getTime())) return quotationDate;
    return new Date(d.getTime() + (validityDays || 30) * 86400000).toISOString().split('T')[0];
  }, [quotationDate, validityDays]);

  // Financial Totals
  const totals = useMemo(() => {
    return calculateQuotationTotals(lineItems, settings.standardVatRate);
  }, [lineItems, settings.standardVatRate]);

  const amountInWords = useMemo(() => {
    return amountToWordsLKR(totals.totalAmount);
  }, [totals.totalAmount]);

  if (!isOpen) return null;

  // Row Manipulation
  const handleAddItem = () => {
    const newItem: QuotationItem = {
      id: `item-${Date.now()}`,
      itemNumber: lineItems.length + 1,
      description: '',
      unitOfMeasure: 'Nos',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      discountAmount: 0,
      taxableValue: 0,
      vatRate: settings.standardVatRate,
      vatAmount: 0,
      totalAmount: 0
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleUpdateItem = (index: number, updates: Partial<QuotationItem>) => {
    const updated = [...lineItems];
    const current = { ...updated[index], ...updates };

    const qty = Number(current.quantity) || 0;
    const price = Number(current.unitPrice) || 0;
    const subtotal = Math.round(qty * price * 100) / 100;

    let discount = 0;
    if (current.discountPercent !== undefined && current.discountPercent > 0) {
      discount = Math.round(subtotal * (Number(current.discountPercent) / 100) * 100) / 100;
    } else if (current.discountAmount !== undefined && current.discountAmount > 0) {
      discount = Math.round(Number(current.discountAmount) * 100) / 100;
    }

    const taxableValue = Math.max(0, Math.round((subtotal - discount) * 100) / 100);
    const rate = current.vatRate !== undefined ? Number(current.vatRate) : settings.standardVatRate;
    const vat = Math.round(taxableValue * (rate / 100) * 100) / 100;
    const total = Math.round((taxableValue + vat) * 100) / 100;

    updated[index] = {
      ...current,
      discountAmount: discount,
      taxableValue,
      vatRate: rate,
      vatAmount: vat,
      totalAmount: total
    };
    setLineItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (lineItems.length <= 1) {
      alert('Quotation must contain at least one line item.');
      return;
    }
    const updated = lineItems.filter((_, i) => i !== index).map((item, idx) => ({
      ...item,
      itemNumber: idx + 1
    }));
    setLineItems(updated);
  };

  // Save Handler
  const handleSave = (markSentImmediately = false) => {
    if (!clientName.trim()) {
      alert('Client legal name is required.');
      return;
    }
    if (lineItems.some(i => !i.description.trim() || i.quantity <= 0 || i.unitPrice <= 0)) {
      alert('Please fill in valid descriptions, quantities, and unit rates for all line items.');
      return;
    }

    const selectedClient = clients.find(c => c.id === selectedClientId);
    const now = new Date().toISOString();

    const clientSnapshot: QuotationClientSnapshot = selectedClient
      ? {
          clientId: selectedClient.id,
          clientCode: selectedClient.clientCode,
          organizationType: selectedClient.organizationType,
          legalName: selectedClient.name,
          tradeName: selectedClient.shortName,
          tin: clientTin,
          vatNumber: clientVatNumber || undefined,
          svatNumber: selectedClient.taxDetails?.svatNumber,
          isVatRegistered: Boolean(clientVatNumber || selectedClient.taxDetails?.isVatRegistered),
          registeredAddress: clientAddress,
          billingAddress: selectedClient.billingAddress
            ? `${selectedClient.billingAddress.line1}, ${selectedClient.billingAddress.city || ''}`
            : undefined,
          contactPerson: clientContactPerson || undefined,
          contactDesignation: selectedClient.primaryContact?.designation,
          contactDepartment: selectedClient.primaryContact?.department,
          phone: clientPhone || undefined,
          email: clientEmail || undefined,
          paymentTermsDays: selectedClient.taxDetails?.defaultPaymentTermsDays || 30,
          capturedAt: now
        }
      : {
          legalName: clientName,
          tin: clientTin,
          vatNumber: clientVatNumber || undefined,
          isVatRegistered: Boolean(clientVatNumber),
          registeredAddress: clientAddress,
          contactPerson: clientContactPerson || undefined,
          phone: clientPhone || undefined,
          email: clientEmail || undefined,
          capturedAt: now
        };

    const status = markSentImmediately ? 'SENT' : editQuotation?.status || 'DRAFT';

    if (editQuotation) {
      updateQuotation(editQuotation.id, {
        documentType,
        quotationDate,
        validUntilDate,
        validityDays,
        expectedStartDate: expectedStartDate || undefined,
        estimatedDuration: estimatedDuration || undefined,
        clientId: selectedClientId || undefined,
        clientSnapshot,
        clientName,
        clientTin,
        clientVatNumber,
        clientAddress,
        clientContactPerson,
        clientPhone,
        clientEmail,
        projectCode,
        projectName,
        scopeOfWork,
        tenderRef,
        rfqNumber,
        lineItems,
        paymentTerms,
        deliveryTerms,
        warrantyPeriod,
        exclusions,
        termsAndConditions,
        notes,
        bankAccountId: selectedAccount?.id,
        settlementBankDetails: resolvedBankDetails,
        status
      });
    } else {
      createQuotation({
        documentType,
        quotationDate,
        validUntilDate,
        validityDays,
        expectedStartDate: expectedStartDate || undefined,
        estimatedDuration: estimatedDuration || undefined,
        clientId: selectedClientId || undefined,
        clientSnapshot,
        clientName,
        clientTin,
        clientVatNumber,
        clientAddress,
        clientContactPerson,
        clientPhone,
        clientEmail,
        projectCode,
        projectName,
        scopeOfWork,
        tenderRef,
        rfqNumber,
        lineItems,
        paymentTerms,
        deliveryTerms,
        warrantyPeriod,
        exclusions,
        termsAndConditions,
        notes,
        bankAccountId: selectedAccount?.id,
        settlementBankDetails: resolvedBankDetails,
        status,
        preparedBy: currentUser || 'Estimating Lead'
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${documentType === 'QUOTATION' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  {editQuotation ? `Edit ${documentType === 'QUOTATION' ? 'Quotation' : 'Estimate'}` : `Create New ${documentType === 'QUOTATION' ? 'Commercial Quotation' : 'Cost Estimate'}`}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {liveNumber}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800/80">
                  {editQuotation?.revision?.revisionLabel || 'Rev.00'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Commercial estimation document • Independent sales module strictly unlinked to expenses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Document Type Selector */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setDocumentType('QUOTATION')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${documentType === 'QUOTATION' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Quotation (QT)
              </button>
              <button
                type="button"
                onClick={() => setDocumentType('ESTIMATE')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${documentType === 'ESTIMATE' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Estimate (EST)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Section 1: Dates, Validity & Project Reference */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Document Offer Date
              </label>
              <input
                type="date"
                value={quotationDate}
                onChange={e => setQuotationDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Validity Duration
              </label>
              <div className="flex gap-2">
                <select
                  value={validityDays}
                  onChange={e => setValidityDays(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value={15}>15 Days</option>
                  <option value={30}>30 Days (Standard)</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={120}>120 Days</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Valid Until (Auto-calculated)
              </label>
              <input
                type="date"
                value={validUntilDate}
                disabled
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-amber-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Estimated Timeline / Duration
              </label>
              <input
                type="text"
                placeholder="e.g. 45 Working Days"
                value={estimatedDuration}
                onChange={e => setEstimatedDuration(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Section 2: Client Details with Master Data Snapshots */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                <Building className="w-4 h-4 text-cyan-400" />
                <span>Client & Purchaser Information (Saved as Historical Snapshot)</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-400">Select Client Master:</label>
                <select
                  value={selectedClientId}
                  onChange={e => handleClientSelect(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Choose from Registered Clients --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.clientCode ? `(${c.clientCode})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Client / Purchaser Legal Name *
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="e.g. Colombo Port City Development Authority"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Client Taxpayer TIN
                </label>
                <input
                  type="text"
                  value={clientTin}
                  onChange={e => setClientTin(e.target.value)}
                  placeholder="e.g. 204918274"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Client VAT Registration No.
                </label>
                <input
                  type="text"
                  value={clientVatNumber}
                  onChange={e => setClientVatNumber(e.target.value)}
                  placeholder="e.g. 204918274-7000 (if VAT registered)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Official Registered / Billing Address
                </label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={e => setClientAddress(e.target.value)}
                  placeholder="e.g. Block A, Port City Boulevard, Colombo 01"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Attention (Contact Person)
                </label>
                <input
                  type="text"
                  value={clientContactPerson}
                  onChange={e => setClientContactPerson(e.target.value)}
                  placeholder="e.g. Eng. K. Wickramasinghe"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  placeholder="+94 11 755 4000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  placeholder="procurement@portcity.lk"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Project & Tender Association (Commercial Reference Only) */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs pb-2 border-b border-slate-800">
              <Briefcase className="w-4 h-4 text-purple-400" />
              <span>Project Association &amp; Tender Reference (Sales Tracking Only)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Project Code
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={projectCode}
                    onChange={e => setProjectCode(e.target.value)}
                    placeholder="e.g. PRJ-PORT-01"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-purple-300 font-mono focus:outline-none focus:border-purple-500"
                  />
                  <select
                    onChange={e => {
                      const found = projects.find(p => p.PROJECT_CODE === e.target.value);
                      if (found) {
                        setProjectCode(found.PROJECT_CODE);
                        setProjectName(found.PROJECT_NAME);
                      }
                    }}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 text-slate-300"
                    title="Quick choose project"
                  >
                    <option value="">▼</option>
                    {projects.map(p => (
                      <option key={p.id || p.PROJECT_CODE} value={p.PROJECT_CODE}>
                        {p.PROJECT_CODE} - {p.PROJECT_NAME}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Project / Works Title
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="e.g. Colombo Port Expansion Phase II"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Tender / RFQ Reference
                </label>
                <input
                  type="text"
                  value={tenderRef}
                  onChange={e => setTenderRef(e.target.value)}
                  placeholder="e.g. CPCDA/ENG/2026/08"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Scope of Work Summary
                </label>
                <input
                  type="text"
                  value={scopeOfWork}
                  onChange={e => setScopeOfWork(e.target.value)}
                  placeholder="e.g. Breakwater Core Armor Rock Placement and Bored Piling Reinforcement Package C"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Line Items Table & Pricing */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Line Items &amp; Commercial Pricing Schedule</span>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 bg-slate-900/60">
                    <th className="py-2.5 px-2 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Item Description / Specification *</th>
                    <th className="py-2.5 px-2 w-20 text-center">Unit</th>
                    <th className="py-2.5 px-2 w-24 text-right">Quantity</th>
                    <th className="py-2.5 px-2 w-28 text-right">Unit Rate (LKR)</th>
                    <th className="py-2.5 px-2 w-24 text-center">Disc. %</th>
                    <th className="py-2.5 px-3 w-32 text-right">Taxable (LKR)</th>
                    <th className="py-2.5 px-2 w-20 text-center">VAT %</th>
                    <th className="py-2.5 px-3 w-32 text-right">Total (LKR)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {lineItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-2 text-center font-mono text-slate-400">
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="py-2.5 px-3">
                        <textarea
                          rows={2}
                          value={item.description}
                          onChange={e => handleUpdateItem(index, { description: e.target.value })}
                          placeholder="Detailed engineering / commercial specification..."
                          className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 resize-none"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <select
                          value={item.unitOfMeasure || 'Nos'}
                          onChange={e => handleUpdateItem(index, { unitOfMeasure: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded px-1.5 py-1.5 text-slate-200 text-xs focus:outline-none"
                        >
                          <option value="Nos">Nos</option>
                          <option value="m³">m³</option>
                          <option value="m²">m²</option>
                          <option value="m">m</option>
                          <option value="MT">MT</option>
                          <option value="Hours">Hours</option>
                          <option value="Days">Days</option>
                          <option value="Trips">Trips</option>
                          <option value="Lots">Lot / Lump Sum</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.quantity}
                          onChange={e => handleUpdateItem(index, { quantity: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1.5 text-right text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unitPrice}
                          onChange={e => handleUpdateItem(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1.5 text-right text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          value={item.discountPercent || 0}
                          onChange={e => handleUpdateItem(index, { discountPercent: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded px-1.5 py-1.5 text-center text-amber-300 font-mono text-xs focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-200 font-semibold">
                        {item.taxableValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-2">
                        <select
                          value={item.vatRate}
                          onChange={e => handleUpdateItem(index, { vatRate: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded px-1.5 py-1.5 text-center text-slate-200 text-xs focus:outline-none"
                        >
                          <option value={18}>18%</option>
                          <option value={0}>0% (Exempt)</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-cyan-300 font-bold">
                        {item.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                          title="Remove line item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Calculation Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
              <div className="space-y-2 text-slate-300">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Amount in Formal Words
                </span>
                <p className="font-serif italic text-xs text-amber-200/90 bg-slate-900/80 p-3 rounded-lg border border-slate-800 leading-relaxed">
                  "{amountInWords}"
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Standard 18% Output VAT calculated per Inland Revenue statutory schedules.</span>
                </div>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Gross Subtotal (Excl. VAT):</span>
                  <span className="font-mono text-slate-200 font-semibold">
                    LKR {totals.subtotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {totals.totalDiscountAmount > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>Total Discount Allowed:</span>
                    <span className="font-mono font-semibold">
                      - LKR {totals.totalDiscountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-1.5">
                  <span>Net Taxable Base Value:</span>
                  <span className="font-mono text-slate-100 font-bold">
                    LKR {totals.taxableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Value Added Tax (Output VAT @ 18%):</span>
                  <span className="font-mono text-rose-400 font-semibold">
                    LKR {totals.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="border-t-2 border-slate-700 pt-2 flex justify-between text-base font-bold text-slate-100">
                  <span>Total Commercial Consideration:</span>
                  <span className="font-mono text-cyan-400 text-lg">
                    LKR {totals.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Commercial Conditions, Terms & Remittance */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs pb-2 border-b border-slate-800">
              <Landmark className="w-4 h-4 text-blue-400" />
              <span>Commercial Terms, Warranties &amp; Settlement Bank Remittance</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Payment Milestones &amp; Terms
                </label>
                <textarea
                  rows={2}
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Delivery / Mobilization Terms
                </label>
                <textarea
                  rows={2}
                  value={deliveryTerms}
                  onChange={e => setDeliveryTerms(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Warranty &amp; Defects Liability Period (DLP)
                </label>
                <input
                  type="text"
                  value={warrantyPeriod}
                  onChange={e => setWarrantyPeriod(e.target.value)}
                  placeholder="e.g. 12 Months Defects Liability Period (DLP)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Contractual Exclusions
                </label>
                <input
                  type="text"
                  value={exclusions}
                  onChange={e => setExclusions(e.target.value)}
                  placeholder="e.g. Statutory approval permits (by employer), power & water tariffs"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Settlement Bank Account (For Remittance upon Acceptance)
                </label>
                <select
                  value={selectedBankAccountId}
                  onChange={e => setSelectedBankAccountId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bank} • {acc.accountNumber} ({acc.accountName}) {acc.isPrimary ? '• [PRIMARY OPERATING]' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 font-semibold transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {editQuotation ? (
              <>
                {editQuotation.status === 'DRAFT' && (
                  <button
                    type="button"
                    onClick={() => handleSave(true)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all border border-slate-700 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>Save &amp; Mark as Sent</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-md shadow-cyan-950/60 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all border border-slate-700 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>Save as Draft</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-md shadow-cyan-950/60 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save &amp; Mark Sent</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
