import React, { useState } from 'react';
import {
  FolderKanban,
  Building,
  Download,
  PlusCircle,
  Search,
  Filter,
  DollarSign,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';
import { PettyCashFilterBar } from './PettyCashFilterBar';
import { Project, Expense } from '../../types/pettyCashTypes';
import { BulkImportProjectsModal } from './BulkImportProjectsModal';

interface ProjectMatrixViewProps {
  onSelectExpenseForDetail: (expense: Expense) => void;
}

export const ProjectMatrixView: React.FC<ProjectMatrixViewProps> = ({ onSelectExpenseForDetail }) => {
  const {
    projects,
    pivotMatrix,
    filteredExpenses,
    projectBudgetSummaries,
    budgetAlerts,
    exportToCsv,
    addProject,
    updateProject,
    deleteProject,
    userRole
  } = usePettyCash();

  // Cell drilldown state
  const [selectedCell, setSelectedCell] = useState<{
    categoryName: string;
    projectCode: string;
    amount: number;
  } | null>(null);

  // Bulk Import Project Modal State
  const [isBulkImportOpen, setIsBulkImportOpen] = useState<boolean>(false);

  // Add / Edit Project Modal State
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState<boolean>(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newProjectCode, setNewProjectCode] = useState<string>('');
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectClient, setNewProjectClient] = useState<string>('');
  const [newProjectBudget, setNewProjectBudget] = useState<string>('');
  const [newProjectLocation, setNewProjectLocation] = useState<string>('');

  const formatLKR = (amount: number): string => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount).replace('LKR', 'LKR ');
  };

  const handleOpenAddProject = () => {
    setEditingProjectId(null);
    setNewProjectCode('');
    setNewProjectName('');
    setNewProjectClient('');
    setNewProjectBudget('');
    setNewProjectLocation('');
    setIsAddProjectModalOpen(true);
  };

  const handleOpenEditProject = (p: Project) => {
    setEditingProjectId(p.id);
    setNewProjectCode(p.PROJECT_CODE);
    setNewProjectName(p.PROJECT_NAME);
    setNewProjectClient(p.CLIENT_NAME || p.CLIENT || '');
    setNewProjectBudget(p.BUDGET?.toString() || p.budget?.toString() || '');
    setNewProjectLocation(p.LOCATION || '');
    setIsAddProjectModalOpen(true);
  };

  const handleDeleteProjectEntry = (p: Project) => {
    if (window.confirm(`Are you sure you want to permanently delete Project "${p.PROJECT_CODE} - ${p.PROJECT_NAME}"?\n\nThis action will remove it from the directory.`)) {
      deleteProject(p.id);
    }
  };

  const handleAddProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectCode.trim() || !newProjectName.trim()) return;

    if (editingProjectId) {
      updateProject(editingProjectId, {
        PROJECT_CODE: newProjectCode.trim().toUpperCase(),
        PROJECT_NAME: newProjectName.trim(),
        CLIENT_NAME: newProjectClient.trim() || 'RDA / Provincial Road Authority',
        CLIENT: newProjectClient.trim() || 'RDA / Provincial Road Authority',
        BUDGET: parseFloat(newProjectBudget) || 0,
        budget: parseFloat(newProjectBudget) || 0,
        LOCATION: newProjectLocation.trim() || 'Sri Lanka',
      });
    } else {
      addProject({
        PROJECT_CODE: newProjectCode.trim().toUpperCase(),
        PROJECT_NAME: newProjectName.trim(),
        CLIENT_NAME: newProjectClient.trim() || 'RDA / Provincial Road Authority',
        CLIENT: newProjectClient.trim() || 'RDA / Provincial Road Authority',
        BUDGET: parseFloat(newProjectBudget) || 0,
        budget: parseFloat(newProjectBudget) || 0,
        LOCATION: newProjectLocation.trim() || 'Sri Lanka',
        STATUS: 'Active'
      });
    }

    setEditingProjectId(null);
    setNewProjectCode('');
    setNewProjectName('');
    setNewProjectClient('');
    setNewProjectBudget('');
    setNewProjectLocation('');
    setIsAddProjectModalOpen(false);
  };

  // Get matching expenses for clicked pivot cell
  const cellExpenses = selectedCell
    ? filteredExpenses.filter(
        e =>
          e.EXPENSES_CATEGORY === selectedCell.categoryName &&
          e.PROJECT === selectedCell.projectCode &&
          (e.PAYMENT_STATUS === 'Approved' || e.PAYMENT_STATUS === 'Paid' || e.PAYMENT_STATUS === 'Reimbursed')
      )
    : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-emerald-400" />
            <span>Project-wise Category Pivot Matrix</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time project cost accounting breakdown. Click any amount to view itemized vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-bulk-import-projects"
            onClick={() => setIsBulkImportOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold shadow-md transition-all active:scale-95"
            title="Bulk import projects from Excel/CSV with Admin PIN authorization"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Bulk Import</span>
          </button>

          <button
            id="btn-export-full-pivot-csv"
            onClick={() => exportToCsv('pivot')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Matrix (CSV)</span>
          </button>

          {(userRole === 'ADMIN' || userRole === 'FINANCE') && (
            <button
              onClick={() => setIsAddProjectModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Project Master</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Filters */}
      <PettyCashFilterBar />

      {/* Pivot Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Consolidated Expense Pivot Table (Approved & Paid Costs)
          </span>
          <span className="text-xs font-mono font-bold text-emerald-400">
            Grand Total: {formatLKR(pivotMatrix.grandTotal)}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800 text-slate-200 border-b border-slate-700">
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider sticky left-0 bg-slate-800 z-10 min-w-[240px]">
                  Accounting Category
                </th>
                <th className="py-3 px-3 font-semibold text-slate-400 min-w-[100px]">Cost Group</th>
                {pivotMatrix.projects.map((p) => (
                  <th key={p.id} className="py-3 px-3 font-bold uppercase tracking-wider text-right min-w-[130px]">
                    <div className="truncate" title={p.PROJECT_NAME}>
                      {p.PROJECT_CODE}
                    </div>
                  </th>
                ))}
                <th className="py-3 px-3.5 font-black uppercase tracking-wider text-right bg-emerald-950/80 text-emerald-300 min-w-[150px]">
                  Total Spent
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {pivotMatrix.rows.map((row) => (
                <tr key={row.categoryId} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-2.5 px-3.5 font-sans font-semibold text-slate-200 sticky left-0 bg-slate-950/90 hover:bg-slate-800/90 border-r border-slate-800">
                    <div className="truncate max-w-[240px]" title={row.categoryName}>
                      {row.categoryName}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px] truncate max-w-[110px]">
                    {row.categoryGroup}
                  </td>
                  {pivotMatrix.projects.map((p) => {
                    const val = row.projectTotals[p.PROJECT_CODE] || 0;
                    return (
                      <td
                        key={p.id}
                        onClick={() => {
                          if (val > 0) {
                            setSelectedCell({
                              categoryName: row.categoryName,
                              projectCode: p.PROJECT_CODE,
                              amount: val
                            });
                          }
                        }}
                        className={`py-2.5 px-3 text-right ${
                          val > 0
                            ? 'text-slate-100 font-medium hover:bg-emerald-950/60 hover:text-emerald-300 cursor-pointer underline decoration-dotted underline-offset-2'
                            : 'text-slate-600'
                        }`}
                      >
                        {val > 0 ? val.toLocaleString('en-LK', { minimumFractionDigits: 2 }) : '-'}
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3.5 text-right font-bold bg-emerald-950/30 text-emerald-300">
                    {row.rowTotal > 0 ? row.rowTotal.toLocaleString('en-LK', { minimumFractionDigits: 2 }) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800 text-slate-100 font-bold border-t-2 border-slate-700">
                <td colSpan={2} className="py-3 px-3.5 sticky left-0 bg-slate-800 font-sans uppercase tracking-wider text-xs">
                  TOTAL APPROVED SPEND
                </td>
                {pivotMatrix.projects.map((p) => {
                  const colTotal = pivotMatrix.columnTotals[p.PROJECT_CODE] || 0;
                  return (
                    <td key={p.id} className="py-3 px-3 text-right font-black text-xs text-slate-100">
                      {colTotal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </td>
                  );
                })}
                <td className="py-3 px-3.5 text-right font-black text-sm bg-emerald-900/80 text-emerald-200">
                  {formatLKR(pivotMatrix.grandTotal)}
                </td>
              </tr>

              {/* Allocated Petty Cash Budget Row */}
              <tr className="bg-slate-900/90 text-slate-300 font-medium border-t border-slate-800">
                <td colSpan={2} className="py-2.5 px-3.5 sticky left-0 bg-slate-900 font-sans uppercase tracking-wider text-[11px] text-slate-400">
                  ALLOCATED PETTY CASH BUDGET
                </td>
                {pivotMatrix.projects.map((p) => {
                  const budget = Number(p.BUDGET_PETTY_CASH ?? p.BUDGET ?? 0);
                  return (
                    <td key={p.id} className="py-2.5 px-3 text-right font-mono text-xs text-slate-300">
                      {budget > 0 ? budget.toLocaleString('en-LK', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                  );
                })}
                <td className="py-2.5 px-3.5 text-right font-mono text-xs font-bold text-slate-200 bg-slate-900">
                  {formatLKR(pivotMatrix.projects.reduce((sum, p) => sum + Number(p.BUDGET_PETTY_CASH ?? p.BUDGET ?? 0), 0))}
                </td>
              </tr>

              {/* Budget Threshold Utilization Row */}
              <tr className="bg-slate-950 text-slate-100 font-bold border-t border-slate-800">
                <td colSpan={2} className="py-2.5 px-3.5 sticky left-0 bg-slate-950 font-sans uppercase tracking-wider text-[11px] text-slate-400">
                  BUDGET UTILIZATION & ALERT
                </td>
                {pivotMatrix.projects.map((p) => {
                  const budget = Number(p.BUDGET_PETTY_CASH ?? p.BUDGET ?? 0);
                  const spent = pivotMatrix.columnTotals[p.PROJECT_CODE] || 0;
                  const pct = budget > 0 ? (spent / budget) * 100 : 0;

                  const isExceeded = pct >= 100;
                  const is95 = pct >= 95 && pct < 100;
                  const is80 = pct >= 80 && pct < 95;

                  return (
                    <td key={p.id} className="py-2.5 px-3 text-right font-mono text-xs">
                      {budget > 0 ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                              isExceeded
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : is95
                                ? 'bg-orange-950 text-orange-300 border border-orange-800'
                                : is80
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {pct.toFixed(1)}% {isExceeded ? '⛔' : is95 ? '🚨 95%' : is80 ? '⚠️ 80%' : '✓'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal">N/A</span>
                      )}
                    </td>
                  );
                })}
                <td className="py-2.5 px-3.5 text-right font-mono text-xs font-black text-emerald-300 bg-slate-950">
                  {(() => {
                    const totalB = pivotMatrix.projects.reduce((sum, p) => sum + Number(p.BUDGET_PETTY_CASH ?? p.BUDGET ?? 0), 0);
                    return totalB > 0 ? `${((pivotMatrix.grandTotal / totalB) * 100).toFixed(1)}% Overall` : '-';
                  })()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Cell Drilldown Transaction Vouchers Drawer/Modal */}
      {selectedCell && (
        <div className="bg-slate-900 border border-emerald-800/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {selectedCell.projectCode}
                </span>
                <h4 className="text-sm font-bold text-slate-100">{selectedCell.categoryName}</h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Itemized vouchers total: <span className="font-bold text-emerald-400 font-mono">{formatLKR(selectedCell.amount)}</span> ({cellExpenses.length} transactions)
              </p>
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-xs font-semibold px-3 py-1 rounded bg-slate-800 text-slate-300 hover:text-white"
            >
              Close Drilldown
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-300">
                <tr>
                  <th className="py-2.5 px-3">Expense ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Supervisor</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Amount (LKR)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {cellExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-200">{exp.EXPENSES_ID}</td>
                    <td className="py-2.5 px-3 text-slate-300">{exp.DATE}</td>
                    <td className="py-2.5 px-3 text-slate-100 font-semibold">{exp.SUPERVISOR}</td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">{exp.EXPENSES_DESCRIPTION}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">{formatLKR(exp.AMOUNT)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {exp.PAYMENT_STATUS}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onSelectExpenseForDetail(exp)}
                        className="text-xs text-emerald-400 hover:underline font-semibold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MASTER PROJECTS TABLE (Master Data Management) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-black text-slate-100 tracking-tight flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-400" />
              <span>Master Projects Directory</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Active road contracts, package codes, and assigned budgets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-projects-section-bulk-import"
              onClick={() => setIsBulkImportOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold shadow-md transition-all active:scale-95"
              title="Bulk import projects from Excel/CSV with Admin PIN authorization"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Bulk Import Projects</span>
            </button>

            {(userRole === 'ADMIN' || userRole === 'FINANCE') && (
              <button
                onClick={handleOpenAddProject}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Project</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800 text-slate-300 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Project Code</th>
                <th className="py-2.5 px-3">Project Name</th>
                <th className="py-2.5 px-3">Client / Authority</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3 text-right">Budget (LKR)</th>
                <th className="py-2.5 px-3 text-right">Actual Spent</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Building className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="font-semibold text-slate-400 text-sm">Project Directory is Empty</p>
                    <p className="text-[11px] text-slate-600 mt-1 mb-4">Click "Add Project" to register projects manually, or import bulk records from Excel / CSV.</p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setIsBulkImportOpen(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Bulk Import Projects
                      </button>
                      <button
                        onClick={handleOpenAddProject}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Add Single Project
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                projects.map((p) => {
                  const spent = pivotMatrix.columnTotals[p.PROJECT_CODE] || 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{p.PROJECT_CODE}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-100">{p.PROJECT_NAME}</td>
                      <td className="py-2.5 px-3 text-slate-300">{p.CLIENT_NAME || p.CLIENT || 'RDA'}</td>
                      <td className="py-2.5 px-3 text-slate-400">{p.LOCATION || 'Sri Lanka'}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {p.BUDGET || p.budget ? formatLKR(p.BUDGET || p.budget || 0) : 'Open'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-100">
                        {formatLKR(spent)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {p.STATUS}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditProject(p)}
                            title="Edit Project Details"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-purple-300 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProjectEntry(p)}
                            title="Delete Project Entry"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Project Modal */}
      {isAddProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-slate-100">
              {editingProjectId ? 'Edit Project Details' : 'Add New Project Master'}
            </h4>
            <form onSubmit={handleAddProjectSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Project Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PIDM 30"
                  value={newProjectCode}
                  onChange={(e) => setNewProjectCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kurunegala - Dambulla Highway Rehabilitation"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Client Name</label>
                <input
                  type="text"
                  placeholder="e.g. Road Development Authority (RDA)"
                  value={newProjectClient}
                  onChange={(e) => setNewProjectClient(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Budget in LKR</label>
                <input
                  type="number"
                  placeholder="e.g. 5000000.00"
                  value={newProjectBudget}
                  onChange={(e) => setNewProjectBudget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddProjectModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  {editingProjectId ? 'Update Project' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Projects Modal */}
      <BulkImportProjectsModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />
    </div>
  );
};
