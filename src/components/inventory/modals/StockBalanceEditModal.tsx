import React, { useState, useEffect } from 'react';
import { X, Layers, MapPin, CheckCircle2 } from 'lucide-react';
import { StockBalance } from '../../../types/inventoryTypes';
import { useInventory } from '../../../context/InventoryContext';

interface StockBalanceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: StockBalance | null;
}

export const StockBalanceEditModal: React.FC<StockBalanceEditModalProps> = ({
  isOpen,
  onClose,
  balance
}) => {
  const { materials, stores, updateStockBalance } = useInventory();

  const [locationBin, setLocationBin] = useState('');

  useEffect(() => {
    if (balance) {
      setLocationBin(balance.locationBin || '');
    }
  }, [balance]);

  if (!isOpen || !balance) return null;

  const mat = materials.find(m => m.id === balance.materialId);
  const store = stores.find(s => s.id === balance.storeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (updateStockBalance) {
      updateStockBalance(balance.storeId, balance.materialId, {
        locationBin: locationBin.trim() || undefined,
        lastUpdated: new Date().toISOString().split('T')[0]
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-slate-100">
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Edit Bin Location</h3>
              <p className="text-xs text-slate-400">{mat?.name || 'Item'} — {store?.name || 'Store'}</p>
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
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">On-Hand Quantity:</span>
              <span className="font-mono font-bold text-white">{balance.onHandQuantity.toLocaleString()} {mat?.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Book Value:</span>
              <span className="font-mono font-bold text-emerald-400">LKR {balance.totalValue.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Warehouse Location Bin / Shelf / Bay
            </label>
            <input
              type="text"
              value={locationBin}
              onChange={e => setLocationBin(e.target.value)}
              placeholder="e.g. Bay C - Rack 04 - Shelf 2"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            />
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
              Update Location
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
