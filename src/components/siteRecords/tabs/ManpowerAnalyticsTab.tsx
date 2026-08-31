import React, { useMemo } from 'react';
import {
  Users,
  Clock,
  Briefcase,
  TrendingUp,
  UserCheck,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight
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
import { useSiteRecords } from '../../../context/SiteRecordContext';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1', '#14b8a6'];

export const ManpowerAnalyticsTab: React.FC = () => {
  const { records } = useSiteRecords();

  // Aggregate Manpower by Trade across all recent records
  const tradeBreakdown = useMemo(() => {
    const tradeMap: { [key: string]: { count: number; hours: number; direct: number; subcon: number } } = {};

    records.forEach(r => {
      r.manpower.forEach(m => {
        const trade = m.trade || 'General Labour';
        if (!tradeMap[trade]) {
          tradeMap[trade] = { count: 0, hours: 0, direct: 0, subcon: 0 };
        }
        const totalHrs = (m.headCount || 0) * ((m.regularHours || 0) + (m.overtimeHours || 0));
        tradeMap[trade].count += m.headCount || 0;
        tradeMap[trade].hours += totalHrs;
        if (m.category === 'DIRECT') {
          tradeMap[trade].direct += m.headCount || 0;
        } else {
          tradeMap[trade].subcon += m.headCount || 0;
        }
      });
    });

    return Object.keys(tradeMap).map(trade => ({
      trade,
      headCount: tradeMap[trade].count,
      totalHours: tradeMap[trade].hours,
      direct: tradeMap[trade].direct,
      subcon: tradeMap[trade].subcon
    })).sort((a, b) => b.totalHours - a.totalHours);
  }, [records]);

  // Daily Manpower Trend (Last 7 Logs)
  const dailyTrend = useMemo(() => {
    return [...records]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7)
      .map(r => {
        const directMen = r.manpower.filter(m => m.category === 'DIRECT').reduce((sum, m) => sum + (m.headCount || 0), 0);
        const subconMen = r.manpower.filter(m => m.category === 'SUBCONTRACTOR').reduce((sum, m) => sum + (m.headCount || 0), 0);
        const totalManHours = r.manpower.reduce((sum, m) => sum + (m.headCount || 0) * (m.regularHours + (m.overtimeHours || 0)), 0);

        return {
          date: r.date.split('-').slice(1).join('/'),
          project: r.projectCode,
          directMen,
          subconMen,
          totalHeadcount: directMen + subconMen,
          totalManHours
        };
      });
  }, [records]);

  // Overall Totals
  const totalSitePersonnel = tradeBreakdown.reduce((sum, t) => sum + t.headCount, 0);
  const totalCumulativeManHours = tradeBreakdown.reduce((sum, t) => sum + t.totalHours, 0);
  const directPersonnel = tradeBreakdown.reduce((sum, t) => sum + t.direct, 0);
  const subconPersonnel = tradeBreakdown.reduce((sum, t) => sum + t.subcon, 0);

  return (
    <div className="space-y-4">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Total Manpower Deployed</span>
          <p className="text-2xl font-black text-purple-400">{totalSitePersonnel} <span className="text-xs font-normal text-slate-400">Total Men</span></p>
          <span className="text-[11px] text-slate-500 mt-1 block">Across all daily journals</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Cumulative Man-Hours</span>
          <p className="text-2xl font-black text-slate-100">{totalCumulativeManHours.toLocaleString()} <span className="text-xs font-normal text-slate-400">Hrs</span></p>
          <span className="text-[11px] text-emerald-400 mt-1 block">Productive site execution</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Direct Labour Force</span>
          <p className="text-2xl font-black text-blue-400">{directPersonnel} <span className="text-xs font-normal text-slate-400">Direct</span></p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {totalSitePersonnel > 0 ? Math.round((directPersonnel / totalSitePersonnel) * 100) : 0}% of workforce
          </span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Subcontractor Labour</span>
          <p className="text-2xl font-black text-amber-400">{subconPersonnel} <span className="text-xs font-normal text-slate-400">Subcon</span></p>
          <span className="text-[11px] text-slate-500 mt-1 block">Specialist trade crews</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Manpower Trend Chart */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span>Daily Manpower Headcount Trend</span>
            </h3>
            <span className="text-[10px] text-slate-400">Direct vs Subcontractor</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="directMen" name="Direct Labour" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="subconMen" name="Subcontractor" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trade Distribution Pie */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Workforce Trade Distribution</span>
            </h3>
            <span className="text-[10px] text-slate-400">By Man-Hours</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tradeBreakdown.slice(0, 7)}
                  dataKey="totalHours"
                  nameKey="trade"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={45}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name.split('/')[0]} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {tradeBreakdown.slice(0, 7).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Trade Matrix Table */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Briefcase className="w-4 h-4 text-emerald-400" />
          <span>Complete Trade & Skill Allocation Breakdown</span>
        </h3>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 text-[11px] font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Trade / Skill Designation</th>
                <th className="py-2.5 px-3 text-center">Total Headcount</th>
                <th className="py-2.5 px-3 text-center">Direct Hire</th>
                <th className="py-2.5 px-3 text-center">Subcontractor</th>
                <th className="py-2.5 px-3 text-center">Total Man-Hours</th>
                <th className="py-2.5 px-3 text-right">Workforce Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {tradeBreakdown.map((t, idx) => {
                const share = totalCumulativeManHours > 0 ? (t.totalHours / totalCumulativeManHours) * 100 : 0;
                return (
                  <tr key={t.trade} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-medium text-slate-200 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span>{t.trade}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-100">{t.headCount}</td>
                    <td className="py-2.5 px-3 text-center text-blue-400">{t.direct}</td>
                    <td className="py-2.5 px-3 text-center text-amber-400">{t.subcon}</td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-200">{t.totalHours.toLocaleString()}h</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="font-mono text-slate-300">{share.toFixed(1)}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
