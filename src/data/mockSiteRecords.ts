import { DailySiteRecord } from '../types/siteRecordTypes';

export const initialDailySiteRecords: DailySiteRecord[] = [
  {
    id: 'dsr-20260828-01',
    dsrNumber: 'DSR-202608-042',
    date: '2026-08-28',
    projectCode: 'PIDM 26',
    projectName: 'Kadawatha - Mirigama Expressway Section II',
    siteLocation: 'Ch 14+200 - Ch 16+500 Bridge Abutment & Retaining Wall',
    shift: 'Day',
    workingHoursStart: '07:30',
    workingHoursEnd: '17:30',

    weatherMorning: 'Sunny / Clear',
    weatherAfternoon: 'Partly Cloudy',
    rainfallMm: 0,
    temperatureC: 31,
    groundCondition: 'Dry',
    workingHoursLostWeather: 0,
    weatherImpact: 'No Impact / Normal Work',
    weatherNotes: 'Good dry working conditions across all chainages.',

    manpower: [
      { id: 'mp-1', category: 'DIRECT', trade: 'Site Engineer', headCount: 2, regularHours: 9, overtimeHours: 1, locationAssigned: 'Abutment 1 & Culvert 14' },
      { id: 'mp-2', category: 'DIRECT', trade: 'Foreman', headCount: 3, regularHours: 9, overtimeHours: 2, locationAssigned: 'Sections A & B' },
      { id: 'mp-3', category: 'DIRECT', trade: 'Bar Bender / Steel Fixer', headCount: 14, regularHours: 8, overtimeHours: 2, locationAssigned: 'Pier Cap 4 Rebar Cage' },
      { id: 'mp-4', category: 'DIRECT', trade: 'Carpenter', headCount: 10, regularHours: 8, overtimeHours: 1, locationAssigned: 'Slab Formwork Box' },
      { id: 'mp-5', category: 'DIRECT', trade: 'Mason', headCount: 8, regularHours: 8, overtimeHours: 0, locationAssigned: 'Rubble Masonry Drain' },
      { id: 'mp-6', category: 'DIRECT', trade: 'Plant / Crane Operator', headCount: 6, regularHours: 9, overtimeHours: 2, locationAssigned: 'Crane & Excavators' },
      { id: 'mp-7', category: 'DIRECT', trade: 'Unskilled Labourer', headCount: 22, regularHours: 8, overtimeHours: 2, locationAssigned: 'Site General & Handling' },
      { id: 'mp-8', category: 'DIRECT', trade: 'Safety Officer', headCount: 1, regularHours: 9, overtimeHours: 0, locationAssigned: 'Whole Site HSE' },
      { id: 'mp-9', category: 'SUBCONTRACTOR', subcontractorName: 'Lanka Piling & Geo Tech Ltd', trade: 'Piling Rig Operator & Helper', headCount: 8, regularHours: 9, overtimeHours: 0, locationAssigned: 'Pier 6 Test Bored Pile' }
    ],

    equipment: [
      {
        id: 'eq-1',
        equipmentName: 'Excavator 20T (CAT 320D)',
        assetOrRegNo: 'EX-201',
        operatorName: 'Sunil Rathnayake',
        hoursWorked: 8.5,
        hoursIdle: 1.0,
        hoursBreakdown: 0,
        fuelLitersUsed: 125,
        status: 'Working',
        activityAssigned: 'Foundation Deep Trench Excavation Ch 15+100'
      },
      {
        id: 'eq-2',
        equipmentName: 'Mobile Crane 25T (Tadano)',
        assetOrRegNo: 'CR-004',
        operatorName: 'Priyantha Kumara',
        hoursWorked: 7.0,
        hoursIdle: 2.0,
        hoursBreakdown: 0,
        fuelLitersUsed: 95,
        status: 'Working',
        activityAssigned: 'Lifting & Positioning Pre-cast Girders at Pier 3'
      },
      {
        id: 'eq-3',
        equipmentName: 'Dump Truck 10-Wheel (WP-NA-8842)',
        assetOrRegNo: 'WP-NA-8842',
        operatorName: 'Kasun Bandara',
        hoursWorked: 8.0,
        hoursIdle: 0.5,
        hoursBreakdown: 0,
        fuelLitersUsed: 80,
        status: 'Working',
        activityAssigned: 'Hauling Sub-base ABC Material from Quarry'
      },
      {
        id: 'eq-4',
        equipmentName: 'Vibratory Soil Roller 10T (Dynapac CA250)',
        assetOrRegNo: 'RL-102',
        operatorName: 'Ananda Silva',
        hoursWorked: 6.5,
        hoursIdle: 2.5,
        hoursBreakdown: 0,
        fuelLitersUsed: 65,
        status: 'Working',
        activityAssigned: 'Sub-base Layer Compaction (98% Mod. Proctor)'
      },
      {
        id: 'eq-5',
        equipmentName: 'Concrete Transit Mixer 6m³ (WP-CAB-4521)',
        assetOrRegNo: 'WP-CAB-4521',
        operatorName: 'Nuwan Jayasinghe',
        hoursWorked: 7.5,
        hoursIdle: 1.5,
        hoursBreakdown: 0,
        fuelLitersUsed: 70,
        status: 'Working',
        activityAssigned: 'Pouring Grade 30 Ready-Mix to Culvert Base'
      }
    ],

    materials: [
      {
        id: 'mat-1',
        materialName: 'Ready-Mix Concrete Grade C30/20',
        supplier: 'Lanka ReadyMix (Pvt) Ltd',
        deliveryTicketNo: 'LRM-2026-8841',
        quantity: 36,
        unit: 'Cubes',
        deliveryTime: '09:15 AM - 01:30 PM',
        qcStatus: 'Accepted',
        testReference: 'Slump: 110mm | 6 Cubes casted (Ref: C-26-42)',
        linkedPoNumber: 'PO-202608-010',
        remarks: 'Batch temperature 29.5°C within acceptable limits'
      },
      {
        id: 'mat-2',
        materialName: 'High Yield Deformed Rebar T16 & T20',
        supplier: 'Ceylon Steel Corporation (Sanstha)',
        deliveryTicketNo: 'CSC-TK-90412',
        quantity: 12.5,
        unit: 'MT',
        deliveryTime: '11:00 AM',
        qcStatus: 'Accepted',
        testReference: 'Mill Test Certificate #MTC-84920 attached',
        remarks: 'Stored on timber bolsters with tarpaulin cover'
      },
      {
        id: 'mat-3',
        materialName: 'Graded Aggregate Base (ABC)',
        supplier: 'Mahaweli Metal Crushers',
        deliveryTicketNo: 'MMC-0828-55',
        quantity: 48,
        unit: 'Cubes',
        deliveryTime: '08:00 AM - 03:00 PM',
        qcStatus: 'Accepted',
        testReference: 'Grading envelope certified (Lab report #A-104)'
      }
    ],

    progress: [
      {
        id: 'prg-1',
        locationOrChainage: 'Ch 14+200 Culvert 1',
        tradeOrWorkItem: 'Base Slab Concrete Pouring (Grade 30)',
        plannedQuantity: 36,
        actualQuantity: 36,
        unit: 'm³',
        percentageComplete: 100,
        status: 'Completed',
        workforceCount: 12,
        remarks: 'Pour completed at 14:15. Wet burlap curing started.'
      },
      {
        id: 'prg-2',
        locationOrChainage: 'Ch 15+100 Pier Cap 4',
        tradeOrWorkItem: 'T25/T20 High Tensile Rebar Cage Fabrication',
        plannedQuantity: 4.5,
        actualQuantity: 4.2,
        unit: 'Tons',
        percentageComplete: 93,
        status: 'In Progress',
        workforceCount: 14,
        remarks: 'Consultant pre-pour inspection scheduled for tomorrow 09:00 AM.'
      },
      {
        id: 'prg-3',
        locationOrChainage: 'Ch 15+800 - 16+200 Right Side',
        tradeOrWorkItem: 'Sub-base Layer 2 Spreading & Compaction',
        plannedQuantity: 400,
        actualQuantity: 420,
        unit: 'm',
        percentageComplete: 100,
        status: 'Ahead of Schedule',
        workforceCount: 8,
        remarks: 'Field Density Sand Replacement Tests passed (98.6% MDD).'
      }
    ],

    safety: {
      toolboxTalkConducted: true,
      toolboxTopic: 'Working at Heights & Scaffold Safety during Pier Cap Formwork',
      toolboxAttendeesCount: 68,
      safetyInspectionConducted: true,
      ppeComplianceRate: 98,
      nearMissesCount: 0,
      firstAidCasesCount: 1,
      lostTimeInjuriesCount: 0,
      environmentalIncidents: 0,
      safetyOfficerNotes: '1 minor superficial scratch treated with antiseptic at first-aid station. Full harness checks verified.',
      inspectorName: 'Kavinda Jayatilleke (HSE Officer)'
    },

    delays: [],

    visitors: [
      {
        id: 'vis-1',
        type: 'Consultant / Supervising Engineer',
        visitorName: 'Eng. Bandula Jayasuriya',
        organization: 'RDA Project Management Unit (PMU)',
        designation: 'Senior Resident Engineer',
        purposeOrInstruction: 'Inspected Pier 4 rebar alignment and certified Culvert 1 foundation level.',
        referenceNo: 'SI-2026-088',
        timeIn: '10:30 AM',
        timeOut: '12:45 PM'
      }
    ],

    photos: [
      {
        id: 'ph-1',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=600&auto=format&fit=crop&q=80',
        caption: 'Concreting of Culvert Base Slab at Ch 14+200 using Transit Mixer',
        category: 'Progress',
        timestamp: '2026-08-28 10:45 AM',
        locationTag: 'Ch 14+200'
      },
      {
        id: 'ph-2',
        url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
        caption: 'Morning Safety Tool Box Talk on Pier Cap Scaffolding Protocols',
        category: 'Safety / HSE',
        timestamp: '2026-08-28 07:35 AM',
        locationTag: 'Site Yard'
      }
    ],

    executiveSummary: 'Full target output achieved today. Culvert 1 base slab concrete pour (36m³) successfully executed without incident. Pier Cap 4 rebar cage 93% completed ready for consultant inspection.',
    generalSiteNotes: 'All key heavy machinery operational. Fuel reserves at site tank at 3,400L.',
    plannedActivitiesTomorrow: 'Formwork closing on Pier Cap 4, Concreting of Drain Wall Ch 14+800, sub-base priming coat test strip.',

    signOff: {
      preparedByName: 'Eng. Buddika Senaratne',
      preparedByRole: 'Site Project Engineer',
      preparedDate: '2026-08-28 17:30',
      verifiedByName: 'Eng. Samantha Perera',
      verifiedByRole: 'Project Director',
      verifiedDate: '2026-08-28 18:15',
      clientRepName: 'Eng. Bandula Jayasuriya (PMU Consultant)',
      clientRemarks: 'Work complies with Technical Specifications Volume III.',
      status: 'Verified & Approved',
      digitalSignatureHash: 'EMA-DSR-SEC-8842-VERIFIED'
    },

    createdAt: '2026-08-28T07:30:00Z',
    updatedAt: '2026-08-28T18:15:00Z'
  },
  {
    id: 'dsr-20260827-02',
    dsrNumber: 'DSR-202608-041',
    date: '2026-08-27',
    projectCode: 'PIDM 28',
    projectName: 'Central Expressway Phase III - Gampaha Link',
    siteLocation: 'Interchange Junction & Overpass Flyover Ch 04+100',
    shift: 'Day',
    workingHoursStart: '07:30',
    workingHoursEnd: '17:00',

    weatherMorning: 'Partly Cloudy',
    weatherAfternoon: 'Light Rain',
    rainfallMm: 12,
    temperatureC: 28,
    groundCondition: 'Wet',
    workingHoursLostWeather: 1.5,
    weatherImpact: 'Minor Slowdown',
    weatherNotes: 'Afternoon shower from 14:00 to 15:30 suspended asphalt paving; earthwork resumed after roller sealing.',

    manpower: [
      { id: 'mp-21', category: 'DIRECT', trade: 'Site Engineer', headCount: 2, regularHours: 9, overtimeHours: 0, locationAssigned: 'Flyover Abutment' },
      { id: 'mp-22', category: 'DIRECT', trade: 'Foreman', headCount: 2, regularHours: 9, overtimeHours: 1, locationAssigned: 'Earthworks & Paving' },
      { id: 'mp-23', category: 'DIRECT', trade: 'Mason', headCount: 6, regularHours: 8, overtimeHours: 0, locationAssigned: 'Drainage Channel' },
      { id: 'mp-24', category: 'DIRECT', trade: 'Bar Bender / Steel Fixer', headCount: 12, regularHours: 8, overtimeHours: 1, locationAssigned: 'Deck Slab Panel #3' },
      { id: 'mp-25', category: 'DIRECT', trade: 'Carpenter', headCount: 8, regularHours: 8, overtimeHours: 0, locationAssigned: 'Cantilever Formwork' },
      { id: 'mp-26', category: 'DIRECT', trade: 'Plant / Crane Operator', headCount: 5, regularHours: 8, overtimeHours: 0, locationAssigned: 'Paving Fleet' },
      { id: 'mp-27', category: 'DIRECT', trade: 'Unskilled Labourer', headCount: 18, regularHours: 8, overtimeHours: 1, locationAssigned: 'Traffic Management & Cleaning' },
      { id: 'mp-28', category: 'SUBCONTRACTOR', subcontractorName: 'RoadTech Asphalt Specialists', trade: 'Asphalt Paver Crew', headCount: 9, regularHours: 6.5, overtimeHours: 0, locationAssigned: 'Binder Course Ch 04+100' }
    ],

    equipment: [
      {
        id: 'eq-21',
        equipmentName: 'Asphalt Paver Tracked (Vögele Super 1800)',
        assetOrRegNo: 'PV-01',
        operatorName: 'Dinesh Kumara',
        hoursWorked: 5.5,
        hoursIdle: 2.5,
        hoursBreakdown: 0,
        fuelLitersUsed: 85,
        status: 'Idle / Standby',
        activityAssigned: 'Asphalt Binder Course Laying (Paused due to rain)'
      },
      {
        id: 'eq-22',
        equipmentName: 'Pneumatic Tyre Roller (Hamm GRW 280)',
        assetOrRegNo: 'PTR-03',
        operatorName: 'Ruwan Fernando',
        hoursWorked: 5.5,
        hoursIdle: 2.5,
        hoursBreakdown: 0,
        fuelLitersUsed: 50,
        status: 'Idle / Standby',
        activityAssigned: 'Asphalt Secondary Compaction'
      },
      {
        id: 'eq-23',
        equipmentName: 'Backhoe Loader (JCB 3DX)',
        assetOrRegNo: 'WP-DA-3391',
        operatorName: 'Mahesh Wickramasinghe',
        hoursWorked: 7.5,
        hoursIdle: 1.0,
        hoursBreakdown: 0,
        fuelLitersUsed: 55,
        status: 'Working',
        activityAssigned: 'Catchpit Excavation & Backfilling'
      }
    ],

    materials: [
      {
        id: 'mat-21',
        materialName: 'Hot Mix Asphalt Concrete (Binder Course 60/70)',
        supplier: 'CeyMac Asphalt Plants (Pvt) Ltd',
        deliveryTicketNo: 'CMA-2026-4412',
        quantity: 140,
        unit: 'MT',
        deliveryTime: '08:30 AM - 01:15 PM',
        qcStatus: 'Accepted',
        testReference: 'Laydown temp 152°C | Marshall stability test OK',
        linkedPoNumber: 'PO-202608-008'
      },
      {
        id: 'mat-22',
        materialName: 'Portland Hydraulic Cement 50kg',
        supplier: 'Tokyo Super Cement PLC',
        deliveryTicketNo: 'TSC-99410',
        quantity: 250,
        unit: 'Bags',
        deliveryTime: '10:00 AM',
        qcStatus: 'Accepted',
        linkedPoNumber: 'PO-202608-011'
      }
    ],

    progress: [
      {
        id: 'prg-21',
        locationOrChainage: 'Ch 04+100 - 04+450 Southbound',
        tradeOrWorkItem: 'Asphalt Binder Course Laying (60mm thick)',
        plannedQuantity: 350,
        actualQuantity: 280,
        unit: 'm',
        percentageComplete: 80,
        status: 'Delayed',
        workforceCount: 15,
        remarks: 'Afternoon rain forced suspension of final 70m strip. Joint sealed properly.'
      },
      {
        id: 'prg-22',
        locationOrChainage: 'Flyover Deck Span 2',
        tradeOrWorkItem: 'Cantilever Bracket Formwork Alignment',
        plannedQuantity: 120,
        actualQuantity: 120,
        unit: 'm²',
        percentageComplete: 100,
        status: 'Completed',
        workforceCount: 8
      }
    ],

    safety: {
      toolboxTalkConducted: true,
      toolboxTopic: 'Traffic Management & Re-routing Safety at Interchange',
      toolboxAttendeesCount: 62,
      safetyInspectionConducted: true,
      ppeComplianceRate: 100,
      nearMissesCount: 0,
      firstAidCasesCount: 0,
      lostTimeInjuriesCount: 0,
      environmentalIncidents: 0,
      inspectorName: 'Sanjeewa Alwis (Safety Inspector)'
    },

    delays: [
      {
        id: 'dl-1',
        category: 'Weather / Rain',
        description: 'Afternoon heavy shower (12mm rainfall) required immediate covering and pausing of hot mix asphalt laying.',
        impactHours: 1.5,
        remedialAction: 'Transferred crew to drainage culvert pre-fabrication shed; asphalt paving rescheduled for tomorrow morning.',
        isResolved: true
      }
    ],

    visitors: [],

    photos: [
      {
        id: 'ph-21',
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
        caption: 'Asphalt Binder Course Laying before afternoon rainfall',
        category: 'Progress',
        timestamp: '2026-08-27 11:30 AM',
        locationTag: 'Ch 04+200'
      }
    ],

    executiveSummary: 'Asphalt binder course 80% finished (280m completed). Rain caused 1.5 hr work stoppage on paving. Flyover cantilever formwork span 2 completed 100%.',
    plannedActivitiesTomorrow: 'Complete remaining 70m asphalt binder strip; begin prime coat on Northbound lanes.',

    signOff: {
      preparedByName: 'Eng. Geeth Madhusanka',
      preparedByRole: 'Project Manager',
      preparedDate: '2026-08-27 17:00',
      verifiedByName: 'Eng. Samantha Perera',
      verifiedByRole: 'Project Director',
      verifiedDate: '2026-08-27 17:45',
      status: 'Verified & Approved',
      digitalSignatureHash: 'EMA-DSR-SEC-9921-VERIFIED'
    },

    createdAt: '2026-08-27T07:30:00Z',
    updatedAt: '2026-08-27T17:45:00Z'
  },
  {
    id: 'dsr-20260826-03',
    dsrNumber: 'DSR-202608-040',
    date: '2026-08-26',
    projectCode: 'PIDM 27',
    projectName: 'Pasyala - Giriulla Highway Widening & Realignment',
    siteLocation: 'Bridge #3 River Crossing Abutment Ch 08+600',
    shift: 'Day',
    workingHoursStart: '07:30',
    workingHoursEnd: '17:30',

    weatherMorning: 'Sunny / Clear',
    weatherAfternoon: 'Sunny / Clear',
    rainfallMm: 0,
    temperatureC: 32,
    groundCondition: 'Dry',
    workingHoursLostWeather: 0,
    weatherImpact: 'No Impact / Normal Work',

    manpower: [
      { id: 'mp-31', category: 'DIRECT', trade: 'Site Engineer', headCount: 1, regularHours: 9, overtimeHours: 1 },
      { id: 'mp-32', category: 'DIRECT', trade: 'Foreman', headCount: 2, regularHours: 9, overtimeHours: 1 },
      { id: 'mp-33', category: 'DIRECT', trade: 'Mason', headCount: 10, regularHours: 8, overtimeHours: 2 },
      { id: 'mp-34', category: 'DIRECT', trade: 'Bar Bender / Steel Fixer', headCount: 8, regularHours: 8, overtimeHours: 0 },
      { id: 'mp-35', category: 'DIRECT', trade: 'Unskilled Labourer', headCount: 14, regularHours: 8, overtimeHours: 1 }
    ],

    equipment: [
      {
        id: 'eq-31',
        equipmentName: 'Excavator 13T (Komatsu PC130)',
        assetOrRegNo: 'EX-104',
        operatorName: 'Chaminda Silva',
        hoursWorked: 8.0,
        hoursIdle: 1.0,
        hoursBreakdown: 0,
        fuelLitersUsed: 90,
        status: 'Working',
        activityAssigned: 'River Bank Protection Rip-rap Placement'
      }
    ],

    materials: [
      {
        id: 'mat-31',
        materialName: 'River Sand for Masonry',
        supplier: 'Maha Oya River Sand Suppliers',
        deliveryTicketNo: 'MOS-2026-112',
        quantity: 8,
        unit: 'Cubes',
        deliveryTime: '09:00 AM',
        qcStatus: 'Accepted',
        linkedPoNumber: 'PO-202608-012'
      }
    ],

    progress: [
      {
        id: 'prg-31',
        locationOrChainage: 'Bridge 3 Abutment B',
        tradeOrWorkItem: 'Random Rubble Masonry Retaining Wall',
        plannedQuantity: 25,
        actualQuantity: 28,
        unit: 'm³',
        percentageComplete: 100,
        status: 'Ahead of Schedule',
        workforceCount: 12
      }
    ],

    safety: {
      toolboxTalkConducted: true,
      toolboxTopic: 'River Bank Work Safety, Life Vests & Water Current Precautions',
      toolboxAttendeesCount: 35,
      safetyInspectionConducted: true,
      ppeComplianceRate: 100,
      nearMissesCount: 0,
      firstAidCasesCount: 0,
      lostTimeInjuriesCount: 0,
      environmentalIncidents: 0
    },

    delays: [],
    visitors: [],
    photos: [],

    executiveSummary: 'River bank retaining wall masonry progressed ahead of target. Good weather and river water levels were optimal.',
    plannedActivitiesTomorrow: 'Continue masonry lift 2 and weep hole pipe installations.',

    signOff: {
      preparedByName: 'Eng. Lasantha Wijesinghe',
      preparedByRole: 'Site Engineer',
      preparedDate: '2026-08-26 17:30',
      verifiedByName: 'Eng. Samantha Perera',
      verifiedByRole: 'Project Director',
      verifiedDate: '2026-08-26 18:00',
      status: 'Verified & Approved',
      digitalSignatureHash: 'EMA-DSR-SEC-3312-VERIFIED'
    },

    createdAt: '2026-08-26T07:30:00Z',
    updatedAt: '2026-08-26T18:00:00Z'
  }
];
