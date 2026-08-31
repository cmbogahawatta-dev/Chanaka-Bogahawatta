import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  Car,
  User,
  Gauge,
  Fuel,
  CheckCircle2,
  FileText,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { formatDate } from '../../utils/helpers';
import { VehicleTransfer } from '../../types';
import { NewTransferModal } from './NewTransferModal';
import { TransferDetailModal } from './TransferDetailModal';
import { AdminClearHistoryButton } from '../common/AdminClearHistoryButton';

interface VehicleTransferViewProps {
  onOpenNewTransfer: () => void;
  selectedTransferForView: VehicleTransfer | null;
  setSelectedTransferForView: (transfer: VehicleTransfer | null) => void;
}

export const VehicleTransferView: React.FC<VehicleTransferViewProps> = ({
  onOpenNewTransfer,
  selectedTransferForView,
  setSelectedTransferForView
}) => {
  const {
    vehicles,
    drivers,
    transfers,
    clearTransfersHistory,
    selectedVehicleId
  } = useFleet();

  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filter transfers
  const filteredTransfers = transfers.filter(transfer => {
    if (selectedVehicleId !== 'all' && transfer.vehicleId !== selectedVehicleId) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const veh = vehicles.find(v => v.id === transfer.vehicleId);
      const fromDrv = drivers.find(d => d.id === transfer.fromDriverId);
      const toDrv = drivers.find(d => d.id === transfer.toDriverId);
      const match = `${transfer.handoverLocation} ${transfer.transferReason} ${transfer.inspectionNotes} ${veh?.registrationNumber} ${fromDrv?.name} ${toDrv?.name}`.toLowerCase();
      if (!match.includes(q)) return false;
    }
    return true;
  });

  const getDriver = (driverId: string) => drivers.find(d => d.id === driverId);
  const getVehicle = (vehicleId: string) => vehicles.find(v => v.id === vehicleId);

  const handleCardClick = (transfer: VehicleTransfer) => {
    setSelectedTransferForView(transfer);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-4 pb-20 pt-1">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Driver-to-Driver Vehicle Transfers</h2>
              <p className="text-xs text-slate-400">Custody handovers & initial condition inspection audit</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AdminClearHistoryButton
              id="btn-admin-clear-transfers"
              moduleName={selectedVehicleId !== 'all' ? `Transfer Records for Vehicle ${selectedVehicleId}` : 'Vehicle Transfers'}
              itemCount={filteredTransfers.length}
              itemDescription="driver handover inspection audit logs"
              preservedItemsDescription="Vehicles and registered drivers remain intact."
              onClear={() => clearTransfersHistory(selectedVehicleId)}
            />
            <button
              onClick={onOpenNewTransfer}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Transfer Vehicle</span>
            </button>
          </div>
        </div>

        {/* Feature Explainer Strip */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Records initial odometer, fuel %, body state & driver sign-offs
          </span>
          <span className="font-bold text-slate-200">{transfers.length} Transfers Logged</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search vehicle reg, releasing driver, receiving driver, location..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Transfers List */}
      {filteredTransfers.length === 0 ? (
        <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No vehicle transfer records found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {searchQuery ? 'No records match search.' : 'Hand over a vehicle from one driver to another with comprehensive initial physical condition inspection.'}
          </p>
          <button
            onClick={onOpenNewTransfer}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
          >
            + Initiate First Vehicle Transfer
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransfers.map(transfer => {
            const vehicle = getVehicle(transfer.vehicleId);
            const fromDriver = getDriver(transfer.fromDriverId);
            const toDriver = getDriver(transfer.toDriverId);
            const c = transfer.conditionChecklist;

            return (
              <div
                key={transfer.id}
                onClick={() => handleCardClick(transfer)}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 shadow-sm cursor-pointer transition-all text-xs space-y-3 group"
              >
                {/* Vehicle Header & Transfer Date */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white">
                        {vehicle?.registrationNumber || 'Vehicle'}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                        {vehicle?.make} {vehicle?.model}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {transfer.handoverLocation}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {formatDate(transfer.transferDate)} ({transfer.transferTime})
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 mt-0.5 inline-block">
                      Handover Complete
                    </span>
                  </div>
                </div>

                {/* Transfer Driver Flow Diagram */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">
                      Releasing Driver
                    </span>
                    <p className="font-bold text-slate-200 truncate mt-0.5">
                      {fromDriver?.name || transfer.releasingDriverSignName}
                    </p>
                    <span className="text-[10px] text-slate-500">EMP: {fromDriver?.employeeId || 'N/A'}</span>
                  </div>

                  <div className="flex flex-col items-center px-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[9px] text-emerald-400 font-semibold mt-0.5">Transferred</span>
                  </div>

                  <div className="min-w-0 flex-1 text-right">
                    <span className="text-[9px] uppercase font-bold text-emerald-400 block">
                      Receiving Driver
                    </span>
                    <p className="font-bold text-emerald-300 truncate mt-0.5">
                      {toDriver?.name || transfer.receivingDriverSignName}
                    </p>
                    <span className="text-[10px] text-slate-500">EMP: {toDriver?.employeeId || 'N/A'}</span>
                  </div>
                </div>

                {/* Initial Record at Handover Summary Strip */}
                <div className="grid grid-cols-3 gap-2 text-[11px] bg-slate-850 p-2.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Odo at Transfer</span>
                    <span className="font-mono font-bold text-blue-400">
                      {transfer.odometerAtTransferKm.toLocaleString()} km
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Fuel Level</span>
                    <span className="font-bold text-amber-400">
                      {transfer.fuelLevelPercent}% Tank
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Body Condition</span>
                    <span className="font-semibold text-slate-200">
                      {c?.exteriorBody || 'Good'}
                    </span>
                  </div>
                </div>

                {/* Initial Inspection Remarks Snapshot & View Button */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                  <p className="text-slate-400 italic truncate max-w-[65%]">
                    "{transfer.inspectionNotes || transfer.damageRemarks || 'Inspection verified.'}"
                  </p>

                  <button className="text-emerald-400 group-hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors">
                    <span>View Initial Record</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && (
        <TransferDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTransferForView(null);
          }}
          transfer={selectedTransferForView}
        />
      )}
    </div>
  );
};
