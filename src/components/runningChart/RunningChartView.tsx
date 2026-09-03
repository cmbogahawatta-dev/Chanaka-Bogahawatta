import React, { useState } from 'react';
import {
  Navigation,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  MapPin,
  Car,
  User,
  Trash2,
  Edit2,
  DollarSign,
  FileSpreadsheet
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { RunningChartEntry } from '../../types';
import { TripModal } from './TripModal';
import { AdminClearHistoryButton } from '../common/AdminClearHistoryButton';
import { UniversalBulkImportModal } from '../common/UniversalBulkImportModal';
import { UniversalDeleteModal } from '../common/UniversalDeleteModal';

interface RunningChartViewProps {
  onOpenNewTrip: () => void;
}

export const RunningChartView: React.FC<RunningChartViewProps> = ({ onOpenNewTrip }) => {
  const {
    vehicles,
    drivers,
    runningCharts,
    deleteRunningChart,
    bulkImportRunningCharts,
    clearRunningChartHistory,
    selectedVehicleId,
    setSelectedVehicleId,
    isAdmin: isFleetAdmin
  } = useFleet();
  const { currentRole } = useEnterprise();
  const isAdmin = isFleetAdmin || currentRole === 'ADMIN';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriverFilter, setSelectedDriverFilter] = useState('all');
  const [editingTrip, setEditingTrip] = useState<RunningChartEntry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<RunningChartEntry | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Filter running chart entries
  const filteredEntries = runningCharts.filter(entry => {
    if (selectedVehicleId !== 'all' && entry.vehicleId !== selectedVehicleId) {
      return false;
    }
    if (selectedDriverFilter !== 'all' && entry.driverId !== selectedDriverFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const veh = vehicles.find(v => v.id === entry.vehicleId);
      const drv = drivers.find(d => d.id === entry.driverId);
      const matchText = `${entry.purpose} ${entry.startLocation} ${entry.endLocation} ${entry.routeDescription} ${entry.passengers} ${veh?.registrationNumber} ${drv?.name}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  // Calculate totals
  const totalDistance = filteredEntries.reduce((sum, e) => sum + (e.distanceKm || 0), 0);
  const totalToll = filteredEntries.reduce((sum, e) => sum + (e.tollOrParkingCost || 0), 0);

  const getDriver = (driverId: string) => drivers.find(d => d.id === driverId);
  const getVehicle = (vehicleId: string) => vehicles.find(v => v.id === vehicleId);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Start Time',
      'End Time',
      'Vehicle Reg',
      'Driver Name',
      'Purpose',
      'Start Location',
      'End Location',
      'Start Odometer (km)',
      'End Odometer (km)',
      'Distance (km)',
      'Route Description',
      'Toll/Parking (Rs.)',
      'Passengers',
      'Remarks'
    ];

    const rows = filteredEntries.map(e => {
      const v = getVehicle(e.vehicleId);
      const d = getDriver(e.driverId);
      return [
        e.date,
        e.startTime,
        e.endTime,
        v?.registrationNumber || e.vehicleId,
        `"${d?.name || e.driverId}"`,
        `"${e.purpose.replace(/"/g, '""')}"`,
        `"${e.startLocation.replace(/"/g, '""')}"`,
        `"${e.endLocation.replace(/"/g, '""')}"`,
        e.startOdometerKm,
        e.endOdometerKm,
        e.distanceKm,
        `"${(e.routeDescription || '').replace(/"/g, '""')}"`,
        e.tollOrParkingCost || 0,
        `"${(e.passengers || '').replace(/"/g, '""')}"`,
        `"${(e.remarks || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Running_Chart_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-20 pt-1">
      {/* Top Header & Metrics Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Running Chart & Trip Logs</h2>
              <p className="text-xs text-slate-400">Official company vehicle travel ledger</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AdminClearHistoryButton
              id="btn-admin-clear-running-chart"
              moduleName={selectedVehicleId !== 'all' ? `Running Chart for Vehicle ${selectedVehicleId}` : 'Fleet Running Chart'}
              itemCount={filteredEntries.length}
              itemDescription="trip logs and odometer entries"
              preservedItemsDescription="Vehicles and registered drivers remain intact."
              onClear={() => clearRunningChartHistory(selectedVehicleId)}
            />
            <button
              onClick={() => setIsBulkImportOpen(true)}
              id="btn-bulk-import-running-charts"
              className="p-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Bulk Import Excel / CSV Running Charts"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Bulk Import</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Export CSV Report"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={onOpenNewTrip}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Log Trip</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-center">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Trips</p>
            <p className="text-base font-bold text-white">{filteredEntries.length}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Mileage</p>
            <p className="text-base font-bold text-blue-400">
              {totalDistance.toLocaleString()} <span className="text-xs font-normal text-slate-400">km</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Toll / Parking</p>
            <p className="text-base font-bold text-amber-400">{formatCurrency(totalToll)}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search purpose, locations, driver, vehicle..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <select
            value={selectedDriverFilter}
            onChange={e => setSelectedDriverFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs flex-1"
          >
            <option value="all">All Drivers ({drivers.length})</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.employeeId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Trip Log Cards List */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-3">
            <Navigation className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No running chart entries found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {searchQuery ? 'Try adjusting your search criteria.' : 'Start recording company journeys with start/end odometer readings.'}
          </p>
          <button
            onClick={onOpenNewTrip}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
          >
            + Record First Trip Log
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map(entry => {
            const vehicle = getVehicle(entry.vehicleId);
            const driver = getDriver(entry.driverId);

            return (
              <div
                key={entry.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition-colors text-xs space-y-3"
              >
                {/* Header Row: Vehicle, Driver, Distance Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-white">
                        {vehicle?.registrationNumber || 'Vehicle'}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                        {vehicle?.make} {vehicle?.model}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                      <User className="w-3 h-3 text-slate-500" />
                      <span>{driver?.name || 'Driver'} ({driver?.employeeId})</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="inline-block px-2.5 py-1 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 font-extrabold text-sm">
                      +{entry.distanceKm} km
                    </span>
                  </div>
                </div>

                {/* Purpose and Route */}
                <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                  <p className="font-semibold text-slate-100 text-xs">{entry.purpose}</p>
                  
                  <div className="flex items-start gap-1.5 text-slate-300 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-slate-400">From: </span>
                      <span>{entry.startLocation}</span>
                      <span className="font-medium text-slate-400 mx-1.5">→ To: </span>
                      <span className="font-semibold text-white">{entry.endLocation}</span>
                    </div>
                  </div>

                  {entry.routeDescription && (
                    <p className="text-[10px] text-slate-400 pl-5">
                      Route: {entry.routeDescription}
                    </p>
                  )}
                </div>

                {/* Odometer Details & Timing */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Start Odometer</span>
                    <span className="font-mono font-bold text-slate-200">{entry.startOdometerKm.toLocaleString()} km</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">End Odometer</span>
                    <span className="font-mono font-bold text-blue-400">{entry.endOdometerKm.toLocaleString()} km</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Date & Duration</span>
                    <span className="text-slate-200">{formatDate(entry.date)} ({entry.startTime} - {entry.endTime})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Toll / Parking</span>
                    <span className="text-amber-400 font-semibold">{entry.tollOrParkingCost ? formatCurrency(entry.tollOrParkingCost) : 'None'}</span>
                  </div>
                </div>

                {/* Passengers & Remarks */}
                {(entry.passengers || entry.remarks) && (
                  <div className="text-[11px] text-slate-400 flex items-center justify-between flex-wrap gap-2 pt-1">
                    {entry.passengers && <span>Passengers: <strong className="text-slate-300">{entry.passengers}</strong></span>}
                    {entry.remarks && <span className="italic truncate">"{entry.remarks}"</span>}
                  </div>
                )}

                {/* Card Actions */}
                {isAdmin && (
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                    <button
                      onClick={() => {
                        setEditingTrip(entry);
                        setShowEditModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                      title="Admin: Edit trip entry"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setTripToDelete(entry)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                      title="Admin: Delete trip entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Trip Modal */}
      {showEditModal && (
        <TripModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingTrip(null);
          }}
          tripToEdit={editingTrip}
        />
      )}

      {/* Universal Delete Modal for Running Chart */}
      {tripToDelete && (
        <UniversalDeleteModal
          isOpen={!!tripToDelete}
          onClose={() => setTripToDelete(null)}
          module="RUNNING_CHARTS"
          recordType="Running Chart Trip"
          recordId={tripToDelete.id}
          recordCode={`TRIP-${tripToDelete.date.replace(/-/g, '')}-${tripToDelete.id.slice(-4)}`}
          recordTitle={`${tripToDelete.purpose} (${tripToDelete.startLocation} ➔ ${tripToDelete.endLocation})`}
          additionalDetails={`Vehicle: ${getVehicle(tripToDelete.vehicleId)?.registrationNumber || tripToDelete.vehicleId} • Driver: ${getDriver(tripToDelete.driverId)?.name || tripToDelete.driverId} • Distance: ${tripToDelete.distanceKm || 0} km • Date: ${formatDate(tripToDelete.date)}`}
          recordSummary={{
            date: formatDate(tripToDelete.date),
            vehicle: getVehicle(tripToDelete.vehicleId)?.registrationNumber || tripToDelete.vehicleId,
            driver: getDriver(tripToDelete.driverId)?.name || tripToDelete.driverId,
            distance: `${tripToDelete.distanceKm || 0} km`,
            route: `${tripToDelete.startLocation} ➔ ${tripToDelete.endLocation}`,
            purpose: tripToDelete.purpose
          }}
          onDelete={async () => {
            deleteRunningChart(tripToDelete.id);
            setTripToDelete(null);
          }}
          onDeactivate={async () => {
            setTripToDelete(null);
          }}
        />
      )}

      {/* Bulk Import Modal for Running Charts */}
      {isBulkImportOpen && (
        <UniversalBulkImportModal
          isOpen={isBulkImportOpen}
          onClose={() => setIsBulkImportOpen(false)}
          importType="RUNNING_CHARTS"
          onImportComplete={(importedRows) => {
            return bulkImportRunningCharts(importedRows);
          }}
        />
      )}
    </div>
  );
};
