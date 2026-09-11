import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  Building2,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Eye,
  DollarSign,
  Edit2,
  Trash2,
  Receipt,
  FileText,
  Printer,
  ShieldAlert,
  Landmark,
  Package,
  Layers
} from 'lucide-react';
import { useEnterprise } from '../../context/EnterpriseContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { useSupplier } from '../../context/SupplierContext';
import { ProcurementOrder, ProcurementOrderItem } from '../../types/enterpriseTypes';
import { AdminClearHistoryButton } from '../common/AdminClearHistoryButton';
import { UniversalDeleteModal } from '../common/UniversalDeleteModal';
import { SupplierInvoiceModal } from './SupplierInvoiceModal';
import { GoodsReceivedModal } from './GoodsReceivedModal';

interface PurchaseOrdersViewProps {
  initialSupplierId?: string | null;
}

interface OrderLineItemForm {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export const PurchaseOrdersView: React.FC<PurchaseOrdersViewProps> = ({ initialSupplierId }) => {
  const {
    procurementOrders,
    addProcurementOrder,
    updateProcurementOrder,
    deleteProcurementOrder,
    updateProcurementStatus,
    clearProcurementHistory,
    currentRole,
    currentUser
  } = useEnterprise();
  const { projects } = usePettyCash();
  const { suppliers } = useSupplier();
  const isAdmin = currentRole === 'ADMIN' || currentRole === 'OWNER';

  const [deleteTarget, setDeleteTarget] = useState<ProcurementOrder | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>(initialSupplierId || 'ALL');

  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProcurementOrder | null>(null);

  // Cross-modal triggers
  const [invoicePo, setInvoicePo] = useState<ProcurementOrder | null>(null);
  const [grnPo, setGrnPo] = useState<ProcurementOrder | null>(null);
  const [viewingPo, setViewingPo] = useState<ProcurementOrder | null>(null);

  // Form State
  const [projectCode, setProjectCode] = useState('PIDM 26');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [supplierName, setSupplierName] = useState('');
  const [orderItems, setOrderItems] = useState<OrderLineItemForm[]>([
    { id: 'item-1', description: '', quantity: 10, unit: 'Cubes', unitPrice: 25000 }
  ]);
  const [priority, setPriority] = useState<ProcurementOrder['PRIORITY']>('Medium');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [remarks, setRemarks] = useState('');
  const [pmOverrideAcknowledged, setPmOverrideAcknowledged] = useState(false);

  useEffect(() => {
    if (initialSupplierId) {
      setSelectedSupplierFilter(initialSupplierId);
    }
  }, [initialSupplierId]);

  const activeSupplier = suppliers.find(s => s.id === selectedSupplierId);

  useEffect(() => {
    if (editingOrder) {
      setProjectCode(editingOrder.PROJECT_CODE);
      setSelectedSupplierId(editingOrder.SUPPLIER_ID || '');
      setSupplierName(editingOrder.SUPPLIER_NAME);
      if (editingOrder.ITEMS && editingOrder.ITEMS.length > 0) {
        setOrderItems(
          editingOrder.ITEMS.map((it, idx) => ({
            id: it.id || `po-item-${idx + 1}`,
            description: it.description || '',
            quantity: Number(it.quantity) || 1,
            unit: it.unit || 'Cubes',
            unitPrice: Number(it.unitPrice) || 0
          }))
        );
      } else {
        setOrderItems([
          {
            id: 'item-1',
            description: editingOrder.ITEM_DESCRIPTION || '',
            quantity: Number(editingOrder.QUANTITY) || 1,
            unit: editingOrder.UNIT || 'Cubes',
            unitPrice: Number(editingOrder.UNIT_PRICE) || 0
          }
        ]);
      }
      setPriority(editingOrder.PRIORITY);
      setDeliveryLocation(editingOrder.DELIVERY_LOCATION);
      setRemarks(editingOrder.REMARKS || '');
      setPmOverrideAcknowledged(false);
    } else {
      setProjectCode(projects[0]?.PROJECT_CODE || 'PIDM 26');
      if (initialSupplierId && suppliers.some(s => s.id === initialSupplierId)) {
        const found = suppliers.find(s => s.id === initialSupplierId);
        setSelectedSupplierId(found?.id || '');
        setSupplierName(found?.name || '');
      } else {
        setSelectedSupplierId('');
        setSupplierName('');
      }
      setOrderItems([
        { id: `item-${Date.now()}`, description: '', quantity: 10, unit: 'Cubes', unitPrice: 25000 }
      ]);
      setPriority('Medium');
      setDeliveryLocation('');
      setRemarks('');
      setPmOverrideAcknowledged(false);
    }
  }, [editingOrder, projects, initialSupplierId, suppliers]);

  const handleAddLineItem = () => {
    setOrderItems(prev => [
      ...prev,
      {
        id: `po-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        description: '',
        quantity: 1,
        unit: prev[prev.length - 1]?.unit || 'Nos',
        unitPrice: 0
      }
    ]);
  };

  const handleRemoveLineItem = (indexToRemove: number) => {
    if (orderItems.length <= 1) {
      alert('A purchase order must have at least one line item.');
      return;
    }
    setOrderItems(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpdateLineItem = (index: number, field: keyof OrderLineItemForm, value: any) => {
    setOrderItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const totalCalculatedCommitment = useMemo(() => {
    return orderItems.reduce(
      (sum, it) => sum + ((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)),
      0
    );
  }, [orderItems]);

  const totalCalculatedQuantity = useMemo(() => {
    return orderItems.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  }, [orderItems]);

  const handleSelectSupplier = (sId: string) => {
    setSelectedSupplierId(sId);
    if (!sId) {
      return;
    }
    const match = suppliers.find(s => s.id === sId);
    if (match) {
      setSupplierName(match.name);
      if (match.notes && !remarks) {
        setRemarks(`Credit terms: ${match.creditTerms?.creditPeriod || '30 Days'}`);
      }
    }
  };

  const handleOpenNewOrder = () => {
    setEditingOrder(null);
    setIsNewOrderModalOpen(true);
  };

  const handleOpenEditOrder = (order: ProcurementOrder) => {
    setEditingOrder(order);
    setIsNewOrderModalOpen(true);
  };

  const formatLKR = (amt: number) => {
    return `LKR ${Number(amt || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;
  };

  const filteredOrders = useMemo(() => {
    return procurementOrders.filter(o => {
      const matchSearch =
        searchTerm === '' ||
        o.PO_NUMBER.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.ITEM_DESCRIPTION.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.SUPPLIER_NAME.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = selectedStatus === 'ALL' || o.STATUS === selectedStatus;
      const matchProj = selectedProject === 'ALL' || o.PROJECT_CODE === selectedProject;
      const matchSupplier =
        selectedSupplierFilter === 'ALL' ||
        o.SUPPLIER_ID === selectedSupplierFilter ||
        o.SUPPLIER_NAME.toLowerCase() === selectedSupplierFilter.toLowerCase();

      return matchSearch && matchStatus && matchProj && matchSupplier;
    });
  }, [procurementOrders, searchTerm, selectedStatus, selectedProject, selectedSupplierFilter]);

  const totalProcurementValue = useMemo(() => {
    return procurementOrders.reduce((acc, curr) => acc + (curr.TOTAL_AMOUNT || 0), 0);
  }, [procurementOrders]);

  const pendingApprovalsCount = useMemo(() => {
    return procurementOrders.filter(o => o.STATUS === 'Pending Approval').length;
  }, [procurementOrders]);

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSupplierName = supplierName.trim() || activeSupplier?.name || '';
    if (!finalSupplierName) {
      alert('Please select or specify a supplier name.');
      return;
    }

    if (orderItems.length === 0) {
      alert('Please add at least one line item.');
      return;
    }

    // Validate each line item
    for (let i = 0; i < orderItems.length; i++) {
      const it = orderItems[i];
      if (!it.description.trim()) {
        alert(`Please enter an item description for line item #${i + 1}.`);
        return;
      }
      if (Number(it.quantity) <= 0 || isNaN(Number(it.quantity))) {
        alert(`Quantity for line item #${i + 1} ("${it.description.slice(0, 20)}") must be greater than 0.`);
        return;
      }
      if (Number(it.unitPrice) < 0 || isNaN(Number(it.unitPrice))) {
        alert(`Unit price for line item #${i + 1} cannot be negative.`);
        return;
      }
    }

    // Safety validation for Blocked or Suspended supplier
    if (
      activeSupplier &&
      (activeSupplier.status === 'Blocked' || activeSupplier.status === 'Suspended') &&
      !pmOverrideAcknowledged
    ) {
      alert(
        `Selected supplier is currently ${activeSupplier.status}. You must acknowledge the Project Director / PM override before creating this PO.`
      );
      return;
    }

    const structuredItems: ProcurementOrderItem[] = orderItems.map((it, idx) => ({
      id: it.id || `po-item-${idx + 1}`,
      description: it.description.trim(),
      quantity: Number(it.quantity),
      unit: it.unit,
      unitPrice: Number(it.unitPrice),
      totalAmount: Number(it.quantity) * Number(it.unitPrice)
    }));

    const totalAmount = structuredItems.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const primaryDescription = structuredItems.length === 1
      ? structuredItems[0].description
      : `${structuredItems[0].description} (+${structuredItems.length - 1} more items)`;
    const primaryQty = structuredItems.length === 1
      ? structuredItems[0].quantity
      : structuredItems.reduce((acc, curr) => acc + curr.quantity, 0);
    const primaryUnit = structuredItems.length === 1 ? structuredItems[0].unit : 'Units';
    const primaryUnitPrice = structuredItems.length === 1
      ? structuredItems[0].unitPrice
      : Math.round(totalAmount / (primaryQty || 1));

    if (editingOrder) {
      updateProcurementOrder(editingOrder.id, {
        PROJECT_CODE: projectCode,
        SUPPLIER_ID: selectedSupplierId || undefined,
        SUPPLIER_NAME: finalSupplierName,
        ITEM_DESCRIPTION: primaryDescription,
        QUANTITY: primaryQty,
        UNIT: primaryUnit as any,
        UNIT_PRICE: primaryUnitPrice,
        TOTAL_AMOUNT: totalAmount,
        ITEMS: structuredItems,
        PRIORITY: priority,
        DELIVERY_LOCATION: deliveryLocation.trim() || `${projectCode} Main Site Yard`,
        REMARKS: remarks.trim()
      });
    } else {
      addProcurementOrder({
        DATE: new Date().toISOString().slice(0, 10),
        PROJECT_CODE: projectCode,
        REQUESTED_BY: currentUser,
        SUPPLIER_ID: selectedSupplierId || undefined,
        SUPPLIER_NAME: finalSupplierName,
        ITEM_DESCRIPTION: primaryDescription,
        QUANTITY: primaryQty,
        UNIT: primaryUnit as any,
        UNIT_PRICE: primaryUnitPrice,
        TOTAL_AMOUNT: totalAmount,
        ITEMS: structuredItems,
        STATUS: 'Pending Approval',
        PRIORITY: priority,
        DELIVERY_LOCATION: deliveryLocation.trim() || `${projectCode} Main Site Yard`,
        REMARKS: remarks.trim()
      });
    }

    setIsNewOrderModalOpen(false);
    setEditingOrder(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 backdrop-blur p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-950 text-orange-400 border border-orange-800 flex items-center justify-center font-bold">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Site Purchase Orders (PO) & Procurement</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Requisitions linked to Supplier Master, with credit terms, bank accounts, delivery tracking & invoice matching.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AdminClearHistoryButton
            id="btn-admin-clear-procurement"
            moduleName="Procurement Orders"
            itemCount={procurementOrders.length}
            itemDescription="purchase orders and requisition logs"
            preservedItemsDescription="Supplier Master, directories, and bank accounts remain intact."
            onClear={() => clearProcurementHistory()}
          />
          <button
            onClick={handleOpenNewOrder}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Purchase Orders</span>
          <div className="text-xl font-mono font-bold text-slate-100 mt-1">{procurementOrders.length} Orders</div>
          <span className="text-[10px] text-slate-400 font-medium">All registered site packages</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Committed PO Value</span>
          <div className="text-xl font-mono font-bold text-orange-400 mt-1">{formatLKR(totalProcurementValue)}</div>
          <span className="text-[10px] text-orange-300 font-medium">Materials, aggregates & equipment</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Awaiting Executive Approval</span>
          <div className="text-xl font-mono font-bold text-amber-400 mt-1">{pendingApprovalsCount} Requisitions</div>
          <span className="text-[10px] text-amber-300 font-medium">PM / Finance sign-off required</span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Search PO#, supplier, material description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Supplier Master Filter */}
          <select
            value={selectedSupplierFilter}
            onChange={(e) => setSelectedSupplierFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Suppliers</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
            ))}
          </select>

          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p, idx) => (
              <option key={`${p.id || p.PROJECT_CODE}-${idx}`} value={p.PROJECT_CODE}>{p.PROJECT_CODE}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Delivered">Delivered</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      {/* 4. Procurement Orders Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-3">PO Number & Date</th>
                <th className="p-3">Project & Location</th>
                <th className="p-3">Material Description</th>
                <th className="p-3">Supplier Master</th>
                <th className="p-3">Qty & Unit Price</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No procurement orders matching the filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const linkedSupplier = suppliers.find(
                    s => s.id === order.SUPPLIER_ID || s.name.toLowerCase() === order.SUPPLIER_NAME.toLowerCase()
                  );

                  return (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono">
                        <span className="font-bold text-slate-200 block">{order.PO_NUMBER}</span>
                        <span className="text-[10px] text-slate-400">{order.DATE}</span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold font-mono">
                          {order.PROJECT_CODE}
                        </span>
                        <span className="block text-[11px] text-slate-400 mt-0.5 truncate max-w-[140px]">
                          {order.DELIVERY_LOCATION}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-100">{order.ITEM_DESCRIPTION}</span>
                          {order.ITEMS && order.ITEMS.length > 1 && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-orange-950/80 text-orange-400 border border-orange-800 font-mono font-bold flex items-center gap-1">
                              <Layers className="w-2.5 h-2.5" />
                              <span>{order.ITEMS.length} items</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Requested by: {order.REQUESTED_BY}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-200">{order.SUPPLIER_NAME}</span>
                          {linkedSupplier && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-orange-950/60 text-orange-400 border border-orange-900">
                              {linkedSupplier.code}
                            </span>
                          )}
                        </div>
                        {linkedSupplier?.creditTerms && (
                          <span className="text-[10px] text-slate-500 block">
                            Terms: {linkedSupplier.creditTerms.creditPeriod}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-300">
                        {order.ITEMS && order.ITEMS.length > 1 ? (
                          <div>
                            <span className="text-slate-200 font-medium">{order.ITEMS.length} line items</span>
                            <span className="text-[10px] text-slate-400 block">Total Qty: {order.QUANTITY}</span>
                          </div>
                        ) : (
                          <span>{order.QUANTITY} {order.UNIT} @ {formatLKR(order.UNIT_PRICE)}</span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-bold text-orange-400">
                        {formatLKR(order.TOTAL_AMOUNT)}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          order.STATUS === 'Approved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          order.STATUS === 'Delivered' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                          order.STATUS === 'Pending Approval' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {order.STATUS}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {order.STATUS === 'Pending Approval' && (currentRole === 'ADMIN' || currentRole === 'FINANCE' || currentRole === 'OWNER') ? (
                            <button
                              onClick={() => updateProcurementStatus(order.id, 'Approved')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-all"
                            >
                              Approve
                            </button>
                          ) : order.STATUS === 'Approved' ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setGrnPo(order)}
                                className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] transition-all"
                                title="Issue Goods Received Note"
                              >
                                GRN
                              </button>
                              <button
                                onClick={() => setInvoicePo(order)}
                                className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] transition-all"
                                title="Record Invoice"
                              >
                                Invoice
                              </button>
                            </div>
                          ) : null}

                          <button
                            onClick={() => setViewingPo(order)}
                            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                            title="View / Print PO"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEditOrder(order)}
                                className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                                title="Admin: Edit Purchase Order"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(order)}
                                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                                title="Delete Purchase Order"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
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

      {/* CREATE / EDIT PO MODAL */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-950 text-orange-400 border border-orange-800 flex items-center justify-center font-bold">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {editingOrder ? `Edit Purchase Order (${editingOrder.PO_NUMBER})` : 'New Site Purchase Order'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Direct integration with Supplier Master, verified bank settlement & credit terms.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewOrderModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Supplier Master Selection Section */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-bold text-slate-200 text-xs flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-400" />
                  Select Supplier / Vendor from Master
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-400 mb-1">
                      Choose Registered Supplier
                    </label>
                    <select
                      value={selectedSupplierId}
                      onChange={(e) => handleSelectSupplier(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:border-orange-500"
                    >
                      <option value="">-- Custom / Ad-hoc Supplier --</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.code} - {s.name} ({s.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-400 mb-1">
                      Supplier Display Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      placeholder="e.g. Lanka ReadyMix (Pvt) Ltd"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Display Selected Supplier Metadata */}
                {activeSupplier && (
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Supplier Status:</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        activeSupplier.status === 'Active' ? 'text-emerald-400' :
                        activeSupplier.status === 'Approved' ? 'text-blue-400' :
                        'text-rose-400'
                      }`}>
                        {activeSupplier.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Credit Terms & Limit:</span>
                      <span className="text-slate-200 font-semibold">
                        {activeSupplier.creditTerms?.creditPeriod || '30 Days'} (Limit: LKR {(activeSupplier.creditTerms?.creditLimit || 0).toLocaleString()})
                      </span>
                    </div>
                    {activeSupplier.bankAccounts[0] && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Settlement Bank:</span>
                        <span className="text-emerald-400 font-mono">
                          {activeSupplier.bankAccounts[0].bank} ({activeSupplier.bankAccounts[0].accountNumber})
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Blocked / Suspended Safety Warning */}
                {activeSupplier && (activeSupplier.status === 'Blocked' || activeSupplier.status === 'Suspended') && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 space-y-2 text-rose-300">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Warning: Supplier is currently {activeSupplier.status}</span>
                    </div>
                    <p className="text-[11px] text-rose-300/80">
                      Issuing purchase orders to this vendor is restricted due to ongoing quality audit or compliance dispute.
                    </p>
                    <label className="flex items-center gap-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pmOverrideAcknowledged}
                        onChange={(e) => setPmOverrideAcknowledged(e.target.checked)}
                        className="rounded border-rose-700 text-rose-600 focus:ring-rose-500"
                      />
                      <span className="text-xs font-bold text-white">
                        I confirm Project Director / Managing Director authorization to override restriction.
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Project & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Project Site Code</label>
                  <select
                    value={projectCode}
                    onChange={(e) => setProjectCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    {projects.map((p, idx) => (
                      <option key={`${p.id || p.PROJECT_CODE}-${idx}`} value={p.PROJECT_CODE}>{p.PROJECT_CODE}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical (Stop Site)</option>
                  </select>
                </div>
              </div>

              {/* Multiple Order Line Items Section */}
              <div className="space-y-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-orange-400" />
                    <span className="font-bold text-slate-200 text-xs">
                      Purchase Order Line Items ({orderItems.length})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (Add multiple materials, components or services)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-950/90 text-orange-400 hover:bg-orange-900 border border-orange-800 text-xs font-semibold transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Line Item</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-[38vh] overflow-y-auto pr-1">
                  {orderItems.map((item, index) => {
                    const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                    return (
                      <div
                        key={item.id || index}
                        className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 relative group hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-mono font-bold">
                              #{index + 1}
                            </span>
                            <span className="text-xs font-semibold text-slate-300">
                              Item #{index + 1}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 mr-1.5">Line Total:</span>
                              <span className="text-xs font-mono font-bold text-orange-400">
                                {formatLKR(lineTotal)}
                              </span>
                            </div>
                            {orderItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveLineItem(index)}
                                className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                                title="Remove this line item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Item Description & Specifications <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={item.description}
                            onChange={(e) => handleUpdateLineItem(index, 'description', e.target.value)}
                            placeholder="e.g. Grade 30 Ready Mix Concrete with 100mm slump test certificate"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500 transition-colors"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">Quantity <span className="text-rose-400">*</span></label>
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              required
                              value={item.quantity}
                              onChange={(e) => handleUpdateLineItem(index, 'quantity', e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-orange-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">Unit of Measurement</label>
                            <select
                              value={item.unit}
                              onChange={(e) => handleUpdateLineItem(index, 'unit', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                            >
                              <option value="Cubes">Cubes</option>
                              <option value="Bags">Bags</option>
                              <option value="Tonnes">Tonnes (MT)</option>
                              <option value="MT">MT</option>
                              <option value="Liters">Liters</option>
                              <option value="Nos">Nos</option>
                              <option value="Units">Units</option>
                              <option value="Loads">Loads</option>
                              <option value="Meters">Meters (m)</option>
                              <option value="Sq.ft">Sq.ft</option>
                              <option value="Kg">Kg</option>
                              <option value="Hours">Hours</option>
                              <option value="Days">Days</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">Unit Price (LKR) <span className="text-rose-400">*</span></label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              required
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateLineItem(index, 'unitPrice', e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-orange-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="w-full py-2 border border-dashed border-slate-800 hover:border-orange-600/60 rounded-xl bg-slate-900/40 hover:bg-orange-950/20 text-slate-400 hover:text-orange-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Another Line Item</span>
                </button>
              </div>

              {/* Total Calculation Display */}
              <div className="p-3.5 rounded-xl bg-orange-950/20 border border-orange-800/40 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block text-xs">Total Purchase Commitment:</span>
                  <span className="text-[11px] text-slate-400">
                    {orderItems.length} {orderItems.length === 1 ? 'line item' : 'line items'} · Total Quantity: {totalCalculatedQuantity}
                  </span>
                </div>
                <span className="text-base font-mono font-bold text-orange-400">
                  {formatLKR(totalCalculatedCommitment)}
                </span>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Delivery Location</label>
                <input
                  type="text"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  placeholder={`${projectCode} Main Site Yard`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Remarks & Technical Instructions</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Delivery timing, test certificates required upon discharge..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 resize-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-lg shadow-orange-600/20 transition-all active:scale-95"
                >
                  {editingOrder ? 'Update Purchase Order' : 'Submit for Executive Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW / PRINT PO MODAL */}
      {viewingPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-orange-400 font-mono font-bold uppercase tracking-wider">Official Site Purchase Order</span>
                <h3 className="text-lg font-bold text-slate-100">{viewingPo.PO_NUMBER}</h3>
              </div>
              <button
                onClick={() => setViewingPo(null)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Date:</span>
                <strong className="text-slate-100 font-mono">{viewingPo.DATE}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Project Site:</span>
                <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono font-bold text-[10px]">
                  {viewingPo.PROJECT_CODE}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Supplier:</span>
                <strong className="text-slate-100 truncate block">{viewingPo.SUPPLIER_NAME}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  viewingPo.STATUS === 'Approved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  viewingPo.STATUS === 'Delivered' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                  'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {viewingPo.STATUS}
                </span>
              </div>
            </div>

            {/* Itemized Line Items Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-3 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-orange-400" />
                  <span>Itemized Materials & Services Schedule</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {(viewingPo.ITEMS && viewingPo.ITEMS.length > 0 ? viewingPo.ITEMS.length : 1)} line items
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5 w-10">#</th>
                      <th className="p-2.5">Item Description & Specifications</th>
                      <th className="p-2.5 text-right">Qty</th>
                      <th className="p-2.5">Unit</th>
                      <th className="p-2.5 text-right">Rate (LKR)</th>
                      <th className="p-2.5 text-right">Amount (LKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {(viewingPo.ITEMS && viewingPo.ITEMS.length > 0
                      ? viewingPo.ITEMS
                      : [
                          {
                            id: '1',
                            description: viewingPo.ITEM_DESCRIPTION,
                            quantity: viewingPo.QUANTITY,
                            unit: viewingPo.UNIT,
                            unitPrice: viewingPo.UNIT_PRICE,
                            totalAmount: viewingPo.TOTAL_AMOUNT
                          }
                        ]
                    ).map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-800/30">
                        <td className="p-2.5 text-slate-500">{idx + 1}</td>
                        <td className="p-2.5 font-sans font-medium text-slate-200">{item.description}</td>
                        <td className="p-2.5 text-right text-slate-300">{item.quantity}</td>
                        <td className="p-2.5 text-slate-400 font-sans">{item.unit}</td>
                        <td className="p-2.5 text-right text-slate-300">{formatLKR(item.unitPrice)}</td>
                        <td className="p-2.5 text-right font-bold text-orange-400">
                          {formatLKR(item.totalAmount || (item.quantity * item.unitPrice))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Commitment Banner */}
            <div className="p-3.5 rounded-xl bg-orange-950/20 border border-orange-800/40 flex items-center justify-between font-mono">
              <span className="font-bold text-slate-200">Total Purchase Commitment:</span>
              <span className="text-base font-bold text-orange-400">{formatLKR(viewingPo.TOTAL_AMOUNT)}</span>
            </div>

            <div className="space-y-1 text-slate-400 text-xs">
              <div><strong className="text-slate-300">Delivery Location:</strong> {viewingPo.DELIVERY_LOCATION}</div>
              {viewingPo.REMARKS && <div><strong className="text-slate-300">Remarks:</strong> {viewingPo.REMARKS}</div>}
              <div><strong className="text-slate-300">Requested By:</strong> {viewingPo.REQUESTED_BY}</div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PO</span>
              </button>
              <button
                onClick={() => setViewingPo(null)}
                className="px-4 py-1.5 rounded-xl bg-orange-600 text-white font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals for Direct PO Actions */}
      <SupplierInvoiceModal
        isOpen={Boolean(invoicePo)}
        onClose={() => setInvoicePo(null)}
        preselectedPoId={invoicePo?.id}
      />

      <GoodsReceivedModal
        isOpen={Boolean(grnPo)}
        onClose={() => setGrnPo(null)}
        preselectedPoId={grnPo?.id}
      />

      {/* Universal Delete Modal */}
      {deleteTarget && (
        <UniversalDeleteModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          module="procurement"
          recordType="Purchase Order"
          recordId={deleteTarget.id}
          recordCode={deleteTarget.PO_NUMBER}
          recordTitle={deleteTarget.ITEM_DESCRIPTION}
          additionalDetails={`PO for ${deleteTarget.ITEM_DESCRIPTION} (${formatLKR(deleteTarget.TOTAL_AMOUNT)}) to ${deleteTarget.SUPPLIER_NAME}`}
          onDelete={() => {
            deleteProcurementOrder(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
};
