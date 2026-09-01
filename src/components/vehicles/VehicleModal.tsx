import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Car,
  AlertCircle,
  Calendar,
  Gauge,
  Fuel,
  ShieldCheck,
  Building,
  Sparkles,
  Upload,
  Loader2,
  CheckCircle2,
  FileCheck,
  Layers,
  Radio,
  Trash2
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { Vehicle, FuelType, GPSProvider } from '../../types';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleToEdit?: Vehicle | null;
  onDeleteRequest?: (vehicle: Vehicle) => void;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  vehicleToEdit,
  onDeleteRequest
}) => {
  const { drivers, addVehicle, updateVehicle, gpsConfig } = useFleet();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [registrationNumber, setRegistrationNumber] = useState<string>('');
  const [make, setMake] = useState<string>('Toyota');
  const [model, setModel] = useState<string>('');
  const [year, setYear] = useState<number>(2022);
  const [type, setType] = useState<'Sedan' | 'SUV' | 'Pickup' | 'Van' | 'Lorry / Truck' | 'Motorcycle'>('Pickup');
  const [fuelType, setFuelType] = useState<FuelType>('Diesel');
  const [tankCapacityLiters, setTankCapacityLiters] = useState<number>(75);
  const [currentOdometerKm, setCurrentOdometerKm] = useState<number>(45000);
  const [currentDriverId, setCurrentDriverId] = useState<string>('');
  const [department, setDepartment] = useState<string>('Logistics & Operations');
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState<string>('2027-01-31');
  const [revenueLicenseExpiryDate, setRevenueLicenseExpiryDate] = useState<string>('2026-12-31');
  const [chassisNumber, setChassisNumber] = useState<string>('');
  const [engineNumber, setEngineNumber] = useState<string>('');
  const [gpsDeviceId, setGpsDeviceId] = useState<string>('');
  const [gpsProvider, setGpsProvider] = useState<GPSProvider>('protrack');
  const [gpsAutoOdometerSync, setGpsAutoOdometerSync] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [registrationDocUrl, setRegistrationDocUrl] = useState<string>('');

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanSuccessMsg, setScanSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (vehicleToEdit) {
      setRegistrationNumber(vehicleToEdit.registrationNumber);
      setMake(vehicleToEdit.make);
      setModel(vehicleToEdit.model);
      setYear(vehicleToEdit.year);
      setType(vehicleToEdit.type);
      setFuelType(vehicleToEdit.fuelType);
      setTankCapacityLiters(vehicleToEdit.tankCapacityLiters);
      setCurrentOdometerKm(vehicleToEdit.currentOdometerKm);
      setCurrentDriverId(vehicleToEdit.currentDriverId || '');
      setDepartment(vehicleToEdit.department);
      setInsuranceExpiryDate(vehicleToEdit.insuranceExpiryDate);
      setRevenueLicenseExpiryDate(vehicleToEdit.revenueLicenseExpiryDate);
      setChassisNumber(vehicleToEdit.chassisNumber || '');
      setEngineNumber(vehicleToEdit.engineNumber || '');
      setGpsDeviceId(vehicleToEdit.gpsDeviceId || '');
      setGpsProvider(vehicleToEdit.gpsProvider || gpsConfig.provider || 'protrack');
      setGpsAutoOdometerSync(vehicleToEdit.gpsAutoOdometerSync ?? true);
      setNotes(vehicleToEdit.notes || '');
      setRegistrationDocUrl(vehicleToEdit.registrationDocUrl || '');
    } else {
      setRegistrationNumber('WP-');
      setMake('Toyota');
      setModel('');
      setYear(2023);
      setType('Pickup');
      setFuelType('Diesel');
      setTankCapacityLiters(75);
      setCurrentOdometerKm(35000);
      setCurrentDriverId('');
      setDepartment('Logistics & Operations');
      setInsuranceExpiryDate('2027-03-31');
      setRevenueLicenseExpiryDate('2026-12-31');
      setChassisNumber('');
      setEngineNumber('');
      setGpsDeviceId('');
      setGpsProvider(gpsConfig.provider || 'protrack');
      setGpsAutoOdometerSync(true);
      setNotes('');
      setRegistrationDocUrl('');
    }
    setScanSuccessMsg('');
    setErrorMsg('');
  }, [isOpen, vehicleToEdit]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setRegistrationDocUrl(base64Data);
      setIsScanning(true);
      setErrorMsg('');
      setScanSuccessMsg('');

      try {
        const response = await fetch('/api/ai/scan-vehicle-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64Data,
            mimeType: file.type || 'image/jpeg'
          })
        });

        const data = await response.json();
        if (response.ok && data.success && data.data) {
          const doc = data.data;
          if (doc.registrationNumber) setRegistrationNumber(doc.registrationNumber);
          if (doc.make) setMake(doc.make);
          if (doc.model) setModel(doc.model);
          if (doc.year) setYear(Number(doc.year));
          if (doc.type) setType(doc.type);
          if (doc.fuelType) setFuelType(doc.fuelType);
          if (doc.tankCapacityLiters) setTankCapacityLiters(Number(doc.tankCapacityLiters));
          if (doc.currentOdometerKm) setCurrentOdometerKm(Number(doc.currentOdometerKm));
          if (doc.chassisNumber) setChassisNumber(doc.chassisNumber);
          if (doc.engineNumber) setEngineNumber(doc.engineNumber);
          if (doc.insuranceExpiryDate) setInsuranceExpiryDate(doc.insuranceExpiryDate);
          if (doc.revenueLicenseExpiryDate) setRevenueLicenseExpiryDate(doc.revenueLicenseExpiryDate);
          if (doc.department) setDepartment(doc.department);

          setScanSuccessMsg('Vehicle credentials extracted & autofilled with Gemini AI!');
        } else {
          setErrorMsg(data.error || 'Could not parse document. You can still input manually.');
        }
      } catch (err: any) {
        console.error('Scan error:', err);
        setErrorMsg('Network error scanning document. You can still enter details manually.');
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!registrationNumber.trim()) {
      setErrorMsg('Please enter vehicle registration number.');
      return;
    }
    if (!make.trim() || !model.trim()) {
      setErrorMsg('Please specify vehicle make and model.');
      return;
    }
    if (currentOdometerKm < 0) {
      setErrorMsg('Odometer reading cannot be negative.');
      return;
    }

    if (vehicleToEdit) {
      updateVehicle(vehicleToEdit.id, {
        registrationNumber,
        make,
        model,
        year: Number(year),
        type,
        fuelType,
        tankCapacityLiters: Number(tankCapacityLiters),
        currentOdometerKm: Number(currentOdometerKm),
        currentDriverId,
        department,
        insuranceExpiryDate,
        revenueLicenseExpiryDate,
        chassisNumber: chassisNumber || undefined,
        engineNumber: engineNumber || undefined,
        gpsDeviceId: gpsDeviceId.trim() || undefined,
        gpsProvider: gpsDeviceId.trim() ? gpsProvider : undefined,
        gpsAutoOdometerSync: gpsDeviceId.trim() ? gpsAutoOdometerSync : undefined,
        registrationDocUrl: registrationDocUrl || undefined,
        notes
      });
    } else {
      addVehicle({
        registrationNumber,
        make,
        model,
        year: Number(year),
        type,
        fuelType,
        tankCapacityLiters: Number(tankCapacityLiters),
        currentOdometerKm: Number(currentOdometerKm),
        currentDriverId,
        department,
        insuranceExpiryDate,
        revenueLicenseExpiryDate,
        chassisNumber: chassisNumber || undefined,
        engineNumber: engineNumber || undefined,
        gpsDeviceId: gpsDeviceId.trim() || undefined,
        gpsProvider: gpsDeviceId.trim() ? gpsProvider : undefined,
        gpsAutoOdometerSync: gpsDeviceId.trim() ? gpsAutoOdometerSync : undefined,
        registrationDocUrl: registrationDocUrl || undefined,
        status: 'active',
        notes
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {vehicleToEdit ? 'Edit Vehicle Info' : 'Register New Company Vehicle'}
              </h2>
              <p className="text-[11px] text-slate-400">Specifications, registration book, and insurance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs flex-1">
          {/* AI Vehicle Document Upload & Autofill Card */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-500/30">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <span className="font-semibold text-white text-xs">AI Smart Document Autofill</span>
                  <p className="text-[11px] text-slate-400">
                    Upload Vehicle Registration Certificate (CR Book) or Insurance to auto-fill
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    {registrationDocUrl ? 'Rescan Document' : 'Upload Document'}
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {/* Scanning Indicator or Result */}
            {isScanning && (
              <div className="mt-3 p-2.5 rounded-lg bg-blue-900/30 border border-blue-500/30 flex items-center gap-2 text-blue-200 text-xs animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span>Gemini AI is parsing vehicle registration details & chassis credentials...</span>
              </div>
            )}

            {scanSuccessMsg && (
              <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{scanSuccessMsg}</span>
              </div>
            )}

            {registrationDocUrl && !isScanning && (
              <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span className="truncate flex-1">Registration / Title Document Attached</span>
                <span className="text-emerald-400 font-medium">Ready</span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Registration Number, Make & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Plate / Reg # <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. WP-CAB-8492"
                value={registrationNumber}
                onChange={e => setRegistrationNumber(e.target.value.toUpperCase())}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Make <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Toyota"
                value={make}
                onChange={e => setMake(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Model <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Hilux Revo 4x4"
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Year, Category, Fuel Type */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Manufacture Year</label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Vehicle Category</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="Pickup">Pickup</option>
                <option value="Van">Van / Microbus</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Lorry / Truck">Lorry / Truck</option>
                <option value="Motorcycle">Motorcycle</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Fuel Type</label>
              <select
                value={fuelType}
                onChange={e => setFuelType(e.target.value as FuelType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="Diesel">Diesel</option>
                <option value="Petrol (92/95)">Petrol (92/95)</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Electric">Electric</option>
                <option value="CNG">CNG</option>
              </select>
            </div>
          </div>

          {/* Odometer, Tank Capacity, Assigned Driver */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Current Odometer (km)</label>
              <input
                type="number"
                value={currentOdometerKm}
                onChange={e => setCurrentOdometerKm(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tank Capacity (Liters)</label>
              <input
                type="number"
                value={tankCapacityLiters}
                onChange={e => setTankCapacityLiters(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Assigned Driver</label>
              <select
                value={currentDriverId}
                onChange={e => setCurrentDriverId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Unassigned / Pool --</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.employeeId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chassis and Engine Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Chassis Number / VIN</label>
              <input
                type="text"
                placeholder="e.g. MROBA3CD4001928"
                value={chassisNumber}
                onChange={e => setChassisNumber(e.target.value.toUpperCase())}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Engine Serial Number</label>
              <input
                type="text"
                placeholder="e.g. 1GD-8910293"
                value={engineNumber}
                onChange={e => setEngineNumber(e.target.value.toUpperCase())}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Department, Insurance & Revenue Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Insurance Expiry</label>
              <input
                type="date"
                value={insuranceExpiryDate}
                onChange={e => setInsuranceExpiryDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Revenue License Expiry</label>
              <input
                type="date"
                value={revenueLicenseExpiryDate}
                onChange={e => setRevenueLicenseExpiryDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* GPS Hardware Tracker Section */}
          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-blue-400" />
                GPS Tracker Integration (Protrack / Traccar)
              </span>
              <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded font-mono">
                Auto-Telemetry
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tracker IMEI / Serial Number</label>
                <input
                  type="text"
                  placeholder="e.g. 868120349201948"
                  value={gpsDeviceId}
                  onChange={e => setGpsDeviceId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">GPS Platform / Protocol</label>
                <select
                  value={gpsProvider}
                  onChange={e => setGpsProvider(e.target.value as GPSProvider)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="protrack">Protrack 365 Open API</option>
                  <option value="traccar">Traccar Gateway</option>
                  <option value="teltonika">Teltonika Tracker</option>
                  <option value="gt06">GT06 / Coban Direct</option>
                </select>
              </div>
            </div>

            {gpsDeviceId.trim() && (
              <label className="flex items-center gap-2 pt-1 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gpsAutoOdometerSync}
                  onChange={e => setGpsAutoOdometerSync(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-700"
                />
                <span>Automatically synchronize vehicle odometer with incoming GPS telemetry</span>
              </label>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Equipment / Vehicle Notes</label>
            <input
              type="text"
              placeholder="e.g. Equipped with hardtop canopy and dual AC"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            {vehicleToEdit && onDeleteRequest ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteRequest(vehicleToEdit);
                }}
                className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-500/30 hover:border-red-500/60 font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Vehicle</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md transition-colors flex items-center gap-1.5 text-xs"
              >
                <Car className="w-4 h-4" />
                {vehicleToEdit ? 'Save Vehicle Info' : 'Register Vehicle'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
