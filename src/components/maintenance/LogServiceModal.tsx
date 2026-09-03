import React, { useState, useEffect } from 'react';
import { X, Wrench, AlertCircle, DollarSign, Calendar, Gauge, Building, CheckCircle2 } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { ServiceSchedule, MaintenanceLog } from '../../types';

interface LogServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSchedule?: ServiceSchedule | null;
  logToEdit?: MaintenanceLog | null;
}

export const LogServiceModal: React.FC<LogServiceModalProps> = ({
  isOpen,
  onClose,
  targetSchedule,
  logToEdit
}) => {
  const { vehicles, serviceSchedules, logCompletedMaintenance, updateMaintenanceLog, selectedVehicleId } = useFleet();

  const defaultVehicleId = logToEdit?.vehicleId || targetSchedule?.vehicleId || (selectedVehicleId !== 'all' ? selectedVehicleId : (vehicles[0]?.id || ''));
  const [vehicleId, setVehicleId] = useState<string>(defaultVehicleId);
  const [scheduleId, setScheduleId] = useState<string>(targetSchedule?.id || '');
  const [serviceType, setServiceType] = useState<string>(targetSchedule?.serviceType || 'Engine Oil & Filter Change');
  const [completedDate, setCompletedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [odometerKm, setOdometerKm] = useState<number>(0);
  const [performedBy, setPerformedBy] = useState<string>('Authorized Service Center');
  const [cost, setCost] = useState<number>(targetSchedule?.estimatedCost || 25000);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [partsReplaced, setPartsReplaced] = useState<string>('Engine Oil 5W-30, Genuine Oil Filter');
  const [notes, setNotes] = useState<string>('Completed multipoint periodic inspection.');
  const [nextIntervalKm, setNextIntervalKm] = useState<number>(targetSchedule?.intervalKm || 5000);
  const [nextIntervalMonths, setNextIntervalMonths] = useState<number>(targetSchedule?.intervalMonths || 6);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (logToEdit) {
      setVehicleId(logToEdit.vehicleId);
      setServiceType(logToEdit.serviceType);
      setCompletedDate(logToEdit.completedDate);
      setOdometerKm(logToEdit.odometerKm);
      setPerformedBy(logToEdit.performedBy || '');
      setCost(logToEdit.cost || 0);
      setInvoiceNumber(logToEdit.invoiceNumber || '');
      setPartsReplaced(logToEdit.partsReplaced || '');
      setNotes(logToEdit.notes || '');
      return;
    }

    if (targetSchedule) {
      setVehicleId(targetSchedule.vehicleId);
      setScheduleId(targetSchedule.id);
      setServiceType(targetSchedule.serviceType);
      setNextIntervalKm(targetSchedule.intervalKm);
      setNextIntervalMonths(targetSchedule.intervalMonths);
      setCost(targetSchedule.estimatedCost || 25000);
      const v = vehicles.find(item => item.id === targetSchedule.vehicleId);
      if (v) {
        setOdometerKm(v.currentOdometerKm);
      }
    } else {
      const v = vehicles.find(item => item.id === vehicleId) || vehicles[0];
      if (v) {
        setOdometerKm(v.currentOdometerKm);
      }
    }
  }, [isOpen, targetSchedule, logToEdit, vehicleId, vehicles]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!vehicleId) {
      setErrorMsg('Please select a vehicle.');
      return;
    }
    if (!serviceType.trim()) {
      setErrorMsg('Please enter the service type.');
      return;
    }
    if (odometerKm <= 0) {
      setErrorMsg('Odometer reading must be greater than 0.');
      return;
    }
    if (cost < 0) {
      setErrorMsg('Cost cannot be negative.');
      return;
    }

    if (logToEdit) {
      updateMaintenanceLog(logToEdit.id, {
        vehicleId,
        serviceType,
        completedDate,
        odometerKm: Number(odometerKm),
        performedBy,
        cost: Number(cost),
        invoiceNumber,
        partsReplaced,
        notes
      });
    } else {
      logCompletedMaintenance(
        scheduleId || undefined,
        {
          vehicleId,
          serviceType,
          completedDate,
          odometerKm: Number(odometerKm),
          performedBy,
          cost: Number(cost),
          invoiceNumber,
          partsReplaced,
          notes
        },
        nextIntervalKm,
        nextIntervalMonths
      );
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
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{logToEdit ? 'Edit Maintenance Log' : 'Log Completed Service'}</h2>
              <p className="text-[11px] text-slate-400">{logToEdit ? 'Update maintenance cost and details' : 'Record maintenance and advance schedule'}</p>
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

          {/* Vehicle and Service Schedule Link */}
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
                Service Schedule Trigger
              </label>
              <select
                value={scheduleId}
                onChange={e => {
                  setScheduleId(e.target.value);
                  const s = serviceSchedules.find(item => item.id === e.target.value);
                  if (s) {
                    setServiceType(s.serviceType);
                    setNextIntervalKm(s.intervalKm);
                    setNextIntervalMonths(s.intervalMonths);
                    if (s.estimatedCost) setCost(s.estimatedCost);
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                <option value="">-- Standalone / Unlinked Service --</option>
                {serviceSchedules
                  .filter(s => s.vehicleId === vehicleId)
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      {s.serviceType} (Every {s.intervalKm.toLocaleString()} km)
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Service Title */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Service / Maintenance Performed <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Engine Oil, Oil Filter & Sump Plug Replacement"
              value={serviceType}
              onChange={e => setServiceType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500"
            />
          </div>

          {/* Completion Date & Odometer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Completion Date</label>
              <input
                type="date"
                value={completedDate}
                onChange={e => setCompletedDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Odometer at Service (km) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                value={odometerKm}
                onChange={e => setOdometerKm(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
              />
            </div>
          </div>

          {/* Performed By & Total Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Workshop / Service Station</label>
              <input
                type="text"
                placeholder="e.g. Toyota Lanka / Local Authorized Garage"
                value={performedBy}
                onChange={e => setPerformedBy(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Total Service Cost (LKR)</label>
              <input
                type="number"
                placeholder="0"
                value={cost}
                onChange={e => setCost(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>
          </div>

          {/* Invoice Number & Replaced Parts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Invoice / Job Card #</label>
              <input
                type="text"
                placeholder="e.g. INV-TL-20491"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Parts & Fluids Replaced</label>
              <input
                type="text"
                placeholder="e.g. Mobil 5W-30 (7L), Oil filter element, Washer"
                value={partsReplaced}
                onChange={e => setPartsReplaced(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500"
              />
            </div>
          </div>

          {/* Automatic Reminder Reset Info Banner */}
          {scheduleId && (
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-purple-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Automated Next Service Reminder Calculation</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Saving will automatically schedule next service at{' '}
                <strong className="text-white font-mono">{(odometerKm + nextIntervalKm).toLocaleString()} km</strong> (in +{nextIntervalKm.toLocaleString()} km) and reset due date in {nextIntervalMonths} months.
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Mechanic Notes / Observations</label>
            <textarea
              rows={2}
              placeholder="e.g. Brake pads 70% life remaining, tire tread healthy"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500"
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
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md transition-colors"
            >
              {logToEdit ? 'Save Changes' : 'Confirm & Save Maintenance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
