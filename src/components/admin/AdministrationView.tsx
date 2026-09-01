import React, { useState } from 'react';
import {
  Settings,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  Truck,
  KeyRound,
  Trash2,
  HardDrive,
  Download,
  Upload,
  Gauge,
  Fuel,
  Wrench,
  ArrowRightLeft,
  DollarSign,
  Receipt,
  FileText,
  ShoppingBag,
  Bell,
  Layers,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { useEnterprise } from '../../context/EnterpriseContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { useFleet } from '../../context/FleetContext';
import { usePRV } from '../../context/PRVContext';
import { useSiteRecords } from '../../context/SiteRecordContext';
import { useStaff } from '../../context/StaffContext';
import { EnterpriseRole } from '../../types/enterpriseTypes';
import { AdminClearHistoryButton } from '../common/AdminClearHistoryButton';
import { SecurityStatusIndicator } from './SecurityStatusIndicator';
import { AuditLogView } from './AuditLogView';

export const AdministrationView: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    currentUser,
    setCurrentUser,
    syncStatus,
    setSyncStatus,
    lastSyncTime,
    procurementOrders,
    documents,
    notifications,
    clearProcurementHistory,
    clearDocumentsHistory,
    clearNotificationsHistory,
    resetProcurementData,
    resetDocumentsData
  } = useEnterprise();

  const {
    records: siteRecords,
    clearAllRecords: clearSiteRecordsHistory,
    resetToDefaultRecords: resetSiteRecordsData
  } = useSiteRecords();

  const {
    supervisors,
    projects,
    categories,
    expenses,
    income,
    transfers: pettyCashTransfers,
    sheetsConfig,
    updateSheetsConfig,
    syncWithGoogleSheets,
    isSyncingWithSheets,
    resetToDefaultMasterData,
    clearExpensesHistory,
    clearIncomeHistory,
    clearTransfersHistory: clearPettyCashTransfersHistory,
    clearSupervisorsDirectory,
    clearProjectsHistory,
    clearAllPettyCashHistory
  } = usePettyCash();

  const {
    vehicles,
    drivers,
    runningCharts,
    fuelRecords,
    maintenanceLogs,
    transfers: fleetTransfers,
    clearRunningChartHistory,
    clearFuelHistory,
    clearMaintenanceHistory,
    clearTransfersHistory: clearFleetTransfersHistory,
    clearAllFleetHistory,
    clearAllData: clearAllFleetData,
    resetToSampleData: resetFleetSampleData
  } = useFleet();

  const {
    paymentRequests,
    clearAllPRVHistory,
    resetPRVsToDefault
  } = usePRV();

  const {
    staffMembers,
    resetStaffDirectory,
    clearStaffDirectory
  } = useStaff();

  const [activeAdminTab, setActiveAdminTab] = useState<'ROLES' | 'SECURITY' | 'SHEETS' | 'MASTER' | 'CACHE'>('ROLES');
  const [sheetIdInput, setSheetIdInput] = useState(sheetsConfig.spreadsheetId || '1XyZ_SAMPLE_EMA_CONSTRUCTION_PETTY_CASH_FLEET_2026');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const rolesMatrix: { role: EnterpriseRole; description: string; permissions: string[] }[] = [
    {
      role: 'ADMIN',
      description: 'System Administrator with unrestricted access across all ERP modules and security controls.',
      permissions: ['Full Access to all 9 modules', 'Approve/Reject any voucher', 'Manage master data', 'Configure Google Sheets', 'Clear History & Purge Records']
    },
    {
      role: 'OWNER',
      description: 'Managing Director & Board Level Executive. Real-time executive dashboards, cash flow, and sign-offs.',
      permissions: ['Executive Dashboard', 'High-value Payment Sign-offs', 'Financial Summaries', 'Fleet Overview']
    },
    {
      role: 'FINANCE',
      description: 'Head Office Financial Controllers. Petty cash audit, bank reconciliations, PO approvals.',
      permissions: ['Petty Cash Management', 'Payment Vouchers & Disbursals', 'Project Financial Reports', 'View Fleet Costs']
    },
    {
      role: 'PROJECT_MANAGER',
      description: 'Senior Project Managers commanding road packages (PIDM 26, PIDM 28, etc.).',
      permissions: ['Project Cost Tracking', 'Create Material Requisitions', 'Approve Site Expenses', 'View Site Vehicles']
    },
    {
      role: 'SITE_ENGINEER',
      description: 'Field Site Engineers logging technical materials, site labor, and plant equipment hours.',
      permissions: ['Submit Expense Vouchers', 'Create POs', 'Log Fuel & Machinery', 'Upload Site Documents']
    },
    {
      role: 'SUPERVISOR',
      description: 'On-site Cashier & Section Supervisor. Personal float, voucher submission, P2P transfers.',
      permissions: ['Add Expense Vouchers', 'Add Float Top-ups', 'P2P Cash Transfers', 'Own Balance & Statements']
    },
    {
      role: 'FLEET_MANAGER',
      description: 'Fleet Logistics Director. Vehicle maintenance schedules, fuel logs, driver assignments.',
      permissions: ['Manage Fleet & Vehicles', 'Service Reminders', 'Fuel & Running Charts', 'Vehicle Document Vault']
    },
    {
      role: 'DRIVER',
      description: 'Vehicle Operators. Running charts, odometer logs, and fuel receipt uploads.',
      permissions: ['Submit Running Chart', 'Log Fuel Receipt', 'Vehicle Inspection Checklists']
    },
    {
      role: 'VIEWER',
      description: 'Auditor & Read-Only Observer.',
      permissions: ['Read-only view of authorized dashboards and reports']
    }
  ];

  const handleSaveSheetsConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateSheetsConfig({
      ...sheetsConfig,
      spreadsheetId: sheetIdInput.trim()
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleFullDatabaseReset = () => {
    if (confirm('Are you sure you want to reset demo data for all modules (Petty Cash, FleetTrack, Staff Directory, Daily Site Records, Projects, Procurement, Payments)?')) {
      resetToDefaultMasterData();
      resetFleetSampleData();
      resetStaffDirectory();
      resetSiteRecordsData();
      resetProcurementData();
      resetDocumentsData();
      resetPRVsToDefault();
      alert('Enterprise master database reset to defaults successfully.');
    }
  };

  const handleWipeAllOperationalHistory = () => {
    clearAllFleetHistory();
    clearAllPettyCashHistory();
    clearSiteRecordsHistory();
    clearAllPRVHistory();
    clearProcurementHistory();
    clearDocumentsHistory();
    clearNotificationsHistory();
  };

  const totalOperationalRecords =
    runningCharts.length +
    fuelRecords.length +
    maintenanceLogs.length +
    fleetTransfers.length +
    expenses.length +
    income.length +
    pettyCashTransfers.length +
    siteRecords.length +
    paymentRequests.length +
    procurementOrders.length +
    documents.length +
    notifications.length;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 backdrop-blur p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center font-bold">
              <Settings className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Enterprise Administration & Master Data</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global role-based access controls (RBAC), centralized Google Sheets database connections, and system master tables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-slate-300">
            Role: <span className="text-amber-400">{currentRole}</span>
          </span>
        </div>
      </div>

      {/* 2. Admin Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveAdminTab('ROLES')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeAdminTab === 'ROLES' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Roles & Permissions Matrix
        </button>
        <button
          onClick={() => setActiveAdminTab('SECURITY')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeAdminTab === 'SECURITY' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Security & Audit Logs</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('SHEETS')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeAdminTab === 'SHEETS' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Google Sheets Master Cloud Database
        </button>
        <button
          onClick={() => setActiveAdminTab('MASTER')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeAdminTab === 'MASTER' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Shared Master Entities ({projects.length} Projects, {vehicles.length} Vehicles, {staffMembers.length} Staff)
        </button>
        <button
          onClick={() => setActiveAdminTab('CACHE')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeAdminTab === 'CACHE' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Data Storage & Clear History ({totalOperationalRecords})</span>
        </button>
      </div>

      {/* 3. SUB-TAB VIEWS */}

      {/* Tab A: Roles Matrix */}
      {activeAdminTab === 'ROLES' && (
        <div className="space-y-4">
          <SecurityStatusIndicator />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rolesMatrix.map(item => (
              <div
                key={item.role}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  currentRole === item.role
                    ? 'bg-amber-950/40 border-amber-800 shadow-md ring-1 ring-amber-500/50'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-slate-950 text-amber-300 border border-slate-800">
                    {item.role}
                  </span>
                  {currentRole === item.role && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active Session
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300">{item.description}</p>

                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Permissions:</span>
                  {item.permissions.map((perm, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                      <CheckCircle2 className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{perm}</span>
                    </div>
                  ))}
                </div>

                {currentRole !== item.role && (
                  <button
                    onClick={() => setCurrentRole(item.role)}
                    className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all"
                  >
                    Switch to this Persona
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab B: Security & Audit Trail */}
      {activeAdminTab === 'SECURITY' && (
        <div className="space-y-6">
          <SecurityStatusIndicator />
          <AuditLogView />
        </div>
      )}

      {/* Tab C: Google Sheets Central Sync */}
      {activeAdminTab === 'SHEETS' && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Google Sheets Bi-Directional Master Sync</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                All 9 enterprise modules share a unified Google Sheets workbook containing dedicated tabs:
                `EXPENSES`, `INCOME`, `TRANSFERS`, `VEHICLES`, `FUEL`, `MAINTENANCE`, `PROJECTS`, `PROCUREMENT`, `PAYMENTS`.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSheetsConfig} className="space-y-4 max-w-xl text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Google Spreadsheet ID or URL</label>
              <input
                type="text"
                value={sheetIdInput}
                onChange={(e) => setSheetIdInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Default: Configured with EMA Enterprise master template.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all"
              >
                Save Spreadsheet Configuration
              </button>

              <button
                type="button"
                onClick={async () => {
                  const res = await syncWithGoogleSheets();
                  alert(res.message);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingWithSheets ? 'animate-spin' : ''}`} />
                <span>Test Live Sync</span>
              </button>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Google Sheets integration settings updated successfully.</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab C: Shared Master Entities */}
      {activeAdminTab === 'MASTER' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-purple-400" />
                <span>Registered Projects ({projects.length})</span>
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
                {projects.length === 0 ? (
                  <p className="text-center py-6 text-slate-500 italic">No projects registered.</p>
                ) : (
                  projects.map(p => (
                    <div key={p.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-purple-300">{p.PROJECT_CODE}</span>
                        <span className="block text-[11px] text-slate-300">{p.PROJECT_NAME}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">LKR {(p.CONTRACT_VALUE || 0).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800/60">
              <AdminClearHistoryButton
                id="btn-admin-clear-projects-master-tab"
                moduleName="Projects & Construction Registry"
                itemCount={projects.length}
                itemDescription="registered road packages, construction projects, and cost budgets"
                preservedItemsDescription="Existing expense vouchers and fleet logs will remain intact."
                buttonText="Clear Projects"
                onClear={() => clearProjectsHistory()}
              />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-400" />
              <span>Fleet Vehicles ({vehicles.length})</span>
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
              {vehicles.map(v => (
                <div key={v.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-blue-300">{v.registrationNumber}</span>
                    <span className="block text-[11px] text-slate-300">{v.make} {v.model} ({v.type})</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{v.currentSite || 'Head Office'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Site Supervisors ({supervisors.length})</span>
                </h3>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1 text-xs">
                {supervisors.length === 0 ? (
                  <p className="text-center py-6 text-slate-500 italic">No supervisors registered.</p>
                ) : (
                  supervisors.map(s => (
                    <div key={s.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-emerald-300">{s.SUPERVISOR_NAME}</span>
                        <span className="block text-[11px] text-slate-400">{s.DEFAULT_PROJECT || 'General'}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">LKR {(s.OPENING_PETTY_CASH || 0).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800/60">
              <AdminClearHistoryButton
                id="btn-admin-clear-supervisors-master-tab"
                moduleName="Site Supervisors Directory"
                itemCount={supervisors.length}
                itemDescription="registered site supervisors and baseline petty cash allocations"
                preservedItemsDescription="Existing expense and project records will remain intact."
                buttonText="Clear Supervisors"
                onClear={() => clearSupervisorsDirectory()}
              />
            </div>
          </div>

          {/* Card 4: Staff & HR Personnel Directory */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Staff & HR Directory ({staffMembers.length})</span>
                </h3>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1 text-xs">
                {staffMembers.length === 0 ? (
                  <p className="text-center py-6 text-slate-500 italic">No staff members registered.</p>
                ) : (
                  staffMembers.map(s => (
                    <div key={s.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-cyan-300">{s.preferredName}</span>
                        <span className="block text-[11px] text-slate-400">{s.designation}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{s.employeeCode}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to reset the Staff & HR Directory back to the 16 corporate seed members?`)) {
                    resetStaffDirectory();
                  }
                }}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Staff Seed ({staffMembers.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab D: Storage, Cache & Clear History Center */}
      {activeAdminTab === 'CACHE' && (
        <div className="space-y-6">
          {/* Overview Banner */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-950 text-amber-400 border border-amber-800 flex items-center justify-center font-bold shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Enterprise Data Storage & History Purge Center</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Admin-exclusive controls to selectively purge operational transaction history, fuel receipts, running charts, and audit records per module while safely preserving registered master vehicles, drivers, construction projects, and user accounts.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start">
                <AdminClearHistoryButton
                  id="btn-admin-purge-all-history"
                  moduleName="ALL ERP Operational Modules"
                  itemCount={totalOperationalRecords}
                  itemDescription="all running charts, fuel slips, service records, transfers, petty cash vouchers, PRVs, POs, and document attachments"
                  preservedItemsDescription="Master projects, vehicles, registered drivers, user credentials, and chart of accounts will remain safely preserved."
                  buttonText="Purge All Operational History"
                  buttonClassName="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/50 flex items-center gap-2 transition-all active:scale-95"
                  onClear={handleWipeAllOperationalHistory}
                />
              </div>
            </div>

            {/* Total Records Breakdown Metric */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-3 border-t border-slate-800/80">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
                <span className="text-[10px] text-slate-400 font-bold block">Running Charts</span>
                <span className="text-sm font-mono font-bold text-emerald-400">{runningCharts.length} logs</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
                <span className="text-[10px] text-slate-400 font-bold block">Fuel Records</span>
                <span className="text-sm font-mono font-bold text-amber-400">{fuelRecords.length} records</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
                <span className="text-[10px] text-slate-400 font-bold block">Maintenance</span>
                <span className="text-sm font-mono font-bold text-purple-400">{maintenanceLogs.length} logs</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
                <span className="text-[10px] text-slate-400 font-bold block">Daily Reports</span>
                <span className="text-sm font-mono font-bold text-violet-400">{siteRecords.length} DSRs</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
                <span className="text-[10px] text-slate-400 font-bold block">Petty Cash</span>
                <span className="text-sm font-mono font-bold text-teal-400">{expenses.length + income.length} txns</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
                <span className="text-[10px] text-slate-400 font-bold block">Payment PRVs</span>
                <span className="text-sm font-mono font-bold text-indigo-400">{paymentRequests.length} vouchers</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
                <span className="text-[10px] text-slate-400 font-bold block">POs & Docs</span>
                <span className="text-sm font-mono font-bold text-orange-400">{procurementOrders.length + documents.length} files</span>
              </div>
            </div>
          </div>

          {/* Module-by-Module Granular Clear Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Fleet Running Charts */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">Running Charts History</h4>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">{runningCharts.length} total trip logs</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Wipes daily vehicle mileage logs, odometer readings, and route entries. Preserves registered vehicles.
              </p>
              <div className="pt-2 border-t border-slate-800/60">
                <AdminClearHistoryButton
                  id="btn-admin-clear-running-charts-tab"
                  moduleName="Fleet Running Charts"
                  itemCount={runningCharts.length}
                  itemDescription="daily driver trip logs, odometer tracking, and passenger entries"
                  preservedItemsDescription="Vehicles and registered drivers remain intact."
                  buttonText="Clear Running Charts"
                  onClear={() => clearRunningChartHistory()}
                />
              </div>
            </div>

            {/* Card 2: Fleet Fuel Records */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <Fuel className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">Fuel & Fill-Up Slips</h4>
                    <span className="text-[11px] font-mono text-amber-400 font-bold">{fuelRecords.length} fuel records</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Purges fuel dispenser bills, tank fill-up invoices, and fuel consumption calculation records.
              </p>
              <div className="pt-2 border-t border-slate-800/60">
                <AdminClearHistoryButton
                  id="btn-admin-clear-fuel-tab"
                  moduleName="Fleet Fuel Logs"
                  itemCount={fuelRecords.length}
                  itemDescription="fuel fill-up receipts and invoice records"
                  preservedItemsDescription="Vehicles and registered drivers remain intact."
                  buttonText="Clear Fuel Logs"
                  onClear={() => clearFuelHistory()}
                />
              </div>
            </div>

            {/* Card 3: Fleet Maintenance Logs */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">Maintenance & Service Logs</h4>
                    <span className="text-[11px] font-mono text-purple-400 font-bold">{maintenanceLogs.length} service logs</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Clears garage workshop invoices and completed service entries while keeping service intervals intact.
              </p>
              <div className="pt-2 border-t border-slate-800/60">
                <AdminClearHistoryButton
                  id="btn-admin-clear-maintenance-tab"
                  moduleName="Fleet Maintenance Logs"
                  itemCount={maintenanceLogs.length}
                  itemDescription="completed service records and garage workshop invoices"
                  preservedItemsDescription="Vehicles, intervals, and schedules remain intact."
                  buttonText="Clear Maintenance Logs"
                  onClear={() => clearMaintenanceHistory()}
                />
              </div>
            </div>

            {/* Card 4: Vehicle Transfers */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">Vehicle Handover Transfers</h4>
                    <span className="text-[11px] font-mono text-blue-400 font-bold">{fleetTransfers.length} transfers</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Wipes driver custody handovers, initial condition checklists, and handover audit signatures.
              </p>
              <div className="pt-2 border-t border-slate-800/60">
                <AdminClearHistoryButton
                  id="btn-admin-clear-transfers-tab"
                  moduleName="Vehicle Transfers"
                  itemCount={fleetTransfers.length}
                  itemDescription="driver handover inspection audit logs"
                  preservedItemsDescription="Vehicles and registered drivers remain intact."
                  buttonText="Clear Transfers History"
                  onClear={() => clearFleetTransfersHistory()}
                />
              </div>
            </div>

            {/* Card 5: Petty Cash Expenses */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">Petty Cash Expense Vouchers</h4>
                    <span className="text-[11px] font-mono text-teal-400 font-bold">{expenses.length} vouchers</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Clears on-site cash expense receipts and bill vouchers. Master projects and accounts remain intact.
              </p>
              <div className="pt-2 border-t border-slate-800/60">
                <AdminClearHistoryButton
                  id="btn-admin-clear-petty-expenses-tab"
                  moduleName="Petty Cash Expenses"
                  itemCount={expenses.length}
                  itemDescription="expense vouchers and bill receipts"
                  preservedItemsDescription="Supervisors, projects, and chart of accounts remain intact."
                  buttonText="Clear Expense Vouchers"
                  onClear={() => clearExpensesHistory()}
                />
              </div>
            </div>

            {/* Card 6: Petty Cash Income */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">Petty Cash Top-ups & Float</h4>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">{income.length} top-ups</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Wipes float replenishments and cashier cash injections.
              </p>
              <div className="pt-2 border-t border-slate-800/60">
                <AdminClearHistoryButton
                  id="btn-admin-clear-petty-income-tab"
                  moduleName="Petty Cash Top-ups"
                  itemCount={income.length}
                  itemDescription="float top-up receipts and bank deposit confirmations"
                  preservedItemsDescription="Supervisors, projects, and chart of accounts remain intact."
                  buttonText="Clear Float Top-ups"
                  onClear={() => clearIncomeHistory()}
                />
              </div>
            </div>

            {/* Card 7: Payment Request Vouchers (PRV) */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">Payment Request Vouchers (PRV)</h4>
                    <span className="text-[11px] font-mono text-indigo-400 font-bold">{paymentRequests.length} vouchers</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Purges PRV vouchers, multi-level approval history, and scanned payment proof receipts.
              </p>
              <div className="pt-2 border-t border-slate-800/60">
                <AdminClearHistoryButton
                  id="btn-admin-clear-prv-tab"
                  moduleName="Payment Request Vouchers (PRV)"
                  itemCount={paymentRequests.length}
                  itemDescription="payment vouchers, approval audit trails, and proof attachments"
                  preservedItemsDescription="Core projects, chart of accounts, and user profiles remain intact."
                  buttonText="Clear PRV Vouchers"
                  onClear={() => clearAllPRVHistory()}
                />
              </div>
            </div>

            {/* Card 8: Procurement Orders */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">Procurement & POs</h4>
                    <span className="text-[11px] font-mono text-orange-400 font-bold">{procurementOrders.length} purchase orders</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Wipes purchase orders and materials requisitions across road packages and site lots.
              </p>
              <div className="pt-2 border-t border-slate-800/60">
                <AdminClearHistoryButton
                  id="btn-admin-clear-procurement-tab"
                  moduleName="Procurement Orders"
                  itemCount={procurementOrders.length}
                  itemDescription="purchase orders and requisition logs"
                  preservedItemsDescription="Supplier directories and project allocations remain intact."
                  buttonText="Clear PO Records"
                  onClear={() => clearProcurementHistory()}
                />
              </div>
            </div>

            {/* Card 9: Document Vault */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">Document Vault</h4>
                    <span className="text-[11px] font-mono text-indigo-400 font-bold">{documents.length} uploaded files</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Clears uploaded receipt images, site permit scans, and vehicle fitness document files.
              </p>
              <div className="pt-2 border-t border-slate-800/60">
                <AdminClearHistoryButton
                  id="btn-admin-clear-documents-tab"
                  moduleName="Document Vault"
                  itemCount={documents.length}
                  itemDescription="scanned attachments, receipts, and PDF files"
                  preservedItemsDescription="Underlying transaction records and project data remain intact."
                  buttonText="Clear Document Vault"
                  onClear={() => clearDocumentsHistory()}
                />
              </div>
            </div>

            {/* Card 10: Site Supervisors Master Directory */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">Supervisors Directory</h4>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">{supervisors.length} registered officers</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Clears site supervisor registrations and float baselines. Preserves existing vouchers and project accounts.
              </p>
              <div className="pt-2 border-t border-slate-800/60">
                <AdminClearHistoryButton
                  id="btn-admin-clear-supervisors-cache-tab"
                  moduleName="Site Supervisors Directory"
                  itemCount={supervisors.length}
                  itemDescription="registered site supervisors and baseline float amounts"
                  preservedItemsDescription="Existing expenses, income receipts, and project master data remain intact."
                  buttonText="Clear Supervisors"
                  onClear={() => clearSupervisorsDirectory()}
                />
              </div>
            </div>

            {/* Card 11: Projects & Construction Packages */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">Projects & Construction</h4>
                    <span className="text-[11px] font-mono text-purple-400 font-bold">{projects.length} registered packages</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Clears registered road construction projects, contract budgets, and project codes.
              </p>
              <div className="pt-2 border-t border-slate-800/60">
                <AdminClearHistoryButton
                  id="btn-admin-clear-projects-cache-tab"
                  moduleName="Projects & Construction Registry"
                  itemCount={projects.length}
                  itemDescription="registered road packages, construction projects, and cost budgets"
                  preservedItemsDescription="Underlying transaction history in Petty Cash, Fuel, and Maintenance will remain intact."
                  buttonText="Clear Projects"
                  onClear={() => clearProjectsHistory()}
                />
              </div>
            </div>

            {/* Card 12: Daily Site Records (DSR) & Daily Reports */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">Daily Site Reports (DSR)</h4>
                    <span className="text-[11px] font-mono text-violet-400 font-bold">{siteRecords.length} daily logs</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Purges construction daily site records, manpower attendance, plant machinery hours, and sign-offs.
              </p>
              <div className="pt-2 border-t border-slate-800/60">
                <AdminClearHistoryButton
                  id="btn-admin-clear-daily-reports-cache-tab"
                  moduleName="Daily Site Records & Daily Reports"
                  itemCount={siteRecords.length}
                  itemDescription="all daily construction logs, equipment utilization hours, and HSE sign-offs"
                  preservedItemsDescription="Registered construction projects, company vehicles, and master personnel remain intact."
                  buttonText="Clear Daily Reports"
                  onClear={() => clearSiteRecordsHistory()}
                />
              </div>
            </div>

            {/* Card 13: Staff & Corporate HR Directory */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">Staff & HR Directory</h4>
                    <span className="text-[11px] font-mono text-cyan-400 font-bold">{staffMembers.length} personnel</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Clears employee directory records, payroll configurations, emergency contacts, and direct reporting lines.
              </p>
              <div className="pt-2 border-t border-slate-800/60">
                <AdminClearHistoryButton
                  id="btn-admin-clear-staff-cache-tab"
                  moduleName="Staff & HR Directory"
                  itemCount={staffMembers.length}
                  itemDescription="all registered employees, designations, and salary structures"
                  preservedItemsDescription="Underlying transaction vouchers and project assignments will remain intact."
                  buttonText="Clear Staff Records"
                  onClear={() => clearStaffDirectory()}
                />
              </div>
            </div>
          </div>

          {/* Master Reset Section */}
          <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Demo Data & Master System Reset</span>
              </h4>
              <p className="text-[11px] text-rose-400/80 mt-1">
                Restores standard factory sample data across all 9 enterprise modules (Projects, Fleet, Supervisors, and Demo Expenses).
              </p>
            </div>
            <button
              onClick={handleFullDatabaseReset}
              className="px-4 py-2 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-700 font-bold text-xs transition-all flex items-center gap-1.5 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Master Demo Data</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
