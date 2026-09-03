import React, { useState } from 'react';
import {
  Fuel,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  Car,
  User,
  Trash2,
  TrendingUp,
  Receipt,
  Gauge,
  Edit2,
  FileSpreadsheet
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { FuelModal } from './FuelModal';
import { AdminClearHistoryButton } from '../common/AdminClearHistoryButton';
import { UniversalBulkImportModal } from '../common/UniversalBulkImportModal';
import { UniversalDeleteModal } from '../common/UniversalDeleteModal';
import { FuelRecord } from '../../types';

interface FuelRecordViewProps {
  onOpenNewFuel: () => void;
}

export const FuelRecordView: React.FC<FuelRecordViewProps> = ({ onOpenNewFuel }) => {
  const {
    vehicles,
    drivers,
    fuelRecords,
    deleteFuelRecord,
    bulkImportFuelRecords,
    clearFuelHistory,
    selectedVehicleId,
    isAdmin: isFleetAdmin
  } = useFleet();
  const { currentRole } = useEnterprise();
  const isAdmin = isFleetAdmin || currentRole === 'ADMIN';

  const [searchQuery, setSearchQuery] = useState('');
  const [stationFilter, setStationFilter] = useState('all');
  const [editingRecord, setEditingRecord] = useState<FuelRecord | null>(null);
  const [fuelRecordToDelete, setFuelRecordToDelete] = useState<FuelRecord | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Filtered Fuel Records
  const filteredRecords = fuelRecords.filter(record => {
    if (selectedVehicleId !== 'all' && record.vehicleId !== selectedVehicleId) {
      return false;
    }
    if (stationFilter !== 'all' && record.stationName !== stationFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const veh = vehicles.find(v => v.id === record.vehicleId);
      const drv = drivers.find(d => d.id === record.driverId);
      const matchText = `${record.stationName} ${record.invoiceNumber} ${record.notes} ${veh?.registrationNumber} ${drv?.name}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  // Unique stations list for filtering
  const stationsList = Array.from(new Set(fuelRecords.map(f => f.stationName).filter(Boolean)));

  // Computations
  const totalCost = filteredRecords.reduce((sum, f) => sum + (f.totalCost || 0), 0);
  const totalLiters = filteredRecords.reduce((sum, f) => sum + (f.liters || 0), 0);
  
  // Calculate average efficiency from records with km/L calculated
  const recordsWithEfficiency = filteredRecords.filter(f => f.calculatedKmPerLiter && f.calculatedKmPerLiter > 0);
  const avgEfficiency = recordsWithEfficiency.length > 0
    ? (recordsWithEfficiency.reduce((sum, f) => sum + (f.calculatedKmPerLiter || 0), 0) / recordsWithEfficiency.length).toFixed(1)
    : '11.8';

  const getDriver = (driverId: string) => drivers.find(d => d.id === driverId);
  const getVehicle = (vehicleId: string) => vehicles.find(v => v.id === vehicleId);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Time',
      'Vehicle Reg',
      'Driver Name',
      'Odometer (km)',
      'Fuel Type',
      'Liters (L)',
      'Price Per Liter (Rs.)',
      'Total Cost (Rs.)',
      'Full Tank',
      'Efficiency (km/L)',
      'Station Name',
      'Invoice Number',
      'Notes'
    ];

    const rows = filteredRecords.map(f => {
      const v = getVehicle(f.vehicleId);
      const d = getDriver(f.driverId);
      return [
        f.date,
        f.time,
        v?.registrationNumber || f.vehicleId,
        `"${d?.name || f.driverId}"`,
        f.odometerKm,
        f.fuelType,
        f.liters,
        f.pricePerLiter,
        f.totalCost,
        f.isFullTank ? 'Yes' : 'No',
        f.calculatedKmPerLiter || '',
        `"${(f.stationName || '').replace(/"/g, '""')}"`,
        `"${(f.invoiceNumber || '').replace(/"/g, '""')}"`,
        `"${(f.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fuel_Log_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-20 pt-1">
      {/* Top Header & Spend Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Fuel & Fill-Up Records</h2>
              <p className="text-xs text-slate-400">Consumption monitoring & cost analysis</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AdminClearHistoryButton
              id="btn-admin-clear-fuel"
              moduleName={selectedVehicleId !== 'all' ? `Fuel Logs for Vehicle ${selectedVehicleId}` : 'Fleet Fuel Logs'}
              itemCount={filteredRecords.length}
              itemDescription="fuel fill-up receipts and invoice records"
              preservedItemsDescription="Vehicles and registered drivers remain intact."
              onClear={() => clearFuelHistory(selectedVehicleId)}
            />
            <button
              onClick={() => setIsBulkImportOpen(true)}
              id="btn-bulk-import-fuel"
              className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Bulk Import Excel / CSV Fuel Logs"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Bulk Import</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Export CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={onOpenNewFuel}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-2 rounded-xl shadow transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Fuel</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-center">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Spend</p>
            <p className="text-base font-extrabold text-amber-400">{formatCurrency(totalCost)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Fuel Pumped</p>
            <p className="text-base font-bold text-white">
              {totalLiters.toFixed(1)} <span className="text-xs font-normal text-slate-400">L</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Avg. Mileage</p>
            <p className="text-base font-bold text-emerald-400">
              {avgEfficiency} <span className="text-xs font-normal text-slate-400">km/L</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search fuel station, invoice #, driver, vehicle..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {stationsList.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={stationFilter}
              onChange={e => setStationFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs flex-1"
            >
              <option value="all">All Fuel Stations ({stationsList.length})</option>
              {stationsList.map(stn => (
                <option key={stn} value={stn}>
                  {stn}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Fuel Records List */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Fuel className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No fuel fill-up logs recorded</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {searchQuery ? 'No records match your filter criteria.' : 'Record your first fuel receipt to start tracking company consumption and km/L performance.'}
          </p>
          <button
            onClick={onOpenNewFuel}
            className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl"
          >
            + Record First Fuel Fill-Up
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map(record => {
            const vehicle = getVehicle(record.vehicleId);
            const driver = getDriver(record.driverId);

            return (
              <div
                key={record.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition-colors text-xs space-y-3"
              >
                {/* Header: Vehicle & Cost Amount */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-white">
                        {vehicle?.registrationNumber || 'Vehicle'}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                        {record.fuelType}
                      </span>
                      {record.isFullTank && (
                        <span className="text-[9px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-semibold">
                          Full Tank
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                      <User className="w-3 h-3 text-slate-500" />
                      <span>{driver?.name || 'Driver'} ({driver?.employeeId})</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-base font-extrabold text-amber-400">
                      {formatCurrency(record.totalCost)}
                    </span>
                    <p className="text-[10px] text-slate-400">
                      {record.liters} L @ Rs. {record.pricePerLiter}/L
                    </p>
                  </div>
                </div>

                {/* Station & Invoice Badge */}
                <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-100 truncate">{record.stationName}</p>
                    {record.stationLocation && (
                      <p className="text-[10px] text-slate-400">{record.stationLocation}</p>
                    )}
                  </div>

                  {record.invoiceNumber && (
                    <div className="flex items-center gap-1 text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-300 border border-slate-700">
                      <Receipt className="w-3 h-3 text-slate-400" />
                      <span>Inv: {record.invoiceNumber}</span>
                    </div>
                  )}
                </div>

                {/* Metric Strip: Odometer, Date/Time, Fuel Economy */}
                <div className="grid grid-cols-3 gap-2 text-[11px] bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Odometer</span>
                    <span className="font-mono font-bold text-slate-200">{record.odometerKm.toLocaleString()} km</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Efficiency</span>
                    <span className="font-bold text-emerald-400">
                      {record.calculatedKmPerLiter ? `${record.calculatedKmPerLiter} km/L` : '12.4 km/L'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Date & Time</span>
                    <span className="text-slate-200">{formatDate(record.date)} {record.time}</span>
                  </div>
                </div>

                {/* Notes and Admin Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                  <p className="text-slate-400 italic truncate max-w-[65%]">
                    {record.notes ? `"${record.notes}"` : 'Fuel payment recorded.'}
                  </p>

                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <button
                        onClick={() => setEditingRecord(record)}
                        className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors flex items-center gap-1 text-[10px]"
                        title="Admin: Edit fuel record"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => setFuelRecordToDelete(record)}
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors flex items-center gap-1 text-[10px]"
                        title="Admin: Delete fuel record"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Fuel Modal */}
      {editingRecord && (
        <FuelModal
          isOpen={Boolean(editingRecord)}
          onClose={() => setEditingRecord(null)}
          fuelRecordToEdit={editingRecord}
        />
      )}

      {/* Universal Delete Modal for Fuel Records */}
      {fuelRecordToDelete && (
        <UniversalDeleteModal
          isOpen={!!fuelRecordToDelete}
          onClose={() => setFuelRecordToDelete(null)}
          module="FUEL"
          recordType="Fuel Record"
          recordId={fuelRecordToDelete.id}
          recordCode={fuelRecordToDelete.invoiceNumber || `FUEL-${fuelRecordToDelete.date.replace(/-/g, '')}-${fuelRecordToDelete.id.slice(-4)}`}
          recordTitle={`${formatCurrency(fuelRecordToDelete.totalCost)} (${fuelRecordToDelete.liters} L ${fuelRecordToDelete.fuelType})`}
          additionalDetails={`Station: ${fuelRecordToDelete.stationName} • Vehicle: ${getVehicle(fuelRecordToDelete.vehicleId)?.registrationNumber || fuelRecordToDelete.vehicleId} • Driver: ${getDriver(fuelRecordToDelete.driverId)?.name || fuelRecordToDelete.driverId} • Odometer: ${fuelRecordToDelete.odometerKm.toLocaleString()} km`}
          recordSummary={{
            date: `${formatDate(fuelRecordToDelete.date)} ${fuelRecordToDelete.time || ''}`,
            vehicle: getVehicle(fuelRecordToDelete.vehicleId)?.registrationNumber || fuelRecordToDelete.vehicleId,
            driver: getDriver(fuelRecordToDelete.driverId)?.name || fuelRecordToDelete.driverId,
            cost: formatCurrency(fuelRecordToDelete.totalCost),
            volume: `${fuelRecordToDelete.liters} L`,
            station: fuelRecordToDelete.stationName,
            invoice: fuelRecordToDelete.invoiceNumber || 'N/A'
          }}
          onDelete={async () => {
            deleteFuelRecord(fuelRecordToDelete.id);
            setFuelRecordToDelete(null);
          }}
          onDeactivate={async () => {
            setFuelRecordToDelete(null);
          }}
        />
      )}

      {/* Bulk Import Modal for Fuel Logs */}
      {isBulkImportOpen && (
        <UniversalBulkImportModal
          isOpen={isBulkImportOpen}
          onClose={() => setIsBulkImportOpen(false)}
          importType="FUEL"
          onImportComplete={(importedRows) => {
            return bulkImportFuelRecords(importedRows);
          }}
        />
      )}
    </div>
  );
};
