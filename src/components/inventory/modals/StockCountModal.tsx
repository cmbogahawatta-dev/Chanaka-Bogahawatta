import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ClipboardCheck, AlertCircle, RefreshCw, Calendar, Building2, CheckCircle2 } from 'lucide-react';
import { StockCount } from '../../../types/inventoryTypes';
import { useInventory } from '../../../context/InventoryContext';

interface StockCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  count?: StockCount | null;
}

export const StockCountModal: React.FC<StockCountModalProps> = ({
  isOpen,
  onClose,
  count
}) => {
  const { stores, materials, stockBalances, createStockCount, updateStockCount, reconcileStockCount } = useInventory();

  const [countNumber, setCountNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [storeId, setStoreId] = useState(stores[0]?.id || '');
  const [countedBy, setCountedBy] = useState('');
  const [verifiedBy, setVerifiedBy] = useState('');
  const [status, setStatus] = useState<'IN_PROGRESS' | 'COMPLETED' | 'RECONCILED'>('IN_PROGRESS');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{
    materialId: string;
    materialCode: string;
    materialName: string;
    unit: string;
    systemQuantity: number;
    physicalQuantity: number;
    variance: number;
    unitCost: number;
    varianceValue: number;
    remarks?: string;
  }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper to load all materials in the selected store
  const populateStoreStock = (selectedStoreId: string) => {
    const storeItems = materials.map(m => {
      const bal = stockBalances.find(b => b.materialId === m.id && b.storeId === selectedStoreId);
      const sysQty = bal ? bal.onHandQuantity : 0;
      const cost = m.averageCost || m.standardCost || 0;
      return {
        materialId: m.id,
        materialCode: m.code,
        materialName: m.name,
        unit: m.unit,
        systemQuantity: sysQty,
        physicalQuantity: sysQty,
        variance: 0,
        unitCost: cost,
        varianceValue: 0,
        remarks: ''
      };
    });
    setItems(storeItems);
  };

  useEffect(() => {
    if (count) {
      setCountNumber(count.countNumber);
      setDate(count.date);
      setStoreId(count.storeId);
      setCountedBy(count.countedBy);
      setVerifiedBy(count.verifiedBy || '');
      setStatus(count.status);
      setNotes(count.notes || '');
      setItems(count.items.map(i => ({
        materialId: i.materialId,
        materialCode: i.materialCode,
        materialName: i.materialName,
        unit: i.unit,
        systemQuantity: i.systemQuantity ?? i.bookQty ?? 0,
        physicalQuantity: i.physicalQuantity ?? i.physicalQty ?? 0,
        variance: i.variance ?? i.varianceQty ?? 0,
        unitCost: i.unitCost,
        varianceValue: i.varianceValue,
        remarks: i.remarks ?? i.notes ?? ''
      })));
    } else {
      const randomNum = String(Math.floor(Math.random() * 900) + 100);
      setCountNumber(`STC-2026-Q3-${randomNum}`);
      setDate(new Date().toISOString().split('T')[0]);
      const initialStoreId = stores[0]?.id || '';
      setStoreId(initialStoreId);
      setCountedBy('Kasun Bandara & Internal Auditor');
      setVerifiedBy('Audit Head Perera');
      setStatus('IN_PROGRESS');
      setNotes('');
      populateStoreStock(initialStoreId);
    }
    setErrors({});
  }, [count, isOpen, stores, materials, stockBalances]);

  if (!isOpen) return null;

  const handleStoreChange = (newStoreId: string) => {
    setStoreId(newStoreId);
    if (!count) {
      populateStoreStock(newStoreId);
    }
  };

  const handlePhysicalQtyChange = (index: number, val: number) => {
    setItems(prev => {
      const updated = [...prev];
      const cur = updated[index];
      const variance = val - cur.systemQuantity;
      const varianceValue = variance * cur.unitCost;
      updated[index] = {
        ...cur,
        physicalQuantity: val,
        variance,
        varianceValue
      };
      return updated;
    });
  };

  const totalVarianceValue = items.reduce((sum, i) => sum + i.varianceValue, 0);
  const varianceItemCount = items.filter(i => i.variance !== 0).length;

  const handleSubmit = (e: React.FormEvent, applyReconciliation: boolean = false) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!countNumber.trim()) newErrors.countNumber = 'Count Number is required';
    if (!date) newErrors.date = 'Date is required';
    if (!storeId) newErrors.storeId = 'Store is required';
    if (!countedBy.trim()) newErrors.countedBy = 'Counted by is required';
    if (items.length === 0) newErrors.items = 'Add at least one material to count';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedStore = stores.find(s => s.id === storeId);

    const totalBookValue = items.reduce((sum, i) => sum + i.systemQuantity * i.unitCost, 0);
    const totalPhysicalValue = items.reduce((sum, i) => sum + i.physicalQuantity * i.unitCost, 0);

    const transactionItems = items.map((i, idx) => ({
      id: `count-item-${Date.now()}-${idx}`,
      materialId: i.materialId,
      materialCode: i.materialCode,
      materialName: i.materialName,
      unit: i.unit,
      bookQty: i.systemQuantity,
      physicalQty: i.physicalQuantity,
      varianceQty: i.variance,
      unitCost: i.unitCost,
      varianceValue: i.varianceValue,
      reconciled: applyReconciliation,
      notes: i.remarks,
      systemQuantity: i.systemQuantity,
      physicalQuantity: i.physicalQuantity,
      variance: i.variance,
      remarks: i.remarks
    }));

    if (count) {
      updateStockCount(count.id, {
        countNumber: countNumber.trim(),
        date,
        storeId,
        storeName: selectedStore?.name || 'Store',
        countedBy: countedBy.trim(),
        verifiedBy: verifiedBy.trim() || undefined,
        status: applyReconciliation ? 'RECONCILED' : status,
        notes: notes.trim() || undefined,
        items: transactionItems,
        totalBookValue,
        totalPhysicalValue,
        netVarianceValue: totalVarianceValue,
        totalVarianceValue
      });
      if (applyReconciliation) {
        reconcileStockCount(count.id);
      }
    } else {
      createStockCount({
        countNumber: countNumber.trim(),
        date,
        storeId,
        storeName: selectedStore?.name || 'Store',
        countedBy: countedBy.trim(),
        verifiedBy: verifiedBy.trim() || undefined,
        status: applyReconciliation ? 'RECONCILED' : 'COMPLETED',
        notes: notes.trim() || undefined,
        items: transactionItems,
        totalBookValue,
        totalPhysicalValue,
        netVarianceValue: totalVarianceValue,
        totalVarianceValue
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {count ? 'Physical Stocktake & Reconciliation' : 'New Physical Stock Count Sheet'}
              </h2>
              <p className="text-xs text-slate-400">
                Compare physical on-floor counts against system ledger books and reconcile variances
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form className="overflow-y-auto p-6 space-y-6 flex-1 text-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Count Sheet # *</label>
              <input
                type="text"
                value={countNumber}
                onChange={e => setCountNumber(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono font-semibold"
              />
              {errors.countNumber && <p className="text-red-400 text-xs mt-1">{errors.countNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Count Date *</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Store / Warehouse *</label>
              <select
                value={storeId}
                onChange={e => handleStoreChange(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Audit Status *</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="IN_PROGRESS">In Progress (Field Count)</option>
                <option value="COMPLETED">Completed (Pending Approval)</option>
                <option value="RECONCILED">Reconciled (Ledger Adjusted)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Counted By (Stock Auditors) *</label>
              <input
                type="text"
                placeholder="e.g. Kasun Bandara & Internal Auditor"
                value={countedBy}
                onChange={e => setCountedBy(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              {errors.countedBy && <p className="text-red-400 text-xs mt-1">{errors.countedBy}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Verified By (Senior Engineer / In-Charge)</label>
              <input
                type="text"
                placeholder="e.g. Audit Head Perera"
                value={verifiedBy}
                onChange={e => setVerifiedBy(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardCheck className="w-3.5 h-3.5" /> Physical Count Verification Table ({items.length} SKUs)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => populateStoreStock(storeId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  title="Reload Book Stocks from System"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh System Stocks
                </button>
              </div>
            </div>

            {errors.items && <p className="text-red-400 text-xs">{errors.items}</p>}

            <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-[380px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-800/90 text-slate-300 font-semibold border-b border-slate-700 sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th className="p-2.5 min-w-[180px]">Material Item</th>
                    <th className="p-2.5 min-w-[90px]">Book Qty</th>
                    <th className="p-2.5 min-w-[110px]">Physical Count</th>
                    <th className="p-2.5 min-w-[90px]">Variance</th>
                    <th className="p-2.5 min-w-[70px]">UOM</th>
                    <th className="p-2.5 min-w-[90px]">Unit Cost</th>
                    <th className="p-2.5 min-w-[110px]">Variance Val</th>
                    <th className="p-2.5 min-w-[130px]">Notes / Bin Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {items.map((item, idx) => {
                    const hasVariance = item.variance !== 0;
                    return (
                      <tr key={idx} className={`hover:bg-slate-800/30 transition-colors ${hasVariance ? 'bg-amber-950/15' : ''}`}>
                        <td className="p-2">
                          <div className="font-medium text-white">{item.materialName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.materialCode}</div>
                        </td>
                        <td className="p-2">
                          <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {item.systemQuantity.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.physicalQuantity}
                            onChange={e => handlePhysicalQtyChange(idx, Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-indigo-300 focus:outline-none focus:border-indigo-500 font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                            item.variance > 0
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : item.variance < 0
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'text-slate-500'
                          }`}>
                            {item.variance > 0 ? `+${item.variance}` : item.variance}
                          </span>
                        </td>
                        <td className="p-2 text-slate-400 font-mono">{item.unit}</td>
                        <td className="p-2 text-slate-300 font-mono">
                          Rs. {item.unitCost.toLocaleString()}
                        </td>
                        <td className={`p-2 font-mono font-semibold ${
                          item.varianceValue > 0 ? 'text-emerald-400' : item.varianceValue < 0 ? 'text-rose-400' : 'text-slate-500'
                        }`}>
                          {item.varianceValue > 0 ? '+' : ''}Rs. {item.varianceValue.toLocaleString()}
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="e.g. Bin verified"
                            value={item.remarks || ''}
                            onChange={e => {
                              const val = e.target.value;
                              setItems(prev => prev.map((it, i) => i === idx ? { ...it, remarks: val } : it));
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Reconciliation Variance Summary */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-800/60 border border-slate-700/80 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Variances Identified:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${varianceItemCount > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-300'}`}>
                  {varianceItemCount} of {items.length} items have variance
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Net Variance Financial Value:</span>
                <span className={`text-base font-bold font-mono ${totalVarianceValue < 0 ? 'text-rose-400' : totalVarianceValue > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {totalVarianceValue > 0 ? '+' : ''}LKR {totalVarianceValue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Stocktake Remarks / Auditor Observations</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Annual physical count conducted with physical tape verification of bulk piles and rebar bundle tagging..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={e => handleSubmit(e, false)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
              >
                Save Draft Count
              </button>
              <button
                type="button"
                onClick={e => handleSubmit(e, true)}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Reconcile & Update Book Stocks
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
