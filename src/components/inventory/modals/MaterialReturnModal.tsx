import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, RotateCcw, Building2, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';
import { MaterialReturn } from '../../../types/inventoryTypes';
import { useInventory } from '../../../context/InventoryContext';

interface MaterialReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  ret?: MaterialReturn | null;
  materialReturn?: MaterialReturn | null;
}

const RETURN_REASONS = [
  { value: 'SURPLUS_AFTER_POUR', label: 'Surplus Unused After Pour / Concreting' },
  { value: 'OVER_REQUISITION', label: 'Over-Requisition from Site' },
  { value: 'PROJECT_COMPLETION', label: 'Project Section Completed / Demobilization' },
  { value: 'DAMAGED_AT_SITE', label: 'Damaged / Wet at Site' },
  { value: 'WRONG_SPECIFICATION', label: 'Wrong Specification Received' },
  { value: 'OTHER', label: 'Other Return Reason' }
];

const COMMON_PROJECTS = ['PIDM 26', 'JAFFNA 02', 'COLOMBO 01', 'KANDY 04', 'GALLE 03', 'CENTRAL'];

export const MaterialReturnModal: React.FC<MaterialReturnModalProps> = ({
  isOpen,
  onClose,
  ret,
  materialReturn
}) => {
  const activeRet = ret || materialReturn;
  const { stores, materials, createMaterialReturn, updateMaterialReturn } = useInventory();

  const [returnNumber, setReturnNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [projectCode, setProjectCode] = useState('PIDM 26');
  const [storeId, setStoreId] = useState(stores[0]?.id || '');
  const [returnedBy, setReturnedBy] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [reason, setReason] = useState<any>('SURPLUS_AFTER_POUR');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{
    materialId: string;
    materialCode: string;
    materialName: string;
    unit: string;
    quantity: number;
    unitCost: number;
    totalValue: number;
    condition: 'GOOD_USABLE' | 'DAMAGED_SCRAP' | 'NEEDS_REPAIR';
    remarks?: string;
  }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (activeRet) {
      setReturnNumber(activeRet.returnNumber);
      setDate(activeRet.date);
      setProjectCode(activeRet.projectCode);
      setStoreId(activeRet.storeId);
      setReturnedBy(activeRet.returnedBy);
      setReceivedBy(activeRet.receivedBy);
      setReason(activeRet.reason);
      setNotes(activeRet.notes || '');
      setItems(activeRet.items.map(i => ({
        materialId: i.materialId,
        materialCode: i.materialCode,
        materialName: i.materialName,
        unit: i.unit,
        quantity: i.quantity,
        unitCost: i.unitCost,
        totalValue: i.totalValue,
        condition: i.condition,
        remarks: i.remarks
      })));
    } else {
      const randomNum = String(Math.floor(Math.random() * 900) + 100);
      setReturnNumber(`MRN-2026-${randomNum}`);
      setDate(new Date().toISOString().split('T')[0]);
      setProjectCode('PIDM 26');
      setStoreId(stores[0]?.id || '');
      setReturnedBy('');
      setReceivedBy('Kasun Bandara');
      setReason('SURPLUS_AFTER_POUR');
      setNotes('');
      if (materials.length > 0) {
        const mat = materials[0];
        setItems([
          {
            materialId: mat.id,
            materialCode: mat.code,
            materialName: mat.name,
            unit: mat.unit,
            quantity: 5,
            unitCost: mat.standardCost || 0,
            totalValue: 5 * (mat.standardCost || 0),
            condition: 'GOOD_USABLE',
            remarks: 'Unopened usable surplus'
          }
        ]);
      } else {
        setItems([]);
      }
    }
    setErrors({});
  }, [ret, isOpen, stores, materials]);

  if (!isOpen) return null;

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
        condition: 'GOOD_USABLE',
        remarks: ''
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

  const handleConditionChange = (index: number, cond: 'GOOD_USABLE' | 'DAMAGED_SCRAP' | 'NEEDS_REPAIR') => {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, condition: cond } : it));
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalReturnValue = items.reduce((sum, i) => sum + i.totalValue, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!returnNumber.trim()) newErrors.returnNumber = 'Return Number is required';
    if (!date) newErrors.date = 'Date is required';
    if (!projectCode.trim()) newErrors.projectCode = 'Project is required';
    if (!storeId) newErrors.storeId = 'Destination Store is required';
    if (!returnedBy.trim()) newErrors.returnedBy = 'Returned by is required';
    if (!receivedBy.trim()) newErrors.receivedBy = 'Received by is required';
    if (items.length === 0) newErrors.items = 'Add at least one line item';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedStore = stores.find(s => s.id === storeId);

    const transactionItems = items.map((i, idx) => ({
      id: `ret-item-${Date.now()}-${idx}`,
      materialId: i.materialId,
      materialCode: i.materialCode,
      materialName: i.materialName,
      unit: i.unit,
      quantity: i.quantity,
      unitCost: i.unitCost,
      totalValue: i.totalValue,
      condition: i.condition,
      remarks: i.remarks
    }));

    if (ret) {
      updateMaterialReturn(ret.id, {
        returnNumber: returnNumber.trim(),
        date,
        projectCode: projectCode.trim().toUpperCase(),
        storeId,
        storeName: selectedStore?.name || 'Store',
        returnedBy: returnedBy.trim(),
        receivedBy: receivedBy.trim(),
        reason,
        notes: notes.trim() || undefined,
        items: transactionItems,
        totalValue: totalReturnValue
      });
    } else {
      createMaterialReturn({
        returnNumber: returnNumber.trim(),
        date,
        projectCode: projectCode.trim().toUpperCase(),
        storeId,
        storeName: selectedStore?.name || 'Store',
        returnedBy: returnedBy.trim(),
        receivedBy: receivedBy.trim(),
        reason,
        notes: notes.trim() || undefined,
        status: 'POSTED',
        items: transactionItems,
        totalValue: totalReturnValue
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
            <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {ret ? 'Edit Material Return Note (MRN)' : 'New Material Return (Site to Store)'}
              </h2>
              <p className="text-xs text-slate-400">
                Return unused site materials, inspect condition, and re-credit store inventory
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Return Number *</label>
              <input
                type="text"
                value={returnNumber}
                onChange={e => setReturnNumber(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 font-mono font-semibold"
              />
              {errors.returnNumber && <p className="text-red-400 text-xs mt-1">{errors.returnNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Return Date *</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              />
              {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Returning Project *</label>
              <select
                value={projectCode}
                onChange={e => setProjectCode(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 font-mono font-bold text-amber-400"
              >
                {COMMON_PROJECTS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Receiving Store *</label>
              <select
                value={storeId}
                onChange={e => setStoreId(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Return Reason *</label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value as any)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              >
                {RETURN_REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Returned By (Site Foreman / Subcontractor) *</label>
              <input
                type="text"
                placeholder="e.g. Foreman Gamini Ratnayake"
                value={returnedBy}
                onChange={e => setReturnedBy(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              />
              {errors.returnedBy && <p className="text-red-400 text-xs mt-1">{errors.returnedBy}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Received By (Storekeeper) *</label>
              <input
                type="text"
                placeholder="e.g. Kasun Bandara"
                value={receivedBy}
                onChange={e => setReceivedBy(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              />
              {errors.receivedBy && <p className="text-red-400 text-xs mt-1">{errors.receivedBy}</p>}
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Returned Items & Physical Condition Check
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Return Line
              </button>
            </div>

            {errors.items && <p className="text-red-400 text-xs">{errors.items}</p>}

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-800/90 text-slate-300 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="p-2.5 min-w-[200px]">Material Item</th>
                    <th className="p-2.5 min-w-[130px]">Condition Inspection</th>
                    <th className="p-2.5 min-w-[90px]">Return Qty</th>
                    <th className="p-2.5 min-w-[70px]">UOM</th>
                    <th className="p-2.5 min-w-[100px]">Unit Cost</th>
                    <th className="p-2.5 min-w-[110px]">Total (LKR)</th>
                    <th className="p-2.5 min-w-[130px]">Remarks</th>
                    <th className="p-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2">
                        <select
                          value={item.materialId}
                          onChange={e => handleMaterialChange(idx, e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                        >
                          {materials.map(m => (
                            <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <select
                          value={item.condition}
                          onChange={e => handleConditionChange(idx, e.target.value as any)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none text-white"
                        >
                          <option value="GOOD_USABLE">Good / Usable (Restock)</option>
                          <option value="DAMAGED_SCRAP">Damaged / Scrap</option>
                          <option value="NEEDS_REPAIR">Needs Repair / Sorting</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.quantity}
                          onChange={e => handleQtyChange(idx, Number(e.target.value))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-semibold text-teal-400 focus:outline-none font-mono"
                        />
                      </td>
                      <td className="p-2 text-slate-400 font-mono">{item.unit}</td>
                      <td className="p-2 text-slate-300 font-mono">
                        Rs. {item.unitCost.toLocaleString()}
                      </td>
                      <td className="p-2 text-white font-mono font-semibold">
                        Rs. {item.totalValue.toLocaleString()}
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="e.g. Uncut full lengths"
                          value={item.remarks || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setItems(prev => prev.map((it, i) => i === idx ? { ...it, remarks: val } : it));
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
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
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700/80 rounded-xl px-4 py-3">
              <span className="text-xs text-slate-400">Total Returned Stock Credit Value:</span>
              <span className="text-base font-bold text-teal-400 font-mono">
                LKR {totalReturnValue.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Return Notes / Comments</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Returned to site store after culvert steel fixing concluded..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
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
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-colors shadow-lg shadow-teal-600/20"
            >
              {ret ? 'Save Changes' : 'Post Return & Credit Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
