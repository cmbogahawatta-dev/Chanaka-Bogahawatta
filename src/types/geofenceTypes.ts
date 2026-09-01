export interface ProjectGeofence {
  id: string;
  geofenceId: string;         // e.g. "GF-0001"
  projectId: string;          // FK to Project.id / projectCode (e.g. "PIDM 26")
  siteName: string;           // e.g. "PIDM 26 Site Yard, Ch 14+200"
  latitude: number;
  longitude: number;
  radiusMeters: number;       // e.g. 250
  activeFrom: string;         // YYYY-MM-DD
  activeTo?: string;          // YYYY-MM-DD
  status: 'Active' | 'Inactive';
  jibbleLocationId?: string;  // mapping to Jibble location if mirrored
  address?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}
