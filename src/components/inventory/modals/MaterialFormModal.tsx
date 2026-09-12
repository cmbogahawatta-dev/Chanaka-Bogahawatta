import React, { useState, useEffect } from 'react';
import { X, Package, Tag, Building2, MapPin, DollarSign, Layers, ShieldCheck } from 'lucide-react';
import { MaterialItem, MaterialCategory } from '../../../types/inventoryTypes';
import { useInventory } from '../../../context/InventoryContext';
import { useSuppliers } from '../../../context/SupplierContext';

interface MaterialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  material?: MaterialItem | null;
}

const CATEGORIES: { value: MaterialCategory; label: string }[] = [
  { value: 'CEMENT_BINDERS', label: 'Cement & Binders' },
  { value: 'STEEL_REINFORCEMENT', label: 'Steel & Reinforcement' },
  { value: 'AGGREGATES_SAND', label: 'Aggregates & Sand' },
  { value: 'PIPING_PLUMBING', label: 'Piping & Plumbing' },
  { value: 'ELECTRICAL', label: 'Electrical & Cable' },
  { value: 'TIMBER_FORMWORK', label: 'Timber & Formwork' },
  { value: 'CHEMICALS_PAINTS', label: 'Chemicals, Admixtures & Paints' },
  { value: 'FUEL_LUBRICANTS', label: 'Fuel, Oil & Lubricants' },
  { value: 'TOOLS_PPE', label: 'Tools & PPE Safety' },
  { value: 'HARDWARE_FASTENERS', label: 'Hardware & Fasteners' },
  { value: 'OTHER', label: 'Other Construction Materials' }
];

const COMMON_UNITS = [
  'Bags', 'MT', 'Kg', 'Cubes', 'Liters', 'Nos', 'Meters', 'Sq.Ft', 'Bundles', 'Rolls', 'Drums', 'Sets'
];

export const MaterialFormModal: React.FC<MaterialFormModalProps> = ({
  isOpen,
  onClose,
  material
}) => {
  const { stores, addMaterial, updateMaterial } = useInventory();
  const { suppliers } = useSuppliers();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MaterialCategory>('CEMENT_BINDERS');
  const [unit, setUnit] = useState('Bags');
  const [customUnit, setCustomUnit] = useState('');
  const [minStockLevel, setMinStockLevel] = useState<number>(50);
  const [maxStockLevel, setMaxStockLevel] = useState<number>(500);
  const [reorderQuantity, setReorderQuantity] = useState<number>(100);
  const [standardCost, setStandardCost] = useState<number>(0);
  const [primarySupplierId, setPrimarySupplierId] = useState('');
  const [defaultWarehouseId, setDefaultWarehouseId] = useState(stores[0]?.id || '');
  const [defaultLocationBin, setDefaultLocationBin] = useState('');
  const [brandOrGrade, setBrandOrGrade] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (material) {
      setCode(material.code);
      setName(material.name);
      setCategory(material.category);
      if (COMMON_UNITS.includes(material.unit)) {
        setUnit(material.unit);
        setCustomUnit('');
      } else {
        setUnit('OTHER');
        setCustomUnit(material.unit);
      }
      setMinStockLevel(material.minStockLevel);
      setMaxStockLevel(material.maxStockLevel);
      setReorderQuantity(material.reorderQuantity);
      setStandardCost(material.standardCost);
      setPrimarySupplierId(material.primarySupplierId || '');
      setDefaultWarehouseId(material.defaultWarehouseId);
      setDefaultLocationBin(material.defaultLocationBin);
      setBrandOrGrade(material.brandOrGrade || '');
      setSpecifications(material.specifications || '');
      setNotes(material.notes || '');
      setIsActive(material.isActive);
    } else {
      // Auto-generate code template
      setCode(`MAT-${category.substring(0, 3)}-${String(Math.floor(Math.random() * 900) + 100)}`);
      setName('');
      setCategory('CEMENT_BINDERS');
      setUnit('Bags');
      setCustomUnit('');
      setMinStockLevel(50);
      setMaxStockLevel(500);
      setReorderQuantity(100);
      setStandardCost(0);
      setPrimarySupplierId('');
      setDefaultWarehouseId(stores[0]?.id || '');
      setDefaultLocationBin('Bay A - Shelf 01');
      setBrandOrGrade('');
      setSpecifications('');
      setNotes('');
      setIsActive(true);
    }
    setErrors({});
  }, [material, isOpen, stores]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!code.trim()) newErrors.code = 'Material code is required';
    if (!name.trim()) newErrors.name = 'Material name is required';
    if (unit === 'OTHER' && !customUnit.trim()) newErrors.unit = 'Specify unit of measure';
    if (minStockLevel < 0) newErrors.minStockLevel = 'Minimum stock cannot be negative';
    if (maxStockLevel < minStockLevel) newErrors.maxStockLevel = 'Max stock must exceed min stock';
    if (!defaultWarehouseId) newErrors.defaultWarehouseId = 'Select a default warehouse / store';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedSup = suppliers.find(s => s.id === primarySupplierId);
    const selectedStore = stores.find(s => s.id === defaultWarehouseId);
    const resolvedUnit = unit === 'OTHER' ? customUnit.trim() : unit;

    if (material) {
      updateMaterial(material.id, {
        code: code.trim(),
        name: name.trim(),
        category,
        unit: resolvedUnit,
        minStockLevel: Number(minStockLevel),
        maxStockLevel: Number(maxStockLevel),
        reorderQuantity: Number(reorderQuantity),
        standardCost: Number(standardCost),
        primarySupplierId: primarySupplierId || undefined,
        primarySupplierName: selectedSup?.name || undefined,
        defaultWarehouseId,
        defaultWarehouseName: selectedStore?.name,
        defaultLocationBin: defaultLocationBin.trim(),
        brandOrGrade: brandOrGrade.trim() || undefined,
        specifications: specifications.trim() || undefined,
        notes: notes.trim() || undefined,
        isActive
      });
    } else {
      addMaterial({
        code: code.trim(),
        name: name.trim(),
        category,
        unit: resolvedUnit,
        minStockLevel: Number(minStockLevel),
        maxStockLevel: Number(maxStockLevel),
        reorderQuantity: Number(reorderQuantity),
        standardCost: Number(standardCost),
        averageCost: Number(standardCost),
        primarySupplierId: primarySupplierId || undefined,
        primarySupplierName: selectedSup?.name || undefined,
        defaultWarehouseId,
        defaultWarehouseName: selectedStore?.name,
        defaultLocationBin: defaultLocationBin.trim(),
        brandOrGrade: brandOrGrade.trim() || undefined,
        specifications: specifications.trim() || undefined,
        notes: notes.trim() || undefined,
        isActive
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {material ? 'Edit Material Master' : 'New Material Item'}
              </h2>
              <p className="text-xs text-slate-400">
                Register specifications, reorder levels, standard costing & storage location
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-slate-200">
          {/* Section 1: Basic Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Item Identification & Classification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Material Code *</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MAT-CEM-001"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                />
                {errors.code && <p className="text-red-400 text-xs mt-1">{errors.code}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Material Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ordinary Portland Cement 50kg"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as MaterialCategory)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Unit of Measure (UOM) *</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {COMMON_UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                    <option value="OTHER">Other Custom...</option>
                  </select>
                  {unit === 'OTHER' && (
                    <input
                      type="text"
                      placeholder="e.g. Liters"
                      value={customUnit}
                      onChange={e => setCustomUnit(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>
                {errors.unit && <p className="text-red-400 text-xs mt-1">{errors.unit}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Stock Thresholds & Costing */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Stock Thresholds & Costing (LKR)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Min Stock Level *
                  <span className="text-slate-500 text-[10px] ml-1">(Reorder trigger)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={minStockLevel}
                  onChange={e => setMinStockLevel(Number(e.target.value))}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
                {errors.minStockLevel && <p className="text-red-400 text-xs mt-1">{errors.minStockLevel}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Max Stock Level *
                  <span className="text-slate-500 text-[10px] ml-1">(Ceiling limit)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={maxStockLevel}
                  onChange={e => setMaxStockLevel(Number(e.target.value))}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
                {errors.maxStockLevel && <p className="text-red-400 text-xs mt-1">{errors.maxStockLevel}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Reorder Qty
                  <span className="text-slate-500 text-[10px] ml-1">(Standard lot)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={reorderQuantity}
                  onChange={e => setReorderQuantity(Number(e.target.value))}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Standard Cost (LKR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">Rs</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={standardCost}
                    onChange={e => setStandardCost(Number(e.target.value))}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Warehouse & Supplier Linking */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Warehouse Storage & Preferred Supplier
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Default Warehouse / Store *</label>
                <select
                  value={defaultWarehouseId}
                  onChange={e => setDefaultWarehouseId(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
                {errors.defaultWarehouseId && <p className="text-red-400 text-xs mt-1">{errors.defaultWarehouseId}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Location Rack / Bin</label>
                <input
                  type="text"
                  value={defaultLocationBin}
                  onChange={e => setDefaultLocationBin(e.target.value)}
                  placeholder="e.g. Aisle B, Rack 02, Bin 14"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Primary Supplier</label>
                <select
                  value={primarySupplierId}
                  onChange={e => setPrimarySupplierId(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Select Preferred Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.categories?.join(', ') || s.supplierType})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Specifications & Notes */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Technical Standards & Brand Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Brand / Grade / Strength</label>
                <input
                  type="text"
                  value={brandOrGrade}
                  onChange={e => setBrandOrGrade(e.target.value)}
                  placeholder="e.g. Tokyo Super 42.5N / Lanwa Fe 500D"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Specifications / Standard</label>
                <input
                  type="text"
                  value={specifications}
                  onChange={e => setSpecifications(e.target.value)}
                  placeholder="e.g. SLS 107 / BS 4449 Grade 500D / ASTM C33"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Storage Instructions / Safety Handling</label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Keep elevated on wooden pallets, wrap in tarpaulin against rain moisture..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="mat-is-active"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
              />
              <label htmlFor="mat-is-active" className="text-xs font-medium text-slate-300 cursor-pointer">
                Active in Material Master (available for GRN and Site Requisitions)
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 sticky bottom-0 bg-slate-900/90 py-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-lg shadow-amber-500/20"
            >
              {material ? 'Save Changes' : 'Create Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
