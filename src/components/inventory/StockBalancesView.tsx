import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Search,
  Building2,
  Filter,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Clock,
  Layers,
  CheckCircle2,
  DollarSign,
  FileText,
  Edit2,
  Trash2
} from 'lucide-react';
import { StockBalance, StockBatch } from '../../types/inventoryTypes';
import { useInventory } from '../../context/InventoryContext';
import { StockBalanceEditModal } from './modals/StockBalanceEditModal';
import { BatchEditModal } from './modals/BatchEditModal';
import { InventoryDeleteModal } from './modals/InventoryDeleteModal';

export const StockBalancesView: React.FC = () => {
  const {
    stores,
    materials,
    stockBalances,
    batches,
    updateBatch,
    deleteBatch,
    updateStockBalance,
    deleteStockBalance
  } = useInventory();

  const [activeSubTab, setActiveSubTab] = useState<'balances' | 'batches'>('balances');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Edit / Delete Modals State
  const [editingBalance, setEditingBalance] = useState<StockBalance | null>(null);
  const [editingBatch, setEditingBatch] = useState<StockBatch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'balance' | 'batch';
    id: string;
    code?: string;
    title: string;
    subtitle?: string;
    details?: Array<{ label: string; value: string | number }>;
    storeId?: string;
    materialId?: string;
  } | null>(null);

  // Enriched Stock Balances
  const enrichedBalances = useMemo(() => {
    return stockBalances.map(b => {
      const mat = materials.find(m => m.id === b.materialId);
      const store = stores.find(s => s.id === b.storeId);
      const unitCost = mat?.averageCost || mat?.standardCost || 0;
      const totalVal = b.onHandQuantity * unitCost;
      const minStock = mat?.minStockLevel || 0;
      const isLowStock = b.onHandQuantity <= minStock;
      const isOutOfStock = b.onHandQuantity <= 0;

      return {
        ...b,
        id: `${b.storeId}-${b.materialId}`,
        materialName: mat?.name || 'Unknown Material',
        materialCode: mat?.code || 'N/A',
        category: mat?.category || 'OTHER',
        unit: mat?.unit || 'Nos',
        storeName: store?.name || 'Unknown Store',
        unitCost,
        totalVal,
        minStock,
        isLowStock,
        isOutOfStock
      };
    });
  }, [stockBalances, materials, stores]);

  const filteredBalances = useMemo(() => {
    return enrichedBalances.filter(b => {
      const matchesStore = selectedStoreId === 'ALL' || b.storeId === selectedStoreId;
      const matchesSearch =
        b.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.locationBin && b.locationBin.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesStore && matchesSearch;
    });
  }, [enrichedBalances, selectedStoreId, searchTerm]);

  // Enriched Batches
  const enrichedBatches = useMemo(() => {
    return batches.map(batch => {
      const mat = materials.find(m => m.id === batch.materialId);
      const store = stores.find(s => s.id === batch.storeId);
      const daysToExpiry = batch.expiryDate
        ? Math.ceil((new Date(batch.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

      let batchStatus: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'DEPLETED' = 'ACTIVE';
      if (batch.remainingQuantity <= 0) {
        batchStatus = 'DEPLETED';
      } else if (daysToExpiry !== null && daysToExpiry < 0) {
        batchStatus = 'EXPIRED';
      } else if (daysToExpiry !== null && daysToExpiry <= 30) {
        batchStatus = 'EXPIRING_SOON';
      }

      return {
        ...batch,
        materialName: mat?.name || batch.materialName,
        materialCode: mat?.code || batch.materialCode,
        storeName: store?.name || batch.storeName,
        daysToExpiry,
        batchStatus,
        totalBatchValue: batch.remainingQuantity * batch.unitCost
      };
    });
  }, [batches, materials, stores]);

  const filteredBatches = useMemo(() => {
    return enrichedBatches.filter(b => {
      const matchesStore = selectedStoreId === 'ALL' || b.storeId === selectedStoreId;
      const matchesSearch =
        b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.supplierName && b.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.millCertNumber && b.millCertNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesStore && matchesSearch;
    });
  }, [enrichedBatches, selectedStoreId, searchTerm]);

  const totalFilteredValue = activeSubTab === 'balances'
    ? filteredBalances.reduce((sum, b) => sum + b.totalVal, 0)
    : filteredBatches.reduce((sum, b) => sum + b.totalBatchValue, 0);

  return (
    <div className="space-y-4">
      {/* Header & Sub-Tab Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Warehouse Stock Balances & Batch Tracking
            </h2>
            <p className="text-xs text-slate-400">
              Live bin-level quantities, allocations, heat/mill batches & expiry tracking
            </p>
          </div>
        </div>

        {/* Sub-Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-800/80 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveSubTab('balances')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'balances'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Warehouse Balances ({filteredBalances.length})
          </button>
          <button
            onClick={() => setActiveSubTab('batches')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'batches'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Batches & Mill Certs ({filteredBatches.length})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={activeSubTab === 'balances' ? "Search material name, code, store, rack bin..." : "Search batch #, mill certificate, supplier..."}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedStoreId}
            onChange={e => setSelectedStoreId(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Stores & Warehouses</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3 flex items-center justify-end">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Filtered Valuation:</span>
            <span className="text-xs font-bold text-indigo-400 font-mono">
              LKR {totalFilteredValue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Content View 1: Stock Balances Table */}
      {activeSubTab === 'balances' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-800/90 text-slate-300 font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3 min-w-[200px]">Material Item</th>
                  <th className="p-3 min-w-[180px]">Warehouse / Store</th>
                  <th className="p-3 min-w-[100px]">On-Hand Qty</th>
                  <th className="p-3 min-w-[90px]">Allocated</th>
                  <th className="p-3 min-w-[100px]">Available</th>
                  <th className="p-3 min-w-[70px]">UOM</th>
                  <th className="p-3 min-w-[100px]">Unit Cost</th>
                  <th className="p-3 min-w-[120px]">Total Valuation</th>
                  <th className="p-3 min-w-[130px]">Rack / Bin</th>
                  <th className="p-3 min-w-[110px]">Status</th>
                  <th className="p-3 w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredBalances.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-12 text-center text-slate-500 text-xs">
                      No stock balances found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredBalances.map(b => (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-white">{b.materialName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{b.materialCode}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-300">{b.storeName}</div>
                      </td>

                      <td className="p-3 font-mono font-bold text-sm text-white">
                        {b.onHandQuantity.toLocaleString()}
                      </td>

                      <td className="p-3 font-mono text-slate-400">
                        {b.allocatedQuantity.toLocaleString()}
                      </td>

                      <td className="p-3 font-mono font-bold text-emerald-400">
                        {b.availableQuantity.toLocaleString()}
                      </td>

                      <td className="p-3 text-slate-400 font-mono">{b.unit}</td>

                      <td className="p-3 font-mono text-slate-300">
                        Rs. {b.unitCost.toLocaleString()}
                      </td>

                      <td className="p-3 font-mono font-bold text-white">
                        Rs. {b.totalVal.toLocaleString()}
                      </td>

                      <td className="p-3 text-slate-300 font-mono text-[11px]">
                        {b.locationBin || 'Floor Stack'}
                      </td>

                      <td className="p-3">
                        {b.isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                            Out of Stock
                          </span>
                        ) : b.isLowStock ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Healthy
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingBalance(b)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit Bin Location / Shelf Rack"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({
                              type: 'balance',
                              id: `${b.storeId}-${b.materialId}`,
                              code: b.materialCode,
                              title: `${b.materialName} @ ${b.storeName}`,
                              subtitle: `Location: ${b.locationBin || 'Floor Stack'} • UOM: ${b.unit}`,
                              details: [
                                { label: 'Store', value: b.storeName },
                                { label: 'Material', value: b.materialName },
                                { label: 'On-Hand Stock', value: `${b.onHandQuantity.toLocaleString()} ${b.unit}` },
                                { label: 'Total Valuation', value: `Rs. ${b.totalVal.toLocaleString()}` }
                              ],
                              storeId: b.storeId,
                              materialId: b.materialId
                            })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Delete Stock Balance Record"
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

      {/* Content View 2: Batches & Mill Test Certificates */}
      {activeSubTab === 'batches' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-800/90 text-slate-300 font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3 min-w-[140px]">Batch / Heat #</th>
                  <th className="p-3 min-w-[190px]">Material Item</th>
                  <th className="p-3 min-w-[150px]">Store</th>
                  <th className="p-3 min-w-[100px]">Initial Qty</th>
                  <th className="p-3 min-w-[110px]">Remaining Qty</th>
                  <th className="p-3 min-w-[100px]">Unit Cost</th>
                  <th className="p-3 min-w-[110px]">Valuation</th>
                  <th className="p-3 min-w-[140px]">Mfg & Expiry Date</th>
                  <th className="p-3 min-w-[160px]">Supplier & Mill Cert</th>
                  <th className="p-3 min-w-[110px]">Status</th>
                  <th className="p-3 w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-12 text-center text-slate-500 text-xs">
                      No batch records found.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map(batch => (
                    <tr key={batch.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {batch.batchNumber}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-white">{batch.materialName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{batch.materialCode}</div>
                      </td>

                      <td className="p-3 text-slate-300">{batch.storeName}</td>

                      <td className="p-3 font-mono text-slate-400">
                        {batch.initialQuantity} {batch.unit}
                      </td>

                      <td className="p-3 font-mono font-bold text-sm text-white">
                        {batch.remainingQuantity} {batch.unit}
                      </td>

                      <td className="p-3 font-mono text-slate-300">
                        Rs. {batch.unitCost.toLocaleString()}
                      </td>

                      <td className="p-3 font-mono font-bold text-indigo-400">
                        Rs. {batch.totalBatchValue.toLocaleString()}
                      </td>

                      <td className="p-3">
                        {batch.expiryDate ? (
                          <div>
                            <div className="text-[11px] font-mono text-slate-300">Exp: {batch.expiryDate}</div>
                            {batch.daysToExpiry !== null && (
                              <div className={`text-[10px] font-semibold mt-0.5 ${
                                batch.daysToExpiry < 0
                                  ? 'text-rose-400'
                                  : batch.daysToExpiry <= 30
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}>
                                {batch.daysToExpiry < 0 ? 'Expired' : `${batch.daysToExpiry} days remaining`}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">No Expiry</span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="text-slate-300 truncate">{batch.supplierName || 'Primary Supplier'}</div>
                        {batch.millCertNumber && (
                          <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1 mt-0.5">
                            <FileText className="w-3 h-3" />
                            <span>Cert: {batch.millCertNumber}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          batch.batchStatus === 'EXPIRED'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : batch.batchStatus === 'EXPIRING_SOON'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : batch.batchStatus === 'DEPLETED'
                            ? 'bg-slate-700 text-slate-400'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {batch.batchStatus.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingBatch(batch)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit Batch / Test Cert / Expiry"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({
                              type: 'batch',
                              id: batch.id,
                              code: batch.batchNumber,
                              title: `Batch #${batch.batchNumber} - ${batch.materialName}`,
                              subtitle: `Store: ${batch.storeName} • Remaining: ${batch.remainingQuantity} ${batch.unit}`,
                              details: [
                                { label: 'Batch #', value: batch.batchNumber },
                                { label: 'Material', value: batch.materialName },
                                { label: 'Store', value: batch.storeName },
                                { label: 'Remaining Qty', value: `${batch.remainingQuantity} ${batch.unit}` },
                                { label: 'Mill Cert', value: batch.millCertNumber || 'None' }
                              ]
                            })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Delete Batch Record"
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

      {/* Stock Balance Edit Modal */}
      {editingBalance && (
        <StockBalanceEditModal
          isOpen={true}
          balance={editingBalance}
          onClose={() => setEditingBalance(null)}
        />
      )}

      {/* Batch Edit Modal */}
      {editingBatch && (
        <BatchEditModal
          isOpen={true}
          batch={editingBatch}
          onClose={() => setEditingBatch(null)}
        />
      )}

      {/* Inventory Delete Modal */}
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
          onConfirm={() => {
            if (deleteTarget.type === 'balance' && deleteTarget.storeId && deleteTarget.materialId) {
              deleteStockBalance(deleteTarget.storeId, deleteTarget.materialId);
            } else if (deleteTarget.type === 'batch') {
              deleteBatch(deleteTarget.id);
            }
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
};
