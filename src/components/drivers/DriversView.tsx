import React, { useState } from 'react';
import {
  Users,
  User,
  Plus,
  Search,
  Phone,
  Mail,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Car,
  Edit2,
  Trash2,
  HeartPulse,
  Award,
  ArrowRightLeft,
  Navigation
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { formatDate, isDriverLicenseExpiringSoon } from '../../utils/helpers';
import { Driver } from '../../types';
import { DriverModal } from './DriverModal';
import { UniversalDeleteModal } from '../common/UniversalDeleteModal';
import { UniversalBulkImportModal } from '../common/UniversalBulkImportModal';
import { AdminClearHistoryButton } from '../common/AdminClearHistoryButton';
import { FileSpreadsheet } from 'lucide-react';

export const DriversView: React.FC = () => {
  const {
    drivers,
    vehicles,
    runningCharts,
    transfers,
    deleteDriver,
    clearDriversHistory,
    bulkImportDrivers
  } = useFleet();

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);

  const filteredDrivers = drivers.filter(driver => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const match = `${driver.name} ${driver.employeeId} ${driver.phone} ${driver.licenseNumber} ${driver.department}`.toLowerCase();
    return match.includes(q);
  });

  const getAssignedVehicle = (vehicleId?: string) => {
    if (!vehicleId) return undefined;
    return vehicles.find(v => v.id === vehicleId);
  };

  const getDriverStats = (driverId: string) => {
    const trips = runningCharts.filter(rc => rc.driverId === driverId);
    const totalKm = trips.reduce((sum, t) => sum + (t.distanceKm || 0), 0);
    const handovers = transfers.filter(t => t.fromDriverId === driverId || t.toDriverId === driverId);
    return {
      tripsCount: trips.length,
      totalKm,
      handoversCount: handovers.length
    };
  };

  return (
    <div className="space-y-4 pb-20 pt-1">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Driver Registry & Credentials</h2>
              <p className="text-xs text-slate-400">License validation & vehicle assignments</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AdminClearHistoryButton
              id="btn-admin-clear-drivers-registry"
              moduleName="Driver Registry & Profiles"
              itemCount={drivers.length}
              itemDescription="registered professional drivers in the fleet database"
              preservedItemsDescription="Historical trip logs, fuel transactions, and vehicle condition transfers remain safely preserved."
              buttonText="Clear Registry"
              onClear={() => clearDriversHistory()}
            />

            <button
              id="btn-bulk-import-drivers"
              onClick={() => setIsBulkImportOpen(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-indigo-950 text-indigo-300 hover:text-indigo-200 border border-indigo-800/80 text-xs font-bold px-3 py-2 rounded-xl shadow transition-colors"
              title="Bulk Import Drivers from Excel/CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              <span>Bulk Import</span>
            </button>

            <button
              onClick={() => {
                setEditingDriver(null);
                setShowModal(true);
              }}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Driver</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-center text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Drivers</span>
            <p className="text-base font-bold text-white">{drivers.length}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Active On Duty</span>
            <p className="text-base font-bold text-emerald-400">
              {drivers.filter(d => d.status === 'active').length}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Vehicles Assigned</span>
            <p className="text-base font-bold text-blue-400">
              {drivers.filter(d => d.assignedVehicleId).length}
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
            placeholder="Search driver name, employee ID, license #, phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Driver Cards List */}
      {filteredDrivers.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-xs text-slate-400 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">No Drivers Registered</p>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
              {searchQuery ? 'No drivers match your search query.' : 'Add your company drivers, license expiration tracking, and assign them to vehicles.'}
            </p>
          </div>
          {!searchQuery && (
            <button
              onClick={() => {
                setEditingDriver(null);
                setShowModal(true);
              }}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register First Driver</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDrivers.map(driver => {
            const assignedVehicle = getAssignedVehicle(driver.assignedVehicleId);
            const licenseEval = isDriverLicenseExpiringSoon(driver.licenseExpiryDate);
            const stats = getDriverStats(driver.id);

            return (
              <div
                key={driver.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition-colors text-xs space-y-3"
              >
                {/* Top Row: Avatar/Name, Employee Code, Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-base flex items-center justify-center shadow-md">
                      {driver.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-white">{driver.name}</h3>
                        <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.2 rounded border border-slate-700">
                          {driver.employeeId}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {driver.department} • Blood: <strong className="text-rose-400">{driver.bloodGroup || 'O+'}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {driver.licenseDocumentUrl && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-blue-400" />
                        Scanned License Verified
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      driver.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : driver.status === 'on-leave'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {driver.status === 'active' ? 'Active' : driver.status === 'on-leave' ? 'On Leave' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Driving License & Expiry Alert Strip */}
                <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-[11px] ${
                  licenseEval.isExpired
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : licenseEval.isExpiring
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                }`}>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Driving License</span>
                    <span className="font-mono font-bold text-white">{driver.licenseNumber}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 truncate">{driver.licenseClasses}</span>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] text-slate-400 block">Expiry Date</span>
                    <span className="font-semibold text-slate-200">{formatDate(driver.licenseExpiryDate)}</span>
                    {licenseEval.isExpiring && (
                      <span className="text-[10px] text-amber-400 font-bold block mt-0.5">
                        ⚠️ Expiring in {licenseEval.daysLeft} days
                      </span>
                    )}
                    {licenseEval.isExpired && (
                      <span className="text-[10px] text-rose-400 font-bold block mt-0.5">
                        ⛔ EXPIRED
                      </span>
                    )}
                  </div>
                </div>

                {/* Assigned Vehicle & Stats */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-850 p-2.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Assigned Vehicle</span>
                    {assignedVehicle ? (
                      <span className="font-bold text-blue-400 truncate block">
                        {assignedVehicle.registrationNumber} ({assignedVehicle.model})
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">No vehicle assigned</span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Trip Activity</span>
                    <span className="font-semibold text-slate-200">
                      {stats.tripsCount} trips ({stats.totalKm.toLocaleString()} km)
                    </span>
                  </div>
                </div>

                {/* Contact and Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                  <div className="flex items-center gap-3 text-slate-400">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {driver.phone}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingDriver(driver);
                        setShowModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        setDriverToDelete(driver);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete Driver Profile"
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

      {/* Universal Authorized Delete Modal */}
      {driverToDelete && (
        <UniversalDeleteModal
          isOpen={!!driverToDelete}
          onClose={() => setDriverToDelete(null)}
          module="DRIVERS"
          recordId={driverToDelete.id}
          recordCode={driverToDelete.employeeId}
          recordName={driverToDelete.name}
          additionalDetails={`License: ${driverToDelete.licenseNumber} (${driverToDelete.licenseClasses}) • Phone: ${driverToDelete.phone}`}
          onDelete={async () => {
            deleteDriver(driverToDelete.id);
            setDriverToDelete(null);
          }}
          onDeactivate={async () => {
            setDriverToDelete(null);
          }}
        />
      )}

      {/* Universal Bulk Import Modal */}
      {isBulkImportOpen && (
        <UniversalBulkImportModal
          isOpen={isBulkImportOpen}
          onClose={() => setIsBulkImportOpen(false)}
          importType="DRIVERS"
          onImportComplete={(importedRows) => {
            return bulkImportDrivers(importedRows as any);
          }}
        />
      )}

      {/* Driver Modal */}
      {showModal && (
        <DriverModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingDriver(null);
          }}
          driverToEdit={editingDriver}
        />
      )}
    </div>
  );
};
