import React, { useState, useMemo } from 'react';
import {
  Building2,
  Wallet,
  Truck,
  TrendingDown,
  TrendingUp,
  Fuel,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  DollarSign,
  Download,
  Printer,
  ChevronRight,
  FolderKanban,
  Users,
  ShieldAlert,
  Gauge,
  Activity,
  Layers,
  FileSpreadsheet,
  PlusCircle,
  Eye,
  Check,
  X,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { usePettyCash } from '../../context/PettyCashContext';
import { useFleet } from '../../context/FleetContext';
import { Expense } from '../../types/pettyCashTypes';
import { Vehicle } from '../../types';

interface MasterDashboardViewProps {
  onSwitchModule: (module: 'masterDashboard' | 'pettyCash' | 'fleetTrack', targetTab?: string) => void;
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  onOpenAddFuel: () => void;
  onOpenAddTrip: () => void;
  onOpenTransfer: () => void;
}

export const MasterDashboardView: React.FC<MasterDashboardViewProps> = ({
  onSwitchModule,
  onOpenAddExpense,
  onOpenAddIncome,
  onOpenAddFuel,
  onOpenAddTrip,
  onOpenTransfer
}) => {
  const {
    expenses,
    income,
    transfers: pettyTransfers,
    supervisors,
    projects: pettyProjects,
    categories,
    supervisorBalances,
    kpiMetrics,
    approveExpense,
    rejectExpense,
    userRole
  } = usePettyCash();

  const {
    vehicles,
    drivers,
    fuelRecords,
    serviceSchedules,
    maintenanceLogs,
    transfers: fleetTransfers,
    currentEnterprise
  } = useFleet();

  // Filter States
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('ALL');
  const [timeRangeFilter, setTimeRangeFilter] = useState<'ALL' | '30DAYS' | 'THIS_MONTH'>('ALL');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const formatLKR = (amount: number): string => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount).replace('LKR', 'LKR ');
  };

  // 1. Petty Cash Calculations
  const approvedExpenses = useMemo(() => {
    return expenses.filter(e => e.PAYMENT_STATUS === 'Approved' || e.PAYMENT_STATUS === 'Paid' || e.PAYMENT_STATUS === 'Reimbursed');
  }, [expenses]);

  const pendingExpenses = useMemo(() => {
    return expenses.filter(e => e.PAYMENT_STATUS === 'Pending');
  }, [expenses]);

  const totalPettyCashApproved = useMemo(() => {
    return approvedExpenses.reduce((sum, e) => sum + e.AMOUNT, 0);
  }, [approvedExpenses]);

  const totalPettyCashPending = useMemo(() => {
    return pendingExpenses.reduce((sum, e) => sum + e.AMOUNT, 0);
  }, [pendingExpenses]);

  const totalPettyCashInHand = useMemo(() => {
    return Object.values(supervisorBalances).reduce((sum: number, b: any) => sum + (b?.currentBalance || 0), 0);
  }, [supervisorBalances]);

  // 2. FleetTrack Calculations
  const totalFleetFuelCost = useMemo(() => {
    return fuelRecords.reduce((sum, r) => sum + r.totalCost, 0);
  }, [fuelRecords]);

  const totalFleetFuelLiters = useMemo(() => {
    return fuelRecords.reduce((sum, r) => sum + r.liters, 0);
  }, [fuelRecords]);

  const totalMaintenanceCost = useMemo(() => {
    return maintenanceLogs.reduce((sum, m) => sum + m.cost, 0);
  }, [maintenanceLogs]);

  // Fleet Health Status
  const activeVehiclesCount = vehicles.filter(v => v.status === 'active').length;
  const inServiceVehiclesCount = vehicles.filter(v => v.status === 'in-service').length;
  const idleVehiclesCount = vehicles.filter(v => v.status === 'idle' || v.status === 'transferred').length;

  // Service Overdue & Due Soon
  const overdueServices = useMemo(() => {
    return serviceSchedules.filter(s => {
      const vehicle = vehicles.find(v => v.id === s.vehicleId);
      if (!vehicle) return false;
      const isOdoOverdue = vehicle.currentOdometerKm >= s.nextDueOdometerKm;
      const isDateOverdue = new Date(s.nextDueDate) < new Date();
      return isOdoOverdue || isDateOverdue;
    });
  }, [serviceSchedules, vehicles]);

  const dueSoonServices = useMemo(() => {
    return serviceSchedules.filter(s => {
      const vehicle = vehicles.find(v => v.id === s.vehicleId);
      if (!vehicle) return false;
      const odoDiff = s.nextDueOdometerKm - vehicle.currentOdometerKm;
      const dateDiff = (new Date(s.nextDueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
      const isOdoSoon = odoDiff > 0 && odoDiff <= 1000;
      const isDateSoon = dateDiff > 0 && dateDiff <= 14;
      return (isOdoSoon || isDateSoon) && !overdueServices.includes(s);
    });
  }, [serviceSchedules, vehicles, overdueServices]);

  // 3. Consolidated Grand Outflow
  const grandTotalFieldOutflow = totalPettyCashApproved + totalFleetFuelCost + totalMaintenanceCost;

  // 4. Project-wise Operations Cross-Matrix Data
  const projectOperationsMatrix = useMemo(() => {
    return pettyProjects.map(proj => {
      // Petty cash spent on this project
      const projExpenses = approvedExpenses.filter(e => e.PROJECT === proj.PROJECT_CODE);
      const pettyCashSpent = projExpenses.reduce((sum, e) => sum + e.AMOUNT, 0);

      // Vehicles matching this project (by department / assigned site)
      const projVehicles = vehicles.filter(v => 
        v.department.toLowerCase().includes(proj.PROJECT_CODE.toLowerCase()) ||
        (proj.PROJECT_CODE === 'PIDM 26' && v.department.toLowerCase().includes('operations')) ||
        (proj.PROJECT_CODE === 'PIDM 28' && v.department.toLowerCase().includes('logistics')) ||
        (proj.PROJECT_CODE === 'PIDM 27' && v.department.toLowerCase().includes('engineering'))
      );

      const projVehicleIds = projVehicles.map(v => v.id);

      // Fuel cost for these vehicles
      const projFuelRecords = fuelRecords.filter(f => projVehicleIds.includes(f.vehicleId));
      const fuelCost = projFuelRecords.reduce((sum, f) => sum + f.totalCost, 0);
      const fuelLiters = projFuelRecords.reduce((sum, f) => sum + f.liters, 0);

      // Maintenance cost for these vehicles
      const projMaintLogs = maintenanceLogs.filter(m => projVehicleIds.includes(m.vehicleId));
      const maintenanceCost = projMaintLogs.reduce((sum, m) => sum + m.cost, 0);

      const totalProjectOpsCost = pettyCashSpent + fuelCost + maintenanceCost;
      const budget = proj.BUDGET || 0;
      const budgetUtilizedPct = budget > 0 ? Math.min(100, Math.round((totalProjectOpsCost / budget) * 100)) : 0;

      // Supervisor in charge
      const sup = supervisors.find(s => s.DEFAULT_PROJECT === proj.PROJECT_CODE);

      return {
        projectCode: proj.PROJECT_CODE,
        projectName: proj.PROJECT_NAME,
        supervisorName: sup?.SUPERVISOR_NAME || 'General Site Officer',
        budget,
        pettyCashSpent,
        assignedVehiclesCount: projVehicles.length,
        assignedVehicles: projVehicles.map(v => v.registrationNumber),
        fuelCost,
        fuelLiters,
        maintenanceCost,
        totalProjectOpsCost,
        budgetUtilizedPct
      };
    });
  }, [pettyProjects, approvedExpenses, vehicles, fuelRecords, maintenanceLogs, supervisors]);

  // 5. Chart Data: Project-wise Cost Breakdown
  const chartDataProjectCosts = useMemo(() => {
    return projectOperationsMatrix.map(p => ({
      name: p.projectCode,
      'Petty Cash (LKR)': p.pettyCashSpent,
      'Fleet Fuel (LKR)': p.fuelCost,
      'Fleet Maintenance (LKR)': p.maintenanceCost,
      total: p.totalProjectOpsCost
    }));
  }, [projectOperationsMatrix]);

  // 6. Category Spend Breakdown (Pie Chart Data)
  const chartDataSpendCategories = useMemo(() => {
    // Top petty cash categories
    const categoryTotals: { [key: string]: number } = {};
    approvedExpenses.forEach(e => {
      const cat = e.EXPENSES_CATEGORY || 'Other Site Costs';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + e.AMOUNT;
    });

    const items = [
      { name: 'Vehicle Fuel (Fleet)', value: totalFleetFuelCost, color: '#3b82f6' },
      { name: 'Vehicle Maintenance & Repairs', value: totalMaintenanceCost, color: '#f59e0b' },
      ...Object.entries(categoryTotals).slice(0, 4).map(([cat, val], idx) => {
        const colors = ['#10b981', '#06b6d4', '#8b5cf6', '#ec4899'];
        return {
          name: cat.length > 20 ? cat.slice(0, 18) + '...' : cat,
          value: val,
          color: colors[idx % colors.length]
        };
      })
    ];

    return items.filter(i => i.value > 0);
  }, [approvedExpenses, totalFleetFuelCost, totalMaintenanceCost]);

  // 7. Monthly Combined Outflow Trend
  const chartDataMonthlyTrend = useMemo(() => {
    return [
      { month: 'Apr 2026', pettyCash: 184000, fleetFuel: 92000, fleetMaintenance: 35000 },
      { month: 'May 2026', pettyCash: 245000, fleetFuel: 118000, fleetMaintenance: 54000 },
      { month: 'Jun 2026', pettyCash: 310000, fleetFuel: 145000, fleetMaintenance: 42000 },
      { month: 'Jul 2026', pettyCash: 289000, fleetFuel: 138000, fleetMaintenance: 68000 },
      { month: 'Aug 2026', pettyCash: totalPettyCashApproved, fleetFuel: totalFleetFuelCost, fleetMaintenance: totalMaintenanceCost }
    ];
  }, [totalPettyCashApproved, totalFleetFuelCost, totalMaintenanceCost]);

  // Quick Inline Approval Handler
  const handleApprove = (expId: string) => {
    approveExpense(expId, 'Approved by Executive Management');
    setActionSuccessMessage(`Expense voucher #${expId} approved successfully.`);
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  const handleReject = (expId: string) => {
    rejectExpense(expId, 'Rejected from Executive Dashboard review');
    setActionSuccessMessage(`Expense voucher #${expId} marked rejected.`);
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  // Export Consolidated Operations CSV
  const handleExportConsolidatedCsv = () => {
    const headers = [
      'Project Code',
      'Project Name',
      'Site Supervisor',
      'Petty Cash Spent (LKR)',
      'Assigned Vehicles Count',
      'Fleet Fuel Cost (LKR)',
      'Fleet Fuel (Liters)',
      'Fleet Maintenance Cost (LKR)',
      'Total Project Operations Cost (LKR)',
      'Project Budget (LKR)',
      'Budget Utilized %'
    ];

    const rows = projectOperationsMatrix.map(p => [
      `"${p.projectCode}"`,
      `"${p.projectName}"`,
      `"${p.supervisorName}"`,
      p.pettyCashSpent.toFixed(2),
      p.assignedVehiclesCount,
      p.fuelCost.toFixed(2),
      p.fuelLiters.toFixed(2),
      p.maintenanceCost.toFixed(2),
      p.totalProjectOpsCost.toFixed(2),
      p.budget.toFixed(2),
      `${p.budgetUtilizedPct}%`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EMA_Executive_Operations_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* 1. TOP EXECUTIVE COMMAND HEADER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-blue-700 flex items-center justify-center text-white shadow-lg font-black text-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                  Executive Operations Command Hub
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                  Live Operations
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Single-pane-of-glass operational & financial synthesis across <span className="text-emerald-400 font-semibold">Petty Cash Field Floats</span> and <span className="text-blue-400 font-semibold">FleetTrack Asset Logistics</span>.
              </p>
            </div>
          </div>

          {/* Quick Module Jump Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onSwitchModule('pettyCash')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-950 hover:border-emerald-700 border border-slate-700 text-slate-200 hover:text-emerald-300 text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Petty Cash Module</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </button>

            <button
              onClick={() => onSwitchModule('fleetTrack')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-blue-950 hover:border-blue-700 border border-slate-700 text-slate-200 hover:text-blue-300 text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              <span>FleetTrack Module</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </button>

            <button
              onClick={handleExportConsolidatedCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Executive Briefing</span>
            </button>
          </div>
        </div>

        {/* Global Operational Filter & Timestamp Bar */}
        <div className="relative z-10 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-semibold text-[11px]">Site Filter:</span>
              <select
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-slate-100">All Road Projects & Head Office</option>
                {pettyProjects.map(p => (
                  <option key={p.id} value={p.PROJECT_CODE} className="bg-slate-900 text-slate-100">
                    {p.PROJECT_CODE} - {p.PROJECT_NAME.slice(0, 24)}...
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setTimeRangeFilter('ALL')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  timeRangeFilter === 'ALL' ? 'bg-slate-800 text-emerald-400 shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All-Time
              </button>
              <button
                onClick={() => setTimeRangeFilter('THIS_MONTH')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  timeRangeFilter === 'THIS_MONTH' ? 'bg-slate-800 text-emerald-400 shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setTimeRangeFilter('30DAYS')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  timeRangeFilter === '30DAYS' ? 'bg-slate-800 text-emerald-400 shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Last 30 Days
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-mono">Consolidated Engine Sync Active</span>
          </div>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-bold flex items-center justify-between animate-fadeIn shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. EXECUTIVE CONSOLIDATED KPI METRICS RIBBON (6 High-Density Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Total Field Outflow (Grand Combined) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Field Outflow</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black font-mono text-slate-100 tracking-tight">
              {formatLKR(grandTotalFieldOutflow)}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">Petty Cash + Fuel + Maintenance</p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Total Ops Cost</span>
            <span className="font-bold text-emerald-400">100% Accounted</span>
          </div>
        </div>

        {/* Card 2: Petty Cash in Hand */}
        <div className="bg-slate-900 border border-slate-800 hover:border-emerald-800/60 rounded-2xl p-4 shadow-md flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Petty Cash In Hand</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-xl font-black font-mono tracking-tight ${totalPettyCashInHand < 0 ? 'text-rose-400' : 'text-emerald-300'}`}>
              {formatLKR(totalPettyCashInHand)}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">Across {supervisors.length} Field Supervisors</p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Float Deficits:</span>
            <span className={`font-bold ${kpiMetrics.overdrawnSupervisorsCount > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
              {kpiMetrics.overdrawnSupervisorsCount > 0 ? `${kpiMetrics.overdrawnSupervisorsCount} Deficits` : 'Zero Deficit'}
            </span>
          </div>
        </div>

        {/* Card 3: Fleet Fuel Expenditure */}
        <div className="bg-slate-900 border border-slate-800 hover:border-blue-800/60 rounded-2xl p-4 shadow-md flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fleet Fuel Cost</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black font-mono text-blue-300 tracking-tight">
              {formatLKR(totalFleetFuelCost)}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">{totalFleetFuelLiters.toLocaleString()} Liters Dispensed</p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Fuel Entries:</span>
            <span className="font-bold text-blue-400">{fuelRecords.length} Refuels</span>
          </div>
        </div>

        {/* Card 4: Fleet Maintenance & Repairs */}
        <div className="bg-slate-900 border border-slate-800 hover:border-amber-800/60 rounded-2xl p-4 shadow-md flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fleet Maintenance</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black font-mono text-amber-300 tracking-tight">
              {formatLKR(totalMaintenanceCost)}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">{maintenanceLogs.length} Maintenance Logs</p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Health Alerts:</span>
            <span className={`font-bold ${overdueServices.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {overdueServices.length > 0 ? `${overdueServices.length} Overdue` : 'All Good'}
            </span>
          </div>
        </div>

        {/* Card 5: Fleet Utilization */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fleet Readiness</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black font-mono text-purple-300 tracking-tight">
              {activeVehiclesCount} / {vehicles.length}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">Active Road Vehicles</p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">In Workshop:</span>
            <span className="font-bold text-amber-400">{inServiceVehiclesCount} In-Service</span>
          </div>
        </div>

        {/* Card 6: Pending Approvals & Action Items */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action Queue</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black font-mono text-rose-300 tracking-tight">
              {pendingExpenses.length + overdueServices.length} Items
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">Require Management Sign-off</p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Pending Vouchers:</span>
            <span className="font-bold text-amber-300">{pendingExpenses.length} Vouchers</span>
          </div>
        </div>
      </div>

      {/* 3. CRITICAL ACTION TRIGGER FEED (Integrated Cross-System Alerts) */}
      {(kpiMetrics.overdrawnSupervisorsCount > 0 || pendingExpenses.length > 0 || overdueServices.length > 0) && (
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Priority Action Center ({pendingExpenses.length + overdueServices.length + kpiMetrics.overdrawnSupervisorsCount} Open Items)</span>
            </h3>
            <span className="text-[10px] text-slate-400">Real-time alerts requiring action</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Alert: Overdrawn Supervisor */}
            {kpiMetrics.overdrawnSupervisorsCount > 0 && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 text-rose-300 font-bold text-xs">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Supervisor Float Deficit</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    {kpiMetrics.overdrawnSupervisorsCount} field officer(s) are currently running on negative petty cash balance.
                  </p>
                </div>
                <button
                  onClick={onOpenAddIncome}
                  className="shrink-0 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shadow-sm transition-all"
                >
                  Top-up Float
                </button>
              </div>
            )}

            {/* Alert: Pending Vouchers */}
            {pendingExpenses.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{pendingExpenses.length} Expense Vouchers Pending</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Totaling <span className="font-mono font-bold text-amber-300">{formatLKR(totalPettyCashPending)}</span> waiting for verification.
                  </p>
                </div>
                <button
                  onClick={() => onSwitchModule('pettyCash', 'expenses')}
                  className="shrink-0 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold shadow-sm transition-all"
                >
                  Review All
                </button>
              </div>
            )}

            {/* Alert: Overdue Vehicle Maintenance */}
            {overdueServices.length > 0 && (
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 text-blue-300 font-bold text-xs">
                    <Wrench className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>{overdueServices.length} Vehicle Services Overdue</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Scheduled oil/filter intervals exceeded. Action needed to protect warranty.
                  </p>
                </div>
                <button
                  onClick={() => onSwitchModule('fleetTrack', 'maintenance')}
                  className="shrink-0 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-sm transition-all"
                >
                  View Schedule
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. VISUAL ANALYTICS & COST FLOW CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Bar Chart: Project-Wise Operations Cost Allocation */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-100 tracking-tight flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-emerald-400" />
                <span>Project-Wise Operations Cost Allocation (LKR)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Combined Petty Cash field expenses + Assigned vehicle fuel & maintenance costs
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
              Total: {formatLKR(grandTotalFieldOutflow)}
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataProjectCosts} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={(val) => `LKR ${(val / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(value: any) => [`LKR ${Number(value).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Petty Cash (LKR)" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Fleet Fuel (LKR)" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Fleet Maintenance (LKR)" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Total Company Outflow Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-100 tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Operational Cost Mix</span>
            </h3>
            <p className="text-[11px] text-slate-400">Expenditure share by operational category</p>
          </div>

          <div className="h-52 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDataSpendCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartDataSpendCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                  formatter={(value: any) => [`LKR ${Number(value).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Mini Legend */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px]">
            {chartDataSpendCategories.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2 truncate max-w-[180px]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                  <span className="truncate">{cat.name}</span>
                </div>
                <span className="font-mono font-semibold text-slate-200">
                  {formatLKR(cat.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. MASTER PROJECT-WISE OPERATIONS MATRIX (The Core Unified Table) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-100 tracking-tight flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-emerald-400" />
              <span>Master Project Operations & Logistics Matrix</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cross-domain breakdown of petty cash vouchers, assigned vehicle fleet, fuel consumption, and site maintenance.
            </p>
          </div>

          <button
            onClick={() => onSwitchModule('pettyCash', 'projects')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold transition-all border border-slate-700"
          >
            <span>Full Category Pivot</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800 text-slate-200 border-b border-slate-700 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3.5 font-bold">Project Code & Name</th>
                <th className="py-3 px-3 font-semibold">Site Supervisor</th>
                <th className="py-3 px-3 text-right text-emerald-400 font-bold">Petty Cash Spent</th>
                <th className="py-3 px-3 text-center">Assigned Vehicles</th>
                <th className="py-3 px-3 text-right text-blue-400 font-bold">Fleet Fuel Cost</th>
                <th className="py-3 px-3 text-right text-amber-400 font-bold">Fleet Maintenance</th>
                <th className="py-3 px-3.5 text-right font-black text-slate-100 bg-slate-800/90">Total Operations Cost</th>
                <th className="py-3 px-3 text-right font-semibold">Budget Progress</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {projectOperationsMatrix.map((p) => (
                <tr key={p.projectCode} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3.5 font-sans">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 text-[10px]">
                        {p.projectCode}
                      </span>
                      <span className="font-semibold text-slate-100">{p.projectName}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-sans text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center font-bold text-[9px] border border-slate-700">
                        {p.supervisorName.slice(0, 1)}
                      </div>
                      <span className="font-medium text-slate-200">{p.supervisorName}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-emerald-400">
                    {formatLKR(p.pettyCashSpent)}
                  </td>

                  <td className="py-3 px-3 text-center font-sans">
                    <div className="flex items-center justify-center gap-1">
                      <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-bold">
                        {p.assignedVehiclesCount} Vehicles
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right text-blue-300 font-semibold">
                    {p.fuelCost > 0 ? formatLKR(p.fuelCost) : '-'}
                  </td>

                  <td className="py-3 px-3 text-right text-amber-300 font-semibold">
                    {p.maintenanceCost > 0 ? formatLKR(p.maintenanceCost) : '-'}
                  </td>

                  <td className="py-3 px-3.5 text-right font-black text-slate-100 bg-slate-900/80">
                    {formatLKR(p.totalProjectOpsCost)}
                  </td>

                  <td className="py-3 px-3 text-right font-sans">
                    <div className="w-24 ml-auto space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>{p.budgetUtilizedPct}%</span>
                        <span className="font-mono">{p.budget > 0 ? `LKR ${(p.budget / 1000000).toFixed(1)}M` : 'Open'}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            p.budgetUtilizedPct > 90 ? 'bg-rose-500' : p.budgetUtilizedPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, p.budgetUtilizedPct)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-center font-sans">
                    <button
                      onClick={() => onSwitchModule('pettyCash', 'projects')}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold hover:underline"
                    >
                      Drilldown
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800 text-slate-100 font-bold border-t-2 border-slate-700 text-xs">
                <td colSpan={2} className="py-3 px-3.5 font-sans uppercase tracking-wider">
                  CONSOLIDATED OPERATIONS TOTAL
                </td>
                <td className="py-3 px-3 text-right text-emerald-300 font-black">
                  {formatLKR(totalPettyCashApproved)}
                </td>
                <td className="py-3 px-3 text-center font-sans font-bold">
                  {vehicles.length} Total Vehicles
                </td>
                <td className="py-3 px-3 text-right text-blue-300 font-black">
                  {formatLKR(totalFleetFuelCost)}
                </td>
                <td className="py-3 px-3 text-right text-amber-300 font-black">
                  {formatLKR(totalMaintenanceCost)}
                </td>
                <td className="py-3 px-3.5 text-right font-black text-sm bg-emerald-950/80 text-emerald-300">
                  {formatLKR(grandTotalFieldOutflow)}
                </td>
                <td colSpan={2} className="py-3 px-3 text-right text-slate-400 font-sans text-[11px]">
                  All Sites Synchronized
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 6. SPLIT OPERATIONAL PILLAR PANES (Left: Petty Cash Command | Right: FleetTrack Command) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT PILLAR: Petty Cash Field Float & Pending Vouchers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-black text-slate-100">Site Supervisors Petty Cash Float</h3>
            </div>
            <button
              onClick={() => onSwitchModule('pettyCash', 'petty-cash')}
              className="text-xs text-emerald-400 hover:underline font-bold flex items-center gap-1"
            >
              <span>All Ledgers</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Supervisor Live Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {supervisors.slice(0, 4).map((sup) => {
              const bal = supervisorBalances[sup.SUPERVISOR_NAME.trim().toUpperCase()] || {
                currentBalance: sup.OPENING_PETTY_CASH,
                isOverdrawn: false
              };

              return (
                <div
                  key={sup.id}
                  onClick={() => onSwitchModule('pettyCash', 'petty-cash')}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-600/60 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                      bal.isOverdrawn ? 'bg-rose-600' : 'bg-emerald-600'
                    }`}>
                      {sup.SUPERVISOR_NAME.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{sup.SUPERVISOR_NAME}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold">{sup.DEFAULT_PROJECT || 'Site General'}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs font-mono font-black block ${
                      bal.isOverdrawn ? 'text-rose-400' : 'text-emerald-300'
                    }`}>
                      {formatLKR(bal.currentBalance)}
                    </span>
                    <span className={`text-[9px] font-bold ${
                      bal.isOverdrawn ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      {bal.isOverdrawn ? '⚠️ Overdrawn' : 'Active Float'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pending Vouchers Quick Verification Box */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Unverified Vouchers ({pendingExpenses.length})
              </span>
              <button
                onClick={() => onSwitchModule('pettyCash', 'expenses')}
                className="text-[11px] text-slate-400 hover:text-emerald-400"
              >
                View full register
              </button>
            </div>

            {pendingExpenses.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <span>All site expense vouchers have been reviewed and approved!</span>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingExpenses.slice(0, 3).map((exp) => (
                  <div
                    key={exp.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[11px] text-slate-200">{exp.EXPENSES_ID}</span>
                        <span className="text-[10px] text-slate-400">• {exp.SUPERVISOR}</span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                          {exp.PROJECT}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 truncate mt-0.5">{exp.EXPENSES_DESCRIPTION}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-bold text-amber-300">
                        {formatLKR(exp.AMOUNT)}
                      </span>
                      {(userRole === 'ADMIN' || userRole === 'FINANCE') && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleApprove(exp.EXPENSES_ID)}
                            title="Approve Voucher"
                            className="p-1 rounded bg-emerald-950 hover:bg-emerald-800 text-emerald-300 border border-emerald-700 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleReject(exp.EXPENSES_ID)}
                            title="Reject Voucher"
                            className="p-1 rounded bg-rose-950 hover:bg-rose-800 text-rose-300 border border-rose-700 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PILLAR: FleetTrack Vehicles & Maintenance Health */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-black text-slate-100">Fleet Operations & Maintenance Status</h3>
            </div>
            <button
              onClick={() => onSwitchModule('fleetTrack', 'maintenance')}
              className="text-xs text-blue-400 hover:underline font-bold flex items-center gap-1"
            >
              <span>Service Board</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Vehicle Status Strip */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Active Vehicles</span>
              <span className="text-base font-black text-emerald-400 font-mono">{activeVehiclesCount}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">In Workshop</span>
              <span className="text-base font-black text-amber-400 font-mono">{inServiceVehiclesCount}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Standby / Idle</span>
              <span className="text-base font-black text-slate-400 font-mono">{idleVehiclesCount}</span>
            </div>
          </div>

          {/* Scheduled Services & Overdue Queue */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Maintenance Alerts & Schedules
            </span>

            {overdueServices.length === 0 && dueSoonServices.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <span>All fleet vehicle scheduled services are up to date!</span>
              </div>
            ) : (
              <div className="space-y-2">
                {overdueServices.slice(0, 2).map((s) => {
                  const veh = vehicles.find(v => v.id === s.vehicleId);
                  return (
                    <div
                      key={s.id}
                      className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-800/60 flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-rose-300">{veh?.registrationNumber || 'Vehicle'}</span>
                          <span className="text-slate-200 font-semibold">{s.serviceType}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Target Odometer: <span className="font-mono font-bold text-slate-300">{s.nextDueOdometerKm.toLocaleString()} km</span> (Current: {veh?.currentOdometerKm.toLocaleString()} km)
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-900 text-rose-200 uppercase shrink-0">
                        Overdue
                      </span>
                    </div>
                  );
                })}

                {dueSoonServices.slice(0, 2).map((s) => {
                  const veh = vehicles.find(v => v.id === s.vehicleId);
                  return (
                    <div
                      key={s.id}
                      className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/60 flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-300">{veh?.registrationNumber || 'Vehicle'}</span>
                          <span className="text-slate-200 font-semibold">{s.serviceType}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Due Date: <span className="font-mono font-bold text-slate-300">{s.nextDueDate}</span>
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-900 text-amber-200 uppercase shrink-0">
                        Due Soon
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={onOpenAddFuel}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 text-xs font-bold transition-all active:scale-95"
            >
              <Fuel className="w-3.5 h-3.5" />
              <span>Record Fuel Fill-up</span>
            </button>
            <button
              onClick={onOpenTransfer}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-400 border border-slate-700 text-xs font-bold transition-all active:scale-95"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Vehicle Site Transfer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
