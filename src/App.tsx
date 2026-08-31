import React, { useState } from 'react';
import { FleetProvider } from './context/FleetContext';
import { PettyCashProvider } from './context/PettyCashContext';
import { EnterpriseProvider, useEnterprise } from './context/EnterpriseContext';
import { PRVProvider } from './context/PRVContext';
import { SiteRecordProvider } from './context/SiteRecordContext';
import { StaffProvider } from './context/StaffContext';

// Enterprise Header & Components
import { EnterpriseHeader } from './components/enterprise/EnterpriseHeader';
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

// Icons for secondary sub-navigation
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
  PlusCircle,
  ArrowRightLeft,
  DollarSign,
  Fuel,
  Wrench,
  Navigation,
  FileSpreadsheet,
  Users,
  Grid
} from 'lucide-react';

const EnterpriseAppContent: React.FC = () => {
  const { currentModule, setCurrentModule, activeSubTab, setActiveSubTab, navigateToModule } = useEnterprise();

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* PWA Mobile Banner */}
      <PWAInstallBanner onOpenPublishModal={(tab) => { setPublishTab(tab); setShowPublishModal(true); }} />

      {/* Unified Enterprise Header */}
      <EnterpriseHeader
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
        onOpenAddDocument={() => navigateToModule('documents')}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-4 pb-12">
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
          <div className="space-y-4">
            {/* Petty Cash Sub-Nav Ribbon */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-slate-900/70 p-1.5 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setPettyCashTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  pettyCashTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cashier Dashboard
              </button>
              <button
                onClick={() => setPettyCashTab('expenses')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  pettyCashTab === 'expenses' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Expense Vouchers
              </button>
              <button
                onClick={() => setPettyCashTab('income')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  pettyCashTab === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Income / Top-ups
              </button>
              <button
                onClick={() => setPettyCashTab('petty-cash')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  pettyCashTab === 'petty-cash' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Supervisor Balances
              </button>
              <button
                onClick={() => setPettyCashTab('projects')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  pettyCashTab === 'projects' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Project Expense Matrix
              </button>
              <button
                onClick={() => setPettyCashTab('supervisors')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  pettyCashTab === 'supervisors' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Supervisors Directory
              </button>
              <button
                onClick={() => setPettyCashTab('categories')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  pettyCashTab === 'categories' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                GL Categories
              </button>
              <button
                onClick={() => setPettyCashTab('reports')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  pettyCashTab === 'reports' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Financial Reports
              </button>
              <button
                onClick={() => setPettyCashTab('documents')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  pettyCashTab === 'documents' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Proof Receipts
              </button>
              <button
                onClick={() => setPettyCashTab('settings')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  pettyCashTab === 'settings' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Google Sheets
              </button>
            </div>

            {/* Petty Cash Tab Content */}
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
          <div className="space-y-4">
            {/* FleetTrack Sub-Nav Ribbon */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-slate-900/70 p-1.5 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setFleetTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  fleetTab === 'dashboard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Fleet Dashboard
              </button>
              <button
                onClick={() => setFleetTab('vehicles')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  fleetTab === 'vehicles' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Vehicles Registry
              </button>
              <button
                onClick={() => setFleetTab('drivers')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  fleetTab === 'drivers' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Drivers
              </button>
              <button
                onClick={() => setFleetTab('runningChart')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  fleetTab === 'runningChart' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Running Charts
              </button>
              <button
                onClick={() => setFleetTab('fuel')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  fleetTab === 'fuel' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Fuel Logs
              </button>
              <button
                onClick={() => setFleetTab('maintenance')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  fleetTab === 'maintenance' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Maintenance & Services
              </button>
              <button
                onClick={() => setFleetTab('transfers')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  fleetTab === 'transfers' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Site Transfers
              </button>
              <button
                onClick={() => setFleetTab('gps')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  fleetTab === 'gps' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Live GPS Map
              </button>
              <button
                onClick={() => setFleetTab('analytics')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  fleetTab === 'analytics' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Fleet Analytics
              </button>
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

        {/* MODULE 6: PAYMENTS & DISBURSALS */}
        {currentModule === 'payments' && <PaymentsView />}

        {/* MODULE 7: CONSOLIDATED REPORTS */}
        {currentModule === 'reports' && <EnterpriseReportsView />}

        {/* MODULE 8: UNIVERSAL DOCUMENTS */}
        {currentModule === 'documents' && <DocumentsView />}

        {/* MODULE 9: ADMINISTRATION & MASTER DATA */}
        {currentModule === 'admin' && <AdministrationView />}
      </main>

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
    <FleetProvider>
      <PettyCashProvider>
        <EnterpriseProvider>
          <PRVProvider>
            <SiteRecordProvider>
              <StaffProvider>
                <EnterpriseAppContent />
              </StaffProvider>
            </SiteRecordProvider>
          </PRVProvider>
        </EnterpriseProvider>
      </PettyCashProvider>
    </FleetProvider>
  );
}
