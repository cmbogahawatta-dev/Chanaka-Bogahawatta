import React, { useState, useEffect } from 'react';
import { X, Navigation, AlertCircle, Calendar, Clock, MapPin, User, Car, DollarSign } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { RunningChartEntry } from '../../types';

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripToEdit?: RunningChartEntry | null;
}

export const TripModal: React.FC<TripModalProps> = ({
  isOpen,
  onClose,
  tripToEdit
}) => {
  const { vehicles, drivers, selectedVehicleId, addRunningChart, updateRunningChart } = useFleet();

  const defaultVehicleId = selectedVehicleId !== 'all' ? selectedVehicleId : (vehicles[0]?.id || '');
  const selectedVehicle = vehicles.find(v => v.id === defaultVehicleId);

  const [vehicleId, setVehicleId] = useState<string>(defaultVehicleId);
  const [driverId, setDriverId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState<string>('08:30');
  const [endTime, setEndTime] = useState<string>('12:30');
  const [purpose, setPurpose] = useState<string>('');
  const [startLocation, setStartLocation] = useState<string>('Head Office / Central Depot');
  const [endLocation, setEndLocation] = useState<string>('');
  const [startOdometerKm, setStartOdometerKm] = useState<number>(0);
  const [endOdometerKm, setEndOdometerKm] = useState<number>(0);
  const [routeDescription, setRouteDescription] = useState<string>('');
  const [tollOrParkingCost, setTollOrParkingCost] = useState<number>(0);
  const [passengers, setPassengers] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // When opening or changing vehicle, prepopulate odometer and driver
  useEffect(() => {
    if (tripToEdit) {
      setVehicleId(tripToEdit.vehicleId);
      setDriverId(tripToEdit.driverId);
      setDate(tripToEdit.date);
      setStartTime(tripToEdit.startTime);
      setEndTime(tripToEdit.endTime);
      setPurpose(tripToEdit.purpose);
      setStartLocation(tripToEdit.startLocation);
      setEndLocation(tripToEdit.endLocation);
      setStartOdometerKm(tripToEdit.startOdometerKm);
      setEndOdometerKm(tripToEdit.endOdometerKm);
      setRouteDescription(tripToEdit.routeDescription || '');
      setTollOrParkingCost(tripToEdit.tollOrParkingCost || 0);
      setPassengers(tripToEdit.passengers || '');
      setRemarks(tripToEdit.remarks || '');
    } else {
      const v = vehicles.find(item => item.id === vehicleId) || vehicles[0];
      if (v) {
        setStartOdometerKm(v.currentOdometerKm);
        setEndOdometerKm(v.currentOdometerKm + 25);
        if (v.currentDriverId) {
          setDriverId(v.currentDriverId);
        } else if (drivers[0]) {
          setDriverId(drivers[0].id);
        }
      }
    }
  }, [isOpen, tripToEdit, vehicleId, vehicles, drivers]);

  if (!isOpen) return null;

  const calculatedDistance = Math.max(0, endOdometerKm - startOdometerKm);

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
    if (!purpose.trim()) {
      setErrorMsg('Please enter the journey purpose.');
      return;
    }
    if (!startLocation.trim() || !endLocation.trim()) {
      setErrorMsg('Please enter start and end destinations.');
      return;
    }
    if (endOdometerKm <= startOdometerKm) {
      setErrorMsg('Ending Odometer must be greater than Starting Odometer.');
      return;
    }

    if (tripToEdit) {
      updateRunningChart(tripToEdit.id, {
        vehicleId,
        driverId,
        date,
        startTime,
        endTime,
        purpose,
        startLocation,
        endLocation,
        startOdometerKm,
        endOdometerKm,
        distanceKm: calculatedDistance,
        routeDescription,
        tollOrParkingCost: Number(tollOrParkingCost),
        passengers,
        remarks,
        status: 'completed'
      });
    } else {
      addRunningChart({
        vehicleId,
        driverId,
        date,
        startTime,
        endTime,
        purpose,
        startLocation,
        endLocation,
        startOdometerKm,
        endOdometerKm,
        distanceKm: calculatedDistance,
        routeDescription,
        tollOrParkingCost: Number(tollOrParkingCost),
        passengers,
        remarks,
        status: 'completed'
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
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {tripToEdit ? 'Edit Running Chart Trip' : 'New Running Chart Entry'}
              </h2>
              <p className="text-[11px] text-slate-400">Log vehicle journey and mileage</p>
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
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.employeeId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date and Time */}
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
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs"
              />
            </div>
          </div>

          {/* Purpose of Journey */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Purpose of Journey <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Branch delivery, Site inspection, Client meeting"
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500"
            />
          </div>

          {/* Start & End Locations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Start Location</label>
              <input
                type="text"
                placeholder="e.g. Colombo Central Office"
                value={startLocation}
                onChange={e => setStartLocation(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">End Destination</label>
              <input
                type="text"
                placeholder="e.g. Kandy Regional Hub"
                value={endLocation}
                onChange={e => setEndLocation(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500"
              />
            </div>
          </div>

          {/* Odometer & Distance Calculation Highlight */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">Odometer Readings (km)</span>
              <span className="text-blue-400 font-bold text-xs bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                Calculated Distance: {calculatedDistance} km
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Start Odometer</label>
                <input
                  type="number"
                  value={startOdometerKm}
                  onChange={e => setStartOdometerKm(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">End Odometer</label>
                <input
                  type="number"
                  value={endOdometerKm}
                  onChange={e => setEndOdometerKm(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Route & Expenses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Route / Highway</label>
              <input
                type="text"
                placeholder="e.g. Via Southern Expressway E01"
                value={routeDescription}
                onChange={e => setRouteDescription(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Toll & Parking (LKR)</label>
              <input
                type="number"
                placeholder="0"
                value={tollOrParkingCost || ''}
                onChange={e => setTollOrParkingCost(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          {/* Passengers / Goods and Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Passengers / Crew</label>
              <input
                type="text"
                placeholder="e.g. 4 Staff members / Spare tools cargo"
                value={passengers}
                onChange={e => setPassengers(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Remarks</label>
              <input
                type="text"
                placeholder="e.g. Delivered on time, no vehicle defects"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500"
              />
            </div>
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
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md transition-colors"
            >
              {tripToEdit ? 'Save Changes' : 'Record Trip Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
