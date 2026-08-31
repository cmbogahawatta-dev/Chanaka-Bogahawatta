import React, { useState } from 'react';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Calendar,
  DollarSign,
  Building,
  FileText,
  Trash2,
  Edit2,
  Filter,
  Check,
  ChevronRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { formatDate, formatCurrency, calculateServiceStatus } from '../../utils/helpers';
import { ServiceSchedule, MaintenanceLog } from '../../types';
import { LogServiceModal } from './LogServiceModal';
import { NewScheduleModal } from './NewScheduleModal';
import { AdminClearHistoryButton } from '../common/AdminClearHistoryButton';

export const MaintenanceView: React.FC = () => {
  const {
    vehicles,
    serviceSchedules,
    maintenanceLogs,
    deleteServiceSchedule,
    deleteMaintenanceLog,
    clearMaintenanceHistory,
    selectedVehicleId,
    isAdmin: isFleetAdmin
  } = useFleet();
  const { currentRole } = useEnterprise();
  const isAdmin = isFleetAdmin || currentRole === 'ADMIN';

  const [activeSubTab, setActiveSubTab] = useState<'reminders' | 'schedules' | 'history'>('reminders');
  const [showLogModal, setShowLogModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedScheduleForLog, setSelectedScheduleForLog] = useState<ServiceSchedule | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<ServiceSchedule | null>(null);
  const [editingLog, setEditingLog] = useState<MaintenanceLog | null>(null);

  // Filter schedules and logs by selected vehicle
  const filteredSchedules = serviceSchedules.filter(s =>
    selectedVehicleId === 'all' ? true : s.vehicleId === selectedVehicleId
  );

  const filteredLogs = maintenanceLogs.filter(l =>
    selectedVehicleId === 'all' ? true : l.vehicleId === selectedVehicleId
  );

  const getVehicle = (vehicleId: string) => vehicles.find(v => v.id === vehicleId);

  // Evaluate each schedule against vehicle's current odometer & current date
  const evaluatedSchedules = filteredSchedules.map(schedule => {
    const veh = getVehicle(schedule.vehicleId);
    const currentOdo = veh?.currentOdometerKm || schedule.lastServiceOdometerKm;
    const evalResult = calculateServiceStatus(schedule, currentOdo);
    return {
      schedule,
      vehicle: veh,
      currentOdo,
      ...evalResult
    };
  });

  const overdueList = evaluatedSchedules.filter(item => item.status === 'overdue');
  const dueSoonList = evaluatedSchedules.filter(item => item.status === 'due-soon');
  const goodList = evaluatedSchedules.filter(item => item.status === 'good');

  const totalMaintenanceCost = filteredLogs.reduce((sum, l) => sum + (l.cost || 0), 0);

  return (
    <div className="space-y-4 pb-20 pt-1">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Maintenance & Service Reminders
              </h2>
              <p className="text-xs text-slate-400">Automated odometer & time-based triggers</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <AdminClearHistoryButton
              id="btn-admin-clear-maintenance"
              moduleName={selectedVehicleId !== 'all' ? `Maintenance Logs for Vehicle ${selectedVehicleId}` : 'Fleet Maintenance Logs'}
              itemCount={filteredLogs.length}
              itemDescription="completed service records and garage workshop invoices"
              preservedItemsDescription="Vehicles, intervals, and schedules remain intact."
              onClear={() => clearMaintenanceHistory(selectedVehicleId)}
            />
            <button
              onClick={() => {
                setSelectedScheduleForLog(null);
                setShowLogModal(true);
              }}
              className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Log Service</span>
            </button>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl mt-4 border border-slate-800">
          <button
            onClick={() => setActiveSubTab('reminders')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'reminders'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Reminders</span>
            {(overdueList.length > 0 || dueSoonList.length > 0) && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold text-white ${
                overdueList.length > 0 ? 'bg-rose-500' : 'bg-amber-500'
              }`}>
                {overdueList.length + dueSoonList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('schedules')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'schedules'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Intervals ({filteredSchedules.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'history'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>History ({filteredLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: Automated Reminders (Overdue, Due Soon, Good) */}
      {activeSubTab === 'reminders' && (
        <div className="space-y-4">
          {/* Critical Overdue Section */}
          {overdueList.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider px-1">
                <ShieldAlert className="w-4 h-4" />
                <span>Urgent / Overdue Services ({overdueList.length})</span>
              </div>

              {overdueList.map(item => (
                <div
                  key={item.schedule.id}
                  className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5 space-y-2.5 text-xs shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase bg-rose-500 text-white px-2 py-0.5 rounded">
                        OVERDUE
                      </span>
                      <h4 className="font-bold text-white text-sm mt-1">
                        {item.schedule.serviceType}
                      </h4>
                      <p className="text-[11px] text-rose-300 font-semibold mt-0.5">
                        {item.reason}
                      </p>
                    </div>

                    <span className="text-xs font-bold text-white bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700">
                      {item.vehicle?.registrationNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2 bg-slate-900/80 rounded-xl text-[11px] border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Trigger Target</span>
                      <span className="font-mono text-slate-200 font-bold">
                        {item.schedule.nextDueOdometerKm.toLocaleString()} km / {formatDate(item.schedule.nextDueDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Current Odometer</span>
                      <span className="font-mono text-rose-400 font-bold">
                        {item.currentOdo.toLocaleString()} km
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      Est. Cost: <strong className="text-slate-200">{formatCurrency(item.schedule.estimatedCost || 0)}</strong>
                    </span>
                    <button
                      onClick={() => {
                        setSelectedScheduleForLog(item.schedule);
                        setShowLogModal(true);
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Log Done & Reset</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Due Soon Section */}
          {dueSoonList.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider px-1">
                <Clock className="w-4 h-4" />
                <span>Due Soon (Next 500 km or 14 days)</span>
              </div>

              {dueSoonList.map(item => (
                <div
                  key={item.schedule.id}
                  className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 space-y-2.5 text-xs shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded">
                        DUE SOON
                      </span>
                      <h4 className="font-bold text-white text-sm mt-1">
                        {item.schedule.serviceType}
                      </h4>
                      <p className="text-[11px] text-amber-300 font-semibold mt-0.5">
                        {item.reason}
                      </p>
                    </div>

                    <span className="text-xs font-bold text-white bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700">
                      {item.vehicle?.registrationNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2 bg-slate-900/80 rounded-xl text-[11px] border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Due At</span>
                      <span className="font-mono text-slate-200 font-bold">
                        {item.schedule.nextDueOdometerKm.toLocaleString()} km ({formatDate(item.schedule.nextDueDate)})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Remaining Distance</span>
                      <span className="font-mono text-amber-400 font-bold">
                        {item.kmRemaining} km remaining
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      Est. Cost: <strong className="text-slate-200">{formatCurrency(item.schedule.estimatedCost || 0)}</strong>
                    </span>
                    <button
                      onClick={() => {
                        setSelectedScheduleForLog(item.schedule);
                        setShowLogModal(true);
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Log Service Done</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Healthy / Up-to-date Services */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider px-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Up To Date Schedules ({goodList.length})</span>
            </div>

            {goodList.length === 0 && overdueList.length === 0 && dueSoonList.length === 0 ? (
              <div className="text-center py-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400">
                No service schedules registered. Click below to add periodic service reminders.
              </div>
            ) : (
              <div className="space-y-2">
                {goodList.map(item => (
                  <div
                    key={item.schedule.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-slate-100">{item.schedule.serviceType}</h4>
                        <p className="text-[11px] text-emerald-400 mt-0.5 font-medium">
                          Next due in {item.kmRemaining.toLocaleString()} km ({formatDate(item.schedule.nextDueDate)})
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {item.vehicle?.registrationNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                      <span>Interval: Every {item.schedule.intervalKm.toLocaleString()} km / {item.schedule.intervalMonths} mo</span>
                      <button
                        onClick={() => {
                          setSelectedScheduleForLog(item.schedule);
                          setShowLogModal(true);
                        }}
                        className="text-purple-400 hover:text-purple-300 font-semibold"
                      >
                        Log early service →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Service Schedules Configuration */}
      {activeSubTab === 'schedules' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-slate-400 font-semibold">Configured Maintenance Triggers</span>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Trigger Schedule</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {filteredSchedules.map(schedule => {
              const veh = getVehicle(schedule.vehicleId);

              return (
                <div
                  key={schedule.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-xs space-y-2.5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white text-sm">{schedule.serviceType}</span>
                        <span className="text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20">
                          {veh?.registrationNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{schedule.description}</p>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingSchedule(schedule);
                            setShowScheduleModal(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-[10px]"
                          title="Admin: Edit service schedule"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Admin: Are you sure you want to delete service schedule for "${schedule.serviceType}"?`)) {
                              deleteServiceSchedule(schedule.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-[10px]"
                          title="Admin: Delete service schedule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-slate-950/60 rounded-xl text-[11px] border border-slate-800/80">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Repeat Every</span>
                      <span className="font-bold text-slate-200">{schedule.intervalKm.toLocaleString()} km / {schedule.intervalMonths} mo</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Last Done Odo</span>
                      <span className="font-mono text-slate-200">{schedule.lastServiceOdometerKm.toLocaleString()} km</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Next Due Odo</span>
                      <span className="font-mono font-bold text-purple-400">{schedule.nextDueOdometerKm.toLocaleString()} km</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Next Due Date</span>
                      <span className="text-slate-200 font-medium">{formatDate(schedule.nextDueDate)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Maintenance History Ledger */}
      {activeSubTab === 'history' && (
        <div className="space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Completed Jobs</span>
              <p className="text-sm font-bold text-white">{filteredLogs.length} Records</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Service Spent</span>
              <p className="text-sm font-extrabold text-purple-400">{formatCurrency(totalMaintenanceCost)}</p>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-xs text-slate-400">
              No completed maintenance records logged yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredLogs.map(log => {
                const veh = getVehicle(log.vehicleId);

                return (
                  <div
                    key={log.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-xs space-y-2.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white text-sm">{log.serviceType}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                            {veh?.registrationNumber}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Completed on {formatDate(log.completedDate)} @ <span className="font-mono text-slate-200">{log.odometerKm.toLocaleString()} km</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-purple-400">
                          {formatCurrency(log.cost)}
                        </span>
                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingLog(log);
                                setShowLogModal(true);
                              }}
                              className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors flex items-center gap-1 text-[10px]"
                              title="Admin: Edit maintenance log"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Admin: Are you sure you want to delete maintenance log for "${log.serviceType}" (${formatCurrency(log.cost)})?`)) {
                                  deleteMaintenanceLog(log.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors flex items-center gap-1 text-[10px]"
                              title="Admin: Delete maintenance log"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-850 rounded-xl border border-slate-800 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Service Station: </span>
                        <span className="font-semibold text-slate-200">{log.performedBy}</span>
                      </div>

                      {log.invoiceNumber && (
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">Invoice Ref: </span>
                          <span className="font-mono text-slate-200">{log.invoiceNumber}</span>
                        </div>
                      )}

                      {log.partsReplaced && (
                        <div className="text-slate-300 pt-1 border-t border-slate-800">
                          <span className="text-slate-400 text-[10px]">Replaced Parts: </span>
                          <p className="text-slate-200">{log.partsReplaced}</p>
                        </div>
                      )}

                      {log.notes && (
                        <p className="text-slate-400 italic text-[10px] pt-1">
                          "{log.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showLogModal && (
        <LogServiceModal
          isOpen={showLogModal}
          onClose={() => {
            setShowLogModal(false);
            setSelectedScheduleForLog(null);
            setEditingLog(null);
          }}
          targetSchedule={selectedScheduleForLog}
          logToEdit={editingLog}
        />
      )}

      {showScheduleModal && (
        <NewScheduleModal
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setEditingSchedule(null);
          }}
          scheduleToEdit={editingSchedule}
        />
      )}
    </div>
  );
};
