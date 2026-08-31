import React, { useState } from 'react';
import {
  Building2,
  Wallet,
  Truck,
  FolderKanban,
  ShoppingCart,
  CreditCard,
  BarChart3,
  FileText,
  Settings,
  Bell,
  Plus,
  RefreshCw,
  UserCheck,
  ShieldAlert,
  Wifi,
  WifiOff,
  CheckCircle2,
  ChevronDown,
  X,
  ExternalLink,
  Fuel,
  Wrench,
  ArrowRightLeft,
  DollarSign,
  Search,
  ClipboardList
} from 'lucide-react';
import { useEnterprise } from '../../context/EnterpriseContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { useFleet } from '../../context/FleetContext';
import { EnterpriseModule, EnterpriseRole } from '../../types/enterpriseTypes';

interface EnterpriseHeaderProps {
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  onOpenTransfer: () => void;
  onOpenAddFuel: () => void;
  onOpenAddTrip: () => void;
  onOpenNewTransfer: () => void;
  onOpenAddPO: () => void;
  onOpenAddPayment: () => void;
  onOpenAddDocument: () => void;
}

export const EnterpriseHeader: React.FC<EnterpriseHeaderProps> = ({
  onOpenAddExpense,
  onOpenAddIncome,
  onOpenTransfer,
  onOpenAddFuel,
  onOpenAddTrip,
  onOpenNewTransfer,
  onOpenAddPO,
  onOpenAddPayment,
  onOpenAddDocument
}) => {
  const {
    currentModule,
    setCurrentModule,
    currentRole,
    setCurrentRole,
    currentUser,
    setCurrentUser,
    syncStatus,
    setSyncStatus,
    lastSyncTime,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    navigateToModule
  } = useEnterprise();

  const {
    supervisors,
    syncWithGoogleSheets,
    isSyncingWithSheets,
    setUserRole: setPettyCashRole,
    setCurrentSupervisorName
  } = usePettyCash();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActionMenu, setShowQuickActionMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  const modules: { id: EnterpriseModule; label: string; icon: React.FC<{ className?: string }>; color: string }[] = [
    { id: 'overview', label: 'Executive Overview', icon: Building2, color: 'text-amber-400' },
    { id: 'site-records', label: 'Daily Site Records', icon: ClipboardList, color: 'text-violet-400' },
    { id: 'petty-cash', label: 'Petty Cash & Expenses', icon: Wallet, color: 'text-emerald-400' },
    { id: 'fleet', label: 'FleetTrack Vehicles', icon: Truck, color: 'text-blue-400' },
    { id: 'projects', label: 'Projects & Construction', icon: FolderKanban, color: 'text-purple-400' },
    { id: 'procurement', label: 'Procurement', icon: ShoppingCart, color: 'text-orange-400' },
    { id: 'payments', label: 'Finance & Payments', icon: CreditCard, color: 'text-rose-400' },
    { id: 'reports', label: 'Reports', icon: BarChart3, color: 'text-teal-400' },
    { id: 'documents', label: 'Documents', icon: FileText, color: 'text-indigo-400' },
    { id: 'admin', label: 'Administration', icon: Settings, color: 'text-slate-300' }
  ];

  const roles: EnterpriseRole[] = [
    'ADMIN',
    'FINANCE',
    'PROJECT_MANAGER',
    'SITE_ENGINEER',
    'SUPERVISOR',
    'FLEET_MANAGER',
    'DRIVER',
    'VIEWER',
    'OWNER'
  ];

  const handleRoleChange = (role: EnterpriseRole) => {
    setCurrentRole(role);
    // Sync with Petty Cash sub-role
    if (role === 'ADMIN' || role === 'OWNER') setPettyCashRole('ADMIN');
    else if (role === 'FINANCE') setPettyCashRole('FINANCE');
    else if (role === 'SUPERVISOR' || role === 'SITE_ENGINEER' || role === 'PROJECT_MANAGER') setPettyCashRole('SUPERVISOR');
    else setPettyCashRole('VIEWER');
    setShowRoleMenu(false);
  };

  const handleUserChange = (userName: string) => {
    setCurrentUser(userName);
    setCurrentSupervisorName(userName);
    setShowUserMenu(false);
  };

  const handleManualSync = async () => {
    setSyncStatus('SYNCING');
    const res = await syncWithGoogleSheets();
    if (res.success) {
      setSyncStatus('ONLINE');
      setSyncToastMessage('Google Sheets & Enterprise Cloud synchronized successfully.');
    } else {
      setSyncStatus('ONLINE');
      setSyncToastMessage('Local storage database active (Google Sheets ready).');
    }
    setTimeout(() => setSyncToastMessage(null), 3500);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-md select-none">
      {/* 1. TOP BRAND, STATUS & ACTIONS BAR */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/70">
        {/* Brand & Suite Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 via-emerald-600 to-blue-700 flex items-center justify-center text-white shadow-lg font-black text-sm tracking-tighter">
            EMA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-slate-100 tracking-tight leading-none">
                EMA Enterprise Corporate Suite
              </h1>
              <span className="hidden md:inline-block px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700 text-[10px] font-bold">
                ERP 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Construction & Fleet Operations • Unified Platform
            </p>
          </div>
        </div>

        {/* Right Tools: Sync Status, Quick Action (+), Notifications Bell, Role Selector, User Profile */}
        <div className="flex items-center gap-2">
          {/* Sync Status Badge */}
          <button
            onClick={handleManualSync}
            title="Click to trigger bi-directional Google Sheets sync"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition-all active:scale-95"
          >
            {syncStatus === 'ONLINE' && <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
            {syncStatus === 'SYNCING' && <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
            {syncStatus === 'OFFLINE' && <WifiOff className="w-3.5 h-3.5 text-amber-400" />}
            {syncStatus === 'SYNC_ERROR' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
            <span className="hidden sm:inline font-bold text-[11px] text-slate-300">
              {syncStatus === 'ONLINE' ? 'ONLINE' : syncStatus === 'SYNCING' ? 'SYNCING...' : syncStatus}
            </span>
          </button>

          {/* Quick Create (+) Action Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowQuickActionMenu(!showQuickActionMenu)}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Entry</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {showQuickActionMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowQuickActionMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 text-xs space-y-1 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Petty Cash & Finance
                  </div>
                  <button
                    onClick={() => { setShowQuickActionMenu(false); onOpenAddExpense(); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-emerald-950/80 text-slate-200 hover:text-emerald-300 flex items-center gap-2 font-medium"
                  >
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>+ Expense Voucher</span>
                  </button>
                  <button
                    onClick={() => { setShowQuickActionMenu(false); onOpenAddIncome(); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-emerald-950/80 text-slate-200 hover:text-emerald-300 flex items-center gap-2 font-medium"
                  >
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>+ Float Top-up / Income</span>
                  </button>
                  <button
                    onClick={() => { setShowQuickActionMenu(false); onOpenTransfer(); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-emerald-950/80 text-slate-200 hover:text-emerald-300 flex items-center gap-2 font-medium"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
                    <span>+ P2P Cash Transfer</span>
                  </button>

                  <div className="border-t border-slate-800 my-1"></div>
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    FleetTrack Logistics
                  </div>
                  <button
                    onClick={() => { setShowQuickActionMenu(false); onOpenAddFuel(); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-950/80 text-slate-200 hover:text-blue-300 flex items-center gap-2 font-medium"
                  >
                    <Fuel className="w-3.5 h-3.5 text-blue-400" />
                    <span>+ Fuel Record</span>
                  </button>
                  <button
                    onClick={() => { setShowQuickActionMenu(false); onOpenAddTrip(); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-950/80 text-slate-200 hover:text-blue-300 flex items-center gap-2 font-medium"
                  >
                    <Truck className="w-3.5 h-3.5 text-blue-400" />
                    <span>+ Running Chart Trip</span>
                  </button>

                  <div className="border-t border-slate-800 my-1"></div>
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Procurement & Payments
                  </div>
                  <button
                    onClick={() => { setShowQuickActionMenu(false); onOpenAddPO(); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-950/80 text-slate-200 hover:text-purple-300 flex items-center gap-2 font-medium"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 text-purple-400" />
                    <span>+ Purchase Order (PO)</span>
                  </button>
                  <button
                    onClick={() => { setShowQuickActionMenu(false); onOpenAddPayment(); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-950/80 text-slate-200 hover:text-purple-300 flex items-center gap-2 font-medium"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                    <span>+ Payment Request</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Unified Notifications Center */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-4 text-xs space-y-3 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-slate-100 text-sm">Enterprise Notification Feed</span>
                    </div>
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-[11px] text-emerald-400 hover:underline font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-center text-slate-400 py-4">No recent notifications</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationAsRead(n.id);
                            if (n.TARGET_MODULE) {
                              navigateToModule(n.TARGET_MODULE, n.TARGET_TAB);
                              setShowNotifications(false);
                            }
                          }}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                            n.READ
                              ? 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                              : 'bg-slate-800/80 border-slate-700 text-slate-200 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              n.MODULE === 'Petty Cash' ? 'bg-emerald-950 text-emerald-300' :
                              n.MODULE === 'FleetTrack' ? 'bg-blue-950 text-blue-300' :
                              n.MODULE === 'Payments' ? 'bg-rose-950 text-rose-300' :
                              'bg-purple-950 text-purple-300'
                            }`}>
                              {n.MODULE}
                            </span>
                            <span className="text-[10px] text-slate-400">{n.TIMESTAMP}</span>
                          </div>
                          <h4 className="font-bold text-slate-100 mt-1">{n.TITLE}</h4>
                          <p className="text-[11px] text-slate-300 mt-0.5">{n.MESSAGE}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Unified Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline font-mono font-bold text-[11px]">{currentRole}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRoleMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowRoleMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 text-xs space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Security Role
                  </div>
                  {roles.map(r => (
                    <button
                      key={r}
                      onClick={() => handleRoleChange(r)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-medium ${
                        currentRole === r ? 'bg-amber-950 text-amber-300 font-bold border border-amber-800' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span>{r}</span>
                      {currentRole === r && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Active Supervisor User Persona */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-[11px] flex items-center justify-center">
                {currentUser.slice(0, 2)}
              </div>
              <span className="hidden sm:inline font-bold text-[11px] text-slate-200">{currentUser}</span>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 text-xs space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Active Supervisor
                  </div>
                  {supervisors.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleUserChange(s.SUPERVISOR_NAME)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-medium ${
                        currentUser === s.SUPERVISOR_NAME ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div>
                        <span className="block font-bold">{s.SUPERVISOR_NAME}</span>
                        <span className="text-[10px] text-slate-400">{s.DEFAULT_PROJECT || 'General'}</span>
                      </div>
                      {currentUser === s.SUPERVISOR_NAME && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. ENTERPRISE HORIZONTAL MODULE SWITCHER RIBBON */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-1.5 overflow-x-auto scrollbar-none flex items-center gap-1.5">
        {modules.map(mod => {
          const Icon = mod.icon;
          const isActive = currentModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => setCurrentModule(mod.id)}
              className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-slate-800 text-white shadow-inner border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/70 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? mod.color : 'text-slate-400'}`} />
              <span>{mod.label}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
            </button>
          );
        })}
      </div>

      {syncToastMessage && (
        <div className="bg-emerald-950 border-b border-emerald-800 px-4 py-1.5 text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncToastMessage}</span>
        </div>
      )}
    </header>
  );
};
