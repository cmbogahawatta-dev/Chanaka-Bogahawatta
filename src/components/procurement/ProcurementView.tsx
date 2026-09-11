import React, { useState } from 'react';
import {
  Building2,
  ShoppingCart,
  Truck,
  Receipt,
  Award,
  TrendingUp,
  FolderTree,
  Plus,
  Sparkles
} from 'lucide-react';
import { ProcurementDashboardView } from './ProcurementDashboardView';
import { SupplierMasterView } from './SupplierMasterView';
import { PurchaseOrdersView } from './PurchaseOrdersView';
import { GoodsReceivedView } from './GoodsReceivedView';
import { SupplierInvoicesView } from './SupplierInvoicesView';
import { SupplierPerformanceView } from './SupplierPerformanceView';
import { useSupplier } from '../../context/SupplierContext';
import { useEnterprise } from '../../context/EnterpriseContext';

export type ProcurementTab = 'overview' | 'suppliers' | 'orders' | 'deliveries' | 'invoices' | 'performance';

export const ProcurementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProcurementTab>('overview');
  const [preselectedSupplierIdForPO, setPreselectedSupplierIdForPO] = useState<string | null>(null);

  const { suppliers, invoices, grns } = useSupplier();
  const { procurementOrders } = useEnterprise();

  const pendingPOApprovals = procurementOrders.filter(o => o.STATUS === 'Pending Approval').length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueInvoicesCount = invoices.filter(i => i.status !== 'Paid' && i.status !== 'Cancelled' && i.dueDate < todayStr).length;

  const handleNavigateToPOWithSupplier = (supplierId: string) => {
    setPreselectedSupplierIdForPO(supplierId);
    setActiveTab('orders');
  };

  return (
    <div className="space-y-6">
      {/* Primary Sub-Navigation Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 overflow-x-auto">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Executive Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('suppliers')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'suppliers'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-orange-400" />
            <span>Supplier Master</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-950 text-slate-300 border border-slate-800">
              {suppliers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPreselectedSupplierIdForPO(null);
              setActiveTab('orders');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Purchase Orders (PO)</span>
            {pendingPOApprovals > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-slate-950">
                {pendingPOApprovals}
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-950 text-slate-300 border border-slate-800">
                {procurementOrders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deliveries')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'deliveries'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Site Deliveries (GRN)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-950 text-slate-300 border border-slate-800">
              {grns.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'invoices'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-blue-400" />
            <span>Supplier Invoices (AP)</span>
            {overdueInvoicesCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white">
                {overdueInvoicesCount}
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-950 text-slate-300 border border-slate-800">
                {invoices.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('performance')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'performance'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-purple-400" />
            <span>Performance & Audits</span>
          </button>
        </div>
      </div>

      {/* Active Tab View Body */}
      {activeTab === 'overview' && (
        <ProcurementDashboardView onNavigateTab={setActiveTab} />
      )}

      {activeTab === 'suppliers' && (
        <SupplierMasterView onNavigateToPO={handleNavigateToPOWithSupplier} />
      )}

      {activeTab === 'orders' && (
        <PurchaseOrdersView initialSupplierId={preselectedSupplierIdForPO} />
      )}

      {activeTab === 'deliveries' && (
        <GoodsReceivedView />
      )}

      {activeTab === 'invoices' && (
        <SupplierInvoicesView />
      )}

      {activeTab === 'performance' && (
        <SupplierPerformanceView />
      )}
    </div>
  );
};
