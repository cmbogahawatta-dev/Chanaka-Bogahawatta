import React from 'react';
import {
  Wallet,
  Truck,
  RefreshCw,
  PlusCircle,
  ArrowRightLeft,
  DollarSign,
  UserCheck,
  ShieldAlert,
  FileSpreadsheet,
  CheckCircle2,
  Upload,
  Bell,
  AlertTriangle
} from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';
import { PettyCashUserRole } from '../../types/pettyCashTypes';

interface PettyCashHeaderProps {
  currentModule: 'pettyCash' | 'fleetTrack';
  onSwitchModule: (module: 'pettyCash' | 'fleetTrack') => void;
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  onOpenTransfer: () => void;
  onOpenSheetsSync: () => void;
  onOpenBulkImport?: () => void;
  onOpenBudgetAlerts?: () => void;
}

export const PettyCashHeader: React.FC<PettyCashHeaderProps> = ({
  currentModule,
  onSwitchModule,
  onOpenAddExpense,
  onOpenAddIncome,
  onOpenTransfer,
  onOpenSheetsSync,
  onOpenBulkImport,
  onOpenBudgetAlerts
}) => {
  const {
    userRole,
    setUserRole,
    currentSupervisorName,
    setCurrentSupervisorName,
    supervisors,
    sheetsConfig,
    isSyncingWithSheets,
    syncWithGoogleSheets,
    kpiMetrics,
    budgetAlerts
  } = usePettyCash();

  const unacknowledgedCount = budgetAlerts.filter(a => !a.acknowledged).length;
  const criticalCount = budgetAlerts.filter(a => a.thresholdLevel === 'CRITICAL_95' || a.thresholdLevel === 'OVER_BUDGET').length;

  const handleQuickSync = async () => {
    const res = await syncWithGoogleSheets();
    if (!res.success) {
      alert(res.message);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-md">
      {/* Top Module Switcher Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60">
        {/* Brand & Module Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm font-bold text-sm">
              EMA
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-100 tracking-tight leading-none">
                EMA Enterprise Corporate Suite
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Construction & Fleet Operations</p>
            </div>
          </div>

          {/* Module Switcher Tabs */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 ml-2">
            <button
              id="module-btn-pettycash"
              onClick={() => onSwitchModule('pettyCash')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                currentModule === 'pettyCash'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Petty Cash & Expenses</span>
            </button>
            <button
              id="module-btn-fleettrack"
              onClick={() => onSwitchModule('fleetTrack')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                currentModule === 'fleetTrack'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>FleetTrack Vehicles</span>
            </button>
          </div>
        </div>

        {/* Google Sheets Sync & User Role Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Google Sheets Sync Status Button */}
          <button
            id="google-sheets-sync-status-btn"
            onClick={onOpenSheetsSync}
            title={`Connected to ${sheetsConfig.spreadsheetName}. Click to open sync settings.`}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs hover:bg-emerald-900/50 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium text-[11px]">Google Sheets</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          <button
            id="quick-sync-trigger-btn"
            onClick={handleQuickSync}
            disabled={isSyncingWithSheets}
            title="Sync all tables with Google Sheets"
            className="p-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 hover:text-emerald-400 hover:border-emerald-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingWithSheets ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Budget Threshold Alerts Bell Button */}
          {onOpenBudgetAlerts && (
            <button
              id="header-btn-budget-alerts-bell"
              onClick={onOpenBudgetAlerts}
              title={`${budgetAlerts.length} Budget Threshold Alerts (${unacknowledgedCount} unacknowledged)`}
              className={`relative p-1.5 rounded-md border transition-all ${
                criticalCount > 0
                  ? 'bg-orange-950/60 border-orange-700 text-orange-300 hover:bg-orange-900/60'
                  : unacknowledgedCount > 0
                  ? 'bg-amber-950/60 border-amber-700 text-amber-300 hover:bg-amber-900/60'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-amber-400'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              {unacknowledgedCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm animate-pulse">
                  {unacknowledgedCount}
                </span>
              )}
            </button>
          )}

          {/* User Role Switcher Dropdown */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium uppercase">Role:</span>
            <select
              id="petty-cash-user-role-select"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as PettyCashUserRole)}
              className="bg-transparent text-xs font-semibold text-emerald-400 focus:outline-none cursor-pointer"
            >
              <option value="ADMIN" className="bg-slate-900 text-slate-100">ADMIN (Full Access)</option>
              <option value="FINANCE" className="bg-slate-900 text-slate-100">FINANCE / ACCOUNTS</option>
              <option value="SUPERVISOR" className="bg-slate-900 text-slate-100">SUPERVISOR (Field)</option>
              <option value="VIEWER" className="bg-slate-900 text-slate-100">MANAGEMENT / VIEWER</option>
            </select>
          </div>

          {/* If Supervisor role active: Choose which supervisor identity */}
          {userRole === 'SUPERVISOR' && (
            <div className="flex items-center gap-1 bg-emerald-950/80 px-2 py-1 rounded-md border border-emerald-800">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <select
                id="active-supervisor-name-select"
                value={currentSupervisorName}
                onChange={(e) => setCurrentSupervisorName(e.target.value)}
                className="bg-transparent text-xs font-bold text-emerald-300 focus:outline-none cursor-pointer"
              >
                {supervisors.map(s => (
                  <option key={s.id} value={s.SUPERVISOR_NAME} className="bg-slate-900 text-slate-100">
                    {s.employeeCode || s.SUPERVISOR_ID} — {s.FULL_NAME || s.SUPERVISOR_NAME}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Action Bar with Quick Creation Buttons */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Currency:</span>
          <span className="text-xs font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            LKR
          </span>
          <span className="text-xs text-slate-400 font-medium ml-2">Date Format:</span>
          <span className="text-xs font-medium text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            DD/MM/YYYY
          </span>
          {kpiMetrics.overdrawnSupervisorsCount > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800 ml-2">
              <ShieldAlert className="w-3 h-3" />
              <span>{kpiMetrics.overdrawnSupervisorsCount} Overdrawn</span>
            </div>
          )}
        </div>

        {/* Fast Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onOpenBulkImport && (
            <button
              id="header-btn-bulk-import-expenses"
              onClick={onOpenBulkImport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-950/70 text-emerald-300 border border-emerald-700/60 text-xs font-bold shadow-sm hover:border-emerald-500 transition-all active:scale-95"
              title="Bulk Import Expenses with Admin Approval"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bulk Import</span>
            </button>
          )}

          <button
            id="header-btn-add-expense"
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Expense</span>
          </button>

          {(userRole === 'ADMIN' || userRole === 'FINANCE') && (
            <button
              id="header-btn-add-income"
              onClick={onOpenAddIncome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Add Petty Cash Top-up</span>
            </button>
          )}

          {(userRole === 'ADMIN' || userRole === 'FINANCE' || userRole === 'SUPERVISOR') && (
            <button
              id="header-btn-transfer-cash"
              onClick={onOpenTransfer}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-all active:scale-95"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Transfer Cash</span>
              <span className="sm:hidden">Transfer</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
