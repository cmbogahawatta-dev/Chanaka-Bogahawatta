import React from 'react';
import {
  X,
  ArrowRightLeft,
  Calendar,
  Clock,
  MapPin,
  Car,
  User,
  Gauge,
  Fuel,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ClipboardList
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { VehicleTransfer } from '../../types';
import { formatDate, formatDateTime } from '../../utils/helpers';

interface TransferDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transfer: VehicleTransfer | null;
}

export const TransferDetailModal: React.FC<TransferDetailModalProps> = ({
  isOpen,
  onClose,
  transfer
}) => {
  const { vehicles, drivers } = useFleet();

  if (!isOpen || !transfer) return null;

  const vehicle = vehicles.find(v => v.id === transfer.vehicleId);
  const fromDriver = drivers.find(d => d.id === transfer.fromDriverId);
  const toDriver = drivers.find(d => d.id === transfer.toDriverId);
  const c = transfer.conditionChecklist;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col print:border-none print:shadow-none print:max-h-none print:w-full print:bg-white print:text-black">
        {/* Header (Hidden in Print or Styled Cleanly) */}
        <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Initial Vehicle Record at Transfer Time</h2>
              <p className="text-[11px] text-slate-400">Official handover & physical inspection certificate</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Print Certificate</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1 print:p-6 print:text-black">
          {/* Certificate Header Banner */}
          <div className="border-b-2 border-emerald-500/40 pb-3 flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400 print:text-emerald-700">
                COMPANY FLEET ASSET MANAGEMENT
              </span>
              <h1 className="text-base font-extrabold text-white print:text-black tracking-tight">
                VEHICLE HANDOVER & INITIAL INSPECTION RECORD
              </h1>
              <p className="text-[11px] text-slate-400 print:text-gray-600">
                Document ID: #{transfer.id} • Recorded on {formatDateTime(transfer.transferDate, transfer.transferTime)}
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-emerald-500/15 text-emerald-400 print:text-emerald-800 border border-emerald-500/30 rounded-lg font-bold text-[11px]">
                OFFICIALLY EXECUTED
              </span>
            </div>
          </div>

          {/* Vehicle Information Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-950/70 print:bg-gray-100 rounded-xl border border-slate-800 print:border-gray-300 text-[11px]">
            <div>
              <span className="text-[10px] text-slate-400 print:text-gray-600 block font-medium">Registration Number</span>
              <span className="font-bold text-white print:text-black text-sm">{vehicle?.registrationNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 print:text-gray-600 block font-medium">Make & Model</span>
              <span className="font-semibold text-slate-200 print:text-black">{vehicle?.make} {vehicle?.model} ({vehicle?.year})</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 print:text-gray-600 block font-medium">Vehicle Category</span>
              <span className="text-slate-200 print:text-black">{vehicle?.type} • {vehicle?.fuelType}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 print:text-gray-600 block font-medium">Department</span>
              <span className="text-slate-200 print:text-black">{vehicle?.department}</span>
            </div>
          </div>

          {/* Driver Transfer Transfer-Flow Card */}
          <div className="p-3.5 bg-slate-850 print:bg-gray-50 rounded-xl border border-slate-800 print:border-gray-300">
            <span className="text-[10px] uppercase font-bold text-slate-400 print:text-gray-600 block mb-2">
              Driver Custody Handover
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Releasing Driver */}
              <div className="p-3 rounded-lg bg-slate-900 print:bg-white border border-slate-800 print:border-gray-200">
                <span className="text-[10px] font-bold text-slate-400 print:text-gray-600 uppercase">
                  Releasing Driver (Handed Over)
                </span>
                <p className="text-sm font-bold text-slate-100 print:text-black mt-0.5">
                  {fromDriver?.name || transfer.releasingDriverSignName}
                </p>
                <p className="text-[11px] text-slate-400 print:text-gray-600">
                  EMP ID: {fromDriver?.employeeId || 'N/A'} • License: {fromDriver?.licenseNumber || 'N/A'}
                </p>
              </div>

              {/* Receiving Driver */}
              <div className="p-3 rounded-lg bg-slate-900 print:bg-white border border-emerald-500/40 print:border-emerald-700">
                <span className="text-[10px] font-bold text-emerald-400 print:text-emerald-700 uppercase">
                  Receiving Driver (Accepted Custody)
                </span>
                <p className="text-sm font-bold text-emerald-300 print:text-emerald-900 mt-0.5">
                  {toDriver?.name || transfer.receivingDriverSignName}
                </p>
                <p className="text-[11px] text-slate-400 print:text-gray-600">
                  EMP ID: {toDriver?.employeeId || 'N/A'} • License: {toDriver?.licenseNumber || 'N/A'}
                </p>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-800 print:border-gray-300 flex items-center justify-between text-[11px] text-slate-400 print:text-gray-600">
              <span>Location: <strong className="text-slate-200 print:text-black">{transfer.handoverLocation}</strong></span>
              <span>Reason: <strong className="text-slate-200 print:text-black">{transfer.transferReason}</strong></span>
            </div>
          </div>

          {/* Initial Readings at Transfer Time (Odometer & Fuel) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-950/80 print:bg-gray-100 rounded-xl border border-slate-800 print:border-gray-300 text-center">
              <span className="text-[10px] uppercase font-bold text-blue-400 print:text-blue-700 block">
                Initial Odometer at Transfer
              </span>
              <p className="text-xl font-extrabold text-white print:text-black mt-1 font-mono">
                {transfer.odometerAtTransferKm.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400 print:text-gray-600">km</span>
              </p>
            </div>

            <div className="p-3 bg-slate-950/80 print:bg-gray-100 rounded-xl border border-slate-800 print:border-gray-300 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-400 print:text-amber-700 block">
                Initial Fuel Tank Level
              </span>
              <p className="text-xl font-extrabold text-amber-400 print:text-amber-800 mt-1 font-mono">
                {transfer.fuelLevelPercent}%{' '}
                <span className="text-xs font-normal text-slate-400 print:text-gray-600">
                  ({(transfer.fuelLevelPercent * (vehicle?.tankCapacityLiters || 60) / 100).toFixed(0)} L approx)
                </span>
              </p>
            </div>
          </div>

          {/* Physical & Mechanical Condition Matrix */}
          <div className="p-3.5 bg-slate-850 print:bg-gray-50 rounded-xl border border-slate-800 print:border-gray-300 space-y-2.5">
            <span className="text-[10px] uppercase font-bold text-emerald-400 print:text-emerald-700 block">
              1. Physical Inspection Status Matrix
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2 bg-slate-900 print:bg-white rounded-lg border border-slate-800 print:border-gray-200">
                <span className="text-[10px] text-slate-400 print:text-gray-600 block">Exterior Body:</span>
                <span className="font-semibold text-slate-200 print:text-black">{c.exteriorBody}</span>
              </div>
              <div className="p-2 bg-slate-900 print:bg-white rounded-lg border border-slate-800 print:border-gray-200">
                <span className="text-[10px] text-slate-400 print:text-gray-600 block">Windshield & Mirrors:</span>
                <span className="font-semibold text-slate-200 print:text-black">{c.windshieldAndMirrors}</span>
              </div>
              <div className="p-2 bg-slate-900 print:bg-white rounded-lg border border-slate-800 print:border-gray-200">
                <span className="text-[10px] text-slate-400 print:text-gray-600 block">Tires Condition:</span>
                <span className="font-semibold text-slate-200 print:text-black">{c.tiresAndTread}</span>
              </div>
              <div className="p-2 bg-slate-900 print:bg-white rounded-lg border border-slate-800 print:border-gray-200">
                <span className="text-[10px] text-slate-400 print:text-gray-600 block">Interior Cleanliness:</span>
                <span className="font-semibold text-slate-200 print:text-black">{c.interiorCleanliness}</span>
              </div>
              <div className="p-2 bg-slate-900 print:bg-white rounded-lg border border-slate-800 print:border-gray-200">
                <span className="text-[10px] text-slate-400 print:text-gray-600 block">AC & Electronics:</span>
                <span className="font-semibold text-slate-200 print:text-black">{c.acAndElectronics}</span>
              </div>
              <div className="p-2 bg-slate-900 print:bg-white rounded-lg border border-slate-800 print:border-gray-200">
                <span className="text-[10px] text-slate-400 print:text-gray-600 block">Dashboard Warnings:</span>
                <span className={`font-semibold ${c.warningLightsOnDashboard ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {c.warningLightsOnDashboard ? 'Active / Issue' : 'None / Clear'}
                </span>
              </div>
            </div>
          </div>

          {/* In-Car Equipment & Documents Audit Checklist */}
          <div className="p-3.5 bg-slate-850 print:bg-gray-50 rounded-xl border border-slate-800 print:border-gray-300 space-y-2">
            <span className="text-[10px] uppercase font-bold text-emerald-400 print:text-emerald-700 block">
              2. Vehicle Equipment & Documentation Inventory
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              {[
                { label: 'Spare Wheel & Jack', present: c.spareWheelAndJack },
                { label: 'Emergency Tool Kit', present: c.toolKitPresent },
                { label: 'Fire Extinguisher', present: c.fireExtinguisher },
                { label: 'First Aid Kit', present: c.firstAidKit },
                { label: 'Vehicle Reg Book', present: c.vehicleRegistrationBookPresent },
                { label: 'Insurance & Revenue Card', present: c.insuranceCardPresent },
                { label: 'Company Fuel Card', present: c.companyFuelCardPresent }
              ].map(item => (
                <div
                  key={item.label}
                  className="flex items-center gap-1.5 p-1.5 bg-slate-900 print:bg-white rounded-lg border border-slate-800 print:border-gray-200 text-[11px]"
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${item.present ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span className={item.present ? 'text-slate-200 print:text-black font-medium' : 'text-slate-500 line-through'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Handover Remarks and Damage Records */}
          <div className="p-3 bg-slate-950/70 print:bg-gray-100 rounded-xl border border-slate-800 print:border-gray-300 space-y-1.5 text-[11px]">
            <div>
              <span className="text-[10px] text-slate-400 print:text-gray-600 font-semibold block">Inspection Remarks:</span>
              <p className="text-slate-200 print:text-black italic">"{transfer.inspectionNotes || 'None'}"</p>
            </div>
            {transfer.damageRemarks && (
              <div className="pt-1.5 border-t border-slate-800 print:border-gray-300">
                <span className="text-[10px] text-amber-400 print:text-amber-800 font-semibold block">Pre-Existing Defects / Scratches Noted at Handover:</span>
                <p className="text-slate-300 print:text-gray-800">{transfer.damageRemarks}</p>
              </div>
            )}
          </div>

          {/* Legal Driver Sign-off Confirmation Box */}
          <div className="p-4 bg-slate-950/90 print:bg-white rounded-2xl border border-emerald-500/30 print:border-gray-400 space-y-3">
            <span className="text-[10px] uppercase font-bold text-emerald-400 print:text-emerald-800 block text-center">
              CERTIFIED SIGN-OFF & ACCEPTANCE OF CUSTODY
            </span>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="border-t border-slate-700 print:border-gray-400 pt-2 text-center">
                <p className="font-bold text-slate-200 print:text-black text-xs">
                  {transfer.releasingDriverSignName}
                </p>
                <p className="text-[10px] text-slate-400 print:text-gray-600">Releasing Driver Signature</p>
                <span className="text-[9px] text-emerald-400 print:text-emerald-800 font-semibold">
                  ✓ Verified & Discharged
                </span>
              </div>

              <div className="border-t border-slate-700 print:border-gray-400 pt-2 text-center">
                <p className="font-bold text-emerald-400 print:text-black text-xs">
                  {transfer.receivingDriverSignName}
                </p>
                <p className="text-[10px] text-slate-400 print:text-gray-600">Receiving Driver Signature</p>
                <span className="text-[9px] text-emerald-400 print:text-emerald-800 font-semibold">
                  ✓ Accepted In Described State
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-850 border-t border-slate-800 flex items-center justify-between print:hidden">
          <span className="text-[11px] text-slate-400">
            Official immutable audit entry
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
