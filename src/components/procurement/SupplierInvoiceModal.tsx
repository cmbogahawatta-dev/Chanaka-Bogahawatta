import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Receipt,
  Building2,
  Calendar,
  DollarSign,
  FileCheck,
  Save,
  Percent,
  Tag,
  Plus,
  Trash2,
  Upload,
  FileText,
  Check,
  Layers,
  Paperclip
} from 'lucide-react';
import { useSupplier } from '../../context/SupplierContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { Supplier, SupplierInvoiceItem } from '../../types/supplierTypes';

interface SupplierInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSupplier?: Supplier | null;
  preselectedPoId?: string;
}

interface FormInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
}

export const SupplierInvoiceModal: React.FC<SupplierInvoiceModalProps> = ({
  isOpen,
  onClose,
  preselectedSupplier,
  preselectedPoId
}) => {
  const { suppliers, addInvoice } = useSupplier();
  const { procurementOrders } = useEnterprise();
  const { projects } = usePettyCash();

  const [supplierId, setSupplierId] = useState('');
  const [poId, setPoId] = useState('');
  const [projectCode, setProjectCode] = useState('PIDM 26');
  const [supplierInvoiceRef, setSupplierInvoiceRef] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [vatPercent, setVatPercent] = useState<number>(18);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState<'Draft' | 'Pending Approval' | 'Approved'>('Pending Approval');

  // Multi-item list state
  const [items, setItems] = useState<FormInvoiceItem[]>([
    {
      id: `inv-item-${Date.now()}-1`,
      description: '',
      quantity: 1,
      unit: 'Units',
      unitPrice: 0,
      totalAmount: 0
    }
  ]);

  // Invoice Attachment State
  const [invoiceAttachmentName, setInvoiceAttachmentName] = useState<string | null>(null);
  const [invoiceAttachmentData, setInvoiceAttachmentData] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedSupplier = suppliers.find(s => s.id === supplierId);
  const selectedPo = useMemo(() => {
    return procurementOrders.find(p => p.id === poId);
  }, [procurementOrders, poId]);

  // Helper to map PO items into invoice line items
  const populateFromPo = (po: any) => {
    if (po.ITEMS && po.ITEMS.length > 0) {
      setItems(
        po.ITEMS.map((it: any, idx: number) => ({
          id: `inv-item-po-${Date.now()}-${idx}`,
          description: it.description || '',
          quantity: it.quantity || 1,
          unit: it.unit || 'Units',
          unitPrice: it.unitPrice || 0,
          totalAmount: it.totalAmount || (it.quantity || 1) * (it.unitPrice || 0)
        }))
      );
    } else {
      setItems([
        {
          id: `inv-item-po-${Date.now()}-0`,
          description: po.ITEM_DESCRIPTION || '',
          quantity: po.QUANTITY || 1,
          unit: po.UNIT || 'Units',
          unitPrice: po.UNIT_PRICE || (po.TOTAL_AMOUNT && po.QUANTITY ? Math.round(po.TOTAL_AMOUNT / po.QUANTITY) : 0),
          totalAmount: po.TOTAL_AMOUNT || 0
        }
      ]);
    }
  };

  // Initialize
  useEffect(() => {
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
  }, [preselectedSupplier, preselectedPoId, suppliers, procurementOrders]);

  // When PO is picked, autofill
  const handlePoChange = (selectedPoId: string) => {
    setPoId(selectedPoId);
    if (!selectedPoId) return;

    const po = procurementOrders.find(p => p.id === selectedPoId);
    if (po) {
      setProjectCode(po.PROJECT_CODE);
      populateFromPo(po);
      if (po.SUPPLIER_ID) {
        setSupplierId(po.SUPPLIER_ID);
      }
      setRemarks(`Invoiced against PO ${po.PO_NUMBER} (${po.ITEM_DESCRIPTION})`);
    }
  };

  // Auto calculate due date from credit terms
  useEffect(() => {
    if (!invoiceDate) return;
    const invDateObj = new Date(invoiceDate);
    if (isNaN(invDateObj.getTime())) return;

    let daysToAdd = 30;
    if (selectedSupplier?.creditTerms) {
      const period = selectedSupplier.creditTerms.creditPeriod;
      if (period === 'Cash') daysToAdd = 0;
      else if (period === '7 Days') daysToAdd = 7;
      else if (period === '15 Days') daysToAdd = 15;
      else if (period === '30 Days') daysToAdd = 30;
      else if (period === '45 Days') daysToAdd = 45;
      else if (period === '60 Days') daysToAdd = 60;
      else if (period === 'Custom' && selectedSupplier.creditTerms.customPeriodDays) {
        daysToAdd = selectedSupplier.creditTerms.customPeriodDays;
      }
    }

    const due = new Date(invDateObj);
    due.setDate(due.getDate() + daysToAdd);
    setDueDate(due.toISOString().slice(0, 10));

    // Adjust VAT % if supplier is non-VAT
    if (selectedSupplier && !selectedSupplier.isVatRegistered) {
      setVatPercent(0);
    } else if (selectedSupplier && selectedSupplier.isVatRegistered && vatPercent === 0) {
      setVatPercent(18);
    }
  }, [supplierId, invoiceDate, selectedSupplier]);

  // Items manipulation
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: `inv-item-${Date.now()}-${prev.length + 1}`,
        description: '',
        quantity: 1,
        unit: 'Units',
        unitPrice: 0,
        totalAmount: 0
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      alert('An invoice must contain at least one line item.');
      return;
    }
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const handleItemChange = (id: string, field: keyof FormInvoiceItem, value: any) => {
    setItems(prev =>
      prev.map(it => {
        if (it.id !== id) return it;

        const updated = { ...it, [field]: value };
        const qty = field === 'quantity' ? Number(value) || 0 : it.quantity;
        const rate = field === 'unitPrice' ? Number(value) || 0 : it.unitPrice;
        updated.totalAmount = Math.round(qty * rate);

        return updated;
      })
    );
  };

  // Upload Invoice Attachment
  const handleFileUpload = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please upload a smaller document.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setInvoiceAttachmentData(e.target?.result as string);
      setInvoiceAttachmentName(file.name);
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
    setInvoiceAttachmentName(null);
    setInvoiceAttachmentData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  // Subtotal & Financial Computations
  const grossSubtotal = items.reduce((acc, it) => acc + (Number(it.totalAmount) || 0), 0);
  const vatAmount = Math.round((grossSubtotal * vatPercent) / 100);
  const netAmount = Math.max(0, grossSubtotal + vatAmount - discountAmount);

  const formatLKR = (amt: number) => {
    return `LKR ${Number(amt || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId || !supplierInvoiceRef.trim()) {
      alert('Please fill supplier and official vendor invoice reference number.');
      return;
    }

    // Validate line items
    const invalidItem = items.find(it => !it.description.trim() || it.quantity <= 0);
    if (invalidItem) {
      alert('Please ensure all invoice items have a description and valid quantity.');
      return;
    }

    if (netAmount <= 0) {
      alert('Invoice total payable amount must be greater than zero.');
      return;
    }

    const supplier = suppliers.find(s => s.id === supplierId);
    const po = procurementOrders.find(p => p.id === poId);

    const formattedItems: SupplierInvoiceItem[] = items.map((it, idx) => ({
      id: it.id || `item-inv-${Date.now()}-${idx}`,
      description: it.description.trim(),
      quantity: Number(it.quantity) || 0,
      unit: it.unit.trim() || 'Units',
      unitPrice: Number(it.unitPrice) || 0,
      totalAmount: Number(it.totalAmount) || 0
    }));

    addInvoice({
      supplierInvoiceRef: supplierInvoiceRef.trim(),
      poId: poId || undefined,
      poNumber: po?.PO_NUMBER || undefined,
      supplierId,
      supplierName: supplier?.name || 'Supplier',
      projectCode,
      invoiceDate,
      dueDate: dueDate || invoiceDate,
      grossAmount: grossSubtotal,
      subtotal: grossSubtotal,
      vatAmount,
      discountAmount,
      netAmount,
      currency: supplier?.creditTerms?.currency || 'LKR',
      status,
      items: formattedItems,
      invoiceAttachmentName: invoiceAttachmentName || undefined,
      invoiceAttachmentData: invoiceAttachmentData || undefined,
      remarks: remarks.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-800/80 flex items-center justify-center text-blue-400 font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Register Supplier / Vendor Tax Invoice
              </h3>
              <p className="text-xs text-slate-400">
                Itemized invoice line breakdown, 3-way matching with Purchase Order, VAT & upload vendor invoice copy.
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
          {/* Section 1: Header Metadata */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              1. Vendor & Invoice General Details
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Select Supplier / Vendor <span className="text-rose-400">*</span>
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:border-blue-500"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name} ({s.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Link to Purchase Order (Optional / 3-Way Match)
                </label>
                <select
                  value={poId}
                  onChange={(e) => handlePoChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Standalone Invoice / None --</option>
                  {procurementOrders.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.PO_NUMBER} - {p.SUPPLIER_NAME} ({formatLKR(p.TOTAL_AMOUNT)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Supplier Official Invoice Ref <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={supplierInvoiceRef}
                  onChange={(e) => setSupplierInvoiceRef(e.target.value)}
                  placeholder="e.g. LRM-INV-2026-4421"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Project Code
                </label>
                <select
                  value={projectCode}
                  onChange={(e) => setProjectCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {projects.map((p, idx) => (
                    <option key={`${p.PROJECT_CODE}-${idx}`} value={p.PROJECT_CODE}>{p.PROJECT_CODE}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Approval Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Approved">Approved (Ready for Payment)</option>
                  <option value="Pending Approval">Pending Approval (Under Audit)</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>

            {/* Dates & Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Invoice Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span>Due Date (Auto-calculated)</span>
                  <span className="text-[10px] text-blue-400 font-semibold">
                    {selectedSupplier?.creditTerms?.creditPeriod || '30 Days'} Terms
                  </span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Multi-Item Invoice Line Items */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                    2. Invoice Materials & Services Schedule ({items.length} Line Items)
                  </span>
                  {selectedPo?.ITEMS && selectedPo.ITEMS.length > 1 && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-orange-950/80 text-orange-400 border border-orange-800 font-mono flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      <span>Loaded from PO #{selectedPo.PO_NUMBER}</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Record each delivered material or subcontract service line with quantity and unit price.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-700/50 text-xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Line Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-blue-400 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-950 border border-blue-800 flex items-center justify-center text-[10px]">
                        {index + 1}
                      </span>
                      <span>Item #{index + 1}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-200">
                        Total: {formatLKR(item.totalAmount)}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                          title="Remove Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Item / Service Description <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        placeholder="e.g. Ready Mix Grade 30 concrete, Structural steel 16mm..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Quantity <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        required
                        value={item.unit}
                        onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                        placeholder="Cubes, Bags, Nos"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Unit Price (LKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal preview bar */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Items in Invoice: <strong className="text-slate-200 font-mono">{items.length}</strong></span>
              <div className="text-right">
                <span className="text-slate-400 mr-2">Items Subtotal:</span>
                <strong className="text-slate-100 font-mono text-sm">{formatLKR(grossSubtotal)}</strong>
              </div>
            </div>
          </div>

          {/* Section 3: Upload Supplier Copy of Tax Invoice */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                  3. Upload Supplier Copy of Tax Invoice / Scanned Bill
                </span>
                <p className="text-[11px] text-slate-400">
                  Attach scanned official vendor tax invoice or receipt document (PDF, PNG, JPG up to 10MB).
                </p>
              </div>
              {invoiceAttachmentName && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1">
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

            {!invoiceAttachmentData ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-950/20'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-300">
                  Click to browse or drag & drop Supplier Tax Invoice copy
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Supports scanned PDF documents, photos, or vendor bill screenshots (Max 10MB)
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-blue-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  {invoiceAttachmentData.startsWith('data:image') ? (
                    <img
                      src={invoiceAttachmentData}
                      alt="Invoice thumbnail"
                      className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-200 block truncate">
                      {invoiceAttachmentName}
                    </span>
                    <span className="text-[10px] text-blue-400 font-mono block">
                      Vendor Invoice Attached for 3-Way Match & Audit
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

          {/* Section 4: Amount & Tax Calculation */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              4. Financial Computation & Payable Breakdown
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Gross Subtotal (LKR)</label>
                <input
                  type="number"
                  readOnly
                  value={grossSubtotal}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Computed from line items</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">VAT % (Standard 18%)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={vatPercent}
                  onChange={(e) => setVatPercent(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">0% if non-VAT vendor</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Discount / Rebate (LKR)</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Computed Breakdown Summary */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="space-y-0.5 text-slate-400 text-[11px]">
                <div>Gross Items Total: <span className="font-mono text-slate-300">{formatLKR(grossSubtotal)}</span></div>
                <div>VAT (+{vatPercent}%): <span className="font-mono text-slate-300">{formatLKR(vatAmount)}</span></div>
                {discountAmount > 0 && (
                  <div>Discount (-): <span className="font-mono text-emerald-400">{formatLKR(discountAmount)}</span></div>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Total Payable Amount</span>
                <span className="text-lg font-mono font-bold text-blue-400 block">{formatLKR(netAmount)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Remarks & Acceptance Verification</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Delivery note ticket verified against gate pass, site cube test passed..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs font-mono text-blue-400">
              Net Payable: <strong>{formatLKR(netAmount)}</strong>
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
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Record Supplier Invoice</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
