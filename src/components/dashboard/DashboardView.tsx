import React, { useState, useMemo } from 'react';
import {
  Truck,
  Navigation,
  Fuel,
  Wrench,
  ArrowRightLeft,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingUp,
  ShieldAlert,
  ChevronRight,
  PlusCircle,
  FileSpreadsheet,
  BarChart3,
  Sparkles,
  Gauge,
  RefreshCw,
  Trash2,
  X,
  ShieldCheck,
  Shield,
  Radio,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { useFleet } from '../../context/FleetContext';
import { formatCurrency, formatDate, calculateServiceStatus } from '../../utils/helpers';
import { ActiveTab } from '../common/BottomNav';
import { VehicleTransfer } from '../../types';
import { FleetKPICards } from './FleetKPICards';

export { FleetKPICards };

interface DashboardViewProps {
  onNavigateTab?: (tab: ActiveTab) => void;
  onNavigate?: (tab: ActiveTab) => void;
  onOpenNewTrip?: () => void;
  onOpenTrip?: () => void;
  onOpenNewFuel?: () => void;
  onOpenFuel?: () => void;
  onOpenNewTransfer?: () => void;
  onOpenTransfer?: () => void;
  onOpenNewService?: () => void;
  onViewTransferDetails?: (transfer: VehicleTransfer) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onNavigate,
  onOpenNewTrip,
  onOpenTrip,
  onOpenNewFuel,
  onOpenFuel,
  onOpenNewTransfer,
  onOpenTransfer,
  onOpenNewService,
  onViewTransferDetails
}) => {
  const handleNavigate = onNavigateTab || onNavigate || (() => {});
  const handleTrip = onOpenNewTrip || onOpenTrip || (() => {});
  const handleFuel = onOpenNewFuel || onOpenFuel || (() => {});
  const handleTransfer = onOpenNewTransfer || onOpenTransfer || (() => {});
  const handleService = onOpenNewService || (() => handleNavigate('maintenance'));
  const {
    vehicles,
    drivers,
    runningCharts,
    fuelRecords,
    serviceSchedules,
    transfers,
    selectedVehicleId,
    activeVehicle,
    resetToSampleData,
    clearAllData,
    isAdmin,
    verifyAdminPin,
    getVehicleTelemetry
  } = useFleet();

  const [showDashboardResetModal, setShowDashboardResetModal] = useState(false);
  const [showDashboardClearModal, setShowDashboardClearModal] = useState(false);
  const [resetSuccessToast, setResetSuccessToast] = useState<string | null>(null);

  // Admin PIN checking state in dashboard modals
  const [adminPinInput, setAdminPinInput] = useState('');
  const [showPinText, setShowPinText] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const handleDashboardReset = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPinError(null);

    if (!isAdmin) {
      if (!adminPinInput.trim()) {
        setPinError('Please enter the master Admin PIN to authorize data reset.');
        return;
      }
      if (!verifyAdminPin(adminPinInput.trim())) {
        setPinError('Invalid Admin PIN. Only authorized fleet administrators can reset data.');
        return;
      }
    }

    resetToSampleData();
    setShowDashboardResetModal(false);
    setAdminPinInput('');
    setPinError(null);
    setResetSuccessToast('Sample data reset successfully! All vehicles, drivers, 30-day trips, fuel records, and schedules restored.');
    setTimeout(() => {
      setResetSuccessToast(null);
    }, 4500);
  };

  const handleDashboardClear = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPinError(null);

    if (!isAdmin) {
      if (!adminPinInput.trim()) {
        setPinError('Please enter the master Admin PIN to authorize clearing all fleet data.');
        return;
      }
      if (!verifyAdminPin(adminPinInput.trim())) {
        setPinError('Invalid Admin PIN. Only authorized fleet administrators can clear data.');
        return;
      }
    }

    clearAllData();
    setShowDashboardClearModal(false);
    setAdminPinInput('');
    setPinError(null);
    setResetSuccessToast('All fleet records cleared! You can now register your new vehicles and drivers.');
    setTimeout(() => {
      setResetSuccessToast(null);
    }, 4500);
  };

  // Filtered dataset according to active vehicle selection
  const filteredRunningCharts = selectedVehicleId === 'all'
    ? runningCharts
    : runningCharts.filter(rc => rc.vehicleId === selectedVehicleId);

  const filteredFuelRecords = selectedVehicleId === 'all'
    ? fuelRecords
    : fuelRecords.filter(f => f.vehicleId === selectedVehicleId);

  const filteredSchedules = selectedVehicleId === 'all'
    ? serviceSchedules
    : serviceSchedules.filter(s => s.vehicleId === selectedVehicleId);

  const filteredTransfers = selectedVehicleId === 'all'
    ? transfers
    : transfers.filter(t => t.vehicleId === selectedVehicleId);

  // Computations
  const totalTripDistanceKm = filteredRunningCharts.reduce((sum, rc) => sum + (rc.distanceKm || 0), 0);
  const totalFuelCost = filteredFuelRecords.reduce((sum, f) => sum + (f.totalCost || 0), 0);
  const totalFuelLiters = filteredFuelRecords.reduce((sum, f) => sum + (f.liters || 0), 0);

  // Overdue and Due soon reminders calculation
  const calculatedReminders = filteredSchedules.map(schedule => {
    const veh = vehicles.find(v => v.id === schedule.vehicleId);
    const currentOdo = veh?.currentOdometerKm || schedule.lastServiceOdometerKm;
    const evaluation = calculateServiceStatus(schedule, currentOdo);
    return {
      schedule,
      vehicle: veh,
      ...evaluation
    };
  });

  const overdueReminders = calculatedReminders.filter(r => r.status === 'overdue');
  const dueSoonReminders = calculatedReminders.filter(r => r.status === 'due-soon');

  // Driver details helper
  const getDriver = (driverId?: string) => drivers.find(d => d.id === driverId);
  const getVehicle = (vehicleId: string) => vehicles.find(v => v.id === vehicleId);

  // Active vehicle count
  const activeVehiclesCount = useMemo(() => {
    return vehicles.filter(v => v.status === 'active').length;
  }, [vehicles]);

  // Monthly Fuel Metrics Computation (Current Month / 30-day window)
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const monthlyFuelRecords = useMemo(() => {
    const matchingMonth = filteredFuelRecords.filter(f => f.date && f.date.startsWith(currentMonthPrefix));
    if (matchingMonth.length > 0) return matchingMonth;
    // Fallback to the latest month present in the dataset (e.g. 2026-08)
    const latestMonth = filteredFuelRecords.length > 0 && filteredFuelRecords[0].date
      ? filteredFuelRecords[0].date.slice(0, 7)
      : '2026-08';
    return filteredFuelRecords.filter(f => f.date && f.date.startsWith(latestMonth));
  }, [filteredFuelRecords, currentMonthPrefix]);

  const monthlyFuelLiters = useMemo(() => {
    return monthlyFuelRecords.reduce((sum, f) => sum + (f.liters || 0), 0);
  }, [monthlyFuelRecords]);

  const monthlyFuelCost = useMemo(() => {
    return monthlyFuelRecords.reduce((sum, f) => sum + (f.totalCost || 0), 0);
  }, [monthlyFuelRecords]);

  const pendingMaintenanceAlertsCount = overdueReminders.length + dueSoonReminders.length;

  // 30-day Mini Trend dataset for Recharts preview widget
  const thirtyDayTrendData = useMemo(() => {
    const dates: string[] = [];
    const baseDate = new Date('2026-08-27');
    for (let i = 29; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    return dates.map(dateStr => {
      const trips = filteredRunningCharts.filter(rc => rc.date === dateStr);
      const fuel = filteredFuelRecords.filter(f => f.date === dateStr);
      const distance = trips.reduce((sum, t) => sum + (t.distanceKm || 0), 0);
      const liters = fuel.reduce((sum, f) => sum + (f.liters || 0), 0);
      const dObj = new Date(dateStr);
      const label = dObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

      return {
        date: dateStr,
        label,
        distance,
        fuelLiters: Math.round(liters * 10) / 10
      };
    });
  }, [filteredRunningCharts, filteredFuelRecords]);

  return (
    <div className="space-y-4 pb-20 pt-1">
      {/* Fleet KPI Summary Cards with Entrance Animations */}
      <FleetKPICards
        activeVehiclesCount={activeVehiclesCount}
        totalVehiclesCount={vehicles.length}
        monthlyFuelLiters={monthlyFuelLiters}
        monthlyFuelCost={monthlyFuelCost}
        pendingMaintenanceCount={pendingMaintenanceAlertsCount}
        overdueCount={overdueReminders.length}
        dueSoonCount={dueSoonReminders.length}
        onNavigate={handleNavigate}
      />

      {/* Alert Header if any service is overdue */}
      {overdueReminders.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              Critical Service Reminders ({overdueReminders.length})
            </h2>
            <p className="text-xs text-rose-200 mt-0.5">
              {overdueReminders[0]?.schedule.serviceType} for{' '}
              <span className="font-semibold text-white">
                {overdueReminders[0]?.vehicle?.registrationNumber}
              </span>{' '}
              is {overdueReminders[0]?.reason}.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => handleNavigate('maintenance')}
                className="text-[11px] font-semibold bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
              >
                <span>View Service Center</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Vehicle Spotlight or Fleet Overview Card */}
      {activeVehicle ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  {activeVehicle.type} • {activeVehicle.fuelType}
                </span>
                {activeVehicle.gpsDeviceId ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    GPS Active ({getVehicleTelemetry(activeVehicle.id)?.speedKmh ?? 0} km/h)
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-full">
                    GPS Unpaired
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-1 truncate">
                {activeVehicle.registrationNumber}
              </h2>
              <p className="text-xs text-slate-300">
                {activeVehicle.make} {activeVehicle.model} ({activeVehicle.year})
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Odometer</span>
              <p className="text-base font-extrabold text-blue-400">
                {activeVehicle.currentOdometerKm.toLocaleString()} <span className="text-xs text-slate-400 font-normal">km</span>
              </p>
              {activeVehicle.gpsDeviceId && (
                <span className="text-[9px] text-emerald-400 font-mono block mt-0.5">
                  Protrack Sync Active
                </span>
              )}
            </div>
          </div>

          {/* Current Driver Assigned & Department */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center font-bold text-[10px]">
                {getDriver(activeVehicle.currentDriverId)?.name.charAt(0) || '?'}
              </div>
              <div className="truncate">
                <p className="font-semibold text-slate-200 truncate">
                  {getDriver(activeVehicle.currentDriverId)?.name || 'Unassigned'}
                </p>
                <p className="text-[10px] text-slate-400">{activeVehicle.department}</p>
              </div>
            </div>

            <button
              onClick={handleTransfer}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>Transfer Driver</span>
            </button>
          </div>
        </div>
      ) : (
        /* Fleet Overall Header */
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-blue-400">Company Fleet Status</p>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                {vehicles.length} Vehicles Registered
              </h2>
            </div>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 font-semibold px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Operational
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-700/60 text-center">
            <div>
              <p className="text-[10px] text-slate-400">Active Drivers</p>
              <p className="text-sm font-bold text-slate-100">{drivers.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Trip Logs</p>
              <p className="text-sm font-bold text-slate-100">{runningCharts.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Transfers Done</p>
              <p className="text-sm font-bold text-slate-100">{transfers.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Matrix */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={handleTrip}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 transition-all text-center group"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-1.5 shadow group-hover:scale-105 transition-transform">
            <Navigation className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-200">Log Trip</span>
          <span className="text-[9px] text-slate-400">Running Chart</span>
        </button>

        <button
          onClick={handleFuel}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 transition-all text-center group"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-1.5 shadow group-hover:scale-105 transition-transform">
            <Fuel className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-200">Add Fuel</span>
          <span className="text-[9px] text-slate-400">Fill-up log</span>
        </button>

        <button
          onClick={handleTransfer}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 transition-all text-center group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-1.5 shadow group-hover:scale-105 transition-transform">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-200">Transfer</span>
          <span className="text-[9px] text-slate-400">Driver Handover</span>
        </button>

        <button
          onClick={() => handleNavigate('gps')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 transition-all text-center group"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-1.5 shadow group-hover:scale-105 transition-transform">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-[11px] font-semibold text-slate-200">GPS Live</span>
          <span className="text-[9px] text-slate-400">Protrack 365</span>
        </button>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-semibold">Total Mileage</span>
            <Navigation className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-base font-bold text-white">
            {totalTripDistanceKm.toLocaleString()} <span className="text-xs text-slate-400 font-normal">km</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{filteredRunningCharts.length} completed trips</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-semibold">Fuel Spent</span>
            <Fuel className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-base font-bold text-white">
            {formatCurrency(totalFuelCost)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{totalFuelLiters.toFixed(1)} L pumped</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-semibold">Service Health</span>
            <Wrench className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-base font-bold text-white">
              {overdueReminders.length === 0 ? 'Optimal' : `${overdueReminders.length} Due`}
            </p>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {dueSoonReminders.length} service(s) upcoming
          </p>
        </div>
      </div>

      {/* 30-Day Fuel Consumption & Fleet Utilization Recharts Widget */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>30-Day Fuel & Utilization Trends</span>
                <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-semibold border border-blue-500/30">
                  Recharts
                </span>
              </h3>
            </div>
          </div>

          <button
            onClick={() => handleNavigate('analytics')}
            className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg border border-blue-500/20 transition-colors"
          >
            <span>Full Analytics</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="h-44 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={thirtyDayTrendData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                interval={4}
              />
              <YAxis
                yAxisId="km"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={val => `${val}km`}
              />
              <YAxis
                yAxisId="l"
                orientation="right"
                stroke="#f59e0b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={val => `${val}L`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '11px' }}
                formatter={(value: any, name: any) => [
                  name === 'Daily Distance' ? `${value} km` : `${value} Liters`,
                  name
                ]}
              />
              <Bar
                yAxisId="l"
                dataKey="fuelLiters"
                name="Fuel Pumped (L)"
                fill="#f59e0b"
                opacity={0.85}
                radius={[3, 3, 0, 0]}
                maxBarSize={16}
              />
              <Line
                yAxisId="km"
                type="monotone"
                dataKey="distance"
                name="Daily Distance"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 2, fill: '#3b82f6' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
              <span className="text-slate-300">Distance (km)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              <span className="text-slate-300">Fuel (Liters)</span>
            </span>
          </div>

          <button
            onClick={() => handleNavigate('analytics')}
            className="text-slate-300 hover:text-white font-medium flex items-center gap-1"
          >
            <span>View 30D Breakdown</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Automated Service Reminders Widget */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Automated Service Reminders
            </h3>
          </div>
          <button
            onClick={() => handleNavigate('maintenance')}
            className="text-[11px] font-medium text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
          >
            <span>All Schedules</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {calculatedReminders.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">No active maintenance schedules configured.</p>
        ) : (
          <div className="space-y-2">
            {calculatedReminders.slice(0, 3).map(({ schedule, vehicle, status, reason, kmRemaining }) => {
              const isOverdue = status === 'overdue';
              const isDueSoon = status === 'due-soon';

              return (
                <div
                  key={schedule.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                    isOverdue
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : isDueSoon
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-slate-800/60 border-slate-700/60'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-slate-100 truncate">
                        {schedule.serviceType}
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                        {vehicle?.registrationNumber}
                      </span>
                    </div>
                    <p className={`text-[11px] mt-0.5 font-medium ${
                      isOverdue ? 'text-rose-300' : isDueSoon ? 'text-amber-300' : 'text-slate-400'
                    }`}>
                      {reason} (Trigger: {schedule.nextDueOdometerKm.toLocaleString()} km / {formatDate(schedule.nextDueDate)})
                    </p>
                  </div>

                  <button
                    onClick={() => handleNavigate('maintenance')}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ${
                      isOverdue
                        ? 'bg-rose-600 text-white'
                        : isDueSoon
                        ? 'bg-amber-500 text-slate-900'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isOverdue ? 'Overdue' : isDueSoon ? 'Due Soon' : 'Healthy'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Driver-to-Driver Transfers & Initial Inspection Records Widget */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Recent Vehicle Transfers & Handover Records
            </h3>
          </div>
          <button
            onClick={() => handleNavigate('transfers')}
            className="text-[11px] font-medium text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
          >
            <span>View All ({transfers.length})</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {filteredTransfers.length === 0 ? (
          <div className="text-center py-4 bg-slate-800/40 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-400">No driver transfer records found.</p>
            <button
              onClick={handleTransfer}
              className="mt-2 text-xs font-semibold text-emerald-400 hover:underline"
            >
              + Record Vehicle Transfer
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTransfers.slice(0, 2).map(transfer => {
              const vehicle = getVehicle(transfer.vehicleId);
              const fromDriver = getDriver(transfer.fromDriverId);
              const toDriver = getDriver(transfer.toDriverId);

              return (
                <div
                  key={transfer.id}
                  onClick={() => onViewTransferDetails ? onViewTransferDetails(transfer) : handleNavigate('transfers')}
                  className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-white">
                      {vehicle?.registrationNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(transfer.transferDate)}
                    </span>
                  </div>

                  {/* Transfer Driver Flow */}
                  <div className="mt-2 flex items-center justify-between bg-slate-900/60 p-2 rounded-lg text-xs">
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400">Releasing Driver</p>
                      <p className="font-semibold text-slate-200 truncate">{fromDriver?.name || 'Previous Driver'}</p>
                    </div>
                    <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mx-2" />
                    <div className="min-w-0 text-right">
                      <p className="text-[10px] text-slate-400">Receiving Driver</p>
                      <p className="font-semibold text-emerald-400 truncate">{toDriver?.name || 'New Driver'}</p>
                    </div>
                  </div>

                  {/* Initial Condition Summary at Handover Time */}
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300">
                    <div>
                      <span className="text-slate-400">Odometer at transfer: </span>
                      <span className="font-semibold text-blue-400">{transfer.odometerAtTransferKm.toLocaleString()} km</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Fuel: </span>
                      <span className="font-semibold text-amber-400">{transfer.fuelLevelPercent}%</span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-400 underline">
                      View Initial Record →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Running Chart Trips */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Navigation className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Recent Running Chart Entries
            </h3>
          </div>
          <button
            onClick={() => handleNavigate('runningChart')}
            className="text-[11px] font-medium text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
          >
            <span>View All ({filteredRunningCharts.length})</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {filteredRunningCharts.length === 0 ? (
          <div className="text-center py-4 bg-slate-800/40 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-400">No trip logs recorded yet.</p>
            <button
              onClick={handleTrip}
              className="mt-2 text-xs font-semibold text-blue-400 hover:underline"
            >
              + Record Running Chart Trip
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRunningCharts.slice(0, 3).map(trip => {
              const veh = getVehicle(trip.vehicleId);
              const drv = getDriver(trip.driverId);

              return (
                <div
                  key={trip.id}
                  className="p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-white">{veh?.registrationNumber}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                        {drv?.name}
                      </span>
                    </div>
                    <span className="text-blue-400 font-bold">
                      +{trip.distanceKm} km
                    </span>
                  </div>

                  <p className="text-slate-300 font-medium truncate">{trip.purpose}</p>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate">
                    <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                    <span className="truncate">{trip.startLocation} → {trip.endLocation}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/40">
                    <span>Odo: {trip.startOdometerKm.toLocaleString()} → {trip.endOdometerKm.toLocaleString()} km</span>
                    <span>{formatDate(trip.date)} ({trip.startTime} - {trip.endTime})</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Reset & Clear Sample Dataset Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white">Fleet Data Controls</h4>
              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                isAdmin
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}>
                <Lock className="w-2.5 h-2.5" />
                <span>Admin Protected</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Clear previous history for a fresh start or restore the sample company fleet (Admin PIN required)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => {
              setPinError(null);
              setAdminPinInput('');
              setShowDashboardClearModal(true);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Clear History & Start Fresh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPinError(null);
              setAdminPinInput('');
              setShowDashboardResetModal(true);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-500/40 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Sample Records</span>
          </button>
        </div>
      </div>

      {/* Dashboard Reset Success Toast */}
      {resetSuccessToast && (
        <div className="fixed top-16 right-4 left-4 sm:left-auto sm:w-96 z-50 bg-slate-900 border border-emerald-500/40 rounded-2xl p-3 shadow-2xl flex items-start gap-2.5 text-xs text-white">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-emerald-400">System Notification</p>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">{resetSuccessToast}</p>
          </div>
          <button
            onClick={() => setResetSuccessToast(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dashboard Reset Confirmation Modal */}
      {showDashboardResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>Reset Sample Fleet Data</span>
                  <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                    Admin Only
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Restore factory sample data across all modules</p>
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="font-medium text-slate-200">
                This operation will overwrite custom edits and restore:
              </p>
              <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                <li><strong className="text-slate-300">6 Vehicles:</strong> Toyota Hilux, Axio Hybrid, KDH Van, Every, L200, Elf</li>
                <li><strong className="text-slate-300">5 Drivers:</strong> Sunil, Kasun, Rizwan, Anura, Dinesh</li>
                <li><strong className="text-slate-300">30-Day Trips:</strong> Full running chart daily records</li>
                <li><strong className="text-slate-300">30-Day Fuel:</strong> Refill logs with station breakdowns & km/L</li>
                <li><strong className="text-slate-300">Service Reminders:</strong> Automated odometer & calendar schedules</li>
                <li><strong className="text-slate-300">Transfers:</strong> Handover checklists & inspection records</li>
              </ul>
            </div>

            {/* Admin Verification */}
            {isAdmin ? (
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-white text-[11px]">Administrator Authorization Confirmed</p>
                  <p className="text-[10px] text-slate-300">You are in Admin Mode. Click Authorize to proceed.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Enter Admin Security PIN</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Default: 1234</span>
                </div>
                <div className="relative">
                  <input
                    type={showPinText ? 'text' : 'password'}
                    value={adminPinInput}
                    onChange={(e) => {
                      setAdminPinInput(e.target.value);
                      setPinError(null);
                    }}
                    placeholder="Enter Admin PIN"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden tracking-wider"
                    maxLength={12}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinText(!showPinText)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPinText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {pinError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-2.5 text-xs text-red-400 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{pinError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowDashboardResetModal(false);
                  setPinError(null);
                  setAdminPinInput('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDashboardReset}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Authorize & Reset Sample Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Clear All Data Confirmation Modal */}
      {showDashboardClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>Clear All Fleet History?</span>
                  <span className="text-[10px] font-bold uppercase bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded border border-red-500/30">
                    Admin Only
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Start with a completely blank system</p>
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="font-medium text-slate-200">
                This will delete all previous sample and recorded data:
              </p>
              <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                <li>Remove all vehicle and driver profiles</li>
                <li>Erase all previous trip running charts & odometer history</li>
                <li>Clear all fuel log records & expenditure tracking</li>
                <li>Clear maintenance schedules & service logs</li>
              </ul>
              <p className="text-[11px] text-amber-400/90 font-medium pt-1">
                You can register your new company vehicles and drivers immediately after.
              </p>
            </div>

            {/* Admin Verification */}
            {isAdmin ? (
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-white text-[11px]">Administrator Authorization Confirmed</p>
                  <p className="text-[10px] text-slate-300">You are in Admin Mode. Click Authorize to proceed.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-red-400" />
                    <span>Enter Admin Security PIN</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Default: 1234</span>
                </div>
                <div className="relative">
                  <input
                    type={showPinText ? 'text' : 'password'}
                    value={adminPinInput}
                    onChange={(e) => {
                      setAdminPinInput(e.target.value);
                      setPinError(null);
                    }}
                    placeholder="Enter Admin PIN"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-1 focus:ring-red-500 focus:outline-hidden tracking-wider"
                    maxLength={12}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinText(!showPinText)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPinText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {pinError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-2.5 text-xs text-red-400 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{pinError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowDashboardClearModal(false);
                  setPinError(null);
                  setAdminPinInput('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDashboardClear}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Authorize & Clear All History</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
