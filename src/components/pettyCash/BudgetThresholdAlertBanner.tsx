import React from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  Bell,
  ChevronRight,
  User,
  CheckCircle2,
  X
} from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';

interface BudgetThresholdAlertBannerProps {
  onOpenAlertsModal: () => void;
  onSelectProject?: (projectCode: string) => void;
}

export const BudgetThresholdAlertBanner: React.FC<BudgetThresholdAlertBannerProps> = ({
  onOpenAlertsModal,
  onSelectProject
}) => {
  const {
    budgetAlerts,
    currentSupervisorName,
    userRole,
    acknowledgedAlertIds,
    acknowledgeBudgetAlert
  } = usePettyCash();

  // If no alerts at all, return null
  if (budgetAlerts.length === 0) return null;

  // Unacknowledged alerts
  const unacknowledged = budgetAlerts.filter(a => !a.acknowledged);
  const myAlerts = budgetAlerts.filter(a =>
    a.assignedSupervisors.some(s => s.trim().toUpperCase() === currentSupervisorName.trim().toUpperCase())
  );
  const myUnacknowledged = myAlerts.filter(a => !a.acknowledged);

  // Determine top critical alert to feature
  const critical95 = budgetAlerts.filter(a => a.thresholdLevel === 'CRITICAL_95');
  const overBudget = budgetAlerts.filter(a => a.thresholdLevel === 'OVER_BUDGET');
  const warnings80 = budgetAlerts.filter(a => a.thresholdLevel === 'WARNING_80');

  const hasCritical = overBudget.length > 0 || critical95.length > 0;

  const bannerBg = hasCritical
    ? 'bg-gradient-to-r from-orange-950/80 via-slate-900 to-rose-950/80 border-orange-700/60 shadow-orange-950/30'
    : 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border-amber-700/60 shadow-amber-950/30';

  const iconColor = hasCritical ? 'text-orange-400 bg-orange-500/20 border-orange-500/30' : 'text-amber-400 bg-amber-500/20 border-amber-500/30';

  return (
    <div className={`border rounded-2xl p-3.5 sm:p-4 shadow-lg backdrop-blur-sm transition-all ${bannerBg}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 mt-0.5 ${iconColor}`}>
            {hasCritical ? (
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                <span>Petty Cash Budget Threshold Alerts</span>
                {unacknowledged.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                    {unacknowledged.length} Action Required
                  </span>
                )}
              </span>

              {userRole === 'SUPERVISOR' && myAlerts.length > 0 && (
                <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{myAlerts.length} Affecting Supervisor {currentSupervisorName}</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {hasCritical ? (
                <>
                  <strong className="text-orange-300 font-bold">
                    {critical95.length + overBudget.length} Project(s) in Critical / Exceeded State
                  </strong>
                  {' '}({critical95.map(a => `${a.projectCode} @ ${a.utilizationPercentage.toFixed(0)}%`).join(', ')})
                  {warnings80.length > 0 && ` + ${warnings80.length} at 80% warning limit.`}
                </>
              ) : (
                <>
                  <strong className="text-amber-300 font-bold">
                    {warnings80.length} Project(s) Reached 80% Budget Threshold
                  </strong>
                  {' '}({warnings80.map(a => `${a.projectCode} @ ${a.utilizationPercentage.toFixed(0)}%`).join(', ')})
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenAlertsModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-slate-600 text-xs font-bold shadow-sm transition-all"
          >
            <span>View All {budgetAlerts.length} Alerts</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </button>
        </div>
      </div>
    </div>
  );
};
