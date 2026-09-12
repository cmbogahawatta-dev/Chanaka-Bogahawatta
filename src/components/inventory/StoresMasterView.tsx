import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  User,
  Phone,
  Boxes,
  DollarSign,
  AlertTriangle,
  Layers,
  Search,
  CheckCircle2
} from 'lucide-react';
import { Store } from '../../types/inventoryTypes';
import { useInventory } from '../../context/InventoryContext';
import { InventoryDeleteModal } from './modals/InventoryDeleteModal';

interface StoresMasterViewProps {
  onAddStore: () => void;
  onEditStore: (store: Store) => void;
}

export const StoresMasterView: React.FC<StoresMasterViewProps> = ({
  onAddStore,
  onEditStore
}) => {
  const { stores, stockBalances, materials, deleteStore } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);

  // Compute store statistics
  const storeStats = stores.map(st => {
    const balances = stockBalances.filter(b => b.storeId === st.id);
    const activeMaterialsCount = balances.filter(b => b.onHandQuantity > 0).length;
    const totalValuation = balances.reduce((sum, b) => {
      const mat = materials.find(m => m.id === b.materialId);
      const rate = mat?.averageCost || mat?.standardCost || 0;
      return sum + b.onHandQuantity * rate;
    }, 0);

    const lowStockCount = balances.filter(b => {
      const mat = materials.find(m => m.id === b.materialId);
      return mat && b.onHandQuantity <= mat.minStockLevel;
    }).length;

    return {
      ...st,
      activeMaterialsCount,
      totalValuation,
      lowStockCount
    };
  });

  const filteredStores = storeStats.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.storekeeper.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.projectCode && s.projectCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Header & Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Store & Warehouse Directory ({filteredStores.length} Active Facilities)
            </h2>
            <p className="text-xs text-slate-400">
              Manage Central Depots, Site Stores, Transit Yards and Workshop facilities
            </p>
          </div>
        </div>

        <button
          onClick={onAddStore}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" /> Add Store / Warehouse
        </button>
      </div>

      {/* Search bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by store name, code, location or storekeeper..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none flex-1"
        />
      </div>

      {/* Store Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStores.map(st => (
          <div
            key={st.id}
            className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
          >
            <div>
              {/* Top Row: Code, Name, Type */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {st.code}
                    </span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {st.type.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-2 group-hover:text-amber-400 transition-colors">
                    {st.name}
                  </h3>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  <button
                    onClick={() => onEditStore(st)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Edit Store"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setStoreToDelete(st)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Delete Store"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Location & Personnel */}
              <div className="space-y-1.5 mt-3 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{st.location}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">In-Charge: <strong className="text-slate-200">{st.storekeeper}</strong></span>
                  </div>
                  {st.contactNumber && (
                    <span className="text-[11px] font-mono text-slate-400">{st.contactNumber}</span>
                  )}
                </div>
                {st.projectCode && (
                  <div className="text-[11px] text-amber-400 font-mono">
                    Assigned Site: <strong>{st.projectCode}</strong>
                  </div>
                )}
              </div>

              {/* Storage Zones */}
              {st.zones && st.zones.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {st.zones.map((z, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                      {z}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Metrics Bar */}
            <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">SKUs</span>
                <span className="text-sm font-bold text-white font-mono">{st.activeMaterialsCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Valuation</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {(st.totalValuation / 1000000).toFixed(2)}M
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Low Stock</span>
                <span className={`text-xs font-bold font-mono ${st.lowStockCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {st.lowStockCount}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Inventory Delete Modal */}
      {storeToDelete && (
        <InventoryDeleteModal
          isOpen={true}
          onClose={() => setStoreToDelete(null)}
          type="store"
          id={storeToDelete.id}
          title={storeToDelete.name}
          code={storeToDelete.code}
          subtitle={`Location: ${storeToDelete.location} • In-Charge: ${storeToDelete.storekeeper}`}
          details={[
            { label: 'Store Code', value: storeToDelete.code },
            { label: 'Location', value: storeToDelete.location },
            { label: 'Storekeeper', value: storeToDelete.storekeeper },
            { label: 'Contact', value: storeToDelete.contactNumber || 'N/A' }
          ]}
          onConfirm={() => {
            deleteStore(storeToDelete.id);
            setStoreToDelete(null);
          }}
        />
      )}
    </div>
  );
};
