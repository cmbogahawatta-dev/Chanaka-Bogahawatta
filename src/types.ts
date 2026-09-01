export type VehicleStatus = 'active' | 'in-service' | 'idle' | 'transferred';
export type FuelType = 'Petrol (92/95)' | 'Diesel' | 'Hybrid' | 'Electric' | 'CNG';
export type ServiceStatus = 'overdue' | 'due-soon' | 'good';

export interface Vehicle {
  id: string;
  enterpriseId?: string;      // Multi-tenant enterprise association
  registrationNumber: string; // e.g. "CAB-8492" or "WP-GA-5421"
  make: string;               // e.g. "Toyota"
  model: string;              // e.g. "Hilux Revo Double Cab"
  year: number;
  type: 'Sedan' | 'SUV' | 'Pickup' | 'Van' | 'Lorry / Truck' | 'Motorcycle';
  fuelType: FuelType;
  tankCapacityLiters: number;
  currentOdometerKm: number;
  currentDriverId: string;    // ID of the assigned driver
  status: VehicleStatus;
  insuranceExpiryDate: string; // YYYY-MM-DD
  revenueLicenseExpiryDate: string; // YYYY-MM-DD
  department: string;
  photoUrl?: string;
  registrationDocUrl?: string;  // Scanned Registration / Title Document image
  insuranceDocUrl?: string;     // Scanned Insurance Certificate image
  revenueLicenseDocUrl?: string;// Scanned Revenue License / Tax disc image
  chassisNumber?: string;       // VIN / Chassis No
  engineNumber?: string;        // Engine Serial No
  notes?: string;
  // GPS Tracker integration (Protrack GPS / Traccar / GT06 / Coban / Teltonika)
  gpsDeviceId?: string;         // e.g. IMEI / Device ID "868120349201948"
  gpsProvider?: GPSProvider;    // e.g. "protrack" | "traccar" | "teltonika" | "custom_webhook"
  gpsAutoOdometerSync?: boolean;// whether to auto-sync odometer from GPS telemetry
  lastGpsTelemetry?: GPSTelemetry;
}

export interface Driver {
  id: string;
  enterpriseId?: string;      // Multi-tenant enterprise association
  name: string;
  employeeId: string;
  phone: string;
  email: string;
  licenseNumber: string;
  licenseClasses: string;     // e.g. "Light Vehicles, Heavy, Auto"
  licenseExpiryDate: string;  // YYYY-MM-DD
  assignedVehicleId?: string;
  department: string;
  status: 'active' | 'on-leave' | 'inactive';
  emergencyContact: string;
  bloodGroup?: string;
  joinedDate: string;
  avatarUrl?: string;
  licenseDocumentUrl?: string;// Scanned Driver's License image
  dateOfBirth?: string;       // YYYY-MM-DD
  address?: string;           // Physical address
}

export interface RunningChartEntry {
  id: string;
  enterpriseId?: string;
  vehicleId: string;
  driverId: string;
  date: string;               // YYYY-MM-DD
  startTime: string;          // HH:mm
  endTime: string;            // HH:mm
  purpose: string;            // e.g. "Site Visit to Factory 2", "Client Delivery"
  startLocation: string;
  endLocation: string;
  startOdometerKm: number;
  endOdometerKm: number;
  distanceKm: number;         // calculated: end - start
  routeDescription?: string;
  tollOrParkingCost?: number;
  passengers?: string;
  status: 'in-progress' | 'completed';
  remarks?: string;
  createdAt: string;
}

export interface FuelRecord {
  id: string;
  enterpriseId?: string;
  vehicleId: string;
  driverId: string;
  date: string;               // YYYY-MM-DD
  time: string;               // HH:mm
  odometerKm: number;
  fuelType: FuelType;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  stationName: string;
  stationLocation?: string;
  isFullTank: boolean;
  calculatedKmPerLiter?: number; // Calculated relative to previous full tank fill
  invoiceNumber?: string;
  receiptPhotoUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface ServiceSchedule {
  id: string;
  enterpriseId?: string;
  vehicleId: string;
  serviceType: string;        // e.g. "Engine Oil & Filter", "Brake Pad Replacement", "Tire Rotation"
  intervalKm: number;         // e.g. 5000 km
  intervalMonths: number;     // e.g. 6 months
  lastServiceOdometerKm: number;
  lastServiceDate: string;    // YYYY-MM-DD
  nextDueOdometerKm: number;  // lastServiceOdometerKm + intervalKm
  nextDueDate: string;        // calculated next date
  description?: string;
  estimatedCost?: number;
}

export interface MaintenanceLog {
  id: string;
  enterpriseId?: string;
  scheduleId?: string;
  vehicleId: string;
  serviceType: string;
  completedDate: string;
  odometerKm: number;
  performedBy: string;        // Workshop / Mechanic Name
  cost: number;
  invoiceNumber?: string;
  partsReplaced?: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface VehicleConditionChecklist {
  exteriorBody: 'Good' | 'Minor Scratches' | 'Dents / Damage';
  windshieldAndMirrors: 'Good' | 'Cracked' | 'Dirty / Needs Attention';
  tiresAndTread: 'Good (Healthy)' | 'Fair' | 'Worn (Needs Replacement)';
  interiorCleanliness: 'Clean' | 'Moderate' | 'Dirty';
  acAndElectronics: 'Working' | 'Partial Issue' | 'Faulty';
  warningLightsOnDashboard: boolean;
  dashboardWarningDetails?: string;
  spareWheelAndJack: boolean;
  toolKitPresent: boolean;
  fireExtinguisher: boolean;
  firstAidKit: boolean;
  vehicleRegistrationBookPresent: boolean;
  insuranceCardPresent: boolean;
  companyFuelCardPresent: boolean;
}

export interface VehicleTransfer {
  id: string;
  enterpriseId?: string;
  vehicleId: string;
  fromDriverId: string;       // Releasing Driver
  toDriverId: string;         // Receiving Driver
  transferDate: string;       // YYYY-MM-DD
  transferTime: string;       // HH:mm
  handoverLocation: string;
  odometerAtTransferKm: number;
  fuelLevelPercent: number;   // e.g. 100, 75, 50, 25, 10
  conditionChecklist: VehicleConditionChecklist;
  inspectionNotes: string;
  damageRemarks?: string;
  releasingDriverSigned: boolean;
  receivingDriverSigned: boolean;
  releasingDriverSignName: string;
  receivingDriverSignName: string;
  transferReason: string;     // e.g. "Driver shift change", "Reassignment for regional trip", "Driver annual leave"
  status: 'completed' | 'pending-acceptance';
  photos?: string[];
  createdAt: string;
}

export type UserRole = 'admin' | 'dispatcher' | 'driver' | 'viewer';

export interface Enterprise {
  id: string;
  name: string;
  code: string;                 // e.g. "APEX-8902" for public invite/joining
  industry: string;             // e.g. "Supply Chain & Logistics", "Construction", "Courier"
  plan: 'Enterprise Fleet' | 'Professional Fleet' | 'Standard Logistics';
  adminEmail: string;
  adminName: string;
  adminPin: string;             // Local master PIN for enterprise operations
  logoUrl?: string;
  createdAt: string;
  autoApproveJoiners?: boolean; // Whether users joining with code are immediately active
  city?: string;
  country?: string;
}

export interface EnterpriseUser {
  id: string;
  enterpriseId: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'pending-approval' | 'suspended';
  phone?: string;
  department?: string;
  assignedDriverId?: string;   // Link to driver profile if role is 'driver'
  avatarUrl?: string;
  joinedAt: string;
}

export interface EnterpriseInvitation {
  id: string;
  enterpriseId: string;
  email: string;
  role: UserRole;
  code: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'revoked';
}

export interface AdminSecurityConfig {
  userRole: UserRole;
  isAdminAuthenticated: boolean;
}

// ---------------------------------------------------------------------------
// Phase 1: RBAC Permission Matrix & Granular Access Control
// ---------------------------------------------------------------------------
export type Permission =
  | 'VIEW_FLEET'
  | 'MANAGE_VEHICLES'
  | 'MANAGE_DRIVERS'
  | 'MANAGE_TRIPS'
  | 'MANAGE_FUEL'
  | 'MANAGE_MAINTENANCE'
  | 'MANAGE_TRANSFERS'
  | 'VIEW_FINANCIALS'
  | 'MANAGE_ENTERPRISE'
  | 'VIEW_AUDIT_LOGS'
  | 'EXPORT_DATA'
  | 'ADMIN_OVERRIDE';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'VIEW_FLEET',
    'MANAGE_VEHICLES',
    'MANAGE_DRIVERS',
    'MANAGE_TRIPS',
    'MANAGE_FUEL',
    'MANAGE_MAINTENANCE',
    'MANAGE_TRANSFERS',
    'VIEW_FINANCIALS',
    'MANAGE_ENTERPRISE',
    'VIEW_AUDIT_LOGS',
    'EXPORT_DATA',
    'ADMIN_OVERRIDE'
  ],
  dispatcher: [
    'VIEW_FLEET',
    'MANAGE_VEHICLES',
    'MANAGE_DRIVERS',
    'MANAGE_TRIPS',
    'MANAGE_FUEL',
    'MANAGE_MAINTENANCE',
    'MANAGE_TRANSFERS',
    'EXPORT_DATA'
  ],
  driver: [
    'VIEW_FLEET',
    'MANAGE_TRIPS',
    'MANAGE_FUEL',
    'MANAGE_TRANSFERS'
  ],
  viewer: [
    'VIEW_FLEET'
  ]
};

export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(permission);
};

// ---------------------------------------------------------------------------
// Phase 1: Audit Log System Data Model
// ---------------------------------------------------------------------------
export type AuditLogAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'TRANSFER'
  | 'APPROVE'
  | 'REJECT'
  | 'ROLE_CHANGE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'SECURITY_RESET'
  | 'EXPORT'
  | 'SYNC'
  | 'BULK_APPROVE'
  | 'OVERRIDE'
  | 'CORRECTION'
  | 'PAYROLL_LOCK';

export type AuditLogModule =
  | 'VEHICLES'
  | 'DRIVERS'
  | 'TRIPS'
  | 'RUNNING_CHARTS'
  | 'FUEL'
  | 'MAINTENANCE'
  | 'TRANSFERS'
  | 'FLEET'
  | 'ENTERPRISE'
  | 'SECURITY'
  | 'DOCUMENTS'
  | 'STAFF'
  | 'HR'
  | 'ATTENDANCE'
  | 'LEAVE'
  | 'PAYROLL'
  | 'JIBBLE_SYNC'
  | 'GEOFENCE'
  | 'WORKFLOW'
  | 'ALLOCATION'
  | 'SALARY';

export interface AuditLogEntry {
  id: string;
  enterpriseId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditLogAction;
  module: AuditLogModule;
  recordId: string;
  recordTitle?: string;
  details: string;
  oldValue?: any;
  newValue?: any;
  timestamp: string;
  deviceInfo?: string;
}

// ---------------------------------------------------------------------------
// Phase 1: Database Abstraction & Sync Status
// ---------------------------------------------------------------------------
export type DatabaseBackend = 'supabase_postgresql' | 'offline_local_storage';

export interface DatabaseSyncStatus {
  backend: DatabaseBackend;
  isConnected: boolean;
  lastSyncedAt: string;
  pendingSyncCount: number;
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// GPS Tracker Integration (Protrack GPS, Traccar, Teltonika, Concox, Webhooks)
// ---------------------------------------------------------------------------
export type GPSProvider = 'protrack' | 'traccar' | 'teltonika' | 'gt06' | 'custom_webhook' | 'demo_simulator';

export type GPSDeviceStatus = 'online' | 'offline' | 'moving' | 'idling' | 'stopped' | 'alarm';

export interface GPSTelemetry {
  deviceId: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
  speedKmh: number;
  headingDegrees: number;
  odometerKm: number;
  ignition: boolean;
  engineHours?: number;
  fuelLevelPercent?: number;
  batteryVoltage?: number;
  deviceStatus: GPSDeviceStatus;
  satellites?: number;
  gsmSignal?: number; // 1-5 bars or 0-100%
  address?: string;
  lastUpdated: string; // ISO string
  alarmState?: string; // e.g. "overspeed", "geofence_exit", "sos", "power_cut"
}

export interface GPSRoutePoint {
  latitude: number;
  longitude: number;
  speedKmh: number;
  odometerKm: number;
  timestamp: string;
  ignition: boolean;
}

export interface GPSGatewayConfig {
  provider: GPSProvider;
  serverUrl: string; // e.g. "http://api.protrack365.com" or Traccar endpoint
  accountUsername?: string;
  apiToken?: string;
  apiKey?: string;
  webhookSecret?: string;
  syncIntervalSeconds: number;
  autoSyncOdometer: boolean;
  autoCreateRunningChartTrips: boolean;
  autoTripMinDistanceKm: number; // e.g. 0.5 km threshold to finalize a trip
  isConnected: boolean;
  lastHeartbeat?: string;
  pairedDevicesCount: number;
}

// Re-export Staff Directory & HR Types
export * from './types/staffTypes';
