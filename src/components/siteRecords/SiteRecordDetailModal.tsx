import React from 'react';
import {
  X,
  Calendar,
  Building2,
  MapPin,
  Clock,
  CloudSun,
  Users,
  Truck,
  Package,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  FileSpreadsheet,
  ShieldCheck,
  Award,
  Camera,
  Share2,
  Copy,
  Edit2
} from 'lucide-react';
import { DailySiteRecord } from '../../types/siteRecordTypes';
import { useSiteRecords } from '../../context/SiteRecordContext';
import { useEnterprise } from '../../context/EnterpriseContext';

interface SiteRecordDetailModalProps {
  record: DailySiteRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (record: DailySiteRecord) => void;
}

export const SiteRecordDetailModal: React.FC<SiteRecordDetailModalProps> = ({
  record,
  isOpen,
  onClose,
  onEdit
}) => {
  const { downloadRecordPDF, cloneRecordForTomorrow, verifyAndApproveRecord } = useSiteRecords();
  const { currentRole, currentUser } = useEnterprise();

  if (!isOpen || !record) return null;

  const totalHeadcount = record.manpower.reduce((acc, curr) => acc + (curr.headCount || 0), 0);
  const totalManHours = record.manpower.reduce(
    (acc, curr) => acc + (curr.headCount || 0) * ((curr.regularHours || 0) + (curr.overtimeHours || 0)),
    0
  );
  const totalEquipHours = record.equipment.reduce((acc, curr) => acc + (curr.hoursWorked || 0), 0);
  const totalFuelUsed = record.equipment.reduce((acc, curr) => acc + (curr.fuelLitersUsed || 0), 0);

  const canApprove =
    (currentRole === 'ADMIN' || currentRole === 'PROJECT_MANAGER' || currentRole === 'SITE_ENGINEER' || currentRole === 'OWNER') &&
    record.signOff.status !== 'Verified & Approved';

  const handleApprove = () => {
    verifyAndApproveRecord(record.id, currentUser || 'Eng. Samantha Perera', 'Project Director');
  };

  const handleClone = () => {
    cloneRecordForTomorrow(record.id);
    alert(`Successfully cloned record from ${record.date} for today! A new draft has been created.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">{record.dsrNumber}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    record.signOff.status === 'Verified & Approved'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {record.signOff.status}
                </span>
                <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {record.shift} Shift
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {record.projectCode} • {record.projectName}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadRecordPDF(record)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow-md active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={handleClone}
              title="Duplicate this record for today"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all active:scale-95"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clone Log</span>
            </button>
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(record);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all active:scale-95"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto scrollbar-thin">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-800/50 border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Site Manpower</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-xl font-bold text-slate-100">{totalHeadcount} <span className="text-xs font-normal text-slate-400">Personnel</span></p>
              <p className="text-[11px] text-slate-400 mt-0.5">{totalManHours} total man-hours</p>
            </div>

            <div className="p-3.5 bg-slate-800/50 border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Heavy Plant</span>
                <Truck className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-xl font-bold text-slate-100">{record.equipment.length} <span className="text-xs font-normal text-slate-400">Machines</span></p>
              <p className="text-[11px] text-slate-400 mt-0.5">{totalEquipHours}h worked • {totalFuelUsed}L fuel</p>
            </div>

            <div className="p-3.5 bg-slate-800/50 border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Weather & Ground</span>
                <CloudSun className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-lg font-bold text-slate-100 truncate">{record.weatherMorning}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{record.temperatureC}°C • {record.rainfallMm}mm rain • {record.groundCondition}</p>
            </div>

            <div className="p-3.5 bg-slate-800/50 border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Safety & HSE</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-lg font-bold text-emerald-400">{record.safety.ppeComplianceRate}% PPE</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{record.safety.lostTimeInjuriesCount} LTI • {record.safety.firstAidCasesCount} First-Aid</p>
            </div>
          </div>

          {/* Site & Project Meta Info */}
          <div className="p-4 bg-slate-800/30 border border-slate-800/80 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-400">Project: </span>
                  <span className="font-semibold text-slate-200">{record.projectCode} - {record.projectName}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-400">Location / Chainage: </span>
                  <span className="text-slate-200">{record.siteLocation}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-400">Date: </span>
                  <span className="font-semibold text-slate-200">{record.date}</span>
                  <span className="text-slate-400 ml-3">Working Hours: </span>
                  <span className="text-slate-200">{record.workingHoursStart} - {record.workingHoursEnd}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Award className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-400">Prepared by: </span>
                  <span className="text-slate-200">{record.signOff.preparedByName} ({record.signOff.preparedByRole})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          {record.executiveSummary && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Executive Site Summary</h3>
              <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl text-xs leading-relaxed text-slate-200">
                {record.executiveSummary}
              </div>
            </div>
          )}

          {/* 1. Manpower Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-400" />
                <span>1. Manpower & Labour Deployment ({totalHeadcount} Men • {totalManHours} Hours)</span>
              </h3>
            </div>
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 text-[11px] font-semibold border-b border-slate-700/60">
                  <tr>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Trade / Role</th>
                    <th className="py-2 px-3 text-center">Headcount</th>
                    <th className="py-2 px-3 text-center">Reg Hrs</th>
                    <th className="py-2 px-3 text-center">OT Hrs</th>
                    <th className="py-2 px-3 text-center">Total Man-Hrs</th>
                    <th className="py-2 px-3">Assigned Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {record.manpower.map(m => (
                    <tr key={m.id} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          m.category === 'DIRECT' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                        }`}>
                          {m.category === 'DIRECT' ? 'Direct' : (m.subcontractorName || 'Subcontractor')}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-200">{m.trade}</td>
                      <td className="py-2 px-3 text-center font-bold text-slate-100">{m.headCount}</td>
                      <td className="py-2 px-3 text-center text-slate-400">{m.regularHours}h</td>
                      <td className="py-2 px-3 text-center text-slate-400">{m.overtimeHours || 0}h</td>
                      <td className="py-2 px-3 text-center font-semibold text-slate-200">
                        {m.headCount * (m.regularHours + (m.overtimeHours || 0))}h
                      </td>
                      <td className="py-2 px-3 text-slate-400">{m.locationAssigned || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Plant & Heavy Equipment */}
          {record.equipment.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-400" />
                <span>2. Plant & Heavy Machinery ({record.equipment.length} Units)</span>
              </h3>
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 text-[11px] font-semibold border-b border-slate-700/60">
                    <tr>
                      <th className="py-2 px-3">Equipment / Machinery</th>
                      <th className="py-2 px-3">Asset / Reg No</th>
                      <th className="py-2 px-3">Operator</th>
                      <th className="py-2 px-3 text-center">Work Hrs</th>
                      <th className="py-2 px-3 text-center">Idle Hrs</th>
                      <th className="py-2 px-3 text-center">Fuel</th>
                      <th className="py-2 px-3 text-center">Status</th>
                      <th className="py-2 px-3">Activity Assigned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {record.equipment.map(e => (
                      <tr key={e.id} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-medium text-slate-200">{e.equipmentName}</td>
                        <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{e.assetOrRegNo}</td>
                        <td className="py-2 px-3 text-slate-300">{e.operatorName}</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-100">{e.hoursWorked}h</td>
                        <td className="py-2 px-3 text-center text-slate-400">{e.hoursIdle}h</td>
                        <td className="py-2 px-3 text-center text-slate-300">{e.fuelLitersUsed} L</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            e.status === 'Working'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : e.status === 'Breakdown'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {e.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-400">{e.activityAssigned}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Material Deliveries */}
          {record.materials.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-400" />
                <span>3. Material Receipts & Quality Inspections ({record.materials.length} Deliveries)</span>
              </h3>
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 text-[11px] font-semibold border-b border-slate-700/60">
                    <tr>
                      <th className="py-2 px-3">Material Description</th>
                      <th className="py-2 px-3">Supplier</th>
                      <th className="py-2 px-3">Ticket / Waybill</th>
                      <th className="py-2 px-3 text-center">Quantity</th>
                      <th className="py-2 px-3">Delivery Time</th>
                      <th className="py-2 px-3 text-center">QC Status</th>
                      <th className="py-2 px-3">Test Reference / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {record.materials.map(m => (
                      <tr key={m.id} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-medium text-slate-200">{m.materialName}</td>
                        <td className="py-2 px-3 text-slate-400">{m.supplier}</td>
                        <td className="py-2 px-3 text-slate-300 font-mono text-[11px]">{m.deliveryTicketNo}</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-100">{m.quantity} {m.unit}</td>
                        <td className="py-2 px-3 text-slate-400">{m.deliveryTime}</td>
                        <td className="py-2 px-3 text-center">
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
                        <td className="py-2 px-3 text-slate-400">{m.testReference || m.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Work Progress */}
          {record.progress.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>4. Daily Work Progress & Output</span>
              </h3>
              <div className="space-y-2">
                {record.progress.map(p => (
                  <div key={p.id} className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-semibold text-slate-200">{p.tradeOrWorkItem}</span>
                        <span className="text-slate-400 ml-2">({p.locationOrChainage})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Output: <strong className="text-slate-200">{p.actualQuantity} / {p.plannedQuantity} {p.unit}</strong></span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          p.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : p.status === 'Ahead of Schedule'
                            ? 'bg-blue-500/10 text-blue-400'
                            : p.status === 'Delayed'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, p.percentageComplete)}%` }}
                      />
                    </div>
                    {p.remarks && (
                      <p className="text-[11px] text-slate-400 italic">Notes: {p.remarks}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. HSE Safety & Delays */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Health, Safety & Environment (HSE)</span>
              </h4>
              <p className="text-slate-300">
                Toolbox Talk: <strong className="text-slate-100">{record.safety.toolboxTalkConducted ? 'Conducted' : 'Not Conducted'}</strong>
              </p>
              {record.safety.toolboxTopic && (
                <p className="text-slate-400">
                  Topic: <span className="text-slate-200">{record.safety.toolboxTopic}</span> ({record.safety.toolboxAttendeesCount} attendees)
                </p>
              )}
              <div className="flex items-center gap-4 text-slate-400 pt-1">
                <span>PPE Compliance: <strong className="text-emerald-400">{record.safety.ppeComplianceRate}%</strong></span>
                <span>LTI: <strong className="text-slate-200">{record.safety.lostTimeInjuriesCount}</strong></span>
                <span>First Aid: <strong className="text-slate-200">{record.safety.firstAidCasesCount}</strong></span>
              </div>
              {record.safety.safetyOfficerNotes && (
                <p className="text-slate-400 text-[11px] italic pt-1 border-t border-slate-800">
                  Officer Notes: {record.safety.safetyOfficerNotes}
                </p>
              )}
            </div>

            <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Delays, Obstacles & Instructions</span>
              </h4>
              {record.delays.length === 0 ? (
                <p className="text-slate-500 italic py-2">No site delays or obstructions reported today.</p>
              ) : (
                <div className="space-y-1.5">
                  {record.delays.map(d => (
                    <div key={d.id} className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between font-semibold text-amber-400">
                        <span>{d.category}</span>
                        <span>{d.impactHours}h lost</span>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-0.5">{d.description}</p>
                      <p className="text-slate-400 text-[10px] mt-1">Action: {d.remedialAction}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 6. Photos Gallery if any */}
          {record.photos.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-pink-400" />
                <span>Site Photos & Evidence ({record.photos.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {record.photos.map(p => (
                  <div key={p.id} className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                    <img
                      src={p.url}
                      alt={p.caption}
                      referrerPolicy="no-referrer"
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="p-2.5 bg-slate-900/90 text-xs">
                      <p className="font-semibold text-slate-200 truncate">{p.caption}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{p.timestamp} • {p.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Sign-off & Verifications */}
          <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-400" />
                <span>Verification & Digital Sign-off</span>
              </h4>
              {canApprove && (
                <button
                  onClick={handleApprove}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verify & Approve DSR</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Prepared By (Site Engineer)</span>
                <p className="font-semibold text-slate-200">{record.signOff.preparedByName}</p>
                <p className="text-slate-400">{record.signOff.preparedByRole} • {record.signOff.preparedDate}</p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Verified & Approved By</span>
                <p className="font-semibold text-slate-200">
                  {record.signOff.verifiedByName || record.signOff.clientRepName || 'Pending Final Verification'}
                </p>
                <p className="text-slate-400">
                  {record.signOff.verifiedByRole || 'Project Director'} • {record.signOff.verifiedDate || 'Awaiting Review'}
                </p>
                {record.signOff.digitalSignatureHash && (
                  <p className="text-[10px] font-mono text-emerald-400">{record.signOff.digitalSignatureHash}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Created: {new Date(record.createdAt).toLocaleString()}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
