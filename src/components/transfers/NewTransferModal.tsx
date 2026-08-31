import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Car,
  User,
  Gauge,
  Fuel,
  ShieldCheck,
  ClipboardList,
  PenTool,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { VehicleConditionChecklist } from '../../types';

interface NewTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialVehicleId?: string;
}

export const NewTransferModal: React.FC<NewTransferModalProps> = ({
  isOpen,
  onClose,
  initialVehicleId
}) => {
  const { vehicles, drivers, executeVehicleTransfer, selectedVehicleId } = useFleet();

  const defaultVehId = initialVehicleId || (selectedVehicleId !== 'all' ? selectedVehicleId : (vehicles[0]?.id || ''));

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [vehicleId, setVehicleId] = useState<string>(defaultVehId);
  const [fromDriverId, setFromDriverId] = useState<string>('');
  const [toDriverId, setToDriverId] = useState<string>('');
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [transferTime, setTransferTime] = useState<string>('09:00');
  const [handoverLocation, setHandoverLocation] = useState<string>('Company Central Bay / Headquarters');
  const [transferReason, setTransferReason] = useState<string>('Driver shift handover / route assignment');

  // Step 2: Readings
  const [odometerAtTransferKm, setOdometerAtTransferKm] = useState<number>(0);
  const [fuelLevelPercent, setFuelLevelPercent] = useState<number>(75);

  // Step 3: Vehicle Condition Checklist
  const [checklist, setChecklist] = useState<VehicleConditionChecklist>({
    exteriorBody: 'Good',
    windshieldAndMirrors: 'Good',
    tiresAndTread: 'Good (Healthy)',
    interiorCleanliness: 'Clean',
    acAndElectronics: 'Working',
    warningLightsOnDashboard: false,
    dashboardWarningDetails: '',
    spareWheelAndJack: true,
    toolKitPresent: true,
    fireExtinguisher: true,
    firstAidKit: true,
    vehicleRegistrationBookPresent: true,
    insuranceCardPresent: true,
    companyFuelCardPresent: true
  });

  // Step 4: Notes & Signatures
  const [inspectionNotes, setInspectionNotes] = useState<string>('Vehicle initial inspection completed. All equipment verified and in order.');
  const [damageRemarks, setDamageRemarks] = useState<string>('No new damages. Body and mechanical condition verified.');
  const [releasingDriverSignName, setReleasingDriverSignName] = useState<string>('');
  const [receivingDriverSignName, setReceivingDriverSignName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Auto set Releasing Driver when Vehicle is picked
  useEffect(() => {
    const v = vehicles.find(item => item.id === vehicleId) || vehicles[0];
    if (v) {
      setOdometerAtTransferKm(v.currentOdometerKm);
      if (v.currentDriverId) {
        setFromDriverId(v.currentDriverId);
        const releasingDrv = drivers.find(d => d.id === v.currentDriverId);
        if (releasingDrv) setReleasingDriverSignName(releasingDrv.name);
      } else if (drivers[0]) {
        setFromDriverId(drivers[0].id);
        setReleasingDriverSignName(drivers[0].name);
      }

      // Pick a different driver for Receiving Driver by default
      const alternateDriver = drivers.find(d => d.id !== v.currentDriverId) || drivers[0];
      if (alternateDriver) {
        setToDriverId(alternateDriver.id);
        setReceivingDriverSignName(alternateDriver.name);
      }
    }
  }, [vehicleId, vehicles, drivers, isOpen]);

  // Update receiving driver sign name when toDriverId changes
  useEffect(() => {
    const drv = drivers.find(d => d.id === toDriverId);
    if (drv) setReceivingDriverSignName(drv.name);
  }, [toDriverId, drivers]);

  // Update releasing driver sign name when fromDriverId changes
  useEffect(() => {
    const drv = drivers.find(d => d.id === fromDriverId);
    if (drv) setReleasingDriverSignName(drv.name);
  }, [fromDriverId, drivers]);

  if (!isOpen) return null;

  const handleNext = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!vehicleId) {
        setErrorMsg('Please select a vehicle to transfer.');
        return;
      }
      if (!fromDriverId) {
        setErrorMsg('Please specify releasing driver.');
        return;
      }
      if (!toDriverId) {
        setErrorMsg('Please select receiving driver.');
        return;
      }
      if (fromDriverId === toDriverId) {
        setErrorMsg('Releasing Driver and Receiving Driver cannot be the same person.');
        return;
      }
      if (!handoverLocation.trim()) {
        setErrorMsg('Please specify handover location.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (odometerAtTransferKm <= 0) {
        setErrorMsg('Please enter valid odometer reading.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleCompleteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!releasingDriverSignName.trim() || !receivingDriverSignName.trim()) {
      setErrorMsg('Both drivers must sign/confirm their names for legal handover.');
      return;
    }

    executeVehicleTransfer({
      vehicleId,
      fromDriverId,
      toDriverId,
      transferDate,
      transferTime,
      handoverLocation,
      odometerAtTransferKm: Number(odometerAtTransferKm),
      fuelLevelPercent: Number(fuelLevelPercent),
      conditionChecklist: checklist,
      inspectionNotes,
      damageRemarks,
      releasingDriverSignName,
      receivingDriverSignName,
      transferReason
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Driver-to-Driver Vehicle Transfer</h2>
              <p className="text-[11px] text-slate-400">Initial inspection & handover audit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wizard Steps Bar */}
        <div className="grid grid-cols-4 bg-slate-950/80 p-1 border-b border-slate-800 text-[11px] font-semibold">
          {[
            { num: 1, label: '1. Drivers' },
            { num: 2, label: '2. Readings' },
            { num: 3, label: '3. Checklist' },
            { num: 4, label: '4. Sign-off' }
          ].map(s => (
            <div
              key={s.num}
              className={`py-1.5 text-center rounded-lg transition-colors ${
                step === s.num
                  ? 'bg-emerald-600 text-white font-bold'
                  : step > s.num
                  ? 'text-emerald-400 font-medium'
                  : 'text-slate-500'
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* Body Area */}
        <div className="p-4 overflow-y-auto text-xs flex-1 space-y-3.5">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Vehicle & Drivers */}
          {step === 1 && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Vehicle to Transfer <span className="text-rose-400">*</span>
                </label>
                <select
                  value={vehicleId}
                  onChange={e => setVehicleId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} — {v.make} {v.model} ({v.currentOdometerKm.toLocaleString()} km)
                    </option>
                  ))}
                </select>
              </div>

              {/* Driver Transfer Box */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <span className="text-emerald-400 font-semibold block text-xs">Driver Reassignment</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Releasing Driver (Current)
                    </label>
                    <select
                      value={fromDriverId}
                      onChange={e => setFromDriverId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    >
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-emerald-400 font-semibold mb-1">
                      Receiving Driver (New) <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={toDriverId}
                      onChange={e => setToDriverId(e.target.value)}
                      className="w-full bg-slate-800 border border-emerald-500/50 rounded-lg px-2.5 py-1.5 text-white ring-1 ring-emerald-500/30"
                    >
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Date, Time, Location, Reason */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Transfer Date</label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={e => setTransferDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Handover Time</label>
                  <input
                    type="time"
                    value={transferTime}
                    onChange={e => setTransferTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Handover Location</label>
                <input
                  type="text"
                  placeholder="e.g. Central Workshop Bay, Regional Warehouse Yard"
                  value={handoverLocation}
                  onChange={e => setHandoverLocation(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Reason for Transfer</label>
                <input
                  type="text"
                  placeholder="e.g. Shift change, Driver on annual leave, Route reassignment"
                  value={transferReason}
                  onChange={e => setTransferReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Handover Initial Readings (Odometer & Fuel) */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                  <Gauge className="w-4 h-4" />
                  <span>Initial Odometer Reading at Handover</span>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Current Odometer (km) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={odometerAtTransferKm}
                    onChange={e => setOdometerAtTransferKm(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-base font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    This will be recorded as the official starting baseline for the receiving driver.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Fuel className="w-4 h-4" />
                  <span>Fuel Tank Level at Handover: {fuelLevelPercent}%</span>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {[100, 75, 50, 25, 10].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setFuelLevelPercent(pct)}
                      className={`py-2 px-1 rounded-xl text-center font-bold text-xs border transition-all ${
                        fuelLevelPercent === pct
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {pct === 10 ? 'Reserve' : `${pct}%`}
                    </button>
                  ))}
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all duration-300"
                    style={{ width: `${fuelLevelPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Initial Physical Condition & Equipment Checklist */}
          {step === 3 && (
            <div className="space-y-3.5">
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <ClipboardList className="w-4 h-4" />
                  <span>Physical Condition Status at Transfer Time</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Exterior Body & Paint</label>
                    <select
                      value={checklist.exteriorBody}
                      onChange={e => setChecklist({ ...checklist, exteriorBody: e.target.value as any })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs"
                    >
                      <option value="Good">Good (No Dents)</option>
                      <option value="Minor Scratches">Minor Scratches</option>
                      <option value="Dents / Damage">Dents / Body Damage</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Windshield & Mirrors</label>
                    <select
                      value={checklist.windshieldAndMirrors}
                      onChange={e => setChecklist({ ...checklist, windshieldAndMirrors: e.target.value as any })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs"
                    >
                      <option value="Good">Good (Clear)</option>
                      <option value="Dirty / Needs Attention">Needs Cleaning</option>
                      <option value="Cracked">Cracked / Chipped</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Tires & Tread</label>
                    <select
                      value={checklist.tiresAndTread}
                      onChange={e => setChecklist({ ...checklist, tiresAndTread: e.target.value as any })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs"
                    >
                      <option value="Good (Healthy)">Good (Healthy Tread)</option>
                      <option value="Fair">Fair Condition</option>
                      <option value="Worn (Needs Replacement)">Worn / Needs Replacement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Interior Cleanliness</label>
                    <select
                      value={checklist.interiorCleanliness}
                      onChange={e => setChecklist({ ...checklist, interiorCleanliness: e.target.value as any })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs"
                    >
                      <option value="Clean">Clean & Tidy</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Dirty">Needs Full Cleaning</option>
                    </select>
                  </div>
                </div>

                {/* Dashboard Warning Toggle */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-300 font-medium">Dashboard Warning Lights Active?</span>
                  <button
                    type="button"
                    onClick={() => setChecklist({ ...checklist, warningLightsOnDashboard: !checklist.warningLightsOnDashboard })}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                      checklist.warningLightsOnDashboard
                        ? 'bg-rose-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {checklist.warningLightsOnDashboard ? 'Yes (Warning Active)' : 'No (Clear)'}
                  </button>
                </div>
              </div>

              {/* Equipment & In-Car Kit Checklist */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <span className="text-emerald-400 font-bold block text-xs uppercase tracking-wider">
                  Mandatory In-Car Items & Document Audit
                </span>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {[
                    { key: 'spareWheelAndJack', label: 'Spare Wheel & Jack' },
                    { key: 'toolKitPresent', label: 'Emergency Tool Kit' },
                    { key: 'fireExtinguisher', label: 'Fire Extinguisher' },
                    { key: 'firstAidKit', label: 'First Aid Kit' },
                    { key: 'vehicleRegistrationBookPresent', label: 'Registration Book / Card' },
                    { key: 'insuranceCardPresent', label: 'Insurance Card / Decal' },
                    { key: 'companyFuelCardPresent', label: 'Company RFID Fuel Card' }
                  ].map(item => {
                    const isChecked = (checklist as any)[item.key];
                    return (
                      <label
                        key={item.key}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-slate-800/40 border-slate-700 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => setChecklist({ ...checklist, [item.key]: e.target.checked })}
                          className="rounded text-emerald-500 bg-slate-800 border-slate-700"
                        />
                        <span className="truncate">{item.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Inspection Notes & Dual Driver Sign-off */}
          {step === 4 && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  General Handover & Inspection Notes
                </label>
                <textarea
                  rows={2}
                  value={inspectionNotes}
                  onChange={e => setInspectionNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Defects / Pre-existing Body Damage Remarks (Initial Record)
                </label>
                <textarea
                  rows={2}
                  placeholder="Note any prior scratch, dent, or mechanical observation to protect both drivers..."
                  value={damageRemarks}
                  onChange={e => setDamageRemarks(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500"
                />
              </div>

              {/* Digital Driver Signatures / Attestation Box */}
              <div className="p-3.5 bg-slate-950/90 border border-emerald-500/30 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <PenTool className="w-4 h-4" />
                  <span>Dual Driver Handover Attestation</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Releasing Driver Confirmation:
                    </label>
                    <input
                      type="text"
                      value={releasingDriverSignName}
                      onChange={e => setReleasingDriverSignName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-semibold text-xs"
                    />
                    <span className="text-[10px] text-emerald-400 mt-1 block flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Signed & Handed Over
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-xl border border-emerald-500/40">
                    <label className="block text-[10px] text-emerald-300 font-semibold mb-1">
                      Receiving Driver Acceptance:
                    </label>
                    <input
                      type="text"
                      value={receivingDriverSignName}
                      onChange={e => setReceivingDriverSignName(e.target.value)}
                      className="w-full bg-slate-800 border border-emerald-500/50 rounded-lg px-2 py-1 text-white font-semibold text-xs"
                    />
                    <span className="text-[10px] text-emerald-400 mt-1 block flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Signed & Accepted Condition
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400">
                  By clicking Execute Handover, the vehicle's assigned driver will immediately transfer to <strong>{receivingDriverSignName}</strong> with odometer baseline of <strong>{Number(odometerAtTransferKm).toLocaleString()} km</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div className="px-4 py-3 bg-slate-850 border-t border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as any)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold flex items-center gap-1 transition-colors text-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors text-xs"
            >
              Cancel
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md flex items-center gap-1 transition-colors text-xs"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompleteTransfer}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md flex items-center gap-1 transition-colors text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Execute Transfer & Save Initial Record</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
