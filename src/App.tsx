import React, { useState, useEffect } from 'react';
import { FleetProvider } from './context/FleetContext';
import { PettyCashProvider } from './context/PettyCashContext';
import { EnterpriseProvider, useEnterprise } from './context/EnterpriseContext';
import { PRVProvider } from './context/PRVContext';
import { SiteRecordProvider } from './context/SiteRecordContext';
import { StaffProvider } from './context/StaffContext';

// HR & Payroll Context Providers
import { StaffAllocationProvider } from './context/StaffAllocationContext';
import { ApprovalWorkflowProvider } from './context/ApprovalWorkflowContext';
import { GeofenceProvider } from './context/GeofenceContext';
import { AttendanceProvider } from './context/AttendanceContext';
import { LeaveProvider } from './context/LeaveContext';
import { SalaryHistoryProvider } from './context/SalaryHistoryContext';
import { PayrollProvider } from './context/PayrollContext';
import { DataManagementProvider } from './context/DataManagementContext';

// Global Navigation Shell
import { EnterpriseTopUtilityBar } from './components/navigation/EnterpriseTopUtilityBar';
import { EnterpriseCommandRail } from './components/navigation/EnterpriseCommandRail';
import { EnterpriseSystemStatusBar } from './components/navigation/EnterpriseSystemStatusBar';
import { GlobalCommandPaletteModal } from './components/navigation/GlobalCommandPaletteModal';

// Enterprise Views
import { MasterDashboardView } from './components/masterDashboard/MasterDashboardView';
import { SiteRecordsView } from './components/siteRecords/SiteRecordsView';
import { ProjectsView } from './components/projects/ProjectsView';
import { ProcurementView } from './components/procurement/ProcurementView';
import { PaymentsView } from './components/payments/PaymentsView';
import { EnterpriseReportsView } from './components/reports/EnterpriseReportsView';
import { DocumentsView } from './components/documents/DocumentsView';
import { AdministrationView } from './components/admin/AdministrationView';
import { StaffDirectoryView } from './components/staff/StaffDirectoryView';

// Petty Cash Components
import { PettyCashDashboardView } from './components/pettyCash/PettyCashDashboardView';
import { ExpensesListView } from './components/pettyCash/ExpensesListView';
import { IncomeListView } from './components/pettyCash/IncomeListView';
import { PettyCashBalancesView } from './components/pettyCash/PettyCashBalancesView';
import { ProjectMatrixView } from './components/pettyCash/ProjectMatrixView';
import { MasterSupervisorsView } from './components/pettyCash/MasterSupervisorsView';
import { MasterCategoriesView } from './components/pettyCash/MasterCategoriesView';
import { PettyCashReportsView } from './components/pettyCash/PettyCashReportsView';
import { ProofDocumentsView } from './components/pettyCash/ProofDocumentsView';
import { GoogleSheetsSettingsView } from './components/pettyCash/GoogleSheetsSettingsView';
import { AddExpenseModal } from './components/pettyCash/AddExpenseModal';
import { AddIncomeModal } from './components/pettyCash/AddIncomeModal';
import { InternalTransferModal } from './components/pettyCash/InternalTransferModal';
import { ExpenseDetailModal } from './components/pettyCash/ExpenseDetailModal';
import { Expense } from './types/pettyCashTypes';

// FleetTrack Components
import { DashboardView as FleetDashboardView } from './components/dashboard/DashboardView';
import { AnalyticsDashboardView } from './components/analytics/AnalyticsDashboardView';
import { RunningChartView } from './components/runningChart/RunningChartView';
import { FuelRecordView } from './components/fuel/FuelRecordView';
import { MaintenanceView } from './components/maintenance/MaintenanceView';
import { VehicleTransferView } from './components/transfers/VehicleTransferView';
import { DriversView } from './components/drivers/DriversView';
import { VehiclesView } from './components/vehicles/VehiclesView';
import { LiveGPSMapView } from './components/gps/LiveGPSMapView';
import { TripModal } from './components/runningChart/TripModal';
import { FuelModal } from './components/fuel/FuelModal';
import { NewTransferModal } from './components/transfers/NewTransferModal';
import { PublishAppModal } from './components/mobile/PublishAppModal';
import { PWAInstallBanner } from './components/mobile/PWAInstallBanner';
import { VehicleTransfer } from './types';
import { EnterpriseModule } from './types/enterpriseTypes';

// Icons for high-density sub-navigation toolbars
import {
  Wallet,
  DollarSign,
  Users,
  Grid,
  FileSpreadsheet,
  BarChart3,
  FileText,
  Settings,
  Truck,
  Fuel,
  Wrench,
  ArrowRightLeft,
  Navigation,
  Activity,
  Layers
} from 'lucide-react';

const EnterpriseAppContent: React.FC = () => {
  const { currentModule, setCurrentModule, navigateToModule } = useEnterprise();

  // Navigation Rail State (persisted in localStorage)
  const [isRailCollapsed, setIsRailCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ema_rail_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleRail = () => {
    setIsRailCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('ema_rail_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Global Command Palette
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Active Project Filter (Global Context)
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('ALL');

  // Petty Cash Sub-Tab State
  const [pettyCashTab, setPettyCashTab] = useState<
    'dashboard' | 'expenses' | 'income' | 'petty-cash' | 'projects' | 'supervisors' | 'categories' | 'reports' | 'documents' | 'settings'
  >('dashboard');

  // FleetTrack Sub-Tab State
  const [fleetTab, setFleetTab] = useState<
    'dashboard' | 'gps' | 'analytics' | 'runningChart' | 'fuel' | 'maintenance' | 'transfers' | 'drivers' | 'vehicles'
  >('dashboard');

  // Petty Cash Modal States
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState<boolean>(false);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState<boolean>(false);
  const [isTransferOpen, setIsTransferOpen] = useState<boolean>(false);
  const [selectedExpenseForDetail, setSelectedExpenseForDetail] = useState<Expense | null>(null);
  const [selectedSupervisorForStatement, setSelectedSupervisorForStatement] = useState<string | undefined>(undefined);

  // FleetTrack Modal States
  const [showTripModal, setShowTripModal] = useState<boolean>(false);
  const [showFuelModal, setShowFuelModal] = useState<boolean>(false);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [transferInitialVehicleId, setTransferInitialVehicleId] = useState<string | undefined>(undefined);
  const [selectedTransferForView, setSelectedTransferForView] = useState<VehicleTransfer | null>(null);

  // Publish / PWA Modal
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [publishTab, setPublishTab] = useState<'android' | 'ios' | 'pwa' | 'export' | 'preview'>('android');

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. Cmd/Ctrl + K => Open Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }

      // 2. Cmd/Ctrl + B => Toggle Sidebar Rail
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleRail();
      }

      // 3. Alt + Number shortcuts for quick module jumping
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const moduleMap: Record<string, EnterpriseModule> = {
          '1': 'overview',
          '2': 'site-records',
          '3': 'petty-cash',
          '4': 'fleet',
          '5': 'staff',
          '6': 'projects',
          '7': 'procurement',
          '8': 'payments',
          'i': 'invoices',
          'I': 'invoices',
          'c': 'client-payments',
          'C': 'client-payments',
          '9': 'reports',
          '0': 'documents',
          'p': 'admin',
          'P': 'admin'
        };

        if (moduleMap[e.key]) {
          e.preventDefault();
          setCurrentModule(moduleMap[e.key]);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [setCurrentModule]);

  const handleOpenSupervisorStatement = (supervisorName: string) => {
    setSelectedSupervisorForStatement(supervisorName);
    setPettyCashTab('petty-cash');
    setCurrentModule('petty-cash');
  };

  const handleOpenTransferForVehicle = (vehicleId: string) => {
    setTransferInitialVehicleId(vehicleId);
    setShowTransferModal(true);
  };

  const handleOpenTripForVehicle = () => {
    setShowTripModal(true);
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden selection:bg-emerald-600 selection:text-white">
      {/* Optional Mobile PWA Install Banner */}
      <PWAInstallBanner onOpenPublishModal={(tab) => { setPublishTab(tab); setShowPublishModal(true); }} />

      {/* 1. TOP UTILITY HEADER (Height: 44px / h-11) */}
      <EnterpriseTopUtilityBar
        isRailCollapsed={isRailCollapsed}
        onToggleRail={toggleRail}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenAddExpense={() => setIsAddExpenseOpen(true)}
        onOpenAddIncome={() => setIsAddIncomeOpen(true)}
        onOpenTransfer={() => setIsTransferOpen(true)}
        onOpenAddFuel={() => setShowFuelModal(true)}
        onOpenAddTrip={() => setShowTripModal(true)}
        onOpenNewTransfer={() => {
          setTransferInitialVehicleId(undefined);
          setShowTransferModal(true);
        }}
        onOpenAddPO={() => navigateToModule('procurement')}
        onOpenAddPayment={() => navigateToModule('payments')}
        selectedProjectFilter={selectedProjectFilter}
        onSelectProjectFilter={setSelectedProjectFilter}
      />

      {/* 2. MAIN MIDDLE WORKSPACE: Rail + 12-Column Responsive Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Left Command Rail (56px / 220px) */}
        <EnterpriseCommandRail
          isCollapsed={isRailCollapsed}
          onToggleCollapse={toggleRail}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {/* Scrollable 12-Column Workspace Grid */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-950 p-2.5 sm:p-4 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="max-w-[1600px] mx-auto w-full">
            {/* MODULE 1: EXECUTIVE OVERVIEW */}
            {currentModule === 'overview' && (
              <MasterDashboardView
                onSwitchModule={(mod, targetTab) => {
                  if (mod === 'pettyCash') {
                    setCurrentModule('petty-cash');
                    if (targetTab) setPettyCashTab(targetTab as any);
                  } else if (mod === 'fleetTrack') {
                    setCurrentModule('fleet');
                    if (targetTab) setFleetTab(targetTab as any);
                  }
                }}
                onOpenAddExpense={() => setIsAddExpenseOpen(true)}
                onOpenAddIncome={() => setIsAddIncomeOpen(true)}
                onOpenAddFuel={() => setShowFuelModal(true)}
                onOpenAddTrip={() => setShowTripModal(true)}
                onOpenTransfer={() => setIsTransferOpen(true)}
              />
            )}

            {/* MODULE 2: PETTY CASH & EXPENSES */}
            {currentModule === 'petty-cash' && (
              <div className="space-y-3">
                {/* High-Density Compact Toolbar */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none bg-slate-900/90 px-2 py-1.5 rounded-xl border border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setPettyCashTab('dashboard')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        pettyCashTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      Cashier Dashboard
                    </button>
                    <button
                      onClick={() => setPettyCashTab('expenses')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        pettyCashTab === 'expenses' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      Expense Vouchers
                    </button>
                    <button
                      onClick={() => setPettyCashTab('income')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        pettyCashTab === 'income' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      Petty Cash Top-ups
                    </button>
                    <button
                      onClick={() => setPettyCashTab('petty-cash')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        pettyCashTab === 'petty-cash' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      Supervisor Balances
                    </button>
                    <button
                      onClick={() => setPettyCashTab('projects')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        pettyCashTab === 'projects' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      Project Matrix
                    </button>
                    <button
                      onClick={() => setPettyCashTab('supervisors')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        pettyCashTab === 'supervisors' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      Supervisors
                    </button>
                    <button
                      onClick={() => setPettyCashTab('categories')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        pettyCashTab === 'categories' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      GL Categories
                    </button>
                    <button
                      onClick={() => setPettyCashTab('reports')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        pettyCashTab === 'reports' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      Reports
                    </button>
                    <button
                      onClick={() => setPettyCashTab('documents')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        pettyCashTab === 'documents' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      Receipt Proofs
                    </button>
                    <button
                      onClick={() => setPettyCashTab('settings')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        pettyCashTab === 'settings' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      Google Sheets
                    </button>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setIsAddExpenseOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                    >
                      <span>+ Voucher</span>
                    </button>
                  </div>
                </div>

                {/* Tab Views */}
                {pettyCashTab === 'dashboard' && (
                  <PettyCashDashboardView
                    onNavigateTab={(tab) => setPettyCashTab(tab)}
                    onOpenAddExpense={() => setIsAddExpenseOpen(true)}
                    onOpenAddIncome={() => setIsAddIncomeOpen(true)}
                    onSelectExpenseForDetail={(exp) => setSelectedExpenseForDetail(exp)}
                    onSelectSupervisorForStatement={handleOpenSupervisorStatement}
                  />
                )}

                {pettyCashTab === 'expenses' && (
                  <ExpensesListView
                    onOpenAddExpense={() => setIsAddExpenseOpen(true)}
                    onSelectExpenseForDetail={(exp) => setSelectedExpenseForDetail(exp)}
                  />
                )}

                {pettyCashTab === 'income' && (
                  <IncomeListView
                    onOpenAddIncome={() => setIsAddIncomeOpen(true)}
                  />
                )}

                {pettyCashTab === 'petty-cash' && (
                  <PettyCashBalancesView
                    initialSupervisor={selectedSupervisorForStatement}
                    onOpenAddExpense={() => setIsAddExpenseOpen(true)}
                    onOpenAddIncome={() => setIsAddIncomeOpen(true)}
                    onOpenTransfer={() => setIsTransferOpen(true)}
                  />
                )}

                {pettyCashTab === 'projects' && (
                  <ProjectMatrixView
                    onSelectExpenseForDetail={(exp) => setSelectedExpenseForDetail(exp)}
                  />
                )}

                {pettyCashTab === 'supervisors' && <MasterSupervisorsView />}
                {pettyCashTab === 'categories' && <MasterCategoriesView />}
                {pettyCashTab === 'reports' && <PettyCashReportsView />}
                {pettyCashTab === 'documents' && (
                  <ProofDocumentsView
                    onSelectExpenseForDetail={(exp) => setSelectedExpenseForDetail(exp)}
                  />
                )}
                {pettyCashTab === 'settings' && <GoogleSheetsSettingsView />}
              </div>
            )}

            {/* MODULE 3: FLEETTRACK VEHICLES */}
            {currentModule === 'fleet' && (
              <div className="space-y-3">
                {/* FleetTrack Sub-Nav Toolbar */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none bg-slate-900/90 px-2 py-1.5 rounded-xl border border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setFleetTab('dashboard')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        fleetTab === 'dashboard' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      Fleet Dashboard
                    </button>
                    <button
                      onClick={() => setFleetTab('vehicles')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        fleetTab === 'vehicles' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      Vehicles Registry
                    </button>
                    <button
                      onClick={() => setFleetTab('drivers')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        fleetTab === 'drivers' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      Drivers
                    </button>
                    <button
                      onClick={() => setFleetTab('runningChart')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        fleetTab === 'runningChart' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      Running Charts
                    </button>
                    <button
                      onClick={() => setFleetTab('fuel')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        fleetTab === 'fuel' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      Fuel Logs
                    </button>
                    <button
                      onClick={() => setFleetTab('maintenance')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        fleetTab === 'maintenance' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      Maintenance & Services
                    </button>
                    <button
                      onClick={() => setFleetTab('transfers')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        fleetTab === 'transfers' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      Site Transfers
                    </button>
                    <button
                      onClick={() => setFleetTab('gps')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        fleetTab === 'gps' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      Live GPS Map
                    </button>
                    <button
                      onClick={() => setFleetTab('analytics')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        fleetTab === 'analytics' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      Fleet Analytics
                    </button>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setShowTripModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-all"
                    >
                      + Trip
                    </button>
                    <button
                      onClick={() => setShowFuelModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-bold transition-all"
                    >
                      + Fuel
                    </button>
                  </div>
                </div>

                {/* Fleet Content */}
                {fleetTab === 'dashboard' && (
                  <FleetDashboardView
                    onNavigate={(tab) => setFleetTab(tab as any)}
                    onOpenTrip={() => setShowTripModal(true)}
                    onOpenFuel={() => setShowFuelModal(true)}
                    onOpenTransfer={() => {
                      setTransferInitialVehicleId(undefined);
                      setShowTransferModal(true);
                    }}
                  />
                )}

                {fleetTab === 'gps' && <LiveGPSMapView />}
                {fleetTab === 'analytics' && <AnalyticsDashboardView />}
                {fleetTab === 'runningChart' && <RunningChartView />}
                {fleetTab === 'fuel' && <FuelRecordView />}
                {fleetTab === 'maintenance' && <MaintenanceView />}
                {fleetTab === 'transfers' && (
                  <VehicleTransferView
                    onOpenNewTransfer={() => {
                      setTransferInitialVehicleId(undefined);
                      setShowTransferModal(true);
                    }}
                    selectedTransferForView={selectedTransferForView}
                    setSelectedTransferForView={setSelectedTransferForView}
                  />
                )}
                {fleetTab === 'drivers' && <DriversView />}
                {fleetTab === 'vehicles' && (
                  <VehiclesView
                    onOpenTransfer={handleOpenTransferForVehicle}
                    onOpenTrip={handleOpenTripForVehicle}
                  />
                )}
              </div>
            )}

            {/* MODULE 3.5: CONSTRUCTION DAILY SITE RECORDS (DSR) */}
            {currentModule === 'site-records' && <SiteRecordsView />}

            {/* MODULE 3.8: STAFF & HR DIRECTORY */}
            {currentModule === 'staff' && <StaffDirectoryView />}

            {/* MODULE 4: PROJECTS & CONSTRUCTION */}
            {currentModule === 'projects' && <ProjectsView />}

            {/* MODULE 5: PROCUREMENT & MATERIALS */}
            {currentModule === 'procurement' && <ProcurementView />}

            {/* MODULE 6: FINANCE & PRV VOUCHERS, INVOICES & CLIENT PAYMENTS */}
            {currentModule === 'payments' && <PaymentsView initialTab="vouchers" />}
            {currentModule === 'invoices' && <PaymentsView initialTab="project_invoices" />}
            {currentModule === 'client-payments' && <PaymentsView initialTab="client_payments" />}

            {/* MODULE 7: CONSOLIDATED REPORTS */}
            {currentModule === 'reports' && <EnterpriseReportsView />}

            {/* MODULE 8: UNIVERSAL DOCUMENTS */}
            {currentModule === 'documents' && <DocumentsView />}

            {/* MODULE 9: ADMINISTRATION & MASTER DATA */}
            {currentModule === 'admin' && <AdministrationView />}
          </div>
        </main>
      </div>

      {/* 3. BOTTOM SYSTEM STATUS BAR (Height: 28px / h-7) */}
      <EnterpriseSystemStatusBar selectedProjectFilter={selectedProjectFilter} />

      {/* 4. GLOBAL COMMAND PALETTE MODAL (Cmd + K) */}
      <GlobalCommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenAddExpense={() => setIsAddExpenseOpen(true)}
        onOpenAddIncome={() => setIsAddIncomeOpen(true)}
        onOpenTransfer={() => setIsTransferOpen(true)}
        onOpenAddFuel={() => setShowFuelModal(true)}
        onOpenAddTrip={() => setShowTripModal(true)}
        onOpenNewTransfer={() => {
          setTransferInitialVehicleId(undefined);
          setShowTransferModal(true);
        }}
        onOpenAddPO={() => navigateToModule('procurement')}
        onOpenAddPayment={() => navigateToModule('payments')}
      />

      {/* Global Modals */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
      />

      <AddIncomeModal
        isOpen={isAddIncomeOpen}
        onClose={() => setIsAddIncomeOpen(false)}
      />

      <InternalTransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
      />

      <ExpenseDetailModal
        expense={selectedExpenseForDetail}
        isOpen={!!selectedExpenseForDetail}
        onClose={() => setSelectedExpenseForDetail(null)}
      />

      <TripModal
        isOpen={showTripModal}
        onClose={() => setShowTripModal(false)}
      />

      <FuelModal
        isOpen={showFuelModal}
        onClose={() => setShowFuelModal(false)}
      />

      <NewTransferModal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setTransferInitialVehicleId(undefined);
        }}
        initialVehicleId={transferInitialVehicleId}
      />

      <PublishAppModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        initialTab={publishTab}
      />
    </div>
  );
};

export default function App() {
  return (
    <StaffProvider>
      <FleetProvider>
        <PettyCashProvider>
          <EnterpriseProvider>
            <PRVProvider>
              <SiteRecordProvider>
                <StaffAllocationProvider>
                  <ApprovalWorkflowProvider>
                    <GeofenceProvider>
                      <AttendanceProvider>
                        <LeaveProvider>
                          <SalaryHistoryProvider>
                            <PayrollProvider>
                              <DataManagementProvider>
                                <EnterpriseAppContent />
                              </DataManagementProvider>
                            </PayrollProvider>
                          </SalaryHistoryProvider>
                        </LeaveProvider>
                      </AttendanceProvider>
                    </GeofenceProvider>
                  </ApprovalWorkflowProvider>
                </StaffAllocationProvider>
              </SiteRecordProvider>
            </PRVProvider>
          </EnterpriseProvider>
        </PettyCashProvider>
      </FleetProvider>
    </StaffProvider>
  );
}

