import React, { useState, useEffect } from 'react';
import { X, Boxes, Calendar, DollarSign, Building2, CheckCircle2 } from 'lucide-react';
import { StockBatch } from '../../../types/inventoryTypes';
import { useInventory } from '../../../context/InventoryContext';

interface BatchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: StockBatch | null;
}

export const BatchEditModal: React.FC<BatchEditModalProps> = ({
  isOpen,
  onClose,
  batch
}) => {
  const { updateBatch } = useInventory();

  const [batchNumber, setBatchNumber] = useState('');
  const [millCertNumber, setMillCertNumber] = useState('');
  const [remainingQuantity, setRemainingQuantity] = useState<number>(0);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [locationBin, setLocationBin] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [status, setStatus] = useState<any>('ACTIVE');

  useEffect(() => {
    if (batch) {
      setBatchNumber(batch.batchNumber);
      setMillCertNumber(batch.millCertNumber || '');
      setRemainingQuantity(batch.remainingQuantity);
      setUnitCost(batch.unitCost);
      setLocationBin(batch.locationBin || '');
      setExpiryDate(batch.expiryDate || '');
      setStatus(batch.status || 'ACTIVE');
    }
  }, [batch]);

  if (!isOpen || !batch) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchNumber.trim()) return;

    updateBatch(batch.id, {
      batchNumber: batchNumber.trim(),
      millCertNumber: millCertNumber.trim() || undefined,
      remainingQuantity: Number(remainingQuantity) || 0,
      unitCost: Number(unitCost) || 0,
      locationBin: locationBin.trim() || undefined,
      expiryDate: expiryDate || undefined,
      status
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-100">
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Edit Stock Batch & Heat Certificate</h3>
              <p className="text-xs text-slate-400">{batch.materialName} — {batch.storeName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Batch / Heat #</label>
              <input
                type="text"
                value={batchNumber}
                onChange={e => setBatchNumber(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Mill Test Cert #</label>
              <input
                type="text"
                value={millCertNumber}
                onChange={e => setMillCertNumber(e.target.value)}
                placeholder="e.g. MTC-2026-902"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Remaining Qty ({batch.unit})</label>
              <input
                type="number"
                step="any"
                value={remainingQuantity}
                onChange={e => setRemainingQuantity(parseFloat(e.target.value) || 0)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Unit Cost (LKR)</label>
              <input
                type="number"
                step="any"
                value={unitCost}
                onChange={e => setUnitCost(parseFloat(e.target.value) || 0)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Location Bin / Bay</label>
              <input
                type="text"
                value={locationBin}
                onChange={e => setLocationBin(e.target.value)}
                placeholder="e.g. Rack A-02"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Batch Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ACTIVE">ACTIVE (Available for Issue)</option>
              <option value="QUARANTINE">QUARANTINE (Pending QA Inspection)</option>
              <option value="EXPIRED">EXPIRED (Not Allowed for Use)</option>
              <option value="EXHAUSTED">EXHAUSTED (Depleted)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-slate-950 font-bold bg-amber-400 hover:bg-amber-300 shadow-md shadow-amber-500/20 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
