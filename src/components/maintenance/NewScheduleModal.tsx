import React, { useState, useEffect } from 'react';
import { X, Wrench, AlertCircle, Calendar, Gauge, Plus } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { ServiceSchedule } from '../../types';

interface NewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleToEdit?: ServiceSchedule | null;
}

export const NewScheduleModal: React.FC<NewScheduleModalProps> = ({ isOpen, onClose, scheduleToEdit }) => {
  const { vehicles, selectedVehicleId, addServiceSchedule, updateServiceSchedule } = useFleet();

  const defaultVehicleId = selectedVehicleId !== 'all' ? selectedVehicleId : (vehicles[0]?.id || '');
  const selectedVehicle = vehicles.find(v => v.id === defaultVehicleId) || vehicles[0];

  const [vehicleId, setVehicleId] = useState<string>(defaultVehicleId);
  const [serviceType, setServiceType] = useState<string>('Engine Oil & Filter');
  const [intervalKm, setIntervalKm] = useState<number>(5000);
  const [intervalMonths, setIntervalMonths] = useState<number>(6);
  const [lastServiceOdometerKm, setLastServiceOdometerKm] = useState<number>(selectedVehicle?.currentOdometerKm || 0);
  const [lastServiceDate, setLastServiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('Routine preventive maintenance');
  const [estimatedCost, setEstimatedCost] = useState<number>(20000);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (scheduleToEdit) {
      setVehicleId(scheduleToEdit.vehicleId);
      setServiceType(scheduleToEdit.serviceType);
      setIntervalKm(scheduleToEdit.intervalKm);
      setIntervalMonths(scheduleToEdit.intervalMonths);
      setLastServiceOdometerKm(scheduleToEdit.lastServiceOdometerKm);
      setLastServiceDate(scheduleToEdit.lastServiceDate);
      setDescription(scheduleToEdit.description || '');
      setEstimatedCost(scheduleToEdit.estimatedCost || 20000);
    } else {
      const v = vehicles.find(item => item.id === defaultVehicleId) || vehicles[0];
      if (v) {
        setLastServiceOdometerKm(v.currentOdometerKm || 0);
      }
    }
  }, [scheduleToEdit, isOpen, defaultVehicleId, vehicles]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!vehicleId) {
      setErrorMsg('Please select a vehicle.');
      return;
    }
    if (!serviceType.trim()) {
      setErrorMsg('Please enter a service type name.');
      return;
    }
    if (intervalKm <= 0) {
      setErrorMsg('Interval in KM must be greater than 0.');
      return;
    }

    const nextDueOdometerKm = Number(lastServiceOdometerKm) + Number(intervalKm);
    const lastDate = new Date(lastServiceDate);
    lastDate.setMonth(lastDate.getMonth() + Number(intervalMonths));
    const nextDueDate = lastDate.toISOString().split('T')[0];

    if (scheduleToEdit) {
      updateServiceSchedule(scheduleToEdit.id, {
        vehicleId,
        serviceType,
        intervalKm: Number(intervalKm),
        intervalMonths: Number(intervalMonths),
        lastServiceOdometerKm: Number(lastServiceOdometerKm),
        lastServiceDate,
        nextDueOdometerKm,
        nextDueDate,
        description,
        estimatedCost: Number(estimatedCost)
      });
    } else {
      addServiceSchedule({
        vehicleId,
        serviceType,
        intervalKm: Number(intervalKm),
        intervalMonths: Number(intervalMonths),
        lastServiceOdometerKm: Number(lastServiceOdometerKm),
        lastServiceDate,
        nextDueOdometerKm,
        nextDueDate,
        description,
        estimatedCost: Number(estimatedCost)
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
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{scheduleToEdit ? 'Edit Service Schedule' : 'Create Service Schedule'}</h2>
              <p className="text-[11px] text-slate-400">{scheduleToEdit ? 'Update maintenance interval and specifications' : 'Configure automated maintenance interval'}</p>
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

          {/* Vehicle and Service Presets */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Select Vehicle <span className="text-rose-400">*</span>
            </label>
            <select
              value={vehicleId}
              onChange={e => {
                setVehicleId(e.target.value);
                const v = vehicles.find(item => item.id === e.target.value);
                if (v) setLastServiceOdometerKm(v.currentOdometerKm);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.registrationNumber} ({v.make} {v.model})
                </option>
              ))}
            </select>
          </div>

          {/* Service Presets */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Quick Presets</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: 'Engine Oil & Filter', km: 5000, months: 6, cost: 25000 },
                { name: 'Brake Fluid & Pads', km: 20000, months: 12, cost: 18000 },
                { name: 'Tire Rotation & Alignment', km: 10000, months: 6, cost: 8000 },
                { name: 'Transmission / Gearbox Fluid', km: 40000, months: 24, cost: 35000 },
                { name: 'Annual Fitness / Emission Renewal', km: 25000, months: 12, cost: 7500 },
                { name: 'Battery Replacement Check', km: 30000, months: 24, cost: 45000 }
              ].map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setServiceType(preset.name);
                    setIntervalKm(preset.km);
                    setIntervalMonths(preset.months);
                    setEstimatedCost(preset.cost);
                  }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded-lg border border-slate-700 transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Service Name */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Service Name / Category <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={serviceType}
              onChange={e => setServiceType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>

          {/* Dual Interval Triggers: KM & Months */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <span className="font-semibold text-purple-400 block text-xs">
              Dual Automated Trigger Criteria
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Repeat Every (Kilometers)</label>
                <input
                  type="number"
                  value={intervalKm}
                  onChange={e => setIntervalKm(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Repeat Every (Months)</label>
                <input
                  type="number"
                  value={intervalMonths}
                  onChange={e => setIntervalMonths(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-xs"
                />
              </div>
            </div>

            <p className="text-[10px] text-slate-400">
              The system will trigger an automated alert whenever the vehicle hits either the kilometer milestone OR the calendar interval.
            </p>
          </div>

          {/* Baseline Last Service Date & Odo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Last Done Date</label>
              <input
                type="date"
                value={lastServiceDate}
                onChange={e => setLastServiceDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Last Done Odometer (km)</label>
              <input
                type="number"
                value={lastServiceOdometerKm}
                onChange={e => setLastServiceOdometerKm(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-mono font-bold text-xs"
              />
            </div>
          </div>

          {/* Estimated Cost & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Estimated Budget (Rs.)</label>
              <input
                type="number"
                value={estimatedCost}
                onChange={e => setEstimatedCost(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Description / Spec</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
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
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md transition-colors"
            >
              {scheduleToEdit ? 'Save Changes' : 'Save Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
