import React, { useState, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  CheckCircle2,
  Bell,
  Building,
  User,
  DollarSign,
  TrendingUp,
  Sliders,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';
import { ProjectBudgetAlert, BudgetThresholdLevel } from '../../types/pettyCashTypes';

interface BudgetAlertsNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject?: (projectCode: string) => void;
}

export const BudgetAlertsNotificationModal: React.FC<BudgetAlertsNotificationModalProps> = ({
  isOpen,
  onClose,
  onSelectProject
}) => {
  const {
    budgetAlerts,
    projectBudgetSummaries,
    supervisors,
    currentSupervisorName,
    userRole,
    acknowledgedAlertIds,
    acknowledgeBudgetAlert,
    unacknowledgeBudgetAlert,
    clearAllBudgetAlerts,
    updateProjectBudget,
    setFilters
  } = usePettyCash();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'WARNING_80' | 'CRITICAL_95' | 'OVER_BUDGET' | 'MY_PROJECTS'>('ALL');
  const [selectedSupervisorFilter, setSelectedSupervisorFilter] = useState<string>('ALL');
  const [editingBudgetProjectId, setEditingBudgetProjectId] = useState<string | null>(null);
  const [newBudgetValue, setNewBudgetValue] = useState<string>('');

  const formatLKR = (amount: number): string => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount).replace('LKR', 'LKR ');
  };

  // Count summaries
  const totalAlerts = budgetAlerts.length;
  const count80 = budgetAlerts.filter(a => a.thresholdLevel === 'WARNING_80').length;
  const count95 = budgetAlerts.filter(a => a.thresholdLevel === 'CRITICAL_95').length;
  const countExceeded = budgetAlerts.filter(a => a.thresholdLevel === 'OVER_BUDGET').length;
  const unacknowledgedCount = budgetAlerts.filter(a => !a.acknowledged).length;

  // Filtered Alerts
  const filteredAlerts = useMemo(() => {
    return budgetAlerts.filter(alert => {
      // Threshold level filter
      if (activeFilter === 'WARNING_80' && alert.thresholdLevel !== 'WARNING_80') return false;
      if (activeFilter === 'CRITICAL_95' && alert.thresholdLevel !== 'CRITICAL_95') return false;
      if (activeFilter === 'OVER_BUDGET' && alert.thresholdLevel !== 'OVER_BUDGET') return false;
      if (activeFilter === 'MY_PROJECTS') {
        const isMyProject = alert.assignedSupervisors.some(
          s => s.trim().toUpperCase() === currentSupervisorName.trim().toUpperCase()
        );
        if (!isMyProject) return false;
      }

      // Supervisor dropdown filter
      if (selectedSupervisorFilter !== 'ALL') {
        const hasSupervisor = alert.assignedSupervisors.some(
          s => s.trim().toUpperCase() === selectedSupervisorFilter.trim().toUpperCase()
        );
        if (!hasSupervisor) return false;
      }

      return true;
    });
  }, [budgetAlerts, activeFilter, selectedSupervisorFilter, currentSupervisorName]);

  const handleSaveBudget = (projectId: string, projectCode: string) => {
    const val = parseFloat(newBudgetValue.replace(/,/g, ''));
    if (!isNaN(val) && val >= 0) {
      updateProjectBudget(projectCode, val);
      setEditingBudgetProjectId(null);
      setNewBudgetValue('');
    }
  };

  const handleNavigateToProjectExpenses = (projectCode: string) => {
    setFilters(prev => ({
      ...prev,
      project: projectCode
    }));
    if (onSelectProject) {
      onSelectProject(projectCode);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-100 tracking-tight">
                  Budget Threshold Alerts & Supervisor Notifications
                </h3>
                {unacknowledgedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white shadow-sm">
                    {unacknowledgedCount} New
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated supervisor notification triggers when project petty cash expenditure reaches 80% (Warning) and 95% (Critical) of allocated budget.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/40 border-b border-slate-800/80 shrink-0">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeFilter === 'ALL'
                ? 'bg-slate-800/90 border-slate-600 shadow-md ring-1 ring-slate-500'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Total Active Alerts</span>
              <Bell className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <div className="text-xl font-black text-slate-100 font-mono">{totalAlerts}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{unacknowledgedCount} unacknowledged</div>
          </button>

          <button
            onClick={() => setActiveFilter('WARNING_80')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeFilter === 'WARNING_80'
                ? 'bg-amber-950/40 border-amber-600/80 shadow-md ring-1 ring-amber-500'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
              <span>80% Warning Limit</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-300 font-mono">{count80}</div>
            <div className="text-[10px] text-amber-400/80 mt-0.5">80% – 94.9% Consumed</div>
          </button>

          <button
            onClick={() => setActiveFilter('CRITICAL_95')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeFilter === 'CRITICAL_95'
                ? 'bg-orange-950/40 border-orange-600/80 shadow-md ring-1 ring-orange-500'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-orange-400 mb-1">
              <span>95% Critical Alert</span>
              <AlertOctagon className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="text-xl font-black text-orange-300 font-mono">{count95}</div>
            <div className="text-[10px] text-orange-400/80 mt-0.5">95% – 99.9% Consumed</div>
          </button>

          <button
            onClick={() => setActiveFilter('OVER_BUDGET')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeFilter === 'OVER_BUDGET'
                ? 'bg-rose-950/40 border-rose-600/80 shadow-md ring-1 ring-rose-500'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
              <span>Budget Exceeded</span>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl font-black text-rose-300 font-mono">{countExceeded}</div>
            <div className="text-[10px] text-rose-400/80 mt-0.5">≥ 100% Consumed</div>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Supervisor Filter:</span>
            <select
              value={selectedSupervisorFilter}
              onChange={(e) => setSelectedSupervisorFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Supervisors</option>
              {supervisors.map(s => (
                <option key={s.id} value={s.SUPERVISOR_NAME}>
                  {s.SUPERVISOR_NAME} ({s.ASSIGNED_PROJECTS?.length || 0} projects)
                </option>
              ))}
            </select>

            {userRole === 'SUPERVISOR' && (
              <button
                onClick={() => setActiveFilter(activeFilter === 'MY_PROJECTS' ? 'ALL' : 'MY_PROJECTS')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  activeFilter === 'MY_PROJECTS'
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Assigned to Me ({currentSupervisorName})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unacknowledgedCount > 0 && (
              <button
                onClick={clearAllBudgetAlerts}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Acknowledge All</span>
              </button>
            )}
          </div>
        </div>

        {/* Alerts List */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-200">All Project Budgets Healthy!</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                No active project petty cash budget threshold warnings or critical limits detected for the selected filter.
              </p>
            </div>
          ) : (
            filteredAlerts.map(alert => {
              const is80 = alert.thresholdLevel === 'WARNING_80';
              const is95 = alert.thresholdLevel === 'CRITICAL_95';
              const isExceeded = alert.thresholdLevel === 'OVER_BUDGET';

              const badgeColor = isExceeded
                ? 'bg-rose-950 text-rose-300 border-rose-800'
                : is95
                ? 'bg-orange-950 text-orange-300 border-orange-800'
                : 'bg-amber-950 text-amber-300 border-amber-800';

              const progressColor = isExceeded
                ? 'bg-rose-500'
                : is95
                ? 'bg-orange-500'
                : 'bg-amber-400';

              const isAssignedToCurrentSupervisor = alert.assignedSupervisors.some(
                s => s.trim().toUpperCase() === currentSupervisorName.trim().toUpperCase()
              );

              return (
                <div
                  key={alert.id}
                  className={`rounded-2xl border transition-all ${
                    alert.acknowledged
                      ? 'bg-slate-900/60 border-slate-800 opacity-80'
                      : isExceeded
                      ? 'bg-slate-900/90 border-rose-800/70 shadow-lg shadow-rose-950/20 ring-1 ring-rose-500/20'
                      : is95
                      ? 'bg-slate-900/90 border-orange-800/70 shadow-lg shadow-orange-950/20 ring-1 ring-orange-500/20'
                      : 'bg-slate-900/90 border-amber-800/70 shadow-lg shadow-amber-950/20 ring-1 ring-amber-500/20'
                  }`}
                >
                  <div className="p-4 sm:p-5">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${badgeColor}`}>
                            {isExceeded ? (
                              <ShieldAlert className="w-3.5 h-3.5" />
                            ) : is95 ? (
                              <AlertOctagon className="w-3.5 h-3.5" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {isExceeded
                                ? '⛔ BUDGET EXCEEDED'
                                : is95
                                ? '🚨 95% CRITICAL BUDGET ALERT'
                                : '⚠️ 80% BUDGET THRESHOLD WARNING'}
                            </span>
                          </span>

                          <span className="font-mono text-sm font-black text-slate-100 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-lg">
                            {alert.projectCode}
                          </span>

                          {isAssignedToCurrentSupervisor && (
                            <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-md">
                              Your Assigned Project
                            </span>
                          )}

                          {alert.acknowledged && (
                            <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Acknowledged
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-slate-100 mt-1.5">
                          {alert.projectName}
                        </h4>
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center gap-2">
                        {alert.acknowledged ? (
                          <button
                            onClick={() => unacknowledgeBudgetAlert(alert.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                          >
                            Mark Unread
                          </button>
                        ) : (
                          <button
                            onClick={() => acknowledgeBudgetAlert(alert.id, currentSupervisorName)}
                            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-700/60 text-xs font-bold flex items-center gap-1 transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Acknowledge</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleNavigateToProjectExpenses(alert.projectCode)}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <span>Expenses</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-400">Budget Utilization:</span>
                        <span className="font-mono font-bold text-slate-100">
                          {alert.utilizationPercentage.toFixed(1)}% of {formatLKR(alert.allocatedBudget)}
                        </span>
                      </div>
                      <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        {/* 80% marker */}
                        <div className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-amber-400/50 z-10" />
                        {/* 95% marker */}
                        <div className="absolute top-0 bottom-0 left-[95%] w-0.5 bg-orange-400/50 z-10" />
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${progressColor}`}
                          style={{ width: `${Math.min(100, alert.utilizationPercentage)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>0%</span>
                        <span className="text-amber-400 font-medium">80% Warning</span>
                        <span className="text-orange-400 font-medium">95% Critical</span>
                        <span className="text-rose-400 font-medium">100% Exceeded</span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-3">
                      <div>
                        <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Allocated Budget</span>
                        <span className="font-mono text-xs font-bold text-slate-100">{formatLKR(alert.allocatedBudget)}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Approved Spent</span>
                        <span className="font-mono text-xs font-bold text-emerald-400">{formatLKR(alert.spentAmount)}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pending Review</span>
                        <span className="font-mono text-xs font-bold text-amber-400">{formatLKR(alert.pendingAmount)}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Remaining Buffer</span>
                        <span className={`font-mono text-xs font-bold ${alert.remainingBudget <= 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                          {formatLKR(alert.remainingBudget)}
                        </span>
                      </div>
                    </div>

                    {/* Notified Supervisors */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Notified Supervisors:</span>
                        <div className="flex flex-wrap gap-1">
                          {alert.assignedSupervisors.length > 0 ? (
                            alert.assignedSupervisors.map(sup => (
                              <span
                                key={sup}
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  sup.trim().toUpperCase() === currentSupervisorName.trim().toUpperCase()
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {sup}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 italic">All field supervisors</span>
                          )}
                        </div>
                      </div>

                      {(userRole === 'ADMIN' || userRole === 'FINANCE') && (
                        <div>
                          {editingBudgetProjectId === alert.projectId ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                placeholder="New Budget LKR"
                                value={newBudgetValue}
                                onChange={(e) => setNewBudgetValue(e.target.value)}
                                className="w-28 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono"
                              />
                              <button
                                onClick={() => handleSaveBudget(alert.projectId, alert.projectCode)}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingBudgetProjectId(null)}
                                className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingBudgetProjectId(alert.projectId);
                                setNewBudgetValue(alert.allocatedBudget.toString());
                              }}
                              className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline font-semibold"
                            >
                              Adjust Budget Allocation
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/80 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400" />
            <span>Thresholds: Warning (80%), Critical (95%), Overbudget (100%). Synchronized live across all petty cash transactions.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            Close Alert Center
          </button>
        </div>

      </div>
    </div>
  );
};
