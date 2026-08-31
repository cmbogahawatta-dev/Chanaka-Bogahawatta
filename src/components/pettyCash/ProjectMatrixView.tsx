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
  CheckCircle2
} from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';
import { PettyCashFilterBar } from './PettyCashFilterBar';
import { Project, Expense } from '../../types/pettyCashTypes';

interface ProjectMatrixViewProps {
  onSelectExpenseForDetail: (expense: Expense) => void;
}

export const ProjectMatrixView: React.FC<ProjectMatrixViewProps> = ({ onSelectExpenseForDetail }) => {
  const {
    projects,
    pivotMatrix,
    filteredExpenses,
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

  // Add Project Modal State
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState<boolean>(false);
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

  const handleAddProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectCode.trim() || !newProjectName.trim()) return;

    addProject({
      PROJECT_CODE: newProjectCode.trim().toUpperCase(),
      PROJECT_NAME: newProjectName.trim(),
      CLIENT_NAME: newProjectClient.trim() || 'RDA / Provincial Road Authority',
      BUDGET: parseFloat(newProjectBudget) || 0,
      LOCATION: newProjectLocation.trim() || 'Sri Lanka',
      STATUS: 'Active'
    });

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
                  TOTAL PROJECT EXPENDITURE
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-black text-slate-100 tracking-tight flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-400" />
              <span>Master Projects Directory</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Active road contracts, package codes, and assigned budgets.
            </p>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {projects.map((p) => {
                const spent = pivotMatrix.columnTotals[p.PROJECT_CODE] || 0;
                return (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{p.PROJECT_CODE}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-100">{p.PROJECT_NAME}</td>
                    <td className="py-2.5 px-3 text-slate-300">{p.CLIENT_NAME || 'RDA'}</td>
                    <td className="py-2.5 px-3 text-slate-400">{p.LOCATION || 'Sri Lanka'}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {p.BUDGET ? formatLKR(p.BUDGET) : 'Open'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-100">
                      {formatLKR(spent)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {p.STATUS}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Project Modal */}
      {isAddProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-slate-100">Add New Project Master</h4>
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
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
