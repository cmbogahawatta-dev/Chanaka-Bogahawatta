import React from 'react';
import {
  DollarSign,
  AlertTriangle,
  Zap,
  Clock,
  TrendingUp,
  Package,
  Building2,
  Boxes,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';

interface InventoryDashboardViewProps {
  onNavigateToTab: (tab: 'materials' | 'stores' | 'stock' | 'transactions', subTab?: string) => void;
  onOpenGRN: () => void;
  onOpenIssue: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Cement & Binders': '#f59e0b',
  'Steel & Reinforcement': '#3b82f6',
  'Aggregates & Sand': '#10b981',
  'Piping & Plumbing': '#06b6d4',
  'Electrical & Cable': '#8b5cf6',
  'Fuel, Oil & Lubricants': '#ef4444',
  'Tools & PPE Safety': '#ec4899',
  'Timber & Formwork': '#d97706',
  'Other': '#64748b'
};

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#06b6d4', '#8b5cf6', '#ef4444', '#ec4899', '#64748b'];

export const InventoryDashboardView: React.FC<InventoryDashboardViewProps> = ({
  onNavigateToTab,
  onOpenGRN,
  onOpenIssue
}) => {
  const { dashboardMetrics, lowStockAlerts, fastMovingMaterials, slowMovingMaterials, stores, materials } = useInventory();

  const formatLKR = (val: number) => {
    return `LKR ${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  // Prepare chart data for project consumption
  const projectChartData = dashboardMetrics.projectWiseConsumption.map(p => ({
    name: p.projectCode,
    value: p.totalConsumptionValue,
    transactions: p.issueCount
  }));

  // Prepare chart data for store valuation
  const storeChartData = dashboardMetrics.storeStockValuation.map(s => ({
    name: s.storeName.replace(' Stores', '').replace(' Depot & Main Stores', ''),
    value: s.stockValue,
    items: s.itemCount
  }));

  // Prepare category data
  const categoryChartData = dashboardMetrics.categoryValuation.map(c => ({
    name: c.categoryName,
    value: c.valuation
  }));

  return (
    <div className="space-y-6">
      {/* Top Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Stock Value */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Stock Value</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-white font-mono tracking-tight">
              {formatLKR(dashboardMetrics.totalStockValue)}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Boxes className="w-3.5 h-3.5 text-amber-400" />
              <span>{dashboardMetrics.totalMaterialsCount} Materials across {dashboardMetrics.activeStoresCount} Stores</span>
            </p>
          </div>
        </div>

        {/* Card 2: Low Stock Alerts */}
        <div 
          onClick={() => onNavigateToTab('materials')}
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg cursor-pointer relative overflow-hidden group hover:border-rose-500/50 transition-all"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock Alerts</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-rose-400 font-mono tracking-tight flex items-center gap-2">
              <span>{dashboardMetrics.lowStockCount} Items</span>
              {dashboardMetrics.outOfStockCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-normal border border-red-500/30">
                  {dashboardMetrics.outOfStockCount} Out
                </span>
              )}
            </div>
            <p className="text-xs text-rose-400/80 mt-1">
              Immediate replenishment PO required
            </p>
          </div>
        </div>

        {/* Card 3: Fast-Moving Materials */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fast-Moving SKUs</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-emerald-400 font-mono tracking-tight">
              {dashboardMetrics.fastMovingCount} High-Velocity
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active daily site requisitions
            </p>
          </div>
        </div>

        {/* Card 4: Slow-Moving Stock Tied Value */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Slow / Dormant Stock</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-purple-400 font-mono tracking-tight">
              {formatLKR(dashboardMetrics.slowMovingValue)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {dashboardMetrics.slowMovingCount} dormant items (&gt;45 days)
            </p>
          </div>
        </div>

        {/* Card 5: Monthly Site Issues */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-cyan-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Project Consumption</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-cyan-400 font-mono tracking-tight">
              {formatLKR(dashboardMetrics.monthlyConsumptionTotal)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cumulative site material issues
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Quick Store Operations:</span>
          <button
            onClick={onOpenGRN}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
          >
            + Inward GRN
          </button>
          <button
            onClick={onOpenIssue}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors shadow-sm"
          >
            + Material Issue (MIN)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToTab('stock')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            Stock Balances & Batches
          </button>
          <button
            onClick={() => onNavigateToTab('transactions')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            All 6 Transaction Registers →
          </button>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Project-wise Material Consumption */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Project-Wise Material Consumption (LKR)
              </h3>
              <p className="text-xs text-slate-400">
                Direct cost of materials issued and charged to active contract projects
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-1 rounded-lg">
              Total {dashboardMetrics.projectWiseConsumption.length} Sites
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectChartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  tickFormatter={val => `${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(val: any) => [`LKR ${Number(val).toLocaleString()}`, 'Consumption']}
                  labelFormatter={lbl => `Project: ${lbl}`}
                />
                <Bar dataKey="value" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category-wise Stock Valuation */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Category Stock Distribution
              </h3>
              <p className="text-xs text-slate-400">
                Inventory valuation broken down by material group
              </p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(val: any) => [`LKR ${Number(val).toLocaleString()}`, 'Value']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 mt-2 border-t border-slate-800 pt-3">
            {categoryChartData.slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="truncate">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Low Stock Alerts & Fast vs Slow Moving Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Radar Table (1 Col) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Low Stock Radar ({lowStockAlerts.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigateToTab('materials')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              View All →
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
            {lowStockAlerts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                All materials are above minimum reorder levels!
              </div>
            ) : (
              lowStockAlerts.map(alert => (
                <div
                  key={alert.materialId}
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col justify-between hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-white text-xs">{alert.materialName}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{alert.materialCode} • {alert.category}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>

                  {/* Stock Bar vs Min */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-rose-400 font-mono font-bold">
                        {alert.currentStock} {alert.unit} on hand
                      </span>
                      <span className="text-slate-400 font-mono">
                        Min: {alert.minStockLevel} | Reorder: {alert.suggestedReorderQty}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (alert.currentStock / alert.minStockLevel) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Fast-Moving Materials (1 Col) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Fast-Moving Materials
              </h3>
            </div>
            <span className="text-xs text-slate-400">High Turnover</span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
            {fastMovingMaterials.map(mat => (
              <div
                key={mat.materialId}
                className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between hover:border-slate-600 transition-colors"
              >
                <div>
                  <div className="font-semibold text-white text-xs">{mat.materialName}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {mat.materialCode} • {mat.issuesCount} Requisitions
                  </div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-1 font-semibold">
                    {mat.totalIssuedQuantity.toLocaleString()} {mat.unit} issued
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    mat.velocityRank === 1 || mat.velocityRank === 'A_HIGH'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {mat.velocityRank === 1 || mat.velocityRank === 'A_HIGH' ? 'Grade A' : 'Grade B'}
                  </span>
                  <div className="text-xs font-mono text-slate-300 mt-1.5">
                    {formatLKR(mat.totalIssuedValue || mat.totalValueIssued)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slow-Moving & Dormant Materials (1 Col) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Slow-Moving Stock
              </h3>
            </div>
            <span className="text-xs text-purple-400 font-mono font-semibold">
              Tied: {formatLKR(dashboardMetrics.slowMovingValue)}
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
            {slowMovingMaterials.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No stagnant or obsolete materials found!
              </div>
            ) : (
              slowMovingMaterials.map(mat => (
                <div
                  key={mat.materialId}
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between hover:border-slate-600 transition-colors"
                >
                  <div>
                    <div className="font-semibold text-white text-xs">{mat.materialName}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {mat.materialCode} • {mat.currentStock} {mat.unit} on hand
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Inactive for <span className="text-amber-400 font-bold">{mat.daysSinceLastIssue} days</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      mat.status === 'OBSOLETE'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : mat.status === 'DORMANT'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {mat.status}
                    </span>
                    <div className="text-xs font-mono text-slate-300 mt-1.5">
                      {formatLKR(mat.tiedUpValue)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
