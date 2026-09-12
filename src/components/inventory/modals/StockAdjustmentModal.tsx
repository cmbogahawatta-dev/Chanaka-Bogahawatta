import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Sliders, AlertTriangle, Calendar, Building2, CheckCircle2 } from 'lucide-react';
import { StockAdjustment, StockAdjustmentType } from '../../../types/inventoryTypes';
import { useInventory } from '../../../context/InventoryContext';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  adjustment?: StockAdjustment | null;
}

const REASONS = [
  { value: 'DAMAGED_BROKEN', label: 'Handling Breakage / Physical Damage' },
  { value: 'SPOILED_EXPIRED', label: 'Weather / Rain Moisture Spoilage' },
  { value: 'THEFT_PILFERAGE', label: 'Theft / Unaccounted Pilferage' },
  { value: 'SURVEY_SURPLUS', label: 'Physical Audit Surplus Found' },
  { value: 'SCRAP_DISPOSAL', label: 'Scrap Metal / Offcut Disposal' },
  { value: 'DATA_CORRECTION', label: 'Data Entry Error Correction' }
];

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  adjustment
}) => {
  const { stores, materials, stockBalances, createStockAdjustment, updateStockAdjustment } = useInventory();

  const [adjustmentNumber, setAdjustmentNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [storeId, setStoreId] = useState(stores[0]?.id || '');
  const [type, setType] = useState<StockAdjustmentType>('DECREASE');
  const [reason, setReason] = useState<any>('DAMAGED_BROKEN');
  const [authorizedBy, setAuthorizedBy] = useState('');
  const [adjustedBy, setAdjustedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{
    materialId: string;
    materialCode: string;
    materialName: string;
    unit: string;
    quantity: number;
    unitCost: number;
    totalValue: number;
    reasonNotes?: string;
  }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (adjustment) {
      setAdjustmentNumber(adjustment.adjustmentNumber);
      setDate(adjustment.date);
      setStoreId(adjustment.storeId);
      setType(adjustment.type || adjustment.adjustmentType || 'DECREASE');
      setReason(adjustment.reason);
      setAuthorizedBy(adjustment.authorizedBy);
      setAdjustedBy(adjustment.adjustedBy);
      setNotes(adjustment.notes || '');
      setItems(adjustment.items.map(i => ({
        materialId: i.materialId,
        materialCode: i.materialCode,
        materialName: i.materialName,
        unit: i.unit,
        quantity: i.quantity,
        unitCost: i.unitCost,
        totalValue: i.totalValue,
        reasonNotes: i.reasonNotes || ''
      })));
    } else {
      const randomNum = String(Math.floor(Math.random() * 900) + 100);
      setAdjustmentNumber(`ADJ-2026-${randomNum}`);
      setDate(new Date().toISOString().split('T')[0]);
      setStoreId(stores[0]?.id || '');
      setType('DECREASE');
      setReason('DAMAGED_BROKEN');
      setAuthorizedBy('Chief Engineer Fernando');
      setAdjustedBy('Sunil Wijesinghe');
      setNotes('');
      if (materials.length > 0) {
        const mat = materials[0];
        setItems([
          {
            materialId: mat.id,
            materialCode: mat.code,
            materialName: mat.name,
            unit: mat.unit,
            quantity: 2,
            unitCost: mat.standardCost || 0,
            totalValue: 2 * (mat.standardCost || 0),
            reasonNotes: 'Bags burst during transit'
          }
        ]);
      } else {
        setItems([]);
      }
    }
    setErrors({});
  }, [adjustment, isOpen, stores, materials]);

  if (!isOpen) return null;

  const getCurrentStock = (matId: string) => {
    const bal = stockBalances.find(b => b.materialId === matId && b.storeId === storeId);
    return bal ? bal.onHandQuantity : 0;
  };

  const handleAddItem = () => {
    if (materials.length === 0) return;
    const defaultMat = materials[0];
    setItems(prev => [
      ...prev,
      {
        materialId: defaultMat.id,
        materialCode: defaultMat.code,
        materialName: defaultMat.name,
        unit: defaultMat.unit,
        quantity: 1,
        unitCost: defaultMat.standardCost || 0,
        totalValue: 1 * (defaultMat.standardCost || 0),
        reasonNotes: ''
      }
    ]);
  };

  const handleMaterialChange = (index: number, matId: string) => {
    const mat = materials.find(m => m.id === matId);
    if (!mat) return;
    setItems(prev => {
      const updated = [...prev];
      const cur = updated[index];
      const unitCost = mat.averageCost || mat.standardCost || cur.unitCost;
      updated[index] = {
        ...cur,
        materialId: mat.id,
        materialCode: mat.code,
        materialName: mat.name,
        unit: mat.unit,
        unitCost,
        totalValue: cur.quantity * unitCost
      };
      return updated;
    });
  };

  const handleQtyChange = (index: number, qty: number) => {
    setItems(prev => {
      const updated = [...prev];
      const cur = updated[index];
      updated[index] = {
        ...cur,
        quantity: qty,
        totalValue: qty * cur.unitCost
      };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalAdjustmentValue = items.reduce((sum, i) => sum + i.totalValue, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!adjustmentNumber.trim()) newErrors.adjustmentNumber = 'Adjustment Number is required';
    if (!date) newErrors.date = 'Date is required';
    if (!storeId) newErrors.storeId = 'Store is required';
    if (!authorizedBy.trim()) newErrors.authorizedBy = 'Authorizing authority is required';
    if (!adjustedBy.trim()) newErrors.adjustedBy = 'Adjusted by name is required';
    if (items.length === 0) newErrors.items = 'Add at least one line item';

    // If decrease, ensure stock isn't negative
    if (type === 'DECREASE') {
      items.forEach((item, idx) => {
        const avail = getCurrentStock(item.materialId);
        if (item.quantity > avail && !adjustment) {
          newErrors[`item_${idx}`] = `Reduction exceeds on-hand stock (${avail} ${item.unit})`;
        }
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedStore = stores.find(s => s.id === storeId);

    const transactionItems = items.map((i, idx) => ({
      id: `adj-item-${Date.now()}-${idx}`,
      materialId: i.materialId,
      materialCode: i.materialCode,
      materialName: i.materialName,
      unit: i.unit,
      quantity: i.quantity,
      unitCost: i.unitCost,
      totalValue: i.totalValue,
      reasonNotes: i.reasonNotes || '',
      bookQty: 0,
      physicalQty: i.quantity,
      differenceQty: i.quantity
    }));

    if (adjustment) {
      updateStockAdjustment(adjustment.id, {
        adjustmentNumber: adjustmentNumber.trim(),
        date,
        storeId,
        storeName: selectedStore?.name || 'Store',
        adjustmentType: type,
        type,
        reason,
        authorizedBy: authorizedBy.trim(),
        adjustedBy: adjustedBy.trim(),
        notes: notes.trim() || undefined,
        items: transactionItems,
        totalValueImpact: type === 'INCREASE' ? totalAdjustmentValue : -totalAdjustmentValue,
        totalAdjustmentValue
      });
    } else {
      createStockAdjustment({
        adjustmentNumber: adjustmentNumber.trim(),
        date,
        storeId,
        storeName: selectedStore?.name || 'Store',
        adjustmentType: type,
        type,
        reason,
        authorizedBy: authorizedBy.trim(),
        adjustedBy: adjustedBy.trim(),
        notes: notes.trim() || undefined,
        status: 'POSTED',
        items: transactionItems,
        totalValueImpact: type === 'INCREASE' ? totalAdjustmentValue : -totalAdjustmentValue,
        totalAdjustmentValue
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              type === 'INCREASE'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {adjustment ? 'Edit Stock Adjustment' : 'New Stock Adjustment (Inventory Correction)'}
              </h2>
              <p className="text-xs text-slate-400">
                Record physical audit variances, scrap disposals, water damages or stock reconciliations
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
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Adjustment Number *</label>
              <input
                type="text"
                value={adjustmentNumber}
                onChange={e => setAdjustmentNumber(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-mono font-semibold"
              />
              {errors.adjustmentNumber && <p className="text-red-400 text-xs mt-1">{errors.adjustmentNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Adjustment Date *</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Store / Warehouse *</label>
              <select
                value={storeId}
                onChange={e => setStoreId(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Adjustment Direction *</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as StockAdjustmentType)}
                className={`w-full bg-slate-800/80 border rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none ${
                  type === 'INCREASE'
                    ? 'border-emerald-500/50 text-emerald-400'
                    : 'border-rose-500/50 text-rose-400'
                }`}
              >
                <option value="DECREASE">Decrease [-] (Loss, Spoilage, Damage)</option>
                <option value="INCREASE">Increase [+] (Found Surplus, Gain)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Primary Reason *</label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value as any)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              >
                {REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Authorized By (Engineer / Manager) *</label>
              <input
                type="text"
                placeholder="e.g. Chief Engineer Fernando"
                value={authorizedBy}
                onChange={e => setAuthorizedBy(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              />
              {errors.authorizedBy && <p className="text-red-400 text-xs mt-1">{errors.authorizedBy}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Adjusted By (Storekeeper) *</label>
              <input
                type="text"
                placeholder="e.g. Sunil Wijesinghe"
                value={adjustedBy}
                onChange={e => setAdjustedBy(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              />
              {errors.adjustedBy && <p className="text-red-400 text-xs mt-1">{errors.adjustedBy}</p>}
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Items to Adjust
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item Line
              </button>
            </div>

            {errors.items && <p className="text-red-400 text-xs">{errors.items}</p>}

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-800/90 text-slate-300 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="p-2.5 min-w-[200px]">Material Item</th>
                    <th className="p-2.5 min-w-[110px]">Current Stock</th>
                    <th className="p-2.5 min-w-[100px]">Adjust Qty ({type === 'INCREASE' ? '+' : '-'})</th>
                    <th className="p-2.5 min-w-[70px]">UOM</th>
                    <th className="p-2.5 min-w-[100px]">Unit Cost</th>
                    <th className="p-2.5 min-w-[110px]">Impact Value (LKR)</th>
                    <th className="p-2.5 min-w-[140px]">Specific Cause / Note</th>
                    <th className="p-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {items.map((item, idx) => {
                    const avail = getCurrentStock(item.materialId);
                    return (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-2">
                          <select
                            value={item.materialId}
                            onChange={e => handleMaterialChange(idx, e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                          >
                            {materials.map(m => (
                              <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                            ))}
                          </select>
                          {errors[`item_${idx}`] && (
                            <p className="text-red-400 text-[10px] mt-1">{errors[`item_${idx}`]}</p>
                          )}
                        </td>
                        <td className="p-2">
                          <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {avail.toLocaleString()} {item.unit}
                          </span>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.quantity}
                            onChange={e => handleQtyChange(idx, Number(e.target.value))}
                            className={`w-full bg-slate-800 border rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none font-mono ${
                              type === 'INCREASE'
                                ? 'text-emerald-400 border-emerald-500/40'
                                : 'text-rose-400 border-rose-500/40'
                            }`}
                          />
                        </td>
                        <td className="p-2 text-slate-400 font-mono">{item.unit}</td>
                        <td className="p-2 text-slate-300 font-mono">
                          Rs. {item.unitCost.toLocaleString()}
                        </td>
                        <td className={`p-2 font-mono font-semibold ${type === 'INCREASE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {type === 'INCREASE' ? '+' : '-'}Rs. {item.totalValue.toLocaleString()}
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="e.g. Moisture spoiled"
                            value={item.reasonNotes || ''}
                            onChange={e => {
                              const val = e.target.value;
                              setItems(prev => prev.map((it, i) => i === idx ? { ...it, reasonNotes: val } : it));
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-500 hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700/80 rounded-xl px-4 py-3">
              <span className="text-xs text-slate-400">Total Adjustment Financial Impact:</span>
              <span className={`text-base font-bold font-mono ${type === 'INCREASE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {type === 'INCREASE' ? '+' : '-'}LKR {totalAdjustmentValue.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Adjustment Investigation Remarks</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Verified by Store Audit Committee. Write-off approved under Section 4.2..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl text-sm font-semibold text-white transition-colors shadow-lg ${
                type === 'INCREASE'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
              }`}
            >
              {adjustment ? 'Save Changes' : 'Execute & Post Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
