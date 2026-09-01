import React, { useState } from 'react';
import {
  Building2,
  Download,
  Printer,
  FileSpreadsheet,
  PieChart,
  Users,
  DollarSign,
  TrendingUp,
  FolderKanban
} from 'lucide-react';
import { usePayroll } from '../../context/PayrollContext';
import { ProjectLabourCostReport } from '../../types/payrollTypes';

export const LabourCostReportView: React.FC = () => {
  const { activeMonth, setActiveMonth, getLabourCostReport } = usePayroll();
  const [selectedMonth, setSelectedMonth] = useState(activeMonth);

  const reports = getLabourCostReport(selectedMonth);

  const totalLabourCostAllProjects = reports.reduce((sum, r) => sum + r.totalLabourCost, 0);
  const totalHeadcountAllProjects = reports.reduce((sum, r) => sum + r.headcount, 0);
  const totalGrossWagesAll = reports.reduce((sum, r) => sum + r.totalGrossWage, 0);
  const totalEmployerEpfAll = reports.reduce((sum, r) => sum + r.totalEmployerEpf, 0);
  const totalEmployerEtfAll = reports.reduce((sum, r) => sum + r.totalEmployerEtf, 0);

  const handleExportCsv = () => {
    let csv = 'Project Code,Project Name,Payroll Month,Headcount,Gross Wages (LKR),Employer EPF 12% (LKR),Employer ETF 3% (LKR),Total Loaded Labour Cost (LKR)\n';
    reports.forEach(r => {
      csv += `"${r.projectId}","${r.projectName}","${r.payrollMonth}",${r.headcount},${r.totalGrossWage},${r.totalEmployerEpf},${r.totalEmployerEtf},${r.totalLabourCost}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Labour_Cost_Report_${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <FolderKanban className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Project Labour Cost Allocation Report</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Total project-wise loaded manpower costs including Gross Salaries, Employer EPF (12%), and Employer ETF (3%).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono focus:outline-none"
          />

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* High-level Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Manpower Cost</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            LKR {totalLabourCostAllProjects.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">All construction sites</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Gross Wages</span>
          <div className="text-2xl font-bold text-slate-100 mt-1">
            LKR {totalGrossWagesAll.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Base + OT + Allowances</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Statutory Contributions</span>
          <div className="text-2xl font-bold text-blue-400 mt-1">
            LKR {(totalEmployerEpfAll + totalEmployerEtfAll).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">EPF 12% + ETF 3%</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Headcount</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {totalHeadcountAllProjects} Employees
          </div>
          <span className="text-[10px] text-slate-500">Active allocations</span>
        </div>
      </div>

      {/* Detailed Project Cost Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 font-bold text-slate-100 text-xs uppercase tracking-wider">
          Project-Wise Labour Breakdown for Cycle: {selectedMonth}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Allocated Staff</th>
                <th className="px-4 py-3">Gross Wages</th>
                <th className="px-4 py-3">Employer EPF (12%)</th>
                <th className="px-4 py-3">Employer ETF (3%)</th>
                <th className="px-4 py-3">Total Loaded Labour Cost</th>
                <th className="px-4 py-3">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">
                    No payroll data available for {selectedMonth}. Generate the payroll batch first.
                  </td>
                </tr>
              ) : (
                reports.map(r => {
                  const percent = totalLabourCostAllProjects > 0
                    ? ((r.totalLabourCost / totalLabourCostAllProjects) * 100).toFixed(1)
                    : '0';

                  return (
                    <tr key={r.projectId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-amber-400">{r.projectId}</div>
                        <div className="text-[11px] text-slate-400">{r.projectName}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-200">
                        {r.headcount} staff
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-200">
                        LKR {r.totalGrossWage.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-blue-400">
                        LKR {r.totalEmployerEpf.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-purple-400">
                        LKR {r.totalEmployerEtf.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                        LKR {r.totalLabourCost.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden max-w-[80px]">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="font-mono text-[11px] text-slate-400">{percent}%</span>
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
    </div>
  );
};
