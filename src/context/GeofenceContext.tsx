import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProjectGeofence } from '../types/geofenceTypes';
import { initialProjectGeofences } from '../data/hrInitialData';
import { AuditService } from '../services/audit/auditService';

const GEOFENCE_STORAGE_KEY = 'ema_project_geofences_v1';

interface GeofenceContextType {
  geofences: ProjectGeofence[];
  getGeofence: (id: string) => ProjectGeofence | undefined;
  getGeofencesForProject: (projectId: string) => ProjectGeofence[];
  createGeofence: (data: Omit<ProjectGeofence, 'id' | 'geofenceId' | 'createdAt' | 'updatedAt'>) => ProjectGeofence;
  updateGeofence: (id: string, updates: Partial<ProjectGeofence>) => void;
  deleteGeofence: (id: string) => void;
  evaluatePointAgainstGeofence: (
    lat: number,
    lng: number,
    projectId: string
  ) => { isInside: boolean; nearestGeofence?: ProjectGeofence; distanceMeters: number };
  resetGeofencesToDefault: () => void;
}

const GeofenceContext = createContext<GeofenceContextType | undefined>(undefined);

// Haversine formula to compute great-circle distance between two GPS coordinates
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export const GeofenceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [geofences, setGeofences] = useState<ProjectGeofence[]>(() => {
    try {
      const saved = localStorage.getItem(GEOFENCE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading geofences from storage:', e);
    }
    return initialProjectGeofences;
  });

  const saveGeofences = (newGeofences: ProjectGeofence[]) => {
    setGeofences(newGeofences);
    try {
      localStorage.setItem(GEOFENCE_STORAGE_KEY, JSON.stringify(newGeofences));
    } catch (e) {
      console.error('Failed to save geofences:', e);
    }
  };

  const getGeofence = (id: string): ProjectGeofence | undefined => {
    return geofences.find(g => g.id === id || g.geofenceId === id);
  };

  const getGeofencesForProject = (projectId: string): ProjectGeofence[] => {
    return geofences.filter(
      g => (g.projectId.toUpperCase() === projectId.toUpperCase() || projectId === 'ALL') && g.status === 'Active'
    );
  };

  const createGeofence = (
    data: Omit<ProjectGeofence, 'id' | 'geofenceId' | 'createdAt' | 'updatedAt'>
  ): ProjectGeofence => {
    const nextSeq = geofences.length + 1;
    const geofenceId = `GF-${nextSeq.toString().padStart(4, '0')}`;
    const newId = `gf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const newRecord: ProjectGeofence = {
      ...data,
      id: newId,
      geofenceId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [...geofences, newRecord];
    saveGeofences(updated);

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: 'system',
      userName: data.createdBy || 'Admin',
      userRole: 'admin',
      action: 'CREATE',
      module: 'GEOFENCE',
      recordId: geofenceId,
      recordTitle: data.siteName,
      details: `Configured new site geofence for project ${data.projectId} at [${data.latitude}, ${data.longitude}], radius ${data.radiusMeters}m`
    });

    return newRecord;
  };

  const updateGeofence = (id: string, updates: Partial<ProjectGeofence>) => {
    const updated = geofences.map(g => {
      if (g.id === id || g.geofenceId === id) {
        return {
          ...g,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return g;
    });

    saveGeofences(updated);

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: 'system',
      userName: updates.updatedBy || 'Admin',
      userRole: 'admin',
      action: 'UPDATE',
      module: 'GEOFENCE',
      recordId: id,
      details: `Updated geofence parameters`
    });
  };

  const deleteGeofence = (id: string) => {
    const target = geofences.find(g => g.id === id || g.geofenceId === id);
    const updated = geofences.filter(g => g.id !== id && g.geofenceId !== id);
    saveGeofences(updated);

    AuditService.log({
      enterpriseId: 'ema-constructions-lk',
      userId: 'system',
      userName: 'Admin',
      userRole: 'admin',
      action: 'DELETE',
      module: 'GEOFENCE',
      recordId: id,
      recordTitle: target?.siteName,
      details: `Deleted project site geofence`
    });
  };

  const evaluatePointAgainstGeofence = (
    lat: number,
    lng: number,
    projectId: string
  ): { isInside: boolean; nearestGeofence?: ProjectGeofence; distanceMeters: number } => {
    const candidateGeofences = geofences.filter(
      g => g.status === 'Active' && (g.projectId.toUpperCase() === projectId.toUpperCase() || projectId === 'ALL')
    );

    if (candidateGeofences.length === 0) {
      return { isInside: true, distanceMeters: 0 }; // If no geofence defined, allow
    }

    let nearest: ProjectGeofence | undefined = undefined;
    let minDistance = Infinity;

    for (const gf of candidateGeofences) {
      const dist = calculateDistanceMeters(lat, lng, gf.latitude, gf.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = gf;
      }
    }

    const isInside = nearest ? minDistance <= nearest.radiusMeters : false;

    return {
      isInside,
      nearestGeofence: nearest,
      distanceMeters: minDistance
    };
  };

  const resetGeofencesToDefault = () => {
    localStorage.removeItem(GEOFENCE_STORAGE_KEY);
    setGeofences(initialProjectGeofences);
  };

  return (
    <GeofenceContext.Provider
      value={{
        geofences,
        getGeofence,
        getGeofencesForProject,
        createGeofence,
        updateGeofence,
        deleteGeofence,
        evaluatePointAgainstGeofence,
        resetGeofencesToDefault
      }}
    >
      {children}
    </GeofenceContext.Provider>
  );
};

export const useGeofence = (): GeofenceContextType => {
  const context = useContext(GeofenceContext);
  if (!context) {
    throw new Error('useGeofence must be used within a GeofenceProvider');
  }
  return context;
};
