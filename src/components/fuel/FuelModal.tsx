import React, { useState, useEffect } from 'react';
import { X, Fuel, AlertCircle, DollarSign, Gauge, Building, Receipt, Camera } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { FuelType, FuelRecord } from '../../types';

interface FuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  fuelRecordToEdit?: FuelRecord | null;
}

export const FuelModal: React.FC<FuelModalProps> = ({ isOpen, onClose, fuelRecordToEdit }) => {
  const { vehicles, drivers, selectedVehicleId, addFuelRecord, updateFuelRecord, fuelRecords } = useFleet();

  const defaultVehicleId = selectedVehicleId !== 'all' ? selectedVehicleId : (vehicles[0]?.id || '');
  const selectedVehicle = vehicles.find(v => v.id === defaultVehicleId);

  const [vehicleId, setVehicleId] = useState<string>(defaultVehicleId);
  const [driverId, setDriverId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>('09:00');
  const [odometerKm, setOdometerKm] = useState<number>(0);
  const [fuelType, setFuelType] = useState<FuelType>('Diesel');
  const [liters, setLiters] = useState<number>(45);
  const [pricePerLiter, setPricePerLiter] = useState<number>(340);
  const [stationName, setStationName] = useState<string>('Ceypetco Fuel Station');
  const [stationLocation, setStationLocation] = useState<string>('Main Road');
  const [isFullTank, setIsFullTank] = useState<boolean>(true);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (fuelRecordToEdit) {
      setVehicleId(fuelRecordToEdit.vehicleId);
      setDriverId(fuelRecordToEdit.driverId);
      setDate(fuelRecordToEdit.date);
      setTime(fuelRecordToEdit.time || '09:00');
      setOdometerKm(fuelRecordToEdit.odometerKm);
      setFuelType(fuelRecordToEdit.fuelType);
      setLiters(fuelRecordToEdit.liters);
      setPricePerLiter(fuelRecordToEdit.pricePerLiter);
      setStationName(fuelRecordToEdit.stationName || '');
      setStationLocation(fuelRecordToEdit.stationLocation || '');
      setIsFullTank(fuelRecordToEdit.isFullTank);
      setInvoiceNumber(fuelRecordToEdit.invoiceNumber || '');
      setNotes(fuelRecordToEdit.notes || '');
      return;
    }

    const v = vehicles.find(item => item.id === vehicleId) || vehicles[0];
    if (v) {
      setOdometerKm(v.currentOdometerKm);
      setFuelType(v.fuelType);
      if (v.currentDriverId) {
        setDriverId(v.currentDriverId);
      } else if (drivers[0]) {
        setDriverId(drivers[0].id);
      }
    }
  }, [fuelRecordToEdit, vehicleId, vehicles, drivers, isOpen]);

  if (!isOpen) return null;

  const totalCost = Number((liters * pricePerLiter).toFixed(2));

  // Compute calculated fuel economy (km/L) if previous full-tank log exists
  const computeKmPerLitre = () => {
    if (!isFullTank) return undefined;
    const prevFuelRecords = fuelRecords
      .filter(f => f.vehicleId === vehicleId && f.odometerKm < odometerKm && (!fuelRecordToEdit || f.id !== fuelRecordToEdit.id))
      .sort((a, b) => b.odometerKm - a.odometerKm);

    if (prevFuelRecords.length > 0 && liters > 0) {
      const distanceTravelled = odometerKm - prevFuelRecords[0].odometerKm;
      if (distanceTravelled > 0) {
        return Number((distanceTravelled / liters).toFixed(2));
      }
    }
    return undefined;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!vehicleId) {
      setErrorMsg('Please select a vehicle.');
      return;
    }
    if (!driverId) {
      setErrorMsg('Please select a driver.');
      return;
    }
    if (liters <= 0) {
      setErrorMsg('Fuel quantity must be greater than 0.');
      return;
    }
    if (pricePerLiter <= 0) {
      setErrorMsg('Price per liter must be greater than 0.');
      return;
    }
    if (!stationName.trim()) {
      setErrorMsg('Please specify fuel station name.');
      return;
    }

    const calculatedKmPerLiter = computeKmPerLitre();

    if (fuelRecordToEdit) {
      updateFuelRecord(fuelRecordToEdit.id, {
        vehicleId,
        driverId,
        date,
        time,
        odometerKm: Number(odometerKm),
        fuelType,
        liters: Number(liters),
        pricePerLiter: Number(pricePerLiter),
        totalCost,
        stationName,
        stationLocation,
        isFullTank,
        calculatedKmPerLiter,
        invoiceNumber,
        notes
      });
    } else {
      addFuelRecord({
        vehicleId,
        driverId,
        date,
        time,
        odometerKm: Number(odometerKm),
        fuelType,
        liters: Number(liters),
        pricePerLiter: Number(pricePerLiter),
        totalCost,
        stationName,
        stationLocation,
        isFullTank,
        calculatedKmPerLiter,
        invoiceNumber,
        notes
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Fuel className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{fuelRecordToEdit ? 'Edit Fuel Fill-Up Record' : 'Record Fuel Fill-Up'}</h2>
              <p className="text-[11px] text-slate-400">{fuelRecordToEdit ? 'Update fuel volume, pricing, and odometer' : 'Log pump liters, cost, and efficiency'}</p>
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
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto text-xs flex-1">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Vehicle and Driver */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Vehicle <span className="text-rose-400">*</span>
              </label>
              <select
                value={vehicleId}
                onChange={e => setVehicleId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber} ({v.make} {v.model})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Driver <span className="text-rose-400">*</span>
              </label>
              <select
                value={driverId}
                onChange={e => setDriverId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.employeeId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date, Time & Odometer */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Odometer (km)</label>
              <input
                type="number"
                value={odometerKm}
                onChange={e => setOdometerKm(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Fuel Type, Quantity, Price, and Total Calculation */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Fuel Type</label>
                <select
                  value={fuelType}
                  onChange={e => setFuelType(e.target.value as FuelType)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs"
                >
                  <option value="Diesel">Diesel</option>
                  <option value="Petrol (92/95)">Petrol (92/95)</option>
                  <option value="Hybrid">Hybrid (95)</option>
                  <option value="Electric">Electric / EV</option>
                  <option value="CNG">CNG / Gas</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Liters</label>
                <input
                  type="number"
                  step="0.01"
                  value={liters}
                  onChange={e => setLiters(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Price / L (LKR)</label>
                <input
                  type="number"
                  value={pricePerLiter}
                  onChange={e => setPricePerLiter(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                />
              </div>
            </div>

            {/* Total Cost Display */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="fullTankCheckbox"
                  checked={isFullTank}
                  onChange={e => setIsFullTank(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700 focus:ring-amber-500"
                />
                <label htmlFor="fullTankCheckbox" className="text-slate-300 font-medium">
                  Filled to Full Tank <span className="text-[10px] text-slate-400">(for km/L tracking)</span>
                </label>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Amount:</span>
                <p className="text-base font-extrabold text-amber-400">
                  LKR {totalCost.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Station and Invoice Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Fuel Station Name</label>
              <input
                type="text"
                placeholder="e.g. Ceypetco / Lanka IOC / Shell"
                value={stationName}
                onChange={e => setStationName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Invoice / Receipt #</label>
              <input
                type="text"
                placeholder="e.g. INV-90481"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Notes / Payment Method</label>
            <input
              type="text"
              placeholder="e.g. Company Fuel Card paid, Tire pressure adjusted at station"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md transition-colors"
            >
              {fuelRecordToEdit ? 'Save Changes' : 'Save Fuel Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
