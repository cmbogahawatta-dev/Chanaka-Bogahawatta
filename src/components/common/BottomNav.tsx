import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Navigation,
  Fuel,
  Wrench,
  ArrowRightLeft,
  Users,
  Car,
  Radio
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

export type ActiveTab = 'dashboard' | 'gps' | 'analytics' | 'runningChart' | 'fuel' | 'maintenance' | 'transfers' | 'drivers' | 'vehicles';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { getAlertsCount, transfers, gpsConfig, vehicles, getVehicleTelemetry } = useFleet();
  const alerts = getAlertsCount();

  const liveMovingCount = vehicles.filter(v => getVehicleTelemetry(v.id)?.deviceStatus === 'moving').length;

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: LayoutDashboard
    },
    {
      id: 'gps',
      label: 'GPS Live',
      icon: Radio,
      badge: liveMovingCount > 0 ? liveMovingCount : undefined,
      badgeColor: 'bg-emerald-500'
    },
    {
      id: 'analytics',
      label: 'Trends',
      icon: TrendingUp
    },
    {
      id: 'runningChart',
      label: 'Trip Chart',
      icon: Navigation
    },
    {
      id: 'fuel',
      label: 'Fuel Log',
      icon: Fuel
    },
    {
      id: 'transfers',
      label: 'Transfers',
      icon: ArrowRightLeft,
      badge: transfers.length > 0 ? transfers.length : undefined,
      badgeColor: 'bg-emerald-500'
    },
    {
      id: 'maintenance',
      label: 'Service',
      icon: Wrench,
      badge: alerts.overdue > 0 ? alerts.overdue : (alerts.dueSoon > 0 ? alerts.dueSoon : undefined),
      badgeColor: alerts.overdue > 0 ? 'bg-rose-500' : 'bg-amber-500'
    },
    {
      id: 'drivers',
      label: 'Drivers',
      icon: Users,
      badge: alerts.expiredLicenses > 0 ? alerts.expiredLicenses : undefined,
      badgeColor: 'bg-rose-500'
    },
    {
      id: 'vehicles',
      label: 'Vehicles',
      icon: Car
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-slate-400 max-w-full pb-[max(env(safe-area-inset-bottom),0.375rem)]">
      <div className="flex items-center justify-around px-1 py-1 max-w-2xl mx-auto overflow-x-auto no-scrollbar">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center min-w-[54px] py-1 px-1.5 rounded-xl transition-all ${
                isActive
                  ? 'text-blue-400 font-semibold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.3px] text-blue-400' : 'stroke-[1.8px]'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2 min-w-3.5 h-3.5 px-0.5 rounded-full text-white text-[9px] font-bold flex items-center justify-center ${
                      item.badgeColor || 'bg-blue-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap tracking-tight">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-blue-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
