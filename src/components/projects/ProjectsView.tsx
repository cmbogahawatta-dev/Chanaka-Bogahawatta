import React, { useState, useMemo } from 'react';
import {
  FolderKanban,
  Building2,
  DollarSign,
  TrendingUp,
  Truck,
  Fuel,
  Wrench,
  Users,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  PieChart as PieChartIcon,
  Layers,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  FolderPlus,
  Edit2,
  Trash2,
  LayoutGrid,
  List
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { usePettyCash } from '../../context/PettyCashContext';
import { useFleet } from '../../context/FleetContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { Project } from '../../types/pettyCashTypes';
import { ProjectModal } from './ProjectModal';
import { AdminClearHistoryButton } from '../common/AdminClearHistoryButton';
import { UniversalBulkImportModal } from '../common/UniversalBulkImportModal';
import { UniversalDeleteModal } from '../common/UniversalDeleteModal';

export const ProjectsView: React.FC = () => {
  const { projects, expenses, income, userRole, addProject, deleteProject, clearProjectsHistory } = usePettyCash();
  const { vehicles, fuelRecords, maintenanceLogs } = useFleet();
  const { procurementOrders, paymentVouchers, navigateToModule, currentRole } = useEnterprise();

  const isAdmin = userRole === 'ADMIN' || currentRole === 'ADMIN';

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedProjectCode, setSelectedProjectCode] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState<boolean>(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const handleOpenAddProject = () => {
    setProjectToEdit(null);
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (proj: Project) => {
    setProjectToEdit(proj);
    setIsProjectModalOpen(true);
  };

  const handleDeleteProject = (proj: Project) => {
    setProjectToDelete(proj);
  };

  const formatLKR = (amt: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0
    }).format(amt);
  };

  // Calculate project cost breakdowns dynamically
  const projectSummaries = useMemo(() => {
    return projects.map(proj => {
      // 1. Direct Petty Cash Expenses
      const projExpenses = expenses.filter(
        e => (e.PROJECT === proj.PROJECT_CODE || e.PROJECT === proj.PROJECT_NAME) &&
             e.PAYMENT_STATUS !== 'Rejected' && e.PAYMENT_STATUS !== 'Draft'
      );
      const pettyCashSpent = projExpenses.reduce((acc, curr) => acc + (curr.AMOUNT || 0), 0);

      // 2. Direct Fuel from Fleet
      const projFuel = fuelRecords.filter(f => f.siteOrProject === proj.PROJECT_CODE || f.siteOrProject === proj.PROJECT_NAME);
      const fuelSpent = projFuel.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

      // 3. Maintenance on vehicles assigned to project
      const projVehicles = vehicles.filter(v => v.currentSite === proj.PROJECT_CODE || v.currentSite === proj.PROJECT_NAME);
      const projVehicleIds = projVehicles.map(v => v.id);
      const projMaintenance = maintenanceLogs.filter(m => projVehicleIds.includes(m.vehicleId));
      const maintenanceSpent = projMaintenance.reduce((acc, curr) => acc + (curr.cost || 0), 0);

      // 4. Procurement Orders
      const projProcurement = procurementOrders.filter(p => p.PROJECT_CODE === proj.PROJECT_CODE && p.STATUS !== 'Cancelled');
      const procurementSpent = projProcurement.reduce((acc, curr) => acc + (curr.TOTAL_AMOUNT || 0), 0);

      // 5. Payment Vouchers
      const projPayments = paymentVouchers.filter(p => p.PROJECT_CODE === proj.PROJECT_CODE && p.STATUS !== 'Rejected');
      const paymentsSpent = projPayments.reduce((acc, curr) => acc + (curr.AMOUNT || 0), 0);

      const totalActualCost = pettyCashSpent + fuelSpent + maintenanceSpent + procurementSpent + paymentsSpent;
      const budget = proj.CONTRACT_VALUE || 15000000;
      const pettyCashBudget = proj.BUDGET_PETTY_CASH || 2500000;
      const percentUsed = budget > 0 ? (totalActualCost / budget) * 100 : 0;

      return {
        ...proj,
        pettyCashSpent,
        fuelSpent,
        maintenanceSpent,
        procurementSpent,
        paymentsSpent,
        totalActualCost,
        budget,
        pettyCashBudget,
        percentUsed,
        vehicleCount: projVehicles.length,
        expenseCount: projExpenses.length
      };
    });
  }, [projects, expenses, fuelRecords, vehicles, maintenanceLogs, procurementOrders, paymentVouchers]);

  const filteredProjects = useMemo(() => {
    return projectSummaries.filter(p => {
      const matchSearch = searchTerm === '' ||
        p.PROJECT_CODE.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.PROJECT_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.CLIENT.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.LOCATION.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchSelect = selectedProjectCode === 'ALL' || p.PROJECT_CODE === selectedProjectCode;

      return matchSearch && matchSelect;
    });
  }, [projectSummaries, searchTerm, selectedProjectCode]);

  // Overall Totals
  const totalContractValue = useMemo(() => projectSummaries.reduce((a, c) => a + c.budget, 0), [projectSummaries]);
  const totalActualExpenditure = useMemo(() => projectSummaries.reduce((a, c) => a + c.totalActualCost, 0), [projectSummaries]);
  const totalPettyCashAllocated = useMemo(() => projectSummaries.reduce((a, c) => a + c.pettyCashSpent, 0), [projectSummaries]);

  // Data for Chart
  const chartData = useMemo(() => {
    return projectSummaries.map(p => ({
      name: p.PROJECT_CODE,
      PettyCash: p.pettyCashSpent,
      Fuel: p.fuelSpent,
      Procurement: p.procurementSpent,
      Payments: p.paymentsSpent
    }));
  }, [projectSummaries]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 backdrop-blur p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-950 text-purple-400 border border-purple-800 flex items-center justify-center font-bold">
              <FolderKanban className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Projects & Construction Cost Tracking</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time project cost accounting integrating Petty Cash, Fleet Fuel, Machinery Maintenance, and Site Procurement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <AdminClearHistoryButton
              id="btn-admin-clear-projects"
              moduleName="Projects & Construction Registry"
              itemCount={projects.length}
              itemDescription="registered road packages, construction projects, and cost budgets"
              preservedItemsDescription="Underlying transaction history in Petty Cash, Fuel, Maintenance, and Procurement will remain intact."
              onClear={() => clearProjectsHistory()}
            />
          )}

          {isAdmin && (
            <button
              onClick={() => setIsBulkImportOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-950 text-indigo-300 hover:text-indigo-200 border border-indigo-800/80 text-xs font-semibold shadow-sm transition-all"
              title="Bulk Import Projects from Excel/CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              <span>Bulk Import</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={handleOpenAddProject}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/25 transition-all"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Add Project</span>
            </button>
          )}

          <button
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8," + 
                "Project Code,Project Name,Client,Location,Contract Value,Petty Cash,Fuel,Procurement,Total Actual,Status\n" +
                projectSummaries.map(p => `"${p.PROJECT_CODE}","${p.PROJECT_NAME}","${p.CLIENT}","${p.LOCATION}",${p.budget},${p.pettyCashSpent},${p.fuelSpent},${p.procurementSpent},${p.totalActualCost},"${p.STATUS}"`).join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `EMA_Projects_Cost_${new Date().toISOString().slice(0, 10)}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Cost Sheet</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Contract Value</span>
          <div className="text-xl font-mono font-bold text-slate-100 mt-1">{formatLKR(totalContractValue)}</div>
          <span className="text-[10px] text-emerald-400 font-medium">Across {projects.length} Construction Packages</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Committed Cost</span>
          <div className="text-xl font-mono font-bold text-purple-400 mt-1">{formatLKR(totalActualExpenditure)}</div>
          <span className="text-[10px] text-slate-400 font-medium">
            {((totalActualExpenditure / (totalContractValue || 1)) * 100).toFixed(1)}% of total portfolio
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Site Petty Cash Spent</span>
          <div className="text-xl font-mono font-bold text-emerald-400 mt-1">{formatLKR(totalPettyCashAllocated)}</div>
          <span className="text-[10px] text-emerald-300 font-medium">Live from field supervisor vouchers</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Site Fleet</span>
          <div className="text-xl font-mono font-bold text-blue-400 mt-1">{vehicles.length} Vehicles</div>
          <span className="text-[10px] text-blue-300 font-medium">Allocated to RDA & provincial packages</span>
        </div>
      </div>

      {/* 3. Cost Distribution Chart */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <span>Project-Wise Expenditure by Cost Component (LKR)</span>
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                formatter={(val: number) => [formatLKR(val), '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="PettyCash" name="Petty Cash" fill="#10b981" stackId="a" />
              <Bar dataKey="Fuel" name="Vehicle Fuel" fill="#3b82f6" stackId="a" />
              <Bar dataKey="Procurement" name="Materials / PO" fill="#a855f7" stackId="a" />
              <Bar dataKey="Payments" name="Disbursals" fill="#f43f5e" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Filters, Search Bar & View Mode */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Search project, code, client, or site..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedProjectCode}
            onChange={(e) => setSelectedProjectCode(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Active Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.PROJECT_CODE}>{p.PROJECT_CODE} - {p.PROJECT_NAME}</option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('cards')}
              title="Cards View"
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'cards'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Directory Table View"
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'table'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Projects Detailed Views (Cards vs Table) */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
          <FolderKanban className="w-12 h-12 mx-auto text-slate-600" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-300">No Projects Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {projects.length === 0
                ? 'Projects and construction packages registry is empty. Click "Add Project" to register a new road or construction package, or restore default data from Administration.'
                : 'No projects match your current search or filter query.'}
            </p>
          </div>
          {projects.length === 0 && (
            <button
              onClick={handleOpenAddProject}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Add First Project</span>
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Directory Table View with Individual Delete */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-300 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="py-3 px-3.5">Project Code</th>
                  <th className="py-3 px-3">Project Name & Scope</th>
                  <th className="py-3 px-3">Client / Authority</th>
                  <th className="py-3 px-3">Location & Engineer</th>
                  <th className="py-3 px-3 text-right">Allocated Budget</th>
                  <th className="py-3 px-3 text-right">Total Incurred</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredProjects.map((proj) => (
                  <tr key={proj.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3.5 font-mono font-bold text-purple-300">
                      <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800/60 text-purple-300">
                        {proj.PROJECT_CODE}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-100 max-w-xs">
                      <div>{proj.PROJECT_NAME}</div>
                      {proj.REMARKS && (
                        <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">{proj.REMARKS}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-300">{proj.CLIENT || 'RDA'}</td>
                    <td className="py-3 px-3 text-slate-300">
                      <div>{proj.LOCATION || 'Sri Lanka'}</div>
                      <div className="text-[10px] text-slate-400 font-normal">PM: {proj.PROJECT_MANAGER || '-'}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      {formatLKR(proj.budget)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">
                      <div>{formatLKR(proj.totalActualCost)}</div>
                      <div className={`text-[10px] ${proj.percentUsed > 90 ? 'text-rose-400 font-bold' : 'text-purple-400'}`}>
                        {proj.percentUsed.toFixed(1)}% Used
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        proj.STATUS === 'Active' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {proj.STATUS}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditProject(proj)}
                          title="Edit Project Details"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-purple-300 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(proj)}
                          title="Delete Project Entry"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards Grid View with Individual Delete */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map(proj => (
            <div
              key={proj.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-sm"
            >
              {/* Title & Status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-purple-950 text-purple-300 border border-purple-800 text-xs font-mono font-bold">
                      {proj.PROJECT_CODE}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      proj.STATUS === 'Active' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {proj.STATUS}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-100 text-sm mt-1">{proj.PROJECT_NAME}</h3>
                  <p className="text-[11px] text-slate-400">{proj.CLIENT} • {proj.LOCATION}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Budget Allocated</span>
                  <span className="font-mono font-bold text-slate-100 text-sm">{formatLKR(proj.budget)}</span>
                </div>
              </div>

              {/* Budget Utilization Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-medium">
                  <span className="text-slate-400">Total Actual Incurred: <strong className="text-slate-200">{formatLKR(proj.totalActualCost)}</strong></span>
                  <span className={proj.percentUsed > 90 ? 'text-rose-400 font-bold' : 'text-purple-400 font-bold'}>
                    {proj.percentUsed.toFixed(1)}% Used
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      proj.percentUsed > 90 ? 'bg-rose-500' : proj.percentUsed > 75 ? 'bg-amber-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${Math.min(proj.percentUsed, 100)}%` }}
                  />
                </div>
              </div>

              {/* Integrated Cost Components Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-emerald-400 font-bold block">Petty Cash</span>
                  <span className="font-mono text-slate-200 font-semibold">{formatLKR(proj.pettyCashSpent)}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-blue-400 font-bold block">Fleet Fuel</span>
                  <span className="font-mono text-slate-200 font-semibold">{formatLKR(proj.fuelSpent)}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-purple-400 font-bold block">Procurement</span>
                  <span className="font-mono text-slate-200 font-semibold">{formatLKR(proj.procurementSpent)}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-rose-400 font-bold block">Payments</span>
                  <span className="font-mono text-slate-200 font-semibold">{formatLKR(proj.paymentsSpent)}</span>
                </div>
              </div>

              {/* Site Manager & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Engineer: <strong className="text-slate-300">{proj.PROJECT_MANAGER}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditProject(proj)}
                    title="Edit Project Details"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-purple-300 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(proj)}
                    title="Delete Project Entry"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => navigateToModule('petty-cash', 'expenses')}
                    className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-semibold text-xs transition-all ml-1"
                  >
                    <span>View Vouchers</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Modal for Add / Edit */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setProjectToEdit(null);
        }}
        projectToEdit={projectToEdit}
      />

      {/* Universal Authorized Delete Modal */}
      {projectToDelete && (
        <UniversalDeleteModal
          isOpen={!!projectToDelete}
          onClose={() => setProjectToDelete(null)}
          module="PROJECTS"
          recordId={projectToDelete.id}
          recordCode={projectToDelete.PROJECT_CODE}
          recordName={projectToDelete.PROJECT_NAME}
          additionalDetails={`Client: ${projectToDelete.CLIENT || '—'} • Location: ${projectToDelete.LOCATION || '—'}`}
          onDelete={async () => {
            deleteProject(projectToDelete.id);
            setProjectToDelete(null);
          }}
          onDeactivate={async () => {
            setProjectToDelete(null);
          }}
        />
      )}

      {/* Universal Bulk Import Modal */}
      {isBulkImportOpen && (
        <UniversalBulkImportModal
          isOpen={isBulkImportOpen}
          onClose={() => setIsBulkImportOpen(false)}
          importType="PROJECTS"
          onImportComplete={(importedRows) => {
            let count = 0;
            importedRows.forEach((row: any) => {
              addProject({
                PROJECT_CODE: row.PROJECT_CODE || `PRJ-${Date.now().toString().slice(-4)}`,
                PROJECT_NAME: row.PROJECT_NAME || 'Imported Construction Package',
                CLIENT: row.CLIENT || 'RDA / Provincial Highway',
                LOCATION: row.LOCATION || 'Sri Lanka',
                BUDGET: Number(row.BUDGET) || 0,
                CONTRACT_VALUE: Number(row.CONTRACT_VALUE || row.BUDGET) || 0,
                START_DATE: row.START_DATE || new Date().toISOString().slice(0, 10),
                END_DATE: row.END_DATE || '',
                STATUS: (row.STATUS as any) || 'In Progress',
                DESCRIPTION: row.DESCRIPTION || 'Bulk imported project'
              });
              count++;
            });
            return {
              count,
              batchId: `BATCH-PROJ-${Date.now().toString().slice(-6)}`
            };
          }}
        />
      )}
    </div>
  );
};
