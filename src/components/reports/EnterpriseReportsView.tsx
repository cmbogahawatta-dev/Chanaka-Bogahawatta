import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Fuel,
  Wrench,
  Truck,
  FolderKanban,
  Wallet,
  Building2,
  CheckCircle2
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
  AreaChart,
  Area
} from 'recharts';
import { usePettyCash } from '../../context/PettyCashContext';
import { useFleet } from '../../context/FleetContext';
import { useEnterprise } from '../../context/EnterpriseContext';

export const EnterpriseReportsView: React.FC = () => {
  const { expenses, income, supervisorBalances, projects } = usePettyCash();
  const { vehicles, fuelRecords, maintenanceLogs } = useFleet();
  const { procurementOrders, paymentVouchers } = useEnterprise();

  const [reportType, setReportType] = useState<'MONTHLY_SUMMARY' | 'PROJECT_COST' | 'FLEET_RUNNING_COST' | 'SUPERVISOR_LEDGER'>('MONTHLY_SUMMARY');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');

  const formatLKR = (amt: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0
    }).format(amt);
  };

  // 1. Overall Calculations
  const totalPettyCashExpenses = useMemo(() => {
    return expenses
      .filter(e => e.PAYMENT_STATUS !== 'Rejected' && e.PAYMENT_STATUS !== 'Draft')
      .reduce((a, c) => a + (c.AMOUNT || 0), 0);
  }, [expenses]);

  const totalFuelCost = useMemo(() => {
    return fuelRecords.reduce((a, c) => a + (c.totalCost || 0), 0);
  }, [fuelRecords]);

  const totalMaintenanceCost = useMemo(() => {
    return maintenanceLogs.reduce((a, c) => a + (c.cost || 0), 0);
  }, [maintenanceLogs]);

  const totalProcurementCost = useMemo(() => {
    return procurementOrders
      .filter(p => p.STATUS !== 'Cancelled')
      .reduce((a, c) => a + (c.TOTAL_AMOUNT || 0), 0);
  }, [procurementOrders]);

  const totalDirectPayments = useMemo(() => {
    return paymentVouchers
      .filter(v => v.STATUS !== 'Rejected')
      .reduce((a, c) => a + (c.AMOUNT || 0), 0);
  }, [paymentVouchers]);

  const grandTotalExpenditure = totalPettyCashExpenses + totalFuelCost + totalMaintenanceCost + totalProcurementCost + totalDirectPayments;

  // Monthly trends mock/live aggregate
  const monthlyTrendData = [
    { month: 'May 2026', PettyCash: 280000, Fuel: 95000, Maintenance: 45000, Procurement: 420000 },
    { month: 'Jun 2026', PettyCash: 310000, Fuel: 110000, Maintenance: 62000, Procurement: 510000 },
    { month: 'Jul 2026', PettyCash: 345000, Fuel: 125000, Maintenance: 38000, Procurement: 680000 },
    { month: 'Aug 2026', PettyCash: totalPettyCashExpenses, Fuel: totalFuelCost, Maintenance: totalMaintenanceCost, Procurement: totalProcurementCost }
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csv = "data:text/csv;charset=utf-8,";
    if (reportType === 'MONTHLY_SUMMARY') {
      csv += "Category,Cost (LKR),Percentage\n";
      csv += `Site Petty Cash Vouchers,${totalPettyCashExpenses},${((totalPettyCashExpenses/grandTotalExpenditure)*100).toFixed(1)}%\n`;
      csv += `Fleet Fuel Logistics,${totalFuelCost},${((totalFuelCost/grandTotalExpenditure)*100).toFixed(1)}%\n`;
      csv += `Fleet Maintenance & Repairs,${totalMaintenanceCost},${((totalMaintenanceCost/grandTotalExpenditure)*100).toFixed(1)}%\n`;
      csv += `Site Material Procurement,${totalProcurementCost},${((totalProcurementCost/grandTotalExpenditure)*100).toFixed(1)}%\n`;
      csv += `Direct Bank Payments & Disbursals,${totalDirectPayments},${((totalDirectPayments/grandTotalExpenditure)*100).toFixed(1)}%\n`;
      csv += `Grand Total Expenditure,${grandTotalExpenditure},100%\n`;
    } else if (reportType === 'SUPERVISOR_LEDGER') {
      csv += "Supervisor,Total Income,Total Expenses,Transfers In,Transfers Out,Current Balance\n";
      Object.entries(supervisorBalances).forEach(([name, s]: [string, any]) => {
        csv += `"${name}",${s.incomeTotal || 0},${s.approvedExpenses || 0},${s.transfersIn || 0},${s.transfersOut || 0},${s.currentBalance || 0}\n`;
      });
    }

    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EMA_Report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 backdrop-blur p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-950 text-teal-400 border border-teal-800 flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Enterprise Financial & Operational Reports</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Consolidated financial auditing, monthly cash movement, supervisor balances, and vehicle running expenses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 2. Report Type Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
        <button
          onClick={() => setReportType('MONTHLY_SUMMARY')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            reportType === 'MONTHLY_SUMMARY' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Monthly Financial Summary
        </button>
        <button
          onClick={() => setReportType('SUPERVISOR_LEDGER')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            reportType === 'SUPERVISOR_LEDGER' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Supervisor Petty Cash Balances
        </button>
        <button
          onClick={() => setReportType('FLEET_RUNNING_COST')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            reportType === 'FLEET_RUNNING_COST' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Fleet Running Cost Analysis
        </button>
      </div>

      {/* 3. REPORT CONTENT VIEWS */}

      {/* View A: Monthly Summary */}
      {reportType === 'MONTHLY_SUMMARY' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Consolidated Outflow</span>
              <div className="text-xl font-mono font-bold text-slate-100 mt-1">{formatLKR(grandTotalExpenditure)}</div>
              <span className="text-[10px] text-teal-400 font-medium">All 5 operational modules</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Field Petty Cash</span>
              <div className="text-xl font-mono font-bold text-emerald-400 mt-1">{formatLKR(totalPettyCashExpenses)}</div>
              <span className="text-[10px] text-slate-400">{((totalPettyCashExpenses/grandTotalExpenditure)*100).toFixed(1)}% of company total</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fleet Fuel & Maintenance</span>
              <div className="text-xl font-mono font-bold text-blue-400 mt-1">{formatLKR(totalFuelCost + totalMaintenanceCost)}</div>
              <span className="text-[10px] text-slate-400">{(((totalFuelCost + totalMaintenanceCost)/grandTotalExpenditure)*100).toFixed(1)}% of company total</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Procurement & Disbursals</span>
              <div className="text-xl font-mono font-bold text-purple-400 mt-1">{formatLKR(totalProcurementCost + totalDirectPayments)}</div>
              <span className="text-[10px] text-slate-400">{(((totalProcurementCost + totalDirectPayments)/grandTotalExpenditure)*100).toFixed(1)}% of company total</span>
            </div>
          </div>

          {/* Monthly Trend Area Chart */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-200">Month-on-Month Operational Expense Growth (LKR)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    formatter={(val: number) => [formatLKR(val), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area type="monotone" dataKey="PettyCash" name="Petty Cash" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="Fuel" name="Fuel Logistics" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="Procurement" name="Materials PO" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* View B: Supervisor Ledger Table */}
      {reportType === 'SUPERVISOR_LEDGER' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200">Supervisor Petty Cash Ledger Audit</h3>
            <p className="text-xs text-slate-400">Individual supervisor balances, income received, vouchers approved, and cash transfers.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3">Supervisor</th>
                  <th className="p-3">Total Top-ups</th>
                  <th className="p-3">Total Expenses</th>
                  <th className="p-3">Transfers In</th>
                  <th className="p-3">Transfers Out</th>
                  <th className="p-3">Current Balance</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {Object.entries(supervisorBalances).map(([supervisorName, sup]: [string, any]) => (
                  <tr key={supervisorName} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-slate-100">{supervisorName}</td>
                    <td className="p-3 font-mono text-emerald-400 font-semibold">{formatLKR(sup.incomeTotal || 0)}</td>
                    <td className="p-3 font-mono text-rose-400 font-semibold">{formatLKR(sup.approvedExpenses || 0)}</td>
                    <td className="p-3 font-mono text-blue-400">+{formatLKR(sup.transfersIn || 0)}</td>
                    <td className="p-3 font-mono text-amber-400">-{formatLKR(sup.transfersOut || 0)}</td>
                    <td className="p-3 font-mono font-bold text-slate-100 text-sm">
                      {formatLKR(sup.currentBalance || 0)}
                    </td>
                    <td className="p-3">
                      {sup.currentBalance < 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold">
                          OVERDRAWN
                        </span>
                      ) : sup.currentBalance < 25000 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">
                          LOW FLOAT
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                          HEALTHY
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View C: Fleet Running Cost */}
      {reportType === 'FLEET_RUNNING_COST' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200">Company Vehicle Running & Maintenance Costs</h3>
            <p className="text-xs text-slate-400">Cumulative fuel expenditures, scheduled service costs, and cost-per-km metrics.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3">Reg Number</th>
                  <th className="p-3">Make & Model</th>
                  <th className="p-3">Current Site</th>
                  <th className="p-3">Fuel Cost</th>
                  <th className="p-3">Service / Repairs</th>
                  <th className="p-3">Total Running Cost</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {vehicles.map(v => {
                  const vFuel = fuelRecords.filter(f => f.vehicleId === v.id).reduce((a, c) => a + (c.totalCost || 0), 0);
                  const vMaint = maintenanceLogs.filter(m => m.vehicleId === v.id).reduce((a, c) => a + (c.cost || 0), 0);
                  const totalRunning = vFuel + vMaint;

                  return (
                    <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-400">{v.registrationNumber}</td>
                      <td className="p-3 text-slate-200">{v.make} {v.model}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-mono font-bold">
                          {v.currentSite || 'Head Office'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-300">{formatLKR(vFuel)}</td>
                      <td className="p-3 font-mono text-slate-300">{formatLKR(vMaint)}</td>
                      <td className="p-3 font-mono font-bold text-slate-100">{formatLKR(totalRunning)}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                          {v.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
