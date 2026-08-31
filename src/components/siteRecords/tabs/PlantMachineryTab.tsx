import React, { useMemo } from 'react';
import {
  Truck,
  Fuel,
  Clock,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Gauge
} from 'lucide-react';
import { useSiteRecords } from '../../../context/SiteRecordContext';

export const PlantMachineryTab: React.FC = () => {
  const { records } = useSiteRecords();

  const allEquipmentLogs = useMemo(() => {
    const list: any[] = [];
    records.forEach(r => {
      r.equipment.forEach(e => {
        list.push({
          ...e,
          date: r.date,
          projectCode: r.projectCode,
          dsrNumber: r.dsrNumber
        });
      });
    });
    return list;
  }, [records]);

  // Aggregate by machinery asset
  const machinerySummary = useMemo(() => {
    const map: { [key: string]: { name: string; reg: string; workHrs: number; idleHrs: number; breakdownHrs: number; fuel: number; count: number; status: string } } = {};

    allEquipmentLogs.forEach(eq => {
      const key = eq.assetOrRegNo || eq.equipmentName;
      if (!map[key]) {
        map[key] = {
          name: eq.equipmentName,
          reg: eq.assetOrRegNo,
          workHrs: 0,
          idleHrs: 0,
          breakdownHrs: 0,
          fuel: 0,
          count: 0,
          status: eq.status
        };
      }
      map[key].workHrs += eq.hoursWorked || 0;
      map[key].idleHrs += eq.hoursIdle || 0;
      map[key].breakdownHrs += eq.hoursBreakdown || 0;
      map[key].fuel += eq.fuelLitersUsed || 0;
      map[key].count += 1;
      map[key].status = eq.status;
    });

    return Object.values(map);
  }, [allEquipmentLogs]);

  const totalWorkingHrs = machinerySummary.reduce((acc, curr) => acc + curr.workHrs, 0);
  const totalIdleHrs = machinerySummary.reduce((acc, curr) => acc + curr.idleHrs, 0);
  const totalFuelLiters = machinerySummary.reduce((acc, curr) => acc + curr.fuel, 0);
  const activeCount = machinerySummary.filter(m => m.status === 'Working').length;
  const utilizationRate = (totalWorkingHrs + totalIdleHrs) > 0 ? Math.round((totalWorkingHrs / (totalWorkingHrs + totalIdleHrs)) * 100) : 85;

  return (
    <div className="space-y-4">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Active Heavy Plant</span>
          <p className="text-2xl font-black text-blue-400">{machinerySummary.length} <span className="text-xs font-normal text-slate-400">Units</span></p>
          <span className="text-[11px] text-emerald-400 mt-1 block">{activeCount} Currently Operational</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Fleet Utilization Rate</span>
          <p className="text-2xl font-black text-emerald-400">{utilizationRate}%</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Work vs Idle time ratio</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Total Plant Work Hours</span>
          <p className="text-2xl font-black text-slate-100">{totalWorkingHrs} <span className="text-xs font-normal text-slate-400">Hours</span></p>
          <span className="text-[11px] text-slate-500 mt-1 block">{totalIdleHrs}h Standby / Idle</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Site Diesel Consumed</span>
          <p className="text-2xl font-black text-amber-400">{totalFuelLiters.toLocaleString()} <span className="text-xs font-normal text-slate-400">Liters</span></p>
          <span className="text-[11px] text-slate-500 mt-1 block">Tracked via DSR fuel logs</span>
        </div>
      </div>

      {/* Machinery Summary Table */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-blue-400" />
            <span>Heavy Machinery Utilization & Fuel Roster</span>
          </h3>
          <span className="text-xs text-slate-400">{machinerySummary.length} equipment assets</span>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 text-[11px] font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Equipment / Machine Description</th>
                <th className="py-2.5 px-3">Asset / Reg No</th>
                <th className="py-2.5 px-3 text-center">Working Hours</th>
                <th className="py-2.5 px-3 text-center">Idle Hours</th>
                <th className="py-2.5 px-3 text-center">Fuel Consumed</th>
                <th className="py-2.5 px-3 text-center">Utilization</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {machinerySummary.map(m => {
                const util = (m.workHrs + m.idleHrs) > 0 ? Math.round((m.workHrs / (m.workHrs + m.idleHrs)) * 100) : 100;
                return (
                  <tr key={m.reg || m.name} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-medium text-slate-200">{m.name}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{m.reg}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-100">{m.workHrs}h</td>
                    <td className="py-2.5 px-3 text-center text-slate-400">{m.idleHrs}h</td>
                    <td className="py-2.5 px-3 text-center text-amber-400 font-semibold">{m.fuel} L</td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-semibold text-slate-200 text-[11px]">{util}%</span>
                        <div className="w-12 bg-slate-800 rounded-full h-1.5">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${util}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        m.status === 'Working'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : m.status === 'Breakdown'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {m.status}
                      </span>
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
