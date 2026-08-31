import {
  Enterprise,
  EnterpriseUser,
  Vehicle,
  Driver,
  RunningChartEntry,
  FuelRecord,
  ServiceSchedule,
  MaintenanceLog,
  VehicleTransfer,
  AuditLogEntry
} from '../../types';

export interface DatabaseQueryOptions {
  enterpriseId: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface DatabaseResult<T> {
  data: T | null;
  error: string | null;
  source: 'cloud' | 'local_cache';
}

export interface DatabaseListResult<T> {
  data: T[];
  count: number;
  error: string | null;
  source: 'cloud' | 'local_cache';
}

/**
 * PostgreSQL / Supabase Schema Definition & RLS Policy Metadata
 * Used for production database provisioning and migration
 */
export const POSTGRESQL_DDL_SCHEMA = `
-- ===========================================================================
-- FLEETTRACK GCC 2.0 — SUPABASE / POSTGRESQL MULTI-TENANT DDL SCHEMA
-- ===========================================================================

-- 1. Enterprises Table
CREATE TABLE IF NOT EXISTS enterprises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  industry TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'Enterprise Fleet',
  admin_email TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  admin_pin_hash TEXT NOT NULL,
  city TEXT,
  country TEXT,
  logo_url TEXT,
  auto_approve_joiners BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enterprise Users Table
CREATE TABLE IF NOT EXISTS enterprise_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'dispatcher', 'driver', 'viewer')),
  status TEXT NOT NULL CHECK (status IN ('active', 'pending-approval', 'suspended')) DEFAULT 'active',
  phone TEXT,
  department TEXT,
  assigned_driver_id UUID,
  avatar_url TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(enterprise_id, email)
);

-- 3. Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  registration_number TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT NOT NULL,
  type TEXT NOT NULL,
  fuel_type TEXT NOT NULL,
  tank_capacity_liters NUMERIC NOT NULL,
  current_odometer_km NUMERIC NOT NULL DEFAULT 0,
  current_driver_id UUID,
  status TEXT NOT NULL DEFAULT 'active',
  insurance_expiry_date DATE,
  revenue_license_expiry_date DATE,
  department TEXT,
  chassis_number TEXT,
  engine_number TEXT,
  photo_url TEXT,
  registration_doc_url TEXT,
  insurance_doc_url TEXT,
  revenue_license_doc_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(enterprise_id, registration_number)
);

-- 4. Drivers Table
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  license_number TEXT NOT NULL,
  license_classes TEXT,
  license_expiry_date DATE NOT NULL,
  assigned_vehicle_id UUID,
  department TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  emergency_contact TEXT,
  blood_group TEXT,
  joined_date DATE,
  date_of_birth DATE,
  address TEXT,
  avatar_url TEXT,
  license_document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(enterprise_id, employee_id)
);

-- 5. Running Chart Trips Table
CREATE TABLE IF NOT EXISTS running_chart_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  purpose TEXT NOT NULL,
  start_location TEXT NOT NULL,
  end_location TEXT NOT NULL,
  start_odometer_km NUMERIC NOT NULL,
  end_odometer_km NUMERIC,
  distance_km NUMERIC,
  route_description TEXT,
  toll_or_parking_cost NUMERIC DEFAULT 0,
  passengers TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Fuel Records Table
CREATE TABLE IF NOT EXISTS fuel_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  odometer_km NUMERIC NOT NULL,
  fuel_type TEXT NOT NULL,
  liters NUMERIC NOT NULL,
  price_per_liter NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  station_name TEXT NOT NULL,
  station_location TEXT,
  is_full_tank BOOLEAN DEFAULT TRUE,
  calculated_km_per_liter NUMERIC,
  invoice_number TEXT,
  receipt_photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Service Schedules & Maintenance Logs
CREATE TABLE IF NOT EXISTS service_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  interval_km NUMERIC NOT NULL,
  interval_months INT NOT NULL,
  last_service_odometer_km NUMERIC NOT NULL,
  last_service_date DATE NOT NULL,
  next_due_odometer_km NUMERIC NOT NULL,
  next_due_date DATE NOT NULL,
  description TEXT,
  estimated_cost NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES service_schedules(id) ON DELETE SET NULL,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  completed_date DATE NOT NULL,
  odometer_km NUMERIC NOT NULL,
  performed_by TEXT NOT NULL,
  cost NUMERIC NOT NULL,
  invoice_number TEXT,
  parts_replaced TEXT,
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Vehicle Transfers Table
CREATE TABLE IF NOT EXISTS vehicle_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  from_driver_id UUID NOT NULL REFERENCES drivers(id),
  to_driver_id UUID NOT NULL REFERENCES drivers(id),
  transfer_date DATE NOT NULL,
  transfer_time TIME NOT NULL,
  handover_location TEXT NOT NULL,
  odometer_at_transfer_km NUMERIC NOT NULL,
  fuel_level_percent INT NOT NULL,
  condition_checklist JSONB NOT NULL,
  inspection_notes TEXT,
  damage_remarks TEXT,
  releasing_driver_sign_name TEXT NOT NULL,
  receiving_driver_sign_name TEXT NOT NULL,
  transfer_reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  photos JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Permanent Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  record_id TEXT NOT NULL,
  record_title TEXT,
  details TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  device_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict multi-tenant isolation based on auth.jwt()->>'enterprise_id'
-- ---------------------------------------------------------------------------
ALTER TABLE enterprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE running_chart_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
CREATE POLICY "Tenants isolate vehicles" ON vehicles
  USING (enterprise_id = (auth.jwt()->>'enterprise_id')::uuid);

CREATE POLICY "Tenants isolate drivers" ON drivers
  USING (enterprise_id = (auth.jwt()->>'enterprise_id')::uuid);

CREATE POLICY "Tenants isolate trips" ON running_chart_trips
  USING (enterprise_id = (auth.jwt()->>'enterprise_id')::uuid);

CREATE POLICY "Tenants isolate fuel" ON fuel_records
  USING (enterprise_id = (auth.jwt()->>'enterprise_id')::uuid);

CREATE POLICY "Tenants isolate maintenance" ON maintenance_logs
  USING (enterprise_id = (auth.jwt()->>'enterprise_id')::uuid);

CREATE POLICY "Tenants isolate audit logs" ON audit_logs
  USING (enterprise_id = (auth.jwt()->>'enterprise_id')::uuid);
`;
