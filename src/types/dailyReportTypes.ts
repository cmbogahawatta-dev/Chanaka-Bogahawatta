export type UserRole = 
  | 'Site Admin' 
  | 'Project Manager' 
  | 'Site Engineer' 
  | 'Supervisor' 
  | 'Subcontractor' 
  | 'Client Rep';

export type ReportStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'ENDORSED' 
  | 'APPROVED' 
  | 'RETURNED';

export type WeatherCondition = 
  | 'Clear / Sunny' 
  | 'Partly Cloudy' 
  | 'Overcast' 
  | 'Light Rain' 
  | 'Heavy Rain / Thunderstorm' 
  | 'High Wind / Dust' 
  | 'Extreme Heat';

export interface DailyWeather {
  period: 'Morning (07:00 - 12:00)' | 'Afternoon (12:00 - 17:00)' | 'Night Shift (17:00 - 22:00)';
  condition: WeatherCondition;
  tempCelsius: number;
  rainfallMm: number;
  siteGroundCondition: 'Dry / Firm' | 'Damp' | 'Muddy / Impassable' | 'Flooded';
  workImpactHours: number;
  notes?: string;
}

export interface DailyManpowerItem {
  id: string;
  contractorName: string;
  trade: string;
  headcount: number;
  standardHours: number;
  overtimeHours: number;
  totalManHours: number;
  assignedLocation: string;
}

export interface DailyEquipmentItem {
  id: string;
  equipmentCode: string;
  equipmentType: string;
  operatorName: string;
  workingHours: number;
  standbyHours: number;
  breakdownHours: number;
  status: 'Operational' | 'Standby' | 'Breakdown / Maintenance';
  assignedActivity: string;
}

export interface DailyMaterialItem {
  id: string;
  materialName: string;
  supplierName: string;
  deliveryNoteNo: string;
  quantityReceived: number;
  unit: string;
  inspectionStatus: 'Accepted' | 'Pending QC' | 'Rejected';
  storageLocation: string;
}

export interface DailyActivityItem {
  id: string;
  wbsCode: string;
  boqItemRef: string;
  description: string;
  locationGrid: string;
  plannedQty: number;
  actualQtyToday: number;
  cumulativeQtyToDate: number;
  unit: string;
  percentComplete: number;
  status: 'In Progress' | 'Completed' | 'Delayed / Obstruction' | 'Inspected & Passed';
  remarks?: string;
}

export interface SafetyOccurrence {
  id: string;
  type: 'Toolbox Talk' | 'Near Miss' | 'First Aid' | 'Lost Time Injury (LTI)' | 'Safety Violation' | 'Permit-To-Work (PTW)';
  description: string;
  actionTaken: string;
  reportedBy: string;
  timeReported: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface SitePhoto {
  id: string;
  url: string;
  caption: string;
  location: string;
  timestamp: string;
  uploadedBy: string;
}

export interface SignOffRecord {
  supervisorName: string;
  supervisorSignatureDate?: string;
  siteEngineerName: string;
  siteEngineerSignatureDate?: string;
  projectManagerName: string;
  projectManagerSignatureDate?: string;
  clientRepName?: string;
  clientRepSignatureDate?: string;
  specialInstructions: string;
}

export interface AuditLog {
  id: string;
  entityType: 'REPORT' | 'PROJECT' | 'USER';
  entityId: string;
  action: 
    | 'CREATED'
    | 'UPDATED'
    | 'SUBMITTED'
    | 'RETURNED'
    | 'ENDORSED'
    | 'APPROVED'
    | 'LOCKED'
    | 'EMAILED';
  userId: string;
  role: UserRole;
  timestamp: string;
  remarks?: string;
  before?: unknown;
  after?: unknown;
  performedBy?: string;
  userRole?: string | UserRole;
  notes?: string;
}

export type AuditLogEntry = AuditLog;

export interface DailyReport {
  id: string;
  projectId: string;
  reportNumber: string;
  date: string;
  shift: 'Day Shift' | 'Night Shift' | 'Full Day';
  status: ReportStatus;
  revision: string;
  isLocked: boolean;
  
  weather: DailyWeather[];
  manpower: DailyManpowerItem[];
  equipment: DailyEquipmentItem[];
  materials: DailyMaterialItem[];
  activities: DailyActivityItem[];
  safety: SafetyOccurrence[];
  photos: SitePhoto[];
  signOff: SignOffRecord;
  auditTrail: AuditLog[];

  supervisor: string;
  siteEngineer?: string;
  projectManager?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  projectCode: string;
  projectName: string;
  clientName: string;
  consultantName: string;
  contractorName: string;
  location: string;
  startDate: string;
  targetCompletionDate: string;
  currentContractValueUsd: number;
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  assignedProjectIds: string[];
}
