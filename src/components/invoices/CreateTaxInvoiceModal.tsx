import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Building,
  DollarSign,
  ShieldCheck,
  FileText,
  AlertCircle,
  Briefcase,
  Building2,
  Sparkles,
  Lock,
  CheckCircle2,
  Landmark
} from 'lucide-react';
import { InvoiceSupplyItem, TaxInvoice, InvoiceBankDetails } from '../../types/taxInvoiceTypes';
import { useTaxInvoice } from '../../context/TaxInvoiceContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { useEnterpriseCompany } from '../../context/EnterpriseCompanyContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { useEnterpriseBanking } from '../../context/EnterpriseBankingContext';
import {
  calculateTaxInvoiceTotals,
  amountToWordsLKR,
  generateTaxInvoiceSerialNumber
} from '../../utils/taxInvoiceUtils';
import { PurchaserSnapshot } from '../../types/taxInvoiceTypes';

interface CreateTaxInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editInvoice?: TaxInvoice | null;
}

export const CreateTaxInvoiceModal: React.FC<CreateTaxInvoiceModalProps> = ({ isOpen, onClose, editInvoice }) => {
  const { settings, createInvoice } = useTaxInvoice();
  const { currentUser } = useEnterprise();
  const { clients, profile } = useEnterpriseCompany();
  const { projects } = usePettyCash();
  const { accounts } = useEnterpriseBanking();

  const today = new Date().toISOString().split('T')[0];
  const inThirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const [invoiceDate, setInvoiceDate] = useState(today);
  const [supplyDate, setSupplyDate] = useState(today);
  const [dueDate, setDueDate] = useState(inThirtyDays);

  // Settlement Bank Account selection from registered bank accounts
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>(() => {
    return editInvoice?.bankAccountId || editInvoice?.settlementBankDetails?.bankAccountId || accounts.find(a => a.isPrimary)?.id || accounts[0]?.id || '';
  });

  useEffect(() => {
    if (editInvoice) {
      const accId = editInvoice.bankAccountId || editInvoice.settlementBankDetails?.bankAccountId || accounts.find(a => a.isPrimary)?.id || accounts[0]?.id || '';
      setSelectedBankAccountId(accId);
    } else if (!selectedBankAccountId && accounts.length > 0) {
      setSelectedBankAccountId(accounts.find(a => a.isPrimary)?.id || accounts[0]?.id || '');
    }
  }, [editInvoice, accounts]);

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

  // Selected Client from Master Data
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Purchaser Details
  const [purchaserName, setPurchaserName] = useState('Colombo Port City Development Authority');
  const [purchaserTin, setPurchaserTin] = useState('204918274');
  const [purchaserVatNumber, setPurchaserVatNumber] = useState('204918274-7000');
  const [purchaserAddress, setPurchaserAddress] = useState('Block A, Port City Boulevard, Colombo 01');
  const [purchaserContactPerson, setPurchaserContactPerson] = useState('Eng. K. Wickramasinghe');
  const [purchaserPhone, setPurchaserPhone] = useState('+94 11 755 4000');
  const [purchaserEmail, setPurchaserEmail] = useState('billing@portcity.lk');

  // Project Association
  const [projectCode, setProjectCode] = useState('PRJ-PORT-01');
  const [projectName, setProjectName] = useState('Colombo Port Expansion Phase II');
  const [ipcNumber, setIpcNumber] = useState('IPC-05');
  const [contractNumber, setContractNumber] = useState('CPCE-2025-C08');
  const [purchaseOrderRef, setPurchaseOrderRef] = useState('PO-CPCDA-9921');

  // Handle Client Selection from Master Data
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    // Prefer dedicated Tax Invoice Master Data, fallback to basic/tax details
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

    setPurchaserName(resolvedName);
    setPurchaserTin(resolvedTin);
    setPurchaserVatNumber(resolvedVat);
    setPurchaserAddress(resolvedAddress);
    setPurchaserContactPerson(resolvedContact);
    setPurchaserPhone(resolvedPhone);
    setPurchaserEmail(resolvedEmail);

    // Auto-populate Contract if client has one
    if (client.initialContract?.contractNumber) {
      setContractNumber(client.initialContract.contractNumber);
    }
    if (client.initialContract?.contractName) {
      setProjectName(client.initialContract.contractName);
    }
    if (client.initialContract?.employerReference) {
      setPurchaseOrderRef(client.initialContract.employerReference);
    }

    // Auto-calculate Due Date from client's payment terms
    const days = taxData?.defaultPaymentTermsDays || client.paymentTerms?.defaultPaymentTermsDays || 30;
    const invTime = new Date(invoiceDate).getTime();
    const calculatedDue = new Date(invTime + days * 86400000).toISOString().split('T')[0];
    setDueDate(calculatedDue);

    // Check if client has assigned projects
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

  // Line Items
  const [lineItems, setLineItems] = useState<InvoiceSupplyItem[]>([
    {
      id: 'item-1',
      itemNumber: 1,
      description: 'Breakwater Core Armor Rock Placement (3,500 MT)',
      unitOfMeasure: 'MT',
      quantity: 3500,
      unitPrice: 1850,
      taxableValue: 6475000,
      vatRate: 18,
      vatAmount: 1165500,
      totalAmount: 7640500
    }
  ]);

  const [notes, setNotes] = useState('Certified under Interim Payment Certificate No. 05.');

  // Live Serial Preview
  const liveSerial = useMemo(() => {
    return generateTaxInvoiceSerialNumber(invoiceDate, settings.entityCode, settings.currentSequence);
  }, [invoiceDate, settings.entityCode, settings.currentSequence]);

  // Financial Totals
  const totals = useMemo(() => {
    return calculateTaxInvoiceTotals(lineItems, settings.standardVatRate);
  }, [lineItems, settings.standardVatRate]);

  const amountInWords = useMemo(() => {
    return amountToWordsLKR(totals.totalConsideration);
  }, [totals.totalConsideration]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const newItem: InvoiceSupplyItem = {
      id: `item-${Date.now()}`,
      itemNumber: lineItems.length + 1,
      description: '',
      unitOfMeasure: 'Nos',
      quantity: 1,
      unitPrice: 0,
      taxableValue: 0,
      vatRate: settings.standardVatRate,
      vatAmount: 0,
      totalAmount: 0
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceSupplyItem, val: any) => {
    const updated = [...lineItems];
    const item = { ...updated[index], [field]: val };

    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(val) : item.quantity;
      const p = field === 'unitPrice' ? Number(val) : item.unitPrice;
      const taxable = Math.round(q * p * 100) / 100;
      const vat = Math.round(taxable * (item.vatRate / 100) * 100) / 100;
      item.taxableValue = taxable;
      item.vatAmount = vat;
      item.totalAmount = Math.round((taxable + vat) * 100) / 100;
    }

    updated[index] = item;
    setLineItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleSubmit = (isIssueImmediately: boolean) => {
    if (!purchaserName.trim()) {
      alert('Purchaser legal name is required.');
      return;
    }
    if (!purchaserTin.trim()) {
      alert('Purchaser Taxpayer Identification Number (TIN) is required under Gazette No. 2481/22.');
      return;
    }
    if (lineItems.some(i => !i.description.trim() || i.quantity <= 0 || i.unitPrice <= 0)) {
      alert('Please fill in complete descriptions, quantities, and unit prices for all line items.');
      return;
    }

    const selectedClient = clients.find(c => c.id === selectedClientId);
    const now = new Date().toISOString();
    const purchaserSnapshot: PurchaserSnapshot = selectedClient
      ? {
          clientId: selectedClient.id,
          clientCode: selectedClient.clientCode,
          organizationType: selectedClient.organizationType,
          legalName: selectedClient.name,
          tradeName: selectedClient.shortName,
          tin: purchaserTin,
          vatNumber: purchaserVatNumber || undefined,
          svatNumber: selectedClient.taxDetails?.svatNumber,
          isVatRegistered: Boolean(purchaserVatNumber || selectedClient.taxDetails?.isVatRegistered),
          registeredAddress: purchaserAddress,
          billingAddress: selectedClient.billingAddress
            ? `${selectedClient.billingAddress.line1}, ${selectedClient.billingAddress.city || ''}`
            : undefined,
          contactPerson: purchaserContactPerson || undefined,
          contactDesignation: selectedClient.primaryContact?.designation,
          contactDepartment: selectedClient.primaryContact?.department,
          phone: purchaserPhone || undefined,
          email: purchaserEmail || undefined,
          paymentTermsDays: selectedClient.taxDetails?.defaultPaymentTermsDays || 30,
          capturedAt: now
        }
      : {
          legalName: purchaserName,
          tin: purchaserTin,
          vatNumber: purchaserVatNumber || undefined,
          isVatRegistered: Boolean(purchaserVatNumber),
          registeredAddress: purchaserAddress,
          contactPerson: purchaserContactPerson || undefined,
          phone: purchaserPhone || undefined,
          email: purchaserEmail || undefined,
          capturedAt: now
        };

    createInvoice(
      {
        clientId: selectedClientId || undefined,
        purchaserSnapshot,
        invoiceDate,
        supplyDate,
        dueDate,
        purchaserName,
        purchaserTin,
        purchaserVatNumber,
        purchaserAddress,
        purchaserContactPerson,
        purchaserPhone,
        purchaserEmail,
        projectCode,
        projectName,
        ipcNumber,
        contractNumber,
        purchaseOrderRef,
        bankAccountId: selectedAccount?.id,
        settlementBankDetails: resolvedBankDetails,
        lineItems,
        notes
      },
      isIssueImmediately
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-300 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Create New Tax Invoice</h2>
              <p className="text-xs text-slate-400">
                Inland Revenue Department Gazette Extraordinary No. 2481/22 Compliant Supply Entry
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {/* Statutory Live Preview Banner */}
          <div className="p-4 bg-slate-950 rounded-xl border border-cyan-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                Statutory Gazette Section 60 Serial Number Preview
              </span>
              <span className="font-mono text-xl font-black text-cyan-300">
                {liveSerial}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Calculated strictly from invoice date: <strong className="text-white">{invoiceDate}</strong> • Entity: <strong className="text-white">{settings.entityCode}</strong> • Seq: <strong className="text-white">#{settings.currentSequence}</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">Total Consideration</span>
              <span className="text-lg font-mono font-bold text-emerald-400">
                LKR {totals.totalConsideration.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Section 1: Dates & Project Reference */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Invoice Date <span className="text-rose-400">* (Controls Serial YYMMM)</span>
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Supply Date / Milestone Period</label>
              <input
                type="date"
                value={supplyDate}
                onChange={e => setSupplyDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          {/* Service Provider (Issuer) - Corporate Identity */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-emerald-900/40 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                  Service Provider (Issuer) - Corporate Identity
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-medium">
                <Lock className="w-3 h-3" />
                <span>Locked to Corporate Identity Master</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <div className="md:col-span-2">
                <span className="text-[10px] text-slate-400 block">Legal Entity Name</span>
                <span className="font-bold text-slate-100">{profile.legalName}</span>
                <span className="text-slate-400 text-[11px] block mt-0.5">
                  {profile.registeredAddress || 'No. 45, Alfred House Gardens, Colombo 03, Sri Lanka'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">Tax & Compliance Registrations</span>
                <span className="font-mono text-emerald-400 font-semibold block">
                  TIN: {profile.tinNumber || '102948571'}
                </span>
                <span className="font-mono text-slate-300 text-[11px] block">
                  VAT: {profile.vatNumber || '102948571-7000'}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              Notice: Service Provider identity is legally governed by the Enterprise Corporate Profile and cannot be altered per invoice.
            </p>
          </div>

          {/* Section 2: Purchaser / Client Details */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-cyan-400" />
                  Purchaser Information (Client Master Data)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Populate directly from Client Master Registry or customize for this specific supply entry
                </p>
              </div>

              {/* Client Master Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">
                  Load Registered Client:
                </span>
                <select
                  value={selectedClientId}
                  onChange={e => handleClientSelect(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-cyan-800/60 text-cyan-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-cyan-400"
                >
                  <option value="">-- Choose Client / Employer --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.clientCode || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedClientId && (
              <div className="p-2.5 bg-cyan-950/30 border border-cyan-800/40 rounded-lg flex items-center justify-between text-xs text-cyan-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    Linked to Client Master Record. Changes to this invoice will snapshot client data without altering master records.
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => handleClientSelect(selectedClientId)}
                  className="px-2 py-1 bg-cyan-900/60 hover:bg-cyan-850 text-[11px] font-semibold rounded border border-cyan-700/50"
                  title="Re-populate fields from client master"
                >
                  Re-sync Master
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-slate-400 mb-1 font-semibold">Purchaser Legal Name *</label>
                <input
                  type="text"
                  value={purchaserName}
                  onChange={e => setPurchaserName(e.target.value)}
                  placeholder="e.g. Colombo Port City Development Authority"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Purchaser TIN * (Gazette Mandatory)</label>
                <input
                  type="text"
                  value={purchaserTin}
                  onChange={e => setPurchaserTin(e.target.value)}
                  placeholder="e.g. 204918274"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-slate-400 mb-1 font-semibold">Registered Office Address *</label>
                <input
                  type="text"
                  value={purchaserAddress}
                  onChange={e => setPurchaserAddress(e.target.value)}
                  placeholder="Delivery / Registered street address"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Purchaser VAT Registration No.</label>
                <input
                  type="text"
                  value={purchaserVatNumber}
                  onChange={e => setPurchaserVatNumber(e.target.value)}
                  placeholder="e.g. 204918274-7000"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={purchaserContactPerson}
                  onChange={e => setPurchaserContactPerson(e.target.value)}
                  placeholder="Eng. K. Wickramasinghe"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Phone</label>
                <input
                  type="text"
                  value={purchaserPhone}
                  onChange={e => setPurchaserPhone(e.target.value)}
                  placeholder="+94 11 755 4000"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={purchaserEmail}
                  onChange={e => setPurchaserEmail(e.target.value)}
                  placeholder="billing@portcity.lk"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Project Association */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
                Project & Contract Association
              </h3>
              {projects.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-semibold">Load Active ERP Project:</span>
                  <select
                    onChange={e => {
                      const p = projects.find(proj => proj.PROJECT_CODE === e.target.value);
                      if (p) {
                        setProjectCode(p.PROJECT_CODE);
                        setProjectName(p.PROJECT_NAME);
                      }
                    }}
                    defaultValue=""
                    className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg outline-none focus:border-cyan-500"
                  >
                    <option value="" disabled>-- Select Project --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.PROJECT_CODE}>
                        {p.PROJECT_CODE} - {p.PROJECT_NAME}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Project Code</label>
                <input
                  type="text"
                  value={projectCode}
                  onChange={e => setProjectCode(e.target.value)}
                  placeholder="PRJ-PORT-01"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="Colombo Port Expansion"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">IPC / Milestone Ref</label>
                <input
                  type="text"
                  value={ipcNumber}
                  onChange={e => setIpcNumber(e.target.value)}
                  placeholder="IPC-05"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">PO / Contract Ref</label>
                <input
                  type="text"
                  value={purchaseOrderRef}
                  onChange={e => setPurchaseOrderRef(e.target.value)}
                  placeholder="PO-CPCDA-9921"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Settlement Bank Details (Registered Bank Accounts) */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-cyan-950/80 border border-cyan-800 text-cyan-400 flex items-center justify-center">
                  <Landmark className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                    Settlement Bank Account
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Direct remittances to registered enterprise company bank account
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">Select Account:</span>
                <select
                  id="create-invoice-bank-select"
                  value={selectedBankAccountId}
                  onChange={e => setSelectedBankAccountId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 hover:border-cyan-500 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-xs text-cyan-200 font-semibold outline-none cursor-pointer"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bank} • {acc.branch} ({acc.accountNumber}) {acc.isPrimary ? '★ Primary' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedAccount && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Account Name</span>
                  <span className="text-white font-semibold truncate block mt-0.5" title={selectedAccount.accountName}>
                    {selectedAccount.accountName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Bank &amp; Branch</span>
                  <span className="text-white font-semibold block mt-0.5">
                    {selectedAccount.bank}
                  </span>
                  <span className="text-slate-400 text-[11px]">{selectedAccount.branch}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Account Number &amp; SWIFT</span>
                  <span className="font-mono text-cyan-300 font-bold block mt-0.5">
                    {selectedAccount.accountNumber}
                  </span>
                  <span className="text-slate-400 text-[10.5px] font-mono">SWIFT: {selectedAccount.swift}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Currency &amp; Purpose</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="bg-slate-800 text-slate-200 font-mono text-[10.5px] px-1.5 py-0.5 rounded font-bold">
                      {selectedAccount.currency}
                    </span>
                    {selectedAccount.isPrimary && (
                      <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                        Primary
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 text-[10.5px] block truncate mt-1" title={selectedAccount.purpose}>
                    {selectedAccount.purpose}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
                Taxable Supply Line Items (Standard 18% VAT)
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="py-2 px-3 w-8">#</th>
                    <th className="py-2 px-3">Description of Taxable Works</th>
                    <th className="py-2 px-3 w-16">Unit</th>
                    <th className="py-2 px-3 w-20 text-right">Qty</th>
                    <th className="py-2 px-3 w-28 text-right">Rate (LKR)</th>
                    <th className="py-2 px-3 w-32 text-right">Taxable (LKR)</th>
                    <th className="py-2 px-3 w-16 text-center">VAT</th>
                    <th className="py-2 px-3 w-28 text-right">VAT (LKR)</th>
                    <th className="py-2 px-3 w-32 text-right">Total (LKR)</th>
                    <th className="py-2 px-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {lineItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-800/20">
                      <td className="py-2 px-3 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => handleUpdateItem(idx, 'description', e.target.value)}
                          placeholder="Description of engineering work or materials"
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs outline-none focus:border-cyan-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.unitOfMeasure || ''}
                          onChange={e => handleUpdateItem(idx, 'unitOfMeasure', e.target.value)}
                          placeholder="Nos"
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs outline-none text-center"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => handleUpdateItem(idx, 'quantity', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs outline-none text-right font-mono"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={e => handleUpdateItem(idx, 'unitPrice', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs outline-none text-right font-mono"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-white">
                        {item.taxableValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-slate-400">
                        {item.vatRate}%
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-red-400">
                        {item.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-white">
                        {item.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={lineItems.length <= 1}
                          className="text-slate-500 hover:text-rose-400 disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: Financial Summary & Amount in Words */}
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1 p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 block">Amount in Words (Calculated):</span>
              <p className="font-semibold text-white italic">{amountInWords}</p>
            </div>

            <div className="w-full md:w-80 p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Taxable Value:</span>
                <span className="font-mono text-white">LKR {totals.totalTaxableValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-red-400 font-semibold">
                <span>Output VAT @ 18%:</span>
                <span className="font-mono">LKR {totals.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-white font-bold border-t border-slate-800 pt-2 text-sm">
                <span>Total Consideration:</span>
                <span className="font-mono text-emerald-400">LKR {totals.totalConsideration.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700 transition-colors"
            >
              Save as Draft
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Issue Official Tax Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
