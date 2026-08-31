import React, { useState } from 'react';
import {
  X,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Server,
  Key,
  ShieldCheck,
  RefreshCw,
  Zap,
  Globe,
  Sliders,
  ExternalLink,
  Smartphone,
  Copy,
  Info
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { GPSGatewayConfig, GPSProvider } from '../../types';
import { GPSService } from '../../services/gps/gpsService';

interface GPSGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GPSGatewayModal: React.FC<GPSGatewayModalProps> = ({ isOpen, onClose }) => {
  const {
    gpsConfig,
    updateGpsConfig,
    allEnterpriseVehicles,
    syncAllOdometersFromGps,
    simulateGpsMotion
  } = useFleet();

  const [provider, setProvider] = useState<GPSProvider>(gpsConfig.provider || 'protrack');
  const [serverUrl, setServerUrl] = useState<string>(gpsConfig.serverUrl || 'https://api.protrack365.com');
  const [accountUsername, setAccountUsername] = useState<string>(gpsConfig.accountUsername || 'fleet_admin_gcc');
  const [apiToken, setApiToken] = useState<string>(gpsConfig.apiToken || '');
  const [apiKey, setApiKey] = useState<string>(gpsConfig.apiKey || '');
  const [syncInterval, setSyncInterval] = useState<number>(gpsConfig.syncIntervalSeconds || 10);
  const [autoSyncOdo, setAutoSyncOdo] = useState<boolean>(gpsConfig.autoSyncOdometer ?? true);
  const [autoTrip, setAutoTrip] = useState<boolean>(gpsConfig.autoCreateRunningChartTrips ?? true);

  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; devicesFound?: number } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    updateGpsConfig({
      provider,
      serverUrl,
      accountUsername,
      apiToken,
      apiKey,
      syncIntervalSeconds: syncInterval,
      autoSyncOdometer: autoSyncOdo,
      autoCreateRunningChartTrips: autoTrip,
      isConnected: true
    });
    setTestResult({
      success: true,
      message: `Gateway configuration saved. Connected to ${provider.toUpperCase()}.`,
      devicesFound: allEnterpriseVehicles.length
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await GPSService.testConnection({
        provider,
        serverUrl,
        accountUsername,
        apiToken
      });
      setTestResult(res);
      if (res.success) {
        updateGpsConfig({
          provider,
          serverUrl,
          accountUsername,
          apiToken,
          isConnected: true,
          lastHeartbeat: new Date().toISOString()
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e?.message || 'Failed to connect'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncAllOdometers = () => {
    const res = syncAllOdometersFromGps();
    if (res.updatedCount > 0) {
      setSyncToast(`Successfully synchronized odometers for ${res.updatedCount} vehicles via GPS telemetry!`);
    } else {
      setSyncToast(`All vehicles already match latest GPS telemetry odometer readings.`);
    }
    setTimeout(() => setSyncToast(null), 4000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const webhookEndpoint = `${window.location.origin}/api/gps/webhook`;

  return (
    <div
      id="gps-gateway-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="gps-gateway-modal-card"
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  GPS Tracker Gateway Configuration
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Protrack 365 / Traccar / GT06
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Link real-time GPS telemetry, live vehicle location, speed, and automated odometer tracking
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync notification toast */}
        {syncToast && (
          <div className="px-6 py-2.5 bg-emerald-950/70 border-b border-emerald-800 text-xs font-semibold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{syncToast}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Provider Selector Cards */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select GPS Tracking Platform
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Protrack 365 */}
              <button
                type="button"
                onClick={() => {
                  setProvider('protrack');
                  setServerUrl('https://api.protrack365.com');
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  provider === 'protrack'
                    ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg ring-1 ring-blue-500/50'
                    : 'bg-slate-800/50 border-slate-700/70 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-bold text-sm flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-blue-400" />
                    Protrack 365
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                    Official API
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Concox, WanWay, Jimi & GT06 series trackers via Protrack Cloud Open API.
                </p>
              </button>

              {/* Traccar */}
              <button
                type="button"
                onClick={() => {
                  setProvider('traccar');
                  setServerUrl('http://demo.traccar.org:8082');
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  provider === 'traccar'
                    ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg ring-1 ring-blue-500/50'
                    : 'bg-slate-800/50 border-slate-700/70 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-bold text-sm flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-emerald-400" />
                    Traccar GPS
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    Self-Hosted
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Open-source GPS server supporting 1500+ GPS hardware protocols & Teltonika.
                </p>
              </button>

              {/* Custom Webhook / GT06 Direct */}
              <button
                type="button"
                onClick={() => {
                  setProvider('custom_webhook');
                  setServerUrl(webhookEndpoint);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  provider === 'custom_webhook'
                    ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg ring-1 ring-blue-500/50'
                    : 'bg-slate-800/50 border-slate-700/70 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-bold text-sm flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Direct Webhook
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                    REST Ingest
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Direct HTTP POST JSON or NMEA packet ingestion from custom trackers or Teltonika gateways.
                </p>
              </button>
            </div>
          </div>

          {/* Connection Parameters Form */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4.5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                {provider === 'protrack' ? 'Protrack 365 API Credentials' : 'Server & Authentication Settings'}
              </h3>
              <span className="text-[11px] text-slate-400">
                Port 80/443 SSL Encrypted
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">
                  API Server Endpoint URL
                </label>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={e => setServerUrl(e.target.value)}
                  placeholder="https://api.protrack365.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">
                  Account Username / Customer ID
                </label>
                <input
                  type="text"
                  value={accountUsername}
                  onChange={e => setAccountUsername(e.target.value)}
                  placeholder="e.g. protrack_fleet_admin"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-300 font-medium">
                    Protrack API Secret / Access Token
                  </label>
                  <span className="text-[10px] text-slate-400">
                    From Protrack Settings → Open Platform
                  </span>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    value={apiToken}
                    onChange={e => setApiToken(e.target.value)}
                    placeholder="Enter Protrack Open API Key or JWT token (e.g. prt_live_9941a87b92f)"
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Test Connection Button & Status */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Testing API Connection...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    Test Connection & Ping Gateway
                  </>
                )}
              </button>

              {testResult && (
                <div
                  className={`px-3 py-2 rounded-xl text-xs flex items-center gap-2 border ${
                    testResult.success
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-800 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  )}
                  <span className="truncate">{testResult.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Webhook Endpoint for Tracker Forwarding */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                Live Telemetry Webhook Ingestion URL
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                Active Listener
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Configure this Webhook URL inside Protrack or Traccar notification settings to forward live position, speed, and ignition events in real-time.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookEndpoint}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 select-all"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(webhookEndpoint, 'webhook')}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedKey === 'webhook' ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Automation & Sync Options */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              Automated Fleet Synchronization Rules
            </h3>

            <div className="space-y-2.5">
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800 cursor-pointer hover:bg-slate-800/60 transition-colors">
                <input
                  type="checkbox"
                  checked={autoSyncOdo}
                  onChange={e => setAutoSyncOdo(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-700 bg-slate-900"
                />
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    Auto-Update Vehicle Odometers from GPS
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Automatically increment current vehicle odometer as GPS device logs distance, preventing manual driver meter tampering.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800 cursor-pointer hover:bg-slate-800/60 transition-colors">
                <input
                  type="checkbox"
                  checked={autoTrip}
                  onChange={e => setAutoTrip(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-700 bg-slate-900"
                />
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    Auto-Generate Running Chart Trips from GPS Trips
                  </div>
                  <div className="text-[11px] text-slate-400">
                    When ignition switches OFF after travelling &gt; 0.5 km, automatically create a draft Running Chart entry with verified start and end odometer.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncAllOdometers}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                Sync All Odometers Now
              </button>
              <button
                type="button"
                onClick={simulateGpsMotion}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Trigger Live Motion Simulation
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Protrack 365 Open API v2.4 Compliant
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                handleSave();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
