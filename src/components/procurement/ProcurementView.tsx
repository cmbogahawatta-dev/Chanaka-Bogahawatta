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
  Trash2
} from 'lucide-react';
import { useEnterprise } from '../../context/EnterpriseContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { ProcurementOrder } from '../../types/enterpriseTypes';
import { AdminClearHistoryButton } from '../common/AdminClearHistoryButton';

export const ProcurementView: React.FC = () => {
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
  const isAdmin = currentRole === 'ADMIN' || currentRole === 'OWNER';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProcurementOrder | null>(null);

  // Form State
  const [projectCode, setProjectCode] = useState('PIDM 26');
  const [supplierName, setSupplierName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [unit, setUnit] = useState<ProcurementOrder['UNIT']>('Cubes');
  const [unitPrice, setUnitPrice] = useState<number>(25000);
  const [priority, setPriority] = useState<ProcurementOrder['PRIORITY']>('Medium');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (editingOrder) {
      setProjectCode(editingOrder.PROJECT_CODE);
      setSupplierName(editingOrder.SUPPLIER_NAME);
      setItemDescription(editingOrder.ITEM_DESCRIPTION);
      setQuantity(editingOrder.QUANTITY);
      setUnit(editingOrder.UNIT);
      setUnitPrice(editingOrder.UNIT_PRICE);
      setPriority(editingOrder.PRIORITY);
      setDeliveryLocation(editingOrder.DELIVERY_LOCATION);
      setRemarks(editingOrder.REMARKS || '');
    } else {
      setProjectCode(projects[0]?.PROJECT_CODE || 'PIDM 26');
      setSupplierName('');
      setItemDescription('');
      setQuantity(10);
      setUnit('Cubes');
      setUnitPrice(25000);
      setPriority('Medium');
      setDeliveryLocation('');
      setRemarks('');
    }
  }, [editingOrder, projects]);

  const handleOpenNewOrder = () => {
    setEditingOrder(null);
    setIsNewOrderModalOpen(true);
  };

  const handleOpenEditOrder = (order: ProcurementOrder) => {
    setEditingOrder(order);
    setIsNewOrderModalOpen(true);
  };

  const formatLKR = (amt: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0
    }).format(amt);
  };

  const filteredOrders = useMemo(() => {
    return procurementOrders.filter(o => {
      const matchSearch = searchTerm === '' ||
        o.PO_NUMBER.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.ITEM_DESCRIPTION.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.SUPPLIER_NAME.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = selectedStatus === 'ALL' || o.STATUS === selectedStatus;
      const matchProj = selectedProject === 'ALL' || o.PROJECT_CODE === selectedProject;

      return matchSearch && matchStatus && matchProj;
    });
  }, [procurementOrders, searchTerm, selectedStatus, selectedProject]);

  const totalProcurementValue = useMemo(() => {
    return procurementOrders.reduce((acc, curr) => acc + (curr.TOTAL_AMOUNT || 0), 0);
  }, [procurementOrders]);

  const pendingApprovalsCount = useMemo(() => {
    return procurementOrders.filter(o => o.STATUS === 'Pending Approval').length;
  }, [procurementOrders]);

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || !itemDescription.trim() || quantity <= 0 || unitPrice <= 0) {
      alert('Please fill all required procurement fields.');
      return;
    }

    if (editingOrder) {
      updateProcurementOrder(editingOrder.id, {
        PROJECT_CODE: projectCode,
        SUPPLIER_NAME: supplierName.trim(),
        ITEM_DESCRIPTION: itemDescription.trim(),
        QUANTITY: quantity,
        UNIT: unit,
        UNIT_PRICE: unitPrice,
        TOTAL_AMOUNT: quantity * unitPrice,
        PRIORITY: priority,
        DELIVERY_LOCATION: deliveryLocation.trim() || `${projectCode} Main Site Yard`,
        REMARKS: remarks.trim()
      });
    } else {
      addProcurementOrder({
        DATE: new Date().toISOString().slice(0, 10),
        PROJECT_CODE: projectCode,
        REQUESTED_BY: currentUser,
        SUPPLIER_NAME: supplierName.trim(),
        ITEM_DESCRIPTION: itemDescription.trim(),
        QUANTITY: quantity,
        UNIT: unit,
        UNIT_PRICE: unitPrice,
        TOTAL_AMOUNT: quantity * unitPrice,
        STATUS: 'Pending Approval',
        PRIORITY: priority,
        DELIVERY_LOCATION: deliveryLocation.trim() || `${projectCode} Main Site Yard`,
        REMARKS: remarks.trim()
      });
    }

    setIsNewOrderModalOpen(false);
    setEditingOrder(null);
    // Reset Form
    setSupplierName('');
    setItemDescription('');
    setRemarks('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 backdrop-blur p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-950 text-orange-400 border border-orange-800 flex items-center justify-center font-bold">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Site Procurement & Materials Requisition</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Purchase Orders (POs) for construction aggregates, cement, ready-mix, reinforcement steel, and bulk fuel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AdminClearHistoryButton
            id="btn-admin-clear-procurement"
            moduleName="Procurement Orders"
            itemCount={procurementOrders.length}
            itemDescription="purchase orders and requisition logs"
            preservedItemsDescription="Supplier directories and project allocations remain intact."
            onClear={() => clearProcurementHistory()}
          />
          <button
            onClick={handleOpenNewOrder}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Procurement Orders</span>
          <div className="text-xl font-mono font-bold text-slate-100 mt-1">{procurementOrders.length} Orders</div>
          <span className="text-[10px] text-slate-400 font-medium">All active site packages</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Committed PO Value</span>
          <div className="text-xl font-mono font-bold text-orange-400 mt-1">{formatLKR(totalProcurementValue)}</div>
          <span className="text-[10px] text-orange-300 font-medium">Materials & machinery hire</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Awaiting Executive Approval</span>
          <div className="text-xl font-mono font-bold text-amber-400 mt-1">{pendingApprovalsCount} Requisitions</div>
          <span className="text-[10px] text-amber-300 font-medium">Engineers & PM sign-off required</span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Search PO#, supplier, material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.PROJECT_CODE}>{p.PROJECT_CODE}</option>
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
                <th className="p-3">Supplier / Vendor</th>
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
                filteredOrders.map(order => (
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
                      <span className="font-semibold text-slate-100 block">{order.ITEM_DESCRIPTION}</span>
                      <span className="text-[10px] text-slate-400">Requested by: {order.REQUESTED_BY}</span>
                    </td>
                    <td className="p-3 font-medium text-slate-300">{order.SUPPLIER_NAME}</td>
                    <td className="p-3 font-mono text-slate-300">
                      {order.QUANTITY} {order.UNIT} @ {formatLKR(order.UNIT_PRICE)}
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
                            Approve PO
                          </button>
                        ) : order.STATUS === 'Approved' ? (
                          <button
                            onClick={() => updateProcurementStatus(order.id, 'Delivered')}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition-all"
                          >
                            Mark Delivered
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">Complete</span>
                        )}

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
                              onClick={() => {
                                if (window.confirm(`Admin: Are you sure you want to delete purchase order ${order.PO_NUMBER} for "${order.ITEM_DESCRIPTION}" (${formatLKR(order.TOTAL_AMOUNT)})?`)) {
                                  deleteProcurementOrder(order.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                              title="Admin: Delete Purchase Order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal: Create/Edit Purchase Order */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-slate-100 text-base">{editingOrder ? 'Edit Site Material Purchase Order' : 'New Site Material Purchase Order'}</h3>
              </div>
              <button
                onClick={() => {
                  setIsNewOrderModalOpen(false);
                  setEditingOrder(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Project Code</label>
                  <select
                    value={projectCode}
                    onChange={(e) => setProjectCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.PROJECT_CODE}>{p.PROJECT_CODE} - {p.PROJECT_NAME}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Supplier / Vendor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lanka ReadyMix (Pvt) Ltd"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Material Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 30 Ready Mix Concrete for Ch 14+200 Culvert"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value="Cubes">Cubes</option>
                    <option value="Bags">Bags</option>
                    <option value="MT">MT</option>
                    <option value="Units">Units</option>
                    <option value="Liters">Liters</option>
                    <option value="Hours">Hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Unit Price (LKR) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 font-bold">Estimated Total:</span>
                <span className="text-sm font-mono font-bold text-orange-400">{formatLKR(quantity * unitPrice)}</span>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Delivery Location</label>
                <input
                  type="text"
                  placeholder="e.g. PIDM 26 Site Yard, Ch 14+200"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Additional specs, batch test requirements..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewOrderModalOpen(false);
                    setEditingOrder(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold"
                >
                  {editingOrder ? 'Save Changes' : 'Submit Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
