import React, { useState } from 'react';
import {
  Truck,
  Car,
  Bell,
  SlidersHorizontal,
  Plus,
  RefreshCw,
  AlertTriangle,
  Fuel,
  Wrench,
  ArrowRightLeft,
  Navigation,
  CheckCircle2,
  Clock,
  Trash2,
  X,
  ShieldCheck,
  Shield,
  Lock,
  KeyRound,
  ShieldAlert,
  Eye,
  EyeOff,
  Building2,
  Users,
  Sparkles,
  ChevronDown,
  Smartphone,
  Download,
  Wallet
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { ActiveTab } from './BottomNav';
import { AdminAuthModal } from './AdminAuthModal';
import { EnterpriseModal } from '../enterprise/EnterpriseModal';
import { PublishAppModal } from '../mobile/PublishAppModal';
import { AuditLogModal } from '../enterprise/AuditLogModal';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenTrip: () => void;
  onOpenFuel: () => void;
  onOpenTransfer: () => void;
  currentModule?: 'pettyCash' | 'fleetTrack';
  onSwitchModule?: (module: 'pettyCash' | 'fleetTrack') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenTrip,
  onOpenFuel,
  onOpenTransfer,
  currentModule = 'fleetTrack',
  onSwitchModule
}) => {
  const {
    vehicles,
    selectedVehicleId,
    setSelectedVehicleId,
    activeVehicle,
    getAlertsCount,
    resetToSampleData,
    clearAllData,
    isAdmin,
    userRole,
    verifyAdminPin,
    currentEnterprise,
    currentEnterpriseUsers,
    currentUser
  } = useFleet();

  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showAlertsMenu, setShowAlertsMenu] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [adminAuthInitialTab, setAdminAuthInitialTab] = useState<'login' | 'changePin' | 'switchRole'>('login');
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [enterpriseInitialTab, setEnterpriseInitialTab] = useState<'current' | 'login' | 'create' | 'join' | 'members'>('current');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishInitialTab, setPublishInitialTab] = useState<'android' | 'ios' | 'pwa' | 'export' | 'preview'>('android');
  const [showAuditLogModal, setShowAuditLogModal] = useState(false);
  const [resetToastMessage, setResetToastMessage] = useState<string | null>(null);

  // Admin PIN input inside Reset/Clear Modals
  const [adminPinInput, setAdminPinInput] = useState('');
  const [showPinText, setShowPinText] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const alerts = getAlertsCount();
  const pendingApprovalsCount = currentEnterpriseUsers.filter(u => u.status === 'pending-approval').length;

  const handleConfirmReset = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPinError(null);

    // If not in Admin mode, require PIN check
    if (!isAdmin) {
      if (!adminPinInput.trim()) {
        setPinError('Please enter the master Admin PIN to authorize data reset.');
        return;
      }
      if (!verifyAdminPin(adminPinInput.trim())) {
        setPinError('Invalid Admin PIN. Only authorized fleet administrators can reset data.');
        return;
      }
    }

    resetToSampleData();
    setShowResetModal(false);
    setShowSettingsMenu(false);
    setAdminPinInput('');
    setPinError(null);
    setResetToastMessage('Sample dataset successfully restored! Demo vehicles, drivers, running charts, fuel records, and schedules reset to defaults.');
    setTimeout(() => {
      setResetToastMessage(null);
    }, 4500);
  };

  const handleConfirmClearAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPinError(null);

    // If not in Admin mode, require PIN check
    if (!isAdmin) {
      if (!adminPinInput.trim()) {
        setPinError('Please enter the master Admin PIN to authorize clearing all fleet data.');
        return;
      }
      if (!verifyAdminPin(adminPinInput.trim())) {
        setPinError('Invalid Admin PIN. Only authorized fleet administrators can clear data.');
        return;
      }
    }

    clearAllData();
    setShowClearModal(false);
    setShowSettingsMenu(false);
    setAdminPinInput('');
    setPinError(null);
    setResetToastMessage('All fleet history and records cleared! You now have a clean slate to register your company vehicles and drivers.');
    setTimeout(() => {
      setResetToastMessage(null);
    }, 4500);
  };

  const openAdminModal = (tab: 'login' | 'changePin' | 'switchRole') => {
    setAdminAuthInitialTab(tab);
    setShowAdminAuthModal(true);
    setShowSettingsMenu(false);
  };

  const openEnterpriseModal = (tab: 'current' | 'login' | 'create' | 'join' | 'members') => {
    setEnterpriseInitialTab(tab);
    setShowEnterpriseModal(true);
    setShowSettingsMenu(false);
  };

  const openPublishModal = (tab: 'android' | 'ios' | 'pwa' | 'export' | 'preview') => {
    setPublishInitialTab(tab);
    setShowPublishModal(true);
    setShowSettingsMenu(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      {/* Top Banner / Brand Row */}
      <div className="px-3 sm:px-4 py-2 flex items-center justify-between gap-2 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm flex-shrink-0 cursor-pointer"
          >
            <Truck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1
                onClick={() => setActiveTab('dashboard')}
                className="font-bold text-sm tracking-tight text-white truncate cursor-pointer hover:text-blue-400 transition-colors"
              >
                FleetTrack
              </h1>

              {/* Enterprise Hub Button / Badge */}
              <button
                onClick={() => openEnterpriseModal('current')}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-blue-950/40 border border-blue-500/30 text-blue-300 hover:bg-blue-900/50 flex items-center gap-1 transition-all"
                title="View Enterprise Profile & Manage Team"
              >
                <Building2 className="w-3 h-3 text-blue-400" />
                <span className="max-w-[110px] sm:max-w-[160px] truncate">{currentEnterprise?.name}</span>
                {pendingApprovalsCount > 0 && isAdmin && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center animate-bounce">
                    {pendingApprovalsCount}
                  </span>
                )}
                <ChevronDown className="w-2.5 h-2.5 text-blue-400 opacity-70" />
              </button>

              {/* Admin Mode Badge */}
              <button
                onClick={() => openAdminModal('login')}
                className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 transition-all cursor-pointer ${
                  isAdmin
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
                title={isAdmin ? "Fleet Administrator (Click to manage security / PIN)" : "Staff / Driver View (Click to login as Admin)"}
              >
                {isAdmin ? <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> : <Shield className="w-2.5 h-2.5" />}
                <span>{isAdmin ? 'Admin' : 'Driver'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {activeVehicle
                ? `${activeVehicle.registrationNumber} • ${activeVehicle.make} ${activeVehicle.model}`
                : `${currentEnterprise?.code} • ${vehicles.length} Units`}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Publish / Mobile App Store Button */}
          <button
            onClick={() => openPublishModal('android')}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-emerald-600/20 hover:from-blue-600/30 hover:to-emerald-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Publish to Android Google Play & Apple App Store"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Publish App</span>
            <span className="sm:hidden text-[10px]">Publish</span>
          </button>

          {/* Module Switcher Button to Petty Cash */}
          {onSwitchModule && (
            <button
              id="header-switch-to-petty-cash-btn"
              onClick={() => onSwitchModule('pettyCash')}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              title="Switch to EMA Petty Cash Management System"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Petty Cash</span>
            </button>
          )}

          {/* Notifications Button with Badge */}
          <div className="relative">
            <button
              onClick={() => setShowAlertsMenu(!showAlertsMenu)}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Service & Expiry Alerts"
            >
              <Bell className="w-4 h-4" />
              {alerts.totalAlerts > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {alerts.totalAlerts}
                </span>
              )}
            </button>

            {showAlertsMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowAlertsMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 text-xs text-slate-200">
                  <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-white text-xs">Automated Alerts ({alerts.totalAlerts})</span>
                    <button
                      onClick={() => setShowAlertsMenu(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="py-2 space-y-1.5 max-h-60 overflow-y-auto">
                    {alerts.overdue > 0 && (
                      <div
                        onClick={() => {
                          setActiveTab('maintenance');
                          setShowAlertsMenu(false);
                        }}
                        className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 cursor-pointer hover:bg-rose-500/20 transition-colors"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          <span>{alerts.overdue} Urgent Service(s) Overdue</span>
                        </div>
                        <p className="text-[10px] text-rose-400 mt-0.5">Click to view maintenance triggers →</p>
                      </div>
                    )}

                    {alerts.dueSoon > 0 && (
                      <div
                        onClick={() => {
                          setActiveTab('maintenance');
                          setShowAlertsMenu(false);
                        }}
                        className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 cursor-pointer hover:bg-amber-500/20 transition-colors"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>{alerts.dueSoon} Service(s) Due Soon</span>
                        </div>
                        <p className="text-[10px] text-amber-400 mt-0.5">Due within 500 km or 14 days →</p>
                      </div>
                    )}

                    {alerts.expiredLicenses > 0 && (
                      <div
                        onClick={() => {
                          setActiveTab('drivers');
                          setShowAlertsMenu(false);
                        }}
                        className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 cursor-pointer hover:bg-rose-500/20 transition-colors"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          <span>{alerts.expiredLicenses} Driver License(s) Expired</span>
                        </div>
                        <p className="text-[10px] text-rose-400 mt-0.5">Click to review driver registry →</p>
                      </div>
                    )}

                    {alerts.totalAlerts === 0 && (
                      <div className="p-3 text-center text-slate-400 text-xs">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                        <p className="font-semibold text-slate-200">All Fleet Up to Date</p>
                        <p className="text-[10px]">No overdue services or expired licenses</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Action Add (+) Menu */}
          <div className="relative">
            <button
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-2.5 py-2 rounded-xl shadow transition-colors"
              title="Quick Log"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Quick Log</span>
            </button>

            {showQuickMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowQuickMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-1.5 text-xs text-slate-200">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Entries
                  </div>
                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onOpenTrip();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex items-center gap-2 transition-colors"
                  >
                    <Navigation className="w-4 h-4 text-blue-400" />
                    <div>
                      <p className="font-semibold">Log Trip Chart</p>
                      <p className="text-[10px] text-slate-400">Start/End odometer</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onOpenFuel();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex items-center gap-2 transition-colors"
                  >
                    <Fuel className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="font-semibold">Log Fuel Refill</p>
                      <p className="text-[10px] text-slate-400">Liters, cost & efficiency</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onOpenTransfer();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex items-center gap-2 transition-colors"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="font-semibold">Vehicle Transfer</p>
                      <p className="text-[10px] text-slate-400">Driver handover & inspection</p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Settings / Enterprise / Preferences Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Enterprise & Security Settings"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {showSettingsMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSettingsMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 text-xs text-slate-200 divide-y divide-slate-800/80">
                  <div className="px-3 py-2">
                    <p className="font-semibold text-slate-100 flex items-center justify-between">
                      <span>Enterprise & Security</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        isAdmin ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {isAdmin ? 'Admin Mode' : 'Driver View'}
                      </span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {currentEnterprise?.name} ({currentEnterprise?.code})
                    </p>
                  </div>

                  {/* Enterprise Management Section */}
                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-blue-400 tracking-wider flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> Enterprise Workspace
                    </div>
                    <button
                      onClick={() => openEnterpriseModal('current')}
                      className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>{currentEnterprise?.name || 'Enterprise'} Profile</span>
                      </span>
                      {pendingApprovalsCount > 0 && isAdmin && (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold">
                          {pendingApprovalsCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => openEnterpriseModal('login')}
                      className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 flex items-center gap-2 transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Switch / Log In by Code</span>
                    </button>
                    <button
                      onClick={() => openEnterpriseModal('join')}
                      className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 flex items-center gap-2 transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Join Enterprise with Code</span>
                    </button>
                    <button
                      onClick={() => openEnterpriseModal('create')}
                      className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 flex items-center gap-2 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-400" />
                      <span>Create New Enterprise</span>
                    </button>
                  </div>

                  {/* Mobile App & Store Publishing Section */}
                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                      <Smartphone className="w-3 h-3" /> App Stores & Mobile
                    </div>
                    <button
                      onClick={() => openPublishModal('android')}
                      className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Google Play (Android)</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">.aab</span>
                    </button>
                    <button
                      onClick={() => openPublishModal('ios')}
                      className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                        <span>Apple App Store (iOS)</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Xcode</span>
                    </button>
                    <button
                      onClick={() => openPublishModal('export')}
                      className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Download Mobile Publishing Kit</span>
                    </button>
                  </div>

                  {/* Admin Security & Audit Section */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowSettingsMenu(false);
                        setShowAuditLogModal(true);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                        <span>Audit & Compliance Trail</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                        Logs
                      </span>
                    </button>

                    <button
                      onClick={() => openAdminModal('login')}
                      className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 flex items-center gap-2 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isAdmin ? 'Admin Security Status' : 'Admin Login (Unlock Controls)'}</span>
                    </button>

                    <button
                      onClick={() => openAdminModal('changePin')}
                      className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 flex items-center gap-2 transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                      <span>Change Admin Master PIN</span>
                    </button>
                  </div>

                  {/* Reset and Clear Data Section */}
                  <div className="pt-1">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Admin-Only Data Actions
                    </div>
                    <button
                      onClick={() => {
                        setShowSettingsMenu(false);
                        setPinError(null);
                        setAdminPinInput('');
                        setShowResetModal(true);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Reset Sample Fleet Data</span>
                      </span>
                      <Lock className="w-3 h-3 text-slate-500" />
                    </button>

                    <button
                      onClick={() => {
                        setShowSettingsMenu(false);
                        setPinError(null);
                        setAdminPinInput('');
                        setShowClearModal(true);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-red-500/10 text-red-400 flex items-center justify-between transition-colors mt-0.5"
                    >
                      <span className="flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span>Clear All Fleet Data (Fresh)</span>
                      </span>
                      <Lock className="w-3 h-3 text-red-500/70" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Vehicle Quick Selector Pill Strip */}
      <div className="bg-slate-950/70 px-4 py-2 border-t border-slate-800/80 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max max-w-4xl mx-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Car className="w-3.5 h-3.5 text-slate-500" />
            Filter:
          </span>

          <button
            onClick={() => setSelectedVehicleId('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              selectedVehicleId === 'all'
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/40'
                : 'bg-slate-850 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            All Fleet ({vehicles.length})
          </button>

          {vehicles.map(v => (
            <button
              key={v.id}
              onClick={() => setSelectedVehicleId(v.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedVehicleId === v.id
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/40'
                  : 'bg-slate-850 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <span>{v.registrationNumber}</span>
              <span className="text-[10px] opacity-75 font-mono">({v.currentOdometerKm.toLocaleString()} km)</span>
            </button>
          ))}
        </div>
      </div>

      {/* Success Feedback Toast Notification */}
      {resetToastMessage && (
        <div className="fixed top-16 right-4 left-4 sm:left-auto sm:w-96 z-50 bg-slate-900 border border-emerald-500/40 rounded-2xl p-3 shadow-2xl flex items-start gap-2.5 text-xs text-white">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-emerald-400">Operation Successful</p>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">{resetToastMessage}</p>
          </div>
          <button
            onClick={() => setResetToastMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* In-App Reset Sample Data Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>Reset Sample Fleet Data</span>
                  <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                    Admin Only
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Restore factory sample data across all modules</p>
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="font-medium text-slate-200">
                This operation will overwrite custom edits and restore:
              </p>
              <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                <li><strong className="text-slate-300">Vehicles & Drivers:</strong> Full registered fleet defaults</li>
                <li><strong className="text-slate-300">30-Day Trips:</strong> Full running chart daily records</li>
                <li><strong className="text-slate-300">30-Day Fuel:</strong> Refill logs with station breakdowns & km/L</li>
                <li><strong className="text-slate-300">Service Reminders:</strong> Automated odometer & calendar schedules</li>
                <li><strong className="text-slate-300">Transfers:</strong> Handover checklists & inspection records</li>
              </ul>
            </div>

            {/* Admin Authentication Check */}
            {isAdmin ? (
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-white text-[11px]">Administrator Authorization Confirmed</p>
                  <p className="text-[10px] text-slate-300">You are logged in as Fleet Administrator. Ready to reset.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Enter Admin Security PIN</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPinText ? 'text' : 'password'}
                    value={adminPinInput}
                    onChange={(e) => {
                      setAdminPinInput(e.target.value);
                      setPinError(null);
                    }}
                    placeholder="Enter Admin PIN"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden tracking-wider"
                    maxLength={12}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinText(!showPinText)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPinText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {pinError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-2.5 text-xs text-red-400 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{pinError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  setPinError(null);
                  setAdminPinInput('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Authorize & Reset Sample Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Clear All Data Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>Clear All Fleet History?</span>
                  <span className="text-[10px] font-bold uppercase bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded border border-red-500/30">
                    Admin Only
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Start with a completely blank system</p>
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="font-medium text-slate-200">
                This will delete all previous sample and recorded data:
              </p>
              <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                <li>Remove all vehicle and driver profiles</li>
                <li>Erase all previous trip running charts & odometer history</li>
                <li>Clear all fuel log records & expenditure tracking</li>
                <li>Clear maintenance schedules & service logs</li>
              </ul>
              <p className="text-[11px] text-amber-400/90 font-medium pt-1">
                You can register your new company vehicles and drivers immediately after.
              </p>
            </div>

            {/* Admin Authentication Check */}
            {isAdmin ? (
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-white text-[11px]">Administrator Authorization Confirmed</p>
                  <p className="text-[10px] text-slate-300">You are logged in as Fleet Administrator. Ready to clear.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-red-400" />
                    <span>Enter Admin Security PIN</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPinText ? 'text' : 'password'}
                    value={adminPinInput}
                    onChange={(e) => {
                      setAdminPinInput(e.target.value);
                      setPinError(null);
                    }}
                    placeholder="Enter Admin PIN"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-1 focus:ring-red-500 focus:outline-hidden tracking-wider"
                    maxLength={12}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinText(!showPinText)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPinText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {pinError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-2.5 text-xs text-red-400 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{pinError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowClearModal(false);
                  setPinError(null);
                  setAdminPinInput('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Authorize & Clear All History</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Admin Security & Role Modal */}
      <AdminAuthModal
        isOpen={showAdminAuthModal}
        onClose={() => setShowAdminAuthModal(false)}
        initialTab={adminAuthInitialTab}
      />

      {/* Multi-Enterprise Organization Modal */}
      <EnterpriseModal
        isOpen={showEnterpriseModal}
        onClose={() => setShowEnterpriseModal(false)}
        initialTab={enterpriseInitialTab}
      />

      {/* Mobile App & App Store Publishing Modal */}
      <PublishAppModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        initialTab={publishInitialTab}
      />

      {/* Audit & Compliance Trail Modal */}
      <AuditLogModal
        isOpen={showAuditLogModal}
        onClose={() => setShowAuditLogModal(false)}
      />
    </header>
  );
};
