import React, { useState, useMemo } from 'react';
import {
  Radio,
  Navigation,
  Activity,
  Zap,
  RefreshCw,
  Gauge,
  Compass,
  MapPin,
  Car,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  ExternalLink,
  Layers,
  Search,
  Filter,
  ShieldCheck
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { GPSTelemetry, Vehicle } from '../../types';
import { GPSService } from '../../services/gps/gpsService';
import { GPSGatewayModal } from './GPSGatewayModal';
import { PairGPSTrackerModal } from './PairGPSTrackerModal';

interface LiveGPSMapViewProps {
  onOpenTripModal?: (vehicleId: string) => void;
}

export const LiveGPSMapView: React.FC<LiveGPSMapViewProps> = () => {
  const {
    vehicles,
    drivers,
    allEnterpriseVehicles,
    gpsConfig,
    gpsTelemetries,
    getVehicleTelemetry,
    simulateGpsMotion,
    syncOdometerFromGps,
    syncAllOdometersFromGps
  } = useFleet();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    vehicles[0]?.id || 'veh-1'
  );
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [pairingVehicle, setPairingVehicle] = useState<Vehicle | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isSimulatingLive, setIsSimulatingLive] = useState<boolean>(true);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [mapLayer, setMapLayer] = useState<'satellite' | 'street' | 'dark'>('dark');

  // Selected vehicle & telemetry
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];
  const selectedDriver = drivers.find(d => d.id === selectedVehicle?.currentDriverId);
  const activeTelemetry = selectedVehicle ? getVehicleTelemetry(selectedVehicle.id) : undefined;

  // Filtered vehicle list for the sidebar / bottom tray
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const tele = getVehicleTelemetry(v.id);
      if (statusFilter !== 'all') {
        if (statusFilter === 'moving' && tele?.deviceStatus !== 'moving') return false;
        if (statusFilter === 'stopped' && tele?.deviceStatus !== 'stopped') return false;
        if (statusFilter === 'unpaired' && v.gpsDeviceId) return false;
        if (statusFilter === 'paired' && !v.gpsDeviceId) return false;
      }
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matchesPlate = v.registrationNumber.toLowerCase().includes(q);
        const matchesModel = `${v.make} ${v.model}`.toLowerCase().includes(q);
        const matchesImei = v.gpsDeviceId?.toLowerCase().includes(q);
        if (!matchesPlate && !matchesModel && !matchesImei) return false;
      }
      return true;
    });
  }, [vehicles, searchFilter, statusFilter, gpsTelemetries]);

  // Historical trail for the selected vehicle
  const historyPoints = useMemo(() => {
    if (!selectedVehicle) return [];
    const centerLat = activeTelemetry?.latitude || 6.9271;
    const centerLng = activeTelemetry?.longitude || 79.8612;
    return GPSService.getHistoricalRoute(selectedVehicle.id, centerLat, centerLng);
  }, [selectedVehicleId, activeTelemetry?.latitude, activeTelemetry?.longitude]);

  const handleSyncSingleOdo = () => {
    if (!selectedVehicle) return;
    const newOdo = syncOdometerFromGps(selectedVehicle.id);
    if (newOdo) {
      setSyncToast(`Odometer synchronized to ${newOdo.toLocaleString()} km for ${selectedVehicle.registrationNumber}`);
      setTimeout(() => setSyncToast(null), 3000);
    }
  };

  const handleSyncAll = () => {
    const res = syncAllOdometersFromGps();
    if (res.updatedCount > 0) {
      setSyncToast(`Synchronized odometers for ${res.updatedCount} vehicles!`);
    } else {
      setSyncToast('All odometers are currently up-to-date with GPS.');
    }
    setTimeout(() => setSyncToast(null), 3000);
  };

  // Status stats
  const movingCount = vehicles.filter(v => getVehicleTelemetry(v.id)?.deviceStatus === 'moving').length;
  const stoppedCount = vehicles.filter(v => getVehicleTelemetry(v.id)?.deviceStatus === 'stopped').length;
  const pairedCount = vehicles.filter(v => !!v.gpsDeviceId).length;

  return (
    <div className="space-y-4 pb-20 pt-1">
      {/* Top Banner / Integration Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-inner">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Protrack & GPS Live Tracking
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  {gpsConfig.provider.toUpperCase()} Gateway Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time satellite tracking, instant speeds, ignition detection & automated mileage sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              Gateway Settings
            </button>
            <button
              onClick={simulateGpsMotion}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/30"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Ping Fleet
            </button>
          </div>
        </div>

        {/* Fleet telemetry metrics strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3.5 border-t border-slate-800 text-xs">
          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Trackers Linked</span>
            <p className="text-sm font-bold text-white mt-0.5">
              {pairedCount} <span className="text-slate-500 font-normal">/ {vehicles.length} vehicles</span>
            </p>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-emerald-400 uppercase font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              In Motion
            </span>
            <p className="text-sm font-bold text-emerald-300 mt-0.5">
              {movingCount} vehicles
            </p>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
              Parked / Idling
            </span>
            <p className="text-sm font-bold text-slate-300 mt-0.5">
              {stoppedCount} vehicles
            </p>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-blue-400 uppercase font-semibold">Odometer Guard</span>
            <p className="text-sm font-bold text-blue-300 mt-0.5">
              {gpsConfig.autoSyncOdometer ? 'Automated Sync ON' : 'Manual Sync'}
            </p>
          </div>
        </div>
      </div>

      {/* Sync Toast Alert */}
      {syncToast && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-2xl text-xs font-semibold text-emerald-300 flex items-center justify-between shadow-lg">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {syncToast}
          </span>
        </div>
      )}

      {/* Main Interactive Map & Vehicle Telemetry HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Radar & Visual Map View (7 Cols on desktop) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col shadow-sm relative overflow-hidden min-h-[460px]">
          {/* Map Layer Toolbar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400 animate-spin-slow" />
              <span className="font-bold text-slate-200">
                Live Radar Canvas
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                • GPS / GLONASS Coordinates
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setMapLayer('dark')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                  mapLayer === 'dark'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Dark Radar
              </button>
              <button
                onClick={() => setMapLayer('street')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                  mapLayer === 'street'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Street Map
              </button>
              <button
                onClick={() => setMapLayer('satellite')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                  mapLayer === 'satellite'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Satellite
              </button>
            </div>
          </div>

          {/* Interactive SVG Radar & Geo Plot Stage */}
          <div className="relative flex-1 rounded-2xl bg-slate-950/90 border border-slate-800/80 my-3 overflow-hidden flex items-center justify-center">
            {/* Grid Pattern / Radar Concentric Circles */}
            <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {/* Radar Rings */}
              <circle cx="50%" cy="50%" r="80" fill="none" stroke="rgba(59, 130, 246, 0.25)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="50%" cy="50%" r="160" fill="none" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" />
              <circle cx="50%" cy="50%" r="240" fill="none" stroke="rgba(59, 130, 246, 0.15)" strokeWidth="1" />
              {/* Radar Crosshairs */}
              <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" />
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" />
            </svg>

            {/* Historical Trail Polyline */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <polyline
                points="120,320 180,280 240,240 310,210 390,200 460,180 520,150"
                fill="none"
                stroke="rgba(59, 130, 246, 0.6)"
                strokeWidth="3"
                strokeDasharray="6 4"
              />
            </svg>

            {/* Vehicle Interactive Markers Placed on Map */}
            {vehicles.map((v, index) => {
              const tele = getVehicleTelemetry(v.id);
              const isSelected = v.id === selectedVehicleId;
              const isMoving = tele?.deviceStatus === 'moving';

              // Relative positions for visualization
              const offsets = [
                { top: '35%', left: '55%' },
                { top: '65%', left: '28%' },
                { top: '48%', left: '72%' },
                { top: '75%', left: '80%' },
                { top: '22%', left: '40%' }
              ];
              const pos = offsets[index % offsets.length];

              return (
                <div
                  key={v.id}
                  style={{ top: pos.top, left: pos.left }}
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-transform ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-20'
                  }`}
                >
                  {/* Ping Ring for Moving Vehicles */}
                  {isMoving && (
                    <span className="absolute -inset-2 rounded-full bg-blue-500/30 animate-ping" />
                  )}

                  {/* Marker Pin */}
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white ring-4 ring-blue-500/40 shadow-blue-500/50'
                        : isMoving
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/40'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <Car className="w-5 h-5" />
                  </div>

                  {/* Marker Tooltip Plate */}
                  <div
                    className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-md transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white opacity-100'
                        : 'bg-slate-900 text-slate-300 border border-slate-700 opacity-80 group-hover:opacity-100'
                    }`}
                  >
                    {v.registrationNumber}
                    {tele && <span className="ml-1 text-[9px] font-normal text-blue-200">({tele.speedKmh} km/h)</span>}
                  </div>
                </div>
              );
            })}

            {/* Map Info Box Bottom Left */}
            <div className="absolute bottom-3 left-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md text-[11px] space-y-1 z-10">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span className="font-bold text-white">
                  {activeTelemetry?.address || 'Baseline Road, Colombo 09'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Lat: {activeTelemetry?.latitude?.toFixed(4) || '6.9271'}° N • Lng: {activeTelemetry?.longitude?.toFixed(4) || '79.8612'}° E
              </div>
            </div>

            {/* Live Speed HUD Bottom Right */}
            {activeTelemetry && (
              <div className="absolute bottom-3 right-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md text-right z-10">
                <span className="text-[9px] text-slate-400 uppercase font-semibold">GPS Speed</span>
                <p className="text-2xl font-black text-blue-400 leading-none mt-0.5">
                  {activeTelemetry.speedKmh}{' '}
                  <span className="text-xs text-slate-400 font-normal">km/h</span>
                </p>
                <span className="text-[9px] text-emerald-400 font-semibold">
                  Heading {activeTelemetry.headingDegrees}° NE
                </span>
              </div>
            )}
          </div>

          {/* Map Footer Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                In-Transit
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                Parked
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                Selected Vehicle
              </span>
            </div>

            <span className="text-[11px]">
              Last satellite pulse: <strong>{new Date().toLocaleTimeString()}</strong>
            </span>
          </div>
        </div>

        {/* Vehicle Telemetry Spotlight & Diagnostics (4 Cols on desktop) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Selected Vehicle Card */}
          {selectedVehicle ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                    {selectedVehicle.type} • {selectedVehicle.fuelType}
                  </span>
                  <h2 className="text-lg font-bold text-white tracking-tight mt-1.5">
                    {selectedVehicle.registrationNumber}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
                  </p>
                </div>

                <button
                  onClick={() => setPairingVehicle(selectedVehicle)}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-blue-300 transition-colors"
                >
                  {selectedVehicle.gpsDeviceId ? 'Edit IMEI' : '+ Pair GPS'}
                </button>
              </div>

              {/* Driver and Hardware IMEI */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Assigned Driver:</span>
                  <strong className="text-white">
                    {selectedDriver?.name || 'Unassigned'}
                  </strong>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Tracker Hardware:</span>
                  <span className="font-mono text-blue-400 font-bold">
                    {selectedVehicle.gpsDeviceId ? `IMEI: ${selectedVehicle.gpsDeviceId}` : 'Not Paired'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Ignition Status:</span>
                  <span
                    className={`font-semibold ${
                      activeTelemetry?.ignition ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {activeTelemetry?.ignition ? 'ON (Engine Running)' : 'OFF (Parked)'}
                  </span>
                </div>
              </div>

              {/* Odometer Comparison & Sync Action */}
              <div className="p-3.5 rounded-2xl bg-blue-600/10 border border-blue-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-[10px] text-blue-300 uppercase font-bold">Dashboard Meter</span>
                    <p className="text-base font-black text-white">
                      {selectedVehicle.currentOdometerKm.toLocaleString()} km
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-[10px] text-emerald-300 uppercase font-bold">GPS Verified</span>
                    <p className="text-base font-black text-emerald-400">
                      {activeTelemetry?.odometerKm?.toLocaleString() || selectedVehicle.currentOdometerKm.toLocaleString()} km
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSyncSingleOdo}
                  className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sync Vehicle Odometer from GPS
                </button>
              </div>

              {/* Telemetry Sensor Dashboard */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Live Sensor Telemetry
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Battery Level</span>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {activeTelemetry?.batteryVoltage || 13.6} V
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Fuel Level (Tank)</span>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {activeTelemetry?.fuelLevelPercent || 82}%
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Satellites Locked</span>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">
                      {activeTelemetry?.satellites || 14} Fixes
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400">GSM Signal</span>
                    <p className="text-sm font-bold text-blue-400 mt-0.5">
                      {activeTelemetry?.gsmSignal || 94}% (4G LTE)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center text-slate-400 text-xs">
              No vehicles available
            </div>
          )}
        </div>
      </div>

      {/* Fleet Vehicles Search and Filter Tray */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              All Fleet GPS Transponders
            </h2>
            <p className="text-xs text-slate-400">
              Quickly inspect, track or pair Protrack hardware across your enterprise assets
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Search plate or IMEI..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Vehicles</option>
              <option value="moving">In Motion Only</option>
              <option value="stopped">Parked / Idle</option>
              <option value="paired">GPS Linked Only</option>
              <option value="unpaired">Unpaired Only</option>
            </select>
          </div>
        </div>

        {/* Vehicles Table / List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredVehicles.map(veh => {
            const tele = getVehicleTelemetry(veh.id);
            const isSelected = veh.id === selectedVehicleId;
            const isMoving = tele?.deviceStatus === 'moving';

            return (
              <div
                key={veh.id}
                onClick={() => setSelectedVehicleId(veh.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500/40 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">
                        {veh.registrationNumber}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isMoving ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                        }`}
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      {veh.make} {veh.model}
                    </p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isMoving
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isMoving ? `${tele?.speedKmh} km/h` : 'Parked'}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-[11px] text-blue-400">
                    {veh.gpsDeviceId ? `IMEI: ...${veh.gpsDeviceId.slice(-6)}` : 'No GPS'}
                  </span>
                  <span>
                    Odo: <strong className="text-white">{veh.currentOdometerKm} km</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gateway Configuration Modal */}
      <GPSGatewayModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />

      {/* Pair GPS Modal */}
      <PairGPSTrackerModal
        isOpen={!!pairingVehicle}
        onClose={() => setPairingVehicle(null)}
        vehicle={pairingVehicle}
      />
    </div>
  );
};
