import React, { useState, useMemo } from 'react';
import {
  FileCheck,
  ArrowUpRight,
  RotateCcw,
  ArrowLeftRight,
  Sliders,
  ClipboardCheck,
  Search,
  Plus,
  Printer,
  Trash2,
  Edit2,
  Calendar,
  Building2,
  DollarSign,
  CheckCircle2,
  Truck,
  AlertCircle
} from 'lucide-react';
import {
  InventoryGRN,
  MaterialIssue,
  MaterialReturn,
  StockTransfer,
  StockAdjustment,
  StockCount
} from '../../types/inventoryTypes';
import { useInventory } from '../../context/InventoryContext';
import { InventoryDeleteModal, InventoryDeleteType } from './modals/InventoryDeleteModal';
import { InventoryClearHistoryModal } from './modals/InventoryClearHistoryModal';
import { AdminClearHistoryButton } from '../common/AdminClearHistoryButton';
import { TransactionSlipModal } from './modals/TransactionSlipModal';

export type TransactionTab = 'grn' | 'issue' | 'return' | 'transfer' | 'adjustment' | 'count';

interface TransactionsRegisterViewProps {
  activeTab: TransactionTab;
  onTabChange: (tab: TransactionTab) => void;
  onOpenNewGRN: () => void;
  onOpenNewIssue: () => void;
  onOpenNewReturn: () => void;
  onOpenNewTransfer: () => void;
  onOpenNewAdjustment: () => void;
  onOpenNewCount: () => void;
  onEditGRN: (grn: InventoryGRN) => void;
  onEditIssue: (issue: MaterialIssue) => void;
  onEditReturn: (ret: MaterialReturn) => void;
  onEditTransfer: (transfer: StockTransfer) => void;
  onEditAdjustment: (adj: StockAdjustment) => void;
  onEditCount: (count: StockCount) => void;
}

export const TransactionsRegisterView: React.FC<TransactionsRegisterViewProps> = ({
  activeTab,
  onTabChange,
  onOpenNewGRN,
  onOpenNewIssue,
  onOpenNewReturn,
  onOpenNewTransfer,
  onOpenNewAdjustment,
  onOpenNewCount,
  onEditGRN,
  onEditIssue,
  onEditReturn,
  onEditTransfer,
  onEditAdjustment,
  onEditCount
}) => {
  const {
    stores,
    grns,
    materialIssues,
    materialReturns,
    stockTransfers,
    stockAdjustments,
    stockCounts,
    deleteGRN,
    deleteMaterialIssue,
    deleteMaterialReturn,
    deleteStockTransfer,
    deleteStockAdjustment,
    deleteStockCount,
    clearTransactionHistory,
    reconcileStockCount,
    updateStockTransfer
  } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('ALL');

  // Slip modal state
  const [selectedSlip, setSelectedSlip] = useState<any>(null);

  // Active Clear History Modal state
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: InventoryDeleteType;
    id: string;
    code?: string;
    title: string;
    subtitle?: string;
    details?: Array<{ label: string; value: string | number }>;
  } | null>(null);

  // Filtered lists
  const filteredGRNs = useMemo(() => {
    return grns.filter(g => {
      const matchesStore = selectedStoreId === 'ALL' || g.storeId === selectedStoreId;
      const matchesSearch =
        g.grnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.poNumber && g.poNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        g.receivedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.items.some(i => i.materialName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesStore && matchesSearch;
    });
  }, [grns, selectedStoreId, searchTerm]);

  const filteredIssues = useMemo(() => {
    return materialIssues.filter(i => {
      const matchesStore = selectedStoreId === 'ALL' || i.storeId === selectedStoreId;
      const matchesSearch =
        i.issueNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.issuedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.workElement && i.workElement.toLowerCase().includes(searchTerm.toLowerCase())) ||
        i.items.some(item => item.materialName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesStore && matchesSearch;
    });
  }, [materialIssues, selectedStoreId, searchTerm]);

  const filteredReturns = useMemo(() => {
    return materialReturns.filter(r => {
      const matchesStore = selectedStoreId === 'ALL' || r.storeId === selectedStoreId;
      const matchesSearch =
        r.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.returnedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.items.some(item => item.materialName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesStore && matchesSearch;
    });
  }, [materialReturns, selectedStoreId, searchTerm]);

  const filteredTransfers = useMemo(() => {
    return stockTransfers.filter(t => {
      const matchesStore =
        selectedStoreId === 'ALL' ||
        t.sourceStoreId === selectedStoreId ||
        t.destinationStoreId === selectedStoreId;
      const matchesSearch =
        t.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.transporterVehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.items.some(item => item.materialName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesStore && matchesSearch;
    });
  }, [stockTransfers, selectedStoreId, searchTerm]);

  const filteredAdjustments = useMemo(() => {
    return stockAdjustments.filter(a => {
      const matchesStore = selectedStoreId === 'ALL' || a.storeId === selectedStoreId;
      const matchesSearch =
        a.adjustmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.authorizedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.items.some(item => item.materialName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesStore && matchesSearch;
    });
  }, [stockAdjustments, selectedStoreId, searchTerm]);

  const filteredCounts = useMemo(() => {
    return stockCounts.filter(c => {
      const matchesStore = selectedStoreId === 'ALL' || c.storeId === selectedStoreId;
      const matchesSearch =
        c.countNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.countedBy.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStore && matchesSearch;
    });
  }, [stockCounts, selectedStoreId, searchTerm]);

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    switch (deleteTarget.type) {
      case 'grn': deleteGRN(deleteTarget.id); break;
      case 'issue': deleteMaterialIssue(deleteTarget.id); break;
      case 'return': deleteMaterialReturn(deleteTarget.id); break;
      case 'transfer': deleteStockTransfer(deleteTarget.id); break;
      case 'adjustment': deleteStockAdjustment(deleteTarget.id); break;
      case 'count': deleteStockCount(deleteTarget.id); break;
    }
    setDeleteTarget(null);
  };

  const getNewButton = () => {
    switch (activeTab) {
      case 'grn':
        return { label: '+ Inward GRN', onClick: onOpenNewGRN, color: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' };
      case 'issue':
        return { label: '+ Material Issue (MIN)', onClick: onOpenNewIssue, color: 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20' };
      case 'return':
        return { label: '+ Material Return (MRN)', onClick: onOpenNewReturn, color: 'bg-teal-600 hover:bg-teal-500 shadow-teal-600/20' };
      case 'transfer':
        return { label: '+ Stock Transfer (STR)', onClick: onOpenNewTransfer, color: 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20' };
      case 'adjustment':
        return { label: '+ Stock Adjustment', onClick: onOpenNewAdjustment, color: 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20' };
      case 'count':
        return { label: '+ New Stocktake Count', onClick: onOpenNewCount, color: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20' };
    }
  };

  const newBtnConfig = getNewButton();

  return (
    <div className="space-y-4">
      {/* Tab Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 shadow-lg">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onTabChange('grn')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'grn'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>GRN (Store Inward)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {grns.length}
            </span>
          </button>

          <button
            onClick={() => onTabChange('issue')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'issue'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Material Issue (MIN)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {materialIssues.length}
            </span>
          </button>

          <button
            onClick={() => onTabChange('return')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'return'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Material Return (MRN)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {materialReturns.length}
            </span>
          </button>

          <button
            onClick={() => onTabChange('transfer')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'transfer'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Stock Transfer (STR)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {stockTransfers.length}
            </span>
          </button>

          <button
            onClick={() => onTabChange('adjustment')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'adjustment'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Stock Adjustment</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {stockAdjustments.length}
            </span>
          </button>

          <button
            onClick={() => onTabChange('count')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'count'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Stock Count</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {stockCounts.length}
            </span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={newBtnConfig.onClick}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-md ${newBtnConfig.color}`}
          >
            <Plus className="w-4 h-4" />
            {newBtnConfig.label}
          </button>

          {/* Active Clear History Trigger */}
          <button
            onClick={() => setIsClearHistoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600/30 border border-rose-500/30 transition-all shadow-sm"
            title="Clear transaction history registers or reset demo data"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Clear History</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-950 text-rose-300 font-mono font-bold border border-rose-800/60">
              {grns.length + materialIssues.length + materialReturns.length + stockTransfers.length + stockAdjustments.length + stockCounts.length}
            </span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by voucher #, items, project, supplier or storekeeper..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={selectedStoreId}
            onChange={e => setSelectedStoreId(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Stores & Warehouses</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 1. GRN Table */}
      {activeTab === 'grn' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-800/90 text-slate-300 font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3 min-w-[130px]">GRN Number</th>
                  <th className="p-3 min-w-[100px]">Date</th>
                  <th className="p-3 min-w-[170px]">Store / Warehouse</th>
                  <th className="p-3 min-w-[160px]">Supplier & PO #</th>
                  <th className="p-3 min-w-[190px]">Received Items</th>
                  <th className="p-3 min-w-[120px]">Total Amount</th>
                  <th className="p-3 min-w-[110px]">QA Status</th>
                  <th className="p-3 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredGRNs.length === 0 ? (
                  <tr><td colSpan={8} className="p-12 text-center text-slate-500 text-xs">No GRN records found.</td></tr>
                ) : (
                  filteredGRNs.map(g => (
                    <tr key={g.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <span className="font-mono font-bold text-amber-400">{g.grnNumber}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-300">{g.date}</td>
                      <td className="p-3 font-semibold text-slate-300">{g.storeName}</td>
                      <td className="p-3">
                        <div className="font-medium text-white">{g.supplierName}</div>
                        {g.poNumber && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{g.poNumber}</div>}
                      </td>
                      <td className="p-3">
                        <div className="text-slate-300">
                          {g.items.map(i => `${i.materialName} (${i.quantity} ${i.unit})`).join(', ')}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-400">
                        Rs. {g.totalAmount.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {g.inspectionStatus}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedSlip({ type: 'GRN', data: g })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                            title="Print GRN Voucher"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditGRN(g)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit GRN"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({
                              type: 'grn',
                              id: g.id,
                              code: g.grnNumber,
                              title: `Inward GRN from ${g.supplierName}`,
                              subtitle: `${g.storeName} • ${g.date}`,
                              details: [
                                { label: 'Supplier', value: g.supplierName },
                                { label: 'Store', value: g.storeName },
                                { label: 'Items', value: `${g.items.length} materials` },
                                { label: 'Total Value', value: `Rs. ${g.totalAmount.toLocaleString()}` }
                              ]
                            })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Delete GRN"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Material Issue Table */}
      {activeTab === 'issue' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-800/90 text-slate-300 font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3 min-w-[130px]">Issue # (MIN)</th>
                  <th className="p-3 min-w-[100px]">Date</th>
                  <th className="p-3 min-w-[110px]">Project</th>
                  <th className="p-3 min-w-[160px]">Source Store</th>
                  <th className="p-3 min-w-[150px]">Issued To / Section</th>
                  <th className="p-3 min-w-[200px]">Issued Materials</th>
                  <th className="p-3 min-w-[120px]">Total Cost</th>
                  <th className="p-3 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredIssues.length === 0 ? (
                  <tr><td colSpan={8} className="p-12 text-center text-slate-500 text-xs">No material issue records found.</td></tr>
                ) : (
                  filteredIssues.map(i => (
                    <tr key={i.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <span className="font-mono font-bold text-purple-400">{i.issueNumber}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-300">{i.date}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20">
                          {i.projectCode}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">{i.storeName}</td>
                      <td className="p-3">
                        <div className="font-medium text-white">{i.issuedTo}</div>
                        {i.workElement && <div className="text-[10px] text-slate-400 line-clamp-1">{i.workElement}</div>}
                      </td>
                      <td className="p-3">
                        <div className="text-slate-300">
                          {i.items.map(it => `${it.materialName} (${it.quantity} ${it.unit})`).join(', ')}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-purple-400">
                        Rs. {i.totalValue.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedSlip({ type: 'ISSUE', data: i })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                            title="Print MIN Voucher"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditIssue(i)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit Issue"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({
                              type: 'issue',
                              id: i.id,
                              code: i.issueNumber,
                              title: `Material Issue for Project ${i.projectCode}`,
                              subtitle: `Issued To: ${i.issuedTo} • ${i.storeName}`,
                              details: [
                                { label: 'Project', value: i.projectCode },
                                { label: 'Recipient', value: i.issuedTo },
                                { label: 'Store', value: i.storeName },
                                { label: 'Total Value', value: `Rs. ${i.totalValue.toLocaleString()}` }
                              ]
                            })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Delete Issue"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Material Return Table */}
      {activeTab === 'return' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-800/90 text-slate-300 font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3 min-w-[130px]">Return # (MRN)</th>
                  <th className="p-3 min-w-[100px]">Date</th>
                  <th className="p-3 min-w-[110px]">Project</th>
                  <th className="p-3 min-w-[160px]">Receiving Store</th>
                  <th className="p-3 min-w-[160px]">Returned By & Reason</th>
                  <th className="p-3 min-w-[190px]">Returned Materials</th>
                  <th className="p-3 min-w-[120px]">Credit Value</th>
                  <th className="p-3 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredReturns.length === 0 ? (
                  <tr><td colSpan={8} className="p-12 text-center text-slate-500 text-xs">No return records found.</td></tr>
                ) : (
                  filteredReturns.map(r => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-teal-400">{r.returnNumber}</td>
                      <td className="p-3 font-mono text-slate-300">{r.date}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20">
                          {r.projectCode}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">{r.storeName}</td>
                      <td className="p-3">
                        <div className="font-medium text-white">{r.returnedBy}</div>
                        <div className="text-[10px] text-slate-400">{r.reason.replace(/_/g, ' ')}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-300">
                          {r.items.map(it => `${it.materialName} (${it.quantity} ${it.unit})`).join(', ')}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-teal-400">
                        Rs. {r.totalValue.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedSlip({ type: 'RETURN', data: r })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                            title="Print MRN Voucher"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditReturn(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit Return"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({
                              type: 'return',
                              id: r.id,
                              code: r.returnNumber,
                              title: `Material Return from Project ${r.projectCode}`,
                              subtitle: `Returned by: ${r.returnedBy} • ${r.storeName}`,
                              details: [
                                { label: 'Project', value: r.projectCode },
                                { label: 'Returned By', value: r.returnedBy },
                                { label: 'Reason', value: r.reason.replace(/_/g, ' ') },
                                { label: 'Items', value: `${r.items.length} materials` }
                              ]
                            })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Delete Return"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Stock Transfer Table */}
      {activeTab === 'transfer' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-800/90 text-slate-300 font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3 min-w-[130px]">Transfer # (STR)</th>
                  <th className="p-3 min-w-[100px]">Date</th>
                  <th className="p-3 min-w-[160px]">Source Store</th>
                  <th className="p-3 min-w-[160px]">Destination Store</th>
                  <th className="p-3 min-w-[140px]">Vehicle & Driver</th>
                  <th className="p-3 min-w-[120px]">Valuation</th>
                  <th className="p-3 min-w-[120px]">Status</th>
                  <th className="p-3 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredTransfers.length === 0 ? (
                  <tr><td colSpan={8} className="p-12 text-center text-slate-500 text-xs">No transfer records found.</td></tr>
                ) : (
                  filteredTransfers.map(t => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-cyan-400">{t.transferNumber}</td>
                      <td className="p-3 font-mono text-slate-300">{t.date}</td>
                      <td className="p-3 text-slate-300">{t.sourceStoreName}</td>
                      <td className="p-3 font-semibold text-cyan-300">{t.destinationStoreName}</td>
                      <td className="p-3">
                        <div className="font-mono text-white text-[11px]">{t.transporterVehicle}</div>
                        <div className="text-[10px] text-slate-400">{t.driverName}</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-cyan-400">
                        Rs. {t.totalValue.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.status === 'RECEIVED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse'
                          }`}>
                            {t.status}
                          </span>
                          {t.status !== 'RECEIVED' && (
                            <button
                              onClick={() => updateStockTransfer(t.id, { status: 'RECEIVED', receivedDate: new Date().toISOString().split('T')[0] })}
                              className="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-[10px] text-white font-semibold transition-colors"
                              title="Acknowledge Receipt at Destination Store"
                            >
                              Receive
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedSlip({ type: 'TRANSFER', data: t })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                            title="Print Transfer Gate Pass"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditTransfer(t)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit Transfer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({
                              type: 'transfer',
                              id: t.id,
                              code: t.transferNumber,
                              title: `Stock Transfer: ${t.sourceStoreName} ➔ ${t.destinationStoreName}`,
                              subtitle: `Status: ${t.status} • Vehicle: ${t.transporterVehicle}`,
                              details: [
                                { label: 'Source', value: t.sourceStoreName },
                                { label: 'Destination', value: t.destinationStoreName },
                                { label: 'Driver', value: t.driverName },
                                { label: 'Status', value: t.status }
                              ]
                            })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Delete Transfer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Stock Adjustment Table */}
      {activeTab === 'adjustment' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-800/90 text-slate-300 font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3 min-w-[130px]">Adjustment #</th>
                  <th className="p-3 min-w-[100px]">Date</th>
                  <th className="p-3 min-w-[160px]">Store</th>
                  <th className="p-3 min-w-[110px]">Type</th>
                  <th className="p-3 min-w-[160px]">Reason & Approver</th>
                  <th className="p-3 min-w-[190px]">Adjusted Items</th>
                  <th className="p-3 min-w-[120px]">Value Impact</th>
                  <th className="p-3 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredAdjustments.length === 0 ? (
                  <tr><td colSpan={8} className="p-12 text-center text-slate-500 text-xs">No adjustment records found.</td></tr>
                ) : (
                  filteredAdjustments.map(a => (
                    <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-rose-400">{a.adjustmentNumber}</td>
                      <td className="p-3 font-mono text-slate-300">{a.date}</td>
                      <td className="p-3 text-slate-300">{a.storeName}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          a.adjustmentType === 'INCREASE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {a.adjustmentType}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-white font-medium">{a.reason.replace(/_/g, ' ')}</div>
                        <div className="text-[10px] text-slate-400">Auth: {a.authorizedBy}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-300">
                          {a.items.map(it => `${it.materialName} (${it.quantity} ${it.unit})`).join(', ')}
                        </div>
                      </td>
                      <td className={`p-3 font-mono font-bold ${a.adjustmentType === 'INCREASE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {a.adjustmentType === 'INCREASE' ? '+' : '-'}Rs. {Math.abs(a.totalValueImpact).toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedSlip({ type: 'ADJUSTMENT', data: a })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                            title="Print Adjustment Slip"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditAdjustment(a)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit Adjustment"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({
                              type: 'adjustment',
                              id: a.id,
                              code: a.adjustmentNumber,
                              title: `Stock Adjustment (${a.type || a.adjustmentType})`,
                              subtitle: `Store: ${a.storeName} • ${a.date}`,
                              details: [
                                { label: 'Store', value: a.storeName },
                                { label: 'Reason', value: a.reason.replace(/_/g, ' ') },
                                { label: 'Items', value: `${a.items.length} items` },
                                { label: 'Total Value', value: `Rs. ${a.totalValueImpact.toLocaleString()}` }
                              ]
                            })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Delete Adjustment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Stock Count Table */}
      {activeTab === 'count' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-800/90 text-slate-300 font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3 min-w-[130px]">Count Sheet #</th>
                  <th className="p-3 min-w-[100px]">Audit Date</th>
                  <th className="p-3 min-w-[160px]">Store Audit Location</th>
                  <th className="p-3 min-w-[160px]">Audited By</th>
                  <th className="p-3 min-w-[110px]">SKUs Counted</th>
                  <th className="p-3 min-w-[130px]">Net Variance Val</th>
                  <th className="p-3 min-w-[130px]">Audit Status</th>
                  <th className="p-3 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredCounts.length === 0 ? (
                  <tr><td colSpan={8} className="p-12 text-center text-slate-500 text-xs">No stocktake count records found.</td></tr>
                ) : (
                  filteredCounts.map(c => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-indigo-400">{c.countNumber}</td>
                      <td className="p-3 font-mono text-slate-300">{c.date}</td>
                      <td className="p-3 text-slate-300 font-semibold">{c.storeName}</td>
                      <td className="p-3">
                        <div className="text-white font-medium">{c.countedBy}</div>
                        {c.verifiedBy && <div className="text-[10px] text-slate-400">Ver: {c.verifiedBy}</div>}
                      </td>
                      <td className="p-3 font-mono text-slate-300">{c.items.length} SKUs</td>
                      <td className={`p-3 font-mono font-bold ${c.netVarianceValue !== 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                        Rs. {c.netVarianceValue.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            c.status === 'RECONCILED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          }`}>
                            {c.status}
                          </span>
                          {c.status !== 'RECONCILED' && (
                            <button
                              onClick={() => reconcileStockCount(c.id)}
                              className="px-1.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-[10px] text-white font-semibold transition-colors"
                              title="Apply physical count to system book stock"
                            >
                              Reconcile
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedSlip({ type: 'COUNT', data: c })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                            title="Print Count Sheet"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditCount(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit Count Sheet"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({
                              type: 'count',
                              id: c.id,
                              code: c.countNumber,
                              title: `Stock Count Sheet (${c.status})`,
                              subtitle: `Store: ${c.storeName} • Counted by: ${c.countedBy}`,
                              details: [
                                { label: 'Store', value: c.storeName },
                                { label: 'Counted By', value: c.countedBy },
                                { label: 'Status', value: c.status },
                                { label: 'Items Audited', value: `${c.items.length} materials` }
                              ]
                            })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Delete Count"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slip Modal */}
      {selectedSlip && (
        <TransactionSlipModal
          isOpen={true}
          onClose={() => setSelectedSlip(null)}
          slip={selectedSlip}
        />
      )}

      {/* Individual Delete Confirmation Modal */}
      {deleteTarget && (
        <InventoryDeleteModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          type={deleteTarget.type}
          id={deleteTarget.id}
          title={deleteTarget.title}
          code={deleteTarget.code}
          subtitle={deleteTarget.subtitle}
          details={deleteTarget.details}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {/* Active Clear History Modal */}
      <InventoryClearHistoryModal
        isOpen={isClearHistoryModalOpen}
        onClose={() => setIsClearHistoryModalOpen(false)}
        defaultScope={
          activeTab === 'grn'
            ? 'GRN'
            : activeTab === 'issue'
            ? 'MATERIAL_ISSUE'
            : activeTab === 'return'
            ? 'MATERIAL_RETURN'
            : activeTab === 'transfer'
            ? 'STOCK_TRANSFER'
            : activeTab === 'adjustment'
            ? 'STOCK_ADJUSTMENT'
            : activeTab === 'count'
            ? 'STOCK_COUNT'
            : 'ALL'
        }
      />
    </div>
  );
};
