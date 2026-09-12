import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, User, Phone, Layers, ShieldCheck } from 'lucide-react';
import { Store, StoreType } from '../../../types/inventoryTypes';
import { useInventory } from '../../../context/InventoryContext';

interface StoreFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  store?: Store | null;
}

const STORE_TYPES: { value: StoreType; label: string }[] = [
  { value: 'CENTRAL_WAREHOUSE', label: 'Central Depot & Main Warehouse' },
  { value: 'SITE_STORE', label: 'Project Site Store & Yard' },
  { value: 'TRANSIT_YARD', label: 'Regional Transit Yard' },
  { value: 'WORKSHOP_STORE', label: 'Plant & Workshop Store' }
];

export const StoreFormModal: React.FC<StoreFormModalProps> = ({
  isOpen,
  onClose,
  store
}) => {
  const { addStore, updateStore } = useInventory();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<StoreType>('SITE_STORE');
  const [projectCode, setProjectCode] = useState('');
  const [location, setLocation] = useState('');
  const [storekeeper, setStorekeeper] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [capacitySqFt, setCapacitySqFt] = useState<number>(10000);
  const [zonesInput, setZonesInput] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (store) {
      setCode(store.code);
      setName(store.name);
      setType(store.type);
      setProjectCode(store.projectCode || '');
      setLocation(store.location);
      setStorekeeper(store.storekeeper);
      setContactNumber(store.contactNumber || '');
      setCapacitySqFt(store.capacitySqFt || 10000);
      setZonesInput((store.zones || []).join(', '));
      setStatus(store.status);
    } else {
      setCode(`ST-${String(Math.floor(Math.random() * 900) + 100)}`);
      setName('');
      setType('SITE_STORE');
      setProjectCode('PIDM 26');
      setLocation('');
      setStorekeeper('');
      setContactNumber('');
      setCapacitySqFt(12000);
      setZonesInput('Covered Shed, Open Stacking Yard, Tool Locker');
      setStatus('ACTIVE');
    }
    setErrors({});
  }, [store, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!code.trim()) newErrors.code = 'Store code is required';
    if (!name.trim()) newErrors.name = 'Store name is required';
    if (!location.trim()) newErrors.location = 'Physical location is required';
    if (!storekeeper.trim()) newErrors.storekeeper = 'Storekeeper / In-charge name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const zones = zonesInput
      .split(',')
      .map(z => z.trim())
      .filter(z => z.length > 0);

    if (store) {
      updateStore(store.id, {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        type,
        projectCode: projectCode.trim() || undefined,
        location: location.trim(),
        storekeeper: storekeeper.trim(),
        contactNumber: contactNumber.trim() || undefined,
        capacitySqFt: Number(capacitySqFt),
        zones,
        status
      });
    } else {
      addStore({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        type,
        projectCode: projectCode.trim() || undefined,
        location: location.trim(),
        storekeeper: storekeeper.trim(),
        contactNumber: contactNumber.trim() || undefined,
        capacitySqFt: Number(capacitySqFt),
        zones,
        status
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {store ? 'Edit Store / Warehouse' : 'Create New Store / Warehouse'}
              </h2>
              <p className="text-xs text-slate-400">
                Configure central depot, regional transit yard or site stores
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
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1 text-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Store Code *</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. WH-CENTRAL, ST-PIDM26"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
              {errors.code && <p className="text-red-400 text-xs mt-1">{errors.code}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Store / Warehouse Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Colombo Central Depot & Main Stores"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Store Type *</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as StoreType)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {STORE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Project Code (Optional)</label>
              <input
                type="text"
                value={projectCode}
                onChange={e => setProjectCode(e.target.value.toUpperCase())}
                placeholder="e.g. PIDM 26 or CENTRAL"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Physical Location / Site Address *</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Peliyagoda Logistics Park, Zone B, Colombo"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Storekeeper / In-Charge Name *</label>
              <input
                type="text"
                value={storekeeper}
                onChange={e => setStorekeeper(e.target.value)}
                placeholder="e.g. Sunil Wijesinghe"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              {errors.storekeeper && <p className="text-red-400 text-xs mt-1">{errors.storekeeper}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Contact Phone</label>
              <input
                type="text"
                value={contactNumber}
                onChange={e => setContactNumber(e.target.value)}
                placeholder="e.g. +94 77 123 4567"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Capacity (Sq. Ft)</label>
              <input
                type="number"
                min="0"
                value={capacitySqFt}
                onChange={e => setCapacitySqFt(Number(e.target.value))}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="ACTIVE">Active Store</option>
                <option value="INACTIVE">Inactive / Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Storage Zones / Bays (Comma-separated)
            </label>
            <input
              type="text"
              value={zonesInput}
              onChange={e => setZonesInput(e.target.value)}
              placeholder="e.g. Aisle A, Covered Shed 1, Open Stacking Yard, Tool Room"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
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
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg shadow-blue-600/20"
            >
              {store ? 'Save Changes' : 'Create Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
