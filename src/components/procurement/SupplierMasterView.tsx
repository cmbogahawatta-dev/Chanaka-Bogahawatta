import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  CreditCard,
  Star,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FolderTree,
  LayoutGrid,
  List,
  Award,
  Landmark,
  ShoppingCart,
  Receipt
} from 'lucide-react';
import { useSupplier } from '../../context/SupplierContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { Supplier, SupplierType, SupplierStatus } from '../../types/supplierTypes';
import { SupplierFormModal } from './SupplierFormModal';
import { SupplierDetailModal } from './SupplierDetailModal';
import { SupplierEvaluationModal } from './SupplierEvaluationModal';
import { SupplierInvoiceModal } from './SupplierInvoiceModal';
import { GoodsReceivedModal } from './GoodsReceivedModal';
import { SupplierContractModal } from './SupplierContractModal';
import { SupplierCategoryModal } from './SupplierCategoryModal';
import { AdminClearHistoryButton } from '../common/AdminClearHistoryButton';
import { UniversalDeleteModal } from '../common/UniversalDeleteModal';

interface SupplierMasterViewProps {
  onNavigateToPO?: (supplierId: string) => void;
}

export const SupplierMasterView: React.FC<SupplierMasterViewProps> = ({ onNavigateToPO }) => {
  const { suppliers, deleteSupplier, categories, clearSuppliersHistory } = useSupplier();
  const { currentRole } = useEnterprise();
  const isAdmin = currentRole === 'ADMIN' || currentRole === 'OWNER';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteTargetSupplier, setDeleteTargetSupplier] = useState<Supplier | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSupplierForDetail, setSelectedSupplierForDetail] = useState<Supplier | null>(null);

  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [evaluatingSupplier, setEvaluatingSupplier] = useState<Supplier | null>(null);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoicingSupplier, setInvoicingSupplier] = useState<Supplier | null>(null);

  const [isGRNModalOpen, setIsGRNModalOpen] = useState(false);
  const [grnSupplier, setGrnSupplier] = useState<Supplier | null>(null);

  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractSupplier, setContractSupplier] = useState<Supplier | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const matchSearch =
        searchTerm === '' ||
        (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.tin && s.tin.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.registrationNumber && s.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.city && s.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.supplierType && s.supplierType.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.categories && s.categories.some(c => c && c.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchStatus = selectedStatus === 'ALL' || s.status === selectedStatus;
      const matchType = selectedType === 'ALL' || s.supplierType === selectedType;
      const matchCat = selectedCategory === 'ALL' || (s.categories && s.categories.includes(selectedCategory));

      return matchSearch && matchStatus && matchType && matchCat;
    });
  }, [suppliers, searchTerm, selectedStatus, selectedType, selectedCategory]);

  const activeCount = useMemo(() => suppliers.filter(s => s.status === 'Active').length, [suppliers]);
  const pendingCount = useMemo(() => suppliers.filter(s => s.status === 'Pending Approval').length, [suppliers]);
  const totalVerifiedBanks = useMemo(() => {
    return suppliers.reduce((acc, curr) => acc + (curr.bankAccounts ? curr.bankAccounts.filter(b => b.verificationStatus === 'Verified').length : 0), 0);
  }, [suppliers]);

  const handleOpenNewSupplier = () => {
    setEditingSupplier(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = (s: Supplier) => {
    setSelectedSupplierForDetail(s);
    setIsDetailModalOpen(true);
  };

  const handleOpenEvaluation = (s: Supplier) => {
    setEvaluatingSupplier(s);
    setIsEvaluationModalOpen(true);
  };

  const handleOpenInvoice = (s: Supplier) => {
    setInvoicingSupplier(s);
    setIsInvoiceModalOpen(true);
  };

  const handleOpenGRN = (s: Supplier) => {
    setGrnSupplier(s);
    setIsGRNModalOpen(true);
  };

  const handleOpenContract = (s: Supplier) => {
    setContractSupplier(s);
    setIsContractModalOpen(true);
  };

  const handleDelete = (s: Supplier) => {
    if (confirm(`Are you sure you want to remove supplier ${s.name} (${s.code})? This action will be audited.`)) {
      deleteSupplier(s.id);
      if (selectedSupplierForDetail?.id === s.id) {
        setIsDetailModalOpen(false);
      }
    }
  };

  const getStatusBadge = (status: SupplierStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'Approved':
        return 'bg-blue-950/80 text-blue-300 border-blue-800';
      case 'Pending Approval':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'Suspended':
        return 'bg-orange-950/80 text-orange-300 border-orange-800';
      case 'Blocked':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'Draft':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 backdrop-blur p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-950 text-orange-400 border border-orange-800 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Supplier & Vendor Master Directory</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Centralized register of material suppliers, plant hire vendors, subcontractors & professional service providers.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <AdminClearHistoryButton
            id="btn-admin-clear-suppliers"
            moduleName="Supplier Master Directory"
            itemCount={suppliers.length}
            itemDescription="registered supplier profiles and vendor directory records"
            preservedItemsDescription="Financial ledgers and payment vouchers remain completely intact."
            onClear={() => clearSuppliersHistory()}
          />

          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all"
          >
            <FolderTree className="w-4 h-4 text-orange-400" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewSupplier}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Register Supplier</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Suppliers</span>
          <div className="text-xl font-mono font-bold text-slate-100 mt-1">{suppliers.length} Vendors</div>
          <span className="text-[10px] text-slate-400 font-medium">{activeCount} actively engaged</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active & Qualified</span>
          <div className="text-xl font-mono font-bold text-emerald-400 mt-1">{activeCount} Approved</div>
          <span className="text-[10px] text-emerald-400/80 font-medium">Eligible for PO release</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Under Qualification</span>
          <div className="text-xl font-mono font-bold text-amber-400 mt-1">{pendingCount} Pending</div>
          <span className="text-[10px] text-amber-300 font-medium">Statutory verification</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Verified Settlement Banks</span>
          <div className="text-xl font-mono font-bold text-cyan-400 mt-1">{totalVerifiedBanks} Accounts</div>
          <span className="text-[10px] text-cyan-300 font-medium">CEFT/SLIPS transfer ready</span>
        </div>
      </div>

      {/* 3. Search & Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Search code, company, TIN, city, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Approved">Approved</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Suspended">Suspended</option>
            <option value="Blocked">Blocked</option>
            <option value="Draft">Draft</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Types</option>
            <option value="Material Supplier">Material Supplier</option>
            <option value="Service Provider">Service Provider</option>
            <option value="Subcontractor">Subcontractor</option>
            <option value="Equipment Supplier">Equipment Supplier</option>
            <option value="Plant Hire">Plant Hire</option>
            <option value="Transport Supplier">Transport Supplier</option>
            <option value="Fuel Supplier">Fuel Supplier</option>
            <option value="Consultant">Consultant</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Compact Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Listing: Grid or Table */}
      {filteredSuppliers.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-200">No suppliers found</h3>
          <p className="text-xs text-slate-500">Try adjusting your search filters or register a new vendor.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map(supplier => {
            const primaryContact = supplier.contacts.find(c => c.isPrimary) || supplier.contacts[0];
            const defaultBank = supplier.bankAccounts.find(b => b.isDefault) || supplier.bankAccounts[0];

            return (
              <div
                key={supplier.id}
                className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4.5 space-y-4 shadow-sm transition-all flex flex-col justify-between"
              >
                {/* Card Top */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[11px] font-bold text-orange-400 bg-orange-950/60 border border-orange-900/80 px-2 py-0.5 rounded">
                          {supplier.code}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(supplier.status)}`}>
                          {supplier.status}
                        </span>
                      </div>
                      <h3
                        onClick={() => handleOpenDetail(supplier)}
                        className="font-bold text-slate-100 text-sm hover:text-orange-400 cursor-pointer transition-colors"
                      >
                        {supplier.name}
                      </h3>
                      <p className="text-[11px] text-slate-400">{supplier.supplierType}</p>
                    </div>

                    <div className="flex items-center gap-1 text-amber-400 font-bold text-xs bg-amber-950/30 px-2 py-0.5 rounded-lg border border-amber-900/40">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{supplier.performance.overallScore}%</span>
                    </div>
                  </div>

                  {/* Categories Tags */}
                  <div className="flex flex-wrap gap-1">
                    {(supplier.categories || []).slice(0, 3).map((cat, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                        {cat}
                      </span>
                    ))}
                    {(supplier.categories || []).length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-500 border border-slate-800">
                        +{(supplier.categories || []).length - 3}
                      </span>
                    )}
                  </div>

                  {/* Snapshot Details */}
                  <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Tax Reg:</span>
                      <span className="font-mono">
                        {supplier.isVatRegistered ? (
                          <span className="text-emerald-400">VAT: {supplier.vatNumber || 'Registered'}</span>
                        ) : (
                          <span className="text-slate-500">Non-VAT</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Credit Terms:</span>
                      <span className="font-semibold text-slate-200">
                        {supplier.creditTerms?.creditPeriod || '30 Days'} (Limit: LKR {(supplier.creditTerms?.creditLimit || 0).toLocaleString()})
                      </span>
                    </div>

                    {primaryContact && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Primary Contact:</span>
                        <span className="text-slate-200 font-medium">
                          {primaryContact.name} ({primaryContact.mobile || primaryContact.email})
                        </span>
                      </div>
                    )}

                    {defaultBank && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Bank:</span>
                        <span className="font-mono text-emerald-400 truncate max-w-[170px]">
                          {defaultBank.bank} ({defaultBank.verificationStatus})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(supplier)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-orange-400" />
                    <span>360 Master View</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditSupplier(supplier)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Edit Supplier"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEvaluation(supplier)}
                    className="p-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-800 text-purple-300 transition-colors"
                    title="Audit Performance"
                  >
                    <Award className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenInvoice(supplier)}
                    className="p-1.5 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-blue-300 transition-colors"
                    title="Record Invoice"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setDeleteTargetSupplier(supplier)}
                      className="p-1.5 rounded-xl hover:bg-rose-950/80 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove Supplier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact Table View */
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3">Code & Name</th>
                  <th className="p-3">Type & Categories</th>
                  <th className="p-3">Registration / Tax</th>
                  <th className="p-3">Contact Person</th>
                  <th className="p-3">Credit Terms</th>
                  <th className="p-3">Bank Status</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSuppliers.map(supplier => {
                  const primaryContact = supplier.contacts.find(c => c.isPrimary) || supplier.contacts[0];
                  const defaultBank = supplier.bankAccounts.find(b => b.isDefault) || supplier.bankAccounts[0];

                  return (
                    <tr key={supplier.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <span className="font-mono text-[10px] font-bold text-orange-400 block">{supplier.code}</span>
                        <span
                          onClick={() => handleOpenDetail(supplier)}
                          className="font-bold text-slate-200 hover:text-orange-400 cursor-pointer block text-xs"
                        >
                          {supplier.name}
                        </span>
                        <span className="text-[10px] text-slate-500">{supplier.city || supplier.province}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-slate-200 font-medium block">{supplier.supplierType}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px] block">
                          {supplier.categories.join(', ')}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        <div>BR: <span className="text-slate-300">{supplier.registrationNumber || 'Pending'}</span></div>
                        <div>TIN: <span className="text-slate-300">{supplier.tin || 'N/A'}</span></div>
                        {supplier.isVatRegistered && (
                          <div className="text-emerald-400 text-[10px]">VAT: {supplier.vatNumber}</div>
                        )}
                      </td>
                      <td className="p-3">
                        {primaryContact ? (
                          <>
                            <div className="font-medium text-slate-200">{primaryContact.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{primaryContact.mobile}</div>
                          </>
                        ) : (
                          <span className="text-slate-500 text-[10px]">None</span>
                        )}
                      </td>
                      <td className="p-3 font-mono">
                        <span className="text-slate-200 font-bold block">{supplier.creditTerms?.creditPeriod || '30 Days'}</span>
                        <span className="text-[10px] text-slate-400">
                          Limit: LKR {(supplier.creditTerms?.creditLimit || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        {defaultBank ? (
                          <>
                            <span className="text-slate-200 block truncate max-w-[110px]">{defaultBank.bank}</span>
                            <span className={`text-[10px] font-bold ${
                              defaultBank.verificationStatus === 'Verified' ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              {defaultBank.verificationStatus}
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-500 text-[10px]">No bank</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="flex items-center gap-1 font-bold text-amber-400 font-mono">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{supplier.performance.overallScore}%</span>
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(supplier.status)}`}>
                          {supplier.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenDetail(supplier)}
                            className="p-1 text-slate-400 hover:text-orange-400 rounded"
                            title="360 Detail View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditSupplier(supplier)}
                            className="p-1 text-slate-400 hover:text-blue-400 rounded"
                            title="Edit Supplier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEvaluation(supplier)}
                            className="p-1 text-slate-400 hover:text-purple-400 rounded"
                            title="Audit Performance"
                          >
                            <Award className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => setDeleteTargetSupplier(supplier)}
                              className="p-1 text-slate-400 hover:text-rose-400 rounded"
                              title="Remove Supplier"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <SupplierFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        supplierToEdit={editingSupplier}
      />

      {selectedSupplierForDetail && (
        <SupplierDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          supplier={selectedSupplierForDetail}
          onEditSupplier={() => {
            setIsDetailModalOpen(false);
            handleOpenEditSupplier(selectedSupplierForDetail);
          }}
          onNewPo={() => {
            setIsDetailModalOpen(false);
            if (onNavigateToPO) onNavigateToPO(selectedSupplierForDetail.id);
          }}
          onNewInvoice={() => {
            setIsDetailModalOpen(false);
            handleOpenInvoice(selectedSupplierForDetail);
          }}
          onNewGRN={() => {
            setIsDetailModalOpen(false);
            handleOpenGRN(selectedSupplierForDetail);
          }}
          onNewEvaluation={() => {
            setIsDetailModalOpen(false);
            handleOpenEvaluation(selectedSupplierForDetail);
          }}
          onNewContract={() => {
            setIsDetailModalOpen(false);
            handleOpenContract(selectedSupplierForDetail);
          }}
        />
      )}

      {evaluatingSupplier && (
        <SupplierEvaluationModal
          isOpen={isEvaluationModalOpen}
          onClose={() => setIsEvaluationModalOpen(false)}
          supplier={evaluatingSupplier}
        />
      )}

      <SupplierInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        preselectedSupplier={invoicingSupplier}
      />

      <GoodsReceivedModal
        isOpen={isGRNModalOpen}
        onClose={() => setIsGRNModalOpen(false)}
        preselectedSupplier={grnSupplier}
      />

      {contractSupplier && (
        <SupplierContractModal
          isOpen={isContractModalOpen}
          onClose={() => setIsContractModalOpen(false)}
          supplier={contractSupplier}
        />
      )}

      <SupplierCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      {deleteTargetSupplier && (
        <UniversalDeleteModal
          isOpen={true}
          onClose={() => setDeleteTargetSupplier(null)}
          module="procurement"
          recordType="Supplier Profile"
          recordId={deleteTargetSupplier.id}
          recordCode={deleteTargetSupplier.code}
          recordTitle={deleteTargetSupplier.name}
          additionalDetails={`TIN: ${deleteTargetSupplier.tin || 'N/A'}, Categories: ${deleteTargetSupplier.categories?.join(', ') || deleteTargetSupplier.supplierType || 'General'}, Status: ${deleteTargetSupplier.status}`}
          onDelete={() => {
            deleteSupplier(deleteTargetSupplier.id);
            if (selectedSupplierForDetail?.id === deleteTargetSupplier.id) {
              setIsDetailModalOpen(false);
            }
            setDeleteTargetSupplier(null);
          }}
        />
      )}
    </div>
  );
};
