import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Truck,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Save,
  FileText,
  Plus,
  Trash2,
  Upload,
  Layers,
  Paperclip,
  Check,
  Eye
} from 'lucide-react';
import { useSupplier } from '../../context/SupplierContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { Supplier, GRNStatus, GRNItem, GoodsReceivedNote } from '../../types/supplierTypes';

interface GoodsReceivedModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSupplier?: Supplier | null;
  preselectedPoId?: string;
  editGRN?: GoodsReceivedNote | null;
}

interface FormGRNItem {
  id: string;
  description: string;
  unit: string;
  orderedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  rejectionReason?: string;
}

export const GoodsReceivedModal: React.FC<GoodsReceivedModalProps> = ({
  isOpen,
  onClose,
  preselectedSupplier,
  preselectedPoId,
  editGRN
}) => {
  const { suppliers, addGRN, updateGoodsReceivedNote } = useSupplier();
  const { procurementOrders, currentUser } = useEnterprise();
  const { projects } = usePettyCash();

  const [poId, setPoId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [projectCode, setProjectCode] = useState('PIDM 26');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [receivedBy, setReceivedBy] = useState(currentUser || 'Site Engineer');
  const [qualityInspectionRemarks, setQualityInspectionRemarks] = useState('');

  // Multi-item list state
  const [items, setItems] = useState<FormGRNItem[]>([
    {
      id: `item-${Date.now()}-1`,
      description: '',
      unit: 'Cubes',
      orderedQuantity: 10,
      receivedQuantity: 10,
      acceptedQuantity: 10,
      rejectedQuantity: 0,
      rejectionReason: ''
    }
  ]);

  // Delivery Note attachment state
  const [deliveryNoteAttachmentName, setDeliveryNoteAttachmentName] = useState<string | null>(null);
  const [deliveryNoteAttachmentData, setDeliveryNoteAttachmentData] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedPo = useMemo(() => {
    return procurementOrders.find(p => p.id === poId);
  }, [procurementOrders, poId]);

  // Helper to map PO items into GRN items
  const populateFromPo = (po: any) => {
    if (po.ITEMS && po.ITEMS.length > 0) {
      setItems(
        po.ITEMS.map((it: any, idx: number) => ({
          id: `item-po-${Date.now()}-${idx}`,
          description: it.description || '',
          unit: it.unit || 'Units',
          orderedQuantity: it.quantity || 0,
          receivedQuantity: it.quantity || 0,
          acceptedQuantity: it.quantity || 0,
          rejectedQuantity: 0,
          rejectionReason: ''
        }))
      );
    } else {
      setItems([
        {
          id: `item-po-${Date.now()}-0`,
          description: po.ITEM_DESCRIPTION || '',
          unit: po.UNIT || 'Cubes',
          orderedQuantity: po.QUANTITY || 0,
          receivedQuantity: po.QUANTITY || 0,
          acceptedQuantity: po.QUANTITY || 0,
          rejectedQuantity: 0,
          rejectionReason: ''
        }
      ]);
    }
  };

  useEffect(() => {
    if (editGRN) {
      setPoId(editGRN.poId || '');
      setSupplierId(editGRN.supplierId || '');
      setProjectCode(editGRN.projectCode || 'PIDM 26');
      setDeliveryDate(editGRN.deliveryDate || new Date().toISOString().slice(0, 10));
      setDeliveryNoteNumber(editGRN.deliveryNoteNumber || '');
      setVehicleNumber(editGRN.vehicleNumber || '');
      setReceivedBy(editGRN.receivedBy || currentUser || 'Site Engineer');
      setQualityInspectionRemarks(editGRN.qualityInspectionRemarks || '');
      setDeliveryNoteAttachmentName(editGRN.deliveryNoteAttachmentName || null);
      setDeliveryNoteAttachmentData(editGRN.deliveryNoteAttachmentData || null);

      if (editGRN.items && editGRN.items.length > 0) {
        setItems(
          editGRN.items.map((it, idx) => ({
            id: it.id || `grn-item-${Date.now()}-${idx}`,
            description: it.description || '',
            unit: it.unit || 'Units',
            orderedQuantity: it.orderedQuantity || 0,
            receivedQuantity: it.receivedQuantity || 0,
            acceptedQuantity: it.acceptedQuantity ?? it.receivedQuantity ?? 0,
            rejectedQuantity: it.rejectedQuantity || 0,
            rejectionReason: it.rejectionReason || ''
          }))
        );
      } else {
        setItems([
          {
            id: `item-${Date.now()}-1`,
            description: editGRN.itemDescription || 'Material Delivery',
            unit: editGRN.unit || 'Cubes',
            orderedQuantity: editGRN.orderedQuantity ?? 10,
            receivedQuantity: editGRN.receivedQuantity ?? 10,
            acceptedQuantity: editGRN.acceptedQuantity ?? 10,
            rejectedQuantity: editGRN.rejectedQuantity ?? 0,
            rejectionReason: ''
          }
        ]);
      }
    } else {
      if (preselectedSupplier) {
        setSupplierId(preselectedSupplier.id);
      } else if (suppliers.length > 0 && !supplierId) {
        setSupplierId(suppliers[0].id);
      }

      if (preselectedPoId) {
        setPoId(preselectedPoId);
        const matchPo = procurementOrders.find(p => p.id === preselectedPoId);
        if (matchPo) {
          setProjectCode(matchPo.PROJECT_CODE);
          populateFromPo(matchPo);
          if (matchPo.SUPPLIER_ID) {
            setSupplierId(matchPo.SUPPLIER_ID);
          }
        }
      }
    }
  }, [editGRN, preselectedSupplier, preselectedPoId, suppliers, procurementOrders, currentUser]);

  const handlePoSelect = (selectedPoId: string) => {
    setPoId(selectedPoId);
    if (!selectedPoId) return;

    const po = procurementOrders.find(p => p.id === selectedPoId);
    if (po) {
      setProjectCode(po.PROJECT_CODE);
      populateFromPo(po);
      if (po.SUPPLIER_ID) {
        setSupplierId(po.SUPPLIER_ID);
      }
    }
  };

  // Item List manipulation handlers
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        description: '',
        unit: 'Units',
        orderedQuantity: 1,
        receivedQuantity: 1,
        acceptedQuantity: 1,
        rejectedQuantity: 0,
        rejectionReason: ''
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      alert('A Goods Received Note must have at least one line item.');
      return;
    }
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const handleItemChange = (id: string, field: keyof FormGRNItem, value: any) => {
    setItems(prev =>
      prev.map(it => {
        if (it.id !== id) return it;

        const updated = { ...it, [field]: value };

        // Handle auto-balancing of received / accepted / rejected quantities
        if (field === 'receivedQuantity') {
          const rec = Number(value) || 0;
          updated.receivedQuantity = rec;
          updated.acceptedQuantity = Math.max(0, rec - (updated.rejectedQuantity || 0));
        } else if (field === 'acceptedQuantity') {
          const acc = Number(value) || 0;
          updated.acceptedQuantity = acc;
          updated.rejectedQuantity = Math.max(0, updated.receivedQuantity - acc);
        } else if (field === 'rejectedQuantity') {
          const rej = Number(value) || 0;
          updated.rejectedQuantity = rej;
          updated.acceptedQuantity = Math.max(0, updated.receivedQuantity - rej);
        }

        return updated;
      })
    );
  };

  // Delivery Note File Handling
  const handleFileUpload = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please upload a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setDeliveryNoteAttachmentData(e.target?.result as string);
      setDeliveryNoteAttachmentName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleRemoveAttachment = () => {
    setDeliveryNoteAttachmentName(null);
    setDeliveryNoteAttachmentData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  // Aggregate stats across items
  const totalDelivered = items.reduce((acc, it) => acc + (Number(it.receivedQuantity) || 0), 0);
  const totalAccepted = items.reduce((acc, it) => acc + (Number(it.acceptedQuantity) || 0), 0);
  const totalRejected = items.reduce((acc, it) => acc + (Number(it.rejectedQuantity) || 0), 0);

  // Overall Status
  let status: GRNStatus = 'Accepted';
  if (totalRejected > 0 && totalAccepted > 0) {
    status = 'Partial';
  } else if (totalRejected > 0 && totalAccepted === 0) {
    status = 'Rejected';
  } else {
    status = 'Accepted';
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId || !deliveryNoteNumber.trim()) {
      alert('Please fill supplier and supplier delivery note number.');
      return;
    }

    // Validate items
    const invalidItem = items.find(it => !it.description.trim() || (Number(it.receivedQuantity) || 0) <= 0);
    if (invalidItem) {
      alert('Please ensure all items have a description and valid delivered quantity greater than zero.');
      return;
    }

    const supplier = suppliers.find(s => s.id === supplierId);
    const po = procurementOrders.find(p => p.id === poId);

    const formattedItems: GRNItem[] = items.map((it, idx) => ({
      id: it.id || `grn-item-${Date.now()}-${idx}`,
      description: it.description.trim(),
      unit: it.unit.trim() || 'Units',
      orderedQuantity: Number(it.orderedQuantity) || 0,
      receivedQuantity: Number(it.receivedQuantity) || 0,
      acceptedQuantity: Number(it.acceptedQuantity) || 0,
      rejectedQuantity: Number(it.rejectedQuantity) || 0,
      rejectionReason: Number(it.rejectedQuantity) > 0 ? it.rejectionReason?.trim() || undefined : undefined
    }));

    const primaryItem = formattedItems[0];

    if (editGRN) {
      updateGoodsReceivedNote(editGRN.id, {
        poId: poId || undefined,
        poNumber: po?.PO_NUMBER || editGRN.poNumber,
        supplierId,
        supplierName: supplier?.name || editGRN.supplierName || 'Supplier',
        projectCode,
        deliveryDate,
        deliveryNoteNumber: deliveryNoteNumber.trim(),
        vehicleNumber: vehicleNumber.trim() || undefined,
        receivedBy: receivedBy.trim(),
        itemDescription: items.length > 1 ? `${primaryItem.description} (+${items.length - 1} more items)` : primaryItem.description,
        unit: primaryItem.unit,
        orderedQuantity: items.reduce((acc, it) => acc + (it.orderedQuantity || 0), 0),
        receivedQuantity: totalDelivered,
        acceptedQuantity: totalAccepted,
        rejectedQuantity: totalRejected,
        items: formattedItems,
        qualityInspectionRemarks: qualityInspectionRemarks.trim() || 'Site physical inspection & QA specifications verified.',
        deliveryNoteAttachmentName: deliveryNoteAttachmentName || undefined,
        deliveryNoteAttachmentData: deliveryNoteAttachmentData || undefined,
        status
      });
    } else {
      addGRN({
        poId: poId || undefined,
        poNumber: po?.PO_NUMBER || undefined,
        supplierId,
        supplierName: supplier?.name || 'Supplier',
        projectCode,
        deliveryDate,
        deliveryNoteNumber: deliveryNoteNumber.trim(),
        vehicleNumber: vehicleNumber.trim() || undefined,
        receivedBy: receivedBy.trim(),
        itemDescription: items.length > 1 ? `${primaryItem.description} (+${items.length - 1} more items)` : primaryItem.description,
        unit: primaryItem.unit,
        orderedQuantity: items.reduce((acc, it) => acc + (it.orderedQuantity || 0), 0),
        receivedQuantity: totalDelivered,
        acceptedQuantity: totalAccepted,
        rejectedQuantity: totalRejected,
        items: formattedItems,
        qualityInspectionRemarks: qualityInspectionRemarks.trim() || 'Site physical inspection & QA specifications verified.',
        deliveryNoteAttachmentName: deliveryNoteAttachmentName || undefined,
        deliveryNoteAttachmentData: deliveryNoteAttachmentData || undefined,
        status
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  {editGRN ? `Edit Goods Received Note (${editGRN.grnNumber})` : 'Create Goods Received Note (GRN)'}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  status === 'Accepted'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                    : status === 'Partial'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                    : 'bg-rose-950/80 text-rose-300 border-rose-800'
                }`}>
                  {status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Log multi-item site delivery receipts, QA inspection results, and upload the supplier delivery note copy.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* General Delivery Information */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              1. Delivery & Supplier Information
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Supplier / Vendor <span className="text-rose-400">*</span>
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Linked Purchase Order (Optional / 3-Way Match)
                </label>
                <select
                  value={poId}
                  onChange={(e) => handlePoSelect(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Direct Site Delivery / None --</option>
                  {procurementOrders.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.PO_NUMBER} - {p.SUPPLIER_NAME} ({p.ITEM_DESCRIPTION})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Supplier Delivery Note No <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={deliveryNoteNumber}
                  onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                  placeholder="e.g. DN-2026-8812"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Project Code</label>
                <select
                  value={projectCode}
                  onChange={(e) => setProjectCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {projects.map((p, idx) => (
                    <option key={`${p.PROJECT_CODE}-${idx}`} value={p.PROJECT_CODE}>{p.PROJECT_CODE}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Delivery Date</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Delivery Vehicle / Transit Mixer No
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="e.g. WP-LH-4412 / WP-NA-9921"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Receiving Site Engineer / Officer
                </label>
                <input
                  type="text"
                  required
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Multiple Delivered Items List */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                    2. Delivered Materials & QA Verification ({items.length} Line Items)
                  </span>
                  {selectedPo?.ITEMS && selectedPo.ITEMS.length > 1 && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-orange-950/80 text-orange-400 border border-orange-800 font-mono flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      <span>Loaded from PO #{selectedPo.PO_NUMBER}</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Specify description, quantities ordered vs delivered, and QA accepted vs rejected per item.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-700/50 text-xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-[10px]">
                        {index + 1}
                      </span>
                      <span>Item #{index + 1}</span>
                    </span>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                        title="Remove Line Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-8">
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Item Description & Specification <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        placeholder="e.g. Ready Mix Grade 30, Portland Cement 50kg, 16mm Tor Steel..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Unit of Measure
                      </label>
                      <input
                        type="text"
                        required
                        value={item.unit}
                        onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                        placeholder="Cubes, Bags, Tonnes, MT, Nos"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Quantities grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-400 mb-1">
                        PO Ordered
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.orderedQuantity}
                        onChange={(e) => handleItemChange(item.id, 'orderedQuantity', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-slate-300 mb-1">
                        Delivered Qty
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={item.receivedQuantity}
                        onChange={(e) => handleItemChange(item.id, 'receivedQuantity', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-emerald-400 mb-1">
                        Accepted Qty
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.acceptedQuantity}
                        onChange={(e) => handleItemChange(item.id, 'acceptedQuantity', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-emerald-800/80 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-rose-400 mb-1">
                        Rejected Qty
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.rejectedQuantity}
                        onChange={(e) => handleItemChange(item.id, 'rejectedQuantity', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-rose-800/80 rounded-lg px-2.5 py-1.5 text-xs text-rose-300 font-mono font-bold focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  {item.rejectedQuantity > 0 && (
                    <div className="pt-1">
                      <label className="block text-[10px] font-medium text-rose-400 mb-1">
                        Specific Rejection Reason <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={item.rejectionReason || ''}
                        onChange={(e) => handleItemChange(item.id, 'rejectionReason', e.target.value)}
                        placeholder="e.g. Broken packaging, slump test out of spec (180mm), high moisture ratio"
                        className="w-full bg-slate-950 border border-rose-800/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Items Summary Bar */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-4 text-slate-400">
                <span>Total Items: <strong className="text-slate-200">{items.length}</strong></span>
                <span>Total Delivered: <strong className="text-slate-200 font-mono">{totalDelivered}</strong></span>
              </div>
              <div className="flex items-center gap-4 font-mono">
                <span className="text-emerald-400">Accepted: <strong>{totalAccepted}</strong></span>
                {totalRejected > 0 && (
                  <span className="text-rose-400">Rejected: <strong>{totalRejected}</strong></span>
                )}
              </div>
            </div>
          </div>

          {/* 3. Upload Supplier Copy of Delivery Note */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                  3. Upload Supplier Copy of Delivery Note / Weighbridge Ticket
                </span>
                <p className="text-[11px] text-slate-400">
                  Attach scanned delivery note, driver slip, or weighbridge docket (PDF, PNG, JPG up to 10MB).
                </p>
              </div>
              {deliveryNoteAttachmentName && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Attached</span>
                </span>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,.pdf"
              className="hidden"
            />

            {!deliveryNoteAttachmentData ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-950/20'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-300">
                  Click to browse or drag & drop Supplier Delivery Note copy
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Supports scanned PDF documents, photos, or weighbridge ticket images (Max 10MB)
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  {deliveryNoteAttachmentData.startsWith('data:image') ? (
                    <img
                      src={deliveryNoteAttachmentData}
                      alt="Delivery note thumbnail"
                      className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-200 block truncate">
                      {deliveryNoteAttachmentName}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono block">
                      Supplier Copy Ready for Audit & 3-Way Match
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveAttachment}
                    className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                    title="Remove Attachment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. QA/QC Inspection Remarks */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
              4. QA/QC Inspection Remarks & Slump Test Observations
            </label>
            <input
              type="text"
              value={qualityInspectionRemarks}
              onChange={(e) => setQualityInspectionRemarks(e.target.value)}
              placeholder="Visual inspection passed, slump test 110mm, test cubes casted on site, no visible defects."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              <span>Status: </span>
              <strong className={`font-semibold ${
                status === 'Accepted' ? 'text-emerald-400' : status === 'Partial' ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {status} ({items.length} items)
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{editGRN ? 'Save & Update GRN' : 'Issue Goods Received Note (GRN)'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
