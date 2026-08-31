import React, { useMemo } from 'react';
import {
  CheckCircle2,
  TrendingUp,
  Clock,
  AlertTriangle,
  Layers,
  MapPin,
  FileCheck,
  Percent
} from 'lucide-react';
import { useSiteRecords } from '../../../context/SiteRecordContext';

export const WorkProgressTab: React.FC = () => {
  const { records } = useSiteRecords();

  const allProgressItems = useMemo(() => {
    const list: any[] = [];
    records.forEach(r => {
      r.progress.forEach(p => {
        list.push({
          ...p,
          date: r.date,
          projectCode: r.projectCode,
          projectName: r.projectName,
          dsrNumber: r.dsrNumber
        });
      });
    });
    return list;
  }, [records]);

  const allDelays = useMemo(() => {
    const list: any[] = [];
    records.forEach(r => {
      r.delays.forEach(d => {
        list.push({
          ...d,
          date: r.date,
          projectCode: r.projectCode,
          dsrNumber: r.dsrNumber
        });
      });
    });
    return list;
  }, [records]);

  const completedCount = allProgressItems.filter(p => p.status === 'Completed' || p.percentageComplete === 100).length;
  const inProgressCount = allProgressItems.filter(p => p.status === 'In Progress' || p.status === 'Ahead of Schedule').length;
  const delayedCount = allProgressItems.filter(p => p.status === 'Delayed').length;
  const totalHoursLost = allDelays.reduce((acc, curr) => acc + (curr.impactHours || 0), 0);

  return (
    <div className="space-y-4">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Total Activities Tracked</span>
          <p className="text-2xl font-black text-purple-400">{allProgressItems.length} <span className="text-xs font-normal text-slate-400">Items</span></p>
          <span className="text-[11px] text-emerald-400 mt-1 block">{completedCount} fully completed</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Active Site Workstreams</span>
          <p className="text-2xl font-black text-blue-400">{inProgressCount} <span className="text-xs font-normal text-slate-400">In Progress</span></p>
          <span className="text-[11px] text-slate-500 mt-1 block">Active on frontlines</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Delayed Work Items</span>
          <p className="text-2xl font-black text-rose-400">{delayedCount} <span className="text-xs font-normal text-slate-400">Items</span></p>
          <span className="text-[11px] text-slate-500 mt-1 block">Remedial actions active</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Total Downtime / Delays</span>
          <p className="text-2xl font-black text-amber-400">{totalHoursLost} <span className="text-xs font-normal text-slate-400">Hours</span></p>
          <span className="text-[11px] text-slate-500 mt-1 block">Weather & site obstacles</span>
        </div>
      </div>

      {/* Work Progress Journal */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Daily Site Execution & Output Progress Logs</span>
          </h3>
          <span className="text-xs text-slate-400">{allProgressItems.length} records</span>
        </div>

        <div className="space-y-3">
          {allProgressItems.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2.5 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-slate-100 text-sm">{item.tradeOrWorkItem}</span>
                  <div className="flex items-center gap-2 text-slate-400 text-xs mt-0.5">
                    <span className="text-amber-400 font-semibold">{item.projectCode}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {item.locationOrChainage}
                    </span>
                    <span>•</span>
                    <span>{item.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-slate-400 text-[11px] block">Output / Target</span>
                    <strong className="text-slate-100 font-bold">
                      {item.actualQuantity} / {item.plannedQuantity} {item.unit}
                    </strong>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      item.status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : item.status === 'Ahead of Schedule'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : item.status === 'Delayed'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Milestone Completion</span>
                  <span className="font-mono font-bold text-slate-200">{item.percentageComplete}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, item.percentageComplete)}%` }}
                  />
                </div>
              </div>

              {item.remarks && (
                <p className="text-xs text-slate-400 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                  {item.remarks}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delay & Obstruction Logs */}
      {allDelays.length > 0 && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Site Delays & Remedial Action Register</span>
          </h3>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Project</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-center">Impact (Hrs)</th>
                  <th className="py-2.5 px-3">Remedial Action Taken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {allDelays.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{d.date}</td>
                    <td className="py-2.5 px-3 font-bold text-amber-400">{d.projectCode}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400">
                        {d.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-sm">{d.description}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-rose-400">{d.impactHours}h</td>
                    <td className="py-2.5 px-3 text-slate-400">{d.remedialAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
