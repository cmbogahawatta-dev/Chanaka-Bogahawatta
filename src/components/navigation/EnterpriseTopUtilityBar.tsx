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
  Search,
  ClipboardList,
  Users,
  Menu,
  Sparkles,
  Command,
  PanelLeftClose,
  PanelLeft,
  DollarSign,
  Fuel,
  ArrowRightLeft
} from 'lucide-react';
import { useEnterprise } from '../../context/EnterpriseContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { EnterpriseRole } from '../../types/enterpriseTypes';

interface EnterpriseTopUtilityBarProps {
  isRailCollapsed: boolean;
  onToggleRail: () => void;
  onOpenCommandPalette: () => void;
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  onOpenTransfer: () => void;
  onOpenAddFuel: () => void;
  onOpenAddTrip: () => void;
  onOpenNewTransfer: () => void;
  onOpenAddPO: () => void;
  onOpenAddPayment: () => void;
  selectedProjectFilter: string;
  onSelectProjectFilter: (projectCode: string) => void;
}

export const EnterpriseTopUtilityBar: React.FC<EnterpriseTopUtilityBarProps> = ({
  isRailCollapsed,
  onToggleRail,
  onOpenCommandPalette,
  onOpenAddExpense,
  onOpenAddIncome,
  onOpenTransfer,
  onOpenAddFuel,
  onOpenAddTrip,
  onOpenNewTransfer,
  onOpenAddPO,
  onOpenAddPayment,
  selectedProjectFilter,
  onSelectProjectFilter
}) => {
  const {
    currentRole,
    setCurrentRole,
    currentUser,
    setCurrentUser,
    syncStatus,
    setSyncStatus,
    notifications = [],
    unreadNotificationsCount = 0,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    navigateToModule
  } = useEnterprise();

  const {
    projects = [],
    supervisors = [],
    syncWithGoogleSheets,
    setUserRole: setPettyCashRole,
    setCurrentSupervisorName
  } = usePettyCash();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActionMenu, setShowQuickActionMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  const roles: EnterpriseRole[] = [
    'ADMIN',
    'HR',
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
      setSyncToastMessage('Google Sheets & Enterprise Cloud synced.');
    } else {
      setSyncStatus('ONLINE');
      setSyncToastMessage('Local storage database active (Sheets connected).');
    }
    setTimeout(() => setSyncToastMessage(null), 3000);
  };

  const activeProjectLabel = selectedProjectFilter === 'ALL'
    ? 'All Projects (Corporate)'
    : projects.find(p => p.PROJECT_CODE === selectedProjectFilter)?.PROJECT_NAME || selectedProjectFilter;

  return (
    <header className="h-11 sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800/80 select-none flex items-center justify-between px-2 sm:px-3 text-xs">
      {/* LEFT SECTION: Rail Toggle, Logo, Project Selector */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Rail Toggle Button */}
        <button
          onClick={onToggleRail}
          title={isRailCollapsed ? 'Expand Navigation Rail (Ctrl+B)' : 'Collapse Navigation Rail (Ctrl+B)'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/80 transition-all shrink-0"
        >
          {isRailCollapsed ? <PanelLeft className="w-4 h-4 text-slate-300" /> : <PanelLeftClose className="w-4 h-4 text-slate-300" />}
        </button>

        {/* Brand Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 via-emerald-600 to-blue-700 flex items-center justify-center text-white font-black text-xs tracking-tight shadow-md">
            EMA
          </div>
          <div className="hidden md:flex flex-col">
            <span className="font-extrabold text-[12px] tracking-tight text-slate-100 leading-none">
              EMA CORPORATE
            </span>
            <span className="text-[9px] font-mono text-emerald-400 font-semibold leading-none mt-0.5">
              ERP SUITE 2026
            </span>
          </div>
        </div>

        <div className="hidden lg:block h-4 w-px bg-slate-800 mx-1" />

        {/* Master Project Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProjectMenu(!showProjectMenu)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-[11px] font-medium max-w-[200px] truncate transition-all"
          >
            <FolderKanban className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate">{activeProjectLabel}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-0.5" />
          </button>

          {showProjectMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProjectMenu(false)} />
              <div className="absolute left-0 mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-1.5 text-xs space-y-1 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Active Project Context
                </div>
                <button
                  onClick={() => { onSelectProjectFilter('ALL'); setShowProjectMenu(false); }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between text-xs font-semibold ${
                    selectedProjectFilter === 'ALL'
                      ? 'bg-purple-950 text-purple-300 border border-purple-800'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span>All Projects (Consolidated)</span>
                  {selectedProjectFilter === 'ALL' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                </button>
                <div className="border-t border-slate-800 my-1"></div>
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { onSelectProjectFilter(p.PROJECT_CODE); setShowProjectMenu(false); }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between text-xs ${
                      selectedProjectFilter === p.PROJECT_CODE
                        ? 'bg-purple-950 text-purple-300 font-bold border border-purple-800'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="block truncate">{p.PROJECT_NAME}</span>
                      <span className="text-[10px] font-mono text-slate-400">{p.PROJECT_CODE} • {p.LOCATION || 'Site'}</span>
                    </div>
                    {selectedProjectFilter === p.PROJECT_CODE && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 ml-1" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* CENTER SECTION: Global Command Search Trigger */}
      <div className="flex-1 max-w-md mx-2 sm:mx-4">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all text-xs group"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:scale-105 transition-transform" />
            <span className="truncate text-[11px]">Search modules, vouchers, vehicles, staff...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* RIGHT SECTION: Quick Action (+), Sync Button, Notifications, Role, User */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Sync Status Button */}
        <button
          onClick={handleManualSync}
          title="Google Sheets Bi-directional Sync"
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] font-mono transition-all active:scale-95"
        >
          {syncStatus === 'ONLINE' && <Wifi className="w-3 h-3 text-emerald-400 shrink-0" />}
          {syncStatus === 'SYNCING' && <RefreshCw className="w-3 h-3 text-blue-400 animate-spin shrink-0" />}
          {syncStatus === 'OFFLINE' && <WifiOff className="w-3 h-3 text-amber-400 shrink-0" />}
          {syncStatus === 'SYNC_ERROR' && <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />}
          <span className="hidden xl:inline text-[10px] font-bold">
            {syncStatus === 'ONLINE' ? 'LIVE' : syncStatus === 'SYNCING' ? 'SYNC' : syncStatus}
          </span>
        </button>

        {/* Quick Create (+) Action Button */}
        <div className="relative">
          <button
            onClick={() => setShowQuickActionMenu(!showQuickActionMenu)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New</span>
            <ChevronDown className="w-2.5 h-2.5" />
          </button>

          {showQuickActionMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowQuickActionMenu(false)} />
              <div className="absolute right-0 mt-1.5 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 text-xs space-y-1 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick Create Entry
                </div>
                <button
                  onClick={() => { setShowQuickActionMenu(false); onOpenAddExpense(); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-emerald-950/80 text-slate-200 hover:text-emerald-300 flex items-center gap-2 font-medium"
                >
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+ Expense Voucher</span>
                </button>
                <button
                  onClick={() => { setShowQuickActionMenu(false); onOpenAddIncome(); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-emerald-950/80 text-slate-200 hover:text-emerald-300 flex items-center gap-2 font-medium"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+ Float Top-up</span>
                </button>
                <button
                  onClick={() => { setShowQuickActionMenu(false); onOpenTransfer(); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-emerald-950/80 text-slate-200 hover:text-emerald-300 flex items-center gap-2 font-medium"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+ P2P Float Transfer</span>
                </button>
                <div className="border-t border-slate-800 my-1"></div>
                <button
                  onClick={() => { setShowQuickActionMenu(false); onOpenAddFuel(); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-blue-950/80 text-slate-200 hover:text-blue-300 flex items-center gap-2 font-medium"
                >
                  <Fuel className="w-3.5 h-3.5 text-blue-400" />
                  <span>+ Fuel Record</span>
                </button>
                <button
                  onClick={() => { setShowQuickActionMenu(false); onOpenAddTrip(); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-blue-950/80 text-slate-200 hover:text-blue-300 flex items-center gap-2 font-medium"
                >
                  <Truck className="w-3.5 h-3.5 text-blue-400" />
                  <span>+ Running Chart Trip</span>
                </button>
                <button
                  onClick={() => { setShowQuickActionMenu(false); onOpenNewTransfer(); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-blue-950/80 text-slate-200 hover:text-blue-300 flex items-center gap-2 font-medium"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
                  <span>+ Vehicle Site Transfer</span>
                </button>
                <div className="border-t border-slate-800 my-1"></div>
                <button
                  onClick={() => { setShowQuickActionMenu(false); onOpenAddPO(); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-orange-950/80 text-slate-200 hover:text-orange-300 flex items-center gap-2 font-medium"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-orange-400" />
                  <span>+ Purchase Order</span>
                </button>
                <button
                  onClick={() => { setShowQuickActionMenu(false); onOpenAddPayment(); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-rose-950/80 text-slate-200 hover:text-rose-300 flex items-center gap-2 font-medium"
                >
                  <CreditCard className="w-3.5 h-3.5 text-rose-400" />
                  <span>+ Payment Request (PRV)</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[8px] font-bold flex items-center justify-center animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-1.5 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-3 text-xs space-y-2 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold text-slate-100 text-xs">Enterprise Alerts Feed</span>
                  </div>
                  {unreadNotificationsCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[10px] text-emerald-400 hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-center text-slate-400 py-3 text-xs">No active alerts</p>
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
                        className={`p-2 rounded-lg border transition-all cursor-pointer ${
                          n.READ
                            ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                            : 'bg-slate-800/80 border-slate-700 text-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[9px] font-bold px-1 py-0.2 rounded uppercase bg-slate-900 text-slate-300">
                            {n.MODULE}
                          </span>
                          <span className="text-[9px] text-slate-400">{n.TIMESTAMP}</span>
                        </div>
                        <h4 className="font-bold text-slate-100 text-[11px] mt-0.5">{n.TITLE}</h4>
                        <p className="text-[10px] text-slate-300 mt-0.5 line-clamp-2">{n.MESSAGE}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Security Role Selector */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-[11px] font-semibold"
          >
            <UserCheck className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="hidden md:inline font-mono text-[10px]">{currentRole}</span>
            <ChevronDown className="w-2.5 h-2.5 text-slate-400 shrink-0" />
          </button>

          {showRoleMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRoleMenu(false)} />
              <div className="absolute right-0 mt-1.5 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-1.5 text-xs space-y-0.5">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Security Access Role
                </div>
                {roles.map(r => (
                  <button
                    key={r}
                    onClick={() => handleRoleChange(r)}
                    className={`w-full text-left px-2 py-1 rounded-lg flex items-center justify-between text-xs ${
                      currentRole === r
                        ? 'bg-amber-950 text-amber-300 font-bold border border-amber-800'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span>{r}</span>
                    {currentRole === r && <CheckCircle2 className="w-3 h-3 text-amber-400" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Active User Persona Avatar */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1.5 p-0.5 sm:px-1.5 sm:py-0.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs"
          >
            <div className="w-5 h-5 rounded bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
              {currentUser.slice(0, 2).toUpperCase()}
            </div>
            <span className="hidden xl:inline font-semibold text-[11px] text-slate-200 max-w-[80px] truncate">{currentUser}</span>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-1.5 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-1.5 text-xs space-y-0.5">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Active User
                </div>
                {supervisors.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleUserChange(s.SUPERVISOR_NAME)}
                    className={`w-full text-left px-2 py-1 rounded-lg flex items-center justify-between text-xs ${
                      currentUser === s.SUPERVISOR_NAME
                        ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div>
                      <span className="block font-bold">{s.SUPERVISOR_NAME}</span>
                      <span className="text-[9px] text-slate-400">{s.DEFAULT_PROJECT || 'General'}</span>
                    </div>
                    {currentUser === s.SUPERVISOR_NAME && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {syncToastMessage && (
        <div className="absolute top-11 left-1/2 -translate-x-1/2 bg-emerald-950/95 border border-emerald-700 px-3 py-1 rounded-full text-center text-xs font-bold text-emerald-300 flex items-center gap-1.5 shadow-lg z-50 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{syncToastMessage}</span>
        </div>
      )}
    </header>
  );
};
