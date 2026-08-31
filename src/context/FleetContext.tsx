import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Vehicle,
  Driver,
  RunningChartEntry,
  FuelRecord,
  ServiceSchedule,
  MaintenanceLog,
  VehicleTransfer,
  VehicleConditionChecklist,
  UserRole,
  Enterprise,
  EnterpriseUser,
  EnterpriseInvitation,
  Permission,
  hasPermission,
  AuditLogEntry,
  AuditLogAction,
  AuditLogModule,
  DatabaseSyncStatus,
  GPSGatewayConfig,
  GPSTelemetry,
  GPSProvider
} from '../types';
import { AuditService } from '../services/audit/auditService';
import { getDatabaseConnectionInfo } from '../services/db/supabaseClient';
import { GPSService } from '../services/gps/gpsService';
import {
  initialVehicles,
  initialDrivers,
  initialRunningCharts,
  initialFuelRecords,
  initialServiceSchedules,
  initialMaintenanceLogs,
  initialTransfers
} from '../data/mockData';
import {
  initialEnterprises,
  initialEnterpriseUsers,
  initialInvitations
} from '../data/enterpriseData';

interface FleetContextType {
  // Enterprise & Multi-Tenancy
  enterprises: Enterprise[];
  currentEnterprise: Enterprise;
  enterpriseUsers: EnterpriseUser[];
  currentEnterpriseUsers: EnterpriseUser[];
  currentUser: EnterpriseUser;
  currentDriver: Driver | undefined;
  userAppointedVehicles: Vehicle[];
  userAppointedVehicle: Vehicle | undefined;
  isDriverRestricted: boolean;
  invitations: EnterpriseInvitation[];
  currentEnterpriseInvitations: EnterpriseInvitation[];
  
  switchEnterprise: (enterpriseId: string) => void;
  loginToEnterpriseByCode: (
    code: string,
    pinOrEmail?: string
  ) => { success: boolean; message: string; enterprise?: Enterprise; user?: EnterpriseUser };
  createEnterprise: (data: {
    name: string;
    industry: string;
    adminName: string;
    adminEmail: string;
    adminPin: string;
    plan?: 'Enterprise Fleet' | 'Professional Fleet' | 'Standard Logistics';
    city?: string;
    country?: string;
  }) => Enterprise;
  updateEnterprise: (id: string, data: Partial<Enterprise>) => void;
  joinEnterpriseByCode: (
    code: string,
    userData: { name: string; email: string; role: UserRole; phone?: string; department?: string }
  ) => { success: boolean; message: string; user?: EnterpriseUser; enterprise?: Enterprise };
  approveEnterpriseUser: (userId: string) => void;
  rejectEnterpriseUser: (userId: string) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  removeUserFromEnterprise: (userId: string) => void;
  createInvitation: (email: string, role: UserRole) => EnterpriseInvitation;
  revokeInvitation: (invitationId: string) => void;
  setCurrentUserById: (userId: string) => void;

  // Fleet Assets & Records (Scoped to current enterprise and user appointment)
  vehicles: Vehicle[];
  allEnterpriseVehicles: Vehicle[];
  drivers: Driver[];
  runningCharts: RunningChartEntry[];
  fuelRecords: FuelRecord[];
  serviceSchedules: ServiceSchedule[];
  maintenanceLogs: MaintenanceLog[];
  transfers: VehicleTransfer[];
  selectedVehicleId: string | 'all';
  setSelectedVehicleId: (id: string | 'all') => void;
  activeVehicle: Vehicle | undefined;
  
  // Actions for Running Chart
  addRunningChart: (entry: Omit<RunningChartEntry, 'id' | 'createdAt'>) => void;
  updateRunningChart: (id: string, entry: Partial<RunningChartEntry>) => void;
  deleteRunningChart: (id: string) => void;

  // Actions for Fuel Records
  addFuelRecord: (record: Omit<FuelRecord, 'id' | 'createdAt'>) => void;
  updateFuelRecord: (id: string, record: Partial<FuelRecord>) => void;
  deleteFuelRecord: (id: string) => void;

  // Actions for Service & Maintenance
  addServiceSchedule: (schedule: Omit<ServiceSchedule, 'id'>) => void;
  updateServiceSchedule: (id: string, schedule: Partial<ServiceSchedule>) => void;
  deleteServiceSchedule: (id: string) => void;
  updateMaintenanceLog: (id: string, log: Partial<MaintenanceLog>) => void;
  deleteMaintenanceLog: (id: string) => void;
  logCompletedMaintenance: (
    scheduleId: string | undefined,
    log: Omit<MaintenanceLog, 'id' | 'createdAt'>,
    newNextIntervalKm?: number,
    newNextIntervalMonths?: number
  ) => void;

  // Actions for Transfers
  executeVehicleTransfer: (transferData: {
    vehicleId: string;
    fromDriverId: string;
    toDriverId: string;
    transferDate: string;
    transferTime: string;
    handoverLocation: string;
    odometerAtTransferKm: number;
    fuelLevelPercent: number;
    conditionChecklist: VehicleConditionChecklist;
    inspectionNotes: string;
    damageRemarks?: string;
    releasingDriverSignName: string;
    receivingDriverSignName: string;
    transferReason: string;
    photos?: string[];
  }) => VehicleTransfer;
  updateVehicleTransfer: (id: string, transfer: Partial<VehicleTransfer>) => void;
  deleteVehicleTransfer: (id: string) => void;

  // Actions for Drivers & Vehicles
  addDriver: (driver: Omit<Driver, 'id'>) => Driver;
  updateDriver: (id: string, driver: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Vehicle;
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;

  // System & Security actions
  resetToSampleData: () => void;
  clearAllData: () => void;
  clearRunningChartHistory: (vehicleId?: string) => void;
  clearFuelHistory: (vehicleId?: string) => void;
  clearMaintenanceHistory: (vehicleId?: string) => void;
  clearTransfersHistory: (vehicleId?: string) => void;
  clearAllFleetHistory: () => void;
  getAlertsCount: () => { overdue: number; dueSoon: number; expiredLicenses: number; totalAlerts: number };

  // Phase 1: RBAC, Audit Logging & Database Architecture
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isAdmin: boolean;
  adminPin: string;
  verifyAdminPin: (pin: string) => boolean;
  setAdminPin: (newPin: string) => boolean;
  loginAsAdmin: (pin: string) => boolean;
  logoutAdmin: () => void;
  checkPermission: (permission: Permission) => boolean;

  // Audit Logs
  auditLogs: AuditLogEntry[];
  getAuditLogs: (filters?: { module?: AuditLogModule; action?: AuditLogAction; searchQuery?: string; limit?: number }) => AuditLogEntry[];
  exportAuditLogs: (format?: 'json' | 'csv') => string;
  refreshAuditLogs: () => void;

  // Database Connection Status
  databaseStatus: DatabaseSyncStatus;

  // GPS Tracker Gateway & Real-Time Telemetry (Protrack / Traccar / GT06)
  gpsConfig: GPSGatewayConfig;
  updateGpsConfig: (config: Partial<GPSGatewayConfig>) => void;
  gpsTelemetries: Record<string, GPSTelemetry>;
  getVehicleTelemetry: (vehicleId: string) => GPSTelemetry | undefined;
  pairGpsDevice: (vehicleId: string, deviceId: string, provider?: GPSProvider, autoSyncOdo?: boolean) => void;
  unpairGpsDevice: (vehicleId: string) => void;
  simulateGpsMotion: () => void;
  syncOdometerFromGps: (vehicleId: string) => number | undefined;
  syncAllOdometersFromGps: () => { updatedCount: number; details: string[] };
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ENTERPRISES: 'fleettrack_enterprises_v3',
  ACTIVE_ENTERPRISE_ID: 'fleettrack_active_ent_v3',
  ENTERPRISE_USERS: 'fleettrack_enterprise_users_v3',
  CURRENT_USER_ID: 'fleettrack_current_user_id_v3',
  INVITATIONS: 'fleettrack_invitations_v3',
  VEHICLES: 'fleettrack_vehicles_v3',
  DRIVERS: 'fleettrack_drivers_v3',
  RUNNING_CHARTS: 'fleettrack_running_charts_v3',
  FUEL_RECORDS: 'fleettrack_fuel_records_v3',
  SERVICE_SCHEDULES: 'fleettrack_schedules_v3',
  MAINTENANCE_LOGS: 'fleettrack_maintenance_logs_v3',
  TRANSFERS: 'fleettrack_transfers_v3',
  SELECTED_VEHICLE: 'fleettrack_selected_veh_v3',
  USER_ROLE: 'fleettrack_user_role_v3',
  ADMIN_PIN: 'fleettrack_admin_pin_v3',
  IS_ADMIN_AUTH: 'fleettrack_is_admin_auth_v3'
};

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Enterprise State
  const [enterprises, setEnterprises] = useState<Enterprise[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ENTERPRISES);
    return saved ? JSON.parse(saved) : initialEnterprises;
  });

  const [activeEnterpriseId, setActiveEnterpriseId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_ENTERPRISE_ID);
    return saved || (initialEnterprises[0]?.id ?? 'ent-apex');
  });

  const [enterpriseUsers, setEnterpriseUsers] = useState<EnterpriseUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ENTERPRISE_USERS);
    return saved ? JSON.parse(saved) : initialEnterpriseUsers;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return saved || 'usr-1';
  });

  const [invitations, setInvitations] = useState<EnterpriseInvitation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVITATIONS);
    return saved ? JSON.parse(saved) : initialInvitations;
  });

  // Fleet Assets & Records (Raw storage arrays across all enterprises)
  const [rawVehicles, setRawVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VEHICLES);
    return saved ? JSON.parse(saved) : initialVehicles;
  });

  const [rawDrivers, setRawDrivers] = useState<Driver[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DRIVERS);
    return saved ? JSON.parse(saved) : initialDrivers;
  });

  const [rawRunningCharts, setRawRunningCharts] = useState<RunningChartEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RUNNING_CHARTS);
    return saved ? JSON.parse(saved) : initialRunningCharts;
  });

  const [rawFuelRecords, setRawFuelRecords] = useState<FuelRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FUEL_RECORDS);
    return saved ? JSON.parse(saved) : initialFuelRecords;
  });

  const [rawServiceSchedules, setRawServiceSchedules] = useState<ServiceSchedule[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICE_SCHEDULES);
    return saved ? JSON.parse(saved) : initialServiceSchedules;
  });

  const [rawMaintenanceLogs, setRawMaintenanceLogs] = useState<MaintenanceLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MAINTENANCE_LOGS);
    return saved ? JSON.parse(saved) : initialMaintenanceLogs;
  });

  const [rawTransfers, setRawTransfers] = useState<VehicleTransfer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
    return saved ? JSON.parse(saved) : initialTransfers;
  });

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | 'all'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_VEHICLE);
    return saved || 'all';
  });

  // Current active enterprise
  const currentEnterprise: Enterprise =
    enterprises.find(e => e.id === activeEnterpriseId) || enterprises[0] || initialEnterprises[0];

  // Scoping helper: legacy mock items without enterpriseId belong to 'ent-apex'
  const matchEnterprise = (item: { enterpriseId?: string }) =>
    (item.enterpriseId || 'ent-apex') === currentEnterprise.id;

  // Scoped lists strictly for current enterprise
  const currentEnterpriseUsers = enterpriseUsers.filter(u => u.enterpriseId === currentEnterprise.id);
  const currentEnterpriseInvitations = invitations.filter(inv => inv.enterpriseId === currentEnterprise.id);

  const enterpriseVehicles = rawVehicles.filter(matchEnterprise);
  const enterpriseDrivers = rawDrivers.filter(matchEnterprise);
  const enterpriseRunningCharts = rawRunningCharts.filter(matchEnterprise);
  const enterpriseFuelRecords = rawFuelRecords.filter(matchEnterprise);
  const enterpriseServiceSchedules = rawServiceSchedules.filter(matchEnterprise);
  const enterpriseMaintenanceLogs = rawMaintenanceLogs.filter(matchEnterprise);
  const enterpriseTransfers = rawTransfers.filter(matchEnterprise);

  // Current logged in user profile
  const currentUser: EnterpriseUser =
    currentEnterpriseUsers.find(u => u.id === currentUserId) ||
    currentEnterpriseUsers[0] || {
      id: 'usr-guest',
      enterpriseId: currentEnterprise.id,
      name: currentEnterprise.adminName || 'Fleet Operator',
      email: currentEnterprise.adminEmail || 'admin@company.com',
      role: 'admin',
      status: 'active',
      joinedAt: new Date().toISOString().split('T')[0]
    };

  // Admin & Role Security State
  const [userRole, setUserRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    return (saved as UserRole) || currentUser.role || 'admin';
  });

  const [adminPin, setAdminPinState] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN);
    return saved || currentEnterprise?.adminPin || '';
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IS_ADMIN_AUTH);
    return saved !== null ? saved === 'true' : true;
  });

  // Keep adminPin in sync with currentEnterprise
  useEffect(() => {
    if (currentEnterprise?.adminPin) {
      setAdminPinState(currentEnterprise.adminPin);
    }
  }, [currentEnterprise?.id, currentEnterprise?.adminPin]);

  const isAdmin = userRole === 'admin' && isAdminAuthenticated;

  // Identify Driver profile associated with currentUser (if any)
  const currentDriver: Driver | undefined = enterpriseDrivers.find(
    d =>
      d.id === currentUser.assignedDriverId ||
      (d.email && currentUser.email && d.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      (d.phone && currentUser.phone && d.phone === currentUser.phone) ||
      (d.name && currentUser.name && d.name.toLowerCase() === currentUser.name.toLowerCase())
  );

  // Identify appointed vehicles for this user / driver
  const userAppointedVehicles: Vehicle[] = enterpriseVehicles.filter(
    v =>
      (currentDriver && v.currentDriverId === currentDriver.id) ||
      (currentDriver?.assignedVehicleId && v.id === currentDriver.assignedVehicleId)
  );

  const userAppointedVehicle: Vehicle | undefined = userAppointedVehicles[0];

  // Determine if driver-level view restriction applies
  const isDriverRestricted = !isAdmin && (userRole === 'driver' || currentUser.role === 'driver');

  // Scoped datasets based on role and appointment
  const vehicles: Vehicle[] = isDriverRestricted
    ? userAppointedVehicles.length > 0
      ? userAppointedVehicles
      : enterpriseVehicles // fallback if driver has no vehicle appointed yet
    : enterpriseVehicles;

  const drivers: Driver[] = isDriverRestricted && currentDriver
    ? [currentDriver]
    : enterpriseDrivers;

  const runningCharts: RunningChartEntry[] = isDriverRestricted
    ? enterpriseRunningCharts.filter(
        rc =>
          userAppointedVehicles.some(v => v.id === rc.vehicleId) ||
          (currentDriver && rc.driverId === currentDriver.id)
      )
    : enterpriseRunningCharts;

  const fuelRecords: FuelRecord[] = isDriverRestricted
    ? enterpriseFuelRecords.filter(
        f =>
          userAppointedVehicles.some(v => v.id === f.vehicleId) ||
          (currentDriver && f.driverId === currentDriver.id)
      )
    : enterpriseFuelRecords;

  const serviceSchedules: ServiceSchedule[] = isDriverRestricted
    ? enterpriseServiceSchedules.filter(s =>
        userAppointedVehicles.some(v => v.id === s.vehicleId)
      )
    : enterpriseServiceSchedules;

  const maintenanceLogs: MaintenanceLog[] = isDriverRestricted
    ? enterpriseMaintenanceLogs.filter(m =>
        userAppointedVehicles.some(v => v.id === m.vehicleId)
      )
    : enterpriseMaintenanceLogs;

  const transfers: VehicleTransfer[] = isDriverRestricted
    ? enterpriseTransfers.filter(
        t =>
          userAppointedVehicles.some(v => v.id === t.vehicleId) ||
          (currentDriver && (t.fromDriverId === currentDriver.id || t.toDriverId === currentDriver.id))
      )
    : enterpriseTransfers;

  // Active selected vehicle
  const activeVehicle: Vehicle | undefined =
    selectedVehicleId === 'all'
      ? isDriverRestricted && userAppointedVehicle
        ? userAppointedVehicle
        : undefined
      : enterpriseVehicles.find(v => v.id === selectedVehicleId);

  const setUserRole = (role: UserRole) => {
    setUserRoleState(role);
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
    if (role === 'admin') {
      setIsAdminAuthenticated(true);
      localStorage.setItem(STORAGE_KEYS.IS_ADMIN_AUTH, 'true');
    } else {
      setIsAdminAuthenticated(false);
      localStorage.setItem(STORAGE_KEYS.IS_ADMIN_AUTH, 'false');
    }
  };

  const verifyAdminPin = (inputPin: string): boolean => {
    if (!inputPin || !inputPin.trim()) return false;
    const effectivePin = currentEnterprise?.adminPin || adminPin;
    if (!effectivePin || !effectivePin.trim()) return false;
    return inputPin.trim() === effectivePin.trim();
  };

  const setAdminPin = (newPin: string): boolean => {
    if (!newPin || newPin.trim().length < 4) return false;
    const cleanPin = newPin.trim();
    setAdminPinState(cleanPin);
    localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, cleanPin);

    // Update in enterprise model as well
    setEnterprises(prev =>
      prev.map(e => (e.id === currentEnterprise.id ? { ...e, adminPin: cleanPin } : e))
    );
    return true;
  };

  const loginAsAdmin = (inputPin: string): boolean => {
    if (verifyAdminPin(inputPin)) {
      setUserRoleState('admin');
      setIsAdminAuthenticated(true);
      localStorage.setItem(STORAGE_KEYS.USER_ROLE, 'admin');
      localStorage.setItem(STORAGE_KEYS.IS_ADMIN_AUTH, 'true');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setUserRoleState('driver');
    setIsAdminAuthenticated(false);
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, 'driver');
    localStorage.setItem(STORAGE_KEYS.IS_ADMIN_AUTH, 'false');
  };

  // Enterprise operations
  const switchEnterprise = (enterpriseId: string) => {
    const target = enterprises.find(e => e.id === enterpriseId);
    if (target) {
      setActiveEnterpriseId(target.id);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ENTERPRISE_ID, target.id);
      
      // Select first user in that enterprise or admin
      const member = enterpriseUsers.find(u => u.enterpriseId === target.id);
      if (member) {
        setCurrentUserId(member.id);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, member.id);
        setUserRoleState(member.role);
        localStorage.setItem(STORAGE_KEYS.USER_ROLE, member.role);
        setIsAdminAuthenticated(member.role === 'admin');
      } else {
        setUserRoleState('admin');
        setIsAdminAuthenticated(true);
      }
      setSelectedVehicleId('all');
    }
  };

  const loginToEnterpriseByCode = (
    code: string,
    pinOrEmail?: string
  ): { success: boolean; message: string; enterprise?: Enterprise; user?: EnterpriseUser } => {
    const cleanCode = code.trim().toUpperCase();
    const target = enterprises.find(e => e.code.toUpperCase() === cleanCode);
    if (!target) {
      return { success: false, message: `Enterprise workspace "${cleanCode}" not found. Check code or register new workspace.` };
    }

    if (pinOrEmail && pinOrEmail.trim()) {
      const trimmed = pinOrEmail.trim();
      if (trimmed === target.adminPin) {
        // Authenticated as Admin
        setActiveEnterpriseId(target.id);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_ENTERPRISE_ID, target.id);
        const adminUser = enterpriseUsers.find(u => u.enterpriseId === target.id && u.role === 'admin') || {
          id: `usr-admin-${target.id}`,
          enterpriseId: target.id,
          name: target.adminName,
          email: target.adminEmail,
          role: 'admin',
          status: 'active',
          joinedAt: target.createdAt
        };
        setCurrentUserId(adminUser.id);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, adminUser.id);
        setUserRoleState('admin');
        setIsAdminAuthenticated(true);
        localStorage.setItem(STORAGE_KEYS.USER_ROLE, 'admin');
        localStorage.setItem(STORAGE_KEYS.IS_ADMIN_AUTH, 'true');
        setSelectedVehicleId('all');
        return { success: true, message: `Successfully logged in to ${target.name} as Administrator!`, enterprise: target, user: adminUser };
      }

      // Check if user email matches member
      const member = enterpriseUsers.find(
        u => u.enterpriseId === target.id && u.email.toLowerCase() === trimmed.toLowerCase()
      );
      if (member) {
        setActiveEnterpriseId(target.id);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_ENTERPRISE_ID, target.id);
        setCurrentUserId(member.id);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, member.id);
        setUserRoleState(member.role);
        setIsAdminAuthenticated(member.role === 'admin');
        localStorage.setItem(STORAGE_KEYS.USER_ROLE, member.role);
        localStorage.setItem(STORAGE_KEYS.IS_ADMIN_AUTH, member.role === 'admin' ? 'true' : 'false');
        setSelectedVehicleId('all');
        return { success: true, message: `Welcome back ${member.name}! Logged in to ${target.name}.`, enterprise: target, user: member };
      }
    }

    // Switch workspace
    switchEnterprise(target.id);
    return { success: true, message: `Connected to ${target.name} workspace.`, enterprise: target };
  };

  const createEnterprise = (data: {
    name: string;
    industry: string;
    adminName: string;
    adminEmail: string;
    adminPin: string;
    plan?: 'Enterprise Fleet' | 'Professional Fleet' | 'Standard Logistics';
    city?: string;
    country?: string;
  }): Enterprise => {
    const newId = `ent-${Date.now().toString(36)}`;
    const randomCode = `${data.name.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || 'FLT'}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newEnterprise: Enterprise = {
      id: newId,
      name: data.name.trim(),
      code: randomCode,
      industry: data.industry.trim() || 'General Transport & Fleet',
      plan: data.plan || 'Enterprise Fleet',
      adminEmail: data.adminEmail.trim(),
      adminName: data.adminName.trim(),
      adminPin: data.adminPin.trim() || '1234',
      city: data.city || 'Headquarters',
      country: data.country || 'Global',
      createdAt: new Date().toISOString().split('T')[0],
      autoApproveJoiners: false,
      logoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=150&auto=format&fit=crop&q=80'
    };

    const adminUser: EnterpriseUser = {
      id: `usr-${Date.now().toString(36)}`,
      enterpriseId: newId,
      name: data.adminName.trim(),
      email: data.adminEmail.trim(),
      role: 'admin',
      status: 'active',
      department: 'Executive Fleet Administration',
      joinedAt: new Date().toISOString().split('T')[0]
    };

    setEnterprises(prev => [newEnterprise, ...prev]);
    setEnterpriseUsers(prev => [adminUser, ...prev]);
    setActiveEnterpriseId(newEnterprise.id);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ENTERPRISE_ID, newEnterprise.id);
    setCurrentUserId(adminUser.id);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, adminUser.id);
    setUserRoleState('admin');
    setIsAdminAuthenticated(true);

    return newEnterprise;
  };

  const updateEnterprise = (id: string, data: Partial<Enterprise>) => {
    setEnterprises(prev => prev.map(e => (e.id === id ? { ...e, ...data } : e)));
  };

  const joinEnterpriseByCode = (
    code: string,
    userData: { name: string; email: string; role: UserRole; phone?: string; department?: string }
  ) => {
    const formattedCode = code.trim().toUpperCase();
    const targetEnterprise = enterprises.find(
      e => e.code.toUpperCase() === formattedCode
    );

    if (!targetEnterprise) {
      return {
        success: false,
        message: `No enterprise found with join code "${code}". Please check the code provided by your Fleet Administrator.`
      };
    }

    // Check if user email is already registered in this enterprise
    const existing = enterpriseUsers.find(
      u => u.enterpriseId === targetEnterprise.id && u.email.toLowerCase() === userData.email.toLowerCase()
    );

    if (existing) {
      // Switch to this user
      setActiveEnterpriseId(targetEnterprise.id);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ENTERPRISE_ID, targetEnterprise.id);
      setCurrentUserId(existing.id);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, existing.id);
      setUserRoleState(existing.role);

      return {
        success: true,
        message: `Welcome back, ${existing.name}! Logged into ${targetEnterprise.name}.`,
        user: existing,
        enterprise: targetEnterprise
      };
    }

    const isAutoApprove = targetEnterprise.autoApproveJoiners ?? false;
    const newUser: EnterpriseUser = {
      id: `usr-${Date.now().toString(36)}`,
      enterpriseId: targetEnterprise.id,
      name: userData.name.trim(),
      email: userData.email.trim(),
      role: userData.role || 'driver',
      status: isAutoApprove ? 'active' : 'pending-approval',
      phone: userData.phone?.trim(),
      department: userData.department?.trim() || 'Operations & Field Team',
      joinedAt: new Date().toISOString().split('T')[0]
    };

    setEnterpriseUsers(prev => [...prev, newUser]);
    setActiveEnterpriseId(targetEnterprise.id);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ENTERPRISE_ID, targetEnterprise.id);
    setCurrentUserId(newUser.id);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);
    setUserRoleState(newUser.role);

    return {
      success: true,
      message: isAutoApprove
        ? `Successfully joined ${targetEnterprise.name} as ${newUser.role}!`
        : `Join request submitted to ${targetEnterprise.name}. Awaiting Admin authorization.`,
      user: newUser,
      enterprise: targetEnterprise
    };
  };

  const approveEnterpriseUser = (userId: string) => {
    setEnterpriseUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, status: 'active' } : u))
    );
  };

  const rejectEnterpriseUser = (userId: string) => {
    setEnterpriseUsers(prev => prev.filter(u => u.id !== userId));
  };

  const updateUserRole = (userId: string, role: UserRole) => {
    setEnterpriseUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, role } : u))
    );
    if (userId === currentUserId) {
      setUserRoleState(role);
    }
  };

  const removeUserFromEnterprise = (userId: string) => {
    setEnterpriseUsers(prev => prev.filter(u => u.id !== userId));
  };

  const createInvitation = (email: string, role: UserRole): EnterpriseInvitation => {
    const code = `${currentEnterprise.code.split('-')[0] || 'INV'}-${Math.floor(100 + Math.random() * 900)}`;
    const newInv: EnterpriseInvitation = {
      id: `inv-${Date.now().toString(36)}`,
      enterpriseId: currentEnterprise.id,
      email: email.trim(),
      role,
      code,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'pending'
    };
    setInvitations(prev => [newInv, ...prev]);
    return newInv;
  };

  const revokeInvitation = (invitationId: string) => {
    setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
  };

  const setCurrentUserById = (userId: string) => {
    const found = enterpriseUsers.find(u => u.id === userId);
    if (found) {
      setCurrentUserId(found.id);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, found.id);
      setUserRoleState(found.role);
      localStorage.setItem(STORAGE_KEYS.USER_ROLE, found.role);
    }
  };

  // LocalStorage synchronizers
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ENTERPRISES, JSON.stringify(enterprises));
  }, [enterprises]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ENTERPRISE_USERS, JSON.stringify(enterpriseUsers));
  }, [enterpriseUsers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(invitations));
  }, [invitations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(rawVehicles));
  }, [rawVehicles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(rawDrivers));
  }, [rawDrivers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RUNNING_CHARTS, JSON.stringify(rawRunningCharts));
  }, [rawRunningCharts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FUEL_RECORDS, JSON.stringify(rawFuelRecords));
  }, [rawFuelRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVICE_SCHEDULES, JSON.stringify(rawServiceSchedules));
  }, [rawServiceSchedules]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE_LOGS, JSON.stringify(rawMaintenanceLogs));
  }, [rawMaintenanceLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(rawTransfers));
  }, [rawTransfers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_VEHICLE, selectedVehicleId);
  }, [selectedVehicleId]);

  const [auditLogVersion, setAuditLogVersion] = useState<number>(0);
  const refreshAuditLogs = () => setAuditLogVersion(v => v + 1);

  const auditLogs = React.useMemo(() => {
    return AuditService.getLogs({ enterpriseId: currentEnterprise.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEnterprise.id, auditLogVersion]);

  const getAuditLogs = (filters?: { module?: AuditLogModule; action?: AuditLogAction; searchQuery?: string; limit?: number }) => {
    return AuditService.getLogs({
      enterpriseId: currentEnterprise.id,
      ...filters
    });
  };

  const exportAuditLogs = (format: 'json' | 'csv' = 'json') => {
    const exported = AuditService.exportAuditTrail(currentEnterprise.id, format);
    logAuditAction({
      action: 'EXPORT',
      module: 'SECURITY',
      recordId: currentEnterprise.id,
      recordTitle: `${currentEnterprise.name} Audit Trail`,
      details: `Exported enterprise audit trail in ${format.toUpperCase()} format.`
    });
    return exported;
  };

  const checkPermission = (permission: Permission): boolean => {
    return hasPermission(userRole, permission);
  };

  const databaseStatus: DatabaseSyncStatus = React.useMemo(() => {
    const dbInfo = getDatabaseConnectionInfo();
    return {
      backend: dbInfo.backend as any,
      isConnected: dbInfo.isConfigured,
      lastSyncedAt: new Date().toISOString(),
      pendingSyncCount: 0
    };
  }, []);

  // Internal helper to log audit actions easily
  const logAuditAction = (params: {
    action: AuditLogAction;
    module: AuditLogModule;
    recordId: string;
    recordTitle?: string;
    details: string;
    oldValue?: any;
    newValue?: any;
  }) => {
    try {
      AuditService.log({
        enterpriseId: currentEnterprise.id,
        userId: currentUser.id,
        userName: currentUser.name || 'Admin',
        userRole: userRole,
        action: params.action,
        module: params.module,
        recordId: params.recordId,
        recordTitle: params.recordTitle,
        details: params.details,
        oldValue: params.oldValue,
        newValue: params.newValue
      });
      setAuditLogVersion(v => v + 1);
    } catch (e) {
      console.warn('Audit log write error:', e);
    }
  };

  // Helper to ensure vehicle odometer stays up to date
  const maybeUpdateVehicleOdometer = (vehicleId: string, candidateOdo: number) => {
    setRawVehicles(prev =>
      prev.map(v => {
        if (v.id === vehicleId && candidateOdo > v.currentOdometerKm) {
          return { ...v, currentOdometerKm: candidateOdo };
        }
        return v;
      })
    );
  };

  // Running Chart CRUD
  const addRunningChart = (entry: Omit<RunningChartEntry, 'id' | 'createdAt'>) => {
    const newEntry: RunningChartEntry = {
      ...entry,
      id: `rc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      enterpriseId: currentEnterprise.id,
      createdAt: new Date().toISOString()
    };
    setRawRunningCharts(prev => [newEntry, ...prev]);
    maybeUpdateVehicleOdometer(entry.vehicleId, entry.endOdometerKm);

    logAuditAction({
      action: 'CREATE',
      module: 'TRIPS',
      recordId: newEntry.id,
      recordTitle: `Trip: ${entry.purpose}`,
      details: `Logged running chart trip for vehicle ID ${entry.vehicleId} (${entry.distanceKm} km).`,
      newValue: newEntry
    });
  };

  const updateRunningChart = (id: string, entry: Partial<RunningChartEntry>) => {
    const existing = rawRunningCharts.find(item => item.id === id);
    setRawRunningCharts(prev =>
      prev.map(item => (item.id === id ? { ...item, ...entry } : item))
    );
    if (entry.vehicleId && entry.endOdometerKm) {
      maybeUpdateVehicleOdometer(entry.vehicleId, entry.endOdometerKm);
    }

    logAuditAction({
      action: 'UPDATE',
      module: 'TRIPS',
      recordId: id,
      recordTitle: `Trip Update`,
      details: `Updated running chart record ${id}.`,
      oldValue: existing,
      newValue: entry
    });
  };

  const deleteRunningChart = (id: string) => {
    const existing = rawRunningCharts.find(item => item.id === id);
    setRawRunningCharts(prev => prev.filter(item => item.id !== id));

    logAuditAction({
      action: 'DELETE',
      module: 'TRIPS',
      recordId: id,
      recordTitle: `Deleted Trip ${id}`,
      details: `Deleted trip record ${id} from running chart.`,
      oldValue: existing
    });
  };

  // Fuel Record CRUD
  const addFuelRecord = (record: Omit<FuelRecord, 'id' | 'createdAt'>) => {
    const newRecord: FuelRecord = {
      ...record,
      id: `fuel-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      enterpriseId: currentEnterprise.id,
      createdAt: new Date().toISOString()
    };
    setRawFuelRecords(prev => [newRecord, ...prev]);
    maybeUpdateVehicleOdometer(record.vehicleId, record.odometerKm);

    logAuditAction({
      action: 'CREATE',
      module: 'FUEL',
      recordId: newRecord.id,
      recordTitle: `Fuel Refill: ${record.liters}L`,
      details: `Logged fuel refill of ${record.liters}L for vehicle ID ${record.vehicleId} at ${record.stationName}.`,
      newValue: newRecord
    });
  };

  const updateFuelRecord = (id: string, updates: Partial<FuelRecord>) => {
    const existing = rawFuelRecords.find(item => item.id === id);
    setRawFuelRecords(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updates } : item))
    );
    if (updates.vehicleId && updates.odometerKm) {
      maybeUpdateVehicleOdometer(updates.vehicleId, updates.odometerKm);
    }

    logAuditAction({
      action: 'UPDATE',
      module: 'FUEL',
      recordId: id,
      recordTitle: `Fuel Refill Update`,
      details: `Updated fuel record ${id}.`,
      oldValue: existing,
      newValue: updates
    });
  };

  const deleteFuelRecord = (id: string) => {
    const existing = rawFuelRecords.find(item => item.id === id);
    setRawFuelRecords(prev => prev.filter(item => item.id !== id));

    logAuditAction({
      action: 'DELETE',
      module: 'FUEL',
      recordId: id,
      recordTitle: `Deleted Fuel Record ${id}`,
      details: `Deleted fuel record ${id}.`,
      oldValue: existing
    });
  };

  // Service & Maintenance
  const addServiceSchedule = (schedule: Omit<ServiceSchedule, 'id'>) => {
    const newSchedule: ServiceSchedule = {
      ...schedule,
      id: `sched-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      enterpriseId: currentEnterprise.id
    };
    setRawServiceSchedules(prev => [...prev, newSchedule]);

    logAuditAction({
      action: 'CREATE',
      module: 'MAINTENANCE',
      recordId: newSchedule.id,
      recordTitle: `Service Schedule: ${schedule.serviceType}`,
      details: `Created maintenance schedule for vehicle ID ${schedule.vehicleId} (Interval: ${schedule.intervalKm} km / ${schedule.intervalMonths} mo).`,
      newValue: newSchedule
    });
  };

  const updateServiceSchedule = (id: string, schedule: Partial<ServiceSchedule>) => {
    const existing = rawServiceSchedules.find(item => item.id === id);
    setRawServiceSchedules(prev =>
      prev.map(item => (item.id === id ? { ...item, ...schedule } : item))
    );

    logAuditAction({
      action: 'UPDATE',
      module: 'MAINTENANCE',
      recordId: id,
      recordTitle: `Service Schedule Update`,
      details: `Updated service schedule ${id}.`,
      oldValue: existing,
      newValue: schedule
    });
  };

  const deleteServiceSchedule = (id: string) => {
    const existing = rawServiceSchedules.find(item => item.id === id);
    setRawServiceSchedules(prev => prev.filter(item => item.id !== id));

    logAuditAction({
      action: 'DELETE',
      module: 'MAINTENANCE',
      recordId: id,
      recordTitle: `Deleted Schedule ${id}`,
      details: `Deleted maintenance schedule ${id}.`,
      oldValue: existing
    });
  };

  const logCompletedMaintenance = (
    scheduleId: string | undefined,
    log: Omit<MaintenanceLog, 'id' | 'createdAt'>,
    newNextIntervalKm?: number,
    newNextIntervalMonths?: number
  ) => {
    const newLog: MaintenanceLog = {
      ...log,
      id: `maint-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      enterpriseId: currentEnterprise.id,
      createdAt: new Date().toISOString()
    };
    setRawMaintenanceLogs(prev => [newLog, ...prev]);
    maybeUpdateVehicleOdometer(log.vehicleId, log.odometerKm);

    if (scheduleId) {
      const schedule = rawServiceSchedules.find(s => s.id === scheduleId);
      if (schedule) {
        const intervalKm = newNextIntervalKm || schedule.intervalKm;
        const intervalMonths = newNextIntervalMonths || schedule.intervalMonths;
        const nextOdo = log.odometerKm + intervalKm;
        
        const completedDate = new Date(log.completedDate);
        const nextDate = new Date(completedDate.setMonth(completedDate.getMonth() + intervalMonths));
        const nextDateStr = nextDate.toISOString().split('T')[0];

        updateServiceSchedule(scheduleId, {
          lastServiceOdometerKm: log.odometerKm,
          lastServiceDate: log.completedDate,
          nextDueOdometerKm: nextOdo,
          nextDueDate: nextDateStr,
          intervalKm,
          intervalMonths
        });
      }
    }

    logAuditAction({
      action: 'CREATE',
      module: 'MAINTENANCE',
      recordId: newLog.id,
      recordTitle: `Completed Service: ${log.serviceType}`,
      details: `Logged completed maintenance for vehicle ID ${log.vehicleId} by ${log.performedBy} (Cost: AED/LKR ${log.cost}).`,
      newValue: newLog
    });
  };

  const updateMaintenanceLog = (id: string, updates: Partial<MaintenanceLog>) => {
    const existing = rawMaintenanceLogs.find(item => item.id === id);
    setRawMaintenanceLogs(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updates } : item))
    );
    if (updates.vehicleId && updates.odometerKm) {
      maybeUpdateVehicleOdometer(updates.vehicleId, updates.odometerKm);
    }

    logAuditAction({
      action: 'UPDATE',
      module: 'MAINTENANCE',
      recordId: id,
      recordTitle: `Maintenance Log Update`,
      details: `Updated maintenance log ${id}.`,
      oldValue: existing,
      newValue: updates
    });
  };

  const deleteMaintenanceLog = (id: string) => {
    const existing = rawMaintenanceLogs.find(item => item.id === id);
    setRawMaintenanceLogs(prev => prev.filter(item => item.id !== id));

    logAuditAction({
      action: 'DELETE',
      module: 'MAINTENANCE',
      recordId: id,
      recordTitle: `Deleted Maintenance Log ${id}`,
      details: `Deleted maintenance log ${id}.`,
      oldValue: existing
    });
  };

  // Vehicle Transfer
  const executeVehicleTransfer = (transferData: {
    vehicleId: string;
    fromDriverId: string;
    toDriverId: string;
    transferDate: string;
    transferTime: string;
    handoverLocation: string;
    odometerAtTransferKm: number;
    fuelLevelPercent: number;
    conditionChecklist: VehicleConditionChecklist;
    inspectionNotes: string;
    damageRemarks?: string;
    releasingDriverSignName: string;
    receivingDriverSignName: string;
    transferReason: string;
    photos?: string[];
  }): VehicleTransfer => {
    const newTransfer: VehicleTransfer = {
      ...transferData,
      id: `trf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      enterpriseId: currentEnterprise.id,
      releasingDriverSigned: true,
      receivingDriverSigned: true,
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    setRawTransfers(prev => [newTransfer, ...prev]);

    setRawVehicles(prev =>
      prev.map(veh => {
        if (veh.id === transferData.vehicleId) {
          return {
            ...veh,
            currentDriverId: transferData.toDriverId,
            currentOdometerKm: Math.max(veh.currentOdometerKm, transferData.odometerAtTransferKm)
          };
        }
        return veh;
      })
    );

    setRawDrivers(prev =>
      prev.map(drv => {
        if (drv.id === transferData.fromDriverId && drv.assignedVehicleId === transferData.vehicleId) {
          return { ...drv, assignedVehicleId: undefined };
        }
        if (drv.id === transferData.toDriverId) {
          return { ...drv, assignedVehicleId: transferData.vehicleId };
        }
        return drv;
      })
    );

    logAuditAction({
      action: 'TRANSFER',
      module: 'TRANSFERS',
      recordId: newTransfer.id,
      recordTitle: `Vehicle Handover: ${transferData.vehicleId}`,
      details: `Executed vehicle handover for vehicle ${transferData.vehicleId} from driver ${transferData.fromDriverId} to ${transferData.toDriverId}.`,
      newValue: newTransfer
    });

    return newTransfer;
  };

  const updateVehicleTransfer = (id: string, updates: Partial<VehicleTransfer>) => {
    setRawTransfers(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteVehicleTransfer = (id: string) => {
    const existing = rawTransfers.find(item => item.id === id);
    setRawTransfers(prev => prev.filter(item => item.id !== id));

    logAuditAction({
      action: 'DELETE',
      module: 'TRANSFERS',
      recordId: id,
      recordTitle: `Deleted Vehicle Transfer ${id}`,
      details: `Deleted vehicle handover transfer ${id}.`,
      oldValue: existing
    });
  };

  // Driver CRUD
  const addDriver = (driver: Omit<Driver, 'id'>): Driver => {
    const newDriver: Driver = {
      ...driver,
      id: `drv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      enterpriseId: currentEnterprise.id
    };
    setRawDrivers(prev => [...prev, newDriver]);

    if (driver.assignedVehicleId) {
      setRawVehicles(prev =>
        prev.map(v => (v.id === driver.assignedVehicleId ? { ...v, currentDriverId: newDriver.id } : v))
      );
    }

    logAuditAction({
      action: 'CREATE',
      module: 'DRIVERS',
      recordId: newDriver.id,
      recordTitle: `Driver: ${driver.name}`,
      details: `Registered new driver ${driver.name} (License: ${driver.licenseNumber}, Employee ID: ${driver.employeeId}).`,
      newValue: newDriver
    });

    return newDriver;
  };

  const updateDriver = (id: string, driver: Partial<Driver>) => {
    const existing = rawDrivers.find(item => item.id === id);
    setRawDrivers(prev =>
      prev.map(item => (item.id === id ? { ...item, ...driver } : item))
    );
    if (driver.assignedVehicleId) {
      setRawVehicles(prev =>
        prev.map(v => (v.id === driver.assignedVehicleId ? { ...v, currentDriverId: id } : v))
      );
    }

    logAuditAction({
      action: 'UPDATE',
      module: 'DRIVERS',
      recordId: id,
      recordTitle: `Driver Update: ${driver.name || existing?.name || id}`,
      details: `Updated driver profile for ${existing?.name || id}.`,
      oldValue: existing,
      newValue: driver
    });
  };

  const deleteDriver = (id: string) => {
    const existing = rawDrivers.find(item => item.id === id);
    setRawDrivers(prev => prev.filter(item => item.id !== id));
    setRawVehicles(prev =>
      prev.map(v => (v.currentDriverId === id ? { ...v, currentDriverId: '' } : v))
    );

    logAuditAction({
      action: 'DELETE',
      module: 'DRIVERS',
      recordId: id,
      recordTitle: `Deleted Driver: ${existing?.name || id}`,
      details: `Removed driver ${existing?.name || id} from enterprise roster.`,
      oldValue: existing
    });
  };

  // Vehicle CRUD
  const addVehicle = (vehicle: Omit<Vehicle, 'id'>): Vehicle => {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: `veh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      enterpriseId: currentEnterprise.id
    };
    setRawVehicles(prev => [...prev, newVehicle]);

    if (vehicle.currentDriverId) {
      setRawDrivers(prev =>
        prev.map(d => (d.id === vehicle.currentDriverId ? { ...d, assignedVehicleId: newVehicle.id } : d))
      );
    }

    logAuditAction({
      action: 'CREATE',
      module: 'VEHICLES',
      recordId: newVehicle.id,
      recordTitle: `Vehicle: ${vehicle.registrationNumber}`,
      details: `Added new vehicle ${vehicle.registrationNumber} (${vehicle.make} ${vehicle.model} - ${vehicle.year}).`,
      newValue: newVehicle
    });

    return newVehicle;
  };

  const updateVehicle = (id: string, vehicle: Partial<Vehicle>) => {
    const existing = rawVehicles.find(item => item.id === id);
    setRawVehicles(prev =>
      prev.map(item => (item.id === id ? { ...item, ...vehicle } : item))
    );
    if (vehicle.currentDriverId) {
      setRawDrivers(prev =>
        prev.map(d => (d.id === vehicle.currentDriverId ? { ...d, assignedVehicleId: id } : d))
      );
    }

    logAuditAction({
      action: 'UPDATE',
      module: 'VEHICLES',
      recordId: id,
      recordTitle: `Vehicle Update: ${vehicle.registrationNumber || existing?.registrationNumber || id}`,
      details: `Updated vehicle specifications for ${existing?.registrationNumber || id}.`,
      oldValue: existing,
      newValue: vehicle
    });
  };

  const deleteVehicle = (id: string) => {
    const existing = rawVehicles.find(item => item.id === id);
    setRawVehicles(prev => prev.filter(item => item.id !== id));
    if (selectedVehicleId === id) {
      setSelectedVehicleId('all');
    }

    logAuditAction({
      action: 'DELETE',
      module: 'VEHICLES',
      recordId: id,
      recordTitle: `Deleted Vehicle: ${existing?.registrationNumber || id}`,
      details: `Deleted vehicle asset ${existing?.registrationNumber || id} from enterprise fleet.`,
      oldValue: existing
    });
  };

  // Reset to sample data
  const resetToSampleData = () => {
    localStorage.setItem(STORAGE_KEYS.ENTERPRISES, JSON.stringify(initialEnterprises));
    localStorage.setItem(STORAGE_KEYS.ENTERPRISE_USERS, JSON.stringify(initialEnterpriseUsers));
    localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(initialInvitations));
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(initialVehicles));
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(initialDrivers));
    localStorage.setItem(STORAGE_KEYS.RUNNING_CHARTS, JSON.stringify(initialRunningCharts));
    localStorage.setItem(STORAGE_KEYS.FUEL_RECORDS, JSON.stringify(initialFuelRecords));
    localStorage.setItem(STORAGE_KEYS.SERVICE_SCHEDULES, JSON.stringify(initialServiceSchedules));
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE_LOGS, JSON.stringify(initialMaintenanceLogs));
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(initialTransfers));
    localStorage.setItem(STORAGE_KEYS.SELECTED_VEHICLE, 'all');
    localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, '1234');

    setEnterprises(initialEnterprises);
    setEnterpriseUsers(initialEnterpriseUsers);
    setInvitations(initialInvitations);
    setActiveEnterpriseId('ent-apex');
    setCurrentUserId('usr-1');
    setRawVehicles(initialVehicles);
    setRawDrivers(initialDrivers);
    setRawRunningCharts(initialRunningCharts);
    setRawFuelRecords(initialFuelRecords);
    setRawServiceSchedules(initialServiceSchedules);
    setRawMaintenanceLogs(initialMaintenanceLogs);
    setRawTransfers(initialTransfers);
    setSelectedVehicleId('all');
    setAdminPinState('1234');
    setUserRoleState('admin');
    setIsAdminAuthenticated(true);
  };

  // Clear all data
  const clearAllData = () => {
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.RUNNING_CHARTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.FUEL_RECORDS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SERVICE_SCHEDULES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE_LOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SELECTED_VEHICLE, 'all');

    setRawVehicles([]);
    setRawDrivers([]);
    setRawRunningCharts([]);
    setRawFuelRecords([]);
    setRawServiceSchedules([]);
    setRawMaintenanceLogs([]);
    setRawTransfers([]);
    setSelectedVehicleId('all');

    logAuditAction({
      action: 'DELETE',
      module: 'VEHICLES',
      recordId: 'all-fleet-data',
      recordTitle: 'Full Fleet Wipe',
      details: 'Administrator purged all vehicles, drivers, trips, fuel, maintenance, and transfer records.'
    });
  };

  // Clear Running Chart History
  const clearRunningChartHistory = (vehicleId?: string) => {
    if (vehicleId && vehicleId !== 'all') {
      setRawRunningCharts(prev => {
        const remaining = prev.filter(rc => rc.vehicleId !== vehicleId);
        localStorage.setItem(STORAGE_KEYS.RUNNING_CHARTS, JSON.stringify(remaining));
        return remaining;
      });
      logAuditAction({
        action: 'DELETE',
        module: 'RUNNING_CHARTS',
        recordId: vehicleId,
        recordTitle: `Vehicle Trip Logs: ${vehicleId}`,
        details: `Administrator cleared trip history logs for vehicle ${vehicleId}.`
      });
    } else {
      localStorage.setItem(STORAGE_KEYS.RUNNING_CHARTS, JSON.stringify([]));
      setRawRunningCharts([]);
      logAuditAction({
        action: 'DELETE',
        module: 'RUNNING_CHARTS',
        recordId: 'all-trips',
        recordTitle: 'All Fleet Running Charts',
        details: 'Administrator cleared all running chart and trip odometer history.'
      });
    }
  };

  // Clear Fuel Records History
  const clearFuelHistory = (vehicleId?: string) => {
    if (vehicleId && vehicleId !== 'all') {
      setRawFuelRecords(prev => {
        const remaining = prev.filter(f => f.vehicleId !== vehicleId);
        localStorage.setItem(STORAGE_KEYS.FUEL_RECORDS, JSON.stringify(remaining));
        return remaining;
      });
      logAuditAction({
        action: 'DELETE',
        module: 'FUEL',
        recordId: vehicleId,
        recordTitle: `Vehicle Fuel Records: ${vehicleId}`,
        details: `Administrator cleared fuel logs and receipts for vehicle ${vehicleId}.`
      });
    } else {
      localStorage.setItem(STORAGE_KEYS.FUEL_RECORDS, JSON.stringify([]));
      setRawFuelRecords([]);
      logAuditAction({
        action: 'DELETE',
        module: 'FUEL',
        recordId: 'all-fuel',
        recordTitle: 'All Fleet Fuel Logs',
        details: 'Administrator cleared all fuel logs, liters, and station invoice records.'
      });
    }
  };

  // Clear Maintenance & Service History
  const clearMaintenanceHistory = (vehicleId?: string) => {
    if (vehicleId && vehicleId !== 'all') {
      setRawMaintenanceLogs(prev => {
        const remaining = prev.filter(m => m.vehicleId !== vehicleId);
        localStorage.setItem(STORAGE_KEYS.MAINTENANCE_LOGS, JSON.stringify(remaining));
        return remaining;
      });
      logAuditAction({
        action: 'DELETE',
        module: 'MAINTENANCE',
        recordId: vehicleId,
        recordTitle: `Vehicle Maintenance: ${vehicleId}`,
        details: `Administrator cleared maintenance log history for vehicle ${vehicleId}.`
      });
    } else {
      localStorage.setItem(STORAGE_KEYS.MAINTENANCE_LOGS, JSON.stringify([]));
      setRawMaintenanceLogs([]);
      logAuditAction({
        action: 'DELETE',
        module: 'MAINTENANCE',
        recordId: 'all-maintenance',
        recordTitle: 'All Fleet Maintenance Logs',
        details: 'Administrator cleared all completed maintenance service records and garage invoices.'
      });
    }
  };

  // Clear Vehicle Transfers History
  const clearTransfersHistory = (vehicleId?: string) => {
    if (vehicleId && vehicleId !== 'all') {
      setRawTransfers(prev => {
        const remaining = prev.filter(t => t.vehicleId !== vehicleId);
        localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(remaining));
        return remaining;
      });
      logAuditAction({
        action: 'DELETE',
        module: 'TRANSFERS',
        recordId: vehicleId,
        recordTitle: `Vehicle Transfers: ${vehicleId}`,
        details: `Administrator cleared handover history for vehicle ${vehicleId}.`
      });
    } else {
      localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify([]));
      setRawTransfers([]);
      logAuditAction({
        action: 'DELETE',
        module: 'TRANSFERS',
        recordId: 'all-transfers',
        recordTitle: 'All Vehicle Transfers',
        details: 'Administrator cleared all driver handover transfer records.'
      });
    }
  };

  // Clear All Operational Fleet History (Keeps vehicles & drivers safe)
  const clearAllFleetHistory = () => {
    localStorage.setItem(STORAGE_KEYS.RUNNING_CHARTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.FUEL_RECORDS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE_LOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify([]));

    setRawRunningCharts([]);
    setRawFuelRecords([]);
    setRawMaintenanceLogs([]);
    setRawTransfers([]);

    logAuditAction({
      action: 'DELETE',
      module: 'FLEET',
      recordId: 'all-fleet-history',
      recordTitle: 'All Fleet Operational History Purged',
      details: 'Administrator purged all trip logs, fuel receipts, service history, and transfers while preserving vehicle assets and drivers.'
    });
  };

  const getAlertsCount = () => {
    let overdue = 0;
    let dueSoon = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    serviceSchedules.forEach(schedule => {
      const veh = enterpriseVehicles.find(v => v.id === schedule.vehicleId);
      const odo = veh?.currentOdometerKm || schedule.lastServiceOdometerKm;
      const kmRemaining = schedule.nextDueOdometerKm - odo;
      const daysRemaining = Math.ceil((new Date(schedule.nextDueDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));

      if (kmRemaining <= 0 || daysRemaining <= 0) {
        overdue++;
      } else if (kmRemaining <= 500 || daysRemaining <= 14) {
        dueSoon++;
      }
    });

    let expiredLicenses = 0;
    drivers.forEach(d => {
      const daysLeft = Math.ceil((new Date(d.licenseExpiryDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 30) {
        expiredLicenses++;
      }
    });

    return {
      overdue,
      dueSoon,
      expiredLicenses,
      totalAlerts: overdue + dueSoon + expiredLicenses
    };
  };

  // ---------------------------------------------------------------------------
  // GPS Tracker Gateway Integration (Protrack / Traccar / GT06 / Coban / Telemetry)
  // ---------------------------------------------------------------------------
  const [gpsConfig, setGpsConfig] = useState<GPSGatewayConfig>(() => GPSService.getConfig());
  const [gpsTelemetries, setGpsTelemetries] = useState<Record<string, GPSTelemetry>>(() => GPSService.getTelemetries());

  const updateGpsConfig = (newCfg: Partial<GPSGatewayConfig>) => {
    setGpsConfig(prev => {
      const updated = { ...prev, ...newCfg, lastHeartbeat: new Date().toISOString() };
      GPSService.saveConfig(updated);
      return updated;
    });
  };

  const getVehicleTelemetry = (vehicleId: string): GPSTelemetry | undefined => {
    return gpsTelemetries[vehicleId];
  };

  const pairGpsDevice = (vehicleId: string, deviceId: string, provider: GPSProvider = gpsConfig.provider, autoSyncOdo = true) => {
    updateVehicle(vehicleId, {
      gpsDeviceId: deviceId,
      gpsProvider: provider,
      gpsAutoOdometerSync: autoSyncOdo
    });

    // Seed or update telemetry for this vehicle
    const existing = gpsTelemetries[vehicleId];
    const targetVeh = rawVehicles.find(v => v.id === vehicleId);
    const updatedTelemetry: GPSTelemetry = existing || {
      deviceId,
      vehicleId,
      latitude: 6.9271,
      longitude: 79.8612,
      speedKmh: 0,
      headingDegrees: 0,
      odometerKm: targetVeh?.currentOdometerKm || 45000,
      ignition: false,
      deviceStatus: 'online',
      satellites: 12,
      gsmSignal: 90,
      address: 'Central Colombo Fleet Depot',
      lastUpdated: new Date().toISOString()
    };

    const newMap = { ...gpsTelemetries, [vehicleId]: updatedTelemetry };
    setGpsTelemetries(newMap);
    GPSService.saveTelemetries(newMap);

    AuditService.log({
      enterpriseId: currentEnterprise.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole,
      action: 'UPDATE',
      module: 'VEHICLES',
      recordId: vehicleId,
      recordTitle: targetVeh?.registrationNumber,
      details: `Paired GPS tracker hardware (${provider.toUpperCase()} Device IMEI/ID: ${deviceId}) to vehicle.`
    });
  };

  const unpairGpsDevice = (vehicleId: string) => {
    const targetVeh = rawVehicles.find(v => v.id === vehicleId);
    updateVehicle(vehicleId, {
      gpsDeviceId: undefined,
      gpsProvider: undefined,
      gpsAutoOdometerSync: undefined
    });

    const newMap = { ...gpsTelemetries };
    delete newMap[vehicleId];
    setGpsTelemetries(newMap);
    GPSService.saveTelemetries(newMap);

    AuditService.log({
      enterpriseId: currentEnterprise.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole,
      action: 'UPDATE',
      module: 'VEHICLES',
      recordId: vehicleId,
      recordTitle: targetVeh?.registrationNumber,
      details: `Unpaired GPS tracker hardware from vehicle.`
    });
  };

  const simulateGpsMotion = () => {
    setGpsTelemetries(prev => {
      const updated: Record<string, GPSTelemetry> = { ...prev };
      Object.keys(updated).forEach(vId => {
        const item = updated[vId];
        if (!item) return;

        // If moving, increment coordinates slightly and speed
        const isMoving = Math.random() > 0.4;
        const speedDelta = isMoving ? Math.floor(20 + Math.random() * 45) : 0;
        const latJitter = isMoving ? (Math.random() - 0.5) * 0.002 : 0;
        const lngJitter = isMoving ? (Math.random() - 0.5) * 0.002 : 0;
        const odoGain = isMoving ? Math.floor(Math.random() * 2) + 1 : 0;

        updated[vId] = {
          ...item,
          speedKmh: speedDelta,
          deviceStatus: isMoving ? 'moving' : 'stopped',
          ignition: isMoving,
          latitude: Number((item.latitude + latJitter).toFixed(5)),
          longitude: Number((item.longitude + lngJitter).toFixed(5)),
          odometerKm: item.odometerKm + odoGain,
          headingDegrees: (item.headingDegrees + (isMoving ? 15 : 0)) % 360,
          lastUpdated: new Date().toISOString()
        };
      });
      GPSService.saveTelemetries(updated);
      return updated;
    });
  };

  const syncOdometerFromGps = (vehicleId: string): number | undefined => {
    const tele = gpsTelemetries[vehicleId];
    const veh = rawVehicles.find(v => v.id === vehicleId);
    if (!tele || !veh) return undefined;

    if (tele.odometerKm > veh.currentOdometerKm) {
      updateVehicle(vehicleId, { currentOdometerKm: tele.odometerKm });
      AuditService.log({
        enterpriseId: currentEnterprise.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole,
        action: 'UPDATE',
        module: 'VEHICLES',
        recordId: vehicleId,
        recordTitle: veh.registrationNumber,
        details: `GPS telemetry synchronized vehicle odometer from ${veh.currentOdometerKm} km to ${tele.odometerKm} km.`
      });
      return tele.odometerKm;
    }
    return veh.currentOdometerKm;
  };

  const syncAllOdometersFromGps = (): { updatedCount: number; details: string[] } => {
    let count = 0;
    const details: string[] = [];

    enterpriseVehicles.forEach(veh => {
      const tele = gpsTelemetries[veh.id];
      if (tele && tele.odometerKm > veh.currentOdometerKm) {
        updateVehicle(veh.id, { currentOdometerKm: tele.odometerKm });
        count++;
        details.push(`${veh.registrationNumber}: ${veh.currentOdometerKm} → ${tele.odometerKm} km`);
      }
    });

    return { updatedCount: count, details };
  };

  // Periodic heartbeat sync simulation
  useEffect(() => {
    const interval = setInterval(() => {
      if (gpsConfig.isConnected) {
        simulateGpsMotion();
      }
    }, (gpsConfig.syncIntervalSeconds || 10) * 1000);

    return () => clearInterval(interval);
  }, [gpsConfig.isConnected, gpsConfig.syncIntervalSeconds]);

  return (
    <FleetContext.Provider
      value={{
        enterprises,
        currentEnterprise,
        enterpriseUsers,
        currentEnterpriseUsers,
        currentUser,
        currentDriver,
        userAppointedVehicles,
        userAppointedVehicle,
        isDriverRestricted,
        invitations,
        currentEnterpriseInvitations,
        switchEnterprise,
        loginToEnterpriseByCode,
        createEnterprise,
        updateEnterprise,
        joinEnterpriseByCode,
        approveEnterpriseUser,
        rejectEnterpriseUser,
        updateUserRole,
        removeUserFromEnterprise,
        createInvitation,
        revokeInvitation,
        setCurrentUserById,
        vehicles,
        allEnterpriseVehicles: enterpriseVehicles,
        drivers,
        runningCharts,
        fuelRecords,
        serviceSchedules,
        maintenanceLogs,
        transfers,
        selectedVehicleId,
        setSelectedVehicleId,
        activeVehicle,
        addRunningChart,
        updateRunningChart,
        deleteRunningChart,
        addFuelRecord,
        updateFuelRecord,
        deleteFuelRecord,
        addServiceSchedule,
        updateServiceSchedule,
        deleteServiceSchedule,
        updateMaintenanceLog,
        deleteMaintenanceLog,
        logCompletedMaintenance,
        executeVehicleTransfer,
        updateVehicleTransfer,
        deleteVehicleTransfer,
        addDriver,
        updateDriver,
        deleteDriver,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        resetToSampleData,
        clearAllData,
        clearRunningChartHistory,
        clearFuelHistory,
        clearMaintenanceHistory,
        clearTransfersHistory,
        clearAllFleetHistory,
        getAlertsCount,
        userRole,
        setUserRole,
        isAdmin,
        adminPin,
        verifyAdminPin,
        setAdminPin,
        loginAsAdmin,
        logoutAdmin,
        checkPermission,
        auditLogs,
        getAuditLogs,
        exportAuditLogs,
        refreshAuditLogs,
        databaseStatus,
        gpsConfig,
        updateGpsConfig,
        gpsTelemetries,
        getVehicleTelemetry,
        pairGpsDevice,
        unpairGpsDevice,
        simulateGpsMotion,
        syncOdometerFromGps,
        syncAllOdometersFromGps
      }}
    >
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
};
