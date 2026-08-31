import React, { useState } from 'react';
import {
  X,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Server,
  Zap,
  RefreshCw,
  Trash2,
  MapPin,
  Compass,
  Gauge,
  KeyRound
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { Vehicle, GPSProvider } from '../../types';

interface PairGPSTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
}

export const PairGPSTrackerModal: React.FC<PairGPSTrackerModalProps> = ({
  isOpen,
  onClose,
  vehicle
}) => {
  const { pairGpsDevice, unpairGpsDevice, getVehicleTelemetry, gpsConfig } = useFleet();

  const [deviceId, setDeviceId] = useState<string>(vehicle?.gpsDeviceId || '');
  const [provider, setProvider] = useState<GPSProvider>(vehicle?.gpsProvider || gpsConfig.provider || 'protrack');
  const [autoSyncOdo, setAutoSyncOdo] = useState<boolean>(vehicle?.gpsAutoOdometerSync ?? true);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!isOpen || !vehicle) return null;

  const currentTelemetry = getVehicleTelemetry(vehicle.id);
  const isPaired = !!vehicle.gpsDeviceId;

  const handlePair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceId.trim()) return;

    pairGpsDevice(vehicle.id, deviceId.trim(), provider, autoSyncOdo);
    setSuccessToast(`GPS Device paired to ${vehicle.registrationNumber}!`);
    setTimeout(() => {
      setSuccessToast(null);
      onClose();
    }, 1200);
  };

  const handleUnpair = () => {
    unpairGpsDevice(vehicle.id);
    setDeviceId('');
    setSuccessToast(`GPS Device unpaired.`);
    setTimeout(() => {
      setSuccessToast(null);
      onClose();
    }, 1200);
  };

  const generateSampleIMEI = () => {
    const random15 = '868' + Math.floor(100000000000 + Math.random() * 900000000000).toString();
    setDeviceId(random15);
  };

  return (
    <div
      id="pair-gps-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="pair-gps-modal-card"
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100 flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Pair GPS Hardware Tracker
              </h2>
              <p className="text-xs text-slate-400">
                {vehicle.registrationNumber} • {vehicle.make} {vehicle.model}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast */}
        {successToast && (
          <div className="px-6 py-2 bg-emerald-950/70 border-b border-emerald-800 text-xs font-semibold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handlePair} className="p-6 space-y-4">
          {/* Current Status banner */}
          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  isPaired ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'
                }`}
              />
              <span className="font-semibold text-slate-300">
                {isPaired ? 'Tracker Connected' : 'No Tracker Assigned'}
              </span>
            </div>
            {isPaired && (
              <span className="text-[11px] font-mono text-blue-400">
                IMEI: {vehicle.gpsDeviceId}
              </span>
            )}
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              GPS Platform Protocol
            </label>
            <select
              value={provider}
              onChange={e => setProvider(e.target.value as GPSProvider)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="protrack">Protrack 365 (Concox, Jimi, WanWay, GT06)</option>
              <option value="traccar">Traccar GPS Protocol</option>
              <option value="teltonika">Teltonika FMB / FMC Series</option>
              <option value="gt06">GT06 / Coban / TK103 Direct</option>
              <option value="custom_webhook">Custom Webhook Ingestion</option>
            </select>
          </div>

          {/* Device IMEI / Tracker ID */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-300">
                Device IMEI / Unique Serial Number
              </label>
              <button
                type="button"
                onClick={generateSampleIMEI}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold"
              >
                + Generate Valid IMEI
              </button>
            </div>
            <input
              type="text"
              required
              value={deviceId}
              onChange={e => setDeviceId(e.target.value)}
              placeholder="e.g. 868120349201948 (15-digit IMEI)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Found printed on the tracker hardware label or in the Protrack / Traccar device list.
            </p>
          </div>

          {/* Automated Odometer Sync Toggle */}
          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800 cursor-pointer hover:bg-slate-800/60 transition-colors">
            <input
              type="checkbox"
              checked={autoSyncOdo}
              onChange={e => setAutoSyncOdo(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-700 bg-slate-900"
            />
            <div>
              <div className="text-xs font-bold text-slate-200">
                Sync Vehicle Odometer with GPS Telemetry
              </div>
              <div className="text-[11px] text-slate-400">
                Keeps vehicle mileage in sync with GPS hardware telemetry without manual entry.
              </div>
            </div>
          </label>

          {/* Live Telemetry Preview if connected */}
          {currentTelemetry && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Live GPS Signal
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(currentTelemetry.lastUpdated).toLocaleTimeString()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400">
                <div>
                  Speed: <strong className="text-white">{currentTelemetry.speedKmh} km/h</strong>
                </div>
                <div>
                  Odo: <strong className="text-white">{currentTelemetry.odometerKm} km</strong>
                </div>
                <div>
                  Satellites: <strong className="text-emerald-400">{currentTelemetry.satellites || 12}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-800">
            {isPaired ? (
              <button
                type="button"
                onClick={handleUnpair}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Unpair Tracker
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all"
              >
                {isPaired ? 'Update Pairing' : 'Pair GPS Tracker'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
