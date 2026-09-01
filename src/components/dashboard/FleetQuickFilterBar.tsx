import React from 'react';
import { Filter, Layers, MapPin, X, Check, Truck, Car, Bike, Building } from 'lucide-react';
import { Vehicle } from '../../types';

export type VehicleCategoryFilter = 'ALL' | 'HEAVY_DUTY' | 'LIGHT_DUTY' | 'MOTORCYCLE';

export interface QuickFilterState {
  category: VehicleCategoryFilter;
  site: string; // 'ALL' or specific site name
}

interface FleetQuickFilterBarProps {
  filterState: QuickFilterState;
  onFilterChange: (newState: QuickFilterState) => void;
  vehicles: Vehicle[];
  availableSites: string[];
  totalVehiclesCount: number;
  filteredVehiclesCount: number;
}

export const FleetQuickFilterBar: React.FC<FleetQuickFilterBarProps> = ({
  filterState,
  onFilterChange,
  vehicles,
  availableSites,
  totalVehiclesCount,
  filteredVehiclesCount
}) => {
  const isFiltered = filterState.category !== 'ALL' || filterState.site !== 'ALL';

  const handleCategorySelect = (cat: VehicleCategoryFilter) => {
    onFilterChange({
      ...filterState,
      category: cat
    });
  };

  const handleSiteSelect = (site: string) => {
    onFilterChange({
      ...filterState,
      site: site
    });
  };

  const handleClearFilters = () => {
    onFilterChange({
      category: 'ALL',
      site: 'ALL'
    });
  };

  // Calculate counts for categories
  const heavyCount = vehicles.filter(v => v.type === 'Lorry / Truck').length;
  const lightCount = vehicles.filter(v =>
    v.type === 'Pickup' || v.type === 'SUV' || v.type === 'Van' || v.type === 'Sedan'
  ).length;
  const bikeCount = vehicles.filter(v => v.type === 'Motorcycle').length;

  return (
    <div
      id="fleet-quick-filter-bar"
      className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3 shadow-md space-y-2.5 backdrop-blur-sm"
    >
      {/* Top row: Filter summary & quick reset */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-200">
            Fleet Quick Filters
          </span>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
            Showing {filteredVehiclesCount} of {totalVehiclesCount} assets
          </span>
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 active:scale-95"
          >
            <X className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Horizontal scrollable quick-filter chips */}
      <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-slate-800/60">
        {/* Category Section */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1 shrink-0 mr-1">
            <Layers className="w-3 h-3" />
            Category:
          </span>

          <button
            type="button"
            onClick={() => handleCategorySelect('ALL')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              filterState.category === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/40'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-750'
            }`}
          >
            <span>All ({vehicles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleCategorySelect('HEAVY_DUTY')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              filterState.category === 'HEAVY_DUTY'
                ? 'bg-amber-600 text-white shadow-sm shadow-amber-900/40'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-750'
            }`}
          >
            <Truck className="w-3 h-3 text-amber-400" />
            <span>Heavy Duty ({heavyCount})</span>
          </button>

          <button
            type="button"
            onClick={() => handleCategorySelect('LIGHT_DUTY')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              filterState.category === 'LIGHT_DUTY'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/40'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-750'
            }`}
          >
            <Car className="w-3 h-3 text-emerald-400" />
            <span>Light Duty ({lightCount})</span>
          </button>

          <button
            type="button"
            onClick={() => handleCategorySelect('MOTORCYCLE')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              filterState.category === 'MOTORCYCLE'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/40'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-750'
            }`}
          >
            <Bike className="w-3 h-3 text-purple-400" />
            <span>2-Wheel ({bikeCount})</span>
          </button>
        </div>

        {/* Site / Project Section */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none sm:border-l sm:border-slate-800 sm:pl-3">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1 shrink-0 mr-1">
            <MapPin className="w-3 h-3" />
            Active Site:
          </span>

          <button
            type="button"
            onClick={() => handleSiteSelect('ALL')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
              filterState.site === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-750'
            }`}
          >
            <span>All Sites</span>
          </button>

          {availableSites.map(siteName => {
            const count = vehicles.filter(v => v.department === siteName).length;
            return (
              <button
                key={siteName}
                type="button"
                onClick={() => handleSiteSelect(siteName)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  filterState.site === siteName
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-750'
                }`}
              >
                <span>{siteName}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
