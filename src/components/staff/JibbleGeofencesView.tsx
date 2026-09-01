import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Search,
  Radio,
  Clock,
  Layers,
  FileCheck2,
  Key,
  Crosshair,
  X
} from 'lucide-react';
import { useStaff } from '../../context/StaffContext';
import { useGeofence } from '../../context/GeofenceContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { useAttendance } from '../../context/AttendanceContext';
import { JibbleService } from '../../services/jibble/jibbleService';
import { JibbleSyncConfig, JibbleSyncLog } from '../../types/jibbleTypes';
import { ProjectGeofence } from '../../types/geofenceTypes';

export const JibbleGeofencesView: React.FC = () => {
  const { staffMembers } = useStaff();
  const { geofences, createGeofence, deleteGeofence, evaluatePointAgainstGeofence } = useGeofence();
  const { projects } = usePettyCash();
  const { ingestSyncedAttendance } = useAttendance();

  const [activeTab, setActiveTab] = useState<'JIBBLE_SYNC' | 'GEOFENCES' | 'LOGS'>('JIBBLE_SYNC');
  const [syncConfig, setSyncConfig] = useState<JibbleSyncConfig>({
    apiKeyConfigured: false,
    autoSyncEnabled: true,
    syncIntervalMinutes: 30,
    totalMappedEmployees: 0
  });

  const [isSyncingEmployees, setIsSyncingEmployees] = useState(false);
  const [isSyncingAttendance, setIsSyncingAttendance] = useState(false);
  const [syncLogs, setSyncLogs] = useState<JibbleSyncLog[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Geofence Modal State
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
  const [newGeofence, setNewGeofence] = useState({
    projectId: 'PIDM 26',
    siteName: 'PIDM 26 Road Section Yard',
    latitude: 6.9271,
    longitude: 79.8612,
    radiusMeters: 300,
    activeFrom: new Date().toISOString().slice(0, 10),
    status: 'Active' as const,
    address: 'Construction Site Yard, Sri Lanka'
  });

  // Simulator State
  const [simLat, setSimLat] = useState('6.9275');
  const [simLng, setSimLng] = useState('79.8615');
  const [simProject, setSimProject] = useState('PIDM 26');
  const [simResult, setSimResult] = useState<{ isInside: boolean; distanceMeters: number } | null>(null);

  useEffect(() => {
    loadConfigAndLogs();
  }, []);

  const loadConfigAndLogs = async () => {
    const config = await JibbleService.fetchConfig();
    setSyncConfig(config);
    setSyncLogs(JibbleService.getSyncLogs());
  };

  const handleSyncEmployees = async () => {
    setIsSyncingEmployees(true);
    setNotification(null);
    try {
      const res = await JibbleService.syncEmployees(staffMembers, 'ADMIN_USER');
      if (res.success) {
        setNotification({
          type: 'success',
          message: `Successfully synchronized ${res.syncedCount} employees with Jibble directory.`
        });
      } else {
        setNotification({
          type: 'error',
          message: 'Jibble synchronization failed. Check server logs.'
        });
      }
      await loadConfigAndLogs();
    } catch (e: any) {
      setNotification({ type: 'error', message: e?.message || 'Sync failed' });
    } finally {
      setIsSyncingEmployees(false);
    }
  };

  const handleSyncAttendance = async () => {
    setIsSyncingAttendance(true);
    setNotification(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await JibbleService.pullAttendance({
        startDate: today,
        endDate: today,
        employeeIds: staffMembers.map(s => s.id),
        currentUserId: 'ADMIN_USER'
      });

      if (res.success) {
        const inserted = ingestSyncedAttendance(res.entries);
        setNotification({
          type: 'success',
          message: `Pulled ${res.entries.length} attendance punch logs from Jibble (${inserted} new records ingested).`
        });
      } else {
        setNotification({ type: 'error', message: 'Failed to pull attendance from Jibble.' });
      }
      await loadConfigAndLogs();
    } catch (e: any) {
      setNotification({ type: 'error', message: e?.message || 'Attendance sync failed' });
    } finally {
      setIsSyncingAttendance(false);
    }
  };

  const handleCreateGeofence = (e: React.FormEvent) => {
    e.preventDefault();
    createGeofence({
      projectId: newGeofence.projectId,
      siteName: newGeofence.siteName,
      latitude: Number(newGeofence.latitude),
      longitude: Number(newGeofence.longitude),
      radiusMeters: Number(newGeofence.radiusMeters),
      activeFrom: newGeofence.activeFrom,
      status: newGeofence.status,
      address: newGeofence.address,
      createdBy: 'HR_ADMIN'
    });
    setIsGeofenceModalOpen(false);
  };

  const handleTestSimulator = () => {
    const lat = parseFloat(simLat);
    const lng = parseFloat(simLng);
    if (isNaN(lat) || isNaN(lng)) return;
    const res = evaluatePointAgainstGeofence(lat, lng, simProject);
    setSimResult({ isInside: res.isInside, distanceMeters: res.distanceMeters });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Radio className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Jibble Time Tracking & Site Geofences</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Biometric punch synchronization, server-side API integration, and GPS site boundary enforcement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-300">API Status:</span>
            <span className={`font-bold ${syncConfig.apiKeyConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
              {syncConfig.apiKeyConfigured ? 'Live Jibble API' : 'Sandbox Ready'}
            </span>
          </div>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('JIBBLE_SYNC')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'JIBBLE_SYNC'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Jibble Synchronization & Mappings
        </button>
        <button
          onClick={() => setActiveTab('GEOFENCES')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'GEOFENCES'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          Site Geofences & Boundaries ({geofences.length})
        </button>
        <button
          onClick={() => setActiveTab('LOGS')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'LOGS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Sync Audit Logs ({syncLogs.length})
        </button>
      </div>

      {/* TAB 1: JIBBLE SYNC & MAPPINGS */}
      {activeTab === 'JIBBLE_SYNC' && (
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-100 text-sm">Employee Directory Synchronization</div>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[11px] font-mono">
                  {staffMembers.length} Staff Members
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pushes employee profiles, designations, and mobile phone numbers to the Jibble cloud organization.
              </p>
              <button
                onClick={handleSyncEmployees}
                disabled={isSyncingEmployees}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingEmployees ? 'animate-spin' : ''}`} />
                {isSyncingEmployees ? 'Syncing Employees...' : 'Sync Employees with Jibble'}
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-100 text-sm">Daily Biometric Attendance Pull</div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[11px] font-mono">
                  Biometric & GPS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ingests punch-in, punch-out, GPS coordinates, geofence status, and facial verification evidence.
              </p>
              <button
                onClick={handleSyncAttendance}
                disabled={isSyncingAttendance}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAttendance ? 'animate-spin' : ''}`} />
                {isSyncingAttendance ? 'Pulling Attendance Logs...' : 'Pull Attendance Logs Now'}
              </button>
            </div>
          </div>

          {/* Member Mappings Directory */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="font-bold text-slate-100 text-xs uppercase tracking-wider">
                Staff Directory to Jibble Member ID Mapping Table
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Emp Code</th>
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">Department & Role</th>
                    <th className="px-4 py-3">Jibble Member ID</th>
                    <th className="px-4 py-3">Sync Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {staffMembers.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-bold text-blue-400">{emp.employeeCode}</td>
                      <td className="px-4 py-3 font-semibold text-slate-100">{emp.fullName}</td>
                      <td className="px-4 py-3 text-slate-400">{emp.department} • {emp.designation}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-purple-400">
                        {emp.jibbleMemberId || `jbl-${emp.employeeCode.toLowerCase()}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active Sync
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GEOFENCES & BOUNDARIES */}
      {activeTab === 'GEOFENCES' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100">Project Site Geofences</h3>
            <button
              onClick={() => setIsGeofenceModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Site Geofence
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {geofences.map(gf => (
              <div
                key={gf.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono font-bold text-xs">
                      {gf.geofenceId}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold text-xs">
                      {gf.projectId}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteGeofence(gf.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <h4 className="font-bold text-slate-100 text-sm">{gf.siteName}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{gf.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-800/60 p-2.5 rounded-lg">
                  <div>
                    <span className="text-slate-400">Coordinates:</span>
                    <div className="font-mono text-slate-200 text-[11px]">
                      {gf.latitude.toFixed(4)}, {gf.longitude.toFixed(4)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Radius Boundary:</span>
                    <div className="font-mono font-bold text-emerald-400 text-[11px]">
                      {gf.radiusMeters} meters
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Geofence Testing Simulator */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-100 text-xs uppercase tracking-wider">
              <Crosshair className="w-4 h-4 text-emerald-400" />
              Live Geofence Radius Verification Tester
            </div>
            <p className="text-xs text-slate-400">
              Input test GPS latitude and longitude to verify if a punch-in location falls strictly inside the project site perimeter.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Target Project</label>
                <select
                  value={simProject}
                  onChange={(e) => setSimProject(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                >
                  {projects.map(p => {
                    const code = p.PROJECT_CODE || (p as any).code || (p as any).project_code || p.id;
                    const name = p.PROJECT_NAME || (p as any).name || code;
                    return (
                      <option key={p.id || code} value={code}>{code} - {name}</option>
                    );
                  })}
                  <option value="HEAD_OFFICE">HEAD_OFFICE</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Latitude</label>
                <input
                  type="text"
                  value={simLat}
                  onChange={(e) => setSimLat(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Longitude</label>
                <input
                  type="text"
                  value={simLng}
                  onChange={(e) => setSimLng(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleTestSimulator}
                  className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all"
                >
                  Evaluate Geofence
                </button>
              </div>
            </div>

            {simResult && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center justify-between border ${
                  simResult.isInside
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                }`}
              >
                <div>
                  <strong>Result:</strong> {simResult.isInside ? 'INSIDE GEOFENCE (VALID PUNCH)' : 'OUTSIDE GEOFENCE (FLAGGED AS EXCEPTION)'}
                </div>
                <div className="font-mono text-[11px]">
                  Distance from site center: {simResult.distanceMeters}m
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SYNC AUDIT LOGS */}
      {activeTab === 'LOGS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Sync Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Records Processed</th>
                  <th className="px-4 py-3">Triggered By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {syncLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                      No synchronization logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  syncLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                        {log.startedAt.replace('T', ' ').slice(0, 19)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-200">{log.syncType}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">{log.recordsProcessed}</td>
                      <td className="px-4 py-3 text-slate-400">{log.triggeredBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Site Geofence */}
      {isGeofenceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-slate-100">Add Site Geofence Boundary</h3>
              </div>
              <button
                onClick={() => setIsGeofenceModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGeofence} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Project Code *</label>
                  <select
                    value={newGeofence.projectId}
                    onChange={(e) => setNewGeofence({ ...newGeofence, projectId: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  >
                    {projects.map(p => {
                      const code = p.PROJECT_CODE || (p as any).code || (p as any).project_code || p.id;
                      const name = p.PROJECT_NAME || (p as any).name || code;
                      return (
                        <option key={p.id || code} value={code}>{code} - {name}</option>
                      );
                    })}
                    <option value="HEAD_OFFICE">HEAD_OFFICE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Radius (Meters) *</label>
                  <input
                    type="number"
                    value={newGeofence.radiusMeters}
                    onChange={(e) => setNewGeofence({ ...newGeofence, radiusMeters: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Site Yard / Location Name *</label>
                <input
                  type="text"
                  value={newGeofence.siteName}
                  onChange={(e) => setNewGeofence({ ...newGeofence, siteName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Latitude *</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={newGeofence.latitude}
                    onChange={(e) => setNewGeofence({ ...newGeofence, latitude: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Longitude *</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={newGeofence.longitude}
                    onChange={(e) => setNewGeofence({ ...newGeofence, longitude: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Address / Landmark</label>
                <input
                  type="text"
                  value={newGeofence.address}
                  onChange={(e) => setNewGeofence({ ...newGeofence, address: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGeofenceModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Geofence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
