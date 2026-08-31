export type DSRShift = 'Day' | 'Night' | '24-Hour' | 'Double Shift';

export type WeatherCondition =
  | 'Sunny / Clear'
  | 'Partly Cloudy'
  | 'Overcast'
  | 'Light Rain'
  | 'Heavy Rain / Storm'
  | 'Extreme Heat'
  | 'Windy / Dust Storm';

export type GroundCondition = 'Dry' | 'Damp' | 'Wet' | 'Muddy / Impassable' | 'Waterlogged';

export type WeatherImpact = 'No Impact / Normal Work' | 'Minor Slowdown' | 'Major Interruption' | 'Complete Work Stoppage';

export type DSRStatus = 'Draft' | 'Submitted for Review' | 'Verified & Approved' | 'Revision Requested';

export interface ManpowerEntry {
  id: string;
  category: 'DIRECT' | 'SUBCONTRACTOR';
  subcontractorName?: string;
  trade: string; // e.g. "Site Engineer", "Foreman", "Mason", "Carpenter", "Bar Bender / Steel Fixer", "Plant / Crane Operator", "Driver", "Plumber", "Electrician", "Skilled Labourer", "Unskilled Labourer", "Safety Officer", "Surveyor", "Security"
  headCount: number;
  regularHours: number;
  overtimeHours: number;
  locationAssigned?: string;
  notes?: string;
}

export interface EquipmentEntry {
  id: string;
  equipmentName: string; // e.g. "Excavator 20T (CAT 320D)", "Backhoe Loader (JCB 3DX)", "Dump Truck 10-Wheel (WP-NA-8842)"
  assetOrRegNo: string;
  operatorName: string;
  hoursWorked: number;
  hoursIdle: number;
  hoursBreakdown: number;
  fuelLitersUsed: number;
  status: 'Working' | 'Idle / Standby' | 'Breakdown' | 'Maintenance';
  activityAssigned: string;
  location?: string;
}

export interface MaterialReceiptEntry {
  id: string;
  materialName: string;
  supplier: string;
  deliveryTicketNo: string;
  quantity: number;
  unit: 'Cubes' | 'MT' | 'Bags' | 'Units' | 'Liters' | 'kg' | 'm' | 'm²' | 'Trips' | 'Loads';
  deliveryTime: string;
  qcStatus: 'Accepted' | 'Accepted with Remarks' | 'Pending Test Results' | 'Rejected';
  testReference?: string;
  linkedPoNumber?: string;
  remarks?: string;
}

export interface WorkProgressEntry {
  id: string;
  locationOrChainage: string; // e.g. "Block B - 3rd Floor Slab", "Ch 14+500 Culvert Abutment"
  tradeOrWorkItem: string; // e.g. "Formwork Erection", "Reinforcement Rebar Fixing", "Concrete Pouring C30", "Subgrade Compaction"
  plannedQuantity: number;
  actualQuantity: number;
  unit: string;
  percentageComplete: number;
  status: 'Completed' | 'In Progress' | 'Delayed' | 'Ahead of Schedule';
  workforceCount?: number;
  remarks?: string;
}

export interface SafetyHSELog {
  toolboxTalkConducted: boolean;
  toolboxTopic?: string;
  toolboxAttendeesCount: number;
  safetyInspectionConducted: boolean;
  ppeComplianceRate: number; // 0 to 100%
  nearMissesCount: number;
  firstAidCasesCount: number;
  lostTimeInjuriesCount: number;
  environmentalIncidents: number;
  safetyOfficerNotes?: string;
  inspectorName?: string;
}

export interface DelayIssueEntry {
  id: string;
  category:
    | 'Weather / Rain'
    | 'Material Delay'
    | 'Plant Breakdown'
    | 'Client / Consultant Instruction'
    | 'Design / Drawing Clarification (RFI)'
    | 'Labour Shortage'
    | 'Site Access Restriction'
    | 'Utility Clash / Obstruction'
    | 'Other';
  description: string;
  impactHours: number;
  remedialAction: string;
  isResolved: boolean;
}

export interface SiteVisitorEntry {
  id: string;
  type: 'Client Representative' | 'Consultant / Supervising Engineer' | 'Government / Local Authority' | 'Auditor / Quality Inspector' | 'Subcontractor Principal' | 'Supplier Rep';
  visitorName: string;
  organization: string;
  designation: string;
  purposeOrInstruction: string;
  referenceNo?: string;
  timeIn?: string;
  timeOut?: string;
}

export interface SitePhotoEntry {
  id: string;
  url: string;
  caption: string;
  category: 'Progress' | 'Quality Inspection' | 'Safety / HSE' | 'Material Delivery' | 'Plant & Equipment' | 'Defect / Issue';
  timestamp: string;
  locationTag?: string;
}

export interface SiteRecordSignOff {
  preparedByName: string;
  preparedByRole: string;
  preparedDate: string;
  verifiedByName?: string;
  verifiedByRole?: string;
  verifiedDate?: string;
  clientRepName?: string;
  clientRemarks?: string;
  status: DSRStatus;
  digitalSignatureHash?: string;
}

export interface DailySiteRecord {
  id: string;
  dsrNumber: string; // e.g. "DSR-202608-042"
  date: string; // YYYY-MM-DD
  projectCode: string; // e.g. "PIDM 26"
  projectName: string;
  siteLocation: string;
  shift: DSRShift;
  workingHoursStart: string; // e.g. "07:30"
  workingHoursEnd: string; // e.g. "17:30"
  
  // Weather & Site Conditions
  weatherMorning: WeatherCondition;
  weatherAfternoon: WeatherCondition;
  rainfallMm: number;
  temperatureC: number;
  groundCondition: GroundCondition;
  workingHoursLostWeather: number;
  weatherImpact: WeatherImpact;
  weatherNotes?: string;

  // Logs & Modules
  manpower: ManpowerEntry[];
  equipment: EquipmentEntry[];
  materials: MaterialReceiptEntry[];
  progress: WorkProgressEntry[];
  safety: SafetyHSELog;
  delays: DelayIssueEntry[];
  visitors: SiteVisitorEntry[];
  photos: SitePhotoEntry[];

  // Executive Summary & Remarks
  executiveSummary: string;
  generalSiteNotes?: string;
  plannedActivitiesTomorrow?: string;

  // Sign-off
  signOff: SiteRecordSignOff;

  createdAt: string;
  updatedAt: string;
}

export interface SiteRecordFilter {
  projectCode: string;
  dateRange: 'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM';
  startDate?: string;
  endDate?: string;
  status: 'ALL' | DSRStatus;
  searchTerm: string;
  weatherImpact?: 'ALL' | 'AFFECTED_ONLY';
}

export interface SiteRecordStats {
  totalRecordsCount: number;
  todayRecordsCount: number;
  approvedCount: number;
  pendingReviewCount: number;
  totalSiteManpowerToday: number;
  totalManHoursToday: number;
  totalActiveMachineryToday: number;
  equipmentUtilizationRate: number; // percentage
  zeroLtiDaysCount: number;
  weatherDowntimeHoursTotal: number;
}
