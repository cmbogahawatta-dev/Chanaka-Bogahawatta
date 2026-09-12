import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ArrowLeftRight, Truck, Calendar, Building2, CheckCircle2 } from 'lucide-react';
import { StockTransfer } from '../../../types/inventoryTypes';
import { useInventory } from '../../../context/InventoryContext';

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  transfer?: StockTransfer | null;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  isOpen,
  onClose,
  transfer
}) => {
  const { stores, materials, stockBalances, createStockTransfer, updateStockTransfer } = useInventory();

  const [transferNumber, setTransferNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sourceStoreId, setSourceStoreId] = useState(stores[0]?.id || '');
  const [destinationStoreId, setDestinationStoreId] = useState(stores[1]?.id || stores[0]?.id || '');
  const [transporterVehicle, setTransporterVehicle] = useState('');
  const [driverName, setDriverName] = useState('');
  const [dispatchedBy, setDispatchedBy] = useState('');
  const [status, setStatus] = useState<'DISPATCHED' | 'IN_TRANSIT' | 'RECEIVED'>('DISPATCHED');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{
    materialId: string;
    materialCode: string;
    materialName: string;
    unit: string;
    quantity: number;
    unitCost: number;
    totalValue: number;
  }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (transfer) {
      setTransferNumber(transfer.transferNumber);
      setDate(transfer.date);
      setSourceStoreId(transfer.sourceStoreId);
      setDestinationStoreId(transfer.destinationStoreId);
      setTransporterVehicle(transfer.transporterVehicle);
      setDriverName(transfer.driverName);
      setDispatchedBy(transfer.dispatchedBy);
      setStatus(transfer.status as any);
      setNotes(transfer.notes || '');
      setItems(transfer.items.map(i => ({
        materialId: i.materialId,
        materialCode: i.materialCode,
        materialName: i.materialName,
        unit: i.unit,
        quantity: i.quantity,
        unitCost: i.unitCost,
        totalValue: i.totalValue
      })));
    } else {
      const randomNum = String(Math.floor(Math.random() * 900) + 100);
      setTransferNumber(`STR-2026-${randomNum}`);
      setDate(new Date().toISOString().split('T')[0]);
      setSourceStoreId(stores[0]?.id || '');
      setDestinationStoreId(stores[1]?.id || stores[0]?.id || '');
      setTransporterVehicle('WP-LH-8821');
      setDriverName('Sarath Wijetunga');
      setDispatchedBy('Sunil Wijesinghe');
      setStatus('DISPATCHED');
      setNotes('');
      if (materials.length > 0) {
        const mat = materials[0];
        setItems([
          {
            materialId: mat.id,
            materialCode: mat.code,
            materialName: mat.name,
            unit: mat.unit,
            quantity: 50,
            unitCost: mat.standardCost || 0,
            totalValue: 50 * (mat.standardCost || 0)
          }
        ]);
      } else {
        setItems([]);
      }
    }
    setErrors({});
  }, [transfer, isOpen, stores, materials]);

  if (!isOpen) return null;

  const getSourceStock = (matId: string) => {
    const bal = stockBalances.find(b => b.materialId === matId && b.storeId === sourceStoreId);
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
        quantity: 10,
        unitCost: defaultMat.standardCost || 0,
        totalValue: 10 * (defaultMat.standardCost || 0)
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

  const totalTransferValue = items.reduce((sum, i) => sum + i.totalValue, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!transferNumber.trim()) newErrors.transferNumber = 'Transfer Number is required';
    if (!date) newErrors.date = 'Date is required';
    if (!sourceStoreId) newErrors.sourceStoreId = 'Source store is required';
    if (!destinationStoreId) newErrors.destinationStoreId = 'Destination store is required';
    if (sourceStoreId === destinationStoreId) newErrors.destinationStoreId = 'Source & Destination cannot be identical';
    if (!transporterVehicle.trim()) newErrors.transporterVehicle = 'Vehicle reg no is required';
    if (!driverName.trim()) newErrors.driverName = 'Driver name is required';
    if (!dispatchedBy.trim()) newErrors.dispatchedBy = 'Dispatched by is required';
    if (items.length === 0) newErrors.items = 'Add at least one line item';

    // Validate available stock
    items.forEach((item, idx) => {
      const avail = getSourceStock(item.materialId);
      if (item.quantity > avail && !transfer) {
        newErrors[`item_${idx}`] = `Transfer quantity exceeds available stock (${avail} ${item.unit}) at source warehouse!`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const srcStore = stores.find(s => s.id === sourceStoreId);
    const destStore = stores.find(s => s.id === destinationStoreId);

    const transactionItems = items.map((i, idx) => ({
      id: `transfer-item-${Date.now()}-${idx}`,
      materialId: i.materialId,
      materialCode: i.materialCode,
      materialName: i.materialName,
      unit: i.unit,
      quantity: i.quantity,
      unitCost: i.unitCost,
      totalValue: i.totalValue
    }));

    if (transfer) {
      updateStockTransfer(transfer.id, {
        transferNumber: transferNumber.trim(),
        date,
        sourceStoreId,
        sourceStoreName: srcStore?.name || 'Store',
        destinationStoreId,
        destinationStoreName: destStore?.name || 'Store',
        transporterVehicle: transporterVehicle.trim(),
        driverName: driverName.trim(),
        dispatchedBy: dispatchedBy.trim(),
        status,
        notes: notes.trim() || undefined,
        items: transactionItems,
        totalValue: totalTransferValue
      });
    } else {
      createStockTransfer({
        transferNumber: transferNumber.trim(),
        date,
        sourceStoreId,
        sourceStoreName: srcStore?.name || 'Store',
        destinationStoreId,
        destinationStoreName: destStore?.name || 'Store',
        dispatchDate: date,
        transporterVehicle: transporterVehicle.trim(),
        driverName: driverName.trim(),
        dispatchedBy: dispatchedBy.trim(),
        status,
        notes: notes.trim() || undefined,
        items: transactionItems,
        totalValue: totalTransferValue
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
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {transfer ? 'Edit Stock Transfer Note (STR)' : 'New Stock Transfer (Store to Store)'}
              </h2>
              <p className="text-xs text-slate-400">
                Move inventory between central depot and project site stores with gate pass tracking
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Transfer Number *</label>
              <input
                type="text"
                value={transferNumber}
                onChange={e => setTransferNumber(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono font-semibold"
              />
              {errors.transferNumber && <p className="text-red-400 text-xs mt-1">{errors.transferNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Transfer Date *</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Source Store / Warehouse *</label>
              <select
                value={sourceStoreId}
                onChange={e => setSourceStoreId(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Destination Store / Site *</label>
              <select
                value={destinationStoreId}
                onChange={e => setDestinationStoreId(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-semibold"
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
              {errors.destinationStoreId && <p className="text-red-400 text-xs mt-1">{errors.destinationStoreId}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Transport Vehicle *</label>
              <input
                type="text"
                placeholder="e.g. WP-LH-8821"
                value={transporterVehicle}
                onChange={e => setTransporterVehicle(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
              {errors.transporterVehicle && <p className="text-red-400 text-xs mt-1">{errors.transporterVehicle}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Driver Name *</label>
              <input
                type="text"
                placeholder="e.g. Sarath Wijetunga"
                value={driverName}
                onChange={e => setDriverName(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
              {errors.driverName && <p className="text-red-400 text-xs mt-1">{errors.driverName}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Dispatched By *</label>
              <input
                type="text"
                placeholder="e.g. Sunil Wijesinghe"
                value={dispatchedBy}
                onChange={e => setDispatchedBy(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
              {errors.dispatchedBy && <p className="text-red-400 text-xs mt-1">{errors.dispatchedBy}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Transfer Status *</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="DISPATCHED">Dispatched (Outward)</option>
                <option value="IN_TRANSIT">In Transit on Road</option>
                <option value="RECEIVED">Received at Destination</option>
              </select>
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Materials to Transfer
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Material Line
              </button>
            </div>

            {errors.items && <p className="text-red-400 text-xs">{errors.items}</p>}

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-800/90 text-slate-300 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="p-2.5 min-w-[200px]">Material Item</th>
                    <th className="p-2.5 min-w-[120px]">Source Available</th>
                    <th className="p-2.5 min-w-[90px]">Transfer Qty</th>
                    <th className="p-2.5 min-w-[70px]">UOM</th>
                    <th className="p-2.5 min-w-[100px]">Unit Cost</th>
                    <th className="p-2.5 min-w-[110px]">Total (LKR)</th>
                    <th className="p-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {items.map((item, idx) => {
                    const avail = getSourceStock(item.materialId);
                    return (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-2">
                          <select
                            value={item.materialId}
                            onChange={e => handleMaterialChange(idx, e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
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
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-semibold text-cyan-400 focus:outline-none font-mono"
                          />
                        </td>
                        <td className="p-2 text-slate-400 font-mono">{item.unit}</td>
                        <td className="p-2 text-slate-300 font-mono">
                          Rs. {item.unitCost.toLocaleString()}
                        </td>
                        <td className="p-2 text-white font-mono font-semibold">
                          Rs. {item.totalValue.toLocaleString()}
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
              <span className="text-xs text-slate-400">Total Transferred Inventory Valuation:</span>
              <span className="text-base font-bold text-cyan-400 font-mono">
                LKR {totalTransferValue.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Transfer Gate Pass / Transit Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Scheduled inter-yard replenishment. Security gate pass verified..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
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
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-lg shadow-cyan-600/20"
            >
              {transfer ? 'Save Transfer' : 'Dispatch Stock Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
