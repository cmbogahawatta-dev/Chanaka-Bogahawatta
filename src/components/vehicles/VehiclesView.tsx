import React, { useState } from 'react';
import {
  Car,
  Plus,
  Search,
  Fuel,
  Gauge,
  User,
  ArrowRightLeft,
  Calendar,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building,
  Radio
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { Vehicle } from '../../types';
import { formatDate } from '../../utils/helpers';
import { VehicleModal } from './VehicleModal';
import { PairGPSTrackerModal } from '../gps/PairGPSTrackerModal';

interface VehiclesViewProps {
  onOpenTransfer: (vehicleId: string) => void;
  onOpenTrip: (vehicleId: string) => void;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  onOpenTransfer,
  onOpenTrip
}) => {
  const {
    vehicles,
    drivers,
    runningCharts,
    serviceSchedules,
    deleteVehicle,
    setSelectedVehicleId,
    getVehicleTelemetry
  } = useFleet();

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [pairingVehicle, setPairingVehicle] = useState<Vehicle | null>(null);

  const filteredVehicles = vehicles.filter(v => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const drv = drivers.find(d => d.id === v.currentDriverId);
    const match = `${v.registrationNumber} ${v.make} ${v.model} ${v.type} ${v.department} ${v.fuelType} ${drv?.name}`.toLowerCase();
    return match.includes(q);
  });

  const getDriver = (driverId?: string) => {
    if (!driverId) return undefined;
    return drivers.find(d => d.id === driverId);
  };

  return (
    <div className="space-y-4 pb-20 pt-1">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Company Fleet Inventory</h2>
              <p className="text-xs text-slate-400">Live odometer, fuel type & active drivers</p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingVehicle(null);
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-center text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Fleet</span>
            <p className="text-base font-bold text-white">{vehicles.length} Units</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Drivers</span>
            <p className="text-base font-bold text-emerald-400">
              {vehicles.filter(v => v.currentDriverId).length}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Schedules</span>
            <p className="text-base font-bold text-purple-400">
              {serviceSchedules.length}
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search license plate, make, model, category, driver..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Vehicle Cards List */}
      {filteredVehicles.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-xs text-slate-400 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/15 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">No Vehicles in Fleet</p>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
              {searchQuery ? 'No vehicles match your search query.' : 'Register your first company vehicle to begin tracking trips, fuel refills, and service maintenance.'}
            </p>
          </div>
          {!searchQuery && (
            <button
              onClick={() => {
                setEditingVehicle(null);
                setShowModal(true);
              }}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register First Vehicle</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVehicles.map(vehicle => {
            const driver = getDriver(vehicle.currentDriverId);
            const totalTrips = runningCharts.filter(rc => rc.vehicleId === vehicle.id).length;

            return (
              <div
                key={vehicle.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition-colors text-xs space-y-3"
              >
                {/* Header: Reg Number, Make Model & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold flex items-center justify-center">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-sm text-white">{vehicle.registrationNumber}</h3>
                        <span className="text-[10px] bg-slate-800 text-slate-300 font-medium px-1.5 py-0.2 rounded border border-slate-700">
                          {vehicle.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {vehicle.make} {vehicle.model} ({vehicle.year}) • {vehicle.department}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {vehicle.gpsDeviceId ? (
                      <button
                        type="button"
                        onClick={() => setPairingVehicle(vehicle)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1 hover:bg-blue-500/25 transition-colors"
                      >
                        <Radio className="w-3 h-3 text-blue-400 animate-pulse" />
                        <span>GPS: {vehicle.gpsDeviceId.slice(-6)}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPairingVehicle(vehicle)}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-600 transition-colors"
                      >
                        + Pair GPS
                      </button>
                    )}
                    {vehicle.registrationDocUrl && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-blue-400" />
                        Scanned CR Book
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active Fleet
                    </span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 text-[11px]">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Current Odometer</span>
                    <span className="font-mono font-bold text-blue-400 text-xs">
                      {vehicle.currentOdometerKm.toLocaleString()} km
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Fuel Spec</span>
                    <span className="font-semibold text-slate-200">
                      {vehicle.fuelType} ({vehicle.tankCapacityLiters}L)
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Trips Logged</span>
                    <span className="font-semibold text-slate-200">
                      {totalTrips} Trips
                    </span>
                  </div>
                </div>

                {/* Active Driver Assignment Box */}
                <div className="p-2.5 bg-slate-850 rounded-xl border border-slate-800 flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div className="min-w-0 truncate">
                      <span className="text-[10px] text-slate-400 block">Assigned Driver</span>
                      {driver ? (
                        <span className="font-bold text-slate-100 truncate block">
                          {driver.name} ({driver.employeeId})
                        </span>
                      ) : (
                        <span className="text-amber-400 italic">No driver assigned (Unassigned)</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenTransfer(vehicle.id)}
                    className="flex-shrink-0 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Transfer Driver</span>
                  </button>
                </div>

                {/* Statutory Expiries: Revenue & Insurance */}
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-0.5">
                  <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">
                    <span>Insurance Expiry: </span>
                    <strong className="text-slate-300 font-normal">{formatDate(vehicle.insuranceExpiryDate)}</strong>
                  </div>
                  <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">
                    <span>Revenue License: </span>
                    <strong className="text-slate-300 font-normal">{formatDate(vehicle.revenueLicenseExpiryDate)}</strong>
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                  <button
                    onClick={() => onOpenTrip(vehicle.id)}
                    className="text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    + Log New Trip for this Vehicle
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingVehicle(vehicle);
                        setShowModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Remove vehicle ${vehicle.registrationNumber} from fleet?`)) {
                          deleteVehicle(vehicle.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vehicle Modal */}
      {showModal && (
        <VehicleModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingVehicle(null);
          }}
          vehicleToEdit={editingVehicle}
        />
      )}

      {/* Pair GPS Tracker Modal */}
      {pairingVehicle && (
        <PairGPSTrackerModal
          isOpen={!!pairingVehicle}
          onClose={() => setPairingVehicle(null)}
          vehicle={pairingVehicle}
        />
      )}
    </div>
  );
};
