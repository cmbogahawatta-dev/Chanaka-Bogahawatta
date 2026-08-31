import React, { useState, useEffect } from 'react';
import { PettyCashHeader } from './PettyCashHeader';
import { PettyCashSidebar } from './PettyCashSidebar';
import { PettyCashDashboardView } from './PettyCashDashboardView';
import { ExpensesListView } from './ExpensesListView';
import { IncomeListView } from './IncomeListView';
import { PettyCashBalancesView } from './PettyCashBalancesView';
import { ProjectMatrixView } from './ProjectMatrixView';
import { MasterSupervisorsView } from './MasterSupervisorsView';
import { MasterCategoriesView } from './MasterCategoriesView';
import { PettyCashReportsView } from './PettyCashReportsView';
import { ProofDocumentsView } from './ProofDocumentsView';
import { GoogleSheetsSettingsView } from './GoogleSheetsSettingsView';
import { AdminDataImportView } from './admin/AdminDataImportView';
import { AdminSecurityModal } from './admin/AdminSecurityModal';
import { AddExpenseModal } from './AddExpenseModal';
import { AddIncomeModal } from './AddIncomeModal';
import { InternalTransferModal } from './InternalTransferModal';
import { ExpenseDetailModal } from './ExpenseDetailModal';
import { BulkImportExpensesModal } from './BulkImportExpensesModal';
import { Expense, PettyCashNavTab } from '../../types/pettyCashTypes';
import { usePettyCash } from '../../context/PettyCashContext';
import { adminSecurityService } from '../../services/adminSecurityService';
import { Menu } from 'lucide-react';

interface PettyCashAppProps {
  currentModule: 'pettyCash' | 'fleetTrack';
  onSwitchModule: (module: 'pettyCash' | 'fleetTrack') => void;
}

export const PettyCashApp: React.FC<PettyCashAppProps> = ({
  currentModule,
  onSwitchModule
}) => {
  const { userRole } = usePettyCash();
  const [activeTab, setActiveTab] = useState<PettyCashNavTab>('dashboard');
  const [previousTab, setPreviousTab] = useState<PettyCashNavTab>('dashboard');
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState<boolean>(false);

  // Admin Security Verification State
  const [isAdminSecurityVerified, setIsAdminSecurityVerified] = useState<boolean>(() => {
    return adminSecurityService.isVerified();
  });
  const [isAdminSecurityModalOpen, setIsAdminSecurityModalOpen] = useState<boolean>(false);

  // Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState<boolean>(false);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState<boolean>(false);
  const [isTransferOpen, setIsTransferOpen] = useState<boolean>(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState<boolean>(false);
  const [selectedExpenseForDetail, setSelectedExpenseForDetail] = useState<Expense | null>(null);
  const [selectedSupervisorForStatement, setSelectedSupervisorForStatement] = useState<string | undefined>(undefined);

  // Intercept navigation to admin-import tab to enforce security verification
  const handleSelectTab = (tab: PettyCashNavTab) => {
    if (tab === 'admin-import') {
      if (userRole !== 'ADMIN') {
        alert('Access Restricted. Data Import & Migration is only available to Administrator accounts.');
        return;
      }

      if (!adminSecurityService.isVerified()) {
        setPreviousTab(activeTab);
        setIsAdminSecurityModalOpen(true);
        return;
      }
    }

    setPreviousTab(activeTab);
    setActiveTab(tab);
  };

  const handleAdminSecurityVerified = () => {
    setIsAdminSecurityVerified(true);
    setIsAdminSecurityModalOpen(false);
    setActiveTab('admin-import');
  };

  const handleAdminSecurityCancel = () => {
    setIsAdminSecurityModalOpen(false);
    if (activeTab === 'admin-import') {
      setActiveTab(previousTab || 'dashboard');
    }
  };

  const handleLockSecuritySession = () => {
    adminSecurityService.clearSession();
    setIsAdminSecurityVerified(false);
    setActiveTab('dashboard');
  };

  const handleOpenSupervisorStatement = (supervisorName: string) => {
    setSelectedSupervisorForStatement(supervisorName);
    setActiveTab('petty-cash');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Universal Top Header */}
      <PettyCashHeader
        currentModule={currentModule}
        onSwitchModule={onSwitchModule}
        onOpenAddExpense={() => setIsAddExpenseOpen(true)}
        onOpenAddIncome={() => setIsAddIncomeOpen(true)}
        onOpenTransfer={() => setIsTransferOpen(true)}
        onOpenSheetsSync={() => setActiveTab('settings')}
        onOpenBulkImport={() => setIsBulkImportOpen(true)}
      />

      {/* Main Body Layout with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-3 sm:px-6 pt-4">
        {/* Mobile menu button */}
        <div className="lg:hidden fixed bottom-5 right-5 z-40">
          <button
            onClick={() => setIsOpenMobileSidebar(true)}
            className="w-12 h-12 rounded-full bg-emerald-600 text-white shadow-xl flex items-center justify-center border border-emerald-400 active:scale-95"
            aria-label="Open Navigation"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Sidebar */}
        <PettyCashSidebar
          activeTab={activeTab}
          setActiveTab={handleSelectTab}
          isOpenMobile={isOpenMobileSidebar}
          onCloseMobile={() => setIsOpenMobileSidebar(false)}
          onOpenAddExpense={() => setIsAddExpenseOpen(true)}
          onOpenAddIncome={() => setIsAddIncomeOpen(true)}
        />

        {/* Main Content View Switcher */}
        <main className="flex-1 lg:pl-6 min-w-0">
          {activeTab === 'dashboard' && (
            <PettyCashDashboardView
              onNavigateTab={(tab) => handleSelectTab(tab)}
              onOpenAddExpense={() => setIsAddExpenseOpen(true)}
              onOpenAddIncome={() => setIsAddIncomeOpen(true)}
              onSelectExpenseForDetail={(exp) => setSelectedExpenseForDetail(exp)}
              onSelectSupervisorForStatement={handleOpenSupervisorStatement}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesListView
              onOpenAddExpense={() => setIsAddExpenseOpen(true)}
              onSelectExpenseForDetail={(exp) => setSelectedExpenseForDetail(exp)}
            />
          )}

          {activeTab === 'income' && (
            <IncomeListView
              onOpenAddIncome={() => setIsAddIncomeOpen(true)}
            />
          )}

          {activeTab === 'petty-cash' && (
            <PettyCashBalancesView
              initialSupervisor={selectedSupervisorForStatement}
              onOpenAddExpense={() => setIsAddExpenseOpen(true)}
              onOpenAddIncome={() => setIsAddIncomeOpen(true)}
              onOpenTransfer={() => setIsTransferOpen(true)}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectMatrixView
              onSelectExpenseForDetail={(exp) => setSelectedExpenseForDetail(exp)}
            />
          )}

          {activeTab === 'supervisors' && <MasterSupervisorsView />}

          {activeTab === 'categories' && <MasterCategoriesView />}

          {activeTab === 'reports' && <PettyCashReportsView />}

          {activeTab === 'documents' && (
            <ProofDocumentsView
              onSelectExpenseForDetail={(exp) => setSelectedExpenseForDetail(exp)}
            />
          )}

          {activeTab === 'admin-import' && userRole === 'ADMIN' && (
            <AdminDataImportView
              onNavigateTab={(tab) => handleSelectTab(tab)}
              onLockSecuritySession={handleLockSecuritySession}
            />
          )}

          {activeTab === 'settings' && <GoogleSheetsSettingsView />}
        </main>
      </div>

      {/* Admin Security Verification Modal */}
      <AdminSecurityModal
        isOpen={isAdminSecurityModalOpen}
        onClose={handleAdminSecurityCancel}
        onVerified={handleAdminSecurityVerified}
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
        isOpen={Boolean(selectedExpenseForDetail)}
        onClose={() => setSelectedExpenseForDetail(null)}
      />

      <BulkImportExpensesModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />
    </div>
  );
};
