import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  Building2,
  MapPin,
  DollarSign,
  Layers,
  ArrowUpDown,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import { MaterialItem, MaterialCategory } from '../../types/inventoryTypes';
import { useInventory } from '../../context/InventoryContext';
import { InventoryDeleteModal } from './modals/InventoryDeleteModal';

interface MaterialMasterViewProps {
  onAddMaterial: () => void;
  onEditMaterial: (material: MaterialItem) => void;
}

const CATEGORIES: { value: MaterialCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'CEMENT_BINDERS', label: 'Cement & Binders' },
  { value: 'STEEL_REINFORCEMENT', label: 'Steel & Reinforcement' },
  { value: 'AGGREGATES_SAND', label: 'Aggregates & Sand' },
  { value: 'PIPING_PLUMBING', label: 'Piping & Plumbing' },
  { value: 'ELECTRICAL', label: 'Electrical & Cable' },
  { value: 'TIMBER_FORMWORK', label: 'Timber & Formwork' },
  { value: 'CHEMICALS_PAINTS', label: 'Chemicals & Paints' },
  { value: 'FUEL_LUBRICANTS', label: 'Fuel & Lubricants' },
  { value: 'TOOLS_PPE', label: 'Tools & PPE Safety' },
  { value: 'HARDWARE_FASTENERS', label: 'Hardware & Fasteners' },
  { value: 'OTHER', label: 'Other Materials' }
];

export const MaterialMasterView: React.FC<MaterialMasterViewProps> = ({
  onAddMaterial,
  onEditMaterial
}) => {
  const { materials, stockBalances, deleteMaterial } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | 'ALL'>('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'stock' | 'valuation'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<MaterialItem | null>(null);

  // Calculate live total on-hand stock across all warehouses for each material
  const materialWithStock = useMemo(() => {
    return materials.map(mat => {
      const balances = stockBalances.filter(b => b.materialId === mat.id);
      const totalStock = balances.reduce((sum, b) => sum + b.onHandQuantity, 0);
      const valuation = totalStock * (mat.averageCost || mat.standardCost);
      const isLowStock = totalStock <= mat.minStockLevel;
      const isOverMax = totalStock > mat.maxStockLevel;
      return {
        ...mat,
        liveTotalStock: totalStock,
        totalValuation: valuation,
        isLowStock,
        isOverMax
      };
    });
  }, [materials, stockBalances]);

  // Filter and sort
  const filteredMaterials = useMemo(() => {
    return materialWithStock
      .filter(item => {
        const matchesSearch =
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.primarySupplierName && item.primarySupplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.defaultLocationBin && item.defaultLocationBin.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.specifications && item.specifications.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
        const matchesLowStock = !onlyLowStock || item.isLowStock;

        return matchesSearch && matchesCategory && matchesLowStock;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'name') comp = a.name.localeCompare(b.name);
        else if (sortBy === 'code') comp = a.code.localeCompare(b.code);
        else if (sortBy === 'stock') comp = a.liveTotalStock - b.liveTotalStock;
        else if (sortBy === 'valuation') comp = a.totalValuation - b.totalValuation;
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [materialWithStock, searchTerm, selectedCategory, onlyLowStock, sortBy, sortOrder]);

  return (
    <div className="space-y-4">
      {/* Header & Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Material Master Catalog ({filteredMaterials.length} Items)
            </h2>
            <p className="text-xs text-slate-400">
              Manage stock specifications, safety thresholds, supplier links & warehouse locations
            </p>
          </div>
        </div>

        <button
          onClick={onAddMaterial}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" /> Add New Material
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3">
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search material by name, code, supplier, bin location..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value as any)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-4 flex items-center justify-between gap-3">
          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
              onlyLowStock
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock ({materials.filter(m => {
              const cur = stockBalances.filter(b => b.materialId === m.id).reduce((s, b) => s + b.onHandQuantity, 0);
              return cur <= m.minStockLevel;
            }).length})</span>
          </button>

          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none"
            >
              <option value="name">Name</option>
              <option value="code">Code</option>
              <option value="stock">On-Hand Stock</option>
              <option value="valuation">Valuation</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
              title="Toggle Ascending/Descending"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-800/90 text-slate-300 font-semibold border-b border-slate-700">
              <tr>
                <th className="p-3 min-w-[220px]">Material Item & Code</th>
                <th className="p-3 min-w-[130px]">Category</th>
                <th className="p-3 min-w-[160px]">Stock Level vs Limits</th>
                <th className="p-3 min-w-[110px]">On-Hand Qty</th>
                <th className="p-3 min-w-[120px]">Standard / Avg Cost</th>
                <th className="p-3 min-w-[120px]">Stock Valuation</th>
                <th className="p-3 min-w-[140px]">Default Store & Bin</th>
                <th className="p-3 min-w-[140px]">Primary Supplier</th>
                <th className="p-3 w-16 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500 text-xs">
                    No materials found matching search or filters.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map(mat => {
                  const stockPct = Math.min(100, Math.max(0, (mat.liveTotalStock / (mat.maxStockLevel || 100)) * 100));

                  return (
                    <tr key={mat.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Code & Name */}
                      <td className="p-3">
                        <div className="font-bold text-white text-xs">{mat.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-mono text-amber-400 font-semibold">{mat.code}</span>
                          {mat.brandOrGrade && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {mat.brandOrGrade}
                            </span>
                          )}
                        </div>
                        {mat.specifications && (
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{mat.specifications}</p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {mat.category.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Stock Level vs Limits (Progress) */}
                      <td className="p-3">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-mono">
                          <span>Min: {mat.minStockLevel}</span>
                          <span>Max: {mat.maxStockLevel}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                          <div
                            className={`h-full rounded-full transition-all ${
                              mat.isLowStock
                                ? 'bg-rose-500'
                                : mat.isOverMax
                                ? 'bg-purple-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${stockPct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] mt-1">
                          <span className={mat.isLowStock ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                            {mat.isLowStock ? '⚠ Low Stock Reorder' : 'Healthy Level'}
                          </span>
                          <span className="text-slate-500 font-mono">ROQ: {mat.reorderQuantity}</span>
                        </div>
                      </td>

                      {/* On-hand qty & UOM */}
                      <td className="p-3">
                        <span className={`text-sm font-black font-mono ${
                          mat.isLowStock ? 'text-rose-400' : 'text-white'
                        }`}>
                          {mat.liveTotalStock.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400 ml-1 font-medium">{mat.unit}</span>
                      </td>

                      {/* Unit Cost */}
                      <td className="p-3 font-mono text-slate-300">
                        Rs. {mat.standardCost.toLocaleString()}
                      </td>

                      {/* Total Valuation */}
                      <td className="p-3 font-mono font-bold text-white">
                        Rs. {mat.totalValuation.toLocaleString()}
                      </td>

                      {/* Store & Bin */}
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-slate-300 font-medium truncate">
                          <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate">{mat.defaultWarehouseName || 'Main Store'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 font-mono truncate">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{mat.defaultLocationBin || 'Floor Bay'}</span>
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="p-3">
                        <div className="text-xs text-slate-300 truncate">
                          {mat.primarySupplierName || 'Direct Site Delivery'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditMaterial(mat)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit Material"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setItemToDelete(mat)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Delete Material"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Delete Modal */}
      {itemToDelete && (() => {
        const itemStock = stockBalances.filter(b => b.materialId === itemToDelete.id).reduce((sum, b) => sum + b.onHandQuantity, 0);
        const itemVal = itemStock * (itemToDelete.averageCost || itemToDelete.standardCost);
        return (
          <InventoryDeleteModal
            isOpen={true}
            onClose={() => setItemToDelete(null)}
            type="material"
            id={itemToDelete.id}
            title={itemToDelete.name}
            code={itemToDelete.code}
            subtitle={`Category: ${itemToDelete.category.replace(/_/g, ' ')} • UOM: ${itemToDelete.unit}`}
            details={[
              { label: 'Category', value: itemToDelete.category.replace(/_/g, ' ') },
              { label: 'Base Unit', value: itemToDelete.unit },
              { label: 'On-Hand Stock', value: `${itemStock.toLocaleString()} ${itemToDelete.unit}` },
              { label: 'Stock Valuation', value: `Rs. ${itemVal.toLocaleString()}` }
            ]}
            onConfirm={() => {
              deleteMaterial(itemToDelete.id);
              setItemToDelete(null);
            }}
          />
        );
      })()}
    </div>
  );
};
