import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Building2,
  MapPin,
  Clock,
  CloudSun,
  Users,
  Truck,
  Package,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Camera,
  Save,
  Copy,
  Sparkles
} from 'lucide-react';
import {
  DailySiteRecord,
  DSRShift,
  WeatherCondition,
  GroundCondition,
  WeatherImpact,
  ManpowerEntry,
  EquipmentEntry,
  MaterialReceiptEntry,
  WorkProgressEntry,
  DelayIssueEntry,
  SiteVisitorEntry,
  SitePhotoEntry
} from '../../types/siteRecordTypes';
import { useSiteRecords } from '../../context/SiteRecordContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { useEnterprise } from '../../context/EnterpriseContext';

interface CreateDSRModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRecord?: DailySiteRecord | null;
}

const COMMON_TRADES = [
  'Site Engineer',
  'Foreman',
  'Bar Bender / Steel Fixer',
  'Carpenter',
  'Mason',
  'Plant / Crane Operator',
  'Driver / Heavy Vehicle',
  'Plumber',
  'Electrician',
  'Welder / Fabricator',
  'Surveyor / Leveller',
  'Safety Officer',
  'Unskilled Labourer',
  'Security Guard'
];

const COMMON_EQUIPMENT = [
  { name: 'Excavator 20T (CAT 320D)', reg: 'EX-201' },
  { name: 'Excavator 13T (Komatsu PC130)', reg: 'EX-104' },
  { name: 'Backhoe Loader (JCB 3DX)', reg: 'WP-DA-3391' },
  { name: 'Mobile Crane 25T (Tadano)', reg: 'CR-004' },
  { name: 'Dump Truck 10-Wheel (WP-NA-8842)', reg: 'WP-NA-8842' },
  { name: 'Dump Truck 6-Wheel (WP-PX-9921)', reg: 'WP-PX-9921' },
  { name: 'Vibratory Soil Roller 10T (Dynapac)', reg: 'RL-102' },
  { name: 'Concrete Transit Mixer 6m³ (WP-CAB-4521)', reg: 'WP-CAB-4521' },
  { name: 'Motor Grader (CAT 120K)', reg: 'GR-01' },
  { name: 'Plate Compactor 90kg', reg: 'CMP-02' },
  { name: 'Generator 50kVA (Denyo)', reg: 'GEN-01' },
  { name: 'Water Bowser 6000L', reg: 'WB-01' }
];

export const CreateDSRModal: React.FC<CreateDSRModalProps> = ({
  isOpen,
  onClose,
  initialRecord
}) => {
  const { addRecord, updateRecord, records } = useSiteRecords();
  const { projects } = usePettyCash();
  const { currentUser, currentRole } = useEnterprise();

  const [activeStep, setActiveStep] = useState<
    'general' | 'manpower' | 'equipment' | 'materials' | 'progress' | 'safety'
  >('general');

  // Form State
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [projectCode, setProjectCode] = useState<string>('PIDM 26');
  const [projectName, setProjectName] = useState<string>('Kadawatha - Mirigama Expressway Section II');
  const [siteLocation, setSiteLocation] = useState<string>('Ch 14+200 - Ch 16+500 Bridge & Retaining Wall');
  const [shift, setShift] = useState<DSRShift>('Day');
  const [workingHoursStart, setWorkingHoursStart] = useState<string>('07:30');
  const [workingHoursEnd, setWorkingHoursEnd] = useState<string>('17:30');

  // Weather State
  const [weatherMorning, setWeatherMorning] = useState<WeatherCondition>('Sunny / Clear');
  const [weatherAfternoon, setWeatherAfternoon] = useState<WeatherCondition>('Partly Cloudy');
  const [rainfallMm, setRainfallMm] = useState<number>(0);
  const [temperatureC, setTemperatureC] = useState<number>(30);
  const [groundCondition, setGroundCondition] = useState<GroundCondition>('Dry');
  const [workingHoursLostWeather, setWorkingHoursLostWeather] = useState<number>(0);
  const [weatherImpact, setWeatherImpact] = useState<WeatherImpact>('No Impact / Normal Work');

  // Manpower State
  const [manpower, setManpower] = useState<ManpowerEntry[]>([
    { id: 'mp-new-1', category: 'DIRECT', trade: 'Site Engineer', headCount: 2, regularHours: 9, overtimeHours: 1 },
    { id: 'mp-new-2', category: 'DIRECT', trade: 'Foreman', headCount: 3, regularHours: 9, overtimeHours: 1 },
    { id: 'mp-new-3', category: 'DIRECT', trade: 'Bar Bender / Steel Fixer', headCount: 12, regularHours: 8, overtimeHours: 2 },
    { id: 'mp-new-4', category: 'DIRECT', trade: 'Carpenter', headCount: 8, regularHours: 8, overtimeHours: 0 },
    { id: 'mp-new-5', category: 'DIRECT', trade: 'Mason', headCount: 6, regularHours: 8, overtimeHours: 0 },
    { id: 'mp-new-6', category: 'DIRECT', trade: 'Plant / Crane Operator', headCount: 4, regularHours: 9, overtimeHours: 1 },
    { id: 'mp-new-7', category: 'DIRECT', trade: 'Unskilled Labourer', headCount: 18, regularHours: 8, overtimeHours: 2 }
  ]);

  // Equipment State
  const [equipment, setEquipment] = useState<EquipmentEntry[]>([
    {
      id: 'eq-new-1',
      equipmentName: 'Excavator 20T (CAT 320D)',
      assetOrRegNo: 'EX-201',
      operatorName: 'Sunil Rathnayake',
      hoursWorked: 8,
      hoursIdle: 1,
      hoursBreakdown: 0,
      fuelLitersUsed: 110,
      status: 'Working',
      activityAssigned: 'Trench excavation & structure foundation'
    },
    {
      id: 'eq-new-2',
      equipmentName: 'Dump Truck 10-Wheel (WP-NA-8842)',
      assetOrRegNo: 'WP-NA-8842',
      operatorName: 'Kasun Bandara',
      hoursWorked: 8,
      hoursIdle: 0.5,
      hoursBreakdown: 0,
      fuelLitersUsed: 75,
      status: 'Working',
      activityAssigned: 'Aggregate and spoil hauling'
    }
  ]);

  // Materials State
  const [materials, setMaterials] = useState<MaterialReceiptEntry[]>([]);

  // Progress State
  const [progress, setProgress] = useState<WorkProgressEntry[]>([
    {
      id: 'prg-new-1',
      locationOrChainage: 'Ch 14+500 Retaining Wall',
      tradeOrWorkItem: 'Rebar fabrication & placement',
      plannedQuantity: 4,
      actualQuantity: 4,
      unit: 'MT',
      percentageComplete: 90,
      status: 'In Progress'
    }
  ]);

  // Safety State
  const [safety, setSafety] = useState<{
    toolboxTalkConducted: boolean;
    toolboxTopic: string;
    toolboxAttendeesCount: number;
    ppeComplianceRate: number;
    nearMissesCount: number;
    firstAidCasesCount: number;
    lostTimeInjuriesCount: number;
    safetyOfficerNotes: string;
  }>({
    toolboxTalkConducted: true,
    toolboxTopic: 'PPE Compliance & Working Around Heavy Plant',
    toolboxAttendeesCount: 45,
    ppeComplianceRate: 100,
    nearMissesCount: 0,
    firstAidCasesCount: 0,
    lostTimeInjuriesCount: 0,
    safetyOfficerNotes: 'All workers equipped with hard hats, safety boots, and high-vis vests.'
  });

  // Summary
  const [executiveSummary, setExecutiveSummary] = useState<string>(
    'Normal site operations conducted as planned. Weather was favorable.'
  );
  const [preparedByName, setPreparedByName] = useState<string>(currentUser || 'Eng. Buddika Senaratne');

  // Populate from initial record if editing
  useEffect(() => {
    if (initialRecord) {
      setDate(initialRecord.date);
      setProjectCode(initialRecord.projectCode);
      setProjectName(initialRecord.projectName);
      setSiteLocation(initialRecord.siteLocation);
      setShift(initialRecord.shift);
      setWorkingHoursStart(initialRecord.workingHoursStart);
      setWorkingHoursEnd(initialRecord.workingHoursEnd);
      setWeatherMorning(initialRecord.weatherMorning);
      setWeatherAfternoon(initialRecord.weatherAfternoon);
      setRainfallMm(initialRecord.rainfallMm);
      setTemperatureC(initialRecord.temperatureC);
      setGroundCondition(initialRecord.groundCondition);
      setWorkingHoursLostWeather(initialRecord.workingHoursLostWeather);
      setWeatherImpact(initialRecord.weatherImpact);
      setManpower(initialRecord.manpower);
      setEquipment(initialRecord.equipment);
      setMaterials(initialRecord.materials);
      setProgress(initialRecord.progress);
      setSafety({
        toolboxTalkConducted: initialRecord.safety.toolboxTalkConducted,
        toolboxTopic: initialRecord.safety.toolboxTopic || '',
        toolboxAttendeesCount: initialRecord.safety.toolboxAttendeesCount,
        ppeComplianceRate: initialRecord.safety.ppeComplianceRate,
        nearMissesCount: initialRecord.safety.nearMissesCount,
        firstAidCasesCount: initialRecord.safety.firstAidCasesCount,
        lostTimeInjuriesCount: initialRecord.safety.lostTimeInjuriesCount,
        safetyOfficerNotes: initialRecord.safety.safetyOfficerNotes || ''
      });
      setExecutiveSummary(initialRecord.executiveSummary);
      setPreparedByName(initialRecord.signOff.preparedByName);
    }
  }, [initialRecord]);

  if (!isOpen) return null;

  const handleProjectSelect = (code: string) => {
    setProjectCode(code);
    const found = projects.find(p => p.PROJECT_CODE === code);
    if (found) {
      setProjectName(found.PROJECT_NAME);
      setSiteLocation(found.LOCATION || 'Main Site Yard');
    }
  };

  // Quick preset loader from latest record
  const handleLoadLatestPreset = () => {
    if (records.length > 0) {
      const latest = records[0];
      setManpower(latest.manpower.map(m => ({ ...m, id: `mp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` })));
      setEquipment(latest.equipment.map(e => ({ ...e, id: `eq-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` })));
      alert(`Loaded manpower (${latest.manpower.length} trades) and equipment roster from ${latest.dsrNumber}`);
    }
  };

  // Dynamic Adders
  const handleAddManpowerRow = () => {
    setManpower(prev => [
      ...prev,
      {
        id: `mp-${Date.now()}`,
        category: 'DIRECT',
        trade: 'Skilled Labourer',
        headCount: 2,
        regularHours: 8,
        overtimeHours: 0,
        locationAssigned: siteLocation
      }
    ]);
  };

  const handleRemoveManpowerRow = (id: string) => {
    setManpower(prev => prev.filter(m => m.id !== id));
  };

  const handleAddEquipmentRow = () => {
    const defaultEq = COMMON_EQUIPMENT[equipment.length % COMMON_EQUIPMENT.length];
    setEquipment(prev => [
      ...prev,
      {
        id: `eq-${Date.now()}`,
        equipmentName: defaultEq.name,
        assetOrRegNo: defaultEq.reg,
        operatorName: 'Site Operator',
        hoursWorked: 8,
        hoursIdle: 0,
        hoursBreakdown: 0,
        fuelLitersUsed: 50,
        status: 'Working',
        activityAssigned: 'Earthworks / General lifting'
      }
    ]);
  };

  const handleRemoveEquipmentRow = (id: string) => {
    setEquipment(prev => prev.filter(e => e.id !== id));
  };

  const handleAddMaterialRow = () => {
    setMaterials(prev => [
      ...prev,
      {
        id: `mat-${Date.now()}`,
        materialName: 'Ready-Mix Concrete Grade 25',
        supplier: 'Lanka ReadyMix (Pvt) Ltd',
        deliveryTicketNo: `TK-${Math.floor(10000 + Math.random() * 90000)}`,
        quantity: 12,
        unit: 'Cubes',
        deliveryTime: '10:30 AM',
        qcStatus: 'Accepted',
        testReference: 'Slump: 100mm | Cubes casted'
      }
    ]);
  };

  const handleRemoveMaterialRow = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  const handleAddProgressRow = () => {
    setProgress(prev => [
      ...prev,
      {
        id: `prg-${Date.now()}`,
        locationOrChainage: 'Site Section B',
        tradeOrWorkItem: 'Reinforced Concrete Concreting',
        plannedQuantity: 20,
        actualQuantity: 20,
        unit: 'm³',
        percentageComplete: 100,
        status: 'Completed'
      }
    ]);
  };

  const handleRemoveProgressRow = (id: string) => {
    setProgress(prev => prev.filter(p => p.id !== id));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const recordPayload = {
      date,
      projectCode,
      projectName,
      siteLocation,
      shift,
      workingHoursStart,
      workingHoursEnd,
      weatherMorning,
      weatherAfternoon,
      rainfallMm: Number(rainfallMm),
      temperatureC: Number(temperatureC),
      groundCondition,
      workingHoursLostWeather: Number(workingHoursLostWeather),
      weatherImpact,
      manpower,
      equipment,
      materials,
      progress,
      safety: {
        toolboxTalkConducted: safety.toolboxTalkConducted,
        toolboxTopic: safety.toolboxTopic,
        toolboxAttendeesCount: Number(safety.toolboxAttendeesCount),
        safetyInspectionConducted: true,
        ppeComplianceRate: Number(safety.ppeComplianceRate),
        nearMissesCount: Number(safety.nearMissesCount),
        firstAidCasesCount: Number(safety.firstAidCasesCount),
        lostTimeInjuriesCount: Number(safety.lostTimeInjuriesCount),
        environmentalIncidents: 0,
        safetyOfficerNotes: safety.safetyOfficerNotes
      },
      delays: [],
      visitors: [],
      photos: [
        {
          id: `ph-${Date.now()}`,
          url: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=600&auto=format&fit=crop&q=80',
          caption: `${projectCode} daily work progress`,
          category: 'Progress' as const,
          timestamp: `${date} 11:00 AM`
        }
      ],
      executiveSummary,
      signOff: {
        preparedByName,
        preparedByRole: 'Site Engineer',
        preparedDate: `${date} ${workingHoursEnd}`,
        status: 'Submitted for Review' as const
      }
    };

    if (initialRecord) {
      updateRecord(initialRecord.id, recordPayload);
    } else {
      addRecord(recordPayload);
    }

    onClose();
  };

  const totalHeadcount = manpower.reduce((acc, curr) => acc + (Number(curr.headCount) || 0), 0);
  const totalManHours = manpower.reduce(
    (acc, curr) => acc + (Number(curr.headCount) || 0) * ((Number(curr.regularHours) || 0) + (Number(curr.overtimeHours) || 0)),
    0
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {initialRecord ? `Edit ${initialRecord.dsrNumber}` : 'New Daily Site Record (DSR)'}
              </h2>
              <p className="text-xs text-slate-400">
                Official Daily Construction Site Journal & Operations Log
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!initialRecord && (
              <button
                type="button"
                onClick={handleLoadLatestPreset}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Copy Yesterday's Team</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 pb-2 border-b border-slate-800/80 bg-slate-950/40 overflow-x-auto scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setActiveStep('general')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeStep === 'general' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Site & Weather
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('manpower')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeStep === 'manpower' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Manpower ({totalHeadcount})
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('equipment')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeStep === 'equipment' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Machinery ({equipment.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('materials')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeStep === 'materials' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            4. Materials ({materials.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('progress')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeStep === 'progress' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            5. Work Progress
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('safety')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeStep === 'safety' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            6. Safety & HSE
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-thin">
            {/* STEP 1: GENERAL & WEATHER */}
            {activeStep === 'general' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Report Date *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Project *</label>
                    <select
                      value={projectCode}
                      onChange={e => handleProjectSelect(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.PROJECT_CODE}>
                          {p.PROJECT_CODE} - {p.PROJECT_NAME}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Shift *</label>
                    <select
                      value={shift}
                      onChange={e => setShift(e.target.value as DSRShift)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                    >
                      <option value="Day">Day Shift (07:30 - 17:30)</option>
                      <option value="Night">Night Shift (19:00 - 05:00)</option>
                      <option value="24-Hour">24-Hour Continuous</option>
                      <option value="Double Shift">Double Extended Shift</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Site Location / Chainage</label>
                    <input
                      type="text"
                      value={siteLocation}
                      onChange={e => setSiteLocation(e.target.value)}
                      placeholder="e.g. Ch 14+200 - Ch 16+500 Bridge Section"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Start Time</label>
                      <input
                        type="time"
                        value={workingHoursStart}
                        onChange={e => setWorkingHoursStart(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">End Time</label>
                      <input
                        type="time"
                        value={workingHoursEnd}
                        onChange={e => setWorkingHoursEnd(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Weather Sub-Card */}
                <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-3">
                  <h3 className="font-bold text-slate-200 flex items-center gap-1.5">
                    <CloudSun className="w-4 h-4 text-amber-400" />
                    <span>Weather & Site Conditions</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Morning Weather</label>
                      <select
                        value={weatherMorning}
                        onChange={e => setWeatherMorning(e.target.value as WeatherCondition)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                      >
                        <option value="Sunny / Clear">Sunny / Clear</option>
                        <option value="Partly Cloudy">Partly Cloudy</option>
                        <option value="Overcast">Overcast</option>
                        <option value="Light Rain">Light Rain</option>
                        <option value="Heavy Rain / Storm">Heavy Rain / Storm</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Afternoon Weather</label>
                      <select
                        value={weatherAfternoon}
                        onChange={e => setWeatherAfternoon(e.target.value as WeatherCondition)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                      >
                        <option value="Sunny / Clear">Sunny / Clear</option>
                        <option value="Partly Cloudy">Partly Cloudy</option>
                        <option value="Overcast">Overcast</option>
                        <option value="Light Rain">Light Rain</option>
                        <option value="Heavy Rain / Storm">Heavy Rain / Storm</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Ground Condition</label>
                      <select
                        value={groundCondition}
                        onChange={e => setGroundCondition(e.target.value as GroundCondition)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                      >
                        <option value="Dry">Dry</option>
                        <option value="Damp">Damp</option>
                        <option value="Wet">Wet</option>
                        <option value="Muddy / Impassable">Muddy / Impassable</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Rainfall (mm)</label>
                      <input
                        type="number"
                        value={rainfallMm}
                        onChange={e => setRainfallMm(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Temperature (°C)</label>
                      <input
                        type="number"
                        value={temperatureC}
                        onChange={e => setTemperatureC(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Weather Downtime (Hours Lost)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={workingHoursLostWeather}
                        onChange={e => setWorkingHoursLostWeather(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Executive Site Summary</label>
                  <textarea
                    rows={3}
                    value={executiveSummary}
                    onChange={e => setExecutiveSummary(e.target.value)}
                    placeholder="Briefly state key activities accomplished, milestones, or any critical issues..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: MANPOWER */}
            {activeStep === 'manpower' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-200">Manpower & Labour Force Registry</h3>
                    <p className="text-slate-400 text-[11px]">Total: {totalHeadcount} Workers • {totalManHours} Man-Hours</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddManpowerRow}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Trade</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {manpower.map((m, index) => (
                    <div key={m.id} className="p-3 bg-slate-800/50 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-6 gap-2 items-center">
                      <div className="sm:col-span-1">
                        <select
                          value={m.category}
                          onChange={e => {
                            const val = e.target.value as 'DIRECT' | 'SUBCONTRACTOR';
                            setManpower(prev => prev.map(item => item.id === m.id ? { ...item, category: val } : item));
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 text-xs"
                        >
                          <option value="DIRECT">Direct Hire</option>
                          <option value="SUBCONTRACTOR">Subcontractor</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={m.trade}
                          onChange={e => {
                            const val = e.target.value;
                            setManpower(prev => prev.map(item => item.id === m.id ? { ...item, trade: val } : item));
                          }}
                          placeholder="Trade / Role"
                          list="trades-list"
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 text-xs"
                        />
                        <datalist id="trades-list">
                          {COMMON_TRADES.map(t => <option key={t} value={t} />)}
                        </datalist>
                      </div>

                      <div>
                        <input
                          type="number"
                          min="1"
                          value={m.headCount}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setManpower(prev => prev.map(item => item.id === m.id ? { ...item, headCount: val } : item));
                          }}
                          placeholder="Headcount"
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 text-xs text-center"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-1">
                        <input
                          type="number"
                          value={m.regularHours}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setManpower(prev => prev.map(item => item.id === m.id ? { ...item, regularHours: val } : item));
                          }}
                          placeholder="Reg"
                          title="Regular Hours"
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-1 py-1.5 text-slate-200 text-xs text-center"
                        />
                        <input
                          type="number"
                          value={m.overtimeHours}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setManpower(prev => prev.map(item => item.id === m.id ? { ...item, overtimeHours: val } : item));
                          }}
                          placeholder="OT"
                          title="Overtime Hours"
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-1 py-1.5 text-slate-200 text-xs text-center"
                        />
                      </div>

                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveManpowerRow(m.id)}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: MACHINERY / EQUIPMENT */}
            {activeStep === 'equipment' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-200">Plant & Machinery Deployment</h3>
                    <p className="text-slate-400 text-[11px]">{equipment.length} Active Machines on site</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEquipmentRow}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Machine</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {equipment.map(eq => (
                    <div key={eq.id} className="p-3 bg-slate-800/50 border border-slate-800 rounded-xl space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400">Machine Name</label>
                          <input
                            type="text"
                            value={eq.equipmentName}
                            onChange={e => {
                              const val = e.target.value;
                              setEquipment(prev => prev.map(item => item.id === eq.id ? { ...item, equipmentName: val } : item));
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400">Asset / Reg No</label>
                          <input
                            type="text"
                            value={eq.assetOrRegNo}
                            onChange={e => {
                              const val = e.target.value;
                              setEquipment(prev => prev.map(item => item.id === eq.id ? { ...item, assetOrRegNo: val } : item));
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400">Operator</label>
                          <input
                            type="text"
                            value={eq.operatorName}
                            onChange={e => {
                              const val = e.target.value;
                              setEquipment(prev => prev.map(item => item.id === eq.id ? { ...item, operatorName: val } : item));
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-center">
                        <div>
                          <label className="text-[10px] text-slate-400">Work Hours</label>
                          <input
                            type="number"
                            value={eq.hoursWorked}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setEquipment(prev => prev.map(item => item.id === eq.id ? { ...item, hoursWorked: val } : item));
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400">Idle Hours</label>
                          <input
                            type="number"
                            value={eq.hoursIdle}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setEquipment(prev => prev.map(item => item.id === eq.id ? { ...item, hoursIdle: val } : item));
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400">Fuel Used (L)</label>
                          <input
                            type="number"
                            value={eq.fuelLitersUsed}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setEquipment(prev => prev.map(item => item.id === eq.id ? { ...item, fuelLitersUsed: val } : item));
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400">Status</label>
                          <select
                            value={eq.status}
                            onChange={e => {
                              const val = e.target.value as any;
                              setEquipment(prev => prev.map(item => item.id === eq.id ? { ...item, status: val } : item));
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                          >
                            <option value="Working">Working</option>
                            <option value="Idle / Standby">Idle / Standby</option>
                            <option value="Breakdown">Breakdown</option>
                            <option value="Maintenance">Maintenance</option>
                          </select>
                        </div>
                        <div className="flex justify-end pt-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveEquipmentRow(eq.id)}
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: MATERIALS */}
            {activeStep === 'materials' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-200">Material Deliveries & Tickets</h3>
                    <p className="text-slate-400 text-[11px]">Log incoming concrete, rebar, aggregates, cement</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMaterialRow}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Delivery</span>
                  </button>
                </div>

                {materials.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500">
                    No material deliveries logged for today. Click "+ Add Delivery" if materials arrived on site.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {materials.map(mat => (
                      <div key={mat.id} className="p-3 bg-slate-800/50 border border-slate-800 rounded-xl space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <div className="sm:col-span-2">
                            <label className="text-[10px] text-slate-400">Material Description</label>
                            <input
                              type="text"
                              value={mat.materialName}
                              onChange={e => {
                                const val = e.target.value;
                                setMaterials(prev => prev.map(item => item.id === mat.id ? { ...item, materialName: val } : item));
                              }}
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400">Supplier</label>
                            <input
                              type="text"
                              value={mat.supplier}
                              onChange={e => {
                                const val = e.target.value;
                                setMaterials(prev => prev.map(item => item.id === mat.id ? { ...item, supplier: val } : item));
                              }}
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400">Ticket / Waybill No</label>
                            <input
                              type="text"
                              value={mat.deliveryTicketNo}
                              onChange={e => {
                                const val = e.target.value;
                                setMaterials(prev => prev.map(item => item.id === mat.id ? { ...item, deliveryTicketNo: val } : item));
                              }}
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
                          <div>
                            <label className="text-[10px] text-slate-400">Quantity & Unit</label>
                            <div className="flex gap-1">
                              <input
                                type="number"
                                value={mat.quantity}
                                onChange={e => {
                                  const val = Number(e.target.value);
                                  setMaterials(prev => prev.map(item => item.id === mat.id ? { ...item, quantity: val } : item));
                                }}
                                className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                              />
                              <select
                                value={mat.unit}
                                onChange={e => {
                                  const val = e.target.value as any;
                                  setMaterials(prev => prev.map(item => item.id === mat.id ? { ...item, unit: val } : item));
                                }}
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-1 py-1 text-slate-200 text-xs"
                              >
                                <option value="Cubes">Cubes</option>
                                <option value="MT">MT (Tons)</option>
                                <option value="Bags">Bags</option>
                                <option value="Units">Units</option>
                                <option value="Liters">Liters</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400">QC Status</label>
                            <select
                              value={mat.qcStatus}
                              onChange={e => {
                                const val = e.target.value as any;
                                setMaterials(prev => prev.map(item => item.id === mat.id ? { ...item, qcStatus: val } : item));
                              }}
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                            >
                              <option value="Accepted">Accepted</option>
                              <option value="Accepted with Remarks">Accepted with Remarks</option>
                              <option value="Pending Test Results">Pending Test Results</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400">Test Ref / Slump</label>
                            <input
                              type="text"
                              value={mat.testReference || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setMaterials(prev => prev.map(item => item.id === mat.id ? { ...item, testReference: val } : item));
                              }}
                              placeholder="e.g. Slump: 100mm"
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                            />
                          </div>

                          <div className="flex justify-end pt-3">
                            <button
                              type="button"
                              onClick={() => handleRemoveMaterialRow(mat.id)}
                              className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: WORK PROGRESS */}
            {activeStep === 'progress' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-200">Daily Work Progress & Outputs</h3>
                    <p className="text-slate-400 text-[11px]">Track completed volumes, chainages, and items</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddProgressRow}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Work Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {progress.map(prg => (
                    <div key={prg.id} className="p-3 bg-slate-800/50 border border-slate-800 rounded-xl space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400">Location / Chainage</label>
                          <input
                            type="text"
                            value={prg.locationOrChainage}
                            onChange={e => {
                              const val = e.target.value;
                              setProgress(prev => prev.map(item => item.id === prg.id ? { ...item, locationOrChainage: val } : item));
                            }}
                            placeholder="e.g. Ch 14+200 Culvert Base"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400">Trade / Work Item Description</label>
                          <input
                            type="text"
                            value={prg.tradeOrWorkItem}
                            onChange={e => {
                              const val = e.target.value;
                              setProgress(prev => prev.map(item => item.id === prg.id ? { ...item, tradeOrWorkItem: val } : item));
                            }}
                            placeholder="e.g. Grade 30 Concrete Pouring"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-center">
                        <div>
                          <label className="text-[10px] text-slate-400">Planned Output</label>
                          <input
                            type="number"
                            value={prg.plannedQuantity}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setProgress(prev => prev.map(item => item.id === prg.id ? { ...item, plannedQuantity: val } : item));
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400">Actual Output</label>
                          <input
                            type="number"
                            value={prg.actualQuantity}
                            onChange={e => {
                              const val = Number(e.target.value);
                              const pct = prg.plannedQuantity > 0 ? Math.round((val / prg.plannedQuantity) * 100) : 100;
                              setProgress(prev => prev.map(item => item.id === prg.id ? { ...item, actualQuantity: val, percentageComplete: pct } : item));
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400">Unit</label>
                          <input
                            type="text"
                            value={prg.unit}
                            onChange={e => {
                              const val = e.target.value;
                              setProgress(prev => prev.map(item => item.id === prg.id ? { ...item, unit: val } : item));
                            }}
                            placeholder="m³, m², tons"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400">Status</label>
                          <select
                            value={prg.status}
                            onChange={e => {
                              const val = e.target.value as any;
                              setProgress(prev => prev.map(item => item.id === prg.id ? { ...item, status: val } : item));
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                          >
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Ahead of Schedule">Ahead of Schedule</option>
                            <option value="Delayed">Delayed</option>
                          </select>
                        </div>
                        <div className="flex justify-end pt-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveProgressRow(prg.id)}
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 6: SAFETY & HSE */}
            {activeStep === 'safety' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-3">
                  <h3 className="font-bold text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Daily Safety Toolbox Talk (TBT)</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        id="tbt"
                        checked={safety.toolboxTalkConducted}
                        onChange={e => setSafety(prev => ({ ...prev, toolboxTalkConducted: e.target.checked }))}
                        className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-800 border-slate-700"
                      />
                      <label htmlFor="tbt" className="font-semibold text-slate-200">
                        Toolbox Talk Conducted
                      </label>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 mb-1 font-semibold">TBT Topic Discussed</label>
                      <input
                        type="text"
                        value={safety.toolboxTopic}
                        onChange={e => setSafety(prev => ({ ...prev, toolboxTopic: e.target.value }))}
                        placeholder="e.g. Scaffolding erection & Working at Heights safety"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">TBT Attendees</label>
                    <input
                      type="number"
                      value={safety.toolboxAttendeesCount}
                      onChange={e => setSafety(prev => ({ ...prev, toolboxAttendeesCount: Number(e.target.value) }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">PPE Compliance (%)</label>
                    <input
                      type="number"
                      max="100"
                      min="0"
                      value={safety.ppeComplianceRate}
                      onChange={e => setSafety(prev => ({ ...prev, ppeComplianceRate: Number(e.target.value) }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">First Aid Cases</label>
                    <input
                      type="number"
                      value={safety.firstAidCasesCount}
                      onChange={e => setSafety(prev => ({ ...prev, firstAidCasesCount: Number(e.target.value) }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Lost Time Injuries (LTI)</label>
                    <input
                      type="number"
                      value={safety.lostTimeInjuriesCount}
                      onChange={e => setSafety(prev => ({ ...prev, lostTimeInjuriesCount: Number(e.target.value) }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Safety Officer Notes</label>
                  <textarea
                    rows={2}
                    value={safety.safetyOfficerNotes}
                    onChange={e => setSafety(prev => ({ ...prev, safetyOfficerNotes: e.target.value }))}
                    placeholder="Notes on site safety inspections, hazards identified or corrected..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Prepared By (Your Name & Role) *</label>
                  <input
                    type="text"
                    value={preparedByName}
                    onChange={e => setPreparedByName(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeStep !== 'general' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeStep === 'manpower') setActiveStep('general');
                    else if (activeStep === 'equipment') setActiveStep('manpower');
                    else if (activeStep === 'materials') setActiveStep('equipment');
                    else if (activeStep === 'progress') setActiveStep('materials');
                    else if (activeStep === 'safety') setActiveStep('progress');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Previous Step
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeStep !== 'safety' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (activeStep === 'general') setActiveStep('manpower');
                    else if (activeStep === 'manpower') setActiveStep('equipment');
                    else if (activeStep === 'equipment') setActiveStep('materials');
                    else if (activeStep === 'materials') setActiveStep('progress');
                    else if (activeStep === 'progress') setActiveStep('safety');
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  Next Step &rarr;
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{initialRecord ? 'Save Changes' : 'Submit Daily Site Record'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
