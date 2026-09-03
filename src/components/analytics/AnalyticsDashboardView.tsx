import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  Fuel,
  Navigation,
  Gauge,
  Calendar,
  Car,
  Users,
  Activity,
  Layers,
  ArrowUpRight,
  Zap,
  BarChart3,
  Download,
  Info,
  DollarSign,
  Percent,
  Clock,
  Sparkles
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { FuelRecord, RunningChartEntry } from '../../types';

type TimeRange = '7' | '14' | '30';
type ChartSection = 'all' | 'fuel' | 'utilization' | 'vehicles';

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4'  // cyan
];

export const AnalyticsDashboardView: React.FC = () => {
  const {
    vehicles,
    drivers,
    runningCharts,
    fuelRecords,
    selectedVehicleId,
    setSelectedVehicleId,
    activeVehicle
  } = useFleet();

  const [timeRange, setTimeRange] = useState<TimeRange>('30');
  const [activeSection, setActiveSection] = useState<ChartSection>('all');
  const [fuelMetricView, setFuelMetricView] = useState<'volume' | 'cost'>('volume');
  const [showTableModal, setShowTableModal] = useState(false);

  const daysCount = parseInt(timeRange, 10);

  // Compute reference end date (latest entry date or 2026-08-27)
  const endDate = useMemo(() => {
    let latestTimestamp = new Date('2026-08-27').getTime();
    runningCharts.forEach(rc => {
      const t = new Date(rc.date).getTime();
      if (!isNaN(t) && t > latestTimestamp) latestTimestamp = t;
    });
    fuelRecords.forEach(f => {
      const t = new Date(f.date).getTime();
      if (!isNaN(t) && t > latestTimestamp) latestTimestamp = t;
    });
    return new Date(latestTimestamp);
  }, [runningCharts, fuelRecords]);

  // Generate continuous daily date array for the selected time window
  const dateList = useMemo(() => {
    const dates: string[] = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, [endDate, daysCount]);

  // Filter records within the active time range & selected vehicle
  const filteredTrips = useMemo(() => {
    const minDateStr = dateList[0];
    const maxDateStr = dateList[dateList.length - 1];

    return runningCharts.filter(rc => {
      const inDate = rc.date >= minDateStr && rc.date <= maxDateStr;
      const inVehicle = selectedVehicleId === 'all' || rc.vehicleId === selectedVehicleId;
      return inDate && inVehicle;
    });
  }, [runningCharts, dateList, selectedVehicleId]);

  const filteredFuel = useMemo(() => {
    const minDateStr = dateList[0];
    const maxDateStr = dateList[dateList.length - 1];

    return fuelRecords.filter(f => {
      const inDate = f.date >= minDateStr && f.date <= maxDateStr;
      const inVehicle = selectedVehicleId === 'all' || f.vehicleId === selectedVehicleId;
      return inDate && inVehicle;
    });
  }, [fuelRecords, dateList, selectedVehicleId]);

  // 1. Daily Trend Data (Fuel liters, cost, distance km, active vehicle count)
  const dailyTrendsData = useMemo(() => {
    let cumulativeDistance = 0;
    let cumulativeFuelCost = 0;
    let cumulativeLiters = 0;

    return dateList.map(dateStr => {
      const dayTrips = filteredTrips.filter(t => t.date === dateStr);
      const dayFuel = filteredFuel.filter(f => f.date === dateStr);

      const distanceKm = dayTrips.reduce((sum, t) => sum + (t.distanceKm || 0), 0);
      const fuelLiters = dayFuel.reduce((sum, f) => sum + (f.liters || 0), 0);
      const fuelCost = dayFuel.reduce((sum, f) => sum + (f.totalCost || 0), 0);
      const tripCount = dayTrips.length;

      // Distinct active vehicles on this day
      const activeVehiclesToday = new Set(dayTrips.map(t => t.vehicleId)).size;

      cumulativeDistance += distanceKm;
      cumulativeFuelCost += fuelCost;
      cumulativeLiters += fuelLiters;

      // Format short label e.g. "Aug 15"
      const dateObj = new Date(dateStr);
      const label = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const dayOfWeek = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });

      // Build vehicle breakdown map for stacked charts
      const vehicleDistanceMap: Record<string, number> = {};
      vehicles.forEach(v => {
        const vTrips = dayTrips.filter(t => t.vehicleId === v.id);
        vehicleDistanceMap[v.registrationNumber] = vTrips.reduce((s, t) => s + (t.distanceKm || 0), 0);
      });

      return {
        date: dateStr,
        label,
        dayOfWeek,
        distanceKm,
        fuelLiters: Math.round(fuelLiters * 10) / 10,
        fuelCost,
        tripCount,
        activeVehiclesToday,
        cumulativeDistance,
        cumulativeFuelCost,
        cumulativeLiters: Math.round(cumulativeLiters * 10) / 10,
        ...vehicleDistanceMap
      };
    });
  }, [dateList, filteredTrips, filteredFuel, vehicles]);

  // 2. Fuel Efficiency (km/L) per Record / Fill-up
  const fuelEfficiencyData = useMemo(() => {
    return filteredFuel
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((f, idx) => {
        const veh = vehicles.find(v => v.id === f.vehicleId);
        const drv = drivers.find(d => d.id === f.driverId);
        const dateObj = new Date(f.date);
        const label = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

        return {
          id: f.id,
          index: idx + 1,
          date: f.date,
          label: `${label} (${veh?.registrationNumber || 'Veh'})`,
          vehicleReg: veh?.registrationNumber || 'Unknown',
          driverName: drv?.name || 'Driver',
          kmPerLiter: f.calculatedKmPerLiter || (f.fuelType === 'Hybrid' ? 17.2 : 10.2),
          liters: f.liters,
          cost: f.totalCost,
          station: f.stationName,
          targetBenchmark: f.fuelType === 'Hybrid' ? 16.0 : 10.0
        };
      });
  }, [filteredFuel, vehicles, drivers]);

  // 3. Vehicle Utilization Breakdown over the selected period
  const vehicleUtilizationData = useMemo(() => {
    return vehicles.map((v, idx) => {
      const vTrips = filteredTrips.filter(t => t.vehicleId === v.id);
      const vFuel = filteredFuel.filter(f => f.vehicleId === v.id);

      const totalDistanceKm = vTrips.reduce((sum, t) => sum + (t.distanceKm || 0), 0);
      const totalFuelCost = vFuel.reduce((sum, f) => sum + (f.totalCost || 0), 0);
      const totalFuelLiters = vFuel.reduce((sum, f) => sum + (f.liters || 0), 0);
      const tripsCount = vTrips.length;

      // Unique active days for this vehicle
      const activeDaysCount = new Set(vTrips.map(t => t.date)).size;
      const utilizationRate = Math.min(100, Math.round((activeDaysCount / daysCount) * 100));

      const avgKmPerLiter = totalFuelLiters > 0
        ? Math.round((totalDistanceKm / totalFuelLiters) * 10) / 10
        : (v.fuelType === 'Hybrid' ? 17.1 : 10.2);

      const costPerKm = totalDistanceKm > 0
        ? Math.round((totalFuelCost / totalDistanceKm) * 10) / 10
        : 0;

      return {
        id: v.id,
        name: v.registrationNumber,
        model: `${v.make} ${v.model}`,
        fuelType: v.fuelType,
        totalDistanceKm,
        totalFuelCost,
        totalFuelLiters: Math.round(totalFuelLiters * 10) / 10,
        tripsCount,
        activeDaysCount,
        utilizationRate,
        avgKmPerLiter,
        costPerKm,
        color: COLORS[idx % COLORS.length]
      };
    });
  }, [vehicles, filteredTrips, filteredFuel, daysCount]);

  // 4. Fuel Station Expense Distribution (Pie Data)
  const stationDistributionData = useMemo(() => {
    const map: Record<string, { name: string; cost: number; liters: number }> = {};
    filteredFuel.forEach(f => {
      const station = f.stationName.split('-')[0].trim() || 'Other Stations';
      if (!map[station]) {
        map[station] = { name: station, cost: 0, liters: 0 };
      }
      map[station].cost += f.totalCost;
      map[station].liters += f.liters;
    });

    return Object.values(map).map((item, idx) => ({
      ...item,
      color: COLORS[idx % COLORS.length]
    }));
  }, [filteredFuel]);

  // 5. Driver Workload & Trip Allocation
  const driverWorkloadData = useMemo(() => {
    return drivers.map((d, idx) => {
      const dTrips = filteredTrips.filter(t => t.driverId === d.id);
      const totalKm = dTrips.reduce((sum, t) => sum + (t.distanceKm || 0), 0);
      return {
        id: d.id,
        name: d.name,
        trips: dTrips.length,
        distanceKm: totalKm,
        color: COLORS[idx % COLORS.length]
      };
    }).filter(d => d.trips > 0 || d.distanceKm > 0);
  }, [drivers, filteredTrips]);

  // 6. Day-of-Week Transit Intensity Heatmap / Pattern
  const dayOfWeekData = useMemo(() => {
    const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const buckets: Record<string, { day: string; distanceKm: number; trips: number; count: number }> = {
      Mon: { day: 'Monday', distanceKm: 0, trips: 0, count: 0 },
      Tue: { day: 'Tuesday', distanceKm: 0, trips: 0, count: 0 },
      Wed: { day: 'Wednesday', distanceKm: 0, trips: 0, count: 0 },
      Thu: { day: 'Thursday', distanceKm: 0, trips: 0, count: 0 },
      Fri: { day: 'Friday', distanceKm: 0, trips: 0, count: 0 },
      Sat: { day: 'Saturday', distanceKm: 0, trips: 0, count: 0 },
      Sun: { day: 'Sunday', distanceKm: 0, trips: 0, count: 0 }
    };

    filteredTrips.forEach(t => {
      const shortDay = new Date(t.date).toLocaleDateString('en-GB', { weekday: 'short' });
      if (buckets[shortDay]) {
        buckets[shortDay].distanceKm += t.distanceKm || 0;
        buckets[shortDay].trips += 1;
        buckets[shortDay].count += 1;
      }
    });

    return order.map(k => buckets[k]);
  }, [filteredTrips]);

  // High-Level Aggregate KPIs for the selected window
  const totalPeriodDistance = filteredTrips.reduce((s, t) => s + (t.distanceKm || 0), 0);
  const totalPeriodFuelCost = filteredFuel.reduce((s, f) => s + (f.totalCost || 0), 0);
  const totalPeriodFuelLiters = filteredFuel.reduce((s, f) => s + (f.liters || 0), 0);
  const totalPeriodTrips = filteredTrips.length;

  const averageFleetEfficiency = totalPeriodFuelLiters > 0
    ? (totalPeriodDistance / totalPeriodFuelLiters).toFixed(1)
    : '11.8';

  const averageCostPerKm = totalPeriodDistance > 0
    ? (totalPeriodFuelCost / totalPeriodDistance).toFixed(1)
    : '0';

  // Overall fleet operational utilization %: average vehicle active days / total possible vehicle-days
  const totalPossibleVehicleDays = (selectedVehicleId === 'all' ? vehicles.length : 1) * daysCount;
  const totalActualVehicleActiveDays = vehicleUtilizationData.reduce((s, v) => s + v.activeDaysCount, 0);
  const fleetUtilizationPercent = totalPossibleVehicleDays > 0
    ? Math.round((totalActualVehicleActiveDays / totalPossibleVehicleDays) * 100)
    : 0;

  // Custom Chart Tooltips
  const CustomDailyTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs text-slate-100 z-50 min-w-[200px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2 font-semibold">
          <span className="text-white">{data.label} ({data.dayOfWeek})</span>
          <span className="text-slate-400 text-[10px]">{data.date}</span>
        </div>
        <div className="space-y-1 text-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-blue-400 font-medium">Distance Traveled:</span>
            <span className="font-bold text-white">{data.distanceKm.toLocaleString()} km</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-amber-400 font-medium">Fuel Consumed:</span>
            <span className="font-bold text-white">{data.fuelLiters} L</span>
          </div>
          {data.fuelCost > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 font-medium">Fuel Spend:</span>
              <span className="font-bold text-white">{formatCurrency(data.fuelCost)}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
            <span className="text-slate-400">Trips Logged:</span>
            <span className="font-semibold text-slate-200">{data.tripCount} trip(s)</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Active Units:</span>
            <span className="font-semibold text-slate-200">{data.activeVehiclesToday} of {vehicles.length}</span>
          </div>
        </div>
      </div>
    );
  };

  const CustomEfficiencyTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs text-slate-100 min-w-[210px]">
        <p className="font-bold text-white border-b border-slate-800 pb-1 mb-1.5">{data.vehicleReg}</p>
        <div className="space-y-1 text-slate-300">
          <div className="flex justify-between">
            <span className="text-emerald-400">Fuel Efficiency:</span>
            <span className="font-bold text-emerald-300">{data.kmPerLiter} km/L</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Date:</span>
            <span className="text-white">{formatDate(data.date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Volume & Cost:</span>
            <span className="text-white">{data.liters} L • {formatCurrency(data.cost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Station:</span>
            <span className="text-slate-200 truncate max-w-[120px]">{data.station}</span>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Target Benchmark:</span>
            <span>{data.targetBenchmark} km/L</span>
          </div>
        </div>
      </div>
    );
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 shadow-xl text-xs text-slate-100">
        <p className="font-bold text-white mb-1">{data.name}</p>
        <p className="text-emerald-400 font-semibold">{formatCurrency(data.cost || data.totalFuelCost || 0)}</p>
        <p className="text-slate-400 text-[11px] mt-0.5">{data.liters || data.totalFuelLiters || 0} Liters Total</p>
      </div>
    );
  };

  return (
    <div id="analytics-dashboard-view" className="space-y-4 pb-20 pt-1">
      {/* Header Banner & Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center flex-shrink-0 shadow">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-tight">
                  Visualization Dashboard
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Recharts Engine
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Fuel consumption trends, mileage analytics, and fleet utilization over the last {daysCount} days
              </p>
            </div>
          </div>

          {/* Time Range Filter Pill Selector */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setTimeRange('7')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                timeRange === '7'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange('14')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                timeRange === '14'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              14 Days
            </button>
            <button
              onClick={() => setTimeRange('30')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                timeRange === '30'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Last 30 Days
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 min-w-max">
            <button
              onClick={() => setActiveSection('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeSection === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Full Analytics</span>
            </button>
            <button
              onClick={() => setActiveSection('fuel')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeSection === 'fuel'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Fuel className="w-3.5 h-3.5 text-amber-400" />
              <span>Fuel Trends</span>
            </button>
            <button
              onClick={() => setActiveSection('utilization')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeSection === 'utilization'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span>Fleet Utilization</span>
            </button>
            <button
              onClick={() => setActiveSection('vehicles')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeSection === 'vehicles'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Car className="w-3.5 h-3.5 text-emerald-400" />
              <span>Vehicle Comparison</span>
            </button>
          </div>

          <button
            onClick={() => setShowTableModal(!showTableModal)}
            className="text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1 transition-colors flex-shrink-0"
          >
            <Layers className="w-3 h-3" />
            <span>{showTableModal ? 'Hide Data Table' : 'View Data Table'}</span>
          </button>
        </div>
      </div>

      {/* 30-Day Executive Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total Mileage */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">30-Day Mileage</span>
            <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Navigation className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white tracking-tight">
            {totalPeriodDistance.toLocaleString()} <span className="text-xs text-slate-400 font-normal">km</span>
          </p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{totalPeriodTrips} trips logged</span>
          </div>
        </div>

        {/* Fleet Utilization */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Fleet Utilization</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Gauge className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white tracking-tight">
            {fleetUtilizationPercent}%
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalActualVehicleActiveDays} active vehicle-days
          </p>
        </div>

        {/* Total Fuel Consumed & Spend */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Fuel Consumed</span>
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Fuel className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white tracking-tight">
            {totalPeriodFuelLiters.toFixed(1)} <span className="text-xs text-slate-400 font-normal">L</span>
          </p>
          <p className="text-[11px] text-amber-300/90 font-medium mt-1">
            {formatCurrency(totalPeriodFuelCost)}
          </p>
        </div>

        {/* Average Fuel Efficiency */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Avg Efficiency</span>
            <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white tracking-tight">
            {averageFleetEfficiency} <span className="text-xs text-slate-400 font-normal">km/L</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Cost: <span className="font-semibold text-slate-200">LKR {averageCostPerKm} / km</span>
          </p>
        </div>
      </div>

      {/* CHART 1: 30-Day Daily Fuel Consumption & Expenditure Trends */}
      {(activeSection === 'all' || activeSection === 'fuel') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="text-sm font-bold text-white">
                  Daily Fuel Consumption & Expenditure ({timeRange} Days)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Displays fuel volume (Liters) pumped and total financial expenditure per day
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
              <button
                onClick={() => setFuelMetricView('volume')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  fuelMetricView === 'volume'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Volume (L)
              </button>
              <button
                onClick={() => setFuelMetricView('cost')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  fuelMetricView === 'cost'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Spend (LKR)
              </button>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={dailyTrendsData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  interval={timeRange === '30' ? 3 : timeRange === '14' ? 1 : 0}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => fuelMetricView === 'volume' ? `${val}L` : `${Math.round(val / 1000)}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => `${val} km`}
                />
                <Tooltip content={<CustomDailyTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  iconType="circle"
                />

                {/* Primary Bar: Fuel Volume or Spend */}
                {fuelMetricView === 'volume' ? (
                  <Bar
                    yAxisId="left"
                    dataKey="fuelLiters"
                    name="Fuel Volume (Liters)"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                ) : (
                  <Bar
                    yAxisId="left"
                    dataKey="fuelCost"
                    name="Fuel Spend (LKR)"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                )}

                {/* Secondary Line: Daily Distance for context */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="distanceKm"
                  name="Distance Traveled (km)"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#3b82f6' }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CHART 2: Fuel Efficiency (km/L) by Vehicle over Time */}
      {(activeSection === 'all' || activeSection === 'fuel') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-bold text-white">
                  Fuel Economy & Efficiency Trend (km/L)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculated kilometers delivered per liter across tank refills against fleet benchmarks
              </p>
            </div>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 font-semibold px-2.5 py-1 rounded-full border border-emerald-500/20">
              Avg: {averageFleetEfficiency} km/L
            </span>
          </div>

          <div className="h-60 sm:h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={fuelEfficiencyData}
                margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={35}
                />
                <YAxis
                  domain={[6, 22]}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => `${val} km/L`}
                />
                <Tooltip content={<CustomEfficiencyTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />

                {/* Benchmark Reference Line */}
                <ReferenceLine
                  y={12.0}
                  stroke="#ec4899"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{ value: 'Fleet Target (12 km/L)', fill: '#ec4899', fontSize: 10, position: 'insideTopRight' }}
                />

                <Line
                  type="monotone"
                  dataKey="kmPerLiter"
                  name="Fuel Efficiency (km/L)"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#064e3b' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CHART 3: Fleet Daily Utilization & Distance Traveled */}
      {(activeSection === 'all' || activeSection === 'utilization') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h3 className="text-sm font-bold text-white">
                  Daily Fleet Utilization & Distance (km)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Stacked daily mileage breakdown by vehicle across the {timeRange}-day period
              </p>
            </div>
            <span className="text-xs bg-blue-500/10 text-blue-400 font-semibold px-2.5 py-1 rounded-full border border-blue-500/20">
              {totalPeriodDistance.toLocaleString()} km Total
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyTrendsData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  interval={timeRange === '30' ? 3 : timeRange === '14' ? 1 : 0}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => `${val} km`}
                />
                <Tooltip content={<CustomDailyTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

                {/* Render a stacked bar for each vehicle */}
                {vehicles.map((v, i) => (
                  <Bar
                    key={v.id}
                    dataKey={v.registrationNumber}
                    name={v.registrationNumber}
                    stackId="fleet"
                    fill={COLORS[i % COLORS.length]}
                    radius={i === vehicles.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CHART 4 & 5: Vehicle Utilization Rate & Fuel Spend Breakdown */}
      {(activeSection === 'all' || activeSection === 'vehicles' || activeSection === 'fuel') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vehicle Utilization & Operational Days */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-400" />
                Vehicle Operational Utilization Rate (%)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Active operational days vs idle time over {timeRange} days
              </p>
            </div>

            <div className="h-56 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={vehicleUtilizationData}
                  layout="vertical"
                  margin={{ top: 5, right: 25, left: 35, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={val => `${val}%`}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value: any, name: any, item: any) => [
                      `${value}% (${item.payload.activeDaysCount} of ${daysCount} days active, ${item.payload.totalDistanceKm} km)`,
                      'Utilization Rate'
                    ]}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar
                    dataKey="utilizationRate"
                    name="Utilization Rate (%)"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={20}
                  >
                    {vehicleUtilizationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fuel Spend Distribution by Vehicle */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Fuel className="w-4 h-4 text-amber-400" />
                Fuel Expenditure by Vehicle
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Financial share of total {formatCurrency(totalPeriodFuelCost)} spent
              </p>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vehicleUtilizationData}
                    dataKey="totalFuelCost"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {vehicleUtilizationData.map((entry, index) => (
                      <Cell key={`pie-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* CHART 6 & 7: Day-of-Week Intensity & Driver Workload Allocation */}
      {(activeSection === 'all' || activeSection === 'utilization') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Day of Week Pattern */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Weekly Fleet Transit Intensity Pattern
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Total distance (km) logged per day of week to pinpoint peak operations
              </p>
            </div>

            <div className="h-52 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dayOfWeekData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={val => `${val}km`} />
                  <Tooltip
                    formatter={(val: any) => [`${val} km`, 'Distance']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar
                    dataKey="distanceKm"
                    name="Mileage (km)"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Driver Haulage & Trips Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Driver Mileage & Trip Allocation (30D)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Distance and trip distribution across registered company drivers
              </p>
            </div>

            <div className="h-52 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={driverWorkloadData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} interval={0} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={val => `${val}km`} />
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => [
                      `${val.toLocaleString()} km (${item.payload.trips} trips)`,
                      'Distance'
                    ]}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar
                    dataKey="distanceKm"
                    name="Distance (km)"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  >
                    {driverWorkloadData.map((entry, index) => (
                      <Cell key={`drv-bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tabular Performance Summary Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Vehicle Performance & Fuel Efficiency Breakdown ({timeRange} Days)
              </h3>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-semibold">
                <th className="py-2 px-2">Vehicle</th>
                <th className="py-2 px-2">Fuel Type</th>
                <th className="py-2 px-2 text-right">Distance (km)</th>
                <th className="py-2 px-2 text-right">Trips</th>
                <th className="py-2 px-2 text-right">Fuel Pumped</th>
                <th className="py-2 px-2 text-right">Fuel Cost</th>
                <th className="py-2 px-2 text-right">Efficiency</th>
                <th className="py-2 px-2 text-right">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {vehicleUtilizationData.map(v => (
                <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-2 font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
                    <span>{v.name}</span>
                  </td>
                  <td className="py-2.5 px-2 text-slate-300">
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 border border-slate-700">
                      {v.fuelType}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold text-blue-400">
                    {v.totalDistanceKm.toLocaleString()} km
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-300">
                    {v.tripsCount}
                  </td>
                  <td className="py-2.5 px-2 text-right text-amber-300 font-mono">
                    {v.totalFuelLiters} L
                  </td>
                  <td className="py-2.5 px-2 text-right font-semibold text-emerald-400">
                    {formatCurrency(v.totalFuelCost)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold text-slate-100">
                    {v.avgKmPerLiter} <span className="text-[10px] text-slate-400 font-normal">km/L</span>
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      v.utilizationRate >= 70
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : v.utilizationRate >= 40
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {v.utilizationRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-700 font-bold text-white bg-slate-850/50">
                <td className="py-2 px-2">Total Fleet ({vehicles.length})</td>
                <td className="py-2 px-2 text-slate-400">—</td>
                <td className="py-2 px-2 text-right text-blue-400">{totalPeriodDistance.toLocaleString()} km</td>
                <td className="py-2 px-2 text-right">{totalPeriodTrips}</td>
                <td className="py-2 px-2 text-right text-amber-400">{totalPeriodFuelLiters.toFixed(1)} L</td>
                <td className="py-2 px-2 text-right text-emerald-400">{formatCurrency(totalPeriodFuelCost)}</td>
                <td className="py-2 px-2 text-right">{averageFleetEfficiency} km/L</td>
                <td className="py-2 px-2 text-right text-emerald-400">{fleetUtilizationPercent}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
