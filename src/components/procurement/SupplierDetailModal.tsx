import React, { useState } from 'react';
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
  Award,
  Truck,
  Receipt,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  ExternalLink,
  Plus,
  Edit2,
  Eye,
  EyeOff,
  Star,
  History,
  AlertCircle,
  Layers,
  Paperclip
} from 'lucide-react';
import { useSupplier } from '../../context/SupplierContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { useEnterpriseBanking } from '../../context/EnterpriseBankingContext';
import {
  Supplier,
  SupplierStatus,
  SupplierContact,
  SupplierBankAccount,
  SupplierDocument
} from '../../types/supplierTypes';

interface SupplierDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier;
  onEditSupplier: () => void;
  onNewPo: () => void;
  onNewInvoice: () => void;
  onNewGRN: () => void;
  onNewEvaluation: () => void;
  onNewContract: () => void;
}

export const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({
  isOpen,
  onClose,
  supplier,
  onEditSupplier,
  onNewPo,
  onNewInvoice,
  onNewGRN,
  onNewEvaluation,
  onNewContract
}) => {
  const {
    updateSupplierStatus,
    addContact,
    addBankAccount,
    setPrimaryBank,
    verifyBankAccount,
    addDocument,
    invoices,
    grns,
    auditLogs
  } = useSupplier();
  const { procurementOrders, currentRole } = useEnterprise();
  const { registeredBanks } = useEnterpriseBanking();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'contacts' | 'banking' | 'credit' | 'documents' | 'contracts' | 'pos' | 'deliveries' | 'invoices' | 'performance' | 'audit'
  >('overview');

  const [revealedBankIds, setRevealedBankIds] = useState<Record<string, boolean>>({});

  // Sub-modal inline form states
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactDesignation, setNewContactDesignation] = useState('');
  const [newContactMobile, setNewContactMobile] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactWhatsApp, setNewContactWhatsApp] = useState('');

  const [isAddingBank, setIsAddingBank] = useState(false);
  const [newBankName, setNewBankName] = useState('Commercial Bank of Ceylon');
  const [newBranch, setNewBranch] = useState('');
  const [newAccountName, setNewAccountName] = useState(supplier.name);
  const [newAccountNumber, setNewAccountNumber] = useState('');

  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDocType, setNewDocType] = useState<SupplierDocument['documentType']>('Business Registration');
  const [newDocName, setNewDocName] = useState('');
  const [newDocNumber, setNewDocNumber] = useState('');
  const [newDocExpiry, setNewDocExpiry] = useState('');

  if (!isOpen) return null;

  const supplierPos = procurementOrders.filter(
    p => p.SUPPLIER_ID === supplier.id || p.SUPPLIER_NAME.toLowerCase() === supplier.name.toLowerCase()
  );
  const supplierInvoices = invoices.filter(i => i.supplierId === supplier.id);
  const supplierGrns = grns.filter(g => g.supplierId === supplier.id);
  const supplierAudits = auditLogs.filter(a => a.entityId === supplier.id);

  const totalPoValue = supplierPos.reduce((acc, curr) => acc + (curr.TOTAL_AMOUNT || 0), 0);
  const totalInvoicedValue = supplierInvoices.reduce((acc, curr) => acc + (curr.netAmount || 0), 0);
  const totalPaidValue = supplierInvoices.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
  const outstandingPayable = totalInvoicedValue - totalPaidValue;

  const formatLKR = (amt: number) => {
    return `LKR ${Number(amt || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;
  };

  const getStatusBadge = (st: SupplierStatus) => {
    switch (st) {
      case 'Active':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'Approved':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'Pending Approval':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'Suspended':
        return 'bg-orange-950 text-orange-300 border-orange-800';
      case 'Blocked':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'Draft':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const toggleBankReveal = (bankId: string) => {
    setRevealedBankIds(prev => ({ ...prev, [bankId]: !prev[bankId] }));
  };

  const handleSaveNewContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) return;
    addContact(supplier.id, {
      name: newContactName.trim(),
      designation: newContactDesignation.trim() || 'Contact Representative',
      contactType: 'Sales',
      mobile: newContactMobile.trim(),
      email: newContactEmail.trim(),
      whatsApp: newContactWhatsApp.trim() || undefined,
      isPrimary: supplier.contacts.length === 0
    });
    setIsAddingContact(false);
    setNewContactName('');
    setNewContactDesignation('');
    setNewContactMobile('');
    setNewContactEmail('');
    setNewContactWhatsApp('');
  };

  const handleSaveNewBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountNumber.trim()) return;
    addBankAccount(supplier.id, {
      bank: newBankName,
      branch: newBranch.trim() || 'Main Branch',
      accountName: newAccountName.trim() || supplier.name,
      accountNumber: newAccountNumber.trim(),
      currency: 'LKR',
      verificationStatus: 'Pending',
      isDefault: supplier.bankAccounts.length === 0
    });
    setIsAddingBank(false);
    setNewBranch('');
    setNewAccountNumber('');
  };

  const handleSaveNewDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;
    addDocument(supplier.id, {
      documentType: newDocType,
      documentName: newDocName.trim(),
      documentNumber: newDocNumber.trim() || undefined,
      expiryDate: newDocExpiry || undefined,
      fileName: `${newDocName.trim().replace(/\s+/g, '_')}.pdf`,
      fileSizeKb: 240
    });
    setIsAddingDoc(false);
    setNewDocName('');
    setNewDocNumber('');
    setNewDocExpiry('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header 360 */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/70 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-orange-950/80 border border-orange-800 flex items-center justify-center text-orange-400 font-bold text-lg shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-orange-400 bg-orange-950/50 border border-orange-900 px-2 py-0.5 rounded-lg">
                    {supplier.code}
                  </span>
                  <h2 className="text-lg font-bold text-slate-100">{supplier.name}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(supplier.status)}`}>
                    {supplier.status}
                  </span>
                  {supplier.isVatRegistered ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                      VAT Registered ({supplier.vatNumber || 'Active'})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                      Non-VAT
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                  <span>Type: <strong className="text-slate-300">{supplier.supplierType}</strong></span>
                  <span>•</span>
                  <span>Credit Terms: <strong className="text-slate-300">{supplier.creditTerms?.creditPeriod || '30 Days'}</strong></span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <strong>{supplier.performance.rating} ({supplier.performance.overallScore}%)</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={onEditSupplier}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
              >
                <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={onNewPo}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create PO</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Total PO Value</span>
              <span className="text-sm font-mono font-bold text-orange-400 block mt-0.5">{formatLKR(totalPoValue)}</span>
              <span className="text-[10px] text-slate-500">{supplierPos.length} Purchase Orders</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Invoiced vs Paid</span>
              <span className="text-sm font-mono font-bold text-slate-200 block mt-0.5">{formatLKR(totalInvoicedValue)}</span>
              <span className="text-[10px] text-emerald-400 font-medium">Settled: {formatLKR(totalPaidValue)}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Outstanding Payables</span>
              <span className={`text-sm font-mono font-bold block mt-0.5 ${outstandingPayable > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatLKR(outstandingPayable)}
              </span>
              <span className="text-[10px] text-slate-500">Unpaid liability balance</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Credit Limit Available</span>
              <span className="text-sm font-mono font-bold text-cyan-400 block mt-0.5">
                {formatLKR(Math.max(0, (supplier.creditTerms?.creditLimit || 0) - outstandingPayable))}
              </span>
              <span className="text-[10px] text-slate-500">Limit: {formatLKR(supplier.creditTerms?.creditLimit || 0)}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 py-2 bg-slate-950/60 border-b border-slate-800 overflow-x-auto text-xs font-semibold shrink-0">
          {[
            { id: 'overview', label: '1. Master Overview' },
            { id: 'contacts', label: `2. Contacts (${supplier.contacts.length})` },
            { id: 'banking', label: `3. Bank Accounts (${supplier.bankAccounts.length})` },
            { id: 'credit', label: '4. Credit & Terms' },
            { id: 'documents', label: `5. Documents Vault (${supplier.documents.length})` },
            { id: 'contracts', label: `6. Contracts (${supplier.contracts.length})` },
            { id: 'pos', label: `7. Purchase Orders (${supplierPos.length})` },
            { id: 'deliveries', label: `8. Deliveries / GRN (${supplierGrns.length})` },
            { id: 'invoices', label: `9. Invoices & AP (${supplierInvoices.length})` },
            { id: 'performance', label: '10. Performance Audit' },
            { id: 'audit', label: `11. Audit Trail (${supplierAudits.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Legal & Statutory Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block">
                    Corporate & Legal Information
                  </span>
                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Legal Company Name:</span>
                      <span className="font-semibold text-right">{supplier.legalName || supplier.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Trading / Brand Name:</span>
                      <span className="font-semibold">{supplier.tradingName || supplier.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">BR / Company Reg No:</span>
                      <span className="font-mono font-bold text-slate-200">{supplier.registrationNumber || 'Pending'}</span>
                    </div>
                    {supplier.businessRegistrationDate && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Incorporation Date:</span>
                        <span>{supplier.businessRegistrationDate}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tax Identification No (TIN):</span>
                      <span className="font-mono font-bold text-slate-200">{supplier.tin || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">VAT Registration No:</span>
                      <span className="font-mono">{supplier.vatNumber || 'Non-VAT Registered'}</span>
                    </div>
                    {supplier.svatNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">SVAT Registration No:</span>
                        <span className="font-mono">{supplier.svatNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address & Communication Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block">
                    Address & Plant Facilities
                  </span>
                  <div className="space-y-2 text-slate-300">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <span>{supplier.address || 'Address on file'}, {supplier.city}, {supplier.province}, {supplier.country} {supplier.postalCode}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{supplier.phone || 'No direct phone'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{supplier.email || 'No email registered'}</span>
                    </div>
                    {supplier.website && (
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-slate-500 shrink-0" />
                        <a href={supplier.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                          {supplier.website}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Operational Notes */}
                  {supplier.notes && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Operational Notes</span>
                      <p className="text-slate-300 italic">{supplier.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Lifecycle & Status Switcher Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Supplier Lifecycle Status Management</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Controls procurement eligibility. Blocked or Suspended suppliers will trigger safety warnings on PO issuance.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['Active', 'Approved', 'Pending Approval', 'Suspended', 'Blocked'] as SupplierStatus[]).map(st => (
                    <button
                      key={st}
                      type="button"
                      disabled={supplier.status === st}
                      onClick={() => updateSupplierStatus(supplier.id, st, `Status changed to ${st} from 360 view`)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all text-[11px] ${
                        supplier.status === st
                          ? 'bg-orange-600 text-white shadow'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTACTS */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">
                  Registered Key Contact Persons ({supplier.contacts.length})
                </span>
                <button
                  onClick={() => setIsAddingContact(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Contact Person</span>
                </button>
              </div>

              {isAddingContact && (
                <form onSubmit={handleSaveNewContact} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-orange-400 block">+ Add Contact Person</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        placeholder="Nimal Perera"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Designation</label>
                      <input
                        type="text"
                        value={newContactDesignation}
                        onChange={(e) => setNewContactDesignation(e.target.value)}
                        placeholder="Sales Manager"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Mobile</label>
                      <input
                        type="text"
                        value={newContactMobile}
                        onChange={(e) => setNewContactMobile(e.target.value)}
                        placeholder="+94 77 123 4567"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Email</label>
                      <input
                        type="email"
                        value={newContactEmail}
                        onChange={(e) => setNewContactEmail(e.target.value)}
                        placeholder="nimal@company.lk"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">WhatsApp</label>
                      <input
                        type="text"
                        value={newContactWhatsApp}
                        onChange={(e) => setNewContactWhatsApp(e.target.value)}
                        placeholder="+94771234567"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingContact(false)}
                      className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1 rounded-lg bg-orange-600 text-white font-bold"
                    >
                      Save Contact
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {supplier.contacts.map(c => (
                  <div key={c.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200 text-sm">{c.name}</span>
                        {c.isPrimary && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-950/80 text-orange-300 border border-orange-800">
                            Primary
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold">{c.contactType}</span>
                    </div>
                    <div className="text-slate-400 text-xs">{c.designation}</div>
                    <div className="space-y-1 text-slate-300 pt-1 border-t border-slate-800/80">
                      {c.mobile && <div>Mobile: <span className="font-mono text-slate-200">{c.mobile}</span></div>}
                      {c.email && <div>Email: <span className="text-blue-400">{c.email}</span></div>}
                      {c.whatsApp && <div>WhatsApp: <span className="font-mono text-emerald-400">{c.whatsApp}</span></div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BANK ACCOUNTS */}
          {activeTab === 'banking' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    Verified Settlement Bank Accounts ({supplier.bankAccounts.length})
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Accounts used for direct electronic fund transfers (CEFT / SLIPS). Account numbers are masked for financial privacy.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingBank(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Bank Account</span>
                </button>
              </div>

              {isAddingBank && (
                <form onSubmit={handleSaveNewBank} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-emerald-400 block">+ Add Bank Account</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Bank Name *</label>
                      <input
                        type="text"
                        list="registered-banks-list"
                        value={newBankName}
                        onChange={(e) => setNewBankName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Branch Name</label>
                      <input
                        type="text"
                        value={newBranch}
                        onChange={(e) => setNewBranch(e.target.value)}
                        placeholder="Peliyagoda Branch"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Account Title / Beneficiary</label>
                      <input
                        type="text"
                        value={newAccountName}
                        onChange={(e) => setNewAccountName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Account Number *</label>
                      <input
                        type="text"
                        required
                        value={newAccountNumber}
                        onChange={(e) => setNewAccountNumber(e.target.value)}
                        placeholder="100084920194"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingBank(false)}
                      className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1 rounded-lg bg-emerald-600 text-white font-bold"
                    >
                      Save Account
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {supplier.bankAccounts.map(b => {
                  const isRevealed = revealedBankIds[b.id];
                  const maskedAcc = b.accountNumber.length > 4
                    ? `•••• •••• •••• ${b.accountNumber.slice(-4)}`
                    : b.accountNumber;

                  return (
                    <div key={b.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Landmark className="w-4 h-4 text-emerald-400" />
                          <span className="font-bold text-slate-100 text-sm">{b.bank}</span>
                          <span className="text-slate-400 font-medium">({b.branch})</span>
                          {b.isDefault && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                              Default Settlement
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            b.verificationStatus === 'Verified'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}>
                            {b.verificationStatus}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-300 mt-1">
                          <span>Beneficiary: <strong className="text-slate-200">{b.accountName}</strong></span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5 font-mono">
                            Account: <strong className="text-emerald-400">{isRevealed ? b.accountNumber : maskedAcc}</strong>
                            <button
                              type="button"
                              onClick={() => toggleBankReveal(b.id)}
                              className="p-1 text-slate-400 hover:text-slate-200 rounded"
                              title={isRevealed ? 'Hide Account Number' : 'Reveal Account Number'}
                            >
                              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </span>
                          {b.swift && (
                            <>
                              <span>•</span>
                              <span>SWIFT: <strong className="font-mono text-slate-200">{b.swift}</strong></span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!b.isDefault && (
                          <button
                            type="button"
                            onClick={() => setPrimaryBank(supplier.id, b.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold"
                          >
                            Set Default
                          </button>
                        )}
                        {b.verificationStatus !== 'Verified' && (
                          <button
                            type="button"
                            onClick={() => verifyBankAccount(supplier.id, b.id, 'Verified')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                          >
                            Verify Account
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: CREDIT TERMS */}
          {activeTab === 'credit' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block">
                  Commercial Credit Terms & Settlement Policy
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-slate-300">
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Standard Credit Period</span>
                    <span className="text-sm font-bold text-slate-100 mt-1 block">
                      {supplier.creditTerms?.creditPeriod || '30 Days'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Approved Credit Ceiling</span>
                    <span className="text-sm font-mono font-bold text-orange-400 mt-1 block">
                      {formatLKR(supplier.creditTerms?.creditLimit || 0)}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Advance Payment Policy</span>
                    <span className="text-sm font-bold text-slate-100 mt-1 block">
                      {supplier.creditTerms?.advanceRequiredPercent || 0}% Advance Required
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-slate-300">
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Retention Deductible</span>
                    <span className="text-sm font-bold text-slate-100 mt-1 block">
                      {supplier.creditTerms?.retentionPercent || 0}% Retention
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Early Settlement Rebate</span>
                    <span className="text-sm font-bold text-emerald-400 mt-1 block">
                      {supplier.creditTerms?.earlyPaymentDiscountPercent || 0}% Discount
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Settlement Currency</span>
                    <span className="text-sm font-bold text-slate-100 mt-1 block">
                      {supplier.creditTerms?.currency || 'LKR'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Full Payment Terms</span>
                    <p className="text-slate-200 mt-0.5">{supplier.creditTerms?.paymentTerms || 'Net 30 Days'}</p>
                  </div>
                  {supplier.creditTerms?.latePaymentTerms && (
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Late Payment Conditions</span>
                      <p className="text-slate-300 mt-0.5">{supplier.creditTerms.latePaymentTerms}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DOCUMENTS VAULT */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    Statutory & Compliance Document Vault ({supplier.documents.length})
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Business Registration, Tax TIN/VAT certificates, mining permits, ISO/SLS quality certificates, and bank statements.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingDoc(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Upload Document</span>
                </button>
              </div>

              {isAddingDoc && (
                <form onSubmit={handleSaveNewDoc} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-orange-400 block">+ Register Compliance Document</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Document Category</label>
                      <select
                        value={newDocType}
                        onChange={(e) => setNewDocType(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                      >
                        <option value="Business Registration (BR)">Business Registration (BR)</option>
                        <option value="TIN Certificate">TIN Certificate</option>
                        <option value="VAT Certificate">VAT Certificate</option>
                        <option value="Bank Confirmation Letter">Bank Confirmation Letter</option>
                        <option value="Quality / SLS Certificate">Quality / SLS Certificate</option>
                        <option value="Insurance Policy">Insurance Policy</option>
                        <option value="Mining / Environmental Permit">Mining / Environmental Permit</option>
                        <option value="Contract Agreement">Contract Agreement</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Document Title / File Ref *</label>
                      <input
                        type="text"
                        required
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
                        placeholder="e.g. Certified BR 2026.pdf"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Document / Certificate No</label>
                      <input
                        type="text"
                        value={newDocNumber}
                        onChange={(e) => setNewDocNumber(e.target.value)}
                        placeholder="PV-00192841"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Expiry Date (if applicable)</label>
                      <input
                        type="date"
                        value={newDocExpiry}
                        onChange={(e) => setNewDocExpiry(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingDoc(false)}
                      className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1 rounded-lg bg-orange-600 text-white font-bold"
                    >
                      Save Document
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {supplier.documents.length === 0 ? (
                  <div className="sm:col-span-2 p-8 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                    No compliance documents uploaded yet.
                  </div>
                ) : (
                  supplier.documents.map(d => (
                    <div key={d.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCheck2 className="w-4 h-4 text-orange-400" />
                          <span className="font-bold text-slate-200">{d.documentName}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                          {d.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">{d.documentType}</div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                        <span>Uploaded: {d.uploadedDate}</span>
                        {d.expiryDate && (
                          <span className="text-amber-400 font-medium">Expires: {d.expiryDate}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: CONTRACTS */}
          {activeTab === 'contracts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    Supplier Framework & Project Agreements ({supplier.contracts.length})
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Master service agreements, project subcontracts, supply rates and retention caps.
                  </p>
                </div>
                <button
                  onClick={onNewContract}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Contract</span>
                </button>
              </div>

              <div className="space-y-3">
                {supplier.contracts.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                    No formal contracts registered. All purchases handled via standalone Purchase Orders.
                  </div>
                ) : (
                  supplier.contracts.map(c => (
                    <div key={c.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-xs text-orange-400">{c.contractNumber}</span>
                          <span className="font-bold text-slate-100">{c.contractTitle || c.title}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                            {c.status}
                          </span>
                        </div>
                        <span className="text-sm font-mono font-bold text-slate-200">
                          {formatLKR(c.contractValue)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                        <div>Project: <strong className="text-slate-300">{c.projectCode}</strong></div>
                        <div>Start Date: <strong className="text-slate-300">{c.startDate}</strong></div>
                        <div>Expiry Date: <strong className="text-slate-300">{c.endDate}</strong></div>
                        <div>Retention: <strong className="text-slate-300">{c.retentionPercent || 0}%</strong></div>
                      </div>

                      {(c.scope || c.scopeDescription) && (
                        <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded-lg">
                          {c.scope || c.scopeDescription}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 7: PURCHASE ORDERS */}
          {activeTab === 'pos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    Purchase Orders Linked to {supplier.name} ({supplierPos.length})
                  </span>
                  <p className="text-[11px] text-slate-400">
                    All POs referencing this supplier from the Enterprise Procurement module.
                  </p>
                </div>
                <button
                  onClick={onNewPo}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Create Purchase Order</span>
                </button>
              </div>

              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase">
                    <tr>
                      <th className="p-3">PO Number</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Project</th>
                      <th className="p-3">Item Description</th>
                      <th className="p-3">Qty & Unit</th>
                      <th className="p-3">Total Amount</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {supplierPos.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500">
                          No purchase orders linked to this supplier yet.
                        </td>
                      </tr>
                    ) : (
                      supplierPos.map(po => (
                        <tr key={po.id} className="hover:bg-slate-900/40">
                          <td className="p-3 font-mono font-bold text-slate-200">{po.PO_NUMBER}</td>
                          <td className="p-3 text-slate-400">{po.DATE}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 text-[10px] font-bold font-mono">
                              {po.PROJECT_CODE}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-100">{po.ITEM_DESCRIPTION}</span>
                              {po.ITEMS && po.ITEMS.length > 1 && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-orange-950/80 text-orange-400 border border-orange-800 font-mono font-bold flex items-center gap-1">
                                  <Layers className="w-2.5 h-2.5" />
                                  <span>{po.ITEMS.length} items</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-mono text-slate-300">
                            {po.ITEMS && po.ITEMS.length > 1 ? (
                              <div>
                                <span className="text-slate-200">{po.ITEMS.length} line items</span>
                                <span className="text-[10px] text-slate-400 block">Total: {po.QUANTITY} {po.UNIT}</span>
                              </div>
                            ) : (
                              <span>{po.QUANTITY} {po.UNIT}</span>
                            )}
                          </td>
                          <td className="p-3 font-mono font-bold text-orange-400">{formatLKR(po.TOTAL_AMOUNT)}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                              {po.STATUS}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: GOODS RECEIVED */}
          {activeTab === 'deliveries' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    Goods Received Notes & Site Deliveries ({supplierGrns.length})
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Site delivery verification tickets, QA acceptance tests & rejection records.
                  </p>
                </div>
                <button
                  onClick={onNewGRN}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Issue GRN</span>
                </button>
              </div>

              <div className="space-y-3">
                {supplierGrns.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                    No goods received notes logged for this supplier yet.
                  </div>
                ) : (
                  supplierGrns.map(g => (
                    <div key={g.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-emerald-400" />
                          <span className="font-mono font-bold text-slate-200">{g.grnNumber}</span>
                          <span className="text-slate-400">Delivery Note: <strong>{g.deliveryNoteNumber}</strong></span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            g.status === 'Accepted' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                            g.status === 'Partial' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                            'bg-rose-950 text-rose-300 border-rose-800'
                          }`}>
                            {g.status}
                          </span>
                        </div>
                        <span className="text-slate-400 text-[11px]">{g.deliveryDate}</span>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 flex-wrap">
                        <span>Project: <strong className="text-slate-300">{g.projectCode}</strong></span>
                        {g.poNumber && <span>PO: <strong className="font-mono text-orange-400">{g.poNumber}</strong></span>}
                        {g.vehicleNumber && <span>Truck: <strong className="font-mono text-slate-300">{g.vehicleNumber}</strong></span>}
                        <span>Inspector: <strong className="text-slate-300">{g.receivedBy}</strong></span>
                        {(g.deliveryNoteAttachmentName || g.deliveryNoteAttachmentData) && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-800 text-[10px] text-emerald-300 font-mono">
                            <Paperclip className="w-2.5 h-2.5" />
                            <span>{g.deliveryNoteAttachmentName || 'Delivery Note Attached'}</span>
                          </span>
                        )}
                      </div>

                      {/* Items */}
                      <div className="pt-2 border-t border-slate-800/80 space-y-1">
                        {(g.items && g.items.length > 0
                          ? g.items
                          : [
                              {
                                id: `it-${g.id}-1`,
                                description: g.itemDescription || 'Material',
                                orderedQuantity: g.orderedQuantity ?? 0,
                                receivedQuantity: g.receivedQuantity ?? 0,
                                acceptedQuantity: g.acceptedQuantity ?? 0,
                                rejectedQuantity: g.rejectedQuantity ?? 0,
                                unit: g.unit || ''
                              }
                            ]
                        ).map((it, idx) => (
                          <div key={it.id || idx} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-200">{it.description}</span>
                            <div className="flex items-center gap-3 font-mono">
                              <span>Delivered: {it.receivedQuantity ?? 0} {it.unit}</span>
                              <span className="text-emerald-400">Accepted: {it.acceptedQuantity ?? it.receivedQuantity ?? 0}</span>
                              {(it.rejectedQuantity || 0) > 0 && (
                                <span className="text-rose-400">Rejected: {it.rejectedQuantity}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 9: INVOICES & PAYMENTS */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    Supplier Tax Invoices & Payables Register ({supplierInvoices.length})
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Accounts payable reconciliation, 3-way matching and payment voucher allocations.
                  </p>
                </div>
                <button
                  onClick={onNewInvoice}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Record Supplier Invoice</span>
                </button>
              </div>

              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase">
                    <tr>
                      <th className="p-3">Internal Ref</th>
                      <th className="p-3">Vendor Invoice #</th>
                      <th className="p-3">Invoice / Due Date</th>
                      <th className="p-3">Project / PO</th>
                      <th className="p-3">Net Amount</th>
                      <th className="p-3">Settled</th>
                      <th className="p-3">Balance Due</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {supplierInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-500">
                          No supplier invoices registered yet.
                        </td>
                      </tr>
                    ) : (
                      supplierInvoices.map(inv => {
                        const balance = inv.netAmount - (inv.paidAmount || 0);
                        return (
                          <tr key={inv.id} className="hover:bg-slate-900/40">
                            <td className="p-3 font-mono text-slate-400">{inv.invoiceNumber}</td>
                            <td className="p-3 font-mono">
                              <span className="font-bold text-slate-200 block">{inv.supplierInvoiceRef}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {inv.items && inv.items.length > 1 && (
                                  <span className="px-1 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[9px] font-bold">
                                    {inv.items.length} items
                                  </span>
                                )}
                                {(inv.invoiceAttachmentName || inv.invoiceAttachmentData) && (
                                  <span className="flex items-center gap-0.5 text-[10px] text-blue-400" title={inv.invoiceAttachmentName || 'Copy Attached'}>
                                    <Paperclip className="w-2.5 h-2.5" />
                                    <span>Copy</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-slate-400">
                              <div>{inv.invoiceDate}</div>
                              <div className="text-[10px] text-slate-500">Due: {inv.dueDate}</div>
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-slate-200 block">{inv.projectCode}</span>
                              {inv.poNumber && <span className="font-mono text-[10px] text-orange-400">{inv.poNumber}</span>}
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-200">{formatLKR(inv.netAmount)}</td>
                            <td className="p-3 font-mono text-emerald-400">{formatLKR(inv.paidAmount || 0)}</td>
                            <td className="p-3 font-mono font-bold text-rose-400">{formatLKR(balance)}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                inv.status === 'Paid' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                                inv.status === 'Approved' ? 'bg-blue-950 text-blue-300 border-blue-800' :
                                'bg-amber-950 text-amber-300 border-amber-800'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 10: PERFORMANCE AUDIT */}
          {activeTab === 'performance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    Supplier Performance Audits & KPI Scorecards
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Periodic evaluation audits covering delivery reliability, material quality, commercial fairness & documentation.
                  </p>
                </div>
                <button
                  onClick={onNewEvaluation}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>+ Conduct Performance Audit</span>
                </button>
              </div>

              {/* Current Scorecard Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Delivery & Timeliness</span>
                  <span className="text-lg font-mono font-bold text-purple-400 block mt-0.5">
                    {supplier.performance.deliveryScore || 0}%
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Material Quality & Testing</span>
                  <span className="text-lg font-mono font-bold text-purple-400 block mt-0.5">
                    {supplier.performance.qualityScore || 0}%
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Pricing & Commercials</span>
                  <span className="text-lg font-mono font-bold text-purple-400 block mt-0.5">
                    {supplier.performance.priceScore || 0}%
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Documentation & Permits</span>
                  <span className="text-lg font-mono font-bold text-purple-400 block mt-0.5">
                    {supplier.performance.documentationScore || 0}%
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Payment & Invoicing Accuracy</span>
                  <span className="text-lg font-mono font-bold text-purple-400 block mt-0.5">
                    {supplier.performance.paymentComplianceScore || 0}%
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Responsiveness & Service</span>
                  <span className="text-lg font-mono font-bold text-purple-400 block mt-0.5">
                    {supplier.performance.responsivenessScore || 0}%
                  </span>
                </div>
              </div>

              {/* History */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-300 block">Evaluation History</span>
                {(!supplier.evaluationHistory || supplier.evaluationHistory.length === 0) ? (
                  <div className="p-6 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                    No historical evaluation audits recorded yet.
                  </div>
                ) : (
                  supplier.evaluationHistory.map(ev => (
                    <div key={ev.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100">{ev.evaluationDate}</span>
                          <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 text-[10px] font-bold font-mono">
                            {ev.projectCode}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                            Rating: {ev.rating} ({ev.overallScore}%)
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">Evaluator: {ev.evaluatedBy}</span>
                      </div>
                      <p className="text-slate-300 italic text-[11px]">{ev.comments}</p>
                      {ev.correctiveAction && (
                        <div className="text-[10px] text-amber-400 font-medium bg-amber-950/30 p-1.5 rounded-lg border border-amber-900/40">
                          Corrective Action: {ev.correctiveAction}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 11: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-200 block">
                Immutable Lifecycle Audit Log ({supplierAudits.length})
              </span>
              <div className="space-y-2">
                {supplierAudits.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                    No lifecycle audit entries recorded.
                  </div>
                ) : (
                  supplierAudits.map(log => (
                    <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-3 text-[11px]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-orange-400 uppercase">{log.action}</span>
                          <span className="text-slate-300">{log.details}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">User: {log.performedBy}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 shrink-0">{log.timestamp}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
