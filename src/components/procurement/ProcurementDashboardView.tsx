import React, { useMemo } from 'react';
import {
  Building2,
  ShoppingCart,
  Truck,
  Receipt,
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  DollarSign,
  ShieldCheck,
  CreditCard,
  Landmark,
  Star
} from 'lucide-react';
import { useSupplier } from '../../context/SupplierContext';
import { useEnterprise } from '../../context/EnterpriseContext';

interface ProcurementDashboardViewProps {
  onNavigateTab: (tab: 'suppliers' | 'orders' | 'deliveries' | 'invoices' | 'performance') => void;
}

export const ProcurementDashboardView: React.FC<ProcurementDashboardViewProps> = ({ onNavigateTab }) => {
  const { suppliers, invoices, grns } = useSupplier();
  const { procurementOrders } = useEnterprise();

  const totalPoValue = useMemo(() => {
    return procurementOrders.reduce((acc, curr) => acc + (curr.TOTAL_AMOUNT || 0), 0);
  }, [procurementOrders]);

  const totalInvoiced = useMemo(() => {
    return invoices.reduce((acc, curr) => acc + curr.netAmount, 0);
  }, [invoices]);

  const totalPaid = useMemo(() => {
    return invoices.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
  }, [invoices]);

  const outstandingPayables = totalInvoiced - totalPaid;

  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueInvoices = useMemo(() => {
    return invoices.filter(i => i.status !== 'Paid' && i.status !== 'Cancelled' && i.dueDate < todayStr);
  }, [invoices, todayStr]);

  const formatLKR = (amt: number) => {
    return `LKR ${Number(amt || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;
  };

  // Top 5 Suppliers by PO Value
  const topSuppliersByValue = useMemo(() => {
    const map = new Map<string, { name: string; code: string; totalVal: number; poCount: number; rating: string }>();

    procurementOrders.forEach(po => {
      const sup = suppliers.find(s => s.id === po.SUPPLIER_ID || s.name.toLowerCase() === po.SUPPLIER_NAME.toLowerCase());
      const key = sup ? sup.id : po.SUPPLIER_NAME;
      const cur = map.get(key) || {
        name: sup ? sup.name : po.SUPPLIER_NAME,
        code: sup ? sup.code : 'VND',
        totalVal: 0,
        poCount: 0,
        rating: sup ? sup.performance.rating : 'Good'
      };
      cur.totalVal += po.TOTAL_AMOUNT || 0;
      cur.poCount += 1;
      map.set(key, cur);
    });

    return Array.from(map.values()).sort((a, b) => b.totalVal - a.totalVal).slice(0, 5);
  }, [procurementOrders, suppliers]);

  return (
    <div className="space-y-6">
      {/* 1. Executive Headline & Quick Launchers */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-orange-950/40 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-950 text-orange-400 border border-orange-800">
              SUPPLY CHAIN & AP PIPELINE
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Enterprise Procurement & Vendor Management
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Complete lifecycle monitoring: Supplier Master qualification → Purchase Orders → Site Deliveries (GRN) → Accounts Payable Invoicing → Payment Voucher Settlements.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => onNavigateTab('suppliers')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
          >
            <Building2 className="w-3.5 h-3.5 text-orange-400" />
            <span>Supplier Master</span>
          </button>
          <button
            onClick={() => onNavigateTab('orders')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow transition-all"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Purchase Orders</span>
          </button>
        </div>
      </div>

      {/* 2. Key Operational Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('suppliers')}
          className="p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 cursor-pointer transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Suppliers Master</span>
            <Building2 className="w-4 h-4 text-orange-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-100">{suppliers.length} Vendors</div>
          <div className="text-[10px] text-emerald-400 font-medium">
            {suppliers.filter(s => s.status === 'Active').length} Active & Qualified
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('orders')}
          className="p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 cursor-pointer transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Purchase Orders</span>
            <ShoppingCart className="w-4 h-4 text-orange-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-2xl font-mono font-bold text-orange-400">{formatLKR(totalPoValue)}</div>
          <div className="text-[10px] text-slate-400 font-medium">
            {procurementOrders.length} Committed POs
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('deliveries')}
          className="p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 cursor-pointer transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Deliveries / GRN</span>
            <Truck className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400">{grns.length} Notes</div>
          <div className="text-[10px] text-emerald-300 font-medium">
            {grns.filter(g => g.status === 'Accepted').length} Fully QA Accepted
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('invoices')}
          className="p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 cursor-pointer transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Payables</span>
            <Receipt className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-2xl font-mono font-bold text-rose-400">{formatLKR(outstandingPayables)}</div>
          <div className="text-[10px] text-amber-400 font-medium">
            {overdueInvoices.length} Overdue past payment terms
          </div>
        </div>
      </div>

      {/* 3. 5-Stage Supply Chain Pipeline */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
          Procurement to Settlement Lifecycle Pipeline
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          {/* Step 1 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-orange-400">STAGE 1</span>
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="font-bold text-slate-200">1. Master Qualification</div>
            <p className="text-[11px] text-slate-400">
              BR, TIN, bank verification & approved credit terms.
            </p>
            <div className="font-mono font-bold text-slate-300 pt-1 text-[11px]">
              {suppliers.length} Registered
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-orange-400">STAGE 2</span>
              <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="font-bold text-slate-200">2. PO Requisition</div>
            <p className="text-[11px] text-slate-400">
              Site material orders linked to supplier credit terms.
            </p>
            <div className="font-mono font-bold text-orange-400 pt-1 text-[11px]">
              {procurementOrders.length} Total POs
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-emerald-400">STAGE 3</span>
              <Truck className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="font-bold text-slate-200">3. Site GRN Delivery</div>
            <p className="text-[11px] text-slate-400">
              Slump tests, weighbridge tickets & inspection sign-off.
            </p>
            <div className="font-mono font-bold text-emerald-400 pt-1 text-[11px]">
              {grns.length} Verified Deliveries
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-blue-400">STAGE 4</span>
              <Receipt className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="font-bold text-slate-200">4. 3-Way Invoice Match</div>
            <p className="text-[11px] text-slate-400">
              Vendor tax invoice matched with PO & GRN tickets.
            </p>
            <div className="font-mono font-bold text-blue-400 pt-1 text-[11px]">
              {invoices.length} Invoices
            </div>
          </div>

          {/* Step 5 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-purple-400">STAGE 5</span>
              <Award className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="font-bold text-slate-200">5. Payment & Audit</div>
            <p className="text-[11px] text-slate-400">
              Payment voucher release & periodic vendor rating audit.
            </p>
            <div className="font-mono font-bold text-purple-400 pt-1 text-[11px]">
              {formatLKR(totalPaid)} Settled
            </div>
          </div>
        </div>
      </div>

      {/* 4. Top Suppliers & Overdue Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Suppliers by PO Value */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Top Procurement Suppliers by Order Value
            </h3>
            <button
              onClick={() => onNavigateTab('suppliers')}
              className="text-[11px] text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {topSuppliersByValue.map((sup, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-orange-950 border border-orange-900 text-orange-400 flex items-center justify-center font-bold text-[10px] font-mono">
                    #{idx + 1}
                  </div>
                  <div>
                    <span className="font-bold text-slate-100 block">{sup.name}</span>
                    <span className="text-[10px] text-slate-500">{sup.poCount} Orders • Rating: {sup.rating}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-orange-400 block">{formatLKR(sup.totalVal)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overdue / Upcoming Payables */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Immediate Accounts Payable Liabilities
            </h3>
            <button
              onClick={() => onNavigateTab('invoices')}
              className="text-[11px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
            >
              <span>AP Register</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {invoices.filter(i => i.status !== 'Paid').slice(0, 5).map((inv) => {
              const balance = inv.netAmount - (inv.paidAmount || 0);
              const isPast = inv.dueDate < todayStr;
              return (
                <div
                  key={inv.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">{inv.supplierName}</span>
                      <span className="font-mono text-[10px] text-slate-400">{inv.supplierInvoiceRef}</span>
                    </div>
                    <span className={`text-[10px] font-medium ${isPast ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                      Due: {inv.dueDate} {isPast && '(Overdue)'}
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-rose-400 block">{formatLKR(balance)}</span>
                    <span className="text-[10px] text-slate-500">Total: {formatLKR(inv.netAmount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
