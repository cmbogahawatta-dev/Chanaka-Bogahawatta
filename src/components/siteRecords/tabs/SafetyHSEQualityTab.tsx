import React, { useMemo } from 'react';
import {
  ShieldCheck,
  Award,
  AlertOctagon,
  HeartPulse,
  CheckCircle2,
  PackageCheck,
  FileText,
  Users
} from 'lucide-react';
import { useSiteRecords } from '../../../context/SiteRecordContext';

export const SafetyHSEQualityTab: React.FC = () => {
  const { records } = useSiteRecords();

  const allSafetyLogs = useMemo(() => {
    return records.map(r => ({
      ...r.safety,
      date: r.date,
      projectCode: r.projectCode,
      dsrNumber: r.dsrNumber
    }));
  }, [records]);

  const allMaterials = useMemo(() => {
    const list: any[] = [];
    records.forEach(r => {
      r.materials.forEach(m => {
        list.push({
          ...m,
          date: r.date,
          projectCode: r.projectCode,
          dsrNumber: r.dsrNumber
        });
      });
    });
    return list;
  }, [records]);

  const totalToolboxTalks = allSafetyLogs.filter(s => s.toolboxTalkConducted).length;
  const totalTBTAttendees = allSafetyLogs.reduce((acc, curr) => acc + (curr.toolboxAttendeesCount || 0), 0);
  const totalLTI = allSafetyLogs.reduce((acc, curr) => acc + (curr.lostTimeInjuriesCount || 0), 0);
  const totalFirstAid = allSafetyLogs.reduce((acc, curr) => acc + (curr.firstAidCasesCount || 0), 0);
  const avgPPECompliance =
    allSafetyLogs.length > 0
      ? Math.round(allSafetyLogs.reduce((acc, curr) => acc + (curr.ppeComplianceRate || 100), 0) / allSafetyLogs.length)
      : 100;

  const acceptedMaterials = allMaterials.filter(m => m.qcStatus === 'Accepted' || m.qcStatus === 'Accepted with Remarks').length;

  return (
    <div className="space-y-4">
      {/* HSE Milestone Banner */}
      <div className="p-5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">Zero Lost Time Injury (LTI) Milestone</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Active Safe Site
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              1,420 Safe Man-Hours worked without an LTI incident across ongoing enterprise infrastructure projects.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">Average PPE Compliance</span>
            <strong className="text-emerald-400 text-lg font-black">{avgPPECompliance}%</strong>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">Toolbox Talks</span>
            <strong className="text-slate-100 text-lg font-black">{totalToolboxTalks} Held</strong>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Toolbox Briefings (TBT)</span>
          <p className="text-2xl font-black text-emerald-400">{totalToolboxTalks} <span className="text-xs font-normal text-slate-400">Sessions</span></p>
          <span className="text-[11px] text-slate-500 mt-1 block">{totalTBTAttendees} Total Attendees</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Lost Time Injuries (LTI)</span>
          <p className="text-2xl font-black text-slate-100">{totalLTI} <span className="text-xs font-normal text-slate-400">Incidents</span></p>
          <span className="text-[11px] text-emerald-400 mt-1 block">Zero LTI Recorded</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">First Aid Treatments</span>
          <p className="text-2xl font-black text-amber-400">{totalFirstAid} <span className="text-xs font-normal text-slate-400">Cases</span></p>
          <span className="text-[11px] text-slate-500 mt-1 block">Minor scratches/scrapes only</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Material QC Approvals</span>
          <p className="text-2xl font-black text-blue-400">{acceptedMaterials} <span className="text-xs font-normal text-slate-400">Accepted</span></p>
          <span className="text-[11px] text-slate-500 mt-1 block">{allMaterials.length} total shipments inspected</span>
        </div>
      </div>

      {/* Daily Toolbox Talk History */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Daily Safety Toolbox Talk & Briefing Logs</span>
        </h3>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 text-[11px] font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Project</th>
                <th className="py-2.5 px-3">Toolbox Topic Discussed</th>
                <th className="py-2.5 px-3 text-center">Attendees</th>
                <th className="py-2.5 px-3 text-center">PPE Compliance</th>
                <th className="py-2.5 px-3">Officer Observations / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {allSafetyLogs.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{s.date}</td>
                  <td className="py-2.5 px-3 font-bold text-amber-400">{s.projectCode}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-200">{s.toolboxTopic || 'General Site Safety Protocol'}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-100">{s.toolboxAttendeesCount}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-semibold text-emerald-400">{s.ppeComplianceRate}%</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{s.safetyOfficerNotes || 'Standard safety inspections conducted.'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Materials Delivery & Quality Inspections */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <PackageCheck className="w-4 h-4 text-blue-400" />
          <span>Site Quality Assurance & Material Verification Tickets</span>
        </h3>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 text-[11px] font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Project</th>
                <th className="py-2.5 px-3">Material Description</th>
                <th className="py-2.5 px-3">Supplier</th>
                <th className="py-2.5 px-3">Waybill / Ticket #</th>
                <th className="py-2.5 px-3 text-center">Quantity</th>
                <th className="py-2.5 px-3 text-center">QC Status</th>
                <th className="py-2.5 px-3">QC Test Ref / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {allMaterials.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{m.date}</td>
                  <td className="py-2.5 px-3 font-bold text-amber-400">{m.projectCode}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-200">{m.materialName}</td>
                  <td className="py-2.5 px-3 text-slate-400">{m.supplier}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">{m.deliveryTicketNo}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-100">{m.quantity} {m.unit}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      m.qcStatus === 'Accepted'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : m.qcStatus === 'Rejected'
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {m.qcStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{m.testReference || m.remarks || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
