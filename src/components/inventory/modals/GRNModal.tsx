import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileCheck, Building2, Truck, Calendar, DollarSign, UploadCloud, CheckCircle2 } from 'lucide-react';
import { InventoryGRN } from '../../../types/inventoryTypes';
import { useInventory } from '../../../context/InventoryContext';
import { useSuppliers } from '../../../context/SupplierContext';

interface GRNModalProps {
  isOpen: boolean;
  onClose: () => void;
  grn?: InventoryGRN | null;
}

interface GRNItemForm {
  materialId: string;
  materialCode: string;
  materialName: string;
  batchNumber: string;
  expiryDate?: string;
  unit: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  rejectionReason?: string;
  unitCost: number;
  totalValue: number;
  locationBin: string;
}

export const GRNModal: React.FC<GRNModalProps> = ({
  isOpen,
  onClose,
  grn
}) => {
  const { stores, materials, createGRN, updateGRN } = useInventory();
  const { suppliers } = useSuppliers();

  const [grnNumber, setGrnNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [storeId, setStoreId] = useState(stores[0]?.id || '');
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [inspectionStatus, setInspectionStatus] = useState<'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED'>('ACCEPTED');
  const [documentName, setDocumentName] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<GRNItemForm[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (grn) {
      setGrnNumber(grn.grnNumber);
      setDate(grn.date);
      setStoreId(grn.storeId);
      setSupplierId(grn.supplierId || '');
      setSupplierName(grn.supplierName);
      setPoNumber(grn.poNumber || '');
      setDeliveryNoteNumber(grn.deliveryNoteNumber || '');
      setVehicleNumber(grn.vehicleNumber || '');
      setDriverName(grn.driverName || '');
      setReceivedBy(grn.receivedBy);
      setInspectionStatus(grn.inspectionStatus);
      setDocumentName(grn.documentName || '');
      setNotes(grn.notes || '');
      setItems(grn.items.map(i => ({
        materialId: i.materialId,
        materialCode: i.materialCode,
        materialName: i.materialName,
        batchNumber: i.batchNumber || '',
        expiryDate: i.expiryDate,
        unit: i.unit,
        orderedQty: i.orderedQty || i.quantity,
        receivedQty: i.receivedQty || i.quantity,
        acceptedQty: i.acceptedQty !== undefined ? i.acceptedQty : i.quantity,
        rejectedQty: i.rejectedQty || 0,
        rejectionReason: i.rejectionReason,
        unitCost: i.unitCost,
        totalValue: i.totalValue,
        locationBin: i.locationBin || ''
      })));
    } else {
      const randomNum = String(Math.floor(Math.random() * 900) + 100);
      setGrnNumber(`GRN-2026-${randomNum}`);
      setDate(new Date().toISOString().split('T')[0]);
      setStoreId(stores[0]?.id || '');
      setSupplierId('');
      setSupplierName('');
      setPoNumber('');
      setDeliveryNoteNumber('');
      setVehicleNumber('');
      setDriverName('');
      setReceivedBy('Sunil Wijesinghe');
      setInspectionStatus('ACCEPTED');
      setDocumentName('');
      setNotes('');
      // Default with one item row if materials exist
      if (materials.length > 0) {
        const firstMat = materials[0];
        setItems([
          {
            materialId: firstMat.id,
            materialCode: firstMat.code,
            materialName: firstMat.name,
            batchNumber: `BATCH-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
            unit: firstMat.unit,
            orderedQty: firstMat.reorderQuantity || 50,
            receivedQty: firstMat.reorderQuantity || 50,
            acceptedQty: firstMat.reorderQuantity || 50,
            rejectedQty: 0,
            unitCost: firstMat.standardCost || 1000,
            totalValue: (firstMat.reorderQuantity || 50) * (firstMat.standardCost || 1000),
            locationBin: firstMat.defaultLocationBin || 'Inward Bay'
          }
        ]);
      } else {
        setItems([]);
      }
    }
    setErrors({});
  }, [grn, isOpen, stores, materials]);

  if (!isOpen) return null;

  const handleSupplierSelect = (id: string) => {
    setSupplierId(id);
    const found = suppliers.find(s => s.id === id);
    if (found) {
      setSupplierName(found.name);
    }
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
        batchNumber: `BATCH-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
        unit: defaultMat.unit,
        orderedQty: 10,
        receivedQty: 10,
        acceptedQty: 10,
        rejectedQty: 0,
        unitCost: defaultMat.standardCost || 0,
        totalValue: 10 * (defaultMat.standardCost || 0),
        locationBin: defaultMat.defaultLocationBin || 'Inward Bay'
      }
    ]);
  };

  const handleMaterialChange = (index: number, matId: string) => {
    const mat = materials.find(m => m.id === matId);
    if (!mat) return;
    setItems(prev => {
      const updated = [...prev];
      const cur = updated[index];
      const unitCost = mat.standardCost || cur.unitCost;
      updated[index] = {
        ...cur,
        materialId: mat.id,
        materialCode: mat.code,
        materialName: mat.name,
        unit: mat.unit,
        unitCost,
        totalValue: cur.acceptedQty * unitCost,
        locationBin: mat.defaultLocationBin || cur.locationBin
      };
      return updated;
    });
  };

  const handleItemQtyChange = (index: number, field: 'receivedQty' | 'acceptedQty' | 'rejectedQty' | 'unitCost', value: number) => {
    setItems(prev => {
      const updated = [...prev];
      const cur = updated[index];
      const updatedItem = { ...cur, [field]: value };

      if (field === 'receivedQty') {
        updatedItem.acceptedQty = Math.max(0, value - cur.rejectedQty);
      } else if (field === 'rejectedQty') {
        updatedItem.acceptedQty = Math.max(0, cur.receivedQty - value);
      }

      updatedItem.totalValue = updatedItem.acceptedQty * updatedItem.unitCost;
      updated[index] = updatedItem;
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, i) => sum + i.totalValue, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!grnNumber.trim()) newErrors.grnNumber = 'GRN Number is required';
    if (!date) newErrors.date = 'Date is required';
    if (!storeId) newErrors.storeId = 'Select store / warehouse';
    if (!supplierName.trim()) newErrors.supplierName = 'Supplier name is required';
    if (!receivedBy.trim()) newErrors.receivedBy = 'Received by name is required';
    if (items.length === 0) newErrors.items = 'Add at least one line item';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedStore = stores.find(s => s.id === storeId);

    const transactionItems = items.map((i, idx) => ({
      id: `grn-item-${Date.now()}-${idx}`,
      materialId: i.materialId,
      materialCode: i.materialCode,
      materialName: i.materialName,
      batchNumber: i.batchNumber.trim() || undefined,
      expiryDate: i.expiryDate || undefined,
      unit: i.unit,
      quantity: i.acceptedQty,
      orderedQty: i.orderedQty,
      receivedQty: i.receivedQty,
      acceptedQty: i.acceptedQty,
      rejectedQty: i.rejectedQty,
      rejectionReason: i.rejectionReason,
      unitCost: i.unitCost,
      totalValue: i.totalValue,
      locationBin: i.locationBin
    }));

    if (grn) {
      updateGRN(grn.id, {
        grnNumber: grnNumber.trim(),
        date,
        storeId,
        storeName: selectedStore?.name || 'Store',
        supplierId: supplierId || undefined,
        supplierName: supplierName.trim(),
        poNumber: poNumber.trim() || undefined,
        deliveryNoteNumber: deliveryNoteNumber.trim() || undefined,
        vehicleNumber: vehicleNumber.trim() || undefined,
        driverName: driverName.trim() || undefined,
        receivedBy: receivedBy.trim(),
        inspectionStatus,
        documentName: documentName.trim() || undefined,
        notes: notes.trim() || undefined,
        items: transactionItems,
        totalAmount
      });
    } else {
      createGRN({
        grnNumber: grnNumber.trim(),
        date,
        storeId,
        storeName: selectedStore?.name || 'Store',
        supplierId: supplierId || undefined,
        supplierName: supplierName.trim(),
        poNumber: poNumber.trim() || undefined,
        deliveryNoteNumber: deliveryNoteNumber.trim() || undefined,
        vehicleNumber: vehicleNumber.trim() || undefined,
        driverName: driverName.trim() || undefined,
        receivedBy: receivedBy.trim(),
        inspectionStatus,
        documentName: documentName.trim() || undefined,
        notes: notes.trim() || undefined,
        status: 'POSTED',
        items: transactionItems,
        totalAmount
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
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {grn ? 'Edit Goods Received Note (GRN)' : 'New Goods Received Note (Store Inward)'}
              </h2>
              <p className="text-xs text-slate-400">
                Receive materials from supplier, record batches, and increment store stock
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
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">GRN Number *</label>
              <input
                type="text"
                value={grnNumber}
                onChange={e => setGrnNumber(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono font-semibold"
              />
              {errors.grnNumber && <p className="text-red-400 text-xs mt-1">{errors.grnNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Received Date *</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Destination Store *</label>
              <select
                value={storeId}
                onChange={e => setStoreId(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Quality Inspection *</label>
              <select
                value={inspectionStatus}
                onChange={e => setInspectionStatus(e.target.value as any)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ACCEPTED">Accepted (100% Passed)</option>
                <option value="PARTIALLY_ACCEPTED">Partially Accepted</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Supplier & Transport Info */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Supplier *</label>
              <select
                value={supplierId}
                onChange={e => handleSupplierSelect(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Choose Supplier --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {!supplierId && (
                <input
                  type="text"
                  placeholder="Or enter supplier name..."
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  className="w-full mt-1.5 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              )}
              {errors.supplierName && <p className="text-red-400 text-xs mt-1">{errors.supplierName}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">PO Reference #</label>
              <input
                type="text"
                placeholder="e.g. PO-202608-012"
                value={poNumber}
                onChange={e => setPoNumber(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Supplier Delivery Note #</label>
              <input
                type="text"
                placeholder="e.g. DN-TK-99201"
                value={deliveryNoteNumber}
                onChange={e => setDeliveryNoteNumber(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Vehicle / Truck No</label>
              <input
                type="text"
                placeholder="e.g. WP-LY-4421"
                value={vehicleNumber}
                onChange={e => setVehicleNumber(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Driver Name</label>
              <input
                type="text"
                placeholder="e.g. R. M. Bandara"
                value={driverName}
                onChange={e => setDriverName(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Received & Inspected By *</label>
              <input
                type="text"
                placeholder="e.g. Sunil Wijesinghe"
                value={receivedBy}
                onChange={e => setReceivedBy(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              {errors.receivedBy && <p className="text-red-400 text-xs mt-1">{errors.receivedBy}</p>}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Received Items & Batch Information
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Material Row
              </button>
            </div>

            {errors.items && <p className="text-red-400 text-xs">{errors.items}</p>}

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-800/90 text-slate-300 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="p-2.5 min-w-[180px]">Material Item</th>
                    <th className="p-2.5 min-w-[120px]">Batch / Lot #</th>
                    <th className="p-2.5 min-w-[90px]">Recv Qty</th>
                    <th className="p-2.5 min-w-[90px]">Accpt Qty</th>
                    <th className="p-2.5 min-w-[80px]">UOM</th>
                    <th className="p-2.5 min-w-[100px]">Unit Cost</th>
                    <th className="p-2.5 min-w-[110px]">Total (LKR)</th>
                    <th className="p-2.5 min-w-[120px]">Storage Bin</th>
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
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          {materials.map(m => (
                            <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="Batch/Heat #"
                          value={item.batchNumber}
                          onChange={e => {
                            const val = e.target.value;
                            setItems(prev => prev.map((it, i) => i === idx ? { ...it, batchNumber: val } : it));
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.receivedQty}
                          onChange={e => handleItemQtyChange(idx, 'receivedQty', Number(e.target.value))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.acceptedQty}
                          onChange={e => handleItemQtyChange(idx, 'acceptedQty', Number(e.target.value))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold text-emerald-400"
                        />
                      </td>
                      <td className="p-2 text-slate-400 font-mono">{item.unit}</td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unitCost}
                          onChange={e => handleItemQtyChange(idx, 'unitCost', Number(e.target.value))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </td>
                      <td className="p-2 text-white font-mono font-semibold">
                        Rs. {item.totalValue.toLocaleString()}
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="Rack/Bin"
                          value={item.locationBin}
                          onChange={e => {
                            const val = e.target.value;
                            setItems(prev => prev.map((it, i) => i === idx ? { ...it, locationBin: val } : it));
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
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

            {/* Total Summary Banner */}
            <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700/80 rounded-xl px-4 py-3">
              <span className="text-xs text-slate-400">Total Goods Receipt Valuation:</span>
              <span className="text-base font-bold text-emerald-400 font-mono">
                LKR {totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Document Upload / Reference & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Attached Delivery Ticket / Mill Certificate File
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. TokyoSuper_DeliveryTicket_99201.pdf"
                  value={documentName}
                  onChange={e => setDocumentName(e.target.value)}
                  className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setDocumentName(`DeliveryTicket_${Date.now()}.pdf`)}
                  className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Simulate Document Attachment"
                >
                  <UploadCloud className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Inspection Notes / Delivery Remarks</label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Received in good condition, unloaded into covered bay, moisture check passed..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
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
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-600/20"
            >
              {grn ? 'Save GRN Changes' : 'Post GRN & Increment Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
