import React, { useState, useEffect } from 'react';
import {
  Truck,
  Fuel,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { ActiveTab } from '../common/BottomNav';

export interface FleetKPICardsProps {
  activeVehiclesCount: number;
  totalVehiclesCount: number;
  monthlyFuelLiters: number;
  monthlyFuelCost: number;
  pendingMaintenanceCount: number;
  overdueCount: number;
  dueSoonCount: number;
  onNavigate?: (tab: ActiveTab) => void;
  className?: string;
}

export const FleetKPICards: React.FC<FleetKPICardsProps> = ({
  activeVehiclesCount,
  totalVehiclesCount,
  monthlyFuelLiters,
  monthlyFuelCost,
  pendingMaintenanceCount,
  overdueCount,
  dueSoonCount,
  onNavigate = (_tab: ActiveTab) => {},
  className = ''
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Trigger smooth fade-in and slide-up entrance animation on mount
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 40);
    return () => clearTimeout(timer);
  }, []);

  const activeRatePercent =
    totalVehiclesCount > 0
      ? Math.round((activeVehiclesCount / totalVehiclesCount) * 100)
      : 0;

  return (
    <div
      id="fleet-kpi-cards"
      aria-label="Fleet KPI Summary Cards"
      className={`grid grid-cols-1 sm:grid-cols-3 gap-3.5 ${className}`}
    >
      {/* 1. Active Vehicle Count Card */}
      <div
        id="kpi-active-vehicles"
        onClick={() => onNavigate('vehicles')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onNavigate('vehicles')}
        className={`group relative overflow-hidden bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-slate-750/80 hover:border-blue-500/50 rounded-2xl p-4 cursor-pointer shadow-lg shadow-slate-950/20 backdrop-blur-sm transform transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-blue-500/10 ${
          isMounted
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4'
        }`}
        style={{ transitionDelay: '50ms' }}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
        
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-500/25 transition-all">
              <Truck className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Active Fleet
            </span>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            {activeRatePercent}% Available
          </span>
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {activeVehiclesCount}
              </span>
              <span className="text-sm font-semibold text-slate-400">
                / {totalVehiclesCount}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>
                {activeVehiclesCount === totalVehiclesCount
                  ? 'All units operational'
                  : `${totalVehiclesCount - activeVehiclesCount} inactive / maintenance`}
              </span>
            </p>
          </div>
          <div className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2. Total Fuel Consumption for the Month Card */}
      <div
        id="kpi-monthly-fuel"
        onClick={() => onNavigate('fuel')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onNavigate('fuel')}
        className={`group relative overflow-hidden bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-slate-750/80 hover:border-amber-500/50 rounded-2xl p-4 cursor-pointer shadow-lg shadow-slate-950/20 backdrop-blur-sm transform transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-amber-500/10 ${
          isMounted
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4'
        }`}
        style={{ transitionDelay: '120ms' }}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none" />

        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-amber-500/25 transition-all">
              <Fuel className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Monthly Fuel
            </span>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-1">
            <TrendingUp className="w-2.5 h-2.5" />
            This Month
          </span>
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {monthlyFuelLiters.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </span>
              <span className="text-sm font-semibold text-amber-400">
                L
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
              Total Cost: <span className="text-slate-200 font-semibold">{formatCurrency(monthlyFuelCost)}</span>
            </p>
          </div>
          <div className="text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. Pending Maintenance Alerts Card */}
      <div
        id="kpi-maintenance-alerts"
        onClick={() => onNavigate('maintenance')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onNavigate('maintenance')}
        className={`group relative overflow-hidden bg-gradient-to-b from-slate-800/90 to-slate-900/90 border ${
          overdueCount > 0
            ? 'border-rose-500/40 hover:border-rose-500/60'
            : 'border-slate-750/80 hover:border-purple-500/50'
        } rounded-2xl p-4 cursor-pointer shadow-lg shadow-slate-950/20 backdrop-blur-sm transform transition-all duration-500 ease-out hover:-translate-y-0.5 ${
          overdueCount > 0 ? 'hover:shadow-rose-500/10' : 'hover:shadow-purple-500/10'
        } ${
          isMounted
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4'
        }`}
        style={{ transitionDelay: '190ms' }}
      >
        <div
          className={`absolute top-0 right-0 w-24 h-24 ${
            overdueCount > 0 ? 'bg-rose-500/10' : 'bg-purple-500/5'
          } rounded-full blur-2xl group-hover:opacity-100 transition-opacity pointer-events-none`}
        />

        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl ${
                overdueCount > 0
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400 group-hover:bg-rose-500/30'
                  : 'bg-purple-500/15 border border-purple-500/30 text-purple-400 group-hover:bg-purple-500/25'
              } flex items-center justify-center group-hover:scale-105 transition-all`}
            >
              {overdueCount > 0 ? (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              ) : (
                <Wrench className="w-4 h-4 text-purple-400" />
              )}
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Maintenance
            </span>
          </div>

          {overdueCount > 0 ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
              Action Required
            </span>
          ) : pendingMaintenanceCount > 0 ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-300 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              Upcoming
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              All Up to Date
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  overdueCount > 0 ? 'text-rose-400' : 'text-white'
                }`}
              >
                {pendingMaintenanceCount}
              </span>
              <span className="text-sm font-semibold text-slate-400">
                {pendingMaintenanceCount === 1 ? 'alert' : 'alerts'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {overdueCount > 0 ? (
                <span className="text-rose-300 font-medium">
                  {overdueCount} overdue{dueSoonCount > 0 ? ` • ${dueSoonCount} due soon` : ''}
                </span>
              ) : dueSoonCount > 0 ? (
                <span className="text-amber-300 font-medium">
                  {dueSoonCount} service{dueSoonCount > 1 ? 's' : ''} due soon
                </span>
              ) : (
                <span className="text-emerald-400 font-medium">No pending alerts</span>
              )}
            </p>
          </div>
          <div className="text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
